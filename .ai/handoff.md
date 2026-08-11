# AgentOS Handoff Status

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006 — Voice-Aware Continuous Narration and Bounded Reasoning`

## Status
OWNER FAIL RECORDED / IMPLEMENTATION READY

## Review basis
- Failed parent head: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Parent Draft PR: #46.
- Active revision branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Exact spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Owner runtime evidence
- 24.30s video ended with 48.10s exported narration after pass 2 (197.9%): Owner FAIL.
- TTS synthesized 16 separate segments; Owner requires continuous narration from start to finish.
- Queue continuation itself still works: the next queued Job auto-started after the failed Job.
- A 17.6s Job completed Vision then remained in qwen3-coder global reasoning at 349s, close to the old 360s phase timeout.

## Verified engineering problem
- Final reasoning is built around `script_segments` rather than one narration string.
- Selected voice/speed are not part of the final reasoning budget.
- Legacy `/api/tts-retry` intentionally splits long text into multiple speech clips.
- PR #46 repair preserves the segmented SRT shape, so duration correction targets the wrong representation.
- Global reasoning duplicates scene generation already performed by Vision chunks, increasing latency and output size.

## Approved revision direction
- One continuous voice-aware narration string from global reasoning.
- Compact final schema; reuse Vision scene evidence.
- One full-text `/api/tts/generate` call per pass.
- Exact generated-audio duration is the gate authority.
- Subtitle segmentation only after audio generation.
- At most one whole-script fit + one re-TTS.
- Preserve safe sequential queue continuation and manual Job browsing; no concurrent heavy GPU inference.

## Gates
Execution NOT STARTED; automated/static WAITING; code review WAITING; Owner WAITING; docs sync PASS for failure intake/task definition; merge BLOCKED; Step 3 BLOCKED.

## Next action
Implement only the approved task on the active revision branch, then publish source evidence and run PM review before asking Owner to retest.
