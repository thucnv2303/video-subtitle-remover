# PIPELINE1-STANDARD-LONG-NARRATION-014 — Research Proposal

Status: DESIGN PROPOSAL — SOURCE NOT AUTHORIZED YET

## Basis
- Parent integration branch / Draft PR: `review/PIPELINE1-INTEGRATION-013` / #56.
- Parent exact head before this proposal: `714faac01bed9bfb8c364d84f9dfe386cfedc139`.
- Owner runtime on 2026-08-14 proves per-Job Remix behavior is functionally OK, but exact local `git rev-parse HEAD` was not pasted in that report.
- Same runtime proves long Standard narration Revision 3 still fails before TTS.

## Fresh runtime evidence
Source video ~497.1s, Standard mode, Ollama `qwen3-coder:30b`, clone voice.
- ASR: PASS, 7 segments.
- Vision: PASS, 80 keyframes / 10 chunks with `gemma4:12b`.
- Global reasoning: 1165-char clean narration draft.
- Legacy/Revision-3 budget: 7792-8202 chars.
- Chunked mode planned 5 sections.
- Section 1 covers 0.0-97.5s, local transcript only 125 chars, compact evidence 2075 chars.
- Section-1 hard target was 1528-1608 chars.
- First section request returned 578 chars and failed hard length validation.
- Retained-candidate retry again returned 578 chars and failed before TTS.

## Verified architecture conflict
Canonical task `PIPELINE1-CONTINUOUS-NARRATION-006` explicitly states:
- P1 must not force voice to occupy 95-100% of the original video timeline;
- underlength is not a P1 failure by itself;
- character budget is generation guidance/telemetry, not a hard occupancy contract;
- final voice/video duration alignment belongs to P3.

Current `src/renderer/js/pipelines/pipeline1-ai.js` follows that policy: it performs one continuous TTS, measures the actual voice/source ratio, treats short voice as telemetry/warning, and only hard-fails pathological overlength >1.50.

Revision 3 in `src/main/p1-standard-vision-wrapper.js` contradicts that responsibility split by reinstating hard 95-100% character occupancy before TTS and by allocating local section minimums almost entirely from timeline duration.

## Research conclusion
The remaining problem is not an Ollama timeout/token/context failure. It is a narration-contract problem:
1. Timeline duration is being treated as a mandatory text-density target even when local evidence is sparse.
2. Section retries are asked to become longer rather than to improve missing evidence coverage.
3. The selected `qwen3-coder` model is code-specialized; it should not be assumed to be the best prose writer simply because it is the selected reasoning model.
4. P1 blocks before reaching its already-correct measured TTS telemetry path.

## Proposed product architecture
### A. Content-first, evidence-coverage narration
For Standard mode, optimize for grounded coverage and coherence, not original-timeline occupancy.
- Build an ordered content plan from Vision chunks/scenes + transcript.
- Mark unique facts/actions/stages that deserve narration.
- Generate chronological sections only when a long source benefits from decomposition.
- Each section must cover its assigned evidence items; it is allowed to be naturally short when the source section is repetitive/silent.
- Retry only for missing assigned evidence, CJK, repetition, malformed JSON or unsupported claims — never just because text did not reach a timeline-derived character quota.

### B. Evidence-aware section sizing
Do not allocate section length only by seconds.
Use a bounded score based on:
- number of unique grounded scene/action facts;
- transcript density;
- process-stage novelty;
- timeline duration as a secondary weighting factor.

Length becomes a soft range for generation guidance. No hard local minimum exists solely to fill time.

### C. Continuity
- Global continuity brief fixes subject, terminology, narrative voice and ordered process stages.
- Later section receives the previous accepted tail plus the next local objective.
- Only section 1 may introduce; only final section may conclude/CTA.
- Join all accepted sections to one `narration_script`.
- Run deterministic global ZERO-CJK, repeated-sentence, near-duplicate, repeated-long-phrase checks plus evidence-coverage checks.
- No monolithic final rewrite.

### D. Model roles
Separate "analysis/reasoning model" from "narration writer" conceptually.
- Vision remains the available vision-capable model.
- Reasoning/planning may remain the Owner-selected model.
- Narration writer should prefer a general instruction/prose-capable local model when explicitly configured/available; do not silently download a model.
- If no dedicated writer is configured, use the selected local model and log that choice transparently.

Do not automatically replace the Owner-selected model without explicit product policy.

### E. TTS responsibility
P1 should allow the grounded narration to reach TTS after content-quality gates.
- One continuous narration is passed downstream.
- Measure actual TTS duration.
- Persist exact duration telemetry and timed subtitles against actual audio.
- Underlength alone does not fail P1.
- P3 owns final timeline/voice fit per the existing continuous-narration contract.

### F. Long-form TTS safety
Do not redesign TTS pre-emptively. Current OmniVoice supports long-form internal chunking, while P1 already exposes one continuous final artifact.
Only if Owner runtime later proves full-text TTS itself fails should a separate TTS task modify generation parameters/batching. AI section boundaries must not automatically become audible audio boundaries.

## Recommended implementation phase
First corrective source task should be narrow:
- revise `src/main/p1-standard-vision-wrapper.js` so long Standard uses evidence-coverage sections and no hard 95-100% occupancy gate;
- preserve `src/renderer/js/pipelines/pipeline1-ai.js` duration policy unless source review reveals a direct integration bug;
- do not modify `api/tts_engine.py` in the first correction;
- preserve per-Job Remix/log behavior inherited from integration.

A dedicated child GitHub review branch may be created from the exact final integration head when Owner/PM authorizes source implementation. Owner must reuse the existing `E:\Project AI\Video-sub-remove-owner-test-LONG012` directory; no new clone/worktree folder.

## Proposed acceptance
- ~497s Standard source no longer fails because section 1 returns ~578 chars against an artificial ~1.5k minimum.
- Every meaningful process stage/evidence group is represented or explicitly reported uncovered.
- Joined narration passes language/repetition/grounding/coverage gates.
- P1 reaches one continuous TTS.
- Shorter-than-source voice is telemetry, not P1 failure.
- No hallucinated filler solely to fill timeline.
- P2/P3 responsibilities remain unchanged.

## Gates
- Research/diagnosis: PASS.
- Source execution: NOT AUTHORIZED in this proposal.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: WAITING after a future source revision.
- Merge: BLOCKED.
