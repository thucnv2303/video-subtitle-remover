# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035-REV1

Audit date: 2026-08-08
Auditor: Anti (Antigravity)
Execution type: READ-ONLY AUDIT RECOVERY — REPORT ONLY
Basis commit (reviewed application source): ea9521f6fe957e24e49cc5d090e275511d91141d
EXECUTION_BASE_HEAD: b0934e544db51cae00bffa0c44efbc4903f69c06
Scope: No source, test, dependency, config, or dynamic canonical state file was modified.
Report created with: editor/write-file capability (Section 9 compliant).

Supersedes: RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035 (invalidated at 2a5319cb8b46bee6a90d9181bf53d870403c17b4)
Incident: INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001

---

## Basis

This audit is performed independently against the exact canonical source blobs verified below.
The invalidated candidate report (commit 2a5319c) is used as a checklist reference only.
No candidate claim is accepted without direct source re-verification.

Canonical activation basis: 55be60509a94b4e6f18397dd691b42fd95776faa
Reviewed application source SHA: ea9521f6fe957e24e49cc5d090e275511d91141d

Blob gate results (all exact match):

Canonical docs:
- .ai/project.md = c58c90374100ec62fd24d4f2dd9e84e58744e139 PASS
- .ai/architecture.md = 6beb2b8a1c1d2e9cb9a31bf3a0d896c073115775 PASS
- .ai/migration_status.md = 68ef23e0cf7bcffb995afa168965438146186a8f PASS
- .ai/current_state.md = 29cdb4357a5f339a4826bb6a7be1c267bf7f148e PASS
- .ai/task_current.md = 07a8e6c3dcd88cc38f213c05638834d829361266 PASS
- .ai/handoff.md = 793026f262859719e96080e18cb4d7fb32835016 PASS
- .ai/bugs.md = 30ec90df1e31e251bf40cdc4ea7b1ee7d483470b PASS
- .ai/api_contracts.md = ce47db38dbf6fec7b1a9c2450c2f4467341e522c PASS

Product source:
- src/renderer/js/app.js = 2afdb3ad480fef78cf5419f9db5032da570c86bf PASS
- src/renderer/js/api.js = a578c9ee3fc63aea083ea27af335dd21c3903fc1 PASS
- src/renderer/js/store.js = e02427237800b70cfaba5c150444d5d897f03211 PASS
- src/renderer/js/pipelines/pipeline1-ai.js = 83424e1ba86fe94d6357b6cf89c1dac3bbf99436 PASS
- src/main/main.js = cafc5b4d0f94b3d4c6ebbce18535fb7c0d7e21e3 PASS
- src/main/preload.js = c64cb89bf4b06c29c503747da642d6fe9faf4ca5 PASS
- src/main/python-bridge.js = 0c37ab9fc3a61303f4b910055149186f7f76141d PASS
- api/server.py = b3b1e712bd29ce7825788da9c3f7c345863141f5 PASS
- api/tts_engine.py = bb5d5e20d127bd4e1c2c5ecc64987db2dc53f521 PASS

Target artifact contract source: .ai/architecture.md (6beb2b8a1c1d2e9cb9a31bf3a0d896c073115775)

Source-basis preflight:
- git merge-base --is-ancestor ea9521f... b0934e5...: exit 0 (reviewed source is ancestor of EXECUTION_BASE_HEAD)
- git diff --name-only ea9521f... b0934e5...: all returned paths are under .ai/ only; no application source path appears

All grep exit codes are recorded: exit 0 = matches found; exit 1 = expected no-match evidence (not a failure); exit >1 = STOP (none occurred).

---

## Candidate report reconciliation

The following 10 conclusions are from the invalidated candidate report at commit 2a5319c. Each is independently re-verified against canonical source in this REV1 audit.

**Conclusion 1 (candidate):** Pipeline 1 has a functional dedicated execution path (Path B, processPipeline1Queue) that correctly performs ASR to AI Rewrite to TTS without calling P2 inpaint or P3 finalize. Pipeline boundary is clean in Path B.

Classification: ACCEPTED

Independent evidence: app.js:909 defines processPipeline1Queue(). The function comment at app.js:654 explicitly states the btn-start-all handler routes to processPipeline1Queue() and does NOT call inpaint. pipeline1-ai.js: grep for inpaint returns exit 1 (E-R01). pipeline1-ai.js:3 states "This module never removes subtitles or renders final video." (E-R02). Grep for startProcessBatch in pipeline1-ai.js: not present; startProcessBatch only appears in api.js:69 and app.js:740/754 (E-R03), which are in processNextJob() context, separate from processPipeline1Queue().

