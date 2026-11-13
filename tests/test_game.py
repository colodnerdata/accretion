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
    entry = game.journal_entry(run, meta)
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
    """One long step must land where many short steps do, journal included.

    Each trajectory gets its own Meta so a shared ending cannot hide
    differences in the journal, rewards or clock.
    """
    short_meta = game.Meta()
    long_meta = game.Meta()
    short = game.new_run(short_meta)
    long = game.new_run(long_meta)
    for _ in range(1800):
        game.step(short, short_meta, 2.0)
    game.step(long, long_meta, 3600.0)
    assert long.phase == short.phase
    assert long.star_mass == pytest.approx(short.star_mass, rel=1e-6)
    assert long.seconds == pytest.approx(short.seconds)
    # The journal's recorded lifetime is part of the agreement: an ending
    # step that journals before consuming its chunk used to omit the final
    # interval, invisible when both engines shared one Meta.
    short_entry = short_meta.journal[-1]
    long_entry = long_meta.journal[-1]
    assert long_entry["seconds"] == pytest.approx(short_entry["seconds"])
    assert long_entry["seconds"] == pytest.approx(long.seconds)
    assert long_entry["mass"] == pytest.approx(short_entry["mass"], rel=1e-6)
    assert long_entry["gain"] == pytest.approx(short_entry["gain"], rel=1e-6)
    assert long_entry["heavy"] == pytest.approx(short_entry["heavy"], rel=1e-6)
    # Then both trajectories settle their runs, so the clocks and rewards
    # compare with teeth (regions and heavy only move at prestige).
    game.prestige(long, long_meta)
    game.prestige(short, short_meta)
    assert long_meta.regions == pytest.approx(short_meta.regions, rel=1e-6)
    assert long_meta.heavy == pytest.approx(short_meta.heavy, rel=1e-6)


def test_first_run_is_short_and_reaches_supernova():
    run, _, marks = bot.play(0.5, False)
    assert 13 * 60 < marks["ended"] < 22 * 60
    assert run.kind == "supernova"


def test_prestige_pays_exactly_once():
    """A settled run must not move any counter on a second prestige call."""
    meta = game.Meta()
    run = game.new_run(meta)
    # A supernova that finished its shine: the engine's own ending path
    # records the entry, then prestige settles it.
    run.phase = "main_sequence"
    run.kind = "supernova"
    run.star_mass = 21.5
    run.ms_duration, run.ms_elapsed = 100.0, 100.0
    run.forecast_myr = run.lifetime_myr = 7.0
    game.step(run, meta, 100.0)
    assert run.phase == "ended" and meta.journal
    game.prestige(run, meta)
    before = (
        meta.regions,
        meta.runs,
        meta.heavy,
        meta.local_metals,
        meta.cosmic_myr,
        len(meta.journal),
        meta.supernovae,
    )
    assert before[0] > 1.0 and before[5] == 1, "the first call pays and journals"
    # The doubled call: the same run, a second prestige — nothing may move.
    game.prestige(run, meta)
    assert (
        meta.regions,
        meta.runs,
        meta.heavy,
        meta.local_metals,
        meta.cosmic_myr,
        len(meta.journal),
        meta.supernovae,
    ) == before
    # And a settled call hands back a fresh region, not the ended run.
    assert game.prestige(run, meta).phase == "gather"


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


def test_cooling_can_be_bought_up_to_the_floor_but_not_past_it():
    meta = game.Meta()
    run = game.new_run(meta)
    run.base_temperature, run.floor_temperature = 100.0, 81.0
    run.energy = 1.0e60
    meta.unlocks = ["cooling"]
    run.levels["cooling"] = 1
    # 100 x 0.9^2 == 81: the next level is the first that reaches the floor.
    assert game.temperature_at(run, meta, 2) == pytest.approx(run.floor_temperature)
    assert game.buy(run, "cooling", meta)
    assert run.levels["cooling"] == 2
    assert not game.buy(run, "cooling", meta)
    assert run.levels["cooling"] == 2
    assert game.temperature(run, meta) == pytest.approx(run.floor_temperature)


def test_heavy_cooling_lowers_what_new_regions_can_reach():
    meta = game.Meta()
    meta.unlocks = ["cooling"]
    meta.heavy = 100.0
    run = game.new_run(meta)
    assert run.floor_temperature == pytest.approx(200.0)
    assert game.buy_heavy(meta, "cooling", run)
    assert game.new_run(meta).floor_temperature == pytest.approx(200.0 * 0.9)


def test_heavy_turbulence_stops_when_disk_speed_reaches_the_cap():
    # min(1, 0.1 * 1.3 ^ level) reaches 1 at level 9 (0.81 at 8, 1.06 at 9);
    # buying at 9 would spend 512 M☉ for a 1 -> 1 result.
    meta = game.Meta()
    meta.unlocks = ["turbulence"]
    meta.heavy = 1e9
    run = game.new_run(meta)
    meta.heavy_turbulence = 8
    assert game.turbulence_purchase_helps(meta)
    assert game.buy_heavy(meta, "turbulence", run)
    assert meta.heavy_turbulence == 9
    assert game.alpha(run, meta) == pytest.approx(1.0)
    held = meta.heavy
    assert not game.turbulence_purchase_helps(meta)
    assert not game.buy_heavy(meta, "turbulence", run)
    assert meta.heavy_turbulence == 9
    assert meta.heavy == held


