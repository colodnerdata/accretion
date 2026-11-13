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
  above). Also ruled there: a played run's value beside a live stat is a
  historical record, not a ghost marker; and clock-driven inputs are
  divided into epochs, with predictions resetting at each change.
  The design spec's Decisions section carries the same three rulings
  (edited 2026-11-11).
- **Owner actions:**
    - Choose the epoch boundaries for the prediction system (candidates
      in "Epochs" in `docs/planning/prediction-system.md`), and confirm the
      proposed reading of "predictions reset" there.
    - Rulings still queued from the repository review: the ring-count
      migration story and the one-implementation proposal (protected decision — not for implementation without
      sign-off). The review itself is a local, uncommitted file,
      `docs/accretion-repository-review.md`.
- **Next action:** stop the disk being cleared before ignition
  (`ionizing_rate` is flat below 5 M☉, so disk loss runs from the first
  seed). Owner ruling 2026-11-13: fix it before step 4. It is an engine
  change in both engines, with `FIDELITY.md`, parity and the audit report
  regenerated, and needs a short concept note first. Then step 4 stage (a),
  following `docs/planning/disk-breakup-and-companions.md`, whose six owner
  rulings are recorded (DECISIONS 2026-11-13). Also open: the spot-check of
  the Layer 1 values in `physics.py` (last part of step 1; it covers the
  "outside the engine" rows in `docs/audit/copy-audit.md`), and step 3, the
  edge-on inset. Done so far in steps 1 and 2:
  the run record (PR #25), the audit tool and report (PR #26, `uv run poe
  audit`), and the copy audit (`docs/audit/copy-audit.md`, DECISIONS
  2026-11-13). One copy-audit item still waits for an owner ruling ("its final
  mass … will decide how this star ends" is true only within one region). The other two were ruled: the
  Temperature slider now has a padlock at the coldest allowed gas
  (DECISIONS 2026-11-13), which also settles the queued "clamped slider
  cost" item. The clock-drift table in
  `docs/audit/report.md` is the input for the epoch ruling.
  Step 0 is done (hints, PR #24; "Projected life", PR #22). Engineering items still open
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
