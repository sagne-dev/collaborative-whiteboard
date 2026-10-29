/**
 * Collaborative Whiteboard & Watch Party Server
 * Supports:
 *  - Real-time drawing, cursors, undo/redo, board persistence
 *  - Synchronized Watch Party mode (video player sync: play, pause, seek, load)
 *  - Real-time room text chat
 */

const http      = require('http');
const https     = require('https');
const fs        = require('fs');
const path      = require('path');
const WebSocket = require('ws');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT        = process.env.PORT || 3000;

// Resolve paths relative to THIS file
const ROOT_DIR    = path.join(__dirname, '..');
const PUBLIC_DIR  = path.join(ROOT_DIR, 'public');
const PERSIST_DIR = path.join(ROOT_DIR, 'data');

if (!fs.existsSync(PERSIST_DIR)) fs.mkdirSync(PERSIST_DIR, { recursive: true });

// ─── Default Sample Video ─────────────────────────────────────────────────────
const DEFAULT_VIDEO = {
  url         : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  title       : 'Big Buck Bunny (MP4)',
  isPlaying   : false,
  currentTime : 0,
  lastUpdate  : Date.now(),
  updatedBy   : 'System',
};

// ─── In-memory state ──────────────────────────────────────────────────────────
const rooms = new Map();

function calculateCurrentTime(video) {
  if (!video) return 0;
  if (!video.isPlaying) return video.currentTime || 0;
  const elapsed = (Date.now() - (video.lastUpdate || Date.now())) / 1000;
  return Math.max(0, (video.currentTime || 0) + elapsed);
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    const persisted = loadRoom(roomId);
    rooms.set(roomId, {
      strokes : new Map(persisted.strokes.map(s => [s.id, s])),
      deleted : new Set(persisted.deleted),
      users   : new Map(),
      video   : persisted.video || { ...DEFAULT_VIDEO, lastUpdate: Date.now() },
      chat    : Array.isArray(persisted.chat) ? persisted.chat : [],
    });
  }
  return rooms.get(roomId);
}

// ─── Persistence ──────────────────────────────────────────────────────────────
function roomFile(roomId) {
  return path.join(PERSIST_DIR, roomId.replace(/[^a-z0-9_-]/gi, '_') + '.json');
}

function loadRoom(roomId) {
  try {
    const raw = fs.readFileSync(roomFile(roomId), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      strokes : parsed.strokes || [],
      deleted : parsed.deleted || [],
      video   : parsed.video || null,
      chat    : parsed.chat || [],
    };
  } catch {
    return { strokes: [], deleted: [], video: null, chat: [] };
  }
}

function saveRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = {
    strokes : [...room.strokes.values()],
    deleted : [...room.deleted],
    video   : room.video,
    chat    : room.chat.slice(-100),
  };
  fs.writeFileSync(roomFile(roomId), JSON.stringify(data), 'utf8');
}

const saveTimers = new Map();
function debounceSave(roomId, ms = 2000) {
  clearTimeout(saveTimers.get(roomId));
  saveTimers.set(roomId, setTimeout(() => saveRoom(roomId), ms));
}

