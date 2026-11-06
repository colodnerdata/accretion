"""Deterministic Layer 1 game rules.

Every rule here is mirrored in the browser engine. A run moves through
``gather``, ``collapse``, ``accrete``, ``main_sequence``, and ``ended``.
"""

import math
from dataclasses import dataclass, field

from accretion import disk, physics

SIM_STEP_YEARS = 50.0
ACCRETE_YEARS_PER_SECOND = 1000.0
COLLAPSE_SECONDS = 20.0
MS_REFERENCE_SECONDS = 240.0
MS_REFERENCE_MYR = 5.0
MS_EXPONENT = 1.12
SKIP_THRESHOLD_SECONDS = 3600.0
SEED_MASS = 0.01
BASE_TEMPERATURE = 250.0
ENRICHED_TEMPERATURE_MARGIN = 1.3
ENRICHED_ENVIRONMENT = 15.0
BASE_DENSITY = 1.0e4
SIGMA_LN_DENSITY = 1.5
SIGMA_LN_TEMPERATURE_PRIMORDIAL = 0.15
SIGMA_LN_TEMPERATURE_ENRICHED = 0.35
SIGMA_LOG10_METAL = 1.0
BASE_REACH_RATE = 0.05
BASE_TAP = 0.08
BASE_ALPHA = 0.1
ACCRETION_LIMIT_YEARS = 1.5e6
COSMIC_START_GYR = 0.12
FAILED_RUN_FACTOR = 1.1
BLACK_HOLE_START_COST = 1.0
BLACK_HOLE_INFALL_FACTOR = 1.5
LOCAL_GAS_MASS = 1.0e6
ROTATION_MIN_MASS = 15.0
FRAGMENT_LIMIT = 4
FRAGMENT_ACCRETION_PER_ORBIT = 0.3
FRAGMENT_ACCRETION_MAX_SHARE = 0.5
FRAGMENT_MIGRATION_FACTOR = 1.0
TWO_PI = 2 * math.pi
GOLDEN_ANGLE = math.pi * (3 - math.sqrt(5))

UPGRADES = {
    "reach": {"phase": "gather", "base": 1.0e-50, "ratio": 1.0e10, "max": 30},
    "tap": {"phase": "gather", "base": 1.0e-49, "ratio": 1.0e9, "max": 30},
    "cooling": {"phase": "gather", "base": 1.0e-47, "ratio": 1.0e8, "max": 15},
    "turbulence": {"phase": "accrete", "base": 1.0e47, "ratio": 2.2, "max": 11},
    "braking": {"phase": "accrete", "base": 2.0e47, "ratio": 2.5, "max": 8},
}


@dataclass
class Meta:
    """Progress that survives a prestige."""

    regions: float = 1.0
    heavy: float = 0.0
    cosmic_myr: float = 0.0
    local_metals: float = 0.0
    black_hole_unlocked: bool = False
    pair_instability_seen: bool = False
    runs: int = 0
    z_density: float = 0.0
    z_temperature: float = 0.0
    z_metal: float = 0.0
    black_hole_start: bool = False
    heavy_cooling: int = 0
    heavy_turbulence: int = 0
    supernovae: int = 0
    unlocks: list = field(default_factory=list)
    journal: list = field(default_factory=list)


@dataclass
class Run:
    """State of one run."""

    density: float
    base_temperature: float
    floor_temperature: float
    metal_log10: float
    infall_factor: float
    phase: str = "gather"
    log_reach: float = 0.0
    energy: float = 0.0
    levels: dict = field(default_factory=lambda: dict.fromkeys(UPGRADES, 0))
    collapse_left: float = COLLAPSE_SECONDS
    envelope: float = 0.0
    disk_masses: list = field(default_factory=lambda: [0.0] * disk.CELLS)
    star_mass: float = 0.0
    ejected: float = 0.0
    companions: float = 0.0
    fragments: list = field(default_factory=list)
    fragments_formed: int = 0
    companion_records: list = field(default_factory=list)
    accrete_years: float = 0.0
    collapse_mass: float = 0.0
    ignited: bool = False
    year_debt: float = 0.0
    ms_elapsed: float = 0.0
    ms_duration: float = 0.0
    lifetime_myr: float = 0.0
    forecast_myr: float = 0.0
    kind: str = ""
    seconds: float = 0.0


