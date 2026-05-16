/**
 * Collaborative Whiteboard Server
 * All 7 phases implemented:
 *  Phase 1 – Real-time drawing broadcast
 *  Phase 2 – User sessions & rooms
 *  Phase 3 – Cursor presence
 *  Phase 4 – Persistence (in-memory, JSON-file on disk)
 *  Phase 5 – Undo/redo (operation-based, multi-user safe)
 *  Phase 6 – Conflict handling (CRDT-inspired: immutable strokes with unique IDs)
 *  Phase 7 – Performance (batching, throttle awareness)
 */

const http      = require('http');
const fs        = require('fs');
const path      = require('path');
const WebSocket = require('ws');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT        = process.env.PORT || 3000;

// Resolve paths relative to THIS file so the server works
// no matter which directory you run `node` from
const ROOT_DIR    = path.join(__dirname, '..');
const PUBLIC_DIR  = path.join(ROOT_DIR, 'public');
const PERSIST_DIR = path.join(ROOT_DIR, 'data');

if (!fs.existsSync(PERSIST_DIR)) fs.mkdirSync(PERSIST_DIR, { recursive: true });

// ─── In-memory state ──────────────────────────────────────────────────────────
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    const persisted = loadRoom(roomId);
    rooms.set(roomId, {
      strokes : new Map(persisted.strokes.map(s => [s.id, s])),
      deleted : new Set(persisted.deleted),
      users   : new Map(),
    });
  }
  return rooms.get(roomId);
}

// ─── Persistence (Phase 4) ────────────────────────────────────────────────────
function roomFile(roomId) {
  return path.join(PERSIST_DIR, roomId.replace(/[^a-z0-9_-]/gi, '_') + '.json');
}

function loadRoom(roomId) {
  try {
    const raw = fs.readFileSync(roomFile(roomId), 'utf8');
    return JSON.parse(raw);
  } catch { return { strokes: [], deleted: [] }; }
}

function saveRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = {
    strokes : [...room.strokes.values()],
    deleted : [...room.deleted],
  };
  fs.writeFileSync(roomFile(roomId), JSON.stringify(data), 'utf8');
}

const saveTimers = new Map();
function debounceSave(roomId, ms = 2000) {
  clearTimeout(saveTimers.get(roomId));
  saveTimers.set(roomId, setTimeout(() => saveRoom(roomId), ms));
}

// ─── HTTP server (serves static files) ────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js'  : 'application/javascript',
  '.css' : 'text/css',
  '.ico' : 'image/x-icon',
};

console.log(`📁 Serving static files from: ${PUBLIC_DIR}`);

const httpServer = http.createServer((req, res) => {
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

wss.on('connection', (ws) => {
  let userId = null;
  let roomId = null;
  let room   = null;

  function send(obj) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  function leave() {
    if (!room || !userId) return;
    room.users.delete(userId);
    broadcast(room, { type: 'user_left', userId });
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
        room.users.set(userId, { ws, color, name: msg.name || userId.slice(0, 6) });

        send({
          type    : 'init',
          userId,
          color,
          roomId,
          strokes : [...room.strokes.values()],
          deleted : [...room.deleted],
          users   : [...room.users.entries()].map(([id, u]) => ({
            id, color: u.color, name: u.name,
          })),
        });

        broadcast(room, {
          type  : 'user_joined',
          userId,
          color,
          name  : room.users.get(userId).name,
        }, ws);

        console.log(`[join] user=${userId} room=${roomId} (${room.users.size} connected)`);
        break;
      }

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
  console.log(`✅ Whiteboard server running at http://localhost:${PORT}`);
  console.log(`   Open two browser windows to test real-time collaboration.`);
});