**Conclusion 2 (candidate):** A legacy coupling (Path A) exists in onJobFinished() where P1 AI/TTS is triggered after P2 inpaint completes.

Classification: ACCEPTED

Independent evidence: app.js:822 defines onJobFinished(job). Lines 855-883: if srtText is present and (job.aiRewrite and not job._aiTriggered) or (job.ttsGenerate and not job._ttsTriggered and not needAi), the function calls window.triggerAutoAiRewrite or window.triggerAutoTts (E-R04). onJobFinished is called at app.js:791 by pollProgress when backendJob.status is 'finished', and at app.js:812 by handleWSMessage when the WS message carries is_finished and state.pipeline1JobId is falsy (E-R05). pollProgress and handleWSMessage serve inpaint jobs managed by processNextJob/startProcessBatch (the P2 path), confirming this coupling.

The candidate correctly described this as BUG-005 root cause. The guard at app.js:812 ("if (!state.pipeline1JobId && (d.is_finished || pct >= 100)) onJobFinished(job)") confirms that when a dedicated P1 job is running (pipeline1JobId is set), onJobFinished is NOT called by handleWSMessage. However, the guard is absent in pollProgress (app.js:791), meaning a P2 inpaint job completing via polling can still reach onJobFinished and trigger legacy Path A if aiRewrite/ttsGenerate flags are set on that job.

**Conclusion 3 (candidate):** Zero target artifact contract items are fully implemented. TTS audio, SRT, job_id, source duration, FPS/timebase are PARTIAL. All JSON artifacts (scenes.json, multimodal_timeline.json, remix_script.json, edit_plan.json, jobs/<job_id>/p1/) are MISSING.

Classification: ACCEPTED

Independent evidence (re-verified by authorised grep):
- scenes.json: grep exit 1 across all authorized source files (E-R06)
- multimodal_timeline.json: grep exit 1 (E-R07)
- remix_script.json: grep exit 1 (E-R08)
- edit_plan.json: grep exit 1 (E-R09)
- TTS audio: written to disk by backend (pipeline1-ai.js:110 job.ttsAudioPath = result.audio_path) but not in jobs/<job_id>/p1/ directory and without structured metadata file (E-R10)
- SRT: stored in-memory as nextJob.srtContent (app.js:945) — no disk write (E-R11)
- job_id: echoed back in p1/extract-text response (server.py:995) but not embedded in any persisted artifact (E-R12)
- source duration: returned by /api/video-info (server.py:673) but not persisted to P1 artifact (E-R13)
- FPS/timebase: fps returned by /api/video-info (server.py:669); timebase grep exit 1 (E-R14)
- artifact version (artifact_version): grep exit 1 (E-R15)
- jobs/<job_id>/p1/ directory: no directory creation logic found for this pattern in any authorized source file (E-R16)

**Conclusion 4 (candidate):** The most critical gap is A035-G01 (P1 artifact persistence). All P1 data except the TTS audio file is ephemeral in-memory state. A session reset loses all P1 results.

Classification: ACCEPTED with clarification

Independent evidence: store.js saveState() persists ONLY state.settings (settings JSON to localStorage — E-R17). It does NOT persist jobs array, srtContent, aiContent, ttsAudioPath, ttsTimedSrt, karaokeAss, or any per-job P1 fields. loadState() applies only settings from localStorage back to state.settings. Therefore all job/P1 data is session-memory-only. After an Electron restart, job list and all P1 outputs are lost. Clarification vs candidate: candidate correctly identified the critical gap but did not explicitly state that store.js confirms the session-only nature of jobs. This REV1 confirms it via direct store.js source read.

**Conclusion 5 (candidate):** Source fingerprinting is entirely absent (A035-G05). Cross-pipeline identity matching between P1 and P2 outputs is not currently possible.

Classification: ACCEPTED

Independent evidence: grep source_fingerprint exits 1 across all authorized source files (E-R18). /api/video-info returns fps, total_frames, duration, width, height (server.py:660-673) but performs no hashing or fingerprinting. No identity hash is generated at any point in the P1, P2, or P3 paths in the reviewed source.

**Conclusion 6 (candidate):** The jobs/<job_id>/p1/ directory structure does not exist. No path construction logic for this pattern was found.

Classification: ACCEPTED

Independent evidence: No authorized source file references a path matching the jobs/<job_id>/p1/ pattern. No mkdir, os.makedirs, or path.mkdir is associated with a per-job P1 subdirectory in api/server.py or any frontend source file (E-R16).

**Conclusion 7 (candidate):** timebase is absent from the codebase. FPS is present via /api/video-info but not persisted to P1 artifacts.

Classification: ACCEPTED

