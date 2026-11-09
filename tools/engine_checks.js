// Engine boundary checks for the browser engine, driven from tests/test_engine.py
// the same way tools/parity_runner.js is. Prints one JSON list of checks.
const E = require("../web/engine.js");

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail: ok ? "" : String(detail) });
}
function approx(a, b) { return Math.abs(a - b) <= Math.abs(b) * 1e-9; }

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
  inRun.energy = 1e60; meta.unlocks.push("cooling"); meta.heavyCooling = 2;
  check("the multiplier applies in-run", approx(E.temperature(inRun, meta), 81.0) && E.canBuy(inRun, "cooling", meta));
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

console.log(JSON.stringify(checks));
