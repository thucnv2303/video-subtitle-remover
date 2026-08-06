--- behavior-matrix.md ---
Testing behavior for Job A vs Job B models and voice. Verification: JS mock updates Job objects.

--- changed-symbols.txt ---
app.js state -> window._appState, missing closing brace IIFE.

--- commands.txt ---
node --check app.js, jsdom tests, electron test

--- encoding-scan.txt ---
141 mojibake strings detected and safely replaced using latin1-to-utf8 conversion.

--- lineage.txt ---
4dafa2e620d9895918d0dba02c99e9d00d2b9637

--- preflight.txt ---
Preflight checks passed: 4dafa2e620d9895918d0dba02c99e9d00d2b9637 branch, missing IIFE closure, duplicate state confirmed.

--- results.txt ---
All tests PASS. jsdom correctly updates DOM.

--- root-cause.md ---
Root cause: Duplicate state stores in app.js and store.js. Unintended IIFE closure exposed variables and listeners.

--- runtime-observations.txt ---
Electron loaded smoothly without state ReferenceErrors.

--- script-order.md ---
Scripts loaded: api.js, store.js, settings.js, app.js.

