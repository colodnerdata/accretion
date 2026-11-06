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
- **Working state:** stages 1 and 2 done. The data model is in both engines,
  and the fragment simulation replaces the old mass cap: Toomre Q per ring,
  fragment formation, accretion, migration, phase, merging, coalescing at 4,
  and end-of-run companions. Unit tests cover each rule; parity compares the
  three scripted regions, which form fragments that all merge before the end,
  plus a stress scenario that loads an unstable disk and four seeded fragments
  at the start of accretion. It forces about 120 formations, coalescing at the
  four-fragment limit, merges, and three end-of-run companions. A guard test
  fails if the scenario stops reaching coalescing or companions.
- **Known regression:** the first run now ends at about 12.4 minutes, below
  the 13-minute floor (it was 13.2). Accretion finishes about a minute sooner
  because the disk keeps its gas instead of shedding it to companions.
  `test_first_run_is_short_and_reaches_supernova` is marked `xfail(strict)`
  until the retune; fixing it is a pacing decision, not a bug.
- **Next action:** the retune (pacing, 16 or 32 rings, migration and accretion
  constants), which also clears the `xfail`.
- **Stages after that:** angular-momentum ledger; DATA_REPORT.md note that its
  cap tables are superseded; visuals last.
- **Human check for stage 2:** play a first run at ×10. It should still reach
  a supernova, a bit faster than before. The "Companion stars" row will
  mostly read 0, since fragments usually merge. The Journal entry's companion
  list is empty unless a fragment survives to the end of accretion.
- **Blocked by:** none recorded.
