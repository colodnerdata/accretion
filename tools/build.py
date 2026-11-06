"""Combine the web sources into one publishable page."""

from pathlib import Path

ROOT = Path(__file__).parents[1]
WEB = ROOT / "web"
HEAD = """<title>Accretion</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap">
"""


def main() -> None:
    page = (
        HEAD
        + f"<style>\n{(WEB / 'style.css').read_text()}</style>\n"
        + (WEB / "body.html").read_text()
        + f"<script>\n{(WEB / 'engine.js').read_text()}\n"
        + f"{(WEB / 'app.js').read_text()}</script>\n"
    )
    (WEB / "accretion.html").write_text(page)


if __name__ == "__main__":
    main()
