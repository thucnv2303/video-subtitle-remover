import os

with open('video-subtitle-remover-ref/backend/main.py', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = "f\"[0:v]subtitles='{escaped_srt}'[vout];\""
inject1 = "f\"[0:v]{sub_filter}[vout];\""

target2 = "'-vf', f\"subtitles='{escaped_srt}'\","
inject2 = "'-vf', sub_filter,"

patch_code = '''
        # Calculate force_style if sub_areas exist
        force_style = ""
        if getattr(self, 'sub_areas', None) and len(self.sub_areas) > 0:
            try:
                import cv2
                from backend.tools.subtitle_detect import get_readable_path
                cap = cv2.VideoCapture(get_readable_path(self.video_path))
                v_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
                cap.release()
                
                ymin, ymax, xmin, xmax = self.sub_areas[0]
                margin_v = max(0, int(v_height - ymax))
                # Add a little padding so it doesn't touch the exact bottom edge of the box
                margin_v = margin_v + 5
                
                force_style = f"Alignment=2,MarginV={margin_v}"
            except Exception as e:
                self.append_output(f"Không thể tính vị trí MarginV: {e}")
        
        sub_filter = f"subtitles='{escaped_srt}'"
        if force_style:
            sub_filter += f":force_style='{force_style}'"
'''

target_insert = "escaped_srt = _escape_srt_path(srt_path)"
inject_insert = target_insert + "\n" + patch_code

if target_insert in text: text = text.replace(target_insert, inject_insert)
if target1 in text: text = text.replace(target1, inject1)
if target2 in text: text = text.replace(target2, inject2)

with open('video-subtitle-remover-ref/backend/main.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('main.py patched with force_style!')
