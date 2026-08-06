# Bug Ledger

| ID | Hien tuong | Bang chung | Root cause | Status | Phan loai |
|---|---|---|---|---|---|
| BUG-001 | Chua kiem ke toan bo bugs | N/A | Chua ro | OPEN | NOT YET VERIFIED |
| BUG-002 | Pipeline 3 UI chua wire button btn-export-final vao finalizeVideo | Code inspection | Chua implement xong | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-003 | Step 3 video preview chua load video khi job finished | Code inspection | Chua implement | BLOCKED (P1 Priority) | CODE OBSERVED |
| BUG-004 | Global SubtitleRemover monkey-patching and shared-state concurrency risk | Audit RECOVERY-005 | Backend legacy design | ARCHITECTURAL RISK | CODE OBSERVED - NOT RUNTIME VERIFIED |
| BUG-005 | Pipeline 1 start action executed Pipeline 2 inpainting path and generated OCR tmp MP4 | Runtime baseline | NOT YET VERIFIED | CANDIDATE FIX REVIEWED - OWNER TEST PENDING | RUNTIME VERIFIED |
| BUG-006 | Frontend timed out waiting for OCR/SRT | Runtime baseline | NOT YET VERIFIED | CANDIDATE FIX REVIEWED - OWNER TEST PENDING | RUNTIME VERIFIED |
| BUG-007 | Manual Pipeline 1 recovery controls produced no action during owner testing | Runtime baseline | NOT YET VERIFIED | OPEN | RUNTIME VERIFIED |
| BUG-008 | AI settings ambiguous combined API key/model field and no model scan/select UX | Owner screenshot at abf0ee2 | Combined key/model UI and shared legacy storage | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |
| BUG-009 | Ollama rewrite contract treated model like API key entry | Code inspection | Ollama model inserted into API-key array | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | CODE OBSERVED |
| BUG-010 | DeepSeek API key visible in clear text in Settings UI | Owner screenshot at abf0ee2 | Keys stored in localStorage without encryption | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | SECURITY INCIDENT |
| BUG-011 | Kiểm tra kết nối did not call DeepSeek; only validated local input | Owner test at abf0ee2 | No real provider validation IPC | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |
| BUG-012 | Home page / Pipeline 1 layout visually broken | Owner test at abf0ee2 | Duplicated three-col wrapper in index.html | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |
| BUG-013 | Pipeline 1 AI selector did not offer or synchronize DeepSeek with Settings | Owner test at abf0ee2 | No aiModelChanged event or sync mechanism | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |

## RECOVERY-007E-AI-SETTINGS-001 candidate resolution
- Cloud API keys encrypted via safeStorage; fails closed if unavailable.
- Keys stored as hex ciphertext in userData/ai_keys.json; never in localStorage.
- Renderer never receives raw key after save.
- Python backend never receives raw key.
- DeepSeek GET /models called from main process for validation and model discovery.
- DeepSeek POST /chat/completions called from main process for AI rewrite.
- Renderer aiRewrite payload: { provider, model, prompt, srt_content } only.
- Legacy localStorage credential keys removed on settings mount.
- Home layout regression fixed by removing duplicated three-col wrapper.
- Pipeline 1 AI selector synchronized with Settings via aiModelChanged event.
- Status: CANDIDATE FIX - OWNER RETEST NOT STARTED.
