# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035

Audit date: 2026-08-08
Auditor: Anti (Antigravity)
Basis commit (reviewed application source): ea9521f6fe957e24e49cc5d090e275511d91141d
Execution worktree HEAD (EXECUTION_BASE_HEAD): 64a394b5189fdf9623d61435a41927acf3b8bc75
Scope: READ-ONLY. No source files were modified.

---

## Basis

This audit is performed against the exact canonical source blobs confirmed by the blob gate in Section 6 of the main spec. All blob hashes were verified before any audit work began.

Canonical activation basis: 55be60509a94b4e6f18397dd691b42fd95776faa
Reviewed application source SHA: ea9521f6fe957e24e49cc5d090e275511d91141d

Reviewed source files (all blob-verified):
- src/renderer/js/pipelines/pipeline1-ai.js (83424e1ba86fe94d6357b6cf89c1dac3bbf99436)
- src/renderer/js/app.js (2afdb3ad480fef78cf5419f9db5032da570c86bf)
- src/renderer/js/api.js (a578c9ee3fc63aea083ea27af335dd21c3903fc1)
- src/renderer/js/store.js (e02427237800b70cfaba5c150444d5d897f03211)
- src/main/main.js (cafc5b4d0f94b3d4c6ebbce18535fb7c0d7e21e3)
- src/main/preload.js (c64cb89bf4b06c29c503747da642d6fe9faf4ca5)
- src/main/python-bridge.js (0c37ab9fc3a61303f4b910055149186f7f76141d)
- api/server.py (b3b1e712bd29ce7825788da9c3f7c345863141f5)
- api/tts_engine.py (bb5d5e20d127bd4e1c2c5ecc64987db2dc53f521)

Target artifact contract source: .ai/architecture.md (6beb2b8a1c1d2e9cb9a31bf3a0d896c073115775)

All grep exit codes are recorded: exit 0 = matches found; exit 1 = zero matches (expected negative evidence); exit >1 = failure (none occurred).

---

## Current Pipeline 1 execution map

Pipeline 1 has two distinct execution paths in the current code. Only Path B is the dedicated Pipeline 1 path. Path A is a legacy/shared path.

### Path A -- Legacy "post-inpaint P1" (triggered after Pipeline 2 inpaint completes)

This path is reachable from onJobFinished() in app.js when a job has aiRewrite or ttsGenerate flags set but pipeline is not explicitly 1.

Step-by-step:

1. app.js:691 processNextJob() -- starts a regular P2 inpaint job via api.startProcessBatch() (POST /api/process), passing ai_rewrite: false, tts_voice: 'none'.
2. app.js:838 onJobFinished(job) -- called after inpaint finishes. Checks job.aiRewrite and job.ttsGenerate flags.
3. app.js:867 window.triggerAutoAiRewrite(job, srtText) -- called if needAi. Routes to pipeline1-ai.js:triggerAutoAiRewrite.
4. pipeline1-ai.js:6 triggerAutoAiRewrite(job, srtText): IPC to Electron main process for provider API call. Stores result in job.aiContent (in-memory only). Chains to triggerAutoTts if job.ttsGenerate.
5. pipeline1-ai.js:76 triggerAutoTts(job, srtText): POST /api/tts-retry. Stores job.ttsAudioPath, job.ttsTimedSrt, job.ttsAudioDurMs, job.ttsSegmentsTiming, job.karaokeAss (all in-memory). Audio file written to disk by backend.

### Path B -- Dedicated Pipeline 1 Queue Runner (current correct path)

Triggered from UI Step 1 button with pipeline=1 jobs.

Step-by-step:

1. app.js:903 processPipeline1Queue(): finds first job with status === 'queued' and pipeline === 1. Sets state.pipeline1JobId = nextJob.id.
2. Step 1/3 -- ASR extraction:
   - app.js:925: api.extractTextP1(nextJob.id, nextJob.filePath, nextJob.asrLanguage)
   - api.js:216 extractTextP1(): POST /api/p1/extract-text with {job_id, video_path, extraction_mode:'asr', language}
   - server.py:988 @app.post("/api/p1/extract-text"): Dedicated P1 route. Supports only asr mode. Delegates to api_extract_srt(). Echoes job_id in response.
   - server.py api_extract_srt(): ffmpeg audio extraction to temp WAV, faster_whisper WhisperModel('large-v3-turbo') ASR, returns srt_content string. Temp WAV deleted.
   - Frontend stores: nextJob.srtContent = asrRes.srt_content (in-memory). No disk write.
