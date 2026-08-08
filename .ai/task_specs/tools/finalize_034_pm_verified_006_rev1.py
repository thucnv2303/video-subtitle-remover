from pathlib import Path
import hashlib
import sys

FILES = {
    ".ai/current_state.md": "33eff07b417340218f4a61e37b761b452289cc31",
    ".ai/task_current.md": "e79abcc3a4022af835bc086c843688bdff6fc7f9",
    ".ai/handoff.md": "d5f264d3b8cbcb0ea29d015d04e147b65cbaab09",
}


def fail(message: str) -> None:
    print(f"STOP — PM VERIFIED CLOSEOUT REV1 PRECONDITION FAILED: {message}", file=sys.stderr)
    raise SystemExit(2)


def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def replace_exact(data: bytes, old: str, new: str, label: str, expected_count: int = 1) -> bytes:
    old_b = old.encode("utf-8")
    new_b = new.encode("utf-8")
    count = data.count(old_b)
    if count != expected_count:
        fail(f"{label}: expected {expected_count} match(es), got {count}")
    return data.replace(old_b, new_b, expected_count)


def replace_in_section(data: bytes, start: str, end: str, changes: list[tuple[str, str, str]]) -> bytes:
    start_b = start.encode("utf-8")
    end_b = end.encode("utf-8")
    start_pos = data.find(start_b)
    if start_pos < 0:
        fail(f"section start missing: {start}")
    end_pos = data.find(end_b, start_pos + len(start_b))
    if end_pos < 0:
        fail(f"section end missing: {end}")
    prefix = data[:start_pos]
    section = data[start_pos:end_pos]
    suffix = data[end_pos:]
    for old, new, label in changes:
        section = replace_exact(section, old, new, label)
    return prefix + section + suffix


def patch_current_state(data: bytes) -> bytes:
    data = replace_exact(
        data,
        "WAITING_PM_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
        "COMPLETED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
        "current_state status",
    )
    data = replace_exact(
        data,
        "- Documentation: WAITING_PM_VERIFICATION",
        "- Documentation: PASS",
        "current_state documentation gate",
    )
    data = replace_exact(
        data,
        "Documentation synchronization: WAITING_PM_VERIFICATION",
        "Documentation synchronization: PASS",
        "current_state lower documentation gate",
    )
    return data


def patch_task_current(data: bytes) -> bytes:
    return replace_exact(
        data,
        "- Documentation synchronization: WAITING_PM_VERIFICATION",
        "- Documentation synchronization: PASS",
        "task_current documentation gates",
        expected_count=2,
    )


def patch_handoff(data: bytes) -> bytes:
    data = replace_exact(
        data,
        "RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED - PASS WITH GIT-NORMALIZED LF",
        "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2: COMPLETED — PM VERIFIED",
        "handoff last completed task",
    )
    data = replace_exact(
        data,
        "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 (WAITING_PM_VERIFICATION)",
        "RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 (COMPLETED — PM VERIFIED)",
        "handoff active task status",
    )
    data = replace_in_section(
        data,
        "## Next permitted action",
        "## Source SHA",
        [
            (
                "Project Manager verifies documentation correction. No further Anti implementation task or Owner test is expected.",
                "Project Manager performs the final merge-readiness decision for PR #14. No further Anti implementation task or Owner retest is required for Task 034.",
                "handoff top next action",
            ),
            (
                "Merge remains BLOCKED.",
                "Merge remains BLOCKED until explicit PM merge approval.",
                "handoff top merge gate",
            ),
        ],
    )
    data = replace_in_section(
        data,
        "## Next Permitted Action",
        "## Execution",
        [
            (
                "Project Manager verifies documentation correction. No further Anti implementation task or Owner test is expected.",
                "Project Manager performs the final merge-readiness decision for PR #14. No further Anti implementation task or Owner retest is required for Task 034.",
                "handoff lower next action",
            ),
        ],
    )
    data = replace_in_section(
        data,
        "## Documentation synchronization",
        "## Merge permission",
        [
            (
                "WAITING_PM_VERIFICATION",
                "PASS",
                "handoff documentation gate",
            ),
        ],
    )
    return data


PATCHERS = {
    ".ai/current_state.md": patch_current_state,
    ".ai/task_current.md": patch_task_current,
    ".ai/handoff.md": patch_handoff,
}


def main() -> None:
    root = Path.cwd()
    if not (root / ".git").exists():
        fail("run from repository worktree root")

    originals: dict[str, bytes] = {}
    patched: dict[str, bytes] = {}

    for rel, expected_blob in FILES.items():
        path = root / rel
        if not path.is_file():
            fail(f"missing file: {rel}")
        data = path.read_bytes()
        actual_blob = git_blob_sha(data)
        if actual_blob != expected_blob:
            fail(f"{rel}: expected blob {expected_blob}, got {actual_blob}")
        originals[rel] = data

    for rel, patcher in PATCHERS.items():
        before = originals[rel]
        after = patcher(before)
        if after == before:
            fail(f"{rel}: patch produced no change")
        if before.count(b"\r\n") != after.count(b"\r\n"):
            fail(f"{rel}: CRLF count changed")
        if before.count(b"\n") != after.count(b"\n"):
            fail(f"{rel}: LF count changed")
        patched[rel] = after

    # All preconditions and transformations must succeed before any write.
    for rel, after in patched.items():
        (root / rel).write_bytes(after)

    for rel in FILES:
        before = originals[rel]
        after = patched[rel]
        crlf_count = after.count(b"\r\n")
        lf_count = after.count(b"\n")
        print(
            f"PATCHED {rel} "
            f"blob_before={git_blob_sha(before)} "
            f"blob_after={git_blob_sha(after)} "
            f"bytes_before={len(before)} bytes_after={len(after)} "
            f"crlf={crlf_count} lf={lf_count}"
        )


if __name__ == "__main__":
    main()
