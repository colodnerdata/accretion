// Pure display mappings shared by the survey, gather, collapse, and accrete scenes
// and the setup strip.
//
// CONCEPT NOTE
//
// Temperature as speed. A gas particle's typical (rms) speed is
// v ~ sqrt(3 k T / m), so only ratios matter and only the true ratios are
// shown. A temperature ratio R becomes a speed ratio sqrt(R): twice as hot
// is 1.41x faster, 10 K to 1000 K is 10x faster. A particle of mass ratio M
// (over hydrogen) moves 1/sqrt(M) as fast: helium (4 amu) half hydrogen's
// speed, a representative metal (16 amu, oxygen) a quarter. The screens
// draw speed as px/s through one shared constant, SPEED_BASE_PX: hydrogen
// at 10 K moves at that base and every other case carries the true ratio;
// across the modeled 10-1000 K range that tops out at 10x the base, so the
// harder cap at SPEED_CAP_PX is only a safety for out-of-range settings.
// Speed is the only channel that encodes temperature; color never does.
//
// Composition as color. One color each for hydrogen, helium, and metals,
// with a visible key on the canvas. Helium is 8% of atoms in every gas,
// pristine included. The true metal share by number is
// share = 10^(log10 Z - 3): 1 in 1000 atoms at solar metallicity, 1 in
// 100,000 at 1/100 solar - far below one drawn particle, so the DISPLAYED
// metal share is amplified: linear in log10 Z from zero at the engine's
// primordial threshold to a cap (0.28 of particles) at solar metallicity.
// The canvas shows "metals shown far more common than in reality" whenever
// any metal particle is drawn. Pristine gas draws only hydrogen and helium.
//
// Density as zoom. The drawn particle count stays fixed; equal mass
// occupies equal volume, so linear size scales as density^(-1/3). The drawn
// scale (scale bar and gas spread) multiplies by (1e4 / density)^(1/3):
// two decades of density shift the scale 4.64x either way, matching the
// survey's 10^2 .. 10^6 /cm3 range. The zoom animates smoothly when the
// density slider moves; with reduced motion it jumps straight to the new
// scale. No count adjustment on top: the bar carries the whole change.
//
// Black hole nearby. When "start near a black hole" is checked, the
// existing grid warp is drawn centred off-screen in one direction, with a
// label that names it a map of gravity's pull.
//
// Disk stability as color. Toomre Q = c_s * Omega / (pi * G * Sigma) says
// whether a ring of gas holds together against its own gravity: Q >= 1 means
// pressure and shear win (stable), Q < 1 means the ring clumps. The engine
// already computes Q per ring. One log scale colors every ring:
// shade = clamp(1 - log10(Q) / log10(Q_CALM), 0, 1), so Q >= 10 is fully calm
// (shade 0), Q = 1 is fully unstable (shade 1), and each decade of Q moves the
// color by the same amount. Calm is cool blue-violet, the midpoint amber, the
// unstable end rose; unstable rings also draw a wider glow, so the cue is not
// hue alone. Ring brightness stays with gas mass, a separate channel.
//
// Fragments as clumps. A clump's drawn radius grows with the logarithm of its
// mass: the reference mass is one Jupiter (0.001 solar masses) at a base size,
// and each tenfold in mass adds a fixed step, between a floor and a cap that
// keeps even a large clump smaller than the star's own disc. Every size is a
// share of the scene radius R, so a phone and a desktop agree.
//
// Clump motion. A clump moves on its orbit at the Keplerian rate; where that
// is too fast to follow on screen (close to the star) the drawn rate is capped
// so it reads as steady circling, not flicker.
//
// Turbulence as jitter. Turbulence is the disk's effective viscosity, nu =
// alpha * c_s^2 / Omega, and sets how fast gas drifts inward (v_r ~ alpha). The
// drawn drift speed carries alpha linearly; the sideways jitter of each gas
// dot's path has an amplitude that grows as alpha^1.2, a little faster than the
// drift itself, so each purchased level (alpha x 1.3) is a 37% larger wobble:
// a small wobble at the base alpha of 0.1, a wide scatter near 1.
//
// The setup strip lists the region, heavy-element and control choices behind
// the run. Which of them matter depends on the phase; that map is data here.

