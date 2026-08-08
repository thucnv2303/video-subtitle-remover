# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035 — PM VERIFIED

Date: 2026-08-08
Status: PASS — PM DIRECT SOURCE VERIFICATION

## Authority

This document is the accepted Audit 035 evidence.

The two executor publications are NOT accepted as execution proof:
- PR #16 / commit `2a5319cb8b46bee6a90d9181bf53d870403c17b4`: INVALIDATED because the executor continued after a helper failure and used unlisted report-writing commands.
- PR #17 / commit `e761266ee273de9237df907292e595c20b485db2`: INVALIDATED because the executor appended unlisted `echo "Exit: $LASTEXITCODE"` shell commands under a positive command whitelist.

Both executor reports are candidate material only. The findings below are accepted because the Project Manager independently checked canonical GitHub source at application source identity:

`ea9521f6fe957e24e49cc5d090e275511d91141d`

Canonical branch basis:

`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement` at `55be60509a94b4e6f18397dd691b42fd95776faa`

## Verified Pipeline 1 execution paths

### Dedicated Pipeline 1 path — ACCEPTED

`src/renderer/js/app.js` has a dedicated `processPipeline1Queue()` path. The Step 1 bulk-start handler marks jobs with `pipeline = 1` and routes them to this queue.

The dedicated path performs:
1. ASR through `api.extractTextP1(...)` -> `/api/p1/extract-text`;
2. optional AI rewrite through `window.triggerAutoAiRewrite(...)`;
3. optional TTS through `window.triggerAutoTts(...)`.

`src/renderer/js/pipelines/pipeline1-ai.js` performs AI rewrite/TTS only. It does not call the Pipeline 2 inpaint entry point and does not call Pipeline 3 final rendering.

Result: no reachable P1->P2 subtitle-removal or P1->P3 final-render violation was verified in the dedicated Pipeline 1 path.

### Legacy post-inpaint coupling — ACCEPTED DESIGN DEBT

`processNextJob()` is the Pipeline 2 inpaint path and calls `startProcessBatch(...)`. When an inpaint job finishes, `onJobFinished(job)` may inspect `job.aiRewrite` / `job.ttsGenerate` and invoke Pipeline 1 AI/TTS helpers.

This is a reachable legacy coupling: P1 AI/TTS can run after P2 completion for non-dedicated jobs carrying those flags. It does not mean Pipeline 1 itself performs subtitle removal, but the routing violates the intended independence model and must be cleaned up in a separate task.

## Verified current outputs and persistence

- `job.srtContent`: in-memory job state.
- `job.aiContent`: in-memory job state.
- `job.ttsTimedSrt`: in-memory job state.
- `job.ttsAudioDurMs`: in-memory job state.
- `job.ttsSegmentsTiming`: in-memory job state.
- `job.karaokeAss`: in-memory job state.
- TTS audio: backend creates a disk file and returns `audio_path`; `/api/tts-retry` currently places output under a backend/temp-derived path rather than `jobs/<job_id>/p1/`.
- `store.js` persists `state.settings` only. It does not persist the `state.jobs` array or the Pipeline 1 per-job fields above.

Therefore Pipeline 1 job results other than the standalone TTS audio file are not durable across an application restart.

## Target artifact contract comparison

The target architecture requires:
- `jobs/<job_id>/p1/`;
- `scenes.json`;
- `multimodal_timeline.json`;
- `remix_script.json`;
- `edit_plan.json`;
- TTS/voice output;
- SRT based on TTS timing;
- metadata including `job_id`, `source_fingerprint`, source duration, `FPS/timebase`, and artifact version.

Verified status:

| Contract item | Status | PM finding |
|---|---|---|
| `jobs/<job_id>/p1/` | MISSING | No current P1 artifact-directory contract implementation verified. |
| `scenes.json` | MISSING | No current implementation verified. |
| `multimodal_timeline.json` | MISSING | No current implementation verified. |
| `remix_script.json` | MISSING | No current implementation verified. |
| `edit_plan.json` | MISSING | No current implementation verified. |
| TTS audio | PARTIAL | Disk output exists but is not yet a namespaced contract artifact with required metadata. |
| TTS-timed SRT | PARTIAL | Produced as response/job state but not persisted as a contract artifact. |
| `job_id` | PARTIAL | Used/echoed by the dedicated P1 extraction route but not embedded into persisted P1 artifacts. |
| `source_fingerprint` | MISSING | No source identity mechanism usable for P1/P2/P3 matching was verified. |
| source duration | PARTIAL | Available from video-info but not persisted in P1 artifact metadata. |
| `FPS/timebase` | PARTIAL | FPS is available; timebase contract/persistence is absent. |
| artifact version | MISSING | No persisted artifact-version contract exists. |

## Gap order accepted by PM

1. **A035-G01 — P1 artifact persistence + source identity foundation.**
   Establish durable per-job P1 artifact storage and metadata before higher-level artifacts depend on it.
2. **A035-G08 — legacy routing cleanup.**
   Remove/gate the post-inpaint AI/TTS coupling so the dedicated P1 entry point is authoritative.
3. **A035-G02 — scene/keyframe artifact.**
   Add `scenes.json` only after the artifact directory/identity foundation exists.
4. **A035-G03 — multimodal timeline.**
   Depends on persisted source identity and scene/transcript artifacts.
5. **A035-G04 — remix script/edit plan.**
   Depends on the multimodal timeline.

Other metadata gaps (`source_fingerprint`, artifact version, duration, FPS/timebase) are foundational parts of the first persistence task rather than separate independent features.

## Next implementation task selected

Candidate task selected by PM:

`RECOVERY-007E-PIPELINE1-ARTIFACT-PERSISTENCE-SOURCE-IDENTITY-036-A`

Scope intent:
- implement the minimum durable `jobs/<job_id>/p1/` foundation;
- persist currently available P1 artifacts/metadata needed by later tasks;
- establish a deterministic source identity contract;
- preserve P1/P2/P3 separation;
- do not implement scene detection, multimodal timeline, remix planning, or Pipeline 3 in the same task.

This audit does **not** decide the source-fingerprint algorithm. Any candidate suggestion such as SHA-256 is non-binding until the PM-authored implementation spec explicitly defines the algorithm and acceptance evidence.

## Audit gates

- Application source changed by audit: NO.
- Tests/dependencies changed by audit: NO.
- Owner app verification: NOT REQUIRED.
- PM direct source review: PASS.
- Audit technical conclusion: PASS.
- Executor-control incident: CONTAINED; executor reports were not merged.
- Documentation synchronization: pending PM closeout publication to canonical branch.
- Implementation Task 036-A: NOT AUTHORIZED until a separate remote ACTIVE spec is published.
- Product merge permission: BLOCKED.