3. Step 2/3 -- AI Rewrite (optional): if nextJob.aiRewrite, calls window.triggerAutoAiRewrite(nextJob, nextJob.srtContent). Result in nextJob.aiContent in-memory only.
4. Step 3/3 -- TTS (optional): if nextJob.ttsGenerate and not aiRewrite, calls window.triggerAutoTts(nextJob, nextJob.srtContent). TTS audio written to disk by backend. Path stored in nextJob.ttsAudioPath in-memory.
5. _finishP1Job(nextJob, 'finished'): sets job.status, clears state.pipeline1JobId, calls processPipeline1Queue() for next job.

No disk artifact JSON is written at any step of Path B.

---

## Current outputs and persistence

| Output | Storage type | Location/logic | Evidence |
|---|---|---|---|
| Extracted SRT text | In-memory only | job.srtContent in frontend JS job object | E-01 |
| AI rewritten text | In-memory only | job.aiContent in frontend JS job object | E-02 |
| TTS audio file | Disk (backend path) | Backend tts_engine.py writes file; path returned as result.audio_path; stored in job.ttsAudioPath | E-03 |
| Timed SRT (TTS-aligned) | In-memory only | job.ttsTimedSrt in frontend JS job object | E-04 |
| Karaoke ASS | In-memory only | job.karaokeAss in frontend JS job object | E-05 |
| TTS audio duration ms | In-memory only | job.ttsAudioDurMs | E-06 |
| TTS segments timing | In-memory only | job.ttsSegmentsTiming | E-07 |
| scenes.json | NOT PRESENT | No code found (grep exit 1) | E-08 |
| multimodal_timeline.json | NOT PRESENT | No code found (grep exit 1) | E-09 |
| remix_script.json | NOT PRESENT | No code found (grep exit 1) | E-10 |
| edit_plan.json | NOT PRESENT | No code found (grep exit 1) | E-11 |
| jobs/<job_id>/p1/ directory | NOT PRESENT | No directory creation logic found | E-12 |
| Source fingerprint | NOT PRESENT | No code found (grep exit 1) | E-13 |
| Artifact version field | NOT PRESENT | No code found (grep exit 1) | E-14 |

Key finding: The TTS audio file is the only P1 output written to disk. All other P1 data (SRT, AI rewrite, timed SRT, karaoke ASS) exists only in the in-memory frontend job object and is lost on page reload or Electron restart.

---

## Target artifact contract comparison

| Proposed artifact | Classification | Evidence |
|---|---|---|
| jobs/<job_id>/p1/ directory | MISSING | No directory creation in any P1 code path. No mkdir or path construction for this pattern. (E-12) |
| scenes.json | MISSING | Grep exit 1 across all authorized source files. (E-08) |
| multimodal_timeline.json | MISSING | Grep exit 1 across all authorized source files. (E-09) |
| remix_script.json | MISSING | Grep exit 1 across all authorized source files. (E-10) |
| edit_plan.json | MISSING | Grep exit 1 across all authorized source files. (E-11) |
| TTS audio | PARTIAL | Audio file written to disk by backend. Path returned to frontend. But: no structured artifact file, no job_id embedded, no source_fingerprint, no artifact version. Not placed in jobs/<job_id>/p1/. (E-03) |
| SRT based on TTS timing | PARTIAL | job.ttsTimedSrt populated in-memory. result.srt_content returned by /api/tts-retry. But: not persisted to disk, no structured artifact file. (E-04) |
| job_id | PARTIAL | UUID generated by server (server.py:526). P1 endpoint echoes job_id back (server.py:995). But: not embedded in any persisted artifact file. No cross-pipeline artifact ID linkage. (E-15) |
| source_fingerprint | MISSING | Grep exit 1 across all authorized source files. No hashing of video identity anywhere in P1 path. (E-13) |
| Source duration | PARTIAL | /api/video-info returns duration (server.py:668). But: not attached to any persisted P1 artifact. Not stored in job object in a way that survives session. (E-16) |
| FPS/timebase | PARTIAL | /api/video-info returns fps. Displayed in UI (app.js:1146). But: not embedded in any P1 artifact file. timebase: grep exit 1 -- absent. (E-17) |
| Artifact version | MISSING | Grep exit 1 across all authorized source files. (E-14) |

