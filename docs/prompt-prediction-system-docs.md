# Task: record the player prediction system in the Accretion design docs

You are working in the Accretion repository (an astrophysics idle/prestige game). This is a documentation-only change: update the design docs so they record the decided player prediction system and the revised implementation order. Leave engine, UI, content and test code unchanged.

## Background

`CLAUDE.md` says the game has no previews, forecasts, ghost markers or model runs. The teaching principles (`docs/planning/teaching-principles.md`, principles 3 and 4) call for predict-observe-explain and a debrief that invites a prediction. `docs/NEXT.md` queued an owner ruling on this. The owner has now ruled: **the game never forecasts; the player may.** The screens for the system are already in `docs/planning/prediction-system-sketch/` (added in PR #11). Read those screens and their README before writing, so the docs match them.

Owner decisions to record:
1. Player predictions are allowed. They are made blind and resolve only against runs the player has played. The audit tool's true bins inform debrief explanations and developer testing only.
2. Insight is paid for board milestones only, once per relationship per milestone. Amounts stay deferred.
3. A test compares a run with a baseline differing in one effective input (in-run purchase levels count). The baseline defaults to the previous run; the player may pick another.
4. v1 covers relationship predictions only, with no rewards.
5. Predictions live on the in-run stats rows with a test-status line, as a persistent overlay.
6. "Hold to baseline" is an unlockable control that appears only after the player's first run confounded by in-run purchases. The baseline picker unlocks after the first run confounded at the survey, so the two never arrive together.

## Steps

1. **Create `docs/planning/prediction-system.md`** with the content in Appendix A. Before saving, confirm two engine claims in its "Prerequisites before v1" section by running the Python engine (`src/accretion/game.py`) with the policy in `tools/bot.py`: (a) more disk turbulence gives a slightly smaller final star, and (b) the region density setting barely changes final mass. Adjust the wording to match what you measure, and state the numbers you got.
2. **Replace `docs/planning/implementation-order.md`** with the content in Appendix B.
3. **Edit `CLAUDE.md`, Design principles:** after the sentence ending "they were considered and rejected.", add: "The game never forecasts; the player may. Player predictions are made blind and resolve only against runs the player has played (see `docs/planning/prediction-system.md`)." Keep the file's existing line wrapping style.
4. **Edit `docs/planning/feature-backlog.md`:** change the "Prediction system" row to status **Decided**, with the note: "Rules in `prediction-system.md`, screens in `prediction-system-sketch/`. v1 is relationship predictions only, with no rewards. Insight later pays for board milestones only."
5. **Edit `docs/planning/pinned-ideas.md`, "Insight rewards":** replace the paragraph with "Moved to `prediction-system.md`: Insight pays for board milestones only. Payout amounts are still deferred."
6. **Append an entry to `docs/DECISIONS.md`** following the file's entry pattern:
   - Date and title: 2026-11-11 — Players may predict; the game never forecasts.
   - Status: accepted
   - Context: the no-previews principle against teaching principles 3 and 4; the ruling queued in `docs/NEXT.md`.
   - Decision: decisions 1 to 6 above, briefly, pointing to `docs/planning/prediction-system.md`.
   - Why: prediction carries strong learning evidence (d = 0.36), and blind player predictions reveal nothing the game knows. Per-prediction rewards were rejected because a free guess with a positive payout is always worth making; a confidence stake was rejected as an extra control for v1.
   - Revisit when: v1 playtests show predicting is not engaging without rewards, or event and ending predictions are added.
7. **Update `docs/NEXT.md`:** mark the "debrief vs rejected-previews" owner ruling as resolved, linking the new DECISIONS entry. Refresh any other lines you can confirm are stale from `git log`.
8. **Design spec:** `CLAUDE.md` names the "Accretion Idle Game Design Spec" doc as the source of truth. If you can edit it, update its decisions so the "without predictions or previews" wording reads as "without game previews or forecasts; players may make their own predictions", and add a pointer to `docs/planning/prediction-system.md`. If you cannot reach it, add that edit to `docs/NEXT.md` as an owner action.
9. **Check:** run the repository's documentation and text checks (see `.githooks/pre-commit` and `.github/workflows/ci.yml`) and the full test suite, and confirm they pass. Confirm every file path the new docs mention exists.
10. **Deliver:** create a branch named `docs/prediction-system-rules`, commit with a message that summarizes the ruling, and open a pull request titled "Record the player prediction system and revised implementation order". In the description, list the decisions and the two engine measurements from step 1.

## Appendix A: `docs/planning/prediction-system.md`

````markdown
# Prediction system

The rules behind the screens in `prediction-system-sketch/`. Status: **Decided** where marked, otherwise **Proposed**.

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
- **Baseline (Decided):** the previous run by default. The player may pick any journal run as the baseline instead.
- **Two control-of-variables tools (Proposed),** each unlocking with the confound it solves, so they never arrive together:
  - **Hold to baseline** unlocks after the first run confounded by in-run purchases. Set at the survey, it buys each in-run upgrade up to the baseline's level as soon as energy allows and refuses purchases beyond it. Purchase timing may differ from the baseline; that difference is a consequence of the changed setting, so the test stays clean. If a baseline level cannot be reached, the run records the shortfall and the overlay says so.
  - **Baseline picker** unlocks after the first run confounded at the survey, when two region settings changed at once. The player can then compare against any journal run instead of the previous one.
- The first confounded run of each kind gets a short refutation card: changing two things at once cannot show which one caused the result.
- A run that differs from its baseline in more than one input is confounded. Its predictions do not resolve, and the board says which inputs changed together.

## Making and resolving predictions

- At the survey, the game lists the quantities the change can affect, as in `Main.dc.html`. The player picks a bin for each, or "not sure".
- Quantities come in two stages. Direct effects (collapse mass, infall rate) resolve when the region is found. Net effects (final mass, then run time) resolve when growth ends and when the run ends.
- The result screen (`Result.dc.html`) compares each pick with the outcome and calls out the surprise when the direct effects were right but the net effect went the other way.
- Every resolution shows the causal chain, using the And, But, Therefore pattern. Each relationship needs one explanation entry in `content/notes.toml`, plus a variant per "Depends" condition.

## The in-run overlay (Proposed)

- Predictions appear on the live stats rows rather than in a separate box: the player's glyph sits beside each predicted quantity, with the baseline run's value shown faintly, and turns to a check or a cross when that stage resolves.
- A test-status line names the baseline and says whether the run is still a clean test. Buying an in-run upgrade beyond the baseline's level flips it to confounded and names the input.
- Predictions cannot be made or edited during a run, which removes any reason to steer an outcome.
- A locked prediction that breaks shows the streak-break card at that moment, not at the end of the run.
- The first prediction is asked in run 1's debrief, so the overlay first appears in run 2 already holding a prediction and the run-2 survey gains nothing new.

## Bins, locks, and the board

- Bins unlock in the order shown in `Bins.dc.html`: direction first, then shape, strength, and "Depends". Each stage arrives only when the earlier bins fail to describe something the player has seen.
- Each quantity row has a lock toggle, as in `Main.dc.html`. A locked prediction is carried into every later test of that setting without being re-entered, keeps a streak of confirmations, and is checked each time.
- A locked prediction that fails offers "Depends" for that relationship. The board records the run that broke it and which conditions differed.
- The board shows the player's own model: confirmed, predicted but untested, depends, and untested cells, as in `Board.dc.html`.

## Insight (Decided: milestones only; amounts deferred)

Insight is paid for board milestones, never for individual predictions, so guessing cannot be farmed. Each milestone pays once per relationship.

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
| Event: a tracked fragment's fate (merge, tidal disruption, survival) | Accretion | In the run | Fragment survival physics and fragment drawing; candidates show observables only |
| Ending: what a star of known mass becomes | At ignition | At the end | Nothing new; fills the main sequence |

## Prerequisites before v1

- The run record (`implementation-order.md` step 1) and the audit tool (step 2).
- Rerun the audit and correct relationship text against it. `Streak.dc.html` shows turbulence raising final mass, but the current engine gives a slightly smaller star with more turbulence.
- Density barely moves final mass in the current engine. "No change" is a fine result to teach, but the density hints in `content/hints.toml` that describe it as a mass lever need revising.
````

## Appendix B: `docs/planning/implementation-order.md`

````markdown
# Implementation order

The run record and the audit tool come first because almost every later feature reads from them. Player predictions follow the rules in `prediction-system.md` and the screens in `prediction-system-sketch/` (added in PR #11).

| Step | Work | Why here | Depends on |
| --- | --- | --- | --- |
| 0 | Hygiene: correct the density hints and the "buy as soon as energy allows" hint against the engine; refresh `docs/NEXT.md` | The hints currently point at levers the engine does not have, which would seed wrong predictions. | — |
| 1 | Run record; copy audit and physics or game-rule labels; spot-check the Layer 1 values in `physics.py` | The run record stores each run's settings, effective inputs (including in-run purchase levels), outcomes and time series. The audit, predictions, debrief, board and hypercube all read from it. The text fixes are cheap and depend on nothing. | — |
| 2 | Audit tool, as a standalone report | Gives the true bin for each relationship, used for debrief explanations and to check the relationship text before it ships. It never grades a player's untested relationship. Written in Python against the Python engine; the two engines match, so it covers the JavaScript game too. | 1 |
| 3 | Draw fragments in the disk view; edge-on cross-section inset | Fragments are simulated but invisible. The inset shows flaring, the poles and outflows from values the engine already has. UI only, no parity cost. | — |
| 4 | Disk breakup and companions, in stages, rerunning the audit after each: (a) baseline migration calibration, then gap opening, clump contraction and tidal disruption; (b) linear Toomre fragmentation (spacing 2πQH, count, mass, growth rate); (c) the cooling-time gate | Creates relationships that depend on conditions, which is what lets a player break a prediction that had held up. Companions stay records only in Layer 1. Each stage alone keeps the audit diffs readable and protects the guaranteed first supernova. | 2 |
| 5 | Baseline playtest (optional) | Pre-test questions on the game before the teaching features exist, so a later playtest can measure what they add. | 4 |
| 6 | Player predictions v1 and prestige debrief | Relationship predictions only, as in the sketch: direction bins, per-quantity locks with streaks, direct and net stages, the result screen with its surprise callout, detection of runs that differ from the baseline in more than one effective input, and the board. Predictions live on the in-run stats rows with a test-status line. Baseline defaults to the previous run. Hold to baseline unlocks after the first purchase confound, and the baseline picker after the first survey confound. No rewards yet, to test whether predicting is engaging without them. The debrief ends by asking for a prediction about the next run. | 1, 2, 4 |
| 7 | Live gauges, then Insight | Gauges show hidden quantities so players have more to predict. Insight pays for board milestones only (direction confirmed, shape found, strength found, Depends discovered). The first Insight unlocks can be the gauges themselves. Shape, strength and Depends bins unlock as in `Bins.dc.html`. | 6 |
| 8 | Event and ending predictions | Track a fragment and predict its fate (merge, tidal disruption, survival), showing observables only. Predict a star's ending at ignition, which gives the main sequence something to do. | 4, 6 |
| 9 | More Layer 1 and 2 content: stir a ring, infall surge with a turbulence guard, closing pristine window, endings atlas | Each one is a new relationship for the audit and the board. | 2, 6 |
| 10 | Population views and pacing: companion-separation plot, telescope resolution, speed tiers and automation bought with Insight | The separation plot needs continuous fragment birth radii or the ring-count decision first, or the grid shows up as false stability zones. Speed stays UI only and disclosed. | 4, 7 |
| 11 | Layer 3 (binaries, Lagrange storage) and the hypercube view | Binaries build on companions being simulated as objects. The hypercube reuses the audit's sampling and the run record. | 4, 6 |

## Verification timing

Verify each layer's values before that layer is built. Only the Layer 1 stellar values are needed now. Habitable-zone and binary values wait until Layer 3.

## Open choice

Steps 4 and 6 could be swapped. Building predictions first makes the teaching loop playable sooner, and direction bins already have material: the result screen's surprise (temperature raises the collapse mass but also the final mass) works with the current engine. Building companions first means predictions launch with something that can break a locked rule, which the Depends bin and the streak-break screen need. Step 4 is now three stages, which makes waiting for it longer. The current choice is companions first.
````
