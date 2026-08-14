# PIPELINE1-STANDARD-LONG-VIDEO-012

Status: APPROVED FOR PM DIRECT EXECUTION

## Repository / exact failing basis
- Repository: `thucnv2303/video-subtitle-remover`
- Failing runtime branch: `review/PIPELINE1-LOG-OBSERVABILITY-009`
- Exact Owner-tested failing HEAD: `6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
- Corrective review branch: `review/PIPELINE1-STANDARD-LONG-VIDEO-012`
- Starting SHA: `6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
- New bug: `BUG-041`
- Sibling tasks/PRs remain separate: #52 log observability, #53 Prompt Manager, #54 per-Job Remix.

## Owner runtime evidence — 2026-08-14
Standard mode, one source video ~497.1s (~8m17s), clone voice, exact tested HEAD `6bc43e65726150a3dbef37ded52f1ed1958ffaa8`:
- ASR PASS: 7 transcript segments.
- Adaptive Vision PASS: safety cap 80 keyframes, 10 chunks.
- All 10 Vision chunks PASS with `gemma4:12b`.
- Global reasoning PASS with `qwen3-coder:30b`, draft narration 922 chars, quality clean, CJK=0.
- Voice-aware narration budget: `7792-8202` chars.
- Standard pre-TTS duration guard correctly detected underfilled draft and attempted grounded recompose.
- Recompose request logged `output_limit=2200 token` and failed with HTTP 400 before TTS.
- Final failure: `Standard narration duration recompose / qwen3-coder:30b: Standard duration recompose: HTTP 400`.

This is NOT a TTS/Voice Render failure. The Job fails in the Standard pre-TTS recompose request.

## Verified source defects
Exact source `src/main/p1-standard-vision-wrapper.js` at failing SHA:
1. `standardEvidenceContext()` can include up to 20 chunk summaries/evidence plus up to 80 detailed scenes in one recompose request. Long-video input size therefore scales aggressively with sampled evidence.
2. `ollamaNarrationRequest()` computes desired output from `targetChars` but hard-caps `num_predict` at 2200 tokens. For the observed 7792-8202 character target, the source itself requests a hard output contract much larger than the fixed generation ceiling can reliably satisfy.
3. Recompose request does not set an explicit `num_ctx`, so its input + requested long output depends on the local Ollama/model context allocation.
4. When Ollama returns non-2xx, wrapper discards the response body and reports only `HTTP <status>`, hiding the real server reason.
5. Current hard duration/quality/CJK gates are intentional current Standard behavior and must NOT be removed in this task.

## Product outcome
A long Standard video must be able to reach the existing grounded pre-TTS duration gate without one monolithic request exceeding its own output/context budget. The correction must preserve the current 95-100% Standard narration target, grounded evidence requirement, ZERO-CJK gate, repetition gates, single retry policy, cancellation, and TTS-after-guard ordering.

## Implementation scope
Allowed application source only:
- `src/main/p1-standard-vision-wrapper.js`

Required project-state docs may be updated separately after source publication/review.

Forbidden:
- no TTS engine / Voice Render changes;
- no renderer P1 queue/UI changes;
- no P2/P3 changes;
- no Prompt Manager/per-Job Remix/log source changes;
- no dependency changes;
- no removal/relaxation of CJK/repetition/grounding gates;
- no removal of the current Standard duration target;
- no unrelated formatting/refactor.

## Corrective design — Runtime Revision 1
### 1. Bounded, timeline-preserving evidence context
Replace the current large scene dump with a compact context that still covers the whole video:
- keep all available chronological chunk summaries (bounded by existing max chunk count);
- reduce per-chunk evidence/conflict field sizes;
- choose only representative scenes distributed across chunks/time rather than blindly taking the first 80;
- keep summary/insights compact;
- emit telemetry for serialized evidence-context size.

Do not drop late-video coverage just to make the payload small.

### 2. Output budget must scale with the actual hard target
For the recompose request:
- compute `num_predict` from `targetChars` with enough headroom for the required narration JSON;
- remove the fixed 2200-token ceiling for long narration;
- keep a finite upper safety bound;
- log the selected output limit.

### 3. Explicit bounded context budget
- estimate request size conservatively from the actual system/user prompt text;
- choose an explicit `num_ctx` bucket sufficient for estimated input + requested output + safety headroom;
- use finite buckets (e.g. 8K/16K/32K) with a hard maximum;
- log selected `num_ctx` and estimated input size;
- do not request unbounded context.

### 4. Long-generation timeout
- keep a finite timeout;
- scale timeout for long generation so a valid 5k-6k token narration is not killed by the old fixed 150s limit;
- preserve Owner cancellation behavior.

### 5. Preserve server error detail
For non-2xx Ollama responses:
- read the JSON/text response body;
- surface the sanitized `error` detail in the Job error/log;
- do not log request payload, transcript, localStorage, keys, or raw private data.

### 6. Validation remains fail-closed
After generation, retain current deterministic checks:
- JSON parse;
- hard narration char range;
- ZERO CJK;
- repeated sentence / near-duplicate / repeated 10-word phrase;
- retry only the existing bounded retryable contract failures.

## Verification
Required source review:
- correction diff is only `src/main/p1-standard-vision-wrapper.js` from this spec commit to source commit;
- representative-scene selection covers first/middle/final chunks;
- `num_predict`, `num_ctx`, timeout are finite and target-aware;
- non-2xx error detail is preserved without sensitive payload logging;
- current quality and cancellation logic remains.

Required executable checks on exact final checkout:
```text
node --check src/main/p1-standard-vision-wrapper.js
git diff --check 6bc43e65726150a3dbef37ded52f1ed1958ffaa8..HEAD
```

Recommended deterministic helper simulation/review:
- short target (~1600 chars) remains bounded and behavior-compatible;
- observed long target (~8000 chars) receives materially more than 2200 output tokens;
- estimated request selects finite context bucket >= estimated input + output headroom;
- representative scene sampling includes beginning/middle/end of available timeline.

## Owner runtime acceptance
Retest the same/equivalent ~497s Standard video on exact corrected HEAD:
1. ASR/Vision/global reasoning continue to PASS.
2. Underfilled clean draft enters Standard duration recompose.
3. Recompose log shows bounded compact evidence plus target-aware output/context/timeout values; output limit is not 2200 for ~8k-char target.
4. No opaque bare `HTTP 400`; if Ollama rejects, the exact server reason is visible.
5. Expected success path: `Standard duration guard PASS` occurs before TTS.
6. TTS then starts exactly once using the accepted narration.
7. Narration remains grounded, natural, ZERO-CJK and non-repetitive; no filler/hallucinated process solely to hit length.

## Gates
- Execution: APPROVED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: FAIL on exact starting SHA / corrected retest WAITING.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
