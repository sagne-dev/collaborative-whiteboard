/**
 * ai-features.js — AI-Powered Whiteboard Extensions
 * Feature 1: Real-Time 3D Sketch Conversion (Three.js)
 * Feature 2: Instant Handwritten Math Graphing (Tesseract.js + math.js + Plotly)
 */

import * as THREE from 'three';

// ─── Utility ─────────────────────────────────────────────────────────────────
function wsSend(obj) {
  if (window._aiWsSend) {
    window._aiWsSend(obj);
    return;
  }
  const ws = window._appWs && window._appWs();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

// ─── Draggable Panel Logic ────────────────────────────────────────────────────
function makeDraggable(panel, handle) {
  let isDragging = false, startX, startY, startLeft, startTop;
  handle.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panel.style.left = (startLeft + dx) + 'px';
    panel.style.top = (startTop + dy) + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.transform = 'none';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: 3D SKETCH CONVERSION
// ═══════════════════════════════════════════════════════════════════════════════

let threeRenderer, threeScene, threeCamera, threeMesh, threeAnimFrame;
let isThreeRotating = false, threeLastX, threeLastY;
let threeEuler = { x: 0.3, y: 0.3 };

function init3DPanel() {
  const panel = document.getElementById('ai-3d-panel');
  const closeBtn = document.getElementById('ai-3d-close');
  const header = document.getElementById('ai-3d-panel-header');
  const canvasEl = document.getElementById('ai-3d-canvas');

  if (!panel || !closeBtn || !canvasEl) return;

  makeDraggable(panel, header);
  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
    if (threeAnimFrame) cancelAnimationFrame(threeAnimFrame);
  });

  // Mouse rotation
  canvasEl.addEventListener('mousedown', e => {
    isThreeRotating = true;
    threeLastX = e.clientX;
    threeLastY = e.clientY;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isThreeRotating || !threeMesh) return;
    const dx = e.clientX - threeLastX;
    const dy = e.clientY - threeLastY;
    threeEuler.y += dx * 0.008;
    threeEuler.x += dy * 0.008;
    threeMesh.rotation.set(threeEuler.x, threeEuler.y, 0);
    threeLastX = e.clientX;
    threeLastY = e.clientY;
  });
  document.addEventListener('mouseup', () => { isThreeRotating = false; });

  // Touch rotation
  let lastTouch = null;
  canvasEl.addEventListener('touchstart', e => {
    lastTouch = e.touches[0];
    e.preventDefault();
  }, { passive: false });
  canvasEl.addEventListener('touchmove', e => {
    if (!lastTouch || !threeMesh) return;
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.clientX;
    const dy = t.clientY - lastTouch.clientY;
    threeEuler.y += dx * 0.01;
    threeEuler.x += dy * 0.01;
    threeMesh.rotation.set(threeEuler.x, threeEuler.y, 0);
    lastTouch = t;
    e.preventDefault();
  }, { passive: false });

  // Scroll zoom
  canvasEl.addEventListener('wheel', e => {
    if (!threeCamera) return;
    threeCamera.position.z = Math.max(2, Math.min(10, threeCamera.position.z + e.deltaY * 0.01));
    e.preventDefault();
  }, { passive: false });
}

function normalizePoints(points) {
  if (!points || points.length < 2) return points;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = 2 / Math.max(rangeX, rangeY);
  return points.map(([x, y]) => [
    (x - minX - rangeX / 2) * scale,
    -(y - minY - rangeY / 2) * scale,
  ]);
}

