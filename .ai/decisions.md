# Decisions

## D-001
Do not rewrite the whole project before determining the last known good state.

## D-002
Each task must solve one narrowly scoped, verifiable objective.

## D-003
Every source-code task must update required .ai memory.

## D-004
Preserve working voice clone, TTS and hard-subtitle removal engines.

## D-005
Strict three-pipeline responsibility boundaries.

## D-006
Pipeline 1 analyzes original video.

## D-007
Pipeline 3 uses Pipeline 2 clean video by default.

## D-008
Source fingerprint and artifact boundaries.

## D-009
Pipeline 1 is the current technical priority.

## D-010
Owner manual verification blocks merge for source-code tasks.

## D-011 — Temporarily close Pipeline 1 at the current functional checkpoint
On 2026-08-10 the Owner decided to stop further Pipeline 1 refinement for now and accept the current functional checkpoint as the working P1 reference for subsequent project work. The accepted runtime evidence proves the core multimodal analysis/remix/TTS/artifact chain and gated P1→P2 handoff. The latest Start/Stop and log-coalescing UX revision was not separately re-run by the Owner and therefore remains deferred rather than PASS. This decision does not authorize merge of PR #41; merge remains subject to the normal explicit merge gate.

## D-012 — Final duration authority belongs to Pipeline 3
On 2026-08-12 the Owner approved replacing the hard P1 95–100% original-video voice-occupancy requirement. Pipeline 1 must produce grounded coherent narration, one natural continuous TTS artifact, timing provenance and edit-plan artifacts; underlength alone is not a P1 failure. P1 keeps only a coarse pathological overlength guard at 150% of original duration.

Pipeline 3 is the final timeline/voice-fit authority. It preserves clean-video playback speed by default. A strongly short voice (<90% of the final mixing-video duration) remains at natural speed; a moderate 90–115% mismatch may create a separate pitch-preserving P3-derived voice and rescaled P3 subtitle timing; >115% is not silently stretched and requires explicit revision/warning. P3 must never overwrite P1 `voice.wav` or P1 `tts_timed.srt`. These initial auto-fit limits remain subject to Owner listening verification before merge.

## D-013 — Pipeline 1 is a semantic remix planner, not a transcript translator
On 2026-08-12 the Owner clarified that Pipeline 1 must understand the original video as a marketing/storytelling asset before writing a new script. Full timestamped ASR transcript and adaptive Vision evidence are both reasoning inputs, but neither source alone is sufficient authority for the final narration.

The required semantic flow is: canonical source-scene evidence -> video profile -> product/subject profile -> target-customer profile -> deliberate remix strategy with intended target duration -> ordered remix beats -> one grounded continuous narration -> beat-to-source-scene/time-range edit plan.

A shorter narration is acceptable only when it is explained by an explicit remix strategy/target duration; accidental summarization or line-by-line translation is not an acceptable substitute. Pipeline 1 must preserve source provenance for every remix beat so Pipeline 3 can later cut/reorder the clean video without rediscovering semantic evidence. Task 007 publishes artifact contract version 4 / `multimodal-semantic-remix-v4`; Owner semantic runtime/artifact verification remains mandatory before merge or before authorizing the P3 semantic cut/reorder executor.