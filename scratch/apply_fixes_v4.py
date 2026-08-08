import re

# 1. Update app.js
app_path = 'src/renderer/js/app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_js = f.read()

# Fix createJob to set pipeline=2 (default)
app_js = app_js.replace(
    "id: Math.random().toString(36).substr(2, 9),",
    "id: Math.random().toString(36).substr(2, 9),\n      pipeline: 2,"
)

# Fix selectFile for Pipeline 1
app_js = app_js.replace(
    "el.btnUploadStep1.addEventListener('click', selectFile);",
    "el.btnUploadStep1.addEventListener('click', () => { window._uploadPipeline = 1; selectFile(); });"
)
app_js = app_js.replace(
    "el.btnOpenFile.addEventListener('click', selectFile);",
    "el.btnOpenFile.addEventListener('click', () => { window._uploadPipeline = 2; selectFile(); });"
)

# Update selectFile to use window._uploadPipeline
app_js = re.sub(
    r'(const newJob = createJob\(fPath\);)',
    r'\1\n        if (window._uploadPipeline) newJob.pipeline = window._uploadPipeline;',
    app_js
)

# Update processNextJob to filter by pipeline if provided
# Wait, it's better to rewrite btn-start-all and btn-start logic!
app_js = app_js.replace(
    "function processNextJob() {",
    "function processNextJob(pipeline = 2) {"
)
app_js = app_js.replace(
    "const job = state.jobs.find(j => j.status === 'queued');",
    "const job = state.jobs.find(j => j.status === 'queued' && (pipeline ? j.pipeline === pipeline : true));"
)

# Update btn-start-all
app_js = app_js.replace(
    "document.getElementById('btn-start-all')?.addEventListener('click', () => {",
    "document.getElementById('btn-start-all')?.addEventListener('click', () => {\n    if (!state.isBackendReady) return;\n    window._activePipeline = 1;"
)
app_js = app_js.replace(
    "if (j.status === 'idle' || j.status === 'error' || j.status === 'finished') {",
    "if ((j.status === 'idle' || j.status === 'error' || j.status === 'finished') && j.pipeline === 1) {"
)
app_js = app_js.replace(
    "processNextJob();",
    "processNextJob(1);"
)

# Update btnStart
app_js = app_js.replace(
    "el.btnStart.addEventListener('click', () => {",
    "el.btnStart.addEventListener('click', () => {\n    window._activePipeline = 2;"
)
app_js = app_js.replace(
    "if (j.status === 'idle' || j.status === 'error' || j.status === 'finished') {",
    "if ((j.status === 'idle' || j.status === 'error' || j.status === 'finished') && j.pipeline === 2) {"
)

# Update runNextPass to send skip_inpaint for Pipeline 1
app_js = re.sub(
    r'(inpaint_mode:\s*\'sttn\')',
    r'\1,\n      skip_inpaint: job.pipeline === 1',
    app_js
)

# Update updateStartButton to handle both buttons correctly
app_js = app_js.replace(
    "const isProcessing = state.jobs.some(j => j.status === 'processing' || j.status === 'queued');",
    "const isProcessing = state.jobs.some(j => (j.status === 'processing' || j.status === 'queued') && j.pipeline === 2);\n  const isProcessing1 = state.jobs.some(j => (j.status === 'processing' || j.status === 'queued') && j.pipeline === 1);"
)

app_js = re.sub(
    r'(if\s*\(isProcessing\)\s*\{\s*el\.btnStart\.innerHTML\s*=\s*.*?\}\s*else\s*\{\s*el\.btnStart\.innerHTML\s*=\s*.*?\})',
    r'\1\n  const btnStartAll = document.getElementById("btn-start-all");\n  const btnStopAll = document.getElementById("btn-stop-all");\n  if (btnStartAll && btnStopAll) {\n    if (isProcessing1) {\n      btnStartAll.style.display = "none";\n      btnStopAll.style.display = "flex";\n    } else {\n      btnStartAll.style.display = "flex";\n      btnStopAll.style.display = "none";\n    }\n  }',
    app_js
)

# Bind btn-stop-all
app_js = app_js.replace(
    "// Stop all from Pipeline 1",
    "document.getElementById('btn-stop-all')?.addEventListener('click', () => { cancelJob(); });\n  // Stop all from Pipeline 1"
)

