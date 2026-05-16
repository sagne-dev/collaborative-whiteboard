

# 🎨 Collaborative Whiteboard

**Real-time multi-user whiteboard** — draw with friends anywhere in the world.

## 🔗 Live Demo

**Current link:** https://washday-remnant-resolved.ngrok-free.dev/

> ⚠️ **This link only works while my computer is on and the server is running.**
> 
> Message me if the link doesn't work — I'll restart it!

---

## ⚡ Quick Start

### Run it yourself

```bash
npm install
npm start
```

Then open http://localhost:3000

### Share online (ngrok)

```bash
ngrok http 3000
```

Share the ngrok URL with anyone.

---

## 🎮 How to Use

| Action | How |
|--------|-----|
| Draw | Click + drag |
| Change color | Color picker |
| Brush size | Slider |
| Erase | Eraser button |
| Undo | `Ctrl+Z` or ↩ button |
| Redo | `Ctrl+Y` or ↪ button |

---

## 👥 How to Collaborate

1. Share your ngrok link
2. Everyone enters the **same room name**
3. Draw together in real-time!

---

## 📁 Project Structure

```
whiteboard/
├── server/index.js    # WebSocket server
├── public/
│   ├── index.html     # UI
│   ├── style.css      # Styling
│   └── js/app.js      # Canvas logic
├── data/              # Auto-saved drawings
└── package.json
```

---

## 🛠️ Built With

- Node.js + WebSocket
- HTML5 Canvas
- Vanilla JavaScript

---



## Want a link that ALWAYS works?

You'd need to **deploy** to a hosting service:
