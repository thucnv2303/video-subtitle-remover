# Root Cause
app.js declared a separate state object inside an IIFE and overwrote window._appState without checking if it existed. The IIFE was missing its closing })(); at the end of the file. Dropdowns for AI models and TTS voices did not sync with job selections.
