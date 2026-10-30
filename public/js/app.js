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
const modeVideoCallBtn  = document.getElementById('mode-videocall-btn');
const navChatBadge      = document.getElementById('nav-chat-badge');
const navRoomBadge      = document.getElementById('nav-room-badge');
const navRoomLabel      = document.getElementById('nav-room-label');
const copyHint          = document.getElementById('copy-hint');
const navUserDot        = document.getElementById('nav-user-dot');
const navUserName       = document.getElementById('nav-user-name');
const statusEl          = document.getElementById('status');

// Voice Chat Elements
const navVoiceBtn           = document.getElementById('nav-voice-btn');
const voiceIcon             = document.getElementById('voice-icon');
const voiceStatusText       = document.getElementById('voice-status-text');
const voiceWave             = document.getElementById('voice-wave');
const remoteAudiosContainer = document.getElementById('remote-audios-container');

// Views Container
const whiteboardView    = document.getElementById('whiteboard-view');
const watchpartyView    = document.getElementById('watchparty-view');
const videocallView     = document.getElementById('videocall-view');

// Zoom-Style Direct Video Calling Elements
const zoomLobbyView          = document.getElementById('zoom-lobby-view');
const zoomLobbyRoomTag       = document.getElementById('zoom-lobby-room-tag');
const zoomPreviewVideo       = document.getElementById('zoom-preview-video');
const zoomPreviewAvatar      = document.getElementById('zoom-preview-avatar');
const zoomPreviewAvatarCircle= document.getElementById('zoom-preview-avatar-circle');
const zoomPreviewAvatarName  = document.getElementById('zoom-preview-avatar-name');
const zoomPreviewMyName      = document.getElementById('zoom-preview-myname');
const zoomPreviewCamToggle   = document.getElementById('zoom-preview-cam-toggle');
const zoomPreviewCamIcon     = document.getElementById('zoom-preview-cam-icon');
const zoomPreviewMicToggle   = document.getElementById('zoom-preview-mic-toggle');
const zoomPreviewMicIcon     = document.getElementById('zoom-preview-mic-icon');
const zoomAvailableCount     = document.getElementById('zoom-available-count');
const zoomPeersList          = document.getElementById('zoom-peers-list');
const zoomEmptyPeers         = document.getElementById('zoom-empty-peers');
const zoomCopyLinkBtn        = document.getElementById('zoom-copy-link-btn');

// Zoom Global Calling & Incoming Overlays
const zoomCallingOverlay     = document.getElementById('zoom-calling-overlay');
const zoomCallingAvatar      = document.getElementById('zoom-calling-avatar');
const zoomCallingName        = document.getElementById('zoom-calling-name');
const zoomCancelCallBtn      = document.getElementById('zoom-cancel-call-btn');

const zoomIncomingOverlay    = document.getElementById('zoom-incoming-overlay');
const zoomIncomingAvatar     = document.getElementById('zoom-incoming-avatar');
const zoomIncomingName       = document.getElementById('zoom-incoming-name');
const zoomAcceptCallBtn      = document.getElementById('zoom-accept-call-btn');
const zoomDeclineCallBtn     = document.getElementById('zoom-decline-call-btn');

// Zoom Active Meeting Stage Elements (Daily.co SFU Multi-Participant Grid)
const zoomActiveMeetingView  = document.getElementById('zoom-active-meeting-view');
const zoomMeetingTitle       = document.getElementById('zoom-meeting-title');
const zoomCallDuration       = document.getElementById('zoom-call-duration');
const zoomStageFullscreenBtn = document.getElementById('zoom-stage-fullscreen-btn');
const zoomVideoStageGrid     = document.getElementById('zoom-video-stage-grid');
const zoomSfuBadge           = document.getElementById('zoom-sfu-badge');
const zoomGridParticipantsBadge = document.getElementById('zoom-grid-participants-badge');
const zoomJoinRoomCallBtn    = document.getElementById('zoom-join-room-call-btn');

// Zoom Bottom Control Bar
const zoomCallMicBtn         = document.getElementById('zoom-call-mic-btn');
const zoomCallMicIcon        = document.getElementById('zoom-call-mic-icon');
const zoomCallMicLabel       = document.getElementById('zoom-call-mic-label');
const zoomCallCamBtn         = document.getElementById('zoom-call-cam-btn');
const zoomCallCamIcon        = document.getElementById('zoom-call-cam-icon');
const zoomCallCamLabel       = document.getElementById('zoom-call-cam-label');
const zoomScreenShareBtn     = document.getElementById('zoom-screen-share-btn');
const zoomScreenShareIcon    = document.getElementById('zoom-screen-share-icon');
const zoomScreenShareLabel   = document.getElementById('zoom-screen-share-label');
const zoomEndCallBtn         = document.getElementById('zoom-end-call-btn');

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

  // WebRTC Voice Chat state
  localAudioStream        : null,
  isMicMuted              : false,
  voiceConnections        : new Map(), // remoteUserId -> { pc, audioEl, candidateQueue, hasRemoteDescription, remoteVideoStream }
  audioContext            : null,
  analyserNode            : null,
  voiceVisualizerInterval : null,
  voiceSupported          : typeof window !== 'undefined' && !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia),

  // Zoom-Style SFU & Video Calling state (Daily.co Route 1 Call Object)
  localVideoStream        : null,
  isCamOff                : false,
  activeCall              : null, // { peerId, peerName, peerColor, startTime, timerInterval, isCaller }
  pendingOutgoingCall     : null, // { targetUserId, targetName, timeout }
  pendingIncomingCall     : null, // { fromUserId, fromName, fromColor }
  zoomViewLayout          : 'grid', // 'grid' | 'focus'
  isCallActive            : false,
  callTimerInterval       : null,
  dailyCall               : null,
  isDailyConnected        : false,
  activeSpeakerId         : null,
  isLocalSpeaking         : false,
  isScreenSharing         : false,
  localScreenStream       : null,
};

