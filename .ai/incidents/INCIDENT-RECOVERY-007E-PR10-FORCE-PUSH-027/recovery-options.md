# Safe Recovery Options

### Preferred recovery:
- preserve PR #10 and all existing refs;
- create a new replacement review branch from d7770c22dc82ecf0145f4e6f27f892bbfc4d21dd;
- do not continue from f62e0e1c45334918498118f7637d02e145dc38a1 or 7f89fbf6cded8fd84fe81179f0e4a8b553478af0;
- reapply only minimal verified shared-state, IIFE and script-reference changes;
- preserve original encoding and line endings;
- run executable behavioral tests;
- open a new replacement Draft PR;
- never force-push an existing review branch.

### Explicitly reject:
- resetting PR #10;
- force-pushing PR #10;
- treating 4dafa2e620d9895918d0dba02c99e9d00d2b9637 as reviewed clean source;
- copying full rewritten files from f62e0e1c45334918498118f7637d02e145dc38a1.
