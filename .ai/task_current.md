# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Failed-Job Retry/Error Detail, and Reasoning/GPU Resilience

## Status
REASONING_GPU_RESILIENCE_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest reviewed source commit: `fc807c9daa38df62fb885f2c4ff7db4fde4623f3`.
- PM review: `4902998957`.

## Owner-confirmed runtime state
- Multi-job failure isolation: PASS.
- Failed-card popup opens: PASS.
- Prior popup detail/retry affordance: revision required; current popup retry/detail source published.
- Processing card: FAIL in prior test because whole card pulsed/blinked.
- `test3.mp4`: prior malformed JSON failure near old 2200-token output ceiling; later retry showed qwen reasoning still producing output at 336s after a clone-TTS Job had completed.

## Current implementation
1. Processing card/badge is steady; only spinner rotates.
2. P1 reasoning structured output is explicitly concise.
3. Reasoning token budget scales with transcript segment count; 16 segments use 3200 tokens instead of the old fixed 2200.
4. Truncated output is detected explicitly from final Ollama metadata/token ceiling and reported as `OLLAMA_OUTPUT_TRUNCATED`.
5. Malformed/truncated reasoning gets at most one reasoning-only repair using existing visual context.
6. Renderer no longer repeats the entire multimodal chain for the same malformed JSON failure.
7. Reasoning remains bounded by a finite 360s timeout.
8. OmniVoice model is cached across adjacent clone-TTS segments but scheduled for release after 6s idle; release drops the global model reference, runs GC, empties CUDA cache, and attempts CUDA IPC collection.
9. Exact P1 error detail + stage/time and popup `↻ Chạy lại` remain preserved.
10. Failure isolation, canonical `p1Status`, Stop/Cancel guards and active-job non-preemption remain preserved.

## Root-cause confidence
- Whole-card blinking: VERIFIED IN SOURCE.
- Old malformed JSON/output ceiling relationship: STRONGLY SUPPORTED by Owner error timing + old `num_predict=2200`; fresh runtime required.
- Slow second-job reasoning caused by persistent OmniVoice GPU residency: STRONGLY SUPPORTED by source + Owner sequencing, but not yet runtime-proven. Fresh sequential TTS→test3 retest is the acceptance evidence.

## Verification
- GitHub incremental scope reviewed directly.
- PM code review PASS `4902998957` for source `fc807c9d...`.
- No unresolved inline review threads.
- GitHub CI/status checks: none configured.
- Automated/static gate remains PARTIAL because PM environment has no full Electron/Python runtime execution evidence for this revision.

## Owner retest acceptance
- Processing card stays steady; spinner alone rotates.
- Clone-TTS sequence logs `[TTS] OmniVoice released after idle TTS burst.` before later reasoning needs GPU.
- `test3.mp4` reasoning no longer sits near the 360s timeout under the same sequence, OR it fails at the finite timeout with precise popup detail rather than hanging indefinitely.
- If structured JSON is truncated/malformed, at most one reasoning-only retry occurs; vision analysis is not repeated solely for JSON repair.
- Popup contains exact error and usable `↻ Chạy lại`.
- Retry queues behind active Job and runs when scheduler becomes free.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner PARTIAL PASS / RETEST READY; documentation sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.
