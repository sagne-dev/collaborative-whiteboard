/**
 * ai-features.js — Intelligent AI-Powered Whiteboard Extensions (100% Free)
 *
 * Feature 1: Intelligent 3D Sketch Recognition & Generation
 *   - Multi-stroke & single-stroke collection with pause auto-trigger or manual Convert button
 *   - Geometric + topological classifier (Cube, Box, Sphere, Cylinder, Cone, Pyramid, Prism, Torus, Extrude)
 *   - Three.js rotatable & zoomable 3D models with live-projected surface & angle labels
 *   - Real-time WebSocket synchronization across all room participants
 *
 * Feature 2: Delayed-Trigger Smart Math Graphing
 *   - Accumulates multi-stroke handwritten equations; never triggers mid-writing or mid-typing
 *   - 2.2s inactivity pause trigger (cancelled immediately on next stroke) + explicit "Generate" button
 *   - High-DPI black-on-white OCR canvas preprocessing + persistent Tesseract.js worker
 *   - Smart math expression normalization, completeness validation, LaTeX formatting (math.js), & Plotly.js graphing
 *   - Real-time WebSocket synchronization across all room participants
 */

import * as THREE from 'three';

// ─── WebSocket & App Bridge ───────────────────────────────────────────────────
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

// ─── Draggable Panel Utility ──────────────────────────────────────────────────
function makeDraggable(panel, handle) {
  if (!panel || !handle) return;
  let isDragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, select, input')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
    const nextLeft = Math.min(maxLeft, Math.max(8, startLeft + (e.clientX - startX)));
    const nextTop = Math.min(maxTop, Math.max(8, startTop + (e.clientY - startY)));
    panel.style.left = nextLeft + 'px';
    panel.style.top = nextTop + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.transform = 'none';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOMETRIC SHAPE CLASSIFIER (Smart 2D Sketch -> 3D Object Recognition)
// ═══════════════════════════════════════════════════════════════════════════════

function dist2D(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += dist2D(pts[i - 1], pts[i]);
  }
  return len;
}

function getBBox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  return {
    minX, minY, maxX, maxY,
    w, h,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    diag: Math.hypot(w, h),
  };
}

function pointToLineDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist2D(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq));
  return dist2D(p, [a[0] + t * dx, a[1] + t * dy]);
}

