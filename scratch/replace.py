import sys

file_path = 'src/renderer/js/app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '      // Bước 1: Trích xuất SRT từ video gốc bằng OCR'
end_marker = '      nextJob.progress = 33;'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('Error: Could not find markers.')
    sys.exit(1)

new_code = """      // Bước 1: Trích xuất văn bản từ âm thanh (ASR)
      addLog('[AI] 🎤 Bước 1/3 — Đang trích xuất văn bản từ âm thanh (ASR)...', 'info');

      const asrRes = await api.extractTextP1(
        nextJob.id,
        nextJob.filePath,
        nextJob.asrLanguage || 'zh'
      );

      if (nextJob._p1Cancelled) {
        _finishP1Job(nextJob, 'idle');
        return;
      }

      if (asrRes.status !== 'ok' || asrRes.job_id !== nextJob.id) {
        throw new Error('Job ID mismatch or response parsing failed.');
      }

      if (!asrRes.srt_content || asrRes.srt_content.trim() === '') {
        throw new Error('Không phát hiện được văn bản trong video.');
      }

      nextJob.srtContent = asrRes.srt_content;
      if (!nextJob.aiContent) {
        nextJob.aiContent = _srtToDisplayText(asrRes.srt_content);
      }

      const srtEl = document.getElementById('srt-content');
      if (srtEl && state.activeJobId === nextJob.id) {
        srtEl.value = asrRes.srt_content;
      }

      const srtEl2 = document.getElementById('step1-detail-text');
      if (srtEl2 && state.activeJobId === nextJob.id) {
        srtEl2.value = asrRes.srt_content;
      }

      const lineCount = (asrRes.srt_content.match(/-->/g) || []).length;
      addLog(`[AI] ✅ ASR hoàn tất — ${lineCount} dòng phụ đề.`, 'success');

"""

content = content[:start_idx] + new_code + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success!')
