# Current Task

## Task ID
PIPELINE1-FINAL-RUNTIME-GUARDS-005

## Name
Pipeline 1 Manual Job Browsing and Narration Duration Gate

## Status
CODE_REVIEW_PASS_STATIC_AND_OWNER_RETEST_WAITING

## Authority
- Parent: `review/PIPELINE1-ADAPTIVE-VISION-004@0f668866dba2a38053080627872229e9ed85addd`.
- Review branch: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- Draft PR: #46.
- Current reviewed source: `d9dcd665295a6ca2583644e2ffb39e6421f79f32`.
- PM review: `4904862077`.
- Exact task spec: `.ai/task_specs/PIPELINE1-FINAL-RUNTIME-GUARDS-005.md`.

## Owner outcome
Before P1 can be approved for merge:
1. User must be able to inspect another Job while a different Job continues processing.
2. Final exported narration track must never exceed source video duration and may be shorter by at most 5%: accepted ratio `0.95..1.00`.

## Source scope
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`

No P2/P3/STTN/Settings/backend/TTS-engine source changes.

## Implementation
1. Periodic run-UX synchronization preserves an existing valid `pipeline1SelectedJobId`.
2. Processing Job is auto-selected only if there is no valid manual selection.
3. AI/TTS phase transitions preserve manual detail selection; `activeJobId` still identifies execution authority.
4. Source duration comes from P1 artifact metadata with video-info fallback.
5. Exported TTS duration is normalized from the current backend contract: prefer `exported_audio_duration_ms`, otherwise legacy `audio_duration_ms + 1000ms` fixed export tail.
6. Success gate is inclusive 95% through 100% of source duration.
7. Outside range on pass 1 triggers exactly one configured-model script-fit request targeting 97.5%.
8. Repaired output must keep exact SRT segment count and timestamps.
9. Repaired `remix_script.srt` and `remix_script.json` are synchronized before final success.
10. TTS regenerates exactly once after repair.
11. Pass 2 outside range throws a readable error; P1 remains not ready and P2 stays locked.
12. No video speed manipulation or voice truncation is used.

## Verification completed
- Deterministic duration helper simulation: PASS for 94/95/100/101%, 120% repair-scale, and legacy export-tail normalization.
- Source/diff review: PASS `4904862077`.
- Scope compare: task spec + exactly two approved application source files before canonical docs sync.

## Verification still required
- Exact `node --check src/renderer/js/pipeline1-run-ux.js`.
- Exact `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- Exact `git diff --check 0f668866dba2a38053080627872229e9ed85addd..HEAD`.
- Owner runtime: select Job B while Job A processes and detail remains on B.
- Owner runtime: overlong/underlong narration enters one repair and final successful exported ratio is 95–100%, or fails closed after pass 2.
- Pending adaptive long-video runtime: >60s input must demonstrate >8 samples/multiple bounded Vision chunks before final merge approval.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner NOT STARTED on PR #46; documentation sync PASS after final docs publication; merge BLOCKED; Step 3 BLOCKED.
