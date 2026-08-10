# Bug Ledger

| ID | Hiện tượng | Bằng chứng | Root cause | Status | Phân loại |
|---|---|---|---|---|---|
| BUG-001 | Chưa kiểm kê toàn bộ bugs | N/A | Chưa rõ | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chưa wire button `btn-export-final` vào `finalizeVideo` | Code inspection | Chưa implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chưa load video khi job finished | Code inspection | Chưa implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching and shared-state concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED — NOT RUNTIME VERIFIED |
| BUG-005 | Full Pipeline 1 Start completed ASR but skipped AI Rewrite and TTS in the Owner handoff test; enabled-stage failures could also be swallowed and still lead to P1 completion. | Owner runtime PR #40 + direct canonical source inspection on 2026-08-10 | Approved P1 UI removed legacy AI/TTS checkboxes while jobs still defaulted to `aiRewrite=false` / `ttsGenerate=false`; Start All did not snapshot visible provider/model/prompt/voice into jobs. AI/TTS helpers logged failures and returned normally instead of rejecting. | FIX CANDIDATE — `review/BUG-005-P1-FULL-CHAIN` — CODE REVIEW REQUIRED | RUNTIME VERIFIED + ROOT CAUSE CODE VERIFIED |
| BUG-006 | Frontend timed out waiting for OCR/SRT because the expected WebSocket SRT result was not observed during the test. | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls for AI rewrite, TTS, re-extraction and replacement-audio upload produced no action during owner testing. | Runtime baseline | NOT YET VERIFIED | OPEN/RETEST REQUIRED | RUNTIME VERIFIED |
| BUG-008 | Video vừa thêm vào Pipeline 1 xuất hiện ngay ở Pipeline 2 trước khi P1 hoàn tất; shared generic `job.status` also let the legacy P2 runner risk consuming a P1 queued job. | Owner observation + direct source inspection; Owner runtime retest on PR #40 dated 2026-08-10 | P1/P2 shared `state.jobs` and generic status without a handoff gate | RESOLVED — OWNER RUNTIME PASS PR #40 | RUNTIME VERIFIED + CODE OBSERVED |
