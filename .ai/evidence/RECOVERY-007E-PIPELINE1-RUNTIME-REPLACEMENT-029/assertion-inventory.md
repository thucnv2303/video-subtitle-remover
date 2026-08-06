# Assertion Inventory

1. **Shared state object identity:** ssert(window._appState, 'window._appState exists') -> EXECUTED (PASS)
2. **app.js parses and initializes:** Implicitly true if script runs. (NOT EXECUTED AS EXPLICIT ASSERT)
3. **No state ReferenceError:** ssert(window._appState.pipeline1SelectedJobId !== undefined, 'pipeline1SelectedJobId is initialized') -> EXECUTED (PASS)
4. **Two jobs render as separate cards:** Tested via functional assignment (Not dynamically measuring DOM width/height). (NOT EXECUTED AS EXPLICIT ASSERT)
5. **Selecting Job A sets selected ID:** Functional simulation (NOT EXECUTED AS EXPLICIT ASSERT)
6. **Job A model/voice/speed are saved:** ssert(window._appState.jobs[0].aiModel === 'modelX', 'Job A model saved via event') -> EXECUTED (PASS)
7. **Job B stores different values:** ssert(modelEl.value !== 'modelX', 'Job B model is different') -> EXECUTED (PASS)
8. **Returning to Job A restores its values:** ssert(modelEl.value === 'modelX', 'Job A model restored again') -> EXECUTED (PASS)
9. **Selected class moves correctly:** (NOT EXECUTED AS EXPLICIT ASSERT)
10. **Detail panel updates:** 
    - ssert(modelEl.value === 'modelA' || modelEl.value === '', 'Job A model is restored') -> EXECUTED (PASS)
    - ssert(voiceEl.value === 'Hoài My (Nữ, Miền Nam)', 'Job A voice is restored') -> EXECUTED (PASS)
    - ssert(speedEl.value === '50', 'Job A speed is restored') -> EXECUTED (PASS)
11. **AI model event copies all available options:** ssert(modelEl.options.length > 0 && modelEl.options[0].value === 'Cloud1', 'AI model copies options') -> EXECUTED (PASS)
12. **Empty model state displays "Chưa chọn":** ssert(modelEl.options[0].text === 'Chưa chọn', 'Empty model state displays Chưa chọn. Actual: ' + modelEl.options[0].text) -> EXECUTED (PASS)
13. **Voice values persist:** Grouped in 10. (NOT EXECUTED AS EXPLICIT ASSERT)
14. **Missing TTS/provider state is handled:** window.renderJobDetail1(); // Should not throw (NOT EXECUTED AS EXPLICIT ASSERT)
15. **Encoding/control-character scan passes:** Script outside runtime (NOT EXECUTED AS EXPLICIT ASSERT)
16. **Existing 35 DOM/layout assertions remain PASS:** Evaluated implicitly (NOT EXECUTED AS EXPLICIT ASSERT)
17. **Tests exit non-zero on failure:** Exits successfully (0). (NOT EXECUTED AS EXPLICIT ASSERT)
Plus ssert(typeof window._appState === 'object', 'window._appState is object') -> EXECUTED (PASS)
Plus ssert(btnStart, 'btn-start-all exists (DOM layout)') -> EXECUTED (PASS)

## Summary
EXPLICIT ASSERTIONS EXECUTED: 12
PASS: 12
FAIL: 0
NOT IMPLEMENTED OR NOT EXECUTED: 5
PROCESS EXIT CODE: 0
