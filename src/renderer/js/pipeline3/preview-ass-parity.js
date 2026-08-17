let resizeObserver = null;
let scheduled = false;

function numberValue(id, fallback = 0) {
  const value = Number(document.getElementById(id)?.value);
  return Number.isFinite(value) ? value : fallback;
}

function scheduleSync() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    syncPreviewToAssScale();
  });
}

function syncPreviewToAssScale() {
  const canvas = document.getElementById('p3e-canvas');
  const video = document.getElementById('p3e-video');
  const sub = document.getElementById('p3e-sub');
  if (!canvas || !video || !sub) return;

  const logicalWidth = Number(video.videoWidth) || 0;
  const renderedWidth = canvas.getBoundingClientRect().width;
  if (!(logicalWidth > 0) || !(renderedWidth > 0)) return;

  const scale = renderedWidth / logicalWidth;
  const fontSize = Math.max(10, numberValue('p3e-size', 46));
  const outline = Math.max(0, numberValue('p3e-outline-width', 0));
  const shadow = Math.max(0, numberValue('p3e-shadow', 0));
  const padding = Math.max(0, numberValue('p3e-padding', 0));

  sub.style.fontSize = `${fontSize * scale}px`;
  sub.style.padding = `${padding * scale}px`;
  sub.style.webkitTextStrokeWidth = `${outline * scale}px`;
  sub.style.textShadow = `0 ${shadow * scale}px ${Math.max(scale, shadow * 2 * scale)}px rgba(0,0,0,.85)`;
  sub.dataset.assPreviewScale = scale.toFixed(6);
}

function bindWhenReady() {
  const viewport = document.getElementById('p3e-viewport');
  const video = document.getElementById('p3e-video');
  if (!viewport || !video) {
    setTimeout(bindWhenReady, 100);
    return;
  }

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(scheduleSync);
    resizeObserver.observe(viewport);
  }
  video.addEventListener('loadedmetadata', scheduleSync);
  document.addEventListener('input', event => {
    if (event.target?.closest?.('#step-3-content')) scheduleSync();
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#step-3-content')) scheduleSync();
  }, true);
  scheduleSync();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWhenReady, { once: true });
else bindWhenReady();
