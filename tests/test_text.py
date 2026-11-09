"""Checks on the game's content string tables and their use in web/app.js.

The loader (tools/text.py) validates structure, metadata, and placeholders; a
failure there fails test_content_files_load_and_validate. The other tests cross
the tables against t("...") call sites in web/app.js and {{key}} uses in
web/body.html.
"""

import re
import tempfile
import warnings
from functools import lru_cache
from pathlib import Path

import pytest

from text import TextError, load_tables, placeholders

ROOT = Path(__file__).parents[1]
CONTENT = ROOT / "content"
APP_JS = (ROOT / "web" / "app.js").read_text(encoding="utf-8")
BODY_HTML = (ROOT / "web" / "body.html").read_text(encoding="utf-8")

KEY = re.compile(r'\bt\(\s*["\']([a-z][a-z0-9_.]*)["\']')
TEMPLATE_KEY = re.compile(r"\{\{([a-z][a-z0-9_.]*)\}\}")
PLACEHOLDER_ARG = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)\s*:")

# Reserved by the spec for the future narrator voice; exempt from the unused check.
RESERVED_PREFIX = "voice."

# Banned word check. Matching is case-insensitive; extend this list freely.
BANNED = (
    (r"\bburn\w*\b", '"burn" and its forms'),
    (r"\bdying\b", '"dying"'),
    (r"\bzero\s+gravity\b", '"zero gravity"'),
    (r"\bgravity\s+cancell?s?\b", '"gravity cancels"'),
)

WORD_RANGES = {
    "hook": (5, 12),
    "tooltip": (25, 50),
    "panel": (60, 150),
    "reference": None,
}

# Strings the leftover-text heuristic may ignore: fonts, colors, identifiers.
LEFTOVER_ALLOWLIST = re.compile(r"^(IBM Plex Mono|var\(--|#|accretion-|en-US|\d)")


@lru_cache
def tables():
    """Load and validate every content file, once."""
    return load_tables(CONTENT)


def texts() -> dict:
    """The merged key-to-text map."""
    return tables().texts


def call_sites() -> list:
    """Every t call site with the placeholder names the object literal supplies."""
    sites = []
    for match in KEY.finditer(APP_JS):
        open_index = APP_JS.index("(", match.start())
        close = _closing_paren(APP_JS, open_index)
        args = APP_JS[open_index + 1 : close]
        if "," not in args:
            sites.append((match.group(1), set()))
            continue
        _object, close_brace = _outer_braces(args)
        names = set(PLACEHOLDER_ARG.findall(args[:close_brace]))
        sites.append((match.group(1), names))
    return sites


def _closing_paren(source: str, open_index: int) -> int:
    """Index of the paren closing the one at open_index, skipping string literals."""
    quote = None
    depth = 0
    index = open_index
    while index < len(source):
        char = source[index]
        if quote:
            if char == "\\":
                index += 2
                continue
            if char == quote:
                quote = None
        elif char in "\"'`":
            quote = char
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return index
        index += 1
    raise ValueError(f"unbalanced parentheses in web/app.js near offset {open_index}")


def _outer_braces(args: str) -> tuple:
    """The span of the first top-level {..} object literal in a call's argument text."""
    start = args.index("{")
    depth = 0
    for index in range(start, len(args)):
        if args[index] == "{":
            depth += 1
        elif args[index] == "}":
            depth -= 1
            if depth == 0:
                return args[start:index], index
    raise ValueError(f"unbalanced braces in web/app.js arguments: {args[:80]!r}")


def used_keys() -> set:
    """Keys the game can reach: t("...") calls plus body.html substitutions."""
    dynamic = set(KEY.findall(APP_JS))
    assert not re.search(r"\bt\(\s*`", APP_JS), (
        "build t() keys with template literals; list every key literally"
    )
    return dynamic | set(TEMPLATE_KEY.findall(BODY_HTML)) - {""}


def word_count(text: str) -> int:
    """Words in an entry; each {placeholder} counts as one word."""
    filled = re.sub(r"\{[a-z][a-z0-9_]*\}", "x", text)
    return len(filled.split())


