# Active PM Execution Spec

Status: PIPELINE1_STANDARD_LONG_VIDEO_012_SOURCE_REVISION_1_OWNER_RETEST_WAITING

Task: `PIPELINE1-STANDARD-LONG-VIDEO-012`
Repository: `thucnv2303/video-subtitle-remover`
Failing runtime basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
Corrective review branch: `review/PIPELINE1-STANDARD-LONG-VIDEO-012`
Task spec: `.ai/task_specs/PIPELINE1-STANDARD-LONG-VIDEO-012.md`
Spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`
Source Revision 1: `0547593fa7de7986d2202683847b27bf1e26ec42`
Bug: `BUG-041`

## Execution authority
No further application-source change is authorized until static verification and fresh Owner long-video runtime evidence are collected.

## Current source behavior
- Long Standard pre-TTS recompose uses compact timeline-preserving evidence.
- Output budget scales with the actual narration target and is finitely capped.
- Ollama context is explicitly chosen from finite 8K/16K/32K buckets.
- Long-generation timeout scales but remains finite.
- Non-2xx Ollama response detail is sanitized and surfaced.
- Existing duration/CJK/repetition/grounding/cancellation gates remain fail-closed.

## Required verification
1. Exact current branch HEAD.
2. `node --check src/main/p1-standard-vision-wrapper.js`.
3. `git diff --check 6bc43e65726150a3dbef37ded52f1ed1958ffaa8..HEAD`.
4. Retest the same/equivalent ~497s Standard video.
5. Expected success: underfilled draft -> recompose telemetry with target-aware output/context -> `Standard duration guard PASS` -> one TTS start.
6. If failure remains, capture exact sanitized server reason and recompose telemetry.

## Separate tasks
PR #52 log observability, PR #53 Prompt Manager, and PR #54 per-Job Remix remain separate. No source mixing is authorized.

## Merge
BLOCKED.
