# Next

Keep this page short and current. Replace obsolete notes instead of appending
a diary. Link to an issue when it owns the detail.

- **Current goal:** finish the visible-gas work on `feature/visible-gas`
  (two commits, code complete, NOT yet browser-verified or reviewed). What
  exists: `web/visuals.js` holds the pure mappings with the concept note —
  speed from temperature on the true sqrt(T) scale (10 K = 7 px/s base, 110
  px/s cap), speed from mass (helium 1/2, oxygen-class metals 1/4), true
  metal share `10^(log10 Z - 3)`, an amplified display share (linear in
  log10 Z from the primordial threshold to a 0.28 cap at solar), and the
  density zoom `(1e4 / density)^(1/3)`. tools/visual_checks.js pins these
  against hand-computed values via tests/test_visuals.py (22 checks; all
  pass). app.js draws the same gas particles in the survey (prospective run,
  live slider updates; density zoom animates the scale bar), gather, and
  collapse (crowd factor); a canvas key shows the three species colors and
  the "metals shown far more common than in reality" honesty text; the
  temperature gauge marks current temperature and the floor in gather; the
  black-hole checkbox warps the grid off-centre with a gravity-map label;
  `Survey` joined PHASES as a display-only first step (search screen shows
  it as now, runs as done). Engine values untouched; bot untouched.
- **Refactor caveats to re-check in a browser (next session's first work):**
    1. Species colors are drawn per particle by a hash roll against the mix
       fractions — with 120 particles the visible metals fraction is
       approximate; judge whether it reads at 0.28 (solar) and near zero
       (threshold).
    2. Thermal motion is a wobble whose frequency carries px speed
       (2.4 px amplitude, hydrogen at 250 K: ~2.3 Hz) — buying radiative
       cooling slows it proportionally to the true ratio; confirm it reads,
       since per-level change is only x0.95.
    3. Reduced motion shows still streaks whose length carries each
       particle's speed — confirm they read as a still version, per
       teaching-principles "Visuals".
    4. The collapse scene's engine temperature does NOT rise while the
       cloud falls (engine only counts seconds), so the thermal channel
       shows cooling-modified temperature only; crowding carries the fall.
       Confirm that reads as intended before changing it (engine values
       stay as they are per the task).
    5. Old saves' observation notes carry phase indices from before
       `Survey` joined PHASES, so their expiry is off by one (cosmetic,
       one-time). Decide whether that warrantss a note or a log-shape
       version key.
    6. Verify the collapse/gather scenes' zoom, black-hole warp (both on and
       off), the gauge layout at 390 px (floor text vs ticks), and
       screenshots at 390/1280 with and without reduced motion — screenshots
       via `uv run python tools/shoot.py` plus a .scratch driver page like
       the earlier sessions' for the survey slider states.
- **Verification done so far:** poe check 78 tests pass (the 22 new mapping
  checks included; parity included); build in sync; nothing driven in a
  browser yet.
- **Reviews:** none run yet. Per CLAUDE.md order: code-reviewer, then ui-ux
  (new canvas text and layout), then code-reviewer last (app.js touched).
- **Then:** push and open the PR (owner's call). The disk-readability task
  (fragments, stability colors, setup strip) is drafted NEXT below and was
  started, read-only, before this task took over.
- **Working state:** metals redesign merged (PR #15), screenshot tool merged
  (PR #16), docs review merged (PR #17).
- **Pacing:** unchanged by the metals and screenshot batches (bot identical).
  Early runs ~13.4 min vs the 15-20 target — still open (see below).
- **Next action:** browser-verify and review the visible-gas branch above.
  Still open from before: whether to lengthen early runs toward 15 minutes,
  and whether 16 rings is enough (32 would cost about 2x). Then the
  angular-momentum ledger.
- **Stages after that:** angular-momentum ledger; DATA_REPORT.md note that its
  cap tables are superseded; visuals last.
- **Human check:** play a first run at ×10. It should still reach
  a supernova in roughly the same time as before fragments. The "Companion stars" row will
  mostly read 0, since fragments usually merge. The Journal entry's companion
  list is empty unless a fragment survives to the end of accretion.
- **Blocked by:** none recorded.
