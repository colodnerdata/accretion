"""Capture a short screenshot loop for the Accretion HTML page with Playwright."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover - only used when the extra is missing.
    sync_playwright = None

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "web" / "accretion.html"
DEFAULT_OUT = Path("/tmp/accretion-fx")


def rebuild() -> None:
    """Rebuild the single-file page before screenshot capture."""
    subprocess.run([sys.executable, str(ROOT / "tools" / "build.py")], check=True)


def capture_sequence(page, out_dir: Path, *, width: int, height: int) -> None:
    """Capture a few representative frames across the opening loop."""
    page.set_viewport_size({"width": width, "height": height})
    page.goto(PAGE.resolve().as_uri(), wait_until="domcontentloaded")
    page.wait_for_timeout(500)

    # The game starts on a static sky; capture the opening state.
    out_dir.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=out_dir / f"start-{width}x{height}.png", full_page=False)

    sky = page.locator("#sky")
    if sky.count():
        # Tap the sky a handful of times to produce a readable gather phase.
        for _ in range(8):
            sky.click(position={"x": 180 + (_ % 3) * 80, "y": 160 + (_ % 4) * 70})
            page.wait_for_timeout(100)
        page.screenshot(path=out_dir / f"gather-{width}x{height}.png", full_page=False)

    journal = page.locator("#journal-button")
    if journal.count():
        journal.click()
        page.wait_for_timeout(250)
        page.screenshot(path=out_dir / f"journal-{width}x{height}.png", full_page=False)


def main(argv: list[str] | None = None) -> int:
    """Run the screenshot loop for the page at the supplied output directory."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT,
        help="directory to receive the generated screenshots (default: /tmp/accretion-fx)",
    )
    parser.add_argument(
        "--without-rebuild",
        action="store_true",
        help="skip rebuilding web/accretion.html before capturing screenshots",
    )
    args = parser.parse_args(argv)

    if not PAGE.exists():
        raise FileNotFoundError(f"Missing page: {PAGE}")
    if not args.without_rebuild:
        rebuild()

    if sync_playwright is None:
        print(
            "Playwright is not installed. Run: python -m pip install playwright\n"
            "Then install a browser: python -m playwright install chromium",
            file=sys.stderr,
        )
        return 1

    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            for width, height in ((1280, 1000), (390, 844)):
                capture_sequence(page, out_dir, width=width, height=height)
        finally:
            browser.close()

    print(f"Screenshots written to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
