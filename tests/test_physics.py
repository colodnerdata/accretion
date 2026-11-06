import math

import pytest

from accretion import physics


def test_jeans_mass_matches_first_star_scale():
    assert 300 < physics.jeans_mass(200, 1e4) < 2000


def test_jeans_mass_scaling():
    base = physics.jeans_mass(100, 1e4)
    assert physics.jeans_mass(400, 1e4) == pytest.approx(8 * base)
    assert physics.jeans_mass(100, 4e4) == pytest.approx(base / 2)


def test_infall_rate_matches_first_star_scale():
    assert 1e-4 < physics.infall_rate(200) < 1e-3


def test_free_fall_scale():
    myr = physics.free_fall_time(1e4) / (1e6 * physics.YR)
    assert 0.2 < myr < 0.6


def test_lifetime_table_matches_published_rows():
    assert physics.lifetime_myr(20, 0) == pytest.approx(7.74)
    assert physics.lifetime_myr(1, 0) == pytest.approx(9400)
    assert physics.lifetime_myr(120, -4.5) == pytest.approx(2.74)


def test_massive_star_lifetimes_barely_depend_on_metals():
    low = physics.lifetime_myr(40, -1.54)
    high = physics.lifetime_myr(40, 0)
    assert abs(low / high - 1) < 0.03


def test_luminosity_table():
    assert math.log10(physics.luminosity(120, 0)) == pytest.approx(6.24)


def test_photoevaporation_matches_tanaka_at_forty_solar_masses():
    rate = physics.disk_loss_rate(40, 1000)
    assert rate == pytest.approx(5 * 5.4e-5 * 1.9**0.5)


@pytest.mark.parametrize(
    ("mass", "metal", "kind"),
    [
        (0.05, 0, "brown_dwarf"),
        (0.085, -6, "brown_dwarf"),
        (1, 0, "white_dwarf"),
        (9, 0, "white_dwarf"),
        (20, -6, "supernova"),
        (22, -2, "black_hole"),
        (26, -2, "supernova"),
        (50, 0, "black_hole"),
        (200, -5, "pair_instability"),
        (200, 0, "black_hole"),
    ],
)
def test_endings(mass, metal, kind):
    assert physics.ending(mass, metal) == kind


def test_explosion_islands_match_published_fractions():
    def share(low, high):
        steps = [low + (high - low) * (i + 0.5) / 500 for i in range(500)]
        return sum(physics.explodes(m) for m in steps) / 500

    assert 0.58 <= share(15, 20) <= 0.76
    assert 0.22 <= share(20, 25) <= 0.26
    assert 0.34 <= share(25, 30) <= 0.54
    assert share(30, 60) == 0


def test_temperature_floor():
    assert physics.cooling_temperature(-5) == pytest.approx(200)
    assert physics.cooling_temperature(-3) == pytest.approx(77, abs=2)
    assert physics.cooling_temperature(0) == pytest.approx(10)
    assert physics.temperature_floor(0, 0.18) == pytest.approx(57.2, abs=0.2)


def test_cosmic_metals_match_anchors():
    assert physics.cosmic_metal_log10(0.92) == pytest.approx(-3.08, abs=0.03)
    assert physics.cosmic_metal_log10(13.73) == pytest.approx(-0.84, abs=0.03)
    assert physics.cosmic_metal_log10(0.12) == pytest.approx(-8)


def test_yields():
    assert physics.heavy_yield(25, "supernova", -2) == pytest.approx(5.04)
    assert physics.heavy_yield(200, "pair_instability", -5) == pytest.approx(90)
    assert physics.heavy_yield(50, "black_hole", -5) < 0.01
