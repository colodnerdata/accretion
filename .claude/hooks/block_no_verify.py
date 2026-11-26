"""PreToolUse hook: block git commands that skip the commit-time check.

Claude Code passes the tool call as JSON on stdin. For a Bash call, this
hook exits with status 2 (block, with the reason on stderr) when the
command would skip ``.githooks/pre-commit``:

- ``--no-verify``, or ``-n`` in ``git commit``, given as an option;
- a ``core.hooksPath`` value other than ``.githooks``, or unsetting it,
  which points git at other hooks or none.

The command is split at unquoted shell operators (``&&``, ``;``, ``|``
and the like), and each git invocation is read on its own, so a flag of
one command is never taken for a flag of another. Option values are consumed
before flags are checked, so a commit message such as ``-n`` or
``--no-verify`` is not a flag.

This is a best effort on the command's words: it does not look inside
``sh -c '...'`` strings or scripts. CI and the main ruleset are the
backstop for anything it misses.
"""

import json
import sys
from pathlib import PurePosixPath

_ALLOWED_HOOKS_PATHS = {".githooks", "./.githooks"}

# Global git options that take the next word as their value.
_GLOBAL_OPTIONS_WITH_VALUE = {
    "-c",
    "-C",
    "--git-dir",
    "--work-tree",
    "--namespace",
    "--config-env",
}

# ``git commit`` short options whose value is attached or is the next word.
_COMMIT_SHORT_WITH_VALUE = set("mFCct")
# Short options whose optional value can only be attached (``-S<keyid>``).
_COMMIT_SHORT_WITH_ATTACHED_VALUE = set("Su")
# ``git commit`` long options that take the next word when no ``=`` is given.
_COMMIT_LONG_WITH_VALUE = {
    "author",
    "cleanup",
    "date",
    "file",
    "fixup",
    "message",
    "pathspec-from-file",
    "reedit-message",
    "reuse-message",
    "squash",
    "template",
    "trailer",
}


_OPERATOR_CHARS = set("();<>|&\n")


def _invocations(command: str) -> list[list[str]]:
    """Split ``command`` into the words of each simple command.

    Quotes and backslashes are removed as a POSIX shell would, and only
    unquoted operator characters end a command, so a quoted value such as
    ``-m ';'`` stays one word of its command.
    """
    invocations: list[list[str]] = [[]]
    word: list[str] = []
    in_word = False
    quote = ""
    chars = iter(command)
    for char in chars:
        if quote == "'":
            if char == "'":
                quote = ""
            else:
                word.append(char)
        elif char == "\\" and quote != "'":
            escaped = next(chars, "")
            if escaped != "\n":
                word.append(escaped)
            in_word = True
        elif quote == '"':
            if char == '"':
                quote = ""
            else:
                word.append(char)
        elif char in "'\"":
            quote = char
            in_word = True
        elif (char.isspace() and char != "\n") or char in _OPERATOR_CHARS:
            if in_word:
                invocations[-1].append("".join(word))
                word, in_word = [], False
            if char in _OPERATOR_CHARS and invocations[-1]:
                invocations.append([])
        else:
            word.append(char)
            in_word = True
    if quote:
        # Unbalanced quotes: fall back to plain words in one command.
        return [command.split()] if command.split() else []
    if in_word:
        invocations[-1].append("".join(word))
    return [words for words in invocations if words]


def _is_no_verify(word: str) -> bool:
    """Whether ``word`` is ``--no-verify`` or an abbreviation git accepts."""
    name = word.split("=", 1)[0].removeprefix("--")
    return (
        word.startswith("--")
        and len(name) >= len("no-veri")
        and ("no-verify".startswith(name))
    )


def _moves_hooks(setting: str) -> bool:
    """Whether a ``core.hooksPath=value`` setting points away from hooks."""
    key, _, value = setting.partition("=")
    if key.lower() != "core.hookspath":
        return False
    return value.rstrip("/") not in _ALLOWED_HOOKS_PATHS


