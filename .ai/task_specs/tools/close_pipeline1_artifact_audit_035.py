from pathlib import Path
import hashlib
import sys

TASK_ID = "RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035"
REVIEW_BRANCH = "review/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035"
SOURCE_SHA = "ea9521f6fe957e24e49cc5d090e275511d91141d"
REPORT = ".ai/audits/RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035.md"

EXPECTED_BLOBS = {
    ".ai/current_state.md": "29cdb4357a5f339a4826bb6a7be1c267bf7f148e",
    ".ai/task_current.md": "07a8e6c3dcd88cc38f213c05638834d829361266",
    ".ai/handoff.md": "793026f262859719e96080e18cb4d7fb32835016",
}

REQUIRED_REPORT_HEADINGS = [
    "# RECOVERY-007E-PIPELINE1-ARTIFACT-CONTRACT-AUDIT-035",
    "## Basis",
    "## Current Pipeline 1 execution map",
    "## Current outputs and persistence",
    "## Target artifact contract comparison",
    "## Pipeline boundary findings",
    "## Gap matrix",
    "## Proposed follow-up task breakdown",
    "## Evidence",
    "## Conclusion",
]

REQUIRED_REPORT_TERMS = [
    "scenes.json",
    "multimodal_timeline.json",
    "remix_script.json",
    "edit_plan.json",
    "source_fingerprint",
    "job_id",
    "FPS/timebase",
    "artifact version",
    "Pipeline 1",
    "Pipeline 2",
    "Pipeline 3",
]


def fail(message):
    print("STOP — AUDIT 035 CLOSEOUT PRECONDITION FAILED: " + message, file=sys.stderr)
    raise SystemExit(2)


def git_blob_sha(data):
    header = ("blob " + str(len(data)) + "\0").encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def split_line(line):
    if line.endswith(b"\r\n"):
        return line[:-2], b"\r\n"
    if line.endswith(b"\n"):
        return line[:-1], b"\n"
    if line.endswith(b"\r"):
        return line[:-1], b"\r"
    return line, b""


def find_unique(lines, text, start=0, end=None, label=None):
    if end is None:
        end = len(lines)
    target = text.encode("utf-8")
    matches = []
    for i in range(start, end):
        body, eol = split_line(lines[i])
        if body == target:
            matches.append((i, eol))
    if len(matches) != 1:
        fail((label or text) + ": expected 1 match, got " + str(len(matches)))
    return matches[0]


def section(lines, start_header, end_header):
    start, _ = find_unique(lines, start_header, label="section start " + start_header)
    end, _ = find_unique(lines, end_header, start=start + 1, label="section end " + end_header)
    if end <= start:
        fail("invalid section order: " + start_header + " -> " + end_header)
    return start, end


def replace_line(lines, start, end, old, new, label):
    i, eol = find_unique(lines, old, start=start, end=end, label=label)
    lines[i] = new.encode("utf-8") + eol


def patch_current_state(data):
    lines = data.splitlines(keepends=True)
    s, e = section(lines, "## Status", "## Primary Input (OWNER CONFIRMED)")
    replace_line(
        lines, s, e,
        "COMPLETED — MERGED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
        "WAITING_PM_REVIEW — " + TASK_ID,
        "current_state status",
    )

    s, e = section(lines, "## Active Task / PR", "### Historical: 032/033/034 ancestry")
    replacements = [
        ("- Last completed task: RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2", "- Active task: " + TASK_ID, "active task"),
        ("- PR: #14 — MERGED", "- Task type: READ-ONLY AUDIT — no application source changes", "task type"),
        ("- Canonical branch after merge: recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement", "- Review branch: " + REVIEW_BRANCH, "review branch"),
        ("- Reviewed source SHA: " + SOURCE_SHA, "- Application source basis: " + SOURCE_SHA, "source basis"),
        ("- Owner previous result: Job Card UI PASS / AI provider-model FAIL", "- Audit report: " + REPORT, "audit report"),
        ("- Owner observation: Owner reported on 2026-08-07: task 34 đã oke", "- Owner verification: NOT REQUIRED — read-only audit", "owner gate"),
        ("- Code review: PASS", "- PM review: WAITING", "PM review"),
        ("- Owner retest: PASS", "- Documentation synchronization: WAITING_PM_REVIEW", "doc sync"),
        ("- Merge: MERGED — edc699930f4537f5f52568e9c0aaa8aeb68fb67b", "- Merge: BLOCKED", "merge gate"),
    ]
    for old, new, label in replacements:
        replace_line(lines, s, e, old, new, label)
    return b"".join(lines)


def patch_task_current(data):
    lines = data.splitlines(keepends=True)
    s, e = section(lines, "## Task ID", "## Name")
    replace_line(lines, s, e, "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2", TASK_ID, "task_current id")

    s, e = section(lines, "## Name", "## Status")
    replace_line(lines, s, e, "Pipeline 1 Per-Job AI Provider + Model Selector (REV2)", "Pipeline 1 Artifact Contract Read-Only Audit", "task_current name")

    s, e = section(lines, "## Status", "## Current PR / Branch / SHA")
    replace_line(lines, s, e, "COMPLETED — MERGED", "WAITING_PM_REVIEW", "task_current status")

    s, e = section(lines, "## Current PR / Branch / SHA", "## Historical: 032 / 033 ancestry")
    replacements = [
        ("- PR: #14 — MERGED", "- Task type: READ-ONLY AUDIT", "task type"),
        ("- Canonical branch: recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement", "- Review branch: " + REVIEW_BRANCH, "review branch"),
        ("- Reviewed source SHA: " + SOURCE_SHA, "- Application source basis: " + SOURCE_SHA, "source basis"),
        ("- Owner previous result (033 + 034): Job Card UI PASS / AI provider-model FAIL", "- Audit report: " + REPORT, "audit report"),
        ("- Owner observation: direct Owner report on 2026-08-07: task 34 đã oke", "- Owner verification: NOT REQUIRED — read-only audit", "owner gate"),
        ("- Automated verification: PASS", "- Automated verification: N/A — no source changes", "automation gate"),
        ("- Code review: PASS", "- PM review: WAITING", "PM review"),
        ("- Owner manual verification: PASS", "- Documentation synchronization: WAITING_PM_REVIEW", "doc sync"),
        ("- Documentation synchronization: PASS", "- Source/tests/dependencies changed: NO", "source scope"),
        ("- Merge: MERGED — edc699930f4537f5f52568e9c0aaa8aeb68fb67b", "- Merge: BLOCKED", "merge gate"),
    ]
    for old, new, label in replacements:
        replace_line(lines, s, e, old, new, label)
    return b"".join(lines)