def test_heavy_cooling_stops_at_the_cosmic_background():
    # At 0.12 Gyr the cosmic background is 74.99 K; 200 x 0.9^9 = 77.4 K
    # still cools down to it, and the next level would change nothing.
    meta = game.Meta()
    run = game.new_run(meta)
    meta.unlocks = ["cooling"]
    meta.heavy = 1e9
    meta.heavy_cooling = 9
    assert game.buy_heavy(meta, "cooling", run)
    assert meta.heavy_cooling == 10
    assert not game.buy_heavy(meta, "cooling", run)
    assert meta.heavy_cooling == 10


def test_heavy_cooling_also_scales_the_in_run_multiplier():
    meta = game.Meta()
    meta.unlocks = ["cooling"]
    run = game.new_run(meta)
    run.base_temperature, run.floor_temperature = 100.0, 50.0
    meta.heavy_cooling = 2
    run.energy = 1.0e60
    assert game.temperature(run, meta) == pytest.approx(81.0)
    assert game.can_buy(run, "cooling", meta)  # 81 -> 72.9, above the floor


def test_journal_entry_exists_as_soon_as_the_run_ends():
    run, meta, _ = bot.play(0.5, False)
    assert run.phase == "ended"
    assert meta.journal and meta.journal[0]["run"] == 1
    game.prestige(run, meta)
    assert len(meta.journal) == 1


def test_brown_dwarf_run_is_journaled_when_it_fails_to_ignite():
    meta = game.Meta()
    run = game.new_run(meta)
    run.phase = "accrete"
    run.envelope, run.star_mass = 0.0, game.SEED_MASS  # feed already over
    game.step(run, meta, 1.0)
    assert run.phase == "ended" and run.kind == "brown_dwarf"
    assert meta.journal[0]["ending"] == "brown_dwarf"


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


def test_density_changes_collapse_mass_but_not_final_mass():
    # With no upgrades bought, density does not change final mass, so the
    # hints in content/hints.toml name no density lever. (With upgrades bought
    # freely it shifts when purchases land: docs/planning/prediction-system.md.)
    # If it fails, density has become a mass lever: revisit the hints.
    thin = finish(game.Meta(z_density=-2.0), 5.0)
    dense = finish(game.Meta(z_density=2.0), 5.0)
    assert thin.collapse_mass > 10 * dense.collapse_mass
    assert thin.star_mass == pytest.approx(dense.star_mass, rel=1e-9)


def test_cooling_bought_while_gathering_makes_a_smaller_star():
    # The gather hint advises buying reach, not every upgrade, because of this.
    def final_mass(cooling):
        meta = game.Meta()
        run = game.new_run(meta)
        run.levels["cooling"] = cooling
        while run.phase != "ended":
            game.step(run, meta, 5.0)
        return run.star_mass

    assert final_mass(2) < final_mass(0)


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
    game.skip(run, meta)
    assert run.phase == "ended"
    assert meta.journal[0]["skipped"] is True
    game.prestige(run, meta)
    assert len(meta.journal) == 1
    assert meta.journal[0]["skipped"] is True
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


@pytest.mark.parametrize(
    ("kind", "counter"),
    [
        ("supernova", "supernovae"),
        ("black_hole", "black_hole_unlocked"),
        ("pair_instability", "pair_instability_seen"),
    ],
)
def test_a_skipped_star_pays_but_does_not_count_as_seen(kind, counter):
    """Leaving a star early pays its reward but discovers nothing about it.

    The category counters unlock controls and options, so they move only for
    a star the player watched to its end. Regions, heavy elements and the
    clock are paid either way.
    """
    outcomes = {}
    for skipped in (False, True):
        meta = game.Meta()
        run = game.new_run(meta)
        run.phase = "main_sequence"
        run.kind = kind
        run.star_mass = 30.0 if kind != "pair_instability" else 150.0
        run.ms_duration, run.ms_elapsed = 100.0, 100.0
        run.forecast_myr = run.lifetime_myr = 7.0
        if skipped:
            run.ms_elapsed = 10.0
            game.skip(run, meta)
        else:
            game.step(run, meta, 100.0)
        game.prestige(run, meta)
        outcomes[skipped] = meta
    watched, left = outcomes[False], outcomes[True]
    assert getattr(watched, counter), "a watched ending counts"
    assert not getattr(left, counter), "a skipped ending counts for nothing"
    assert left.regions == pytest.approx(watched.regions)
    assert left.heavy == pytest.approx(watched.heavy)
    assert left.runs == 1
    assert left.cosmic_myr == pytest.approx(0.1 * 7.0)


def test_the_skipped_argument_alone_also_counts_nothing():
    """prestige(skipped=True) on a run not flagged skipped moves no counter."""
    meta = game.Meta()
    run = game.new_run(meta)
    run.phase = "main_sequence"
    run.kind = "supernova"
    run.star_mass = 30.0
    run.ms_duration, run.ms_elapsed = 100.0, 100.0
    run.forecast_myr = run.lifetime_myr = 7.0
    game.step(run, meta, 100.0)
    assert not run.skipped
    game.prestige(run, meta, skipped=True)
    assert meta.supernovae == 0
    assert meta.regions > 1.0
