from pathlib import Path
import hashlib
import sys

HANDOFF = ".ai/handoff.md"
EXPECTED_BLOB = "2d7e7bd83e00bac9ba6c6a5bf4ab0fa2690e5ef9"


def fail(message: str) -> None:
    print("STOP — HANDOFF RECONCILE 008 PRECONDITION FAILED: " + message, file=sys.stderr)
    raise SystemExit(2)


def git_blob_sha(data: bytes) -> str:
    header = ("blob " + str(len(data)) + "\0").encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def split_line(line: bytes):
    if line.endswith(b"\r\n"):
        return line[:-2], b"\r\n"
    if line.endswith(b"\n"):
        return line[:-1], b"\n"
    if line.endswith(b"\r"):
        return line[:-1], b"\r"
    return line, b""


def find_unique(lines, text: str, start: int, end: int, label: str):
    target = text.encode("utf-8")
    matches = []
    for i in range(start, end):
        body, eol = split_line(lines[i])
        if body == target:
            matches.append((i, eol))
    if len(matches) != 1:
        fail(label + ": expected 1 match, got " + str(len(matches)))
    return matches[0]


def replace_unique(lines, start: int, end: int, old: str, new: str, label: str) -> None:
    i, eol = find_unique(lines, old, start, end, label)
    lines[i] = new.encode("utf-8") + eol


def main() -> None:
    root = Path.cwd()
    path = root / HANDOFF
    if not path.is_file():
        fail("missing .ai/handoff.md")

    before = path.read_bytes()
    actual = git_blob_sha(before)
    if actual != EXPECTED_BLOB:
        fail("handoff blob mismatch: expected " + EXPECTED_BLOB + ", got " + actual)

    lines = before.splitlines(keepends=True)
    status_i, _ = find_unique(lines, "## Status", 0, len(lines), "status header")
    ancestry_i, _ = find_unique(lines, "## PR Ancestry Facts", status_i + 1, len(lines), "PR ancestry header")

    replace_unique(
        lines,
        status_i,
        ancestry_i,
        "## Status",
        "## Historical Status — AI Settings / PR #8 lineage",
        "historical status heading",
    )
    replace_unique(
        lines,
        status_i,
        ancestry_i,
        "- DeepSeek API key visible in owner screenshot is COMPROMISED. Owner must rotate key.",
        "- Historical security note: the clear-text Settings UI defect was source-fixed. Owner clarified on 2026-08-08 that the screenshot shared with PM had key material redacted before sharing; that shared evidence does not establish usable credential exposure or a key-rotation merge blocker.",
        "security clarification",
    )
    replace_unique(
        lines,
        status_i,
        ancestry_i,
        "- Owner manual verification: NOT STARTED.",
        "- Historical Owner manual verification at that earlier stage: NOT STARTED.",
        "historical owner state",
    )

    after = b"".join(lines)
    if after == before:
        fail("patch produced no change")
    if before.count(b"\r\n") != after.count(b"\r\n"):
        fail("CRLF count changed")
    if before.count(b"\n") != after.count(b"\n"):
        fail("LF count changed")

    path.write_bytes(after)

    print("PATCHED " + HANDOFF)
    print("blob_before=" + git_blob_sha(before))
    print("blob_after=" + git_blob_sha(after))
    print("bytes_before=" + str(len(before)) + " bytes_after=" + str(len(after)))
    print("crlf=" + str(after.count(b"\r\n")) + " lf=" + str(after.count(b"\n")))


if __name__ == "__main__":
    main()