function rdpSimplify(pts, epsilon) {
  if (!pts || pts.length <= 2) return pts ? [...pts] : [];
  let maxDist = 0;
  let index = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i++) {
    const d = pointToLineDist(pts[i], pts[0], pts[end]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(pts.slice(0, index + 1), epsilon);
    const right = rdpSimplify(pts.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [pts[0], pts[end]];
}

function computeConvexHull(points) {
  if (points.length < 3) return [...points];
  const pts = [...points].sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function polygonArea(pts) {
  if (pts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(area) / 2;
}

function polygonPerimeter(pts) {
  if (pts.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    p += dist2D(pts[i], pts[(i + 1) % pts.length]);
  }
  return p;
}

function simplifyClosedPolygon(hull, epsilon) {
  if (hull.length < 4) return hull;
  const closed = [...hull, hull[0]];
  const simp = rdpSimplify(closed, epsilon);
  if (simp.length > 1 && dist2D(simp[0], simp[simp.length - 1]) < 1e-3) {
    simp.pop();
  }
  // Merge very close adjacent vertices
  const merged = [];
  for (const p of simp) {
    if (merged.length === 0 || dist2D(p, merged[merged.length - 1]) > epsilon * 1.1) {
      merged.push(p);
    }
  }
  if (merged.length > 2 && dist2D(merged[0], merged[merged.length - 1]) <= epsilon * 1.1) {
    merged.pop();
  }
  return merged;
}

function cornerAngles(poly) {
  const angles = [];
  const n = poly.length;
  if (n < 3) return angles;
  for (let i = 0; i < n; i++) {
    const prev = poly[(i - 1 + n) % n];
    const curr = poly[i];
    const next = poly[(i + 1) % n];
    const v1 = [prev[0] - curr[0], prev[1] - curr[1]];
    const v2 = [next[0] - curr[0], next[1] - curr[1]];
    const m1 = Math.hypot(v1[0], v1[1]) || 1;
    const m2 = Math.hypot(v2[0], v2[1]) || 1;
    const cosA = Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (m1 * m2)));
    angles.push((Math.acos(cosA) * 180) / Math.PI);
  }
  return angles;
}

function resamplePoints(pts, count = 48) {
  if (!pts || pts.length < 2) return pts || [];
  const totalLen = polylineLength(pts);
  if (totalLen === 0) return pts;
  const step = totalLen / (count - 1);
  const out = [pts[0]];
  let accum = 0;
  let prev = pts[0];
  for (let i = 1; i < pts.length; i++) {
    let curr = pts[i];
    let segLen = dist2D(prev, curr);
    while (accum + segLen >= step && out.length < count) {
      const t = (step - accum) / (segLen || 1);
      const nx = prev[0] + t * (curr[0] - prev[0]);
      const ny = prev[1] + t * (curr[1] - prev[1]);
      const np = [nx, ny];
      out.push(np);
      prev = np;
      segLen = dist2D(prev, curr);
      accum = 0;
    }
    accum += segLen;
    prev = curr;
  }
  while (out.length < count) out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Analyze one or more 2D strokes and classify the intended 3D geometric object.
 * Returns { shapeType, confidence, label, dimensions, outlinePoints }
 */
function classify3DSketch(strokes) {
  const validStrokes = (strokes || []).filter(s => s && s.points && s.points.length >= 2);
  if (validStrokes.length === 0) {
    return {
      shapeType: 'cube',
      confidence: 0.5,
      label: 'Cube',
      dimensions: { w: 1.5, h: 1.5, d: 1.5 },
      outlinePoints: [],
    };
  }

  const allPts = [];
  for (const s of validStrokes) {
    for (const p of s.points) allPts.push(p);
  }

  const bbox = getBBox(allPts);
  const aspect = bbox.w / bbox.h;
  const normScale = 2 / Math.max(bbox.w, bbox.h);
  const dimW = Math.max(0.55, Math.min(2.4, bbox.w * normScale));
  const dimH = Math.max(0.55, Math.min(2.4, bbox.h * normScale));
  const dimD = Math.max(0.65, Math.min(1.8, (dimW + dimH) * 0.5));

  const hull = computeConvexHull(allPts);
  const hullArea = polygonArea(hull);
  const hullPerim = polygonPerimeter(hull) || 1;
  const circularity = (4 * Math.PI * hullArea) / (hullPerim * hullPerim);
  const rectangularity = hullArea / (bbox.w * bbox.h);
  const simpHull = simplifyClosedPolygon(hull, bbox.diag * 0.045);
  const hullVerts = simpHull.length;
  const angles = cornerAngles(simpHull);

  // Per-stroke geometric traits
  const strokeTraits = validStrokes.map((s) => {
    const pts = s.points;
    const sb = getBBox(pts);
    const len = polylineLength(pts) || 1;
    const endDist = dist2D(pts[0], pts[pts.length - 1]);
    const isClosed = endDist < Math.max(sb.diag * 0.28, 18) && len > sb.diag * 1.8;
    const simp = rdpSimplify(pts, Math.max(sb.diag * 0.05, 4));
    const straightness = endDist / len;

    // Extract line segments from simplified stroke
    const segs = [];
    for (let i = 1; i < simp.length; i++) {
      const a = simp[i - 1], b = simp[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const segLen = Math.hypot(dx, dy);
      if (segLen > bbox.diag * 0.06) {
        const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
        const isVert = angle > 68 && angle < 112;
        const isHoriz = angle < 22 || angle > 158;
        segs.push({ a, b, dx, dy, segLen, isVert, isHoriz });
      }
    }

    const sHull = computeConvexHull(pts);
    const sArea = polygonArea(sHull);
    const sPerim = polygonPerimeter(sHull) || 1;
    const sCirc = (4 * Math.PI * sArea) / (sPerim * sPerim);

    return {
      pts, bbox: sb, len, isClosed, simp, straightness, segs,
      circularity: sCirc,
      area: sArea,
    };
  });

  const closedStrokes = strokeTraits.filter(t => t.isClosed);
  const allSegs = strokeTraits.flatMap(t => t.segs);
  const vertSegs = allSegs.filter(sg => sg.isVert);
  const horizSegs = allSegs.filter(sg => sg.isHoriz);

  // Vertical side-wall check (segments near left/right edges of overall bbox)
  const leftWallSegs = vertSegs.filter(sg => ((sg.a[0] + sg.b[0]) / 2 - bbox.minX) < bbox.w * 0.28 && sg.segLen > bbox.h * 0.28);
  const rightWallSegs = vertSegs.filter(sg => (bbox.maxX - (sg.a[0] + sg.b[0]) / 2) < bbox.w * 0.28 && sg.segLen > bbox.h * 0.28);

  // Width profile across top 25%, middle 50%, bottom 25% bands
  const bandSpan = (yLo, yHi) => {
    let lo = Infinity, hi = -Infinity, count = 0;
    for (const [x, y] of allPts) {
      if (y >= yLo && y <= yHi) {
        if (x < lo) lo = x;
        if (x > hi) hi = x;
        count++;
      }
    }
    return count > 0 ? (hi - lo) : 0;
  };
  const topWidth = bandSpan(bbox.minY, bbox.minY + bbox.h * 0.22);
  const midWidth = bandSpan(bbox.minY + bbox.h * 0.38, bbox.minY + bbox.h * 0.62);
  const botWidth = bandSpan(bbox.maxY - bbox.h * 0.22, bbox.maxY);

  // Check internal points (points well inside the convex hull / away from bbox border)
  const internalPtsCount = allPts.filter(([x, y]) => {
    const nx = (x - bbox.minX) / bbox.w;
    const ny = (y - bbox.minY) / bbox.h;
    return nx > 0.25 && nx < 0.75 && ny > 0.25 && ny < 0.75;
  }).length;
  const internalRatio = internalPtsCount / allPts.length;

  // Compute primary outline points for fallback extrusion
  const primaryClosed = closedStrokes.sort((a, b) => b.area - a.area)[0];
  const outlineRaw = primaryClosed ? primaryClosed.pts : simpHull;
  const outlinePoints = resamplePoints(outlineRaw, 48);

  // Measure concavity/solidity ONLY for single-closed-stroke drawings (stars, arrows, custom shapes)
  // Multi-stroke shapes (offset-square cubes, cylinder + top ellipse, cone + base) naturally have smaller sub-strokes
  let primarySolidity = 1.0;
  let primarySimpCount = hullVerts;
  if (primaryClosed && hullArea > 0) {
    const rawPolyArea = polygonArea(primaryClosed.pts);
    primarySolidity = rawPolyArea / hullArea;
    primarySimpCount = rdpSimplify(primaryClosed.pts, bbox.diag * 0.05).length;
  }
  const isConcaveCustom =
    validStrokes.length === 1 &&
    closedStrokes.length === 1 &&
    (primarySolidity < 0.68 || (primarySimpCount >= 9 && circularity < 0.78));

  // ── 1. TORUS / RING: 2+ concentric closed circular loops ──
  if (closedStrokes.length >= 2) {
    const sortedClosed = [...closedStrokes].sort((a, b) => b.area - a.area);
    const outer = sortedClosed[0];
    const inner = sortedClosed[1];
    const centerDist = dist2D([outer.bbox.cx, outer.bbox.cy], [inner.bbox.cx, inner.bbox.cy]);
    const outerR = outer.bbox.diag / 2;
    const innerR = inner.bbox.diag / 2;
    const isNested =
      inner.bbox.minX >= outer.bbox.minX - outer.bbox.w * 0.1 &&
      inner.bbox.maxX <= outer.bbox.maxX + outer.bbox.w * 0.1 &&
      inner.bbox.minY >= outer.bbox.minY - outer.bbox.h * 0.1 &&
      inner.bbox.maxY <= outer.bbox.maxY + outer.bbox.h * 0.1;
    if (isNested && centerDist < outerR * 0.4 && innerR < outerR * 0.85 && outer.circularity > 0.62 && inner.circularity > 0.55) {
      return {
        shapeType: 'torus',
        confidence: 0.94,
        label: 'Torus (Ring)',
        dimensions: { w: 1.4, h: 1.4, d: 0.48 },
        outlinePoints,
      };
    }
  }

  // ── 2. ISOMETRIC / MULTI-QUAD CUBE (check before Sphere & Cylinder) ──
  const quadStrokes = closedStrokes.filter(t => {
    const sHull = computeConvexHull(t.pts);
    const sSimp = simplifyClosedPolygon(sHull, t.bbox.diag * 0.06);
    const sAngles = cornerAngles(sSimp);
    const sRight = sAngles.filter(a => Math.abs(a - 90) < 25).length;
    return sSimp.length === 4 && sRight >= 3 && (t.area / (t.bbox.w * t.bbox.h)) > 0.72;
  });

  const isIsometricCube =
    (hullVerts >= 5 && hullVerts <= 7) &&
    internalRatio > 0.04 &&
    allSegs.length >= 6 &&
    vertSegs.length >= 2;

  if (!isConcaveCustom && (isIsometricCube || quadStrokes.length >= 2)) {
    const isCubeAspect = aspect >= 0.74 && aspect <= 1.35;
    if (isCubeAspect) {
      const size = Math.max(1.2, (dimW + dimH) / 2);
      return {
        shapeType: 'cube',
        confidence: 0.95,
        label: 'Cube',
        dimensions: { w: size, h: size, d: size },
        outlinePoints,
      };
    }
    return {
      shapeType: 'box',
      confidence: 0.92,
      label: 'Rectangular Box',
      dimensions: { w: dimW, h: dimH, d: Math.min(dimW, dimH) * 0.85 },
      outlinePoints,
    };
  }

  // ── 3. CYLINDER: Top/bottom ellipse + vertical side walls ──
  const isPerspectiveEllipse = (t) =>
    t.isClosed &&
    t.bbox.w > bbox.w * 0.45 &&
    t.bbox.w > t.bbox.h * 1.15 &&
    t.circularity > 0.36 &&
    (t.area / (t.bbox.w * t.bbox.h)) > 0.55 &&
    !quadStrokes.includes(t);

  const topEllipses = closedStrokes.filter(t => t.bbox.cy < bbox.minY + bbox.h * 0.42 && isPerspectiveEllipse(t));
  const botEllipses = closedStrokes.filter(t => t.bbox.cy > bbox.maxY - bbox.h * 0.42 && isPerspectiveEllipse(t));
  const hasCylinderStructure =
    (leftWallSegs.length >= 1 && rightWallSegs.length >= 1 && (topEllipses.length >= 1 || botEllipses.length >= 1)) ||
    (topEllipses.length >= 1 && botEllipses.length >= 1 && vertSegs.length >= 2) ||
    (leftWallSegs.length >= 1 && rightWallSegs.length >= 1 && circularity < 0.84 && rectangularity > 0.72 && rectangularity < 0.94 && topWidth > bbox.w * 0.6 && botWidth > bbox.w * 0.6 && strokeTraits.length >= 2 && horizSegs.length < 2);

  if (!isConcaveCustom && hasCylinderStructure) {
    return {
      shapeType: 'cylinder',
      confidence: 0.92,
      label: 'Cylinder',
      dimensions: { w: dimW, h: Math.max(dimH, 1.0), d: dimW },
      outlinePoints,
    };
  }

  // ── 4. CUBE / RECTANGULAR BOX (single rect or multi-edge straight box) ──
  const isMultiStrokeBox =
    (validStrokes.length >= 3 && horizSegs.length >= 2 && vertSegs.length >= 2 && rectangularity > 0.62) ||
    (allSegs.length >= 6 && (horizSegs.length + vertSegs.length) >= 4 && internalRatio > 0.05);

  const rightAnglesCount = angles.filter(a => Math.abs(a - 90) < 25).length;
  const isSingleRect = hullVerts === 4 && rectangularity > 0.75 && rightAnglesCount >= 3;

  if (!isConcaveCustom && (isMultiStrokeBox || isSingleRect)) {
    const isCubeAspect = aspect >= 0.74 && aspect <= 1.35;
    if (isCubeAspect) {
      const size = Math.max(1.2, (dimW + dimH) / 2);
      return {
        shapeType: 'cube',
        confidence: 0.89,
        label: 'Cube',
        dimensions: { w: size, h: size, d: size },
        outlinePoints,
      };
    } else {
      return {
        shapeType: 'box',
        confidence: 0.91,
        label: 'Rectangular Box',
        dimensions: { w: dimW, h: dimH, d: Math.min(dimW, dimH) * 0.85 },
        outlinePoints,
      };
    }
  }

  // ── 4. CONE vs PYRAMID: Tapered apex (must have high solidity so stars/arrows aren't misclassified) ──
  const taperedTop = topWidth < botWidth * 0.45 && midWidth >= topWidth && botWidth > bbox.w * 0.55;
  const taperedBot = botWidth < topWidth * 0.45 && midWidth >= botWidth && topWidth > bbox.w * 0.55;
  if (!isConcaveCustom && (taperedTop || taperedBot || hullVerts === 3)) {
    const baseRegionStrokes = strokeTraits.filter(t =>
      taperedBot ? t.bbox.cy < bbox.minY + bbox.h * 0.45 : t.bbox.cy > bbox.maxY - bbox.h * 0.45
    );
    const hasCurvedBase =
      botEllipses.length >= 1 ||
      topEllipses.length >= 1 ||
      baseRegionStrokes.some(t => t.isClosed && t.circularity > 0.68 && t.bbox.w > t.bbox.h * 1.2) ||
      (hullVerts >= 5 && circularity > 0.62 && (taperedTop || taperedBot));

    const hasInternalRidge = strokeTraits.length >= 2 && internalRatio > 0.08;

    if (hasCurvedBase) {
      return {
        shapeType: 'cone',
        confidence: 0.91,
        label: 'Cone',
        dimensions: { w: dimW, h: dimH, d: dimW },
        outlinePoints,
      };
    }

    if (hullVerts === 3 || (taperedTop && !hasCurvedBase)) {
      return {
        shapeType: 'pyramid',
        confidence: hasInternalRidge ? 0.92 : 0.86,
        label: 'Square Pyramid',
        dimensions: { w: dimW, h: dimH, d: dimW },
        outlinePoints,
      };
    }
  }

  // ── 5. SPHERE: Smooth circular silhouette (high solidity & many vertices, not polygonal hexagon) ──
  if (!isConcaveCustom && circularity > 0.76 && aspect >= 0.72 && aspect <= 1.38 && hullVerts >= 7) {
    const r = (dimW + dimH) / 2;
    return {
      shapeType: 'sphere',
      confidence: internalRatio > 0.08 ? 0.95 : 0.9,
      label: 'Sphere',
      dimensions: { w: r, h: r, d: r },
      outlinePoints,
    };
  }

  // ── 6. TRIANGULAR PRISM / WEDGE ──
  if (!isConcaveCustom && hullVerts === 4 && topWidth < botWidth * 0.75 && topWidth > botWidth * 0.25 && rightAnglesCount <= 2) {
    return {
      shapeType: 'prism',
      confidence: 0.82,
      label: 'Triangular Prism',
      dimensions: { w: dimW, h: dimH, d: dimD },
      outlinePoints,
    };
  }

  // ── 7. FALLBACK: Smoothed Custom 3D Extrusion for stars, arrows, freeform silhouettes ──
  return {
    shapeType: 'extrude',
    confidence: 0.82,
    label: 'Custom 3D Extrusion',
    dimensions: { w: dimW, h: dimH, d: 0.55 },
    outlinePoints,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: THREE.JS 3D SCENE BUILDER + PROJECTED SURFACE & ANGLE LABELS
// ═══════════════════════════════════════════════════════════════════════════════

let threeRenderer = null;
let threeScene = null;
let threeCamera = null;
let threeGroup = null;
let threeWireframe = null;
let threeAnimFrame = null;
let isThreeRotating = false;
let autoRotate3D = true;
let showLabels3D = true;
let showWire3D = true;
let threeLastX = 0;
let threeLastY = 0;
let threeEuler = { x: 0.35, y: 0.55 };
let current3DModelData = null;
let threeAnchorLabels = []; // [{ text, kind: 'surface'|'angle', pos: THREE.Vector3 }]

function getNormalizedOutline(points) {
  if (!points || points.length < 3) return [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]];
  const b = getBBox(points);
  const scale = 2.0 / Math.max(b.w, b.h);
  return points.map(([x, y]) => [
    (x - b.cx) * scale,
    -(y - b.cy) * scale,
  ]);
}

function createGeometryAndLabels(modelData) {
  const shapeType = modelData.shapeType || 'cube';
  const d = modelData.dimensions || { w: 1.5, h: 1.5, d: 1.5 };
  const w = Math.max(0.5, Math.min(2.4, d.w || 1.5));
  const h = Math.max(0.5, Math.min(2.4, d.h || 1.5));
  const depth = Math.max(0.5, Math.min(2.2, d.d || 1.5));

  let geometry;
  const anchors = [];

  switch (shapeType) {
    case 'cube': {
      const s = (w + h) / 2;
      geometry = new THREE.BoxGeometry(s, s, s);
      const half = s / 2;
      anchors.push(
        { text: 'Top Face', kind: 'surface', pos: new THREE.Vector3(0, half + 0.08, 0) },
        { text: 'Front Face', kind: 'surface', pos: new THREE.Vector3(0, 0, half + 0.08) },
        { text: 'Side Face', kind: 'surface', pos: new THREE.Vector3(half + 0.08, 0, 0) },
        { text: '90°', kind: 'angle', pos: new THREE.Vector3(half, half, half) },
        { text: '90°', kind: 'angle', pos: new THREE.Vector3(-half, -half, half) }
      );
      break;
    }

    case 'box': {
      geometry = new THREE.BoxGeometry(w, h, depth);
      anchors.push(
        { text: 'Top Surface', kind: 'surface', pos: new THREE.Vector3(0, h / 2 + 0.08, 0) },
        { text: 'Front Face', kind: 'surface', pos: new THREE.Vector3(0, 0, depth / 2 + 0.08) },
        { text: 'Side Face', kind: 'surface', pos: new THREE.Vector3(w / 2 + 0.08, 0, 0) },
        { text: '90°', kind: 'angle', pos: new THREE.Vector3(w / 2, h / 2, depth / 2) }
      );
      break;
    }

    case 'sphere': {
      const r = Math.max(0.65, Math.min(1.2, (w + h) / 4 + 0.15));
      geometry = new THREE.SphereGeometry(r, 32, 24);
      anchors.push(
        { text: 'Spherical Surface', kind: 'surface', pos: new THREE.Vector3(0, r + 0.1, 0) },
        { text: 'Equator 360°', kind: 'angle', pos: new THREE.Vector3(r + 0.06, 0, 0) },
        { text: 'Pole', kind: 'surface', pos: new THREE.Vector3(0, -r - 0.08, 0) }
      );
      break;
    }

    case 'cylinder': {
      const r = Math.max(0.45, Math.min(1.0, w / 2));
      const ch = Math.max(1.0, Math.min(2.1, h));
      geometry = new THREE.CylinderGeometry(r, r, ch, 36, 1);
      anchors.push(
        { text: 'Circular Top', kind: 'surface', pos: new THREE.Vector3(0, ch / 2 + 0.08, 0) },
        { text: 'Curved Wall', kind: 'surface', pos: new THREE.Vector3(r + 0.08, 0, 0) },
        { text: 'Circular Base', kind: 'surface', pos: new THREE.Vector3(0, -ch / 2 - 0.08, 0) },
        { text: '90°', kind: 'angle', pos: new THREE.Vector3(r, ch / 2, 0) }
      );
      break;
    }

    case 'cone': {
      const r = Math.max(0.55, Math.min(1.1, w / 2));
      const ch = Math.max(1.0, Math.min(2.1, h));
      geometry = new THREE.ConeGeometry(r, ch, 36, 1);
      const apexAngle = Math.round((2 * Math.atan(r / ch) * 180) / Math.PI);
      anchors.push(
        { text: `Apex (${apexAngle}°)`, kind: 'angle', pos: new THREE.Vector3(0, ch / 2 + 0.1, 0) },
        { text: 'Conical Surface', kind: 'surface', pos: new THREE.Vector3(r * 0.65, 0, r * 0.4) },
        { text: 'Circular Base', kind: 'surface', pos: new THREE.Vector3(0, -ch / 2 - 0.08, 0) }
      );
      break;
    }

    case 'pyramid': {
      const r = Math.max(0.65, Math.min(1.2, w / 2));
      const ph = Math.max(1.0, Math.min(2.1, h));
      geometry = new THREE.ConeGeometry(r, ph, 4, 1);
      geometry.rotateY(Math.PI / 4);
      anchors.push(
        { text: 'Apex', kind: 'angle', pos: new THREE.Vector3(0, ph / 2 + 0.1, 0) },
        { text: 'Triangular Face', kind: 'surface', pos: new THREE.Vector3(0, 0, r * 0.55) },
        { text: 'Square Base', kind: 'surface', pos: new THREE.Vector3(0, -ph / 2 - 0.08, 0) },
        { text: '90° Base', kind: 'angle', pos: new THREE.Vector3(r * 0.7, -ph / 2, r * 0.7) }
      );
      break;
    }

    case 'prism': {
      const r = Math.max(0.6, Math.min(1.1, w / 2));
      const pl = Math.max(1.0, Math.min(2.0, depth));
      geometry = new THREE.CylinderGeometry(r, r, pl, 3, 1);
      geometry.rotateZ(Math.PI / 2);
      anchors.push(
        { text: 'Triangular End', kind: 'surface', pos: new THREE.Vector3(pl / 2 + 0.08, 0, 0) },
        { text: 'Sloped Face', kind: 'surface', pos: new THREE.Vector3(0, r * 0.6, r * 0.4) },
        { text: '60°', kind: 'angle', pos: new THREE.Vector3(pl / 2, r, 0) }
      );
      break;
    }

    case 'torus': {
      geometry = new THREE.TorusGeometry(0.85, 0.3, 20, 48);
      anchors.push(
        { text: 'Tube Surface', kind: 'surface', pos: new THREE.Vector3(0, 1.15, 0) },
        { text: '360° Ring', kind: 'angle', pos: new THREE.Vector3(1.15, 0, 0) },
        { text: 'Inner Bore', kind: 'surface', pos: new THREE.Vector3(0, 0, 0.1) }
      );
      break;
    }

    case 'extrude':
    default: {
      const norm = getNormalizedOutline(modelData.outlinePoints || modelData.points);
      const shape = new THREE.Shape();
      shape.moveTo(norm[0][0], norm[0][1]);
      for (let i = 1; i < norm.length; i++) {
        shape.lineTo(norm[i][0], norm[i][1]);
      }
      shape.closePath();

      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.55,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.05,
        bevelSegments: 3,
      });
      geometry.center();
      anchors.push(
        { text: 'Front Surface', kind: 'surface', pos: new THREE.Vector3(0, 0, 0.35) },
        { text: 'Extruded Wall', kind: 'surface', pos: new THREE.Vector3(0.8, 0.4, 0) },
        { text: 'Back Face', kind: 'surface', pos: new THREE.Vector3(0, 0, -0.35) }
      );
      break;
    }
  }

  return { geometry, anchors };
}

function updateProjectedLabels() {
  const layer = document.getElementById('ai-3d-labels-layer');
  const wrap = document.getElementById('ai-3d-canvas-wrap');
  if (!layer || !wrap || !threeCamera || !threeGroup) return;

  if (!showLabels3D) {
    layer.innerHTML = '';
    return;
  }

  const W = wrap.clientWidth || 380;
  const H = wrap.clientHeight || 280;

  if (layer.childElementCount !== threeAnchorLabels.length) {
    layer.innerHTML = '';
    threeAnchorLabels.forEach((lbl) => {
      const el = document.createElement('span');
      el.className = `ai-3d-proj-label ${lbl.kind}`;
      el.textContent = lbl.text;
      layer.appendChild(el);
    });
  }

  const worldVec = new THREE.Vector3();
  const children = layer.children;
  for (let i = 0; i < threeAnchorLabels.length; i++) {
    const lbl = threeAnchorLabels[i];
    const el = children[i];
    if (!el) continue;

    worldVec.copy(lbl.pos).applyMatrix4(threeGroup.matrixWorld);
    const depthZ = worldVec.z;
    worldVec.project(threeCamera);

    const x = (worldVec.x * 0.5 + 0.5) * W;
    const y = (-worldVec.y * 0.5 + 0.5) * H;

    const outOfBounds = x < 16 || x > W - 16 || y < 14 || y > H - 14;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.opacity = outOfBounds ? '0' : (depthZ < -0.45 ? '0.42' : '1');
  }
}

function buildThreeScene(modelData) {
  const canvasEl = document.getElementById('ai-3d-canvas');
  const wrap = document.getElementById('ai-3d-canvas-wrap');
  const badgeEl = document.getElementById('ai-3d-detected-badge');
  const selectEl = document.getElementById('ai-3d-shape-select');
  const infoEl = document.getElementById('ai-3d-info');
  if (!canvasEl || !wrap) return;

  current3DModelData = modelData;

  const W = wrap.clientWidth || 400;
  const H = wrap.clientHeight || 280;
  canvasEl.width = W;
  canvasEl.height = H;

  if (threeAnimFrame) {
    cancelAnimationFrame(threeAnimFrame);
    threeAnimFrame = null;
  }
  if (threeRenderer) {
    threeRenderer.dispose();
    threeRenderer = null;
  }

  const isDark = !document.body.classList.contains('light-theme');
  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(isDark ? 0x0d0d0f : 0xf4f4f6);

  threeCamera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
  threeCamera.position.set(0, 0.35, 4.6);
  threeCamera.lookAt(0, 0, 0);

  threeRenderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  threeRenderer.setSize(W, H);

  const { geometry, anchors } = createGeometryAndLabels(modelData);
  threeAnchorLabels = anchors;

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x3b82f6,
    emissive: 0x0f2547,
    roughness: 0.28,
    metalness: 0.15,
    clearcoat: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const wireGeo = new THREE.EdgesGeometry(geometry, 18);
  const wireMat = new THREE.LineBasicMaterial({
    color: isDark ? 0x93c5fd : 0x1d4ed8,
    transparent: true,
    opacity: 0.9,
  });
  threeWireframe = new THREE.LineSegments(wireGeo, wireMat);
  threeWireframe.visible = showWire3D;

  threeGroup = new THREE.Group();
  threeGroup.add(mesh);
  threeGroup.add(threeWireframe);
  threeGroup.rotation.set(threeEuler.x, threeEuler.y, 0);
  threeScene.add(threeGroup);

  // Subtle floor grid & XYZ axes
  const grid = new THREE.GridHelper(4.5, 10, isDark ? 0x2a2a35 : 0xd0d4dc, isDark ? 0x1a1a22 : 0xe4e6ec);
  grid.position.y = -1.45;
  threeScene.add(grid);

  const axes = new THREE.AxesHelper(1.3);
  threeScene.add(axes);

  // 3-point studio lighting
  threeScene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.65 : 0.95));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(4, 6, 4);
  threeScene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.0);
  rimLight.position.set(-4, 2, -3);
  threeScene.add(rimLight);

  // Update UI badges
  const confPct = modelData.confidence ? `${Math.round(modelData.confidence * 100)}%` : '';
  const shapeNames = {
    cube: 'Cube',
    box: 'Rectangular Box',
    sphere: 'Sphere',
    cylinder: 'Cylinder',
    cone: 'Cone',
    pyramid: 'Square Pyramid',
    prism: 'Triangular Prism',
    torus: 'Torus / Ring',
    extrude: 'Custom 3D Extrude',
  };
  const displayName = modelData.label || shapeNames[modelData.shapeType] || '3D Model';
  if (badgeEl) badgeEl.textContent = confPct ? `${displayName} · ${confPct}` : displayName;
  if (selectEl) selectEl.value = modelData.shapeType || 'cube';
  if (infoEl) {
    const by = modelData.userName ? `Shared by ${modelData.userName}` : 'Synced to room';
    infoEl.textContent = `Drag to rotate · Scroll to zoom · ${by}`;
  }

  // Clear old label nodes so they rebuild cleanly
  const layer = document.getElementById('ai-3d-labels-layer');
  if (layer) layer.innerHTML = '';

  function animate() {
    threeAnimFrame = requestAnimationFrame(animate);
    if (autoRotate3D && threeGroup && !isThreeRotating) {
      threeGroup.rotation.y += 0.005;
      threeEuler.y = threeGroup.rotation.y;
    }
    threeGroup.updateMatrixWorld();
    threeRenderer.render(threeScene, threeCamera);
    updateProjectedLabels();
  }
  animate();

  const statusEl = document.getElementById('ai-3d-status');
  if (statusEl) statusEl.style.display = 'none';
}

