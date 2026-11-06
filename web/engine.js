// Browser port of src/accretion. tests/test_parity.py keeps the two in step.
const Engine = (() => {
  const G = 6.674e-8, K_B = 1.381e-16, M_H = 1.673e-24, MSUN = 1.989e33, AU = 1.496e13;
  const YR = 3.156e7, MU = 1.22, ZSUN = 0.0134, PRIMORDIAL_METAL_LOG10 = -4, ALPHA_B = 2.6e-13, HII_SOUND_SPEED = 1.0e6;
  const G_AU = 4 * Math.PI ** 2, CELLS = 16, R_IN = 1.0, R_OUT = 3000.0, CS2_1AU = 0.5;
  const FRAGMENT_LIMIT = 4, FRAGMENT_ACCRETION_PER_ORBIT = 0.3, FRAGMENT_ACCRETION_MAX_SHARE = 0.5, FRAGMENT_MIGRATION_FACTOR = 1.0;
  const TWO_PI = 2 * Math.PI, GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const SIM_STEP_YEARS = 50.0, ACCRETE_YEARS_PER_SECOND = 1000.0, COLLAPSE_SECONDS = 20.0;
  const MS_REFERENCE_SECONDS = 240.0, MS_REFERENCE_MYR = 5.0, MS_EXPONENT = 1.12;
  const SKIP_THRESHOLD_SECONDS = 3600.0, SEED_MASS = 0.01, BASE_TEMPERATURE = 250.0, ENRICHED_TEMPERATURE_MARGIN = 1.3, ENRICHED_ENVIRONMENT = 15.0;
  const BASE_DENSITY = 1.0e4, SIGMA_LN_DENSITY = 1.5;
  const SIGMA_LN_TEMPERATURE_PRIMORDIAL = 0.15, SIGMA_LN_TEMPERATURE_ENRICHED = 0.35, SIGMA_LOG10_METAL = 1.0, BASE_REACH_RATE = 0.05;
  const BASE_TAP = 0.08, BASE_ALPHA = 0.1, ACCRETION_LIMIT_YEARS = 1.5e6, COSMIC_START_GYR = 0.12;
  const FAILED_RUN_FACTOR = 1.1, BLACK_HOLE_START_COST = 1.0, BLACK_HOLE_INFALL_FACTOR = 1.5;
  const LOCAL_GAS_MASS = 1.0e6, ROTATION_MIN_MASS = 15.0;

  const LIFE_MASS = [0.1, 0.3, 0.5, 0.8, 1, 2, 3, 5, 8, 10, 15, 20, 25, 40, 60, 85, 120, 150, 200, 300];
  const LIFE_METAL = [-4, -1.54, -0.85, 0];
  const LIFE_MYR = [
    [3.3e6, 3.1e5, 5.1e4, 13749, 6108, 634.5, 209.3, 67.29, 26.95, 18.92, 11.31, 8.47, 6.94, 4.83, 3.75, 3.17, 2.74, 2.51, 2.27, 2.05],
    [3.3e6, 3.1e5, 5.1e4, 11130, 4912, 582.6, 215.8, 72.99, 30.7, 20.7, 10.95, 7.90, 6.48, 4.47, 3.51, 2.98, 2.61, 2.51, 2.29, 2.10],
    [4.8e6, 3.8e5, 6e4, 11575, 5492, 667.0, 240.3, 77.36, 31.45, 21.03, 11.00, 7.89, 6.45, 4.51, 3.56, 3.02, 2.65, 2.51, 2.29, 2.10],
    [6e6, 5.6e5, 1e5, 2.1e4, 9400, 1008.8, 320.6, 88.19, 32.62, 21.56, 11.02, 7.74, 6.31, 4.44, 3.53, 3.02, 2.67, 2.50, 2.32, 2.15],
  ];
  const LUM_MASS = [0.1, 0.5, 1, 2, 5, 10, 25, 40, 60, 120, 200, 300];
  const LUM_METAL = [-2.5, 0];
  const LUM_LOG10 = [
    [-2.80, -1.11, 0.25, 1.48, 2.90, 3.80, 4.86, 5.35, 5.71, 6.24, 6.57, 6.84],
    [-3.07, -1.43, -0.14, 1.23, 2.73, 3.75, 4.87, 5.35, 5.71, 6.24, 6.57, 6.81],
  ];
  const ION_MASS = [5, 9, 15, 25, 40, 60, 80, 120, 200, 300, 500];
  const ION_RATE = [1.1e45, 1.8e47, 1.4e48, 5.5e48, 1.9e49, 3.5e49, 5.9e49, 1.1e50, 2.3e50, 4.0e50, 7.4e50];
  const SN_MIN_METAL = [-5, -4, -2, -1, 0], SN_MIN_MASS = [9.2, 8.6, 8.4, 8.6, 9.4];
  const AGE_GYR = [0.18, 0.37, 0.47, 0.64, 0.92, 1.53, 2.13, 3.26, 5.82, 13.73];
  const AGE_REDSHIFT = [20, 12, 10, 8, 6, 4, 3, 2, 1, 0];
  const WD_MASS = [1, 2.5, 3, 6], WD_METALS_LOW = [0.0003, 0.057, 0.026, 0.038], WD_METALS_SOLAR = [0.008, 0.041, 0.062, 0.116];
  const BH_MASS = [30, 60, 120], BH_METALS_SOLAR = [0.26, 0.97, 3.4], BH_METALS_LOW = 0.005, PAIR_METAL_FRACTION = 0.45;
  const EXPLOSION_ISLANDS = [[0, 18.5], [20, 21.2], [25, 27]];
  function interpolate(xs, ys, x) {
    if (x <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i++) {
      if (x <= xs[i]) return ys[i - 1] + (x - xs[i - 1]) / (xs[i] - xs[i - 1]) * (ys[i] - ys[i - 1]);
    }
    return ys[ys.length - 1];
  }
  const logTable = (masses, rows, metals, mass, metal) => interpolate(metals, rows.map((row) => interpolate(masses.map(Math.log10), row, Math.log10(mass))), metal);
  const LIFE_LOG10 = LIFE_MYR.map((row) => row.map(Math.log10));

  const UPGRADES = {
    reach: { phase: "gather", base: 1.0e-50, ratio: 1.0e10, max: 30 },
    tap: { phase: "gather", base: 1.0e-49, ratio: 1.0e9, max: 30 },
    cooling: { phase: "gather", base: 1.0e-47, ratio: 1.0e8, max: 15 },
    turbulence: { phase: "accrete", base: 1.0e47, ratio: 2.2, max: 11 },
    braking: { phase: "accrete", base: 2.0e47, ratio: 2.5, max: 8 },
  };

  const ratio = (R_OUT / R_IN) ** (1 / CELLS);
  const EDGES = Array.from({ length: CELLS + 1 }, (_, i) => R_IN * ratio ** i);
  const RADII = Array.from({ length: CELLS }, (_, i) => Math.sqrt(EDGES[i] * EDGES[i + 1]));
  const AREAS = Array.from({ length: CELLS }, (_, i) => Math.PI * (EDGES[i + 1] ** 2 - EDGES[i] ** 2));

  const soundSpeed = (t) => Math.sqrt(K_B * t / (MU * M_H));
  const massDensity = (n) => MU * M_H * n;
  const jeansMass = (t, n) => (5 * K_B * t / (G * MU * M_H)) ** 1.5 * (3 / (4 * Math.PI * massDensity(n))) ** 0.5 / MSUN;
  const freeFallTime = (n) => Math.sqrt(3 * Math.PI / (32 * G * massDensity(n)));
  const infallRate = (t) => soundSpeed(t) ** 3 / G * YR / MSUN;
  const breakMass = (rate) => 20 * (rate / 1.6e-3) ** (2 / 3);
  const luminosity = (m, z) => 10 ** logTable(LUM_MASS, LUM_LOG10, LUM_METAL, m, z);
  const lifetimeMyr = (m, z) => 10 ** logTable(LIFE_MASS, LIFE_LOG10, LIFE_METAL, m, z);
  const rotationBonus = (m, z) => Math.min(z >= -0.5 ? 0.25 : z >= -2 ? 0.18 : 0.10, interpolate([120, 200, 300], [0.25, 0.14, 0.10], m));
  const ionizingRate = (m) => 10 ** interpolate(ION_MASS.map(Math.log10), ION_RATE.map(Math.log10), Math.log10(m));
  const stromgrenRadius = (q, n) => (3 * q / (4 * Math.PI * n ** 2 * ALPHA_B)) ** (1 / 3);
  const hiiRadius = (q, n, temp, s) => {
    const r0 = stromgrenRadius(q, n);
    return Math.min(r0 * (1 + 7 * HII_SOUND_SPEED * s / (4 * r0)) ** (4 / 7), r0 * (HII_SOUND_SPEED / soundSpeed(temp)) ** (4 / 3));
  };
  const diskLossRate = (m, r) => 5 * 5.4e-5 * Math.sqrt(ionizingRate(m) / 1e49) * Math.sqrt(r / 1000);
  const coolingTemperature = (z) => Math.max(10, 200 * 10 ** (-0.47 * Math.max(0, z - Math.log10(1.3e-4))));
  function redshift(age) {
    const x = Math.log10(age), logs = AGE_GYR.map(Math.log10);
    if (x < logs[0]) return 21 * (AGE_GYR[0] / age) ** (2 / 3) - 1;
    return 10 ** interpolate(logs, AGE_REDSHIFT.map((z) => Math.log10(1 + z)), x) - 1;
  }
  const temperatureFloor = (z, age) => Math.max(2.725 * (1 + redshift(age)), coolingTemperature(z));
  const cosmicFit = (age) => { const x = age / 3.82; return Math.log10(0.108 * x ** 3.42 / (1 + x ** 3.20)); };
  const cosmicMetal = (age) => age >= 0.2 ? cosmicFit(age) : interpolate([0.12, 0.2], [-8, cosmicFit(0.2)], age);
  const hydrogenLimit = (z) => z >= -0.5 ? 0.075 : z >= -4 ? 0.083 : 0.09;
  const explodes = (m) => EXPLOSION_ISLANDS.some(([low, high]) => low <= m && m < high);
  function ending(m, z) {
    if (m < hydrogenLimit(z)) return "brown_dwarf";
    if (m < interpolate(SN_MIN_METAL, SN_MIN_MASS, z)) return "white_dwarf";
    if (m >= 140 && m < 260 && z < -0.5) return "pair_instability";
    if (z < PRIMORDIAL_METAL_LOG10) return m < 25 ? "supernova" : "black_hole";
    return explodes(m) ? "supernova" : "black_hole";
  }
  function heavyYield(m, kind, z) {
    if (kind === "white_dwarf") {
      const share = Math.min(1, Math.max(0, (z + 4) / 4)), low = interpolate(WD_MASS, WD_METALS_LOW, m), high = interpolate(WD_MASS, WD_METALS_SOLAR, m);
      return low + share * (high - low);
    }
    if (kind === "supernova") return Math.max(0.2, 0.36 * (m - 11));
    if (kind === "black_hole") {
      const share = Math.min(1, Math.max(0, (z + 3) / 3));
      return BH_METALS_LOW + share * (interpolate(BH_MASS, BH_METALS_SOLAR, m) - BH_METALS_LOW);
    }
    return kind === "pair_instability" ? PAIR_METAL_FRACTION * m : 0;
  }

  const KELVIN_TO_CS2 = CS2_1AU / 1660;
  const soundSpeedSquared = (r, floor) => Math.max(CS2_1AU * r ** -0.5, KELVIN_TO_CS2 * floor);
  const orbitalFrequency = (r, m) => Math.sqrt(G_AU * m / r ** 3);
  const criticalSurfaceDensity = (r, m, floor) => Math.sqrt(soundSpeedSquared(r, floor)) * orbitalFrequency(r, m) / (Math.PI * G_AU);
  const stability = (masses, star, floor) => masses.map((mass, i) => (mass <= 0 ? Infinity : criticalSurfaceDensity(RADII[i], star, floor) * AREAS[i] / mass));
  const viscosity = (r, m, a, floor) => a * Math.max(CS2_1AU * r ** -0.5, KELVIN_TO_CS2 * floor) / Math.sqrt(G_AU * m / r ** 3);
  const feedCell = (r) => {
    for (let i = 0; i < CELLS; i++) if (r < EDGES[i + 1]) return i;
    return CELLS - 1;
  };
  function diskStep(masses, star, a, dt, source, cell, floor) {
    const rates = RADII.map((r, i) => 3 * Math.PI * viscosity(r, star, a, floor) * Math.sqrt(r) / AREAS[i]);
    const roots = RADII.map(Math.sqrt);
    const lower = new Array(CELLS).fill(0), diagonal = new Array(CELLS).fill(1), upper = new Array(CELLS).fill(0);
    for (let i = 0; i < CELLS - 1; i++) {
      const f = dt / (roots[i + 1] - roots[i]);
      diagonal[i] += f * rates[i];
      upper[i] -= f * rates[i + 1];
      lower[i + 1] -= f * rates[i];
      diagonal[i + 1] += f * rates[i + 1];
    }
    const inner = rates[0] / (roots[0] - Math.sqrt(R_IN));
    diagonal[0] += dt * inner;
    const right = masses.slice();
    right[cell] += source;
    for (let i = 1; i < CELLS; i++) {
      const w = lower[i] / diagonal[i - 1];
      diagonal[i] -= w * upper[i - 1];
      right[i] -= w * right[i - 1];
    }
    const solved = new Array(CELLS).fill(0);
    solved[CELLS - 1] = right[CELLS - 1] / diagonal[CELLS - 1];
    for (let i = CELLS - 2; i >= 0; i--) solved[i] = (right[i] - upper[i] * solved[i + 1]) / diagonal[i];
    return [solved, dt * inner * solved[0]];
  }

  const newMeta = () => ({
    regions: 1, heavy: 0, cosmicMyr: 0, localMetals: 0, blackHoleUnlocked: false,
    pairInstabilitySeen: false, runs: 0, zDensity: 0, zTemperature: 0, zMetal: 0,
    blackHoleStart: false, heavyCooling: 0, heavyTurbulence: 0, supernovae: 0, unlocks: [], journal: [],
  });
  const budget = (meta) => Math.log(meta.regions);
  const regionCost = (m) => (m.zDensity ** 2 + m.zTemperature ** 2 + m.zMetal ** 2) / 2 + (m.blackHoleStart ? BLACK_HOLE_START_COST : 0);
  const cosmicAgeGyr = (meta) => COSMIC_START_GYR + meta.cosmicMyr / 1000;
  const backgroundMetal = (meta) => Math.log10(10 ** cosmicMetal(cosmicAgeGyr(meta)) + meta.localMetals / LOCAL_GAS_MASS / ZSUN);
  function updateUnlocks(run, meta) {
    const diskGas = run.diskMasses.reduce((a, b) => a + b, 0);
    const rules = {
      reach: run.energy >= upgradeCost(run, "reach"),
      tap: run.levels.reach >= 1 && run.logReach >= Math.log(100),
      turbulence: run.ignited,
      temperature: meta.runs >= 1,
      density: meta.runs >= 2,
      braking: meta.runs >= 2 && run.phase === "accrete" && diskGas > 5 * Math.max(run.starMass, SEED_MASS),
      cooling: meta.runs >= 3 && meta.supernovae >= 1,
      metals: meta.runs >= 4 && meta.supernovae >= 2,
    };
    for (const [name, met] of Object.entries(rules)) if (met && !meta.unlocks.includes(name)) meta.unlocks.push(name);
  }
  const heavyCost = (meta, name) => name === "cooling" ? 0.5 * 2 ** meta.heavyCooling : 2 ** meta.heavyTurbulence;
  function buyHeavy(meta, name) {
    const cost = heavyCost(meta, name);
    if (meta.heavy < cost || !meta.unlocks.includes(name)) return false;
    meta.heavy -= cost;
    if (name === "cooling") meta.heavyCooling += 1; else meta.heavyTurbulence += 1;
    return true;
  }
  function newRun(meta) {
    const density = BASE_DENSITY * Math.exp(SIGMA_LN_DENSITY * meta.zDensity);
    const metalLog10 = backgroundMetal(meta) + SIGMA_LOG10_METAL * meta.zMetal;
    const floorTemperature = temperatureFloor(metalLog10, cosmicAgeGyr(meta));
    const primordial = metalLog10 < PRIMORDIAL_METAL_LOG10;
    const centre = primordial ? Math.max(BASE_TEMPERATURE, floorTemperature) : Math.max(floorTemperature, ENRICHED_ENVIRONMENT) * ENRICHED_TEMPERATURE_MARGIN;
    const sigma = primordial ? SIGMA_LN_TEMPERATURE_PRIMORDIAL : SIGMA_LN_TEMPERATURE_ENRICHED;
    return {
      density, baseTemperature: centre * Math.exp(sigma * meta.zTemperature), floorTemperature, metalLog10,
      infallFactor: meta.blackHoleStart ? BLACK_HOLE_INFALL_FACTOR : 1,
      phase: "gather", logReach: Math.log(1.5 / density ** (1 / 3)), energy: 0,
      levels: { reach: 0, tap: 0, cooling: 0, turbulence: 0, braking: 0 },
      collapseLeft: COLLAPSE_SECONDS, envelope: 0, diskMasses: new Array(CELLS).fill(0),
      starMass: 0, ejected: 0, companions: 0, fragments: [], fragmentsFormed: 0, companionRecords: [], accreteYears: 0, collapseMass: 0, ignited: false, yearDebt: 0, msElapsed: 0,
      msDuration: 0, lifetimeMyr: 0, forecastMyr: 0, kind: "", seconds: 0,
    };
  }
  const temperature = (run, meta) => Math.max(run.floorTemperature, run.baseTemperature * 0.9 ** (run.levels.cooling + meta.heavyCooling));
  const alpha = (run, meta) => Math.min(1, BASE_ALPHA * 1.3 ** (run.levels.turbulence + meta.heavyTurbulence));
  const feedRadius = (run) => Math.min(3000, Math.max(50, 400 * (Math.max(run.starMass, SEED_MASS) / 10) ** 0.6)) * 0.75 ** run.levels.braking;
  const reachRate = (run) => BASE_REACH_RATE * 1.25 ** run.levels.reach;
  const tapPower = (run) => BASE_TAP * 1.5 ** run.levels.tap;
  const patchMass = (run) => 4 * Math.PI / 3 * Math.exp(3 * run.logReach) * massDensity(run.density) / MSUN;
  const bindingEnergy = (lr, n) => {
    const mass = 4 * Math.PI / 3 * Math.exp(3 * lr) * massDensity(n);
    return 0.6 * G * mass ** 2 / Math.exp(lr);
  };
  const jeansLogReach = (run, meta) => {
    const mass = jeansMass(temperature(run, meta), run.density) * MSUN;
    return Math.log(3 * mass / (4 * Math.PI * massDensity(run.density))) / 3;
  };
  const upgradeCost = (run, name) => UPGRADES[name].base * UPGRADES[name].ratio ** run.levels[name];
  const canBuy = (run, name, meta) => meta.unlocks.includes(name) && run.phase === UPGRADES[name].phase && run.levels[name] < UPGRADES[name].max && run.energy >= upgradeCost(run, name);
  function checkCollapse(run, meta) {
    if (run.phase === "gather" && run.logReach >= jeansLogReach(run, meta) - 1e-12) {
      run.phase = "collapse";
      run.collapseMass = patchMass(run);
    }
  }
  function buy(run, name, meta) {
    if (!canBuy(run, name, meta)) return false;
    run.energy -= upgradeCost(run, name);
    run.levels[name] += 1;
    checkCollapse(run, meta);
    updateUnlocks(run, meta);
    return true;
  }
  function gatherTo(run, meta, target) {
    const next = Math.min(target, jeansLogReach(run, meta));
    if (next > run.logReach) {
      run.energy += bindingEnergy(next, run.density) - bindingEnergy(run.logReach, run.density);
      run.logReach = next;
    }
    checkCollapse(run, meta);
  }
  function tap(run, meta) {
    if (run.phase !== "gather") return;
    gatherTo(run, meta, run.logReach + tapPower(run));
    updateUnlocks(run, meta);
  }
  const gas = (run) => run.envelope + run.diskMasses.reduce((a, b) => a + b, 0);
  function startMainSequence(run) {
    run.kind = ending(run.starMass, run.metalLog10);
    if (run.kind === "brown_dwarf") { run.phase = "ended"; return; }
    run.phase = "main_sequence";
    run.forecastMyr = lifetimeMyr(run.starMass, run.metalLog10);
    const bonus = run.starMass >= ROTATION_MIN_MASS && run.levels.braking === 0 ? rotationBonus(run.starMass, run.metalLog10) : 0;
    run.lifetimeMyr = run.forecastMyr * (1 + bonus);
    run.msDuration = mainSequenceSeconds(run.lifetimeMyr);
  }
  const mainSequenceSeconds = (myr) => MS_REFERENCE_SECONDS * (myr / MS_REFERENCE_MYR) ** MS_EXPONENT;
  function infallNow(run, meta) {
    const rate = infallRate(temperature(run, meta)) * run.infallFactor, onset = breakMass(rate);
    return rate * Math.min(1, Math.max(0, 1 - (run.starMass - onset) / onset));
  }
  const diskGas = (run) => run.diskMasses.reduce((a, b) => a + b, 0);
  const fragmentMass = (run) => run.fragments.reduce((a, f) => a + f.mass, 0);
  const companionMass = (run) => run.companionRecords.reduce((a, c) => a + c.mass, 0);
  function addFragment(run, mass, radius) {
    run.fragmentsFormed = (run.fragmentsFormed ?? 0) + 1;
    if (run.fragments.length < FRAGMENT_LIMIT) {
      run.fragments.push({ mass, radius, phase: (run.fragmentsFormed * GOLDEN_ANGLE) % TWO_PI });
      return;
    }
    let nearest = run.fragments[0];
    for (const other of run.fragments) if (Math.abs(other.radius - radius) < Math.abs(nearest.radius - radius)) nearest = other;
    let momentum = nearest.mass * Math.sqrt(nearest.radius);
    momentum += mass * Math.sqrt(radius);
    nearest.mass += mass;
    nearest.radius = (momentum / nearest.mass) ** 2;
  }
  function formFragments(run, meta) {
    const star = Math.max(run.starMass, SEED_MASS), floor = temperature(run, meta);
    for (let i = 0; i < CELLS; i++) {
      const mass = run.diskMasses[i];
      if (mass <= 0) continue;
      const radius = RADII[i], area = AREAS[i], omega = orbitalFrequency(radius, star);
      const scaleSq = soundSpeedSquared(radius, floor) / omega ** 2;
      const fragment = Math.min(mass, mass / area * scaleSq);
      const critical = criticalSurfaceDensity(radius, star, floor);
      if (mass - critical * area >= fragment) {
        run.diskMasses[i] -= fragment;
        addFragment(run, fragment, radius);
      }
    }
  }
  function evolveFragments(run, meta) {
    const dt = SIM_STEP_YEARS, star = Math.max(run.starMass, SEED_MASS), floor = temperature(run, meta), turbulence = alpha(run, meta);
    const specific = G * MSUN / (R_IN * AU), survivors = [];
    for (const body of run.fragments) {
      const cell = feedCell(body.radius);
      let omega = orbitalFrequency(body.radius, star);
      const share = Math.min(FRAGMENT_ACCRETION_MAX_SHARE, FRAGMENT_ACCRETION_PER_ORBIT * dt * omega / TWO_PI);
      const take = share * run.diskMasses[cell];
      run.diskMasses[cell] -= take;
      let momentum = body.mass * Math.sqrt(body.radius);
      momentum += take * Math.sqrt(RADII[cell]);
      body.mass += take;
      body.radius = (momentum / body.mass) ** 2;
      const viscous = viscosity(body.radius, star, turbulence, floor);
      const drift = FRAGMENT_MIGRATION_FACTOR * 1.5 * viscous / body.radius * dt;
      body.radius -= drift;
      if (body.radius <= R_IN) {
        run.starMass += body.mass;
        run.energy += 0.5 * specific * run.starMass * body.mass * MSUN;
        continue;
      }
      omega = orbitalFrequency(body.radius, star);
      body.phase = (body.phase + omega * dt) % TWO_PI;
      survivors.push(body);
    }
    run.fragments = survivors;
  }
  function settleFragments(run) {
    for (const body of run.fragments) run.companionRecords.push({ mass: body.mass, separation: body.radius });
    run.fragments = [];
    run.companions = companionMass(run);
  }
  function accreteStep(run, meta) {
    const dt = SIM_STEP_YEARS, rate = infallNow(run, meta), infall = Math.min(run.envelope, rate * dt);
    run.envelope -= infall;
    const [masses, accreted] = diskStep(run.diskMasses, run.starMass, alpha(run, meta), dt, infall, feedCell(feedRadius(run)), temperature(run, meta));
    run.diskMasses = masses;
    run.starMass += accreted;
    run.accreteYears += dt;
    if (run.starMass >= hydrogenLimit(run.metalLog10)) run.ignited = true;
    run.energy += 0.5 * (G * MSUN / (R_IN * AU)) * run.starMass * accreted * MSUN;
    const total = diskGas(run);
    if (total > 0) {
      const lost = Math.min(total, diskLossRate(run.starMass, feedRadius(run)) * dt);
      const keep = 1 - lost / total;
      run.diskMasses = run.diskMasses.map((m) => m * keep);
      run.ejected += lost;
    }
    formFragments(run, meta);
    evolveFragments(run, meta);
    if (run.starMass >= hydrogenLimit(run.metalLog10)) run.ignited = true;
    const feedOver = rate <= 0 || run.envelope <= 0;
    if ((feedOver && diskGas(run) < 1e-3) || run.accreteYears >= ACCRETION_LIMIT_YEARS) {
      run.ejected += gas(run);
      run.envelope = 0;
      run.diskMasses = new Array(CELLS).fill(0);
      settleFragments(run);
      startMainSequence(run);
    }
  }
  const canSkip = (run) => (run.phase === "ended" && run.kind === "brown_dwarf")
    || (run.phase === "main_sequence" && run.msDuration - run.msElapsed > SKIP_THRESHOLD_SECONDS);
  function step(run, meta, seconds) {
    let left = seconds;
    while (left > 1e-12 && run.phase !== "ended") {
      let used;
      if (run.phase === "gather") {
        const need = (jeansLogReach(run, meta) - run.logReach) / reachRate(run);
        used = Math.min(left, need);
        gatherTo(run, meta, run.logReach + used * reachRate(run));
        if (used >= need) {
          checkCollapse(run, meta);
          if (run.phase === "gather") { run.phase = "collapse"; run.collapseMass = patchMass(run); }
        }
      } else if (run.phase === "collapse") {
        used = Math.min(left, run.collapseLeft);
        run.collapseLeft -= used;
        if (run.collapseLeft <= 1e-12) {
          run.phase = "accrete";
          run.envelope = run.collapseMass - SEED_MASS;
          run.starMass = SEED_MASS;
        }
      } else if (run.phase === "accrete") {
        const perStep = SIM_STEP_YEARS / ACCRETE_YEARS_PER_SECOND;
        used = Math.min(left, perStep - run.yearDebt);
        run.yearDebt += used;
        if (run.yearDebt >= perStep - 1e-12) { run.yearDebt = 0; accreteStep(run, meta); }
      } else {
        used = Math.min(left, run.msDuration - run.msElapsed);
        run.msElapsed += used;
        if (run.msElapsed >= run.msDuration - 1e-9) run.phase = "ended";
      }
      left -= used;
      run.seconds += used;
    }
    updateUnlocks(run, meta);
  }
  function runGain(run) {
    return {
      brown_dwarf: Math.log(FAILED_RUN_FACTOR), white_dwarf: 0.4 + 0.1 * run.starMass,
      supernova: 1 + 0.05 * run.starMass, black_hole: 1.5, pair_instability: 3,
    }[run.kind];
  }
  function prestige(run, meta, skipped = false) {
    meta.regions *= Math.exp(runGain(run));
    const released = heavyYield(run.starMass, run.kind, run.metalLog10);
    meta.heavy += released;
    meta.localMetals += released;
    meta.journal.push({
      run: meta.runs + 1, temperature: temperature(run, meta), density: run.density, metalLog10: run.metalLog10,
      mass: run.starMass, ending: run.kind, gain: runGain(run), heavy: released, seconds: run.seconds,
      lifetimeMyr: run.lifetimeMyr, forecastMyr: run.forecastMyr, alpha: alpha(run, meta),
      feedRadius: feedRadius(run), skipped, notes: [], companions: run.companionRecords.map((c) => ({ ...c })),
    });
    if (run.kind === "supernova") meta.supernovae += 1;
    if (run.kind === "black_hole") meta.blackHoleUnlocked = true;
    if (run.kind === "pair_instability") meta.pairInstabilitySeen = true;
    if (run.lifetimeMyr) meta.cosmicMyr += skipped ? run.msElapsed / run.msDuration * run.lifetimeMyr : run.lifetimeMyr;
    meta.runs += 1;
    const next = newRun(meta);
    updateUnlocks(next, meta);
    return next;
  }
  return {
    UPGRADES, RADII, CELLS, SIGMA_LN_DENSITY, SIGMA_LOG10_METAL, BLACK_HOLE_START_COST,
    newMeta, newRun, step, tap, buy, canBuy, upgradeCost, budget, regionCost, backgroundMetal, heavyCost, buyHeavy,
    temperature, alpha, feedRadius, reachRate, tapPower, patchMass, jeansLogReach, jeansMass, infallRate,
    diskLossRate, infallNow, diskGas, stability, criticalSurfaceDensity, fragmentMass, companionMass, luminosity, lifetimeMyr, canSkip, runGain, prestige, heavyYield, gas, BASE_DENSITY, BASE_TEMPERATURE,
    freeFallTime, updateUnlocks, COLLAPSE_SECONDS, ionizingRate, stromgrenRadius, hiiRadius, soundSpeed, YR, PRIMORDIAL_METAL_LOG10, HII_SOUND_SPEED,
  };
})();
if (typeof module !== "undefined") module.exports = Engine;
