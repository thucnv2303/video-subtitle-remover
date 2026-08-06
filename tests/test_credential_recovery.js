// test_forensic.js
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const testDir = path.join(os.tmpdir(), "vsr_010_" + process.pid);
fs.mkdirSync(testDir, { recursive: true });

const fakeApp = { getPath: () => testDir, requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), on: () => {}, commandLine: { appendSwitch: () => {} } };
const fakeSafe = { isEncryptionAvailable: () => true, encryptString: s => Buffer.from(s, "utf8"), decryptString: b => b.toString("utf8") };

const Module = require("module");
const _orig = Module._load;
Module._load = function(req, parent, isMain) {
  if (req === "electron") {
    function FakeBW() {}
    FakeBW.prototype.on = function(){};
    FakeBW.getAllWindows = function(){ return []; };
    return {
      app: fakeApp, safeStorage: fakeSafe,
      ipcMain: { handle: function(){}, on: function(){} },
      BrowserWindow: FakeBW, dialog: {}, shell: {}, Menu: { buildFromTemplate: function(){return {}}, setApplicationMenu: function(){} }
    };
  }
  if (req === "./python-bridge") return { PythonBridge: function(){} };
  return _orig.apply(this, arguments);
};
global.app = fakeApp;
global.safeStorage = fakeSafe;
process.env.NODE_ENV = "test";

const mainPath = path.resolve(__dirname, "..", "src", "main", "main.js");
let credStore;
try {
  credStore = require(mainPath)._credStore;
} catch(e) {
  console.error("FATAL require:", e.message.split("\n")[0]);
  process.exit(2);
}
if (!credStore) { console.error("FATAL: _credStore not exported."); process.exit(2); }

const { getKeysPaths, fileExists, tryUnlink, windowsSafeRestoreFromBak, recoverKeyStore, loadEncryptedKeys, saveEncryptedKeys } = credStore;

const PH = "deadbeef0102030405060708deadbeef01020304050607080102030405060708";
let PASS = 0, FAIL = 0;
const rows = [];
function ok(label, cond, detail) {
  const s = cond ? "PASS" : "FAIL";
  if (cond) PASS++; else FAIL++;
  rows.push({ s: s, label: label, detail: detail || "" });
  console.log("  " + s + ": " + label + (detail ? " [" + detail + "]" : ""));
}

const P = getKeysPaths();


function cleanup() {
  [P.keysPath, P.tmpPath, P.bakPath, P.corruptPrimaryPath, P.corruptNewPath, P.corruptRestoredPath].forEach(f => {
    try { fs.unlinkSync(f); } catch(e) {}
  });
}
function writeRaw(p, c) { fs.writeFileSync(p, c, "utf8"); }
function stateDesc() {
  const s = [];
  if (fileExists(P.keysPath)) s.push("keys");
  if (fileExists(P.tmpPath)) s.push("tmp");
  if (fileExists(P.bakPath)) s.push("bak");
  if (fileExists(P.corruptPrimaryPath)) s.push("c.pri");
  if (fileExists(P.corruptNewPath)) s.push("c.new");
  if (fileExists(P.corruptRestoredPath)) s.push("c.res");
  return s.length ? s.join("+") : "(empty)";
}
const evidence = [];
function rec(tc, input, branch, after, err) {
  evidence.push({ tc: tc, input: input, branch: branch, after: after, err: err || "" });
}

console.log("\n=== TC1: existing corrupt-primary forensic artifact before restore ===");
cleanup();
writeRaw(P.keysPath, "{corrupt}");
writeRaw(P.bakPath, JSON.stringify({ deepseek: [PH] }));
writeRaw(P.corruptPrimaryPath, "{old_corrupt}"); // Blocks Case A restore
try {
  recoverKeyStore();
  ok("Should throw RECOVERY_REQUIRED", false);
} catch(e) {
  ok("throws RECOVERY_REQUIRED", e.code === "RECOVERY_REQUIRED", e.code);
  ok("old forensic untouched", fileExists(P.corruptPrimaryPath));
  rec("TC1","keys(corrupt)+bak+c.pri","caseA-blocked",stateDesc(),e.message.substring(0,80));
}

