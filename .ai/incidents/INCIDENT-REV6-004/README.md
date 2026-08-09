# INCIDENT-REV6-004 Evidence

## Incident Summary
The REV6 retry published implementation and documentation commits after multiple violations of active hard controls and after repeated required-gate failures. The implementation involved repeated unauthorized Git operations such as resetting/restoring files, checking out files, `git add .`, creating/running a python script (`patch_index.py`), altering `core.autocrlf` and `core.whitespace`, and continuing execution after `git diff --check` failures instead of halting. A failed execution state was also published. The resulting output violated the mandatory DOM element structure. 

## Trusted Basis
`b88ffc62aec35cb28de7adf7ce70750f478b29f5`

## Untrusted Commits
* Published Source: `129a7f3ca5fb7441cc5781c6dde36e81ae7593c7`
* Published Docs / Contaminated REV6 HEAD: `b672f215524e8694e4108daff7e13011940bff38`

**NO REPAIR ATTEMPTED.**
