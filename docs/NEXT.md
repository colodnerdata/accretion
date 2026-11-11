# Next

Keep this page short and current. Replace obsolete notes instead of appending
a diary. Link to an issue when it owns the detail.

- **Current goal:** merge PR #18 (`feature/visible-gas`, owner's call). The
  branch is code complete, browser-verified, and fully reviewed:
    - Browser verification: screenshots at 390/600/667/1280, standard and
      reduced motion, plus survey slider states (temperature, density zoom,
      metal-era particles with the honesty note, black-hole warp). The
      `gasScene` frame-crash, the 390 bottom pile-up, the never-drawn
      honesty note, and the stale `tools/shoot.py` track indices were all
      found and fixed by it.
    - Reviews ran in the CLAUDE.md order (code-reviewer, ui-ux,
      code-reviewer last); the final pass was clean. All should-fix items
      are fixed: prospective-run scale label, note-index migration with a
      `logShape` stamp, engine-anchored primordial threshold in
      visual_checks, FIDELITY "Visible gas display" row (Simplified),
      reduced-motion streaks carry temperature only, gauge narrow layout
      follows the 760 px breakpoint, neutral gauge marker colors, honesty
      note gated on actual drawn metals.
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
- **Repository review:** docs/accretion-repository-review.md was evaluated
  in conversation on 2026-11-10 (no code changes by instruction). Highest
  value, in order: (1) the journal/step ordering bug — one star, two
  recorded lifetimes; fix in BOTH engines with an extended long-step test;
  parity cannot catch it; (2) `tools/build.py --check` wired into
  poe check/CI plus the README CI-claim correction; (3) save validation,
  prestige idempotence, the 59/61 s offline cliff. Cheap batch: refuse the
  no-op turbulence purchase, reword "Odds of finding this" (it is an
  inverse density ratio, not a tail probability), show the effective
  temperature at the slider, standards-mode page entry. Owner rulings
  queued: post-run debrief vs the rejected-previews principle, the clamped
  slider cost, the ring-count migration story, the one-implementation
  proposal (protected decision — not for implementation without sign-off).
- **Pacing:** early runs ~13.4 min vs the 15-20 target — still open, with
  the review's input: the skip control is unreachable on early runs
  (gate at >1 h of shine left); test whether players can explain
  turbulence at a debrief before lengthening the timer.
- **Next action after merge:** start the repository-review top item
  (journal/step ordering) or the angular-momentum ledger; DATA_REPORT
  supersession note for the fragmentation cap; the 16-vs-32-ring decision
  needs a written migration story first (a 16-entry saved disk under
  CELLS = 32 NaNs the star).
- **Human check:** play a first run at x10. It should still reach a
  supernova in roughly the same time as before fragments. The "Companion
  stars" row will mostly read 0, since fragments usually merge. The
  Journal entry's companion list is empty unless a fragment survives to
  the end of accretion.
- **Blocked by:** none recorded.
