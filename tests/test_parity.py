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


STRESS_MASSES = [0] * 6 + [0.5, 1, 2, 4, 8, 8] + [0] * 4
STRESS_RADII = [300, 500, 800, 1200]


def stress(meta):
    """Play a run, then at the start of accretion load an unstable disk.

    The injected rings and four seeded fragments force fragment formation,
    coalescing at the four-fragment limit, merges, and end-of-run companions.
    """
    run = game.new_run(meta)
    tick = 0
    injected = False
    while run.phase != "ended" and tick < 20000:
        game.step(run, meta, 7.3)
        if tick % 2 == 0:
            game.tap(run, meta)
        for name in ("reach", "tap", "cooling", "turbulence", "braking"):
            while game.buy(run, name, meta):
                pass
        if run.phase == "accrete" and not injected:
            injected = True
            run.disk_masses = [
                a + b for a, b in zip(run.disk_masses, STRESS_MASSES, strict=True)
            ]
            run.fragments = [
                {"mass": 0.05, "radius": float(r), "phase": 0.1 * k}
                for k, r in enumerate(STRESS_RADII)
            ]
            run.fragments_formed = len(STRESS_RADII)
        tick += 1
    return run


def stress_row(run):
    records = run.companion_records
    return [
        run.star_mass,
        run.ejected + run.companions,
        run.energy,
        run.fragments_formed,
        len(records),
        *[c["mass"] for c in records],
        *[c["separation"] for c in records],
    ]


def test_stress_scenario_reaches_coalescing_and_companions(monkeypatch):
    coalesced = []
    original = game._add_fragment

    def spy(run, mass, radius):
        if len(run.fragments) >= game.FRAGMENT_LIMIT:
            coalesced.append(radius)
        original(run, mass, radius)

    monkeypatch.setattr(game, "_add_fragment", spy)
    run = stress(game.Meta())
    assert coalesced
    assert run.companion_records
    assert len(run.companion_records) <= game.FRAGMENT_LIMIT


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
                run.fragments_formed,
                len(run.companion_records),
                run.levels["cooling"],
            ]
        )
        next_run = game.prestige(run, meta)
        meta.unlocks.append("cooling")
        game.buy_heavy(meta, "cooling", next_run)
        rows.append([meta.regions, meta.heavy, meta.cosmic_myr, meta.heavy_cooling])
        rows.append(list(meta.unlocks))
    rows.append(
        [
            physics.stromgren_radius(physics.ionizing_rate(22), 1e4),
            physics.hii_radius(physics.ionizing_rate(60), 300, 250, 1e13),
            physics.hii_radius(physics.ionizing_rate(60), 300, 250, 1e15),
        ]
    )
    rows.append(stress_row(stress(game.Meta())))
    # Leave a run early: the entry records it as skipped, and the universal
    # clock advances only by the time that actually passed.
    meta.z_density, meta.z_temperature, meta.z_metal = 0, 0, 0
    run = game.new_run(meta)
    tick = 0
    while run.phase != "main_sequence" and tick < 20000:
        game.step(run, meta, 7.3)
        if tick % 2 == 0:
            game.tap(run, meta)
        for name in ("reach", "tap"):
            while game.buy(run, name, meta):
                pass
        tick += 1
    game.skip(run, meta)
    game.prestige(run, meta)
    rows.append([meta.regions, meta.cosmic_myr, meta.runs])
    # One row per journal entry: both engines must record the same run record,
    # appended when the run ended and reused by prestige.
    for entry in meta.journal:
        rows.append(
            [
                entry["run"],
                entry["temperature"],
                entry["density"],
                entry["mass"],
                entry["ending"],
                entry["gain"],
                entry["heavy"],
                entry["seconds"],
                entry["lifetime_myr"],
                entry["forecast_myr"],
                entry["alpha"],
                entry["feed_radius"],
                entry["skipped"],
                len(entry["companions"]),
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
