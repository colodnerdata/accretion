"""A missing browser skips locally but fails where one is required.

CI's Browser job sets ``ACCRETION_REQUIRE_BROWSER=1``, so the browser tests
cannot pass there by skipping, as they did before that job existed.
"""

import conftest
import pytest


def test_a_missing_browser_skips_by_default(monkeypatch):
    monkeypatch.delenv(conftest.REQUIRE_BROWSER, raising=False)
    with pytest.raises(pytest.skip.Exception):
        conftest.browser_unavailable("no Chromium")


def test_a_missing_browser_fails_when_required(monkeypatch):
    monkeypatch.setenv(conftest.REQUIRE_BROWSER, "1")
    with pytest.raises(pytest.fail.Exception, match="no Chromium"):
        conftest.browser_unavailable("no Chromium")


def test_exactly_the_tests_using_the_browser_fixture_are_marked(request):
    """The marker lets CI run the browser tests as their own job."""
    for item in request.session.items:
        uses_browser = "browser" in getattr(item, "fixturenames", ())
        assert bool(item.get_closest_marker("browser")) == uses_browser, item