const METAL_DISPLAY_CAP = 0.28;
const HELIUM_SHARE = 0.08;
const DENSITY_REFERENCE = 1e4;
const SPEED_BASE_PX = 7;
const SPEED_CAP_PX = 110;
const HYDROGEN_MASS = 1;
const HELIUM_MASS = 4;
const METAL_MASS = 16;
// Colors: hydrogen warm pink, helium teal, metals violet, all on the
// engine's existing palette so the scenes stay one system.
const SPECIES_COLORS = { hydrogen: "#ff5f7e", helium: "#5fe6cf", metals: "#9d8cff" };

// Relative speed of hydrogen against 10 K, from the sqrt(T/m) law.
const speedForTemperature = (kelvin, reference = 10) => Math.sqrt(kelvin / reference);

// Relative speed against hydrogen for a mass ratio.
const speedForMass = (massRatio) => 1 / Math.sqrt(massRatio);

// True share of atoms that are metals at log10 Z: 1/1000 at solar.
const metalShare = (log10z) => 10 ** (log10z - 3);

// Displayed metal share: linear in log10 Z from the primordial threshold to
// solar metallicity, capped at METAL_DISPLAY_CAP. Pristine gas shows none.
const metalDisplayShare = (log10z, primordialLimit) => {
  if (log10z < primordialLimit) return 0;
  return METAL_DISPLAY_CAP * Math.min(1, Math.max(0, (log10z - primordialLimit) / -primordialLimit));
};

// Fractions of drawn particles by species, for one gas composition.
const speciesMix = (log10z, primordialLimit) => {
  const metals = metalDisplayShare(log10z, primordialLimit);
  return { hydrogen: 1 - HELIUM_SHARE - metals, helium: HELIUM_SHARE, metals };
};

// Drawn scale ratio for a number density: cube root of the volume ratio.
const zoomScale = (density, reference = DENSITY_REFERENCE) => (reference / density) ** (1 / 3);

// Disk stability (Toomre Q) scale: fully calm at Q_CALM, fully unstable at 1.
const Q_CALM = 10;
const Q_UNSTABLE = 1;
// Calm, midpoint, unstable ring colors (RGB), and the neutral for empty rings.
const STABILITY_STOPS = [[111, 134, 255], [255, 184, 107], [255, 95, 126]];
const EMPTY_RING_RGB = [207, 200, 255];

// Shade in [0, 1] for a Toomre Q: 0 calm, 1 at or below Q = 1.
const stabilityShade = (q) => {
  if (!(q > 0)) return 1;
  if (!Number.isFinite(q)) return 0;
  return Math.min(1, Math.max(0, 1 - Math.log10(q) / Math.log10(Q_CALM)));
};

// Ring styling for a Toomre Q: color, shade, and a glow weight that is 0 when
// calm and 1 at Q = 1. An empty ring (infinite Q) gets the neutral color.
const stabilityColor = (q) => {
  if (!Number.isFinite(q) && q > 0) return { color: `rgb(${EMPTY_RING_RGB.join(",")})`, shade: 0, glow: 0, empty: true };
  const shade = stabilityShade(q), pos = shade * (STABILITY_STOPS.length - 1);
  const k = Math.min(STABILITY_STOPS.length - 2, Math.floor(pos)), f = pos - k;
  const rgb = STABILITY_STOPS[k].map((c, i) => Math.round(c + (STABILITY_STOPS[k + 1][i] - c) * f));
  return { color: `rgb(${rgb.join(",")})`, shade, glow: shade * shade, empty: false };
};

// Fragment clump radius in px, log-scaled in mass, as a share of scene radius R.
const FRAGMENT_MASS_REF = 1e-3;
const FRAGMENT_BASE_SHARE = 0.012;
const FRAGMENT_STEP_SHARE = 0.008;
const FRAGMENT_MIN_SHARE = 0.009;
const FRAGMENT_MAX_SHARE = 0.045;
const fragmentRadiusPx = (mass, R) => {
  const decades = Math.log10(Math.max(mass, 1e-12) / FRAGMENT_MASS_REF);
  const share = Math.min(FRAGMENT_MAX_SHARE, Math.max(FRAGMENT_MIN_SHARE, FRAGMENT_BASE_SHARE + FRAGMENT_STEP_SHARE * decades));
  return Math.max(2.5, share * R);
};

