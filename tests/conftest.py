"""Shared fixtures: one Chromium for the browser tests.

Tests that use the ``browser`` fixture get the ``browser`` marker, so CI can
run them as their own job (``pytest -m browser``). Without Chromium they skip,
unless ``ACCRETION_REQUIRE_BROWSER=1`` is set, as it is in that job: then a
missing browser fails the run instead of passing it by skipping.

The parity and engine tests skip without ``node``. CI's Tests job sets
``ACCRETION_REQUIRE_NODE=1``, which stops the session at its start when node
is missing, so the parity check cannot pass there by skipping either.
"""

import glob
import os
import shutil

import pytest

try:
    from playwright import sync_api
except ImportError:  # the engine and parity tests do not need a browser
    sync_api = None

FALLBACK_CHROMIUM = "/opt/pw-browsers/chromium-*/chrome-linux64/chrome"
REQUIRE_BROWSER = "ACCRETION_REQUIRE_BROWSER"
REQUIRE_NODE = "ACCRETION_REQUIRE_NODE"


def missing_required_node(which=shutil.which):
    """Return why the session must stop, or None when node is fine."""
    if os.environ.get(REQUIRE_NODE) == "1" and which("node") is None:
        return f"node is not on PATH, and {REQUIRE_NODE}=1 requires it"
    return None


def pytest_sessionstart(session):
    """Stop a run that requires node when node is missing."""
    reason = missing_required_node()
    if reason:
        pytest.exit(reason, returncode=1)


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
