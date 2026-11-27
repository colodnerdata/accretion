"""Check the Claude Code hooks' decisions through their real stdin and stdout.

Each hook runs as a subprocess with the JSON Claude Code would send, so
these tests cover the script boundary, not only its helper functions.
They do not run Claude Code itself.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
HOOKS = ROOT / ".claude" / "hooks"


def env_without_project_dir() -> dict[str, str]:
    """The test environment, so hooks fall back to the payload's cwd."""
    env = dict(os.environ)
    env.pop("CLAUDE_PROJECT_DIR", None)
    return env


def run_hook(
    name: str, payload: dict, env: dict | None = None
) -> subprocess.CompletedProcess[str]:
    """Run one hook script with ``payload`` on stdin."""
    return subprocess.run(
        [sys.executable, str(HOOKS / name)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        check=False,
        env=env,
    )


def bash_call(command: str) -> dict:
    return {"tool_name": "Bash", "tool_input": {"command": command}}


@pytest.mark.parametrize(
    "command",
    [
        "git commit --no-verify -m 'wip'",
        "git commit -n -m 'wip'",
        "git commit -anm 'wip'",
        "git -c core.hooksPath=/dev/null commit -m 'wip'",
        "git config --unset core.hooksPath",
        "git config core.hookspath /tmp/no-hooks",
        "git push --no-verify",
        # An attached message value must not hide a later -n.
        "git commit -mtest -n",
        "git commit --message=test -n",
        "git commit --no-veri -m 'wip'",
        "git -C . commit -n -m 'wip'",
        "git add . && git commit -n -m 'wip'",
        "GIT_CONFIG_KEY_0=core.hooksPath git commit -m 'wip'",
        "git --config-env=core.hooksPath=HOOKS commit -m 'wip'",
        # Quoted punctuation is a value, not a command boundary.
        "git commit -m ';' -n",
        "git commit -m '&&' --no-verify",
        'git commit -m"a;b c" -n',
    ],
)
def test_block_no_verify_blocks_skipping_the_check(command: str) -> None:
    result = run_hook("block_no_verify.py", bash_call(command))
    assert result.returncode == 2
    assert result.stderr


@pytest.mark.parametrize(
    "command",
    [
        "git commit -m 'fix -n handling'",
        "git commit -am 'wip'",
        "git commit -m -n",
        "git log -n 5",
        # Option values and other commands are not commit flags.
        "git commit -m fix && git log -n 1",
        "git commit -m '--no-verify'",
        "git commit --message '-n'",
        "git commit --mess '-n'",
        "git commit -F notes.txt -- -n",
        "git config core.hooksPath .githooks",
        "git config --get core.hooksPath",
        "git -c core.hooksPath=.githooks commit -m 'wip'",
        "uv run --locked pytest",
        "git commit -m 'a; b' && git log -n 1",
        "echo \"it's\" ; git commit -m 'wip'",
    ],
)
def test_block_no_verify_allows_ordinary_commands(command: str) -> None:
    result = run_hook("block_no_verify.py", bash_call(command))
    assert result.returncode == 0
    assert result.stderr == ""


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    """A git repo with one committed test and one uncommitted test."""

    def git(*args: str) -> None:
        subprocess.run(["git", "-C", str(tmp_path), *args], check=True)

    git("init", "-q")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "test_old.py").write_text("")
    (tmp_path / "notes.py").write_text("")
    git("add", ".")
    git(
        "-c",
        "user.name=test",
        "-c",
        "user.email=test@example.invalid",
        "commit",
        "-q",
        "-m",
        "init",
    )
    (tmp_path / "tests" / "test_new.py").write_text("")
    return tmp_path


def edit_call(file_path: str, cwd: Path) -> dict:
    return {
        "tool_name": "Edit",
        "tool_input": {"file_path": file_path},
        "cwd": str(cwd),
    }


@pytest.mark.parametrize("file_path", ["tests/test_old.py", "{repo}/tests/test_old.py"])
def test_ask_before_editing_a_committed_test(repo: Path, file_path: str) -> None:
    payload = edit_call(file_path.format(repo=repo), repo)
    result = run_hook("ask_before_test_edit.py", payload, env=env_without_project_dir())
    assert result.returncode == 0
    decision = json.loads(result.stdout)["hookSpecificOutput"]
    assert decision["permissionDecision"] == "ask"
    assert "tests/test_old.py" in decision["permissionDecisionReason"]


@pytest.mark.parametrize(
    "file_path", ["tests/test_new.py", "notes.py", "/elsewhere/tests/x.py"]
)
def test_no_prompt_for_new_tests_or_other_files(repo: Path, file_path: str) -> None:
    payload = edit_call(file_path, repo)
    result = run_hook("ask_before_test_edit.py", payload, env=env_without_project_dir())
    assert result.returncode == 0
    assert result.stdout == ""


def test_format_on_edit_formats_but_keeps_an_unused_import(
    tmp_path: Path,
) -> None:
    """Lint findings are reported, never fixed, so the import survives."""
    edited = tmp_path / "draft.py"
    edited.write_text("import os\nx=1\n")
    payload = {
        "tool_name": "Edit",
        "tool_input": {"file_path": str(edited)},
        "cwd": str(ROOT),
    }
    result = run_hook("format_on_edit.py", payload, env=env_without_project_dir())
    assert result.returncode == 0
    assert edited.read_text() == "import os\n\nx = 1\n"
    context = json.loads(result.stdout)["hookSpecificOutput"]
    assert "F401" in context["additionalContext"]
