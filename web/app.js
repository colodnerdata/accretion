const E = Engine;
const SAVE_KEY = "accretion-prototype-v4";
const $ = (id) => document.getElementById(id);
const state = { meta: E.newMeta(), run: null, view: "play", pane: "main", speed: 1, log: [], seen: {}, resetArm: false, skipped: false, noted: 0, hint: { key: "", tier: 0 }, selected: null };
state.run = E.newRun(state.meta);
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
function sci(x, d = 1) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 0.01 && a < 10000) return x.toLocaleString("en-US", { maximumFractionDigits: a < 10 ? 2 : a < 100 ? 1 : 0 });
  const e = Math.floor(Math.log10(a)), m = x / 10 ** e;
  return `${m.toFixed(d)}×10${String(e).split("").map((c) => SUP[c]).join("")}`;
}
function length(cm) {
  if (cm < 100) return `${sci(cm)} cm`;
  if (cm < 1e5) return `${sci(cm / 100)} m`;
  if (cm < 1.5e12) return `${sci(cm / 1e5)} km`;
  if (cm < 9.46e16) return `${sci(cm / 1.496e13)} AU`;
  return `${sci(cm / 9.46e17)} ly`;
}
function mass(msun) {
  const grams = msun * 1.989e33;
  if (grams < 1e-15) return `${sci(Math.round(grams / 2.04e-24), 1)} atoms`;
  if (grams < 1e27) return `${sci(grams)} g`;
  return `${sci(msun)} M☉`;
}
function duration(seconds) {
  if (seconds < 90) return `${Math.ceil(seconds)} s`;
  if (seconds < 5400) return `${Math.ceil(seconds / 60)} min`;
  if (seconds < 172800) return `${(seconds / 3600).toFixed(1)} h`;
  return `${(seconds / 86400).toFixed(0)} days`;
}
function myr(value) { return value >= 1000 ? `${sci(value / 1000)} Gyr` : `${sci(value)} Myr`; }
function clock(seconds) {
  const s = Math.max(0, Math.ceil(seconds)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, pad = (x) => String(x).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

// Shine phase. The HII region is display only: Stromgren sphere, Spitzer expansion, then stall.
const IONIZING_MIN_MASS = 5;
function bubble(run, meta) {
  if (run.phase !== "main_sequence" || run.starMass < IONIZING_MIN_MASS) return null;
  const q = E.ionizingRate(run.starMass), n = run.density, T = E.temperature(run, meta);
  const lifeSeconds = run.lifetimeMyr * 1e6 * E.YR, age = run.msElapsed / run.msDuration * lifeSeconds;
  const start = E.stromgrenRadius(q, n), end = E.hiiRadius(q, n, T, Infinity), now = E.hiiRadius(q, n, T, age);
  const ratio = E.HII_SOUND_SPEED / E.soundSpeed(T);
  const stallAt = 4 * start / (7 * E.HII_SOUND_SPEED) * (ratio ** (7 / 3) - 1);
  const grow = end > start * 1.001 ? Math.log(now / start) / Math.log(end / start) : 1;
  return { start, now, end, grow, stalled: age >= stallAt, stallShare: Math.min(1, stallAt / lifeSeconds) };
}
function burned(run) { return run.msDuration ? Math.min(1, run.msElapsed / run.msDuration) : 0; }
function shineNotes(run, meta) {
  const m = run.starMass, b = bubble(run, meta), years = run.lifetimeMyr * 1e6 / run.msDuration;
  const L = E.luminosity(m, run.metalLog10), heavy = m >= 1;
  const notes = [
    [0, "The main sequence", "The core is fusing hydrogen into helium. The heat from fusion pushes outward exactly as hard as gravity pulls inward, so the star holds steady. Stars spend about 90% of their lives in this balance."],
    [0.08, "Fast time", `Each second you watch is about ${sci(years)} years for this star. All of recorded human history would pass in about ${sci(5000 / years)} seconds.`],
    [0.2, "Brightness", heavy
      ? `This star shines about ${sci(L)} times as bright as the Sun. Brightness climbs much faster than mass, so a heavier star spends its fuel far faster. It is expected to last about ${myr(run.forecastMyr)}, against about 10 billion years for the Sun.`
      : `This star shines at about ${sci(L)} of the Sun's brightness. Small stars sip their fuel, so it is expected to last about ${myr(run.forecastMyr)}, longer than the Sun's 10 billion years.`],
    [0.35, "How it fuses", m < 1.3
      ? "This star fuses hydrogen proton by proton, as the Sun does. It is a slow route, one reason small stars last so long."
      : run.metalLog10 < E.PRIMORDIAL_METAL_LOG10
        ? "Heavier stars usually fuse hydrogen with carbon, nitrogen, and oxygen as catalysts. This gas formed before any star had made those elements, so the core squeezed itself hotter until it made a trace of carbon of its own, then burned on."
        : "This star's core uses the carbon, nitrogen, and oxygen it was born with as catalysts, cycling hydrogen through them into helium. Earlier stars made those elements."],
    [0.5, "Starlight on the gas", b
      ? `Ultraviolet light from the star strips electrons from the hydrogen around it. That ionized gas, near 10,000 K, glows and pushes into the cold gas beyond. The bubble's edge is now ${length(b.now)} from the star.`
      : "This star is too cool to ionize much of the gas around it. Its light mostly warms the nearby dust and gas."],
    [0.7, "Helium ash", "Helium is piling up in the core. It needs far higher temperatures to fuse, so for now it just sits there. The core slowly shrinks and heats to keep the hydrogen around it burning, and the star swells and brightens a little."],
    [0.9, "Running low", "The core's hydrogen is nearly gone. What happens next depends mostly on the mass this star was born with."],
  ];
  if (b) notes.push([Math.max(0.12, b.stallShare), "The bubble stops", `The ionized bubble has stopped growing, with its edge about ${length(b.end)} from the star. Its pressure now matches the cold gas around it.`]);
  return notes.sort((x, y) => x[0] - y[0]);
}

const PHASES = [["gather", "Gather"], ["collapse", "Collapse"], ["accrete", "Accrete"], ["main_sequence", "Shine"], ["ended", "Death"]];
const ENDINGS = {
  brown_dwarf: ["Brown dwarf", "The core never reached sustained hydrogen fusion. It will cool for trillions of years, so nothing here will change. This run counts as a failed search."],
  white_dwarf: ["White dwarf", "The star shed its outer layers and left a hot, Earth-sized core. There was no explosion, and few heavy elements escaped."],
  supernova: ["Core-collapse supernova", "The core collapsed in under a second, and the star blew itself apart. Elements heavier than helium now drift through this region."],
  black_hole: ["Black hole", "The core collapsed without a successful explosion, and most heavy elements fell in with it. Stars can fail like this even at masses close to ones that explode. You can now search for regions near a black hole."],
  pair_instability: ["Pair-instability supernova", "The core became unstable and the whole star was destroyed, leaving no remnant at all."],
};
const CONTROL_NOTES = {
  reach: "New control: Gravitational reach. Spend energy to make gas gather on its own.",
  tap: "New control: Stronger pull. Tapping had started to matter less.",
  turbulence: "New control: Disk turbulence. Gas is piling up in the disk faster than it reaches the star.",
  temperature: "New search option: Temperature. Your first star's size was not a choice.",
  density: "New search option: Density. The mass needed for collapse can now be targeted.",
  braking: "New control: Magnetic braking. Gas is landing far from the star and stalling in the disk.",
  cooling: "New control: Radiative cooling. Heavy elements from your supernova make cooler gas possible.",
  metals: "New search option: Metal content. Enriched gas cools better.",
};
const nextLevel = (run, name) => ({ ...run, levels: { ...run.levels, [name]: run.levels[name] + 1 } });
const UPGRADE_TEXT = {
  reach: ["Gravitational reach", () => "Gas gathers 25% faster on its own."],
  tap: ["Stronger pull", () => "Each tap pulls in 50% more gas."],
  cooling: ["Radiative cooling", (r, m) => {
    const a = E.temperature(r, m), b = E.temperature(nextLevel(r, "cooling"), m);
    if (b >= a) return "Gas is already at the coldest this composition allows.";
    return `Gas cools from ${a.toFixed(0)} to ${b.toFixed(0)} K. Mass needed for collapse falls from ${sci(E.jeansMass(a, r.density))} to ${sci(E.jeansMass(b, r.density))} M☉.`;
  }],
  turbulence: ["Disk turbulence", () => "Gas moves through the disk 30% faster, so it reaches the star sooner."],
  braking: ["Magnetic braking", (r) => `Gas lands ${E.feedRadius(nextLevel(r, "braking")).toFixed(0)} AU from the star instead of ${E.feedRadius(r).toFixed(0)} AU, so it has less far to travel.`],
};
const MILESTONES = [
  [0.6, "cm", (run) => `A cubic centimeter of this gas holds only about ${sci(run.density)} atoms.`],
  [4.6, "m", () => "Your reach is 1 meter across. The patch still weighs less than a speck of dust."],
  [20.9, "earth", () => "Your reach is as wide as Earth. Its mass is still tiny."],
  [30.3, "au", () => "Your reach now spans the distance from Earth to the Sun."],
  [41.4, "ly", () => "Your reach is one light-year wide. Faint gridlines now map the space around you."],
];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function note(text) { state.log.unshift(text); state.log = state.log.slice(0, 40); }
function checkMilestones() {
  const run = state.run, seen = state.seen, meta = state.meta;
  for (const [lr, key, text] of MILESTONES) {
    if (run.logReach >= lr && !seen[key]) { seen[key] = 1; note(text(run)); }
  }
  if (run.phase === "gather" && E.patchMass(run) >= 1 && !seen.sun) { seen.sun = 1; note("You have gathered one solar mass of gas, but its pressure still holds it apart."); }
  if (run.phase === "collapse" && !seen.collapse) { seen.collapse = 1; note("Gravity has beaten pressure. The patch passed the Jeans mass and is collapsing."); }
  if (run.ignited && !seen.ignite) { seen.ignite = 1; note("Hydrogen fusion has begun. Starlight will now start clearing the disk."); }
  if (run.phase === "main_sequence" && !seen.ms) { seen.ms = 1; note(`The gas is gone. Final mass: ${sci(run.starMass)} M☉.`); }
  while (state.noted < meta.unlocks.length) { const name = meta.unlocks[state.noted++]; note(CONTROL_NOTES[name]); }
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ meta: state.meta, run: state.run, view: state.view, seen: state.seen, log: state.log, skipped: state.skipped, noted: state.noted, savedAt: Date.now() })); } catch {}
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved?.run) return;
    Object.assign(state, { meta: saved.meta, run: saved.run, view: saved.view, seen: saved.seen || {}, log: saved.log || [], skipped: !!saved.skipped, noted: saved.noted || 0 });
    const away = (Date.now() - saved.savedAt) / 1000;
    if (away > 60 && state.view === "play") {
      const before = state.run.phase;
      E.step(state.run, state.meta, away);
      checkMilestones();
      note(`You were away for ${duration(away)}.${before !== state.run.phase ? " Your star moved to a new stage." : ""}`);
    }
  } catch {}
}

