# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — REASONING/VRAM RESILIENCE CODE REVIEW PASS / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting/base SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest reviewed source commit: `fc807c9daa38df62fb885f2c4ff7db4fde4623f3`.

## Latest Owner runtime evidence — 2026-08-11
Verified from Owner screenshot/log:
- multi-job fault isolation works: a failed Job does not block the next Job;
- failed-Job popup is reachable, but the previous tested revision still needed improved detail/retry affordance;
- processing Job card visibly pulsed/blinked, while Owner wants a steady card/badge with only the spinner rotating;
- a prior `test3.mp4` run failed with malformed JSON near the previous 2200-token reasoning ceiling;
- after a different clone-TTS Job completed, retrying `test3.mp4` reached qwen3-coder reasoning, began output after 71.7s, and was still producing output at 336s.

The 336s sample is not an infinite wait in source: the reasoning request had a finite 360s timeout. However it is an unacceptable near-timeout runtime regression and remains an Owner blocker.

## Verified source causes / evidence
1. Processing blink: CSS explicitly animated the whole processing card with `p1-job-card-pulse`; this is removed in `05697633...`. Spinner animation remains.
2. Repeated malformed JSON: previous reasoning used a hard `num_predict=2200`; the Owner's earlier failure occurred when output was at/near that ceiling. Current IPC now detects output truncation explicitly and uses a transcript-sensitive budget (16-segment input => 3200 tokens), with concise-output instructions.
3. Retry waste: previous renderer retry repeated the full vision+reasoning chain. Current source performs at most one reasoning-only repair using the already-produced visual context, and removes the duplicate whole-chain retry.
4. GPU contention hypothesis: direct source inspection shows OmniVoice was cached indefinitely in module-global `_model`. Owner timing shows the slow `test3.mp4` run followed immediately after clone TTS. This strongly supports, but does not yet runtime-prove, cross-process GPU contention. Current `tts_engine.py` keeps the model across adjacent TTS segments but releases it after 6 seconds of TTS inactivity, including CUDA cache cleanup.

## Current source correction
- `src/renderer/styles/pipeline1-run-ux.css`: steady processing card; spinner only animation.
- `src/main/p1-vision-ipc.js`: concise structured-output prompt, transcript-sensitive reasoning token budget, explicit truncation diagnostics, finite timeout, and one reasoning-only repair.
- `src/renderer/js/pipelines/pipeline1-ai.js`: removes duplicate full multimodal retry; exact Job error persistence remains.
- `api/tts_engine.py`: debounced idle OmniVoice release so sequential clone segments reuse one load, while the completed TTS burst releases GPU resources before later P1 reasoning.
- Existing popup retry, failure isolation, Stop/Cancel guards, P1→P2 gate, P2/P3 source remain preserved.

## Verification
- GitHub compare Owner-tested head `a251bf87...` → source `fc807c9d...`: only task spec plus four approved source files changed; no P2/P3/STTN/Settings source.
- Full current `p1-vision-ipc.js`, `pipeline1-ai.js`, TTS diff and CSS diff inspected directly on GitHub.
- PM code review PASS for source `fc807c9d...`: review `4902998957`.
- No unresolved inline review threads.
- GitHub status checks are not configured; no CI PASS is claimed.
- PM environment has not executed full Electron/Python runtime, so automated/static verification remains PARTIAL pending executable evidence/Owner runtime.

## Gates
- Execution: PASS.
- Automated/static verification: PARTIAL — source/diff review PASS; no configured CI/full runtime executed by PM.
- Code review: PASS for `fc807c9d...`.
- Owner manual verification: PARTIAL PASS — queue isolation PASS; steady-spinner/reasoning-resource/popup-retry fresh retest required.
- Documentation synchronization: PASS after current docs publication.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Owner retests the latest PR #44 head. Critical sequence: finish one clone-TTS P1 Job, then run `test3.mp4`; verify the TTS release log appears, qwen reasoning completes or fails with a bounded explicit diagnostic rather than an unexplained multi-minute stall, processing card stays steady with only spinner rotating, and popup retry remains usable.
