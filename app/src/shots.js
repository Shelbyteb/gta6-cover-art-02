// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover draws one exported cover alone, full frame, at its export
// size. Query knobs: photo, photo2..4 (boulevard|pier), layout, grade, size,
// title, subtitle, tag. window.__shotReady is set once the cover is painted.
import { drawCover, sizeById, layoutById, gradeById, emptySlot } from './cover.js';

function sampleName(v) {
  return v === 'pier' ? 'pier' : 'boulevard';
}

export async function runShot(shot, query, state, loadImage, redraw, refreshOptions) {
  const title = query.get('title') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'one last ride';
  const tag = query.get('tag') ?? 'Neon Coast · Est. 2026';
  state.title = title;
  state.subtitle = subtitle;
  state.tag = tag;
  state.layout = layoutById(query.get('layout') ?? 'hero3').id;
  state.grade = gradeById(query.get('grade') ?? 'sunset').id;
  state.size = sizeById(query.get('size') ?? 'portrait').id;
  state.sun = query.get('sun') !== '0';
  state.palms = query.get('palms') !== '0';
  state.grain = query.get('grain') !== '0';
  state.frame = query.get('frame') !== '0';

  const need = layoutById(state.layout).slots;
  const photoA = query.get('photo') ?? 'boulevard';
  const photoB = query.get('photo2') ?? photoA;
  state.photos = [];
  for (let i = 0; i < need; i++) {
    // Named per-slot photos win; otherwise alternate the two samples so a
    // multi-panel cover shows both instead of repeating one photo.
    const pick = query.get(`photo${i === 0 ? '' : i + 1}`) ?? (i % 2 === 0 ? photoA : photoB);
    try {
      const img = await loadImage(`samples/${sampleName(pick)}.jpg`);
      const fx = Number(query.get(`fx${i + 1}`) ?? 0.5);
      const fy = Number(query.get(`fy${i + 1}`) ?? 0.5);
      state.photos.push({ img, zoom: 1, ox: 0, oy: 0, fx: Number.isFinite(fx) ? fx : 0.5, fy: Number.isFinite(fy) ? fy : 0.5 });
    } catch {
      state.photos.push(emptySlot());
    }
  }

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = sizeById(state.size);
    const canvas = document.getElementById('cover');
    canvas.width = size.w;
    canvas.height = size.h;
    // Wait for the bundled fonts so the lettering is the real one.
    try { await document.fonts.load('100px Anton'); await document.fonts.load('40px Pacifico'); } catch { /* fallbacks apply */ }
    drawCover(canvas, state);
  } else {
    // Editor scene: the full page, controls visible, photo already loaded.
    document.getElementById('title').value = title;
    document.getElementById('subtitle').value = subtitle;
    document.getElementById('tag').value = tag;
    if (refreshOptions) refreshOptions();
    redraw();
    try { await document.fonts.ready; } catch { /* fallbacks apply */ }
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
