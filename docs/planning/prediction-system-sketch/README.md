# Prediction system sketch

> Planning note; last updated 2026-11-11. Sketch only; needs an external canvas runtime, not shipped.

Live canvas: https://claude.ai/artifact/HQyeWZfkxCohdQ3bepb19s

These are the canvas's source files, kept for reference. The `.dc.html` screens need the canvas's runtime, so view them through the link rather than opening them directly. Each screen loads `./support.js`, which the canvas runtime supplies; it is deliberately not committed, so opening a screen locally gives a 404 for that script and a blank page.

| File | Screen |
| --- | --- |
| `Main.dc.html` | Predict before the change (clickable) |
| `Result.dc.html` | After the run |
| `Streak.dc.html` | A locked prediction breaks |
| `Board.dc.html` | Relationship board |
| `Bins.dc.html` | How the bins grow |

The rules these screens illustrate are in `../prediction-system.md`. Where a screen and the rules differ, the rules win: Insight pays for board milestones only, so the per-result and streak-break Insight boxes on screens 2 and 3 are superseded, and screen 3's turbulence direction is the opposite of what the current engine gives.

Numbers are illustrative, except the collapse-mass and infall changes, which follow the game's temperature scaling. Insight rewards are placeholders. Screen 3 uses the proposed infall surge, which is not built yet.
