"""Rebuild web/accretion.html, then open it in a new Chrome window."""

import os
import shutil
import subprocess
import sys
import webbrowser
from pathlib import Path

import build

PAGE = build.WEB / "accretion.html"

WINDOWS_CHROME = [
    Path(base) / "Google/Chrome/Application/chrome.exe"
    for base in (
        os.environ.get("PROGRAMFILES", r"C:\Program Files"),
        os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)"),
        os.environ.get("LOCALAPPDATA", ""),
    )
    if base
]


def chrome_command(url: str) -> list[str] | None:
    """Return the command that opens ``url`` in a new Chrome window, if found."""
    if sys.platform == "darwin":
        app = Path("/Applications/Google Chrome.app")
        if app.exists():
            return ["open", "-na", str(app), "--args", "--new-window", url]
        return None
    candidates = WINDOWS_CHROME if sys.platform == "win32" else []
    for path in candidates:
        if path.exists():
            return [str(path), "--new-window", url]
    for name in ("google-chrome", "google-chrome-stable", "chrome", "chromium"):
        found = shutil.which(name)
        if found:
            return [found, "--new-window", url]
    return None


def main() -> None:
    """Build the page, then launch it."""
    build.main([])
    url = PAGE.resolve().as_uri()
    command = chrome_command(url)
    if command is None:
        print("Chrome not found; opening the default browser instead.")
        webbrowser.open_new(url)
        return
    subprocess.Popen(command)  # noqa: S603 - fixed local command
    print(f"Opened {url}")


if __name__ == "__main__":
    main()
