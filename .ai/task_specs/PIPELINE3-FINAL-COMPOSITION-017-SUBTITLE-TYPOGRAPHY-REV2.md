# PIPELINE3-FINAL-COMPOSITION-017 — Subtitle Typography Rev2

Status: APPROVED FOR PM DIRECT EXECUTION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58
- Exact starting HEAD: `e906c5dcef863b6dc0183a1ce9c4a70845b3f46e`
- Parent task: `PIPELINE3-FINAL-COMPOSITION-017`
- Prior amendment: `.ai/task_specs/PIPELINE3-FINAL-COMPOSITION-017-SUBTITLE-UX-REV1.md`
- Owner direction: continue deepening subtitle authoring, specifically typography/font choices and text-style usability.

## Product goal
Make P3 subtitle styling fast enough for final composition without adding fake typography controls that preview correctly but cannot render through ASS/libass.

## Scope
### 1. Richer font selection
Keep the existing `fontFamily` contract because final ASS already writes that family name into the ASS style.
Expand the current small font selector into grouped practical choices:
- Vietnamese/system-safe: Segoe UI, Arial, Tahoma, Verdana, Trebuchet MS, Calibri, Aptos, Nirmala UI;
- display: Arial Black, Impact;
- serif: Georgia, Times New Roman, Cambria, Constantia;
- mono: Consolas, Courier New;
- common optional installed fonts: Roboto, Inter, Be Vietnam Pro, Montserrat, Poppins, Oswald.

No font file is bundled/downloaded. Availability depends on the Owner's OS/libass environment.

### 2. Custom installed font
Add a custom font-family input + Apply action. It writes the same per-Job `fontFamily` property and adds that name to the visible selector for the current session.
- trim whitespace;
- reject blank values;
- no file upload/download in this revision;
- existing ASS sanitization remains authoritative for commas/newlines.

### 3. Typography quick styles
Add quick style chips that only change already-renderable P3 properties:
- Clean UI;
- Heavy Caption;
- Impact;
- Serif Guide;
- Mono Tech;
- Soft Tutorial.

These may set existing properties such as font family, size, bold/italic, outline, shadow and text/background color. They must go through the existing P3 input path so preview and derived ASS stay synchronized.

### 4. Font sample / current-family feedback
Show a compact sample `Aa ĂÂĐ ÊÔƠƯ 0123` in the inspector using the currently selected family, plus the current family name. This is preview guidance only; final acceptance still requires a real burn because system font availability and libass resolution can differ.

## Non-goals
- no arbitrary font weight slider: current ASS path has reliable Bold/Italic but not a verified numeric weight contract;
- no letter-spacing/line-height expansion in this revision unless final ASS parity is proven;
- no web font download or bundled font redistribution;
- no P1/P2/backend/TTS/finalizer changes;
- no new branch/worktree/test directory.

## Allowed source
- `src/renderer/js/pipeline3/subtitle-resize-effects.js`

No other application source should change for this revision unless source review proves a hard blocker.

## Interaction
- typography block lives inside the existing `Phụ đề` fold rather than adding another permanently open long form;
- quick style click updates visible existing controls and preview immediately;
- changing Job restores that Job's own `fontFamily` and current typography state;
- preset changes may intentionally change font/style; typography enhancer must re-sync its sample/custom field after the normal preset path runs;
- no duplicated listeners on repeated mount/sync.

## Acceptance
1. Font selector offers grouped practical font choices instead of only the original five.
2. Custom installed font name can be applied without adding a dependency or font file.
3. Quick typography styles visibly update existing font/size/outline/shadow/background controls.
4. Preview sample and active subtitle use the chosen family.
5. Job switch restores per-Job family.
6. Existing resize handles, position drag, effects, cover band, cue editing, voice/video fit and render remain functional.
7. Final non-karaoke ASS continues using selected `fontFamily`; no preview-only unsupported typography control is introduced.

## Verification
Required exact-checkout static:
```text
node --check src/renderer/js/pipeline3/subtitle-resize-effects.js
git diff --check e906c5dcef863b6dc0183a1ce9c4a70845b3f46e..HEAD
```

Owner runtime:
- choose Segoe UI / Georgia / Consolas / Impact and verify preview changes;
- apply one known installed custom font and verify preview + short final render;
- test each quick style once;
- switch between two Jobs with different fonts and verify isolation;
- recheck width resize and one subtitle animation.

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING after source publication.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL until source review/docs closeout.
- Merge: BLOCKED.