Independent evidence: grep timebase exits 1 across all authorized source files (E-R14). fps is returned by /api/video-info at server.py:660-669 and displayed in the UI via app.js:1146 (el.metaFps.textContent). fps is NOT stored in any persisted P1 artifact or job object field that survives a session reset (store.js only saves settings — E-R17).

**Conclusion 8 (candidate):** Pipeline 1 does NOT perform subtitle removal or final video render. No reachable P1-to-P2 or P1-to-P3 boundary violation was found.

Classification: ACCEPTED

Independent evidence: Inpaint not reachable from pipeline1-ai.js (grep inpaint in pipeline1-ai.js exits 1 — E-R01). startProcessBatch not present in pipeline1-ai.js (E-R03). finalizeVideo not imported or called in pipeline1-ai.js (grep finalizeVideo in pipeline1-ai.js exits 1 — E-R19). clean_video not referenced in any authorized P1 source (grep clean_video exits 1 — E-R20). pipeline3-finalize.js is imported only in index.html and exposed via window.finalizeVideo; it is not reachable from the processPipeline1Queue execution path (E-R21). pipeline2-remove.js: outputPath is used in passIdx/startProcessBatch context (pipeline2-remove.js:32-75), confirming P2 is a separate code module not imported by pipeline1-ai.js.

**Conclusion 9 (candidate):** Proposed minimum implementation sequence: T-036-A (persistence + source identity), T-036-B (routing cleanup), T-036-C (scene detection), T-036-D (multimodal timeline). Gap count: 8. 4 proposed future tasks.

Classification: ACCEPTED

Independent evidence: T-036-A (artifact persistence) is the foundational prerequisite since all other JSON artifact gaps depend on a disk-resident per-job directory. T-036-B (Path A routing cleanup) is prerequisite to safe production P1 usage because the legacy onJobFinished coupling creates unpredictable P1 triggering for jobs not explicitly queued as pipeline=1. T-036-C (scenes.json) depends on T-036-A for the storage location. T-036-D (multimodal_timeline.json) depends on T-036-A and T-036-C. remix_script.json and edit_plan.json depend on T-036-D. This dependency order is consistent with the code evidence: all JSON artifacts are currently absent (E-R06 through E-R09), and the jobs/<job_id>/p1/ directory does not exist (E-R16).

**Conclusion 10 (candidate):** This audit is READ-ONLY. No source, test, dependency, or config file was modified. No gap was fixed.

Classification: ACCEPTED for the candidate execution scope. REV1 independently verified: the candidate source blobs (confirmed by hash-object on the EXECUTION_BASE_HEAD worktree) are identical to the REV1 expected blobs. No unauthorized file was modified by the candidate executor in the application source. (Note: The candidate executor DID modify .ai/current_state.md, .ai/task_current.md, and .ai/handoff.md — three files explicitly forbidden by the REV1 spec. Those modifications are the basis of INCIDENT-RECOVERY-007E-AUDIT035-EXECUTOR-CONTROL-001. This REV1 executor does NOT modify those files.)

Summary of reconciliation:
- ACCEPTED: 10 (with one clarification on conclusion 4 regarding store.js)
- CORRECTED: 0
- REJECTED: 0

All 10 substantive technical conclusions of the candidate report are confirmed by independent direct source evidence in REV1. The invalidation was procedural (unauthorized shell commands and unauthorized dynamic state edits), not substantive.

---

## Current Pipeline 1 execution map

### Path A: Legacy post-inpaint coupling (reachable, design debt)

Entry: processNextJob() at app.js:691 dispatches inpaint jobs via api.startProcessBatch(). On completion, pollProgress() (app.js:791) or handleWSMessage() (app.js:812) calls onJobFinished(job).

onJobFinished() (app.js:822) checks job.aiRewrite and job.ttsGenerate flags. If either is set and not yet triggered:
- Calls window.triggerAutoAiRewrite(job, srtText) if needAi is true (app.js:867)
- Calls window.triggerAutoTts(job, srtForTts) if needTts is true (app.js:876)

Both route into pipeline1-ai.js. This makes P1 AI/TTS a post-processing step AFTER P2 inpaint finishes for jobs that have aiRewrite or ttsGenerate set on non-pipeline-1 jobs.

Guard: handleWSMessage (app.js:812) includes the check "if (!state.pipeline1JobId)" before calling onJobFinished, preventing double-trigger when a dedicated P1 job is active. pollProgress (app.js:791) does NOT have this guard.

Result: Path A is reachable when a job is processed via processNextJob (P2 inpaint path) and has aiRewrite or ttsGenerate flags set. This is the BUG-005 root cause.

### Path B: Dedicated Pipeline 1 Queue Runner (correct path)

