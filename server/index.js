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
const os        = require('os');
let selfsigned  = null;
try { selfsigned = require('selfsigned'); } catch (e) {}

const PORT        = parseInt(process.env.PORT || '3000', 10);
const HTTPS_PORT  = parseInt(process.env.HTTPS_PORT || '3443', 10);

// Resolve paths relative to THIS file
const ROOT_DIR    = path.join(__dirname, '..');
const PUBLIC_DIR  = path.join(ROOT_DIR, 'public');
const PERSIST_DIR = path.join(ROOT_DIR, 'data');

if (!fs.existsSync(PERSIST_DIR)) fs.mkdirSync(PERSIST_DIR, { recursive: true });

// Clean up any stale room history files from previous sessions on server startup
try {
  if (fs.existsSync(PERSIST_DIR)) {
    const files = fs.readdirSync(PERSIST_DIR);
    for (const f of files) {
      if (f.endsWith('.json')) {
        try { fs.unlinkSync(path.join(PERSIST_DIR, f)); } catch (e) {}
      }
    }
    console.log('🧹 Cleaned up stale room history files on startup.');
  }
} catch (e) {}

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
      video   : persisted.video || null,
      chat    : Array.isArray(persisted.chat) ? persisted.chat : [],
    });
  }
  return rooms.get(roomId);
}

// ─── Persistence & Room Cleanup ───────────────────────────────────────────────
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
  // If the room does not exist or has 0 users, do not persist to disk
  if (!room || room.users.size === 0) return;
  const data = {
    strokes : [...room.strokes.values()],
    deleted : [...room.deleted],
    video   : room.video,
    chat    : room.chat.slice(-100),
  };
  try {
    fs.writeFileSync(roomFile(roomId), JSON.stringify(data), 'utf8');
  } catch (err) {
    console.warn(`[save] Error saving room ${roomId}:`, err.message);
  }
}

const saveTimers = new Map();
function debounceSave(roomId, ms = 2000) {
  const room = rooms.get(roomId);
  if (!room || room.users.size === 0) return;
  clearTimeout(saveTimers.get(roomId));
  saveTimers.set(roomId, setTimeout(() => saveRoom(roomId), ms));
}

function clearRoomHistory(roomId) {
  if (!roomId) return;

  // 1. Cancel any pending debounce save timer
  if (saveTimers.has(roomId)) {
    clearTimeout(saveTimers.get(roomId));
    saveTimers.delete(roomId);
  }

  // 2. Delete persisted room file from disk
  const file = roomFile(roomId);
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`[room] Deleted persisted file for empty room: ${roomId}`);
    } catch (err) {
      console.warn(`[room] Could not delete file for room ${roomId}:`, err.message);
    }
  }

  // 3. Clear all in-memory state for this room
  const room = rooms.get(roomId);
  if (room) {
    room.strokes.clear();
    room.deleted.clear();
    room.chat = [];
    room.video = null;
    rooms.delete(roomId);
    console.log(`[room] Cleared all blackboard and chat history for empty room: ${roomId}`);
  }
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
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.mp4' : 'video/mp4',
};

console.log(`📁 Serving static files from: ${PUBLIC_DIR}`);

function getLanIps() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

async function getOrCreateSslCert() {
  if (!selfsigned) return null;
  const certPath = path.join(PERSIST_DIR, 'ssl-cert.json');
  try {
    if (fs.existsSync(certPath)) {
      const data = JSON.parse(fs.readFileSync(certPath, 'utf8'));
      if (data && data.key && data.cert) return data;
    }
  } catch (e) {}

  const lanIps = getLanIps();
  const attrs = [{ name: 'commonName', value: 'CollaborativeWhiteboard' }];
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
    ...lanIps.map(ip => ({ type: 7, ip })),
  ];

  try {
    const pems = await selfsigned.generate(attrs, {
      days: 365,
      algorithm: 'sha256',
      extensions: [{ name: 'subjectAltName', altNames }],
    });
    const certData = { key: pems.private, cert: pems.cert };
    try {
      fs.writeFileSync(certPath, JSON.stringify(certData, null, 2), 'utf8');
    } catch (e) {}
    return certData;
  } catch (err) {
    console.warn('⚠️ Could not generate self-signed cert:', err.message);
    return null;
  }
}

