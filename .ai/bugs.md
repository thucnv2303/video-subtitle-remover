# Bug Ledger

| ID | Hiện tượng | Bằng chứng | Root cause | Status | Phân loại |
|---|---|---|---|---|---|
| BUG-001 | Chưa kiểm kê toàn bộ bugs | N/A | Chưa rõ | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chưa wire button `btn-export-final` vào `finalizeVideo` | Code inspection | Chưa implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chưa load video khi job finished | Code inspection | Chưa implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching and shared-state concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED — NOT RUNTIME VERIFIED |
| BUG-005 | Full Pipeline 1 processing chain (ASR → AI rewrite → TTS/artifacts) was historically unusable / could enter wrong processing behavior. Current PR #40 runtime now shows Start executing the P1 ASR path and completing P1 when AI rewrite/TTS are skipped, but the full enabled AI+TTS chain is not yet verified. | Historical runtime + Owner runtime screenshot/report on PR #40 dated 2026-08-10 | Full-chain root cause not yet fully verified | OPEN — NARROWED; NEXT FUNCTIONAL FOCUS | RUNTIME VERIFIED PARTIAL |
| BUG-006 | Frontend timed out waiting for OCR/SRT because the expected WebSocket SRT result was not observed during the test. | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls for AI rewrite, TTS, re-extraction and replacement-audio upload produced no action during owner testing. | Runtime baseline | NOT YET VERIFIED | OPEN/RETEST REQUIRED | RUNTIME VERIFIED |
| BUG-008 | Video vừa thêm vào Pipeline 1 xuất hiện ngay ở Pipeline 2 trước khi P1 hoàn tất; shared generic `job.status` also let the legacy P2 runner risk consuming a P1 queued job. | Owner observation + direct source inspection; Owner runtime retest on PR #40 dated 2026-08-10 | P1/P2 shared `state.jobs` and generic status without a handoff gate | RESOLVED — OWNER RUNTIME PASS PR #40 | RUNTIME VERIFIED + CODE OBSERVED |
