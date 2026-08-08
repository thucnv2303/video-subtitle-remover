import os

with open('api/server.py', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = 'tts_voice: Optional[str] = "none"'
inject1 = 'tts_voice: Optional[str] = "none"\n    voice_sub: Optional[bool] = False'

target2 = 'sr.tts_voice = req.tts_voice'
inject2 = 'sr.tts_voice = req.tts_voice\n        sr.voice_sub = req.voice_sub'

if target1 in text: text = text.replace(target1, inject1)
if target2 in text: text = text.replace(target2, inject2)

with open('api/server.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('server.py patched')
