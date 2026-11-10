import json
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1]


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node")
def test_visible_gas_mappings():
    """The display mappings match their hand-computed values.

    Runs tools/visual_checks.js, which checks web/visuals.js: the sqrt(T/m)
    speed law, the true and displayed metal shares, and the density zoom.
    """
    raw = subprocess.check_output(["node", "tools/visual_checks.js"], cwd=ROOT)
    checks = json.loads(raw)
    failed = [f"{c['name']}: {c['detail']}" for c in checks if not c["ok"]]
    assert checks, "visual_checks.js produced no checks"
    assert not failed, failed
