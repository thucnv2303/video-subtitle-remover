# Bug Ledger

| ID | Hiện tượng | Bằng chứng | Root cause | Status | Phân loại |
|---|---|---|---|---|---|
| BUG-001 | Chưa kiểm kê toàn bộ bugs | N/A | Chưa rõ | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chưa wire button `btn-export-final` vào `finalizeVideo` | Code inspection | Chưa implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chưa load video khi job finished | Code inspection | Chưa implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching/shared global state may create concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED — NOT RUNTIME VERIFIED |
| BUG-005 | P1 multimodal chain previously timed out and later reached a technical runtime checkpoint with vision + reasoning + TTS. | Owner runtime evidence PR #41 | Multimodal model/resource/observability defects were revised. | CLOSED AT OWNER P1 FUNCTIONAL CHECKPOINT; further editorial/UX refinement deferred | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-006 | Frontend timed out waiting for OCR/SRT because the expected WebSocket SRT result was not observed during an earlier test. | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls for AI rewrite, TTS, re-extraction and replacement-audio upload produced no action during earlier owner testing. | Runtime baseline | NOT YET VERIFIED | OPEN/RETEST REQUIRED | RUNTIME VERIFIED |
| BUG-008 | Video vừa thêm vào Pipeline 1 xuất hiện ngay ở Pipeline 2 trước khi P1 hoàn tất; shared generic `job.status` also let the legacy P2 runner risk consuming a P1 queued job. | Owner observation + direct source inspection; Owner runtime retest on PR #40 dated 2026-08-10 | P1/P2 shared `state.jobs` and generic status without a handoff gate | RESOLVED — OWNER RUNTIME PASS PR #40 | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-009 | P2 UI enters processing but stays at 0%; result preview does not update; Console repeats status polling; action area shows `error: backend not available`; no real GPU load is observed. | Owner runtime screenshot/observation on PR #42, 2026-08-10 + direct source review | `api/server.py` expects ignored local `video-subtitle-remover-ref` inside the active worktree. A clean linked worktree lacks it, leaving `HAS_BACKEND=False`. Renderer also ignores `/api/preview` until completion and does not fail frontend state immediately on backend error. | REVISION PUBLISHED — WAITING OWNER RETEST AFTER PM REVIEW | RUNTIME VERIFIED + CODE OBSERVED |
