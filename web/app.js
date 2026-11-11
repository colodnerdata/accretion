const E = Engine;
const SAVE_KEY = "accretion-prototype-v4";
const $ = (id) => document.getElementById(id);
const state = { meta: E.newMeta(), run: null, view: "play", pane: "main", speed: 1, log: [], seen: {}, resetArm: false, skipped: false, noted: 0, hint: { key: "", tier: 0 }, selected: null, open: {}, prospective: null, zoom: 1 };
state.run = E.newRun(state.meta);
state.prospective = E.newRun(state.meta);
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
// The Sun's main sequence lasts about 10 billion years. Quote both lifetimes in one unit so they compare directly.
function lifeVsSun(forecastMyr) {
  const gyr = forecastMyr >= 1000;
  // The Sun's main sequence lasts about 10 billion years; both lifetimes are
  // quoted in one unit so they compare directly.
  return t("notes.shine.sun_compare", {
    life: `${sci(gyr ? forecastMyr / 1000 : forecastMyr)} ${gyr ? "Gyr" : "Myr"}`,
    sun: gyr ? "10 Gyr" : "10,000 Myr",
  });
}
function clock(seconds) {
  const s = Math.max(0, Math.ceil(seconds)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, pad = (x) => String(x).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

// Player-facing text lives in content/*.toml. The build validates the files and
// embeds them as TEXT; t() looks a key up and fills named placeholders with
// finished strings. A missing key or placeholder degrades instead of throwing.
function t(key, values = {}) {
  const raw = typeof TEXT?.[key] === "string" ? TEXT[key] : null;
  if (raw == null) { console.warn(`Text key not found: ${key}`); return `[missing: ${key}]`; }
  return raw.replace(/\{([a-z][a-z0-9_]*)\}/g, (whole, name) => {
    const value = Object.prototype.hasOwnProperty.call(values, name) ? values[name] : undefined;
    if (value != null) return String(value);
    console.warn(`Placeholder {${name}} not supplied for key: ${key}`);
    return `[missing: ${key}.${name}]`;
  });
}

// Canvas-drawn labels. The sky scene functions take the frame time as `t`, so
// they read these instead of calling the lookup by that name.
const SKY_TEXT = {
  ionizationFront: t("ui.canvas.ionization_front"),
  ionizationFrontStalled: t("ui.canvas.ionization_front_stalled"),
  gasLands: t("ui.canvas.gas_lands"),
  collapseLimit: t("ui.canvas.collapse_limit"),
  coreHydrogen: t("ui.canvas.core_hydrogen"),
  heliumAsh: t("ui.canvas.helium_ash"),
  keyHydrogen: t("ui.canvas.key_hydrogen"),
  keyHelium: t("ui.canvas.key_helium"),
  keyMetals: t("ui.canvas.key_metals"),
  metalsNote: t("ui.canvas.metals_note"),
  gauge: t("ui.canvas.gauge"),
  gaugeFloor: t("ui.canvas.gauge_floor"),
  blackHolePull: t("ui.canvas.black_hole_pull"),
};

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
  // "How it fuses" joins one fusion route and one later-fate entry, as it did before the move.
  const route = m < 1.3 ? t("notes.shine.fusion_route.pp")
    : run.metalLog10 < E.PRIMORDIAL_METAL_LOG10 ? t("notes.shine.fusion_route.cno_pristine")
      : t("notes.shine.fusion_route.cno_enriched");
  const future = m < 0.5 ? t("notes.shine.fusion_future.never_helium")
    : m < 9 ? t("notes.shine.fusion_future.stops_at_carbon")
      : t("notes.shine.fusion_future.ends_in_iron");
  const notes = [
    [0, t("notes.shine.main_sequence.title"), t("notes.shine.main_sequence.body")],
    [0.08, t("notes.shine.fast_time.title"), t("notes.shine.fast_time.body", { years_per_second: sci(years), history_seconds: sci(5000 / years) })],
    [0.2, t("notes.shine.brightness.title"), heavy
      ? t("notes.shine.brightness_heavy.body", { brightness: sci(L), life_vs_sun: lifeVsSun(run.forecastMyr) })
      : t("notes.shine.brightness_small.body", { brightness: sci(L), life_vs_sun: lifeVsSun(run.forecastMyr) })],
    [0.35, t("notes.shine.how_it_fuses.title"), `${route} ${future}`],
    [0.5, t("notes.shine.starlight.title"), b
      ? t("notes.shine.starlight_bubble.body", { edge_distance: length(b.now) })
      : t("notes.shine.starlight_cool.body")],
    [0.7, t("notes.shine.helium_ash.title"), t("notes.shine.helium_ash.body")],
    [0.9, t("notes.shine.running_low.title"), t("notes.shine.running_low.body")],
  ];
  if (b) notes.push([Math.max(0.12, b.stallShare), t("notes.shine.bubble_stalls.title"), t("notes.shine.bubble_stalls.body", { edge_distance: length(b.end) })]);
  return notes.sort((x, y) => x[0] - y[0]);
}

const PHASES = [["survey", t("ui.phases.survey")], ["gather", t("ui.phases.gather")], ["collapse", t("ui.phases.collapse")], ["accrete", t("ui.phases.accrete")], ["main_sequence", t("ui.phases.main_sequence")], ["ended", t("ui.phases.ended")]];
const ENDINGS = {
  brown_dwarf: { title: t("endings.brown_dwarf.title"), description: t("endings.brown_dwarf.description") },
  white_dwarf: { title: t("endings.white_dwarf.title"), description: t("endings.white_dwarf.description") },
  supernova: { title: t("endings.supernova.title"), description: t("endings.supernova.description") },
  black_hole: { title: t("endings.black_hole.title"), description: t("endings.black_hole.description") },
  pair_instability: { title: t("endings.pair_instability.title"), description: t("endings.pair_instability.description") },
};
const CONTROL_NOTES = {
  reach: t("notes.controls.reach"),
  tap: t("notes.controls.tap"),
  turbulence: t("notes.controls.turbulence"),
  temperature: t("notes.controls.temperature"),
  density: t("notes.controls.density"),
  braking: t("notes.controls.braking"),
  cooling: t("notes.controls.cooling"),
  metals: t("notes.controls.metals"),
};
const nextLevel = (run, name) => ({ ...run, levels: { ...run.levels, [name]: run.levels[name] + 1 } });
const UPGRADE_TEXT = {
  reach: [t("ui.upgrades.reach"), () => t("notes.upgrades.reach")],
  tap: [t("ui.upgrades.tap"), () => t("notes.upgrades.tap")],
  cooling: [t("ui.upgrades.cooling"), (r, m) => {
    const a = E.temperature(r, m), b = E.temperature(nextLevel(r, "cooling"), m);
    if (b >= a) return t("notes.upgrades.cooling_maxed");
    return t("notes.upgrades.cooling", { temp_now: a.toFixed(0), temp_next: b.toFixed(0), jeans_now: sci(E.jeansMass(a, r.density)), jeans_next: sci(E.jeansMass(b, r.density)) });
  }],
  turbulence: [t("ui.upgrades.turbulence"), () => t("notes.upgrades.turbulence")],
  braking: [t("ui.upgrades.braking"), (r) => t("notes.upgrades.braking", { distance_new: E.feedRadius(nextLevel(r, "braking")).toFixed(0), distance_old: E.feedRadius(r).toFixed(0) })],
};
const MILESTONES = [
  [0.6, "cm", (run) => t("notes.milestones.cm", { density: sci(run.density) })],
  [4.6, "m", () => t("notes.milestones.m")],
  [20.9, "earth", () => t("notes.milestones.earth")],
  [30.3, "au", () => t("notes.milestones.au")],
  [41.4, "ly", () => t("notes.milestones.ly")],
];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// A note describes one moment, so it is stamped with the phase and run time it belongs to.
// Once the run moves past that phase, or the note's lifetime in run seconds runs out, it is
// "earlier": collapsed out of sight but still available to open.
const phaseIndex = (p) => PHASES.findIndex(([name]) => name === p);
const NOTE_SECONDS = 30;
function asNote(n) { return typeof n === "string" ? { text: n, p: -1, at: 0, ttl: 0 } : { ...n, ttl: n.ttl ?? Infinity }; }
function note(text, { phase = state.run.phase, ttl = NOTE_SECONDS, tag = undefined } = {}) {
  if ($("live")) $("live").textContent = text;
  // unlock-tagged notes are announcements, not observations: the journal
  // card filters them by tag, never by their first word.
  state.log.unshift({ text, p: phaseIndex(phase), at: state.run.seconds, ttl, tag });
  state.log = state.log.slice(0, 40);
}
function noteExpired(n, run) { return phaseIndex(run.phase) > n.p || run.seconds - n.at > n.ttl; }
function checkMilestones() {
  const run = state.run, seen = state.seen, meta = state.meta;
  for (const [lr, key, text] of MILESTONES) {
    if (run.logReach >= lr && !seen[key]) { seen[key] = 1; note(text(run)); }
  }
  if (run.phase === "gather" && E.patchMass(run) >= 1 && !seen.sun) { seen.sun = 1; note(t("notes.observations.sun_mass")); }
  if (run.phase === "collapse" && !seen.collapse) { seen.collapse = 1; note(t("notes.observations.collapse")); }
  if (run.ignited && !seen.ignite) { seen.ignite = 1; note(t("notes.observations.ignite")); }
  if (run.phase === "main_sequence" && !seen.ms) { seen.ms = 1; note(t("notes.observations.final_mass", { mass: sci(run.starMass) })); }
  while (state.noted < meta.unlocks.length) {
    // A new control's note stays current through the phase where the control is used.
    const name = meta.unlocks[state.noted++], where = E.UPGRADES[name]?.phase ?? "gather";
    note(CONTROL_NOTES[name], { phase: where, ttl: Infinity, tag: "unlock" });
  }
}

function save() {
  // logShape 2: note phase indices include the display-only Survey step.
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ meta: state.meta, run: state.run, view: state.view, seen: state.seen, log: state.log, skipped: state.skipped, noted: state.noted, logShape: 2, savedAt: Date.now() })); } catch {}
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved?.run) return;
    // Notes saved before Survey joined PHASES carry indices one lower than
    // today's; re-stamp them so nothing old expires a phase early. Saves
    // written after (logShape 2) already carry the new indices.
    const bump = saved.logShape ? 0 : 1;
    Object.assign(state, { meta: saved.meta, run: saved.run, view: saved.view, seen: saved.seen || {}, log: (saved.log || []).map((n) => { const m = asNote(n); return m.p < 0 ? m : { ...m, p: m.p + bump }; }), skipped: !!saved.skipped, noted: saved.noted || 0 });
    state.prospective = E.newRun(state.meta);
    const away = (Date.now() - saved.savedAt) / 1000;
    if (away > 60 && state.view === "play") {
      const before = state.run.phase;
      E.step(state.run, state.meta, away);
      checkMilestones();
      const now = state.run.phase, stage = PHASES.find(([p]) => p === now)[1].toLowerCase();
      const happened = now === "ended"
        ? (ENDINGS[state.run.kind] ? t("ui.away.ended", { ending: ENDINGS[state.run.kind].title.toLowerCase() }) : t("ui.away.ended_plain"))
        : t("ui.away.stage", { stage: stage });
      note(`${t("ui.away.note", { time: duration(away) })}${before !== now ? ` ${happened}` : ""}`);
      if (before !== now) state.banner = t("ui.away.banner", { time: duration(away), event: happened[0].toLowerCase() + happened.slice(1) });
    }
  } catch {}
}

