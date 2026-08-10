# Decisions

## D-001
Do not rewrite the whole project before determining the last known good state.

## D-002
Each task must solve one narrowly scoped, verifiable objective.

## D-003
Every source-code task must update required .ai memory.

## D-004
Preserve working voice clone, TTS and hard-subtitle removal engines.

## D-005
Strict three-pipeline responsibility boundaries.

## D-006
Pipeline 1 analyzes original video.

## D-007
Pipeline 3 uses Pipeline 2 clean video by default.

## D-008
Source fingerprint and artifact boundaries.

## D-009
Pipeline 1 is the current technical priority.

## D-010
Owner manual verification blocks merge for source-code tasks.

## D-011 — Temporarily close Pipeline 1 at the current functional checkpoint
On 2026-08-10 the Owner decided to stop further Pipeline 1 refinement for now and accept the current functional checkpoint as the working P1 reference for subsequent project work. The accepted runtime evidence proves the core multimodal analysis/remix/TTS/artifact chain and gated P1→P2 handoff. The latest Start/Stop and log-coalescing UX revision was not separately re-run by the Owner and therefore remains deferred rather than PASS. This decision does not authorize merge of PR #41; merge remains subject to the normal explicit merge gate.
