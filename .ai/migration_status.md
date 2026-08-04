# Trạng thái di chuyển thư mục (Migration Status)

*Cập nhật lần cuối: 2026-08-04*

## Frontend Modularization Status (CODE OBSERVED)
- Đang diễn ra modularization. Đã thiết lập module cho `store.js`, `logger.js`, `job-manager.js`, `pipeline1-ai.js`, `pipeline3-finalize.js`.

## Artifact Contract & Pipeline 1 (PROPOSED)
- Pipeline 1 is the current technical priority.
- Chuẩn bị audit Pipeline 1 để triển khai việc tạo toàn bộ các file JSON lưu tại `jobs/<job_id>/p1/`.
- Tích hợp source identity fingerprinting vào mọi artifact.

## Pipeline 3 Status (PROPOSED)
- Pipeline 3 implementation is not the next task. First perform a read-only audit of the current Pipeline 1 implementation and confirm the proposed artifact contract. Later work may proceed according to the resulting roadmap.

## Known Migration Risks (NOT YET VERIFIED)
- Identity matching giữa các outputs của P1 và P2 trong P3.
