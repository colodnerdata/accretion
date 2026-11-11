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

// Disk stability: one log scale, calm at Q >= 10, unstable at Q <= 1.
check("Q = 10 is fully calm", V.stabilityShade(10) === 0);
check("Q far above 10 stays calm", V.stabilityShade(1e6) === 0);
check("Q = 1 is fully unstable", close(V.stabilityShade(1), 1, 1e-12));
check("Q below 1 clamps at unstable", V.stabilityShade(0.2) === 1 && V.stabilityShade(0) === 1);
check("Q = sqrt(10) is the halfway shade", close(V.stabilityShade(Math.sqrt(10)), 0.5, 1e-9));
check("an empty ring (infinite Q) is calm", V.stabilityShade(Infinity) === 0);
{
  const qs = [20, 10, 5, 3, 2, 1.5, 1, 0.5];
  const shades = qs.map(V.stabilityShade);
  check("shade never falls as Q falls", shades.every((x, i) => i === 0 || x >= shades[i - 1]), shades);
  check("calm ring: cool color, no glow", V.stabilityColor(30).color === "rgb(111,134,255)" && V.stabilityColor(30).glow === 0);
  check("midpoint ring: amber", V.stabilityColor(Math.sqrt(10)).color === "rgb(255,184,107)");
  check("Q = 1: rose with full glow", V.stabilityColor(1).color === "rgb(255,95,126)" && V.stabilityColor(1).glow === 1);
  check("empty ring is the neutral color", V.stabilityColor(Infinity).empty === true);
  const glow = qs.map((q) => V.stabilityColor(q).glow);
  check("glow never falls as Q falls", glow.every((x, i) => i === 0 || x >= glow[i - 1]), glow);
}

// Fragment clump size: log of mass, clamped, and a share of the scene radius.
{
  const R = 300, ref = V.fragmentRadiusPx(V.FRAGMENT_MASS_REF, R);
  check("a Jupiter-mass clump has the base size", close(ref, 0.012 * R, 1e-9));
  check("each decade of mass adds the same step", close(V.fragmentRadiusPx(1e-2, R) - ref, 0.008 * R, 1e-9) && close(V.fragmentRadiusPx(1e-1, R) - V.fragmentRadiusPx(1e-2, R), 0.008 * R, 1e-9));
  check("clump size is monotone in mass", [1e-5, 1e-3, 0.05, 0.5, 5, 50].map((m) => V.fragmentRadiusPx(m, R)).every((x, i, a) => i === 0 || x >= a[i - 1]));
  check("tiny clumps keep a visible floor", V.fragmentRadiusPx(1e-9, R) >= 2.5);
  check("huge clumps hit the cap", close(V.fragmentRadiusPx(1e3, R), 0.045 * R, 1e-9));
  check("clump size scales with the scene radius", close(V.fragmentRadiusPx(0.05, 600), 2 * V.fragmentRadiusPx(0.05, 300), 1e-9));
}

// Clump spin: true rate where slow, capped where it would strobe.
check("a slow outer orbit keeps its true rate", close(V.clumpAngularRate(0.001, 700), 0.7, 1e-9));
check("a fast inner orbit is capped", V.clumpAngularRate(2, 700) === V.CLUMP_SPIN_CAP);
check("spin rate is monotone in orbital frequency", [1e-4, 1e-3, 1e-2, 1e-1].map((w) => V.clumpAngularRate(w, 700)).every((x, i, a) => i === 0 || x >= a[i - 1]));

// Fragment list diff between frames.
{
  const B = (radius, mass = 0.05) => ({ radius, mass, phase: 0 });
  const LIMIT = 4;
  const d = (prev, next, formed) => V.diffFragments(prev, next, formed, LIMIT);
  check("an empty list with nothing formed is steady", (() => { const r = d([], [], 0); return !r.resync && r.kept.length === 0; })());
  check("a fragment forming and reaching the star in one frame resyncs, not throws", d([], [], 1).resync === true);
  check("a new fragment at the end is read as appended", (() => { const r = d([B(300)], [B(299), B(500)], 1); return !r.resync && r.appended === 1 && r.kept.length === 1; })());
  check("a shrinking list drops the smallest radius", (() => { const r = d([B(300), B(2), B(800)], [B(299), B(790)], 0); return !r.resync && r.gone.length === 1 && r.gone[0] === 1 && r.kept.join() === "0,2"; })());
  check("a removal plus an append in one frame resyncs", d([B(300), B(2)], [B(299), B(500)], 1).resync === true);
  check("a growing list with nothing formed resyncs", d([B(300)], [B(300), B(500)], 0).resync === true);
  {
    // At the limit a formed fragment is absorbed by the nearest: momentum rule.
    const prev = [B(100), B(200), B(400), B(800)], extra = 0.03, host = 1;
    const mass = prev[host].mass + extra, moment = prev[host].mass * Math.sqrt(prev[host].radius) + extra * Math.sqrt(900);
    const next = prev.map((b, i) => (i === host ? { ...b, mass, radius: (moment / mass) ** 2 } : { ...b }));
    const r = d(prev, next, 1);
    check("a coalesce at the limit finds its host", !r.resync && r.host === host && r.appended === 0, r);
    check("the birth radius follows from conserving momentum", close(r.incoming, 900, 1e-6), r.incoming);
    {
    // Gas take grows a small clump by 25%; a large clump absorbs ~1.5% of its mass.
    const prev = [B(100, 0.02), B(200, 2), B(400, 0.3), B(800, 0.2)];
    const next = prev.map((b) => ({ ...b }));
    next[0].mass = 0.025;
    next[1].mass = 2.03;
    const r = d(prev, next, 1);
    check("the host is the clump with the largest absolute gain", !r.resync && r.host === 1, r);
    const close_call = prev.map((b) => ({ ...b })); close_call[0].mass = 0.05; close_call[1].mass = 2.04;
    check("a near tie for host resyncs", d(prev, close_call, 1).resync === true);
    check("a clump near the star blocks the coalesce reading", d([B(1.5), ...prev.slice(1)], [{ ...B(1.5), mass: 0.06 }, ...next.slice(1)], 1).resync === true);
  }
  check("a same-size list below the limit with something formed resyncs", V.diffFragments(prev.slice(0, 3), next.slice(0, 3), 1, LIMIT).resync === true);
  }
  check("a pairing that jumps far in radius resyncs", d([B(300), B(500)], [B(30), B(500)], 0).resync === true);
}

