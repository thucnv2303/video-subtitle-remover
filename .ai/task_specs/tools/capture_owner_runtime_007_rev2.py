from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"E:\Project AI")
RUNTIME = Path(r"E:\Project AI\Video-sub-remove")
CANONICAL_BASIS = "fd880a625ba6a43acf25f5556f6c97ba20c84026"
OUTPUT = Path(".ai/incidents/RECOVERY-007E-OWNER-RUNTIME-INVENTORY-007-REV2.json")

CRITICAL_PATHS = [
    "package.json",
    "src/main/main.js",
    "src/main/preload.js",
    "src/renderer/index.html",
    "src/renderer/styles/main.css",
    "src/renderer/js/app.js",
    "src/renderer/js/components/settings.js",
    "src/renderer/js/pipelines/pipeline1-ai.js",
    "src/renderer/js/pipelines/pipeline2-remove.js",
    "src/renderer/js/pipelines/pipeline3-finalize.js",
    "api/server.py",
]

SKIP_DIR_NAMES = {"node_modules", ".git", ".venv", "venv", "__pycache__"}


def run_git(*args: str) -> list[str]:
    completed = subprocess.run(
        ["git", "-C", str(RUNTIME), *args],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            f"git command failed ({completed.returncode}): git -C {RUNTIME} {' '.join(args)}\n"
            f"stderr: {completed.stderr.strip()}"
        )
    text = completed.stdout.replace("\r\n", "\n").replace("\r", "\n")
    return text.splitlines()


def first_line(lines: list[str]) -> str:
    return lines[0].strip() if lines else ""


def hash_runtime_path(relative_path: str) -> dict:
    path = RUNTIME / relative_path
    if not path.is_file():
        return {"path": relative_path, "exists": False, "git_blob": None}
    blob = first_line(run_git("hash-object", "--", relative_path))
    return {"path": relative_path, "exists": True, "git_blob": blob}


def iter_package_json(root: Path):
    for current_root, dir_names, file_names in os.walk(root):
        dir_names[:] = sorted(
            d for d in dir_names if d not in SKIP_DIR_NAMES
        )
        if "package.json" in file_names:
            yield Path(current_root) / "package.json"


def parse_package(path: Path) -> tuple[str | None, str | None]:
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        name = data.get("name")
        return (str(name) if name is not None else None, None)
    except Exception as exc:  # evidence only; keep exact parse failure text
        return (None, f"{type(exc).__name__}: {exc}")


def main() -> int:
    if not RUNTIME.is_dir():
        raise RuntimeError(f"Owner runtime not found: {RUNTIME}")
    if not (RUNTIME / ".git").exists():
        raise RuntimeError(f"Owner runtime is not a Git worktree: {RUNTIME}")

    head = first_line(run_git("rev-parse", "HEAD"))
    branch = first_line(run_git("branch", "--show-current")) or "DETACHED"

    top_level_directories = []
    for path in sorted((p for p in ROOT.iterdir() if p.is_dir()), key=lambda p: str(p).lower()):
        stat = path.stat()
        top_level_directories.append(
            {
                "name": path.name,
                "full_path": str(path),
                "last_write_utc": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
            }
        )

    runnable_candidates = []
    package_json_files = []
    for package_path in sorted(iter_package_json(ROOT), key=lambda p: str(p).lower()):
        package_name, parse_error = parse_package(package_path)
        record = {
            "package_json": str(package_path),
            "project_root": str(package_path.parent),
            "package_name": package_name,
            "parse_error": parse_error,
        }
        package_json_files.append(record)

        path_text = str(package_path.parent).lower()
        reason = None
        if package_name == "video-subtitle-remover":
            reason = "package_name"
        elif "video-sub-remove" in path_text or "video-subtitle-remover" in path_text:
            reason = "path_name"

        if reason:
            runnable_candidates.append(
                {
                    **record,
                    "candidate_reason": reason,
                    "is_owner_runtime": package_path.parent.resolve() == RUNTIME.resolve(),
                }
            )

    evidence = {
        "schema_version": 2,
        "captured_at_utc": datetime.now(timezone.utc).isoformat(),
        "root": str(ROOT),
        "canonical_basis": CANONICAL_BASIS,
        "owner_runtime": {
            "path": str(RUNTIME),
            "head": head,
            "branch_or_detached": branch,
            "remotes": run_git("remote", "-v"),
            "status_porcelain_v2": run_git("status", "--porcelain=v2", "--branch"),
            "unstaged_name_status": run_git("diff", "--name-status"),
            "staged_name_status": run_git("diff", "--cached", "--name-status"),
            "untracked": run_git("ls-files", "--others", "--exclude-standard"),
            "worktrees": run_git("worktree", "list", "--porcelain"),
            "local_branches": run_git("branch", "--format=%(refname:short) %(objectname)"),
            "remote_branches": run_git("branch", "-r", "--format=%(refname:short) %(objectname)"),
            "diff_name_status_vs_canonical_basis": run_git("diff", "--name-status", CANONICAL_BASIS),
            "runtime_critical": [hash_runtime_path(p) for p in CRITICAL_PATHS],
        },
        "top_level_directories": top_level_directories,
        "all_package_json_files_excluding_dependency_dirs": package_json_files,
        "vsr_runnable_candidates": runnable_candidates,
        "safety": {
            "cleanup_performed": False,
            "owner_runtime_modified_by_capture": False,
            "owner_runtime_must_not_be_deleted": True,
            "non_vsr_projects_default": "DO_NOT_TOUCH",
            "classification_status": "PM_REVIEW_REQUIRED",
        },
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Read back and minimally validate the generated evidence before returning success.
    loaded = json.loads(OUTPUT.read_text(encoding="utf-8"))
    if loaded["owner_runtime"]["path"] != str(RUNTIME):
        raise RuntimeError("Generated evidence failed runtime-path validation")
    if not loaded["owner_runtime"]["head"]:
        raise RuntimeError("Generated evidence failed HEAD validation")
    if not any(item.get("is_owner_runtime") for item in loaded["vsr_runnable_candidates"]):
        raise RuntimeError("Generated evidence did not identify the Owner runtime candidate")

    print(str(OUTPUT))
    print(f"owner_runtime_head={head}")
    print(f"owner_runtime_branch={branch}")
    print(f"vsr_runnable_candidates={len(runnable_candidates)}")
    print(f"top_level_directories={len(top_level_directories)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
