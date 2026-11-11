// Display-mapping boundary checks, driven from tests/test_visuals.py the way
// tools/engine_checks.js is driven. Prints one JSON list of checks.
const V = require("../web/visuals.js");
// The primordial threshold must be the engine's own, not a restated value:
// PRIMORDIAL_METAL_LOG10 (-4, Z-relative log) is the pristine boundary the
// display share's line starts from.
const E = require("../web/engine.js");
const LIMIT = E.PRIMORDIAL_METAL_LOG10;

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail: ok ? "" : String(detail) });
}
function close(a, b, tol = 1e-3) { return Math.abs(a - b) <= tol * Math.abs(b || 1); }

// Speed from temperature: the true sqrt ratios.
check("speed doubles from 10 K to 40 K", close(V.speedForTemperature(40, 10), 2));
check("speed is sqrt(2) from 250 K to 500 K", close(V.speedForTemperature(500) / V.speedForTemperature(250), Math.SQRT2, 1e-6));
check("10 K to 1000 K is 10x", close(V.speedForTemperature(1000, 10), 10));
check("10 K is the display reference", V.speedForTemperature(10, 10) === 1);

// Speed from mass: heavier is slower by the same sqrt law.
check("helium runs at half hydrogen's speed", close(V.speedForMass(V.HELIUM_MASS), 0.5, 1e-6));
check("oxygen-class metals run at a quarter", close(V.speedForMass(V.METAL_MASS), 0.25, 1e-6));
check("hydrogen is the reference itself", close(V.speedForMass(1), 1, 1e-9));

// True metal share by number.
check("solar: 1 in 1000 atoms", close(V.metalShare(0), 0.001));
check("1/100 solar: 1 in 100,000 atoms", close(V.metalShare(-2), 1e-5));
check("1/10 solar: 1 in 10,000 atoms", close(V.metalShare(-1), 1e-4));

// Displayed share: amplified, log-visible, and zero for pristine gas.
check("the engine's primordial threshold is -4", LIMIT === -4);
check("pristine gas shows no metals", V.metalDisplayShare(-9, LIMIT) === 0);
check("the primordial threshold itself shows none", V.metalDisplayShare(LIMIT, LIMIT) === 0);
check("half a decade above the threshold shows half the cap", close(V.metalDisplayShare(LIMIT / 2, LIMIT), V.METAL_DISPLAY_CAP * 0.5, 1e-6));
check("solar shows the full cap", close(V.metalDisplayShare(0, LIMIT), V.METAL_DISPLAY_CAP, 1e-9));
check("above solar stays capped", close(V.metalDisplayShare(2, LIMIT), V.METAL_DISPLAY_CAP, 1e-9));

// Species mix: helium everywhere, metals only when not pristine.
const pristine = V.speciesMix(-9, LIMIT);
check("pristine mix: 92% hydrogen, 8% helium, no metals", close(pristine.hydrogen, 0.92) && close(pristine.helium, 0.08, 1e-6) && pristine.metals === 0);
const solar = V.speciesMix(0, LIMIT);
check("solar mix keeps helium and sums to one", solar.helium === V.HELIUM_SHARE && close(solar.hydrogen + solar.helium + solar.metals, 1, 1e-9));
check("solar metals match the display cap", close(solar.metals, V.METAL_DISPLAY_CAP, 1e-9));

// Density zoom: cube root of the volume ratio.
check("the reference density draws at 1:1", close(V.zoomScale(V.DENSITY_REFERENCE), 1));
check("80 /cm3 zooms in 5x", close(V.zoomScale(80, 1e4), 5));
check("1.25e6 /cm3 zooms out 5x", close(V.zoomScale(1.25e6, 1e4), 0.2));
check("100 /cm3 is 4.64x, matching the task range", close(V.zoomScale(100, 1e4), 4.6416, 1e-3));

console.log(JSON.stringify(checks));
