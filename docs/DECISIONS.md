# Decisions

Record the choices future-you or a coding assistant might otherwise repeat.
Add an entry when a decision affects interfaces, architecture, dependencies,
data formats, verification, or a meaningful constraint. Keep entries short.

Preserve the original reasoning when a decision changes. Mark the old entry
superseded and link to the new one. Record rejected alternatives when the
reason is likely to be useful again. Search by mechanism before proposing a
design change.

## Entry pattern

- **Date and title:** YYYY-MM-DD — the decision in a few words.
- **Status:** accepted, rejected, deferred, or superseded (with a link).
- **Context:** the problem and constraint.
- **Decision:** what we chose.
- **Why:** the tradeoff and important alternative.
- **Revisit when:** evidence or a changed condition that would alter the choice.

## Entries

- **Date and title:** 2026-11-13 — The Temperature slider is a kelvin track from absolute zero with a padlock at the coldest allowed gas.
- **Status:** accepted
- **Context:** The slider was a rarity scale (−3σ to +3σ). A setting below
  the region's floor was accepted, charged for, and then clamped by the
  engine (the "clamped slider cost" item from the repository review), and the
  Metal content slider looked dead while the gas was still primordial.
- **Decision (owner ruling):** Metals unclamp the bottom of the Temperature
  slider. The track starts at absolute zero from the first survey. A padlock
  marks the coldest gas the region allows (`region_floor`: composition,
  permanent cooling, cosmic background); the thumb cannot pass it; more
  metals move the padlock toward absolute zero. The wording follows, and the
  Radiative cooling announcement states the control's direct effect.
- **How:** The stored setting is still `zTemperature`, so neither engine,
  parity nor the save shape changes. The interface asks the engine for the
  region at z = 0 and z = 1 to get the centre and spread, converts thumb
  position → kelvin → z, and holds z between the padlock and the budget. The
  track is compressed: position = asinh(T / 100 K) / asinh(4), so pristine
  gas (200 to 392 K) has the right-hand 31% and enriched gas at 2 Gyr (23 to
  86 K) about 26% near the left. A setting that the padlock has passed, or
  one saved below it, is raised to it, which refunds the wasted probability.
  Within 0.08σ of the free point the thumb lands on it.
- **Why:** A lock that can be seen moving explains the metals lever without
  a forecast: it shows the current bound, not an outcome. A linear track was
  rejected because enriched gas would get a fifth of it; keeping the rarity
  scale was rejected because the lock would barely move.
- **Known limits:** The clamp is in the interface only. A script that sets
  `z_temperature` below the floor still gets the engine's own clamp and pays
  for it. The knee (100 K) differs from the 20 K first proposed, which left
  pristine gas 19% of the track. The right end (400 K) carries no label.
- **Revisit when:** A region can start above 400 K, or playtests show the
  compressed scale is misread as linear.

