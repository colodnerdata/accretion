const E = require("../web/engine.js");
function play(meta) {
  let run = E.newRun(meta), tick = 0, out = [];
  while (run.phase !== "ended" && tick < 20000) {
    E.step(run, meta, 7.3);
    if (tick % 2 === 0) E.tap(run, meta);
    for (const n of ["reach", "tap", "cooling", "turbulence", "braking"]) while (E.buy(run, n, meta));
    tick++;
  }
  return run;
}
const meta = E.newMeta(), rows = [];
for (const z of [[0, 0, 0], [0.8, -0.5, 0], [-1, 1, -1]]) {
  [meta.zDensity, meta.zTemperature, meta.zMetal] = z;
  const run = play(meta);
  rows.push([run.starMass, run.ejected + run.companions, run.energy, run.lifetimeMyr, run.seconds, run.kind]);
  E.prestige(run, meta);
  meta.unlocks.push("cooling");
  E.buyHeavy(meta, "cooling");
  rows.push([meta.regions, meta.heavy, meta.cosmicMyr, meta.heavyCooling]);
  rows.push([...meta.unlocks]);
}
console.log(JSON.stringify(rows));
