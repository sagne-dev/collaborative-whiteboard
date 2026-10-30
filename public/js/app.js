/**
 * CollabSpace — Collaborative Whiteboard & Watch Party Client
 * 
 * Features:
 *  1. Seamless Mode Switcher (Whiteboard <-> Watch Party) without dropping connection.
 *  2. Universal Video Engine:
 *     - YouTube (via robust YouTube IFrame API; supports repeat loading & Shorts)
 *     - Google Drive (preview embed with direct playback)
 *     - Direct Video Streams (HTML5 MP4, WebM, OGG, Google Cloud Storage)
 *     - Universal Embed Player (Vimeo, Dailymotion, or ANY video/web link from Google/web)
 *     - Real-time WebSocket sync: play, pause, seek, load across all clients.
 *  3. Collapsible Text Chat Sidebar (pop in / collapse for theater view).
 *  4. Real-time drawing, CRDT-inspired strokes, undo/redo, presence, and remote cursors.
 */

// ─── DOM Elements ─────────────────────────────────────────────────────────────
// Join Screen
const joinScreen        = document.getElementById('join-screen');
const boardScreen       = document.getElementById('board-screen');
const nameInput         = document.getElementById('name-input');
const roomInput         = document.getElementById('room-input');
const joinBtn           = document.getElementById('join-btn');

// Persistent Top Bar
const modeWhiteboardBtn = document.getElementById('mode-whiteboard-btn');
const modeWatchPartyBtn = document.getElementById('mode-watchparty-btn');
const navChatBadge      = document.getElementById('nav-chat-badge');
const navRoomBadge      = document.getElementById('nav-room-badge');
const navRoomLabel      = document.getElementById('nav-room-label');
const copyHint          = document.getElementById('copy-hint');
const navUserDot        = document.getElementById('nav-user-dot');
const navUserName       = document.getElementById('nav-user-name');
const statusEl          = document.getElementById('status');

// Views Container
const whiteboardView    = document.getElementById('whiteboard-view');
const watchpartyView    = document.getElementById('watchparty-view');

// Whiteboard Elements
const canvas            = document.getElementById('canvas');
const overlay           = document.getElementById('cursor-overlay');
const colorPicker       = document.getElementById('color-picker');
const colorPreview      = document.querySelector('.color-preview');
const widthSlider       = document.getElementById('width-slider');
const widthLabel        = document.getElementById('width-label');
const undoBtn           = document.getElementById('undo-btn');
const redoBtn           = document.getElementById('redo-btn');
const clearBtn          = document.getElementById('clear-btn');
const roomLabel         = document.getElementById('room-label');
const userList          = document.getElementById('user-list');
const userCountDisplay  = document.getElementById('user-count-display');
const toolBtns          = document.querySelectorAll('.tool-btn');
const ctx               = canvas.getContext('2d');

// Watch Party Video Stage Elements
const videoStage             = document.getElementById('video-stage');
const videoUrlInput          = document.getElementById('video-url-input');
const videoLoadBtn           = document.getElementById('video-load-btn');
const sampleVideosSelect     = document.getElementById('sample-videos-select');
const videoSyncBtn           = document.getElementById('video-sync-btn');
const sharedVideo            = document.getElementById('shared-video');
const youtubePlayerContainer = document.getElementById('youtube-player-container');
const embedPlayerContainer   = document.getElementById('embed-player-container');
const embedIframe            = document.getElementById('embed-iframe');
const videoSyncToast         = document.getElementById('video-sync-toast');
const videoAutoplayOverlay   = document.getElementById('video-autoplay-overlay');
const unmutePlayBtn          = document.getElementById('unmute-play-btn');
const videoTypeTag           = document.getElementById('video-type-tag');
const videoTitleDisplay      = document.getElementById('video-title-display');
const videoStatusBadge       = document.getElementById('video-status-badge');
const videoStateText         = document.getElementById('video-state-text');
const theaterChatBtn         = document.getElementById('theater-chat-btn');
const theaterChatBadge       = document.getElementById('theater-chat-badge');

// Synchronized Room Control & Skip Elements
const roomPlayPauseBtn = document.getElementById('room-play-pause-btn');
const roomPlayIcon     = document.getElementById('room-play-icon');
const roomPlayText     = document.getElementById('room-play-text');
const skipBack10Btn    = document.getElementById('skip-back-10-btn');
const skipForward10Btn = document.getElementById('skip-forward-10-btn');
const skipForward30Btn = document.getElementById('skip-forward-30-btn');
const syncCurrentTime  = document.getElementById('sync-current-time');
const syncDurationTime = document.getElementById('sync-duration-time');
const syncScrubber     = document.getElementById('sync-scrubber');
const jumpTimeInput    = document.getElementById('jump-time-input');
const jumpTimeBtn      = document.getElementById('jump-time-btn');

// Chat Sidebar Elements
const chatSidebar       = document.getElementById('chat-sidebar');
const chatCollapseBtn   = document.getElementById('chat-collapse-btn');
const chatMessages      = document.getElementById('chat-messages');
const chatForm          = document.getElementById('chat-form');
const chatInput         = document.getElementById('chat-input');
const chatSendBtn       = document.getElementById('chat-send-btn');

