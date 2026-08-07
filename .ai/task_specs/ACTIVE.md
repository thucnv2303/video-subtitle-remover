# Active PM Execution Spec

Status: NONE

There is currently no Anti implementation task authorized by a PM execution spec.

Current project action remains:
- Owner manual verification of `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`.
- Merge permission remains BLOCKED.

When a new Anti task is authorized, Project Manager must update this file to point to exactly one immutable spec under `.ai/task_specs/` before dispatch.

Example:

```text
Status: ACTIVE
Task: RECOVERY-...
Spec: .ai/task_specs/RECOVERY-....md
Expected branch: review/...
Expected starting HEAD: <full SHA>
```
