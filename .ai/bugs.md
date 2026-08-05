# Bug Ledger

| ID | Hiện tượng | Bằng chứng | Root cause | Status | Phân loại |
|---|---|---|---|---|---|
| BUG-001 | Chưa kiểm kê toàn bộ bugs | N/A | Chưa rõ | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chưa wire button `btn-export-final` vào `finalizeVideo` | Code inspection | Chưa implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chưa load video khi job finished | Code inspection | Chưa implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching and shared-state concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED — NOT RUNTIME VERIFIED |
| BUG-005 | Pipeline 1 start action executed the Pipeline 2 inpainting/rendering path and generated an OCR temporary MP4 instead of completing the expected P1 text extraction flow. | Runtime baseline | NOT YET VERIFIED | CANDIDATE FIX REVIEWED — OWNER TEST PENDING | RUNTIME VERIFIED |
| BUG-006 | Frontend timed out waiting for OCR/SRT because the expected WebSocket SRT result was not observed during the test. | Runtime baseline | NOT YET VERIFIED | CANDIDATE FIX REVIEWED — OWNER TEST PENDING | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls for AI rewrite, TTS, re-extraction and replacement-audio upload produced no action during owner testing. | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-008 | AI settings has ambiguous combined API key/model field and no model scan/select UX | Owner screenshot | NOT YET VERIFIED | ACTIVE — BLOCKING AI ANALYSIS | OWNER OBSERVED |
| BUG-009 | Ollama rewrite contract treats model like API key entry | Code inspection | Ollama model is treated as an API-key entry in the rewrite contract | ACTIVE — BLOCKING AI ANALYSIS | CODE OBSERVED |