// ─── App State ─────────────────────────────────────────────────────────────────
const state = {
  ws            : null,
  userId        : null,
  userName      : 'Guest',
  userColor     : '#ffffff',
  roomId        : null,
  currentMode   : 'whiteboard', // 'whiteboard' | 'watchparty'

  // Whiteboard drawing state
  isDrawing     : false,
  currentStroke : null,
  tool          : 'pen',
  color         : '#ffffff',
  width         : 4,
  strokes       : new Map(),
  deleted       : new Set(),
  cursors       : new Map(),
  userMap       : new Map(),
  dirty         : false,
  lastCursorSend: 0,

  // Universal Video engine state
  playerEngine      : 'html5', // 'html5' | 'youtube' | 'drive' | 'embed'
  videoUrl          : '',
  videoTitle        : '',
  isSyncingVideo    : false,
  syncTimeout       : null,
  toastTimeout      : null,

  // YouTube API state
  ytPlayer          : null,
  isYTReady         : false,
  pendingYTLoad     : null,
  ytCheckInterval   : null,
  lastYTReportedTime: 0,

  // Chat state
  isChatCollapsed   : false,
  unreadMessages    : 0,
};

// ─── Seamless Mode Switcher ────────────────────────────────────────────────────
function setMode(newMode) {
  if (state.currentMode === newMode) return;
  state.currentMode = newMode;

  if (newMode === 'whiteboard') {
    modeWhiteboardBtn.classList.add('active');
    modeWatchPartyBtn.classList.remove('active');
    whiteboardView.classList.add('active');
    watchpartyView.classList.remove('active');

    requestAnimationFrame(() => {
      resizeCanvas();
      redrawAll();
    });
  } else if (newMode === 'watchparty') {
    modeWatchPartyBtn.classList.add('active');
    modeWhiteboardBtn.classList.remove('active');
    watchpartyView.classList.add('active');
    whiteboardView.classList.remove('active');

    state.unreadMessages = 0;
    updateChatBadges();

    wsSend({ type: 'video_sync_request' });
    scrollToChatBottom();
  }
}

modeWhiteboardBtn.addEventListener('click', () => setMode('whiteboard'));
modeWatchPartyBtn.addEventListener('click', () => setMode('watchparty'));

// ─── Canvas Resizing & Rendering ───────────────────────────────────────────────
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  if (!wrap || wrap.clientWidth === 0 || wrap.clientHeight === 0) return;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  redrawAll();
}
window.addEventListener('resize', () => {
  if (state.currentMode === 'whiteboard') {
    resizeCanvas();
  }
});

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

  if (state.currentStroke) renderStroke(state.currentStroke);
  state.dirty = false;
}

function scheduleRedraw() {
  if (!state.dirty) {
    state.dirty = true;
    requestAnimationFrame(redrawAll);
  }
}

// ─── WebSocket Connection ─────────────────────────────────────────────────────
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
    setStatus('disconnected', '🔴 Reconnecting…');
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

// ─── Message Dispatcher ───────────────────────────────────────────────────────
function handleMessage(msg) {
  switch (msg.type) {

    // ── Room Init ──
    case 'init': {
      state.userId    = msg.userId;
      state.userColor = msg.color;
      state.color     = msg.color;
      state.userName  = msg.name || state.userName;

      colorPicker.value   = msg.color;
      colorPreview.style.background = msg.color;
      navUserDot.style.background   = msg.color;
      navUserName.textContent       = state.userName;
      navRoomLabel.textContent      = 'Room: ' + msg.roomId;
      roomLabel.textContent         = 'Room: ' + msg.roomId;

      state.strokes.clear();
      state.deleted.clear();
      state.currentStroke = null;
      for (const s of (msg.strokes || [])) state.strokes.set(s.id, s);
      for (const id of (msg.deleted || [])) state.deleted.add(id);

      state.userMap.clear();
      overlay.innerHTML = '';
      state.cursors.clear();
      for (const u of (msg.users || [])) {
        state.userMap.set(u.id, u);
        if (u.id !== state.userId) addCursorEl(u.id, u.color, u.name);
      }
      renderUserList();
      scheduleRedraw();

      // Video Player: init if present, otherwise cleanly hide & reset
      if (msg.video && msg.video.url) {
        initVideoPlayer(msg.video);
      } else {
        hideAllPlayers();
        state.videoUrl   = null;
        state.videoTitle = 'No Video Loaded';
        videoTitleDisplay.textContent = 'No Video Loaded';
        videoTypeTag.textContent = 'WATCH PARTY';
        videoTypeTag.style.background = 'rgba(255, 255, 255, 0.08)';
        videoTypeTag.style.color = '#fff';
        updateSyncTimeline(0, 0);
        updateVideoBadge(false);
      }

      // Chat Messages: clear DOM and load room chat
      chatMessages.innerHTML = '';
      state.unreadMessages = 0;
      updateChatBadges();

      if (Array.isArray(msg.chat)) {
        for (const chatItem of msg.chat) {
          appendChatMessage(chatItem, false);
        }
      }

      if (videoUrlInput) videoUrlInput.value = '';
      if (chatInput) chatInput.value = '';
      break;
    }

    // ── Drawing Events ──
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

    // ── Presence Events ──
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

    // ── Watch Party Video Sync Events ──
    case 'video_load': {
      showVideoToast(`🎬 ${msg.updatedBy || 'Room'} loaded new video`);
      applyRemoteVideoLoad(msg.url, msg.title, msg.engine);
      break;
    }

    case 'video_play': {
      showVideoToast(`▶️ ${msg.userName || 'Peer'} played the video`);
      applyRemotePlay(msg.currentTime);
      break;
    }

    case 'video_pause': {
      showVideoToast(`⏸️ ${msg.userName || 'Peer'} paused the video`);
      applyRemotePause(msg.currentTime);
      break;
    }

    case 'video_seek': {
      const timeFormatted = formatTime(msg.currentTime);
      showVideoToast(`⏩ ${msg.userName || 'Peer'} jumped to ${timeFormatted}`);
      applyRemoteSeek(msg.currentTime, msg.isPlaying);
      break;
    }

    case 'video_sync': {
      if (msg.video) {
        initVideoPlayer(msg.video);
      }
      break;
    }

    // ── Chat Messages ──
    case 'chat_message': {
      appendChatMessage(msg.message, true);
      break;
    }
  }
}

