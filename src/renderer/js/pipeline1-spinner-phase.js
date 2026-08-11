(function stabilizePipeline1SpinnerPhase() {
  'use strict';

  const PERIOD_MS = 750;
  const seen = new WeakSet();

  function sync(now) {
    document.querySelectorAll('#step1-job-list .p1-job-state-live').forEach((status) => {
      if (seen.has(status)) return;
      seen.add(status);
      const phase = -(now % PERIOD_MS);
      status.style.setProperty('--p1-spinner-phase', `${phase.toFixed(1)}ms`);
    });
    requestAnimationFrame(sync);
  }

  requestAnimationFrame(sync);
})();
