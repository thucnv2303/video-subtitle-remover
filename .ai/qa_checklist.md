# QA Checklist

## Active task
`PIPELINE1-ADAPTIVE-VISION-004`

## Source/scope
- [x] Dedicated branch `review/PIPELINE1-ADAPTIVE-VISION-004` from exact parent `4508eaed5be1130519e57f927f761976dd5a5458`.
- [x] Draft PR #45 targets `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- [x] Application-source changes limited to `src/renderer/js/pipeline1-analysis.js` and `src/main/p1-vision-ipc.js`.
- [x] No P2/P3/STTN/Settings/TTS source changes.
- [x] Fixed global `FRAME_SAMPLE_COUNT = 8` removed as sampling authority.

## Deterministic adaptive checks
- [x] 24s -> 8 frames / 1 chunk.
- [x] 60s -> 15 frames / 2 chunks.
- [x] 300s -> 75 frames / 10 chunks.
- [x] 400s -> safety cap 80 frames / 10 chunks.
- [x] Every simulated chunk <=8 frames.
- [x] First chunk starts at 0 and final chunk ends at source duration.
- [x] Boundary-spanning SRT segment is included in both adjacent overlapping windows.
- [x] Non-overlapping SRT segments are excluded from unrelated chunks.
- [x] Vision chunks are evidence-only; final remix schema is produced by one global reasoning stage after chunk analysis.
- [x] PM source/diff review PASS `4904434998`.

## Static checks still required
- [ ] Exact published `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] Exact published `node --check src/main/p1-vision-ipc.js`.
- [ ] Exact `git diff --check 4508eaed5be1130519e57f927f761976dd5a5458..HEAD`.
- [ ] GitHub CI/status checks — none configured.

## Fresh Owner runtime — BLOCKING
- [ ] Short `test3.mp4`: adaptive plan shows approximately 8 keyframes / 1 chunk.
- [ ] Short video completes all Vision chunks then exactly one global reasoning stage.
- [ ] >60s input automatically uses more than 8 keyframes.
- [ ] >60s input uses multiple chunks with <=8 frames each.
- [ ] Logs expose duration/frame/chunk plan without image payloads.
- [ ] Chunk transcript/log ranges are chronological and plausible for the source timeline.
- [ ] Any chunk failure causes P1 failure and does not unlock P2.
- [ ] Successful run persists artifact version 2 / `multimodal-adaptive-chunks-v2` provenance.
- [ ] P1->P2 unlock occurs only after all chunks + global reasoning + required TTS/artifacts succeed.
- [ ] Inherited failed-Job popup/retry/queue behavior remains functional.
- [ ] Inherited processing spinner remains acceptable in runtime.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner NOT STARTED; documentation sync PASS after docs publication; merge BLOCKED; Step 3 BLOCKED.
