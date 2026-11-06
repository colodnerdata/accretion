"""Combine the web sources into one publishable page."""

from pathlib import Path

ROOT = Path(__file__).parents[1]
WEB = ROOT / "web"
HEAD = """<title>Accretion</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap">
"""


def read(name: str) -> str:
    """Return a web source as UTF-8 text, whatever the platform default."""
    return (WEB / name).read_text(encoding="utf-8")


def main() -> None:
    """Write web/accretion.html from the web sources."""
    page = (
        HEAD
        + f"<style>\n{read('style.css')}</style>\n"
        + read("body.html")
        + f"<script>\n{read('engine.js')}\n"
        + f"{read('app.js')}</script>\n"
    )
    (WEB / "accretion.html").write_text(page, encoding="utf-8")


if __name__ == "__main__":
    main()