function show3DPanel(input) {
  const panel = document.getElementById('ai-3d-panel');
  const statusEl = document.getElementById('ai-3d-status');
  if (!panel) return;

  // Accept either legacy points array or full modelData payload
  const modelData = Array.isArray(input)
    ? classify3DSketch([{ points: input }])
    : input;

  panel.classList.remove('hidden');
  if (statusEl) {
    statusEl.style.display = 'flex';
    statusEl.textContent = 'Building 3D model…';
  }

  setTimeout(() => buildThreeScene(modelData), 40);
}

function init3DPanel() {
  const panel = document.getElementById('ai-3d-panel');
  const closeBtn = document.getElementById('ai-3d-close');
  const header = document.getElementById('ai-3d-panel-header');
  const canvasEl = document.getElementById('ai-3d-canvas');
  const selectEl = document.getElementById('ai-3d-shape-select');
  const labelsBtn = document.getElementById('ai-3d-labels-toggle');
  const wireBtn = document.getElementById('ai-3d-wire-toggle');
  const resetBtn = document.getElementById('ai-3d-reset-btn');

  if (!panel || !closeBtn || !canvasEl) return;

  makeDraggable(panel, header);

  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
    if (threeAnimFrame) cancelAnimationFrame(threeAnimFrame);
  });

  if (selectEl) {
    selectEl.addEventListener('change', () => {
      if (!current3DModelData) return;
      const updated = {
        ...current3DModelData,
        shapeType: selectEl.value,
        label: selectEl.options[selectEl.selectedIndex]?.text || selectEl.value,
        confidence: 1.0,
      };
      buildThreeScene(updated);
      wsSend({
        type: 'ai_3d_model',
        shapeType: updated.shapeType,
        dimensions: updated.dimensions,
        confidence: updated.confidence,
        label: updated.label,
        points: updated.outlinePoints || updated.points || [],
        strokeId: 'ai_3d_' + Date.now(),
      });
    });
  }

  if (labelsBtn) {
    labelsBtn.addEventListener('click', () => {
      showLabels3D = !showLabels3D;
      labelsBtn.textContent = showLabels3D ? 'Labels: ON' : 'Labels: OFF';
      labelsBtn.classList.toggle('active', showLabels3D);
      updateProjectedLabels();
    });
  }

  if (wireBtn) {
    wireBtn.addEventListener('click', () => {
      showWire3D = !showWire3D;
      wireBtn.classList.toggle('active', showWire3D);
      if (threeWireframe) threeWireframe.visible = showWire3D;
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      threeEuler = { x: 0.35, y: 0.55 };
      autoRotate3D = true;
      if (threeGroup) threeGroup.rotation.set(threeEuler.x, threeEuler.y, 0);
      if (threeCamera) threeCamera.position.set(0, 0.35, 4.6);
    });
  }

  // Mouse rotation
  canvasEl.addEventListener('mousedown', (e) => {
    isThreeRotating = true;
    autoRotate3D = false;
    threeLastX = e.clientX;
    threeLastY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isThreeRotating || !threeGroup) return;
    const dx = e.clientX - threeLastX;
    const dy = e.clientY - threeLastY;
    threeEuler.y += dx * 0.009;
    threeEuler.x += dy * 0.009;
    threeGroup.rotation.set(threeEuler.x, threeEuler.y, 0);
    threeLastX = e.clientX;
    threeLastY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    isThreeRotating = false;
  });

  // Touch rotation
  let lastTouch = null;
  canvasEl.addEventListener('touchstart', (e) => {
    autoRotate3D = false;
    lastTouch = e.touches[0];
    e.preventDefault();
  }, { passive: false });

  canvasEl.addEventListener('touchmove', (e) => {
    if (!lastTouch || !threeGroup) return;
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.clientX;
    const dy = t.clientY - lastTouch.clientY;
    threeEuler.y += dx * 0.011;
    threeEuler.x += dy * 0.011;
    threeGroup.rotation.set(threeEuler.x, threeEuler.y, 0);
    lastTouch = t;
    e.preventDefault();
  }, { passive: false });

  // Scroll zoom
  canvasEl.addEventListener('wheel', (e) => {
    if (!threeCamera) return;
    threeCamera.position.z = Math.max(2.2, Math.min(9.5, threeCamera.position.z + e.deltaY * 0.005));
    e.preventDefault();
  }, { passive: false });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: DELAYED-TRIGGER SMART MATH GRAPHING
