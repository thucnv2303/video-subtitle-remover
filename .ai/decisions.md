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

## D-013 — Pipeline 1 semantic remix is not transcript translation
On 2026-08-12 the Owner clarified that Semantic Remix must understand the original video as a marketing/storytelling asset before writing a new script. Full timestamped ASR transcript and adaptive Vision evidence are both reasoning inputs. Semantic mode requires canonical source scenes -> video profile -> product/subject profile -> target-customer profile -> strategy -> ordered beats -> grounded continuous narration -> beat-to-source provenance.

A shorter semantic narration is acceptable only when coherent with its own remix strategy/beat timeline. Accidental summarization or line-by-line translation is not acceptable. Owner semantic runtime/artifact verification remains mandatory before P3 semantic cut/reorder work.

## D-014 — Semantic Remix is opt-in; Standard Script remains default
On 2026-08-12 the Owner explicitly required the richer scene-based Semantic Remix to be a user-selected feature rather than replacing normal Pipeline 1 script generation.

Decision:
- new runs default to Standard Script (`semanticRemixEnabled=false`);
- the user must explicitly enable Semantic Remix before Start;
- Start snapshots mode per idle Job so later UI changes do not alter a running Job;
- Standard mode uses the known pre-semantic multimodal reasoning behavior and never publishes authoritative P3 scene-reorder instructions;
- only Semantic mode may publish `multimodal-semantic-remix-v4` and an authoritative candidate `edit_plan.json`;
- semantic results are fail-closed on BUG-036 evidence/timeline/claim/coverage guards before artifact acceptance;
- this decision does not change P2 or authorize P3 semantic editing.

This preserves the working normal-script product path while making advanced semantic remix an explicit capability with stricter validation.

## D-015 — Project Manager direct GitHub implementation is the default executor mode
On 2026-08-12 the Owner instructed Project Control to stop assigning implementation work to Anti and to perform repository changes directly through GitHub review branches.

Decision:
- Project Manager may directly implement bounded source and knowledge changes on dedicated review branches;
- no direct push to canonical/main/dev is permitted;
- every direct source change still requires exact starting SHA, focused scope, GitHub diff/full-file review, appropriate verification, canonical `.ai/` synchronization and Owner runtime verification when applicable;
- a successful GitHub write is not equivalent to Code Review PASS;
- merge remains BLOCKED until normal project gates pass and the Owner explicitly requests/approves merge;
- Anti/external executor must not be dispatched unless the Owner later changes this instruction.

This changes execution ownership only; it does not relax evidence, QA, architecture or merge gates.

## D-016 — Standard Script must compose to the selected voice/video duration before TTS
On 2026-08-13 the Owner clarified that a short source transcript must not force a short Standard narration. Pipeline 1 already has full transcript, adaptive Vision evidence, source duration and selected voice/speed characteristics, so Standard reasoning must use those inputs to compose a grounded narration whose predicted speaking duration matches the source-video duration closely enough before TTS.

Decision:
- Standard mode targets the existing voice-aware 95–100% source-duration narration budget before TTS;
- if the first grounded narration is below that range, P1 performs one evidence-backed AI recompose using full transcript + Vision evidence + source duration + selected voice/speed-derived rate;
- the recompose may add grounded explanation, sequencing and transitions from analyzed evidence even when source speech is short;
- filler, repetition and unsupported claims remain forbidden and fail closed through existing quality/evidence checks;
- TTS starts only after the Standard narration passes the pre-TTS duration/quality guard;
- this correction does not add a second TTS pass;
- P3 remains final render/timeline authority, but D-012 no longer permits Standard P1 to knowingly accept severe underfill such as ~36.7% source occupancy.

Source correction published on PR #48 at `41a4a429bfe7dfe17fbd2113f4019733656359ce`; static and Owner retest are required before acceptance.
