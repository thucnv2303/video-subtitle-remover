# Bug Ledger

| ID | Hiện tượng | Bằng chứng | Root cause | Status | Phân loại |
|---|---|---|---|---|---|
| BUG-001 | Chưa kiểm kê toàn bộ bugs | N/A | Chưa rõ | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chưa wire button `btn-export-final` vào `finalizeVideo` | Code inspection | Chưa implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chưa load video khi job finished | Code inspection | Chưa implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching and shared-state concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED — NOT RUNTIME VERIFIED |
| BUG-005 | Pipeline 1 start action does not execute the intended Pipeline 1 processing flow. Historical runtime also showed start entering Pipeline 2/inpainting behavior; current Owner test on PR #39 again confirms Start is not usable for the intended P1 flow. | Runtime baseline + Owner runtime test PR #39 on 2026-08-09 | NOT YET VERIFIED | OPEN — DEFERRED UNTIL P1 UI ACCEPTANCE | RUNTIME VERIFIED |
| BUG-006 | Frontend timed out waiting for OCR/SRT because the expected WebSocket SRT result was not observed during the test. | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls for AI rewrite, TTS, re-extraction and replacement-audio upload produced no action during owner testing. | Runtime baseline | NOT YET VERIFIED | OPEN/RETEST REQUIRED | RUNTIME VERIFIED |
