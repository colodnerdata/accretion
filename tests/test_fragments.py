import math

import pytest

from accretion import disk, game

RING = 7


def accreting_run(star_mass=1.0):
    meta = game.Meta()
    run = game.new_run(meta)
    run.phase = "accrete"
    run.star_mass = star_mass
    return meta, run


def critical_mass(run, meta, ring=RING):
    floor = game.temperature(run, meta)
    sigma = disk.critical_surface_density(disk.RADII[ring], run.star_mass, floor)
    return sigma * disk.AREAS[ring]


def momentum(bodies):
    return sum(b["mass"] * math.sqrt(b["radius"]) for b in bodies)


def test_q_is_one_at_the_critical_surface_density():
    meta, run = accreting_run()
    run.disk_masses[RING] = critical_mass(run, meta)
    floor = game.temperature(run, meta)
    q = disk.stability(run.disk_masses, run.star_mass, floor)
    assert q[RING] == pytest.approx(1.0)
    assert q[RING - 1] == math.inf


def test_q_falls_as_a_ring_gains_mass_and_rises_with_temperature():
    low = disk.stability([0.0] * 7 + [1.0] + [0.0] * 8, 1.0, 100.0)[RING]
    high = disk.stability([0.0] * 7 + [2.0] + [0.0] * 8, 1.0, 100.0)[RING]
    hot = disk.stability([0.0] * 7 + [1.0] + [0.0] * 8, 1.0, 10000.0)[RING]
    assert high == pytest.approx(low / 2)
    assert hot > low


def test_stable_ring_forms_no_fragment():
    meta, run = accreting_run()
    run.disk_masses[RING] = 0.5 * critical_mass(run, meta)
    game._form_fragments(run, meta)
    assert run.fragments == []
    assert run.fragments_formed == 0


def test_excess_below_one_fragment_mass_forms_nothing():
    meta, run = accreting_run()
    run.disk_masses[RING] = critical_mass(run, meta) * 1.0001
    game._form_fragments(run, meta)
    assert run.fragments == []


def test_unstable_ring_forms_one_fragment_of_sigma_h_squared():
    meta, run = accreting_run()
    mass = 10 * critical_mass(run, meta)
    run.disk_masses[RING] = mass
    radius = disk.RADII[RING]
    floor = game.temperature(run, meta)
    omega = disk.orbital_frequency(radius, run.star_mass)
    expected = (
        mass / disk.AREAS[RING] * disk.sound_speed_squared(radius, floor) / omega**2
    )
    game._form_fragments(run, meta)
    assert len(run.fragments) == 1
    assert run.fragments[0]["mass"] == pytest.approx(expected)
    assert run.fragments[0]["radius"] == pytest.approx(radius)
    assert run.disk_masses[RING] == pytest.approx(mass - expected)


def test_full_fragment_list_coalesces_and_conserves_mass_and_momentum():
    meta, run = accreting_run()
    run.fragments = [
        {"mass": 0.1 * (i + 1), "radius": 20.0 * (i + 1), "phase": 0.0}
        for i in range(game.FRAGMENT_LIMIT)
    ]
    before_mass = game.fragment_mass(run)
    before_momentum = momentum(run.fragments) + 0.3 * math.sqrt(45.0)
    game._add_fragment(run, 0.3, 45.0)
    assert len(run.fragments) == game.FRAGMENT_LIMIT
    assert game.fragment_mass(run) == pytest.approx(before_mass + 0.3)
    assert momentum(run.fragments) == pytest.approx(before_momentum)


def test_fragment_at_the_inner_edge_merges_into_the_star():
    meta, run = accreting_run(star_mass=2.0)
    run.fragments = [{"mass": 0.4, "radius": disk.R_IN, "phase": 0.0}]
    energy = run.energy
    game._evolve_fragments(run, meta)
    assert run.fragments == []
    assert run.star_mass == pytest.approx(2.4)
    assert run.energy > energy


def test_fragment_migrates_inward_and_its_phase_advances():
    meta, run = accreting_run(star_mass=5.0)
    run.fragments = [{"mass": 0.1, "radius": 100.0, "phase": 0.0}]
    game._evolve_fragments(run, meta)
    body = run.fragments[0]
    assert body["radius"] < 100.0
    assert 0.0 < body["phase"] < game.TWO_PI


def test_fragment_gas_accretion_conserves_mass_and_angular_momentum():
    meta, run = accreting_run(star_mass=5.0)
    cell = disk.feed_cell(100.0)
    run.disk_masses[cell] = 1.0
    run.fragments = [{"mass": 0.1, "radius": 100.0, "phase": 0.0}]
    total = game.fragment_mass(run) + sum(run.disk_masses)
    game._evolve_fragments(run, meta)
    assert game.fragment_mass(run) + sum(run.disk_masses) == pytest.approx(total)
    assert game.fragment_mass(run) > 0.1


def test_settling_turns_fragments_into_companion_records():
    meta, run = accreting_run()
    run.fragments = [
        {"mass": 0.2, "radius": 30.0, "phase": 1.0},
        {"mass": 0.5, "radius": 80.0, "phase": 2.0},
    ]
    game._settle_fragments(run)
    assert run.fragments == []
    assert run.companion_records == [
        {"mass": 0.2, "separation": 30.0},
        {"mass": 0.5, "separation": 80.0},
    ]
    assert run.companions == pytest.approx(0.7)


def test_mass_closes_every_step_with_fragments_in_flight():
    meta = game.Meta()
    run = game.new_run(meta)
    while run.phase in ("gather", "collapse"):
        game.step(run, meta, 5.0)
    total = run.collapse_mass
    seen = False
    while run.phase == "accrete":
        game.step(run, meta, 0.5)
        seen = seen or bool(run.fragments)
        held = (
            run.star_mass
            + run.ejected
            + run.companions
            + game.fragment_mass(run)
            + game.disk_gas(run)
            + run.envelope
        )
        assert held == pytest.approx(total, rel=1e-8)
    assert seen
    assert run.fragments == []
