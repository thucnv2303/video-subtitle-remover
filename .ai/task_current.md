# Current Task

## Task ID
PIPELINE1-STANDARD-CJK-GUARD-008

## Status
PROMPT_CONTRACT_FIX_PUBLISHED_STATIC_OWNER_RETEST_WAITING

## Authority
- Parent task: `PIPELINE1-SEMANTIC-REMIX-007`.
- Parent branch/PR: `review/PIPELINE1-SEMANTIC-REMIX-007` / #48.
- Corrective branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- Corrective Draft PR: #51.
- Starting SHA: `7df7e45c277feb56b5a8a45195007f5e41b69638`.
- Source correction: `e2cf430971fb75d5ef794fafc6879e35ba0a608e`.

## Latest Owner failure
On the ~97.57s Standard regression case, the corrected pre-TTS ordering worked: a 585-char draft reached the grounded duration guard, the first recompose produced 1610 chars, and retry preserved that rejected candidate. Both attempts still failed deterministic `CJK_CHARACTERS` before TTS.

## Root cause
The recompose prompt treated CJK as a general language-quality preference while full transcript/Vision evidence can legitimately contain source CJK text. The model can copy a few source glyphs into the output. This is a prompt/source-boundary defect; the deterministic zero-CJK gate is behaving correctly.

## Corrected behavior
- Transcript/Vision CJK is explicitly INPUT-ONLY.
- `narration_script` must contain ZERO Han/Hiragana/Katakana/Hangul glyphs.
- Uncertain CJK-only textual evidence must be omitted rather than copied or guessed.
- Retry receives `cjk_count` and must repair the retained candidate, not restart from the short draft.
- Model must self-scan before returning JSON.
- Existing hard length and repetition/CJK validators remain unchanged.
- No output sanitizer, extra retry, P2/P3/TTS/dependency change.

## Verification
- Source publication: PASS.
- Source isolation: PASS — only `src/main/p1-standard-vision-wrapper.js`, +14/-4 from starting SHA.
- Exact-head syntax/diff: WAITING.
- Code review final confirmation: WAITING.
- Owner Standard corrected runtime: WAITING after static PASS.
- Owner Semantic: ON HOLD.
- Documentation synchronization: PASS.
- Merge: BLOCKED.

## Next verification
Checkout corrective branch #51, verify exact HEAD, run `node --check src/main/p1-standard-vision-wrapper.js`, `node --check src/main/p1-standard-vision-ipc.js`, and `git diff --check 7df7e45c277feb56b5a8a45195007f5e41b69638..HEAD`. If clean, rerun Standard/default OFF and require `cjk=0` before TTS.