// ─── Seamless Mode Switcher ────────────────────────────────────────────────────
function setMode(newMode) {
  if (state.currentMode === newMode) return;
  state.currentMode = newMode;

  modeWhiteboardBtn.classList.toggle('active', newMode === 'whiteboard');
  modeWatchPartyBtn.classList.toggle('active', newMode === 'watchparty');
  if (modeVideoCallBtn) modeVideoCallBtn.classList.toggle('active', newMode === 'videocall');

  whiteboardView.classList.toggle('active', newMode === 'whiteboard');
  watchpartyView.classList.toggle('active', newMode === 'watchparty');
  if (videocallView) videocallView.classList.toggle('active', newMode === 'videocall');

  if (newMode === 'whiteboard') {
    requestAnimationFrame(() => {
      resizeCanvas();
      redrawAll();
    });
  } else if (newMode === 'watchparty') {
    state.unreadMessages = 0;
    updateChatBadges();

    wsSend({ type: 'video_sync_request' });
    scrollToChatBottom();
  } else if (newMode === 'videocall') {
    // If in an active call, show active stage, else lobby
    if (state.activeCall || state.isCallActive) {
      if (zoomLobbyView) zoomLobbyView.classList.add('hidden');
      if (zoomActiveMeetingView) zoomActiveMeetingView.classList.remove('hidden');
      renderZoomGrid();
    } else {
      if (zoomLobbyView) zoomLobbyView.classList.remove('hidden');
      if (zoomActiveMeetingView) zoomActiveMeetingView.classList.add('hidden');
    }
    renderZoomLobby();
    ensureLocalCamera();
  }
}

if (modeWhiteboardBtn) modeWhiteboardBtn.addEventListener('click', () => setMode('whiteboard'));
if (modeWatchPartyBtn) modeWatchPartyBtn.addEventListener('click', () => setMode('watchparty'));
if (modeVideoCallBtn)  modeVideoCallBtn.addEventListener('click',  () => setMode('videocall'));

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
      renderZoomLobby();
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
      state.userMap.set(msg.userId, {
        id       : msg.userId,
        color    : msg.color,
        name     : msg.name,
        isMuted  : !!msg.isMuted,
        isCamOff : !!msg.isCamOff,
      });
      addCursorEl(msg.userId, msg.color, msg.name);
      renderUserList();
      renderZoomLobby();
      // If voice chat is active (and not in an exclusive 1-on-1 video call), connect peer
      if (state.voiceSupported && msg.userId !== state.userId && !state.activeCall) {
        initiatePeerConnection(msg.userId);
      }
      break;
    }

    case 'user_left': {
      const leavingName = state.userMap.get(msg.userId)?.name || 'User';
      state.userMap.delete(msg.userId);
      removeCursor(msg.userId);
      closePeerConnection(msg.userId);
      renderUserList();
      renderZoomLobby();

      if (state.activeCall && state.activeCall.peerId === msg.userId) {
        terminateActiveCall(`${leavingName} left the room`);
      }
      if (state.pendingOutgoingCall && state.pendingOutgoingCall.targetUserId === msg.userId) {
        cancelOutgoingCall();
        showVideoToast(`ℹ️ ${leavingName} left`);
      }
      if (state.pendingIncomingCall && state.pendingIncomingCall.fromUserId === msg.userId) {
        state.pendingIncomingCall = null;
        stopRingtone();
        if (zoomIncomingOverlay) zoomIncomingOverlay.classList.add('hidden');
      }
      break;
    }

    // ── Zoom Direct Video Call Events ──
    case 'incoming_call': {
      handleIncomingCall(msg);
      break;
    }

    case 'call_accepted': {
      handleCallAccepted(msg);
      break;
    }

    case 'call_declined': {
      handleCallDeclined(msg);
      break;
    }

    case 'call_cancelled': {
      handleCallCancelled(msg);
      break;
    }

    case 'call_ended': {
      handleCallEnded(msg);
      break;
    }

    // ── WebRTC Voice & Video Events ──
    case 'voice_signal': {
      handleVoiceSignal(msg);
      break;
    }

    case 'voice_mute_status': {
      const u = state.userMap.get(msg.userId);
      if (u) {
        u.isMuted = !!msg.isMuted;
        renderUserList();
        renderZoomGrid();
      }
      break;
    }

    case 'video_cam_status': {
      const u = state.userMap.get(msg.userId);
      if (u) {
        u.isCamOff = !!msg.isCamOff;
        renderZoomGrid();
      }
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
  userList.innerHTML = [...state.userMap.values()].map(u => {
    const isMe = u.id === state.userId;
    const isMuted = isMe ? state.isMicMuted : !!u.isMuted;
    const micIcon = isMuted ? '🔇' : '🎙️';
    const micTitle = isMuted ? 'Microphone muted' : 'Microphone active';
    return `
      <li class="user-chip" style="--c:${u.color}">
        <span class="dot"></span>
        <span class="user-name-text">${escapeHtml(u.name || u.id.slice(0, 6))}</span>
        <span class="user-mic-status ${isMuted ? 'muted' : 'unmuted'}" title="${micTitle}">${micIcon}</span>
        ${isMe ? '<em>(you)</em>' : ''}
      </li>
    `;
  }).join('');
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
    initVoiceChat();
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

// ─── Real-Time WebRTC Voice Chat ───────────────────────────────────────────────
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

function updateVoiceUI(status, text) {
  if (!navVoiceBtn) return;
  navVoiceBtn.classList.remove('unmuted', 'muted', 'connecting');

  if (status === 'active') {
    navVoiceBtn.classList.add('unmuted');
    if (voiceIcon) voiceIcon.textContent = '🎙️';
    if (voiceStatusText) voiceStatusText.textContent = text || 'Voice Active';
  } else if (status === 'muted') {
    navVoiceBtn.classList.add('muted');
    if (voiceIcon) voiceIcon.textContent = '🔇';
    if (voiceStatusText) voiceStatusText.textContent = text || 'Muted';
    if (voiceWave) voiceWave.classList.remove('talking');
  } else if (status === 'connecting') {
    navVoiceBtn.classList.add('connecting');
    if (voiceIcon) voiceIcon.textContent = '⏳';
    if (voiceStatusText) voiceStatusText.textContent = text || 'Connecting...';
  }
}

async function initVoiceChat() {
  if (!state.voiceSupported) {
    console.warn('WebRTC or getUserMedia not supported in this browser.');
    updateVoiceUI('muted', 'Voice Unsupported');
    return;
  }

  updateVoiceUI('connecting', 'Connecting Mic...');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    state.localAudioStream = stream;
    state.isMicMuted = false;
    updateVoiceUI('active', 'Voice Active');
    setupAudioActivityMeter(stream);

    // Attach audio track to any existing peer connections
    for (const [, conn] of state.voiceConnections) {
      try {
        const senders = conn.pc.getSenders();
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(audioTrack);
          } else {
            conn.pc.addTrack(audioTrack, stream);
          }
        }
      } catch (e) {}
    }

    showVideoToast('🎙️ Voice chat connected! Microphone is live.');
  } catch (err) {
    console.warn('Microphone access denied or unavailable:', err.message);
    state.localAudioStream = null;
    state.isMicMuted = true;
    updateVoiceUI('muted', 'Mic Off (Click to Speak)');
    showVideoToast('ℹ️ Voice chat joined (listen only). Click mic to speak.');
  }
}

