import json
import shutil
import subprocess
from pathlib import Path

import pytest

from accretion import game, physics

ROOT = Path(__file__).parents[1]


def play(meta):
    run = game.new_run(meta)
    tick = 0
    while run.phase != "ended" and tick < 20000:
        game.step(run, meta, 7.3)
        if tick % 2 == 0:
            game.tap(run, meta)
        for name in ("reach", "tap", "cooling", "turbulence", "braking"):
            while game.buy(run, name, meta):
                pass
        tick += 1
    return run


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node")
def test_python_and_browser_engines_agree():
    raw = subprocess.check_output(["node", "tools/parity_runner.js"], cwd=ROOT)
    browser = json.loads(raw)
    meta = game.Meta()
    rows = []
    for z in ((0, 0, 0), (0.8, -0.5, 0), (-1, 1, -1)):
        meta.z_density, meta.z_temperature, meta.z_metal = z
        run = play(meta)
        rows.append(
            [
                run.star_mass,
                run.ejected + run.companions,
                run.energy,
                run.lifetime_myr,
                run.seconds,
                run.kind,
                len(run.fragments),
                len(run.companion_records),
            ]
        )
        game.prestige(run, meta)
        meta.unlocks.append("cooling")
        game.buy_heavy(meta, "cooling")
        rows.append([meta.regions, meta.heavy, meta.cosmic_myr, meta.heavy_cooling])
        rows.append(list(meta.unlocks))
    rows.append(
        [
            physics.stromgren_radius(physics.ionizing_rate(22), 1e4),
            physics.hii_radius(physics.ionizing_rate(60), 300, 250, 1e13),
            physics.hii_radius(physics.ionizing_rate(60), 300, 250, 1e15),
        ]
    )
    assert len(rows) == len(browser)
    for ours, theirs in zip(rows, browser, strict=True):
        if isinstance(ours[0], str):
            assert ours == theirs
            continue
        for a, b in zip(ours, theirs, strict=True):
            if isinstance(a, (str, list)):
                assert a == b
            else:
                assert a == pytest.approx(b, rel=1e-9)