// ─── Drawing Logic ────────────────────────────────────────────────────────────
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
  state.strokes.set(stroke.id, stroke);
  wsSend({ type: 'stroke', ...stroke });
  scheduleRedraw();
}

canvas.addEventListener('mouseup',    finishStroke);
canvas.addEventListener('mouseleave', finishStroke);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }));
}, { passive: false });
canvas.addEventListener('touchmove',  (e) => {
  e.preventDefault();
  canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }));
}, { passive: false });
canvas.addEventListener('touchend',   finishStroke);

// ─── Remote Cursors ───────────────────────────────────────────────────────────
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
  if (c && c.el) {
    c.el.style.transform = `translate(${x}px, ${y}px)`;
  }
}

function removeCursor(userId) {
  const c = state.cursors.get(userId);
  if (c) { c.el.remove(); state.cursors.delete(userId); }
}

function renderUserList() {
  const count = state.userMap.size;
  userCountDisplay.textContent = count;
  userList.innerHTML = [...state.userMap.values()].map(u =>
    `<li class="user-chip" style="--c:${u.color}">
      <span class="dot"></span>
      ${u.name || u.id.slice(0, 6)}
      ${u.id === state.userId ? '<em>(you)</em>' : ''}
    </li>`
  ).join('');
}

// ─── Whiteboard Toolbar ───────────────────────────────────────────────────────
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
  if (confirm('Clear the entire board for everyone in the room?')) {
    wsSend({ type: 'clear_all' });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); wsSend({ type: 'undo' });
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault(); wsSend({ type: 'redo' });
  }
});

// ─── Link Parsers (YouTube, Google Drive, Vimeo, Dailymotion, Direct Media) ────
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
                trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  return (match && match[1]) ? match[1] : null;
}

function detectVideoType(url) {
  if (!url || typeof url !== 'string') return { type: 'unknown', url: '' };
  const trimmed = url.trim();

  // 0. Streaming Proxy / Direct Stream
  if (trimmed.startsWith('/api/stream') || trimmed.includes('/api/stream?')) {
    return { type: 'html5', url: trimmed };
  }

  // 1. YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return { type: 'youtube', id: ytId, url: trimmed };
  }

  // 2. Google Drive
  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return {
      type: 'drive',
      id: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      url: trimmed,
    };
  }

  // 3. Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      url: trimmed,
    };
  }

  // 4. Dailymotion
  const dailyMatch = trimmed.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  if (dailyMatch) {
    return {
      type: 'dailymotion',
      id: dailyMatch[1],
      embedUrl: `https://www.dailymotion.com/embed/video/${dailyMatch[1]}`,
      url: trimmed,
    };
  }

  // 5. XVideos / XNXX (convert watch URL to embedframe)
  const xvMatch = trimmed.match(/(?:xvideos|xnxx)[^\/]*\/(?:video[._-]?|embedframe\/)([a-zA-Z0-9_]+)/i);
  if (xvMatch) {
    const videoId = xvMatch[1];
    const host = /xnxx/i.test(trimmed) ? 'www.xnxx.com' : 'www.xvideos.com';
    return {
      type: 'embed',
      embedUrl: `https://${host}/embedframe/${videoId}`,
      url: trimmed,
    };
  }

  // 6. Pornhub (convert watch URL to embed)
  const phMatch = trimmed.match(/pornhub\.com\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/i);
  if (phMatch) {
    return {
      type: 'embed',
      embedUrl: `https://www.pornhub.com/embed/${phMatch[1]}`,
      url: trimmed,
    };
  }

  // 7. SpankBang (convert watch URL to embed)
  const sbMatch = trimmed.match(/spankbang\.com\/([a-zA-Z0-9]+)\/video/i);
  if (sbMatch) {
    return {
      type: 'embed',
      embedUrl: `https://spankbang.com/${sbMatch[1]}/embed/`,
      url: trimmed,
    };
  }

  // 8. Direct Video Files (.mp4, .webm, .ogg, .mov, Google Cloud Storage)
  const isDirect = /\.(mp4|webm|ogg|ogv|mov|m4v|mkv)/i.test(trimmed) ||
                   trimmed.includes('storage.googleapis.com') ||
                   trimmed.includes('commondatastorage.googleapis.com');
  if (isDirect) {
    return { type: 'html5', url: trimmed };
  }

  // 9. Generic Link / Embed Fallback
  return { type: 'embed', embedUrl: trimmed, url: trimmed };
}

// ─── YouTube IFrame API Setup ──────────────────────────────────────────────────
window.onYouTubeIframeAPIReady = function() {
  state.isYTReady = true;
  if (state.pendingYTLoad) {
    const { videoId, startTime, autoPlay } = state.pendingYTLoad;
    state.pendingYTLoad = null;
    loadYouTubeVideo(videoId, startTime, autoPlay);
  }
};

if (window.YT && window.YT.Player) {
  state.isYTReady = true;
}

