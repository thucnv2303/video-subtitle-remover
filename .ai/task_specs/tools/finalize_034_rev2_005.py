from pathlib import Path
import hashlib
import sys

FILES = {
    ".ai/current_state.md": "97284e8eb0ee97d9913cfe0125ca401db6997647",
    ".ai/task_current.md": "0b797429fae3a9966abab44fc6beb82bf7a12fb7",
    ".ai/handoff.md": "f4af5f943ab1f54b2bc87b3a1e7fa4aff6c77ddd",
}


def fail(message: str) -> None:
    print(f"STOP — PM BYTE PATCH PRECONDITION FAILED: {message}", file=sys.stderr)
    raise SystemExit(2)


def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def replace_unique(data: bytes, old: str, new: str, label: str) -> bytes:
    old_b = old.encode("utf-8")
    new_b = new.encode("utf-8")
    count = data.count(old_b)
    if count != 1:
        fail(f"{label}: expected 1 match, got {count}")
    return data.replace(old_b, new_b, 1)


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
        section = replace_unique(section, old, new, label)
    return prefix + section + suffix


def patch_current_state(data: bytes) -> bytes:
    data = replace_unique(
        data,
        "WAITING_OWNER_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
        "WAITING_PM_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2",
        "current_state status",
    )
    data = replace_unique(
        data,
        '- Owner observation: Owner ngày 2026-08-07 báo phần UI vừa kiểm tra "đã xong". Lịch sử source commit bd5e16f7 đã chứa .ai files.',
        "- Owner observation: Owner reported on 2026-08-07: task 34 đã oke",
        "current_state owner observation",
    )
    data = replace_in_section(
        data,
        "## Active Task / PR",
        "### Historical: 032/033/034 ancestry",
        [
            ("- Owner retest: WAITING", "- Owner retest: PASS", "current_state owner retest"),
        ],
    )
    data = replace_in_section(
        data,
        "## Verification Gates",
        "## Security Incident",
        [
            ("- Owner: WAITING", "- Owner: PASS", "current_state owner gate"),
            ("- Documentation: PASS", "- Documentation: WAITING_PM_VERIFICATION", "current_state documentation gate"),
        ],
    )
    data = replace_unique(
        data,
        "Owner evidence: direct Owner report on 2026-08-07: \\task 34 đã oke",
        "Owner evidence: direct Owner report on 2026-08-07: task 34 đã oke",
        "current_state lower owner evidence",
    )
    return data


def patch_task_current(data: bytes) -> bytes:
    return replace_unique(
        data,
        "- Owner observation: direct Owner report on 2026-08-07: \\task 34 đã oke",
        "- Owner observation: direct Owner report on 2026-08-07: task 34 đã oke",
        "task_current owner evidence",
    )


def patch_handoff(data: bytes) -> bytes:
    data = replace_unique(
        data,
        '- Owner observation: Owner ngày 2026-08-07 báo phần UI vừa kiểm tra "đã xong". Lịch sử source commit bd5e16f7 đã chứa .ai files.',
        "- Owner observation: Owner reported on 2026-08-07: task 34 đã oke",
        "handoff owner observation",
    )
    data = replace_unique(
        data,
        "PASS (direct Owner report on 2026-08-07: \\task 34 đã oke)",
        "PASS (direct Owner report on 2026-08-07: task 34 đã oke)",
        "handoff owner verification evidence",
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
        print(
            f"PATCHED {rel} "
            f"blob_before={git_blob_sha(before)} "
            f"blob_after={git_blob_sha(after)} "
            f"bytes_before={len(before)} bytes_after={len(after)} "
            f"crlf={after.count(b'\\r\\n')} lf={after.count(b'\\n')}"
        )


if __name__ == "__main__":
    main()
