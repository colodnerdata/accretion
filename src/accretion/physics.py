"""Physical relations used by the game, in CGS unless a name says otherwise.

Table sources and support levels are in ``FIDELITY.md``.
"""

import math

G = 6.674e-8
K_B = 1.381e-16
M_H = 1.673e-24
MSUN = 1.989e33
AU = 1.496e13
YR = 3.156e7
MU = 1.22
ZSUN = 0.0134
PRIMORDIAL_METAL_LOG10 = -4.0

LIFE_MASS = [
    0.1, 0.3, 0.5, 0.8, 1, 2, 3, 5, 8, 10, 15, 20, 25, 40, 60, 85, 120, 150, 200, 300,
]
LIFE_METAL = [-4.0, -1.54, -0.85, 0.0]
LIFE_MYR = [
    [3.3e6, 3.1e5, 5.1e4, 13749, 6108, 634.5, 209.3, 67.29, 26.95, 18.92, 11.31,
     8.47, 6.94, 4.83, 3.75, 3.17, 2.74, 2.51, 2.27, 2.05],
    [3.3e6, 3.1e5, 5.1e4, 11130, 4912, 582.6, 215.8, 72.99, 30.7, 20.7, 10.95,
     7.90, 6.48, 4.47, 3.51, 2.98, 2.61, 2.51, 2.29, 2.10],
    [4.8e6, 3.8e5, 6e4, 11575, 5492, 667.0, 240.3, 77.36, 31.45, 21.03, 11.00,
     7.89, 6.45, 4.51, 3.56, 3.02, 2.65, 2.51, 2.29, 2.10],
    [6e6, 5.6e5, 1e5, 2.1e4, 9400, 1008.8, 320.6, 88.19, 32.62, 21.56, 11.02,
     7.74, 6.31, 4.44, 3.53, 3.02, 2.67, 2.50, 2.32, 2.15],
]
LUM_MASS = [0.1, 0.5, 1, 2, 5, 10, 25, 40, 60, 120, 200, 300]
LUM_METAL = [-2.5, 0.0]
LUM_LOG10 = [
    [-2.80, -1.11, 0.25, 1.48, 2.90, 3.80, 4.86, 5.35, 5.71, 6.24, 6.57, 6.84],
    [-3.07, -1.43, -0.14, 1.23, 2.73, 3.75, 4.87, 5.35, 5.71, 6.24, 6.57, 6.81],
]
ION_MASS = [5, 9, 15, 25, 40, 60, 80, 120, 200, 300, 500]
ION_RATE = [
    1.1e45, 1.8e47, 1.4e48, 5.5e48, 1.9e49, 3.5e49, 5.9e49, 1.1e50, 2.3e50, 4.0e50,
    7.4e50,
]
SN_MIN_METAL = [-5.0, -4.0, -2.0, -1.0, 0.0]
SN_MIN_MASS = [9.2, 8.6, 8.4, 8.6, 9.4]
AGE_GYR = [0.18, 0.37, 0.47, 0.64, 0.92, 1.53, 2.13, 3.26, 5.82, 13.73]
AGE_REDSHIFT = [20, 12, 10, 8, 6, 4, 3, 2, 1, 0]
WD_MASS = [1, 2.5, 3, 6]
WD_METALS_LOW = [0.0003, 0.057, 0.026, 0.038]
WD_METALS_SOLAR = [0.008, 0.041, 0.062, 0.116]
BH_MASS = [30, 60, 120]
BH_METALS_SOLAR = [0.26, 0.97, 3.4]
BH_METALS_LOW = 0.005
PAIR_METAL_FRACTION = 0.45
EXPLOSION_ISLANDS = [(0.0, 18.5), (20.0, 21.2), (25.0, 27.0)]


def interpolate(xs: list, ys: list, x: float) -> float:
    """Return piecewise-linear interpolation, held constant past each end."""
    if x <= xs[0]:
        return ys[0]
    for i in range(1, len(xs)):
        if x <= xs[i]:
            fraction = (x - xs[i - 1]) / (xs[i] - xs[i - 1])
            return ys[i - 1] + fraction * (ys[i] - ys[i - 1])
    return ys[-1]


def _log_table(masses: list, rows: list, metals: list, mass: float, metal: float):
    logs = [math.log10(m) for m in masses]
    values = [interpolate(logs, row, math.log10(mass)) for row in rows]
    return interpolate(metals, values, metal)


def sound_speed(temperature: float) -> float:
    """Return the isothermal sound speed in cm/s."""
    return math.sqrt(K_B * temperature / (MU * M_H))


def mass_density(number_density: float) -> float:
    """Return mass density in g/cm3 for a number density in 1/cm3."""
    return MU * M_H * number_density


def jeans_mass(temperature: float, number_density: float) -> float:
    """Return the Jeans mass in solar masses."""
    thermal = (5 * K_B * temperature / (G * MU * M_H)) ** 1.5
    density = (3 / (4 * math.pi * mass_density(number_density))) ** 0.5
    return thermal * density / MSUN


def free_fall_time(number_density: float) -> float:
    """Return the free-fall time in seconds."""
    return math.sqrt(3 * math.pi / (32 * G * mass_density(number_density)))