// ─── Helper: Hide All Video Players Cleanly ────────────────────────────────────
function hideAllPlayers() {
  // 1. Pause & hide HTML5 video
  try {
    sharedVideo.pause();
  } catch (e) {}
  sharedVideo.classList.add('hidden');

  // 2. Pause & hide YouTube
  if (state.ytPlayer && typeof state.ytPlayer.pauseVideo === 'function') {
    try {
      state.ytPlayer.pauseVideo();
    } catch (e) {}
  }
  stopYTMonitor();
  youtubePlayerContainer.classList.add('hidden');

  // 3. Stop & hide Embed Iframe
  embedIframe.src = 'about:blank';
  embedPlayerContainer.classList.add('hidden');
}

// ─── Watch Party Video Sync Engine ─────────────────────────────────────────────
function startSyncGuard(durationMs = 500) {
  state.isSyncingVideo = true;
  clearTimeout(state.syncTimeout);
  state.syncTimeout = setTimeout(() => {
    state.isSyncingVideo = false;
  }, durationMs);
}

function showVideoToast(text) {
  videoSyncToast.textContent = text;
  videoSyncToast.classList.remove('hidden');
  clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => {
    videoSyncToast.classList.add('hidden');
  }, 2800);
}

function updateVideoBadge(isPlaying) {
  if (isPlaying) {
    videoStatusBadge.className = 'playback-badge playing';
    videoStateText.textContent = 'Playing (Synced)';
    if (roomPlayIcon) roomPlayIcon.textContent = '⏸️';
    if (roomPlayText) roomPlayText.textContent = 'Pause Room';
  } else {
    videoStatusBadge.className = 'playback-badge paused';
    videoStateText.textContent = 'Paused (Synced)';
    if (roomPlayIcon) roomPlayIcon.textContent = '▶️';
    if (roomPlayText) roomPlayText.textContent = 'Play Room';
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ── 1. YouTube Player Engine (supports repeat loading & Shorts) ──
function loadYouTubeVideo(videoId, startTime = 0, autoPlay = false) {
  hideAllPlayers();
  youtubePlayerContainer.classList.remove('hidden');
  state.playerEngine = 'youtube';

  videoTypeTag.textContent = 'YOUTUBE';
  videoTypeTag.style.background = 'rgba(255, 107, 107, 0.15)';
  videoTypeTag.style.color = '#FF6B6B';

  if (!state.isYTReady) {
    state.pendingYTLoad = { videoId, startTime, autoPlay };
    return;
  }

  // If existing player instance is healthy, cue or load directly
  if (state.ytPlayer && typeof state.ytPlayer.loadVideoById === 'function') {
    try {
      startSyncGuard(1200);
      if (autoPlay) {
        state.ytPlayer.loadVideoById(videoId, startTime || 0);
        updateVideoBadge(true);
      } else {
        if (typeof state.ytPlayer.cueVideoById === 'function') {
          state.ytPlayer.cueVideoById(videoId, startTime || 0);
        } else {
          state.ytPlayer.loadVideoById(videoId, startTime || 0);
        }
        updateVideoBadge(false);
      }
      startYTMonitor();

      setTimeout(() => {
        try {
          const data = state.ytPlayer.getVideoData();
          if (data && data.title) {
            videoTitleDisplay.textContent = data.title;
          }
        } catch (e) {}
      }, 700);
      return;
    } catch (err) {
      console.warn('Re-cue on existing YT player failed, re-creating player:', err);
    }
  }

  // Re-create DOM placeholder to ensure YouTube Player always mounts fresh
  try {
    if (state.ytPlayer && typeof state.ytPlayer.destroy === 'function') {
      state.ytPlayer.destroy();
    }
  } catch (e) {}
  state.ytPlayer = null;
  youtubePlayerContainer.innerHTML = '<div id="youtube-player"></div>';

  startSyncGuard(1500);
  state.ytPlayer = new YT.Player('youtube-player', {
    videoId: videoId,
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: autoPlay ? 1 : 0,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: (event) => {
        if (startTime > 0) {
          event.target.seekTo(startTime, true);
        }
        if (autoPlay) {
          event.target.playVideo();
          updateVideoBadge(true);
        } else {
          updateVideoBadge(false);
        }
        try {
          const data = event.target.getVideoData();
          if (data && data.title) {
            videoTitleDisplay.textContent = data.title;
          }
        } catch (e) {}
      },
      onStateChange: onYTStateChange,
      onError: (err) => {
        console.warn('YouTube Player error code:', err.data);
        showVideoToast('⚠️ Could not load YouTube video (may be restricted or private)');
      },
    },
  });

  startYTMonitor();
}

function onYTStateChange(event) {
  if (state.isSyncingVideo) return;

  // YT.PlayerState.PLAYING === 1
  if (event.data === 1) {
    const curr = state.ytPlayer.getCurrentTime();
    updateVideoBadge(true);
    wsSend({
      type        : 'video_play',
      currentTime : curr,
    });
  }
  // YT.PlayerState.PAUSED === 2
  else if (event.data === 2) {
    const curr = state.ytPlayer.getCurrentTime();
    updateVideoBadge(false);
    wsSend({
      type        : 'video_pause',
      currentTime : curr,
    });
  }
}

function startYTMonitor() {
  stopYTMonitor();
  state.ytCheckInterval = setInterval(() => {
    if (state.playerEngine !== 'youtube' || !state.ytPlayer || !state.ytPlayer.getCurrentTime || state.isSyncingVideo) {
      return;
    }
    const playerState = state.ytPlayer.getPlayerState();
    const curr = state.ytPlayer.getCurrentTime();

    if (playerState === 1) { // Playing
      const diff = Math.abs(curr - (state.lastYTReportedTime + 0.5));
      if (diff > 2.0 && state.lastYTReportedTime > 0) {
        wsSend({ type: 'video_seek', currentTime: curr });
      }
    } else if (playerState === 2) { // Paused
      const diff = Math.abs(curr - state.lastYTReportedTime);
      if (diff > 1.2 && state.lastYTReportedTime > 0) {
        wsSend({ type: 'video_seek', currentTime: curr });
      }
    }
    state.lastYTReportedTime = curr;
  }, 500);
}

function stopYTMonitor() {
  if (state.ytCheckInterval) {
    clearInterval(state.ytCheckInterval);
    state.ytCheckInterval = null;
  }
}

// ── 2. Google Drive Player Engine ──
function loadGoogleDriveVideo(driveId, rawUrl) {
  hideAllPlayers();
  embedPlayerContainer.classList.remove('hidden');
  state.playerEngine = 'drive';

  videoTypeTag.textContent = 'GOOGLE DRIVE';
  videoTypeTag.style.background = 'rgba(66, 133, 244, 0.15)';
  videoTypeTag.style.color = '#4285F4';
  videoTitleDisplay.textContent = 'Google Drive Video';

  const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
  embedIframe.src = previewUrl;
  updateVideoBadge(true);
  showVideoToast('📁 Loaded Google Drive Video');
}

// ── 3. Universal Embed Player Engine (Vimeo, Dailymotion, Web Video Links) ──
function loadEmbedVideo(url, label = 'WEB VIDEO') {
  hideAllPlayers();
  embedPlayerContainer.classList.remove('hidden');
  state.playerEngine = 'embed';

  videoTypeTag.textContent = label.toUpperCase();
  videoTypeTag.style.background = 'rgba(255, 234, 167, 0.15)';
  videoTypeTag.style.color = '#FFEAA7';
  videoTitleDisplay.textContent = url.split('/').pop().split('?')[0] || 'Web Video';

  embedIframe.src = url;
  updateVideoBadge(true);
}

// ── 4. HTML5 Direct Video Engine (MP4, WebM, OGG, Google Cloud Storage, Proxied Streams) ──
function loadHTML5Video(url, startTime = 0, autoPlay = false) {
  hideAllPlayers();
  sharedVideo.classList.remove('hidden');
  state.playerEngine = 'html5';

  let tag = 'DIRECT MP4';
  if (url.includes('/api/stream')) tag = 'STREAM (SYNCED)';
  else if (/\.(webm|ogg|mov)/i.test(url)) tag = 'HTML5 VIDEO';
  videoTypeTag.textContent = tag;
  videoTypeTag.style.background = 'rgba(78, 205, 196, 0.12)';
  videoTypeTag.style.color = 'var(--accent)';

  startSyncGuard(800);
  if (sharedVideo.src !== url && !sharedVideo.src.endsWith(url)) {
    sharedVideo.src = url;
  }

  const applyTimeAndPlay = () => {
    if (startTime > 0) {
      try {
        sharedVideo.currentTime = startTime;
      } catch (e) {}
    }
    if (autoPlay) {
      attemptPlay();
    } else {
      sharedVideo.pause();
      updateVideoBadge(false);
    }
  };

  if (sharedVideo.readyState >= 1) {
    applyTimeAndPlay();
  } else {
    sharedVideo.addEventListener('loadedmetadata', applyTimeAndPlay, { once: true });
    setTimeout(() => {
      if (sharedVideo.currentTime === 0 && startTime > 0) {
        try { sharedVideo.currentTime = startTime; } catch (e) {}
      }
    }, 600);
  }
}

// If direct HTML5 video fails (e.g. non-streamable file), fall back to Universal Embed player
sharedVideo.onerror = () => {
  if (state.playerEngine === 'html5' && state.videoUrl && !state.videoUrl.startsWith('/api/stream')) {
    console.warn('HTML5 video failed to load, falling back to Universal Embed player.');
    loadEmbedVideo(state.videoUrl, 'WEB VIDEO');
  } else {
    console.warn('HTML5 video error:', sharedVideo.error);
    showVideoToast('⚠️ Video buffering or network reconnecting...');
  }
};

function attemptPlay() {
  const promise = sharedVideo.play();
  if (promise !== undefined) {
    promise.then(() => {
      videoAutoplayOverlay.classList.add('hidden');
      updateVideoBadge(true);
    }).catch(err => {
      console.warn('Autoplay blocked:', err);
      videoAutoplayOverlay.classList.remove('hidden');
      updateVideoBadge(false);
    });
  }
}

unmutePlayBtn.addEventListener('click', () => {
  videoAutoplayOverlay.classList.add('hidden');
  if (state.playerEngine === 'youtube' && state.ytPlayer) {
    state.ytPlayer.playVideo();
    updateVideoBadge(true);
  } else if (state.playerEngine === 'html5') {
    sharedVideo.play().then(() => updateVideoBadge(true)).catch(() => {});
  }
});

// ── Universal Player Entry Points ──
function initVideoPlayer(videoData) {
  if (!videoData || !videoData.url) return;
  state.videoUrl   = videoData.url;
  state.videoTitle = videoData.title || 'Video';
  videoTitleDisplay.textContent = state.videoTitle;

  const engine = videoData.engine;
  const currTime = typeof videoData.currentTime === 'number' ? videoData.currentTime : 0;
  const isPlaying = !!videoData.isPlaying;

  if (engine === 'html5' || videoData.url.startsWith('/api/stream') || /\.(mp4|webm|ogg|ogv|mov|m4v|mkv)/i.test(videoData.url)) {
    loadHTML5Video(videoData.url, currTime, isPlaying);
    return;
  }
  if (engine === 'youtube') {
    const ytId = extractYouTubeId(videoData.url);
    if (ytId) {
      loadYouTubeVideo(ytId, currTime, isPlaying);
      return;
    }
  }

  const detected = detectVideoType(videoData.url);
  if (detected.type === 'youtube') {
    loadYouTubeVideo(detected.id, currTime, isPlaying);
  } else if (detected.type === 'drive') {
    loadGoogleDriveVideo(detected.id, videoData.url);
  } else if (detected.type === 'vimeo' || detected.type === 'dailymotion') {
    loadEmbedVideo(detected.embedUrl, detected.type);
  } else if (detected.type === 'html5') {
    loadHTML5Video(videoData.url, currTime, isPlaying);
  } else {
    loadEmbedVideo(detected.embedUrl || videoData.url, 'WEB VIDEO');
  }
}

function applyRemoteVideoLoad(url, title, engine) {
  state.videoUrl   = url;
  state.videoTitle = title || url.split('/').pop() || 'Video';
  videoTitleDisplay.textContent = state.videoTitle;

  if (engine === 'html5' || url.startsWith('/api/stream') || /\.(mp4|webm|ogg|ogv|mov|m4v|mkv)/i.test(url)) {
    loadHTML5Video(url, 0, false);
    return;
  }
  if (engine === 'youtube') {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      loadYouTubeVideo(ytId, 0, false);
      return;
    }
  }

  const detected = detectVideoType(url);
  if (detected.type === 'youtube') {
    loadYouTubeVideo(detected.id, 0, false);
  } else if (detected.type === 'drive') {
    loadGoogleDriveVideo(detected.id, url);
  } else if (detected.type === 'vimeo' || detected.type === 'dailymotion') {
    loadEmbedVideo(detected.embedUrl, detected.type);
  } else if (detected.type === 'html5') {
    loadHTML5Video(url, 0, false);
  } else {
    loadEmbedVideo(detected.embedUrl || url, 'WEB VIDEO');
  }
}

