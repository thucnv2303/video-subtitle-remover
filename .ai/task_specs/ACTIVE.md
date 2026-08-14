# Active PM Execution Spec

Status: PIPELINE1_LOG_OBSERVABILITY_009_RESUMED_RUNTIME_REVISION_4_OWNER_RETEST_WAITING

Task: `PIPELINE1-LOG-OBSERVABILITY-009`
Repository: `thucnv2303/video-subtitle-remover`
Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`
Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52
Current pre-resume HEAD: `20f42653806b2ba048b8f598f3ade0d725169cca`
Revision-4 source head: `e25792663f9c66cfd54b25c4f60de61b14341e8e`

## Current authority
No new application-source revision is authorized until revision-4 runtime evidence is collected.

## Required Owner retest
1. Run P1 while P2 has never been started. P1 `[P1]`/`[Ollama]`/AI/TTS logs must remain in P1 and must not appear in P2 Console/Log.
2. Confirm P1 keyed progress and warning/error remain visible in P1.
3. Leave app idle >=30 seconds; successful health/TTS/GPU/preview polling must not accumulate in visible P2 log.
4. Run one P2 job; frame/progress must remain a single updating live row.
5. Confirm Copy/Clear in both consoles.

## If runtime still fails
Capture exact leaked P2 line text and whether P2 had an active job. Root-cause and authorize a narrow revision from those lines only. Do not add broad state-based filtering blindly.

## Separate task
Prompt Manager V2 / PR #53 remains separate. Do not edit Prompt Manager source on PR #52.

## Merge
BLOCKED.
