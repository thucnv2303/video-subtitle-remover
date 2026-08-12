# AgentOS Handoff Status

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006 — Duration Policy Redesign across P1/P3`

## Status
BUG-034 DURATION POLICY REDESIGN REQUIRED / CURRENT SOURCE NEEDS_REVISION

## Review basis
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Prior BUG-033 source: `77f5e2186ddb4660c9ba35de245bc8b86d297f33` + `da3644f3e81ac3a3927d64baca9365745541f4ec`.
- Fresh Owner runtime supersedes the prior release direction.

## Fresh Owner runtime
97.57s source -> 25 adaptive keyframes / 4 Vision chunks. Global reasoning completes in 38.8s with a quality-clean 613-char narration. Full-text TTS pass 1 is 35.91s = 36.8%. The controller computes a 1582–1666 char measured target, then the evidence-backed qwen3-coder:30b recomposition consumes the full 150s timeout and fails. The exact tested git SHA was not included, but the log proves the BUG-033 evidence-fit code path is active.

## Revised diagnosis
- The problem is no longer just implementation reliability of evidence-fit; the product duration policy itself is too strict.
- P1 should produce a grounded coherent narration/voice artifact, not force voice occupancy to 95–100% of ORIGINAL timeline.
- P3 owns final cut/mix/render and is the natural final duration authority.
- Existing P3 currently changes VIDEO speed to match TTS. New direction is to preserve video pacing by default and move bounded VOICE time-stretch into P3 after the final video timeline is known.
- A narration much shorter than the timeline may intentionally leave background/music/silent coverage. It must not be stretched by extreme factors merely to occupy all video time.
- A moderately longer voice may be sped up in P3 if a listening-validated quality bound permits it; P3 must write a derived audio artifact and regenerate subtitle timing, not overwrite P1 output.

## Required research/design decisions
1. Practical speech time-stretch quality limits for Vietnamese TTS using FFmpeg `atempo` or an available higher-quality time-stretch implementation.
2. P1 pathological overlength ceiling: when should a voice be considered unusable even though exact occupancy is no longer blocking?
3. P3 auto-adjust range vs warning/fail range.
4. Derived P3 voice artifact naming/provenance.
5. Subtitle timing rescale/regeneration after P3 voice retime.
6. Whether any P3 video-speed adjustment remains allowed for intentional edit-plan reasons, separate from voice matching.

## Next permitted action
Research and approve the new duration contract, update task spec/architecture accordingly, then make a narrow source revision. Do not raise the 150s evidence-fit timeout, do not add another P1 reasoning retry, and do not merge current PR.

## Gates
Execution NEEDS_REVISION; automated/static WAITING; code review WAITING new source; Owner current runtime FAIL; docs synchronization PASS after BUG-034 intake; merge BLOCKED; Step 3 release BLOCKED.