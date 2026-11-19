// Neon Vice Cover Studio — the cover renderer.
// Draws GTA-poster-style multi-panel cover art on a 2D canvas from a state object:
// photos per panel slot (each with its own zoom and pan), a layout, a colour grade,
// a title, a neon subtitle and a tag line. Everything drawn here is original art:
// gradient skies, a striped retro sun, palm silhouettes, halftone dots and grain.
// No Rockstar logo, artwork or font is used anywhere.

export const LAYOUTS = [
  { id: 'hero', name: 'Full Bleed', slots: 1, hint: 'One photo, edge to edge' },
  { id: 'hero3', name: 'Hero + Three', slots: 4, hint: 'Big photo on top, three below' },
  { id: 'grid4', name: 'Four Panel', slots: 4, hint: 'Classic 2 x 2 poster grid' },
  { id: 'nine', name: 'Nine Panel', slots: 8, hint: '3 x 3 grid, title in the middle' },
  { id: 'tilt', name: 'Snapshots', slots: 3, hint: 'Tilted snapshots on a sunset sky' },
];

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', sky: ['#2b1055', '#ff5e78', '#ff9a3d'], wash: '#ff7a3d', title: ['#fff3a6', '#ff8a3d', '#ff2e88'], accent: '#ff5e78', filter: 'saturate(1.35) contrast(1.08)' },
  { id: 'neon', name: 'Neon Night', sky: ['#0d0221', '#3b0f6e', '#ff2e88'], wash: '#c026d3', title: ['#a5f3fc', '#f0abfc', '#ff5ef1'], accent: '#22d3ee', filter: 'saturate(1.5) contrast(1.12) hue-rotate(-8deg)' },
  { id: 'gold', name: 'Golden Hour', sky: ['#7c2d12', '#ea580c', '#fcd34d'], wash: '#f59e0b', title: ['#fffbe0', '#fbbf24', '#f97316'], accent: '#fbbf24', filter: 'saturate(1.3) contrast(1.05) sepia(0.25)' },
  { id: 'teal', name: 'Teal Dusk', sky: ['#042f2e', '#0f766e', '#155e75'], wash: '#14b8a6', title: ['#d1fae5', '#5eead4', '#38bdf8'], accent: '#5eead4', filter: 'saturate(1.25) contrast(1.1) hue-rotate(12deg)' },
  { id: 'noir', name: 'Noir', sky: ['#0a0a0a', '#262626', '#525252'], wash: '#a3a3a3', title: ['#ffffff', '#d4d4d4', '#a3a3a3'], accent: '#e5e5e5', filter: 'grayscale(1) contrast(1.25)' },
  { id: 'candy', name: 'Candy Pop', sky: ['#4c1d95', '#db2777', '#06b6d4'], wash: '#ec4899', title: ['#ffffff', '#fde68a', '#f472b6'], accent: '#fde047', filter: 'saturate(1.6) contrast(1.05)' },
];