// ═══════════════════════════════════════════════════════════════════════════════

let tesseractWorkerPromise = null;
let mathTypingTimer = null;
let currentMathExpression = '';

function getOcrWorker() {
  if (!tesseractWorkerPromise) {
    const statusText = document.getElementById('ai-math-status-text');
    if (statusText) statusText.textContent = 'Loading math OCR engine (first time only)…';
    tesseractWorkerPromise = (async () => {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          const el = document.getElementById('ai-math-status-text');
          if (el && m.status === 'recognizing text') {
            el.textContent = `Recognizing formula: ${Math.round((m.progress || 0) * 100)}%`;
          }
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789xyzXYZ+-*/^().=sincostanlogebqrπ ',
        tessedit_pageseg_mode: '7',
      });
      return worker;
    })().catch((err) => {
      tesseractWorkerPromise = null;
      throw err;
    });
  }
  return tesseractWorkerPromise;
}

/**
 * Render all accumulated math strokes cleanly as black ink on crisp white canvas
 * for optimal Tesseract OCR recognition regardless of dark/light whiteboard theme.
 */
function renderStrokesForOCR(strokes) {
  const allPts = strokes.flatMap(s => s.points || []);
  const bbox = getBBox(allPts);
  const pad = 36;
  const targetH = Math.max(180, Math.min(420, bbox.h * 2.5));
  const scale = targetH / Math.max(bbox.h, 24);

  const cw = Math.max(280, Math.round(bbox.w * scale + pad * 2));
  const ch = Math.max(160, Math.round(bbox.h * scale + pad * 2));

  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = cw;
  ocrCanvas.height = ch;
  const octx = ocrCanvas.getContext('2d');

  // Pure white background
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, cw, ch);

  // Pure black smooth strokes
  octx.strokeStyle = '#000000';
  octx.fillStyle = '#000000';
  octx.lineCap = 'round';
  octx.lineJoin = 'round';
  octx.lineWidth = Math.max(4, Math.min(9, scale * 3.5));

  for (const s of strokes) {
    const pts = s.points;
    if (!pts || pts.length === 0) continue;
    const mapX = (x) => (x - bbox.minX) * scale + pad;
    const mapY = (y) => (y - bbox.minY) * scale + pad;

    octx.beginPath();
    if (pts.length === 1) {
      octx.arc(mapX(pts[0][0]), mapY(pts[0][1]), octx.lineWidth / 2, 0, Math.PI * 2);
      octx.fill();
    } else {
      octx.moveTo(mapX(pts[0][0]), mapY(pts[0][1]));
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const mx = (mapX(prev[0]) + mapX(curr[0])) / 2;
        const my = (mapY(prev[1]) + mapY(curr[1])) / 2;
        octx.quadraticCurveTo(mapX(prev[0]), mapY(prev[1]), mx, my);
      }
      const last = pts[pts.length - 1];
      octx.lineTo(mapX(last[0]), mapY(last[1]));
      octx.stroke();
    }
  }

  return ocrCanvas;
}