def update_unlocks(run: Run, meta: Meta) -> None:
    """Unlock controls once the player has met the problem each one solves."""
    gas_in_disk = sum(run.disk_masses)
    rules = {
        "reach": run.energy >= upgrade_cost(run, "reach"),
        "tap": run.levels["reach"] >= 1 and run.log_reach >= math.log(100.0),
        "turbulence": run.ignited,
        "temperature": meta.runs >= 1,
        "density": meta.runs >= 2,
        "braking": (
            meta.runs >= 2
            and run.phase == "accrete"
            and gas_in_disk > 5 * max(run.star_mass, SEED_MASS)
        ),
        "cooling": meta.runs >= 3 and meta.supernovae >= 1,
        "metals": meta.runs >= 4 and meta.supernovae >= 2,
    }
    for name, met in rules.items():
        if met and name not in meta.unlocks:
            meta.unlocks.append(name)


def heavy_cost(meta: Meta, name: str) -> float:
    """Return the heavy-element cost of a permanent upgrade, in solar masses."""
    if name == "cooling":
        return 0.5 * 2.0**meta.heavy_cooling
    return 1.0 * 2.0**meta.heavy_turbulence


def buy_heavy(meta: Meta, name: str) -> bool:
    """Buy a permanent upgrade with heavy elements."""
    cost = heavy_cost(meta, name)
    if meta.heavy < cost or name not in meta.unlocks:
        return False
    meta.heavy -= cost
    if name == "cooling":
        meta.heavy_cooling += 1
    else:
        meta.heavy_turbulence += 1
    return True


def budget(meta: Meta) -> float:
    """Return the probability budget, ln(N)."""
    return math.log(meta.regions)


def region_cost(meta: Meta) -> float:
    """Return the probability spent on the current region settings."""
    gaussian = (meta.z_density**2 + meta.z_temperature**2 + meta.z_metal**2) / 2
    return gaussian + (BLACK_HOLE_START_COST if meta.black_hole_start else 0.0)


def cosmic_age_gyr(meta: Meta) -> float:
    """Return the age of the universe in Gyr."""
    return COSMIC_START_GYR + meta.cosmic_myr / 1000.0


def background_metal_log10(meta: Meta) -> float:
    """Return log10(Z / Zsun) from the cosmic mean plus player enrichment."""
    trend = 10 ** physics.cosmic_metal_log10(cosmic_age_gyr(meta))
    local = meta.local_metals / LOCAL_GAS_MASS / physics.ZSUN
    return math.log10(trend + local)


def new_run(meta: Meta) -> Run:
    """Create a run from the current region settings."""
    density = BASE_DENSITY * math.exp(SIGMA_LN_DENSITY * meta.z_density)
    metal = background_metal_log10(meta) + SIGMA_LOG10_METAL * meta.z_metal
    floor = physics.temperature_floor(metal, cosmic_age_gyr(meta))
    if metal < physics.PRIMORDIAL_METAL_LOG10:
        centre = max(BASE_TEMPERATURE, floor)
        sigma = SIGMA_LN_TEMPERATURE_PRIMORDIAL
    else:
        centre = max(floor, ENRICHED_ENVIRONMENT) * ENRICHED_TEMPERATURE_MARGIN
        sigma = SIGMA_LN_TEMPERATURE_ENRICHED
    temperature_value = centre * math.exp(sigma * meta.z_temperature)
    factor = BLACK_HOLE_INFALL_FACTOR if meta.black_hole_start else 1.0
    run = Run(density, temperature_value, floor, metal, factor)
    run.log_reach = math.log(1.5 / density ** (1 / 3))
    return run