Entry: btn-start-all click handler (app.js:654) sets j.pipeline = 1 on all idle jobs and calls processPipeline1Queue().

processPipeline1Queue() (app.js:909):
1. Finds first queued job with pipeline === 1
2. Sets state.pipeline1JobId = nextJob.id
3. Step 1/3: Calls api.extractTextP1(nextJob.id, nextJob.filePath, language)
   - api.js: POST /api/p1/extract-text with {job_id, video_path, extraction_mode:'asr', language}
   - server.py:988 /api/p1/extract-text: asr-only, delegates to api_extract_srt, echoes job_id in response
   - api_extract_srt: ffmpeg audio to temp WAV, faster_whisper ASR, returns srt_content string, deletes temp WAV
   - Frontend: nextJob.srtContent = asrRes.srt_content (in-memory only; no disk write)
4. Step 2/3 (optional): if nextJob.aiRewrite, calls window.triggerAutoAiRewrite(nextJob, nextJob.srtContent)
   - pipeline1-ai.js:6: IPC to Electron main via window.electronAPI.ollamaChat or window.electronAPI.aiRewrite
   - Stores result in job.aiContent (in-memory only)
   - Chains to triggerAutoTts internally if job.ttsGenerate is set (pipeline1-ai.js:49)
5. Step 3/3 (optional): if nextJob.ttsGenerate and not nextJob.aiRewrite, calls window.triggerAutoTts(nextJob, nextJob.srtContent)
   - pipeline1-ai.js:73: POST /api/tts-retry with {srt_content, tts_voice, video_path, tts_ref_audio, tts_speed}
   - Backend tts_engine.py writes audio file to disk; path returned as result.audio_path
   - Stores: job.ttsAudioPath (in-memory), job.ttsTimedSrt (in-memory), job.ttsAudioDurMs (in-memory), job.ttsSegmentsTiming (in-memory), job.karaokeAss (in-memory)
6. _finishP1Job(nextJob, 'finished'): clears state.pipeline1JobId, calls processPipeline1Queue() for next job

No disk artifact JSON is written at any step of Path B. No inpaint, no subtitle removal, no P2/P3 call.

---

## Current outputs and persistence

| Output | Storage type | Location / key evidence |
|---|---|---|
| Extracted SRT text | In-memory only | nextJob.srtContent in frontend state.jobs array (app.js:945); not persisted by store.js (E-R17) |
| AI rewritten text | In-memory only | job.aiContent in frontend state.jobs (pipeline1-ai.js:45); not persisted by store.js (E-R17) |
| TTS audio file | Disk (backend-determined path) | Backend tts_engine.py writes file; path echoed as result.audio_path; stored as job.ttsAudioPath in-memory (pipeline1-ai.js:110); not in jobs/<job_id>/p1/ |
| Timed SRT (TTS-aligned) | In-memory only | job.ttsTimedSrt (pipeline1-ai.js:111); not persisted by store.js |
| Karaoke ASS | In-memory only | job.karaokeAss (pipeline1-ai.js:114); not persisted by store.js |
| TTS audio duration ms | In-memory only | job.ttsAudioDurMs (pipeline1-ai.js:112) |
| TTS segments timing | In-memory only | job.ttsSegmentsTiming (pipeline1-ai.js:113) |
| scenes.json | NOT PRESENT | grep exit 1 (E-R06) |
| multimodal_timeline.json | NOT PRESENT | grep exit 1 (E-R07) |
| remix_script.json | NOT PRESENT | grep exit 1 (E-R08) |
| edit_plan.json | NOT PRESENT | grep exit 1 (E-R09) |
| jobs/<job_id>/p1/ directory | NOT PRESENT | No directory creation logic for this pattern (E-R16) |
| Source fingerprint | NOT PRESENT | grep source_fingerprint exit 1 (E-R18) |
| Artifact version (artifact_version) | NOT PRESENT | grep artifact_version exit 1 (E-R15) |

store.js persistence scope (re-verified in REV1):
- saveState() at store.js:49 serializes ONLY state.settings to localStorage.
- loadState() at store.js:42 restores ONLY state.settings from localStorage.
- state.jobs (the array containing all job objects including srtContent, aiContent, ttsAudioPath, ttsTimedSrt, etc.) is NOT persisted.
- Conclusion: ALL per-job P1 field data is session-memory-only. An Electron restart or page reload loses all P1 results except the backend-written TTS audio file at the backend-determined path.

---

## Target artifact contract comparison

