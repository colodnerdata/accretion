# Next

Keep this page short and current. Replace obsolete notes instead of appending
a diary. Link to an issue when it owns the detail.

- **Current goal:** redesign the metals "Dust and metal cooling" purchase
  (decided by Stephen in the fix/cooling-floor-journal-entry session, 2026-11-09,
  not yet implemented; branch fix/cooling-floor-journal-entry / PR #14 hold the
  per-region gate this replaces). Both effects, in both engines:
    1. Keep the in-run multiplier as merged: `heavy_cooling` adds to
       `run.levels.cooling` in `temperature()` (×0.9 per level against the
       composition floor), with the can_buy/buy_heavy floor gate from PR #14
       for the in-run control.
    2. Additionally, `heavy_cooling` permanently lowers the composition-limited
       bound of future regions: floor = `max(CMB, max(10.0,
       200 × 10^(-0.47×excess)) × 0.9^heavy_cooling)` — the temperature shop's
       slider positions that were previously pinned at the 200 K primordial
       floor become real starting gas. Rationale: the purchase's honest physical
       meaning is more dust and metal cooling, a lower achievable temperature.
       buy_heavy("cooling") stays refused only when the next level cannot lower
       the bound once the floor has reached the CMB (which loosens as the
       universal clock advances). The PR #14 per-region gate and the
       refreshSearch heavy-shop repaint (web/app.js) may then become redundant;
       decide per what remains no-op-able.
  Tests: boundary in both engines (buy_heavy buys below the old primordial
  bound; refused at the CMB clamp); extend parity to buy heavy cooling with a
  run context; bot.py before/after re-run (baseline collapse 2.4 / accrete 2.7 /
  main_sequence 5.9 / ended 13.4, unchanged by PR #14). FIDELITY.md: label the
  purchased floor multiplier a Game rule (the slope -0.47 floor row is already
  Constructed); consider whether the search screen's "cooler" label wording
  needs to match the deeper reach.
- **Working state:** PR #14 ("three small fixes": cooling floor gate, journal
  entry at run end, control rows) awaits CI/merge. poe check 75 tests pass.
  String tables (PR #13, merged) hold all player text; t(key, values) reads
  content/*.toml.
- **Pacing:** unchanged by PR #14 (bot identical before/after). Early runs
  ~13.4 min vs the 15-20 target — still open (see below).
- **Next action:** implement the metals floor-bound redesign above. Still open
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
