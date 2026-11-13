// Engine boundary checks for the browser engine, driven from tests/test_engine.py
// the same way tools/parity_runner.js is. Prints one JSON list of checks.
const E = require("../web/engine.js");

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail: ok ? "" : String(detail) });
}
function approx(a, b, rel = 1e-9) { return Math.abs(a - b) <= Math.abs(b) * rel; }

// Radiative cooling: buying the level that first reaches the composition
// floor is allowed; the next one is refused and leaves state unchanged.
{
  const meta = E.newMeta(), run = E.newRun(meta);
  run.baseTemperature = 100.0; run.floorTemperature = 81.0;
  run.energy = 1e60; meta.unlocks.push("cooling");
  run.levels.cooling = 1;
  check("temperatureAt reaches the floor at level 2", approx(E.temperatureAt(run, meta, 2), 81.0));
  check("the floor-reaching level can be bought", E.canBuy(run, "cooling", meta));
  check("buy applies it", E.buy(run, "cooling", meta) && run.levels.cooling === 2);
  check("the next level is blocked", !E.canBuy(run, "cooling", meta) && !E.buy(run, "cooling", meta) && run.levels.cooling === 2);
  check("temperature rests at the floor", approx(E.temperature(run, meta), 81.0));
}

// The heavy-element purchase has the same boundary.
{
  const meta = E.newMeta(), run = E.newRun(meta);
  meta.unlocks.push("cooling"); meta.heavy = 100.0;
  // Each purchase permanently lowers what new regions can reach.
  check("the starting bound is the primordial floor", approx(E.newRun(meta).floorTemperature, 200.0));
  check("the first purchase lowers bound to 180 K", E.buyHeavy(meta, "cooling", run) && approx(E.newRun(meta).floorTemperature, 180.0));
  check("the bound helper agrees", approx(E.regionFloor(meta, run.metalLog10, E.cosmicAgeGyr(meta)), 180.0));
  // Purchases stop when the cosmic background clamps the bound.
  meta.heavy = 1e9; meta.heavyCooling = 9;
  check("the level that reaches the background can be bought", E.buyHeavy(meta, "cooling", run) && meta.heavyCooling === 10);
  check("the next level is refused", !E.buyHeavy(meta, "cooling", run) && meta.heavyCooling === 10);
  // The level still doubles as the in-run multiplier.
  const inRun = E.newRun(meta);
  inRun.baseTemperature = 100.0; inRun.floorTemperature = 50.0;
  inRun.energy = 1e60; meta.heavyCooling = 2;
  check("the multiplier applies in-run", approx(E.temperature(inRun, meta), 81.0) && E.canBuy(inRun, "cooling", meta));
}

// Turbulence has the mirror-image boundary: purchases stop once the disk
// speed rests on its cap, so no 2^9 mass is spent for a 1 -> 1 result.
{
  const meta = E.newMeta(), run = E.newRun(meta);
  meta.unlocks.push("turbulence"); meta.heavy = 1e9;
  meta.heavyTurbulence = 8;
  check("the last effective level can be bought", E.buyHeavy(meta, "turbulence", run) && meta.heavyTurbulence === 9 && approx(E.alpha(run, meta), 1.0));
  const held = meta.heavy;
  check("the next level is refused and keeps the mass", !E.buyHeavy(meta, "turbulence", run) && meta.heavyTurbulence === 9 && meta.heavy === held);
  check("the helper agrees", !E.turbulenceBoundHelps(meta));
  const early = E.newMeta();
  early.unlocks.push("turbulence"); early.heavy = 1e9; early.heavyTurbulence = 5;
  check("below the cap the purchase is allowed", E.turbulenceBoundHelps(early));
}

// One long step must land where many short steps do, journal included:
// the ending step journals only after consuming its chunk.
{
  const shortMeta = E.newMeta(), longMeta = E.newMeta();
  const short = E.newRun(shortMeta), long = E.newRun(longMeta);
  for (let i = 0; i < 1800; i++) E.step(short, shortMeta, 2.0);
  E.step(long, longMeta, 3600.0);
  check("both end in the same phase", short.phase === "ended" && long.phase === short.phase);
  check("both record the same lifetime", approx(long.seconds, short.seconds));
  check("the journal carries the full lifetime", approx(longMeta.journal[0].seconds, long.seconds) && approx(shortMeta.journal[0].seconds, short.seconds));
  check("the rewards agree", approx(longMeta.journal[0].gain, shortMeta.journal[0].gain, 1e-6) && approx(longMeta.journal[0].heavy, shortMeta.journal[0].heavy, 1e-6));
  // Settle both: regions and heavy only move at prestige, so the clock
  // comparison needs the settlement to have teeth.
  E.prestige(long, longMeta, false);
  E.prestige(short, shortMeta, false);
  check("the clocks agree", approx(longMeta.regions, shortMeta.regions, 1e-6) && approx(longMeta.heavy, shortMeta.heavy, 1e-6));
}

