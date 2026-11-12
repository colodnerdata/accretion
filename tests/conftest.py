"""Shared fixtures: one Chromium for the browser tests."""

import glob

import pytest

sync_api = pytest.importorskip("playwright.sync_api")

FALLBACK_CHROMIUM = "/opt/pw-browsers/chromium-*/chrome-linux64/chrome"


@pytest.fixture(scope="module")
def browser():
    """One Chromium for the module, or a skip when none can be launched."""
    with sync_api.sync_playwright() as playwright:
        try:
            instance = playwright.chromium.launch()
        except sync_api.Error:
            found = sorted(glob.glob(FALLBACK_CHROMIUM))
            if not found:
                pytest.skip("no Chromium available for Playwright")
            try:
                instance = playwright.chromium.launch(
                    executable_path=found[-1], args=["--no-sandbox"]
                )
            except sync_api.Error:
                pytest.skip("Chromium could not be launched")
        yield instance
        instance.close()