# Fix renderJobList delete button placement
app_js = re.sub(
    r'(<div class="tk-job-card-header">.*?)(<div class="tk-job-del".*?</div>)',
    r'\1',
    app_js, flags=re.DOTALL
)
# Re-inject it properly
app_js = re.sub(
    r'(<div class="tk-job-card-header">.*?)(</div>\s*<div class="tk-job-card-body">)',
    r'\1<div class="tk-job-del" data-id="${j.id}" title="Xóa">🗑</div>\2',
    app_js, flags=re.DOTALL
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_js)

# 2. Update server.py
server_path = 'api/server.py'
with open(server_path, 'r', encoding='utf-8') as f:
    server_py = f.read()

patch_code = """
                # Monkey-patch SubtitleRemover.run to skip inpainting if requested
                _original_run = getattr(SubtitleRemover, 'run', None)
                if _original_run and not hasattr(SubtitleRemover, '_patched'):
                    def patched_run(self):
                        if getattr(self, 'skip_inpaint', False):
                            from backend.main import SubtitleDetect, expand_frame_ranges, config
                            # Only extract text and run LLM/TTS
                            print('[Pipeline] Running OCR and AI only, skipping inpainting', flush=True)
                            if self.is_picture: return
                            sub_detector = SubtitleDetect(self.video_path, self.sub_areas)
                            sub_list = sub_detector.find_subtitle_frame_no(sub_remover=self)
                            if len(sub_list) == 0:
                                raise Exception(f"Không tìm thấy phụ đề trong video.")
                            continuous_frame_no_list = sub_detector.find_continuous_ranges_with_same_mask(sub_list)
                            continuous_frame_no_list = expand_frame_ranges(continuous_frame_no_list, config.subtitleTimelineBackwardFrameCount.value, config.subtitleTimelineForwardFrameCount.value)
                            continuous_frame_no_list = sub_detector.filter_and_merge_intervals(continuous_frame_no_list, config.sttnReferenceLength.value)
                            
                            self.check_and_launch_parallel_post_processing()
                            if getattr(self, 'parallel_tts_future', None):
                                self.parallel_tts_future.result()
                            
                            self.progress_total = 100
                            self.isFinished = True
                            self.notify_progress_listeners()
                            return
                        else:
                            return _original_run(self)
                    SubtitleRemover.run = patched_run
                    SubtitleRemover._patched = True
                
                sr = SubtitleRemover(job["input_path"])
                sr.skip_inpaint = job.get("skip_inpaint", False)
"""

server_py = server_py.replace('sr = SubtitleRemover(job["input_path"])', patch_code)

# Fix progress broadcasting logic so it doesn't rely on pct == 83
fix_progress = """
                def stage_progress_callback(msg: str, progress_total: float):
                    # For skip_inpaint mode, progress_total might just jump to 100
                    inpaint_pct = min(int(progress_total * 0.80), 80)
                    # We rely on worker_loop to broadcast the srt/ai ready!
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(
                                broadcast_progress({"job_id": current_job_id, "progress": inpaint_pct, "status": "processing", "is_finished": False, "stage": msg}),
                                event_loop
                            )
                        except Exception:
                            pass
                    print(f'[Stage] {inpaint_pct}% - {msg}', flush=True)
                sr.stage_progress_callback = stage_progress_callback
"""

# Replace old stage_progress_callback
server_py = re.sub(
    r'def stage_progress_callback\(pct, msg\):.*?sr\.stage_progress_callback = stage_progress_callback',
    fix_progress,
    server_py,
    flags=re.DOTALL
)

# And add continuous check in worker_loop
check_loop = """
            # Poll while running
            sent_srt = False
            sent_ai = False
            while not sr.isFinished:
                if not sent_srt and hasattr(sr, 'original_srt_content') and sr.original_srt_content:
                    sent_srt = True
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(broadcast_progress({"job_id": current_job_id, "srt_ready": sr.original_srt_content}), event_loop)
                        except Exception: pass
                if not sent_ai and hasattr(sr, 'ai_srt_content') and sr.ai_srt_content:
                    sent_ai = True
                    if event_loop:
                        try:
                            asyncio.run_coroutine_threadsafe(broadcast_progress({"job_id": current_job_id, "ai_ready": sr.ai_srt_content}), event_loop)
                        except Exception: pass
                time.sleep(0.5)
"""
server_py = server_py.replace('sr.run()', 'sr.run()\n' + check_loop)

with open(server_path, 'w', encoding='utf-8') as f:
    f.write(server_py)
print('Done!')