function normalizeMathText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let expr = raw.trim();

  // Strip leading y= or f(x)=
  expr = expr.replace(/^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '');

  // Replace unicode & common OCR mistakes
  expr = expr
    .replace(/×|·/g, '*')
    .replace(/÷/g, '/')
    .replace(/−|–|—/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')
    .replace(/\b(?:s1n|5in|sln)\b/gi, 'sin')
    .replace(/\b(?:c0s|cos)\b/gi, 'cos')
    .replace(/\b(?:t4n|tan)\b/gi, 'tan')
    .replace(/\b(?:l0g|log)\b/gi, 'log')
    .replace(/\bln\b/gi, 'log')
    .replace(/\b(?:sqrf|sgrt|sqrt)\b/gi, 'sqrt')
    .replace(/\babs\b/gi, 'abs')
    .replace(/\bexp\b/gi, 'exp')
    .replace(/X/g, 'x')
    .replace(/Y/g, 'y');

  // Remove stray spaces while preserving function separation
  expr = expr.replace(/\s+/g, '');

  // Handle common OCR dropped caret like x2 -> x^2, x3 -> x^3 (when not part of hex/function)
  expr = expr.replace(/\bx([2-9])\b/g, 'x^$1');

  // Implicit multiplication:
  // 2x -> 2*x, 2sin(x) -> 2*sin(x), 3(x+1) -> 3*(x+1), )x -> )*x, )( -> )*(, x( -> x*(
  expr = expr
    .replace(/(\d)(x|pi|e\b|sin|cos|tan|log|sqrt|abs|exp|\()/gi, '$1*$2')
    .replace(/(x|\))(\()/gi, '$1*$2')
    .replace(/(\))(x|\d|sin|cos|tan|log|sqrt|abs|exp|pi)/gi, '$1*$2')
    .replace(/\bx(sin|cos|tan|log|sqrt|abs|exp|pi)/gi, 'x*$1');

  // Keep only valid math characters
  expr = expr.replace(/[^a-zA-Z0-9+\-*/^().,]/g, '');

  return expr;
}

