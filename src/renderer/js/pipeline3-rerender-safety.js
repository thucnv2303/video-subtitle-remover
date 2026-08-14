const INSTALL_KEY = '__p3RerenderSafetyInstalled';

function selectedWorkspaceJob() {
  const state = window._appState;
  if (!state?.jobs) return null;
  const selectedId = document.getElementById('p3w-job-select')?.value;
  if (selectedId) return state.jobs.find(job => String(job.id) === String(selectedId)) || null;
  return state.jobs.find(job => String(job.id) === String(state.activeJobId)) || null;
}

function installP3RerenderSafety() {
  if (window[INSTALL_KEY]) return;
  window[INSTALL_KEY] = true;

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#p3w-render');
    if (!button) return;

    const job = selectedWorkspaceJob();
    if (!job?.outputPath) return;

    if (!job.p3CleanVideoPath) {
      job.p3CleanVideoPath = job.outputPath;
      return;
    }

    job.outputPath = job.p3CleanVideoPath;
  }, true);
}

installP3RerenderSafety();

export { installP3RerenderSafety };
