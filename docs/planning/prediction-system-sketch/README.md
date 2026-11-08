# Prediction system sketch

Live canvas: https://claude.ai/artifact/HQyeWZfkxCohdQ3bepb19s

These are the canvas's source files, kept for reference. The `.dc.html` screens need the canvas's runtime, so view them through the link rather than opening them directly. Each screen loads `./support.js`, which the canvas runtime supplies; it is deliberately not committed, so opening a screen locally gives a 404 for that script and a blank page.

| File | Screen |
| --- | --- |
| `Main.dc.html` | Predict before the change (clickable) |
| `Result.dc.html` | After the run |
| `Streak.dc.html` | A locked prediction breaks |
| `Board.dc.html` | Relationship board |
| `Bins.dc.html` | How the bins grow |

Numbers are illustrative, except the collapse-mass and infall changes, which follow the game's temperature scaling. Insight rewards are placeholders. Screen 3 uses the proposed infall surge, which is not built yet.