// Shows current items in place and tucks expired ones into a closed <details> that stays openable.
function paintFolded(id, foldId, items, render, label, empty) {
  const now = items.filter((i) => !i.expired).slice(0, 4), old = items.filter((i) => i.expired);
  const html = now.map(render).join("") || (empty ? `<div>${empty}</div>` : "");
  const fresh = $(id).dataset.html !== html;
  if (fresh) { $(id).dataset.html = html; $(id).innerHTML = html; }
  const fold = $(foldId), body = old.map(render).join(""), sig = `${label}|${old.length}|${body}`;
  if (fold.dataset.sig === sig) return;
  fold.dataset.sig = sig;
  fold.innerHTML = old.length ? `<details${state.open[foldId] ? " open" : ""}><summary>${label} (${old.length})</summary>${body}</details>` : "";
  const d = fold.firstElementChild;
  if (d) d.addEventListener("toggle", () => { state.open[foldId] = d.open; });
}
function button(cls, text, on) { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = text; b.onclick = on; return b; }
function stat(list) { return `<dl class="stats">${list.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`; }

function goal() {
  const m = state.meta, seen = new Set(m.journal.map((j) => j.ending));
  if (!m.supernovae) return t("notes.goals.first");
  if (!seen.has("black_hole")) return t("notes.goals.black_hole");
  if (!seen.has("white_dwarf")) return t("notes.goals.white_dwarf");
  return t("notes.goals.explore");
}
function headline() {
  const { run, meta } = state;
  if (run.phase === "gather") return [t("notes.headlines.gather.title"), t("notes.headlines.gather.body", { mass_needed: mass(E.jeansMass(E.temperature(run, meta), run.density)) })];
  if (run.phase === "collapse") return [t("notes.headlines.collapse.title"), t("notes.headlines.collapse.body", { fall_time: myr(E.freeFallTime(run.density) / 3.156e13) })];
  if (run.phase === "accrete") return run.ignited
    ? [t("notes.headlines.accrete_star.title"), t("notes.headlines.accrete.body")]
    : [t("notes.headlines.accrete_protostar.title"), t("notes.headlines.accrete.body")];
  return [t("notes.headlines.shine.title"), t("notes.headlines.shine.body")];
}
function progress() {
  const { run, meta } = state;
  if (run.phase === "gather") {
    const startLog = Math.log(1.5 / run.density ** (1 / 3)), limit = E.jeansLogReach(run, meta);
    return [(run.logReach - startLog) / (limit - startLog), t("ui.progress.gather"), t("ui.progress.percent", { percent: Math.round((run.logReach - startLog) / (limit - startLog) * 100) })];
  }
  if (run.phase === "collapse") return [1 - run.collapseLeft / E.COLLAPSE_SECONDS, t("ui.phases.collapse"), duration(run.collapseLeft / state.speed)];
  if (run.phase === "accrete") { const gas = E.gas(run); return [1 - gas / run.collapseMass, t("ui.progress.accrete"), t("ui.progress.gas_left", { amount: sci(gas) })]; }
  return [burned(run), t("ui.progress.shine"), t("ui.progress.percent", { percent: Math.floor(burned(run) * 100) })];
}
function statsFor() {
  const { run, meta } = state;
  if (run.phase === "gather") return [[t("ui.stats.reach"), length(Math.exp(run.logReach))], [t("ui.stats.patch_mass"), mass(E.patchMass(run))], [t("ui.stats.mass_needed"), mass(E.jeansMass(E.temperature(run, meta), run.density))], [t("ui.stats.temperature"), `${E.temperature(run, meta).toFixed(0)} K`], [t("ui.stats.energy"), `${sci(run.energy)} erg`]];
  if (run.phase === "collapse") return [[t("ui.stats.cloud_mass"), `${sci(run.collapseMass)} M☉`], [t("ui.stats.temperature"), `${E.temperature(run, meta).toFixed(0)} K`], [t("ui.stats.energy"), `${sci(run.energy)} erg`]];
  if (run.phase === "accrete") {
    const disk = run.diskMasses.reduce((a, b) => a + b, 0);
    return [[t("ui.stats.star"), `${sci(run.starMass)} M☉`], [t("ui.stats.in_the_disk"), `${sci(disk)} M☉`], [t("ui.stats.still_to_reach"), `${sci(run.envelope)} M☉`], [t("ui.stats.landing_rate"), `${sci(E.infallNow(run, meta))} M☉/yr`], [t("ui.stats.boiled_off"), `${sci(E.diskLossRate(run.starMass, E.feedRadius(run)))} M☉/yr`], [t("ui.stats.companion_stars"), `${sci(run.companions)} M☉`], [t("ui.stats.energy"), `${sci(run.energy)} erg`]];
  }
  const b = bubble(run, meta);
  return [[t("ui.stats.star"), `${sci(run.starMass)} M☉`], [t("ui.stats.brightness"), `${sci(E.luminosity(run.starMass, run.metalLog10))} Suns`], [t("ui.stats.forecast_life"), myr(run.forecastMyr)], [t("ui.stats.age"), myr(run.msElapsed / run.msDuration * run.lifetimeMyr)], ...(b ? [[t("ui.stats.ionized_bubble"), t("ui.stats.ionized_bubble_value", { size: length(b.now) })]] : [])];
}

