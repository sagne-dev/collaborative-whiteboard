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
const exploreFeaturesLink = document.getElementById('explore-features-link');
const loginBackToIntroBtn = document.getElementById('login-back-to-intro-btn');
const loginBrandLogo    = document.getElementById('login-brand-logo');

// Intro / Onboarding Screen (Shown First)
const introScreen       = document.getElementById('intro-screen');
const introRoomLabel    = document.getElementById('intro-room-label');
const introBackBtn      = document.getElementById('intro-back-btn');
const introExploreBtn   = document.getElementById('intro-explore-btn');
const introLaunchBtn    = document.getElementById('intro-launch-btn');
const introLaunchP2Btn  = document.getElementById('intro-launch-p2-btn');
const introLaunchMobileBtn = document.getElementById('intro-launch-mobile-btn');
const introToPage2Btn   = document.getElementById('intro-to-page2-btn');
const introBackToPage1Btn = document.getElementById('intro-back-to-page1-btn');
const introPage1        = document.getElementById('intro-page-1');
const introPage2        = document.getElementById('intro-page-2');
const introDots         = document.querySelectorAll('.intro-dot');
const introColCards     = document.querySelectorAll('.intro-col-card');

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
const zoomChatToggleBtn       = document.getElementById('zoom-chat-toggle-btn');
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

// Top In-App Chat Notification Pop-Up (Telegram / Instagram Style)
const chatNotificationPopup = document.getElementById('chat-notification-popup');
const chatPopupCard         = document.getElementById('chat-popup-card');
const chatPopupAvatar       = document.getElementById('chat-popup-avatar');
const chatPopupSender       = document.getElementById('chat-popup-sender');
const chatPopupText         = document.getElementById('chat-popup-text');
const chatPopupClose        = document.getElementById('chat-popup-close');

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

  // WebRTC Voice & Video Calling state (Synchronized Audio/Video & Lip-Sync)
  localStream             : new MediaStream(),
  localAudioStream        : null,
  localVideoStream        : null,
  localAudioTrack         : null,
  localVideoTrack         : null,
  localScreenTrack        : null,
  isMicMuted              : false,
  isCamOff                : false,
  voiceConnections        : new Map(), // remoteUserId -> { pc, audioEl, candidateQueue, hasRemoteDescription, remoteStream, ... }
  audioContext            : null,
  analyserNode            : null,
  voiceVisualizerInterval : null,
  voiceSupported          : typeof window !== 'undefined' && !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  activeCall              : null, // { peerId, peerName, peerColor, startTime, timerInterval, isCaller }
  pendingOutgoingCall     : null, // { targetUserId, targetName, timeout }
  pendingIncomingCall     : null, // { fromUserId, fromName, fromColor }
  zoomViewLayout          : 'grid', // 'grid' | 'focus'
  isCallActive            : false,
  callTimerInterval       : null,
  activeSpeakerId         : null,
  isLocalSpeaking         : false,
  isScreenSharing         : false,
  localScreenStream       : null,
  currentFacingMode       : 'user', // 'user' (front) or 'environment' (back) for mobile phones
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
    if (chatSidebar) chatSidebar.classList.add('mode-hidden');
    requestAnimationFrame(() => {
      resizeCanvas();
      redrawAll();
    });
  } else if (newMode === 'watchparty') {
    if (chatSidebar) chatSidebar.classList.remove('mode-hidden');
    state.unreadMessages = 0;
    updateChatBadges();

    wsSend({ type: 'video_sync_request' });
    scrollToChatBottom();
  } else if (newMode === 'videocall') {
    if (chatSidebar) chatSidebar.classList.remove('mode-hidden');
    scrollToChatBottom();

    if (zoomActiveMeetingView) zoomActiveMeetingView.classList.remove('hidden');
    if (!state.isCallActive || !state.localVideoTrack || state.localVideoTrack.readyState !== 'live') {
      joinRoomCall();
    } else {
      renderZoomGrid();
    }
  }

  // Route remote audio: In 'videocall' mode, the tile's <video> plays audio for native lip-sync.
  // In whiteboard / watchparty mode, background audioEl plays audio for voice chat.
  for (const [, conn] of state.voiceConnections) {
    if (conn.audioEl) {
      conn.audioEl.muted = (newMode === 'videocall');
      if (newMode !== 'videocall') {
        conn.audioEl.play().catch(() => {});
      }
    }
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
function handleViewportChange() {
  if (state.currentMode === 'whiteboard') {
    requestAnimationFrame(() => resizeCanvas());
  } else if (state.currentMode === 'videocall') {
    requestAnimationFrame(() => renderZoomGrid());
  }
}

window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', () => {
  setTimeout(handleViewportChange, 150);
});

