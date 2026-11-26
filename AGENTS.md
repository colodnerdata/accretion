# Agent instructions

This is the canonical source of project instructions for coding assistants.
Tool-specific entry points should reference it instead of copying its rules.

## Get oriented

1. Read `README.md` and `docs/NEXT.md` for purpose and current work, and
   `intent/intent.md` for goals, scope, and success criteria. For a change
   with its own `intent.md`, `spec.md`, or `plan.md`, read those too (see
   "From intent to merge" in `docs/DEVELOPMENT.md`).
2. Read `docs/DEVELOPMENT.md` for commands and verification boundaries.
3. Before a design change, search `docs/DECISIONS.md` by mechanism or concept.
   Preserve rejected approaches and explain any decision you supersede.
4. Check a design change against `intent/spec.md`, the design's source of
   truth. Its Decisions section separates decided choices from proposals.
   Flag anything that contradicts a decided choice rather than changing it.

## Work on the requested change

- Prefer the simplest correct implementation that makes the reasoning clear.
- Keep domain logic separate from file access, presentation, and integrations.
- State mathematical conventions, assumptions, units, and tolerances where
  relevant. Cite a source when implementing a nontrivial published method.
- Use type hints on public Python functions. Explain non-obvious behavior in
  docstrings; use NumPy-style sections where useful.
- Keep changes focused. Avoid speculative frameworks, unrelated cleanup, or
  dependencies without a concrete need.
- Preserve existing uncommitted work and report any conflict with it.
- Implement from the approved `plan.md` when one exists. When the work
  departs from it, update `plan.md` in the same commit.
- Propose changes to an `intent.md` to the owner, since it records the
  owner's own statement of the work.

## Verify what changed

- Before reporting a code change complete, run each check below and report
  each result on its own. If a test fails, fix the code, not the test.

  | Check | Command | Healthy output |
  | --- | --- | --- |
  | Lint | `uv run --locked ruff check .` | ends with `All checks passed!` |
  | Format | `uv run --locked ruff format --check .` | ends with `N files already formatted` |
  | Build | `uv run --locked python tools/build.py --check` | exits 0 with no output |
  | Tests | `uv run --locked pytest -m "not property"` | `N passed` and no failures |

  CI runs these as the Lint, Format, Build, Tests and Browser jobs; Browser
  runs the tests marked `browser`, which skip locally without Chromium. Say
  so when they skipped. `poe check` is the owner's shortcut for all four;
  report the separate results.
- Edit a committed test only when the test itself is wrong. Such an edit
  asks for the owner's approval.
- Add tests for changed behavior and regression risks. Prefer invariants,
  small explicit cases, and independent expected results to implementation
  snapshots. Formatting-only or prose edits do not need new tests.
- For generated deliverables, rebuild first and inspect the newly generated
  output. A check of an old artifact is not evidence about the new code.
- Report exactly what ran, what passed, and what could not run. Mocks and
  structural checks do not establish integration or numerical correctness.
- Keep repeatable verification commands in `pyproject.toml`; CI calls them.

## Leave useful context

- Explain the result and its reason, with the relevant validation evidence.
- Record consequential tradeoffs in `docs/DECISIONS.md`. Routine edits do not
  need decision entries.
- Update `docs/NEXT.md` when stopping with unfinished work. Include a specific
  next action and any blocker; do not append a session transcript.
- Deliver changes on a branch as a PR; the owner reviews and merges.
- Publishing, merging, or sending messages follows the owner's instructions.
  These repository notes are not blanket authorization for those actions.

## Respond to PR review

- Monitor each PR you open and respond to every review comment, from people
  and from bots.
- Respond with either a fix or an explanation of why the comment is incorrect
  or irrelevant, and reply on the comment's thread. When you applied a fix,
  name the commit or PR in the reply.
- Land each fix on the reviewed PR's own branch while that PR is open: a
  commit for a quick fix, or a PR into that branch for a significant change.
  The owner then squash-merges the reviewed PR into main with every fix in it.
- Check a bot's finding against the code before acting on it, and reproduce a
  reported bug before fixing it.
- Resolve a conversation once its fix is pushed, or once your reply explains
  why you are leaving the code as it is.
- Bring judgment calls to the owner and leave those conversations open. These
  include design or scope changes, security findings, and disagreements with
  the owner's own comments.

# Accretion