function applyRemotePlay(currentTime) {
  startSyncGuard(800);

  if (state.playerEngine === 'youtube' && state.ytPlayer && state.ytPlayer.playVideo) {
    if (typeof currentTime === 'number' && Math.abs(state.ytPlayer.getCurrentTime() - currentTime) > 0.8) {
      state.ytPlayer.seekTo(currentTime, true);
    }
    state.ytPlayer.playVideo();
    updateVideoBadge(true);
  } else if (state.playerEngine === 'html5') {
    if (typeof currentTime === 'number' && Math.abs(sharedVideo.currentTime - currentTime) > 0.45) {
      try { sharedVideo.currentTime = currentTime; } catch (e) {}
    }
    attemptPlay();
  } else {
    updateVideoBadge(true);
  }
}

function applyRemotePause(currentTime) {
  startSyncGuard(800);

  if (state.playerEngine === 'youtube' && state.ytPlayer && state.ytPlayer.pauseVideo) {
    if (typeof currentTime === 'number' && Math.abs(state.ytPlayer.getCurrentTime() - currentTime) > 0.8) {
      state.ytPlayer.seekTo(currentTime, true);
    }
    state.ytPlayer.pauseVideo();
    updateVideoBadge(false);
  } else if (state.playerEngine === 'html5') {
    if (typeof currentTime === 'number' && Math.abs(sharedVideo.currentTime - currentTime) > 0.45) {
      try { sharedVideo.currentTime = currentTime; } catch (e) {}
    }
    sharedVideo.pause();
    updateVideoBadge(false);
  } else {
    updateVideoBadge(false);
  }
}

