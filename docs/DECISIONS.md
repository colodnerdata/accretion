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
  that an unreadable frame (a fragment forming and reaching the star together, or a long frame) resyncs without an animation, so a clump can lose its animation but never takes another clump's identity.
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
