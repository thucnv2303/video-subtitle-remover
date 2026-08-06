# Recovery Options

## 1. Preferred Option: Replacement Canonical Base & PR
- preserve all existing refs;
- create a new replacement canonical base from 7e18c04...;
- create a replacement review head from the approved feature lineage;
- review FIX018 independently before including it;
- open a replacement Draft PR;
- never force-push or rewrite the damaged branch.

## 2. Revert Option: Recovery PR
- possible only through a dedicated recovery PR;
- must determine whether reverting a282117 and 73f8ed7 alone is sufficient;
- must not claim this restores the original base, because the damaged base already contains the entire PR #8 feature lineage.

## 3. Force-Push / Reset (FORBIDDEN)
- forbidden and not recommended;
- do not present it as an executable recovery choice.