def temperature(run: Run, meta: Meta) -> float:
    """Return gas temperature after cooling and the composition floor."""
    level = run.levels["cooling"] + meta.heavy_cooling
    return max(run.floor_temperature, run.base_temperature * 0.9**level)


def alpha(run: Run, meta: Meta) -> float:
    """Return the disk viscosity parameter."""
    level = run.levels["turbulence"] + meta.heavy_turbulence
    return min(1.0, BASE_ALPHA * 1.3**level)


def feed_radius(run: Run) -> float:
    """Return the circularization radius in AU."""
    natural = 400.0 * (max(run.star_mass, SEED_MASS) / 10.0) ** 0.6
    return min(3000.0, max(50.0, natural)) * 0.75 ** run.levels["braking"]


def reach_rate(run: Run) -> float:
    """Return the growth of ln(reach) per second."""
    return BASE_REACH_RATE * 1.25 ** run.levels["reach"]


def tap_power(run: Run) -> float:
    """Return the growth of ln(reach) per tap."""
    return BASE_TAP * 1.5 ** run.levels["tap"]


def patch_mass(run: Run) -> float:
    """Return the gathered mass in solar masses."""
    density = physics.mass_density(run.density)
    return 4 * math.pi / 3 * math.exp(3 * run.log_reach) * density / physics.MSUN


def binding_energy(log_reach: float, density: float) -> float:
    """Return the binding energy of a uniform patch in erg."""
    rho = physics.mass_density(density)
    mass = 4 * math.pi / 3 * math.exp(3 * log_reach) * rho
    return 0.6 * physics.G * mass**2 / math.exp(log_reach)


def jeans_log_reach(run: Run, meta: Meta) -> float:
    """Return ln(radius) at which the patch reaches the Jeans mass."""
    mass = physics.jeans_mass(temperature(run, meta), run.density) * physics.MSUN
    rho = physics.mass_density(run.density)
    return math.log(3 * mass / (4 * math.pi * rho)) / 3


def upgrade_cost(run: Run, name: str) -> float:
    """Return the energy cost of the next level."""
    spec = UPGRADES[name]
    return spec["base"] * spec["ratio"] ** run.levels[name]


def can_buy(run: Run, name: str, meta: Meta) -> bool:
    """Return whether an upgrade is available and affordable."""
    spec = UPGRADES[name]
    return (
        name in meta.unlocks
        and run.phase == spec["phase"]
        and run.levels[name] < spec["max"]
        and run.energy >= upgrade_cost(run, name)
    )


def buy(run: Run, name: str, meta: Meta) -> bool:
    """Buy one level if possible, and apply any immediate threshold."""
    if not can_buy(run, name, meta):
        return False
    run.energy -= upgrade_cost(run, name)
    run.levels[name] += 1
    _check_collapse(run, meta)
    update_unlocks(run, meta)
    return True


def tap(run: Run, meta: Meta) -> None:
    """Apply one tap of gravitational gathering."""
    if run.phase != "gather":
        return
    _gather_to(run, meta, run.log_reach + tap_power(run))
    update_unlocks(run, meta)


def _gather_to(run: Run, meta: Meta, target: float) -> None:
    limit = jeans_log_reach(run, meta)
    new = min(target, limit)
    if new > run.log_reach:
        run.energy += binding_energy(new, run.density) - binding_energy(
            run.log_reach, run.density
        )
        run.log_reach = new
    _check_collapse(run, meta)


def _check_collapse(run: Run, meta: Meta) -> None:
    if run.phase == "gather" and run.log_reach >= jeans_log_reach(run, meta) - 1e-12:
        run.phase = "collapse"
        run.collapse_mass = patch_mass(run)


def _start_accretion(run: Run) -> None:
    run.phase = "accrete"
    run.envelope = run.collapse_mass - SEED_MASS
    run.star_mass = SEED_MASS