- **Date and title:** 2026-11-13 — Copy audit: player-facing claims are checked against the engine and recorded in `docs/audit/copy-audit.md`.
- **Status:** accepted
- **Context:** The audit report says what the engine does; the text had only
  been checked for the hints (PR #24). A wrong sentence seeds a wrong
  prediction.
- **Decision:** Every sentence in `content/*.toml` that states a cause, a
  direction, a number or a control's effect has a row in
  `docs/audit/copy-audit.md` with a verdict, the evidence and a physics or
  game-rule label. Five were changed: two accrete hints (one claimed disk
  controls matter less than infall, one claimed faster infall feeds "for
  longer", which is the opposite of the engine), a hint that advised aiming
  for "a slightly different mass" with no control to do it, a hint missing
  "more", and the brown-dwarf band's exact limit. A hint states only direct
  effects and tested relationships; comparisons of how much two levers matter
  stay out, since the answer depends on the region.
- **Why:** The table makes the next text change checkable, and the labels
  are the input if in-game physics or game-rule labels are taken up.
- **Left for the owner (not changed):** (1) the engine clears the disk before
  ignition, because `ionizing_rate` is held constant below 5 M☉, while the
  ignition note says clearing starts then; (2) the cooling announcement gives
  the supernova as the cause of a control whose unlock is a game rule;
  (3) "its final mass … will decide how this star ends" is true only within
  one region; (4) "More metals let gas cool further" is true only past
  log Z/Z☉ = −4.
- **Revisit when:** An engine change regenerates the audit report (recheck
  the rows that cite it), or text is added.

- **Date and title:** 2026-11-13 — The audit tool: one-input sweeps, seven bins, two purchase policies, a committed report.
- **Status:** accepted
- **Context:** Relationship text and debrief explanations need the engine's
  true input–outcome relationships (`docs/planning/prediction-system.md`,
  "Prerequisites before v1"). Two facts had been measured with a throwaway
  script, and the epoch ruling waits on how far composition drifts.
- **Decision:** `tools/audit.py` holds a context fixed, moves one input across
  a grid, plays each run with the `tools/bot.py` player, and reads the run
  record. Each series gets a bin: no change, up, down, peaked, dipped,
  threshold (one direction, but flat at one end of the grid) or irregular;
  steps under 1e-6 of the scale are ignored. A pair whose bin
  differs between contexts is `depends`; a context where the player cannot
  buy the level is `untested` and left out, and a summary cell says how many
  contexts it rests on. Four contexts (first run, hot pristine, cold
  pristine, enriched); a context is left out of a sweep that would overwrite
  the setting that defines it. Region settings and permanent levels are set
  directly in every context; only in-run purchases respect unlocks and
  energy. Two purchase policies: held (other in-run upgrades at level 0) and
  greedy (turbulence and braking whenever energy allows; gather cooling only
  when it is the swept input). The report is committed at
  `docs/audit/report.md` with a fingerprint of the Python engine sources,
  `tools/bot.py` and the tool itself;
  `tools/audit.py --check` says whether it is stale. `uv run poe audit`
  regenerates it (about 80 seconds). It is not part of `poe check`.
- **Why:** Held purchases isolate the input; greedy purchases show what a
  player who buys everything sees, and the gap is the purchase-timing effect
  (density changes final mass only under greedy). Irregular is kept as its own
  bin, never smoothed into a trend: turbulence level 3 to 4 raises the mass.
  The bins never grade a player's untested prediction.
- **Rejected:** a threshold rule based on the share of the change in one
  step (first version: 80%). It depended on the grid: a smooth power law
  steeper than about 1.1 on the density grid, or any trend on the unevenly
  spaced clock grid, was labeled a threshold.
- **Known limits:** Contexts are four points, not a sample of the region
  space, so `depends` means "differs among these four". Pairwise interaction
  grids are left for the hypercube (step 11). The slope across a change of
  ending is not reported for the two outcomes paid by category. The staleness
  check is manual, so an engine change can leave the report behind until
  someone runs it.
- **Revisit when:** Each disk-breakup stage lands (rerun and diff), the epoch
  boundaries are ruled (add them as contexts), or a second reader needs the
  bins as data and not Markdown.

- **Date and title:** 2026-11-13 — The journal entry is the run record; it is flat, additive, and stores raw clock inputs instead of an epoch.
- **Status:** accepted
- **Context:** A prediction resolves against a pair of runs that differ in
  exactly one effective input (`docs/planning/prediction-system.md`). The
  journal entry held outcomes and a few inputs, not enough to tell which
  inputs differed. The epoch boundaries are not chosen yet.
- **Decision:** Extend the journal entry in both engines, with no second
  store. New fields: the settings the run started from (`z_density`,
  `z_temperature`, `z_metal`, `black_hole_start`); the clock-driven inputs at
  the start (`cosmic_age_gyr`, `background_metal_log10`); effective inputs
  (`start_temperature`, `floor_temperature`, `infall_factor`, and `levels`
  with the five in-run levels plus `heavy_cooling` and `heavy_turbulence`);
  direct outcomes (`collapse_mass`, `infall_rate` before the ionized-region
  taper); net outcomes (`ejected`, `companion_mass`, `accrete_years`). The
  settings and clock inputs are snapshotted on the run (`run.start`) when it
  is created, because the search pane changes the settings for the next run
  while this one is still current. No epoch number is stored: it is derived
  from the clock inputs once the boundaries are ruled. No time series is
  stored (owner choice, 2026-11-13): nothing reads one until the debrief.
- **Why:** One record per run keeps the journal the single source and adds
  nothing to migrate: the fields are additive, so `SAVE_KEY` stays at v4.
  Journal entries written before this change lack the new fields, so readers
  (the audit tool, predictions) must treat such a run as unusable for a test,
  not guess its inputs. A run in progress saved before this change has no
  snapshot and records the settings at the time it ends.
- **Known limits:** `infall_rate` is computed at the end from the final
  temperature; it equals the rate at collapse only because cooling is bought
  while gathering and permanent upgrades are bought between runs. If either
  rule changes, record it at collapse instead. The parity script compares
  non-zero in-run cooling and `heavy_cooling`, but leaves `braking`,
  `heavy_turbulence` and `black_hole_start` at zero or false, and never moves
  a setting between a run's creation and its end; explicit tests in both
  engines cover the snapshot. A run with no snapshot takes it when it ends
  or, failing that, at the top of `prestige`, before its own yield and
  lifetime move the metals and the clock.
- **Revisit when:** The epoch boundaries are chosen (add a derived epoch, do
  not store one), the debrief needs a time series, or a rule lets temperature
  change after collapse.

- **Date and title:** 2026-11-13 — Hints name only levers the engine has: no density hint, and the gather hint advises reach only.
- **Status:** accepted
- **Context:** After a too-small star or a black hole, the tier 2 hint added
  "or a less dense one" / "or denser" once the density search option unlocked.
  The engine has no such lever: with nothing else changed, final mass is
  26.162 M☉ from 498 to 200,855 cm⁻³ while collapse mass falls twentyfold.
  The gather hint said "Buy upgrades as soon as energy allows", but Radiative
  cooling, a gather upgrade, makes a smaller star (two levels take the
  default region from 26.16 to 21.72 M☉, black hole to supernova).
- **Decision:** Remove `small.tier2_with_density` and `big.tier2_with_density`
  and the branch in `hintSet()` that chose them. The gather hint now says "Buy
  Gravitational reach as soon as energy allows." No new lever is named in
  their place.
- **Why:** A wrong hint seeds a wrong player prediction, and "no change" is
  itself a result the player can find. Naming turbulence or cooling as the
  replacement lever was left out: those belong to the prediction system's
  relationships, which the player should test, not be told.
- **Revisit when:** `test_density_changes_collapse_mass_but_not_final_mass` or
  `test_cooling_bought_while_gathering_makes_a_smaller_star` fails (the engine
  changed under the hints), or disk breakup (step 4) makes density matter.
- **Date and title:** 2026-11-13 — A skipped star counts toward no unlock.
- **Status:** accepted
- **Context:** `prestige` incremented `supernovae`, set `blackHoleUnlocked` and
  set `pairInstabilitySeen` (which nothing reads yet) from the star's kind whether or not the player left
  early, so a skipped star could unlock the cooling and metals controls or the
  black-hole region option. That discovers a category the player never saw, which
  2026-11-12 ruled the game must not show. It was latent, since only white dwarfs
  can be skipped with today's constants.
- **Decision:** In both engines the three category counters move only when the
  star was watched to its end. A skipped star still pays regions and heavy
  elements, still advances the clock by the time stayed, and still counts as a
  run. Tests in both engines and a parity row cover supernova, black hole and
  pair instability, skipped and watched.
- **Why:** Rewards are paid for the move to a new region (decided mechanic);
  discovery is a separate thing and needs the ending to be seen. Rejected: a
  flat reward for skipped runs, which would change the economy for no teaching
  gain.
- **Revisit when:** The skip gate changes so heavier stars can be skipped: a
  skipped supernova would then pay heavy elements without unlocking the
  controls that spend them, which playtesting should judge.

- **Date and title:** 2026-11-12 — The only projection is a star's duration, and a skipped star shows no category or mass.
- **Status:** accepted
- **Context:** Skipping a star ended on a "Forecast ending" screen that named the
  ending, described it, and showed the final mass and the outcome bands. That
  was a projection of the star's category and size, shown to a player who had not
  watched it happen.
- **Decision:** The owner ruled that a projection is shown only when the player
  has nothing else to do (the shine phase, which is skippable), and that only
  the duration is projected. After a skip, the ended screen shows "Moved on",
  the projected life, the time stayed, and the payouts as plain amounts. The
  journal draws a skipped run as a fixed-size dashed neutral bubble marked with
  an arrow; its legend, run chip, plot label and entry card carry no ending or
  final mass. Skipped endings do not count toward the goal text, the outcome
  bands or the hints. "Forecast life" is renamed "Projected life", the anomaly
  note says "longer than projected", and "Forecast ending" is removed.
- **Why:** It keeps the rule that the game never forecasts a category, and a
  played run is the only thing a later prediction may resolve against. Rewards
  are still paid, since a skip is movement to a new region; they are shown
  plainly. Supersedes, for skipped runs only, the journal rule that bubble area
  is final mass and color is ending.
- **Known limits:** (1) With today's constants only white dwarfs can be skipped
  (the skip gate needs more than an hour of shine left, and every star light
  enough for that ends as a white dwarf), so the skip button's presence already
  tells the player the category; the live "Star" mass and the payout rows
  (a white dwarf pays 0.4 + 0.1 m) also reveal it. The ruling is kept as a
  display rule for stars that could be skipped later. (2) `prestige` counted a
  skipped supernova in `supernovae` and a skipped black hole in
  `blackHoleUnlocked`, because rewards are paid for a skip; latent today.
  Fixed 2026-11-13 in both engines (entry above). The goal
  text, outcome bands, hints and "stuck" nudge read only runs the player saw
  end. (3) A white dwarf is now recorded for the goal and the outcome bands
  only when watched to its end, which is at least about 21 minutes of shine;
  check that against the 15 to 20 minute early-run target.
- **Revisit when:** The prediction system's run record is built (it may store a
  skipped run's true outcome for the audit tool only), a playtest shows the
  payout amounts leak the category, or the skip gate changes so heavier stars
  can be skipped.

- **Date and title:** 2026-11-11 — Players may predict; the game never forecasts.
- **Status:** accepted
- **Context:** `CLAUDE.md` rejects previews, forecasts, ghost markers and model
  runs. Teaching principles 3 and 4
  (`docs/planning/teaching-principles.md`) call for predict-observe-explain and
  a prestige debrief that invites a prediction. `docs/NEXT.md` had queued an
  owner ruling on whether the two can coexist.
- **Decision:** The game never forecasts; the player may. Full rules are in
  `docs/planning/prediction-system.md`.
  1. Player predictions are allowed. They are made blind and resolve only
     against runs the player has played. The audit tool's true bins inform
     debrief explanations and developer testing only.
  2. Insight pays for board milestones only, once per relationship per
     milestone. Amounts stay deferred.
  3. A test compares a run with a baseline that differs in one effective
     input; in-run purchase levels count. The baseline defaults to the
     previous run, and the player may pick another.
  4. v1 covers relationship predictions only, with no rewards.
  5. Predictions live on the in-run stats rows with a test-status line, as a
     persistent overlay.
  6. "Hold to baseline" is an unlockable control that appears only after the
     player's first run confounded by in-run purchases. The baseline picker
     unlocks after the first run confounded at the survey, so the two never
     arrive together.
  7. The baseline run's value may be shown beside a live stat, faintly or in
     a different color. It is a historical record, not a projection or
     forecast, so it is not a ghost marker.
  8. The inputs the universal clock drives (composition, background
     temperature) are divided into epochs. Runs in one epoch count as
     sharing those inputs. When the epoch changes, predictions reset and the
     journal's notes start a new page: a carbon copy of the prior epoch's
     page, with a header stating the main differences in composition and
     background temperature.
- **Why:** Asking learners to predict carries strong evidence (d = 0.36), and
  a blind player prediction reveals nothing the game knows. Rejected:
  per-prediction rewards, because a free guess with a positive payout is
  always worth making; and a confidence stake, as an extra control for v1.
  Epochs exist because the universal clock and enrichment change every
  region between runs, so a strict "one input differs" rule would leave
  almost no clean tests.
- **Revisit when:** v1 playtests show predicting is not engaging without
  rewards, or event and ending predictions are added. Decision 8 is the
  rule "for now": revisit it once the audit tool shows how far composition
  drifts inside an epoch, and when the epoch boundaries are chosen.

- **Date and title:** 2026-11-11 — The accrete disk is made readable by display-side reading of existing engine state.
- **Status:** accepted
- **Context:** Ring colors alternated by index, fragments were simulated but not
  drawn, turbulence was hard to see, and the player's pre-run choices were
  invisible during the run. Fragment rules, disk physics and pacing had to stay
  as they were, and previews and forecasts stay rejected.
- **Decision:** (1) Ring color is the engine's Toomre Q on one log scale
  (Q_CALM = 10 to Q = 1) with an on-canvas key; brightness keeps gas mass.
  (2) Fragments are drawn as clumps; merges and coalescing are recovered by a
  display-side tracker that diffs `run.fragments` between frames, instead of
  adding ids or events to the engine. (3) A read-only `innerAccretionRate` is
  mirrored in both engines (with a parity row) for the "Gas reaching the star"
  stat; drift speed is driven by alpha directly (v_r ~ alpha). (4) A surviving
  companion settles onto its orbit with a label for a few seconds and then stays
  as a faint dot in the shine scene, a small extension beyond the accrete scene,
  because the phase flip clears the fragment list at once. (5) The "This run's
  setup" strip is built from the pure `setupItems` in `web/visuals.js` and is
  shown in the play and ended panes, not on the search screen, where the sliders
  already show the same values. Items for ideas the player has not met are left
  out. (6) Spiral arms drawn from ring Q were tried and removed: short arcs on
  separate rings read as blotches, not arms. `docs/NEXT.md` did not in fact plan
  them; only the galactic spiral arms in `docs/planning/feature-backlog.md`
  exist.
- **Why:** The tracker keeps the engines unchanged and in parity; the cost is
  that an unreadable frame (a fragment forming and reaching the star together, or a long frame) resyncs without an animation, so a clump can lose its animation; identities are paired in order and checked for continuity, which a contrived frame could in principle still fool.
  Alternative considered: engine-side fragment ids and an event log (a state and
  parity change for a display need).
- **Revisit when:** A prediction system needs the same setup data (reuse
  `setupItems`), or fragments gain ids or events in the engine for other reasons.

- **Date and title:** 2026-11-08 — Game text lives in content TOML tables, embedded at build time.
- **Status:** accepted
- **Context:** All player-facing text was string literals scattered through
  `web/app.js`, so every wording change touched UI code and none of it was
  reviewable in one place. The text also needs banned-word and tier-structure
  checks that cannot run on scattered literals.
- **Decision:** Five files under `content/` (`ui`, `hints`, `notes`, `endings`,
  `voice`) hold every player-facing string, keyed `$file.table.subkey`.
  Sentence branches become separate full-sentence entries. Computed values are
  named placeholders (`{brightness}`) filled by the call site, which keeps all
  formatting in code. The build validates the tables (one optional metadata
  field, `kind`) and embeds only their text as a JSON object before
  `web/app.js`; the page reads them through `t(key, values)`. `voice.toml` is
  reserved for a future narrator and holds no entries.
- **Why:** Build-time embedding keeps the single-file page self-contained and
  offline, and lets the build fail on duplicate keys and malformed
  placeholders before anything ships. Alternative loaders considered: runtime
  `fetch` of the TOML (breaks the offline single-file deliverable) and
  generating JavaScript per-file (duplicates validation). The `kind` field is
  the only metadata now because it maps to the teaching tiers in
  `docs/planning/teaching-principles.md`; adding more means one list in
  `tools/text.py`. This required `requires-python >= 3.11` for stdlib
  `tomllib` (CI runs 3.12, `.python-version` pins 3.12).
- **Revisit when:** Text becomes per-locale or player-authored (embedding may
  need versioning), or a second metadata field is needed (extend
  `ALLOWED_FIELDS` and update `tests/test_text.py`).