| Proposed artifact | REV1 Classification | Direct evidence |
|---|---|---|
| jobs/<job_id>/p1/ directory | MISSING | No mkdir or path construction for this pattern in any authorized source file (E-R16) |
| scenes.json | MISSING | grep exit 1 across all authorized source files (E-R06) |
| multimodal_timeline.json | MISSING | grep exit 1 (E-R07) |
| remix_script.json | MISSING | grep exit 1 (E-R08) |
| edit_plan.json | MISSING | grep exit 1 (E-R09) |
| TTS audio | PARTIAL | Written to disk by backend; path in job.ttsAudioPath. But: not namespaced to jobs/<job_id>/p1/, no structured manifest, no source_fingerprint, no artifact version embedded (E-R10) |
| SRT (raw ASR) | PARTIAL | srt_content returned by /api/p1/extract-text and stored in nextJob.srtContent in-memory. Not persisted to disk, no structured artifact file (E-R11) |
| TTS-timed SRT | PARTIAL | result.srt_content returned by /api/tts-retry; stored in job.ttsTimedSrt in-memory. Not persisted to disk (E-R10, pipeline1-ai.js:111) |
| job_id | PARTIAL | UUID generated by server for P2 jobs (server.py:526); echoed by /api/p1/extract-text (server.py:995). Not embedded in any persisted artifact (E-R12) |
| source_fingerprint | MISSING | grep exit 1 across all authorized source files (E-R18) |
| Source duration | PARTIAL | /api/video-info returns duration (server.py:673). Not attached to any persisted P1 artifact; not in store.js persistence (E-R13, E-R17) |
| FPS | PARTIAL | /api/video-info returns fps (server.py:669); displayed in UI (app.js:1146). Not embedded in any persisted P1 artifact (E-R14) |
| timebase | MISSING | grep exit 1 across all authorized source files (E-R14) |
| Artifact version | MISSING | grep artifact_version exit 1 across all authorized source files (E-R15) |

---

## Pipeline boundary findings

### P1 to P2 boundary

Finding: NO REACHABLE VIOLATION IN PATH B.

pipeline1-ai.js contains no inpaint call, no call to startProcessBatch, no reference to P2 endpoints (grep inpaint: exit 1 — E-R01; grep startProcessBatch in pipeline1-ai.js: not present — E-R03). Module header at line 3 explicitly states: "This module never removes subtitles or renders final video." (E-R02).

processPipeline1Queue() does not call startProcessBatch() or any /api/process endpoint.

Path A architectural risk (code-level, not a P1 performing P2 operation): onJobFinished() is invoked after P2 inpaint completes. At that point, pipeline1-ai.js functions (triggerAutoAiRewrite, triggerAutoTts) may be called on the job. This is P1 AI/TTS running as a post-processing step AFTER P2, not P1 performing P2 inpaint. The violation is an architectural coupling (P1 outcome depends on P2), not P1 executing P2 logic. Root cause of BUG-005.

### P1 to P3 boundary

Finding: NO REACHABLE VIOLATION.

pipeline1-ai.js does not call finalizeVideo or any Pipeline 3 function (grep finalizeVideo in pipeline1-ai.js: exit 1 — E-R19). pipeline3-finalize.js is imported only in index.html:814-815 as a module bridge exposed via window.finalizeVideo. It is not imported or called from pipeline1-ai.js or from processPipeline1Queue() in app.js. clean_video is absent from all authorized source files (E-R20). finalOutputPath is set only in pipeline3-finalize.js (lines 137, 140, 145, 168) and read in app.js (line 522) and pipeline3-finalize.js; pipeline1-ai.js does not reference it (E-R21).

---

## Gap matrix

### A035-G01: P1 artifact persistence

Required: P1 artifacts persisted to jobs/<job_id>/p1/ directory on disk, namespaced by job.
Current: No directory creation logic exists. All P1 outputs (SRT, AI text, timed SRT, karaoke ASS, TTS timing) are in-memory only and lost on session reset. TTS audio file is written to disk at a backend-determined path, not at jobs/<job_id>/p1/. (E-R16, E-R17)
Affected: api/server.py (/api/p1/extract-text, /api/tts-retry), src/renderer/js/pipelines/pipeline1-ai.js (triggerAutoTts), src/renderer/js/app.js (processPipeline1Queue)
Risk: P1 artifacts are ephemeral. P3 cannot consume them safely. No audit trail across sessions.
Dependency: Must be implemented before P3 can safely consume P1 outputs. Blocks all other JSON artifact gaps.

### A035-G02: scenes.json — scene detection per job

Required: scenes.json produced per job containing scene/keyframe analysis.
Current: No scene detection code in any authorized P1 source file. Grep exit 1 for scenes.json. (E-R06)
Affected: None currently — feature entirely absent.
Risk: P3 edit_plan cannot reference scene timecodes. Cannot reorder scenes.
Dependency: Depends on A035-G01 (needs disk artifact location).