async function toggleMicrophone() {
  if (!state.localAudioStream) {
    await initVoiceChat();
    return;
  }

  state.isMicMuted = !state.isMicMuted;
  state.localAudioStream.getAudioTracks().forEach(track => {
    track.enabled = !state.isMicMuted;
  });

  if (state.dailyCall && state.isDailyConnected) {
    try {
      state.dailyCall.setLocalAudio(!state.isMicMuted);
    } catch (e) {}
  }

  if (state.isMicMuted) {
    updateVoiceUI('muted', 'Muted (Unmute)');
    showVideoToast('🔇 Microphone muted');
  } else {
    updateVoiceUI('active', 'Voice Active');
    showVideoToast('🎙️ Microphone active');
  }

  updateMicUI();
  renderZoomGrid();

  wsSend({
    type    : 'voice_mute_status',
    isMuted : state.isMicMuted,
  });

  renderUserList();
}

if (navVoiceBtn) {
  navVoiceBtn.addEventListener('click', toggleMicrophone);
}

function setupAudioActivityMeter(stream) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    state.audioContext = new AudioCtx();
    const source = state.audioContext.createMediaStreamSource(stream);
    state.analyserNode = state.audioContext.createAnalyser();
    state.analyserNode.fftSize = 64;
    source.connect(state.analyserNode);

    const bufferLength = state.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    clearInterval(state.voiceVisualizerInterval);
    state.voiceVisualizerInterval = setInterval(() => {
      if (state.isMicMuted || !state.analyserNode) {
        if (voiceWave) voiceWave.classList.remove('talking');
        if (state.isLocalSpeaking) {
          state.isLocalSpeaking = false;
          highlightActiveSpeaker();
        }
        return;
      }
      state.analyserNode.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength;
      const isSpeaking = avg > 18;

      if (isSpeaking) {
        voiceWave?.classList.add('talking');
      } else {
        voiceWave?.classList.remove('talking');
      }

      if (state.isLocalSpeaking !== isSpeaking) {
        state.isLocalSpeaking = isSpeaking;
        highlightActiveSpeaker();
      }
    }, 150);
  } catch (e) {
    console.warn('Audio activity meter init error:', e);
  }
}

// ─── Real-Time Web Audio Ringtone & Chimes ────────────────────────────────────
let ringtoneInterval = null;
let ringAudioCtx = null;

function playRingtone() {
  stopRingtone();
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ringAudioCtx = new AudioCtx();

    const ringCycle = () => {
      if (!ringAudioCtx || ringAudioCtx.state === 'closed') return;
      const osc1 = ringAudioCtx.createOscillator();
      const osc2 = ringAudioCtx.createOscillator();
      const gain = ringAudioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.value = 440;
      osc2.type = 'sine';
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.12, ringAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ringAudioCtx.currentTime + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ringAudioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ringAudioCtx.currentTime + 1.5);
      osc2.stop(ringAudioCtx.currentTime + 1.5);
    };

    ringCycle();
    ringtoneInterval = setInterval(ringCycle, 3000);
  } catch (e) {}
}

function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (ringAudioCtx) {
    try { ringAudioCtx.close(); } catch (e) {}
    ringAudioCtx = null;
  }
}

function playChime(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    if (type === 'connect') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'disconnect') {
      osc.frequency.setValueAtTime(783.99, ctx.currentTime);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 500);
  } catch (e) {}
}

// ─── Local Camera Management ──────────────────────────────────────────────────
async function ensureLocalCamera() {
  if (state.localVideoStream && state.localVideoStream.getVideoTracks().length > 0) {
    const track = state.localVideoStream.getVideoTracks()[0];
    if (track.readyState === 'live') {
      track.enabled = !state.isCamOff;
      if (zoomPreviewVideo && zoomPreviewVideo.srcObject !== state.localVideoStream) {
        zoomPreviewVideo.srcObject = state.localVideoStream;
      }
      updateCameraUI();
      renderZoomGrid();
      return;
    }
  }

  if (!state.voiceSupported) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user',
      },
    });

    state.localVideoStream = stream;
    const track = stream.getVideoTracks()[0];
    track.enabled = !state.isCamOff;

    if (zoomPreviewVideo) {
      zoomPreviewVideo.srcObject = stream;
      zoomPreviewVideo.play().catch(() => {});
    }

    // Attach to existing peer connections if call is active
    for (const [, conn] of state.voiceConnections) {
      try {
        const senders = conn.pc.getSenders();
        const videoSender = senders.find(s => (s.track && s.track.kind === 'video') || (s.track === null && s.dtlsTransport));
        if (videoSender) {
          videoSender.replaceTrack(track);
        } else {
          conn.pc.addTrack(track, stream);
          if (conn.pc.signalingState === 'stable') {
            initiatePeerConnection(conn.targetUserId);
          }
        }
      } catch (err) {}
    }

    updateCameraUI();
    renderZoomGrid();
  } catch (err) {
    console.warn('Camera access unavailable:', err.message);
    state.localVideoStream = null;
    state.isCamOff = true;
    updateCameraUI();
    renderZoomGrid();
  }
}

async function toggleCamera() {
  if (!state.localVideoStream) {
    state.isCamOff = false;
    await ensureLocalCamera();
    return;
  }

  state.isCamOff = !state.isCamOff;
  state.localVideoStream.getVideoTracks().forEach(track => {
    track.enabled = !state.isCamOff;
  });

  if (state.dailyCall && state.isDailyConnected) {
    try {
      state.dailyCall.setLocalVideo(!state.isCamOff);
    } catch (e) {}
  }

  updateCameraUI();
  renderZoomGrid();

  if (state.isCamOff) {
    showVideoToast('📷 Camera turned off');
  } else {
    showVideoToast('📹 Camera active');
  }

  wsSend({
    type: 'video_cam_status',
    isCamOff: state.isCamOff,
  });
}

function updateCameraUI() {
  const isOff = state.isCamOff;

  // 1. Lobby preview
  if (zoomPreviewAvatar) {
    if (isOff) zoomPreviewAvatar.classList.remove('hidden');
    else zoomPreviewAvatar.classList.add('hidden');
  }
  if (zoomPreviewCamToggle) {
    zoomPreviewCamToggle.classList.toggle('muted', isOff);
    if (zoomPreviewCamIcon) zoomPreviewCamIcon.textContent = isOff ? '📷' : '📹';
  }

  // 2. Active Meeting stage bottom bar
  if (zoomCallCamBtn) {
    zoomCallCamBtn.className = isOff ? 'zoom-call-control-btn cam-muted' : 'zoom-call-control-btn cam-active';
    if (zoomCallCamIcon) zoomCallCamIcon.textContent = isOff ? '📷' : '📹';
    if (zoomCallCamLabel) zoomCallCamLabel.textContent = isOff ? 'Start Video' : 'Stop Video';
  }
}

