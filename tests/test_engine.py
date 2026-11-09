import json
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1]


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node")
def test_browser_engine_boundaries():
    """The browser engine refuses cooling at the floor and journals at the end.

    Runs tools/engine_checks.js, which mirrors the Python boundary tests in
    tests/test_game.py against web/engine.js.
    """
    raw = subprocess.check_output(["node", "tools/engine_checks.js"], cwd=ROOT)
    checks = json.loads(raw)
    failed = [f"{c['name']}: {c['detail']}" for c in checks if not c["ok"]]
    assert checks, "engine_checks.js produced no checks"
    assert not failed, failed
