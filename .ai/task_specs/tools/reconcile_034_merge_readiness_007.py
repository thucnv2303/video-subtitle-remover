from pathlib import Path
import hashlib
import sys

FILES = {
    ".ai/current_state.md": "c4cbd815a0b0a9c378708b897b5a6671c2fff1d8",
    ".ai/task_current.md": "77b95dafc84e5f4e29649d5d851fd5ce94182a9d",
    ".ai/handoff.md": "2d7e7bd83e00bac9ba6c6a5bf4ab0fa2690e5ef9",
    ".ai/qa_checklist.md": "54903913a2e5862297847e23328b0b6af9a36d2e",
    ".ai/bugs.md": "b11c15cfb5c0e4f19a8330b09923fa1f9bca7cde",
}


def fail(message: str) -> None:
    print(f"STOP — MERGE-READINESS KNOWLEDGE RECONCILIATION PRECONDITION FAILED: {message}", file=sys.stderr)
    raise SystemExit(2)


def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def split_line(line: bytes) -> tuple[bytes, bytes]:
    if line.endswith(b"\r\n"):
        return line[:-2], b"\r\n"
    if line.endswith(b"\n"):
        return line[:-1], b"\n"
    if line.endswith(b"\r"):
        return line[:-1], b"\r"
    return line, b""


def find_header(lines: list[bytes], text: str, start: int = 0) -> int:
    target = text.encode("utf-8")
    matches = []
    for i in range(start, len(lines)):
        body, _ = split_line(lines[i])
        if body == target:
            matches.append(i)
    if len(matches) != 1:
        fail(f"header {text!r}: expected 1 match, got {len(matches)}")
    return matches[0]


def section_bounds(lines: list[bytes], start_header: str, end_header: str | None) -> tuple[int, int]:
    start = find_header(lines, start_header)
    if end_header is None:
        return start, len(lines)
    end = find_header(lines, end_header, start + 1)
    if end <= start:
        fail(f"invalid section bounds: {start_header!r} -> {end_header!r}")
    return start, end


def replace_line_in_range(lines: list[bytes], start: int, end: int, old: str, new: str, label: str) -> None:
    old_b = old.encode("utf-8")
    new_b = new.encode("utf-8")
    matches = []
    for i in range(start, end):
        body, eol = split_line(lines[i])
        if body == old_b:
            matches.append((i, eol))
    if len(matches) != 1:
        fail(f"{label}: expected 1 line match, got {len(matches)}")
    i, eol = matches[0]
    lines[i] = new_b + eol


def replace_line_global(lines: list[bytes], old: str, new: str, label: str) -> None:
    replace_line_in_range(lines, 0, len(lines), old, new, label)


def patch_current_state(data: bytes) -> bytes:
    lines = data.splitlines(keepends=True)

    s, e = section_bounds(lines, "## Active Task / PR", "### Historical: 032/033/034 ancestry")
    replace_line_in_range(
        lines, s, e,
        "- Merge: BLOCKED",
        "- Merge: BLOCKED — waiting Owner compromised-key rotation confirmation",
        "current_state active merge gate",
    )

    s, e = section_bounds(lines, "## Verification Gates", "## Security Incident")
    replace_line_in_range(
        lines, s, e,
        "- Merge: BLOCKED",
        "- Merge: BLOCKED — waiting Owner compromised-key rotation confirmation",
        "current_state verification merge gate",
    )

    s, e = section_bounds(lines, "## Security Incident", "## Credential Architecture (IMPLEMENTED - NOT YET OWNER-RETESTED)")
    replace_line_in_range(
        lines, s, e,
        "- DeepSeek API key visible in owner screenshot is COMPROMISED. Key must be rotated by owner.",
        "- DeepSeek API key visible in owner screenshot is COMPROMISED. Key must be rotated by owner; Owner rotation confirmation: WAITING; Merge remains BLOCKED until confirmation.",
        "current_state security rotation gate",
    )

    s, e = section_bounds(lines, "## RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2", None)
    replace_line_in_range(
        lines, s, e,
        "Status: WAITING_PM_VERIFICATION",
        "Status: COMPLETED — PM VERIFIED",
        "current_state lower 034 status",
    )
    replace_line_in_range(
        lines, s, e,
        "Merge: BLOCKED",
        "Merge: BLOCKED — waiting Owner compromised-key rotation confirmation",
        "current_state lower 034 merge gate",
    )
    return b"".join(lines)


def patch_task_current(data: bytes) -> bytes:
    lines = data.splitlines(keepends=True)
    s, e = section_bounds(lines, "## Current PR / Branch / SHA", "## Historical: 032 / 033 ancestry")
    replace_line_in_range(
        lines, s, e,
        "- Merge: BLOCKED",
        "- Merge: BLOCKED — waiting Owner compromised-key rotation confirmation",
        "task_current top merge gate",
    )
    s, e = section_bounds(lines, "## Verification gates", "## PR Tracking Facts")
    replace_line_in_range(
        lines, s, e,
        "- Merge permission: BLOCKED",
        "- Merge permission: BLOCKED — waiting Owner compromised-key rotation confirmation",
        "task_current merge permission",
    )
    return b"".join(lines)