### A035-G03: multimodal_timeline.json — merged transcript + scene structure

Required: multimodal_timeline.json produced per job merging ASR and scene data.
Current: Absent. Grep exit 1. (E-R07)
Affected: None currently.
Risk: P3 cannot safely remap timecodes without this.
Dependency: Depends on A035-G01 and A035-G02.

### A035-G04: remix_script.json and edit_plan.json

Required: Structured script and edit plan produced per job.
Current: Both absent. Grep exit 1. (E-R08, E-R09)
Affected: None currently.
Risk: P3 cannot perform structured remixing.
Dependency: Depends on A035-G03.

### A035-G05: source_fingerprint — cross-pipeline identity

Required: source_fingerprint embedded in all P1/P2/P3 artifacts for cross-pipeline identity matching.
Current: Absent from all authorized source files. Grep exit 1. /api/video-info returns file stats but does not hash or fingerprint the source. (E-R18)
Affected: None currently — concept entirely absent.
Risk: P3 cannot verify that P1 outputs and P2 clean_video.mp4 came from the same source.
Dependency: Must be part of A035-G01 implementation (fingerprint goes into manifest).

### A035-G06: artifact version — schema versioning

Required: artifact version field in all P1 artifacts.
Current: Absent from all authorized source files. Grep artifact_version exit 1. (E-R15)
Affected: None currently.
Risk: Cannot distinguish artifact schema versions. P3 cannot validate input contract.
Dependency: Part of A035-G01 (add artifact_version to manifest JSON).

### A035-G07: source duration and FPS persisted in P1 artifact

Required: Source duration and FPS/timebase persisted as part of P1 artifact identity.
Current: /api/video-info returns fps and duration (server.py:660-673) but these are not stored in any persisted P1 artifact. timebase absent (E-R14). store.js does not persist video-info data.
Affected: api/server.py (/api/video-info), src/renderer/js/app.js (metaFps display at line 1146)
Risk: Cannot perform timeline tolerance verification between P1 and P2. P3 cannot safely align P1 TTS timing with P2 clean video.
Dependency: Part of A035-G01 (embed fps/duration/total_frames in p1_manifest.json).

### A035-G08: Path A / Path B coupling — P1 independence from P2

Required: P1 must be independent of P2. P1 AI/TTS should not be triggered as a post-processing step after P2 inpaint.
Current: Path A exists in onJobFinished() (app.js:822-883). When a P2 inpaint job finishes and the job has aiRewrite or ttsGenerate set, P1 functions are called. Path B (processPipeline1Queue) is independent and correct. Guard at handleWSMessage (app.js:812) prevents double-trigger when pipeline1JobId is active, but pollProgress (app.js:791) does NOT include this guard.
Affected: src/renderer/js/app.js (onJobFinished, pollProgress)
Risk: Unpredictable P1 triggering for P2 jobs. BUG-005 root cause.
Dependency: Path B should be the only P1 entry point. Routing cleanup task.

---

## Proposed follow-up task breakdown

Task sequence is dependency-ordered based on code evidence. Each task must be separately authorized.

### T-036-A: P1 Artifact Persistence and Source Identity

Responsibility: Implement disk persistence for P1 outputs with source identity.
Likely affected files: api/server.py (/api/p1/extract-text, /api/tts-retry), optionally a new p1_artifact.py helper.
What to implement: Create jobs/<job_id>/p1/ directory on disk; write srt_raw.srt; confirm TTS audio lands in jobs/<job_id>/p1/; write p1_manifest.json with fields: job_id, source_fingerprint (SHA-256 of source video), source_duration, fps, artifact_version: "1", timestamp.
Acceptance evidence: After P1 run, jobs/<job_id>/p1/p1_manifest.json exists on disk with all required fields. Source fingerprint is deterministically reproducible from the source video. TTS audio is in the namespaced subdirectory. Artifacts survive Electron restart.
P1/P2/P3 separation: P2 and P3 not touched.
Does not authorize itself.
Covers gaps: A035-G01, A035-G05, A035-G06, A035-G07 (all bundled into manifest)

### T-036-B: P1 Path A / Path B Routing Cleanup

Responsibility: Remove or gate the legacy post-inpaint P1 coupling in onJobFinished and pollProgress.
Likely affected files: src/renderer/js/app.js (onJobFinished, pollProgress).
What to implement: Ensure P1 AI/TTS is only triggered via processPipeline1Queue() (Path B). Add pipeline1JobId guard to pollProgress similar to the existing handleWSMessage guard. Document or remove Path A trigger in onJobFinished.
Acceptance evidence: Running P2 inpaint alone (on a job not marked pipeline=1) does not trigger P1 AI/TTS. P1 queue runner is the sole P1 entry point. BUG-005 no longer reproducible.
P1/P2/P3 separation: P2 and P3 not touched.
Does not authorize itself.
Covers gap: A035-G08

