# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Accretion is a prototype idle game (Layer 1): gather gas, collapse, accrete, shine, die, then prestige into a new region. Controls unlock one at a time; a journal and bubble plot record each run.

Note: `../AGENTS.md` in the parent directory belongs to an unrelated Excel/LAMBDA project and does not apply here.

## Commands

```bash
uv run --extra dev pytest                                  # all tests
uv run --extra dev pytest tests/test_game.py::test_mass_budget_closes_through_a_run   # one test
uv run --extra dev ruff check .                            # lint (pydocstyle on src/, not tests/ or tools/)
python tools/build.py                                      # regenerate web/accretion.html
uv run python tools/bot.py                                 # simulated first-run player: phase timings, final star
```

The parity test needs `node` on PATH; without it the test is skipped, not failed.

## Architecture: two engines that must agree

The game rules exist twice, and both copies are authoritative:

- **Python reference** in `src/accretion/`: `physics.py` (constants, stellar lookup tables, lifetimes, luminosity, endings, yields, cosmic metal clock), `disk.py` (conservative viscous disk on a 16-cell specific-angular-momentum grid, backward Euler with a tridiagonal solve, units AU / M☉ / yr), and `game.py` (the `Meta` and `Run` dataclasses, phase machine `gather → collapse → accrete → main_sequence → ended`, upgrades, unlocks, prestige, journal).
- **Browser port** in `web/engine.js`: one `Engine` IIFE holding all three modules, with camelCase names (`new_run` → `newRun`, `z_density` → `zDensity`). It exports through `module.exports` so Node can load it.

**Every rule or constant change goes into both `game.py`/`physics.py`/`disk.py` and `engine.js`.** `tests/test_parity.py` plays three fixed regions through a scripted policy in Python, runs the same policy through `tools/parity_runner.js` in Node, and compares the results to `rel=1e-9`. If you change what the parity script exercises, edit both `play()` functions together.

The engine is deterministic and step-size independent: `step(run, meta, seconds)` subdivides internally (`SIM_STEP_YEARS`), so one 3600 s step must land where 1800 × 2 s steps do (`test_one_long_step_matches_many_short_steps`). The browser relies on this for offline progress: `app.js` `load()` calls `E.step` with the time away. Mass is conserved through accretion: `star_mass + ejected + companions == collapse_mass`.

## Web front end

- `web/app.js` holds UI state, rendering (play, ended, search, and journal panes), hints, milestones, the canvas sky, and `localStorage` save under `SAVE_KEY` (`accretion-prototype-v3`). Bump the key if the saved `meta`/`run` shape changes incompatibly.
- `web/body.html`, `web/style.css`, `engine.js`, and `app.js` are concatenated by `tools/build.py` into the single-file `web/accretion.html`. Treat that file as a build output: edit the sources and rebuild, never edit it by hand.

## Fidelity and data provenance

`FIDELITY.md` labels each modeled element Established / Simplified / Debated / Game rule, and `DATA_REPORT.md` gives the published sources and tables behind the constants in `physics.py`. When you change a physical value or formula, update its row in `FIDELITY.md`. Keep that file's distinction between physics anchored in the literature and tuned game rules (pacing, costs, unlock order, `LOCAL_GAS_MASS`).

## Design source of truth

The design spec is the Claude Docs artifact "Accretion Idle Game Design Spec"
(https://claude.ai/artifact/1gpEKCKoirRe5r32YYVuQs). Its Decisions section separates decided choices
from proposals. Check a change against it, and flag anything that contradicts a decided choice
rather than silently changing it.

## Design principles

- Stay as scientifically grounded as possible. Prefer an established model or published table over
  an invented rule, and label every departure in `FIDELITY.md`. Stellar engineering and new
  universes are the only deliberately speculative elements.
- Players build intuition by changing one thing at a time. Controls unlock one at a time, each when
  the player has felt the problem it solves. Do not add previews, forecasts, ghost markers, or model
  runs: they were considered and rejected.
- Controls must never be mysterious, but phenomena can be. Always state a control's direct effect
  plainly. Explain the underlying science only after the player has seen it happen.
- Logging is required. The journal records every run. Its bubble plot uses log gas temperature and
  log density as axes, with bubble area set by final mass and color by ending.
- Hints are tiered (direction, then lever, then explanation), offered on request, and nudged only
  when the player appears stuck.

## Decided mechanics (do not change without discussion)

- Any stellar death ends the run and triggers a prestige. Supernovae pay heavy elements. Novae,
  planned for Layer 3 binaries, would pay probability without ending the run, limited by companion
  mass.
- The probability budget is `ln(N)`, where N is the lifetime count of regions surveyed. Region
  rarity costs `-ln(p)`, so independent choices add up. Allocations are fully refundable every
  prestige. Failed runs multiply N by a small percentage.
- Region search changes where the player starts, never the physical constants.
- A time skip or abandoned run is movement to a new region. The universal clock advances only by the
  time that actually passed in the run, never by the skipped remainder. Skipped time earns no
  time-based progress.
- The universal clock persists across runs, so composition and starting conditions evolve.
- Black holes unlock a region-search option to start near one. They give no currency or permanent
  gravity bonus.
- There are six prestige layers. The supermassive black hole at the galactic core leads to a new
  universe, which restarts the clock. A final currency skips the early grind; it is not designed yet.
- Early runs are short (about 15 to 20 minutes) and grow toward an hour as controls unlock.
- Pristine stars from about 9 to 25 M☉ always explode, so the first supernova objective is reliable.
  This is a labeled game rule.
- Explosion gaps for enriched stars are deterministic by mass, never random, so the engines stay in
  parity and players can learn the map. Any future randomness must be seeded and mirrored in both
  engines.
- Offline progress uses the same engine as live play. Do not tabulate unless a benchmark on a
  low-end phone shows the solver is too slow; if so, generate versioned tables from code with
  solver fallback.

## Data caveats

- Most paper values in `physics.py` came through a text-extraction tool, and some yield tables came
  from redistributed copies (NuPyCEE, VICE). Spot-check against the original papers before marking
  anything Established.
- Several values are calibrations rather than published results: the HII taper's break mass, the 5×
  photoevaporation factor, the explosion-gap edges, `LOCAL_GAS_MASS`, and the enriched temperature
  margin.
- Not yet modeled: novae, the pulsational pair-instability ending, and a planet-era disk with its own
  much lower alpha and disk-lifetime clock (see `DATA_REPORT.md`).

## Working conventions

- Before writing mathematical or physics code, state the concepts, variables, formulas, and
  assumptions in plain language first.
- Python for modeling and tooling: uv, ruff, numpydoc docstrings, EAFP style.
- Use meaningful PR names, and do not prefix branches or PRs with `claude/`.
- The test-speed buttons in `app.js` are a development aid, not a game feature.
- The `window.claude?.hot` calls in `app.js` support live reload in the published artifact viewer.
  They do nothing elsewhere and are safe to leave.