import { $, $$, el } from '../utils/dom.js';
import { state } from '../store.js';

// --- Live Preview ---
  export async function fetchAndDrawLivePreview() {
    try {
      const blob = await api.getLivePreview();
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { 
        el.canvasResult.width = img.width; 
        el.canvasResult.height = img.height; 
        const ctx = el.canvasResult.getContext('2d');
        ctx.drawImage(img, 0, 0); 
        URL.revokeObjectURL(url); 
        el.resultPlaceholder.classList.add('hidden'); 
      };
      img.src = url;
    } catch (e) {}
  }

  export function startLivePreviewPolling() {
    if (state.livePreviewInterval) return;
    fetchAndDrawLivePreview(); // immediate fetch
    state.livePreviewInterval = setInterval(fetchAndDrawLivePreview, 1000); // fetch every 1s
  }

  export function stopLivePreviewPolling() {
    if (state.livePreviewInterval) {
      clearInterval(state.livePreviewInterval);
      state.livePreviewInterval = null;
    }
  }