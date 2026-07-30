const fs = require('fs');
const appJs = fs.readFileSync('src/renderer/js/app.js', 'utf8');
const indexHtml = fs.readFileSync('src/renderer/index.html', 'utf8');
const matches = [...appJs.matchAll(/\$\(\s*['"]#([^'"]+)['"]\s*\)/g)];
const missing = [];
for (const match of matches) {
  const id = match[1];
  if (!indexHtml.includes('id="' + id + '"') && !indexHtml.includes("id='" + id + "'")) {
    missing.push(id);
  }
}
console.log('Missing IDs in index.html:', [...new Set(missing)]);