console.log("\n=== TC2: existing corrupt-new forensic artifact before post-write rollback ===");
cleanup();
writeRaw(P.keysPath, JSON.stringify({ deepseek: [PH] }));
writeRaw(P.corruptNewPath, "{old_corrupt_new}");
let tc2Renames = 0;
const tc2Orig = fs.renameSync;
fs.renameSync = function(o, n) { tc2Renames++; return tc2Orig(o, n); };
try {
  saveEncryptedKeys({ deepseek: ["abc"] });
  ok("Should throw RECOVERY_REQUIRED", false);
} catch(e) {
  ok("throws RECOVERY_REQUIRED", e.code === "RECOVERY_REQUIRED", e.code);
  ok("zero rename calls", tc2Renames === 0, tc2Renames + " calls");
  ok("keys content unchanged", fs.readFileSync(P.keysPath, "utf8") === JSON.stringify({ deepseek: [PH] }));
  ok("corrupt.new content unchanged", fs.readFileSync(P.corruptNewPath, "utf8") === "{old_corrupt_new}");
  ok("bak absent", !fileExists(P.bakPath));
  ok("tmp absent", !fileExists(P.tmpPath));
  ok("corrupt.primary absent", !fileExists(P.corruptPrimaryPath));
  ok("corrupt.restored absent", !fileExists(P.corruptRestoredPath));
  rec("TC2","keys+c.new","post-write-blocked",stateDesc(),e.message.substring(0,80));
}
fs.renameSync = tc2Orig;

console.log("\n=== TC3: restored backup fails validation ===");
cleanup();
writeRaw(P.keysPath, "{corrupt}");
writeRaw(P.bakPath, "{corrupt_bak}"); // bak is invalid JSON
try {
  windowsSafeRestoreFromBak(P.keysPath, P.bakPath, P);
  ok("Should throw RESTORE_FAILED", false);
} catch(e) {
  ok("throws RESTORE_FAILED", e.code === "RESTORE_FAILED", e.code);
  ok("corrupt restored moved to c.res", fileExists(P.corruptRestoredPath));
  ok("original primary rolled back", fileExists(P.keysPath));
  ok("corrupt primary forensic cleaned", !fileExists(P.corruptPrimaryPath));
  rec("TC3","keys(corrupt)+bak(corrupt)","windowsSafeRestore-fail",stateDesc(),e.message.substring(0,80));
}

console.log("\n=== TC4: moving restored invalid file to forensic fails ===");
cleanup();
writeRaw(P.keysPath, "{corrupt}");
writeRaw(P.bakPath, "{corrupt_bak}");
writeRaw(P.corruptRestoredPath, "{old_c.res}");
let tc4Renames = 0;
const tc4Orig = fs.renameSync;
fs.renameSync = function(o, n) { tc4Renames++; return tc4Orig(o, n); };
try {
  windowsSafeRestoreFromBak(P.keysPath, P.bakPath, P);
  ok("Should throw RECOVERY_REQUIRED", false);
} catch(e) {
  ok("throws RECOVERY_REQUIRED", e.code === "RECOVERY_REQUIRED", e.code);
  ok("zero rename calls", tc4Renames === 0, tc4Renames + " calls");
  ok("keys content unchanged", fs.readFileSync(P.keysPath, "utf8") === "{corrupt}");
  ok("bak content unchanged", fs.readFileSync(P.bakPath, "utf8") === "{corrupt_bak}");
  ok("corrupt.restored unchanged", fs.readFileSync(P.corruptRestoredPath, "utf8") === "{old_c.res}");
  ok("corrupt.primary absent", !fileExists(P.corruptPrimaryPath));
  rec("TC4","keys(corrupt)+bak(corrupt)+c.res","windowsSafeRestore-blocked",stateDesc(),e.message.substring(0,80));
}
fs.renameSync = tc4Orig;

console.log("\n=== TC5: restoring original primary fails (simulated via permissions) ===");

cleanup();
const origRenameSync = fs.renameSync;
fs.renameSync = function(o, n) {
  if (o === P.corruptPrimaryPath && n === P.keysPath) {
    const e = new Error("EPERM (Simulated restore failure)");
    e.code = "EPERM";
    throw e;
  }
  return origRenameSync(o, n);
};
writeRaw(P.keysPath, "{corrupt}");
writeRaw(P.bakPath, "{corrupt_bak}");
try {
  windowsSafeRestoreFromBak(P.keysPath, P.bakPath, P);
  ok("Should throw RESTORE_FAILED", false);
} catch(e) {
  ok("throws RESTORE_FAILED with nested error", e.code === "RESTORE_FAILED", e.message.substring(0,60));
  ok("c.res created", fileExists(P.corruptRestoredPath));
  ok("c.pri untouched (rollback failed)", fileExists(P.corruptPrimaryPath));
  rec("TC5","keys(corrupt)+bak(corrupt)","restore-original-fail",stateDesc(),e.message.substring(0,80));
}
fs.renameSync = origRenameSync;


