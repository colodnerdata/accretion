"""Combine the web sources into one publishable page."""

import argparse
import json
import re
import sys
from html import escape
from pathlib import Path

from text import TextError, load_texts

ROOT = Path(__file__).parents[1]
WEB = ROOT / "web"
CONTENT = ROOT / "content"
HEAD = """<title>Accretion</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap">
"""
TEMPLATE_KEY = re.compile(r"\{\{([a-z][a-z0-9_.]*)\}\}")


def read(name: str) -> str:
    """Return a web source as UTF-8 text, whatever the platform default."""
    return (WEB / name).read_text(encoding="utf-8")


def fill_static_keys(body: str, texts: dict[str, str]) -> str:
    """Replace {{key}} placeholders in body.html with their content text, escaped."""

    def substitute(match: re.Match) -> str:
        key = match.group(1)
        if key not in texts:
            raise TextError(f"web/body.html uses unknown content key '{key}'")
        return escape(texts[key], quote=True)

    return TEMPLATE_KEY.sub(substitute, body)


def text_json(texts: dict[str, str]) -> str:
    """Serialize the string tables as the JavaScript object embedded in the page."""
    blob = json.dumps(texts, ensure_ascii=False, sort_keys=True)
    if "</script" in blob.lower() or "<!--" in blob:
        raise TextError("content text would close the script tag; reword it")
    return blob


def build_page() -> str:
    """Return the single-file page assembled from the web sources."""
    texts = load_texts(CONTENT)
    return (
        HEAD
        + f"<style>\n{read('style.css')}</style>\n"
        + fill_static_keys(read("body.html"), texts)
        + f"<script>\n{read('visuals.js')}\n{read('engine.js')}\n"
        + f"const TEXT = {text_json(texts)};\n{read('app.js')}</script>\n"
    )


def main(argv: list[str] | None = None) -> int:
    """Write web/accretion.html, or with ``--check`` verify it is current.

    Parameters
    ----------
    argv : list of str, optional
        Command-line arguments; defaults to ``sys.argv[1:]``.

    Returns
    -------
    int
        0 on success, 1 if ``--check`` finds the file missing or stale.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="exit 1 if web/accretion.html does not match the sources",
    )
    args = parser.parse_args(argv)
    page = build_page()
    target = WEB / "accretion.html"
    if args.check:
        try:
            current = target.read_text(encoding="utf-8")
        except FileNotFoundError:
            current = None
        if current != page:
            print("web/accretion.html is out of date; run: python tools/build.py")
            return 1
        return 0
    target.write_text(page, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
