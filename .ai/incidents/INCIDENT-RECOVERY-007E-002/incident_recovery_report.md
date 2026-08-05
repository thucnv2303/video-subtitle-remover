# INCIDENT-RECOVERY-007E-002 Report

- original branch and HEAD: rescue/wip-20260803 (d67a427f1c90a2e98da560977736ead80637db3a)
- pre/post dirty status: Empty staged tree, identical working tree before and after restoration, apart from the specifically restored allowed application files, the script files, and .ai/ file updates.
- restored files: api/server.py, src/renderer/index.html, src/renderer/js/app.js, src/renderer/js/components/settings.js, src/renderer/js/pipelines/pipeline2-remove.js, 6 patch scripts.
- untouched files: src/renderer/js/api.js, api/tts_engine.py, package.json, package-lock.json, src/main/main.js, src/main/preload.js, src/renderer/styles/main.css, RECOVERY-007 ASR symbols, and other source.
- source and destination SHA256: 0 hash mismatches during restore. Verified in restored_files_comparison.txt.
- script restoration hashes: Verified successful in scripts_report.txt.
- syntax commands and exit codes: python py_compile (Exit 0) and node --check (Exit 0). Recorded in syntax_checks.txt.
- evidence directory: E:\Project AI\_recovery\INCIDENT-RECOVERY-007E-002-20260805-091511
- owner test: DO NOT START
- merge permission: BLOCKED