function buildThreeScene(points) {
  const canvasEl = document.getElementById('ai-3d-canvas');
  const wrap = document.getElementById('ai-3d-canvas-wrap');
  if (!canvasEl || !wrap) return;

  const W = wrap.clientWidth || 360;
  const H = wrap.clientHeight || 260;
  canvasEl.width = W;
  canvasEl.height = H;

  // Dispose previous renderer
  if (threeRenderer) {
    threeRenderer.dispose();
    threeRenderer = null;
  }
  if (threeAnimFrame) {
    cancelAnimationFrame(threeAnimFrame);
    threeAnimFrame = null;
  }

  // Normalize 2D points
  const norm = normalizePoints(points);
  if (!norm || norm.length < 2) return;

  // Build Three.js scene
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x0d0d0f);

  threeCamera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  threeCamera.position.set(0, 0, 5);

  threeRenderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
  threeRenderer.setPixelRatio(window.devicePixelRatio || 1);
  threeRenderer.setSize(W, H);

  // Create Shape from 2D points
  const shape = new THREE.Shape();
  shape.moveTo(norm[0][0], norm[0][1]);
  for (let i = 1; i < norm.length; i++) {
    shape.lineTo(norm[i][0], norm[i][1]);
  }
  shape.closePath();

  const extrudeSettings = {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 4,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  const material = new THREE.MeshPhongMaterial({
    color: 0x60a5fa,
    emissive: 0x1e3a5f,
    shininess: 80,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });

  // Wireframe overlay
  const wireGeo = new THREE.EdgesGeometry(geometry);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x93c5fd, linewidth: 1 });
  const wireframe = new THREE.LineSegments(wireGeo, wireMat);

  threeMesh = new THREE.Group();
  threeMesh.add(new THREE.Mesh(geometry, material));
  threeMesh.add(wireframe);
  threeMesh.rotation.set(threeEuler.x, threeEuler.y, 0);
  threeScene.add(threeMesh);

  // Axes helper
  const axes = new THREE.AxesHelper(1.5);
  threeScene.add(axes);

  // Grid
  const grid = new THREE.GridHelper(4, 10, 0x222228, 0x1a1a22);
  grid.position.y = -1.5;
  threeScene.add(grid);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x334155, 1.5);
  threeScene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(3, 5, 3);
  threeScene.add(dirLight);
  const pointLight = new THREE.PointLight(0x60a5fa, 1.5, 10);
  pointLight.position.set(-2, 2, 2);
  threeScene.add(pointLight);

  // Auto-rotate animation
  let autoRotate = true;
  canvasEl.addEventListener('mousedown', () => { autoRotate = false; }, { once: false });

  function animate() {
    threeAnimFrame = requestAnimationFrame(animate);
    if (autoRotate && threeMesh && !isThreeRotating) {
      threeMesh.rotation.y += 0.005;
      threeEuler.y = threeMesh.rotation.y;
    }
    threeRenderer.render(threeScene, threeCamera);
  }
  animate();

  const statusEl = document.getElementById('ai-3d-status');
  if (statusEl) statusEl.style.display = 'none';
}

function show3DPanel(points) {
  const panel = document.getElementById('ai-3d-panel');
  const statusEl = document.getElementById('ai-3d-status');
  if (!panel) return;

  panel.classList.remove('hidden');
  if (statusEl) {
    statusEl.style.display = 'flex';
    statusEl.textContent = 'Building 3D model…';
  }

  setTimeout(() => buildThreeScene(points), 50);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: HANDWRITTEN MATH GRAPHING
// ═══════════════════════════════════════════════════════════════════════════════

function initMathPanel() {
  const panel = document.getElementById('ai-math-panel');
  const closeBtn = document.getElementById('ai-math-close');
  const header = document.getElementById('ai-math-panel-header');
  if (!panel || !closeBtn) return;

  makeDraggable(panel, header);
  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
  });
}

function cleanMathExpression(raw) {
  if (!raw) return '';
  let expr = raw
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\^/g, '^')
    .replace(/sin\b/gi, 'sin')
    .replace(/cos\b/gi, 'cos')
    .replace(/tan\b/gi, 'tan')
    .replace(/log\b/gi, 'log')
    .replace(/ln\b/gi, 'log')
    .replace(/sqrt\b/gi, 'sqrt')
    .replace(/[|｜]/g, 'abs(x)')
    .replace(/[^\w\d\s\+\-\*\/\^\(\)\.\,]/g, '');

  // If the expression doesn't contain 'x', wrap it
  if (!expr.includes('x') && expr.length > 0) {
    expr = expr + '*x'; // treat as linear coefficient
  }

  return expr || 'sin(x)';
}

