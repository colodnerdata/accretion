const E = require("../web/engine.js");
function play(meta) {
  let run = E.newRun(meta), tick = 0;
  while (run.phase !== "ended" && tick < 20000) {
    E.step(run, meta, 7.3);
    if (tick % 2 === 0) E.tap(run, meta);
    for (const n of ["reach", "tap", "cooling", "turbulence", "braking"]) while (E.buy(run, n, meta));
    tick++;
  }
  return run;
}
const STRESS_MASSES = [0, 0, 0, 0, 0, 0, 0.5, 1, 2, 4, 8, 8, 0, 0, 0, 0];
const STRESS_RADII = [300, 500, 800, 1200];
function stress(meta) {
  let run = E.newRun(meta), tick = 0, injected = false;
  while (run.phase !== "ended" && tick < 20000) {
    E.step(run, meta, 7.3);
    if (tick % 2 === 0) E.tap(run, meta);
    for (const n of ["reach", "tap", "cooling", "turbulence", "braking"]) while (E.buy(run, n, meta));
    if (run.phase === "accrete" && !injected) {
      injected = true;
      run.diskMasses = run.diskMasses.map((m, i) => m + STRESS_MASSES[i]);
      run.fragments = STRESS_RADII.map((r, k) => ({ mass: 0.05, radius: r, phase: 0.1 * k }));
      run.fragmentsFormed = STRESS_RADII.length;
    }
    tick++;
  }
  return run;
}
const meta = E.newMeta(), rows = [];
for (const z of [[0, 0, 0], [0.8, -0.5, 0], [-1, 1, -1]]) {
  [meta.zDensity, meta.zTemperature, meta.zMetal] = z;
  const run = play(meta);
  rows.push([run.starMass, run.ejected + run.companions, run.energy, run.lifetimeMyr, run.seconds, run.kind, run.fragments.length, run.fragmentsFormed, run.companionRecords.length]);
  E.prestige(run, meta);
  meta.unlocks.push("cooling");
  E.buyHeavy(meta, "cooling");
  rows.push([meta.regions, meta.heavy, meta.cosmicMyr, meta.heavyCooling]);
  rows.push([...meta.unlocks]);
}
rows.push([E.stromgrenRadius(E.ionizingRate(22), 1e4), E.hiiRadius(E.ionizingRate(60), 300, 250, 1e13), E.hiiRadius(E.ionizingRate(60), 300, 250, 1e15)]);
{
  const run = stress(E.newMeta()), records = run.companionRecords;
  rows.push([run.starMass, run.ejected + run.companions, run.energy, run.fragmentsFormed, records.length, ...records.map((c) => c.mass), ...records.map((c) => c.separation)]);
}
console.log(JSON.stringify(rows));
