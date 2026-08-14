# Current State

## Status
PIPELINE1-STANDARD-LONG-VIDEO-012 — SOURCE REVISION 1 PUBLISHED / PM SOURCE REVIEW PASS / STATIC WAITING / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Exact Owner-tested failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`.
- Corrective branch: `review/PIPELINE1-STANDARD-LONG-VIDEO-012`.
- Task spec commit: `57eef8ffed818fe8c2047c8df8e91efd9c6b3d29`.
- Source Revision 1: `0547593fa7de7986d2202683847b27bf1e26ec42`.
- Active bug: `BUG-041`.

## Verified Owner failure — 2026-08-14
Standard mode on a ~497.1s video completed ASR, 80-keyframe/10-chunk Vision, and global reasoning. The clean draft was only 922 chars against a voice-aware hard target of 7792-8202 chars. Standard pre-TTS duration recompose then failed before TTS with HTTP 400 on `qwen3-coder:30b`.

This is not a TTS/Voice Render failure. The failure occurs in Standard pre-TTS recompose.

## Verified source defects at failing HEAD
- Long-video recompose output was hard-capped at 2200 tokens even when the target narration required roughly 8k characters.
- One request included candidate + full transcript + a large visual context without explicit context sizing.
- Non-2xx Ollama responses discarded the server body and exposed only `HTTP <status>`.

## Revision 1 source state
Only `src/main/p1-standard-vision-wrapper.js` changed from the task spec commit.
- Evidence context is compacted while preserving chronological chunk coverage and representative scenes across the timeline.
- Recompose `num_predict` now scales with narration target and remains hard-capped at 8192.
- Request context uses finite 8K/16K/32K buckets via `options.num_ctx`, selected from a conservative input/output estimate.
- Long-generation timeout scales with output budget and is capped at 420s.
- Non-2xx Ollama body is read and only sanitized error detail is surfaced; transcript/request payload is not logged.
- Existing hard narration length, ZERO-CJK, repetition, bounded retry, cancellation, and TTS-after-guard behavior remains.

Official Ollama documentation confirms `/api/chat` accepts runtime `options`, structured JSON schema through `format`, and `num_ctx` is a valid runtime parameter.

## Verification
- Source isolation: PASS — spec -> source changes exactly one authorized application file.
- PM full-source review: PASS for scope/logic.
- Exact executable `node --check`: WAITING.
- Exact `git diff --check`: WAITING.
- GitHub CI/status: none configured yet for this revision.
- Owner ~497s corrected runtime: WAITING.

## Sibling tasks
- PR #52 log observability remains separate; Owner reported the log behavior fixed but final static/docs closeout is separate.
- PR #53 Prompt Manager remains separate.
- PR #54 per-Job Remix remains separate.

## Gates
- Execution: PASS.
- Automated/static: WAITING.
- Code review: PASS.
- Owner manual app verification: WAITING after prior exact-head FAIL.
- Documentation synchronization: PARTIAL until bug/QA ledgers and Owner outcome are closed out.
- Merge permission: BLOCKED.

## Next permitted action
Run exact static checks on the current corrective HEAD, then retest the same/equivalent ~497s Standard video. No further source revision is authorized without new runtime evidence.
