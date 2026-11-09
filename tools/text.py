"""Load and validate the game's TOML string tables.

Every player-facing sentence lives in ``content/*.toml``. Each file holds one
kind of writing and becomes the first part of every key: ``endings.toml``
defines ``endings.supernova.title``, and so on.

An entry is either a plain string, or a table with a ``text`` field plus
optional metadata. Only tables that contain ``text`` are entries; any other
table merely groups keys. The build embeds the merged result in the published
page as one JSON object, and the tests import this module so both run the same
checks over the same files.
"""

import re
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

# Metadata fields an entry may carry. Add new fields here (for example
# "status" or "source") and nowhere else.
ALLOWED_FIELDS = ("kind",)
# Values allowed for the "kind" field: the text tiers from
# docs/planning/teaching-principles.md.
ALLOWED_KINDS = ("hook", "tooltip", "panel", "reference")
# Placeholders such as {brightness}: lowercase names describing meaning.
PLACEHOLDER = re.compile(r"\{([a-z][a-z0-9_]*)\}")
_KEY = re.compile(r"[a-z][a-z0-9_]*")


class TextError(ValueError):
    """Raised when a content file breaks the string-table contract."""


@dataclass
class TextTables:
    """The merged string tables: finished text plus any ``kind`` metadata."""

    texts: dict[str, str] = field(default_factory=dict)
    kinds: dict[str, str] = field(default_factory=dict)
    sources: dict[str, str] = field(default_factory=dict)


def _check_placeholders(key: str, text: str) -> None:
    """Fail on malformed placeholders; named ones such as ``{brightness}`` are fine."""
    for index, char in enumerate(text):
        if char != "{":
            continue
        match = PLACEHOLDER.match(text, index)
        if not match:
            token = (
                text[index:].split("}", 1)[0] + "}"
                if "}" in text[index:]
                else text[index:]
            )
            raise TextError(f"{key}: '{token}' is not a valid placeholder")
    for name in PLACEHOLDER.findall(text):
        if name in ("kind",):
            raise TextError(f"{key}: placeholder '{name}' is reserved")


def _add_entry(tables: TextTables, key: str, entry: dict, source: Path) -> None:
    """Record one entry after checking its fields and metadata."""
    unknown = sorted(set(entry) - set(ALLOWED_FIELDS) - {"text"})
    if unknown:
        allowed = ", ".join(("text", *ALLOWED_FIELDS))
        raise TextError(
            f"{key} in {source.name}: unknown field '{unknown[0]}' (allowed: {allowed})"
        )
    if not isinstance(entry["text"], str):
        raise TextError(f"{key} in {source.name}: 'text' must be a string")
    kind = entry.get("kind")
    if kind is not None and kind not in ALLOWED_KINDS:
        values = ", ".join(ALLOWED_KINDS)
        raise TextError(f"{key} in {source.name}: kind '{kind}' is not one of {values}")
    if key in tables.texts:
        raise TextError(f"duplicate key {key}: {tables.sources[key]} vs {source.name}")
    _check_placeholders(key, entry["text"])
    tables.texts[key] = entry["text"]
    tables.sources[key] = source.name
    if kind is not None:
        tables.kinds[key] = kind


def _walk(tables: TextTables, table: dict, prefix: str, source: Path) -> None:
    """Flatten one file's nested tables into dotted keys."""
    for name, value in table.items():
        if not _KEY.fullmatch(name):
            raise TextError(f"{source.name}: key '{name}' must match {_KEY.pattern}")
        key = f"{prefix}{name}"
        if isinstance(value, str):
            _check_placeholders(key, value)
            if key in tables.texts:
                raise TextError(
                    f"duplicate key {key}: {tables.sources[key]} vs {source.name}"
                )
            tables.texts[key] = value
            tables.sources[key] = source.name
            continue
        if not isinstance(value, dict):
            raise TextError(
                f"{source.name}: value for '{key}' must be a string or a table"
            )
        if "text" in value:
            _add_entry(tables, key, value, source)
            continue
        _walk(tables, value, f"{key}.", source)


def load_tables(directory: Path) -> TextTables:
    """Read every ``*.toml`` in ``directory`` and return the merged tables.

    Parameters
    ----------
    directory : Path
        Folder holding the ``content/*.toml`` files.

    Returns
    -------
    TextTables
        ``texts`` maps each dotted key to its finished text; ``kinds`` maps
        the subset of keys that declared ``kind`` metadata to that kind.

    Raises
    ------
    TextError
        If two files produce the same key, a field or kind is unknown, a
        value is not text, or a placeholder is malformed.
    """
    tables = TextTables()
    for source in sorted(directory.glob("*.toml")):
        with source.open("rb") as handle:
            data = tomllib.load(handle)
        _walk(tables, data, f"{source.stem}.", source)
    return tables


def load_texts(directory: Path) -> dict[str, str]:
    """Return just the finished text, for the build step."""
    return load_tables(directory).texts


def placeholders(text: str) -> list[str]:
    """List the named placeholders in an entry, in order."""
    return PLACEHOLDER.findall(text)