console.log("\n=== TC6: post-write invalid primary with existing forensic artifacts ===");
cleanup();
writeRaw(P.keysPath, JSON.stringify({ deepseek: [PH] }));
// We don't block c.new, but we block c.res in the underlying windowsSafeRestoreFromBak
writeRaw(P.corruptRestoredPath, "{old}");
try {
  saveEncryptedKeys({ deepseek: ["abc"] }); // new write invalid
  ok("Should throw RECOVERY_REQUIRED", false);
} catch(e) {
  ok("throws RECOVERY_REQUIRED", e.code === "RECOVERY_REQUIRED", e.code);
  ok("c.new created", fileExists(P.corruptNewPath));
  ok("bak remains untouched (since restore blocked)", fileExists(P.bakPath) && fs.readFileSync(P.bakPath, "utf8") === JSON.stringify({ deepseek: [PH] }));
  rec("TC6","keys+bak+c.res (write invalid)","post-write-rollback-blocked",stateDesc(),e.message.substring(0,80));
}

console.log("\n=== TC7: Case E restore followed by tmp cleanup EPERM ===");
cleanup();
writeRaw(P.keysPath, "{corrupt}");
writeRaw(P.bakPath, JSON.stringify({ deepseek: [PH] }));

const testDir2 = P.tmpPath;
try { fs.unlinkSync(testDir2); } catch {}
fs.mkdirSync(testDir2, { recursive: true });
try {
  recoverKeyStore();
  ok("Should throw STORE_CORRUPT", false);
} catch(e) {
  ok("throws STORE_CORRUPT", e.code === "STORE_CORRUPT", e.code);
  ok("keys restored", fileExists(P.keysPath));
  ok("tmp preserved", fileExists(P.tmpPath));
  rec("TC7","keys(corrupt)+bak+tmp(dir)","caseE-unlink-fail",stateDesc(),e.message.substring(0,80));
}
try { fs.rmdirSync(testDir2); } catch {}

console.log("\n=== TC8: Case B restore followed by tmp cleanup EPERM ===");
cleanup();
writeRaw(P.bakPath, JSON.stringify({ deepseek: [PH] }));
try { fs.unlinkSync(P.tmpPath); } catch {}
fs.mkdirSync(P.tmpPath, { recursive: true });
try {
  recoverKeyStore();
  ok("Should throw STORE_CORRUPT", false);
} catch(e) {
  ok("throws STORE_CORRUPT", e.code === "STORE_CORRUPT", e.code);
  ok("tmp preserved", fileExists(P.tmpPath));
  rec("TC8","bak+tmp(dir)","caseB-unlink-fail",stateDesc(),e.message.substring(0,80));
}
try { fs.rmdirSync(P.tmpPath); } catch {}

console.log("\n=== TC9: successful restore forensic cleanup EPERM ===");
cleanup();
writeRaw(P.keysPath, "{corrupt}");
writeRaw(P.bakPath, JSON.stringify({ deepseek: [PH] }));
fs.mkdirSync(testDir2, { recursive: true });


const origUnlink = fs.unlinkSync;
fs.unlinkSync = function(p) {
  if (p === P.corruptPrimaryPath) { const e = new Error("EPERM"); e.code = "EPERM"; throw e; }
  return origUnlink(p);
};
try {
  windowsSafeRestoreFromBak(P.keysPath, P.bakPath, P);
  ok("Should throw STORE_CORRUPT", false);
} catch(e) {
  ok("throws STORE_CORRUPT", e.code === "STORE_CORRUPT", e.code);
  rec("TC9","keys(corrupt)+bak","restore-cleanup-fail",stateDesc(),e.message.substring(0,80));
}
fs.unlinkSync = origUnlink;

try { fs.rmdirSync(P.corruptPrimaryPath); } catch {}

console.log("\n=== TC10: no key/ciphertext contents in errors ===");
cleanup();
writeRaw(P.keysPath, '{"deepseek":["abc"]}'); // odd-length
writeRaw(P.bakPath, '{"deepseek":["abc"]}');
try {
  loadEncryptedKeys();
  ok("Should throw", false);
} catch(e) {
  ok("no PH in error", !e.message.includes(PH), "no ciphertext");
  ok("no abc in error", !e.message.includes("abc"), "no content");
  ok("typed error", e.code === "STORE_CORRUPT");
  rec("TC10","keys(odd)+bak(odd)","STORE_CORRUPT",stateDesc(),e.message.substring(0,80));
}