function button(cls, text, on) { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = text; b.onclick = on; return b; }
function stat(list) { return `<dl class="stats">${list.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`; }

function goal() {
  const m = state.meta, seen = new Set(m.journal.map((j) => j.ending));
  if (!m.supernovae) return "Goal: build a star massive enough to explode, so its heavy elements can seed the next generation.";
  if (!seen.has("black_hole")) return "Goal: find out what happens to a star too massive to explode cleanly.";
  if (!seen.has("white_dwarf")) return "Goal: find out what becomes of a much smaller star.";
  return "Goal: map how each region shapes the stars born there.";
}
function headline() {
  const { run, meta } = state;
  if (run.phase === "gather") return ["Gather the gas", `Tap the sky to pull in gas. At ${mass(E.jeansMass(E.temperature(run, meta), run.density))}, gravity beats gas pressure and the patch collapses.`];
  if (run.phase === "collapse") return ["Free fall", `Nothing is holding the cloud up now. In reality this fall takes about ${myr(E.freeFallTime(run.density) / 3.156e13)}.`];
  if (run.phase === "accrete") return [run.ignited ? "Feed the star" : "Build a protostar", "Gas spirals through the disk into the star. As the star brightens, its ionizing light cuts off the gas falling in and boils away the disk."];
  return ["The star shines", "Its final mass is set, and it will decide how this star ends. Until then, it burns hydrogen in its core."];
}
function progress() {
  const { run, meta } = state;
  if (run.phase === "gather") {
    const startLog = Math.log(1.5 / run.density ** (1 / 3)), limit = E.jeansLogReach(run, meta);
    return [(run.logReach - startLog) / (limit - startLog), "Reach toward collapse", `${Math.round((run.logReach - startLog) / (limit - startLog) * 100)}%`];
  }
  if (run.phase === "collapse") return [1 - run.collapseLeft / E.COLLAPSE_SECONDS, "Collapse", duration(run.collapseLeft / state.speed)];
  if (run.phase === "accrete") { const gas = E.gas(run); return [1 - gas / run.collapseMass, "Gas used or blown away", `${sci(gas)} M☉ left`]; }
  return [burned(run), "Core hydrogen burned", `${Math.floor(burned(run) * 100)}%`];
}
function statsFor() {
  const { run, meta } = state;
  if (run.phase === "gather") return [["Reach", length(Math.exp(run.logReach))], ["Patch mass", mass(E.patchMass(run))], ["Mass needed", mass(E.jeansMass(E.temperature(run, meta), run.density))], ["Temperature", `${E.temperature(run, meta).toFixed(0)} K`], ["Energy", `${sci(run.energy)} erg`]];
  if (run.phase === "collapse") return [["Cloud mass", `${sci(run.collapseMass)} M☉`], ["Temperature", `${E.temperature(run, meta).toFixed(0)} K`], ["Energy", `${sci(run.energy)} erg`]];
  if (run.phase === "accrete") {
    const disk = run.diskMasses.reduce((a, b) => a + b, 0);
    return [["Star", `${sci(run.starMass)} M☉`], ["In the disk", `${sci(disk)} M☉`], ["Still falling in", `${sci(run.envelope)} M☉`], ["Falling in", `${sci(E.infallNow(run, meta))} M☉/yr`], ["Boiled off", `${sci(E.diskLossRate(run.starMass, E.feedRadius(run)))} M☉/yr`], ["Companion stars", `${sci(run.companions)} M☉`], ["Energy", `${sci(run.energy)} erg`]];
  }
  const b = bubble(run, meta);
  return [["Star", `${sci(run.starMass)} M☉`], ["Brightness", `${sci(E.luminosity(run.starMass, run.metalLog10))} Suns`], ["Forecast life", myr(run.forecastMyr)], ["Age", myr(run.msElapsed / run.msDuration * run.lifetimeMyr)], ...(b ? [["Ionized bubble", `${length(b.now)} radius`]] : [])];
}