/**
 * Checks whether an expression looks syntactically complete (not mid-typing like "sin(" or "x^2 +")
 * and parses cleanly with math.js.
 */
function parseAndValidateMath(raw) {
  const cleaned = normalizeMathText(raw);
  if (!cleaned) {
    return { ok: false, error: 'Empty expression', cleaned: '' };
  }

  // Reject trailing operators or unclosed brackets before calling math.parse
  if (/[+\-*/^,(]$/.test(cleaned)) {
    return { ok: false, error: 'Incomplete trailing operator', cleaned, incomplete: true };
  }

  let depth = 0;
  for (const ch of cleaned) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth < 0) return { ok: false, error: 'Unbalanced parentheses', cleaned };
  }
  if (depth !== 0) {
    return { ok: false, error: 'Unclosed parenthesis "("', cleaned, incomplete: true };
  }

  if (typeof math === 'undefined') {
    return { ok: false, error: 'Math parser loading…', cleaned };
  }

  try {
    const node = math.parse(cleaned);
    const compiled = node.compile();

    // Verify evaluation works on sample x values
    let validCount = 0;
    for (const testX of [-2, -1, 0, 0.5, 1, 2]) {
      try {
        const val = compiled.evaluate({ x: testX });
        if (typeof val === 'number' && !Number.isNaN(val)) validCount++;
      } catch {
        // single point domain error (e.g. log(-1) or 1/0) is fine
      }
    }
    if (validCount === 0) {
      return { ok: false, error: `Could not evaluate "${cleaned}" as a real function of x`, cleaned };
    }

    let latex = cleaned;
    try {
      latex = node.toTex();
    } catch {
      latex = cleaned;
    }

    return { ok: true, expression: cleaned, latex, compiled };
  } catch (err) {
    return { ok: false, error: err.message || 'Invalid math syntax', cleaned };
  }
}

function getSelectedMathDomain() {
  const sel = document.getElementById('ai-math-domain');
  const val = sel ? sel.value : '10';
  if (val === 'pi') return { xMin: -2 * Math.PI, xMax: 2 * Math.PI };
  if (val === '25') return { xMin: -25, xMax: 25 };
  return { xMin: -10, xMax: 10 };
}

function showMathError(msg) {
  const errEl = document.getElementById('ai-math-error');
  if (!errEl) return;
  if (!msg) {
    errEl.classList.add('hidden');
    errEl.textContent = '';
  } else {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  }
}

