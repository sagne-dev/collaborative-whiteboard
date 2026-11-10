#  CollabSpace — Collaborative Whiteboard & Watch Party

**Real-time multi-user whiteboard and synchronized video watch party** — draw, collaborate, and watch videos together with friends anywhere in the world.

---

##  Features

### 1.  Real-Time Whiteboard Mode
- **Multi-user Drawing:** Synchronized strokes, customizable brush sizes, and color picker.
- **Tools:** Pen, Eraser, Undo (`Ctrl+Z`), Redo (`Ctrl+Y`), and Clear Board.
- **Presence & Remote Cursors:** See everyone's name, assigned color, and live cursor position.
- **Persistence:** In-memory + disk-backed persistence per room.

### 2.  Synchronized Watch Party Mode
- **Universal Video Engine:** Supports **YouTube** (standard, shortened `youtu.be`, and Shorts), **Google Drive** video links, **Google Cloud Storage** streams, **Vimeo**, **Dailymotion**, direct **MP4/WebM/OGG/MOV** files, and any embeddable web link.
- **Repeat Loading Support:** Seamlessly load new videos one after another without player freezing or lockups.
- **Synchronized Playback:** Play, pause, and seek in real-time across all clients in the room via WebSockets.
- **Room State Preservation:** Seamlessly join a room mid-video with automatically calculated playback sync.
- **Autoplay Handling:** Built-in unblock overlay for browser autoplay policies.

### 3.  Collapsible Text Chat & Theater Experience
- **Dedicated Text Chat:** Real-time text-only room chat with user color tags and timestamps.
- **Theater Mode:** Click **Collapse** to hide the chat sidebar, allowing the video player to expand to 100% full width for an immersive theater-like experience.
- **Unread Message Badges:** Get notified of new messages even when chat is collapsed or while in Whiteboard Mode.
- **Pop-In Toggle:** Reopen the chat sidebar at any moment with one click.

### 4.  Seamless Mode Switcher
- Persistent top navigation bar allowing users to switch freely between **Whiteboard Mode**, **Watch Party Mode**, and **Video Call Mode** without disconnecting or losing room members.

### 5.  Real-Time Audio-Only Voice Chat
- **WebRTC Peer-to-Peer Audio:** Low-latency, crystal-clear voice chat between participants in the same room ID without video overhead.
- **Automatic Connection:** Automatically connects users to the voice channel upon entering the room.
- **Microphone Controls:** Convenient one-click mute/unmute button in the top navigation bar with live audio wave activity visualizer.
- **Works Across All Modes:** Voice chat remains active continuously whether you are collaborating on the whiteboard, enjoying a watch party, or in a call.
- **Participant Status:** Presence panel displays microphone status (`🎙️` / `🔇`) for all members in real time.

### 6. ⚡ Zoom-Style Video Call Mode (High-Def WebRTC Mesh & Daily.co SFU)
- **High-Definition WebRTC Mesh Engine:** Production-grade peer-to-peer audio/video mesh using W3C Perfect Negotiation to prevent offer/answer glare collisions.
- **Lip-Sync & Glitch-Free Audio:** 
  - Audio and video media tracks are bound to a unified `MediaStream` (single MSID), enabling the browser's hardware jitter buffer to keep voice perfectly synchronized with video lip movement.
  - Custom SDP optimization injects Opus in-band Forward Error Correction (`useinbandfec=1`), 10ms packet times (`minptime=10`), and constant bitrate (`cbr=1`, 64 kbps) for crystal clear sound without robotic stuttering.
- **Universal Multi-Device Compatibility (PC, Mac, Laptop, iPhone/iPad, Android):**
  - Works on all modern desktop and mobile browsers (Chrome, Edge, Firefox, Safari on iOS/iPadOS, Chrome on Android).
  - Native dual-server: **HTTP on port 3000** and **HTTPS on port 3443** with auto-generated SSL certificates.
  - Essential for mobile devices (iOS Safari and Android Chrome require a Secure Context / HTTPS to access cameras and microphones across local Wi-Fi).
  - Built-in one-tap HTTPS banner on mobile devices when joining via plain HTTP.
- **Mobile Camera Flip:** Tap the **Flip Cam** button to seamlessly switch between front (selfie) and rear (environment) cameras without dropping the call.
- **Dynamic Multi-Slot Video Grid:** Clean, responsive video grid using CSS Grid that dynamically adjusts layout slots based on how many participants join the room:
  - **1-on-1:** Expands to fill the screen symmetrically.
  - **3 Participants:** 2 tiles top, 1 centered below.
  - **4 Participants:** 2x2 grid.
  - **5-6 Participants:** 3x2 grid.
  - **Many Participants:** Auto-fit responsive multi-tile grid.
