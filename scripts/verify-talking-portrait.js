const assert = require('assert');
const Module = require('module');

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'electron') {
    return {
      app: { getPath: () => process.cwd(), getAppPath: () => process.cwd() },
      dialog: {},
      BrowserWindow: {},
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { presetToArgs } = require('../src/main/talking-portrait-engine');

assert.deepStrictEqual(presetToArgs({ mode: 'natural', expression: 65, head: 50, quality: 'quality' }), {
  cfgScale: 2.8,
  drivingMultiplier: 1,
  useHalf: false,
});
assert.strictEqual(presetToArgs({ mode: 'expressive', expression: 100 }).cfgScale <= 4, true);
assert.strictEqual(presetToArgs({ mode: 'calm', expression: 20 }).cfgScale >= 1.6, true);
assert.strictEqual(presetToArgs({ head: 100 }).drivingMultiplier <= 1.35, true);
assert.strictEqual(presetToArgs({ head: 20 }).drivingMultiplier >= 0.85, true);
assert.strictEqual(presetToArgs({ quality: 'preview' }).useHalf, true);

console.log('talking-portrait deterministic checks: PASS');