function updateMicUI() {
  const isMuted = state.isMicMuted;

  // 1. Top bar voice pill
  if (navVoiceBtn) {
    navVoiceBtn.classList.remove('unmuted', 'muted');
    navVoiceBtn.classList.add(isMuted ? 'muted' : 'unmuted');
    if (voiceIcon) voiceIcon.textContent = isMuted ? '🔇' : '🎙️';
    if (voiceStatusText) voiceStatusText.textContent = isMuted ? 'Muted' : 'Voice Active';
  }

  // 2. Lobby preview
  if (zoomPreviewMicToggle) {
    zoomPreviewMicToggle.classList.toggle('muted', isMuted);
    if (zoomPreviewMicIcon) zoomPreviewMicIcon.textContent = isMuted ? '🔇' : '🎙️';
  }

  // 3. Active meeting stage bottom bar
  if (zoomCallMicBtn) {
    zoomCallMicBtn.className = isMuted ? 'zoom-call-control-btn muted' : 'zoom-call-control-btn unmuted';
    if (zoomCallMicIcon) zoomCallMicIcon.textContent = isMuted ? '🔇' : '🎙️';
    if (zoomCallMicLabel) zoomCallMicLabel.textContent = isMuted ? 'Unmute' : 'Mute';
  }
}

// ─── Daily.co Route 1 SFU Call Object Management ──────────────────────────────
async function initDailyCallObject() {
  if (typeof window === 'undefined' || !window.Daily) {
    console.warn('Daily.js SDK not available');
    return null;
  }
  if (state.dailyCall) return state.dailyCall;

  try {
    const call = window.Daily.createCallObject({
      subscribeToTracksAutomatically: true,
    });

    call.on('joined-meeting', (ev) => {
      state.isDailyConnected = true;
      if (zoomSfuBadge) {
        zoomSfuBadge.textContent = '⚡ Daily.co SFU';
        zoomSfuBadge.style.display = 'inline-block';
      }
      renderZoomGrid();
    });

    call.on('participant-joined', () => renderZoomGrid());
    call.on('participant-updated', () => renderZoomGrid());
    call.on('participant-left', () => renderZoomGrid());
    call.on('track-started', () => renderZoomGrid());
    call.on('track-stopped', () => renderZoomGrid());

    call.on('active-speaker-change', (ev) => {
      state.activeSpeakerId = ev.activeSpeaker ? ev.activeSpeaker.peerId : null;
      highlightActiveSpeaker();
    });

    call.on('error', (ev) => {
      console.warn('Daily SFU error:', ev);
    });

    state.dailyCall = call;
    return call;
  } catch (err) {
    console.warn('Failed to create Daily call object:', err);
    return null;
  }
}

// ─── Screen Sharing Control ───────────────────────────────────────────────────
async function toggleScreenShare() {
  if (state.isScreenSharing) {
    await stopScreenShare();
  } else {
    await startScreenShare();
  }
}

async function startScreenShare() {
  try {
    if (state.dailyCall && state.isDailyConnected) {
      await state.dailyCall.startScreenShare();
      state.isScreenSharing = true;
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        showVideoToast('⚠️ Screen sharing not supported on this browser');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      state.localScreenStream = stream;
      state.isScreenSharing = true;

      const track = stream.getVideoTracks()[0];
      if (track) {
        track.addEventListener('ended', () => {
          stopScreenShare();
        });
      }
    }
    updateScreenShareUI(true);
    renderZoomGrid();
    showVideoToast('🖥️ Screen sharing started');
  } catch (err) {
    console.warn('Screen share cancelled or failed:', err);
    state.isScreenSharing = false;
    updateScreenShareUI(false);
  }
}

async function stopScreenShare() {
  state.isScreenSharing = false;
  if (state.dailyCall && state.isDailyConnected) {
    try { await state.dailyCall.stopScreenShare(); } catch (e) {}
  }
  if (state.localScreenStream) {
    state.localScreenStream.getTracks().forEach(t => t.stop());
    state.localScreenStream = null;
  }
  updateScreenShareUI(false);
  renderZoomGrid();
  showVideoToast('Screen sharing stopped');
}

function updateScreenShareUI(active) {
  if (zoomScreenShareBtn) {
    zoomScreenShareBtn.classList.toggle('active-sharing', active);
  }
  if (zoomScreenShareLabel) {
    zoomScreenShareLabel.textContent = active ? 'Stop Share' : 'Share Screen';
  }
}

// ─── Active Speaker Highlighting ──────────────────────────────────────────────
function highlightActiveSpeaker() {
  if (!zoomVideoStageGrid) return;
  const tiles = zoomVideoStageGrid.querySelectorAll('.zoom-tile:not(.screen-share-tile)');
  tiles.forEach(tileEl => {
    const sessId = tileEl.getAttribute('data-session-id');
    const isLocal = tileEl.classList.contains('is-local');
    const waveEl = tileEl.querySelector('.zoom-speaker-wave');

    const isSpeaker = (isLocal && state.isLocalSpeaking) || (sessId && sessId === state.activeSpeakerId);

    if (isSpeaker) {
      tileEl.classList.add('active-speaker');
      if (waveEl) waveEl.classList.remove('hidden');
    } else {
      tileEl.classList.remove('active-speaker');
      if (waveEl) waveEl.classList.add('hidden');
    }
  });
}

