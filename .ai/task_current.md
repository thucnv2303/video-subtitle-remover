# Current Task

## Task ID
RECOVERY-006

## Name
Pipeline 1 Baseline Characterization

## Goal
Capture and verify the current Pipeline 1 behavior before any architecture
refactoring or feature implementation.

## Status
NOT STARTED — RECOVERY-005 audit documentation commit must be created first.

## Required baseline

- Use one fixed Chinese product-review sample video.
- Record the exact sample path, duration and basic metadata.
- Run the current application without source modification.
- Verify video import and job creation.
- Verify the current OCR/ASR path.
- Record extracted subtitle/text output.
- Verify the AI rewrite path.
- Verify existing-voice TTS.
- Verify cloned-voice TTS.
- Verify generated timed SRT.
- Record relevant frontend state fields.
- Record API requests and responses where observable.
- Record actual generated filenames, paths and extensions.
- Record errors, missing bindings and unexpected behavior.
- Compare runtime results with the RECOVERY-005 code audit.

## Allowed

- Run the existing application.
- Use one fixed test video.
- Inspect application logs.
- Inspect generated output files.
- Record runtime evidence in .ai documentation.
- Ask the owner to perform and confirm manual app actions.

## Forbidden

- No source-code changes.
- No patch scripts.
- No dependency installation.
- No refactoring.
- No route changes.
- No UI binding fixes.
- No Pipeline 2 changes.
- No Pipeline 3 implementation.
- No staging or commit until separately approved.

## Required verification status

- Automated verification: WAITING
- Code review: NOT APPLICABLE unless source unexpectedly changes
- Owner manual app verification: WAITING
- Merge permission: BLOCKED
