"""PreToolUse hook: ask before Claude edits a committed test file.

New and uncommitted test files stay free to edit, so the red step of
test-first work runs without prompts. Once a test is committed, an edit
to it needs the owner's approval, so a failing test is fixed by changing
the code, not the test.

"Committed" means the file exists in ``HEAD``. The hook prints a
PreToolUse ``ask`` decision as JSON on stdout and exits 0; for any other
file it prints nothing.
"""

import json
import os
import subprocess
import sys
from pathlib import Path


def committed_test_path(file_path: str, project_dir: Path) -> str | None:
    """Return the repo-relative path if it is a committed test file.

    Parameters
    ----------
    file_path : str
        Path from the tool call, absolute or relative to ``project_dir``.
    project_dir : Path
        Root of the git checkout.

    Returns
    -------
    str or None
        The POSIX path relative to ``project_dir`` when the file is under
        ``tests/`` and exists in ``HEAD``, otherwise None.
    """
    root = project_dir.resolve()
    try:
        relative = (root / file_path).resolve().relative_to(root)
    except ValueError:
        return None
    if relative.parts[:1] != ("tests",):
        return None
    result = subprocess.run(
        [
            "git",
            "-C",
            str(root),
            "cat-file",
            "-e",
            f"HEAD:{relative.as_posix()}",
        ],
        capture_output=True,
        check=False,
    )
    return relative.as_posix() if result.returncode == 0 else None


def main() -> int:
    """Read the hook input and ask before a committed test is edited."""
    payload = json.load(sys.stdin)
    file_path = payload.get("tool_input", {}).get("file_path", "")
    project_dir = Path(os.environ.get("CLAUDE_PROJECT_DIR", payload["cwd"]))
    relative = committed_test_path(file_path, project_dir)
    if relative is None:
        return 0
    decision = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": (
                f"{relative} is a committed test. Approve only if the test "
                "itself is wrong; otherwise fix the code."
            ),
        }
    }
    print(json.dumps(decision))
    return 0


if __name__ == "__main__":
    sys.exit(main())
