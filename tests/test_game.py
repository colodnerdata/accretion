import math
import sys
from pathlib import Path

import pytest

from accretion import disk, game, physics

sys.path.insert(0, str(Path(__file__).parents[1] / "tools"))
import bot  # noqa: E402


def finish(meta, seconds=1.0):
    run = game.new_run(meta)
    while run.phase != "ended":
        game.step(run, meta, seconds)
    return run


def test_new_run_has_empty_fragment_state():
    run = game.new_run(game.Meta())
    assert run.fragments == []
    assert run.companion_records == []
    assert game.fragment_mass(run) == 0.0
    assert game.companion_mass(run) == 0.0


def test_fragment_and_companion_mass_sum_their_records():
    run = game.new_run(game.Meta())
    run.fragments = [
        {"mass": 0.5, "radius": 100.0, "phase": 0.0},
        {"mass": 1.5, "radius": 50.0, "phase": 1.0},
    ]
    run.companion_records = [{"mass": 2.0, "separation": 30.0}]
    assert game.fragment_mass(run) == pytest.approx(2.0)
    assert game.companion_mass(run) == pytest.approx(2.0)


def test_journal_entry_records_companions_as_a_copy():
    meta = game.Meta()
    run = game.new_run(meta)
    run.kind = "white_dwarf"
    run.companion_records = [{"mass": 2.0, "separation": 30.0}]
    entry = game.journal_entry(run, meta, skipped=False)
    run.companion_records[0]["mass"] = 9.0
    assert entry["companions"] == [{"mass": 2.0, "separation": 30.0}]


def test_mass_budget_closes_through_a_run():
    meta = game.Meta()
    run = game.new_run(meta)
    while run.phase in ("gather", "collapse"):
        game.step(run, meta, 5.0)
    total = run.collapse_mass
    while run.phase == "accrete":
        game.step(run, meta, 5.0)
    assert run.star_mass + run.ejected + run.companions == pytest.approx(
        total, rel=1e-8
    )


def test_one_long_step_matches_many_short_steps():
    meta = game.Meta()
    short = game.new_run(meta)
    long = game.new_run(meta)
    for _ in range(1800):
        game.step(short, meta, 2.0)
    game.step(long, meta, 3600.0)
    assert long.phase == short.phase
    assert long.star_mass == pytest.approx(short.star_mass, rel=1e-6)
    assert long.seconds == pytest.approx(short.seconds)


def test_first_run_is_short_and_reaches_supernova():
    run, _, marks = bot.play(0.5, False)
    assert 13 * 60 < marks["ended"] < 22 * 60
    assert run.kind == "supernova"


def test_controls_unlock_one_stage_at_a_time():
    meta = game.Meta()
    run = game.new_run(meta)
    game.update_unlocks(run, meta)
    assert meta.unlocks == []
    run, meta, _ = bot.play(0.5, False)
    assert "cooling" not in meta.unlocks and "density" not in meta.unlocks
    assert {"reach", "tap", "turbulence"} <= set(meta.unlocks)
    next_run = game.prestige(run, meta)
    game.update_unlocks(next_run, meta)
    assert "temperature" in meta.unlocks and "density" not in meta.unlocks


def test_locked_upgrade_cannot_be_bought():
    meta = game.Meta()
    run = game.new_run(meta)
    run.energy = 1e60
    assert not game.buy(run, "cooling", meta)


def test_journal_records_each_run():
    run, meta, _ = bot.play(0.5, False)
    game.prestige(run, meta)
    entry = meta.journal[0]
    assert entry["run"] == 1
    assert entry["ending"] == "supernova"
    assert entry["mass"] == run.star_mass


def test_hot_regions_make_bigger_stars_than_cool_regions():
    hot = game.Meta(z_temperature=1.5)
    cold = game.Meta(z_temperature=-1.5)
    assert finish(hot).star_mass > finish(cold).star_mass


def test_cooling_lowers_the_collapse_threshold():
    meta = game.Meta()
    run = game.new_run(meta)
    before = game.jeans_log_reach(run, meta)
    run.levels["cooling"] = 3
    assert game.jeans_log_reach(run, meta) < before


def test_budget_is_log_of_regions():
    meta = game.Meta(regions=math.e**3)
    assert game.budget(meta) == pytest.approx(3)


def test_failed_run_multiplies_regions():
    meta = game.Meta(regions=100.0)
    run = game.new_run(meta)
    run.phase, run.kind, run.star_mass = "ended", "brown_dwarf", 0.05
    game.prestige(run, meta)
    assert meta.regions == pytest.approx(110.0)


def test_skip_advances_clock_only_by_elapsed_time():
    meta = game.Meta()
    run = game.new_run(meta)
    run.phase, run.kind, run.star_mass = "main_sequence", "white_dwarf", 0.5
    run.lifetime_myr = 56000.0
    run.ms_duration = game.main_sequence_seconds(56000.0)
    run.ms_elapsed = run.ms_duration / 100
    assert game.can_skip(run)
    game.prestige(run, meta, skipped=True)
    assert meta.cosmic_myr == pytest.approx(560.0)


def test_massive_star_cannot_skip():
    meta = game.Meta()
    run = game.new_run(meta)
    run.phase, run.ms_duration, run.ms_elapsed = "main_sequence", 1000.0, 0.0
    assert not game.can_skip(run)


def test_one_supernova_enriches_the_region():
    assert disk.CELLS == 16
    meta = game.Meta(local_metals=3.0)
    assert game.background_metal_log10(meta) > -4


def test_infall_runs_at_full_rate_until_the_break_mass():
    meta = game.Meta()
    run = game.new_run(meta)
    rate = physics.infall_rate(game.temperature(run, meta))
    onset = physics.break_mass(rate)
    cases = ((game.SEED_MASS, 1.0), (onset, 1.0), (1.5 * onset, 0.5), (2 * onset, 0.0))
    for mass, share in cases:
        run.star_mass = mass
        assert game.infall_now(run, meta) == pytest.approx(share * rate, abs=1e-15)
