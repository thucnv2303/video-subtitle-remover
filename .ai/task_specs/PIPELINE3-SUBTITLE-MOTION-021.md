# PIPELINE3-SUBTITLE-MOTION-021

## Goal
Turn Pipeline 3 subtitle effects from a technical dropdown into a compact motion gallery with real preview/export parity, adding a grounded Typewriter mode and a speech-synced Karaoke/Word Follow mode that is available only when real karaoke timing exists.

## Authority
- Repository: `thucnv2303/video-subtitle-remover`
- Branch: `review/PIPELINE3-SUBTITLE-MOTION-021`
- Starting SHA: `d0476b88a77b4d0f1349d5faed22f3c98b386d59`
- Stacked on Owner-approved P3 layout task 020; PR #62 remains Draft/unmerged.

## Product decision
Do not clone CapCut wholesale. MVP 021 exposes a curated motion library backed by the existing P3 effect + ASS pipeline.

Groups:
- Basic: None, Fade, Pop, Slide Up/Down/Left/Right, Zoom In/Out, Blur In, Fade Up.
- Emphasis: Pulse.
- Reveal: Typewriter.
- Speech Sync: Karaoke / Word Follow, only when a real P1 karaoke ASS artifact is present.

## Behavioral rules
- Existing effects continue through the existing `p3Config.effect` path.
- Typewriter preview progressively reveals the current cue against the actual P3 video clock.
- Typewriter final export must post-process the derived ASS so libass/FFmpeg receives a real timed reveal, not a preview-only CSS animation.
- Typewriter intentionally disables preservation of original karaoke ASS because it needs a regenerated P3 ASS text event.
- Karaoke/Word Follow uses the real existing karaoke ASS timing; it must be disabled if the Job lacks karaoke timing.
- If final subtitle timing changes during P3 fit, existing safety remains authoritative: original karaoke timing is not preserved; speech-sync mode safely falls back rather than drifting.
- Do not synthesize fake word timing by evenly dividing words.

## Scope allowed
- new `src/renderer/js/pipeline3/subtitle-motion.js`
- `src/renderer/js/pipeline3/editor-store.js`
- `src/renderer/js/pipeline3/render-controller.js`
- bootstrap import in `src/renderer/js/pipeline1-run-config.js`

## Forbidden
- No P1/P2/TTS/backend changes.
- No dependency changes.
- No replacement of `subtitle-ass.js` architecture.
- No keyframe editor or large template marketplace in this task.
- No fake word-level timing.

## Acceptance
1. P3 effect area shows a clear gallery rather than requiring the old dropdown.
2. Existing effects remain selectable and preview as before.
3. Typewriter reveals cue text progressively while preview plays/seeks and renders as a real timed ASS effect in final output.
4. Switching away from Typewriter restores normal full cue text.
5. Karaoke/Word Follow is disabled with an explanatory state when no real karaoke timing exists.
6. With karaoke timing, selecting Karaoke/Word Follow preserves the real karaoke timing path when final timing is unchanged.
7. If P3 timing changes, karaoke preservation remains blocked/fallback-safe as before.
8. Per-Job motion config remains independent across job switching/re-render.
9. No regression to subtitle position/style, export quality, audio controls, or P3 layout.
10. Static: `node --check` all changed/new JS + `git diff --check d0476b88a77b4d0f1349d5faed22f3c98b386d59..HEAD`.

## Gates
Execution WAITING; automated/static WAITING; code review WAITING; Owner runtime NOT STARTED; docs sync PARTIAL; merge BLOCKED.
