# PIPELINE3-EDITOR-REBUILD-016 — Bootstrap Amendment

Status: APPROVED

## Reason
The original spec allowed a minimal bootstrap import in `pipeline3-finalize.js`. Direct replacement of that existing finalizer would unnecessarily increase source-edit risk because the file is large and the P3 editor does not need to alter finalizer logic.

The safer equivalent bootstrap is one import-only line in the already-loaded ES module `src/renderer/js/pipeline1-run-config.js`:

```js
import './pipeline3/editor.js';
```

This is bootstrap-only. It MUST NOT change any Pipeline 1 symbol, run configuration, event handler, or behavior. `pipeline3-finalize.js` remains byte-for-byte unchanged in task 016.

## Revised allowed source
- `src/renderer/js/pipeline3/editor.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/preview-geometry.js`
- `src/renderer/js/pipeline3/subtitle-ass.js`
- `src/renderer/js/pipeline3/render-controller.js`
- `src/renderer/styles/pipeline3-editor.css`
- `src/renderer/js/pipeline1-run-config.js`: exactly one P3 import-only addition.

## Verification addition
PM review must confirm the only diff in `pipeline1-run-config.js` is the P3 import line and all pre-existing P1 code is unchanged.