def _long_option(word: str) -> str | None:
    """The ``git commit`` long option that ``word`` names, if it takes a value.

    Git accepts any unambiguous prefix of a long option.
    """
    name = word.removeprefix("--")
    matches = [opt for opt in _COMMIT_LONG_WITH_VALUE if opt.startswith(name)]
    return matches[0] if len(matches) == 1 else None


def _commit_reason(args: list[str]) -> str | None:
    """Why the arguments of ``git commit`` skip the check, or None."""
    skip_next = False
    for word in args:
        if skip_next:
            skip_next = False
            continue
        if word == "--":
            return None
        if word.startswith("--"):
            if _is_no_verify(word):
                return "--no-verify skips the commit-time check."
            skip_next = "=" not in word and _long_option(word) is not None
        elif word.startswith("-") and len(word) > 1:
            for position, letter in enumerate(word[1:], start=1):
                if letter == "n":
                    return "-n is --no-verify, which skips the commit check."
                if letter in _COMMIT_SHORT_WITH_VALUE:
                    skip_next = position == len(word) - 1
                    break
                if letter in _COMMIT_SHORT_WITH_ATTACHED_VALUE:
                    break
    return None


def _config_reason(args: list[str]) -> str | None:
    """Why the arguments of ``git config`` move the hooks, or None."""
    lowered = [word.lower() for word in args]
    if "core.hookspath" not in lowered:
        if "--remove-section" in lowered and "core" in lowered:
            return "Removing the core section unsets core.hooksPath."
        return None
    if {"--unset", "--unset-all", "unset"} & set(lowered):
        return "Unsetting core.hooksPath skips the commit-time check."
    rest = args[lowered.index("core.hookspath") + 1 :]
    values = [word for word in rest if not word.startswith("-")]
    if values and _moves_hooks(f"core.hooksPath={values[0]}"):
        return "Changing core.hooksPath skips the commit-time check."
    return None


def _git_reason(words: list[str]) -> str | None:
    """Why one simple command skips the commit check, or None."""
    while words and "=" in words[0] and not words[0].startswith("-"):
        if "hookspath" in words[0].lower():
            return "Setting git config from the environment can move hooks."
        words = words[1:]
    if not words or PurePosixPath(words[0]).name != "git":
        return None
    index = 1
    while index < len(words) and words[index].startswith("-"):
        option = words[index]
        name, has_value, value = option.partition("=")
        if name in _GLOBAL_OPTIONS_WITH_VALUE and not has_value:
            index += 1
            value = words[index] if index < len(words) else ""
        config_key = value.partition("=")[0].lower()
        if (name == "-c" and _moves_hooks(value)) or (
            name == "--config-env" and config_key == "core.hookspath"
        ):
            return "Overriding core.hooksPath skips the commit-time check."
        index += 1
    if index >= len(words):
        return None
    subcommand, args = words[index], words[index + 1 :]
    if subcommand == "commit":
        return _commit_reason(args)
    if subcommand == "config":
        return _config_reason(args)
    if any(_is_no_verify(word) for word in args):
        return "--no-verify skips the repository's git hooks."
    return None


def skip_reason(command: str) -> str | None:
    """Return why ``command`` would skip the commit check, or None.

    Parameters
    ----------
    command : str
        The shell command Claude is about to run.

    Returns
    -------
    str or None
        A message for Claude, or None when the command is allowed.
    """
    for words in _invocations(command):
        reason = _git_reason(words)
        if reason is not None:
            return reason
    return None


def main() -> int:
    """Read the hook input and block a command that skips the check."""
    payload = json.load(sys.stdin)
    command = payload.get("tool_input", {}).get("command", "")
    reason = skip_reason(command)
    if reason is None:
        return 0
    print(
        f"{reason} Fix what the check reports and commit again.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
