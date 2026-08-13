(function () {
  'use strict';

  function setStatus(id, text, ok, title) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || '—';
    el.dataset.ok = ok === true ? 'true' : ok === false ? 'false' : 'unknown';
    if (title) el.title = title;
  }

  async function refreshOwnerStatus() {
    if (!document.getElementById('global-app-status')) return;

    let backendOk = false;
    let ttsOk = false;

    try {
      await window.api?.health?.();
      backendOk = true;
      setStatus('global-status-backend', 'Sẵn sàng', true);
    } catch {
      setStatus('global-status-backend', 'Mất kết nối', false);
    }

    try {
      const tts = await window.api?.getTTSStatus?.();
      ttsOk = !!tts?.available;
      setStatus('global-status-tts', ttsOk ? (tts.model_loaded ? 'Đã nạp' : 'Sẵn sàng') : 'Chưa sẵn sàng', ttsOk);
    } catch {
      setStatus('global-status-tts', 'Không khả dụng', false);
    }

    try {
      const gpu = await window.api?.gpuInfo?.();
      const name = gpu?.gpu_name || gpu?.name || 'Không khả dụng';
      const available = gpu?.gpu_available ?? gpu?.cuda_available;
      const vram = gpu?.vram_total ? ` · ${gpu.vram_total}` : '';
      setStatus('global-status-gpu', `${name}${vram}`, available === true ? true : available === false ? false : undefined, name);
    } catch {
      setStatus('global-status-gpu', 'Không khả dụng', undefined);
    }

    try {
      const info = await window.electronAPI?.getSystemInfo?.();
      const cpuPct = Number.isFinite(info?.cpu_usage_percent) ? `${Math.round(info.cpu_usage_percent)}%` : '—';
      const cpuTitle = info?.cpu_model ? `${info.cpu_model} · ${info.logical_cores || '—'} luồng` : '';
      setStatus('global-status-cpu', cpuPct, Number.isFinite(info?.cpu_usage_percent) ? true : undefined, cpuTitle);

      if (info?.total_memory_bytes) {
        const used = Number(info.used_memory_bytes ?? (info.total_memory_bytes - info.free_memory_bytes));
        const total = Number(info.total_memory_bytes);
        const ramPct = Number.isFinite(info?.memory_usage_percent)
          ? `${Math.round(info.memory_usage_percent)}%`
          : `${Math.round((used / total) * 100)}%`;
        setStatus('global-status-ram', ramPct, true, `${(used / 1073741824).toFixed(1)} / ${(total / 1073741824).toFixed(1)} GB`);
      } else {
        setStatus('global-status-ram', 'Không khả dụng', undefined);
      }

      const version = `VSR ${info?.app_version ? `v${info.app_version}` : ''} · Electron ${info?.electron_version || '—'}`;
      setStatus('global-status-version', version, true);
    } catch (error) {
      setStatus('global-status-cpu', 'Không khả dụng', undefined);
      setStatus('global-status-ram', 'Không khả dụng', undefined);
      console.error('[Voice Render] system-info bridge failed:', error?.message || error);
    }

    const overall = document.getElementById('global-status-overall');
    if (overall) {
      overall.textContent = backendOk && ttsOk ? 'Hoạt động tốt' : backendOk ? 'Cần kiểm tra TTS' : 'Backend offline';
      overall.dataset.ok = backendOk && ttsOk ? 'true' : 'false';
    }
  }

  function installRenderDiagnostics() {
    const button = document.getElementById('vr-start');
    if (!button || button.dataset.ownerDiagnosticsBound === 'true') return;
    button.dataset.ownerDiagnosticsBound = 'true';
    button.addEventListener('click', () => {
      const bridgeOk = !!(window.electronAPI?.saveFile && window.electronAPI?.mergeWavFiles);
      if (!bridgeOk) {
        console.error('[Voice Render] render bridge missing: saveFile/mergeWavFiles unavailable');
        window.showToast?.('Bridge lưu/ghép Voice Render chưa sẵn sàng. Xem log PowerShell.', 'error');
      }
    }, true);
  }

  function install() {
    const timer = setInterval(() => {
      if (!document.getElementById('global-app-status')) return;
      clearInterval(timer);
      refreshOwnerStatus();
      installRenderDiagnostics();
      document.getElementById('global-status-refresh')?.addEventListener('click', refreshOwnerStatus);
      setInterval(refreshOwnerStatus, 10000);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