function handleHttpRequest(req, res) {
  // Enforce HTTPS when deployed on Render / Cloud proxies to ensure camera permissions are allowed
  if (req.headers['x-forwarded-proto'] === 'http') {
    res.writeHead(301, {
      Location: `https://${req.headers.host}${req.url}`,
    });
    return res.end();
  }

  // Server discovery & network diagnostics for mobile / PC clients
  if (req.url === '/api/server-info') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    return res.end(JSON.stringify({
      httpPort: PORT,
      httpsPort: HTTPS_PORT,
      lanIps: getLanIps(),
    }));
  }
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

  // ─── Daily.co Route 1 SFU Room Provisioning Endpoint ────────────────────────
  if (req.url.startsWith('/api/daily-room')) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const roomParam = (urlObj.searchParams.get('room') || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanRoomName = `collab-${roomParam.toLowerCase()}`.slice(0, 40);

    const apiKey = process.env.DAILY_API_KEY;
    const customDomain = process.env.DAILY_DOMAIN;

    if (apiKey) {
      // Call Daily REST API to create or get room
      const postData = JSON.stringify({
        name: cleanRoomName,
        properties: {
          enable_screenshare: true,
          enable_chat: false,
          exp: Math.floor(Date.now() / 1000) + 7200,
        }
      });
      const dReq = https.request({
        hostname: 'api.daily.co',
        port: 443,
        path: '/v1/rooms',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData),
        }
      }, (dRes) => {
        let body = '';
        dRes.on('data', chunk => body += chunk);
        dRes.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const roomUrl = parsed.url || `https://${customDomain || 'collabspace'}.daily.co/${cleanRoomName}`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ roomUrl, configured: true, domain: customDomain }));
          } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ roomUrl: `https://${customDomain || 'collabspace'}.daily.co/${cleanRoomName}`, configured: false }));
          }
        });
      });
      dReq.on('error', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ roomUrl: `https://${customDomain || 'collabspace'}.daily.co/${cleanRoomName}`, configured: false }));
      });
      dReq.write(postData);
      dReq.end();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      roomUrl: null,
      configured: false,
      domain: customDomain || null,
      message: 'Daily API key not configured. Using native high-performance WebRTC mesh calling.'
    }));
    return;
  }

  // Strip query strings from URL
  const urlPath  = req.url.split('?')[0];
  const filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal attacks
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      console.error(`❌ 404 – file not found: ${filePath}`);
      res.writeHead(404); res.end('Not found'); return;
    }

    const fileSize = stats.size;
    const range = req.headers.range;

    // Support HTTP 206 Partial Content (critical for seamless, gapless MP4 streaming and looping across Chrome, Safari & iOS)
    if (range && ext === '.mp4') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
          'Accept-Ranges': 'bytes'
        });
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': MIME[ext] || 'video/mp4',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Permissions-Policy': 'camera=*, microphone=*, display-capture=*',
      });
      fileStream.pipe(res);
      req.on('close', () => fileStream.destroy());
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': MIME[ext] || 'text/plain',
        'Accept-Ranges': 'bytes',
        'Cache-Control': ext === '.mp4' ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
        'Permissions-Policy': 'camera=*, microphone=*, display-capture=*',
      });
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      req.on('close', () => fileStream.destroy());
    }
  });
}

const httpServer = http.createServer(handleHttpRequest);
let httpsServer  = null;
const wss        = new WebSocket.Server({ noServer: true });

function handleUpgrade(req, socket, head) {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
}
httpServer.on('upgrade', handleUpgrade);

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
    color    : '#888888',
    text     : text,
    ts       : Date.now(),
    isSystem : true,
  };
  room.chat.push(chatItem);
  if (room.chat.length > 100) room.chat.shift();
  broadcast(room, { type: 'chat_message', message: chatItem });
}