// Hints use what has actually happened in this save, and go one step deeper each time.
function hintSet() {
  const { run, meta, view } = state, dense = meta.unlocks.includes("density");
  // On the ended pane the run is not journaled yet, so read the ending from the run itself.
  const last = view === "play" && run.phase === "ended" ? { ending: run.kind } : meta.journal.at(-1);
  if (view === "play" && run.phase === "gather") {
    if (!meta.unlocks.includes("reach")) return ["start", t("hints.start.tier1"), t("hints.start.tier2"), t("hints.start.tier3")];
    if (run.levels.reach === 0) return ["reach", t("hints.reach.tier1"), t("hints.reach.tier2"), t("hints.reach.tier3")];
    return ["gather", t("hints.gather.tier1"), t("hints.gather.tier2"), t("hints.gather.tier3")];
  }
  if (view === "play" && run.phase === "accrete") return ["accrete", t("hints.accrete.tier1"), t("hints.accrete.tier2"), t("hints.accrete.tier3")];
  if (view === "play" && run.phase === "main_sequence") return ["shine", t("hints.shine.tier1"), t("hints.shine.tier2"), t("hints.shine.tier3")];
  if (last && (last.ending === "white_dwarf" || last.ending === "brown_dwarf")) return ["small", t("hints.small.tier1"), dense ? t("hints.small.tier2_with_density") : t("hints.small.tier2"), t("hints.small.tier3")];
  if (last?.ending === "black_hole") return ["big", t("hints.big.tier1"), dense ? t("hints.big.tier2_with_density") : t("hints.big.tier2"), t("hints.big.tier3")];
  if (last) return ["compare", t("hints.compare.tier1"), t("hints.compare.tier2"), t("hints.compare.tier3")];
  return ["none", t("hints.none.tier1"), t("hints.none.tier2"), t("hints.none.tier3")];
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
  box.append(button("ghost", t("ui.hints.ask"), askHint));
  box.lastChild.id = "hint-button";
  return box;
}
function paintHints() {
  const area = $("hints"); if (!area) return;
  const set = hintSet(), key = set[0], lines = set.slice(1).filter(Boolean);
  const tier = state.hint.key === key ? state.hint.tier : 0;
  const html = lines.slice(0, tier).map((line) => `<p class="hint">${esc(line)}</p>`).join("");
  if (area.dataset.html !== html) { area.dataset.html = html; area.innerHTML = html; }
  // Nudge only when the player can act on it: choosing a region or looking at an ending.
  const nudge = !tier && stuck() && (state.view === "search" || state.run.phase === "ended");
  const b = $("hint-button"), label = tier ? t("ui.hints.more") : nudge ? t("ui.hints.available") : t("ui.hints.ask");
  b.hidden = tier >= lines.length;
  if (b.textContent !== label) b.textContent = label;
  b.classList.toggle("nudge", nudge);
}

