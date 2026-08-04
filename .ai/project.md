# Project

## Product
Video Subtitle Remover

## Product Goal (OWNER CONFIRMED)
Tự động xử lý video review sản phẩm tiếng Trung thông qua 3 pipeline biệt lập nghiêm ngặt:
- Pipeline 1: Phân tích ORIGINAL video, trích xuất insight, remix kịch bản và sinh Voice/SRT.
- Pipeline 2: Xóa hard subtitle (trên ORIGINAL video) và output `clean_video.mp4` đồng bộ timeline với nguồn.
- Pipeline 3: Video Remix and Finalize.

## Current phase
RECOVERY AND AUDIT

## Non-goals
- Không viết lại toàn bộ dự án khi chưa audit.
- Không refactor ngoài task hiện tại.
- Không sửa trực tiếp main hoặc dev.

## Ordered Recovery Milestones
1. Khôi phục lịch sử AgentOS docs và fix wording (Current).
2. Read-only audit of the current Pipeline 1 implementation and gap analysis against the proposed target artifact contract.

## Features that must not regress (OWNER CONFIRMED)
- Voice cloning currently works.
- TTS generation currently works.
- Hard-subtitle removal (Pipeline 2) currently works.
- Existing working engines must be preserved.