export const SIZES = [
  { id: 'square', label: 'Square · 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait · 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide · 1920 x 1080', w: 1920, h: 1080 },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

/** A fresh empty photo slot: no image yet, neutral zoom, pan and crop anchor. */
export function emptySlot() {
  return { img: null, zoom: 1, ox: 0, oy: 0, fx: 0.5, fy: 0.5 };
}

/**
 * Panel rectangles for a layout at W x H. Each entry is { x, y, w, h, rot, slot }:
 * rot is a tilt in degrees around the panel centre (0 for straight grids), slot is
 * the index into state.photos the panel shows. The nine-panel layout leaves its
 * centre cell for the title, so it has 8 panels for 8 slots.
 */
export function layoutPanels(layoutId, W, H) {
  const g = Math.max(6, Math.round(W * 0.008));
  if (layoutId === 'hero3') {
    const heroH = Math.round(H * 0.62);
    const cellW = Math.round((W - 2 * g) / 3);
    const panels = [{ x: 0, y: 0, w: W, h: heroH, rot: 0, slot: 0 }];
    for (let i = 0; i < 3; i++) {
      panels.push({ x: i * (cellW + g), y: heroH + g, w: cellW, h: H - heroH - g, rot: 0, slot: 1 + i });
    }
    return panels;
  }
  if (layoutId === 'grid4') {
    const cw = Math.round((W - g) / 2);
    const ch = Math.round((H - g) / 2);
    return [
      { x: 0, y: 0, w: cw, h: ch, rot: 0, slot: 0 },
      { x: cw + g, y: 0, w: cw, h: ch, rot: 0, slot: 1 },
      { x: 0, y: ch + g, w: cw, h: ch, rot: 0, slot: 2 },
      { x: cw + g, y: ch + g, w: cw, h: ch, rot: 0, slot: 3 },
    ];
  }
  if (layoutId === 'nine') {
    const cw = Math.round((W - 2 * g) / 3);
    const ch = Math.round((H - 2 * g) / 3);
    const panels = [];
    let slot = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row === 1 && col === 1) continue; // centre cell is the title tile
        panels.push({ x: col * (cw + g), y: row * (ch + g), w: cw, h: ch, rot: 0, slot: slot++ });
      }
    }
    return panels;
  }
  if (layoutId === 'tilt') {
    const pw = Math.round(W * 0.42);
    const ph = Math.round(H * 0.46);
    return [
      { x: Math.round(W * 0.06), y: Math.round(H * 0.07), w: pw, h: ph, rot: -6, slot: 0 },
      { x: Math.round(W * 0.52), y: Math.round(H * 0.05), w: pw, h: ph, rot: 5, slot: 1 },
      { x: Math.round(W * 0.29), y: Math.round(H * 0.42), w: pw, h: ph, rot: -2, slot: 2 },
    ];
  }
  return [{ x: 0, y: 0, w: W, h: H, rot: 0, slot: 0 }]; // hero
}

/** Which photo slot (if any) sits under point (x, y) in cover space. */
export function panelAt(layoutId, W, H, x, y) {
  const panels = layoutPanels(layoutId, W, H);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const a = (-p.rot * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const rx = dx * Math.cos(a) - dy * Math.sin(a);
    const ry = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(rx) <= p.w / 2 && Math.abs(ry) <= p.h / 2) return p.slot;
  }
  return -1;
}

function skyGradient(ctx, grade, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  return sky;
}

/** A retro striped sun: a glowing disc with the lower half cut into bands. */
export function drawRetroSun(ctx, cx, cy, r, grade) {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  glow.addColorStop(0, grade.wash + 'cc');
  glow.addColorStop(1, grade.wash + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.7, cy - r * 1.7, r * 3.4, r * 3.4);
  const disc = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  disc.addColorStop(0, '#fff7ae');
  disc.addColorStop(0.5, grade.wash);
  disc.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Cut the stripes inside the disc: bars of the sky's deep colour, thicker
  // toward the bottom, clipped to the circle so none sticks out past its edge.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grade.sky[0];
  let y = cy + r * 0.08;
  let thick = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, thick);
    y += thick + r * 0.13;
    thick *= 1.35;
  }
  ctx.restore();
  ctx.restore();
}

/** A stylised palm silhouette: a curved trunk with seven drooping fronds.
 * Each frond is a filled blade that arcs out from the crown and droops down,
 * so the tree reads as a palm instead of a starburst. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning gently.
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -70, 22, -128);
  ctx.stroke();
  // Fronds fanning from the crown: each one rises, then droops to its tip.
  const crownX = 22;
  const crownY = -128;
  for (let i = 0; i < 7; i++) {
    const t = i / 6; // 0..1 across the fan
    const ang = (-72 + t * 144) * Math.PI / 180; // -72..72 deg from straight up
    const len = 88 - Math.abs(t - 0.5) * 36;
    const dirX = Math.sin(ang);
    const dirY = -Math.cos(ang);
    const tipX = crownX + dirX * len;
    const tipY = crownY + dirY * len * 0.5 + len * 0.55;
    const midX = crownX + dirX * len * 0.6;
    const midY = crownY + dirY * len * 0.6 - len * 0.2;
    // A tapered blade: out along the arc, back along a near-parallel curve.
    // The return curve sits ~16 units to the side, so the blade has real body.
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX - dirY * 16, midY + dirX * 16, crownX, crownY);
    ctx.fill();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(crownX - 6, crownY + 6, 6, 0, Math.PI * 2);
  ctx.arc(crownX + 7, crownY + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Cover-fits an image into a rectangle, honouring the slot's zoom, pan and crop
 * anchor. fx/fy (0..1) pick which slice of an over-tall or over-wide photo shows:
 * 0 is the top/left, 1 the bottom/right — so a face near the top of a portrait
 * photo can still headline a wide hero band. */