### T-036-C: P1 Scene Detection Endpoint

Responsibility: Implement /api/p1/detect-scenes and produce scenes.json per job.
Likely affected files: api/server.py (new route), src/renderer/js/api.js (new client method).
What to implement: Backend endpoint accepts video_path and job_id, samples keyframes, groups into scenes, writes jobs/<job_id>/p1/scenes.json with scene list (start_ms, end_ms, keyframe_path).
Acceptance evidence: After endpoint call, scenes.json exists at expected path. Does not modify clean_video or any P2 output.
Dependency: Requires T-036-A.
Does not authorize itself.
Covers gap: A035-G02

### T-036-D: Multimodal Timeline Builder

Responsibility: Merge ASR SRT and scenes.json into multimodal_timeline.json per job.
Likely affected files: api/server.py (new /api/p1/build-timeline route).
What to implement: Align ASR segments with detected scenes. Output jobs/<job_id>/p1/multimodal_timeline.json.
Acceptance evidence: File exists with merged timeline. No P2/P3 changes.
Dependency: Requires T-036-A and T-036-C.
Does not authorize itself.
Covers gap: A035-G03

Note: remix_script.json and edit_plan.json (A035-G04) are deferred to tasks after T-036-D. P2 timeline tolerance verification is a separate task not combined with P1 artifact implementation. Task 036 is not authorized until PM selects it following REV1 review.

---

## Evidence

E-R01 | git grep -n "inpaint" -- src/renderer/js/pipelines/pipeline1-ai.js | exit 1 | inpaint absent from P1 module
E-R02 | git show HEAD:src/renderer/js/pipelines/pipeline1-ai.js line 3 | "This module never removes subtitles or renders final video."
E-R03 | git grep -n "startProcessBatch" -- src/renderer/js/pipelines/pipeline1-ai.js | not present; startProcessBatch appears only at api.js:69 and app.js:740/754 (processNextJob context) | exit 0 for api.js/app.js, pipeline1-ai.js not in result
E-R04 | git show HEAD:src/renderer/js/app.js lines 855-883 | onJobFinished: needAi/needTts checks trigger window.triggerAutoAiRewrite or window.triggerAutoTts post-inpaint
E-R05 | git grep -n "onJobFinished" -- src/renderer/js/app.js | exit 0 | app.js:791 pollProgress calls onJobFinished; app.js:812 handleWSMessage guards with !state.pipeline1JobId before calling onJobFinished
E-R06 | git grep -n "scenes.json" -- all authorized source files | exit 1 | scenes.json absent
E-R07 | git grep -n "multimodal_timeline" -- all authorized source files | exit 1 | multimodal_timeline absent
E-R08 | git grep -n "remix_script" -- all authorized source files | exit 1 | remix_script absent
E-R09 | git grep -n "edit_plan" -- all authorized source files | exit 1 | edit_plan absent
E-R10 | git grep -n "ttsAudioPath" -- pipeline1-ai.js app.js store.js | exit 0 | pipeline1-ai.js:110 job.ttsAudioPath = result.audio_path; app.js:61 init null; TTS file on disk at backend path; not in jobs/<job_id>/p1/
E-R11 | git show HEAD:src/renderer/js/app.js line 945 | nextJob.srtContent = asrRes.srt_content | in-memory only
E-R12 | git grep -n "job_id" -- pipeline1-ai.js api.js api/server.py | exit 0 | server.py:995 echoes job_id in response; not embedded in any persisted artifact
E-R13 | git grep -n "duration" -- api/server.py | exit 0 | server.py:673 "duration": duration in /api/video-info response; not persisted to P1 artifact
E-R14 | git grep -n "timebase" -- all authorized source files | exit 1 | timebase absent; fps at server.py:660/669 and app.js:1146 (UI display only)
E-R15 | git grep -n "artifact_version" -- all authorized source files | exit 1 | artifact_version absent
E-R16 | No authorized source file references a path matching jobs/<job_id>/p1/ pattern | no directory creation logic for this pattern found
E-R17 | git show HEAD:src/renderer/js/store.js | saveState() serializes state.settings only to localStorage; loadState() restores state.settings only; state.jobs not persisted
E-R18 | git grep -n "source_fingerprint" -- all authorized source files | exit 1 | source_fingerprint absent
E-R19 | git grep -n "finalizeVideo" -- src/renderer/js/pipelines/pipeline1-ai.js | exit 1 | finalizeVideo not referenced in P1 module; only appears in index.html:814-815 (module bridge)
E-R20 | git grep -n "clean_video" -- all authorized source files | exit 1 | clean_video absent
E-R21 | git grep -n "finalOutputPath" -- src/renderer/js/pipelines/pipeline1-ai.js src/renderer/js/pipelines/pipeline3-finalize.js | exit 0 | finalOutputPath set only in pipeline3-finalize.js lines 137/140/145/168; pipeline1-ai.js not in result
E-R22 | git show HEAD:src/renderer/js/app.js lines 654-655 | btn-start-all sets j.pipeline = 1 and calls processPipeline1Queue()
E-R23 | git show HEAD:src/renderer/js/app.js lines 909-1022 | processPipeline1Queue: no inpaint call, no startProcessBatch call, no P3 call
E-R24 | git grep -n "tts-retry" -- pipeline1-ai.js api/server.py | exit 0 | pipeline1-ai.js:96 POST /api/tts-retry; server.py:1317 @app.post("/api/tts-retry")
E-R25 | git grep -n "karaokeAss" -- pipeline1-ai.js api.js app.js | exit 0 | pipeline1-ai.js:114 job.karaokeAss = result.karaoke_ass; app.js:62 init null; api.js:251 consumed in burnSubtitlePositioned (P3 context); in-memory only from P1
E-R26 | git grep -n "processPipeline1Queue" -- src/renderer/js/app.js | exit 0 | app.js:580/654/909/1022 confirm function definition and call sites
E-R27 | git grep -n "triggerAutoTts" -- pipeline1-ai.js | exit 0 | pipeline1-ai.js:49 chained from triggerAutoAiRewrite when job.ttsGenerate; pipeline1-ai.js:53 also when error in AI path; pipeline1-ai.js:73 function definition