---

## Pipeline boundary findings

### P1 to P2 boundary

Finding: NO REACHABLE VIOLATION.

pipeline1-ai.js (the P1 module) contains no call to inpainting, subtitle removal, or Pipeline 2 functions. Comment at line 3 explicitly states: "This module never removes subtitles or renders final video." (E-18)

In Path B (processPipeline1Queue):
- Does NOT call api.startProcessBatch() (the P2 entry point).
- Does NOT set inpaint_mode, subtitle_areas, or P2 output_path.
- Does NOT call SubtitleRemover or any backend inpaint route.

The inpaint keyword appears in app.js but only in processNextJob() (Path A / P2 jobs), not in processPipeline1Queue() (Path B / P1 jobs). These are separate functions. (E-19)

### P1 to P3 boundary

Finding: NO REACHABLE VIOLATION.

pipeline1-ai.js does not call finalizeVideo or any Pipeline 3 function. (E-20)

finalizeVideo is imported and exposed on window in index.html:814-815 but is only reachable via a separate button click (btn-export-final), not from within the P1 execution path. (E-21)

Grep for clean_video in all authorized source files: exit 1. (E-22)

Known architectural risk (code-level only): Path A (legacy) is triggered inside onJobFinished() which runs after P2 inpaint. This creates a P1-depends-on-P2 coupling for legacy job types. This is a design coupling concern, not a case of P1 performing P2 operations. Matches BUG-005 evidence.

---

## Gap matrix

### A035-G01

Gap ID: A035-G01
Required target behavior: P1 artifacts persisted to jobs/<job_id>/p1/ directory on disk, namespaced by job.
Current evidence: No directory creation logic. All P1 outputs (SRT, AI text, timed SRT, karaoke ASS) are in-memory only. Session loss = data loss. (E-12)
Affected files/symbols: api/server.py (/api/p1/extract-text, /api/tts-retry), src/renderer/js/pipelines/pipeline1-ai.js (triggerAutoTts), src/renderer/js/app.js (processPipeline1Queue)
Risk if deferred: P1 artifacts are ephemeral. P3 cannot consume them safely. Re-running P1 overwrites the only in-memory copy. No audit trail.
Dependency order: Must be implemented before P3 can consume P1 outputs. Blocks P3 integration.
Proposed future task boundary: Implement P1 artifact persistence: create jobs/<job_id>/p1/ on disk, write srt_raw.srt, srt_tts.srt, and p1_manifest.json with job_id, source path, artifact version, timestamp. Narrow scope: backend only. No P2/P3 changes.

### A035-G02

Gap ID: A035-G02
Required target behavior: scenes.json -- scene detection/keyframe analysis stored per job.
Current evidence: No scene detection code in any P1 source file. Grep exit 1 for scenes.json, multimodal_timeline, remix_script, edit_plan. (E-08, E-09, E-10, E-11)
Affected files/symbols: None currently -- feature entirely absent.
Risk if deferred: P3 edit_plan.json cannot reference scene timecodes without this. Cannot reorder scenes.
Dependency order: Depends on A035-G01. Comes before multimodal_timeline.json.
Proposed future task boundary: Implement scene/keyframe detection for P1. Backend endpoint /api/p1/detect-scenes, output jobs/<job_id>/p1/scenes.json. Separate task from ASR/TTS improvements.

### A035-G03

