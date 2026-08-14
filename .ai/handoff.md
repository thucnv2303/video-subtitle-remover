# AgentOS Handoff Status

## Active task
`PIPELINE1-STANDARD-CJK-GUARD-008`

## Status
PROMPT CONTRACT FIX PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Parent branch/PR: `review/PIPELINE1-SEMANTIC-REMIX-007` / #48
- Corrective branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`
- Corrective Draft PR: #51
- Starting SHA: `7df7e45c277feb56b5a8a45195007f5e41b69638`
- Source correction: `e2cf430971fb75d5ef794fafc6879e35ba0a608e`

## Latest Owner runtime evidence
The prior ordering correction is proven effective. Standard/default OFF reached `Standard duration guard`, first grounded recompose returned a 1610-char candidate, and the retry retained that rejected candidate. Both attempts failed only because `CJK_CHARACTERS` remained, so P1 stopped before TTS.

## Root cause
The recompose request includes full transcript/Vision evidence that may contain CJK source text, but the prompt previously said only `không CJK lạc ngữ cảnh`. That wording did not create a strict source/output boundary, so qwen3-coder:30b could copy source glyphs into otherwise valid narration. The deterministic CJK gate correctly rejected the result.

## Published correction
Commit `e2cf430971fb75d5ef794fafc6879e35ba0a608e` modifies only `src/main/p1-standard-vision-wrapper.js` (+14/-4): source CJK is INPUT-ONLY; output must be ZERO CJK; uncertain text must be omitted rather than guessed; retry gets the exact `cjk_count`; and the model is instructed to self-scan before returning JSON. Hard duration/CJK/repetition validation remains unchanged. No sanitizer, extra retry, P2/P3/TTS/dependency change.

## Verification
- Source publication: PASS.
- Source isolation: PASS.
- Exact-head syntax/diff: WAITING.
- Code review final confirmation: WAITING.
- Owner Standard runtime: WAITING after static PASS.
- Owner Semantic: ON HOLD.
- Documentation synchronization: PASS.
- Merge: BLOCKED.

## Next action
Owner fetches/checks out `review/PIPELINE1-STANDARD-CJK-GUARD-008`, confirms exact HEAD, runs Node syntax checks and `git diff --check 7df7e45c277feb56b5a8a45195007f5e41b69638..HEAD`. If static PASS, rerun Standard/default OFF. Acceptance requires hard-range narration with deterministic `cjk=0` before one full-text TTS request.