wss.on('connection', (ws) => {
  let userId  = null;
  let roomId  = null;
  let room    = null;
  let hasLeft = false;

  function send(obj) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  function leave() {
    if (hasLeft || !room || !userId) return;
    hasLeft = true;

    const leavingUser = room.users.get(userId);
    const userName = leavingUser ? leavingUser.name : userId;
    const currentRoomId = roomId;
    const currentRoom = room;

    currentRoom.users.delete(userId);

    if (currentRoom.users.size > 0) {
      // Room still has remaining users: notify them and keep active state
      broadcast(currentRoom, { type: 'user_left', userId, name: userName });
      addSystemChatMessage(currentRoom, `🚪 ${userName} left the room`);
      debounceSave(currentRoomId);
    } else {
      // ALL users have closed/left the room: completely wipe all blackboard, chat and video history!
      console.log(`[room] All users left room "${currentRoomId}". Clearing all history.`);
      clearRoomHistory(currentRoomId);
    }

    room   = null;
    userId = null;
    roomId = null;
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'join': {
        if (room) leave();
        hasLeft = false;
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
            id, color: u.color, name: u.name, isMuted: !!u.isMuted, isCamOff: !!u.isCamOff,
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
          type     : 'user_joined',
          userId,
          color,
          name     : userName,
          isMuted  : false,
          isCamOff : false,
        }, ws);

        addSystemChatMessage(room, `👋 ${userName} joined the room`);
        console.log(`[join] user=${userId} (${userName}) room=${roomId} (${room.users.size} connected)`);
        break;
      }

      case 'leave': {
        leave();
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
          color    : user ? user.color : '#ffffff',
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

      // ── WebRTC Audio Voice Chat Signaling ──
      case 'voice_signal': {
        if (!room || !msg.to) return;
        const targetUser = room.users.get(msg.to);
        if (targetUser && targetUser.ws && targetUser.ws.readyState === WebSocket.OPEN) {
          targetUser.ws.send(JSON.stringify({
            type : 'voice_signal',
            from : userId,
            data : msg.data,
          }));
        }
        break;
      }

      case 'voice_mute_status': {
        if (!room) return;
        const user = room.users.get(userId);
        if (user) user.isMuted = !!msg.isMuted;
        broadcast(room, {
          type    : 'voice_mute_status',
          userId,
          isMuted : !!msg.isMuted,
        }, ws);
        break;
      }

      case 'video_cam_status': {
        if (!room) return;
        const user = room.users.get(userId);
        if (user) user.isCamOff = !!msg.isCamOff;
        broadcast(room, {
          type     : 'video_cam_status',
          userId,
          isCamOff : !!msg.isCamOff,
        }, ws);
        break;
      }

      // ── Zoom Direct Video Calling Signaling ──
      case 'call_user': {
        if (!room || !msg.targetUserId) return;
        const targetUser = room.users.get(msg.targetUserId);
        const caller = room.users.get(userId);
        if (targetUser && targetUser.ws && targetUser.ws.readyState === WebSocket.OPEN) {
          targetUser.ws.send(JSON.stringify({
            type       : 'incoming_call',
            fromUserId : userId,
            fromName   : caller ? caller.name : userId.slice(0, 6),
            fromColor  : caller ? caller.color : '#ffffff',
          }));
        }
        break;
      }

      case 'call_accepted': {
        if (!room || !msg.targetUserId) return;
        const targetUser = room.users.get(msg.targetUserId);
        const recipient = room.users.get(userId);
        if (targetUser && targetUser.ws && targetUser.ws.readyState === WebSocket.OPEN) {
          targetUser.ws.send(JSON.stringify({
            type       : 'call_accepted',
            fromUserId : userId,
            fromName   : recipient ? recipient.name : userId.slice(0, 6),
          }));
        }
        break;
      }

      case 'call_declined': {
        if (!room || !msg.targetUserId) return;
        const targetUser = room.users.get(msg.targetUserId);
        const recipient = room.users.get(userId);
        if (targetUser && targetUser.ws && targetUser.ws.readyState === WebSocket.OPEN) {
          targetUser.ws.send(JSON.stringify({
            type       : 'call_declined',
            fromUserId : userId,
            fromName   : recipient ? recipient.name : 'User',
            reason     : msg.reason || 'declined',
          }));
        }
        break;
      }

      case 'call_cancelled': {
        if (!room || !msg.targetUserId) return;
        const targetUser = room.users.get(msg.targetUserId);
        if (targetUser && targetUser.ws && targetUser.ws.readyState === WebSocket.OPEN) {
          targetUser.ws.send(JSON.stringify({
            type       : 'call_cancelled',
            fromUserId : userId,
          }));
        }
        break;
      }

      case 'call_ended': {
        if (!room) return;
        if (msg.targetUserId) {
          const targetUser = room.users.get(msg.targetUserId);
          if (targetUser && targetUser.ws && targetUser.ws.readyState === WebSocket.OPEN) {
            targetUser.ws.send(JSON.stringify({
              type       : 'call_ended',
              fromUserId : userId,
            }));
          }
        } else {
          broadcast(room, {
            type       : 'call_ended',
            fromUserId : userId,
          }, ws);
        }
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
    '#ffffff', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#cccccc',
    '#b5b5b5', '#a3a3a3', '#888888', '#737373', '#525252',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ─── Start Servers (HTTP + HTTPS for Mobile Camera & Mic) ─────────────────────
(async () => {
  const sslCert = await getOrCreateSslCert();
  if (sslCert) {
    try {
      httpsServer = https.createServer({ key: sslCert.key, cert: sslCert.cert }, handleHttpRequest);
      httpsServer.on('error', (err) => {
        console.warn('⚠️ HTTPS server could not bind or listen:', err.message);
      });
      httpsServer.on('upgrade', handleUpgrade);
      httpsServer.listen(HTTPS_PORT, () => {
        console.log(`🔒 HTTPS Server running at https://localhost:${HTTPS_PORT}`);
      });
    } catch (e) {
      console.warn('⚠️ Could not start HTTPS server:', e.message);
    }
  }

  httpServer.listen(PORT, () => {
    const lanIps = getLanIps();
    console.log(`\n==================================================================`);
    console.log(`✅ Collaborative Whiteboard & Video Call Server Online!`);
    console.log(`💻 Desktop / Laptop:`);
    console.log(`   HTTP:   http://localhost:${PORT}`);
    if (httpsServer) console.log(`   HTTPS:  https://localhost:${HTTPS_PORT}`);
    if (lanIps.length > 0) {
      console.log(`\n📱 Mobile Phones & LAN Devices (Microphone & Camera require HTTPS):`);
      for (const ip of lanIps) {
        if (httpsServer) console.log(`   👉 https://${ip}:${HTTPS_PORT}`);
        console.log(`      http://${ip}:${PORT}`);
      }
    }
    console.log(`==================================================================\n`);
  });
})();