// ─── Stream Resolver & Streaming Proxy ─────────────────────────────────────────
function fetchPageHtml(targetUrl, redirectCount = 0, timeoutMs = 5000) {
  if (redirectCount > 4) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(targetUrl); } catch (e) { return reject(e); }
    const client = parsed.protocol === 'http:' ? http : https;
    const req = client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: timeoutMs,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (!nextUrl.startsWith('http')) {
          nextUrl = new URL(nextUrl, targetUrl).href;
        }
        return fetchPageHtml(nextUrl, redirectCount + 1, timeoutMs).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 600000) { // Limit to 600KB
          req.destroy();
          resolve(data);
        }
      });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function resolveVideoStream(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') return resolve({ url, title: 'Video', engine: 'unknown' });
    const trimmed = url.trim();

    // 1. YouTube links (YouTube IFrame API handles them directly)
    if (/(?:youtube\.com|youtu\.be)/i.test(trimmed)) {
      return resolve({ url: trimmed, title: 'YouTube Video', engine: 'youtube' });
    }

    // 2. Google Drive links
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (driveMatch) {
      const driveId = driveMatch[1];
      const streamUrl = `/api/stream?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${driveId}`)}`;
      return resolve({ url: streamUrl, embedUrl: `https://drive.google.com/file/d/${driveId}/preview`, title: 'Google Drive Video', engine: 'drive' });
    }

    // 3. Direct video files (.mp4, .webm, .ogg, .mov, etc.)
    if (/\.(mp4|webm|ogg|ogv|mov|m4v|mkv)($|\?)/i.test(trimmed)) {
      const filename = trimmed.split('/').pop().split('?')[0] || 'Video';
      return resolve({ url: trimmed, title: filename, engine: 'html5' });
    }

    // 4. XVideos / XNXX stream extractor (extracts high/low MP4 stream for native synchronized playback)
    const xvMatch = trimmed.match(/(?:xvideos|xnxx)[^\/]*\/(?:video[._-]?|embedframe\/)([a-zA-Z0-9_]+)/i);
    if (/xvideos|xnxx/i.test(trimmed)) {
      let targetFetch = trimmed;
      if (xvMatch) {
        const host = /xnxx/i.test(trimmed) ? 'www.xnxx.com' : 'www.xvideos.com';
        targetFetch = `https://${host}/embedframe/${xvMatch[1]}`;
      }

      fetchPageHtml(targetFetch, 0, 8000).then(html => {
        let streamUrl = null;
        let title = 'Video';

        const titleMatch = html.match(/setVideoTitle\s*\(\s*['"]([^'"]+)['"]\s*\)/i) ||
                           html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].replace(/ - (?:XVIDEOS|XNXX)\.COM/i, '').trim();

        const high = html.match(/setVideoUrlHigh\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
        const low  = html.match(/setVideoUrlLow\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
        const hls  = html.match(/setVideoHLS\s*\(\s*['"]([^'"]+)['"]\s*\)/i);

        if (high && high[1]) streamUrl = high[1];
        else if (low && low[1]) streamUrl = low[1];
        else if (hls && hls[1]) streamUrl = hls[1];

        if (streamUrl) {
          const proxyUrl = `/api/stream?url=${encodeURIComponent(streamUrl)}`;
          return resolve({ url: proxyUrl, directUrl: streamUrl, title, engine: 'html5' });
        }
        return resolve({ url: targetFetch, title, engine: 'embed' });
      }).catch((err) => {
        console.warn('XVideos fetch error, fallback to embed:', err.message);
        const host = /xnxx/i.test(trimmed) ? 'www.xnxx.com' : 'www.xvideos.com';
        const embedUrl = xvMatch ? `https://${host}/embedframe/${xvMatch[1]}` : trimmed;
        return resolve({ url: embedUrl, title: 'Video', engine: 'embed' });
      });
      return;
    }

    // 5. Pornhub stream extractor
    if (/pornhub/i.test(trimmed)) {
      fetchPageHtml(trimmed, 0, 5000).then(html => {
        let title = 'Pornhub Video';
        const titleMatch = html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                           html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].replace(/ - Pornhub\.com/i, '').trim();

        const mediaMatch = html.match(/"videoUrl"\s*:\s*"([^"]+)"/i) ||
                           html.match(/quality_720p\s*=\s*['"]([^'"]+)['"]/i) ||
                           html.match(/quality_480p\s*=\s*['"]([^'"]+)['"]/i);
        if (mediaMatch && mediaMatch[1]) {
          const direct = mediaMatch[1].replace(/\\/g, '');
          const proxyUrl = `/api/stream?url=${encodeURIComponent(direct)}`;
          return resolve({ url: proxyUrl, directUrl: direct, title, engine: 'html5' });
        }
        return resolve({ url: trimmed, title, engine: 'embed' });
      }).catch(() => {
        return resolve({ url: trimmed, title: 'Pornhub Video', engine: 'embed' });
      });
      return;
    }

    // Fallback: direct embed
    return resolve({ url: trimmed, title: trimmed.split('/').pop().split('?')[0] || 'Video', engine: 'embed' });
  });
}