Gap ID: A035-G03
Required target behavior: multimodal_timeline.json -- merged transcript + scene structure + source identity per job.
Current evidence: Absent. Grep exit 1. (E-09)
Affected files/symbols: None currently.
Risk if deferred: P3 cannot remap timecodes without this. Edit plan becomes unsafe.
Dependency order: Depends on A035-G01 and A035-G02. Second-priority artifact.
Proposed future task boundary: Multimodal timeline builder. Inputs: ASR SRT + scenes.json. Output: jobs/<job_id>/p1/multimodal_timeline.json. Separate narrow task.

### A035-G04

Gap ID: A035-G04
Required target behavior: remix_script.json and edit_plan.json -- structured script and edit plan per job.
Current evidence: Absent. Grep exit 1 for both. (E-10, E-11)
Affected files/symbols: None currently.
Risk if deferred: P3 cannot perform structured remixing.
Dependency order: Depends on A035-G03. Third-priority artifact.
Proposed future task boundary: Script remix planner. Input: multimodal_timeline.json. Output: remix_script.json + edit_plan.json. Narrow scope.

### A035-G05

Gap ID: A035-G05
Required target behavior: source_fingerprint embedded in all P1/P2/P3 artifacts for cross-pipeline identity matching.
Current evidence: Grep exit 1 for source_fingerprint across all authorized source files. /api/video-info returns file stats but does not hash or fingerprint. (E-13, E-16)
Affected files/symbols: None currently -- concept entirely absent.
Risk if deferred: P3 cannot safely verify that P1 outputs and P2 clean_video.mp4 came from the same source.
Dependency order: Must be part of A035-G01 implementation (fingerprint goes into manifest).
Proposed future task boundary: Add source fingerprint to P1 manifest as part of A035-G01 task. Fingerprint = deterministic hash of source video. Do not design full cryptographic scheme in this task.

### A035-G06

Gap ID: A035-G06
Required target behavior: artifact version field in all P1 artifacts.
Current evidence: Grep exit 1 for artifact version. Absent. (E-14)
Affected files/symbols: None currently.
Risk if deferred: Cannot distinguish artifact schema versions. P3 cannot validate input contract.
Dependency order: Part of A035-G01 (included in manifest JSON).
Proposed future task boundary: Include in P1 artifact persistence task (A035-G01). Add artifact version: "1" field to manifest.

### A035-G07

Gap ID: A035-G07
Required target behavior: Source duration and FPS/timebase persisted as part of P1 artifact identity.
Current evidence: /api/video-info returns fps, duration, total_frames. Displayed in UI (app.js:1146). But: not stored in any P1 artifact. timebase: grep exit 1 -- absent. (E-16, E-17)
Affected files/symbols: api/server.py (/api/video-info), src/renderer/js/app.js (metaFps)
Risk if deferred: Cannot perform timeline tolerance verification between P1 and P2. P3 cannot safely align P1 TTS timing with P2 clean video.
Dependency order: Part of A035-G01 (include in manifest JSON).
Proposed future task boundary: Include in P1 artifact persistence task (A035-G01). Call /api/video-info during P1 init and embed fps/duration/total_frames in p1_manifest.json.

### A035-G08

Gap ID: A035-G08
Required target behavior: Path A (legacy post-inpaint P1) should be decoupled. P1 must be independent of P2 in production use.
Current evidence: Path A exists in app.js:838 onJobFinished() -- P1 AI/TTS is triggered after P2 inpaint completes. Creates hidden P1-depends-on-P2 coupling for legacy job types. Path B (processPipeline1Queue) is independent and correct. (E-19, app.js:906 comment)
Affected files/symbols: src/renderer/js/app.js (onJobFinished, processNextJob)
Risk if deferred: Confusion between P1 and P2 roles. BUG-005 root cause.
Dependency order: Path B should be the only P1 entry point.
Proposed future task boundary: Audit which UI actions still route through Path A vs Path B. Remove or gate Path A. Narrow scope: no new features, just routing fix.

---

## Proposed follow-up task breakdown

### T-036-A: P1 Artifact Persistence and Source Identity

