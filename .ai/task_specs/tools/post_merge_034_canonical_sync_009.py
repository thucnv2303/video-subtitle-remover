from pathlib import Path
import hashlib
import sys

FILES = {
    ".ai/current_state.md": "f666ac1a2df9b0c3b0d0f264adb8ace84fe8c91a",
    ".ai/task_current.md": "77b95dafc84e5f4e29649d5d851fd5ce94182a9d",
    ".ai/handoff.md": "9b486da69597aedacf4ad3ac78e0581d3e6a7377",
}

MERGE_SHA = "edc699930f4537f5f52568e9c0aaa8aeb68fb67b"
CANONICAL_BRANCH = "recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement"
REVIEW_BRANCH = "review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
REVIEWED_SOURCE = "ea9521f6fe957e24e49cc5d090e275511d91141d"


def fail(message):
    print("STOP — POST-MERGE CANONICAL SYNC 009 PRECONDITION FAILED: " + message, file=sys.stderr)
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


def find_header(lines, text, start=0):
    target = text.encode("utf-8")
    matches = []
    for i in range(start, len(lines)):
        body, _ = split_line(lines[i])
        if body == target:
            matches.append(i)
    if len(matches) != 1:
        fail("header %r: expected 1 match, got %d" % (text, len(matches)))
    return matches[0]


def section_bounds(lines, start_header, end_header=None):
    start = find_header(lines, start_header)
    if end_header is None:
        return start, len(lines)
    end = find_header(lines, end_header, start + 1)
    if end <= start:
        fail("invalid section bounds: %r -> %r" % (start_header, end_header))
    return start, end


def replace_line(lines, start, end, old, new, label):
    old_b = old.encode("utf-8")
    new_b = new.encode("utf-8")
    matches = []
    for i in range(start, end):
        body, eol = split_line(lines[i])
        if body == old_b:
            matches.append((i, eol))
    if len(matches) != 1:
        fail("%s: expected 1 match, got %d" % (label, len(matches)))
    i, eol = matches[0]
    lines[i] = new_b + eol


def patch_current_state(data):
    lines = data.splitlines(keepends=True)

    s, e = section_bounds(lines, "## Status", "## Primary Input (OWNER CONFIRMED)")
    replace_line(
        lines, s, e,
        "COMPLETED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
        "COMPLETED — MERGED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
        "current_state top status",
    )

    s, e = section_bounds(lines, "## Active Task / PR", "### Historical: 032/033/034 ancestry")
    replace_line(lines, s, e,
                 "- Active task: RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
                 "- Last completed task: RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
                 "current_state active task")
    replace_line(lines, s, e, "- PR: #14", "- PR: #14 — MERGED", "current_state PR")
    replace_line(lines, s, e,
                 "- Branch: " + REVIEW_BRANCH,
                 "- Canonical branch after merge: " + CANONICAL_BRANCH,
                 "current_state branch")
    replace_line(lines, s, e,
                 "- Source SHA: " + REVIEWED_SOURCE,
                 "- Reviewed source SHA: " + REVIEWED_SOURCE,
                 "current_state reviewed source")
    replace_line(lines, s, e,
                 "- Merge: BLOCKED",
                 "- Merge: MERGED — " + MERGE_SHA,
                 "current_state active merge")

    s, e = section_bounds(lines, "## Verification Gates", "## Security Incident")
    replace_line(lines, s, e,
                 "- Merge: BLOCKED",
                 "- Merge: PASS — PR #14 merged at " + MERGE_SHA,
                 "current_state verification merge")

    s, e = section_bounds(lines, "## RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2", None)
    replace_line(lines, s, e,
                 "Status: COMPLETED — PM VERIFIED",
                 "Status: COMPLETED — MERGED",
                 "current_state lower status")
    replace_line(lines, s, e, "PR: #14", "PR: #14 — MERGED", "current_state lower PR")
    replace_line(lines, s, e,
                 "Branch: " + REVIEW_BRANCH,
                 "Canonical branch: " + CANONICAL_BRANCH,
                 "current_state lower branch")
    replace_line(lines, s, e,
                 "Merge: BLOCKED",
                 "Merge: MERGED — " + MERGE_SHA,
                 "current_state lower merge")
    return b"".join(lines)


