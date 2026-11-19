// Neon Vice Cover Studio — wires the editor page.
// One state object drives the live preview; every control edits it and redraws.
// Photos are read on this machine and never leave it. `?shot=` scenes for
// screenshots live in ./shots.js and run instead of the editor setup.
import { drawCover, renderCover, LAYOUTS, GRADES, SIZES, layoutById, gradeById, sizeById, emptySlot, layoutPanels, panelAt } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const previewWrap = $('preview-wrap');
const statusEl = $('status');

const state = {
  photos: [emptySlot()],
  layout: 'hero3',
  grade: 'sunset',
  size: 'portrait',
  title: 'Sunset Heist',
  subtitle: 'one last ride',
  tag: 'Neon Coast · Est. 2026',
  sun: true,
  palms: true,
  grain: true,
  frame: true,
};
let selectedSlot = 0;

function currentSize() {
  return sizeById(state.size);
}

function ensureSlots() {
  const need = layoutById(state.layout).slots;
  while (state.photos.length < need) state.photos.push(emptySlot());
}

function redraw() {
  ensureSlots();
  const size = currentSize();
  const scale = Math.min(920 / size.w, 920 / size.h, 1.4);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  drawCover(canvas, state);
  refreshSlotList();
  refreshSelectedReadout();
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = url;
  });
}

async function loadFileIntoSlot(file, slot) {
  if (!file || !file.type.startsWith('image/')) return;
  try {
    const img = await loadImage(URL.createObjectURL(file));
    state.photos[slot] = { img, zoom: 1, ox: 0, oy: 0 };
    selectedSlot = slot;
    syncSliders();
    redraw();
    setStatus(`Photo loaded into panel ${slot + 1}. Drag it on the cover to reposition.`);
  } catch {
    setStatus('That file could not be read as a photo.');
  }
}

/* ---------- option rows (layout, grade, size) ---------- */

function buildButtons(container, items, current, onPick) {
  const box = $(container);
  box.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (item.id === current ? ' active' : '');
    b.textContent = item.name ?? item.label;
    b.title = item.hint ?? item.label;
    b.addEventListener('click', () => {
      onPick(item.id);
      buildButtons(container, items, item.id, onPick);
      redraw();
    });
    box.appendChild(b);
  }
}

function refreshOptions() {
  buildButtons('layouts', LAYOUTS, state.layout, (id) => {
    state.layout = id;
    selectedSlot = 0;
    syncSliders();
    setStatus(`${layoutById(id).name}: ${layoutById(id).hint}. Click a panel to load its photo.`);
  });
  buildButtons('grades', GRADES, state.grade, (id) => {
    state.grade = id;
    setStatus(`Grade: ${gradeById(id).name}.`);
  });
  buildButtons('sizes', SIZES, state.size, (id) => {
    state.size = id;
    setStatus(`Export size: ${sizeById(id).label}.`);
  });
}

/* ---------- panel slots ---------- */