function renderMathGraph(expression, options = {}) {
  const chartDiv = document.getElementById('ai-plotly-chart');
  const statusDiv = document.getElementById('ai-math-status');
  const recognizedEl = document.getElementById('ai-math-recognized');
  const exprDisplay = document.getElementById('ai-math-expr-display');
  const latexEl = document.getElementById('ai-math-latex-preview');
  const inputEl = document.getElementById('ai-math-input');

  if (!chartDiv) return;
  if (statusDiv) statusDiv.style.display = 'none';
  showMathError('');

  const parsed = parseAndValidateMath(expression);
  if (!parsed.ok) {
    showMathError(parsed.error);
    return false;
  }

  currentMathExpression = parsed.expression;
  const domain = (typeof options.xMin === 'number' && typeof options.xMax === 'number')
    ? { xMin: options.xMin, xMax: options.xMax }
    : getSelectedMathDomain();

  if (recognizedEl) recognizedEl.textContent = parsed.expression;
  if (exprDisplay) exprDisplay.textContent = `f(x) = ${parsed.expression}`;
  if (latexEl) latexEl.textContent = options.latex || parsed.latex || '';
  if (inputEl && document.activeElement !== inputEl) {
    inputEl.value = parsed.expression;
  }

  const steps = 600;
  const step = (domain.xMax - domain.xMin) / steps;
  const xs = [];
  const ys = [];
  const finiteYs = [];

  let prevY = null;
  for (let i = 0; i <= steps; i++) {
    const x = domain.xMin + i * step;
    xs.push(x);
    try {
      const y = parsed.compiled.evaluate({ x });
      if (typeof y === 'number' && Number.isFinite(y) && Math.abs(y) < 1e4) {
        // Detect vertical asymptote jumps (e.g. tan(x), 1/x)
        if (prevY !== null && Math.abs(y - prevY) > 40 && Math.sign(y) !== Math.sign(prevY)) {
          ys.push(null);
        } else {
          ys.push(y);
          finiteYs.push(y);
        }
        prevY = y;
      } else {
        ys.push(null);
        prevY = null;
      }
    } catch {
      ys.push(null);
      prevY = null;
    }
  }

  // Compute robust y-axis range using percentiles so asymptotes don't squash the curve
  let yRange = undefined;
  if (finiteYs.length > 10) {
    const sorted = [...finiteYs].sort((a, b) => a - b);
    const p05 = sorted[Math.floor(sorted.length * 0.04)];
    const p95 = sorted[Math.floor(sorted.length * 0.96)];
    const span = Math.max(p95 - p05, 2);
    if (sorted[sorted.length - 1] - sorted[0] > span * 4) {
      yRange = [p05 - span * 0.25, p95 + span * 0.25];
    }
  }

  const isDark = !document.body.classList.contains('light-theme');

  const trace = {
    x: xs,
    y: ys,
    mode: 'lines',
    type: 'scatter',
    name: `f(x) = ${parsed.expression}`,
    line: { color: '#60a5fa', width: 2.6 },
    connectgaps: false,
    hovertemplate: 'x = %{x:.3f}<br>f(x) = %{y:.3f}<extra></extra>',
  };

  const layout = {
    paper_bgcolor: isDark ? '#0d0d0f' : '#fafafb',
    plot_bgcolor: isDark ? '#0d0d0f' : '#fafafb',
    font: { color: isDark ? '#ededf0' : '#121214', family: 'Inter, sans-serif', size: 11 },
    margin: { t: 18, r: 18, b: 36, l: 46 },
    xaxis: {
      title: 'x',
      range: [domain.xMin, domain.xMax],
      gridcolor: isDark ? '#1a1a22' : '#e5e6ea',
      zerolinecolor: isDark ? '#52525b' : '#9ca3af',
      zerolinewidth: 1.5,
      tickfont: { size: 10 },
    },
    yaxis: {
      title: 'f(x)',
      range: yRange,
      gridcolor: isDark ? '#1a1a22' : '#e5e6ea',
      zerolinecolor: isDark ? '#52525b' : '#9ca3af',
      zerolinewidth: 1.5,
      tickfont: { size: 10 },
    },
    showlegend: false,
    dragmode: 'pan',
  };

  const config = { responsive: true, displayModeBar: false, scrollZoom: true };

  if (typeof Plotly !== 'undefined') {
    Plotly.newPlot(chartDiv, [trace], layout, config);
  } else {
    setTimeout(() => renderMathGraph(expression, options), 400);
  }

  return true;
}

function submitMathExpression(rawExpr, syncToRoom = true) {
  const panel = document.getElementById('ai-math-panel');
  if (panel) panel.classList.remove('hidden');

  const parsed = parseAndValidateMath(rawExpr);
  if (!parsed.ok) {
    const statusDiv = document.getElementById('ai-math-status');
    if (statusDiv) statusDiv.style.display = 'none';
    showMathError(`Unable to graph "${rawExpr}": ${parsed.error}. Edit the formula above and click Generate.`);
    return false;
  }

  const domain = getSelectedMathDomain();
  const ok = renderMathGraph(parsed.expression, { latex: parsed.latex, ...domain });
  if (ok && syncToRoom) {
    wsSend({
      type: 'ai_math_graph',
      expression: parsed.expression,
      latex: parsed.latex,
      xMin: domain.xMin,
      xMax: domain.xMax,
    });
  }
  return ok;
}

async function processMathStrokes(strokes) {
  if (!strokes || strokes.length === 0) return;

  const panel = document.getElementById('ai-math-panel');
  const statusDiv = document.getElementById('ai-math-status');
  const statusText = document.getElementById('ai-math-status-text');
  const inputEl = document.getElementById('ai-math-input');

  if (!panel) return;
  panel.classList.remove('hidden');
  showMathError('');
  if (statusDiv) statusDiv.style.display = 'flex';
  if (statusText) statusText.textContent = 'Preparing handwritten equation…';

  try {
    const ocrCanvas = renderStrokesForOCR(strokes);
    const worker = await getOcrWorker();
    if (statusText) statusText.textContent = 'Reading handwriting…';
    const { data: { text } } = await worker.recognize(ocrCanvas);
    const rawText = (text || '').trim();
    console.log('[MathOCR] Raw recognized text:', rawText);

    if (statusDiv) statusDiv.style.display = 'none';

    const parsed = parseAndValidateMath(rawText);
    if (parsed.ok) {
      if (inputEl) inputEl.value = parsed.expression;
      submitMathExpression(parsed.expression, true);
    } else {
      // Do NOT fake sin(x) on OCR miss — prefill what we saw so user can refine or re-trigger
      if (inputEl) inputEl.value = parsed.cleaned || rawText;
      showMathError(
        rawText
          ? `Recognized "${rawText}" (${parsed.error}). Adjust above & click Generate.`
          : 'Could not clearly read handwriting. Write larger/clearer or type the formula above.'
      );
    }
  } catch (err) {
    console.warn('[MathOCR] Error:', err);
    if (statusDiv) statusDiv.style.display = 'none';
    showMathError('OCR engine unavailable right now. You can type the formula directly above!');
  }
}