// Turbulence jitter: zero without turbulence, rising with alpha, capped.
{
  const R = 300, base = V.jitterAmplitude(V.JITTER_BASE_ALPHA, R);
  check("no turbulence, no jitter", V.jitterAmplitude(0, R) === 0);
  check("the base alpha gives the base amplitude", close(base, 0.02 * R, 1e-9));
  check("jitter rises with alpha", [0.05, 0.1, 0.13, 0.2, 0.3].map((a) => V.jitterAmplitude(a, R)).every((x, i, a) => i === 0 || x > a[i - 1]));
  check("one purchased level (alpha x 1.3) is a visible step", V.jitterAmplitude(0.13, R) / base > 1.3);
  check("jitter is capped", V.jitterAmplitude(50, R) <= 0.12 * R + 1e-9);
}

// Setup strip: which items exist and which are highlighted per phase.
{
  const setup = {
    temperature: 120, density: 1e4, metalLog10: -2, blackHole: false, blackHoleUnlocked: false,
    heavyKnown: true, heavyTurbulence: 2, heavyCooling: 1, levels: { reach: 3, tap: 1, cooling: 0, turbulence: 2, braking: 1 },
    unlocks: ["reach", "tap", "turbulence", "temperature", "density", "braking", "cooling", "metals"],
  };
  const active = (phase, s = setup) => V.setupItems(s, phase).filter((i) => i.active).map((i) => i.id).sort();
  const ids = (phase, s = setup) => V.setupItems(s, phase).map((i) => i.id);
  check("accretion highlights turbulence and braking", JSON.stringify(active("accrete")) === JSON.stringify(["braking", "heavyTurbulence", "turbulence"]), active("accrete"));
  check("accretion does not highlight the region", !active("accrete").some((id) => ["temperature", "density", "metals"].includes(id)));
  check("gather highlights the region and the gather controls", ["temperature", "density", "reach", "tap", "cooling", "heavyCooling"].every((id) => active("gather").includes(id)));
  check("gather does not highlight turbulence", !active("gather").includes("turbulence"));
  check("collapse highlights temperature and density only", JSON.stringify(active("collapse")) === JSON.stringify(["density", "temperature"]));
  check("shine highlights metal content only", JSON.stringify(active("main_sequence")) === JSON.stringify(["metals"]));
  check("an ended run highlights nothing", active("ended").length === 0);
  check("an unknown phase highlights nothing", active("survey").length === 0);
  check("the strip lists every group", ["region", "heavy", "controls"].every((g) => V.setupItems(setup, "accrete").some((i) => i.group === g)));
  check("the black hole item hides until it matters", !ids("accrete").includes("blackHole"));
  check("a black hole start is listed", ids("accrete", { ...setup, blackHole: true }).includes("blackHole"));
  check("an unlocked black hole option lists a no", V.setupItems({ ...setup, blackHoleUnlocked: true }, "accrete").find((i) => i.id === "blackHole").value === false);
  check("heavy items stay hidden until heavy elements are met", !ids("accrete", { ...setup, heavyKnown: false }).some((id) => id.startsWith("heavy")));
  const early = { ...setup, heavyKnown: false, unlocks: ["reach"], heavyTurbulence: 0, heavyCooling: 0 };
  check("a first run lists only what the player has met", JSON.stringify(ids("gather", early)) === JSON.stringify(["temperature", "density", "reach"]), ids("gather", early));
  check("seeded turbulence carries its level", V.setupItems(setup, "accrete").find((i) => i.id === "heavyTurbulence").value === 2);
  check("control levels come from the run", V.setupItems(setup, "accrete").find((i) => i.id === "braking").value === 1);
}

console.log(JSON.stringify(checks));
