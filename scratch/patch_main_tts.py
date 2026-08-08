import os

def fix_main_tts_hardsub():
    main_py_path = r'e:\Project AI\Video-sub-remove\video-subtitle-remover-ref\backend\main.py'
    with open(main_py_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix 1: Print error in edge_tts generation and raise error if combined is empty
    old_tts_gen = '''                try:
                    async def _gen(t, p, v):
                        await edge_tts.Communicate(t, v).save(p)
                    loop.run_until_complete(_gen(text, seg, voice))
                    aud = AudioSegment.from_mp3(seg)
                except Exception:
                    continue'''
    new_tts_gen = '''                try:
                    async def _gen(t, p, v):
                        await edge_tts.Communicate(t, v).save(p)
                    loop.run_until_complete(_gen(text, seg, voice))
                    aud = AudioSegment.from_mp3(seg)
                except Exception as e:
                    print(f'[Pipeline] edge-tts error on segment {idx}: {e}', flush=True)
                    continue'''
    content = content.replace(old_tts_gen, new_tts_gen)

    # Check if combined is empty
    old_tts_export = '''            loop.close()
            out = srt_path.rsplit('.', 1)[0] + '_tts.mp3'
            combined.export(out, format='mp3')'''
    new_tts_export = '''            loop.close()
            if len(combined) == 0:
                print('[Pipeline] TTS generation failed: combined audio is empty.', flush=True)
                return None
            out = srt_path.rsplit('.', 1)[0] + '_tts.mp3'
            combined.export(out, format='mp3')'''
    content = content.replace(old_tts_export, new_tts_export)

    # Fix 2: Use FFmpegCLI in hardsub_video
    # Find hardsub_video and replace 'ffmpeg' with FFmpegCLI.instance().ffmpeg_path
    content = content.replace("cmd = ['ffmpeg', '-y',", "cmd = [FFmpegCLI.instance().ffmpeg_path, '-y',")

    with open(main_py_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done")

if __name__ == '__main__':
    fix_main_tts_hardsub()