function refreshSlotList() {
  const list = $('slots');
  list.innerHTML = '';
  ensureSlots();
  const need = layoutById(state.layout).slots;
  for (let i = 0; i < need; i++) {
    const slot = state.photos[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot' + (i === selectedSlot ? ' active' : '');
    b.innerHTML = `<span class="slot-num">${i + 1}</span><span class="slot-label">${slot.img ? 'Photo loaded' : 'Empty — click to add'}</span>`;
    b.addEventListener('click', () => {
      selectedSlot = i;
      syncSliders();
      redraw();
      $('photo').click();
    });
    list.appendChild(b);
  }
}

function refreshSelectedReadout() {
  $('selected-readout').textContent = `Panel ${selectedSlot + 1} of ${layoutById(state.layout).slots} selected`;
}

function syncSliders() {
  const slot = state.photos[selectedSlot] ?? emptySlot();
  $('zoom').value = slot.zoom;
  $('panx').value = slot.ox;
  $('pany').value = slot.oy;
  $('zoom-val').textContent = `${Math.round(slot.zoom * 100)}%`;
}

$('zoom').addEventListener('input', (e) => {
  state.photos[selectedSlot].zoom = Number(e.target.value);
  $('zoom-val').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
  redraw();
});
$('panx').addEventListener('input', (e) => {
  state.photos[selectedSlot].ox = Number(e.target.value);
  redraw();
});
$('pany').addEventListener('input', (e) => {
  state.photos[selectedSlot].oy = Number(e.target.value);
  redraw();
});

/* ---------- photo input, samples, drag and drop ---------- */

$('photo').addEventListener('change', (e) => {
  loadFileIntoSlot(e.target.files[0], selectedSlot);
  e.target.value = '';
});
$('load-sample-boulevard').addEventListener('click', async () => {
  try {
    state.photos[selectedSlot] = { img: await loadImage('samples/boulevard.jpg'), zoom: 1, ox: 0, oy: 0 };
    syncSliders();
    redraw();
    setStatus('Sample photo loaded — a boulevard at golden hour.');
  } catch { setStatus('Sample photo failed to load.'); }
});
$('load-sample-pier').addEventListener('click', async () => {
  try {
    state.photos[selectedSlot] = { img: await loadImage('samples/pier.jpg'), zoom: 1, ox: 0, oy: 0 };
    syncSliders();
    redraw();
    setStatus('Sample photo loaded — a pier over turquoise water.');
  } catch { setStatus('Sample photo failed to load.'); }
});
$('fill-all').addEventListener('click', () => {
  const first = state.photos[0];
  if (!first.img) {
    setStatus('Load a photo into panel 1 first, then fill the rest with it.');
    return;
  }
  ensureSlots();
  for (let i = 1; i < layoutById(state.layout).slots; i++) {
    state.photos[i] = { img: first.img, zoom: first.zoom, ox: first.ox, oy: first.oy };
  }
  redraw();
  setStatus('Every panel now shows the first photo — click one to give it its own.');
});
$('shuffle').addEventListener('click', () => {
  const layouts = LAYOUTS.map((l) => l.id);
  const grades = GRADES.map((g) => g.id);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  selectedSlot = 0;
  syncSliders();
  refreshOptions();
  redraw();
  setStatus(`Surprise me: ${layoutById(state.layout).name} in ${gradeById(state.grade).name}.`);
});

// Click a panel on the cover to select it; drag it to pan the photo inside.
let dragStart = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const size = currentSize();
  return {
    x: ((e.clientX - rect.left) / rect.width) * size.w,
    y: ((e.clientY - rect.top) / rect.height) * size.h,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const slot = panelAt(state.layout, currentSize().w, currentSize().h, p.x, p.y);
  if (slot >= 0) {
    selectedSlot = slot;
    syncSliders();
    redraw();
  }
  dragStart = { x: p.x, y: p.y, ox: state.photos[selectedSlot]?.ox ?? 0, oy: state.photos[selectedSlot]?.oy ?? 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragStart) return;
  const p = canvasPoint(e);
  const size = currentSize();
  const slot = state.photos[selectedSlot];
  if (!slot?.img) return;
  slot.ox = Math.max(-1, Math.min(1, dragStart.ox + ((p.x - dragStart.x) / size.w) * 4));
  slot.oy = Math.max(-1, Math.min(1, dragStart.oy + ((p.y - dragStart.y) / size.h) * 4));
  syncSliders();
  redraw();
});
canvas.addEventListener('pointerup', () => { dragStart = null; });
canvas.addEventListener('pointercancel', () => { dragStart = null; });

previewWrap.addEventListener('dragover', (e) => { e.preventDefault(); previewWrap.classList.add('drop'); });
previewWrap.addEventListener('dragleave', () => previewWrap.classList.remove('drop'));
previewWrap.addEventListener('drop', (e) => {
  e.preventDefault();
  previewWrap.classList.remove('drop');
  loadFileIntoSlot(e.dataTransfer.files[0], selectedSlot);
});

/* ---------- text and toggles ---------- */

$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('tag').addEventListener('input', (e) => { state.tag = e.target.value; redraw(); });

for (const [id, key] of [['toggle-sun', 'sun'], ['toggle-palms', 'palms'], ['toggle-grain', 'grain'], ['toggle-frame', 'frame']]) {
  $(id).addEventListener('change', (e) => { state[key] = e.target.checked; redraw(); });
}

/* ---------- export ---------- */

$('export').addEventListener('click', () => {
  const size = currentSize();
  const out = renderCover(state, size);
  out.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-vice-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved neon-vice-cover-${size.w}x${size.h}.png — post it!`);
  }, 'image/png');
});

/* ---------- boot ---------- */

const shot = new URLSearchParams(location.search).get('shot');
refreshOptions();
syncSliders();
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, loadImage, redraw, refreshOptions);
} else {
  // The bundled fonts make the lettering; redraw once they arrive.
  if (document.fonts?.ready) document.fonts.ready.then(() => redraw());
  redraw();
  setStatus('Pick a layout, load a photo into each panel, write your caption — then export.');
}
