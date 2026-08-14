# Current State

## Status
PIPELINE1-STANDARD-CJK-GUARD-008 — PROMPT CONTRACT FIX PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent task/review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Parent Draft PR: #48.
- Active corrective review branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- Active corrective Draft PR: #51.
- Corrective base SHA: `7df7e45c277feb56b5a8a45195007f5e41b69638`.
- Latest prompt-contract source commit: `e2cf430971fb75d5ef794fafc6879e35ba0a608e`.

## Latest Owner runtime evidence
Standard/default OFF on the ~97.57s regression case now reaches the intended grounded pre-TTS path. Global reasoning produced an underfilled 585-char draft with 2 CJK glyphs; the draft was correctly deferred to `Standard duration guard`. The first grounded recompose reached 1610 chars but failed `CJK_CHARACTERS`; the retained-candidate retry also failed `CJK_CHARACTERS`. TTS did not run.

## Verified root cause
The previous ordering defect is fixed. The remaining failure is prompt-contract weakness: the recompose request supplies full transcript and Vision evidence that may contain CJK source text, while the prompt only said `không CJK lạc ngữ cảnh`. qwen3-coder:30b can therefore copy a small number of source CJK glyphs into an otherwise valid narration, and the deterministic zero-CJK gate correctly rejects it.

## Published correction
Source commit `e2cf430971fb75d5ef794fafc6879e35ba0a608e` changes only `src/main/p1-standard-vision-wrapper.js` from `7df7e45...` (+14/-4):
- source CJK in transcript/Vision is explicitly INPUT-ONLY in the user message;
- narration output contract requires ZERO Han/Hiragana/Katakana/Hangul glyphs;
- source text that cannot be safely interpreted must be omitted rather than copied or guessed;
- a retry after CJK failure receives the deterministic `cjk_count` and an explicit mandatory repair instruction on the retained candidate;
- the model must self-scan the complete narration before returning JSON;
- hard duration range and deterministic CJK/repetition gates remain unchanged;
- no local output sanitization, no extra retry, no P2/P3/TTS/dependency change.

## Gates
- Execution: PASS for source publication.
- Source isolation: PASS — one application file only.
- Automated/static: WAITING on exact corrective head.
- Code review: WAITING exact-head static confirmation.
- Owner Standard runtime: FAIL on `7df7e45...`; RETEST WAITING on corrective head after static PASS.
- Owner Semantic runtime: ON HOLD until Standard PASS.
- Documentation synchronization: PASS for current corrective state.
- Merge permission: BLOCKED.

## Next permitted action
Owner checks out `review/PIPELINE1-STANDARD-CJK-GUARD-008`, verifies exact HEAD, runs Node syntax + diff checks, then reruns Standard/default OFF only if static PASS. Expected: grounded recompose must return hard-range narration with `cjk=0` before one full-text TTS request.