// ─── HTTP server (serves static files & video stream proxy) ────────────────────
const MIME = {
  '.html': 'text/html',
  '.js'  : 'application/javascript',
  '.css' : 'text/css',
  '.ico' : 'image/x-icon',
  '.svg' : 'image/svg+xml',
  '.json': 'application/json',
  '.mp4' : 'video/mp4',
};

console.log(`📁 Serving static files from: ${PUBLIC_DIR}`);

const httpServer = http.createServer((req, res) => {
  // Video Streaming Proxy route (supports Range byte headers & CORS for synchronized playback)
  if (req.url.startsWith('/api/stream?')) {
    let parsedUrl;
    try {
      parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    } catch (e) {
      res.writeHead(400); return res.end('Invalid URL');
    }
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400); return res.end('Missing url parameter');
    }

    let parsedTarget;
    try { parsedTarget = new URL(targetUrl); } catch (e) {
      res.writeHead(400); return res.end('Invalid target URL');
    }
    const client = parsedTarget.protocol === 'http:' ? http : https;

    const proxyHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
    };
    if (req.headers.range) {
      proxyHeaders['Range'] = req.headers.range;
    }
    if (/xvideos|xnxx/i.test(targetUrl)) {
      proxyHeaders['Referer'] = 'https://www.xvideos.com/';
    } else if (/pornhub/i.test(targetUrl)) {
      proxyHeaders['Referer'] = 'https://www.pornhub.com/';
    }

    const proxyReq = client.get(targetUrl, { headers: proxyHeaders }, (proxyRes) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        let redirectTarget = proxyRes.headers.location;
        if (!redirectTarget.startsWith('http')) {
          redirectTarget = new URL(redirectTarget, targetUrl).href;
        }
        res.writeHead(302, { 'Location': `/api/stream?url=${encodeURIComponent(redirectTarget)}` });
        return res.end();
      }

      const outHeaders = { ...proxyRes.headers };
      outHeaders['access-control-allow-origin'] = '*';
      outHeaders['access-control-allow-headers'] = '*';
      outHeaders['access-control-expose-headers'] = 'Content-Range, Content-Length, Accept-Ranges';
      res.writeHead(proxyRes.statusCode, outHeaders);
      proxyRes.pipe(res);
    });

    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.on('error', (err) => {
      console.warn('Proxy streaming error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502); res.end('Streaming error');
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });
    return;
  }

  // Strip query strings from URL
  const urlPath  = req.url.split('?')[0];
  const filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal attacks
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`❌ 404 – file not found: ${filePath}`);
      res.writeHead(404); res.end('Not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

// ─── WebSocket server ─────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server: httpServer });

function broadcast(room, message, excludeWs = null) {
  const raw = JSON.stringify(message);
  for (const [, user] of room.users) {
    if (user.ws !== excludeWs && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(raw);
    }
  }
}

function addSystemChatMessage(room, text) {
  if (!room) return;
  const chatItem = {
    id       : generateId(),
    userId   : 'system',
    name     : 'System',
    color    : '#7a7a9a',
    text     : text,
    ts       : Date.now(),
    isSystem : true,
  };
  room.chat.push(chatItem);
  if (room.chat.length > 100) room.chat.shift();
  broadcast(room, { type: 'chat_message', message: chatItem });
}

wss.on('connection', (ws) => {
  let userId = null;
  let roomId = null;
  let room   = null;

  function send(obj) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  function leave() {
    if (!room || !userId) return;
    const leavingUser = room.users.get(userId);
    const userName = leavingUser ? leavingUser.name : userId;
    room.users.delete(userId);
    broadcast(room, { type: 'user_left', userId, name: userName });
    addSystemChatMessage(room, `🚪 ${userName} left the room`);
    saveRoom(roomId);
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'join': {
        if (room) leave();
        userId = msg.userId || generateId();
        roomId = msg.roomId || 'default';
        room   = getRoom(roomId);
        const color = msg.color || randomColor();
        const userName = msg.name || userId.slice(0, 6);
        room.users.set(userId, { ws, color, name: userName });

        send({
          type    : 'init',
          userId,
          color,
          name    : userName,
          roomId,
          strokes : [...room.strokes.values()],
          deleted : [...room.deleted],
          users   : [...room.users.entries()].map(([id, u]) => ({
            id, color: u.color, name: u.name,
          })),
          video   : room.video ? {
            url         : room.video.url,
            originalUrl : room.video.originalUrl,
            title       : room.video.title,
            engine      : room.video.engine,
            isPlaying   : room.video.isPlaying,
            currentTime : calculateCurrentTime(room.video),
            updatedBy   : room.video.updatedBy,
          } : null,
          chat    : room.chat.slice(-50),
        });

        broadcast(room, {
          type  : 'user_joined',
          userId,
          color,
          name  : userName,
        }, ws);

        addSystemChatMessage(room, `👋 ${userName} joined the room`);
        console.log(`[join] user=${userId} (${userName}) room=${roomId} (${room.users.size} connected)`);
        break;
      }

      // ── Whiteboard drawing actions ──
      case 'stroke': {
        if (!room) return;
        const stroke = {
          id     : msg.id || generateId(),
          userId,
          color  : msg.color,
          width  : msg.width,
          points : msg.points,
          ts     : Date.now(),
        };
        room.strokes.set(stroke.id, stroke);
        debounceSave(roomId);
        broadcast(room, { type: 'stroke', stroke });
        break;
      }

      case 'cursor': {
        if (!room) return;
        broadcast(room, {
          type   : 'cursor',
          userId,
          x      : msg.x,
          y      : msg.y,
          color  : room.users.get(userId)?.color,
        }, ws);
        break;
      }

      case 'undo': {
        if (!room) return;
        const candidates = [...room.strokes.values()]
          .filter(s => s.userId === userId && !room.deleted.has(s.id))
          .sort((a, b) => b.ts - a.ts);
        if (candidates.length === 0) return;
        const target = candidates[0];
        room.deleted.add(target.id);
        debounceSave(roomId);
        broadcast(room, { type: 'delete_stroke', strokeId: target.id });
        break;
      }

      case 'redo': {
        if (!room) return;
        const candidates = [...room.strokes.values()]
          .filter(s => s.userId === userId && room.deleted.has(s.id))
          .sort((a, b) => b.ts - a.ts);
        if (candidates.length === 0) return;
        const target = candidates[0];
        room.deleted.delete(target.id);
        debounceSave(roomId);
        broadcast(room, { type: 'restore_stroke', stroke: target });
        break;
      }

      case 'clear_all': {
        if (!room) return;
        for (const [id] of room.strokes) room.deleted.add(id);
        debounceSave(roomId);
        broadcast(room, { type: 'clear_all' });
        break;
      }

      // ── Watch Party Video Sync actions ──
      case 'video_load': {
        if (!room) return;
        const userName = room.users.get(userId)?.name || userId.slice(0, 6);
        const url = (msg.url || '').trim();
        if (!url) return;

        resolveVideoStream(url).then(resolved => {
          const finalTitle = msg.title || resolved.title || 'Video';
          room.video = {
            url         : resolved.url,
            originalUrl : url,
            title       : finalTitle,
            engine      : resolved.engine,
            isPlaying   : false,
            currentTime : 0,
            lastUpdate  : Date.now(),
            updatedBy   : userName,
          };
          debounceSave(roomId);
          broadcast(room, {
            type        : 'video_load',
            url         : room.video.url,
            originalUrl : url,
            title       : finalTitle,
            engine      : resolved.engine,
            currentTime : 0,
            isPlaying   : false,
            updatedBy   : userName,
          });
          addSystemChatMessage(room, `🎬 ${userName} loaded video: ${finalTitle}`);
        }).catch(err => {
          console.warn('Video stream resolution error:', err.message);
          const fallbackTitle = msg.title || 'Video';
          room.video = {
            url,
            originalUrl : url,
            title       : fallbackTitle,
            engine      : 'embed',
            isPlaying   : false,
            currentTime : 0,
            lastUpdate  : Date.now(),
            updatedBy   : userName,
          };
          debounceSave(roomId);
          broadcast(room, {
            type        : 'video_load',
            url,
            originalUrl : url,
            title       : fallbackTitle,
            engine      : 'embed',
            currentTime : 0,
            isPlaying   : false,
            updatedBy   : userName,
          });
          addSystemChatMessage(room, `🎬 ${userName} loaded video: ${fallbackTitle}`);
        });
        break;
      }

      case 'video_play': {
        if (!room) return;
        if (!room.video) room.video = { ...DEFAULT_VIDEO };
        const userName = room.users.get(userId)?.name || userId.slice(0, 6);
        const time = typeof msg.currentTime === 'number' ? Math.max(0, msg.currentTime) : room.video.currentTime;
        room.video.isPlaying   = true;
        room.video.currentTime = time;
        room.video.lastUpdate  = Date.now();
        room.video.updatedBy   = userName;
        debounceSave(roomId);
        broadcast(room, {
          type        : 'video_play',
          currentTime : time,
          userId,
          userName,
        }, ws);
        break;
      }

      case 'video_pause': {
        if (!room) return;
        if (!room.video) room.video = { ...DEFAULT_VIDEO };
        const userName = room.users.get(userId)?.name || userId.slice(0, 6);
        const time = typeof msg.currentTime === 'number' ? Math.max(0, msg.currentTime) : room.video.currentTime;
        room.video.isPlaying   = false;
        room.video.currentTime = time;
        room.video.lastUpdate  = Date.now();
        room.video.updatedBy   = userName;
        debounceSave(roomId);
        broadcast(room, {
          type        : 'video_pause',
          currentTime : time,
          userId,
          userName,
        }, ws);
        break;
      }

      case 'video_seek': {
        if (!room) return;
        if (!room.video) room.video = { ...DEFAULT_VIDEO };
        const userName = room.users.get(userId)?.name || userId.slice(0, 6);
        const time = typeof msg.currentTime === 'number' ? Math.max(0, msg.currentTime) : 0;
        room.video.currentTime = time;
        room.video.lastUpdate  = Date.now();
        room.video.updatedBy   = userName;
        debounceSave(roomId);
        broadcast(room, {
          type        : 'video_seek',
          currentTime : time,
          isPlaying   : room.video.isPlaying,
          userId,
          userName,
        }, ws);
        break;
      }

      case 'video_sync_request': {
        if (!room || !room.video) return;
        send({
          type  : 'video_sync',
          video : {
            url         : room.video.url,
            originalUrl : room.video.originalUrl,
            title       : room.video.title,
            engine      : room.video.engine,
            isPlaying   : room.video.isPlaying,
            currentTime : calculateCurrentTime(room.video),
            updatedBy   : room.video.updatedBy,
          },
        });
        break;
      }

      // ── Text Chat actions ──
      case 'chat_message': {
        if (!room) return;
        const text = (msg.text || '').trim();
        if (!text) return;
        const user = room.users.get(userId);
        const chatItem = {
          id       : generateId(),
          userId,
          name     : user ? user.name : userId.slice(0, 6),
          color    : user ? user.color : '#4ECDC4',
          text     : text.slice(0, 500),
          ts       : Date.now(),
          isSystem : false,
        };
        room.chat.push(chatItem);
        if (room.chat.length > 100) room.chat.shift();
        debounceSave(roomId);
        broadcast(room, { type: 'chat_message', message: chatItem });
        break;
      }

      default:
        console.warn('Unknown message type:', msg.type);
    }
  });

  ws.on('close', leave);
  ws.on('error', (err) => { console.error('ws error', err); leave(); });
});

// ─── Utilities ────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function randomColor() {
  const colors = [
    '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
    '#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✅ Collaborative Whiteboard & Watch Party server running at http://localhost:${PORT}`);
  console.log(`   Open multiple browser windows to test real-time collaboration & sync.`);
});
