import codecs

path = 'video-subtitle-remover-ref/backend/main.py'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

# Replace run() method body to call generate_srt
old_run_end = """        if not self.is_picture:
            # 将原音频合并到新生成的视频文件中
            self.merge_audio_to_video()
        self.append_output(tr['Main']['FinishedProcessing'].format(self.video_out_path))
        self.append_output(tr['Main']['ProcessingTime'].format(round(time.time() - start_time)))
        self.isFinished = True
        self.progress_total = 100"""

new_run_end = """        if not self.is_picture:
            # 将原音频合并到新生成的视频文件中
            self.merge_audio_to_video()
            
        wants_srt = getattr(self, 'extract_srt', False) or getattr(self, 'ai_rewrite', False) or getattr(self, 'tts_voice', 'none') != 'none'
        if wants_srt and len(self.extracted_texts) > 0:
            self.generate_srt()
            
        self.append_output(tr['Main']['FinishedProcessing'].format(self.video_out_path))
        self.append_output(tr['Main']['ProcessingTime'].format(round(time.time() - start_time)))
        self.isFinished = True
        self.progress_total = 100"""

content = content.replace(old_run_end, new_run_end)

# Insert new methods before log_model
new_methods = """
    def generate_srt(self):
        import datetime
        if not self.extracted_texts:
            return
            
        # Sort by frame
        self.extracted_texts.sort(key=lambda x: x['frame'])
        
        events = []
        fps = self.fps if hasattr(self, 'fps') else 30
        
        for item in self.extracted_texts:
            frame = item['frame']
            text = item['text']
            
            # Group by text similarity within 1 second
            found = False
            for e in events:
                # use basic substring match for stability
                if (text in e['text'] or e['text'] in text) and (frame - e['end_frame']) <= fps:
                    if len(text) > len(e['text']):
                        e['text'] = text
                    e['end_frame'] = frame
                    found = True
                    break
            
            if not found:
                events.append({
                    'text': text,
                    'start_frame': frame,
                    'end_frame': frame
                })
                
        def frame_to_time(f, fps):
            seconds = f / fps
            td = datetime.timedelta(seconds=seconds)
            total_seconds = int(td.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            milliseconds = int(td.microseconds / 1000)
            return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"
            
        srt_content = ""
        for i, e in enumerate(events):
            start_time = frame_to_time(e['start_frame'], fps)
            end_f = e['end_frame'] if e['end_frame'] > e['start_frame'] else e['start_frame'] + fps
            end_time = frame_to_time(end_f, fps)
            
            srt_content += f"{i+1}\\n"
            srt_content += f"{start_time} --> {end_time}\\n"
            srt_content += f"{e['text']}\\n\\n"
            
        srt_path = self.video_out_path.rsplit('.', 1)[0] + '.srt'
        with open(srt_path, 'w', encoding='utf-8') as f:
            f.write(srt_content)
        self.original_srt_content = srt_content
        self.append_output(f"Đã trích xuất phụ đề ra: {srt_path}")
        if getattr(self, 'ai_rewrite', False):
            self.run_llm_rewrite(srt_path)
            
        dubbed_audio = self.generate_tts_audio(srt_path)
        
        if getattr(self, 'ai_rewrite', False) or getattr(self, 'tts_voice', 'none') != 'none':
            self.hardsub_video(srt_path, dubbed_audio)

    def run_llm_rewrite(self, srt_path):
        self.append_output("Đang kết nối AI để viết lại phụ đề...")
        import json, urllib.request, urllib.error
        
        try:
            with open(srt_path, 'r', encoding='utf-8') as f:
                srt_content = f.read()
                
            ai_config = getattr(self, 'ai_config', None)
            if not ai_config:
                self.append_output("Lỗi: Không tìm thấy cấu hình AI!")
                return False
                
            provider = ai_config.get('provider', 'gemini')
            api_keys = ai_config.get('api_keys', [])
            if not api_keys:
                api_keys = [ai_config.get('api_key', '')]
            endpoint = ai_config.get('endpoint', '')
            prompt = ai_config.get('prompt', 'Hãy dịch các phụ đề sau sang Tiếng Việt. Giữ nguyên định dạng SRT.')
            model = ai_config.get('model', '')
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": srt_content}
            ]
            
            success = False
            last_error = ""
            
            for idx, key_or_model in enumerate(api_keys):
                if not key_or_model: continue
                
                try:
                    self.append_output(f"[AI] Đang thử kết nối với {'Key/Model' if provider == 'ollama' else 'Key'} #{idx+1}...")
                    result_text = srt_content
                    
                    if provider == 'gemini':
                        gemini_model = model if model else "gemini-2.5-flash"
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={key_or_model}"
                        data = json.dumps({
                            "contents": [{"parts": [{"text": prompt + "\\n\\n" + srt_content}]}]
                        }).encode('utf-8')
                        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                        response = urllib.request.urlopen(req, timeout=60)
                        res_data = json.loads(response.read().decode('utf-8'))
                        result_text = res_data['candidates'][0]['content']['parts'][0]['text']
                        
                    elif provider == 'deepseek':
                        ds_model = model if model else "deepseek-chat"
                        url = "https://api.deepseek.com/chat/completions"
                        data = json.dumps({
                            "model": ds_model,
                            "messages": messages
                        }).encode('utf-8')
                        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key_or_model}'})
                        response = urllib.request.urlopen(req, timeout=60)
                        res_data = json.loads(response.read().decode('utf-8'))
                        result_text = res_data['choices'][0]['message']['content']
                        
                    elif provider == 'ollama':
                        url = endpoint if endpoint else "http://localhost:11434/api/chat"
                        # For Ollama, the keys array acts as a list of models to try
                        data = json.dumps({
                            "model": key_or_model,
                            "messages": messages,
                            "stream": False
                        }).encode('utf-8')
                        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                        response = urllib.request.urlopen(req, timeout=120)
                        res_data = json.loads(response.read().decode('utf-8'))
                        result_text = res_data['message']['content']
                        
                    # Clean up markdown code blocks if AI wrapped it
                    if result_text.startswith('```'):
                        lines = result_text.split('\\n')
                        if lines[0].startswith('```'):
                            lines = lines[1:]
                        if lines and lines[-1].startswith('```'):
                            lines = lines[:-1]
                        result_text = '\\n'.join(lines)
                        
                    with open(srt_path, 'w', encoding='utf-8') as f:
                        f.write(result_text)
                        
                    self.ai_srt_content = result_text
                    self.append_output("AI đã viết lại phụ đề thành công!")
                    success = True
                    break
                    
                except urllib.error.HTTPError as e:
                    body = e.read().decode('utf-8')
                    last_error = f"HTTP {e.code}: {body}"
                    self.append_output(f"❌ Lỗi HTTP {e.code} ở Key/Model #{idx+1}: {body}")
                    continue
                except Exception as e:
                    last_error = str(e)
                    self.append_output(f"❌ Lỗi khi kết nối AI ở Key/Model #{idx+1}: {str(e)}")
                    continue
                    
            if not success:
                self.append_output(f"Tất cả Key/Model đều thất bại! Lỗi cuối: {last_error}")
                
            return success
        except Exception as e:
            self.append_output(f"Lỗi khi gọi AI: {str(e)}")
            return False

    def generate_tts_audio(self, srt_path):
        if getattr(self, 'tts_voice', 'none') == 'none':
            return None
            
        self.append_output("Đang tạo giọng đọc AI (TTS) từ phụ đề...")
        # Bug #10 fix: do NOT import asyncio at module level here — use threading instead
        # so asyncio.run() runs in a brand-new thread with its own event loop, avoiding
        # "This event loop is already running" RuntimeError in uvicorn worker threads.
        import threading
        import edge_tts
        from pydub import AudioSegment
        import os
        
        try:
            # Parse SRT
            with open(srt_path, 'r', encoding='utf-8') as f:
                lines = f.read().split('\\n')
                
            subs = []
            i = 0
            while i < len(lines):
                if '-->' in lines[i]:
                    times = lines[i].split('-->')
                    start_str = times[0].strip()
                    # convert 00:00:02,000 to milliseconds
                    def time_to_ms(t):
                        h, m, s_ms = t.split(':')
                        s, ms = s_ms.split(',')
                        return int(h)*3600000 + int(m)*60000 + int(s)*1000 + int(ms)
                    
                    start_ms = time_to_ms(start_str)
                    
                    text = ""
                    i += 1
                    while i < len(lines) and lines[i].strip() != "":
                        text += lines[i].strip() + " "
                        i += 1
                        
                    if text.strip():
                        subs.append((start_ms, text.strip()))
                i += 1
                
            if not subs:
                self.append_output("Không tìm thấy text nào để lồng tiếng.")
                return None
                
            # Generate Audio for each sub
            voice = self.tts_voice
            dubbed_audio_path = srt_path.replace('.srt', '_dubbed.mp3')
            
            # Create empty track based on video length
            import cv2
            from backend.tools.subtitle_detect import get_readable_path
            cap = cv2.VideoCapture(get_readable_path(self.video_path))
            fps_cap = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            duration_ms = int((frame_count / fps_cap) * 1000) if fps_cap > 0 else 60000
            cap.release()
            
            final_audio = AudioSegment.silent(duration=duration_ms)

            # Bug #10 fix: run each edge_tts coroutine in a dedicated thread with its own
            # event loop instead of asyncio.run() which fails inside running loops.
            def _run_edge_tts_sync(text_str, voice_str, filename):
                import asyncio as _asyncio
                error_holder = []
                def _thread_target():
                    loop = _asyncio.new_event_loop()
                    _asyncio.set_event_loop(loop)
                    try:
                        loop.run_until_complete(
                            edge_tts.Communicate(text_str, voice_str).save(filename)
                        )
                    except Exception as exc:
                        error_holder.append(exc)
                    finally:
                        loop.close()
                t = threading.Thread(target=_thread_target)
                t.start()
                t.join(timeout=30)
                if error_holder:
                    raise error_holder[0]

            def generate_clip_sync(text_str, filename):
                if voice.startswith("clone:"):
                    import urllib.request
                    import json
                    try:
                        req = urllib.request.Request(
                            "http://127.0.0.1:8765/api/tts/generate",
                            data=json.dumps({"text": text_str, "voice_name": voice, "ref_audio_path": getattr(self, "tts_ref_audio", None)}).encode('utf-8'),
                            headers={'Content-Type': 'application/json'}
                        )
                        with urllib.request.urlopen(req, timeout=60) as resp:
                            res = json.loads(resp.read())
                            if res.get("status") == "ok":
                                import shutil
                                shutil.copy(res["audio_path"], filename)
                                return
                            else:
                                raise Exception(res.get("error", "Unknown TTS API error"))
                    except Exception as e:
                        self.append_output(f"Lỗi tạo TTS clone: {e}. Đang dùng fallback...")
                        # Fallback to default edge_tts voice
                        _run_edge_tts_sync(text_str, "vi-VN-HoaiMyNeural", filename)
                else:
                    _run_edge_tts_sync(text_str, voice, filename)
                
            for idx, (start_ms, text) in enumerate(subs):
                ext = ".wav" if voice.startswith("clone:") else ".mp3"
                temp_file = os.path.join(os.path.dirname(dubbed_audio_path), f"temp_tts_{idx}{ext}")
                try:
                    generate_clip_sync(text, temp_file)
                except Exception as clip_err:
                    self.append_output(f"Bỏ qua segment {idx}: {clip_err}")
                    continue
                
                # Overlay onto timeline
                if os.path.exists(temp_file):
                    clip = AudioSegment.from_file(temp_file)
                    final_audio = final_audio.overlay(clip, position=start_ms)
                    os.remove(temp_file)
                    
            final_audio.export(dubbed_audio_path, format="mp3")
            self.append_output("Đã tạo file lồng tiếng hoàn chỉnh.")
            return dubbed_audio_path
            
        except Exception as e:
            self.append_output(f"Lỗi tạo TTS: {str(e)}")
            return None

    def hardsub_video(self, srt_path, dubbed_audio_path=None):
        self.append_output("Đang dùng FFmpeg để chèn phụ đề (và âm thanh) vào video...")
        import subprocess, os
        
        temp_out = self.video_out_path.rsplit('.', 1)[0] + '_hardsub.mp4'

        # Bug #11 fix: correct path escaping for ffmpeg subtitles filter on Windows.
        # Step 1: normalize backslashes to forward slashes.
        # Step 2: escape the colon in drive letter (C:/ → C\\:/) because ffmpeg
        #         subtitle filter uses colon as option separator.
        def _escape_srt_path(p):
            # Normalize all backslashes to forward slashes
            p = p.replace('\\\\', '/')
            # Escape drive-letter colon for ffmpeg subtitles filter: C:/ -> C\\:/
            if len(p) >= 2 and p[1] == ':':
                p = p[0] + '\\\\:' + p[2:]
            return p

        escaped_srt = _escape_srt_path(srt_path)
        
        if dubbed_audio_path and os.path.exists(dubbed_audio_path):
            bg_vol = getattr(self, 'tts_bg_volume', 10) / 100.0
            
            filter_complex = (
                f"[0:v]subtitles='{escaped_srt}'[vout];"
                f"[0:a]volume={bg_vol}[a0];"
                f"[1:a]volume=2.0[a1];"
                f"[a0][a1]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]"
            )
            
            cmd = [
                'ffmpeg', '-y',
                '-i', self.video_out_path,
                '-i', dubbed_audio_path,
                '-filter_complex', filter_complex,
                '-map', '[vout]',
                '-map', '[aout]',
                '-c:v', 'libx264',
                '-c:a', 'aac',
                temp_out
            ]
        else:
            cmd = [
                'ffmpeg', '-y', 
                '-i', self.video_out_path,
                '-vf', f"subtitles='{escaped_srt}'",
                '-c:a', 'copy',
                temp_out
            ]
        
        try:
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, startupinfo=startupinfo)
            stdout, stderr = process.communicate()
            
            if process.returncode == 0 and os.path.exists(temp_out):
                os.replace(temp_out, self.video_out_path)
                self.append_output("Đã xuất video cuối cùng thành công!")
                
                # Cleanup
                if dubbed_audio_path and os.path.exists(dubbed_audio_path):
                    try:
                        os.remove(dubbed_audio_path)
                    except: pass
                
                return True
            else:
                err_msg = stderr.decode('utf-8', errors='replace')[-300:] if stderr else ''
                self.append_output(f"FFmpeg lỗi (Code {process.returncode}): {err_msg}")
                return False
        except Exception as e:
            self.append_output(f"Lỗi FFmpeg: {str(e)}")
            return False

"""

content = content.replace("    def log_model(self):", new_methods + "\n    def log_model(self):")

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(content)

print("Applied!")
