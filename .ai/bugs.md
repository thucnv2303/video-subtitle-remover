# Bug Ledger

| ID | Hiện tượng | Bằng chứng | Root cause | Status | Phân loại |
|---|---|---|---|---|---|
| BUG-001 | Chưa kiểm kê toàn bộ bugs | N/A | Chưa rõ | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chưa wire button `btn-export-final` vào `finalizeVideo` | Code inspection | Chưa implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chưa load video khi job finished | Code inspection | Chưa implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching/shared global state may create concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED — NOT RUNTIME VERIFIED |
| BUG-005 | P1 multimodal chain previously timed out and later reached a technical runtime checkpoint with vision + reasoning + TTS. | Owner runtime evidence PR #41 | Multimodal model/resource/observability defects were revised. | CLOSED AT OWNER P1 FUNCTIONAL CHECKPOINT; further editorial/UX refinement deferred | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-006 | Frontend timed out waiting for OCR/SRT because expected WebSocket SRT result was not observed during an earlier test. | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls produced no action during earlier owner testing. | Runtime baseline | NOT YET VERIFIED | OPEN/RETEST REQUIRED | RUNTIME VERIFIED |
| BUG-008 | Video added in P1 appeared in P2 before P1 completed. | Owner observation + source inspection; Owner retest PR #40 | Shared jobs/status without handoff gate | RESOLVED — OWNER RUNTIME PASS PR #40 | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-009 | P2 previously stayed at 0% with no real STTN execution. | Owner runtime PR #42 + source review | Runtime/backend reference and renderer fail-fast/live-preview issues | RUNTIME REVISION EFFECTIVE; superseded by narrower bugs | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-010 | Manual ROI overlay appeared shifted. | Owner observation + PR #43; fresh single-job retest generally correct | Legacy wrapper geometry | OWNER SINGLE-JOB RETEST REPORTED OK — MULTI-JOB COVERAGE PENDING | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-011 | Manual regions lost independent mask mode. | Owner observation + PR #43 | Region state lacked independent `maskMode` | OWNER SINGLE-JOB RETEST REPORTED OK — MULTI-JOB COVERAGE PENDING | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-012 | P2 Console contained expected frame/preview noise. | Owner runtime log + PR #43 | Missing targeted log coalescing | OWNER SINGLE-JOB RETEST REPORTED OK — MULTI-JOB COVERAGE PENDING | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-013 | P1 multi-job batch stops after one Job errors; later Job remains queued. | Owner screenshot/log 2026-08-10 + source inspection | Legacy queue only advanced on finished | CODE REVIEW PASS PR #44 — OWNER TWO-JOB RETEST READY | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-014 | P1 selection/detail does not reliably follow actual processing Job. | Owner screenshot 2026-08-10 + source inspection | Processing state set before selected/detail synchronization | CODE REVIEW PASS PR #44 — OWNER TWO-JOB RETEST READY | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-015 | Ollama reasoning completes but malformed structured JSON causes P1 parse failure. | Owner log 2026-08-10 + source inspection | No bounded malformed-JSON retry in P1 orchestration | CODE REVIEW PASS PR #44 — OWNER TWO-JOB RETEST READY | RUNTIME VERIFIED + CODE OBSERVED |
