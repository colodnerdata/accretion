# Implementation order

> Planning note; last updated 2026-11-11. The order the decided features are built in.

The run record and the audit tool come first because almost every later feature reads from them. Player predictions follow the rules in `prediction-system.md` and the screens in `prediction-system-sketch/` (added in PR #11).

| Step | Work | Why here | Depends on |
| --- | --- | --- | --- |
| 0 | Hygiene: correct the density hints and the "buy as soon as energy allows" hint against the engine; rename or justify the shipped "Forecast life" and "Forecast ending" labels and the "longer than forecast" note; refresh `docs/NEXT.md` | The hints currently point at levers the engine does not have, which would seed wrong predictions. The forecast labels sit badly beside the rule that the game never forecasts. | — |
| 1 | Run record; copy audit and physics or game-rule labels; spot-check the Layer 1 values in `physics.py` | The run record stores each run's settings, effective inputs (including in-run purchase levels), epoch, outcomes and time series. The audit, predictions, debrief, board and hypercube all read from it. The text fixes are cheap and depend on nothing. | — |
| 2 | Audit tool, as a standalone report | Gives the true bin for each relationship, used for debrief explanations and to check the relationship text before it ships. It never grades a player's untested relationship. Written in Python against the Python engine; the two engines match, so it covers the JavaScript game too. | 1 |
| 3 | Edge-on cross-section inset | Fragments are now drawn in the disk view, with rings colored by stability (PR #20). The inset still to build shows flaring, the poles and outflows from values the engine already has. UI only, no parity cost. | — |
| 4 | Disk breakup and companions, in stages, rerunning the audit after each: (a) baseline migration calibration, then gap opening, clump contraction and tidal disruption; (b) linear Toomre fragmentation (spacing 2πQH, count, mass, growth rate); (c) the cooling-time gate | Creates relationships that depend on conditions, which is what lets a player break a prediction that had held up. Companions stay records only in Layer 1. Each stage alone keeps the audit diffs readable and protects the guaranteed first supernova. | 2 |
| 5 | Baseline playtest (optional) | Pre-test questions on the game before the teaching features exist, so a later playtest can measure what they add. | 4 |
| 6 | Player predictions v1 and prestige debrief | Relationship predictions only, as in the sketch: direction bins, per-quantity locks with streaks, direct and net stages, the result screen with its surprise callout, detection of runs that differ from the baseline in more than one effective input, and the board. Predictions live on the in-run stats rows with a test-status line. Baseline defaults to the previous run in the same epoch; predictions reset on a new journal page when the epoch changes. Hold to baseline unlocks after the first purchase confound, and the baseline picker after the first survey confound. No rewards yet, to test whether predicting is engaging without them. The debrief ends by asking for a prediction about the next run. | 1, 2, 4 |
| 7 | Live gauges, then Insight | Gauges show hidden quantities so players have more to predict. Insight pays for board milestones only (direction confirmed, shape found, strength found, Depends discovered). The first Insight unlocks can be the gauges themselves. Shape, strength and Depends bins unlock as in `Bins.dc.html`. | 6 |
| 8 | Event and ending predictions | Track a fragment and predict its fate (merge, tidal disruption, survival), showing observables only. Predict a star's ending at ignition, which gives the main sequence something to do. | 4, 6 |
| 9 | More Layer 1 and 2 content: stir a ring, infall surge with a turbulence guard, closing pristine window, endings atlas | Each one is a new relationship for the audit and the board. | 2, 6 |
| 10 | Population views and pacing: companion-separation plot, telescope resolution, speed tiers and automation bought with Insight | The separation plot needs continuous fragment birth radii or the ring-count decision first, or the grid shows up as false stability zones. Speed stays UI only and disclosed. | 4, 7 |
| 11 | Layer 3 (binaries, Lagrange storage) and the hypercube view | Binaries build on companions being simulated as objects. The hypercube reuses the audit's sampling and the run record. | 4, 6 |

## Verification timing

Verify each layer's values before that layer is built. Only the Layer 1 stellar values are needed now. Habitable-zone and binary values wait until Layer 3.

## Open choice

Steps 4 and 6 could be swapped. Building predictions first makes the teaching loop playable sooner, and direction bins already have material: the result screen's surprise (temperature raises the collapse mass but also the final mass) works with the current engine. Building companions first means predictions launch with something that can break a locked rule, which the Depends bin and the streak-break screen need. Step 4 is now three stages, which makes waiting for it longer. The current choice is companions first.