let shell = "";
function renderShell() {
  const ended = state.run.phase === "ended";
  const view = state.pane === "journal" ? "journal" : state.view === "search" ? "search" : ended ? "ended" : "play";
  const key = `${view}:${state.run.phase}:${state.meta.unlocks.length}:${state.meta.journal.length}:${state.banner ? 1 : 0}`;
  if (key === shell) return;
  const sameView = shell.startsWith(`${view}:`);
  shell = key;
  const panel = $("panel"), top = sameView ? panel.scrollTop : 0;
  // Rebuilding drops keyboard focus, so remember what had it and put it back.
  const was = document.activeElement, inPanel = panel.contains(was);
  const refocus = inPanel ? (was.id ? `#${was.id}` : was.dataset?.i != null ? `${was.localName}[data-i="${was.dataset.i}"]` : was.dataset?.s != null ? `button[data-s="${was.dataset.s}"]` : "") : "";
  panel.textContent = "";
  if (state.banner) {
    const banner = document.createElement("section");
    banner.className = "banner";
    banner.innerHTML = `<p>${esc(state.banner)}</p>`;
    banner.append(button("ghost", t("ui.banner.dismiss"), () => { state.banner = null; update(); }));
    panel.appendChild(banner);
  }
  if (view === "ended") renderEnded(panel);
  else if (view === "search") renderSearch(panel);
  else if (view === "journal") renderJournal(panel);
  else renderPlay(panel);
  if (view !== "journal") panel.appendChild(hintBlock());
  panel.appendChild(footer());
  panel.scrollTop = top;
  paintHints();
  if (inPanel) {
    const target = (sameView && refocus && panel.querySelector(refocus)) || panel.querySelector("h2");
    if (target) { if (target.localName === "h2") target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }
}
function renderPlay(panel) {
  const shine = state.run.phase === "main_sequence";
  panel.insertAdjacentHTML("beforeend", `<section><p class="goal" id="goal"></p><h2 id="head"></h2><p id="sub"></p></section>
    ${shine ? `<section class="countdown"><b id="count"></b><span id="count-note"></span></section>` : ""}
    <section><div class="meter"><i id="meter"></i></div><div class="meter-note"><span id="meter-a"></span><span id="meter-b"></span></div></section>
    <section id="upgrade-box"><h3>${esc(t("ui.play.controls_title"))}</h3><p class="fine">${esc(t("ui.play.controls_note"))}</p><div class="upgrades" id="upgrades"></div></section>
    <section><div id="stats"></div></section>
    ${shine ? `<section><h3>${esc(t("ui.play.field_notes"))}</h3><div id="reading" class="reading"></div><div id="reading-earlier" class="earlier reading"></div></section>` : ""}
    <section id="skip-box" hidden></section><section><h3>${esc(t("ui.play.observations"))}</h3><div id="log"></div><div id="log-earlier" class="earlier"></div></section>`);
  const list = $("upgrades");
  const names = Object.keys(E.UPGRADES).filter((n) => E.UPGRADES[n].phase === state.run.phase && state.meta.unlocks.includes(n));
  $("upgrade-box").hidden = !names.length;
  for (const name of names) {
    // One row per control: name and level outside the button, effect text,
    // and a buy button whose accessible name carries the control and cost.
    const row = document.createElement("div");
    row.className = "control"; row.id = `urow-${name}`;
    row.innerHTML = `<span class="u-head"><b></b><span class="level"></span></span><small></small>`;
    const b = document.createElement("button");
    b.type = "button"; b.className = "buy"; b.id = `up-${name}`;
    b.innerHTML = `<span class="cost"></span>`;
    b.onclick = () => { if (E.buy(state.run, name, state.meta)) { update(); save(); } };
    row.append(b);
    list.appendChild(row);
  }
  const skipLabel = t("ui.skip.label");
  let armed = false, timer;
  const skip = button("ghost skip", skipLabel, () => {
    if (!armed) {
      armed = true; skip.textContent = t("ui.skip.confirm"); skip.classList.add("armed");
      if ($("live")) $("live").textContent = t("ui.skip.live");
      timer = setTimeout(() => { armed = false; skip.textContent = skipLabel; skip.classList.remove("armed"); }, 3000);
      return;
    }
    clearTimeout(timer); state.skipped = true; E.skip(state.run, state.meta); update();
  });
  skip.id = "skip";
  $("skip-box").append(skip, Object.assign(document.createElement("p"), { id: "skip-note" }));
}
const BANDS = [["brown_dwarf", t("endings.bands.brown_dwarf.label"), t("endings.bands.brown_dwarf.range")], ["white_dwarf", t("endings.bands.white_dwarf.label"), t("endings.bands.white_dwarf.range")], ["supernova", t("endings.bands.supernova.label"), t("endings.bands.supernova.range")], ["black_hole", t("endings.bands.black_hole.label"), t("endings.bands.black_hole.range")]];
function outcomeBands(current) {
  const seen = new Set(state.meta.journal.map((j) => j.ending));
  if (current) seen.add(current);
  return `<div class="bands">${BANDS.map(([kind, label, range]) => `<div class="band${kind === current ? " now" : ""}"><b>${esc(seen.has(kind) ? label : "?")}</b><span>${esc(seen.has(kind) ? range : t("ui.journal.not_seen"))}</span></div>`).join("")}</div>`;
}
function renderEnded(panel) {
  const { run, meta } = state;
  const { title, description } = ENDINGS[run.kind];
  const gain = E.runGain(run), released = E.heavyYield(run.starMass, run.kind, run.metalLog10);
  const after = meta.regions * Math.exp(gain);
  const beyond = !state.skipped && run.lifetimeMyr > run.forecastMyr * 1.01;
  if (beyond && !state.seen.anomaly) { state.seen.anomaly = 1; note(t("notes.observations.anomaly", { percent: Math.round((run.lifetimeMyr / run.forecastMyr - 1) * 100) })); }
  panel.insertAdjacentHTML("beforeend", `<section><h3>${esc(state.skipped ? t("ui.ended.heading_forecast") : t("ui.ended.heading"))}</h3><h2>${esc(title)}</h2><p>${esc(description)}</p>
    ${state.skipped || run.skipped ? `<p>${esc(t("ui.ended.left_early_note"))}</p>` : ""}
    ${beyond ? `<p class="tag">${esc(`${t("notes.observations.anomaly", { percent: Math.round((run.lifetimeMyr / run.forecastMyr - 1) * 100) })} ${t("ui.ended.anomaly_cause")}`)}</p>` : ""}</section>
    <section><h3>${esc(t("ui.ended.final_mass_heading", { mass: sci(run.starMass) }))}</h3>${outcomeBands(run.kind)}</section>
    <section>${stat([[t("ui.stats.blown_away"), `${sci(run.ejected)} M☉`], [t("ui.stats.companion_stars"), `${sci(run.companions)} M☉`], [t("ui.stats.run_time"), duration(run.seconds)], [t("ui.stats.regions_surveyed"), `${sci(meta.regions)} → ${sci(after)}`], [t("ui.stats.probability"), `${E.budget(meta).toFixed(2)} → ${Math.log(after).toFixed(2)}`], ...(released > 0 ? [[t("ui.stats.heavy_elements"), `+${sci(released)} M☉`]] : [])])}<p class="fine">${esc(t("ui.ended.fine"))}</p></section>`);
  const box = document.createElement("section");
  box.className = "cta";
  box.append(button("primary", t("ui.ended.survey_button"), () => {
    // Unlock announcements are tagged, not matched by their first word.
    const notes = state.log.filter((n) => !n.tag).map((n) => n.text);
    state.run = E.prestige(state.run, state.meta, state.skipped);
    state.meta.journal.at(-1).notes = notes;
    state.selected = state.meta.journal.length - 1;
    state.skipped = false; state.seen = {}; state.log = []; state.view = "search"; state.banner = null; shell = ""; update(); save();
  }));
  panel.appendChild(box);
}
function fieldRow(id, label, key, text, [low, high]) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.innerHTML = `<span>${esc(label)}</span><output id="${id}-out"></output><small>${esc(text)}</small><input id="${id}" type="range" min="-3" max="3" step="0.1"><span class="scale" aria-hidden="true"><span>${esc(low)}</span><span>${esc(t("ui.search.no_cost"))}</span><span>${esc(high)}</span></span>`;
  const input = wrap.querySelector("input");
  input.value = state.meta[key];
  input.oninput = () => {
    const m = state.meta, old = m[key];
    m[key] = Number(input.value);
    $("limit").hidden = true;
    if (E.regionCost(m) > E.budget(m) + 1e-9) {
      const others = E.regionCost({ ...m, [key]: 0 });
      const limit = Math.sqrt(Math.max(0, 2 * (E.budget(m) - others)));
      m[key] = Math.sign(m[key]) * Math.floor(limit * 10) / 10;
      input.value = m[key];
      $("limit").hidden = false;
    }
    if (old !== m[key]) refreshSearch();
  };
  return wrap;
}
function refreshSearch() {
  const m = state.meta, run = E.newRun(m), T = E.temperature(run, m);
  state.prospective = run;
  // Composition changes re-judge the shop's cooling bound, so repaint it.
  document.querySelectorAll("#heavy-list button").forEach((b) => b.paint && b.paint());
  if ($("density-out")) $("density-out").textContent = `${sci(run.density)} /cm³`;
  if ($("temperature-out")) $("temperature-out").textContent = `${run.baseTemperature.toFixed(0)} K`;
  if ($("metals-out")) $("metals-out").textContent = `10^${run.metalLog10.toFixed(1)} Z☉`;
  $("spent").textContent = t("ui.search.spent", { spent: E.regionCost(m).toFixed(2), budget: E.budget(m).toFixed(2) });
  $("spent-bar").style.width = `${Math.min(100, E.regionCost(m) / Math.max(E.budget(m), 1e-9) * 100)}%`;
  $("preview").innerHTML = stat([[t("ui.search.odds"), t("ui.search.odds_value", { odds: sci(Math.exp(E.regionCost(m))) })], [t("ui.search.mass_needed"), `${sci(E.jeansMass(T, run.density))} M☉`], [t("ui.search.infall"), `${sci(E.infallRate(T) * run.infallFactor)} M☉/yr`], [t("ui.search.floor_temperature"), `${run.floorTemperature.toFixed(0)} K`], [t("ui.search.metal_content"), `10^${run.metalLog10.toFixed(1)} Z☉`], [t("ui.search.universe_age"), myr(120 + m.cosmicMyr)]]);
}
function renderSearch(panel) {
  const m = state.meta, has = (n) => m.unlocks.includes(n);
  panel.insertAdjacentHTML("beforeend", `<section><p class="goal">${esc(goal())}</p><h2>${esc(t("ui.search.title"))}</h2><p>${esc(t("ui.search.intro"))}</p>
    <div class="meter"><i id="spent-bar" style="background:var(--oiii)"></i></div><div class="meter-note"><span>${esc(t("ui.stats.probability"))}</span><span id="spent"></span></div><p class="fine tag" id="limit" hidden>${esc(t("ui.search.limit"))}</p></section>`);
  const box = document.createElement("section");
  if (has("temperature")) box.append(fieldRow("temperature", t("ui.search.temperature_label"), "zTemperature", t("ui.search.temperature_note"), [t("ui.search.temperature_low"), t("ui.search.temperature_high")]));
  if (has("density")) box.append(fieldRow("density", t("ui.search.density_label"), "zDensity", t("ui.search.density_note"), [t("ui.search.density_low"), t("ui.search.density_high")]));
  if (has("metals")) box.append(fieldRow("metals", t("ui.search.metal_content"), "zMetal", t("ui.search.metals_note"), [t("ui.search.metals_low"), t("ui.search.metals_high")]));
  if (m.blackHoleUnlocked) {
    const row = document.createElement("label"); row.className = "check";
    row.innerHTML = `<input id="bh" type="checkbox"><span>${esc(t("ui.search.bh"))}</span>`;
    const c = row.querySelector("input"); c.checked = m.blackHoleStart;
    c.onchange = () => { m.blackHoleStart = c.checked; if (E.regionCost(m) > E.budget(m) + 1e-9) { m.blackHoleStart = false; c.checked = false; } refreshSearch(); };
    box.append(row);
  }
  const preview = document.createElement("div"); preview.id = "preview"; box.append(preview);
  panel.appendChild(box);
  const items = [["cooling", t("ui.heavy.cooling"), t("ui.heavy.cooling_note")], ["turbulence", t("ui.heavy.turbulence"), t("ui.heavy.turbulence_note")]].filter(([n]) => has(n));
  if (m.heavy > 0 && items.length) {
    const shop = document.createElement("section");
    shop.innerHTML = `<h3></h3><div class="upgrades" id="heavy-list"></div>`;
    panel.appendChild(shop);
    const buttons = [];
    for (const [name, label, text] of items) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "upgrade"; b.id = `heavy-${name}`;
      b.paint = () => {
        const cost = E.heavyCost(m, name), lvl = name === "cooling" ? m.heavyCooling : m.heavyTurbulence;
        // A permanent upgrade is refused once its target rests on a bound:
        // cooling once the cosmic background clamps the region floor,
        // turbulence once disk speed reaches its cap. The button then says
        // so itself, like the in-run upgrades.
        const metalLog10 = E.backgroundMetal(m) + E.SIGMA_LOG10_METAL * m.zMetal;
        const blocked = name === "cooling" ? !E.coolingBoundHelps(m, metalLog10) : !E.turbulenceBoundHelps(m);
        const blockedNote = name === "cooling" ? t("notes.upgrades.cooling_background") : t("notes.upgrades.turbulence_cap");
        b.innerHTML = `<b>${esc(t("ui.upgrades.level_label", { name: label, level: lvl }))}</b><small>${esc(blocked ? blockedNote : text)}</small><span class="cost">${sci(cost)} M☉</span>`;
        b.disabled = m.heavy < cost || blocked;
        shop.querySelector("h3").textContent = t("ui.heavy.heading", { mass: sci(m.heavy) });
      };
      b.onclick = () => {
        // Same run the guard judged: the purchase would be refused for a
        // differently-built one, and the guard and buy must agree.
        if (E.buyHeavy(m, name, E.newRun(m))) { buttons.forEach((x) => x.paint()); refreshSearch(); save(); }
      };
      buttons.push(b);
      $("heavy-list").appendChild(b);
      b.paint();
    }
  }
  const go = document.createElement("section");
  go.className = "cta";
  go.append(button("primary", t("ui.search.begin"), () => { state.run = E.newRun(m); state.view = "play"; state.banner = null; shell = ""; note(t("notes.observations.run_start", { number: m.runs + 1, density: sci(state.run.density), temperature: state.run.baseTemperature.toFixed(0) })); update(); save(); }));
  panel.appendChild(go);
  refreshSearch();
}
const ENDING_MARK = { brown_dwarf: "BD", white_dwarf: "WD", supernova: "SN", black_hole: "BH", pair_instability: "PI" };
const ENDING_COLOR = { brown_dwarf: "var(--dwarf)", white_dwarf: "var(--ink)", supernova: "var(--oiii)", black_hole: "var(--sii)", pair_instability: "var(--halpha)" };
function resultsPlot() {
  const m = state.meta, two = m.unlocks.includes("density"), W = 340, H = two ? 250 : 92;
  const left = two ? 40 : 12, right = W - 12, bottom = H - 34, top = two ? 10 : 8;
  const X = (t) => left + (Math.log10(t) - 1) / 2 * (right - left);
  const Y = (n) => two ? bottom - (Math.log10(n) - 2) / 4 * (bottom - top) : (top + bottom) / 2;
  let out = `<svg class="plot" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(two ? t("ui.journal.plot_aria_density") : t("ui.journal.plot_aria"))}">`;
  for (const t of [10, 100, 1000]) out += `<line x1="${X(t)}" x2="${X(t)}" y1="${top}" y2="${bottom}" class="tick"/><text x="${X(t)}" y="${bottom + 14}" text-anchor="${t === 1000 ? "end" : t === 10 ? "start" : "middle"}">${t}</text>`;
  if (two) for (const e of [2, 3, 4, 5, 6]) out += `<line x1="${left}" x2="${right}" y1="${Y(10 ** e)}" y2="${Y(10 ** e)}" class="tick"/><text x="${left - 6}" y="${Y(10 ** e) + 4}" text-anchor="end">10${SUP[e]}</text>`;
  out += `<text x="${(left + right) / 2}" y="${H - 4}" text-anchor="middle">${esc(t("ui.journal.axis_temperature"))}</text>`;
  if (two) out += `<text x="10" y="${(top + bottom) / 2}" text-anchor="middle" transform="rotate(-90 10 ${(top + bottom) / 2})">${esc(t("ui.journal.axis_density"))}</text>`;
  const sel = state.selected ?? m.journal.length - 1;
  m.journal.forEach((j, i) => {
    // Area follows final mass, down to a minimum size so tiny stars stay visible.
    const r = Math.max(2, 2.1 * Math.sqrt(j.mass)), x = X(Math.min(1000, Math.max(10, j.temperature))), y = Y(j.density), color = ENDING_COLOR[j.ending];
    const label = j.skipped
      ? t("ui.journal.plot_label_early", { number: j.run, ending: ENDINGS[j.ending].title, mass: sci(j.mass), temperature: j.temperature.toFixed(0) })
      : t("ui.journal.plot_label", { number: j.run, ending: ENDINGS[j.ending].title, mass: sci(j.mass), temperature: j.temperature.toFixed(0) });
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="${i === sel ? 0.75 : 0.3}" stroke="${color}" stroke-width="${i === sel ? 2.5 : 1.25}"${j.skipped ? ' stroke-dasharray="3 2"' : ""} role="img" aria-label="${esc(label)}" data-i="${i}"/><text class="mark" x="${x}" y="${Math.max(top + 8, y - r - 3)}" text-anchor="middle">${ENDING_MARK[j.ending]}</text>`;
  });
  return `${out}</svg>`;
}
function entryCard(j) {
  const rows = [[t("ui.journal.row_ending"), ENDINGS[j.ending].title], [t("ui.journal.row_final_mass"), `${sci(j.mass)} M☉`], [t("ui.journal.row_temperature"), `${j.temperature.toFixed(0)} K`], [t("ui.journal.row_density"), `${sci(j.density)} /cm³`], [t("ui.journal.row_turbulence"), t("ui.journal.alpha_value", { value: j.alpha.toFixed(2) })], [t("ui.journal.row_feed"), `${j.feedRadius.toFixed(0)} AU`], [t("ui.journal.row_run_time"), duration(j.seconds)], [t("ui.journal.row_reward"), t("ui.journal.reward", { gain: j.gain.toFixed(2) }) + (j.heavy ? t("ui.journal.reward_heavy", { heavy: sci(j.heavy) }) : "")]];
  // Journals written since the tag exists hold observations only; older
  // saves keep the announcement strings as plain text, so they still get
  // the legacy first-word filter (those old entries are frozen records
  // whose strings are English by construction).
  const notes = (j.notes || []).filter((n) => !String(n).startsWith("New ")).slice(0, 5).reverse();
  return `<section><h3>${esc(j.skipped ? t("ui.journal.run_card_title_early", { number: j.run }) : t("ui.journal.run_card_title", { number: j.run }))}</h3>${stat(rows)}${notes.length ? `<h3>${esc(t("ui.play.observations"))}</h3><div id="log">${notes.map((note) => `<div>${esc(note)}</div>`).join("")}</div>` : ""}</section>`;
}
function renderJournal(panel) {
  const m = state.meta, count = m.journal.length;
  panel.insertAdjacentHTML("beforeend", `<section><h2>${esc(t("ui.journal.title"))}</h2><p>${esc(count ? t("ui.journal.intro") : t("ui.journal.intro_empty"))}</p></section>`);
  if (count) {
    panel.insertAdjacentHTML("beforeend", `<section>${resultsPlot()}<div class="legend">${[...new Set(m.journal.map((j) => j.ending))].map((k) => `<span><i style="background:${ENDING_COLOR[k]}"></i>${esc(`${ENDING_MARK[k]} ${ENDINGS[k].title}`)}</span>`).join("")}${m.journal.some((j) => j.skipped) ? `<span><i class="dash"></i>${esc(t("ui.journal.legend_left_early"))}</span>` : ""}</div><div class="runs">${m.journal.map((j, i) => `<button type="button" class="run-chip" data-i="${i}" aria-pressed="${i === (state.selected ?? count - 1)}" aria-label="${esc(j.skipped ? t("ui.journal.chip_label_early", { number: j.run, ending: ENDINGS[j.ending].title }) : t("ui.journal.chip_label", { number: j.run, ending: ENDINGS[j.ending].title }))}">${j.run}<small>${ENDING_MARK[j.ending]}</small></button>`).join("")}</div></section>${entryCard(m.journal[state.selected ?? count - 1])}`);
    const pick = (el) => { state.selected = Number(el.dataset.i); shell = `journal:keep`; update(); };
    panel.querySelectorAll(".run-chip").forEach((c) => { c.onclick = () => pick(c); });
    panel.querySelectorAll("circle").forEach((c) => { c.onclick = () => pick(c); });
  }
}
function footer() {
  const box = document.createElement("section");
  box.className = "foot";
  const open = state.pane === "journal";
  const journal = button("ghost", open ? t("ui.footer.close_journal") : t("ui.footer.journal", { count: state.meta.journal.length }), () => { state.pane = open ? "main" : "journal"; update(); });
  journal.id = "journal-button";
  box.append(journal);
  const row = document.createElement("div"); row.className = "speed";
  row.append(t("ui.footer.test_speed"));
  for (const s of [1, 10, 60]) {
    const b = button("", `×${s}`, () => { state.speed = s; row.querySelectorAll("button[data-s]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.s == s)); });
    b.dataset.s = s; b.setAttribute("aria-pressed", state.speed === s); row.append(b);
  }
  const reset = button("reset", t("ui.footer.reset"), () => {
    if (!state.resetArm) { state.resetArm = true; reset.textContent = t("ui.footer.reset_confirm"); setTimeout(() => { state.resetArm = false; reset.textContent = t("ui.footer.reset"); }, 3000); return; }
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    Object.assign(state, { meta: E.newMeta(), view: "play", pane: "main", log: [], seen: {}, resetArm: false, skipped: false, noted: 0, hint: { key: "", tier: 0 }, selected: null, open: {}, banner: null });
    state.run = E.newRun(state.meta); shell = ""; update();
  });
  row.append(reset); box.append(row);
  return box;
}
function update() {
  checkMilestones();
  renderShell();
  const { run, meta } = state;
  // The survey is a display-only first step: it reads as the current step on
  // the search screen, and as completed once a run is underway.
  const track = state.view === "search" ? 0 : PHASES.findIndex(([p]) => p === run.phase);
  $("track").innerHTML = PHASES.map(([, label], i) => `<span class="${i === track ? "now" : i < track ? "done" : ""}">${label}</span>`).join("");
  const sky = $("sky"), mode = run.phase === "gather" && state.view === "play" ? "tap" : `${state.view}:${run.phase}`;
  if (sky.dataset.mode !== mode) {
    sky.dataset.mode = mode;
    if (mode === "tap") { sky.setAttribute("role", "button"); sky.tabIndex = 0; sky.setAttribute("aria-label", t("ui.aria.sky_tap")); }
    else {
      if (document.activeElement === sky) { const h = $("panel").querySelector("h2"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
      sky.setAttribute("role", "img"); sky.removeAttribute("tabindex");
      sky.setAttribute("aria-label", state.view === "search" ? t("ui.aria.sky_search") : t("ui.aria.sky_phase", { phase: PHASES[track][1] }));
    }
  }
  $("scale").hidden = run.phase === "accrete";
  const zoomShown = state.view === "search" || run.phase === "gather" || run.phase === "collapse" ? state.zoom : 1;
  $("scale-label").textContent = length(viewRadius() * 0.5 * zoomShown);
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
  paintFolded("log", "log-earlier", state.log.map((n) => ({ ...n, expired: noteExpired(n, run) })), (n) => `<div>${esc(n.text)}</div>`, t("ui.play.earlier_observations"), t("ui.play.nothing_new"));
  for (const name of Object.keys(E.UPGRADES)) {
    const row = $(`urow-${name}`); if (!row) continue;
    const el = $(`up-${name}`), [title, text] = UPGRADE_TEXT[name], ok = E.canBuy(run, name, meta), maxed = run.levels[name] >= E.UPGRADES[name].max;
    const cost = E.upgradeCost(run, name), fill = maxed ? 0 : Math.min(1, run.energy / cost);
    const floorBlocked = name === "cooling" && !maxed && meta.unlocks.includes(name) && run.phase === E.UPGRADES[name].phase && run.energy >= cost && !E.coolingHelps(run, meta);
    row.querySelector("b").textContent = title;
    row.querySelector(".level").textContent = t("ui.upgrades.level", { level: run.levels[name] });
    row.querySelector("small").textContent = text(run, meta);
    el.querySelector(".cost").textContent = maxed ? t("ui.upgrades.maxed") : ok || floorBlocked ? t("ui.upgrades.cost", { cost: sci(cost) }) : t("ui.upgrades.cost_progress", { percent: Math.floor(fill * 100), cost: sci(cost) });
    // The accessible name must not offer a purchase the button cannot make.
    el.setAttribute("aria-label", ok
      ? t("ui.upgrades.buy", { name: title, cost: `${sci(cost)} erg` })
      : t("ui.upgrades.unavailable", { name: title, cost: maxed ? t("ui.upgrades.maxed") : `${sci(cost)} erg` }));
    row.classList.toggle("ready", ok);
    el.classList.toggle("ready", ok);
    el.disabled = !ok;
    el.style.setProperty("--fill", fill.toFixed(3));
  }
  if ($("count")) {
    const left = (run.msDuration - run.msElapsed) / state.speed, years = run.lifetimeMyr * 1e6 / run.msDuration * state.speed;
    $("count").textContent = clock(left);
    $("count-note").textContent = t("ui.shine.count_note", { years_per_second: sci(years) });
  }
  if ($("reading")) {
    // Newest first. Only the newest note stays open; earlier ones fold away but can be reopened.
    const shown = shineNotes(run, meta).filter(([at]) => burned(run) >= at).reverse();
    const items = shown.map(([, title, text], i) => ({ title, text, expired: i > 0 }));
    paintFolded("reading", "reading-earlier", items, (n) => `<article${n.expired ? "" : ' class="new"'}><b>${esc(n.title)}</b><p>${esc(n.text)}</p></article>`, t("ui.play.earlier_field_notes"), "");
  }
  const skippable = E.canSkip(run);
  $("skip-box").hidden = !skippable;
  if (skippable) $("skip-note").textContent = t("ui.skip.note", { time: duration(run.msDuration - run.msElapsed) });
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
// The temperature gauge: current gas temperature and the composition floor
// on one log scale, shown through the gather phase. The floor is the lowest
// temperature this gas can reach; radiative cooling slides the marker down
// toward it.
function temperatureGauge(run, meta) {
  // Wide layout: a short bar above the bottom edge, right of centre, with the
  // caption above it and the floor meaning one row below the ticks. Narrow:
  // a full-width bar between the page header and the collapse ring, with the
  // caption and current readout above it and the floor meaning below;
  // tick labels are dropped, the readout carries the numbers.
  const narrow = W < 760;
  const lo = 10, hi = 1000;
  const x1 = narrow ? W - 16 : W - 24, x0 = narrow ? 16 : x1 - Math.min(150, W * 0.4);
  const y = narrow ? 96 : H - 40;
  const mark = (kelvin) => x0 + Math.log10(Math.min(hi, Math.max(lo, kelvin)) / lo) / Math.log10(hi / lo) * (x1 - x0);
  ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c";
  ctx.globalAlpha = 0.85; ctx.strokeStyle = "#8d84d6"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  for (const k of [lo, 100, hi]) {
    const x = mark(k);
    ctx.strokeStyle = "#8d84d6";
    ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
    if (!narrow) { ctx.fillStyle = "#8d84d6"; ctx.fillText(`${k} K`, x, y + 15); }
  }
  const fx = mark(run.floorTemperature);
  // The gauge markers stay neutral so the species colors keep meaning only
  // composition: the current dot in the label color, the floor tick white.
  ctx.globalAlpha = 1; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(fx, y - 7); ctx.lineTo(fx, y + 7); ctx.stroke();
  // Caption and current readout above the bar; the floor meaning below it at
  // narrow width, one row past the ticks at wide width.
  ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.textAlign = "left";
  ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.fillStyle = "#cfc8ff";
  const readout = `${SKY_TEXT.gauge}: ${Math.round(E.temperature(run, meta))} K`;
  ctx.strokeText(readout, x0, y - 10); ctx.fillText(readout, x0, y - 10);
  ctx.textAlign = "center"; ctx.fillStyle = "#ffb86b";
  const tx = mark(E.temperature(run, meta));
  ctx.beginPath(); ctx.arc(tx, y, 4, 0, 6.283); ctx.fill();
  // One row away from the bar, so the floor's meaning never collides.
  ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "right";
  ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c";
  const floorLabel = SKY_TEXT.gaugeFloor;
  ctx.strokeText(floorLabel, x1, y + (narrow ? 12 : 27)); ctx.fillText(floorLabel, x1, y + (narrow ? 12 : 27));
  ctx.globalAlpha = 1;
}
function viewRadius() {
  // The search screen draws the prospective run, so its scale must too.
  const r = state.view === "search" && state.prospective ? state.prospective : state.run;
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
    // A smooth circle: its radius is the physical front, with no decorative wobble.
    const edge = () => rb;
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
    const label = b.stalled ? SKY_TEXT.ionizationFrontStalled : SKY_TEXT.ionizationFront;
    ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.strokeText(label, cx, cy + edge(1.571) + 18); ctx.fillText(label, cx, cy + edge(1.571) + 18);
  } else {
    glow(cx, cy, R * 0.3, "#ffb86b", 0.12);
  }
  star(cx, cy, size, run.starMass, t);
  coreGauge(run, f);
}
// The core in cross-section: helium ash grows from the centre as hydrogen fuses.
function coreGauge(run, f) {
  // Top right, clear of the brand (top left), scale bar (bottom left), and front label (bottom centre).
  const cr = Math.max(20, Math.min(32, Math.min(W, H) * 0.065)), x = W - 16 - cr, y = 16 + cr, tx = W - 16;
  ctx.globalAlpha = 0.92; ctx.fillStyle = "#ffb86b"; ctx.beginPath(); ctx.arc(x, y, cr, 0, 6.283); ctx.fill();
  ctx.fillStyle = "#cfc8ff"; ctx.beginPath(); ctx.arc(x, y, cr * Math.sqrt(f), 0, 6.283); ctx.fill();
  ctx.globalAlpha = 1; ctx.lineWidth = 1.5; ctx.strokeStyle = "#0c0a1c"; ctx.beginPath(); ctx.arc(x, y, cr, 0, 6.283); ctx.stroke();
  const text = (s, yy, font, color) => { ctx.font = font; ctx.fillStyle = color; ctx.strokeText(s, tx, yy); ctx.fillText(s, tx, yy); };
  ctx.textAlign = "right"; ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c";
  text(clock((run.msDuration - run.msElapsed) / state.speed), y + cr + 24, "600 20px 'IBM Plex Mono', monospace", "#5fe6cf");
  text(SKY_TEXT.coreHydrogen, y + cr + 40, "11px 'IBM Plex Mono', monospace", "#ffb86b");
  text(SKY_TEXT.heliumAsh, y + cr + 54, "11px 'IBM Plex Mono', monospace", "#cfc8ff");
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
// One consistent drawing of the gas, shared by the survey, gather and
// collapse scenes. Species colors carry composition (hydrogen/helium/metals
// with a canvas key), thermal motion carries temperature through the
// sqrt(T/m) law, and the drawn scale carries density through the cube-root
// zoom; the mappings and their concepts live in web/visuals.js.
const GAS_COUNT = 120;
const GAS = Array.from({ length: GAS_COUNT }, (_, i) => ({ a: hash(i, 21) * 6.283, u: hash(i, 22), w: hash(i, 23) * 6.283 }));
function gasScene(run, meta, cx, cy, R, t, zoom, crowd = 1) {
  const mix = VISUALS.speciesMix(run.metalLog10, E.PRIMORDIAL_METAL_LOG10);
  const species = (i) => {
    const roll = hash(i, 24);
    return roll < mix.helium ? "helium" : roll < mix.helium + mix.metals ? "metals" : "hydrogen";
  };
  // Thermal speed in px/s on the shared sqrt(T/m) scale: the base constant
  // sets hydrogen at 10 K, every species and temperature carries the true
  // ratio, and the cap keeps the hottest settings readable.
  const base = Math.min(VISUALS.SPEED_CAP_PX, VISUALS.SPEED_BASE_PX * VISUALS.speedForTemperature(E.temperature(run, meta)));
  const speedOf = (species_) => base * VISUALS.speedForMass(
    species_ === "helium" ? VISUALS.HELIUM_MASS : species_ === "metals" ? VISUALS.METAL_MASS : VISUALS.HYDROGEN_MASS
  );
  for (let i = 0; i < GAS.length; i++) {
    const g = GAS[i], kind = species(i), speed = speedOf(kind);
    // Fixed hashed layout: the same particles everywhere; the crowd factor
    // pulls the whole layout inward as the cloud falls.
    const rad = R * (0.16 + 0.86 * g.u) * zoom * crowd;
    const x = cx + Math.cos(g.a) * rad, y = cy + Math.sin(g.a) * rad * 0.96;
    if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
    ctx.globalAlpha = 0.92; ctx.fillStyle = VISUALS.SPECIES_COLORS[kind];
    if (calm) {
      // A still streak whose length carries this particle's thermal speed.
      const len = 1.5 + speed * 0.06;
      ctx.strokeStyle = VISUALS.SPECIES_COLORS[kind]; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(g.w) * len, y + Math.sin(g.w) * len * 0.96); ctx.stroke();
    } else {
      // The wobble advances at the particle's thermal speed, so hotter gas
      // shivers faster and heavier species slower.
      const ph = t * (speed / 2.4) + g.w;
      ctx.beginPath(); ctx.arc(x + Math.cos(ph) * 2.4, y + Math.sin(ph * 0.9) * 2.4, kind === "metals" ? 1.5 : 1.8, 0, 6.283); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
// The composition key: one marked dot per species, and the honesty label
// whenever metal particles are actually drawn. It sits above the #hint
// overlay's bottom strip.
function gasKey(cx, run) {
  const low = H - 46;
  const mix = VISUALS.speciesMix(run.metalLog10, E.PRIMORDIAL_METAL_LOG10);
  ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c";
  const runs = [[VISUALS.SPECIES_COLORS.hydrogen, SKY_TEXT.keyHydrogen], [VISUALS.SPECIES_COLORS.helium, SKY_TEXT.keyHelium], [VISUALS.SPECIES_COLORS.metals, SKY_TEXT.keyMetals]];
  let x = cx - 108, y = low;
  for (const [color, word] of runs) {
    ctx.globalAlpha = 0.95; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 0.85; ctx.fillStyle = "#cfc8ff"; ctx.fillText(word, x + 8, y + 4);
    x += 8 + ctx.measureText(word).width + 12;
  }
  // The honesty label: only when metal particles are actually drawn, judged
  // by the same deterministic species roll gasScene uses.
  let drawn = 0;
  for (let i = 0; i < GAS.length; i++) {
    const roll = hash(i, 24);
    if (roll >= mix.helium && roll < mix.helium + mix.metals) drawn++;
  }
  if (drawn > 0) {
    ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
    ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.fillStyle = "#9d8cff"; ctx.globalAlpha = 0.9;
    ctx.strokeText(SKY_TEXT.metalsNote, cx, low + 14); ctx.fillText(SKY_TEXT.metalsNote, cx, low + 14);
  }
  ctx.globalAlpha = 1;
}
function starColor(m) { return m > 16 ? "#9fc4ff" : m > 2 ? "#e9eeff" : m > 0.8 ? "#ffe2a0" : "#ff9a5c"; }
function star(cx, cy, size, m, t) {
  glow(cx, cy, size * 5, starColor(m), 0.28);
  glow(cx, cy, size * 2, starColor(m), 0.75);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, size, 0, 6.283); ctx.fill();
}
function diskScene(run, cx, cy, R, t, meta) {
  const tilt = 0.42, maxR = Math.log(3000), tipAngle = -0.32;
  const ringAt = (au) => R * 0.1 + R * 0.9 * Math.log(au) / maxR;
  // Distance rings on a log scale, so the size of the disk reads in AU.
  ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "left";
  for (const au of [1, 10, 100, 1000]) {
    const rad = ringAt(au);
    ctx.globalAlpha = 0.22; ctx.strokeStyle = "#cfc8ff"; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * tilt, tipAngle, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
  const total = Math.max(run.collapseMass, 1);
  if (run.envelope > 0) glow(cx, cy, R * 1.4, "#ff5f7e", 0.14 + 0.2 * run.envelope / total);
  run.diskMasses.forEach((m, i) => {
    const rad = ringAt(E.RADII[i]);
    const bright = Math.max(0, Math.min(1, (Math.log10(m + 1e-9) + 3.5) / 3.5));
    ctx.globalAlpha = 0.08 + 0.5 * bright; ctx.strokeStyle = i % 2 ? "#ff5f7e" : "#ffb86b"; ctx.lineWidth = 1 + bright * R * 0.016;
    ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * tilt, tipAngle, 0, 6.283); ctx.stroke();
  });
  ctx.globalAlpha = 1;
  const landing = ringAt(E.feedRadius(run));
  ctx.strokeStyle = "#ffb86b"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.ellipse(cx, cy, landing, landing * tilt, tipAngle, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 1; ctx.fillStyle = "#ffb86b"; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
  ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c";
  const landingLabel = SKY_TEXT.gasLands;
  ctx.strokeText(landingLabel, cx, cy + landing * tilt + 22); ctx.fillText(landingLabel, cx, cy + landing * tilt + 22);
  const flow = E.alpha(run, meta) * 2.4;
  for (let i = 0; i < 46; i++) {
    const a = hash(i, 13) * 6.283, f = ((hash(i, 14) - (calm ? 0 : t * flow)) % 1 + 1) % 1, rad = R * 0.1 + (landing - R * 0.1) * f, turn = a + (calm ? 0 : t * (0.7 + 0.5 / (0.3 + f)));
    const px = Math.cos(turn) * rad, py = Math.sin(turn) * rad * tilt, cosT = Math.cos(tipAngle), sinT = Math.sin(tipAngle);
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
  // Distance labels last, so the disk rings never cover them.
  ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.fillStyle = "#cfc8ff";
  for (const au of W < 500 ? [100, 1000] : [1, 10, 100, 1000]) {
    const x = cx + ringAt(au) * Math.cos(tipAngle) + 4, y = cy + ringAt(au) * Math.sin(tipAngle) - 3;
    ctx.globalAlpha = 0.9; ctx.strokeText(`${au} AU`, x, y); ctx.fillText(`${au} AU`, x, y);
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
  if (state.view === "search") {
    const p = state.prospective || (state.prospective = E.newRun(meta)), zt = VISUALS.zoomScale(p.density);
    state.zoom = calm ? zt : state.zoom + (zt - state.zoom) * 0.12;
    if (meta.blackHoleStart) {
      // Warp the grid around a centre off to one side, so the map says the
      // hole is near, not here.
      drawGrid(cx + 2.4 * R, cy - 1.5 * R, R, 0.3, 0.55);
      ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.globalAlpha = 0.9;
      ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c"; ctx.fillStyle = "#ffb86b";
      ctx.strokeText(SKY_TEXT.blackHolePull, 16, 96); ctx.fillText(SKY_TEXT.blackHolePull, 16, 96);
      ctx.globalAlpha = 1;
    } else drawGrid(cx, cy, R, 0.16, 0);
    gasScene(p, meta, cx, cy, R, t, state.zoom);
    gasKey(cx, p);
    return;
  }
  if (run.phase !== "ended") lastDeath = 0;
  if (run.phase === "gather") {
    const zt = VISUALS.zoomScale(run.density);
    state.zoom = calm ? zt : state.zoom + (zt - state.zoom) * 0.12;
    drawGrid(cx, cy, R, Math.min(0.2, Math.max(0, (lr - 16.5) / 4)), Math.min(0.22, Math.max(0, (lr - 16.5) * 0.06)));
    gasScene(run, meta, cx, cy, R, t, state.zoom);
    atomScene(run, cx, cy, R, t);
    const startLog = Math.log(1.5 / run.density ** (1 / 3)), limit = E.jeansLogReach(run, meta);
    const done = Math.min(1, (run.logReach - startLog) / (limit - startLog));
    // At narrow width the ring pulls in a step, leaving a clear band between
    // the page header, the gauge, the ring and the key.
    const rr = W < 760 ? R * 0.78 : R * 0.92;
    ctx.strokeStyle = "#ffb86b"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#ff5f7e"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, rr * done), 0, 6.283); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = "#ffb86b"; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
    ctx.lineWidth = 3; ctx.strokeStyle = "#0c0a1c";
    const limitLabel = SKY_TEXT.collapseLimit;
    // At narrow width the label sits inside the ring, clear of the key and
    // the hint at the bottom edge.
    const limitY = W < 760 ? cy + rr - 12 : cy + rr + 16;
    ctx.strokeText(limitLabel, cx, limitY); ctx.fillText(limitLabel, cx, limitY);
    glow(cx, cy, R * (0.25 + 0.75 * Math.min(1, Math.max(0, lr / 19))), "#ff5f7e", 0.1 + 0.3 * Math.min(1, Math.max(0, lr / 19)));
    gasKey(cx, run);
    temperatureGauge(run, meta);
  } else if (run.phase === "collapse") {
    const f = 1 - run.collapseLeft / E.COLLAPSE_SECONDS;
    const zt = VISUALS.zoomScale(run.density);
    state.zoom = calm ? zt : state.zoom + (zt - state.zoom) * 0.12;
    drawGrid(cx, cy, R, 0.2, 0.22 + f * 0.3);
    // The cloud falls inward: the whole layout crowds toward the centre while
    // the thermal channel reads the same engine temperature as everywhere.
    gasScene(run, meta, cx, cy, R, t, state.zoom, 1 - 0.55 * f);
    glow(cx, cy, R * (1 - f * 0.55), "#ff5f7e", 0.3 + f * 0.5);
    gasKey(cx, run);
  } else if (run.phase === "accrete") {
    drawGrid(cx, cy, R * 1.4, 0.18, 0.5);
    diskScene(run, cx, cy, R, t, meta);
  } else if (run.phase === "main_sequence") {
    drawGrid(cx, cy, R * 1.4, 0.1, 0.3);
    shineScene(run, meta, cx, cy, R, t);
  } else {
    drawGrid(cx, cy, R * 1.4, 0.16, run.kind === "black_hole" ? 0.72 : 0.3);
    if (!state.skipped) deathScene(run, cx, cy, R, t);
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
  if (data?.run) Object.assign(state, data, { log: (data.log || []).map(asNote) }); else load();
  resize(); update(); requestAnimationFrame(frame);
}
window.accretion = state;
window.claude?.hot?.snapshot?.(() => ({ meta: state.meta, run: state.run, view: state.view, seen: state.seen, log: state.log, skipped: state.skipped, noted: state.noted }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
addEventListener("pagehide", save);