function applyRemoteSeek(currentTime, isPlaying) {
  startSyncGuard(800);

  if (typeof currentTime === 'number') {
    state.lastRoomTime = currentTime;
    updateSyncTimeline(currentTime, getVideoDuration());
  }

  if (state.playerEngine === 'youtube' && state.ytPlayer && state.ytPlayer.seekTo) {
    state.ytPlayer.seekTo(currentTime, true);
    if (isPlaying) {
      state.ytPlayer.playVideo();
      updateVideoBadge(true);
    } else {
      state.ytPlayer.pauseVideo();
      updateVideoBadge(false);
    }
  } else if (state.playerEngine === 'html5') {
    if (typeof currentTime === 'number') {
      if (Math.abs(sharedVideo.currentTime - currentTime) > 0.3) {
        try { sharedVideo.currentTime = currentTime; } catch (e) {}
      }
    }
    if (isPlaying && sharedVideo.paused) {
      attemptPlay();
    } else if (!isPlaying && !sharedVideo.paused) {
      sharedVideo.pause();
      updateVideoBadge(false);
    }
  }
}

// ── HTML5 Video Player Event Listeners ──
sharedVideo.addEventListener('play', () => {
  if (state.isSyncingVideo || state.playerEngine !== 'html5') return;
  updateVideoBadge(true);
  wsSend({
    type        : 'video_play',
    currentTime : sharedVideo.currentTime,
  });
});

sharedVideo.addEventListener('pause', () => {
  if (state.isSyncingVideo || state.playerEngine !== 'html5') return;
  updateVideoBadge(false);
  wsSend({
    type        : 'video_pause',
    currentTime : sharedVideo.currentTime,
  });
});

sharedVideo.addEventListener('seeked', () => {
  if (state.isSyncingVideo || state.playerEngine !== 'html5') return;
  wsSend({
    type        : 'video_seek',
    currentTime : sharedVideo.currentTime,
  });
});