// Hints use what has actually happened in this save, and go one step deeper each time.
function hintSet() {
  const { run, meta, view } = state, last = meta.journal.at(-1);
  if (view === "play" && run.phase === "gather") {
    if (!meta.unlocks.includes("reach")) return ["start", "The patch has to grow until gravity beats gas pressure.", "Keep tapping the sky. Each tap also releases energy.", "Falling gas releases energy. Soon you will have enough for your first upgrade."];
    if (run.levels.reach === 0) return ["reach", "You can make gas gather without tapping.", "Spend energy on Gravitational reach.", "Reach compounds, so early levels save the most time."];
    return ["gather", "The bar shows how close the patch is to collapse.", "Buy upgrades as soon as energy allows. Each level costs far more than the last, but energy rises quickly too.", "A patch's binding energy climbs steeply as it grows."];
  }
  if (view === "play" && run.phase === "accrete") return ["accrete", "Your star's mass depends on a race between feeding and clearing.", "Disk controls mainly change how quickly gas gets through. Final mass depends more on how fast gas falls in.", "Faster infall feeds the star for longer before its ionizing light shuts the supply off."];
  if (view === "play" && run.phase === "main_sequence") return ["shine", "Nothing can change this star now.", "Use the wait to review your journal.", "A star's fuel lasts far less time as its mass rises."];
  if (last && (last.ending === "white_dwarf" || last.ending === "brown_dwarf")) return ["small", "Your last star was too small to explode.", "Search for a hotter region, or a less dense one.", "Hotter gas falls inward faster, so the star gains mass before its light clears the gas."];
  if (last?.ending === "black_hole") return ["big", "Your last star collapsed into a black hole, and most of its heavy elements went with it.", "Try a cooler or denser region, or aim for a slightly different mass.", "Explosions depend on core structure, so some masses fail even between masses that explode."];
  if (last) return ["compare", "Most stars from about 9 to 20 solar masses explode, but not all of them.", "Change one search option, then compare the result in your journal.", "One change at a time shows which control caused the difference."];
  return ["none", "Keep going. There is nothing to work out yet.", "", ""];
}
function stuck() {
  const m = state.meta, recent = m.journal.slice(-2);
  return recent.length === 2 && recent.every((j) => j.ending !== "supernova") && !m.supernovae;
}
function askHint() {
  const [key] = hintSet();
  if (state.hint.key !== key) state.hint = { key, tier: 0 };
  state.hint.tier = Math.min(3, state.hint.tier + 1);
  paintHints();
}
function hintBlock() {
  const box = document.createElement("section");
  box.id = "hint-box";
  box.innerHTML = `<div id="hints"></div>`;
  box.append(button("ghost", "Ask for a hint", askHint));
  box.lastChild.id = "hint-button";
  return box;
}
function paintHints() {
  const area = $("hints"); if (!area) return;
  const set = hintSet(), key = set[0], lines = set.slice(1).filter(Boolean);
  const tier = state.hint.key === key ? state.hint.tier : 0;
  area.innerHTML = lines.slice(0, tier).map((t) => `<p class="hint">${t}</p>`).join("");
  const b = $("hint-button");
  b.hidden = tier >= lines.length;
  b.textContent = tier ? "Show more" : stuck() ? "A hint is available" : "Ask for a hint";
  b.classList.toggle("nudge", !tier && stuck());
}