def test_content_files_load_and_validate():
    """Every content file parses, keys are unique, metadata and kinds are valid."""
    for stem in ("ui", "hints", "notes", "endings", "voice"):
        assert (CONTENT / f"{stem}.toml").exists()
    assert texts(), "no entries loaded"
    assert not [key for key in texts() if key.startswith("voice.")], (
        "voice.toml must stay entry-free"
    )


def test_rejects_unknown_metadata_and_kinds():
    """The loader fails on unknown fields, bad kinds, and malformed placeholders."""
    cases = [
        '[a.x]\ntext = "Hi"\nstatus = "new"\n',
        '[a.x]\ntext = "Hi"\nkind = "warning"\n',
        '[a.x]\ntext = "Bad {Placeholder} here"\n',
        '[a.x]\ntext = "Broken brace {here"\n',
    ]
    for bad in cases:
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "ztest.toml").write_text(bad, encoding="utf-8")
            with pytest.raises(TextError):
                load_tables(Path(tmp))


def test_every_key_used_exists():
    """Each key the code asks for exists in the tables."""
    missing = sorted(key for key in used_keys() if key not in texts())
    assert not missing, f"t() or body.html uses missing keys: {missing}"


def test_placeholders_match_call_sites():
    """Each call site supplies exactly the placeholders its entry names."""
    problems = []
    required = {key: set(placeholders(text)) for key, text in texts().items()}
    for key, supplied in call_sites():
        if key not in required:
            continue
        if supplied != required[key]:
            problems.append(
                f"{key}: entry wants {sorted(required[key])}, "
                f"call site supplies {sorted(supplied)}"
            )
    assert not problems, problems


def test_no_unused_entries():
    """Every entry is reachable from the code or body.html, apart from voice.toml."""
    unused = sorted(set(texts()) - used_keys())
    assert not unused, f"no code path uses these entries: {unused}"


@pytest.mark.parametrize(("pattern", "reason"), BANNED)
def test_no_banned_words(pattern, reason):
    """No entry contains a banned word or phrase; extend BANNED above."""
    offenders = {
        key: texts()[key]
        for key in texts()
        if re.search(pattern, texts()[key], re.IGNORECASE)
    }
    assert not offenders, f"{reason} found in: {sorted(offenders)}"


def test_length_report():
    """Report word counts against each tier's range, without failing.

    Read it with ``uv run --locked pytest tests/test_text.py::test_length_report -s``.
    """
    ranges = {}
    for kind, bounds in WORD_RANGES.items():
        ranges[kind] = "none" if bounds is None else f"{bounds[0]}-{bounds[1]}"
    ranges["reference"] = "none"
    out = []
    for key in sorted(tables().kinds):
        kind = tables().kinds[key]
        count = word_count(texts()[key])
        bounds = WORD_RANGES[kind]
        if bounds is None:
            note = "OK"
        else:
            low, high = bounds
            note = "OK" if low <= count <= high else f"outside {low}-{high}"
        out.append(f"{key}\t{kind}\t{count}\t{note}")
    print("key\tkind\twords\tcheck")
    print("\n".join(out))
    assert all(kind in ranges for kind in tables().kinds.values())


def test_leftover_text_report():
    """Warn about string literals in app.js that look like English sentences.

    This heuristic is advisory: app.js contains markup, fonts, and identifiers
    near the player-facing strings, so a hard failure would be noisy.
    """
    suspects = []
    for literal in _string_literals(APP_JS):
        if LEFTOVER_ALLOWLIST.match(literal):
            continue
        for run in re.finditer(
            r"\b[A-Z][A-Za-z']*\b(?:\s+[A-Z][A-Za-z']*){2,}", literal
        ):
            suspects.append(f"...{run.group(0)}... in {literal[:80]!r}")
    if suspects:
        warnings.warn(
            "possible player-facing text left in web/app.js:\n" + "\n".join(suspects),
            stacklevel=2,
        )


def _string_literals(source: str) -> list:
    """String literals from app.js with ${...} interpolation removed."""
    out = []
    source = re.sub(r"\$\{[^}]*\}", "", source)
    for pattern in (r'"([^"\\\n]+)"', r"'([^'\\\n]+)'", r"`([^`]*)`"):
        out.extend(re.findall(pattern, source))
    return out
