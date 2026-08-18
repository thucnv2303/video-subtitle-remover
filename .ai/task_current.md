# Current Task

## Task ID
TALKING-PORTRAIT-JOYVASA-035

## Status
SOURCE_PUBLISHED_OWNER_STATIC_AND_RUNTIME_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-JOYVASA-035`.
- Draft PR: #75.
- Base: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034@0ee0ed2760622aab603a2088d6064ee747cad9ed`.

## User outcome
A standalone AI Avatar tab creates a talking-portrait MP4 from one portrait image and one voice file using a real local JoyVASA + LivePortrait runtime. It must not alter P1/P2/P3, Voice Render, or standalone subtitle removal authority.

## Acceptance contract
1. AI Avatar page mounts independently and existing pages still navigate normally.
2. Generate is disabled until image + audio + JoyVASA engine readiness are present.
3. User may select an existing JoyVASA root; app persists only that local path in Electron userData config.
4. Runtime uses argv-based child process spawning; input paths are validated and never interpolated into a shell string.
5. Human mode is always used for this feature.
6. Natural/Expressive/Calm and expression/head controls stay within bounded cfg/motion ranges.
7. Eye/lip WIP upstream controls are not falsely exposed as functioning independent strengths.
8. Output path is isolated and deterministic for the job; successful MP4 is previewed and can be opened or Save-As copied.
9. Failure returns useful stderr/stdout tail; no fake-success output.
10. Only one Avatar process may run; Cancel is available while running.

## Required Owner static verification
```text
git fetch origin
git switch review/TALKING-PORTRAIT-JOYVASA-035
git pull --ff-only
node --check src/main/talking-portrait-engine.js
node --check src/main/main-entry.js
node --check src/main/preload.js
node --check src/renderer/js/talking-portrait.js
git diff --check 0ee0ed2760622aab603a2088d6064ee747cad9ed..HEAD
```

## Required Owner runtime verification
Prerequisite: upstream JoyVASA installed with required weights, FFmpeg, CUDA-compatible PyTorch and either a configured Python executable or conda env named `joyvasa`.

Scenario:
1. Open AI Avatar; engine status is truthful.
2. If not auto-detected, click `Chọn engine` and select the JoyVASA repository root containing `inference.py`.
3. Select a clear frontal human portrait and a short Vietnamese voice file.
4. Run `Chất lượng cao` / `Tự nhiên` first.
5. Observe live status; app remains responsive.
6. Final MP4 appears in preview with the supplied audio and visible talking/head motion.
7. `Mở video` works and `Lưu bản sao` creates a copy without modifying canonical pipeline outputs.
8. Run a second short job with `Sinh động`; verify stronger but bounded motion.
9. Start a job and test `Dừng`; verify process ends without false completion.
10. Smoke-check P1/P2/P3/Voice Render/Xóa Sub navigation after Avatar test.

## Gates
- Execution: PASS.
- Automated/static: WAITING Owner exact-checkout commands.
- Code review: IN PROGRESS pending final exact-HEAD review.
- Owner runtime: NOT STARTED.
- Documentation sync: IN PROGRESS.
- Merge: BLOCKED.

## Next action
Finish docs, perform final GitHub diff/full-file review, then hand exact HEAD to Owner for static + real GPU runtime verification. No merge.