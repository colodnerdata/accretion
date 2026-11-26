"""Shared fixtures: one Chromium for the browser tests.

Tests that use the ``browser`` fixture get the ``browser`` marker, so CI can
run them as their own job (``pytest -m browser``). Without Chromium they skip,
unless ``ACCRETION_REQUIRE_BROWSER=1`` is set, as it is in that job: then a
missing browser fails the run instead of passing it by skipping.
"""

import glob
import os

import pytest

try:
    from playwright import sync_api
except ImportError:  # the engine and parity tests do not need a browser
    sync_api = None

FALLBACK_CHROMIUM = "/opt/pw-browsers/chromium-*/chrome-linux64/chrome"
REQUIRE_BROWSER = "ACCRETION_REQUIRE_BROWSER"


def browser_unavailable(reason):
    """Skip the test, or fail it when a browser is required."""
    if os.environ.get(REQUIRE_BROWSER) == "1":
        pytest.fail(f"{reason}, and {REQUIRE_BROWSER}=1 requires one")
    pytest.skip(reason)


def pytest_collection_modifyitems(items):
    """Mark every test that uses the ``browser`` fixture."""
    for item in items:
        if "browser" in getattr(item, "fixturenames", ()):
            item.add_marker(pytest.mark.browser)


@pytest.fixture(scope="module")
def browser():
    """One Chromium for the module, or a skip when none can be launched."""
    if sync_api is None:
        browser_unavailable("Playwright is not installed")
    with sync_api.sync_playwright() as playwright:
        try:
            instance = playwright.chromium.launch()
        except sync_api.Error:
            found = sorted(glob.glob(FALLBACK_CHROMIUM))
            if not found:
                browser_unavailable("no Chromium available for Playwright")
            try:
                instance = playwright.chromium.launch(
                    executable_path=found[-1], args=["--no-sandbox"]
                )
            except sync_api.Error:
                browser_unavailable("Chromium could not be launched")
        yield instance
        instance.close()