function tryParseExpression(raw) {
  // Try various common math OCR misreadings
  const candidates = [
    raw,
    raw.replace(/o/gi, '0'),
    raw.replace(/l/gi, '1').replace(/I/gi, '1'),
    'sin(x)', // fallback
  ];

  for (const candidate of candidates) {
    try {
      const expr = cleanMathExpression(candidate);
      if (!expr) continue;
      // Test evaluate
      if (typeof math !== 'undefined') {
        math.evaluate(expr, { x: 0 });
        return expr;
      }
    } catch (e) {
      // try next
    }
  }
  return 'sin(x)';
}

function renderMathGraph(expression) {
  const chartDiv = document.getElementById('ai-plotly-chart');
  const statusDiv = document.getElementById('ai-math-status');
  const recognizedEl = document.getElementById('ai-math-recognized');
  const exprDisplay = document.getElementById('ai-math-expr-display');

  if (!chartDiv) return;
  if (statusDiv) statusDiv.style.display = 'none';

  if (recognizedEl) recognizedEl.textContent = expression;
  if (exprDisplay) exprDisplay.textContent = `f(x) = ${expression}`;

  // Generate x and y values
  const xs = [], ys = [];
  const steps = 300;
  const xMin = -4 * Math.PI, xMax = 4 * Math.PI;
  const step = (xMax - xMin) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * step;
    xs.push(x);
    try {
      const y = typeof math !== 'undefined'
        ? math.evaluate(expression, { x })
        : Math.sin(x);
      ys.push(typeof y === 'number' && isFinite(y) ? y : null);
    } catch {
      ys.push(null);
    }
  }

  const isDark = !document.body.classList.contains('light-theme');

  const trace = {
    x: xs,
    y: ys,
    mode: 'lines',
    type: 'scatter',
    name: `f(x) = ${expression}`,
    line: { color: '#60a5fa', width: 2.5, shape: 'spline' },
    connectgaps: false,
  };

  const layout = {
    paper_bgcolor: isDark ? '#0d0d0f' : '#fafafb',
    plot_bgcolor: isDark ? '#0d0d0f' : '#fafafb',
    font: { color: isDark ? '#ededf0' : '#121214', family: 'Inter, sans-serif', size: 11 },
    margin: { t: 20, r: 20, b: 40, l: 50 },
    xaxis: {
      title: 'x',
      gridcolor: isDark ? '#1a1a22' : '#e5e6ea',
      zerolinecolor: isDark ? '#27272a' : '#d3d5da',
      tickfont: { size: 10 },
    },
    yaxis: {
      title: 'f(x)',
      gridcolor: isDark ? '#1a1a22' : '#e5e6ea',
      zerolinecolor: isDark ? '#27272a' : '#d3d5da',
      tickfont: { size: 10 },
    },
    showlegend: false,
    dragmode: 'pan',
  };

  const config = { responsive: true, displayModeBar: false, scrollZoom: true };

  if (typeof Plotly !== 'undefined') {
    Plotly.newPlot(chartDiv, [trace], layout, config);
  } else {
    // Plotly not loaded yet, retry
    setTimeout(() => renderMathGraph(expression), 500);
  }
}

async function runMathOCR(canvas) {
  const statusDiv = document.getElementById('ai-math-status');
  const statusText = document.getElementById('ai-math-status-text');

  if (statusDiv) statusDiv.style.display = 'flex';
  if (statusText) statusText.textContent = 'Loading OCR engine…';

  try {
    const { createWorker } = Tesseract;
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (statusText && m.status === 'recognizing text') {
          statusText.textContent = `Scanning: ${Math.round((m.progress || 0) * 100)}%`;
        }
      },
    });

    // Set Tesseract to treat input as sparse characters (good for math)
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789xXyY+-*/^().sincostanlogabsqrtπe ',
      tessedit_pageseg_mode: '7', // single line
    });

    if (statusText) statusText.textContent = 'Recognizing math…';
    const { data: { text } } = await worker.recognize(canvas);
    await worker.terminate();

    return text.trim();
  } catch (err) {
    console.warn('[MathOCR] Tesseract error:', err);
    return '';
  }
}

