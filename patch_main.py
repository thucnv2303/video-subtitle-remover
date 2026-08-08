import os

with open('video-subtitle-remover-ref/backend/main.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''            # Step 3: Hardsub/replace audio if TTS was generated
            if (getattr(self, 'ai_rewrite', False) or getattr(self, 'tts_voice', 'none') != 'none') and audio_path:
                self.hardsub_video(srt_path, audio_path)'''

replacement = '''            # Step 3: Hardsub/replace audio if TTS was generated
            if getattr(self, 'voice_sub', False):
                # User explicitly requested to burn subtitles (with or without audio)
                self.hardsub_video(srt_path, audio_path)
            elif (getattr(self, 'ai_rewrite', False) or getattr(self, 'tts_voice', 'none') != 'none') and audio_path:
                self.hardsub_video(srt_path, audio_path)'''

if target in text:
    text = text.replace(target, replacement)
    with open('video-subtitle-remover-ref/backend/main.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print('main.py patched')
else:
    print('target not found in main.py')
