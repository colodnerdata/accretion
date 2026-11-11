// Pure display mappings shared by the survey, gather, and collapse scenes.
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

const VISUALS = {
  METAL_DISPLAY_CAP, HELIUM_SHARE, DENSITY_REFERENCE, SPEED_BASE_PX, SPEED_CAP_PX,
  HYDROGEN_MASS, HELIUM_MASS, METAL_MASS, SPECIES_COLORS,
  speedForTemperature, speedForMass, metalShare, metalDisplayShare, speciesMix, zoomScale,
};
if (typeof module !== "undefined") module.exports = VISUALS;