// ── Load Custom Video URL (YouTube, Google Drive, MP4, Any Web Link) ──
function loadVideo(rawUrl, rawTitle) {
  const cleanUrl = (rawUrl || '').trim();
  if (!cleanUrl) return;

  let cleanTitle = rawTitle;
  const detected = detectVideoType(cleanUrl);

  if (!cleanTitle) {
    if (detected.type === 'youtube') {
      cleanTitle = 'YouTube Video';
    } else if (detected.type === 'drive') {
      cleanTitle = 'Google Drive Video';
    } else {
      cleanTitle = cleanUrl.split('/').pop().split('?')[0] || 'Custom Video';
    }
  }

  wsSend({
    type  : 'video_load',
    url   : cleanUrl,
    title : cleanTitle,
  });
  videoUrlInput.value = '';
}

videoLoadBtn.addEventListener('click', () => {
  loadVideo(videoUrlInput.value);
});

videoUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loadVideo(videoUrlInput.value);
  }
});

sampleVideosSelect.addEventListener('change', () => {
  const selectedUrl = sampleVideosSelect.value;
  const selectedText = sampleVideosSelect.options[sampleVideosSelect.selectedIndex].text;
  if (selectedUrl) {
    loadVideo(selectedUrl, selectedText);
    sampleVideosSelect.selectedIndex = 0;
  }
});

videoSyncBtn.addEventListener('click', () => {
  wsSend({ type: 'video_sync_request' });
  showVideoToast('🔄 Synced with room playback state');
});

// ─── Synchronized Room Skip, Scrubber & Playback Controls ─────────────────────
function getCurrentVideoTime() {
  if (state.playerEngine === 'youtube' && state.ytPlayer && typeof state.ytPlayer.getCurrentTime === 'function') {
    return state.ytPlayer.getCurrentTime() || 0;
  }
  if (state.playerEngine === 'html5') {
    return sharedVideo.currentTime || 0;
  }
  return state.lastRoomTime || 0;
}

function getVideoDuration() {
  if (state.playerEngine === 'youtube' && state.ytPlayer && typeof state.ytPlayer.getDuration === 'function') {
    return state.ytPlayer.getDuration() || 0;
  }
  if (state.playerEngine === 'html5') {
    return sharedVideo.duration || 0;
  }
  return 0;
}

function updateSyncTimeline(curr, dur) {
  if (syncCurrentTime) syncCurrentTime.textContent = formatTime(curr);
  if (syncDurationTime) {
    if (dur > 0) {
      syncDurationTime.textContent = formatTime(dur);
      if (syncScrubber && !state.isUserScrubbing) {
        syncScrubber.value = Math.min(100, Math.max(0, (curr / dur) * 100));
      }
    } else {
      syncDurationTime.textContent = '--:--';
    }
  }
}

function skipVideoBy(seconds) {
  const curr = getCurrentVideoTime();
  const dur = getVideoDuration();
  let target = Math.max(0, curr + seconds);
  if (dur > 0) target = Math.min(dur, target);

  startSyncGuard(600);

  if (state.playerEngine === 'youtube' && state.ytPlayer && typeof state.ytPlayer.seekTo === 'function') {
    state.ytPlayer.seekTo(target, true);
  } else if (state.playerEngine === 'html5') {
    sharedVideo.currentTime = target;
  }
  state.lastRoomTime = target;
  updateSyncTimeline(target, dur);

  wsSend({
    type: 'video_seek',
    currentTime: target,
  });

  const sign = seconds > 0 ? '+' : '';
  showVideoToast(`⏩ Skipped ${sign}${seconds}s for room`);
}

if (skipBack10Btn)    skipBack10Btn.addEventListener('click', () => skipVideoBy(-10));
if (skipForward10Btn) skipForward10Btn.addEventListener('click', () => skipVideoBy(10));
if (skipForward30Btn) skipForward30Btn.addEventListener('click', () => skipVideoBy(30));

function parseTimeToSeconds(str) {
  if (!str) return 0;
  const parts = str.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

function doJumpTime() {
  if (!jumpTimeInput) return;
  const val = jumpTimeInput.value.trim();
  if (!val) return;
  const target = parseTimeToSeconds(val);
  const dur = getVideoDuration();
  const clamped = dur > 0 ? Math.min(dur, Math.max(0, target)) : Math.max(0, target);

  startSyncGuard(600);
  if (state.playerEngine === 'youtube' && state.ytPlayer && typeof state.ytPlayer.seekTo === 'function') {
    state.ytPlayer.seekTo(clamped, true);
  } else if (state.playerEngine === 'html5') {
    sharedVideo.currentTime = clamped;
  }
  state.lastRoomTime = clamped;
  updateSyncTimeline(clamped, dur);

  wsSend({
    type: 'video_seek',
    currentTime: clamped,
  });

  showVideoToast(`⏩ Jumped to ${formatTime(clamped)} for room`);
  jumpTimeInput.value = '';
}

if (jumpTimeBtn)   jumpTimeBtn.addEventListener('click', doJumpTime);
if (jumpTimeInput) jumpTimeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    doJumpTime();
  }
});

if (roomPlayPauseBtn) {
  roomPlayPauseBtn.addEventListener('click', () => {
    const isPlaying = videoStatusBadge.classList.contains('playing');
    const curr = getCurrentVideoTime();

    if (isPlaying) {
      startSyncGuard(600);
      if (state.playerEngine === 'youtube' && state.ytPlayer && typeof state.ytPlayer.pauseVideo === 'function') {
        state.ytPlayer.pauseVideo();
      } else if (state.playerEngine === 'html5') {
        sharedVideo.pause();
      }
      updateVideoBadge(false);
      wsSend({ type: 'video_pause', currentTime: curr });
      showVideoToast('⏸️ Paused playback for room');
    } else {
      startSyncGuard(600);
      if (state.playerEngine === 'youtube' && state.ytPlayer && typeof state.ytPlayer.playVideo === 'function') {
        state.ytPlayer.playVideo();
      } else if (state.playerEngine === 'html5') {
        attemptPlay();
      }
      updateVideoBadge(true);
      wsSend({ type: 'video_play', currentTime: curr });
      showVideoToast('▶️ Resumed playback for room');
    }
  });
}

