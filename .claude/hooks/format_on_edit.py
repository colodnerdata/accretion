"""PostToolUse hook: format an edited Python file and report lint findings.

This is the only automated step that changes files. It runs
``ruff format`` on the one file Claude just edited, then ``ruff check``
on it without ``--fix``. Lint findings are reported back to Claude as
context and never fixed automatically: Claude often adds an import in one
edit and uses it in the next, and an autofix in between would delete the
import as unused.
"""

import json
import os
import subprocess
import sys
from pathlib import Path


def _run(args: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["uv", "run", "--locked", "--quiet", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )


def main() -> int:
    """Format the edited file and pass any lint findings back to Claude."""
    payload = json.load(sys.stdin)
    file_path = payload.get("tool_input", {}).get("file_path", "")
    if not file_path.endswith(".py"):
        return 0
    project_dir = Path(os.environ.get("CLAUDE_PROJECT_DIR", payload["cwd"]))
    path = project_dir / file_path
    if not path.is_file():
        return 0
    messages = []
    formatted = _run(["ruff", "format", str(path)], project_dir)
    if formatted.returncode != 0:
        messages.append(formatted.stdout + formatted.stderr)
    checked = _run(["ruff", "check", str(path)], project_dir)
    if checked.returncode != 0:
        messages.append(checked.stdout + checked.stderr)
    if messages:
        context = "\n".join(m.strip() for m in messages)
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": f"ruff on {file_path}:\n{context}",
            }
        }
        print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