def patch_handoff(data: bytes) -> bytes:
    lines = data.splitlines(keepends=True)
    old_action = "Project Manager performs the final merge-readiness decision for PR #14. No further Anti implementation task or Owner retest is required for Task 034."
    new_action = "Task 034 source/review/Owner/docs gates are PASS. Final merge is blocked only by Owner confirmation that the compromised DeepSeek key has been revoked/rotated. No Anti implementation or Owner app retest is required."

    s, e = section_bounds(lines, "## Next permitted action", "## Source SHA")
    replace_line_in_range(lines, s, e, old_action, new_action, "handoff top next action")
    replace_line_in_range(
        lines, s, e,
        "Merge remains BLOCKED until explicit PM merge approval.",
        "Merge remains BLOCKED until Owner confirms key rotation and PM grants explicit merge approval.",
        "handoff top merge gate",
    )

    s, e = section_bounds(lines, "## Next Permitted Action", "## Execution")
    replace_line_in_range(lines, s, e, old_action, new_action, "handoff lower next action")

    s, e = section_bounds(lines, "## Merge permission", "## PR Tracking Facts")
    replace_line_in_range(
        lines, s, e,
        "BLOCKED",
        "BLOCKED — waiting Owner compromised-key rotation confirmation and explicit PM approval",
        "handoff merge permission",
    )
    return b"".join(lines)


def patch_qa(data: bytes) -> bytes:
    lines = data.splitlines(keepends=True)
    replace_line_global(
        lines,
        "## RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034 Owner Verification",
        "## Historical / Superseded: RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034 Owner Verification",
        "qa old 034 heading",
    )
    replace_line_global(
        lines,
        'Owner retest: WAITING (Owner ngày 2026-08-07 báo phần UI vừa kiểm tra "đã xong").',
        "Historical pre-REV2 state: Owner retest was WAITING at that stage. This section is superseded by the 034-REV2 QA block below.",
        "qa old 034 owner state",
    )
    replace_line_global(
        lines,
        "Must not start full logic test until PM code review on PR #14 passes.",
        "Historical note: retained for provenance only; current 034-REV2 gates are recorded in the block below.",
        "qa old 034 review note",
    )
    return b"".join(lines)


def patch_bugs(data: bytes) -> bytes:
    lines = data.splitlines(keepends=True)
    replace_line_global(
        lines,
        "| BUG-010 | DeepSeek API key visible in clear text in Settings UI | Owner screenshot at abf0ee2 | Keys stored in localStorage without encryption | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | SECURITY INCIDENT |",
        "| BUG-010 | DeepSeek API key visible in clear text in Settings UI | Owner screenshot at abf0ee2 | Keys stored in localStorage without encryption | SOURCE FIX IMPLEMENTED; COMPROMISED KEY ROTATION CONFIRMATION WAITING | SECURITY INCIDENT |",
        "bugs BUG-010 status",
    )
    replace_line_global(
        lines,
        "| BUG-013 | Pipeline 1 AI selector did not offer or synchronize DeepSeek with Settings | Owner test at abf0ee2 | No aiModelChanged event or sync mechanism | CANDIDATE FIX IN DRAFT PR #8 - OWNER RETEST NOT STARTED | OWNER OBSERVED |",
        "| BUG-013 | Pipeline 1 AI selector did not offer or synchronize DeepSeek with Settings | Owner test at abf0ee2 | No aiModelChanged event or sync mechanism | RESOLVED BY 034-REV2 — AUTOMATED PASS + OWNER OVERALL PASS 2026-08-07 | OWNER OBSERVED |",
        "bugs BUG-013 status",
    )
    return b"".join(lines)


PATCHERS = {
    ".ai/current_state.md": patch_current_state,
    ".ai/task_current.md": patch_task_current,
    ".ai/handoff.md": patch_handoff,
    ".ai/qa_checklist.md": patch_qa,
    ".ai/bugs.md": patch_bugs,
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

    # All preconditions and all transformations must succeed before any write.
    for rel, after in patched.items():
        (root / rel).write_bytes(after)

    for rel in FILES:
        before = originals[rel]
        after = patched[rel]
        print(
            f"PATCHED {rel} "
            f"blob_before={git_blob_sha(before)} "
            f"blob_after={git_blob_sha(after)} "
            f"bytes_before={len(before)} bytes_after={len(after)} "
            f"crlf={after.count(b'\\r\\n')} lf={after.count(b'\\n')}"
        )


if __name__ == "__main__":
    main()
