# Next

Keep this page short and current. Replace obsolete notes instead of appending
a diary. Link to an issue when it owns the detail.

- **Working state:** both small-fix batches are merged (PR #13 string tables,
  PR #14 cooling floor gate / journal at run end / control rows). The metals
  redesign decided on 2026-11-09 is implemented on
  `feature/metals-lowers-floor-bound`: `heavy_cooling` keeps the in-run
  multiplier and additionally lowers what future regions can reach
  (`max(CMB, coolingTemperature x 0.9^heavy_cooling)`); the heavy purchase is
  refused only at the background clamp, with its own refusal text
  (`notes.upgrades.cooling_background`). Boundary tests in both engines
  (tests/test_game.py, tools/engine_checks.js); parity re-run; bot pacing
  unchanged (collapse 2.4 / accrete 2.7 / main_sequence 5.9 / ended 13.4).
  poe check 77 tests pass. The PR #14 per-region heavy gate was removed
  (the bound is never region-specific); the refreshSearch heavy-shop repaint
  stays, since the bound still re-judges with the sliders (verified in the
  browser).
- **Pacing:** unchanged by both batches (bot identical). Early runs
  ~13.4 min vs the 15-20 target — still open (see below).
- **Next action:** merge the branch after review; then the still-open items
  from before: whether to lengthen early runs toward 15 minutes, and whether
  16 rings is enough (32 would cost about 2x). Then the angular-momentum
  ledger.
- **Stages after that:** angular-momentum ledger; DATA_REPORT.md note that its
  cap tables are superseded; visuals last.
- **Human check:** play a first run at ×10. It should still reach
  a supernova in roughly the same time as before fragments. The "Companion stars" row will
  mostly read 0, since fragments usually merge. The Journal entry's companion
  list is empty unless a fragment survives to the end of accretion.
- **Blocked by:** none recorded.
