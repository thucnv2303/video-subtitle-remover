# PIPELINE1-STANDARD-LONG-VIDEO-012 — Runtime Revision 3: Chunked Standard Narration

Status: APPROVED FOR PM DIRECT EXECUTION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Corrective branch / Draft PR: `review/PIPELINE1-STANDARD-LONG-VIDEO-012` / #55
- Remote Revision-2 head before this amendment: `f2b382ff969f8a2f20ac59032073bbaeb16ef3bd`
- Revision-2 application source: `6e047bf120dde6543386c50c725bf8f73418d441`
- Original failing basis: `review/PIPELINE1-LOG-OBSERVABILITY-009@6bc43e65726150a3dbef37ded52f1ed1958ffaa8`
- Bug: `BUG-041`

## Fresh Owner runtime evidence — 2026-08-14
Owner reports testing the new Revision-2 build. Exact local `git rev-parse HEAD` was not pasted in this message, so exact tested SHA remains to be reconfirmed before Owner PASS can be recorded.

The runtime signature proves the Revision-2 grammar correction is active:
- source video: ~497.1s Standard mode;
- ASR PASS: 7 SRT segments;
- Vision PASS: 80 keyframes / 10 chunks;
- global reasoning PASS: clean 1051-char draft;
- hard narration target: 7792-8202 chars;
- long recompose telemetry: evidence=11255 chars, input≈7792 tokens, output_limit=5772, num_ctx=16384, timeout=380s;
- prior sampler/grammar HTTP 400 does NOT recur;
- first recompose returns only 1610 chars and is rejected by deterministic `NARRATION_LENGTH_OUT_OF_BUDGET`;
- retained-candidate retry again returns 1610 chars and fails before TTS.

## Verified root cause class
Revision 2 still asks one reasoning request to expand a ~1k draft into one ~8k continuous narration. The request does not time out; the model stops normally with ~1610 chars, far below the requested hard target, and repeats that behavior on the one permitted retry.

This is now a generation-decomposition problem, not token ceiling, context sizing, grammar initialization or TTS.

## Product decision
For long Standard videos, do not ask one model call to author the entire long narration. Compose chronological narration sections from local timeline evidence, validate each section, join them, then run the existing deterministic global length/CJK/repetition gates before TTS.

Short/medium behavior remains single-request to avoid unnecessary regression and latency.

## Application source scope
Allowed source for Revision 3:
- `src/main/p1-standard-vision-wrapper.js`

No change to:
- `src/main/p1-standard-vision-ipc.js`;
- renderer / Job Queue / Remix UI;
- TTS engine / Voice Render;
- P2/P3;
- Prompt Manager;
- log router;
- dependencies.

## Required design
### 1. Long-mode trigger
Use chunked composition only when:
- global narration target is materially long (target > ~3200 chars); and
- at least 2 chronological Vision chunks exist.

Otherwise retain the current single-request recompose path.

### 2. Adaptive contiguous section plan
- Build chronological groups from the existing compact Vision chunks.
- Target roughly <=1700 narration chars per section.
- Section count = ceil(global target / section target), bounded by available Vision chunks and at least 2 for long mode.
- Never reorder chunks.
- For the observed 10-chunk / ~8k-char case, expected plan is about 5 sections, normally two Vision chunks per section.

### 3. Exact global budget allocation
- Allocate global min/target/max narration characters across sections proportionally to section timeline duration.
- Account for join separators so section budgets sum back into the existing global hard range.
- Do not lower the existing 95-100% Standard duration contract.

### 4. Local transcript + local visual evidence
- Parse the existing full SRT in the wrapper and select only transcript blocks overlapping each section range.
- Filter compact Vision chunks/scenes to the same section range/chunk IDs.
- Do not send the whole transcript and whole 10-chunk evidence to every section call.
- Preserve first/middle/final timeline coverage.

### 5. Sequential section generation
For each section:
- call the same selected reasoning model sequentially, never concurrent GPU requests;
- JSON shape remains `{ narration_script: string }` without large grammar length constraints;
- use section-specific min/target/max budget;
- allow exactly one retained-candidate retry for retryable JSON/length/quality failures;
- include previous accepted section tail only as continuity context;
- only section 1 may open the narration;
- only final section may conclude or include CTA;
- no scene labels, bullets, numbering or SRT in generated narration;
- ZERO CJK, no repetition/filler/hallucinated claims.

### 6. Global fail-closed validation
After joining accepted sections:
- compact into one continuous narration;
- deterministic global character range must still PASS;
- deterministic ZERO-CJK, repeated sentence, near-duplicate sentence and repeated 10-word phrase gates must still PASS;
- do not use a final monolithic AI rewrite to hide section failures;
- TTS starts only after global guard PASS.

### 7. Telemetry
Required logs:
- long-mode plan: section count and global target;
- each section: index/total, timeline range, local hard target, local transcript/evidence size, output limit/context/timeout;
- each accepted section char count;
- final joined narration chars + global quality report;
- failure identifies exact section.

No raw private transcript/payload dump in logs.

## Expected observed-case behavior
For global target 7792-8202 chars and 10 Vision chunks:
- approximately 5 sequential section requests;
- each section target around 1.5k-1.7k chars depending on exact duration;
- the model's observed ~1610-char natural output is now compatible with a section contract rather than being rejected as an 8k failure;
- final joined narration remains one continuous script and must pass the original global guard.

## Verification
Required static on exact final head:
```text
node --check src/main/p1-standard-vision-wrapper.js
git diff --check 6bc43e65726150a3dbef37ded52f1ed1958ffaa8..HEAD
```

Required source review:
- Revision-3 application diff only touches `src/main/p1-standard-vision-wrapper.js`;
- single-request path remains for short/medium target;
- long section plan is chronological and bounded;
- SRT filtering cannot silently use future sections as local transcript;
- section budgets sum to global hard range;
- sequential cancellation uses the existing shared AbortController;
- global quality gate remains fail-closed;
- no TTS invocation is moved earlier.

## Owner runtime acceptance
Retest same/equivalent ~497s Standard source on exact new head:
1. 10 Vision chunks/global reasoning complete as before.
2. Underfilled draft selects `chunked`/sectioned Standard recompose, not a single 7792-8202 request.
3. Log shows about 5 chronological sections with local targets around ~1.5k-1.7k.
4. Every section reaches PASS or identifies a precise section failure.
5. Joined narration reaches global 7792-8202 range and global quality PASS.
6. `Standard duration guard PASS` appears before TTS.
7. Exactly one TTS starts using the joined narration.
8. Listening check: coherent transitions, no repeated openings/CTA, no filler, no CJK, no unsupported process claims.

## Semantic Remix sibling
PR #54 remains the authoritative per-Job Semantic Remix implementation. PR #55 does not contain its renderer source, so the global Remix checkbox is expected in this isolated branch. Do not mix PR #54 into Revision-3 source. After BUG-041 source is stable/code-reviewed, create an explicit integration branch for the next combined Owner build if required.

## Gates
- Revision-2 Owner runtime: FAIL (exact local SHA reconfirmation pending).
- Revision-3 Execution: APPROVED.
- Revision-3 Static: WAITING.
- Revision-3 Code review: WAITING.
- Owner runtime: WAITING after publication.
- Documentation synchronization: PARTIAL.
- Merge: BLOCKED.
