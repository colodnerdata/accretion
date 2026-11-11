# Next

Keep this page short and current. Replace obsolete notes instead of appending
a diary. Link to an issue when it owns the detail.

- **Working state:** PR #18 (visible gas), PR #19 (recorded lifetime,
  capped-turbulence refusal, build check inside `poe check`, save validation
  with a backup key, prestige idempotence) and PR #20 (readable accrete disk:
  rings colored by Toomre Q, fragments drawn as clumps, the "This run's
  setup" strip) are merged. The owner ruling on player predictions is
  recorded, docs only, on `docs/prediction-system-rules`: see
  [DECISIONS 2026-11-11, "Players may predict; the game never forecasts"](DECISIONS.md)
  and `docs/planning/prediction-system.md`.
- **Resolved:** the queued ruling "post-run debrief vs the rejected-previews
  principle". The game never forecasts; the player may (DECISIONS entry
  above).
- **Owner actions:**
    - Edit the design spec (the Claude Docs "Accretion Idle Game Design
      Spec", linked from `CLAUDE.md`). It could not be reached from the
      coding session, which has no Claude Docs connector. Change "without
      predictions or previews" to "without game previews or forecasts;
      players may make their own predictions", and add a pointer to
      `docs/planning/prediction-system.md`.
    - Rule on the faint baseline value in the prediction overlay: is a
      played run's value beside a live stat a rejected ghost marker? See
      "The in-run overlay" in `docs/planning/prediction-system.md`.
    - Rulings still queued from the repository review: the clamped slider
      cost, the ring-count migration story, and the one-implementation
      proposal (protected decision — not for implementation without
      sign-off). The review itself is a local, uncommitted file,
      `docs/accretion-repository-review.md`.
- **Next action:** step 0 of `docs/planning/implementation-order.md`: correct
  the density hints and the "buy as soon as energy allows" hint against the
  engine, and rename or justify the shipped "Forecast life" and "Forecast
  ending" labels. Then step 1, the run record. Engineering items still open
  beside that: the 59/61 s offline cliff (credit short absences, keep the
  banner for long ones), the two-tab save policy, standards-mode page entry,
  and the angular-momentum ledger. The 16-vs-32-ring decision needs a
  written migration story first (a 16-entry saved disk under CELLS = 32 NaNs
  the star).
- **Engine facts measured for the prediction docs (2026-11-11, bot
  policy):** turbulence levels 0 to 4 take a first-run star from 26.16 to
  21.54 M☉ (black hole to supernova); density has no direct effect on final
  mass (26.162 M☉ at every density with turbulence held at 0). Details in
  `docs/planning/prediction-system.md`, "Prerequisites before v1".
- **Review leftovers (minor, accepted or deferred):** brown-dwarf runs
  ending inside the accrete branch still omit at most one solver chunk
  (~0.08 s) from the journal's seconds (pre-existing, pre-#19 bug class,
  negligible — fix for symmetry sometime); no parity scenario buys heavy
  turbulence (the boundary is covered by explicit tests on both engines,
  not by parity); saves from intermediate dev builds get mis-bumped by the
  note migration (self-healing, dev-only); two pre-existing `W < 500` checks
  remain in the accrete scene (disk labels — confirm they fit at 500-760);
  the floor text grazes the ring's top arc at 390 (dark stroke halo keeps
  it readable); the six-item track wraps at 320 px; canvas text (key,
  gauge, honesty note) is invisible to screen readers (mitigated by the
  panels; mirror in DOM if accessibility becomes a goal).
- **Pacing:** early runs ~13.4 min vs the 15-20 target — still open, with
  the review's input: the skip control is unreachable on early runs
  (gate at >1 h of shine left); test whether players can explain
  turbulence at a debrief before lengthening the timer.
- **Human check:** play a first run at x10. It should still reach a
  supernova in roughly the same time as before fragments. The "Companion
  stars" row will mostly read 0, since fragments usually merge. The
  Journal entry's companion list is empty unless a fragment survives to
  the end of accretion. Then play a run past the first supernova and
  confirm the setup strip highlights turbulence and braking in the accrete
  phase (from PR #20).
- **Blocked by:** none recorded.
