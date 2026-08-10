# Bug Ledger

| ID | Hiện tượng | Bằng chứng | Root cause | Status | Phân loại |
|---|---|---|---|---|---|
| BUG-001 | Chưa kiểm kê toàn bộ bugs | N/A | Chưa rõ | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chưa wire button `btn-export-final` vào `finalizeVideo` | Code inspection | Chưa implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chưa load video khi job finished | Code inspection | Chưa implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching/shared global state may create concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED — NOT RUNTIME VERIFIED |
| BUG-005 | P1 previously completed from ASR-only text and later multimodal revision reached original-video keyframe analysis but timed out in Ollama Stage C without model/progress observability. | Owner runtime FAIL PR #41 + direct source review on 2026-08-10 | Text-only candidate was insufficient; current multimodal IPC can require sequential vision/reasoning models, uses fixed 180s chat timeout, sends unbudgeted keyframes, and exposes no capability/model-load/generation telemetry. | NEEDS_REVISION — OWNER RUNTIME FAIL ON HEAD `6ce8d3e...` | RUNTIME VERIFIED + CODE OBSERVED |
| BUG-006 | Frontend timed out waiting for OCR/SRT because the expected WebSocket SRT result was not observed during the test. | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls for AI rewrite, TTS, re-extraction and replacement-audio upload produced no action during owner testing. | Runtime baseline | NOT YET VERIFIED | OPEN/RETEST REQUIRED | RUNTIME VERIFIED |
| BUG-008 | Video vừa thêm vào Pipeline 1 xuất hiện ngay ở Pipeline 2 trước khi P1 hoàn tất; shared generic `job.status` also let the legacy P2 runner risk consuming a P1 queued job. | Owner observation + direct source inspection; Owner runtime retest on PR #40 dated 2026-08-10 | P1/P2 shared `state.jobs` and generic status without a handoff gate | RESOLVED — OWNER RUNTIME PASS PR #40 | RUNTIME VERIFIED + CODE OBSERVED |
