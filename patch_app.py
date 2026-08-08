import re
import os

with open('src/renderer/js/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = "remove_vocal: localStorage.getItem('tts_remove_vocal') === 'true'"
replacement = "remove_vocal: localStorage.getItem('tts_remove_vocal') === 'true',\n          voice_sub: job.voiceSub || false"

if target in text:
    text = text.replace(target, replacement)
    with open('src/renderer/js/app.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("app.js patched")
else:
    print("target not found")