function initMathPanel() {
  const panel = document.getElementById('ai-math-panel');
  const closeBtn = document.getElementById('ai-math-close');
  const header = document.getElementById('ai-math-panel-header');
  const form = document.getElementById('ai-math-form');
  const input = document.getElementById('ai-math-input');
  const domainSel = document.getElementById('ai-math-domain');

  if (!panel || !closeBtn) return;

  makeDraggable(panel, header);

  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  // Explicit Generate / Enter submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(mathTypingTimer);
      if (input && input.value.trim()) {
        submitMathExpression(input.value, true);
      }
    });
  }

  // Delayed-trigger typing: NEVER parses/errors mid-typing; waits 950ms AND checks completeness
  if (input) {
    input.addEventListener('input', () => {
      clearTimeout(mathTypingTimer);
      const val = input.value.trim();
      if (!val) {
        showMathError('');
        return;
      }
      mathTypingTimer = setTimeout(() => {
        const check = parseAndValidateMath(val);
        // Only auto-plot while typing if expression is genuinely complete & valid
        if (check.ok) {
          submitMathExpression(check.expression, true);
        }
      }, 950);
    });
  }

  if (domainSel) {
    domainSel.addEventListener('change', () => {
      if (currentMathExpression) {
        submitMathExpression(currentMathExpression, true);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI SESSION CONTROLLER (Multi-Stroke Collection + Delayed Pause Trigger)
// ═══════════════════════════════════════════════════════════════════════════════

function initAISessionController() {
  const sessionBar = document.getElementById('ai-session-bar');
  const badgeEl = document.getElementById('ai-session-badge');
  const statusEl = document.getElementById('ai-session-status');
  const autoCb = document.getElementById('ai-auto-trigger-cb');
  const clearBtn = document.getElementById('ai-session-clear-btn');
  const runBtn = document.getElementById('ai-session-run-btn');
  const progressFill = document.getElementById('ai-session-progress-fill');

  const btn3d = document.getElementById('btn-sketch3d');
  const btnMath = document.getElementById('btn-mathgraph');

  let activeAITool = null; // 'sketch3d' | 'mathgraph' | null
  let pendingStrokes = [];
  let pauseTimer = null;
  let progressRaf = null;
  let countdownStart = 0;
  let countdownDuration = 0;

  function stopTimers() {
    clearTimeout(pauseTimer);
    pauseTimer = null;
    if (progressRaf) {
      cancelAnimationFrame(progressRaf);
      progressRaf = null;
    }
    if (progressFill) progressFill.style.width = '0%';
  }

  function updateBarUI() {
    if (!sessionBar) return;
    if (!activeAITool) {
      sessionBar.classList.add('hidden');
      stopTimers();
      return;
    }
    sessionBar.classList.remove('hidden');
    const count = pendingStrokes.length;

    if (activeAITool === 'sketch3d') {
      if (badgeEl) {
        badgeEl.textContent = '3D SKETCH';
        badgeEl.className = 'ai-session-badge mode-3d';
      }
      if (runBtn) runBtn.textContent = 'Convert to 3D';
      if (statusEl) {
        statusEl.textContent = count === 0
          ? 'Sketch a 3D shape (cube, cylinder, sphere, cone, pyramid…)'
          : `${count} stroke${count > 1 ? 's' : ''} captured — keep drawing or click Convert`;
      }
    } else if (activeAITool === 'mathgraph') {
      if (badgeEl) {
        badgeEl.textContent = 'MATH GRAPH';
        badgeEl.className = 'ai-session-badge mode-math';
      }
      if (runBtn) runBtn.textContent = 'Generate Graph';
      if (statusEl) {
        statusEl.textContent = count === 0
          ? 'Write your full equation (e.g. y = x^2 - 4, sin(x))'
          : `${count} stroke${count > 1 ? 's' : ''} captured — keep writing or click Generate`;
      }
    }
  }

  async function executeCurrentSession() {
    stopTimers();
    let strokesToUse = [...pendingStrokes];

    // If user clicked Convert/Generate with 0 pending strokes, fall back to recent board strokes
    if (strokesToUse.length === 0 && window._appGetStrokes) {
      const boardStrokes = window._appGetStrokes();
      if (boardStrokes.length > 0) {
        strokesToUse = [boardStrokes[boardStrokes.length - 1]];
      }
    }

    if (strokesToUse.length === 0) {
      if (statusEl) statusEl.textContent = 'Draw on the canvas first, then convert!';
      return;
    }

    const tool = activeAITool;
    pendingStrokes = [];
    updateBarUI();

    if (tool === 'sketch3d') {
      const classified = classify3DSketch(strokesToUse);
      show3DPanel(classified);
      wsSend({
        type: 'ai_3d_model',
        shapeType: classified.shapeType,
        dimensions: classified.dimensions,
        confidence: classified.confidence,
        label: classified.label,
        points: classified.outlinePoints,
        strokeId: 'ai_3d_' + Date.now(),
      });
    } else if (tool === 'mathgraph') {
      await processMathStrokes(strokesToUse);
    }
  }

  function startPauseCountdown() {
    stopTimers();
    if (!autoCb || !autoCb.checked || pendingStrokes.length === 0) return;

    // Wait 1.6s for 3D multi-stroke shapes, 2.2s for multi-character math equations
    countdownDuration = activeAITool === 'mathgraph' ? 2200 : 1600;
    countdownStart = performance.now();

    const tick = (now) => {
      const elapsed = now - countdownStart;
      const pct = Math.min(100, (elapsed / countdownDuration) * 100);
      if (progressFill) progressFill.style.width = pct + '%';

      if (statusEl) {
        const rem = Math.max(0.1, ((countdownDuration - elapsed) / 1000)).toFixed(1);
        const actionWord = activeAITool === 'mathgraph' ? 'Graphing' : 'Converting';
        statusEl.textContent = `${pendingStrokes.length} stroke${pendingStrokes.length > 1 ? 's' : ''} · ${actionWord} in ${rem}s (draw to pause)`;
      }

      if (elapsed < countdownDuration) {
        progressRaf = requestAnimationFrame(tick);
      }
    };

    progressRaf = requestAnimationFrame(tick);
    pauseTimer = setTimeout(() => {
      executeCurrentSession();
    }, countdownDuration);
  }

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      executeCurrentSession();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      pendingStrokes = [];
      stopTimers();
      updateBarUI();
    });
  }

  if (autoCb) {
    autoCb.addEventListener('change', () => {
      if (!autoCb.checked) {
        stopTimers();
        updateBarUI();
      } else if (pendingStrokes.length > 0) {
        startPauseCountdown();
      }
    });
  }

  // Hook callbacks called directly by app.js
  window._aiOnToolChange = (tool) => {
    if (tool === 'sketch3d' || tool === 'mathgraph') {
      if (activeAITool !== tool) {
        pendingStrokes = [];
        stopTimers();
      }
      activeAITool = tool;
    } else {
      activeAITool = null;
      pendingStrokes = [];
      stopTimers();
    }
    updateBarUI();
  };

  window._aiOnStrokeStart = (tool) => {
    if (tool === 'sketch3d' || tool === 'mathgraph') {
      activeAITool = tool;
      // Immediately cancel auto-trigger countdown while user is still drawing!
      stopTimers();
      if (statusEl && pendingStrokes.length > 0) {
        statusEl.textContent = `Drawing stroke ${pendingStrokes.length + 1}…`;
      }
    }
  };

  window._aiOnStrokeFinish = (stroke, tool) => {
    if (tool !== 'sketch3d' && tool !== 'mathgraph') return;
    if (!stroke || !stroke.points || stroke.points.length < 2) return;
    activeAITool = tool;
    pendingStrokes.push(stroke);
    updateBarUI();
    startPauseCountdown();
  };

  // Sync button state if already selected
  if (btn3d && btn3d.classList.contains('active')) {
    activeAITool = 'sketch3d';
    updateBarUI();
  } else if (btnMath && btnMath.classList.contains('active')) {
    activeAITool = 'mathgraph';
    updateBarUI();
  }
}

// ─── DOMContentLoaded Bootstrap ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init3DPanel();
  initMathPanel();
  initAISessionController();
});

// ─── Global Exports for app.js WebSocket Dispatcher ───────────────────────────
window._aiShow3D = show3DPanel;
window._aiRenderGraph = renderMathGraph;
window._aiShowMathPanel = (payload) => {
  const panel = document.getElementById('ai-math-panel');
  if (panel) panel.classList.remove('hidden');

  if (typeof payload === 'string') {
    renderMathGraph(payload);
  } else if (payload && payload.expression) {
    renderMathGraph(payload.expression, {
      latex: payload.latex,
      xMin: payload.xMin,
      xMax: payload.xMax,
    });
  }
};
