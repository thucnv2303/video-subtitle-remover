# Patch Completeness

- source-working-tree.patch contains pp.js and index.html only.
- The untracked test 	ests/test_pipeline1_runtime.js was omitted by git diff because it is untracked and therefore not part of the standard diff output.
- Package files (package.json, package-lock.json) are intentionally not included in the source patch.
- No complete reproducible source commit exists yet (due to the active hook policy conflict).