async function processMathSketch(strokePoints, mainCanvas) {
  const panel = document.getElementById('ai-math-panel');
  const statusDiv = document.getElementById('ai-math-status');
  const statusText = document.getElementById('ai-math-status-text');
  if (!panel) return;

  panel.classList.remove('hidden');
  if (statusDiv) statusDiv.style.display = 'flex';
  if (statusText) statusText.textContent = 'Preparing image…';

  // Crop the region of the canvas containing the drawn strokes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of strokePoints) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const pad = 20;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(mainCanvas.width, maxX + pad);
  maxY = Math.min(mainCanvas.height, maxY + pad);
  const cropW = Math.max(maxX - minX, 10);
  const cropH = Math.max(maxY - minY, 10);

  // Create a cropped canvas for OCR
  const cropCanvas = document.createElement('canvas');
  const scale = window.devicePixelRatio || 1;
  cropCanvas.width = Math.max(cropW * scale, 100);
  cropCanvas.height = Math.max(cropH * scale, 50);
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.fillStyle = '#000000';
  cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
  cropCtx.drawImage(
    mainCanvas,
    minX * scale, minY * scale, cropW * scale, cropH * scale,
    0, 0, cropCanvas.width, cropCanvas.height
  );

  // Run OCR
  const rawText = await runMathOCR(cropCanvas);
  console.log('[MathOCR] Raw text:', rawText);

  const expression = tryParseExpression(rawText || 'sin(x)');
  console.log('[MathOCR] Expression:', expression);

  renderMathGraph(expression);

  // Sync to room
  wsSend({
    type: 'ai_math_graph',
    expression,
    latex: expression,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Hook into app.js via window globals
// ═══════════════════════════════════════════════════════════════════════════════

function hookIntoApp() {
  const mainCanvas = document.getElementById('canvas');
  if (!mainCanvas) return;

  // Tool button event setup
  const btn3d = document.getElementById('btn-sketch3d');
  const btnMath = document.getElementById('btn-mathgraph');
  const toolBtns = document.querySelectorAll('.tool-btn');

  function setActiveTool(toolName) {
    toolBtns.forEach(b => b.classList.remove('active'));
    if (toolName === 'sketch3d' && btn3d) btn3d.classList.add('active');
    if (toolName === 'mathgraph' && btnMath) btnMath.classList.add('active');
  }

  let currentAITool = null;
  let aiStrokePoints = [];
  let aiDrawing = false;

  if (btn3d) {
    btn3d.addEventListener('click', () => {
      currentAITool = 'sketch3d';
      setActiveTool('sketch3d');
      // Also update the main app's tool to 'pen' for drawing
      if (window._appSetTool) window._appSetTool('pen');
    });
  }

  if (btnMath) {
    btnMath.addEventListener('click', () => {
      currentAITool = 'mathgraph';
      setActiveTool('mathgraph');
      if (window._appSetTool) window._appSetTool('pen');
    });
  }

  // Clear AI tool when other tools are clicked
  toolBtns.forEach(btn => {
    if (btn !== btn3d && btn !== btnMath) {
      btn.addEventListener('click', () => {
        currentAITool = null;
        aiStrokePoints = [];
      });
    }
  });

  // Track drawing on canvas when AI tools are active
  mainCanvas.addEventListener('mousedown', (e) => {
    if (!currentAITool) return;
    aiDrawing = true;
    aiStrokePoints = [];
    const rect = mainCanvas.getBoundingClientRect();
    aiStrokePoints.push([e.clientX - rect.left, e.clientY - rect.top]);
  });

  mainCanvas.addEventListener('mousemove', (e) => {
    if (!currentAITool || !aiDrawing) return;
    const rect = mainCanvas.getBoundingClientRect();
    aiStrokePoints.push([e.clientX - rect.left, e.clientY - rect.top]);
  });

  mainCanvas.addEventListener('mouseup', async () => {
    if (!currentAITool || !aiDrawing || aiStrokePoints.length < 2) {
      aiDrawing = false;
      return;
    }
    aiDrawing = false;

    const points = [...aiStrokePoints];
    aiStrokePoints = [];

    if (currentAITool === 'sketch3d') {
      show3DPanel(points);
      wsSend({
        type: 'ai_3d_model',
        points,
        strokeId: 'ai_' + Date.now(),
      });
    } else if (currentAITool === 'mathgraph') {
      await processMathSketch(points, mainCanvas);
    }
  });

  // Touch support
  mainCanvas.addEventListener('touchstart', (e) => {
    if (!currentAITool) return;
    aiDrawing = true;
    aiStrokePoints = [];
    const rect = mainCanvas.getBoundingClientRect();
    const t = e.touches[0];
    aiStrokePoints.push([t.clientX - rect.left, t.clientY - rect.top]);
  }, { passive: true });

  mainCanvas.addEventListener('touchmove', (e) => {
    if (!currentAITool || !aiDrawing) return;
    const rect = mainCanvas.getBoundingClientRect();
    const t = e.touches[0];
    aiStrokePoints.push([t.clientX - rect.left, t.clientY - rect.top]);
  }, { passive: true });

  mainCanvas.addEventListener('touchend', async () => {
    if (!currentAITool || !aiDrawing || aiStrokePoints.length < 2) {
      aiDrawing = false;
      return;
    }
    aiDrawing = false;
    const points = [...aiStrokePoints];
    aiStrokePoints = [];
    if (currentAITool === 'sketch3d') {
      show3DPanel(points);
      wsSend({ type: 'ai_3d_model', points, strokeId: 'ai_' + Date.now() });
    } else if (currentAITool === 'mathgraph') {
      await processMathSketch(points, mainCanvas);
    }
  });

  // ─── Handle incoming WebSocket messages from peers ─────────────────────────
  function patchWebSocket() {
    const ws = window._appWs && window._appWs();
    if (!ws) {
      setTimeout(patchWebSocket, 500);
      return;
    }

    const originalOnMessage = ws.onmessage;
    ws.onmessage = (ev) => {
      // Call original handler first
      if (originalOnMessage) originalOnMessage.call(ws, ev);

      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.type === 'ai_3d_model' && msg.points) {
        show3DPanel(msg.points);
      } else if (msg.type === 'ai_math_graph' && msg.expression) {
        const panel = document.getElementById('ai-math-panel');
        if (panel) panel.classList.remove('hidden');
        renderMathGraph(msg.expression);
        const recognizedEl = document.getElementById('ai-math-recognized');
        const exprDisplay = document.getElementById('ai-math-expr-display');
        const statusDiv = document.getElementById('ai-math-status');
        if (recognizedEl) recognizedEl.textContent = msg.expression;
        if (exprDisplay) exprDisplay.textContent = `f(x) = ${msg.expression}`;
        if (statusDiv) statusDiv.style.display = 'none';
      }
    };
  }

  setTimeout(patchWebSocket, 1000);
}

// ─── DOMContentLoaded Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init3DPanel();
  initMathPanel();

  // Wait for the board screen to become visible (user joined a room)
  const boardScreen = document.getElementById('board-screen');
  if (!boardScreen) return;

  const obs = new MutationObserver(() => {
    if (!boardScreen.classList.contains('hidden')) {
      hookIntoApp();
      obs.disconnect();
    }
  });
  obs.observe(boardScreen, { attributes: true, attributeFilter: ['class'] });

  // Also try immediately in case already visible
  if (!boardScreen.classList.contains('hidden')) {
    hookIntoApp();
  }
});

// Export helpers for app.js to call
window._aiShow3D = show3DPanel;
window._aiRenderGraph = renderMathGraph;
window._aiShowMathPanel = (expr) => {
  const panel = document.getElementById('ai-math-panel');
  if (panel) panel.classList.remove('hidden');
  renderMathGraph(expr);
};