Accretion is a prototype idle game (Layer 1): gather gas, collapse, accrete,
shine, die, then prestige into a new region. Controls unlock one at a time; a
journal and bubble plot record each run. `intent/intent.md` says what the game
is for; `intent/spec.md` is the design.

## Architecture: two engines that must agree

The game rules exist twice, and both copies are authoritative:

- **Python reference** in `src/accretion/`: `physics.py` (constants, stellar lookup tables, lifetimes, luminosity, endings, yields, cosmic metal clock), `disk.py` (conservative viscous disk on a 16-cell specific-angular-momentum grid, backward Euler with a tridiagonal solve, units AU / M☉ / yr), and `game.py` (the `Meta` and `Run` dataclasses, phase machine `gather → collapse → accrete → main_sequence → ended`, upgrades, unlocks, prestige, journal).
- **Browser port** in `web/engine.js`: one `Engine` IIFE holding all three modules, with camelCase names (`new_run` → `newRun`, `z_density` → `zDensity`). It exports through `module.exports` so Node can load it.

**Every rule or constant change goes into both `game.py`/`physics.py`/`disk.py` and `engine.js`.** `tests/test_parity.py` plays three fixed regions through a scripted policy in Python, runs the same policy through `tools/parity_runner.js` in Node, and compares the results to `rel=1e-9`. If you change what the parity script exercises, edit both `play()` functions together.

The engine is deterministic and step-size independent: `step(run, meta, seconds)` subdivides internally (`SIM_STEP_YEARS`), so one 3600 s step must land where 1800 × 2 s steps do (`test_one_long_step_matches_many_short_steps`). The browser relies on this for offline progress: `app.js` `load()` calls `E.step` with the time away. Mass is conserved through accretion: `star_mass + ejected + companions == collapse_mass`.

## Web front end

- `web/app.js` holds UI state, rendering (play, ended, search, and journal panes), hints, milestones, the canvas sky, and `localStorage` save under `SAVE_KEY` (`accretion-prototype-v4`). Bump the key if the saved `meta`/`run` shape changes incompatibly.
- `web/body.html`, `web/style.css`, `engine.js`, and `app.js` are concatenated by `tools/build.py` into the single-file `web/accretion.html`. Treat that file as a build output: edit the sources and rebuild, never edit it by hand.

## Fidelity and data provenance

`FIDELITY.md` labels each modeled element Established / Simplified / Debated / Game rule, and `DATA_REPORT.md` gives the published sources and tables behind the constants in `physics.py`. When you change a physical value or formula, update its row in `FIDELITY.md`. Keep that file's distinction between physics anchored in the literature and tuned game rules (pacing, costs, unlock order, `LOCAL_GAS_MASS`).

## Design principles

- Stay as scientifically grounded as possible. Prefer an established model or published table over
  an invented rule, and label every departure in `FIDELITY.md`. Stellar engineering and new
  universes are the only deliberately speculative elements.
- Players build intuition by changing one thing at a time. Controls unlock one at a time, each when
  the player has felt the problem it solves. Do not add previews, forecasts, ghost markers, or model
  runs: they were considered and rejected. The game never forecasts; the player may. Player
  predictions are made blind and resolve only against runs the player has played (see
  `docs/planning/prediction-system.md`). A value recorded from a run the player has played is a
  historical record, not a ghost marker, and may be shown beside a live stat.
  The only projection the game shows is a star's duration, and only where nothing else can be done:
  the shine phase, where the star can be skipped. A skipped star never shows its final mass or
  ending category, on the ended screen or in the journal.
- Controls must never be mysterious, but phenomena can be. Always state a control's direct effect
  plainly. Explain the underlying science only after the player has seen it happen.
- Logging is required. The journal records every run. Its bubble plot uses log gas temperature and
  log density as axes, with bubble area set by final mass and color by ending. A run the player left early is the exception: a
  fixed-size neutral dashed bubble with no ending or mass.
- Hints are tiered (direction, then lever, then explanation), offered on request, and nudged only
  when the player appears stuck.

## Protected decisions (do not change without discussion)

These are the decided mechanics code most often touches. The full record is
the Decisions section of `intent/spec.md`.

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
- Black holes unlock a region-search option to start near one. They pay the ordinary run reward
  (probability, plus their physical heavy-element yield) and no bonus currency or permanent gravity
  bonus.
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
