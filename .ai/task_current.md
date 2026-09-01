# Current Task

## Task Name
`FEAT-VIDEO-RENDER-PUSH-SELECTED-TO-SUB-071`

## Objective
Sửa lại nút đẩy sang Xóa Sub: Hiển thị rõ số lượng video đã chọn và chỉ đẩy các video được tích chọn sang tab Xóa Sub.

## Scope
- `src/renderer/js/video-render.js`
- `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`

## Acceptance Criteria
- Tiêu đề nút cập nhật theo số lượng file đã chọn và hoàn tất: `✨ ĐẨY N VIDEO ĐÃ CHỌN SANG XÓA SUB ➔`: PASS.
- Chỉ đẩy những file được tích chọn (`j.selected && j.status === 'done'`): PASS.
- Tự động cập nhật khi tích/bỏ tích checkbox: PASS.
- Node.js syntax check: PASS (Code 0).
- Owner manual verification: WAITING.
- Commit/merge: NOT PERFORMED.
