# Accretion prototype

Layer 1 of the Accretion idle game: gather, collapse, accrete, shine, die, and search a new region. Controls unlock one at a time, and a journal and bubble plot record each run.

- `src/accretion/`: reference physics and game rules in Python
- `web/`: browser engine and interface
- `tests/`: physics, game rule, and Python/JavaScript parity tests
- `tools/bot.py`: simulated first-run player
- `tools/build.py`: builds `web/accretion.html`

```bash
uv run poe check
uv run python tools/build.py
```

The parity and engine tests need `node` on `PATH`; without it those tests
skip instead of failing.

Any rule change must be made in both `src/accretion/game.py` and `web/engine.js`. The parity test fails if they drift.

See `FIDELITY.md` for each model's status and `DATA_REPORT.md` for sources.

## Launch and test by hand

The game is a single static page, so there is nothing to serve.

1. Run `uv run poe launch`. It rebuilds `web/accretion.html` from the sources
   and opens it in a new Chrome window (falling back to your default browser
   if Chrome is not found). Run it again after any change to `web/` or the
   `src/` rules.
2. To do it by hand instead: `uv run python tools/build.py`, then open
   `web/accretion.html` in a desktop browser. A network connection is only
   needed for the fonts; the game works without it.
3. Play through a run: gather gas, collapse, accrete, shine, and die, then pick
   a new region. The Journal tab should show one entry for the run.

Handy while testing:

- **Test speed** (bottom of the page) runs the clock at ×1, ×10, and ×60, so a
  run is much shorter than the real 15 to 20 minutes.
- **Reset** (bottom of the page, tap twice) erases the save and starts over.
- Progress is saved in the browser's `localStorage` under the key
  `accretion-prototype-v4`. If a build changes the save format, the key is
  bumped and old saves are ignored, so a fresh start is expected after
  updating. To clear it by hand, use the browser's site-data settings or
  `localStorage.clear()` in the developer console.
- Reload mid-run to check that progress and offline time are restored.

Disk fragmentation and companion stars are part of the current simulation. A
run's journal records surviving companions, and the play screen's "Companion
stars" row reflects the current companion mass in that run.

## Pre-commit hook

A tracked git hook in `.githooks/pre-commit` runs before every commit. It checks that
`web/accretion.html` matches the web sources (`uv run python tools/build.py --check`), then runs
`uv run poe check` (lint, format check, tests). Turn it on once per clone:

```bash
uv run poe hooks
```

If it blocks a commit for a stale build, run `uv run python tools/build.py` and stage
`web/accretion.html`. For lint or format failures, fix them or run `uv run poe format`.
`git commit --no-verify` skips the hook; CI runs the same lint and tests but does
not yet verify the built page, so an unhooked commit can ship a stale build
(see `docs/NEXT.md`).

## License

Copyright (c) 2026 Stephen Colodner. All rights reserved. See [LICENSE](LICENSE).
