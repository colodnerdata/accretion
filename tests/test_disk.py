import math

import pytest

from accretion import disk


def total_h(masses):
    return sum(m * math.sqrt(r) for m, r in zip(masses, disk.RADII, strict=True))


def test_mass_budget_closes():
    masses = [0.0] * disk.CELLS
    masses[10] = 5.0
    swallowed = 0.0
    for _ in range(2000):
        masses, accreted = disk.step(masses, 10.0, 0.1, 50.0, 0.0, 0)
        swallowed += accreted
    assert sum(masses) + swallowed == pytest.approx(5.0, abs=1e-10)


def test_steady_state_passes_source_to_star():
    masses = [0.0] * disk.CELLS
    rate = 1e-4
    for _ in range(40000):
        masses, accreted = disk.step(masses, 10.0, 0.3, 50.0, rate * 50, 12)
    assert accreted / 50 == pytest.approx(rate, rel=1e-3)


def test_steady_state_follows_three_pi_nu_sigma():
    masses = [0.0] * disk.CELLS
    rate = 1e-4
    for _ in range(40000):
        masses, _ = disk.step(masses, 10.0, 0.3, 50.0, rate * 50, 15)
    i = 5
    sigma = masses[i] / disk.AREAS[i]
    nu = disk.viscosity(disk.RADII[i], 10.0, 0.3)
    zero_torque = 1 - math.sqrt(disk.R_IN / disk.RADII[i])
    assert 3 * math.pi * nu * sigma == pytest.approx(rate * zero_torque, rel=0.05)


def test_inward_mass_outward_angular_momentum():
    masses = [0.0] * disk.CELLS
    masses[8] = 1.0
    start = total_h(masses)
    for _ in range(200):
        masses, _ = disk.step(masses, 10.0, 0.3, 50.0, 0.0, 0)
    assert masses[-1] > 0
    assert sum(m * r for m, r in zip(masses, disk.RADII, strict=True)) > 0
    assert total_h(masses) < start * 1.01


def test_masses_stay_non_negative():
    masses = [1.0] * disk.CELLS
    for _ in range(500):
        masses, _ = disk.step(masses, 1.0, 1.0, 500.0, 0.0, 0)
        assert min(masses) >= 0