def patch_handoff(data):
    lines = data.splitlines(keepends=True)

    s, e = section(lines, "## Active Task", "## Next permitted action")
    replace_line(lines, s, e, "NONE — Task 034 merged in PR #14", TASK_ID + " (READ-ONLY AUDIT — WAITING_PM_REVIEW)", "handoff active task")

    top_action_old = "No active executor task. Project Manager selects the next task from the merged canonical base. Task 035/036 remain NOT AUTHORIZED until a new remote ACTIVE spec is published."
    top_action_new = "Project Manager reviews Audit 035 evidence on GitHub. No implementation is authorized by this audit."

    s, e = section(lines, "## Next permitted action", "## Source SHA")
    replace_line(lines, s, e, top_action_old, top_action_new, "handoff top action")
    replace_line(
        lines, s, e,
        "PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b after explicit PM approval.",
        "Task 035 is read-only; Owner app test is not required unless PM later authorizes an implementation task.",
        "handoff top owner note",
    )

    s, e = section(lines, "## Next Permitted Action", "## Execution")
    replace_line(lines, s, e, top_action_old, top_action_new, "handoff lower action")

    s, e = section(lines, "## Execution", "## Code review")
    replace_line(lines, s, e, "PASS (static checks and runtime tests)", "PASS — read-only audit publication completed; application source unchanged", "handoff execution")

    s, e = section(lines, "## Code review", "## Automated verification")
    replace_line(lines, s, e, "PASS", "WAITING_PM_REVIEW", "handoff PM review")

    s, e = section(lines, "## Automated verification", "## Owner manual app verification")
    replace_line(
        lines, s, e,
        "PASS - .\\node_modules\\.bin\\electron.cmd tests\\test_pipeline1_runtime.js exit 0 (115 PASS / 0 FAIL / 0 NOT TESTED), node tests\\test_renderer_dom_structure.js exit 0 (35 PASS / 0 FAIL)",
        "N/A — read-only audit; no product code changed",
        "handoff automation",
    )

    s, e = section(lines, "## Owner manual app verification", "## Documentation synchronization")
    replace_line(lines, s, e, "PASS (direct Owner report on 2026-08-07: task 34 đã oke)", "NOT REQUIRED — read-only audit", "handoff owner")

    s, e = section(lines, "## Documentation synchronization", "## Merge permission")
    replace_line(lines, s, e, "PASS", "WAITING_PM_REVIEW", "handoff docs")

    s, e = section(lines, "## Merge permission", "## PR Tracking Facts")
    replace_line(
        lines, s, e,
        "USED — PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b",
        "BLOCKED — audit publication requires PM review; no product merge authorization",
        "handoff merge",
    )
    return b"".join(lines)


PATCHERS = {
    ".ai/current_state.md": patch_current_state,
    ".ai/task_current.md": patch_task_current,
    ".ai/handoff.md": patch_handoff,
}


def validate_report(root):
    report_path = root / REPORT
    if not report_path.is_file():
        fail("missing audit report: " + REPORT)
    text = report_path.read_text(encoding="utf-8")
    for heading in REQUIRED_REPORT_HEADINGS:
        if heading not in text:
            fail("report missing heading: " + heading)
    for term in REQUIRED_REPORT_TERMS:
        if term not in text:
            fail("report missing required term: " + term)
    if len(text.encode("utf-8")) < 3000:
        fail("audit report is too short to contain reviewable evidence")


def main():
    root = Path.cwd()
    validate_report(root)

    originals = {}
    patched = {}
    for rel, expected_blob in EXPECTED_BLOBS.items():
        path = root / rel
        if not path.is_file():
            fail("missing file: " + rel)
        data = path.read_bytes()
        actual = git_blob_sha(data)
        if actual != expected_blob:
            fail(rel + ": expected blob " + expected_blob + ", got " + actual)
        originals[rel] = data

    for rel, patcher in PATCHERS.items():
        before = originals[rel]
        after = patcher(before)
        if after == before:
            fail(rel + ": patch produced no change")
        if before.count(b"\r\n") != after.count(b"\r\n"):
            fail(rel + ": CRLF count changed")
        if before.count(b"\n") != after.count(b"\n"):
            fail(rel + ": LF count changed")
        patched[rel] = after

    for rel, after in patched.items():
        (root / rel).write_bytes(after)

    for rel in EXPECTED_BLOBS:
        before = originals[rel]
        after = patched[rel]
        print("PATCHED " + rel)
        print("blob_before=" + git_blob_sha(before))
        print("blob_after=" + git_blob_sha(after))
        print("bytes_before=" + str(len(before)) + " bytes_after=" + str(len(after)))
        print("crlf=" + str(after.count(b"\r\n")) + " lf=" + str(after.count(b"\n")))


if __name__ == "__main__":
    main()