def _gas(run: Run) -> float:
    return run.envelope + sum(run.disk_masses)


def infall_now(run: Run, meta: Meta) -> float:
    """Return the current infall rate after the HII region's taper.

    Infall runs at the full rate until the star reaches the break mass, then
    falls linearly to zero at twice that mass.
    """
    rate = physics.infall_rate(temperature(run, meta)) * run.infall_factor
    onset = physics.break_mass(rate)
    return rate * min(1.0, max(0.0, 1 - (run.star_mass - onset) / onset))


def fragment_mass(run: Run) -> float:
    """Return the mass held by disk fragments still in flight.

    Each fragment is a dict with ``mass`` (M_sun), ``radius`` (AU), and
    ``phase`` (radians).
    """
    return sum(f["mass"] for f in run.fragments)


def companion_mass(run: Run) -> float:
    """Return the mass of recorded companions.

    Each record is a dict with ``mass`` (M_sun) and ``separation`` (AU).
    """
    return sum(c["mass"] for c in run.companion_records)


def disk_gas(run: Run) -> float:
    """Return the gas now in the disk."""
    return sum(run.disk_masses)


def _add_fragment(run: Run, mass: float, radius: float) -> None:
    """Add a new fragment, or coalesce it with the nearest one if full.

    Coalescing conserves mass and angular momentum (m * sqrt(r)), and the
    merged body keeps the more massive body's phase.
    """
    run.fragments_formed += 1
    if len(run.fragments) < FRAGMENT_LIMIT:
        phase = (run.fragments_formed * GOLDEN_ANGLE) % TWO_PI
        run.fragments.append({"mass": mass, "radius": radius, "phase": phase})
        return
    nearest = run.fragments[0]
    for other in run.fragments:
        if abs(other["radius"] - radius) < abs(nearest["radius"] - radius):
            nearest = other
    momentum = nearest["mass"] * math.sqrt(nearest["radius"])
    momentum += mass * math.sqrt(radius)
    nearest["mass"] += mass
    nearest["radius"] = (momentum / nearest["mass"]) ** 2


def _form_fragments(run: Run, meta: Meta) -> None:
    """Fragment each ring whose gas exceeds Toomre Q = 1 by a fragment mass.

    A ring forms at most one fragment per step, with mass Sigma * H^2, taken
    only while the ring's mass above the Q = 1 surface density is at least
    that much. This regulates the ring back toward stability instead of
    spawning fragments without limit.
    """
    star = max(run.star_mass, SEED_MASS)
    floor = temperature(run, meta)
    for i in range(disk.CELLS):
        mass = run.disk_masses[i]
        if mass <= 0:
            continue
        radius, area = disk.RADII[i], disk.AREAS[i]
        omega = disk.orbital_frequency(radius, star)
        scale_sq = disk.sound_speed_squared(radius, floor) / omega**2
        fragment = min(mass, mass / area * scale_sq)
        critical = disk.critical_surface_density(radius, star, floor)
        if mass - critical * area >= fragment:
            run.disk_masses[i] -= fragment
            _add_fragment(run, fragment, radius)


