# Accretion prototype

Layer 1 of the Accretion idle game: gather, collapse, accrete, shine, die, and search a new region. Controls unlock one at a time, and a journal and bubble plot record each run.

- `src/accretion/`: reference physics and game rules in Python
- `web/`: browser engine and interface
- `tests/`: physics, game rule, and Python/JavaScript parity tests
- `tools/bot.py`: simulated first-run player
- `tools/build.py`: builds `web/accretion.html`

```bash
uv run poe check
python tools/build.py
```

Any rule change must be made in both `src/accretion/game.py` and `web/engine.js`. The parity test fails if they drift.

See `FIDELITY.md` for each model's status and `DATA_REPORT.md` for sources.