function drawPhotoInto(ctx, img, x, y, w, h, slot, filter) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih);
  const scale = base * (slot?.zoom ?? 1);
  const pw = iw * scale;
  const ph = ih * scale;
  let dx;
  let dy;
  if (pw > w) dx = x - (pw - w) * (slot?.fx ?? 0.5);
  else dx = x + (w - pw) / 2;
  if (ph > h) dy = y - (ph - h) * (slot?.fy ?? 0.5);
  else dy = y + (h - ph) / 2;
  dx += (slot?.ox ?? 0) * w * 0.25;
  dy += (slot?.oy ?? 0) * h * 0.25;
  ctx.save();
  ctx.filter = filter ?? 'none';
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

/** A photo-less panel still looks like poster art: sky, sun and palms. */
function drawFallbackPanel(ctx, grade, x, y, w, h, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = skyGradient(ctx, grade, w, h);
  ctx.fillRect(x, y, w, h);
  const r = Math.min(w, h) * 0.26;
  drawRetroSun(ctx, x + w * (0.3 + 0.4 * ((seed * 37) % 10) / 10), y + h * 0.38, r, grade);
  drawPalm(ctx, x + w * 0.12, y + h * 1.02, Math.min(w, h) / 260, 'rgba(20, 8, 32, 0.85)');
  drawPalm(ctx, x + w * 0.88, y + h * 1.04, Math.min(w, h) / 340, 'rgba(20, 8, 32, 0.7)');
  ctx.restore();
}

function applyGradeWash(ctx, grade, x, y, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.22;
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, '#ffffff');
  wash.addColorStop(0.5, grade.wash);
  wash.addColorStop(1, grade.sky[0]);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.12;
  const tint = ctx.createLinearGradient(0, y, 0, y + h);
  tint.addColorStop(0, 'rgba(255,255,255,0)');
  tint.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Film grain: a tiled noise pattern drawn faintly over the whole cover. */
