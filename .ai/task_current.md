# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Voice-Aware Continuous Narration, Bounded Reasoning, and Narration Quality Gate

## Status
QUALITY_GATE_CODE_REVIEW_PASS_STATIC_AND_OWNER_RETEST_WAITING

## Authority
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Prior corrective source: `1c028612900b1180aa8c1e66da2d769373793c91`.
- Narration-quality source commit: `00e80aea06d526b34518dd069f9b1c581c80e77c`.
- PM narration-quality review: `4912002868` — PASS for source logic/scope.
- Spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Owner evidence already obtained
- Prior two-Job corrective runtime: both Jobs reported successful.
- Prior static commands: four `node --check` commands + `git diff --check` clean.
- Long input `97.57s`: 25 keyframes / 4 chunks / 8,8,8,1 frames; all Vision chunks completed.
- Long-input qwen reasoning: `48.2s`.
- Long-input TTS: `94.62s / 97.57s = 97.0%`; P1 completed and unlocked P2.

## New blocker
BUG-031: long narration hit the exact 1610-char upper bound and padded its ending by repeating the same CTA/value text multiple times; stray CJK text (`饱满`) also appeared. Duration PASS does not override narration-quality FAIL.

## New corrective implementation
1. Initial narration `min_chars` is now a soft target rather than a hard schema minimum; initial schema only requires non-empty text and enforces max length.
2. Prompt explicitly prioritizes natural quality over hitting the soft lower target and forbids padding/filler/repeated CTA.
3. Deterministic quality validation detects CJK characters, repeated long sentences, near-duplicate long sentences and repeated 10-word phrases.
4. Bad initial narration gets at most one narration-only quality repair; Vision is not rerun.
5. Duration-fit narration remains hard-bounded to the measured target range and is quality-checked again before final re-TTS.
6. If quality remains bad after its bounded repair, P1 fails closed.
7. No P2/P3/STTN/Settings/backend/TTS-engine source changes.

## Source scope
- New application source correction: `src/main/p1-vision-ipc.js` only.

## Verification completed
- GitHub compare `131f35c... -> 00e80aea...` shows exactly one changed source file.
- Direct GitHub source inspection confirms quality gate and soft initial lower bound.
- Deterministic simulation against Owner's bad narration detects `CJK_CHARACTERS`, `REPEATED_SENTENCE`, `REPEATED_LONG_PHRASE`.
- Clean Vietnamese sample passes the deterministic gate.
- PM narration-quality review PASS for logic/scope `4912002868`.
- No GitHub CI/status checks are configured.

## Verification still required
- Exact `node --check src/main/p1-vision-ipc.js` on new final docs/head.
- Exact `node --check src/main/preload.js`.
- Exact `node --check src/renderer/js/pipeline1-analysis.js`.
- Exact `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- Exact `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- `git rev-parse HEAD` to bind Owner evidence to exact tested head.
- Owner retest the 97.57s video or equivalent: narration has no repeated tail/CJK, remains natural and coherent, has no obvious subject/ingredient contradiction, final successful TTS stays 95–100%, and P1 completes.

## Gates
Execution PASS; automated/static WAITING on new final head; code review PASS for logic/scope; Owner quality retest WAITING; docs sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.