def patch_task_current(data):
    lines = data.splitlines(keepends=True)

    s, e = section_bounds(lines, "## Status", "## Current PR / Branch / SHA")
    replace_line(lines, s, e, "COMPLETED", "COMPLETED — MERGED", "task_current status")

    s, e = section_bounds(lines, "## Current PR / Branch / SHA", "## Historical: 032 / 033 ancestry")
    replace_line(lines, s, e, "- PR: #14", "- PR: #14 — MERGED", "task_current PR")
    replace_line(lines, s, e,
                 "- Branch: " + REVIEW_BRANCH,
                 "- Canonical branch: " + CANONICAL_BRANCH,
                 "task_current branch")
    replace_line(lines, s, e,
                 "- Source SHA: " + REVIEWED_SOURCE,
                 "- Reviewed source SHA: " + REVIEWED_SOURCE,
                 "task_current source")
    replace_line(lines, s, e,
                 "- Merge: BLOCKED",
                 "- Merge: MERGED — " + MERGE_SHA,
                 "task_current merge")

    s, e = section_bounds(lines, "## Verification gates", "## PR Tracking Facts")
    replace_line(lines, s, e,
                 "- Merge permission: BLOCKED",
                 "- Merge permission: USED — PR #14 merged at " + MERGE_SHA,
                 "task_current merge permission")
    return b"".join(lines)


def patch_handoff(data):
    lines = data.splitlines(keepends=True)

    s, e = section_bounds(lines, "## Last completed task", "## Active Task")
    replace_line(lines, s, e,
                 "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2: COMPLETED — PM VERIFIED",
                 "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2: COMPLETED — PM VERIFIED — MERGED",
                 "handoff last completed")

    s, e = section_bounds(lines, "## Active Task", "## Next permitted action")
    replace_line(lines, s, e,
                 "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 (COMPLETED — PM VERIFIED)",
                 "NONE — Task 034 merged in PR #14",
                 "handoff active task")

    old_action = "Project Manager performs the final merge-readiness decision for PR #14. No further Anti implementation task or Owner retest is required for Task 034."
    new_action = "No active executor task. Project Manager selects the next task from the merged canonical base. Task 035/036 remain NOT AUTHORIZED until a new remote ACTIVE spec is published."

    s, e = section_bounds(lines, "## Next permitted action", "## Source SHA")
    replace_line(lines, s, e, old_action, new_action, "handoff top next action")
    replace_line(lines, s, e,
                 "Merge remains BLOCKED until explicit PM merge approval.",
                 "PR #14 merged at " + MERGE_SHA + " after explicit PM approval.",
                 "handoff top merge result")

    s, e = section_bounds(lines, "## Review ancestry / source identity", "## Historical Status — AI Settings / PR #8 lineage")
    replace_line(lines, s, e,
                 "- Final PR HEAD is authoritative in GitHub PR #14",
                 "- Merged PR #14 is authoritative; merge commit: " + MERGE_SHA,
                 "handoff ancestry merge")

    s, e = section_bounds(lines, "## Next Permitted Action", "## Execution")
    replace_line(lines, s, e, old_action, new_action, "handoff lower next action")

    s, e = section_bounds(lines, "## Merge permission", "## PR Tracking Facts")
    replace_line(lines, s, e,
                 "BLOCKED",
                 "USED — PR #14 merged at " + MERGE_SHA,
                 "handoff merge permission")
    return b"".join(lines)


PATCHERS = {
    ".ai/current_state.md": patch_current_state,
    ".ai/task_current.md": patch_task_current,
    ".ai/handoff.md": patch_handoff,
}


def main():
    root = Path.cwd()
    if not (root / ".git").exists():
        fail("run from repository worktree root")

    originals = {}
    patched = {}
    for rel, expected_blob in FILES.items():
        path = root / rel
        if not path.is_file():
            fail("missing file: " + rel)
        data = path.read_bytes()
        actual_blob = git_blob_sha(data)
        if actual_blob != expected_blob:
            fail("%s: expected blob %s, got %s" % (rel, expected_blob, actual_blob))
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

    for rel in FILES:
        before = originals[rel]
        after = patched[rel]
        print("PATCHED " + rel)
        print("blob_before=" + git_blob_sha(before))
        print("blob_after=" + git_blob_sha(after))
        print("bytes_before=" + str(len(before)) + " bytes_after=" + str(len(after)))
        print("crlf=" + str(after.count(b"\r\n")) + " lf=" + str(after.count(b"\n")))


if __name__ == "__main__":
    main()