def _evolve_fragments(run: Run, meta: Meta) -> None:
    """Accrete, migrate, advance, and merge each fragment for one step.

    A fragment takes a share of its ring's gas per orbit, carrying that
    gas's angular momentum with it. It then drifts inward at the local
    viscous inflow speed 3 nu / (2 r), and merges with the star at the
    disk's inner edge, adding its mass and the usual accretion energy.
    """
    dt = SIM_STEP_YEARS
    star = max(run.star_mass, SEED_MASS)
    floor = temperature(run, meta)
    turbulence = alpha(run, meta)
    specific = physics.G * physics.MSUN / (disk.R_IN * physics.AU)
    survivors = []
    for body in run.fragments:
        cell = disk.feed_cell(body["radius"])
        omega = disk.orbital_frequency(body["radius"], star)
        share = min(
            FRAGMENT_ACCRETION_MAX_SHARE,
            FRAGMENT_ACCRETION_PER_ORBIT * dt * omega / TWO_PI,
        )
        take = share * run.disk_masses[cell]
        run.disk_masses[cell] -= take
        momentum = body["mass"] * math.sqrt(body["radius"])
        momentum += take * math.sqrt(disk.RADII[cell])
        body["mass"] += take
        body["radius"] = (momentum / body["mass"]) ** 2
        viscous = disk.viscosity(body["radius"], star, turbulence, floor)
        drift = FRAGMENT_MIGRATION_FACTOR * 1.5 * viscous / body["radius"] * dt
        body["radius"] -= drift
        if body["radius"] <= disk.R_IN:
            run.star_mass += body["mass"]
            run.energy += 0.5 * specific * run.star_mass * body["mass"] * physics.MSUN
            continue
        omega = disk.orbital_frequency(body["radius"], star)
        body["phase"] = (body["phase"] + omega * dt) % TWO_PI
        survivors.append(body)
    run.fragments = survivors


def _settle_fragments(run: Run) -> None:
    """Turn fragments still orbiting when accretion ends into companions."""
    for body in run.fragments:
        run.companion_records.append(
            {"mass": body["mass"], "separation": body["radius"]}
        )
    run.fragments = []
    run.companions = companion_mass(run)


def _accrete_step(run: Run, meta: Meta) -> None:
    dt = SIM_STEP_YEARS
    rate = infall_now(run, meta)
    infall = min(run.envelope, rate * dt)
    run.envelope -= infall
    cell = disk.feed_cell(feed_radius(run))
    floor = temperature(run, meta)
    masses, accreted = disk.step(
        run.disk_masses, run.star_mass, alpha(run, meta), dt, infall, cell, floor
    )
    run.disk_masses = masses
    run.star_mass += accreted
    run.accrete_years += dt
    if run.star_mass >= physics.hydrogen_limit(run.metal_log10):
        run.ignited = True
    specific = physics.G * physics.MSUN / (disk.R_IN * physics.AU)
    run.energy += 0.5 * specific * run.star_mass * accreted * physics.MSUN

    gas = disk_gas(run)
    if gas > 0:
        loss = physics.disk_loss_rate(run.star_mass, feed_radius(run)) * dt
        lost = min(gas, loss)
        keep = 1 - lost / gas
        run.disk_masses = [m * keep for m in run.disk_masses]
        run.ejected += lost
    _form_fragments(run, meta)
    _evolve_fragments(run, meta)
    if run.star_mass >= physics.hydrogen_limit(run.metal_log10):
        run.ignited = True
    feed_over = rate <= 0 or run.envelope <= 0
    timed_out = run.accrete_years >= ACCRETION_LIMIT_YEARS
    if (feed_over and disk_gas(run) < 1e-3) or timed_out:
        run.ejected += _gas(run)
        run.envelope = 0.0
        run.disk_masses = [0.0] * disk.CELLS
        _settle_fragments(run)
        _start_main_sequence(run)


def _start_main_sequence(run: Run) -> None:
    run.kind = physics.ending(run.star_mass, run.metal_log10)
    if run.kind == "brown_dwarf":
        run.phase = "ended"
        return
    run.phase = "main_sequence"
    run.forecast_myr = physics.lifetime_myr(run.star_mass, run.metal_log10)
    bonus = 0.0
    if run.star_mass >= ROTATION_MIN_MASS and run.levels["braking"] == 0:
        bonus = physics.rotation_bonus(run.star_mass, run.metal_log10)
    run.lifetime_myr = run.forecast_myr * (1 + bonus)
    run.ms_duration = main_sequence_seconds(run.lifetime_myr)


def main_sequence_seconds(myr: float) -> float:
    """Return play time for a main-sequence lifetime."""
    return MS_REFERENCE_SECONDS * (myr / MS_REFERENCE_MYR) ** MS_EXPONENT


