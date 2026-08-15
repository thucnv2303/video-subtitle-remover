import './pipeline1-run-ux.js';
import './pipeline1-log-router.js';
import './pipeline3/editor.js';
import './pipeline3/subtitle-resize-effects.js';
import './pipeline3/subtitle-style-engine.js';
import { installPerJobSemanticRemixControls } from './pipeline1-semantic-remix-per-job.js';

/**
 * Pipeline 1 run configuration bridge.
 * Snapshots shared run settings plus each Job's own Semantic Remix choice.
 */
const state = () => window._appState || null;

function installRunConfigBridge() {
  const runAll = document.getElementById('btn-start-all');
  if (!runAll || runAll.dataset.runConfigBridge === 'true') return false;
  runAll.dataset.runConfigBridge = 'true';
  runAll.addEventListener('click', () => {
    const s = state();
    if (!s) return;
    const aiModel = document.getElementById('step1-ai-model')?.value || '';
    const voice = document.getElementById('step1-tts-voice')?.value || '';
    s.pipeline1RunConfig = {
      aiModel,
      voice,
      capturedAt: Date.now()
    };
    installPerJobSemanticRemixControls?.();
  }, true);
  return true;
}

if (!installRunConfigBridge()) {
  const timer = setInterval(() => {
    if (installRunConfigBridge()) clearInterval(timer);
  }, 100);
  setTimeout(() => clearInterval(timer), 10000);
}
