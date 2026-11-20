# Prediction system

> Planning note; last updated 2026-11-11. The rules for player predictions; the owner ruling is in `docs/DECISIONS.md`.

The rules behind the screens in `docs/planning/prediction-system-sketch/`. Status: **Decided** where marked, otherwise **Proposed**. Where a sketch screen and this page differ, this page wins.

## Ruling (Decided, 2026-11-11)

The game never forecasts; the player may. Players commit predictions blind, the game shows nothing about an outcome before it happens, and a prediction resolves only against runs the player has played. Previews, forecasts, ghost markers, and model runs stay rejected.

The audit tool's true bins may inform debrief explanations and developer testing. They never grade a prediction about a relationship the player has not tested, since that would leak the answer.

## Scope of v1 (Decided)

- Relationship predictions only: "when I change this setting, this quantity goes ...".
- No rewards, matching step 6 of `implementation-order.md`, to test whether predicting is engaging on its own.
- Event predictions (a tracked fragment's fate) and ending predictions (made at ignition) are deferred. See "Later kinds" below.

## What counts as a test

- A test is a pair of runs that differ in exactly one input: the run and its baseline.
- Inputs are effective values, not slider positions. Region settings count, and so do in-run purchase levels by their effect: the run's actual gas temperature and actual alpha. Greedy in-run cooling therefore changes the temperature input and is not a clean test of anything else.
- **Baseline (Decided):** the previous run by default, within the current epoch (see "Epochs" below). The player may pick any journal run as the baseline instead, once the baseline picker has unlocked.
- **Two control-of-variables tools (Decided),** each unlocking with the confound it solves, so they never arrive together:
  - **Hold to baseline** unlocks after the first run confounded by in-run purchases. Set at the survey, it buys each in-run upgrade up to the baseline's level as soon as energy allows and refuses purchases beyond it. Purchase timing may differ from the baseline; that difference is a consequence of the changed setting, so the test stays clean. If a baseline level cannot be reached, the run records the shortfall and the overlay says so.
  - **Baseline picker** unlocks after the first run confounded at the survey, when two region settings changed at once. The player can then compare against any journal run instead of the previous one.
- The first confounded run of each kind gets a short refutation card: changing two things at once cannot show which one caused the result.
- A run that differs from its baseline in more than one input is confounded. Its predictions do not resolve, and the board says which inputs changed together.

## Epochs (Decided, 2026-11-11)

The universal clock and enrichment change a region's composition and background temperature between runs, even when the player moves no slider. Read strictly, "differs in exactly one input" would then leave almost no clean tests. Epochs resolve this for now.

- The inputs the universal clock drives (composition and background temperature) are divided into epochs. Within an epoch they count as the same input, so two runs in one epoch can form a clean test.
- A run and its baseline must be in the same epoch. A pair that spans two epochs does not resolve a prediction.
- When the epoch changes, predictions reset. The journal's notes start a new page: a carbon copy of the prior epoch's page, under a header that states the main differences in composition and background temperature.
- **Proposed reading of "reset":** on the new page the copied cells are carried as predictions still to be tested in this epoch, and streaks restart. The prior epoch's page stays readable as a record.
- **Open:** where the epoch boundaries fall. The engine has natural candidates: the primordial metallicity threshold (`PRIMORDIAL_METAL_LOG10` in `physics.py`), the range where the temperature floor falls with metallicity, and the point where the cosmic background sets the floor. How much composition drifts inside one epoch has not been measured; the audit tool should report it.

## Making and resolving predictions

- At the survey, the game lists the quantities the change can affect, as in `Main.dc.html`. The player picks a bin for each, or "not sure".
- Quantities come in two stages. Direct effects (collapse mass, infall rate) resolve when the region is found. Net effects (final mass, then run time) resolve when growth ends and when the run ends.
- The result screen (`Result.dc.html`) compares each pick with the outcome and calls out the surprise when the direct effects were right but the net effect went the other way.
- Every resolution shows the causal chain, using the And, But, Therefore pattern. Each relationship needs one explanation entry in `content/notes.toml`, plus a variant per "Depends" condition.

## The in-run overlay (Decided)

- Predictions appear on the live stats rows rather than in a separate box: the player's glyph sits beside each predicted quantity and turns to a check or a cross when that stage resolves.
- **Baseline value (Decided):** the baseline run's value sits beside each predicted quantity, shown faintly or in a different color. It is a historical record of a run the player has played, not a projection or forecast, so it is not a ghost marker.
- A test-status line names the baseline and says whether the run is still a clean test. Buying an in-run upgrade beyond the baseline's level flips it to confounded and names the input. The "This run's setup" strip (`setupItems` in `web/visuals.js`) already lists the settings and levels this line compares.
- Predictions cannot be made or edited during a run, which removes any reason to steer an outcome.
- A locked prediction that breaks shows the streak-break card at that moment, not at the end of the run.
- The first prediction is asked in run 1's debrief, so the overlay first appears in run 2 already holding a prediction and the run-2 survey gains nothing new.

## Bins, locks, and the board

- Bins unlock in the order shown in `Bins.dc.html`: direction first, then shape, strength, and "Depends". Each stage arrives only when the earlier bins fail to describe something the player has seen.
- Each quantity row has a lock toggle, as in `Main.dc.html`. A locked prediction is carried into every later test of that setting without being re-entered, keeps a streak of confirmations, and is checked each time.
- A locked prediction that fails offers "Depends" for that relationship. The board records the run that broke it and which conditions differed.
- The board shows the player's own model: confirmed, predicted but untested, depends, and untested cells, as in `Board.dc.html`.

## Insight (Decided: milestones only; amounts deferred)

Insight is paid for board milestones, never for individual predictions, so guessing cannot be farmed. Each milestone pays once per relationship. The per-result and streak-break Insight placeholders on `Result.dc.html` and `Streak.dc.html` predate this rule.

| Milestone | Condition |
| --- | --- |
| Direction confirmed | A locked direction matches a second clean test |
| Shape found | A shape prediction matches the player's tests |
| Strength found | A strength prediction matches the player's tests |
| Depends discovered | A locked prediction breaks and the player marks it "Depends" |

- A milestone counts only if the player's prediction stood before the confirming test.
- Later, the confirming tests may need to come from different starting conditions, using the context counts in `pinned-ideas.md`.
- Payout amounts wait until v1 shows whether predicting is engaging without rewards.

## What Insight buys (Proposed)

Insight buys ways of seeing and conveniences. It never buys a physics outcome (teaching principle 1). Candidates, in rough unlock order:

1. Live gauges: Toomre Q per ring, infall against ionizing output, core temperature.
2. Telescope resolution: how far inward the player can observe and track.
3. Automation of a confirmed relationship. For example, an auto-buyer for turbulence becomes available once its relationship is confirmed. This departs from common idle practice, where automation is bought with currency.
4. Speed tiers, applied in the UI only, gated on the number of confirmed relationships. Time compression stays disclosed.
5. Late observation modes: parallel coordinates, fog on the bubble plot, the endings atlas.

Hints stay free on request.

## Help and debrief

- Help fades for confirmed relationships: the tooltip shortens to its hook, and hints for that relationship stop nudging (teaching principle 8).
- The prestige debrief summarizes what the run showed and ends by asking what the player will change next and what they expect. The answer becomes the next run's prediction.

## Later kinds (Deferred)

| Kind | Made | Resolves | Needs first |
| --- | --- | --- | --- |
| Event: a tracked fragment's fate (merge, tidal disruption, survival) | Accretion | In the run | Fragment survival physics; candidates show observables only. Fragments are already drawn (PR #20) |
| Ending: what a star of known mass becomes | At ignition | At the end | Nothing new in the engine; fills the main sequence |

## Prerequisites before v1

- The run record (`implementation-order.md` step 1) and the audit tool (step 2).
- Check relationship text against the [engine audit](../audit/report.md).
  The 2026-11-20 first-run sweeps used the bot at 0.5 taps per second.
  - **Turbulence generally lowers final mass.** At caps 0 through 4,
    the first-run star ends at 26.16, 25.07, 21.35, 21.13, and 21.52 M☉.
    The ending changes from black hole to supernova at level 2, and mass
    rises by 0.40 M☉ from level 3 to 4 before rounding. The bot can afford
    four levels. In the hotter pristine context, the masses at levels 0,
    2, and 4 are 33.14, 29.19, and 29.03 M☉.
  - **Density has no direct effect on final mass in the first-run sweep.**
    With turbulence held at level 0, the final mass stays at 26.16 M☉ across
    densities of about 498 to 200,855 cm⁻³. Collapse mass falls from about
    10,993 to 547 M☉. With greedy purchases, the final masses are 22.44,
    23.03, 21.52, 21.32, and 21.10 M☉. Purchase timing can affect the result
    even when the final turbulence level is the same.
- `tests/test_audit.py` checks the documented first-run turbulence
  masses and density result.