// Sideways jitter amplitude in px for the viscosity parameter alpha.
const JITTER_BASE_ALPHA = 0.1;
const JITTER_BASE_SHARE = 0.02;
const JITTER_MAX_SHARE = 0.12;
const JITTER_EXPONENT = 1.2;
const jitterAmplitude = (alpha, R) => {
  if (!(alpha > 0)) return 0;
  return R * Math.min(JITTER_MAX_SHARE, JITTER_BASE_SHARE * (alpha / JITTER_BASE_ALPHA) ** JITTER_EXPONENT);
};

// Drawn angular speed of a clump in rad per real second. A clump orbits at
// omega (rad per simulated year) while the game runs `yearsPerSecond` years per
// real second; close in, that would spin faster than frames can show and
// strobe, so the drawn speed is capped. Slow outer orbits stay true to scale.
const CLUMP_SPIN_CAP = 4;
const clumpAngularRate = (omegaPerYear, yearsPerSecond) => Math.min(CLUMP_SPIN_CAP, omegaPerYear * yearsPerSecond);

// Which setup items matter in each phase. The accrete phase is the one the
// turbulence choices act in; the rest follow the engine's rules.
const PHASE_RELEVANT = {
  gather: ["temperature", "density", "metals", "heavyCooling", "reach", "tap", "cooling"],
  collapse: ["temperature", "density"],
  accrete: ["turbulence", "heavyTurbulence", "braking"],
  main_sequence: ["metals"],
  ended: [],
};
const CONTROL_ORDER = ["reach", "tap", "cooling", "turbulence", "braking"];

// The setup strip's items, as plain data a view can render. `setup` holds the
// run's choices - region values, heavy levels, control levels - and which
// unlocks the player has met. A planned prediction view can pass the setup of
// a hypothetical run through the same function. Items whose idea the player
// has not met yet are left out.
//   setup: { temperature, density, metalLog10, blackHole, blackHoleUnlocked,
//            heavyTurbulence, heavyCooling, levels, unlocks }
const setupItems = (setup, phase) => {
  const relevant = PHASE_RELEVANT[phase] ?? [];
  const has = (name) => setup.unlocks.includes(name);
  const item = (id, group, value) => ({ id, group, value, active: relevant.includes(id) });
  const items = [
    item("temperature", "region", setup.temperature),
    item("density", "region", setup.density),
  ];
  if (has("metals")) items.push(item("metals", "region", setup.metalLog10));
  if (setup.blackHole || setup.blackHoleUnlocked) items.push(item("blackHole", "region", Boolean(setup.blackHole)));
  if (has("cooling")) items.push(item("heavyCooling", "heavy", setup.heavyCooling));
  if (has("turbulence")) items.push(item("heavyTurbulence", "heavy", setup.heavyTurbulence));
  for (const name of CONTROL_ORDER) if (has(name)) items.push(item(name, "controls", setup.levels[name] ?? 0));
  return items;
};

const VISUALS = {
  METAL_DISPLAY_CAP, HELIUM_SHARE, DENSITY_REFERENCE, SPEED_BASE_PX, SPEED_CAP_PX,
  HYDROGEN_MASS, HELIUM_MASS, METAL_MASS, SPECIES_COLORS,
  speedForTemperature, speedForMass, metalShare, metalDisplayShare, speciesMix, zoomScale,
  Q_CALM, Q_UNSTABLE, stabilityShade, stabilityColor,
  FRAGMENT_MASS_REF, fragmentRadiusPx, CLUMP_SPIN_CAP, clumpAngularRate, JITTER_BASE_ALPHA, jitterAmplitude,
  PHASE_RELEVANT, CONTROL_ORDER, setupItems,
};
if (typeof module !== "undefined") module.exports = VISUALS;