function renderStroke(stroke) {
  const pts = stroke.points;
  if (!pts || pts.length < 1) return;
  const isLight = document.body.classList.contains('light-theme') || 
                  document.documentElement.getAttribute('data-theme') === 'light';
  let strokeColor = stroke.color;
  if (isLight && (strokeColor === '#ffffff' || strokeColor === '#fff')) {
    strokeColor = '#000000';
  } else if (!isLight && (strokeColor === '#000000' || strokeColor === '#000')) {
    strokeColor = '#ffffff';
  }
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = stroke.width;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  if (pts.length === 1) {
    ctx.arc(pts[0][0], pts[0][1], stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
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

// Expose internals for AI features module
window._appWs = () => state.ws;
window._appSetTool = (tool) => { state.tool = tool; };
window._appGetActiveTool = () => state.tool;
window._appGetStrokes = () => [...state.strokes.values()].filter(s => !state.deleted.has(s.id));
window._aiWsSend = wsSend;

// ─── Message Dispatcher ───────────────────────────────────────────────────────
function handleMessage(msg) {
  switch (msg.type) {

    // ── Room Init ──
    case 'init': {
      state.userId    = msg.userId;
      state.userColor = msg.color;
      state.color     = msg.color;
      state.userName  = msg.name || state.userName;

      if (colorPicker) colorPicker.value = msg.color;
      if (colorPreview) colorPreview.style.background = msg.color;
      if (navUserDot) navUserDot.style.background = msg.color;
      if (navUserName) navUserName.textContent = state.userName;
      if (navRoomLabel) navRoomLabel.textContent = 'Room: ' + msg.roomId;
      if (roomLabel) roomLabel.textContent = '';

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
        if (u.id !== state.userId) {
          addCursorEl(u.id, u.color, u.name);
          if (state.voiceSupported) {
            getOrCreatePeerConnection(u.id);
            if (state.userId > u.id) {
              initiatePeerConnection(u.id);
            }
          }
        }
      }
      renderUserList();
      renderZoomGrid();
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
      if (state.voiceSupported && msg.userId !== state.userId) {
        getOrCreatePeerConnection(msg.userId);
        if (state.userId > msg.userId) {
          initiatePeerConnection(msg.userId);
        }
      }
      renderZoomGrid();
      break;
    }

    case 'user_left': {
      const leavingName = state.userMap.get(msg.userId)?.name || 'User';
      state.userMap.delete(msg.userId);
      removeCursor(msg.userId);
      closePeerConnection(msg.userId);
      renderUserList();
      renderZoomGrid();

      if (state.activeCall && state.activeCall.peerId === msg.userId) {
        leaveActiveCall(`${leavingName} left the room`);
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

    // ── AI Features ──
    case 'ai_3d_model': {
      if ((msg.points || msg.shapeType) && window._aiShow3D) {
        window._aiShow3D(msg);
      }
      break;
    }

    case 'ai_math_graph': {
      if (msg.expression && window._aiShowMathPanel) {
        window._aiShowMathPanel(msg);
      }
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
  if (window._aiOnStrokeStart) window._aiOnStrokeStart(state.tool);
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
  if (window._aiOnStrokeFinish) window._aiOnStrokeFinish(stroke, state.tool);
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
        ${isMe ? '<em>(you)</em>' : `<button type="button" class="direct-call-btn" data-user-id="${escapeHtml(u.id)}" title="Call ${escapeHtml(u.name || 'User')}">📞 Call</button>`}
      </li>
    `;
  }).join('');

  userList.querySelectorAll('.direct-call-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-user-id');
      if (targetId) startCall(targetId);
    });
  });
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
    if (window._aiOnToolChange) window._aiOnToolChange(state.tool);
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
  videoTypeTag.style.background = 'rgba(255, 255, 255, 0.08)';
  videoTypeTag.style.color = '#ffffff';

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
  videoTypeTag.style.background = 'rgba(255, 255, 255, 0.08)';
  videoTypeTag.style.color = '#ffffff';
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
  videoTypeTag.style.background = 'rgba(255, 255, 255, 0.08)';
  videoTypeTag.style.color = '#ffffff';
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
    if (state.currentMode === 'watchparty') {
      theaterChatBtn.classList.remove('hidden');
    }
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
    const authorColor = item.color || '#ffffff';

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

  if (isLive && !isMine && !item.isSystem) {
    showChatNotificationPopup(item.name || 'User', item.text, item.color);
  }

  if (isLive && !isMine && (state.isChatCollapsed || (state.currentMode !== 'watchparty' && state.currentMode !== 'videocall'))) {
    state.unreadMessages++;
    updateChatBadges();
  }
}

function formatChatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Telegram / Instagram Style In-App Chat Notification Pop-Up ───────────────
let chatPopupTimer = null;
let chatPopupAnimTimer = null;
let touchStartY = 0;

function playMessageNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime || 0;

    // Dual-tone chime (Instagram / Telegram style: 587Hz -> 880Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.23);
    osc2.stop(now + 0.23);

    setTimeout(() => {
      try { ctx.close(); } catch (_) {}
    }, 300);
  } catch (_) {
    // Autoplay restrictions or audio device unavailable
  }
}

function showChatNotificationPopup(senderName, messageText, color) {
  const popupEl  = chatNotificationPopup || document.getElementById('chat-notification-popup');
  const senderEl = chatPopupSender || document.getElementById('chat-popup-sender');
  const textEl   = chatPopupText || document.getElementById('chat-popup-text');
  const avatarEl = chatPopupAvatar || document.getElementById('chat-popup-avatar');

  if (!popupEl || !senderEl || !textEl) return;

  const safeName = senderName || 'Someone';
  senderEl.textContent = safeName;
  textEl.textContent = messageText || '';

  if (avatarEl) {
    const initial = safeName.trim().charAt(0).toUpperCase() || 'U';
    avatarEl.textContent = initial;
    avatarEl.style.background = '#ffffff';
    avatarEl.style.color = '#000000';
  }

  // Clear existing timers
  if (chatPopupTimer) clearTimeout(chatPopupTimer);
  if (chatPopupAnimTimer) clearTimeout(chatPopupAnimTimer);

  // Directly set display block so CSS .hidden or media queries never suppress it on mobile
  popupEl.style.display = 'block';

  // Animate in or bounce
  if (!popupEl.classList.contains('hidden') && popupEl.classList.contains('animate-in')) {
    popupEl.classList.remove('animate-in', 'animate-out', 'animate-bounce');
    void popupEl.offsetWidth; // force browser layout reflow
    popupEl.classList.add('animate-bounce');
  } else {
    popupEl.classList.remove('hidden', 'animate-out', 'animate-bounce');
    void popupEl.offsetWidth;
    popupEl.classList.add('animate-in');
  }

  // Mobile haptic vibration if supported (Telegram/Instagram style)
  try {
    if (navigator.vibrate) {
      navigator.vibrate([35, 45, 35]);
    }
  } catch (_) {}

  // Play audio in safe async tick
  setTimeout(() => {
    playMessageNotificationSound();
  }, 10);

  // Auto-dismiss after 4.5 seconds
  chatPopupTimer = setTimeout(() => {
    dismissChatNotificationPopup();
  }, 4500);
}

function dismissChatNotificationPopup() {
  const popupEl = chatNotificationPopup || document.getElementById('chat-notification-popup');
  if (!popupEl || popupEl.style.display === 'none' || popupEl.classList.contains('hidden')) return;

  if (chatPopupTimer) clearTimeout(chatPopupTimer);

  popupEl.classList.remove('animate-in', 'animate-bounce');
  popupEl.classList.add('animate-out');

  chatPopupAnimTimer = setTimeout(() => {
    popupEl.style.display = 'none';
    popupEl.classList.add('hidden');
    popupEl.classList.remove('animate-out');
  }, 270);
}

// Bind close button
const popupCloseBtn = chatPopupClose || document.getElementById('chat-popup-close');
if (popupCloseBtn) {
  popupCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    dismissChatNotificationPopup();
  });
}

// Bind card tap / click (works on touch and click)
const popupCardEl = chatPopupCard || document.getElementById('chat-popup-card');
if (popupCardEl) {
  popupCardEl.addEventListener('click', (e) => {
    if (e.target && e.target.closest('#chat-popup-close')) return;
    dismissChatNotificationPopup();

    if (state.currentMode === 'whiteboard') {
      setMode('watchparty');
    }
    toggleChatSidebar(false);
    if (chatInput) {
      chatInput.focus();
    }
  });

  // Desktop hover pause
  popupCardEl.addEventListener('mouseenter', () => {
    if (chatPopupTimer) clearTimeout(chatPopupTimer);
  });

  popupCardEl.addEventListener('mouseleave', () => {
    const popupEl = chatNotificationPopup || document.getElementById('chat-notification-popup');
    if (popupEl && popupEl.style.display !== 'none' && !popupEl.classList.contains('hidden')) {
      chatPopupTimer = setTimeout(dismissChatNotificationPopup, 3000);
    }
  });

  // Mobile touch swipe-up to dismiss
  popupCardEl.addEventListener('touchstart', (e) => {
    if (chatPopupTimer) clearTimeout(chatPopupTimer);
    if (e.touches && e.touches[0]) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  popupCardEl.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchStartY - touchEndY > 24) {
        // Swiped up -> dismiss immediately!
        dismissChatNotificationPopup();
        return;
      }
    }
    // Resume auto-dismiss timer on mobile
    const popupEl = chatNotificationPopup || document.getElementById('chat-notification-popup');
    if (popupEl && popupEl.style.display !== 'none' && !popupEl.classList.contains('hidden')) {
      chatPopupTimer = setTimeout(dismissChatNotificationPopup, 3500);
    }
  }, { passive: true });
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
if (navRoomBadge) {
  navRoomBadge.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      if (copyHint) copyHint.classList.add('show');
      setTimeout(() => copyHint && copyHint.classList.remove('show'), 2000);
    }).catch(() => {
      prompt('Share this URL to invite friends:', url);
    });
  });
}

// ─── Join Flow ────────────────────────────────────────────────────────────────
state.userId = sessionStorage.getItem('wb_uid') || ('u_' + Math.random().toString(36).slice(2, 8));
sessionStorage.setItem('wb_uid', state.userId);

const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) roomInput.value = urlRoom;

// ─── Screen Transition Functions (Intro First -> Sign In -> Workspace) ──────
function showIntro() {
  if (cineticMenuOverlay) cineticMenuOverlay.classList.add('hidden');
  joinScreen.classList.add('hidden');
  boardScreen.classList.add('hidden');
  if (introScreen) {
    introScreen.classList.remove('hidden');
    introScreen.scrollTop = 0;
  }
}

function showSignIn() {
  if (cineticMenuOverlay) cineticMenuOverlay.classList.add('hidden');
  if (introScreen) introScreen.classList.add('hidden');
  boardScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');

  requestAnimationFrame(() => {
    if (nameInput && !nameInput.value.trim()) {
      nameInput.focus();
    } else if (roomInput) {
      roomInput.focus();
    }
  });
}

function launchWorkspace() {
  const room = roomInput.value.trim() || 'lobby';
  const name = nameInput.value.trim() || 'Guest';
  state.roomId = room;
  state.userName = name;

  history.replaceState(null, '', '?room=' + encodeURIComponent(room));

  if (introScreen) introScreen.classList.add('hidden');
  joinScreen.classList.add('hidden');
  boardScreen.classList.remove('hidden');

  requestAnimationFrame(() => {
    resizeCanvas();
  });

  // Prompt and acquire camera + microphone immediately while user click gesture is active
  ensureMediaForCall(true).finally(() => {
    connect(room, name);
  });
}

// Aliases for compatibility
function returnToSignIn() {
  showSignIn();
}

function prepareAndShowIntro() {
  showIntro();
}

// Event Listeners for Sign In & Intro Navigation
// From Sign In Form -> Launch Workspace directly
joinBtn.addEventListener('click', launchWorkspace);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') launchWorkspace(); });
roomInput.addEventListener('keydown', e => { if (e.key === 'Enter') launchWorkspace(); });

// Back to Intro from Sign In Form
if (exploreFeaturesLink) {
  exploreFeaturesLink.addEventListener('click', showIntro);
  exploreFeaturesLink.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showIntro();
    }
  });
}

if (loginBackToIntroBtn) {
  loginBackToIntroBtn.addEventListener('click', showIntro);
}

if (loginBrandLogo) {
  loginBrandLogo.addEventListener('click', showIntro);
  loginBrandLogo.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showIntro();
    }
  });
}

// From Intro Screen -> Proceed to Sign In Form
if (introLaunchBtn) {
  introLaunchBtn.addEventListener('click', showSignIn);
}
if (introLaunchP2Btn) {
  introLaunchP2Btn.addEventListener('click', showSignIn);
}
if (introLaunchMobileBtn) {
  introLaunchMobileBtn.addEventListener('click', showSignIn);
}
if (introBackBtn) {
  introBackBtn.addEventListener('click', showSignIn);
}
if (introExploreBtn) {
  introExploreBtn.addEventListener('click', () => {
    introPage2?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ── The North Face Style Hero Section Interactive Handlers ──
const heroCardSignin    = document.getElementById('hero-card-signin');
const heroCardTools     = document.getElementById('hero-card-tools');
const navLinkWhiteboard = document.getElementById('nav-link-whiteboard');
const navLinkWatchParty = document.getElementById('nav-link-watchparty');
const navLinkVideoCall  = document.getElementById('nav-link-videocall');
const navLinkJoin       = document.getElementById('nav-link-join');
const nfRoomBtn         = document.getElementById('nf-room-btn');
const nfHeroBrand       = document.getElementById('nf-hero-brand');
const heroBgVideo       = document.querySelector('.hero-bg-video');

if (heroCardSignin) {
  heroCardSignin.addEventListener('click', showSignIn);
}

if (heroCardTools) {
  heroCardTools.addEventListener('click', () => {
    introPage2?.scrollIntoView({ behavior: 'smooth' });
  });
}

if (navLinkWhiteboard) {
  navLinkWhiteboard.addEventListener('click', () => {
    introPage2?.scrollIntoView({ behavior: 'smooth' });
    const card = document.querySelector('.intro-col-card[data-card="whiteboard"]');
    if (card) {
      document.querySelectorAll('.intro-col-card').forEach(c => c.classList.remove('active-revealed'));
      card.classList.add('active-revealed');
    }
  });
}

if (navLinkWatchParty) {
  navLinkWatchParty.addEventListener('click', () => {
    introPage2?.scrollIntoView({ behavior: 'smooth' });
    const card = document.querySelector('.intro-col-card[data-card="watchparty"]');
    if (card) {
      document.querySelectorAll('.intro-col-card').forEach(c => c.classList.remove('active-revealed'));
      card.classList.add('active-revealed');
    }
  });
}

if (navLinkVideoCall) {
  navLinkVideoCall.addEventListener('click', () => {
    introPage2?.scrollIntoView({ behavior: 'smooth' });
    const card = document.querySelector('.intro-col-card[data-card="videocall"]');
    if (card) {
      document.querySelectorAll('.intro-col-card').forEach(c => c.classList.remove('active-revealed'));
      card.classList.add('active-revealed');
    }
  });
}

if (navLinkJoin) {
  navLinkJoin.addEventListener('click', showSignIn);
}

if (nfRoomBtn) {
  nfRoomBtn.addEventListener('click', showSignIn);
}

if (nfHeroBrand) {
  nfHeroBrand.addEventListener('click', () => {
    introPage1?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ── Seamless Dual-Buffer Looping Video Controller with Anti-Stutter Watchdog ──
function initSeamlessVideoLoop() {
  const videoA = document.getElementById('hero-bg-video-a');
  const videoB = document.getElementById('hero-bg-video-b');
  const introScreen = document.getElementById('intro-screen');

  if (!videoA) return;

  // Single video fallback if videoB is absent
  if (!videoB) {
    videoA.muted = true;
    videoA.defaultMuted = true;
    videoA.playsInline = true;
    videoA.loop = true;
    const playSingle = () => videoA.play().catch(() => {});
    playSingle();
    ['pointerdown', 'touchstart', 'keydown'].forEach(evt => {
      window.addEventListener(evt, playSingle, { once: true, passive: true });
    });
    return;
  }

  // Dual-buffered gapless crossfade configuration
  [videoA, videoB].forEach(v => {
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = false; // Seamlessly transitioned via script
  });

  let currentVideo = videoA;
  let nextVideo = videoB;
  let isTransitioning = false;

  // Begin next video 450ms before current track ends to completely eliminate hardware seek latency
  const leadTime = 0.45;

  const performCrossfade = () => {
    if (isTransitioning) return;
    isTransitioning = true;

    try {
      nextVideo.currentTime = 0;
    } catch (_) {}

    const playPromise = nextVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Swap active classes for smooth CSS crossfade
        nextVideo.classList.add('active');
        currentVideo.classList.remove('active');

        // Allow 420ms for the 400ms opacity transition to finish, then pause and reset the old video
        setTimeout(() => {
          try {
            currentVideo.pause();
            currentVideo.currentTime = 0;
          } catch (_) {}
          const temp = currentVideo;
          currentVideo = nextVideo;
          nextVideo = temp;
          isTransitioning = false;
        }, 420);
      }).catch(() => {
        // Fallback: if next video play failed, rewind current video to 0 and continue
        try {
          currentVideo.currentTime = 0;
          currentVideo.play().catch(() => {});
        } catch (_) {}
        isTransitioning = false;
      });
    } else {
      nextVideo.classList.add('active');
      currentVideo.classList.remove('active');
      setTimeout(() => {
        try {
          currentVideo.pause();
          currentVideo.currentTime = 0;
        } catch (_) {}
        const temp = currentVideo;
        currentVideo = nextVideo;
        nextVideo = temp;
        isTransitioning = false;
      }, 420);
    }
  };

  const onTimeUpdate = (e) => {
    const vid = e.target;
    if (vid !== currentVideo) return;
    if (vid.duration && vid.duration > 1) {
      if (vid.currentTime >= vid.duration - leadTime) {
        performCrossfade();
      }
    }
  };

  const onEnded = (e) => {
    const vid = e.target;
    if (vid === currentVideo) {
      performCrossfade();
    }
  };

  videoA.addEventListener('timeupdate', onTimeUpdate);
  videoB.addEventListener('timeupdate', onTimeUpdate);
  videoA.addEventListener('ended', onEnded);
  videoB.addEventListener('ended', onEnded);

  // Watchdog: Ensure video never stays paused/stalled while intro screen is visible
  const isIntroVisible = () => {
    return introScreen && !introScreen.classList.contains('hidden');
  };

  const ensurePlaying = () => {
    if (!isIntroVisible()) return;
    const active = currentVideo.classList.contains('active') ? currentVideo : (nextVideo.classList.contains('active') ? nextVideo : currentVideo);
    if (active.paused || active.ended) {
      active.play().catch(() => {});
    }
  };

  // Start initial playback
  currentVideo.classList.add('active');
  nextVideo.classList.remove('active');
  currentVideo.play().catch(() => {
    // Retry on user interaction if browser blocked autoplay policy
    const userUnlock = () => {
      ensurePlaying();
      window.removeEventListener('pointerdown', userUnlock);
      window.removeEventListener('touchstart', userUnlock);
      window.removeEventListener('keydown', userUnlock);
    };
    window.addEventListener('pointerdown', userUnlock, { once: true, passive: true });
    window.addEventListener('touchstart', userUnlock, { once: true, passive: true });
    window.addEventListener('keydown', userUnlock, { once: true, passive: true });
  });

  // Watchdog event listeners for tab focus, visibility change, low-power unfreezes, touch/scroll events
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) ensurePlaying();
  });
  window.addEventListener('focus', ensurePlaying);
  window.addEventListener('pageshow', ensurePlaying);
  ['pointerdown', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, ensurePlaying, { passive: true });
  });

  // Periodic watchdog interval (every 400ms) to revive video if browser throttles or freezes playback
  setInterval(ensurePlaying, 400);
}

// Initialize continuous seamless loop
initSeamlessVideoLoop();

// ── Cinetic Menu Toggle & Navigation Links ──
const introMenuBtn        = document.getElementById('intro-menu-btn');
const cineticMenuOverlay  = document.getElementById('cinetic-menu-overlay');
const cineticMenuCloseBtn = document.getElementById('cinetic-menu-close-btn');
const menuLinkOverview    = document.getElementById('menu-link-overview');
const menuLinkTools       = document.getElementById('menu-link-tools');
const menuLinkLaunch      = document.getElementById('menu-link-launch');
const menuLinkSignin      = document.getElementById('menu-link-signin');

if (introMenuBtn && cineticMenuOverlay) {
  introMenuBtn.addEventListener('click', () => {
    cineticMenuOverlay.classList.toggle('hidden');
  });
}
if (cineticMenuCloseBtn && cineticMenuOverlay) {
  cineticMenuCloseBtn.addEventListener('click', () => {
    cineticMenuOverlay.classList.add('hidden');
  });
}
if (menuLinkOverview) {
  menuLinkOverview.addEventListener('click', () => {
    cineticMenuOverlay?.classList.add('hidden');
    introPage1?.scrollIntoView({ behavior: 'smooth' });
  });
}
if (menuLinkTools) {
  menuLinkTools.addEventListener('click', () => {
    cineticMenuOverlay?.classList.add('hidden');
    introPage2?.scrollIntoView({ behavior: 'smooth' });
  });
}
if (menuLinkLaunch) {
  menuLinkLaunch.addEventListener('click', () => {
    cineticMenuOverlay?.classList.add('hidden');
    showSignIn();
  });
}
if (menuLinkSignin) {
  menuLinkSignin.addEventListener('click', () => {
    cineticMenuOverlay?.classList.add('hidden');
    showSignIn();
  });
}

// ── Dark / Light Mode Theme System ──
const themeToggleLogin = document.getElementById('theme-toggle-login');
const themeToggleIntro = document.getElementById('theme-toggle-intro');
const themeToggleNav   = document.getElementById('theme-toggle-nav');
const menuLinkTheme    = document.getElementById('menu-link-theme');
const menuThemeText    = document.getElementById('menu-theme-text');

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  document.body.classList.toggle('light-theme', isLight);

  const newTitle = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.setAttribute('title', newTitle);
    btn.setAttribute('aria-label', newTitle);
  });

  if (menuThemeText) {
    menuThemeText.textContent = isLight ? 'SWITCH TO DARK MODE' : 'SWITCH TO LIGHT MODE';
  }

  // Adjust whiteboard default pen stroke color to match theme contrast
  if (isLight) {
    if (state.color === '#ffffff' || state.color === '#fff') {
      state.color = '#000000';
      if (colorPicker) colorPicker.value = '#000000';
      if (colorPreview) colorPreview.style.background = '#000000';
    }
  } else {
    if (state.color === '#000000' || state.color === '#000') {
      state.color = '#ffffff';
      if (colorPicker) colorPicker.value = '#ffffff';
      if (colorPreview) colorPreview.style.background = '#ffffff';
    }
  }

  try {
    localStorage.setItem('collabspace-theme', isLight ? 'light' : 'dark');
    localStorage.setItem('cinetic-theme', isLight ? 'light' : 'dark');
  } catch (_) {}

  scheduleRedraw();
}

function toggleTheme() {
  const currentIsLight = document.body.classList.contains('light-theme') || 
                         document.documentElement.getAttribute('data-theme') === 'light';
  applyTheme(currentIsLight ? 'dark' : 'light');
}

function initTheme() {
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('collabspace-theme') || localStorage.getItem('cinetic-theme') || 'dark';
  } catch (_) {}
  applyTheme(savedTheme);
}

[themeToggleLogin, themeToggleIntro, themeToggleNav, menuLinkTheme].forEach(btn => {
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTheme();
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  });
});

initTheme();

// 2-Page Scroll Navigation (Page 1 <-> Page 2)
if (introToPage2Btn) {
  introToPage2Btn.addEventListener('click', () => {
    introPage2?.scrollIntoView({ behavior: 'smooth' });
  });
}
if (introBackToPage1Btn) {
  introBackToPage1Btn.addEventListener('click', () => {
    introPage1?.scrollIntoView({ behavior: 'smooth' });
  });
}

// Floating Page Dot Indicators
introDots.forEach(dot => {
  dot.addEventListener('click', () => {
    const pageNum = dot.getAttribute('data-page');
    const target = pageNum === '2' ? introPage2 : introPage1;
    target?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Sync active dot on scroll
if (introScreen) {
  introScreen.addEventListener('scroll', () => {
    const halfHeight = introScreen.clientHeight / 2;
    const isPage2 = introPage2 && introPage2.getBoundingClientRect().top <= halfHeight;
    introDots.forEach(dot => {
      const pageNum = dot.getAttribute('data-page');
      dot.classList.toggle('active', (isPage2 && pageNum === '2') || (!isPage2 && pageNum === '1'));
    });
  }, { passive: true });
}

// Keyboard on Intro Screen: pressing Enter proceeds to sign in
if (introScreen) {
  introScreen.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement !== introExploreBtn && document.activeElement !== introBackToPage1Btn && !document.activeElement?.classList?.contains('cinetic-menu-link')) {
      showSignIn();
    }
  });
}

// Interactive tap / click on cards for mobile & desktop
introColCards.forEach(card => {
  card.addEventListener('click', () => {
    const isAlreadyActive = card.classList.contains('active-revealed');
    introColCards.forEach(c => c.classList.remove('active-revealed'));
    if (!isAlreadyActive) {
      card.classList.add('active-revealed');
    }
  });

  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

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
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

// ─── Opus Audio & Lip-Sync Optimization ───────────────────────────────────────
function optimizeSdpForAudioSync(sdp) {
  if (!sdp) return sdp;
  let lines = sdp.split('\r\n');
  if (lines.length <= 1) lines = sdp.split('\n');

  let opusPt = null;
  for (const line of lines) {
    const m = line.match(/^a=rtpmap:(\d+)\s+opus\/48000/i);
    if (m) {
      opusPt = m[1];
      break;
    }
  }

  if (opusPt) {
    let fmtpFound = false;
    lines = lines.map(line => {
      if (line.startsWith(`a=fmtp:${opusPt} `) || line === `a=fmtp:${opusPt}`) {
        fmtpFound = true;
        const existing = line.replace(`a=fmtp:${opusPt}`, '').trim();
        let params = existing ? existing.split(';') : [];
        const map = new Map();
        for (const p of params) {
          const parts = p.trim().split('=');
          if (parts[0]) map.set(parts[0], parts[1] || '1');
        }
        // Enable in-band forward error correction for glitch-free sound over mobile Wi-Fi
        map.set('useinbandfec', '1');
        map.set('minptime', '10');
        map.set('cbr', '1');
        map.set('maxaveragebitrate', '64000');
        const serialized = [...map.entries()].map(([k, v]) => `${k}=${v}`).join(';');
        return `a=fmtp:${opusPt} ${serialized}`;
      }
      return line;
    });

    if (!fmtpFound) {
      const idx = lines.findIndex(l => l.startsWith(`a=rtpmap:${opusPt}`));
      if (idx !== -1) {
        lines.splice(idx + 1, 0, `a=fmtp:${opusPt} minptime=10;useinbandfec=1;cbr=1;maxaveragebitrate=64000;stereo=0;sprop-stereo=0`);
      }
    }
  }

  return lines.join('\r\n');
}

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
  await ensureMediaForCall(false);
}

async function toggleMicrophone() {
  if (!state.localAudioTrack || state.localAudioTrack.readyState !== 'live') {
    state.isMicMuted = false;
    await ensureMediaForCall(false);
  } else {
    state.isMicMuted = !state.isMicMuted;
    state.localAudioTrack.enabled = !state.isMicMuted;
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

// ─── Local Camera & Media Management (Every PC, Laptop & Phone) ───────────────
const zoomFlipCamBtn        = document.getElementById('zoom-flip-cam-btn');
const httpsMobileNotice     = document.getElementById('https-mobile-notice');
const httpsMobileSwitchLink = document.getElementById('https-mobile-switch-link');
const httpsNoticeCloseBtn   = document.getElementById('https-notice-close-btn');

async function ensureMediaForCall(withVideo = true) {
  if (!state.voiceSupported) {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      location.replace('https:' + location.href.substring(5));
      return false;
    }
    showVideoToast('⚠️ WebRTC or mediaDevices not supported (HTTPS required for camera & mic)');
    return false;
  }

  const needAudio = !state.localAudioTrack || state.localAudioTrack.readyState !== 'live';
  const needVideo = withVideo && (!state.localVideoTrack || state.localVideoTrack.readyState !== 'live');

  // Step 1: If both audio and video are needed, request both in ONE unified getUserMedia call
  // This preserves user gesture activation on mobile browsers (iOS Safari, Android Chrome)
  // and produces a single unified permission prompt for both camera & mic.
  if (needAudio && needVideo) {
    let combinedStream = null;
    try {
      combinedStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          facingMode: state.currentFacingMode || 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });
    } catch (e1) {
      try {
        combinedStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: state.currentFacingMode || 'user' },
        });
      } catch (e2) {
        try {
          combinedStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
        } catch (e3) {
          console.warn('Combined audio+video getUserMedia failed, will attempt separate requests:', e3);
        }
      }
    }

    if (combinedStream) {
      const aTrack = combinedStream.getAudioTracks()[0];
      const vTrack = combinedStream.getVideoTracks()[0];
      if (aTrack) {
        state.localAudioTrack = aTrack;
        state.localAudioStream = new MediaStream([aTrack]);
        state.localStream.getAudioTracks().forEach(t => state.localStream.removeTrack(t));
        state.localStream.addTrack(aTrack);
        state.isMicMuted = false;
        setupAudioActivityMeter(state.localAudioStream);
        updateVoiceUI('active', 'Voice Active');
      }
      if (vTrack) {
        state.localVideoTrack = vTrack;
        state.localVideoStream = new MediaStream([vTrack]);
        state.localStream.getVideoTracks().forEach(t => state.localStream.removeTrack(t));
        state.localStream.addTrack(vTrack);
        state.isCamOff = false;
        vTrack.enabled = true;

        if (zoomPreviewVideo) {
          zoomPreviewVideo.srcObject = state.localVideoStream;
          zoomPreviewVideo.play().catch(() => {});
        }
      }
    }
  }

  // Step 2: Ensure Microphone track if still needed
  if (!state.localAudioTrack || state.localAudioTrack.readyState !== 'live') {
    let audioStream = null;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err1) {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err2) {
        console.warn('Microphone access unavailable or denied:', err2);
      }
    }

    if (audioStream) {
      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack) {
        state.localAudioTrack = audioTrack;
        state.localAudioStream = audioStream;
        state.localStream.getAudioTracks().forEach(t => state.localStream.removeTrack(t));
        state.localStream.addTrack(audioTrack);
        state.isMicMuted = false;
        setupAudioActivityMeter(audioStream);
        updateVoiceUI('active', 'Voice Active');
      }
    } else {
      state.localAudioTrack = null;
      state.localAudioStream = null;
      state.isMicMuted = true;
      updateVoiceUI('muted', 'Mic Off (Click to Speak)');
    }
  }

  // Step 3: Ensure Video track if still needed (e.g. combined failed, or video toggled on)
  if (withVideo && (!state.localVideoTrack || state.localVideoTrack.readyState !== 'live')) {
    let videoStream = null;
    // Step A: Ideal resolution & preferred facing mode (Laptop / Desktop / Phone)
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: state.currentFacingMode || 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });
    } catch (e1) {
      // Step B: Facing mode only (mobile phone cameras)
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: state.currentFacingMode || 'user' },
        });
      } catch (e2) {
        // Step C: Basic video fallback (low-end or virtual webcams)
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e3) {
          console.warn('Camera access unavailable:', e3);
        }
      }
    }

    if (videoStream) {
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        state.localVideoTrack = videoTrack;
        state.localVideoStream = videoStream;
        state.localStream.getVideoTracks().forEach(t => state.localStream.removeTrack(t));
        state.localStream.addTrack(videoTrack);
        state.isCamOff = false;
        videoTrack.enabled = true;

        if (zoomPreviewVideo) {
          zoomPreviewVideo.srcObject = state.localVideoStream;
          zoomPreviewVideo.play().catch(() => {});
        }
      }
    } else {
      state.isCamOff = true;
      state.localVideoTrack = null;
      state.localVideoStream = null;
      showVideoToast('📷 Camera unavailable (Joining as Audio only)');
    }
  }

  // Broadcast camera and microphone status to other peers
  wsSend({
    type: 'video_cam_status',
    isCamOff: state.isCamOff,
  });
  wsSend({
    type: 'voice_mute_status',
    isMuted: state.isMicMuted,
  });

  syncAllPeerConnections();
  updateCameraUI();
  updateMicUI();
  renderZoomGrid();
  return true;
}

async function flipCamera() {
  if (!state.localVideoTrack) {
    showVideoToast('📷 Turn on camera first to flip');
    return;
  }
  state.currentFacingMode = (state.currentFacingMode === 'user') ? 'environment' : 'user';
  const label = state.currentFacingMode === 'user' ? 'Front' : 'Back';
  showVideoToast(`🔄 Switching to ${label} Camera...`);

  let newStream = null;
  try {
    newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: state.currentFacingMode } },
    });
  } catch (e1) {
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.currentFacingMode },
      });
    } catch (e2) {
      console.warn('Could not flip camera:', e2);
      showVideoToast('⚠️ Could not switch camera (device has only 1 camera)');
      return;
    }
  }

  if (newStream) {
    const newTrack = newStream.getVideoTracks()[0];
    if (newTrack) {
      if (state.localVideoTrack) {
        try { state.localVideoTrack.stop(); } catch (e) {}
      }
      state.localVideoTrack = newTrack;
      state.localVideoStream = newStream;
      state.localStream.getVideoTracks().forEach(t => state.localStream.removeTrack(t));
      state.localStream.addTrack(newTrack);
      newTrack.enabled = !state.isCamOff;

      if (zoomPreviewVideo) {
        zoomPreviewVideo.srcObject = newStream;
        zoomPreviewVideo.play().catch(() => {});
      }

      syncAllPeerConnections();
      renderZoomGrid();
      showVideoToast(`📹 Switched to ${label} Camera`);
    }
  }
}

async function toggleCamera() {
  if (!state.localVideoTrack || state.localVideoTrack.readyState !== 'live') {
    state.isCamOff = false;
    await ensureMediaForCall(true);
  } else {
    state.isCamOff = !state.isCamOff;
    state.localVideoTrack.enabled = !state.isCamOff;
  }

  updateCameraUI();
  renderZoomGrid();

  wsSend({
    type: 'video_cam_status',
    isCamOff: state.isCamOff,
  });

  showVideoToast(state.isCamOff ? '📷 Camera turned off' : '📹 Camera active');
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      showVideoToast('⚠️ Screen sharing is not supported on this mobile device. Use laptop or PC.');
      return;
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false,
    });
    state.localScreenStream = stream;
    state.localScreenTrack = stream.getVideoTracks()[0];
    state.isScreenSharing = true;

    if (state.localScreenTrack) {
      state.localScreenTrack.addEventListener('ended', () => {
        stopScreenShare();
      });
    }

    syncAllPeerConnections();
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
  if (state.localScreenTrack) {
    try { state.localScreenTrack.stop(); } catch (e) {}
    state.localScreenTrack = null;
  }
  if (state.localScreenStream) {
    try { state.localScreenStream.getTracks().forEach(t => t.stop()); } catch (e) {}
    state.localScreenStream = null;
  }
  syncAllPeerConnections();
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
  if (!zoomVideoStageGrid) return;

  zoomVideoStageGrid.querySelectorAll('.zoom-rejoin-card').forEach(el => el.remove());

  const tiles = [];

  // Remote participants
  const peerIds = new Set();
  if (state.activeCall && state.activeCall.peerId) {
    peerIds.add(state.activeCall.peerId);
  }
  for (const [id] of state.voiceConnections) {
    if (id !== state.userId) peerIds.add(id);
  }
  for (const [id] of state.userMap) {
    if (id !== state.userId) peerIds.add(id);
  }

  for (const pid of peerIds) {
    const u = state.userMap.get(pid);
    const conn = state.voiceConnections.get(pid);
    const remoteStream = conn?.remoteStream || null;
    const vTracks = remoteStream ? remoteStream.getVideoTracks() : [];
    const vTrack = (vTracks.length > 0 && vTracks[0].readyState === 'live' && !vTracks[0].muted) ? vTracks[0] : null;

    tiles.push({
      id: pid,
      session_id: pid,
      name: u?.name || 'Participant',
      color: u?.color || '#ffffff',
      isLocal: false,
      stream: remoteStream,
      videoTrack: vTrack,
      screenTrack: null,
      isCamOff: !vTrack || !!(u && u.isCamOff),
      isMuted: !!(u && u.isMuted),
    });
  }

  // Local user (You)
  const localVTrack = state.localVideoTrack && state.localVideoTrack.readyState === 'live' ? state.localVideoTrack : null;
  const localSTrack = state.localScreenTrack && state.localScreenTrack.readyState === 'live' ? state.localScreenTrack : null;

  tiles.push({
    id: 'local',
    session_id: 'local',
    name: `${state.userName || 'You'} (You)`,
    color: state.userColor || '#ffffff',
    isLocal: true,
    stream: state.localStream,
    videoTrack: localVTrack,
    screenTrack: localSTrack,
    isCamOff: state.isCamOff || !localVTrack,
    isMuted: state.isMicMuted,
  });

  const screenSharingTile = tiles.find(t => t.screenTrack && t.screenTrack.readyState === 'live');

  zoomVideoStageGrid.className = 'zoom-stage-grid';
  if (screenSharingTile) {
    zoomVideoStageGrid.classList.add('has-screen-share');
  } else {
    const total = tiles.length;
    if (total <= 1) zoomVideoStageGrid.classList.add('grid-1');
    else if (total === 2) zoomVideoStageGrid.classList.add('grid-2');
    else if (total === 3) zoomVideoStageGrid.classList.add('grid-3');
    else if (total === 4) zoomVideoStageGrid.classList.add('grid-4');
    else if (total <= 6) zoomVideoStageGrid.classList.add('grid-5-6');
    else zoomVideoStageGrid.classList.add('grid-many');
  }

  if (zoomGridParticipantsBadge) {
    zoomGridParticipantsBadge.textContent = `👥 ${tiles.length} in call`;
  }

  const renderItems = [];
  if (screenSharingTile) {
    renderItems.push({
      tileId: 'screenshare-' + screenSharingTile.id,
      name: `${screenSharingTile.name.replace(' (You)', '')}'s Screen`,
      isScreenShare: true,
      track: screenSharingTile.screenTrack,
      stream: null,
      isLocal: false,
      isMuted: false,
      isCamOff: false,
      color: '#ffffff',
      session_id: 'screen-' + screenSharingTile.session_id,
      id: screenSharingTile.id,
    });
  }

  for (const t of tiles) {
    renderItems.push({
      tileId: 'tile-' + t.id,
      name: t.name,
      isScreenShare: false,
      track: t.videoTrack,
      stream: t.stream,
      isLocal: t.isLocal,
      isMuted: t.isMuted,
      isCamOff: t.isCamOff,
      color: t.color,
      session_id: t.session_id,
      id: t.id,
    });
  }

  const activeIds = new Set(renderItems.map(i => i.tileId));

  Array.from(zoomVideoStageGrid.children).forEach(child => {
    if (!child.classList.contains('zoom-tile')) {
      child.remove();
    } else {
      const tid = child.getAttribute('data-tile-id');
      if (!activeIds.has(tid)) child.remove();
    }
  });

  for (const item of renderItems) {
    let tileEl = zoomVideoStageGrid.querySelector(`[data-tile-id="${item.tileId}"]`);
    if (!tileEl) {
      tileEl = document.createElement('div');
      tileEl.className = `zoom-tile ${item.isLocal ? 'is-local' : ''} ${item.isScreenShare ? 'screen-share-tile' : ''}`;
      tileEl.setAttribute('data-tile-id', item.tileId);
      tileEl.setAttribute('data-session-id', item.session_id);

      tileEl.innerHTML = `
        <video autoplay playsinline webkit-playsinline ${item.isLocal ? 'muted' : ''}></video>
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

    const videoEl = tileEl.querySelector('video');
    const avatarBox = tileEl.querySelector('.zoom-tile-avatar-box');
    const badgeStrip = tileEl.querySelector('.zoom-tile-badge-strip');

    if (item.isScreenShare) {
      if (avatarBox) avatarBox.classList.add('hidden');
      if (badgeStrip) badgeStrip.innerHTML = '<span class="zoom-tile-badge screen">🖥️ Screen Share</span>';
      if (videoEl && item.track) {
        if (!videoEl.srcObject || videoEl.srcObject.getVideoTracks()[0] !== item.track) {
          videoEl.srcObject = new MediaStream([item.track]);
          videoEl.play().catch(() => {});
        }
      }
    } else if (item.isLocal) {
      videoEl.muted = true;
      if (item.isCamOff || !item.track || item.track.readyState !== 'live') {
        if (avatarBox) {
          avatarBox.classList.remove('hidden');
          if (!avatarBox.querySelector('.zoom-enable-cam-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'zoom-enable-cam-btn';
            btn.innerHTML = '📷 Turn On Camera';
            btn.onclick = (e) => {
              e.stopPropagation();
              toggleCamera();
            };
            avatarBox.appendChild(btn);
          }
        }
        videoEl.srcObject = null;
      } else {
        if (avatarBox) avatarBox.classList.add('hidden');
        if (!videoEl.srcObject || videoEl.srcObject.getVideoTracks()[0] !== item.track) {
          videoEl.srcObject = new MediaStream([item.track]);
          videoEl.play().catch(() => {});
        }
      }
    } else {
      // Remote participant:
      // In Video Call mode, remote video plays stream directly with sound unmuted for native A/V lip-sync
      videoEl.muted = false;
      videoEl.volume = 1.0;

      const conn = state.voiceConnections.get(item.id);
      if (conn && conn.audioEl) {
        conn.audioEl.muted = (state.currentMode === 'videocall');
      }

      if (item.track && item.track.readyState === 'live') {
        const currentTrack = videoEl.srcObject ? videoEl.srcObject.getVideoTracks()[0] : null;
        if (currentTrack !== item.track) {
          videoEl.srcObject = item.stream || new MediaStream([item.track]);
          videoEl.play().catch(e => {
            console.warn('Remote video playback error:', e);
            if (e.name === 'NotAllowedError') {
              videoEl.muted = true;
              videoEl.play().catch(() => {});
              if (conn && conn.audioEl) {
                conn.audioEl.muted = false;
                conn.audioEl.play().catch(() => {});
              }
            }
          });
        }
      } else if (item.stream && !videoEl.srcObject) {
        videoEl.srcObject = item.stream;
        videoEl.play().catch(() => {});
      }

      if (item.isCamOff || !item.track || item.track.readyState !== 'live') {
        if (avatarBox) avatarBox.classList.remove('hidden');
      } else {
        if (avatarBox) avatarBox.classList.add('hidden');
      }
    }
  }

  highlightActiveSpeaker();
}

// ─── Start / Join Video Call ──────────────────────────────────────────────────
async function joinRoomCall(targetUserId = null, peerName = null, peerColor = null, isCaller = false) {
  state.isCallActive = true;
  if (state.currentMode !== 'videocall') {
    setMode('videocall');
  }
  await ensureMediaForCall(true);

  state.isCallActive = true;
  if (targetUserId) {
    state.activeCall = {
      peerId: targetUserId,
      peerName: peerName || 'User',
      peerColor: peerColor || '#ffffff',
      startTime: Date.now(),
      isCaller: isCaller,
    };
  }

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

  if (zoomSfuBadge) {
    zoomSfuBadge.textContent = '⚡ WebRTC Sync';
  }

  // Connect or ensure connection with all peers in room
  if (targetUserId) {
    getOrCreatePeerConnection(targetUserId);
  } else {
    for (const [id] of state.userMap) {
      if (id !== state.userId) {
        getOrCreatePeerConnection(id);
      }
    }
  }
  syncAllPeerConnections();

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

  if (state.activeCall) {
    wsSend({
      type: 'call_ended',
      targetUserId: state.activeCall.peerId,
    });
    state.activeCall = null;
  } else {
    wsSend({
      type: 'call_ended',
    });
  }

  // Switch to whiteboard
  setMode('whiteboard');

  // Resume background voice audio on all audioEls
  for (const [, conn] of state.voiceConnections) {
    if (conn.audioEl) {
      conn.audioEl.muted = false;
      conn.audioEl.play().catch(() => {});
    }
  }

  playChime('disconnect');
  showVideoToast(`🔴 ${reason}`);
}

// ─── Direct Video Calling Signaling ───────────────────────────────────────────
async function startCall(targetUserId) {
  const target = state.userMap.get(targetUserId);
  if (!target) return;

  await ensureMediaForCall(true);

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
    zoomCallingAvatar.style.background = '#ffffff';
    zoomCallingAvatar.style.color = '#000000';
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
    fromColor: msg.fromColor || '#ffffff',
  };

  if (zoomIncomingAvatar) {
    zoomIncomingAvatar.textContent = (msg.fromName || 'U').charAt(0).toUpperCase();
    zoomIncomingAvatar.style.background = '#ffffff';
    zoomIncomingAvatar.style.color = '#000000';
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
  const peerColor = peer ? peer.color : '#ffffff';

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
  } else {
    renderZoomGrid();
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

if (zoomFlipCamBtn) {
  zoomFlipCamBtn.addEventListener('click', flipCamera);
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

if (zoomChatToggleBtn) {
  zoomChatToggleBtn.addEventListener('click', () => {
    toggleChatSidebar(!chatSidebar.classList.contains('collapsed'));
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

// ─── WebRTC Peer Connection & W3C Perfect Negotiation ────────────────────────
function syncTracksToPeerConnection(conn) {
  if (!conn || !conn.pc) return;

  const audioTrack = (state.localAudioTrack && state.localAudioTrack.readyState === 'live') ? state.localAudioTrack : null;
  const videoTrack = (state.isScreenSharing && state.localScreenTrack && state.localScreenTrack.readyState === 'live')
    ? state.localScreenTrack
    : (state.localVideoTrack && state.localVideoTrack.readyState === 'live' ? state.localVideoTrack : null);

  const transceivers = conn.pc.getTransceivers ? conn.pc.getTransceivers() : [];

  // Find audio transceiver
  const audioTransceiver = transceivers.find(t => 
    (t.sender && t.sender.track && t.sender.track.kind === 'audio') ||
    (t.receiver && t.receiver.track && t.receiver.track.kind === 'audio')
  );

  // Find video transceiver
  const videoTransceiver = transceivers.find(t => 
    (t.sender && t.sender.track && t.sender.track.kind === 'video') ||
    (t.receiver && t.receiver.track && t.receiver.track.kind === 'video')
  );

  // Handle Audio
  if (audioTransceiver && audioTransceiver.sender) {
    if (audioTransceiver.sender.track !== audioTrack) {
      audioTransceiver.sender.replaceTrack(audioTrack).catch(e => console.warn('Audio replaceTrack error:', e));
    }
    if (audioTrack && audioTransceiver.direction === 'recvonly') {
      audioTransceiver.direction = 'sendrecv';
    }
  } else if (audioTrack) {
    try {
      conn.pc.addTrack(audioTrack, state.localStream);
    } catch (e) {
      console.warn('Audio addTrack error:', e);
    }
  }

  // Handle Video
  if (videoTransceiver && videoTransceiver.sender) {
    if (videoTransceiver.sender.track !== videoTrack) {
      videoTransceiver.sender.replaceTrack(videoTrack).catch(e => console.warn('Video replaceTrack error:', e));
    }
    if (videoTrack && videoTransceiver.direction === 'recvonly') {
      videoTransceiver.direction = 'sendrecv';
    }
  } else if (videoTrack) {
    try {
      conn.pc.addTrack(videoTrack, state.localStream);
    } catch (e) {
      console.warn('Video addTrack error:', e);
    }
  }
}

function syncAllPeerConnections() {
  for (const [, conn] of state.voiceConnections) {
    syncTracksToPeerConnection(conn);
  }
}

function getOrCreatePeerConnection(targetUserId) {
  if (state.voiceConnections.has(targetUserId)) {
    return state.voiceConnections.get(targetUserId);
  }

  const isPolite = state.userId < targetUserId;
  const pc = new RTCPeerConnection(RTC_CONFIG);

  // Pre-add audio and video transceivers with direction 'sendrecv'
  // This guarantees that the initial offer/answer has both audio and video m-lines,
  // allowing instant camera/mic streaming via replaceTrack with zero negotiation latency.
  try {
    pc.addTransceiver('audio', { direction: 'sendrecv' });
    pc.addTransceiver('video', { direction: 'sendrecv' });
  } catch (e) {
    console.warn('addTransceiver error:', e);
  }

  const audioEl = new Audio();
  audioEl.autoplay = true;
  audioEl.playsInline = true;
  audioEl.setAttribute('playsinline', '');
  audioEl.setAttribute('webkit-playsinline', '');
  audioEl.setAttribute('data-peer-id', targetUserId);
  if (remoteAudiosContainer) {
    remoteAudiosContainer.appendChild(audioEl);
  }

  const conn = {
    pc,
    audioEl,
    targetUserId,
    isPolite,
    makingOffer: false,
    ignoreOffer: false,
    isSettingRemoteAnswerPending: false,
    candidateQueue: [],
    hasRemoteDescription: false,
    remoteStream: new MediaStream(),
    remoteAudioStream: null,
    remoteVideoStream: null,
  };
  state.voiceConnections.set(targetUserId, conn);

  syncTracksToPeerConnection(conn);

  // W3C Perfect Negotiation: onnegotiationneeded
  pc.onnegotiationneeded = async () => {
    try {
      conn.makingOffer = true;
      const offer = await pc.createOffer();
      if (pc.signalingState !== 'stable') return;
      const tunedSdp = optimizeSdpForAudioSync(offer.sdp);
      await pc.setLocalDescription({ type: offer.type, sdp: tunedSdp });
      wsSend({
        type: 'voice_signal',
        to: targetUserId,
        data: {
          type: 'offer',
          sdp: pc.localDescription.sdp,
        },
      });
    } catch (err) {
      console.warn(`[WebRTC] Negotiation error with ${targetUserId}:`, err);
    } finally {
      conn.makingOffer = false;
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      wsSend({
        type: 'voice_signal',
        to: targetUserId,
        data: {
          type: 'candidate',
          candidate: event.candidate,
        },
      });
    }
  };

  pc.ontrack = (event) => {
    if (!conn.remoteStream) conn.remoteStream = new MediaStream();

    const existing = conn.remoteStream.getTracks().find(t => t.id === event.track.id);
    if (!existing) {
      conn.remoteStream.addTrack(event.track);
    }

    if (event.track.kind === 'audio') {
      conn.remoteAudioStream = new MediaStream([event.track]);
      if (conn.audioEl) {
        if (conn.audioEl.srcObject !== conn.remoteStream) {
          conn.audioEl.srcObject = conn.remoteStream;
        }
        conn.audioEl.muted = (state.currentMode === 'videocall');
        conn.audioEl.play().catch(() => {});
      }
    } else if (event.track.kind === 'video') {
      conn.remoteVideoStream = new MediaStream([event.track]);
    }

    event.track.onended = () => { renderZoomGrid(); };
    event.track.onmute = () => { renderZoomGrid(); };
    event.track.onunmute = () => { renderZoomGrid(); };

    renderZoomGrid();
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') {
      try { pc.restartIce(); } catch (e) {}
    } else if (pc.connectionState === 'closed') {
      closePeerConnection(targetUserId);
    }
  };

  return conn;
}

async function initiatePeerConnection(targetUserId) {
  if (!state.voiceSupported || targetUserId === state.userId) return;
  const conn = getOrCreatePeerConnection(targetUserId);
  try {
    conn.makingOffer = true;
    const offer = await conn.pc.createOffer();
    if (conn.pc.signalingState !== 'stable') return;
    const tunedSdp = optimizeSdpForAudioSync(offer.sdp);
    await conn.pc.setLocalDescription({ type: offer.type, sdp: tunedSdp });
    wsSend({
      type: 'voice_signal',
      to: targetUserId,
      data: {
        type: 'offer',
        sdp: conn.pc.localDescription.sdp,
      },
    });
  } catch (err) {
    console.warn(`[WebRTC] Failed to create offer for ${targetUserId}:`, err);
  } finally {
    conn.makingOffer = false;
  }
}

async function handleVoiceSignal(msg) {
  const senderId = msg.from;
  const data = msg.data;
  if (!senderId || !data) return;

  const conn = getOrCreatePeerConnection(senderId);
  const pc = conn.pc;

  try {
    if (data.type === 'offer') {
      const readyForOffer = !conn.makingOffer && (pc.signalingState === 'stable' || conn.isSettingRemoteAnswerPending);
      const offerCollision = !readyForOffer;

      conn.ignoreOffer = !conn.isPolite && offerCollision;
      if (conn.ignoreOffer) {
        console.warn(`[WebRTC] Glare/Collision: impolite peer ${state.userId} ignoring offer from ${senderId}`);
        return;
      }

      if (offerCollision) {
        await Promise.all([
          pc.setLocalDescription({ type: 'rollback' }),
          pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp })),
        ]);
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
      }
      conn.hasRemoteDescription = true;

      while (conn.candidateQueue.length > 0) {
        const c = conn.candidateQueue.shift();
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
      }

      syncTracksToPeerConnection(conn);

      const answer = await pc.createAnswer();
      const tunedSdp = optimizeSdpForAudioSync(answer.sdp);
      await pc.setLocalDescription({ type: answer.type, sdp: tunedSdp });

      wsSend({
        type: 'voice_signal',
        to: senderId,
        data: {
          type: 'answer',
          sdp: pc.localDescription.sdp,
        },
      });
    } else if (data.type === 'answer') {
      if (pc.signalingState === 'have-local-offer') {
        conn.isSettingRemoteAnswerPending = true;
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        conn.isSettingRemoteAnswerPending = false;
        conn.hasRemoteDescription = true;

        while (conn.candidateQueue.length > 0) {
          const c = conn.candidateQueue.shift();
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
        }
      }
    } else if (data.type === 'candidate' && data.candidate) {
      if (conn.hasRemoteDescription && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          if (!conn.ignoreOffer) console.warn('[WebRTC] Candidate error:', e);
        }
      } else {
        conn.candidateQueue.push(data.candidate);
      }
    }
  } catch (err) {
    console.warn(`[WebRTC] Voice/Video signal error from ${senderId}:`, err);
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
  if (state.localAudioTrack) {
    try { state.localAudioTrack.stop(); } catch (e) {}
    state.localAudioTrack = null;
  }
  if (state.localVideoTrack) {
    try { state.localVideoTrack.stop(); } catch (e) {}
    state.localVideoTrack = null;
  }
  if (state.localScreenTrack) {
    try { state.localScreenTrack.stop(); } catch (e) {}
    state.localScreenTrack = null;
  }
  if (state.localStream) {
    state.localStream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
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

// ─── Mobile HTTPS Notice Check ────────────────────────────────────────────────
function checkSecureContextForMobile() {
  const isSecure = window.isSecureContext !== false && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isSecure && !isLocalhost && window.location.protocol === 'http:') {
    const notice = document.getElementById('https-mobile-notice');
    const link = document.getElementById('https-mobile-switch-link');
    const closeBtn = document.getElementById('https-notice-close-btn');

    if (notice && link) {
      const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname);
      const httpsPortPart = isIpAddress ? ':3443' : (window.location.port ? `:${window.location.port}` : '');
      const httpsUrl = `https://${window.location.hostname}${httpsPortPart}${window.location.pathname}${window.location.search}`;
      link.href = httpsUrl;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = httpsUrl;
      });
      notice.classList.remove('hidden');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          notice.classList.add('hidden');
        });
      }
    }
  }
}
checkSecureContextForMobile();

// ─── Close WebSocket & Clean Voice on Page Unload ─────────────────────────────
window.addEventListener('beforeunload', () => {
  cleanupVoiceChat();
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.close();
  }
});

// ─── Browser Autoplay Policy Audio Unlocker ──────────────────────────────────
function unlockAllRemoteAudios() {
  if (state.audioContext && state.audioContext.state === 'suspended') {
    state.audioContext.resume().catch(() => {});
  }
  for (const [, conn] of state.voiceConnections) {
    if (conn.audioEl && conn.audioEl.srcObject) {
      conn.audioEl.play().catch(() => {});
    }
  }
  if (zoomVideoStageGrid) {
    zoomVideoStageGrid.querySelectorAll('video').forEach(v => {
      if (v.srcObject && v.paused) {
        v.play().catch(() => {});
      }
    });
  }
}
document.addEventListener('click', unlockAllRemoteAudios, { passive: true });
document.addEventListener('touchstart', unlockAllRemoteAudios, { passive: true });
