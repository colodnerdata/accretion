<<<<<<< HEAD
"""Capture the built game through a full run for visual review.

One browser run per (width, reduced motion) combination: the page is built by
``tools/build.py``, opened from disk in Chromium, and played through gather,
collapse, accrete, shine and the ending at the test speeds, tapping the sky
and buying what is affordable like a player would. A screenshot is saved at
each step, then on the survey screen and in the journal. Files land under
``.scratch/screens/<width>-<motion>/<step>.png`` and are printed.

Examples
--------
Full runs at both widths::

    uv run python tools/shoot.py

Only through the accretion phase, in a custom folder::

    uv run python tools/shoot.py --phase accrete --out .scratch/quick
"""
=======
"""Capture a short screenshot loop for the Accretion HTML page with Playwright."""

from __future__ import annotations
>>>>>>> 6f54cf2 (Apply remaining changes)

import argparse
import subprocess
import sys
<<<<<<< HEAD
import time
from pathlib import Path

from playwright.sync_api import Browser, Page
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

ROOT = Path(__file__).parents[1]
PAGE = ROOT / "web" / "accretion.html"
DEFAULT_OUT = ROOT / ".scratch" / "screens"
WIDTHS = (390, 1280)
MOTIONS = ("standard", "reduce")
SPEED_TIMEOUT_MS = 180_000

# Play steps in run order: the five phases by their track index, then the two
# screens that follow an ended run.
STEPS = (
    ("gather", 0),
    ("collapse", 1),
    ("accrete", 2),
    ("shine", 3),
    ("ended", 4),
    ("search", 5),
    ("journal", 6),
)


def build_page() -> None:
    """Run tools/build.py so web/accretion.html matches the sources."""
    subprocess.run(
        [sys.executable, str(ROOT / "tools" / "build.py")], cwd=ROOT, check=True
    )


def is_active(page: Page, track_index: int) -> bool:
    """Return whether the track marks this phase index as the active step."""
    return page.evaluate(
        """(index) => {
            const spans = document.querySelectorAll('#track span');
            return spans.length > index && spans[index].classList.contains('now');
        }""",
        track_index,
    )


def buy_affordable(page: Page) -> None:
    """Click every visible, affordable buy button, as a player would."""
    page.evaluate(
        "document.querySelectorAll('#upgrades .buy:not([disabled])')"
        ".forEach((button) => button.click())"
    )


def screenshot(page: Page, name: str, folder: Path, written: list[Path]) -> None:
    """Save one step screenshot and record it."""
    path = folder / f"{name}.png"
    page.screenshot(path=path)
    written.append(path)


def tap_until_collapse(page: Page, deadline: float) -> None:
    """Tap the sky and buy until the track leaves the gather phase.

    Raises
    ------
    TimeoutError
        If the gather phase does not end within its time budget.
    """
    while True:
        if is_active(page, 1):
            return
        if time.monotonic() > deadline:
            raise PlaywrightTimeoutError("gather never reached collapse")
        page.click("#sky")
        buy_affordable(page)
        page.wait_for_timeout(25)


def shoot_run(
    browser: Browser, width: int, motion: str, out_dir: Path, through: str
) -> list[Path]:
    """Drive one full run at one width and reduced-motion setting.

    Parameters
    ----------
    browser : Browser
        Playwright browser to open the pages in.
    width : int
        Viewport width in pixels.
    motion : str
        Either ``standard`` or ``reduce``.
    out_dir : Path
        Root folder for the screenshots; a subfolder holds one run.
    through : str
        Last step name to capture, from ``STEPS``.

    Returns
    -------
    list[Path]
        Paths of the screenshots written, in capture order.
    """
    folder = out_dir / f"{width}-{motion}"
    folder.mkdir(parents=True, exist_ok=True)
    context = browser.new_context(
        viewport={"width": width, "height": 844 if width == 390 else 900}
    )
    page = context.new_page()
    page.add_init_script("try { localStorage.clear() } catch (err) {}")
    if motion == "reduce":
        page.emulate_media(reduced_motion="reduce")
    page.goto(PAGE.as_uri())
    page.wait_for_selector("#track span.now")
    written: list[Path] = []
    names = [name for name, _ in STEPS]
    screenshot(page, "gather", folder, written)
    if through == "gather":
        context.close()
        return written
    page.click('button[data-s="10"]')
    tap_until_collapse(page, time.monotonic() + SPEED_TIMEOUT_MS / 1000)
    for name, track_index in STEPS[1 : names.index(through) + 1]:
        if name == "search":
            page.locator("#panel section.cta button").click()
            page.wait_for_function("() => state.view === 'search'")
        elif name == "journal":
            page.click("#journal-button")
            page.wait_for_function("() => state.pane === 'journal'")
        else:
            if name == "shine":
                # The shine phase runs on real time, so the fastest speed
                # keeps it short once the field notes have appeared.
                page.click('button[data-s="60"]')
                page.wait_for_timeout(50)
            try:
                page.wait_for_function(
                    """(index) => {
                        const spans = document.querySelectorAll('#track span');
                        return Boolean(spans[index]?.className.includes('now'));
                    }""",
                    arg=track_index,
                    timeout=SPEED_TIMEOUT_MS,
                )
            except PlaywrightTimeoutError as exc:
                message = f"the {name} phase never became active"
                raise TimeoutError(message) from exc
        screenshot(page, name, folder, written)
    context.close()
    return written


def main(argv: list[str] | None = None) -> int:
    """Capture the built game for visual review.

    Parameters
    ----------
    argv : list of str, optional
        Command-line arguments; defaults to ``sys.argv[1:]``.

    Returns
    -------
    int
        0 on success, 1 on failure.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--phase",
        choices=[name for name, _ in STEPS],
        default="journal",
        help="capture only the steps up to and including this one",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help="output folder (default: .scratch/screens)",
    )
    args = parser.parse_args(argv)
    out = args.out if args.out.is_absolute() else ROOT / args.out
    try:
        build_page()
        from playwright.sync_api import sync_playwright

        with sync_playwright() as plays:
            browser = plays.chromium.launch()
            try:
                written = []
                for motion in MOTIONS:
                    for width in WIDTHS:
                        written += shoot_run(browser, width, motion, out, args.phase)
            finally:
                browser.close()
    except (OSError, subprocess.SubprocessError, PlaywrightTimeoutError) as error:
        print(f"shoot failed: {error}")
        return 1
    print("screenshots written:")
    for path in written:
        print(f"  {path.relative_to(ROOT)}")
=======
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
>>>>>>> 6f54cf2 (Apply remaining changes)
    return 0


if __name__ == "__main__":
<<<<<<< HEAD
    sys.exit(main())
=======
    raise SystemExit(main())
>>>>>>> 6f54cf2 (Apply remaining changes)
