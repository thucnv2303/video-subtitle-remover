# Current Task

## Task ID
PIPELINE3-EDITOR-REBUILD-016

## Status
OWNER_FLOW_SMOKE_PASS_PRODUCT_SCOPE_REFINED_NEEDS_REVISION

## Exact basis
- Branch / Draft PR: `review/PIPELINE3-EDITOR-REBUILD-016` / #58.
- Starting SHA: `abfe33510523b800654dcf3b1b56f25f4ccd43d1`.
- Main spec: `.ai/task_specs/PIPELINE3-EDITOR-REBUILD-016.md`.
- Pre-feedback tested build: `8f0d502ea1c544deb083bedab9d6c7a4510f38c5`.

## Owner product clarification — 2026-08-14
Pipeline 3 is NOT intended to become a broad general-purpose NLE.
Its main job is:
1. combine P2 clean video with P1 voice;
2. create and style new subtitles primarily to cover residual/blemished areas left after burned-in subtitle removal;
3. adjust voice speed and/or video speed conservatively so narration and picture fit naturally;
4. export a high-quality final video.

This means subtitle presentation/placement, voice-video fit and high-quality export are the product center. General editor features such as arbitrary clip rearrangement, complex transitions, masks, broad multi-track editing and plugin systems are non-goals unless later required by this focused workflow.

## Current V2 result
The current editor proves useful foundations:
- visible Job Manager;
- aspect-correct preview;
- direct subtitle drag;
- per-Job subtitle style state;
- timed cue preview/timeline;
- derived ASS positioning;
- voice-retime subtitle timing bridge;
- re-render clean-source safety.

Owner reports the processing flow is OK, but the feature set is not yet deep enough in the areas that matter most.

## Required revision focus
### Subtitle-first
- richer style controls and presets;
- precise position/safe-zone placement;
- background/box design specifically useful for covering residual inpaint blemishes;
- cue text editing and timing adjustment where needed;
- preview/render parity for ASS styling;
- per-Job persistence.

### Voice/video fit
- show video duration, voice duration and ratio clearly;
- provide explicit strategy choices within safe bounds: keep video, fit voice; keep voice, fit video; balanced fit;
- preview the resulting durations/speeds before render;
- avoid extreme speed changes and block unsafe combinations.

### Audio composition
- original/background bed volume;
- optional original-vocal removal using existing support;
- voice level and simple fade controls only if supported by the actual render path.

### High-quality export
- preserve source resolution/FPS by default;
- expose only real codec/quality controls backed by ffmpeg/backend;
- quality presets should map to real CRF/bitrate/preset behavior, not UI-only labels;
- provide final output summary before render.

## Gates
- Execution: PASS for current V2 source.
- Automated/static: WAITING.
- Code review: PASS for current V2 logic only.
- Owner runtime: PARTIAL PASS for basic flow; FAIL for focused feature completeness.
- Documentation synchronization: PASS for clarified product intent.
- Merge: BLOCKED.

## Next action
Define a focused P3 V3 spec around Subtitle / Voice-Video Fit / Audio / High-Quality Export, verify current finalizer/backend capabilities, and only then implement missing controls. Do not expand into a general OpenCut-like NLE.