let noisePattern = null;
function grain(ctx, W, H) {
  if (!noisePattern) {
    const n = document.createElement('canvas');
    n.width = 128;
    n.height = 128;
    const nctx = n.getContext('2d');
    const data = nctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 90);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    nctx.putImageData(data, 0, 0);
    noisePattern = ctx.createPattern(n, 'repeat');
  }
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = noisePattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function vignette(ctx, W, H) {
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,0,20,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function fitFont(ctx, text, maxWidth, startSize, family, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The big title: Anton capitals, sunset gradient fill, dark outline, slight lean. */
function drawTitleBlock(ctx, state, grade, W, H, box) {
  const { x, y, w, h, align = 'center' } = box;
  const cx = align === 'center' ? x + w / 2 : x;
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const title = (state.title || 'SUNSET HEIST').trim().toUpperCase();
  const maxW = w * 0.94;
  let size = fitFont(ctx, title, maxW, Math.min(h * 0.42, W * 0.16), 'Anton, "Arial Black", sans-serif');
  const lines = title.length > 14 ? wrapLines(ctx, title, maxW) : [title];
  if (lines.length > 1) {
    size = fitFont(ctx, lines.reduce((a, b) => (a.length > b.length ? a : b)), maxW, size, 'Anton, "Arial Black", sans-serif');
  }
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, grade.title[0]);
  grad.addColorStop(0.55, grade.title[1]);
  grad.addColorStop(1, grade.title[2]);
  const lineH = size * 1.02;
  // Reserve room for the neon subtitle below the title, inside the box.
  const sub = (state.subtitle || '').trim();
  const subSize = sub ? fitFont(ctx, sub, maxW, Math.min(size * 0.42, W * 0.055), 'Pacifico, cursive') : 0;
  const blockH = lineH * lines.length + (sub ? subSize * 1.6 : 0);
  let ty = y + (h - blockH) / 2 + size;
  ctx.translate(cx, 0);
  ctx.rotate(-0.02);
  ctx.translate(-cx, 0);
  ctx.lineJoin = 'round';
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  ctx.strokeStyle = 'rgba(20, 5, 35, 0.9)';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  let lastBaseline = ty;
  for (const line of lines) {
    ctx.strokeText(line, cx, ty);
    ctx.fillText(line, cx, ty);
    lastBaseline = ty;
    ty += lineH;
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Neon script subtitle under the title.
  if (sub) {
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = subSize * 0.7;
    ctx.fillText(sub, cx, lastBaseline + subSize * 1.15);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  return { titleSize: size };
}

/** Small caps tag line, letter-spaced, drawn top-left of the cover. */
function drawTag(ctx, state, grade, W, H) {
  const tag = (state.tag || '').trim().toUpperCase();
  if (!tag) return;
  const size = Math.max(13, Math.round(W * 0.016));
  ctx.save();
  ctx.font = `700 ${size}px "Arial Narrow", Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const pad = Math.round(W * 0.022);
  const tw = ctx.measureText(tag.split('').join('  ')).width + tag.length * size * 0.28;
  ctx.fillStyle = 'rgba(15, 5, 30, 0.55)';
  ctx.fillRect(pad * 0.7, pad * 0.7, tw + pad, size * 1.9);
  ctx.fillStyle = '#ffffff';
  let tx = pad * 0.7 + pad / 2;
  const ty = pad * 0.7 + size * 0.45;
  for (const ch of tag) {
    ctx.fillText(ch, tx, ty);
    tx += ctx.measureText(ch).width + size * 0.28;
  }
  ctx.restore();
}

/** Halftone dots fading across the bottom of a title scrim. */
function halftone(ctx, x, y, w, h, color) {
  ctx.save();
  const step = Math.max(10, Math.round(w / 72));
  for (let yy = y; yy < y + h; yy += step) {
    const fade = 1 - (yy - y) / h;
    for (let xx = x; xx < x + w; xx += step) {
      const r = step * 0.32 * fade;
      if (r < 0.6) continue;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (which must already be sized W x H).
 * state: { photos, layout, grade, title, subtitle, tag, sun, palms, grain, frame }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = gradeById(state.grade);
  const layout = state.layout ?? 'hero';
  const g = Math.max(6, Math.round(W * 0.008));

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = skyGradient(ctx, grade, W, H);
  ctx.fillRect(0, 0, W, H);

  const panels = layoutPanels(layout, W, H);
  const photos = state.photos ?? [];

  if (layout === 'tilt') {
    // Sky backdrop with a low sun and palm silhouettes behind the snapshots.
    if (state.sun !== false) drawRetroSun(ctx, W * 0.5, H * 0.3, Math.min(W, H) * 0.2, grade);
    if (state.palms !== false) {
      drawPalm(ctx, W * 0.04, H * 0.99, Math.min(W, H) / 300, 'rgba(20, 8, 32, 0.8)');
      drawPalm(ctx, W * 0.96, H * 1.0, Math.min(W, H) / 380, 'rgba(20, 8, 32, 0.65)');
    }
  }

  for (const p of panels) {
    const slot = photos[p.slot] ?? emptySlot();
    ctx.save();
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    const border = layout === 'tilt' ? Math.round(W * 0.012) : 0;
    const ix = p.x;
    const iy = p.y;
    const iw = p.w;
    const ih = p.h;
    if (layout !== 'tilt') {
      // Straight grids draw the photo here; tilted snapshots draw below, once
      // the white Polaroid frame is underneath them.
      ctx.beginPath();
      ctx.rect(ix, iy, iw, ih);
      ctx.clip();
      if (slot.img) {
        drawPhotoInto(ctx, slot.img, ix, iy, iw, ih, slot, grade.filter);
      } else {
        drawFallbackPanel(ctx, grade, ix, iy, iw, ih, p.slot + 1);
      }
      applyGradeWash(ctx, grade, ix, iy, iw, ih);
    }
    ctx.restore();
    // Panel outline and, for tilted snapshots, a soft drop shadow.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    if (layout === 'tilt') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = W * 0.008;
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(ix - border, iy - border, iw + border * 2, ih + border * 2);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(ix, iy, iw, ih);
      ctx.clip();
      if (slot.img) drawPhotoInto(ctx, slot.img, ix, iy, iw, ih, slot, grade.filter);
      else drawFallbackPanel(ctx, grade, ix, iy, iw, ih, p.slot + 1);
      applyGradeWash(ctx, grade, ix, iy, iw, ih);
      ctx.restore();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = Math.max(2, g * 0.35);
      ctx.strokeRect(ix + 1, iy + 1, iw - 2, ih - 2);
    }
    ctx.restore();
  }

  // Title placement depends on the layout.
  if (layout === 'hero') {
    const scrimH = H * 0.34;
    const scrim = ctx.createLinearGradient(0, H - scrimH, 0, H);
    scrim.addColorStop(0, 'rgba(15, 5, 30, 0)');
    scrim.addColorStop(1, 'rgba(15, 5, 30, 0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H - scrimH, W, scrimH);
    halftone(ctx, 0, H - scrimH * 0.5, W, scrimH * 0.5, 'rgba(255,255,255,0.10)');
    if (state.sun !== false) drawRetroSun(ctx, W * 0.78, H * 0.3, Math.min(W, H) * 0.17, grade);
    if (state.palms !== false) drawPalm(ctx, W * 0.05, H * 0.99, Math.min(W, H) / 320, 'rgba(20, 8, 32, 0.75)');
    drawTitleBlock(ctx, state, grade, W, H, { x: 0, y: H - scrimH, w: W, h: scrimH });
  } else if (layout === 'hero3') {
    const heroH = Math.round(H * 0.62);
    const scrimH = heroH * 0.42;
    const scrim = ctx.createLinearGradient(0, heroH - scrimH, 0, heroH);
    scrim.addColorStop(0, 'rgba(15, 5, 30, 0)');
    scrim.addColorStop(1, 'rgba(15, 5, 30, 0.7)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, heroH - scrimH, W, scrimH);
    drawTitleBlock(ctx, state, grade, W, H, { x: 0, y: heroH - scrimH, w: W, h: scrimH });
  } else if (layout === 'grid4') {
    const bandH = H * 0.24;
    const scrim = ctx.createLinearGradient(0, H - bandH, 0, H);
    scrim.addColorStop(0, 'rgba(15, 5, 30, 0)');
    scrim.addColorStop(1, 'rgba(15, 5, 30, 0.78)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H - bandH, W, bandH);
    drawTitleBlock(ctx, state, grade, W, H, { x: 0, y: H - bandH, w: W, h: bandH });
  } else if (layout === 'nine') {
    const cw = Math.round((W - 2 * g) / 3);
    const ch = Math.round((H - 2 * g) / 3);
    const tx = cw + g;
    const ty = ch + g;
    ctx.save();
    ctx.fillStyle = skyGradient(ctx, grade, cw, ch);
    ctx.fillRect(tx, ty, cw, ch);
    if (state.sun !== false) drawRetroSun(ctx, tx + cw / 2, ty + ch * 0.32, Math.min(cw, ch) * 0.22, grade);
    ctx.fillStyle = 'rgba(15, 5, 30, 0.35)';
    ctx.fillRect(tx, ty, cw, ch);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(2, g * 0.35);
    ctx.strokeRect(tx + 1, ty + 1, cw - 2, ch - 2);
    drawTitleBlock(ctx, state, grade, W, H, { x: tx, y: ty + ch * 0.42, w: cw, h: ch * 0.58 });
    ctx.restore();
  } else if (layout === 'tilt') {
    const bandH = H * 0.2;
    const bandY = H - bandH;
    const scrim = ctx.createLinearGradient(0, bandY - H * 0.04, 0, H);
    scrim.addColorStop(0, 'rgba(15, 5, 30, 0)');
    scrim.addColorStop(1, 'rgba(15, 5, 30, 0.66)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, bandY - H * 0.04, W, bandH + H * 0.04);
    drawTitleBlock(ctx, state, grade, W, H, { x: 0, y: bandY, w: W, h: bandH });
  }

  drawTag(ctx, state, grade, W, H);

  if (state.frame !== false) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = Math.max(4, W * 0.006);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    const inset = Math.max(10, W * 0.014);
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    ctx.restore();
  }

  if (state.grain !== false) grain(ctx, W, H);
  vignette(ctx, W, H);
}

/** Renders a fresh canvas at the export size for one state. Used for PNG export. */
export function renderCover(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}
