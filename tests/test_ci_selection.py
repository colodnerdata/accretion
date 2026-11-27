"""CI's test selections cannot pass by skipping or by leaving tests out.

The Tests job requires node, so the parity and engine tests cannot skip
there. No job runs ``property`` tests yet, so the first one has to come with
its CI job, or it would never run.
"""

import pathlib

import conftest

ROOT = pathlib.Path(__file__).resolve().parent.parent


def no_node(_name):
    return None


def test_a_missing_node_is_allowed_by_default(monkeypatch):
    monkeypatch.delenv(conftest.REQUIRE_NODE, raising=False)
    assert conftest.missing_required_node(which=no_node) is None


def test_a_missing_node_stops_the_run_when_required(monkeypatch):
    monkeypatch.setenv(conftest.REQUIRE_NODE, "1")
    assert "node is not on PATH" in conftest.missing_required_node(which=no_node)


def test_a_present_node_passes_when_required(monkeypatch):
    monkeypatch.setenv(conftest.REQUIRE_NODE, "1")
    assert conftest.missing_required_node(which=lambda _: "/usr/bin/node") is None


def test_property_tests_come_with_a_ci_job():
    """Every selection excludes ``property``, so a job must run them."""
    marker = "mark." + "property"
    uses_marker = [
        path.name
        for path in (ROOT / "tests").rglob("*.py")
        if marker in path.read_text(encoding="utf-8")
    ]
    workflow = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
    assert not uses_marker or "pytest -m property" in workflow, uses_marker