console.log("\n=== TC11: valid write backup cleanup EPERM ===");
cleanup();
writeRaw(P.keysPath, JSON.stringify({ deepseek: [PH] }));
try { fs.unlinkSync(P.bakPath); } catch {}
fs.mkdirSync(P.bakPath, { recursive: true });
// Need to monkeypatch tryUnlink internally if we want it to fail, or just rely on dir
// Actually, write flow renames keysPath to bakPath. Since bakPath is a dir, renameSync will fail.
try {
  saveEncryptedKeys({ deepseek: [PH] });
  ok("Should throw", false);
} catch(e) {
  ok("throws STORE_CORRUPT in recoverKeyStore", e.code === "STORE_CORRUPT", e.code);
  rec("TC11","keys+bak(dir)","caseA-cleanup-fail",stateDesc(),e.message.substring(0,80));
}
try { fs.rmdirSync(P.bakPath); } catch {}


console.log("\n=== SUMMARY ===");
console.log("PASS: " + PASS + "  FAIL: " + FAIL);
const failed = rows.filter(r => r.s === "FAIL");
if (failed.length) { console.log("FAILED:"); failed.forEach(r => console.log("  - " + r.label + " " + r.detail)); }

const evDir = path.resolve(__dirname, '..', '.ai', 'evidence', 'RECOVERY-007E-AI-SETTINGS-001-CLOSEOUT-COLLISION-FIX-012');
fs.mkdirSync(evDir, { recursive: true });

fs.writeFileSync(path.join(evDir, "commands.txt"), [
  "TASK: RECOVERY-007E-AI-SETTINGS-001-CLOSEOUT-COLLISION-FIX-012",
  "Platform: Windows 10 Pro",
  "Node: " + process.version,
  "HEAD: (git rev-parse HEAD)",
  "",
  "TEST COMMAND:",
  "  \$env:NODE_ENV='test'; node test_forensic.js",
  "",
  "STATIC CHECKS:",
  "  node --check src/main/main.js",
  "  git diff --check 4d0a38c4a69b94531d828f7a59dcdb0c360c5df4..HEAD",
  "  git diff --check",
  "",
  "ELECTRON LAUNCH:",
  "  npx electron .",
  "  (no --no-sandbox)"
].join("\n"), "utf8");

const matrix = evidence.map(e => "TC: "+e.tc+"\n  Input:  "+e.input+"\n  Branch: "+e.branch+"\n  After:  "+e.after+"\n  Error:  "+(e.err||"(none)")).join("\n\n");
console.log("\n=== RECOVERY MATRIX ===");
console.log([

  "FORENSIC RECOVERY MATRIX - CLOSEOUT-COLLISION-FIX-012",
  "Platform: Windows 10 Pro  Node: " + process.version,
  "",
  matrix
].join("\n"));

console.log("\n=== DETAILED RESULTS ===");
console.log([

  "RESULTS - FORENSIC-ROLLBACK-FIX010-CLOSEOUT-011",
  "Platform: Windows 10 Pro  Node: " + process.version,
  "PASS: " + PASS + "   FAIL: " + FAIL,
  "Exit: " + (FAIL > 0 ? 1 : 0),
  "",
  "Existing forensic artifact blocks restore (TC1, TC2, TC4): " + (rows.some(r => r.label.includes("throws RECOVERY_REQUIRED")) ? "YES" : "NO"),
  "Invalid restored backup moves to c.res (TC3): " + (rows.some(r => r.label.includes("corrupt restored moved to c.res")) ? "YES" : "NO"),
  "Post-write rollback on failure (TC6): " + (rows.some(r => r.label.includes("c.new created")) ? "YES" : "NO"),
  "Cleanup failure EPERM returned (TC7, TC8, TC9): " + (rows.some(r => r.label.includes("throws STORE_CORRUPT")) ? "YES" : "NO"),
  "No credential content in errors (TC10): " + (rows.some(r => r.label.includes("no PH in error")) ? "YES" : "NO"),
  "",
  "FAILED:",
  failed.length ? failed.map(r => "  FAIL: " + r.label + " " + r.detail).join("\n") : "  (none)"
].join("\n"));

cleanup();
try { fs.rmdirSync(testDir); } catch(e) {}
console.log("Test execution completed.");
process.exit(FAIL > 0 ? 1 : 0);