let shell = "";
function renderShell() {
  const ended = state.run.phase === "ended";
  const view = state.pane === "journal" ? "journal" : state.view === "search" ? "search" : ended ? "ended" : "play";
  const key = `${view}:${state.run.phase}:${state.meta.unlocks.length}:${state.meta.journal.length}`;
  if (key === shell) return;
  const sameView = shell.startsWith(`${view}:`);
  shell = key;
  const panel = $("panel"), top = sameView ? panel.scrollTop : 0;
  panel.textContent = "";
  if (view === "ended") renderEnded(panel);
  else if (view === "search") renderSearch(panel);
  else if (view === "journal") renderJournal(panel);
  else renderPlay(panel);
  if (view !== "journal") panel.appendChild(hintBlock());
  panel.appendChild(footer());
  panel.scrollTop = top;
  paintHints();
}
function renderPlay(panel) {
  const shine = state.run.phase === "main_sequence";
  panel.insertAdjacentHTML("beforeend", `<section><p class="goal" id="goal"></p><h2 id="head"></h2><p id="sub"></p></section>
    ${shine ? `<section class="countdown"><b id="count"></b><span id="count-note"></span></section>` : ""}
    <section><div class="meter"><i id="meter"></i></div><div class="meter-note"><span id="meter-a"></span><span id="meter-b"></span></div><div id="stats"></div></section>
    <section id="upgrade-box"><h3>Controls</h3><p class="fine">Energy comes from falling gas. Spend it here.</p><div class="upgrades" id="upgrades"></div></section>
    ${shine ? `<section><h3>Field notes</h3><div id="reading" class="reading"></div></section>` : ""}
    <section id="skip-box" hidden></section><section><h3>Observations</h3><div id="log"></div></section>`);
  const list = $("upgrades");
  const names = Object.keys(E.UPGRADES).filter((n) => E.UPGRADES[n].phase === state.run.phase && state.meta.unlocks.includes(n));
  $("upgrade-box").hidden = !names.length;
  for (const name of names) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "upgrade"; b.id = `up-${name}`;
    b.innerHTML = `<b></b><small></small><span class="cost"></span>`;
    b.onclick = () => { if (E.buy(state.run, name, state.meta)) { update(); save(); } };
    list.appendChild(b);
  }
  const skip = button("ghost", "Move on to a new region", () => { state.skipped = true; state.run.phase = "ended"; update(); });
  skip.id = "skip";
  $("skip-box").append(skip, Object.assign(document.createElement("p"), { id: "skip-note" }));
}
const BANDS = [["brown_dwarf", "Failed star", "below 0.08"], ["white_dwarf", "White dwarf", "up to about 9"], ["supernova", "Supernova", "about 9–25, with gaps"], ["black_hole", "Black hole", "some above 18, most above 27"]];
function outcomeBands(current) {
  const seen = new Set(state.meta.journal.map((j) => j.ending));
  if (current) seen.add(current);
  return `<div class="bands">${BANDS.map(([kind, label, range]) => `<div class="band${kind === current ? " now" : ""}"><b>${seen.has(kind) ? label : "?"}</b><span>${seen.has(kind) ? `${range} M☉` : "Not seen yet"}</span></div>`).join("")}</div>`;
}
function renderEnded(panel) {
  const { run, meta } = state;
  const [title, text] = ENDINGS[run.kind];
  const gain = E.runGain(run), released = E.heavyYield(run.starMass, run.kind, run.metalLog10);
  const after = meta.regions * Math.exp(gain);
  const beyond = run.lifetimeMyr > run.forecastMyr * 1.01;
  if (beyond && !state.seen.anomaly) { state.seen.anomaly = 1; note(`Anomaly: this star lived ${Math.round((run.lifetimeMyr / run.forecastMyr - 1) * 100)}% longer than forecast.`); }
  panel.insertAdjacentHTML("beforeend", `<section><h3>${state.skipped ? "Forecast ending" : "Ending"}</h3><h2>${title}</h2><p>${text}</p>
    ${state.skipped ? `<p>You left before this happened. The universe aged only by the time you stayed.</p>` : ""}
    ${beyond ? `<p class="tag">Anomaly: this star lived ${Math.round((run.lifetimeMyr / run.forecastMyr - 1) * 100)}% longer than forecast. The cause is not yet known.</p>` : ""}</section>
    <section><h3>Final mass ${sci(run.starMass)} M☉</h3>${outcomeBands(run.kind)}</section>
    <section>${stat([["Blown away", `${sci(run.ejected)} M☉`], ["Companion stars", `${sci(run.companions)} M☉`], ["Run time", duration(run.seconds)], ["Regions surveyed", `${sci(meta.regions)} → ${sci(after)}`], ["Probability", `${E.budget(meta).toFixed(2)} → ${Math.log(after).toFixed(2)}`], ...(released > 0 ? [["Heavy elements", `+${sci(released)} M☉`]] : [])])}<p class="fine">Probability lets you search for rarer regions.</p></section>`);
  const box = document.createElement("section");
  box.append(button("primary", "Survey new regions", () => {
    const notes = state.log.slice();
    state.run = E.prestige(state.run, state.meta, state.skipped);
    state.meta.journal.at(-1).notes = notes;
    state.selected = state.meta.journal.length - 1;
    state.skipped = false; state.seen = {}; state.log = []; state.view = "search"; shell = ""; update(); save();
  }));
  panel.appendChild(box);
}
function fieldRow(id, label, key, text) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.innerHTML = `<span>${label}</span><output id="${id}-out"></output><small>${text}</small><input id="${id}" type="range" min="-3" max="3" step="0.1">`;
  const input = wrap.querySelector("input");
  input.value = state.meta[key];
  input.oninput = () => {
    const m = state.meta, old = m[key];
    m[key] = Number(input.value);
    if (E.regionCost(m) > E.budget(m) + 1e-9) {
      const others = E.regionCost({ ...m, [key]: 0 });
      const limit = Math.sqrt(Math.max(0, 2 * (E.budget(m) - others)));
      m[key] = Math.sign(m[key]) * Math.floor(limit * 10) / 10;
      input.value = m[key];
    }
    if (old !== m[key]) refreshSearch();
  };
  return wrap;
}
function refreshSearch() {
  const m = state.meta, run = E.newRun(m), T = E.temperature(run, m);
  if ($("density-out")) $("density-out").textContent = `${sci(run.density)} /cm³`;
  if ($("temperature-out")) $("temperature-out").textContent = `${run.baseTemperature.toFixed(0)} K`;
  if ($("metals-out")) $("metals-out").textContent = `10^${run.metalLog10.toFixed(1)} Z☉`;
  $("spent").textContent = `${E.regionCost(m).toFixed(2)} of ${E.budget(m).toFixed(2)} spent`;
  $("spent-bar").style.width = `${Math.min(100, E.regionCost(m) / Math.max(E.budget(m), 1e-9) * 100)}%`;
  $("preview").innerHTML = stat([["Odds of finding this", `1 in ${sci(Math.exp(E.regionCost(m)))}`], ["Mass needed to collapse", `${sci(E.jeansMass(T, run.density))} M☉`], ["Gas falling inward", `${sci(E.infallRate(T) * run.infallFactor)} M☉/yr`], ["Lowest temperature here", `${run.floorTemperature.toFixed(0)} K`], ["Metal content", `10^${run.metalLog10.toFixed(1)} Z☉`], ["Universe age", myr(120 + m.cosmicMyr)]]);
}
function renderSearch(panel) {
  const m = state.meta, has = (n) => m.unlocks.includes(n);
  panel.insertAdjacentHTML("beforeend", `<section><p class="goal">${goal()}</p><h2>Survey the region</h2><p>Spend probability to find a rarer starting point. Your full budget returns after every run, so experiments cost nothing.</p>
    <div class="meter"><i id="spent-bar" style="background:var(--oiii)"></i></div><div class="meter-note"><span>Probability</span><span id="spent"></span></div></section>`);
  const box = document.createElement("section");
  if (has("temperature")) box.append(fieldRow("temperature", "Temperature", "zTemperature", "Hotter gas needs more mass to collapse, but falls inward faster and feeds a bigger star."));
  if (has("density")) box.append(fieldRow("density", "Density", "zDensity", "Denser gas collapses with less total mass."));
  if (has("metals")) box.append(fieldRow("metals", "Metal content", "zMetal", "More metals let gas cool further."));
  if (m.blackHoleUnlocked) {
    const row = document.createElement("label"); row.className = "check";
    row.innerHTML = `<input id="bh" type="checkbox"><span>Start near a black hole. Gas falls in 50% faster (cost 1.00).</span>`;
    const c = row.querySelector("input"); c.checked = m.blackHoleStart;
    c.onchange = () => { m.blackHoleStart = c.checked; if (E.regionCost(m) > E.budget(m) + 1e-9) { m.blackHoleStart = false; c.checked = false; } refreshSearch(); };
    box.append(row);
  }
  const preview = document.createElement("div"); preview.id = "preview"; box.append(preview);
  panel.appendChild(box);
  const items = [["cooling", "Dust and metal cooling", "Permanently cools gas by 10% per level."], ["turbulence", "Seeded turbulence", "Permanently speeds the disk by 30% per level."]].filter(([n]) => has(n));
  if (m.heavy > 0 && items.length) {
    const shop = document.createElement("section");
    shop.innerHTML = `<h3>Heavy elements: <span id="heavy">${sci(m.heavy)}</span> M☉</h3><div class="upgrades" id="heavy-list"></div>`;
    panel.appendChild(shop);
    const buttons = [];
    for (const [name, label, text] of items) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "upgrade"; b.id = `heavy-${name}`;
      b.paint = () => {
        const cost = E.heavyCost(m, name), lvl = name === "cooling" ? m.heavyCooling : m.heavyTurbulence;
        b.innerHTML = `<b>${label}, level ${lvl}</b><small>${text}</small><span class="cost">${sci(cost)} M☉</span>`;
        b.disabled = m.heavy < cost;
        $("heavy").textContent = sci(m.heavy);
      };
      b.onclick = () => { if (E.buyHeavy(m, name)) { buttons.forEach((x) => x.paint()); refreshSearch(); save(); } };
      buttons.push(b);
      $("heavy-list").appendChild(b);
      b.paint();
    }
  }
  const go = document.createElement("section");
  go.append(button("primary", "Begin run", () => { state.run = E.newRun(m); state.view = "play"; shell = ""; note(`Run ${m.runs + 1} begins at ${sci(state.run.density)} atoms per cm³ and ${state.run.baseTemperature.toFixed(0)} K.`); update(); save(); }));
  panel.appendChild(go);
  refreshSearch();
}
const ENDING_COLOR = { brown_dwarf: "var(--dwarf)", white_dwarf: "var(--ink)", supernova: "var(--oiii)", black_hole: "var(--sii)", pair_instability: "var(--halpha)" };
function resultsPlot() {
  const m = state.meta, two = m.unlocks.includes("density"), W = 340, H = two ? 250 : 92;
  const left = two ? 40 : 12, right = W - 12, bottom = H - 34, top = two ? 10 : 8;
  const X = (t) => left + (Math.log10(t) - 1) / 2 * (right - left);
  const Y = (n) => two ? bottom - (Math.log10(n) - 2) / 4 * (bottom - top) : (top + bottom) / 2;
  let out = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Your completed runs by gas temperature${two ? " and density" : ""}. Bubble size shows final mass.">`;
  for (const t of [10, 100, 1000]) out += `<line x1="${X(t)}" x2="${X(t)}" y1="${top}" y2="${bottom}" class="tick"/><text x="${X(t)}" y="${bottom + 14}" text-anchor="${t === 1000 ? "end" : t === 10 ? "start" : "middle"}">${t}</text>`;
  if (two) for (const e of [2, 3, 4, 5, 6]) out += `<line x1="${left}" x2="${right}" y1="${Y(10 ** e)}" y2="${Y(10 ** e)}" class="tick"/><text x="${left - 6}" y="${Y(10 ** e) + 4}" text-anchor="end">10${SUP[e]}</text>`;
  out += `<text x="${(left + right) / 2}" y="${H - 4}" text-anchor="middle">Gas temperature (K)</text>`;
  if (two) out += `<text x="10" y="${(top + bottom) / 2}" text-anchor="middle" transform="rotate(-90 10 ${(top + bottom) / 2})">Density (/cm³)</text>`;
  m.journal.forEach((j, i) => {
    const r = Math.max(3.5, 2.1 * Math.sqrt(j.mass));
    out += `<circle cx="${X(Math.min(1000, Math.max(10, j.temperature)))}" cy="${Y(j.density)}" r="${r}" fill="${ENDING_COLOR[j.ending]}" fill-opacity="${i === state.selected ? 0.75 : 0.3}" stroke="${ENDING_COLOR[j.ending]}" stroke-width="${i === state.selected ? 2.5 : 1.25}" tabindex="0" role="button" aria-label="Run ${j.run}" data-i="${i}"/>`;
  });
  return `${out}</svg>`;
}
function entryCard(j) {
  const rows = [["Ending", ENDINGS[j.ending][0]], ["Final mass", `${sci(j.mass)} M☉`], ["Gas temperature", `${j.temperature.toFixed(0)} K`], ["Density", `${sci(j.density)} /cm³`], ["Disk turbulence", `α ${j.alpha.toFixed(2)}`], ["Gas landed at", `${j.feedRadius.toFixed(0)} AU`], ["Run time", duration(j.seconds)], ["Reward", `+${j.gain.toFixed(2)} probability${j.heavy ? `, +${sci(j.heavy)} M☉ heavy` : ""}`]];
  const notes = (j.notes || []).filter((n) => !String(n).startsWith("New ")).slice(0, 5).reverse();
  return `<section><h3>Run ${j.run}${j.skipped ? ", left early" : ""}</h3>${stat(rows)}${notes.length ? `<h3>Observations</h3><div id="log">${notes.map((t) => `<div>${esc(t)}</div>`).join("")}</div>` : ""}</section>`;
}
function renderJournal(panel) {
  const m = state.meta, count = m.journal.length;
  panel.insertAdjacentHTML("beforeend", `<section><h2>Journal</h2><p>${count ? "Bigger bubbles are heavier stars. Select one to read that run." : "Finished runs will appear here."}</p></section>`);
  if (count) {
    panel.insertAdjacentHTML("beforeend", `<section>${resultsPlot()}<div class="legend">${[...new Set(m.journal.map((j) => j.ending))].map((k) => `<span><i style="background:${ENDING_COLOR[k]}"></i>${ENDINGS[k][0]}</span>`).join("")}</div><div class="runs">${m.journal.map((j, i) => `<button type="button" class="run-chip" data-i="${i}" aria-pressed="${i === (state.selected ?? count - 1)}">${j.run}</button>`).join("")}</div></section>${entryCard(m.journal[state.selected ?? count - 1])}`);
    const pick = (el) => { state.selected = Number(el.dataset.i); shell = `journal:keep`; update(); };
    panel.querySelectorAll(".run-chip").forEach((c) => { c.onclick = () => pick(c); });
    panel.querySelectorAll("circle").forEach((c) => { c.onclick = () => pick(c); c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(c); } }; });
  }
}
function footer() {
  const box = document.createElement("section");
  box.className = "foot";
  const open = state.pane === "journal";
  const journal = button("ghost", open ? "Back to the run" : `Journal (${state.meta.journal.length})`, () => { state.pane = open ? "main" : "journal"; update(); });
  journal.id = "journal-button";
  box.append(journal);
  const row = document.createElement("div"); row.className = "speed";
  row.append("Test speed");
  for (const s of [1, 10, 60]) {
    const b = button("", `×${s}`, () => { state.speed = s; row.querySelectorAll("button[data-s]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.s == s)); });
    b.dataset.s = s; b.setAttribute("aria-pressed", state.speed === s); row.append(b);
  }
  const reset = button("reset", "Reset", () => {
    if (!state.resetArm) { state.resetArm = true; reset.textContent = "Tap again to erase"; setTimeout(() => { state.resetArm = false; reset.textContent = "Reset"; }, 3000); return; }
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    Object.assign(state, { meta: E.newMeta(), view: "play", pane: "main", log: [], seen: {}, resetArm: false, skipped: false, noted: 0, hint: { key: "", tier: 0 }, selected: null });
    state.run = E.newRun(state.meta); shell = ""; update();
  });
  row.append(reset); box.append(row);
  return box;
}
function update() {
  checkMilestones();
  renderShell();
  const { run, meta } = state;
  const track = PHASES.findIndex(([p]) => p === run.phase);
  $("track").innerHTML = PHASES.map(([, label], i) => `<span class="${i === track ? "now" : i < track ? "done" : ""}">${label}</span>`).join("");
  $("scale-label").textContent = length(viewRadius() * 0.5);
  $("hint").hidden = !(run.phase === "gather" && state.view === "play" && run.seconds < 30 && !meta.runs);
  paintHints();
  if (!$("head")) return;
  const [head, sub] = headline();
  $("goal").textContent = goal();
  $("head").textContent = head; $("sub").textContent = sub;
  const [value, a, b] = progress();
  $("meter").style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  $("meter-a").textContent = a; $("meter-b").textContent = b;
  $("stats").innerHTML = stat(statsFor());
  $("log").innerHTML = state.log.slice(0, 4).map((t) => `<div>${esc(t)}</div>`).join("") || "<div>Nothing recorded yet.</div>";
  for (const name of Object.keys(E.UPGRADES)) {
    const el = $(`up-${name}`); if (!el) continue;
    const [title, text] = UPGRADE_TEXT[name], ok = E.canBuy(run, name, meta), maxed = run.levels[name] >= E.UPGRADES[name].max;
    el.querySelector("b").textContent = `${title}, level ${run.levels[name]}`;
    el.querySelector("small").textContent = text(run, meta);
    el.querySelector(".cost").textContent = maxed ? "Maxed" : `${sci(E.upgradeCost(run, name))} erg`;
    el.disabled = !ok; el.classList.toggle("ready", ok);
  }
  if ($("count")) {
    const left = (run.msDuration - run.msElapsed) / state.speed, years = run.lifetimeMyr * 1e6 / run.msDuration * state.speed;
    $("count").textContent = clock(left);
    $("count-note").textContent = `until the core's hydrogen runs out. Each second here is about ${sci(years)} years.`;
  }
  if ($("reading")) {
    // Newest first, so a fresh note is visible without scrolling.
    const shown = shineNotes(run, meta).filter(([at]) => burned(run) >= at).reverse();
    const html = shown.map(([, title, text], i) => `<article${i === 0 ? ' class="new"' : ""}><b>${title}</b><p>${text}</p></article>`).join("");
    if ($("reading").innerHTML !== html) $("reading").innerHTML = html;
  }
  const skippable = E.canSkip(run);
  $("skip-box").hidden = !skippable;
  if (skippable) $("skip-note").textContent = `Nothing you do can change this star for another ${duration(run.msDuration - run.msElapsed)}. Moving on ages the universe only by the time you stayed.`;
}

// Telescope view.
const canvas = $("sky"), ctx = canvas.getContext("2d");
let W = 0, H = 0, ripple = [], lastDeath = 0;
function hash(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
const BACK = Array.from({ length: 140 }, (_, i) => [hash(i, 1), hash(i, 2), hash(i, 3)]);
const ATOMS = Array.from({ length: 90 }, (_, i) => { const u = hash(i, 4) * 2 - 1, t = hash(i, 5) * 6.283, r = Math.cbrt(hash(i, 6)) * 4.4; return [r * Math.sqrt(1 - u * u) * Math.cos(t), r * Math.sqrt(1 - u * u) * Math.sin(t), hash(i, 7) * 6.283]; });
const HAZE = Array.from({ length: 220 }, (_, i) => [hash(i, 8) * 6.283, hash(i, 9), 0.5 + hash(i, 10) * 1.5]);
function resize() {
  const box = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  W = box.width; H = box.height; canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
function viewRadius() {
  const r = state.run;
  if (r.phase === "gather" || r.phase === "collapse") return Math.exp(r.logReach) * 1.15 * (r.phase === "collapse" ? Math.max(0.03, r.collapseLeft / E.COLLAPSE_SECONDS) : 1);
  const b = bubble(r, state.meta);
  if (b) return b.now / bubbleShare(b);
  return 3000 * 1.496e13;
}
// Share of the view radius the ionized bubble fills: it grows on a log scale from switch-on to stall.
function bubbleShare(b) { return 0.2 + 0.6 * b.grow; }
function shineScene(run, meta, cx, cy, R, t) {
  const f = burned(run), b = bubble(run, meta), time = calm ? 0 : t;
  const rb = b ? R * bubbleShare(b) : 0;
  // Cold neutral gas, cleared wherever the star has ionized it.
  for (const [a, u, s] of HAZE) {
    const rad = R * 1.75 * Math.sqrt(u), x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * 0.9;
    if (rad < rb * 1.02) continue;
    ctx.globalAlpha = 0.18 + 0.22 * hash(a, 3); ctx.fillStyle = "#7d74c4";
    ctx.beginPath(); ctx.arc(x, y, s * 1.1, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const size = R * 0.018 * (1.5 + Math.log10(run.starMass + 1) * 1.5) * (1 + 0.3 * f);
  if (b) {
    // Narrowband look: [O III] teal near the hot star, H-alpha red further out, [S II] amber at the front.
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rb);
    g.addColorStop(0, "rgba(95,230,207,0.34)"); g.addColorStop(0.5, "rgba(95,230,207,0.14)");
    g.addColorStop(0.82, "rgba(255,95,126,0.22)"); g.addColorStop(1, "rgba(255,95,126,0.04)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rb, 0, 6.283); ctx.fill();
    const edge = (ang) => rb * (1 + 0.035 * Math.sin(5 * ang + 1.3 + time * 0.2) + 0.022 * Math.sin(9 * ang + 4.1 - time * 0.13) + 0.012 * Math.sin(17 * ang + time * 0.3));
    for (const [width, color, alpha] of [[7, "#ff5f7e", 0.22], [1.6, "#ffb86b", 0.85]]) {
      ctx.beginPath();
      for (let k = 0; k <= 120; k++) { const ang = k / 120 * 6.283, r = edge(ang); k ? ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r) : ctx.moveTo(cx + r, cy); }
      ctx.lineWidth = width; ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.stroke();
    }
    // Ultraviolet photons streaming out to the front.
    for (let i = 0; i < 44; i++) {
      const a = hash(i, 15) * 6.283, p = ((hash(i, 16) + time * 0.3) % 1 + 1) % 1, r = size + (edge(a) - size) * p;
      ctx.globalAlpha = 0.75 * (1 - p) * Math.min(1, p * 8); ctx.fillStyle = "#e9eeff";
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.3, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = "#ffb86b"; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
    const label = b.stalled ? "Ionization front (stalled)" : "Ionization front";
    ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.strokeText(label, cx, cy + edge(1.571) + 18); ctx.fillText(label, cx, cy + edge(1.571) + 18);
  } else {
    glow(cx, cy, R * 0.3, "#ffb86b", 0.12);
  }
  star(cx, cy, size, run.starMass, t);
  coreGauge(run, f);
}
// The core in cross-section: helium ash grows from the centre as hydrogen burns.
function coreGauge(run, f) {
  // Top right, clear of the brand (top left), scale bar (bottom left), and front label (bottom centre).
  const cr = Math.max(20, Math.min(32, Math.min(W, H) * 0.065)), x = W - 16 - cr, y = 16 + cr, tx = W - 16;
  ctx.globalAlpha = 0.92; ctx.fillStyle = "#ffb86b"; ctx.beginPath(); ctx.arc(x, y, cr, 0, 6.283); ctx.fill();
  ctx.fillStyle = "#cfc8ff"; ctx.beginPath(); ctx.arc(x, y, cr * Math.sqrt(f), 0, 6.283); ctx.fill();
  ctx.globalAlpha = 1; ctx.lineWidth = 1.5; ctx.strokeStyle = "#0c0a1c"; ctx.beginPath(); ctx.arc(x, y, cr, 0, 6.283); ctx.stroke();
  const text = (s, yy, font, color) => { ctx.font = font; ctx.fillStyle = color; ctx.strokeText(s, tx, yy); ctx.fillText(s, tx, yy); };
  ctx.textAlign = "right"; ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c";
  text(clock((run.msDuration - run.msElapsed) / state.speed), y + cr + 24, "600 20px 'IBM Plex Mono', monospace", "#5fe6cf");
  text("● core hydrogen", y + cr + 40, "11px 'IBM Plex Mono', monospace", "#ffb86b");
  text("● helium ash", y + cr + 54, "11px 'IBM Plex Mono', monospace", "#cfc8ff");
  ctx.textAlign = "center";
}
function glow(x, y, radius, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, radius, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
}
function drawGrid(cx, cy, R, alpha, depth) {
  if (alpha <= 0.005) return;
  ctx.strokeStyle = "#8d84d6"; ctx.globalAlpha = alpha; ctx.lineWidth = 1;
  const warp = (x, y) => { const dx = x - cx, dy = y - cy, d2 = (dx * dx + dy * dy) / (R * R), f = 1 - depth / (1 + d2 * 7); return [cx + dx * f, cy + dy * f]; };
  const span = Math.max(W, H) * 0.75, gap = R / 3.5;
  for (const dir of [0, 1]) for (let k = -Math.ceil(span / gap); k <= span / gap; k++) {
    ctx.beginPath();
    for (let s = -36; s <= 36; s++) {
      const a = (s / 36) * span, b = k * gap;
      const [x, y] = dir ? warp(cx + a, cy + b) : warp(cx + b, cy + a);
      s === -36 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function atomScene(run, cx, cy, R, t) {
  const spacing = 1 / run.density ** (1 / 3), scale = R * spacing / (Math.exp(run.logReach) * 1.15);
  const fade = Math.min(1, Math.max(0, (Math.log10(R / scale) * -1 + 2.3) / 1.2 + 1));
  const visible = Math.max(0, Math.min(1, (scale - 3) / 14));
  if (visible <= 0) return;
  for (const [ax, ay, ph] of ATOMS) {
    const x = cx + ax * scale, y = cy + ay * scale, inside = Math.hypot(ax, ay) * spacing <= Math.exp(run.logReach);
    if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue;
    const size = Math.min(32, scale * 0.3);
    ctx.globalAlpha = visible * (inside ? 0.6 : 0.16); ctx.strokeStyle = "#5fe6cf"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y, size, size * 0.42, ph, 0, 6.283); ctx.stroke();
    const e = (calm ? ph : t * 1.4 + ph);
    const ex = x + Math.cos(e) * size * Math.cos(ph) - Math.sin(e) * size * 0.42 * Math.sin(ph);
    const ey = y + Math.cos(e) * size * Math.sin(ph) + Math.sin(e) * size * 0.42 * Math.cos(ph);
    ctx.globalAlpha = visible * (inside ? 1 : 0.28); ctx.fillStyle = "#5fe6cf"; ctx.beginPath(); ctx.arc(ex, ey, Math.max(1.2, size * 0.09), 0, 6.283); ctx.fill();
    ctx.fillStyle = "#ff5f7e"; ctx.beginPath(); ctx.arc(x, y, Math.max(1.6, size * 0.14), 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function hazeScene(run, cx, cy, R, t, amount, pull) {
  const zoom = run.logReach * 0.34;
  for (const [a, u, s] of HAZE) {
    const flow = ((u - zoom - (calm ? 0 : t * 0.004)) % 1 + 1) % 1, rad = R * 1.5 * flow ** 1.4 * pull;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    ctx.globalAlpha = amount * Math.min(1, flow * 6) * Math.min(1, (1 - flow) * 5) * 0.75;
    ctx.fillStyle = hashColor(a); ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function hashColor(a) { return a % 1 < 0.72 ? "#ff5f7e" : "#5fe6cf"; }
function starColor(m) { return m > 16 ? "#9fc4ff" : m > 2 ? "#e9eeff" : m > 0.8 ? "#ffe2a0" : "#ff9a5c"; }
function star(cx, cy, size, m, t) {
  glow(cx, cy, size * 5, starColor(m), 0.28);
  glow(cx, cy, size * 2, starColor(m), 0.75);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, size * (calm ? 1 : 1 + Math.sin(t * 2) * 0.03), 0, 6.283); ctx.fill();
}
function diskScene(run, cx, cy, R, t, meta) {
  const tilt = 0.42, maxR = Math.log(3000);
  const total = Math.max(run.collapseMass, 1);
  if (run.envelope > 0) glow(cx, cy, R * 1.4, "#ff5f7e", 0.14 + 0.2 * run.envelope / total);
  run.diskMasses.forEach((m, i) => {
    const rad = R * 0.1 + R * 0.9 * Math.log(E.RADII[i]) / maxR;
    const bright = Math.max(0, Math.min(1, (Math.log10(m + 1e-9) + 3.5) / 3.5));
    ctx.globalAlpha = 0.08 + 0.5 * bright; ctx.strokeStyle = i % 2 ? "#ff5f7e" : "#ffb86b"; ctx.lineWidth = 1 + bright * R * 0.016;
    ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * tilt, -0.32, 0, 6.283); ctx.stroke();
  });
  ctx.globalAlpha = 1;
  const landing = R * 0.1 + R * 0.9 * Math.log(E.feedRadius(run)) / maxR;
  ctx.strokeStyle = "#ffb86b"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.ellipse(cx, cy, landing, landing * tilt, -0.32, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 1; ctx.fillStyle = "#ffb86b"; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
  ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.strokeText("Gas lands here", cx, cy + landing * tilt + 22); ctx.fillText("Gas lands here", cx, cy + landing * tilt + 22);
  const flow = E.alpha(run, meta) * 2.4;
  for (let i = 0; i < 46; i++) {
    const a = hash(i, 13) * 6.283, f = ((hash(i, 14) - (calm ? 0 : t * flow)) % 1 + 1) % 1, rad = R * 0.1 + (landing - R * 0.1) * f, turn = a + (calm ? 0 : t * (0.7 + 0.5 / (0.3 + f)));
    const px = Math.cos(turn) * rad, py = Math.sin(turn) * rad * tilt, cosT = Math.cos(-0.32), sinT = Math.sin(-0.32);
    ctx.globalAlpha = 0.85 * Math.min(1, f * 5); ctx.fillStyle = "#ffe9c9";
    ctx.beginPath(); ctx.arc(cx + px * cosT - py * sinT, cy + px * sinT + py * cosT, 1.6, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const wind = Math.min(1, E.diskLossRate(run.starMass, E.feedRadius(run)) / 3e-4);
  for (let i = 0; i < 70 * wind; i++) {
    const a = hash(i, 11) * 6.283, f = ((hash(i, 12) + (calm ? 0 : t * 0.08)) % 1), rad = R * (0.1 + f * 1.1);
    ctx.globalAlpha = (1 - f) * 0.7; ctx.fillStyle = "#5fe6cf";
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 1.3, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (run.starMass > 0) star(cx, cy, run.ignited ? R * 0.022 * (2 + Math.log10(run.starMass + 1) * 2) : R * 0.02, run.ignited ? run.starMass : 0.3, t);
}
function deathScene(run, cx, cy, R, t) {
  if (!lastDeath) lastDeath = t;
  const age = calm ? 3 : t - lastDeath, k = run.kind;
  if (k === "supernova" || k === "pair_instability") {
    const f = Math.min(1, age / 6), rad = R * (0.1 + 1.1 * Math.sqrt(f));
    glow(cx, cy, rad * 1.4, "#ff5f7e", 0.4 * (1 - f * 0.5));
    ctx.lineWidth = 3; ctx.strokeStyle = "#5fe6cf"; ctx.globalAlpha = 0.9 - f * 0.4; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.283); ctx.stroke();
    ctx.globalAlpha = Math.max(0, 1 - age); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    if (k === "supernova") star(cx, cy, 2.5, 30, t);
  } else if (k === "black_hole") {
    ctx.lineWidth = R * 0.05; ctx.strokeStyle = "#ffb86b"; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.3, R * 0.12, -0.32, 0, 6.283); ctx.stroke();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.13, 0, 6.283); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = "#ffb86b"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.15, 0, 6.283); ctx.stroke();
  } else if (k === "white_dwarf") {
    ctx.lineWidth = R * 0.03; ctx.strokeStyle = "#5fe6cf"; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(cx, cy, R * Math.min(0.5, 0.1 + age * 0.08), 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
    star(cx, cy, 3, 3, t);
  } else {
    glow(cx, cy, R * 0.2, "#a2543e", 0.7); ctx.fillStyle = "#6e3425"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.05, 0, 6.283); ctx.fill();
  }
}
function draw(t) {
  const { run, meta } = state, cx = W / 2, cy = H / 2 + (W < 500 ? 12 : 0), R = Math.min(W, H) * 0.42;
  ctx.fillStyle = "#0c0a1c"; ctx.fillRect(0, 0, W, H);
  for (const [x, y, b] of BACK) { ctx.globalAlpha = b * 0.5; ctx.fillStyle = "#cfc8ff"; ctx.fillRect(x * W, y * H, 1.3, 1.3); }
  ctx.globalAlpha = 1;
  const lr = run.logReach / Math.LN10;
  if (state.view === "search") { drawGrid(cx, cy, R, 0.16, 0); hazeScene(run, cx, cy, R, t, 0.5, 1); return; }
  if (run.phase !== "ended") lastDeath = 0;
  if (run.phase === "gather") {
    drawGrid(cx, cy, R, Math.min(0.2, Math.max(0, (lr - 16.5) / 4)), Math.min(0.22, Math.max(0, (lr - 16.5) * 0.06)));
    const N = E.patchMass(run) * 1.989e33 / 2.04e-24, haze = Math.min(1, Math.max(0, (Math.log10(N) - 2.5) / 2));
    hazeScene(run, cx, cy, R, t, haze, 1);
    atomScene(run, cx, cy, R, t);
    const startLog = Math.log(1.5 / run.density ** (1 / 3)), limit = E.jeansLogReach(run, meta);
    const done = Math.min(1, (run.logReach - startLog) / (limit - startLog));
    ctx.strokeStyle = "#ffb86b"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.92, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#ff5f7e"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, R * 0.92 * done), 0, 6.283); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = "#ffb86b"; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
    ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.strokeText("Collapse limit", cx, cy + R * 0.92 + 16); ctx.fillText("Collapse limit", cx, cy + R * 0.92 + 16);
    glow(cx, cy, R * (0.25 + 0.75 * Math.min(1, Math.max(0, lr / 19))), "#ff5f7e", 0.1 + 0.3 * Math.min(1, Math.max(0, lr / 19)));
  } else if (run.phase === "collapse") {
    const f = 1 - run.collapseLeft / E.COLLAPSE_SECONDS;
    drawGrid(cx, cy, R, 0.2, 0.22 + f * 0.3);
    hazeScene(run, cx, cy, R, t, 1, 1 - f * 0.85);
    glow(cx, cy, R * (1 - f * 0.55), "#ff5f7e", 0.3 + f * 0.5);
  } else if (run.phase === "accrete") {
    drawGrid(cx, cy, R * 1.4, 0.18, 0.5);
    diskScene(run, cx, cy, R, t, meta);
  } else if (run.phase === "main_sequence") {
    drawGrid(cx, cy, R * 1.4, 0.1, 0.3);
    shineScene(run, meta, cx, cy, R, t);
  } else {
    drawGrid(cx, cy, R * 1.4, 0.16, run.kind === "black_hole" ? 0.72 : 0.3);
    deathScene(run, cx, cy, R, t);
  }
  for (const r of ripple) { const age = t - r; ctx.globalAlpha = Math.max(0, 0.5 - age); ctx.strokeStyle = "#5fe6cf"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R * (0.2 + age * 1.4), 0, 6.283); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ripple = ripple.filter((r) => t - r < 0.6);
}
function press() {
  if (state.view !== "play" || state.run.phase !== "gather") return;
  E.tap(state.run, state.meta);
  ripple.push(performance.now() / 1000);
  update();
}
canvas.addEventListener("pointerdown", press);
canvas.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); press(); } });

let then = performance.now(), paint = 0, saved = 0;
function frame(now) {
  const seconds = Math.min((now - then) / 1000, 86400 * 30);
  then = now;
  if (state.view === "play") E.step(state.run, state.meta, seconds * state.speed);
  if (now - paint > 200 || seconds > 1) { update(); paint = now; }
  if (now - saved > 5000) { save(); saved = now; }
  draw(now / 1000);
  requestAnimationFrame(frame);
}
function start(data) {
  if (data?.run) Object.assign(state, data); else load();
  resize(); update(); requestAnimationFrame(frame);
}
window.accretion = state;
window.claude?.hot?.snapshot?.(() => ({ meta: state.meta, run: state.run, view: state.view, seen: state.seen, log: state.log, skipped: state.skipped, noted: state.noted }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
addEventListener("pagehide", save);
