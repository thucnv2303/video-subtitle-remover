import os

dirs = [
    "src/renderer/js/utils",
    "src/renderer/js/pipelines",
    "src/renderer/js/components"
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

files = [
    "src/renderer/js/store.js",
    "src/renderer/js/api.js",
    "src/renderer/js/utils/logger.js",
    "src/renderer/js/utils/formatters.js",
    "src/renderer/js/utils/dom.js",
    "src/renderer/js/pipelines/pipeline1-ai.js",
    "src/renderer/js/pipelines/pipeline2-remove.js",
    "src/renderer/js/pipelines/pipeline3-sub.js",
    "src/renderer/js/components/job-manager.js",
    "src/renderer/js/components/prompt-manager.js",
    "src/renderer/js/components/video-preview.js",
    "src/renderer/js/components/settings.js",
]

for f in files:
    if not os.path.exists(f):
        with open(f, 'w', encoding='utf-8') as file:
            file.write("// TODO: Implement module\n")

print("Created structure")
