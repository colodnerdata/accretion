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
  display rule for stars that could be skipped later. (2) `prestige` still
  counts a skipped supernova in `supernovae` and a skipped black hole in
  `blackHoleUnlocked`, because rewards are paid for a skip; that is latent
  today and would need both engines and the parity test to change. The goal
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
