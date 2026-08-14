# Current Task

## Task ID
PIPELINE1-STANDARD-LONG-VIDEO-012

## Status
SOURCE_REVISION_1_PUBLISHED_CODE_REVIEW_PASS_STATIC_WAITING_OWNER_RETEST_WAITING

## Basis
- Exact failing branch/head: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Corrective branch: `review/PIPELINE1-STANDARD-LONG-VIDEO-012`.
- Spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`.
- Source Revision 1: `0547593fa7de7986d2202683847b27bf1e26ec42`.
- Bug: `BUG-041`.

## Owner runtime failure
One Standard ~497.1s video completed ASR, 10 Vision chunks and global reasoning, then produced a 922-char clean draft against hard target 7792-8202 chars. Grounded Standard duration recompose failed with opaque HTTP 400 before TTS.

## Corrective implementation
Authorized source scope is only `src/main/p1-standard-vision-wrapper.js`.
- compact but timeline-preserving evidence context;
- target-aware finite generation budget, max 8192 tokens;
- explicit finite context bucket: 8192 / 16384 / 32768;
- generation timeout scales up to a finite 420s maximum;
- sanitized Ollama non-2xx body is retained in the Job error;
- existing duration, CJK, repetition, grounding, cancellation and bounded retry gates remain fail-closed.

## Required verification
```text
node --check src/main/p1-standard-vision-wrapper.js
git diff --check 6bc43e65726150a3dbef37ded52f1ed1958ffaa8..HEAD
```

Owner runtime must then retest the same/equivalent ~497s Standard case. Expected sequence: underfilled draft -> Standard duration recompose with output/context telemetry -> Standard duration guard PASS -> exactly one TTS start.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner runtime: RETEST WAITING after exact-head FAIL.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.

## Next action
Static checks first, then Owner long-video Standard retest. Do not broaden into TTS/P2/P3/Remix/Prompt Manager.