- **Screen Sharing:** Dedicated screen sharing with automatic spotlight layout (`.has-screen-share`) featuring high-resolution view of the shared screen alongside participant camera tiles.
- **Active Speaker Highlighting:** Real-time active speaker detection featuring a glowing green `#22c55e` border, box-shadow glow, and animated pulsing audio wave bars (`.zoom-speaker-wave`).
- **Bottom Control Bar:** Intuitive Zoom-style floating controls bar:
  - **Toggle Microphone:** One-click mute/unmute with live status indicator.
  - **Toggle Camera:** Start or stop video with instant avatar fallback.
  - **Flip Camera:** Instant toggle between front and rear cameras on mobile devices.
  - **Screen Share:** One-click toggle for sharing screen with browser-native stop detection.
  - **Leave Call:** Cleanly disconnect and return to the room lobby.
- **Participant Badges:** Video tiles display participant names, microphone state, active speaker indicators, and screen share badges.
- **Lobby & Direct Calling:** Pre-call local video/audio preview with online directory and one-click "Join Room Video Call".

---

## 🚀 Quick Start

### 1. Install & Start Server

```bash
cd collaborative-whiteboard
npm install
npm start
```

The server automatically starts **both HTTP and HTTPS**:
- **HTTP Server:** `http://localhost:3000`
- **HTTPS Server (Secure WebRTC for Mobile & LAN):** `https://localhost:3443`

When the server starts, it prints your local Wi-Fi / LAN IP addresses in the terminal:
```
[SERVER] 🚀 HTTP listening at http://localhost:3000
[SERVER] 🔒 HTTPS listening at https://localhost:3443
[SERVER] 📱 Connect phones/laptops over Wi-Fi via HTTPS:
[SERVER]    👉 https://192.168.x.x:3443
```

### 2. Connecting from Devices

- **From the Host PC / Desktop:**
  - Open `http://localhost:3000` or `https://localhost:3443`
- **From another PC or Laptop on the same Wi-Fi:**
  - Open `https://<YOUR-LAN-IP>:3443` (e.g. `https://192.168.0.103:3443`)
- **From iPhone, iPad, or Android phone:**
  - Make sure your phone is connected to the same Wi-Fi network.
  - Open `https://<YOUR-LAN-IP>:3443` in Safari (iOS) or Chrome (Android).
  - *Note on Self-Signed SSL:* The browser will show a standard certificate warning on the first visit. Tap **"Advanced"** and tap **"Proceed to site"** (or **"Accept the Risk and Continue"**). This grants the browser camera and microphone permissions over LAN.

### 3. Share Online Over the Internet (Optional: ngrok)

```bash
ngrok http 3000
```
Share the generated `https://...ngrok-free.app` URL with anyone over the internet!

---

## 🎮 How to Use

| Mode | Action | How |
|------|--------|-----|
| **All Modes** | Switch Mode | Click **Whiteboard Mode**, **Watch Party Mode**, or **Video Call Mode** in the top navigation bar |
| **All Modes** | Voice Chat (Mute/Unmute) | Click the **🎙️ Voice** pill in the top navigation bar to toggle your microphone |
| **All Modes** | Share Room Link | Click the **Room: [id]** pill in the top bar to copy your invite link |
| **Whiteboard** | Draw | Click + drag on the canvas |
| **Whiteboard** | Change color / size | Use the color picker and slider in the toolbar |
| **Whiteboard** | Undo / Redo | `Ctrl+Z` / `Ctrl+Y` or toolbar buttons |
| **Watch Party** | Play / Pause / Seek | Any interaction with the video player controls automatically synchronizes to all participants |
| **Watch Party** | Load a Video | Paste any video link (YouTube, Google Drive, MP4, web link) and click **Load Video**, or select a sample video |
| **Watch Party** | Theater Mode | Click **Collapse** in the chat header; click **Show Chat** to pop it back in |
| **Watch Party** | Chat | Type a message and press **Enter** or click **Send** |
| **Video Call** | Join / Start Call | Click **Start / Join Room Video Call** or click **Video Call** next to any participant |
| **Video Call** | Toggle Microphone | Click the **Mute / Unmute** button in the bottom control bar |
| **Video Call** | Toggle Camera | Click the **Start / Stop Video** button in the bottom control bar |
| **Video Call** | Flip Camera (Phone) | Click the **Flip Cam** button in the bottom control bar to toggle front/rear cameras |
| **Video Call** | Screen Share | Click the **Share Screen** button in the bottom control bar |
| **Video Call** | Leave Call | Click the red **Leave Call** button in the bottom control bar |
| **Video Call** | Fullscreen Stage | Click the **Fullscreen** button in the top meeting bar |

---

##  Project Structure

```
collaborative-whiteboard/
├── server/
│   └── index.js       # WebSocket & HTTP server (Whiteboard, Watch Party sync & Chat)
├── public/
│   ├── index.html     # Mode switcher, Whiteboard canvas, Video stage & Chat sidebar UI
│   ├── style.css      # Dark modern UI, Theater mode, and responsive layout
│   └── js/app.js      # Real-time WebSocket sync for drawing, video player & chat
├── data/              # Temporary room state while active (automatically cleared when room is empty)
└── package.json
```

---

##  Built With

- **Node.js** + **WebSocket (`ws`)**
- **WebRTC Audio API** (Peer-to-peer low-latency voice chat)
- **HTML5 Canvas** (CRDT-inspired stroke sync)
- **HTML5 Video API** (Real-time synchronized playback)
- **Vanilla JavaScript & Modern CSS**