// The journal entry exists as soon as the run ends; prestige reuses it.
{
  const meta = E.newMeta(), run = E.newRun(meta);
  run.phase = "accrete"; run.envelope = 0.0; run.starMass = 0.01; // SEED_MASS
  E.step(run, meta, 1.0);
  check("a failed-to-ignite run ends as a brown dwarf", run.phase === "ended" && run.kind === "brown_dwarf");
  check("the entry exists at the end", meta.journal.length === 1 && meta.journal[0].run === 1 && meta.journal[0].ending === "brown_dwarf");
  E.prestige(run, meta);
  check("prestige keeps exactly one entry", meta.journal.length === 1);
}

// Prestige pays exactly once: a settled run moves no counter on a second call.
{
  const meta = E.newMeta(), run = E.newRun(meta);
  run.phase = "main_sequence"; run.kind = "supernova"; run.starMass = 21.5;
  run.msDuration = 100.0; run.msElapsed = 100.0; run.forecastMyr = run.lifetimeMyr = 7.0;
  E.step(run, meta, 100.0);
  E.prestige(run, meta, false);
  const before = [meta.regions, meta.runs, meta.heavy, meta.localMetals, meta.cosmicMyr, meta.journal.length, meta.supernovae];
  check("the first call pays and journals", before[0] > 1.0 && before[5] === 1);
  E.prestige(run, meta, false);
  check("a second prestige call moves nothing",
    JSON.stringify([meta.regions, meta.runs, meta.heavy, meta.localMetals, meta.cosmicMyr, meta.journal.length, meta.supernovae]) === JSON.stringify(before));
  check("and hands back a fresh region", E.prestige(run, meta, false).phase === "gather");
}

// A run left early is flagged and its clock advance is only the elapsed share.
{
  const meta = E.newMeta(), run = E.newRun(meta);
  run.phase = "main_sequence"; run.kind = "white_dwarf";
  run.lifetimeMyr = 56000.0; run.forecastMyr = 56000.0;
  run.msDuration = 3600.0 * 100; run.msElapsed = run.msDuration / 100;
  E.skip(run, meta);
  check("skip ends the run and flags the entry", run.phase === "ended" && run.skipped === true && meta.journal[0].skipped === true);
  E.prestige(run, meta);
  check("prestige keeps the flagged entry", meta.journal.length === 1 && meta.journal[0].skipped === true);
  const share = (run.msElapsed / run.msDuration) * 56000.0;
  check("the clock advanced only the elapsed share", approx(meta.cosmicMyr, share));
}

// A skipped star pays its reward but discovers nothing: the category counters
// move only for a star the player watched to its end.
for (const [kind, counter, mass] of [["supernova", "supernovae", 30], ["black_hole", "blackHoleUnlocked", 30], ["pair_instability", "pairInstabilitySeen", 150]]) {
  const metas = {};
  for (const skipped of [false, true]) {
    const meta = E.newMeta(), run = E.newRun(meta);
    run.phase = "main_sequence"; run.kind = kind; run.starMass = mass;
    run.msDuration = 100.0; run.msElapsed = 100.0; run.forecastMyr = run.lifetimeMyr = 7.0;
    if (skipped) { run.msElapsed = 10.0; E.skip(run, meta); } else E.step(run, meta, 100.0);
    E.prestige(run, meta);
    metas[skipped] = meta;
  }
  check(`a watched ${kind} counts`, Boolean(metas[false][counter]));
  check(`a skipped ${kind} counts for nothing`, !metas[true][counter]);
  check(`a skipped ${kind} still pays regions and heavy elements`, approx(metas[true].regions, metas[false].regions) && approx(metas[true].heavy, metas[false].heavy));
  check(`a skipped ${kind} advances the clock by the time stayed`, approx(metas[true].cosmicMyr, 0.1 * 7.0));
}

console.log(JSON.stringify(checks));