Responsibility: Implement disk persistence for P1 outputs with source identity.
Likely source files/symbols: api/server.py (/api/p1/extract-text, /api/tts-retry), new p1_artifact.py helper.
What to implement: Create jobs/<job_id>/p1/ on disk; write srt_raw.srt, p1_manifest.json (containing job_id, source_fingerprint, source_duration, fps, artifact version:"1"). TTS audio already written by backend -- confirm it lands in correct subdirectory.
Acceptance evidence: After running P1, jobs/<job_id>/p1/p1_manifest.json exists on disk with all required fields. Source fingerprint matches source video. Artifact survives Electron restart.
P1/P2/P3 separation: P2 and P3 not touched.
Does not authorize itself.

### T-036-B: P1 Path A / Path B Routing Cleanup

Responsibility: Remove or clearly gate the legacy post-inpaint P1 coupling in onJobFinished.
Likely source files/symbols: src/renderer/js/app.js (onJobFinished), src/renderer/js/components/job-manager.js.
What to implement: Ensure P1 AI/TTS is only triggered via processPipeline1Queue() (Path B). Document or remove Path A trigger in onJobFinished.
Acceptance evidence: Running P2 inpaint alone does not trigger P1 AI/TTS. P1 queue runner is the sole entry point for P1. BUG-005 no longer reproducible.
P1/P2/P3 separation: P2 and P3 not touched.
Does not authorize itself.

### T-036-C: P1 Scene Detection Endpoint

Responsibility: Implement /api/p1/detect-scenes and output scenes.json per job.
Likely source files/symbols: api/server.py (new route), src/renderer/js/api.js (new client method).
What to implement: Backend endpoint accepts video path + job_id, samples keyframes, groups into scenes, writes jobs/<job_id>/p1/scenes.json.
Acceptance evidence: After endpoint call, scenes.json exists with scene list including start_ms, end_ms, keyframe_path. Does not modify clean_video or any P2 output.
Dependency: Requires T-036-A (artifact directory).
Does not authorize itself.

### T-036-D: Multimodal Timeline Builder

Responsibility: Merge ASR SRT + scenes.json into multimodal_timeline.json.
Likely source files/symbols: api/server.py (new /api/p1/build-timeline route).
What to implement: Align ASR segments with detected scenes. Output jobs/<job_id>/p1/multimodal_timeline.json.
Acceptance evidence: File exists with merged timeline. No P2/P3 changes.
Dependency: Requires T-036-A and T-036-C.
Does not authorize itself.

Note: remix_script.json and edit_plan.json (gaps A035-G03, A035-G04) are deferred to later tasks after T-036-D is complete. P2 timeline tolerance verification is a separate task and must not be combined with P1 artifact implementation.

---

## Evidence

