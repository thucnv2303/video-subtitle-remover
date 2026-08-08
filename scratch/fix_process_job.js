const fs = require('fs');
const p = 'src/renderer/js/app.js';
let content = fs.readFileSync(p, 'utf8');

// Replace all occurrences of processNextJob(1) with processNextJob(job.pipeline) if `job` is in scope, 
// OR processNextJob(window._activePipeline || 2) if not.

content = content.replace(/processNextJob\(1\);/g, 'processNextJob(job ? job.pipeline : (window._activePipeline || 2));');

// Also fix `btnOpenFile` pipeline which should be 2.
content = content.replace(
  "el.btnOpenFile.addEventListener('click', () => { window._uploadPipeline = 2; selectFile(); });",
  "el.btnOpenFile.addEventListener('click', () => { window._uploadPipeline = 2; selectFile(); });"
);

fs.writeFileSync(p, content, 'utf8');
console.log('Fixed app.js');
