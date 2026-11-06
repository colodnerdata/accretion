# Next

Keep this page short and current. Replace obsolete notes instead of appending
a diary. Link to an issue when it owns the detail.

- **Current goal:** simulate disk fragmentation and companion stars, replacing
  the rule that moves disk mass above the star's mass into a companion total.
  Decisions: the gas grid stays 1D rings; fragments carry mass, radius, and
  orbital phase; spiral arms are drawn from ring Q and affect no rule; a ring
  forms at most one fragment per step, only when its mass above Toomre Q = 1
  is at least one fragment mass; a full companion list coalesces new fragments
  into the nearest; merging fragments add mass and energy to the star;
  companions are recorded in the journal.
- **Working state:** stage 1 done (data model): empty `fragments` and
  `companion_records` on the run in both engines, companions in each journal
  entry, save key bumped to v4. The old mass cap is still in force.
- **Next action:** stage 2, the engine logic: Q per ring, fragment formation,
  accretion, migration and phase, merging, and end-of-run companions.
- **Stages after that:** angular-momentum ledger and journal fields; tests;
  parity scenario that fragments (away from the Q = 1 threshold); retune with
  `tools/bot.py` (check the first run still completes; choose 16 or 32 rings);
  FIDELITY.md and DATA_REPORT.md updates; visuals last.
- **Human check for stage 1:** nothing visible changes. A normal run should
  play as before and the Journal should show it; an old save is ignored.
- **Blocked by:** none recorded.