// ─── Dynamic Responsive Zoom Video Grid Renderer ──────────────────────────────
function renderZoomGrid() {
  if (!zoomVideoStageGrid || !state.isCallActive) return;

  const tiles = [];

  if (state.isDailyConnected && state.dailyCall) {
    let pObj = {};
    try {
      pObj = state.dailyCall.participants() || {};
    } catch (e) {
      console.warn('Daily participants read error:', e);
    }

    const local = pObj.local;
    const localVTrack = (local && local.tracks && local.tracks.video && local.tracks.video.persistentTrack)
      || (state.localVideoStream ? state.localVideoStream.getVideoTracks()[0] : null);
    const localSTrack = (local && local.tracks && local.tracks.screenVideo && local.tracks.screenVideo.persistentTrack)
      || (state.localScreenStream ? state.localScreenStream.getVideoTracks()[0] : null);

    tiles.push({
      id: 'local',
      session_id: local ? local.session_id : 'local',
      name: `${state.userName || 'You'} (You)`,
      color: state.userColor || '#4ECDC4',
      isLocal: true,
      videoTrack: localVTrack,
      screenTrack: localSTrack,
      isCamOff: state.isCamOff || !(local && local.video),
      isMuted: state.isMicMuted || !(local && local.audio),
    });

    for (const key of Object.keys(pObj)) {
      if (key === 'local') continue;
      const p = pObj[key];
      const vTrack = p.tracks?.video?.persistentTrack || null;
      const sTrack = p.tracks?.screenVideo?.persistentTrack || null;
      const isPlayable = !!p.video && p.tracks?.video?.state === 'playable';
      const isMuted = !p.audio || p.tracks?.audio?.state !== 'playable';

      tiles.push({
        id: p.session_id,
        session_id: p.session_id,
        name: p.user_name || 'Participant',
        color: '#4ECDC4',
        isLocal: false,
        videoTrack: vTrack,
        screenTrack: sTrack,
        isCamOff: !isPlayable,
        isMuted: isMuted,
      });
    }
  } else {
    // WebRTC Mesh / Fallback Mode
    const localVTrack = state.localVideoStream ? state.localVideoStream.getVideoTracks()[0] : null;
    const localSTrack = state.localScreenStream ? state.localScreenStream.getVideoTracks()[0] : null;

    tiles.push({
      id: 'local',
      session_id: 'local',
      name: `${state.userName || 'You'} (You)`,
      color: state.userColor || '#4ECDC4',
      isLocal: true,
      videoTrack: localVTrack,
      screenTrack: localSTrack,
      isCamOff: state.isCamOff,
      isMuted: state.isMicMuted,
    });

    const peerIds = new Set();
    if (state.activeCall && state.activeCall.peerId) {
      peerIds.add(state.activeCall.peerId);
    }
    for (const [id] of state.voiceConnections) {
      if (id !== state.userId) peerIds.add(id);
    }

    for (const pid of peerIds) {
      const u = state.userMap.get(pid);
      const conn = state.voiceConnections.get(pid);
      const vTrack = conn?.remoteVideoStream?.getVideoTracks()[0] || null;

      tiles.push({
        id: pid,
        session_id: pid,
        name: u?.name || 'Participant',
        color: u?.color || '#4ECDC4',
        isLocal: false,
        videoTrack: vTrack,
        screenTrack: null,
        isCamOff: !!(u && u.isCamOff),
        isMuted: !!(u && u.isMuted),
      });
    }
  }

  // Check for active screen sharing
  const screenSharingTile = tiles.find(t => t.screenTrack && t.screenTrack.readyState === 'live');

  // Update dynamic CSS Grid container classes based on total participant count
  zoomVideoStageGrid.className = 'zoom-stage-grid';
  if (screenSharingTile) {
    zoomVideoStageGrid.classList.add('has-screen-share');
  } else {
    const total = tiles.length;
    if (total <= 1) {
      zoomVideoStageGrid.classList.add('grid-1');
    } else if (total === 2) {
      zoomVideoStageGrid.classList.add('grid-2');
    } else if (total === 3) {
      zoomVideoStageGrid.classList.add('grid-3');
    } else if (total === 4) {
      zoomVideoStageGrid.classList.add('grid-4');
    } else if (total <= 6) {
      zoomVideoStageGrid.classList.add('grid-5-6');
    } else {
      zoomVideoStageGrid.classList.add('grid-many');
    }
  }

  if (zoomGridParticipantsBadge) {
    zoomGridParticipantsBadge.textContent = `👥 ${tiles.length} in call`;
  }

  // Build the items to render
  const renderItems = [];
  if (screenSharingTile) {
    renderItems.push({
      tileId: 'screenshare-' + screenSharingTile.id,
      name: `${screenSharingTile.name.replace(' (You)', '')}'s Screen`,
      isScreenShare: true,
      track: screenSharingTile.screenTrack,
      isLocal: false,
      isMuted: false,
      isCamOff: false,
      color: '#0e71eb',
      session_id: 'screen-' + screenSharingTile.session_id,
    });
  }

  for (const t of tiles) {
    renderItems.push({
      tileId: 'tile-' + t.id,
      name: t.name,
      isScreenShare: false,
      track: t.videoTrack,
      isLocal: t.isLocal,
      isMuted: t.isMuted,
      isCamOff: t.isCamOff,
      color: t.color,
      session_id: t.session_id,
    });
  }

  const activeIds = new Set(renderItems.map(i => i.tileId));

  // Remove stale tiles
  const existingTiles = zoomVideoStageGrid.querySelectorAll('.zoom-tile');
  existingTiles.forEach(el => {
    const tid = el.getAttribute('data-tile-id');
    if (!activeIds.has(tid)) {
      el.remove();
    }
  });

  // Render or update each item
  for (const item of renderItems) {
    let tileEl = zoomVideoStageGrid.querySelector(`[data-tile-id="${item.tileId}"]`);
    if (!tileEl) {
      tileEl = document.createElement('div');
      tileEl.className = `zoom-tile ${item.isLocal ? 'is-local' : ''} ${item.isScreenShare ? 'screen-share-tile' : ''}`;
      tileEl.setAttribute('data-tile-id', item.tileId);
      tileEl.setAttribute('data-session-id', item.session_id);

      tileEl.innerHTML = `
        <video autoplay playsinline ${item.isLocal ? 'muted' : ''}></video>
        <div class="zoom-tile-avatar-box hidden">
          <div class="zoom-large-avatar" style="background:${item.color}">${escapeHtml((item.name || 'U').charAt(0).toUpperCase())}</div>
          <span class="zoom-avatar-label">${escapeHtml(item.name)} (Camera Off)</span>
        </div>
        <div class="zoom-tile-badge-strip"></div>
        <div class="zoom-tile-name-tag">
          <span class="zoom-tile-name">${escapeHtml(item.name)}</span>
          <span class="zoom-mic-badge">${item.isMuted ? '🔇' : '🎙️'}</span>
          <div class="zoom-speaker-wave hidden">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
      zoomVideoStageGrid.appendChild(tileEl);
    } else {
      tileEl.setAttribute('data-session-id', item.session_id);
      const nameEl = tileEl.querySelector('.zoom-tile-name');
      if (nameEl && nameEl.textContent !== item.name) nameEl.textContent = item.name;
      const micBadge = tileEl.querySelector('.zoom-mic-badge');
      if (micBadge) micBadge.textContent = item.isMuted ? '🔇' : '🎙️';
    }

    // Video stream binding
    const videoEl = tileEl.querySelector('video');
    const avatarBox = tileEl.querySelector('.zoom-tile-avatar-box');
    const badgeStrip = tileEl.querySelector('.zoom-tile-badge-strip');

    if (item.isScreenShare) {
      if (avatarBox) avatarBox.classList.add('hidden');
      if (badgeStrip) {
        badgeStrip.innerHTML = '<span class="zoom-tile-badge screen">🖥️ Screen Share</span>';
      }
      if (videoEl && item.track) {
        if (!videoEl.srcObject || videoEl.srcObject.getVideoTracks()[0] !== item.track) {
          videoEl.srcObject = new MediaStream([item.track]);
          videoEl.play().catch(() => {});
        }
      }
    } else {
      if (item.isCamOff || !item.track || item.track.readyState !== 'live') {
        if (avatarBox) avatarBox.classList.remove('hidden');
      } else {
        if (avatarBox) avatarBox.classList.add('hidden');
      }
      if (videoEl) {
        if (item.track && item.track.readyState === 'live') {
          if (!videoEl.srcObject || videoEl.srcObject.getVideoTracks()[0] !== item.track) {
            videoEl.srcObject = new MediaStream([item.track]);
            videoEl.play().catch(() => {});
          }
        } else {
          videoEl.srcObject = null;
        }
      }
    }
  }

  highlightActiveSpeaker();
}

// ─── Start / Join Video Call ──────────────────────────────────────────────────
async function joinRoomCall(targetUserId = null, peerName = null, peerColor = null, isCaller = false) {
  setMode('videocall');
  await ensureLocalCamera();

  state.isCallActive = true;
  if (targetUserId) {
    state.activeCall = {
      peerId: targetUserId,
      peerName: peerName || 'User',
      peerColor: peerColor || '#4ECDC4',
      startTime: Date.now(),
      isCaller: isCaller,
    };
  }

  if (zoomLobbyView) zoomLobbyView.classList.add('hidden');
  if (zoomActiveMeetingView) zoomActiveMeetingView.classList.remove('hidden');

  const startTime = Date.now();
  if (state.callTimerInterval) clearInterval(state.callTimerInterval);
  state.callTimerInterval = setInterval(() => {
    if (!state.isCallActive) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    if (zoomCallDuration) zoomCallDuration.textContent = `${m}:${s}`;
  }, 1000);
  if (zoomCallDuration) zoomCallDuration.textContent = '00:00';

  if (zoomMeetingTitle) {
    zoomMeetingTitle.textContent = peerName ? `Video Call with ${peerName}` : `Video Call: Room ${state.roomId || 'lobby'}`;
  }

  // Attempt Daily.co SFU room join
  let dailyConnected = false;
  try {
    const res = await fetch(`/api/daily-room?room=${encodeURIComponent(state.roomId || 'lobby')}`);
    const data = await res.json();
    if (data && data.roomUrl && window.Daily) {
      const call = await initDailyCallObject();
      if (call) {
        await call.join({
          url: data.roomUrl,
          userName: state.userName || 'Guest',
          audioSource: !state.isMicMuted,
          videoSource: !state.isCamOff,
        });
        dailyConnected = true;
        state.isDailyConnected = true;
        if (zoomSfuBadge) {
          zoomSfuBadge.textContent = '⚡ Daily.co SFU';
        }
      }
    }
  } catch (err) {
    console.warn('Daily SFU join skipped or failed, activating WebRTC fallback:', err);
  }

  if (!dailyConnected) {
    state.isDailyConnected = false;
    if (zoomSfuBadge) {
      zoomSfuBadge.textContent = '⚡ WebRTC Mesh';
    }
    if (targetUserId) {
      initiatePeerConnection(targetUserId);
    } else {
      for (const [id] of state.userMap) {
        if (id !== state.userId) initiatePeerConnection(id);
      }
    }
  }

  updateCameraUI();
  updateMicUI();
  renderZoomGrid();
  playChime('connect');
  showVideoToast(`📞 Video call active`);
}

async function leaveActiveCall(reason = 'Call Ended') {
  if (state.callTimerInterval) {
    clearInterval(state.callTimerInterval);
    state.callTimerInterval = null;
  }
  state.isCallActive = false;

  if (state.isScreenSharing) {
    await stopScreenShare();
  }

  if (state.dailyCall) {
    try {
      await state.dailyCall.leave();
      state.dailyCall.destroy();
    } catch (e) {}
    state.dailyCall = null;
  }
  state.isDailyConnected = false;

  if (state.activeCall) {
    wsSend({
      type: 'call_ended',
      targetUserId: state.activeCall.peerId,
    });
    closePeerConnection(state.activeCall.peerId);
    state.activeCall = null;
  }

  if (zoomActiveMeetingView) zoomActiveMeetingView.classList.add('hidden');
  if (zoomLobbyView) zoomLobbyView.classList.remove('hidden');

  renderZoomLobby();
  playChime('disconnect');
  showVideoToast(`🔴 ${reason}`);
}

// ─── Direct Video Calling Signaling ───────────────────────────────────────────
async function startCall(targetUserId) {
  const target = state.userMap.get(targetUserId);
  if (!target) return;

  await ensureLocalCamera();

  state.pendingOutgoingCall = {
    targetUserId,
    targetName: target.name || 'User',
    timeout: setTimeout(() => {
      cancelOutgoingCall();
      showVideoToast(`⌛ ${target.name || 'User'} did not answer`);
    }, 30000),
  };

  if (zoomCallingAvatar) {
    zoomCallingAvatar.textContent = (target.name || 'U').charAt(0).toUpperCase();
    zoomCallingAvatar.style.background = target.color || '#4ECDC4';
  }
  if (zoomCallingName) {
    zoomCallingName.textContent = `Calling ${target.name || 'User'}...`;
  }
  if (zoomCallingOverlay) {
    zoomCallingOverlay.classList.remove('hidden');
  }

  playRingtone();

  wsSend({
    type: 'call_user',
    targetUserId,
  });
}

function cancelOutgoingCall() {
  if (!state.pendingOutgoingCall) return;
  const { targetUserId } = state.pendingOutgoingCall;
  clearTimeout(state.pendingOutgoingCall.timeout);
  state.pendingOutgoingCall = null;

  stopRingtone();
  if (zoomCallingOverlay) zoomCallingOverlay.classList.add('hidden');

  wsSend({
    type: 'call_cancelled',
    targetUserId,
  });
}

function handleIncomingCall(msg) {
  state.pendingIncomingCall = {
    fromUserId: msg.fromUserId,
    fromName: msg.fromName || 'User',
    fromColor: msg.fromColor || '#4ECDC4',
  };

  if (zoomIncomingAvatar) {
    zoomIncomingAvatar.textContent = (msg.fromName || 'U').charAt(0).toUpperCase();
    zoomIncomingAvatar.style.background = msg.fromColor || '#4ECDC4';
  }
  if (zoomIncomingName) {
    zoomIncomingName.textContent = msg.fromName || 'User';
  }
  if (zoomIncomingOverlay) {
    zoomIncomingOverlay.classList.remove('hidden');
  }

  playRingtone();
}

function declineIncomingCall() {
  if (!state.pendingIncomingCall) return;
  const { fromUserId } = state.pendingIncomingCall;
  state.pendingIncomingCall = null;

  stopRingtone();
  if (zoomIncomingOverlay) zoomIncomingOverlay.classList.add('hidden');

  wsSend({
    type: 'call_declined',
    targetUserId: fromUserId,
    reason: 'declined',
  });
}

async function acceptIncomingCall() {
  if (!state.pendingIncomingCall) return;
  const { fromUserId, fromName, fromColor } = state.pendingIncomingCall;
  state.pendingIncomingCall = null;

  stopRingtone();
  if (zoomIncomingOverlay) zoomIncomingOverlay.classList.add('hidden');

  wsSend({
    type: 'call_accepted',
    targetUserId: fromUserId,
  });

  await joinRoomCall(fromUserId, fromName, fromColor, false);
}

async function handleCallAccepted(msg) {
  if (state.pendingOutgoingCall) {
    clearTimeout(state.pendingOutgoingCall.timeout);
    state.pendingOutgoingCall = null;
  }

  stopRingtone();
  if (zoomCallingOverlay) zoomCallingOverlay.classList.add('hidden');

  const peer = state.userMap.get(msg.fromUserId);
  const peerName = msg.fromName || (peer ? peer.name : 'User');
  const peerColor = peer ? peer.color : '#4ECDC4';

  await joinRoomCall(msg.fromUserId, peerName, peerColor, true);
}

function handleCallDeclined(msg) {
  if (state.pendingOutgoingCall) {
    clearTimeout(state.pendingOutgoingCall.timeout);
    state.pendingOutgoingCall = null;
  }
  stopRingtone();
  if (zoomCallingOverlay) zoomCallingOverlay.classList.add('hidden');
  showVideoToast(`🔴 ${msg.fromName || 'User'} declined the call`);
  playChime('disconnect');
}

function handleCallCancelled(msg) {
  if (state.pendingIncomingCall && state.pendingIncomingCall.fromUserId === msg.fromUserId) {
    state.pendingIncomingCall = null;
    stopRingtone();
    if (zoomIncomingOverlay) zoomIncomingOverlay.classList.add('hidden');
    showVideoToast('ℹ️ Caller cancelled the call');
  }
}

function handleCallEnded(msg) {
  if (state.isCallActive && state.activeCall && state.activeCall.peerId === msg.fromUserId) {
    const peerName = state.activeCall.peerName;
    leaveActiveCall(`${peerName} ended the call`);
  }
}

function renderZoomLobby() {
  if (!zoomLobbyView) return;

  if (zoomLobbyRoomTag) {
    zoomLobbyRoomTag.textContent = 'Room: ' + (state.roomId || 'lobby');
  }

  if (zoomPreviewMyName) {
    zoomPreviewMyName.textContent = (state.userName || 'You') + ' (Ready)';
  }

  if (zoomPreviewAvatarCircle) {
    zoomPreviewAvatarCircle.textContent = (state.userName || 'Y').charAt(0).toUpperCase();
    zoomPreviewAvatarCircle.style.background = state.color || '#4ECDC4';
  }

  // Attach local stream to preview video
  if (zoomPreviewVideo && state.localVideoStream && zoomPreviewVideo.srcObject !== state.localVideoStream) {
    zoomPreviewVideo.srcObject = state.localVideoStream;
    zoomPreviewVideo.play().catch(() => {});
  }

  // Online peers directory
  const peers = [...state.userMap.values()].filter(u => u.id !== state.userId);

  if (zoomAvailableCount) {
    zoomAvailableCount.textContent = `${peers.length} other${peers.length === 1 ? '' : 's'} online`;
  }

  if (peers.length === 0) {
    if (zoomEmptyPeers) zoomEmptyPeers.classList.remove('hidden');
    if (zoomPeersList) zoomPeersList.innerHTML = '';
  } else {
    if (zoomEmptyPeers) zoomEmptyPeers.classList.add('hidden');
    if (zoomPeersList) {
      zoomPeersList.innerHTML = peers.map(u => {
        const initial = (u.name || 'U').charAt(0).toUpperCase();
        return `
          <div class="zoom-peer-card">
            <div class="zoom-peer-user-info">
              <div class="zoom-peer-avatar" style="background:${u.color || '#4ECDC4'}">${escapeHtml(initial)}</div>
              <div class="zoom-peer-details">
                <span class="zoom-peer-name">${escapeHtml(u.name || 'User')}</span>
                <span class="zoom-peer-status">
                  <span class="preview-dot"></span>
                  Ready to call
                </span>
              </div>
            </div>
            <button class="zoom-btn-call" data-user-id="${escapeHtml(u.id)}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <span>Video Call</span>
            </button>
          </div>
        `;
      }).join('');

      // Wire call buttons
      zoomPeersList.querySelectorAll('.zoom-btn-call').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-user-id');
          if (targetId) startCall(targetId);
        });
      });
    }
  }
}

// ─── Button Listeners ───
if (zoomJoinRoomCallBtn) {
  zoomJoinRoomCallBtn.addEventListener('click', () => joinRoomCall());
}

if (zoomCancelCallBtn) {
  zoomCancelCallBtn.addEventListener('click', cancelOutgoingCall);
}

if (zoomAcceptCallBtn) {
  zoomAcceptCallBtn.addEventListener('click', acceptIncomingCall);
}

if (zoomDeclineCallBtn) {
  zoomDeclineCallBtn.addEventListener('click', declineIncomingCall);
}

if (zoomEndCallBtn) {
  zoomEndCallBtn.addEventListener('click', () => {
    leaveActiveCall('You left the call');
  });
}

if (zoomScreenShareBtn) {
  zoomScreenShareBtn.addEventListener('click', toggleScreenShare);
}

if (zoomPreviewCamToggle) {
  zoomPreviewCamToggle.addEventListener('click', toggleCamera);
}

if (zoomCallCamBtn) {
  zoomCallCamBtn.addEventListener('click', toggleCamera);
}

if (zoomPreviewMicToggle) {
  zoomPreviewMicToggle.addEventListener('click', toggleMicrophone);
}

if (zoomCallMicBtn) {
  zoomCallMicBtn.addEventListener('click', toggleMicrophone);
}

if (zoomCopyLinkBtn) {
  zoomCopyLinkBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showVideoToast('📋 Room link copied to clipboard!');
    }).catch(() => {
      prompt('Share this URL to invite friends:', url);
    });
  });
}

if (zoomStageFullscreenBtn) {
  zoomStageFullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      if (zoomActiveMeetingView && zoomActiveMeetingView.requestFullscreen) {
        zoomActiveMeetingView.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  });
}

function getOrCreatePeerConnection(targetUserId) {
  if (state.voiceConnections.has(targetUserId)) {
    return state.voiceConnections.get(targetUserId);
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);
  const audioEl = new Audio();
  audioEl.autoplay = true;
  audioEl.setAttribute('data-peer-id', targetUserId);
  if (remoteAudiosContainer) {
    remoteAudiosContainer.appendChild(audioEl);
  }

  const conn = {
    pc,
    audioEl,
    targetUserId,
    candidateQueue: [],
    hasRemoteDescription: false,
    remoteVideoStream: null,
  };
  state.voiceConnections.set(targetUserId, conn);

  if (state.localAudioStream && state.localAudioStream.getAudioTracks().length > 0) {
    state.localAudioStream.getAudioTracks().forEach(track => {
      try { pc.addTrack(track, state.localAudioStream); } catch (e) {}
    });
  } else {
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {}
  }

  if (state.localVideoStream && state.localVideoStream.getVideoTracks().length > 0) {
    state.localVideoStream.getVideoTracks().forEach(track => {
      try { pc.addTrack(track, state.localVideoStream); } catch (e) {}
    });
  } else {
    try {
      pc.addTransceiver('video', { direction: 'sendrecv' });
    } catch (e) {}
  }

  pc.ontrack = (event) => {
    if (event.track.kind === 'audio') {
      if (event.streams && event.streams[0]) {
        audioEl.srcObject = event.streams[0];
        const p = audioEl.play();
        if (p !== undefined) {
          p.catch(err => console.warn(`Autoplay deferred for peer ${targetUserId}:`, err));
        }
      }
    } else if (event.track.kind === 'video') {
      const vStream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      conn.remoteVideoStream = vStream;
      renderZoomGrid();
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      wsSend({
        type : 'voice_signal',
        to   : targetUserId,
        data : {
          type      : 'candidate',
          candidate : event.candidate,
        },
      });
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      closePeerConnection(targetUserId);
    }
  };

  return conn;
}

async function initiatePeerConnection(targetUserId) {
  if (!state.voiceSupported || targetUserId === state.userId) return;
  const conn = getOrCreatePeerConnection(targetUserId);
  try {
    const offer = await conn.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await conn.pc.setLocalDescription(offer);
    wsSend({
      type : 'voice_signal',
      to   : targetUserId,
      data : {
        type : 'offer',
        sdp  : offer,
      },
    });
  } catch (err) {
    console.warn(`Failed to create offer for ${targetUserId}:`, err);
  }
}

async function handleVoiceSignal(msg) {
  const senderId = msg.from;
  const data = msg.data;
  if (!senderId || !data) return;

  const conn = getOrCreatePeerConnection(senderId);

  try {
    if (data.type === 'offer') {
      const isOfferCollision = conn.pc.signalingState !== 'stable';
      const isPolite = state.userId < senderId;
      if (isOfferCollision && !isPolite) {
        return;
      }

      await conn.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      conn.hasRemoteDescription = true;

      while (conn.candidateQueue.length > 0) {
        const c = conn.candidateQueue.shift();
        try {
          await conn.pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (e) {}
      }

      if (state.localAudioStream) {
        const senders = conn.pc.getSenders();
        state.localAudioStream.getAudioTracks().forEach(track => {
          if (!senders.some(s => s.track === track)) {
            try { conn.pc.addTrack(track, state.localAudioStream); } catch (e) {}
          }
        });
      }

      if (state.localVideoStream) {
        const senders = conn.pc.getSenders();
        state.localVideoStream.getVideoTracks().forEach(track => {
          if (!senders.some(s => s.track === track)) {
            try { conn.pc.addTrack(track, state.localVideoStream); } catch (e) {}
          }
        });
      }

      const answer = await conn.pc.createAnswer();
      await conn.pc.setLocalDescription(answer);

      wsSend({
        type : 'voice_signal',
        to   : senderId,
        data : {
          type : 'answer',
          sdp  : answer,
        },
      });
    } else if (data.type === 'answer') {
      if (conn.pc.signalingState === 'have-local-offer') {
        await conn.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        conn.hasRemoteDescription = true;

        while (conn.candidateQueue.length > 0) {
          const c = conn.candidateQueue.shift();
          try {
            await conn.pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {}
        }
      }
    } else if (data.type === 'candidate' && data.candidate) {
      if (conn.hasRemoteDescription && conn.pc.remoteDescription) {
        try {
          await conn.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {}
      } else {
        conn.candidateQueue.push(data.candidate);
      }
    }
  } catch (err) {
    console.warn(`Voice signal error from ${senderId}:`, err);
  }
}

function closePeerConnection(userId) {
  const conn = state.voiceConnections.get(userId);
  if (!conn) return;
  try { conn.pc.close(); } catch (e) {}
  try {
    conn.audioEl.srcObject = null;
    conn.audioEl.remove();
  } catch (e) {}
  state.voiceConnections.delete(userId);
  renderZoomGrid();
}

function cleanupVoiceChat() {
  for (const [id] of state.voiceConnections) {
    closePeerConnection(id);
  }
  if (state.localAudioStream) {
    state.localAudioStream.getTracks().forEach(t => t.stop());
    state.localAudioStream = null;
  }
  if (state.localVideoStream) {
    state.localVideoStream.getTracks().forEach(t => t.stop());
    state.localVideoStream = null;
  }
  if (state.voiceVisualizerInterval) {
    clearInterval(state.voiceVisualizerInterval);
    state.voiceVisualizerInterval = null;
  }
  if (state.audioContext) {
    try { state.audioContext.close(); } catch (e) {}
    state.audioContext = null;
  }
  stopRingtone();
  updateVoiceUI('muted', 'Voice Off');
}

// ─── Close WebSocket & Clean Voice on Page Unload ─────────────────────────────
window.addEventListener('beforeunload', () => {
  cleanupVoiceChat();
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.close();
  }
});