def can_skip(run: Run) -> bool:
    """Return whether nothing the player can do will change the outcome."""
    if run.phase == "ended" and run.kind == "brown_dwarf":
        return True
    return (
        run.phase == "main_sequence"
        and run.ms_duration - run.ms_elapsed > SKIP_THRESHOLD_SECONDS
    )


def step(run: Run, meta: Meta, seconds: float) -> None:
    """Advance a run by real seconds, crossing phases in order."""
    left = seconds
    while left > 1e-12 and run.phase != "ended":
        if run.phase == "gather":
            limit = jeans_log_reach(run, meta)
            need = (limit - run.log_reach) / reach_rate(run)
            used = min(left, need)
            _gather_to(run, meta, run.log_reach + used * reach_rate(run))
            if used >= need:
                _check_collapse(run, meta)
                if run.phase == "gather":
                    run.phase = "collapse"
                    run.collapse_mass = patch_mass(run)
        elif run.phase == "collapse":
            used = min(left, run.collapse_left)
            run.collapse_left -= used
            if run.collapse_left <= 1e-12:
                _start_accretion(run)
        elif run.phase == "accrete":
            per_step = SIM_STEP_YEARS / ACCRETE_YEARS_PER_SECOND
            need = per_step - run.year_debt
            used = min(left, need)
            run.year_debt += used
            if run.year_debt >= per_step - 1e-12:
                run.year_debt = 0.0
                _accrete_step(run, meta)
        else:
            used = min(left, run.ms_duration - run.ms_elapsed)
            run.ms_elapsed += used
            if run.ms_elapsed >= run.ms_duration - 1e-9:
                run.phase = "ended"
        left -= used
        run.seconds += used
    update_unlocks(run, meta)


def run_gain(run: Run) -> float:
    """Return the increase in ln(N) from an ended run."""
    gains = {
        "brown_dwarf": math.log(FAILED_RUN_FACTOR),
        "white_dwarf": 0.4 + 0.1 * run.star_mass,
        "supernova": 1.0 + 0.05 * run.star_mass,
        "black_hole": 1.5,
        "pair_instability": 3.0,
    }
    return gains[run.kind]


def journal_entry(run: Run, meta: Meta, skipped: bool) -> dict:
    """Return the permanent record of a finished run."""
    return {
        "run": meta.runs + 1,
        "temperature": temperature(run, meta),
        "density": run.density,
        "metal_log10": run.metal_log10,
        "mass": run.star_mass,
        "ending": run.kind,
        "gain": run_gain(run),
        "heavy": physics.heavy_yield(run.star_mass, run.kind, run.metal_log10),
        "seconds": run.seconds,
        "lifetime_myr": run.lifetime_myr,
        "forecast_myr": run.forecast_myr,
        "alpha": alpha(run, meta),
        "feed_radius": feed_radius(run),
        "skipped": skipped,
        "companions": [dict(c) for c in run.companion_records],
    }


def prestige(run: Run, meta: Meta, skipped: bool = False) -> Run:
    """Apply a run's result and start the next run.

    A skipped run moves the player to a new region, so the universal clock
    advances only by the time that passed in that run.
    """
    meta.regions *= math.exp(run_gain(run))
    released = physics.heavy_yield(run.star_mass, run.kind, run.metal_log10)
    meta.heavy += released
    meta.local_metals += released
    meta.journal.append(journal_entry(run, meta, skipped))
    if run.kind == "supernova":
        meta.supernovae += 1
    if run.kind == "black_hole":
        meta.black_hole_unlocked = True
    if run.kind == "pair_instability":
        meta.pair_instability_seen = True
    if run.lifetime_myr:
        passed = run.ms_elapsed / run.ms_duration * run.lifetime_myr
        meta.cosmic_myr += passed if skipped else run.lifetime_myr
    meta.runs += 1
    next_run = new_run(meta)
    update_unlocks(next_run, meta)
    return next_run