def infall_rate(temperature: float) -> float:
    """Return the Shu infall scale c_s^3 / G in solar masses per year."""
    return sound_speed(temperature) ** 3 / G * YR / MSUN


def break_mass(rate: float) -> float:
    """Return the mass where the HII region starts cutting off infall."""
    return 20.0 * (rate / 1.6e-3) ** (2 / 3)


def luminosity(mass: float, metal_log10: float) -> float:
    """Return zero-age luminosity in solar luminosities."""
    return 10 ** _log_table(LUM_MASS, LUM_LOG10, LUM_METAL, mass, metal_log10)


def lifetime_myr(mass: float, metal_log10: float) -> float:
    """Return the non-rotating core-hydrogen lifetime in Myr."""
    rows = [[math.log10(value) for value in row] for row in LIFE_MYR]
    return 10 ** _log_table(LIFE_MASS, rows, LIFE_METAL, mass, metal_log10)


def rotation_bonus(mass: float, metal_log10: float) -> float:
    """Return the fractional lifetime gain of a fast rotator."""
    if metal_log10 >= -0.5:
        gain = 0.25
    elif metal_log10 >= -2.0:
        gain = 0.18
    else:
        gain = 0.10
    return min(gain, interpolate([120, 200, 300], [0.25, 0.14, 0.10], mass))


def ionizing_rate(mass: float) -> float:
    """Return hydrogen-ionizing photons per second at zero age."""
    logs = [math.log10(m) for m in ION_MASS]
    rates = [math.log10(q) for q in ION_RATE]
    return 10 ** interpolate(logs, rates, math.log10(mass))


def disk_loss_rate(mass: float, radius_au: float) -> float:
    """Return disk photoevaporation in solar masses per year."""
    photons = ionizing_rate(mass) / 1e49
    return 5 * 5.4e-5 * math.sqrt(photons) * math.sqrt(radius_au / 1000.0)


def cooling_temperature(metal_log10: float) -> float:
    """Return the composition-limited gas temperature in K."""
    limit = math.log10(1.3e-4)
    excess = max(0.0, metal_log10 - limit)
    return max(10.0, 200.0 * 10 ** (-0.47 * excess))


def redshift(age_gyr: float) -> float:
    """Return redshift at a cosmic age in Gyr."""
    logs = [math.log10(a) for a in AGE_GYR]
    points = [math.log10(1 + z) for z in AGE_REDSHIFT]
    x = math.log10(age_gyr)
    if x < logs[0]:
        return 21 * (AGE_GYR[0] / age_gyr) ** (2 / 3) - 1
    return 10 ** interpolate(logs, points, x) - 1


def temperature_floor(metal_log10: float, age_gyr: float) -> float:
    """Return the lowest gas temperature in K, including the CMB."""
    return max(2.725 * (1 + redshift(age_gyr)), cooling_temperature(metal_log10))


def cosmic_metal_log10(age_gyr: float) -> float:
    """Return log10(Z / Zsun) of the cosmic mean."""

    def fit(age: float) -> float:
        x = age / 3.82
        return math.log10(0.108 * x**3.42 / (1 + x**3.20))

    if age_gyr >= 0.2:
        return fit(age_gyr)
    return interpolate([0.12, 0.2], [-8.0, fit(0.2)], age_gyr)


def hydrogen_limit(metal_log10: float) -> float:
    """Return the minimum hydrogen-burning mass."""
    if metal_log10 >= -0.5:
        return 0.075
    return 0.083 if metal_log10 >= -4.0 else 0.09


def explodes(mass: float) -> bool:
    """Return whether an enriched massive star explodes."""
    return any(low <= mass < high for low, high in EXPLOSION_ISLANDS)


def ending(mass: float, metal_log10: float) -> str:
    """Return the stellar ending for an initial mass and metal content."""
    if mass < hydrogen_limit(metal_log10):
        return "brown_dwarf"
    if mass < interpolate(SN_MIN_METAL, SN_MIN_MASS, metal_log10):
        return "white_dwarf"
    if 140.0 <= mass < 260.0 and metal_log10 < -0.5:
        return "pair_instability"
    if metal_log10 < PRIMORDIAL_METAL_LOG10:
        return "supernova" if mass < 25.0 else "black_hole"
    return "supernova" if explodes(mass) else "black_hole"


def heavy_yield(mass: float, kind: str, metal_log10: float) -> float:
    """Return heavy elements released, in solar masses."""
    if kind == "white_dwarf":
        share = min(1.0, max(0.0, (metal_log10 + 4.0) / 4.0))
        low = interpolate(WD_MASS, WD_METALS_LOW, mass)
        high = interpolate(WD_MASS, WD_METALS_SOLAR, mass)
        return low + share * (high - low)
    if kind == "supernova":
        return max(0.2, 0.36 * (mass - 11.0))
    if kind == "black_hole":
        share = min(1.0, max(0.0, (metal_log10 + 3.0) / 3.0))
        solar = interpolate(BH_MASS, BH_METALS_SOLAR, mass)
        return BH_METALS_LOW + share * (solar - BH_METALS_LOW)
    if kind == "pair_instability":
        return PAIR_METAL_FRACTION * mass
    return 0.0
