/**
 * Collaborative Whiteboard — Client
 * Phases 1-7 all implemented
 */

// ── DOM refs ──────────────────────────────────────────────────────────────────
const joinScreen  = document.getElementById('join-screen');
const boardScreen = document.getElementById('board-screen');
const nameInput   = document.getElementById('name-input');
const roomInput   = document.getElementById('room-input');
const joinBtn     = document.getElementById('join-btn');
const canvas      = document.getElementById('canvas');
const overlay     = document.getElementById('cursor-overlay');
const colorPicker = document.getElementById('color-picker');
const colorPreview= document.querySelector('.color-preview');
const widthSlider = document.getElementById('width-slider');
const widthLabel  = document.getElementById('width-label');
const undoBtn     = document.getElementById('undo-btn');
const redoBtn     = document.getElementById('redo-btn');
const clearBtn    = document.getElementById('clear-btn');
const statusEl    = document.getElementById('status');
const roomLabel   = document.getElementById('room-label');
const userList    = document.getElementById('user-list');
const toolBtns    = document.querySelectorAll('.tool-btn');

const ctx = canvas.getContext('2d');

// ── App state ─────────────────────────────────────────────────────────────────
const state = {
  ws            : null,
  userId        : null,
  userColor     : '#ffffff',
  roomId        : null,
  isDrawing     : false,
  currentStroke : null,
  tool          : 'pen',
  color         : '#ffffff',
  width         : 4,
  strokes       : new Map(),   // strokeId → stroke
  deleted       : new Set(),   // soft-deleted stroke IDs
  cursors       : new Map(),   // userId → {el, x, y}
  userMap       : new Map(),   // userId → {id, color, name}
  dirty         : false,
  lastCursorSend: 0,
};

