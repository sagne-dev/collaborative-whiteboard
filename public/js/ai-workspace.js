/**
 * ai-workspace.js — Dedicated AI Workspace Mode for CollabSpace (100% Free AI)
 * 
 * Features:
 *  1. Expandable / Collapsible dark-themed left sidebar (New chat, Chat history, User profile, Settings)
 *  2. Minimalist dark-gradient hero screen with "Where should we start?"
 *  3. Floating prompt bar with "+" attachments, Model selector badge (Flash-Lite), Mic voice dictation, Send
 *  4. Secondary "Chat / Task" toggle buttons centered directly beneath prompt box
 *  5. Prompt suggestion pills with instant query submission
 *  6. 100% Free AI integration (Free backend proxy, Pollinations AI, AI free tier, Offline Intelligent Engine)
 *  7. Live streaming markdown rendering with code copy, response regeneration, and "Add to Whiteboard" sticky note integration!
 */

(function () {
  'use strict';

  // ─── Storage Keys ─────────────────────────────────────────────────────────
  const STORAGE_CHATS_KEY    = 'collab_ai_chat_sessions_v1';
  const STORAGE_ACTIVE_ID    = 'collab_ai_active_chat_id';
  const STORAGE_SIDEBAR_KEY  = 'collab_ai_sidebar_collapsed';
  const STORAGE_MODEL_KEY    = 'collab_ai_selected_model';
  const STORAGE_MODE_KEY     = 'collab_ai_selected_mode';
  const STORAGE_API_KEY      = 'collab_ai_custom_api_key';
  const STORAGE_USER_NAME    = 'collab_ai_user_name';

  // No default/sample fake chats - history strictly reflects actual user conversations.

  // ─── Application State ────────────────────────────────────────────────────
  const state = {
    chats: [],
    activeChatId: null,
    isSidebarCollapsed: false,
    activeMode: 'chat', // 'chat' | 'task'
    activeModel: 'flash-lite', // 'flash-lite' | 'pro' | 'claude' | 'mistral' | 'webllm'
    isGenerating: false,
    attachedFile: null, // { name, type, dataUrl }
    speechRecognition: null,
    isListening: false,
    filterKeyword: '',
    
    // Collaborative Real-Time State
    roomId: null,
    userId: null,
    userName: null,
    userColor: null,
    roomUsers: [],
    roomChat: null, // Shared AI Workspace room session
  };

  // ─── DOM Element References ───────────────────────────────────────────────
  let el = {};

  function cacheDomElements() {
    el = {
      viewPanel             : document.getElementById('aiworkspace-view'),
      sidebar               : document.getElementById('ai-sidebar'),
      sidebarToggleBtn      : document.getElementById('ai-sidebar-toggle-btn'),
      historyToggleBtn      : document.getElementById('ai-history-toggle-btn'),
      topbarNewChatBtn      : document.getElementById('ai-topbar-new-chat-btn'),
      brandToggle           : document.getElementById('ai-brand-toggle'),
      searchToggleBtn       : document.getElementById('ai-sidebar-search-btn'),
      searchWrap            : document.getElementById('ai-history-search-wrap'),
      searchInput           : document.getElementById('ai-history-search-input'),
      searchClearBtn        : document.getElementById('ai-history-search-clear'),
      newChatBtn           : document.getElementById('ai-new-chat-btn'),
      chatHistoryList       : document.getElementById('ai-chat-history-list'),
      clearAllHistoryBtn    : document.getElementById('ai-clear-all-history-btn'),
      userAvatar            : document.getElementById('ai-user-avatar'),
      userNameDisplay       : document.getElementById('ai-user-name-display'),
      settingsBtn           : document.getElementById('ai-settings-btn'),
      profileInfoBtn        : document.getElementById('ai-profile-info-btn'),
      
      mainArea              : document.getElementById('ai-main-area'),
      mobileMenuBtn         : document.getElementById('ai-mobile-menu-btn'),
      getAppBtn             : document.getElementById('ai-get-app-btn'),
      backToWhiteboardBtn   : document.getElementById('ai-back-to-whiteboard-btn'),

      // Collaborative Room Badges
      collabRoomBadge       : document.getElementById('ai-collab-room-badge'),
      collabRoomName        : document.getElementById('ai-collab-room-name'),
      collabUsersCount      : document.getElementById('ai-collab-users-count'),
      heroSubheadline       : document.getElementById('ai-hero-subheadline'),
      
      heroView              : document.getElementById('ai-hero-view'),
      conversationView      : document.getElementById('ai-conversation-view'),
      messageThread         : document.getElementById('ai-message-thread'),
      
      // Floating Hero Input
      promptBoxWrap         : document.getElementById('ai-prompt-box-wrap'),
      attachBtn             : document.getElementById('ai-attach-btn'),
      attachMenu            : document.getElementById('ai-attach-menu'),
      attachWhiteboardBtn   : document.getElementById('ai-attach-whiteboard-btn'),
      attachFileBtn         : document.getElementById('ai-attach-file-btn'),
      fileInput             : document.getElementById('ai-file-input'),
      attachedChips         : document.getElementById('ai-attached-chips'),
      promptInput           : document.getElementById('ai-prompt-input'),
      modelSelectorBtn      : document.getElementById('ai-model-selector-btn'),
      modelBadgeText        : document.getElementById('ai-model-badge-text'),
      modelDropdown         : document.getElementById('ai-model-dropdown'),
      micBtn                : document.getElementById('ai-mic-btn'),
      sendBtn               : document.getElementById('ai-send-btn'),
      
      // Mode Toggles
      modeChatBtn           : document.getElementById('ai-mode-chat-btn'),
      modeTaskBtn           : document.getElementById('ai-mode-task-btn'),
      
      // Docked Bottom Input (inside conversation view)
      promptBoxDock         : document.getElementById('ai-prompt-box-dock'),
      
      // Settings Modal
      settingsModal         : document.getElementById('ai-settings-modal'),
      settingsCloseBtn      : document.getElementById('ai-settings-close-btn'),
      settingDefaultModel   : document.getElementById('ai-setting-default-model'),
      settingApiKey      : document.getElementById('ai-setting-api-key'),
      settingUserName       : document.getElementById('ai-setting-username'),
      exportHistoryBtn      : document.getElementById('ai-export-history-btn'),
      settingsSaveBtn       : document.getElementById('ai-settings-save-btn'),
    };
  }

  // ─── Storage Helpers ──────────────────────────────────────────────────────
  function loadPersistedData() {
    try {
      const rawChats = localStorage.getItem(STORAGE_CHATS_KEY);
      if (rawChats) {
        const parsed = JSON.parse(rawChats);
        // Exclude legacy sample chats if they were previously saved
        state.chats = Array.isArray(parsed)
          ? parsed.filter(c => c && typeof c.id === 'string' && !c.id.startsWith('sample_'))
          : [];
      } else {
        state.chats = [];
      }
    } catch (e) {
      state.chats = [];
    }

    try {
      state.isSidebarCollapsed = localStorage.getItem(STORAGE_SIDEBAR_KEY) === 'true';
      state.activeModel = localStorage.getItem(STORAGE_MODEL_KEY) || 'flash-lite';
      state.activeMode = localStorage.getItem(STORAGE_MODE_KEY) || 'chat';
    } catch (e) {}

    const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_ID);
    if (savedActiveId && state.chats.find(c => c.id === savedActiveId)) {
      state.activeChatId = savedActiveId;
    } else {
      state.activeChatId = null; // show hero landing view
    }
  }

  function saveChats() {
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(state.chats));
    } catch (e) {}
  }

  function saveActiveChatId(id) {
    state.activeChatId = id;
    try {
      if (id) localStorage.setItem(STORAGE_ACTIVE_ID, id);
      else localStorage.removeItem(STORAGE_ACTIVE_ID);
    } catch (e) {}
  }

  // ─── Sidebar Expand / Collapse Logic ──────────────────────────────────────
  function setSidebarCollapsed(collapsed) {
    state.isSidebarCollapsed = collapsed;
    if (el.sidebar) {
      el.sidebar.classList.toggle('collapsed', collapsed);
    }
    if (el.historyToggleBtn) {
      el.historyToggleBtn.classList.toggle('active', !collapsed);
      el.historyToggleBtn.setAttribute('aria-expanded', !collapsed ? 'true' : 'false');
    }
    try {
      localStorage.setItem(STORAGE_SIDEBAR_KEY, collapsed ? 'true' : 'false');
    } catch (e) {}
  }

  function toggleSidebar() {
    setSidebarCollapsed(!state.isSidebarCollapsed);
  }

  // ─── Mode Switching (Chat vs Task) ────────────────────────────────────────
  function setAiMode(mode, broadcast = true) {
    state.activeMode = mode === 'task' ? 'task' : 'chat';
    if (el.modeChatBtn) {
      el.modeChatBtn.classList.toggle('active', state.activeMode === 'chat');
      el.modeChatBtn.setAttribute('aria-checked', state.activeMode === 'chat' ? 'true' : 'false');
    }
    if (el.modeTaskBtn) {
      el.modeTaskBtn.classList.toggle('active', state.activeMode === 'task');
      el.modeTaskBtn.setAttribute('aria-checked', state.activeMode === 'task' ? 'true' : 'false');
    }
    if (el.promptInput) {
      el.promptInput.placeholder = state.activeMode === 'task'
        ? 'Describe a task, feature, or plan to break down...'
        : 'Ask AI...';
    }
    const cur = getCurrentChat();
    if (cur) cur.mode = state.activeMode;
    try {
      localStorage.setItem(STORAGE_MODE_KEY, state.activeMode);
    } catch (e) {}

    // Synchronize mode change across room participants via WebSocket
    if (broadcast && state.roomId && typeof window._aiWsSend === 'function') {
      window._aiWsSend({ type: 'ai_workspace_mode', mode: state.activeMode });
    }
  }

  // ─── Model Selection (Flash-Lite, Pro, etc.) ──────────────────────────────
  const MODEL_DISPLAY_NAMES = {
    'flash-lite' : 'Flash-Lite',
    'pro'        : 'Pro 1.5',
    'claude'     : 'Claude Hybrid',
    'mistral'    : 'Mistral Large',
    'webllm'     : 'WebLLM Local'
  };

  function setAiModel(model, broadcast = true) {
    state.activeModel = model || 'flash-lite';
    const label = MODEL_DISPLAY_NAMES[state.activeModel] || 'Flash-Lite';
    if (el.modelBadgeText) {
      el.modelBadgeText.textContent = label;
    }
    // Update active check in dropdown
    if (el.modelDropdown) {
      el.modelDropdown.querySelectorAll('.ai-dropdown-item').forEach(item => {
        const isMatch = item.getAttribute('data-model') === state.activeModel;
        item.classList.toggle('active', isMatch);
        const check = item.querySelector('.ai-item-check');
        if (check) check.classList.toggle('hidden', !isMatch);
      });
    }
    const cur = getCurrentChat();
    if (cur) cur.model = state.activeModel;
    try {
      localStorage.setItem(STORAGE_MODEL_KEY, state.activeModel);
    } catch (e) {}

    // Synchronize model change across room participants via WebSocket
    if (broadcast && state.roomId && typeof window._aiWsSend === 'function') {
      window._aiWsSend({ type: 'ai_workspace_model', model: state.activeModel });
    }
  }

  // ─── Chat Session Management ──────────────────────────────────────────────
  function createNewChat() {
    // If in collaborative room, ask user if they want to clear the room's AI conversation
    if (state.roomId) {
      if (state.roomChat && state.roomChat.messages && state.roomChat.messages.length > 0) {
        if (!confirm(`Clear current shared AI conversation for Room "${state.roomId}"?\n\nAll participants in this room will start a fresh conversation.`)) {
          return;
        }
        if (typeof window._aiWsSend === 'function') {
          window._aiWsSend({ type: 'ai_workspace_clear' });
        }
        state.roomChat.messages = [];
        state.isGenerating = false;
        updateGeneratingState(false);
        renderActiveView();
        focusPromptInput();
        return;
      }
      focusPromptInput();
      return;
    }

    saveActiveChatId(null);
    renderChatHistory();
    renderActiveView();
    focusPromptInput();
  }

  function getCurrentChat() {
    // In room collaborative mode, the room's shared conversation is the current chat
    if (state.roomId) {
      if (!state.roomChat) {
        state.roomChat = {
          id: 'room_' + state.roomId,
          title: `Room: ${state.roomId} (Shared AI)`,
          isRoomSession: true,
          mode: state.activeMode,
          model: state.activeModel,
          createdAt: Date.now(),
          messages: []
        };
      }
      return state.roomChat;
    }
    if (!state.activeChatId) return null;
    return state.chats.find(c => c.id === state.activeChatId) || null;
  }

  function selectChat(id) {
    saveActiveChatId(id);
    const chat = getCurrentChat();
    if (chat && chat.mode) {
      setAiMode(chat.mode, false);
    }
    renderChatHistory();
    renderActiveView();
  }

  function deleteChat(id, e) {
    if (e) e.stopPropagation();
    state.chats = state.chats.filter(c => c.id !== id);
    saveChats();
    if (state.activeChatId === id) {
      state.activeChatId = state.chats.length > 0 ? state.chats[0].id : null;
      saveActiveChatId(state.activeChatId);
    }
    renderChatHistory();
    renderActiveView();
  }

  function renameChat(id, e) {
    if (e) e.stopPropagation();
    const chat = state.chats.find(c => c.id === id);
    if (!chat) return;
    const newTitle = prompt('Enter new conversation title:', chat.title);
    if (newTitle && newTitle.trim()) {
      chat.title = newTitle.trim();
      saveChats();
      renderChatHistory();
    }
  }

  function clearAllHistory() {
    if (state.roomId) {
      if (!confirm(`Clear shared AI conversation for Room "${state.roomId}"?\n\nThis will reset the room conversation for all participants.`)) return;
      if (typeof window._aiWsSend === 'function') {
        window._aiWsSend({ type: 'ai_workspace_clear' });
      }
      if (state.roomChat) state.roomChat.messages = [];
      state.isGenerating = false;
      updateGeneratingState(false);
      renderActiveView();
      return;
    }
    if (!confirm('Are you sure you want to clear all chat history?')) return;
    state.chats = [];
    saveChats();
    saveActiveChatId(null);
    renderChatHistory();
    renderActiveView();
  }

  // ─── Render Chat History (Streamlined Sidebar) ────────────────────────────
  function renderChatHistory() {
    if (!el.chatHistoryList) return;
    el.chatHistoryList.innerHTML = '';

    // If in an active collaborative room, pin the shared room AI workspace item at the top
    if (state.roomId) {
      const roomItem = document.createElement('div');
      const isRoomActive = (!state.activeChatId || state.activeChatId === ('room_' + state.roomId));
      roomItem.className = 'ai-history-item ai-room-pinned-item' + (isRoomActive ? ' active' : '');
      roomItem.setAttribute('role', 'listitem');
      roomItem.setAttribute('tabindex', '0');
      roomItem.title = `Shared AI Workspace for Room ${state.roomId}`;

      roomItem.innerHTML = `
        <span class="ai-history-item-icon" style="color: #34d399;" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </span>
        <span class="ai-history-item-title" style="font-weight: 600; color: #fff;">Room: ${escapeHtml(state.roomId)}</span>
        <span class="ai-room-live-pill">SHARED</span>
      `;

      roomItem.addEventListener('click', () => {
        state.activeChatId = 'room_' + state.roomId;
        renderChatHistory();
        renderActiveView();
      });

      el.chatHistoryList.appendChild(roomItem);

      const divider = document.createElement('div');
      divider.className = 'ai-history-section-divider';
      divider.textContent = 'Past Sessions';
      el.chatHistoryList.appendChild(divider);
    }

    const filter = (state.filterKeyword || '').toLowerCase().trim();
    const list = state.chats.filter(c => {
      if (!filter) return true;
      return (c.title || '').toLowerCase().includes(filter) ||
             (c.messages || []).some(m => (m.content || '').toLowerCase().includes(filter));
    });

    if (list.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'ai-history-empty';
      emptyItem.innerHTML = `
        <div class="ai-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <p class="ai-empty-text">${filter ? 'No matching conversations' : 'No history yet.'}</p>
      `;
      el.chatHistoryList.appendChild(emptyItem);
      return;
    }

    list.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'ai-history-item' + (chat.id === state.activeChatId ? ' active' : '');
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.title = chat.title || 'Untitled';

      item.innerHTML = `
        <span class="ai-history-item-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span class="ai-history-item-title">${escapeHtml(chat.title || 'Untitled')}</span>
        <div class="ai-history-item-actions">
          <button type="button" class="ai-item-action-btn edit-title-btn" title="Rename conversation" aria-label="Rename">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="ai-item-action-btn delete-chat-btn" title="Delete conversation" aria-label="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      item.addEventListener('click', () => selectChat(chat.id));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectChat(chat.id);
        }
      });

      const editBtn = item.querySelector('.edit-title-btn');
      if (editBtn) editBtn.addEventListener('click', (e) => renameChat(chat.id, e));

      const delBtn = item.querySelector('.delete-chat-btn');
      if (delBtn) delBtn.addEventListener('click', (e) => deleteChat(chat.id, e));

      el.chatHistoryList.appendChild(item);
    });
  }

  // ─── Render Active View (Hero vs Live Conversation) ───────────────────────
  function renderActiveView() {
    const chat = getCurrentChat();
    const hasMessages = chat && chat.messages && chat.messages.length > 0;

    if (!hasMessages) {
      // Show Centered Hero Screen ("Where should we start?")
      if (el.heroView) el.heroView.classList.remove('hidden');
      if (el.conversationView) el.conversationView.classList.add('hidden');
      syncPromptBoxLocation(false);
    } else {
      // Show Conversation Thread
      if (el.heroView) el.heroView.classList.add('hidden');
      if (el.conversationView) el.conversationView.classList.remove('hidden');
      renderMessageThread(chat.messages);
      syncPromptBoxLocation(true);
    }
  }

  // Dock prompt box into either the hero center or conversation bottom dock
  function syncPromptBoxLocation(isInConversation) {
    if (!el.promptBoxWrap) return;
    if (isInConversation) {
      if (el.promptBoxDock && !el.promptBoxDock.contains(el.promptBoxWrap)) {
        el.promptBoxDock.appendChild(el.promptBoxWrap);
      }
    } else {
      const centerWrap = el.heroView ? el.heroView.querySelector('.ai-hero-center-content') : null;
      if (centerWrap && !centerWrap.contains(el.promptBoxWrap)) {
        centerWrap.appendChild(el.promptBoxWrap);
      }
    }
  }

  function formatTime(ts) {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  // ─── Render Message Thread ────────────────────────────────────────────────
  function renderMessageThread(messages) {
    if (!el.messageThread) return;
    el.messageThread.innerHTML = '';

    messages.forEach((msg) => {
      const msgCard = document.createElement('div');
      msgCard.className = `ai-msg-row ${msg.role === 'user' ? 'user' : 'assistant'}`;

      if (msg.role === 'user') {
        const isMe = msg.userId && state.userId ? (msg.userId === state.userId) : true;
        const senderName = msg.userName || (isMe ? (state.userName || 'You') : 'User');
        const senderColor = msg.userColor || (isMe ? (state.userColor || '#60a5fa') : '#60a5fa');
        const senderInitial = (senderName.trim()[0] || 'U').toUpperCase();
        const timeStr = msg.timestamp ? formatTime(msg.timestamp) : '';

        msgCard.innerHTML = `
          <div class="ai-msg-avatar user" style="border-color: ${senderColor}; color: ${senderColor};" title="${escapeHtml(senderName)}">
            ${escapeHtml(senderInitial)}
          </div>
          <div class="ai-msg-bubble user">
            <div class="ai-msg-sender-info">
              <span class="ai-msg-sender-name" style="color: ${senderColor};">
                ${escapeHtml(senderName)}${isMe ? ' <span class="ai-msg-you-tag">(You)</span>' : ''}
              </span>
              ${timeStr ? `<span class="ai-msg-time">${timeStr}</span>` : ''}
            </div>
            ${msg.attachment ? `<div class="ai-bubble-attachment"><img src="${msg.attachment.dataUrl}" alt="Attachment" class="ai-attach-thumb" /><span>${escapeHtml(msg.attachment.name || 'Attachment')}</span></div>` : ''}
            <div class="ai-bubble-text">${escapeHtml(msg.content)}</div>
          </div>
        `;
      } else {
        const isGenerating = msg.status === 'generating' || msg.content === 'Thinking…';
        const modelBadge = msg.model || (typeof MODEL_DISPLAY_NAMES !== 'undefined' && MODEL_DISPLAY_NAMES[state.activeModel]) || 'Groq LLaMA 3.3';

        if (isGenerating) {
          msgCard.innerHTML = `
            <div class="ai-msg-avatar ai">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <div class="ai-msg-bubble ai generating-bubble">
              <div class="ai-bubble-header">
                <span class="ai-bubble-model-tag">${escapeHtml(modelBadge)}</span>
              </div>
              <div class="ai-thinking-indicator">
                <span class="ai-thinking-dot"></span>
                <span class="ai-thinking-dot"></span>
                <span class="ai-thinking-dot"></span>
                <span class="ai-thinking-text">Thinking…</span>
              </div>
            </div>
          `;
        } else {
          const formattedHtml = parseMarkdownToHtml(msg.content);

          msgCard.innerHTML = `
            <div class="ai-msg-avatar ai">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <div class="ai-msg-bubble ai">
              <div class="ai-bubble-header">
                <span class="ai-bubble-model-tag">${escapeHtml(modelBadge)}</span>
              </div>
              <div class="ai-bubble-text markdown-body">${formattedHtml}</div>
              <div class="ai-bubble-actions">
                <button type="button" class="ai-bubble-act-btn copy-btn" title="Copy response to clipboard">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  <span>Copy</span>
                </button>
                <button type="button" class="ai-bubble-act-btn add-whiteboard-btn" title="Add as sticky notes to Whiteboard canvas">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  <span>Add to Whiteboard</span>
                </button>
                <button type="button" class="ai-bubble-act-btn regen-btn" title="Regenerate response">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
          `;

          // Wire copy button
          const copyBtn = msgCard.querySelector('.copy-btn');
          if (copyBtn) {
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(msg.content).then(() => {
                copyBtn.querySelector('span').textContent = 'Copied!';
                setTimeout(() => { copyBtn.querySelector('span').textContent = 'Copy'; }, 1800);
              });
            });
          }

          // Wire "Add to Whiteboard" sticky note button
          const wbBtn = msgCard.querySelector('.add-whiteboard-btn');
          if (wbBtn) {
            wbBtn.addEventListener('click', () => {
              addAiContentToWhiteboard(msg.content);
            });
          }

          // Wire regenerate button
          const regenBtn = msgCard.querySelector('.regen-btn');
          if (regenBtn) {
            regenBtn.addEventListener('click', () => {
              if (state.isGenerating) return;
              if (state.roomId && typeof window._aiWsSend === 'function') {
                window._aiWsSend({ type: 'ai_workspace_regenerate' });
              } else {
                regenerateLastAssistantMessage();
              }
            });
          }

          // Wire code block copy buttons
          msgCard.querySelectorAll('.ai-code-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const codeBlock = btn.closest('.ai-code-wrapper').querySelector('code');
              if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                  btn.textContent = 'Copied!';
                  setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
                });
              }
            });
          });
        }
      }

      el.messageThread.appendChild(msgCard);
    });

    scrollToThreadBottom();
  }

  function scrollToThreadBottom() {
    if (el.messageThread) {
      requestAnimationFrame(() => {
        el.messageThread.scrollTop = el.messageThread.scrollHeight;
      });
    }
  }

  // ─── Add AI Response to Whiteboard Canvas ─────────────────────────────────
  function addAiContentToWhiteboard(rawText) {
    if (typeof window._appInsertStickyNote !== 'function') {
      alert('Whiteboard canvas ready! Open Whiteboard mode to sketch.');
      return;
    }

    // Extract key bullet points, tasks, or summary
    const cleanLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('```') && !l.startsWith('###'));

    // Pick top actionable takeaways or split into 1-3 cohesive sticky notes
    const cards = [];
    let currentChunk = [];

    cleanLines.forEach(line => {
      // Clean up markdown bold/bullets
      const clean = line.replace(/^[-*•]\s*(\[ \]\s*)?/, '').replace(/\*\*/g, '');
      if (clean.length > 5) {
        currentChunk.push(clean);
        if (currentChunk.length >= 3) {
          cards.push(currentChunk.join('\n'));
          currentChunk = [];
        }
      }
    });
    if (currentChunk.length > 0) {
      cards.push(currentChunk.join('\n'));
    }

    if (cards.length === 0) {
      cards.push(rawText.slice(0, 180) + '...');
    }

    // Insert notes on the whiteboard canvas with pastel colors
    const colors = ['#fef08a', '#bbf7d0', '#bae6fd', '#fed7aa', '#e9d5ff'];
    cards.slice(0, 3).forEach((cardText, idx) => {
      const color = colors[idx % colors.length];
      window._appInsertStickyNote(cardText, undefined, undefined, color);
    });

    // Provide friendly confirmation with immediate 1-click switch
    const switchNow = confirm(`🎉 Added ${Math.min(cards.length, 3)} sticky note(s) to the collaborative whiteboard!\n\nSwitch to Whiteboard mode now to view them?`);
    if (switchNow && typeof window._appSetMode === 'function') {
      window._appSetMode('whiteboard');
    }
  }

  // ─── Send User Prompt & Execute Real-Time Collaborative AI Query ──────────
  async function submitPrompt(promptText) {
    const text = (promptText || (el.promptInput ? el.promptInput.value : '')).trim();
    if (!text && !state.attachedFile) return;
    if (state.isGenerating) return;

    const attachedToSend = state.attachedFile ? { ...state.attachedFile } : null;

    // Clear input & attachments immediately for responsive feel
    if (el.promptInput) {
      el.promptInput.value = '';
      el.promptInput.style.height = 'auto';
    }
    clearAttachment();

    // In collaborative room: transmit via WebSocket to all room participants
    if (state.roomId && typeof window._aiWsSend === 'function') {
      const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      window._aiWsSend({
        type: 'ai_workspace_send',
        prompt: text,
        attachment: attachedToSend,
        model: state.activeModel,
        mode: state.activeMode,
        messageId: messageId,
      });
      return;
    }

    // Standalone fallback: Ensure we have an active chat session
    let chat = getCurrentChat();
    if (!chat) {
      const newId = 'chat_' + Date.now();
      chat = {
        id: newId,
        title: text.length > 40 ? text.slice(0, 40) + '…' : (text || 'Attached Analysis'),
        mode: state.activeMode,
        model: state.activeModel,
        createdAt: Date.now(),
        messages: []
      };
      state.chats.unshift(chat);
      saveActiveChatId(newId);
    } else if (chat.messages.length === 0 && text) {
      chat.title = text.length > 40 ? text.slice(0, 40) + '…' : text;
    }

    // Add User Message
    const userMsg = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      attachment: attachedToSend,
      userId: state.userId || 'local',
      userName: state.userName || 'You',
      userColor: state.userColor || '#60a5fa',
      timestamp: Date.now()
    };
    chat.messages.push(userMsg);

    saveChats();
    renderChatHistory();
    renderActiveView();

    // Prepare Placeholder AI Assistant Message
    state.isGenerating = true;
    updateGeneratingState(true);

    const assistantMsg = {
      id: 'ai_' + Date.now(),
      role: 'assistant',
      content: 'Thinking…',
      status: 'generating',
      model: MODEL_DISPLAY_NAMES[state.activeModel] || 'Flash-Lite',
      timestamp: Date.now()
    };
    chat.messages.push(assistantMsg);
    renderMessageThread(chat.messages);

    // Execute Real AI Call
    try {
      const result = await queryAiEngine({
        prompt: text,
        mode: state.activeMode,
        model: state.activeModel,
        messages: chat.messages.slice(0, -1) // exclude placeholder
      });

      assistantMsg.content = result.text;
      assistantMsg.model = result.model || 'Groq LLaMA 3.3';
      assistantMsg.provider = result.provider || 'groq';
      assistantMsg.status = 'completed';
    } catch (err) {
      console.warn('Real AI query issue, using smart local engine fallback:', err);
      assistantMsg.content = generateLocalSmartResponse(text, state.activeMode);
      assistantMsg.model = `${state.activeModel} (Local Engine)`;
      assistantMsg.status = 'completed';
    } finally {
      state.isGenerating = false;
      updateGeneratingState(false);
      saveChats();
      renderChatHistory();
      renderActiveView();
    }
  }

  function updateGeneratingState(isGen) {
    if (el.sendBtn) {
      el.sendBtn.disabled = isGen;
      el.sendBtn.classList.toggle('generating', isGen);
    }
  }

  // ─── Real AI Engine Query Strategy (Groq / Free Provider) ─────────────────
  function getAiApiUrl() {
    if (window.WS_BACKEND_URL && window.location.hostname !== 'localhost') {
      const httpBase = window.WS_BACKEND_URL.replace(/^ws(s?):/, 'http$1:').replace(/\/+$/, '');
      return httpBase + '/api/ai/chat';
    }
    return '/api/ai/chat';
  }

  async function queryAiEngine({ prompt, mode, model, messages }) {
    const customKey = localStorage.getItem(STORAGE_API_KEY) || '';
    const apiUrl = getAiApiUrl();

    // Prepare clean message payload containing full conversational history
    const cleanMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    // Primary: Call the dedicated backend /api/ai/chat endpoint
    let primaryError = null;
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-api-key': customKey } : {})
        },
        body: JSON.stringify({
          prompt,
          mode,
          model,
          apiKey: customKey,
          messages: cleanMessages
        })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.text) {
        return {
          text: data.text,
          model: data.model || 'Groq LLaMA 3.3',
          provider: data.provider || 'groq'
        };
      }

      if (data && data.error) {
        primaryError = new Error(data.error);
      } else {
        primaryError = new Error(`AI service returned HTTP ${res.status}`);
      }
    } catch (netErr) {
      primaryError = netErr;
      console.warn('Backend AI endpoint fetch failed, trying direct provider fallback:', netErr.message);
    }

    // Direct browser fallback to Pollinations if backend is temporarily unreachable
    try {
      const systemPrompt = mode === 'task'
        ? 'You are an AI Workspace Task Specialist for CollabSpace. Deliver clear, actionable task breakdowns, checklist items, and step-by-step milestones using clean Markdown.'
        : 'You are the AI Assistant in CollabSpace AI Workspace. Provide insightful, articulate, beautifully structured answers with markdown, headings, and code blocks.';

      const pollMessages = [
        { role: 'system', content: systemPrompt },
        ...cleanMessages,
        { role: 'user', content: prompt }
      ];

      const pRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: pollMessages,
          model: 'openai',
          seed: Math.floor(Math.random() * 100000)
        })
      });

      if (pRes.ok) {
        const txt = await pRes.text();
        if (txt && txt.trim() && !txt.includes('Free limit reached')) {
          return {
            text: txt,
            model: 'OpenAI Free Tier',
            provider: 'free-tier'
          };
        }
      }
    } catch (pErr) {}

    // If both backend and direct fallback fail, return the actual error message
    throw primaryError || new Error('AI service unavailable. Please check your network or configure GROQ_API_KEY in .env.');
  }

  // ─── Attachments (Whiteboard Snapshot & Files) ────────────────────────────
  function attachWhiteboardSnapshot() {
    if (typeof window._appGetCanvasImage !== 'function') {
      alert('Canvas snapshot utility unavailable.');
      return;
    }
    const dataUrl = window._appGetCanvasImage();
    if (!dataUrl) {
      alert('Unable to capture whiteboard snapshot.');
      return;
    }
    state.attachedFile = {
      name: 'whiteboard_snapshot.png',
      type: 'image/png',
      dataUrl: dataUrl
    };
    renderAttachedChips();
    if (el.attachMenu) el.attachMenu.classList.add('hidden');
    focusPromptInput();
  }

  function handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEv) => {
      state.attachedFile = {
        name: file.name,
        type: file.type,
        dataUrl: loadEv.target.result
      };
      renderAttachedChips();
      if (el.attachMenu) el.attachMenu.classList.add('hidden');
      focusPromptInput();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function clearAttachment() {
    state.attachedFile = null;
    renderAttachedChips();
  }

  function renderAttachedChips() {
    if (!el.attachedChips) return;
    if (!state.attachedFile) {
      el.attachedChips.innerHTML = '';
      el.attachedChips.classList.add('hidden');
      return;
    }

    el.attachedChips.classList.remove('hidden');
    el.attachedChips.innerHTML = `
      <div class="ai-attached-chip">
        <span class="chip-icon">📎</span>
        <span class="chip-name">${escapeHtml(state.attachedFile.name)}</span>
        <button type="button" class="chip-remove-btn" title="Remove attachment">✕</button>
      </div>
    `;

    const rmBtn = el.attachedChips.querySelector('.chip-remove-btn');
    if (rmBtn) rmBtn.addEventListener('click', clearAttachment);
  }

  // ─── Microphone Voice Recognition (Web Speech API) ────────────────────────
  function setupSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      if (el.micBtn) el.micBtn.title = 'Voice input not supported in this browser';
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      state.isListening = true;
      if (el.micBtn) {
        el.micBtn.classList.add('listening');
        el.micBtn.title = 'Listening... Speak now';
      }
    };

    rec.onresult = (ev) => {
      let transcript = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        transcript += ev.results[i][0].transcript;
      }
      if (el.promptInput) {
        el.promptInput.value = transcript;
        autoResizePromptInput();
      }
    };

    rec.onerror = (ev) => {
      console.warn('Speech recognition error:', ev.error);
      stopListening();
    };

    rec.onend = () => {
      stopListening();
    };

    state.speechRecognition = rec;
  }

  function toggleSpeechRecognition() {
    if (!state.speechRecognition) {
      alert('Voice dictation is supported in modern Chrome, Edge, and Safari browsers.');
      return;
    }

    if (state.isListening) {
      state.speechRecognition.stop();
      stopListening();
    } else {
      try {
        state.speechRecognition.start();
      } catch (e) {
        stopListening();
      }
    }
  }

  function stopListening() {
    state.isListening = false;
    if (el.micBtn) {
      el.micBtn.classList.remove('listening');
      el.micBtn.title = 'Speak Prompt (Voice Input)';
    }
  }

  // ─── Input Autosize & Helpers ─────────────────────────────────────────────
  function autoResizePromptInput() {
    if (!el.promptInput) return;
    el.promptInput.style.height = 'auto';
    el.promptInput.style.height = Math.min(el.promptInput.scrollHeight, 180) + 'px';
  }

  function focusPromptInput() {
    if (el.promptInput) {
      requestAnimationFrame(() => el.promptInput.focus());
    }
  }

  function getUserInitial() {
    const name = getUserDisplayName();
    return (name && name[0] ? name[0].toUpperCase() : 'S');
  }

  function getUserDisplayName() {
    const stored = localStorage.getItem(STORAGE_USER_NAME);
    if (stored) return stored;
    if (typeof window._appGetUserName === 'function') {
      return window._appGetUserName();
    }
    return 'Sagne mieso';
  }

  function updateUserProfileDisplay() {
    const name = getUserDisplayName();
    const initial = getUserInitial();
    if (el.userAvatar) el.userAvatar.textContent = initial;
    if (el.userNameDisplay) el.userNameDisplay.textContent = name;
    if (el.settingUserName) el.settingUserName.value = name;
  }

  // ─── Markdown to Clean HTML Parser ────────────────────────────────────────
  function parseMarkdownToHtml(markdown) {
    if (!markdown) return '';
    let html = markdown;

    // 1. Code blocks ```lang ... ```
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const cleanLang = lang || 'code';
      const escapedCode = escapeHtml(code.trim());
      return `
        <div class="ai-code-wrapper">
          <div class="ai-code-header">
            <span class="ai-code-lang">${cleanLang}</span>
            <button type="button" class="ai-code-copy-btn">Copy</button>
          </div>
          <pre><code class="language-${cleanLang}">${escapedCode}</code></pre>
        </div>
      `;
    });

    // 2. Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 3. Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 4. Checklist boxes [ ] and [x]
    html = html.replace(/^- \[(x|X)\] (.*$)/gim, '<div class="ai-checklist-item checked"><input type="checkbox" checked disabled /> <span>$2</span></div>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="ai-checklist-item"><input type="checkbox" disabled /> <span>$1</span></div>');

    // 5. Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 6. Bullet lists
    html = html.replace(/^\s*[-*•] (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // 7. Paragraphs & Line Breaks
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<ul') || p.startsWith('<pre')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─── Settings Modal Logic ─────────────────────────────────────────────────
  function openSettingsModal() {
    if (!el.settingsModal) return;
    if (el.settingDefaultModel) el.settingDefaultModel.value = state.activeModel;
    if (el.settingApiKey) el.settingApiKey.value = localStorage.getItem(STORAGE_API_KEY) || '';
    if (el.settingUserName) el.settingUserName.value = getUserDisplayName();
    el.settingsModal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    if (el.settingsModal) el.settingsModal.classList.add('hidden');
  }

  function saveSettings() {
    if (el.settingDefaultModel) {
      setAiModel(el.settingDefaultModel.value);
    }
    if (el.settingApiKey) {
      const keyVal = el.settingApiKey.value.trim();
      if (keyVal) localStorage.setItem(STORAGE_API_KEY, keyVal);
      else localStorage.removeItem(STORAGE_API_KEY);
    }
    if (el.settingUserName) {
      const nameVal = el.settingUserName.value.trim();
      if (nameVal) {
        localStorage.setItem(STORAGE_USER_NAME, nameVal);
        updateUserProfileDisplay();
      }
    }
    closeSettingsModal();
  }

  function exportChatHistory() {
    const jsonStr = JSON.stringify(state.chats, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collabspace-ai-workspace-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Event Listeners Setup ────────────────────────────────────────────────
  function attachEventListeners() {
    // 1. Sidebar Toggle & Brand Click
    if (el.sidebarToggleBtn) el.sidebarToggleBtn.addEventListener('click', toggleSidebar);
    if (el.brandToggle) {
      el.brandToggle.addEventListener('click', () => {
        if (state.isSidebarCollapsed) setSidebarCollapsed(false);
        else createNewChat();
      });
    }

    // 2. New Chat Button
    if (el.newChatBtn) el.newChatBtn.addEventListener('click', createNewChat);

    // 3. Search Chat History Toggle
    if (el.searchToggleBtn) {
      el.searchToggleBtn.addEventListener('click', () => {
        if (state.isSidebarCollapsed) setSidebarCollapsed(false);
        if (el.searchWrap) {
          el.searchWrap.classList.toggle('hidden');
          if (!el.searchWrap.classList.contains('hidden') && el.searchInput) {
            el.searchInput.focus();
          }
        }
      });
    }

    if (el.searchInput) {
      el.searchInput.addEventListener('input', (e) => {
        state.filterKeyword = e.target.value;
        renderChatHistory();
      });
    }

    if (el.searchClearBtn) {
      el.searchClearBtn.addEventListener('click', () => {
        if (el.searchInput) el.searchInput.value = '';
        state.filterKeyword = '';
        renderChatHistory();
        if (el.searchWrap) el.searchWrap.classList.add('hidden');
      });
    }

    // 4. Clear All History
    if (el.clearAllHistoryBtn) el.clearAllHistoryBtn.addEventListener('click', clearAllHistory);

    // 5. Settings Modal Trigger
    if (el.settingsBtn) el.settingsBtn.addEventListener('click', openSettingsModal);
    if (el.profileInfoBtn) el.profileInfoBtn.addEventListener('click', openSettingsModal);
    if (el.settingsCloseBtn) el.settingsCloseBtn.addEventListener('click', closeSettingsModal);
    if (el.settingsSaveBtn) el.settingsSaveBtn.addEventListener('click', saveSettings);
    if (el.exportHistoryBtn) el.exportHistoryBtn.addEventListener('click', exportChatHistory);
    if (el.settingsModal) {
      el.settingsModal.addEventListener('click', (e) => {
        if (e.target === el.settingsModal) closeSettingsModal();
      });
    }

    // 6. Navigation Topbar Actions & History Toggle Controls
    if (el.sidebarToggleBtn) el.sidebarToggleBtn.addEventListener('click', toggleSidebar);
    if (el.historyToggleBtn) el.historyToggleBtn.addEventListener('click', toggleSidebar);
    if (el.topbarNewChatBtn) el.topbarNewChatBtn.addEventListener('click', createNewChat);

    if (el.mobileMenuBtn) {
      el.mobileMenuBtn.addEventListener('click', () => {
        toggleSidebar();
      });
    }

    if (el.backToWhiteboardBtn) {
      el.backToWhiteboardBtn.addEventListener('click', () => {
        if (typeof window._appSetMode === 'function') {
          window._appSetMode('whiteboard');
        }
      });
    }

    if (el.getAppBtn) {
      el.getAppBtn.addEventListener('click', () => {
        alert('CollabSpace Web App is fully progressive! In Chrome/Edge, click the install icon in your browser address bar to install as a standalone desktop app.');
      });
    }

    // 7. Mode Toggles (Chat vs Task)
    if (el.modeChatBtn) el.modeChatBtn.addEventListener('click', () => setAiMode('chat'));
    if (el.modeTaskBtn) el.modeTaskBtn.addEventListener('click', () => setAiMode('task'));

    // 8. Suggestion Pills
    document.querySelectorAll('.ai-suggestion-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const promptText = pill.getAttribute('data-prompt');
        if (promptText) submitPrompt(promptText);
      });
    });

    // 9. Model Selector Dropdown
    if (el.modelSelectorBtn) {
      el.modelSelectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (el.modelDropdown) el.modelDropdown.classList.toggle('hidden');
      });
    }

    if (el.modelDropdown) {
      el.modelDropdown.querySelectorAll('.ai-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const modelVal = item.getAttribute('data-model');
          setAiModel(modelVal);
          el.modelDropdown.classList.add('hidden');
        });
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (el.modelDropdown && !el.modelDropdown.contains(e.target) && e.target !== el.modelSelectorBtn) {
        el.modelDropdown.classList.add('hidden');
      }
      if (el.attachMenu && !el.attachMenu.contains(e.target) && e.target !== el.attachBtn) {
        el.attachMenu.classList.add('hidden');
      }
    });

    // 10. Attachment Button & Menu
    if (el.attachBtn) {
      el.attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (el.attachMenu) el.attachMenu.classList.toggle('hidden');
      });
    }

    if (el.attachWhiteboardBtn) el.attachWhiteboardBtn.addEventListener('click', attachWhiteboardSnapshot);

    if (el.attachFileBtn) {
      el.attachFileBtn.addEventListener('click', () => {
        if (el.fileInput) el.fileInput.click();
      });
    }

    if (el.fileInput) el.fileInput.addEventListener('change', handleFileSelected);

    // 11. Microphone Voice Input
    if (el.micBtn) el.micBtn.addEventListener('click', toggleSpeechRecognition);

    // 12. Send Button & Input Keydown (Enter to send, Shift+Enter for newline)
    if (el.sendBtn) el.sendBtn.addEventListener('click', () => submitPrompt());

    if (el.promptInput) {
      el.promptInput.addEventListener('input', autoResizePromptInput);
      el.promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitPrompt();
        }
      });
    }
  }

  // ─── Collaborative Room Badge Update ───────────────────────────────────────
  function updateCollabRoomBadge() {
    if (el.collabRoomBadge) {
      if (state.roomId) {
        el.collabRoomBadge.classList.remove('hidden');
        if (el.collabRoomName) {
          el.collabRoomName.textContent = 'Room: ' + state.roomId;
        }
        if (el.collabUsersCount) {
          const count = Math.max(1, state.roomUsers ? state.roomUsers.length : 1);
          el.collabUsersCount.textContent = count + (count === 1 ? ' user' : ' users');
        }
        if (el.heroSubheadline) {
          el.heroSubheadline.textContent = `Shared AI Workspace · Room: ${state.roomId}`;
        }
      } else {
        el.collabRoomBadge.classList.add('hidden');
      }
    }
  }

  // ─── Real-Time Collaborative Event Handlers ───────────────────────────────
  window._aiWorkspaceOnInit = function ({ roomId, userId, userName, userColor, users, aiWorkspace }) {
    state.roomId = roomId;
    state.userId = userId;
    state.userName = userName;
    state.userColor = userColor;
    state.roomUsers = Array.isArray(users) ? users : [];

    // Initialize or update the shared room conversation
    state.roomChat = {
      id: 'room_' + roomId,
      title: `Room: ${roomId} (Shared AI)`,
      isRoomSession: true,
      mode: aiWorkspace?.mode || 'chat',
      model: aiWorkspace?.model || 'flash-lite',
      createdAt: Date.now(),
      messages: Array.isArray(aiWorkspace?.messages) ? [...aiWorkspace.messages] : []
    };

    state.activeChatId = state.roomChat.id;
    state.activeMode = state.roomChat.mode;
    state.activeModel = state.roomChat.model;
    state.isGenerating = !!aiWorkspace?.isGenerating;

    updateCollabRoomBadge();
    setAiMode(state.activeMode, false);
    setAiModel(state.activeModel, false);
    updateGeneratingState(state.isGenerating);
    renderChatHistory();
    renderActiveView();
  };

  window._aiWorkspaceOnUserJoined = function (msg) {
    if (!msg || !msg.userId) return;
    if (!state.roomUsers.some(u => u.id === msg.userId)) {
      state.roomUsers.push({ id: msg.userId, name: msg.name, color: msg.color });
    }
    updateCollabRoomBadge();
  };

  window._aiWorkspaceOnUserLeft = function (msg) {
    if (!msg || !msg.userId) return;
    state.roomUsers = state.roomUsers.filter(u => u.id !== msg.userId);
    updateCollabRoomBadge();
  };

  window._aiWorkspaceHandleEvent = function (msg) {
    if (!msg) return;
    const currentChat = getCurrentChat();

    switch (msg.type) {
      case 'ai_workspace_update': {
        if (!currentChat) return;
        if (msg.userMessage) {
          const exists = currentChat.messages.some(m => m.id === msg.userMessage.id);
          if (!exists) currentChat.messages.push(msg.userMessage);
        }
        if (msg.assistantMessage) {
          const exists = currentChat.messages.some(m => m.id === msg.assistantMessage.id);
          if (!exists) currentChat.messages.push(msg.assistantMessage);
        }
        state.isGenerating = !!msg.isGenerating;
        updateGeneratingState(state.isGenerating);
        renderActiveView();
        break;
      }

      case 'ai_workspace_response': {
        if (!currentChat) return;
        if (msg.assistantMessage) {
          const idx = currentChat.messages.findIndex(m => m.id === msg.assistantMessage.id);
          if (idx !== -1) {
            currentChat.messages[idx] = msg.assistantMessage;
          } else {
            currentChat.messages.push(msg.assistantMessage);
          }
        }
        state.isGenerating = false;
        updateGeneratingState(false);
        renderActiveView();
        break;
      }

      case 'ai_workspace_status': {
        if (msg.status === 'busy') {
          alert(msg.message || 'AI is currently responding to another message in this room.');
        }
        break;
      }

      case 'ai_workspace_clear': {
        if (!currentChat) return;
        currentChat.messages = [];
        state.isGenerating = false;
        updateGeneratingState(false);
        renderActiveView();
        break;
      }

      case 'ai_workspace_mode': {
        state.activeMode = msg.mode;
        if (currentChat) currentChat.mode = msg.mode;
        setAiMode(msg.mode, false);
        break;
      }

      case 'ai_workspace_model': {
        state.activeModel = msg.model;
        if (currentChat) currentChat.model = msg.model;
        setAiModel(msg.model, false);
        break;
      }
    }
  };

  // ─── Initialization ───────────────────────────────────────────────────────
  function initAiWorkspace() {
    cacheDomElements();
    loadPersistedData();
    setSidebarCollapsed(state.isSidebarCollapsed);
    setAiMode(state.activeMode, false);
    setAiModel(state.activeModel, false);
    updateUserProfileDisplay();
    setupSpeechRecognition();
    attachEventListeners();

    // Check if app is already connected to a room
    if (typeof window._appGetRoomId === 'function' && window._appGetRoomId()) {
      state.roomId = window._appGetRoomId();
      state.userId = typeof window._appGetUserId === 'function' ? window._appGetUserId() : null;
      state.userColor = typeof window._appGetUserColor === 'function' ? window._appGetUserColor() : null;
      state.userName = typeof window._appGetUserName === 'function' ? window._appGetUserName() : 'User';
      state.roomUsers = typeof window._appGetUsers === 'function' ? window._appGetUsers() : [];
      if (!state.roomChat) {
        state.roomChat = {
          id: 'room_' + state.roomId,
          title: `Room: ${state.roomId} (Shared AI)`,
          isRoomSession: true,
          mode: state.activeMode,
          model: state.activeModel,
          createdAt: Date.now(),
          messages: []
        };
      }
      state.activeChatId = state.roomChat.id;
      updateCollabRoomBadge();
    }

    renderChatHistory();
    renderActiveView();

    // Hook into app mode change
    window._aiWorkspaceOnOpen = () => {
      updateCollabRoomBadge();
      renderChatHistory();
      renderActiveView();
      focusPromptInput();
    };
  }

  // Auto-init on DOMContentLoaded or immediately if ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAiWorkspace);
  } else {
    initAiWorkspace();
  }

})();

