export function fitLogicalCanvas(videoWidth, videoHeight, viewportWidth, viewportHeight) {
  const vw = Math.max(1, Number(videoWidth) || 1);
  const vh = Math.max(1, Number(videoHeight) || 1);
  const pw = Math.max(1, Number(viewportWidth) || 1);
  const ph = Math.max(1, Number(viewportHeight) || 1);
  const scale = Math.min(pw / vw, ph / vh);
  const width = vw * scale;
  const height = vh * scale;
  return {
    scale,
    width,
    height,
    left: (pw - width) / 2,
    top: (ph - height) / 2,
    videoWidth: vw,
    videoHeight: vh,
  };
}

export function viewportPointToLogical(clientX, clientY, viewportRect, fit) {
  const x = (Number(clientX) || 0) - viewportRect.left - fit.left;
  const y = (Number(clientY) || 0) - viewportRect.top - fit.top;
  return {
    x: clamp(x / fit.scale, 0, fit.videoWidth),
    y: clamp(y / fit.scale, 0, fit.videoHeight),
  };
}

export function logicalPointToPercent(x, y, width, height) {
  return {
    x: clamp((Number(x) || 0) / Math.max(1, Number(width) || 1) * 100, 0, 100),
    y: clamp((Number(y) || 0) / Math.max(1, Number(height) || 1) * 100, 0, 100),
  };
}

export function percentPointToLogical(xPct, yPct, width, height) {
  return {
    x: Math.round(clamp(Number(xPct) || 0, 0, 100) / 100 * Math.max(1, Number(width) || 1)),
    y: Math.round(clamp(Number(yPct) || 0, 0, 100) / 100 * Math.max(1, Number(height) || 1)),
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}