// ── Canvas resize ─────────────────────────────────────────────────────────────
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  redrawAll();
}
window.addEventListener('resize', resizeCanvas);

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderStroke(stroke) {
  const pts = stroke.points;
  if (!pts || pts.length < 1) return;
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth   = stroke.width;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  if (pts.length === 1) {
    // Single dot
    ctx.arc(pts[0][0], pts[0][1], stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const mx = (prev[0] + curr[0]) / 2;
      const my = (prev[1] + curr[1]) / 2;
      ctx.quadraticCurveTo(prev[0], prev[1], mx, my);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.stroke();
  }
  ctx.restore();
}

function redrawAll() {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  const sorted = [...state.strokes.values()]
    .filter(s => !state.deleted.has(s.id))
    .sort((a, b) => a.ts - b.ts);

  for (const s of sorted) renderStroke(s);

  // Draw in-progress stroke on top
  if (state.currentStroke) renderStroke(state.currentStroke);

  state.dirty = false;
}

function scheduleRedraw() {
  if (!state.dirty) {
    state.dirty = true;
    requestAnimationFrame(redrawAll);
  }
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
function connect(roomId, name) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}`);
  state.ws = ws;

  ws.onopen = () => {
    setStatus('connected', '🟢 Connected');
    ws.send(JSON.stringify({
      type   : 'join',
      roomId : roomId,
      userId : state.userId,
      name   : name,
      color  : state.userColor,
    }));
  };

  ws.onclose = () => {
    setStatus('disconnected', '🔴 Disconnected — reconnecting…');
    setTimeout(() => connect(state.roomId, name), 2000);
  };

  ws.onerror = () => setStatus('error', '⚠️ Connection error');

  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    handleMessage(msg);
  };
}

function wsSend(obj) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(obj));
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
function handleMessage(msg) {
  switch (msg.type) {

    case 'init': {
      state.userId    = msg.userId;
      state.userColor = msg.color;
      state.color     = msg.color;
      colorPicker.value   = msg.color;
      colorPreview.style.background = msg.color;
      roomLabel.textContent = 'Room: ' + msg.roomId;

      state.strokes.clear();
      state.deleted.clear();
      for (const s of msg.strokes) state.strokes.set(s.id, s);
      for (const id of msg.deleted) state.deleted.add(id);

      // Seed users
      state.userMap.clear();
      overlay.innerHTML = '';
      state.cursors.clear();
      for (const u of msg.users) {
        state.userMap.set(u.id, u);
        if (u.id !== state.userId) addCursorEl(u.id, u.color, u.name);
      }
      renderUserList();
      scheduleRedraw();
      break;
    }

    case 'stroke': {
      state.strokes.set(msg.stroke.id, msg.stroke);
      scheduleRedraw();
      break;
    }

    case 'cursor': {
      if (msg.userId === state.userId) return;
      moveCursor(msg.userId, msg.x, msg.y, msg.color);
      break;
    }

    case 'delete_stroke': {
      state.deleted.add(msg.strokeId);
      scheduleRedraw();
      break;
    }

    case 'restore_stroke': {
      state.deleted.delete(msg.stroke.id);
      state.strokes.set(msg.stroke.id, msg.stroke);
      scheduleRedraw();
      break;
    }

    case 'clear_all': {
      for (const [id] of state.strokes) state.deleted.add(id);
      scheduleRedraw();
      break;
    }

    case 'user_joined': {
      state.userMap.set(msg.userId, { id: msg.userId, color: msg.color, name: msg.name });
      addCursorEl(msg.userId, msg.color, msg.name);
      renderUserList();
      break;
    }

    case 'user_left': {
      state.userMap.delete(msg.userId);
      removeCursor(msg.userId);
      renderUserList();
      break;
    }
  }
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return [src.clientX - rect.left, src.clientY - rect.top];
}

canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  const [x, y] = getPos(e);
  const id = state.userId + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
  state.isDrawing = true;
  state.currentStroke = {
    id,
    userId : state.userId,
    color  : state.tool === 'eraser' ? '#111122' : state.color,
    width  : state.tool === 'eraser' ? state.width * 5 : state.width,
    points : [[x, y]],
    ts     : Date.now(),
  };
  scheduleRedraw();
});

canvas.addEventListener('mousemove', (e) => {
  e.preventDefault();
  const [x, y] = getPos(e);

  // Throttled cursor broadcast (~30 fps)
  const now = Date.now();
  if (now - state.lastCursorSend > 33) {
    wsSend({ type: 'cursor', x, y });
    state.lastCursorSend = now;
  }

  if (!state.isDrawing) return;
  state.currentStroke.points.push([x, y]);
  scheduleRedraw();
});

function finishStroke() {
  if (!state.isDrawing) return;
  state.isDrawing = false;
  const stroke = state.currentStroke;
  state.currentStroke = null;
  if (!stroke || stroke.points.length < 1) return;
  // Store locally and send to server
  state.strokes.set(stroke.id, stroke);
  wsSend({ type: 'stroke', ...stroke });
  scheduleRedraw();
}

canvas.addEventListener('mouseup',    finishStroke);
canvas.addEventListener('mouseleave', finishStroke);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })); }, { passive: false });
canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })); }, { passive: false });
canvas.addEventListener('touchend',   finishStroke);

// ── Cursors ───────────────────────────────────────────────────────────────────
function addCursorEl(userId, color, name) {
  if (state.cursors.has(userId)) return;
  const el = document.createElement('div');
  el.className = 'remote-cursor';
  el.innerHTML =
    `<svg width="18" height="18" viewBox="0 0 20 20"><path d="M2 2 L18 9 L10 11 L7 18 Z" fill="${color}" stroke="white" stroke-width="1.5"/></svg>` +
    `<span class="cursor-label" style="background:${color}">${name}</span>`;
  overlay.appendChild(el);
  state.cursors.set(userId, { el, color, name });
}

function moveCursor(userId, x, y, color) {
  if (!state.cursors.has(userId)) {
    addCursorEl(userId, color || '#888', userId.slice(0, 6));
  }
  const c = state.cursors.get(userId);
  c.el.style.transform = `translate(${x}px, ${y}px)`;
}

function removeCursor(userId) {
  const c = state.cursors.get(userId);
  if (c) { c.el.remove(); state.cursors.delete(userId); }
}

// ── User list ─────────────────────────────────────────────────────────────────
function renderUserList() {
  userList.innerHTML = [...state.userMap.values()].map(u =>
    `<li class="user-chip" style="--c:${u.color}">
      <span class="dot"></span>
      ${u.name || u.id.slice(0, 6)}
      ${u.id === state.userId ? '<em>(you)</em>' : ''}
    </li>`
  ).join('');
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
colorPicker.addEventListener('input', () => {
  state.color = colorPicker.value;
  colorPreview.style.background = colorPicker.value;
});

widthSlider.addEventListener('input', () => {
  state.width = Number(widthSlider.value);
  widthLabel.textContent = widthSlider.value;
});

toolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toolBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tool = btn.dataset.tool;
  });
});

undoBtn.addEventListener('click',  () => wsSend({ type: 'undo' }));
redoBtn.addEventListener('click',  () => wsSend({ type: 'redo' }));
clearBtn.addEventListener('click', () => {
  if (confirm('Clear the entire board for everyone?')) wsSend({ type: 'clear_all' });
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); wsSend({ type: 'undo' });
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault(); wsSend({ type: 'redo' });
  }
});

// ── Join flow ─────────────────────────────────────────────────────────────────
// Reuse or create a userId for this browser session
state.userId = sessionStorage.getItem('wb_uid') || ('u_' + Math.random().toString(36).slice(2, 8));
sessionStorage.setItem('wb_uid', state.userId);

// Pre-fill room from URL ?room=xxx
const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) roomInput.value = urlRoom;

function doJoin() {
  const room = roomInput.value.trim() || 'lobby';
  const name = nameInput.value.trim() || 'Guest';
  state.roomId = room;

  // Update URL so users can share it
  history.replaceState(null, '', '?room=' + encodeURIComponent(room));

  // Switch screens using CSS class (not HTML hidden attribute)
  joinScreen.classList.add('hidden');
  boardScreen.classList.remove('hidden');

  // Must size canvas AFTER the board is visible
  requestAnimationFrame(() => {
    resizeCanvas();
    connect(room, name);
  });
}

joinBtn.addEventListener('click', doJoin);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
roomInput.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });

// ── Status ────────────────────────────────────────────────────────────────────
function setStatus(cls, text) {
  statusEl.className = 'status ' + cls;
  statusEl.textContent = text;
}
