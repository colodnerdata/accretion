# Implementation order

The run record and the audit tool come first because almost every later feature reads from them.

| Step | Work | Why here | Depends on |
| --- | --- | --- | --- |
| 1 | Run record; copy audit and physics or game-rule labels; spot-check the Layer 1 values in `physics.py` | The run record stores each run's settings, outcomes and time series. The audit, predictions, debrief, board and hypercube all read from it. The text fixes are cheap and depend on nothing. | — |
| 2 | Audit tool, as a standalone report | Gives the true bin for each relationship, which the prediction system checks against, and tests the engine. Written in Python against the Python engine; the two engines match, so it covers the JavaScript game too. | 1 |
| 3 | Disk breakup and companions; rerun the audit | Creates relationships that depend on conditions, which is what lets a player break a prediction that had held up. Comparing the two audit reports shows what the mechanic changed. | 2 |
| 4 | Baseline playtest (optional) | Pre-test questions on the game before the teaching features exist, so a later playtest can measure what they add. | 3 |
| 5 | Prediction system v1 and prestige debrief | Bins, locks, per-quantity toggles, detection of runs that change more than one setting, and the board. No rewards yet, to test whether predicting is engaging without them. The debrief ends by asking for a prediction about the next run. | 1, 2, 3 |
| 6 | Live gauges, then Insight rewards | Gauges show hidden quantities so players have more to predict. The first Insight unlocks can be the gauges themselves. | 5 |
| 7 | More Layer 1 and 2 content: infall surge, closing pristine window, endings atlas | Each one is a new relationship for the audit and the board. | 2, 5 |
| 8 | Layer 3 (binaries, Lagrange storage) and the hypercube view | Binaries build on companions being simulated as objects. The hypercube reuses the audit's sampling and the run record. | 3, 5 |

## Verification timing

Verify each layer's values before that layer is built. Only the Layer 1 stellar values are needed now. Habitable-zone and binary values wait until Layer 3.

## Open choice

Steps 3 and 5 could be swapped. Building predictions first makes the teaching loop playable sooner. Building companions first means predictions launch with something that can break them. The current choice is companions first.
