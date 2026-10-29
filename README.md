# 🎨 CollabSpace — Collaborative Whiteboard & Watch Party

**Real-time multi-user whiteboard and synchronized video watch party** — draw, collaborate, and watch videos together with friends anywhere in the world.

---

## ✨ Features

### 1. 🎨 Real-Time Whiteboard Mode
- **Multi-user Drawing:** Synchronized strokes, customizable brush sizes, and color picker.
- **Tools:** Pen, Eraser, Undo (`Ctrl+Z`), Redo (`Ctrl+Y`), and Clear Board.
- **Presence & Remote Cursors:** See everyone's name, assigned color, and live cursor position.
- **Persistence:** In-memory + disk-backed persistence per room.

### 2. 🎬 Synchronized Watch Party Mode
- **Universal Video Engine:** Supports **YouTube** (standard, shortened `youtu.be`, and Shorts), **Google Drive** video links, **Google Cloud Storage** streams, **Vimeo**, **Dailymotion**, direct **MP4/WebM/OGG/MOV** files, and any embeddable web link.
- **Repeat Loading Support:** Seamlessly load new videos one after another without player freezing or lockups.
- **Synchronized Playback:** Play, pause, and seek in real-time across all clients in the room via WebSockets.
- **Room State Preservation:** Seamlessly join a room mid-video with automatically calculated playback sync.
- **Autoplay Handling:** Built-in unblock overlay for browser autoplay policies.

### 3. 💬 Collapsible Text Chat & Theater Experience
- **Dedicated Text Chat:** Real-time text-only room chat with user color tags and timestamps.
- **Theater Mode:** Click **Collapse** to hide the chat sidebar, allowing the video player to expand to 100% full width for an immersive theater-like experience.
- **Unread Message Badges:** Get notified of new messages even when chat is collapsed or while in Whiteboard Mode.
- **Pop-In Toggle:** Reopen the chat sidebar at any moment with one click.

### 4. 🔄 Seamless Mode Switcher
- Persistent top navigation bar allowing users to switch freely between **Whiteboard Mode** and **Watch Party Mode** without disconnecting or losing room members.

---

## ⚡ Quick Start

### 1. Run it locally

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

### 2. Share online (ngrok)

```bash
ngrok http 3000
```

Share the generated URL with your friends to draw and watch videos together!

---

## 🎮 How to Use

| Mode | Action | How |
|------|--------|-----|
| **Both** | Switch Mode | Click **Whiteboard Mode** or **Watch Party Mode** in the top navigation bar |
| **Both** | Share Room Link | Click the **Room: [id]** pill in the top bar to copy your invite link |
| **Whiteboard** | Draw | Click + drag on the canvas |
| **Whiteboard** | Change color / size | Use the color picker and slider in the toolbar |
| **Whiteboard** | Undo / Redo | `Ctrl+Z` / `Ctrl+Y` or toolbar buttons |
| **Watch Party** | Play / Pause / Seek | Any interaction with the video player controls automatically synchronizes to all participants |
| **Watch Party** | Load a Video | Paste any video link (YouTube, Google Drive, MP4, web link) and click **Load Video**, or select a sample video |
| **Watch Party** | Theater Mode | Click **Collapse** in the chat header; click **Show Chat** to pop it back in |
| **Watch Party** | Chat | Type a message and press **Enter** or click **Send** |

---

## 📁 Project Structure

```
collaborative-whiteboard/
├── server/
│   └── index.js       # WebSocket & HTTP server (Whiteboard, Watch Party sync & Chat)
├── public/
│   ├── index.html     # Mode switcher, Whiteboard canvas, Video stage & Chat sidebar UI
│   ├── style.css      # Dark modern UI, Theater mode, and responsive layout
│   └── js/app.js      # Real-time WebSocket sync for drawing, video player & chat
├── data/              # Auto-saved room state (drawings, video state & chat)
└── package.json
```

---

## 🛠️ Built With

- **Node.js** + **WebSocket (`ws`)**
- **HTML5 Canvas** (CRDT-inspired stroke sync)
- **HTML5 Video API** (Real-time synchronized playback)
- **Vanilla JavaScript & Modern CSS**
