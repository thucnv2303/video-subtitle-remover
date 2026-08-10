(function installPipeline1ArtifactGate() {
  const MODE = 'multimodal-keyframes-v1';
  let reported = new Set();

  function enforce() {
    const state = window._appState;
    if (!state?.jobs) return;

    for (const job of state.jobs) {
      if (job?.p1Config?.analysisMode !== MODE) continue;
      const unlocked = job.p1Status === 'finished' || job.p2Status === 'ready' || job.status === 'p2-ready';
      if (!unlocked || job.p1ArtifactsReady === true) continue;

      job.p1Status = 'error';
      job.p2Status = 'locked';
      job.p3Status = 'locked';
      job.status = 'idle';
      job.progress = 0;

      if (!reported.has(job.id)) {
        reported.add(job.id);
        window.addLog?.(`[P1] ❌ ${job.fileName}: legacy runner báo hoàn tất nhưng multimodal artifacts chưa đủ; Pipeline 2 vẫn khóa.`, 'error');
      }
      window.pipelineStateGate?.scheduleSync?.();
    }

    const activeIds = new Set(state.jobs.map(job => job.id));
    reported = new Set([...reported].filter(id => activeIds.has(id)));
  }

  setInterval(enforce, 50);
  window.pipeline1ArtifactGate = { enforce };
})();
