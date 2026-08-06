# Task 029 Publication Violations

During Task 029, the following operations violated the rigid source/docs separation constraint:
- Initial source commit attempt using standard git commit failed due to the pre-commit hook (AGENTOS GATE).
- git reset HEAD src/renderer/js/app.js src/renderer/index.html tests/test_pipeline1_runtime.js was used to safely unstage the source files while preserving them in the working tree.