E-01 | src/renderer/js/app.js:926 | processPipeline1Queue | nextJob.srtContent = asrRes.srt_content (in-memory assignment)
E-02 | src/renderer/js/pipelines/pipeline1-ai.js:47 | triggerAutoAiRewrite | job.aiContent = aiText (in-memory, no disk write)
E-03 | src/renderer/js/pipelines/pipeline1-ai.js:110 | triggerAutoTts | job.ttsAudioPath = result.audio_path (backend path, disk file written by backend)
E-04 | src/renderer/js/pipelines/pipeline1-ai.js:111 | triggerAutoTts | job.ttsTimedSrt = result.srt_content (in-memory, no disk write)
E-05 | src/renderer/js/pipelines/pipeline1-ai.js:114 | triggerAutoTts | job.karaokeAss = result.karaoke_ass (in-memory, no disk write)
E-06 | src/renderer/js/pipelines/pipeline1-ai.js:112 | triggerAutoTts | job.ttsAudioDurMs = result.audio_duration_ms (in-memory)
E-07 | src/renderer/js/pipelines/pipeline1-ai.js:113 | triggerAutoTts | job.ttsSegmentsTiming = result.segments_timing (in-memory)
E-08 | git grep scenes.json (authorized files) | exit 1 | No match -- scenes.json absent from entire P1 codebase
E-09 | git grep multimodal_timeline (authorized files) | exit 1 | No match -- absent
E-10 | git grep remix_script (authorized files) | exit 1 | No match -- absent
E-11 | git grep edit_plan (authorized files) | exit 1 | No match -- absent
E-12 | jobs/<job_id>/p1/ pattern search | no match | No directory creation logic found in any P1 source
E-13 | git grep source_fingerprint (authorized files) | exit 1 | No match -- absent
E-14 | git grep artifact version (authorized files) | exit 1 | No match -- absent
E-15 | api/server.py:526-528 | api_start_process | job_id = str(uuid.uuid4()); echoed back by /api/p1/extract-text at server.py:995
E-16 | api/server.py:660-669 | video_info | fps, duration, total_frames returned but not persisted to any P1 artifact
E-17 | git grep timebase (authorized files) | exit 1 | timebase field: absent
E-18 | src/renderer/js/pipelines/pipeline1-ai.js:3 | module header | "This module never removes subtitles or renders final video."
E-19 | src/renderer/js/app.js:648 | processNextJob header comment | "btn-start-all => chay Pipeline 1 (AI Analysis + TTS), KHONG inpaint"
E-20 | git grep finalizeVideo in pipeline1-ai.js | exit 1 | finalizeVideo not called from P1 module
E-21 | src/renderer/index.html:814-815 | module bridge | finalizeVideo imported for window exposure but not called from P1 path
E-22 | git grep clean_video (authorized files) | exit 1 | clean_video not referenced in P1 codebase
E-23 | src/renderer/js/api.js:216-240 | extractTextP1 | POST /api/p1/extract-text with {job_id, video_path, extraction_mode:'asr', language}
E-24 | api/server.py:988-1020 | api_p1_extract_text | Dedicated P1 route -- only supports asr mode, delegates to api_extract_srt, echoes job_id
E-25 | api/server.py:1022-1093 | api_extract_srt | ffmpeg audio extraction + faster_whisper ASR; returns srt_content string; no disk artifact written
E-26 | src/renderer/js/app.js:906 | processPipeline1Queue comment | "KHONG goi inpaint backend. Chi: OCR/ASR tu video goc => AI rewrite => TTS."
E-27 | src/renderer/js/app.js:800-811 | handleWSMessage | pipeline1JobId prioritized over processingJobId for WS routing -- two separate tracking variables

---

## Conclusion

1. Pipeline 1 has a functional dedicated execution path (Path B, processPipeline1Queue) that correctly performs ASR to AI Rewrite to TTS without calling P2 inpaint or P3 finalize. Pipeline boundary is clean in Path B.

2. A legacy coupling (Path A) exists in onJobFinished() where P1 AI/TTS is triggered after P2 inpaint completes. This is an architectural design debt identified as the root cause of BUG-005.

3. Zero target artifact contract items are fully implemented. TTS audio, SRT, job_id, source duration, and FPS/timebase are PARTIAL. All JSON artifacts (scenes.json, multimodal_timeline.json, remix_script.json, edit_plan.json, jobs/<job_id>/p1/) are MISSING.

4. The most critical gap is A035-G01 (P1 artifact persistence). All P1 data except the TTS audio file is ephemeral in-memory state. A session reset loses all P1 results.

5. Source fingerprinting is entirely absent (A035-G05). Cross-pipeline identity matching between P1 and P2 outputs is not currently possible.

6. The jobs/<job_id>/p1/ directory structure does not exist. No path construction logic for this pattern was found in any source file.

7. timebase is absent from the codebase. FPS is present via /api/video-info but not persisted to P1 artifacts.

8. Pipeline 1 does NOT perform subtitle removal or final video render. No reachable P1-to-P2 or P1-to-P3 boundary violation was found.

9. Proposed minimum implementation sequence: T-036-A (persistence + source identity) then T-036-B (routing cleanup) then T-036-C (scene detection) then T-036-D (multimodal timeline). Gap count: 8. Proposed future tasks: 4 plus deferred items.

10. This audit is READ-ONLY. No source, test, dependency, or config file was modified. No gap was fixed. Owner app verification is not required for this audit task.

STATUS: WAITING_PM_REVIEW