if (syncScrubber) {
  syncScrubber.addEventListener('input', () => {
    state.isUserScrubbing = true;
    const pct = Number(syncScrubber.value) / 100;
    const dur = getVideoDuration() || 100;
    const target = pct * dur;
    if (syncCurrentTime) syncCurrentTime.textContent = formatTime(target);
  });

  syncScrubber.addEventListener('change', () => {
    state.isUserScrubbing = false;
    const pct = Number(syncScrubber.value) / 100;
    const dur = getVideoDuration() || 100;
    const target = pct * dur;

    startSyncGuard(600);
    if (state.playerEngine === 'youtube' && state.ytPlayer && typeof state.ytPlayer.seekTo === 'function') {
      state.ytPlayer.seekTo(target, true);
    } else if (state.playerEngine === 'html5') {
      sharedVideo.currentTime = target;
    }
    state.lastRoomTime = target;
    updateSyncTimeline(target, dur);

    wsSend({
      type: 'video_seek',
      currentTime: target,
    });
    showVideoToast(`⏩ Seeked to ${formatTime(target)} for room`);
  });
}

// Keep timeline synced periodically
setInterval(() => {
  if (state.isUserScrubbing) return;
  const curr = getCurrentVideoTime();
  const dur = getVideoDuration();
  updateSyncTimeline(curr, dur);
}, 500);

// ─── Collapsible Text Chat Sidebar ────────────────────────────────────────────
function toggleChatSidebar(collapse) {
  state.isChatCollapsed = collapse;

  if (collapse) {
    chatSidebar.classList.add('collapsed');
    theaterChatBtn.classList.remove('hidden');
  } else {
    chatSidebar.classList.remove('collapsed');
    theaterChatBtn.classList.add('hidden');
    state.unreadMessages = 0;
    updateChatBadges();
    scrollToChatBottom();
    chatInput.focus();
  }
}

chatCollapseBtn.addEventListener('click', () => toggleChatSidebar(true));
theaterChatBtn.addEventListener('click',  () => toggleChatSidebar(false));

function scrollToChatBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function updateChatBadges() {
  if (state.unreadMessages > 0) {
    navChatBadge.textContent = state.unreadMessages;
    navChatBadge.classList.remove('hidden');
    theaterChatBadge.textContent = state.unreadMessages;
    theaterChatBadge.classList.remove('hidden');
  } else {
    navChatBadge.classList.add('hidden');
    theaterChatBadge.classList.add('hidden');
  }
}

function appendChatMessage(item, isLive = true) {
  if (!item) return;

  const entry = document.createElement('div');
  const isMine = item.userId === state.userId;

  if (item.isSystem) {
    entry.className = 'chat-entry system';
    entry.innerHTML = `<span class="chat-system-pill">${escapeHtml(item.text)}</span>`;
  } else {
    entry.className = `chat-entry ${isMine ? 'mine' : 'theirs'}`;
    const timeStr = formatChatTimestamp(item.ts);
    const authorColor = item.color || '#4ECDC4';

    entry.innerHTML = `
      <div class="chat-meta">
        <span class="chat-author" style="--user-color:${authorColor}">${escapeHtml(item.name || 'User')}</span>
        <span class="chat-time">${timeStr}</span>
      </div>
      <div class="chat-bubble">${escapeHtml(item.text)}</div>
    `;
  }

  chatMessages.appendChild(entry);
  scrollToChatBottom();

  if (isLive && !isMine && (state.isChatCollapsed || state.currentMode !== 'watchparty')) {
    state.unreadMessages++;
    updateChatBadges();
  }
}

function formatChatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  wsSend({ type: 'chat_message', text });
  chatInput.value = '';
  chatInput.focus();
});

// ─── Room Copy Link ────────────────────────────────────────────────────────────
navRoomBadge.addEventListener('click', () => {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    copyHint.classList.add('show');
    setTimeout(() => copyHint.classList.remove('show'), 2000);
  }).catch(() => {
    prompt('Share this URL to invite friends:', url);
  });
});

// ─── Join Flow ────────────────────────────────────────────────────────────────
state.userId = sessionStorage.getItem('wb_uid') || ('u_' + Math.random().toString(36).slice(2, 8));
sessionStorage.setItem('wb_uid', state.userId);

const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) roomInput.value = urlRoom;

function doJoin() {
  const room = roomInput.value.trim() || 'lobby';
  const name = nameInput.value.trim() || 'Guest';
  state.roomId = room;
  state.userName = name;

  history.replaceState(null, '', '?room=' + encodeURIComponent(room));

  joinScreen.classList.add('hidden');
  boardScreen.classList.remove('hidden');

  requestAnimationFrame(() => {
    resizeCanvas();
    connect(room, name);
  });
}

joinBtn.addEventListener('click', doJoin);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
roomInput.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });

// ─── Status ────────────────────────────────────────────────────────────────────
function setStatus(cls, text) {
  statusEl.className = 'status ' + cls;
  statusEl.textContent = text;
}

// ─── Close WebSocket on Page Unload ───────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.close();
  }
});
