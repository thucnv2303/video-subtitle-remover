# RECOVERY-007E-SETTINGS-V1-001-REV7 — PM Amendment 01

Date: 2026-08-09
Status: ACTIVE

## Reason
The first REV7 pre-edit attempt STOPPED at the canonical-source identity gate because raw working-tree `git hash-object` values differed from the repository blob SHAs after Windows checkout.

GitHub verification confirms the remote REV7 source is still canonical and unchanged:
- `src/renderer/index.html` blob on REV7 and canonical `cf20a02...`: `d4321c10795093718ccfb2f4319d16cb75651c65`
- `src/renderer/js/components/settings.js` blob on REV7 and canonical `cf20a02...`: `bfac033717ae7131c437679651827677e286af1d`
- remote REV7 remains unchanged at the pre-attempt authority; no source commit or PR was published.

The failed gate was therefore a working-tree/EOL false positive, not source contamination.

## Disposition of first REV7 local attempt
- Execution behavior: PASS for STOP discipline.
- Implementation: NOT STARTED.
- No source edit was authorized after the failed pre-edit gate.
- Do not reuse `E:\Project AI\Video-sub-remove-clean-REV7`; create a new clean worktree from the new remote authority.

## Corrected pre-edit identity gate
Do NOT use raw `git hash-object <working-tree-file>` equality as the canonical-source gate.

After creating the new clean worktree, run and record:
1. `git status --short` — must be empty.
2. `git rev-parse HEAD:src/renderer/index.html` — must equal `d4321c10795093718ccfb2f4319d16cb75651c65`.
3. `git rev-parse HEAD:src/renderer/js/components/settings.js` — must equal `bfac033717ae7131c437679651827677e286af1d`.
4. `git diff --quiet -- src/renderer/index.html src/renderer/js/components/settings.js` — must exit 0.
5. `git ls-files --eol src/renderer/index.html src/renderer/js/components/settings.js` — record the output as the pre-edit EOL baseline.

The committed `HEAD:<path>` blob identity is authoritative for canonical source equality. A clean Windows worktree may have CRLF working-tree bytes while Git's index blob remains canonical LF content.

Hard STOP if:
- status is not clean before editing;
- either HEAD blob differs from the canonical blob above;
- `git diff --quiet` exits nonzero;
- EOL output shows `mixed` for either target before editing.

Do not change `core.autocrlf`, `core.eol`, `core.whitespace`, `.gitattributes`, or perform any line-ending normalization.

## Post-edit EOL rule
After each file edit, rerun `git ls-files --eol` for that file.
- Index classification must remain unchanged.
- Working-tree classification must not become `mixed`.
- A pre-existing `w/crlf` classification is allowed if it was recorded before editing.

All other REV7 source scope, one-file-at-a-time editing, churn limits, functional acceptance, verification, publication, STOP rules, Owner-test restriction, and merge block remain unchanged.

Owner app verification: NOT AUTHORIZED until PM GitHub code-review PASS.
Merge permission: BLOCKED.