---

## Conclusion

1. Pipeline 1 has a functional dedicated execution path (Path B, processPipeline1Queue at app.js:909) that correctly performs ASR → AI Rewrite → TTS without calling P2 inpaint or P3 finalize. The Pipeline 1 and Pipeline 3 boundaries are clean in Path B.

2. A legacy coupling (Path A) exists in onJobFinished() (app.js:822). When a P2 inpaint job finishes and the job carries aiRewrite or ttsGenerate flags, triggerAutoAiRewrite or triggerAutoTts from pipeline1-ai.js is invoked. A WS guard (app.js:812) prevents this when a dedicated P1 job is active, but the polling path (app.js:791) has no such guard. This is the identified BUG-005 root cause and requires T-036-B to resolve.

3. Zero target artifact contract items are fully implemented. TTS audio (PARTIAL: disk, but no manifest/namespacing), SRT (PARTIAL: in-memory), TTS-timed SRT (PARTIAL: in-memory), job_id (PARTIAL: echoed in response only), source duration (PARTIAL: via /api/video-info, not persisted), FPS (PARTIAL: via /api/video-info, not persisted) are all partial. All JSON artifacts (scenes.json, multimodal_timeline.json, remix_script.json, edit_plan.json) and the jobs/<job_id>/p1/ directory are MISSING (grep exit 1 confirmed in REV1).

4. A035-G01 (P1 artifact persistence) is the highest-priority gap. Per direct inspection of store.js: saveState() persists ONLY settings. All job/P1 data (srtContent, aiContent, ttsAudioPath, ttsTimedSrt, karaokeAss, ttsAudioDurMs, ttsSegmentsTiming) is session-memory-only. An Electron restart loses all P1 results except the TTS audio file at the backend-determined path.

5. source_fingerprint is entirely absent from all authorized source files (grep exit 1). Cross-pipeline identity matching between P1 and P2 outputs is not currently possible.

6. The jobs/<job_id>/p1/ directory structure does not exist. No path construction logic for this pattern was found in any authorized source file in REV1 re-verification.

7. timebase is absent from all authorized source files (grep exit 1). fps is present via /api/video-info (server.py:669) and displayed in UI (app.js:1146) but is not embedded in any persisted P1 artifact.

8. Pipeline 1 does NOT perform subtitle removal or final video render. No reachable P1-to-P2 or P1-to-P3 boundary violation was found in Path B (the dedicated P1 path).

9. All 10 substantive conclusions of the candidate report are ACCEPTED in REV1. The invalidation of the candidate report was procedural (unauthorized shell commands for report creation, unauthorized dynamic canonical state edits), not substantive.

10. This REV1 audit is READ-ONLY. No source, test, dependency, config, or canonical state file was modified. The single executor-authored output is this report file. Owner app verification is NOT REQUIRED for this read-only audit. No gap was fixed.

STATUS: WAITING_PM_REVIEW
