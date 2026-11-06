"""Conservative viscous disk on a specific-angular-momentum grid.

Radii are in AU, masses in solar masses, and times in years, so
``G = 4 pi^2``. The disk evolves with backward Euler, and each linear step is a
tridiagonal solve.
"""

import math

G_AU = 4 * math.pi**2
CELLS = 16
R_IN = 1.0
R_OUT = 3000.0
CS2_1AU = 0.5  # AU^2/yr^2, about 1660 K at 1 AU, falling as r^-1/2.
KELVIN_TO_CS2 = CS2_1AU / 1660.0


def _grid() -> tuple[list[float], list[float], list[float]]:
    ratio = (R_OUT / R_IN) ** (1 / CELLS)
    edges = [R_IN * ratio**i for i in range(CELLS + 1)]
    radii = [math.sqrt(edges[i] * edges[i + 1]) for i in range(CELLS)]
    areas = [math.pi * (edges[i + 1] ** 2 - edges[i] ** 2) for i in range(CELLS)]
    return edges, radii, areas


EDGES, RADII, AREAS = _grid()


def viscosity(
    radius: float, star_mass: float, alpha: float, floor_temperature: float = 0.0
) -> float:
    """Return alpha viscosity in AU^2/yr."""
    omega = math.sqrt(G_AU * star_mass / radius**3)
    sound2 = max(CS2_1AU * radius**-0.5, KELVIN_TO_CS2 * floor_temperature)
    return alpha * sound2 / omega


def sound_speed_squared(radius: float, floor_temperature: float = 0.0) -> float:
    """Return the disk sound speed squared in AU^2/yr^2 at a radius."""
    return max(CS2_1AU * radius**-0.5, KELVIN_TO_CS2 * floor_temperature)


def orbital_frequency(radius: float, star_mass: float) -> float:
    """Return the Keplerian angular frequency in rad/yr."""
    return math.sqrt(G_AU * star_mass / radius**3)


def critical_surface_density(
    radius: float, star_mass: float, floor_temperature: float = 0.0
) -> float:
    """Return the surface density at Toomre Q = 1, in M_sun / AU^2.

    Q = c_s * Omega / (pi * G * Sigma), so Q = 1 at
    Sigma = c_s * Omega / (pi * G).
    """
    sound = math.sqrt(sound_speed_squared(radius, floor_temperature))
    return sound * orbital_frequency(radius, star_mass) / (math.pi * G_AU)


def stability(
    masses: list[float], star_mass: float, floor_temperature: float = 0.0
) -> list[float]:
    """Return Toomre Q for each ring, infinite where a ring is empty."""
    result = []
    for radius, area, mass in zip(RADII, AREAS, masses, strict=True):
        if mass <= 0:
            result.append(math.inf)
        else:
            critical = critical_surface_density(radius, star_mass, floor_temperature)
            result.append(critical * area / mass)
    return result


def feed_cell(radius: float) -> int:
    """Return the index of the cell holding a circularization radius."""
    for index in range(CELLS):
        if radius < EDGES[index + 1]:
            return index
    return CELLS - 1


def torque_rates(
    star_mass: float, alpha: float, floor_temperature: float = 0.0
) -> list[float]:
    """Return torque per unit cell mass, using h / sqrt(GM) as the grid."""
    return [
        3
        * math.pi
        * viscosity(r, star_mass, alpha, floor_temperature)
        * math.sqrt(r)
        / area
        for r, area in zip(RADII, AREAS, strict=True)
    ]


def step(
    masses: list[float],
    star_mass: float,
    alpha: float,
    dt: float,
    source: float,
    source_cell: int,
    floor_temperature: float = 0.0,
) -> tuple[list[float], float]:
    """Advance the disk one step.

    Parameters
    ----------
    masses : list of float
        Cell masses in solar masses.
    star_mass : float
        Central mass in solar masses.
    alpha : float
        Viscosity parameter.
    dt : float
        Step in years.
    source : float
        Mass added to the disk during the step, in solar masses.
    source_cell : int
        Cell receiving that mass.
    floor_temperature : float, optional
        Lowest disk temperature in K.

    Returns
    -------
    tuple of (list of float, float)
        New cell masses, and mass accreted onto the star.

    """
    rates = torque_rates(star_mass, alpha, floor_temperature)
    roots = [math.sqrt(r) for r in RADII]
    lower = [0.0] * CELLS
    diagonal = [1.0] * CELLS
    upper = [0.0] * CELLS
    for i in range(CELLS - 1):
        factor = dt / (roots[i + 1] - roots[i])
        diagonal[i] += factor * rates[i]
        upper[i] -= factor * rates[i + 1]
        lower[i + 1] -= factor * rates[i]
        diagonal[i + 1] += factor * rates[i + 1]
    inner = rates[0] / (roots[0] - math.sqrt(R_IN))
    diagonal[0] += dt * inner
    right = list(masses)
    right[source_cell] += source

    # Thomas algorithm.
    for i in range(1, CELLS):
        weight = lower[i] / diagonal[i - 1]
        diagonal[i] -= weight * upper[i - 1]
        right[i] -= weight * right[i - 1]
    solved = [0.0] * CELLS
    solved[-1] = right[-1] / diagonal[-1]
    for i in range(CELLS - 2, -1, -1):
        solved[i] = (right[i] - upper[i] * solved[i + 1]) / diagonal[i]
    return solved, dt * inner * solved[0]
