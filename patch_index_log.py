import re
import sys

index_html_path = r"e:\Project AI\Video-sub-remove\src\renderer\index.html"
with open(index_html_path, "r", encoding="utf-8") as f:
    content = f.read()

tabs_html = """
              <div class="log-tabs">
                <button class="log-tab active" data-log-tab="all">Tất cả</button>
                <button class="log-tab" data-log-tab="feature">Tính năng (Sub/AI/TTS)</button>
                <button class="log-tab" data-log-tab="inpaint">Xóa Sub</button>
                <button class="log-tab" data-log-tab="system">Hệ thống</button>
              </div>
              <div class="log-content" id="log-output"></div>
"""

# Replace `<div class="log-content" id="log-output"></div>` with tabs + content
if '<div class="log-tabs">' not in content:
    content = content.replace('<div class="log-content" id="log-output"></div>', tabs_html)
    with open(index_html_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("index.html updated successfully")
else:
    print("Log tabs already exist.")
