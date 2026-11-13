# Accretion Idle Game Design Spec

Nov 4, 2026 · @Stephen Colodner

## Concept

The player begins as an unusually dense patch of interstellar hydrogen and works toward a civilization that can engineer stars. Each stellar lifetime is one run, and each stellar death seeds the next.

The working title is Accretion. The design comes from Stephen's August 2019 notebook model and its gameplay outline.

**Design pillars**

- **The simulation is the game:** Players influence a small, real shell model rather than a themed spreadsheet.
- **Physics sets the rules:** Unlocks come from physical thresholds wherever possible.
- **Science is discoverable:** Hidden behaviors appear as surprises before the game explains them.
- **Departures are labeled:** Simplifications and speculation are recorded, not disguised.

## Decisions

Thirty-four design choices are decided, and two proposals still need confirmation.

**Decided by Stephen**

- The game stays as scientifically based as possible.
- The player starts as an unusually dense patch of interstellar hydrogen.
- Stellar death is inevitable once the star ignites.
- Planet formation arrives through later prestiges.
- A surviving Goldilocks planet opens a new prestige layer rather than ending the game.
- Probability is the first prestige currency, spent on searching for rarer regions rather than changing physical constants.
- Heavy elements unlock later as a second currency.
- A time skip is offered only when no player action or planned milestone can change the result.
- Early runs are short, about 15 to 20 minutes, and grow toward an hour as controls unlock. A Goldilocks run targets two weeks, and a full playthrough targets a year.
- Stellar engineering persists across later runs, is refundable, and has its own pool.
- Any stellar death ends the run and triggers a prestige.
- Supernovae pay heavy elements.
- Novae in close binaries are mini-prestiges unlocked at Layer 3. They pay probability without ending the run.
- Creating a black hole unlocks a region-search option to start near one. It adds no currency or permanent gravity bonus.
- The probability budget is ln(N), where N is the lifetime count of regions surveyed.
- Failed runs multiply N by a small percentage, rather than adding a flat amount.
- Each nova adds to N, up to a limit set by the companion star's mass.
- A universal clock continues across runs, so composition changes and updates the available starting conditions.
- The final prestige starts a new universe.
- A final currency lets the player skip the early grind.
- Play begins zoomed in on individual atoms and moves far outward.
- At large scales, faint gridlines show a 2D view of the spacelike metric.
- A time skip or abandoned run is movement to a new region, not a fast-forward of the universal clock.
- The supermassive black hole at the galactic core spawns the new universe.
- Established models replace invented rules wherever practical, and the notebook's collision split becomes the conceptual explanation.
- The game should help players build intuition for each control's impact.
- Controls unlock one at a time, without game previews or forecasts; players may make their own predictions.
- The game never forecasts. Players commit predictions blind, and a prediction resolves only against runs the player has played. The rules are in `docs/planning/prediction-system.md` in the repository.
- A value recorded from a run the player has played is a historical record, not a ghost marker, and may be shown beside a live stat.
- The inputs the universal clock drives, composition and background temperature, are divided into epochs. A prediction test compares two runs in the same epoch, and predictions reset on a new journal page when the epoch changes.
- Logging is required.
- The results record is a bubble plot of completed runs, with bubble size set by final mass.
- Tiered hints are available on request and are offered when a player appears stuck.

Fuel mixing is also decided as a progression arc: players discover it accidentally, then use it intentionally after a Goldilocks planet lives long enough.

**Proposed, not yet confirmed**

- The simulation uses about 10 to 20 log-spaced shells.
- Prestige moves the next run toward denser regions and eventually the galactic core.

## Core simulation

The game runs on 10 to 20 log-spaced shells that exchange mass through a standard viscous disk model. Shell 0 is the central sink, which becomes the star. This keeps the notebook's dr bins and collapses its direction and angle bins into one radial coordinate for the first prototype.

**Orbital rule.** Each shell has a circular speed and specific angular momentum set by the mass enclosed inside it:

```latex
v_c(r) = \sqrt{\frac{G M(<r)}{r}}, \qquad j(r) = \sqrt{G M(<r)\, r}
```

**Disk evolution.** Mass moves between shells through the viscous disk equation (Lynden-Bell & Pringle), with shells at r\_i = r\_0 q^i:

```latex
\frac{\partial \Sigma}{\partial t} = \frac{3}{r}\frac{\partial}{\partial r}\left[r^{1/2}\frac{\partial}{\partial r}\left(\nu \Sigma\, r^{1/2}\right)\right]
```

**Viscosity.** Alpha viscosity (Shakura–Sunyaev) wraps turbulent transport into one parameter. The same stress heats the disk, and a steady disk has a simple accretion rate:

```latex
\nu = \alpha\, c_s H, \qquad H = \frac{c_s}{\Omega}, \qquad D = \frac{9}{4}\nu\Sigma\Omega^2, \qquad \dot M = 3\pi\nu\Sigma
```

**Notebook link.** The inelastic collision split is now the conceptual explanation, not the runtime rule. It still shows why conserving angular momentum sends most mass inward while a little carries that momentum outward. Real disks are thought to rely on magnetic turbulence for this transport, so α replaces the tuned collision rate k.

**Collapse.** Before a disk forms, gravity sets the clock through the free-fall time, and Shu inside-out collapse sets the infall rate:

```latex
t_{ff} = \sqrt{\frac{3\pi}{32 G \rho}}, \qquad \dot M \sim \frac{c_s^3}{G}
```

| Quantity | Conserved? | Game role |
| --- | --- | --- |
| Mass | Yes, unless ejected | Main resource |
| Angular momentum | Yes, unless ejected | Bottleneck on infall |
| Heat | No, radiated away | Pressure that resists collapse, and a visible output |
| Heavy elements | Yes after creation | Later prestige currency and cooling |

Angular momentum should be stored per shell, not derived from radius. Enclosed mass changes during a run, so deriving it would let rounding and drift create it.

**Proposed player levers**

- **Cooling:** Radiate heat faster so pressure falls and collapse proceeds.
- **Turbulence:** Raise α in chosen shells to speed transport.
- **Magnetic braking:** Carry angular momentum out of the inner shells.
- **Outflows:** Eject a little mass to remove a lot of angular momentum.

## Run loop

A run lasts from a collapsing gas patch to stellar death, and the star's mass sets both the clock and the reward. Ignition is a milestone, not a prestige.

&#91;embedded content: run loop · six stages, one prestige event\]

Collapse is hardest in pristine gas because it cools poorly. Once the star ignites, its radiation and winds clear the disk, so accretion and planet-building both race the clock.

## Prestige layers

The game has six layers: a surviving Goldilocks planet opens the fifth, and a new universe restarts the climb in the sixth. Physical gates control every step, so unlocks follow from what earlier stars actually produced.

&#91;embedded content: prestige ladder · six layers, five gates\]

Planet formation starts at Layer 3 because dust needs heavy elements from earlier stars. Layer 5 gives the journey toward the galactic core a purpose, because each denser region offers a new star to shape.

## Region search

Players spend probability to find a rarer starting region in a big universe, never to change physical constants. The cost of a choice equals its rarity, so independent choices simply add up against the budget B:

```latex
C = \sum_j -\ln p_j \leq B
```

Here p\_j is the chance of finding condition j.

- **Search options:** Density, temperature, and metal content. Real cloud densities are often modeled as roughly lognormal, so the tails have a physical basis.
- **Refunds:** The allocation is conserved and fully refundable at each prestige, which encourages experimenting.
- **Budget growth:** B = ln(N), where N is the lifetime count of regions surveyed. After N samples, the rarest expected find has a probability near 1/N, which matches the cost above. Exponential idle-game earnings therefore become steady budget growth. Better runs multiply N by more, while a failed run multiplies it by a small percentage: about 10% adds roughly 0.1 to B at any stage, with the exact rate set in the prototype. Players see only "Regions surveyed" and their spendable budget.
- **Build variety:** Massive-star and Goldilocks goals must need different setups, or free refunds would produce one solved build.
- **Pristine regions:** Metal content stays searchable, so later runs can still buy a pair-instability supernova at a very high cost.
- Black-hole starts: A nearby black hole can funnel in gas but can also disrupt planetary orbits, which suits massive-star runs and endangers Goldilocks runs. Stellar-mass black holes come first, and the supermassive black hole at the galactic core is the final environment.

## Time skip

A time skip ends a run when nothing the player can do would change the result. This keeps red dwarfs from becoming dead ends without making patience optional.

- **Trigger:** No player action or planned milestone can change the outcome. A nearly steady star alone does not qualify, because that would fire during Goldilocks runs.
- **Display:** The offer shows the approximate real-world time until anything changes.
- **Reward:** The player receives the full stellar-death reward.
- **Time-based progress:** Skipped time earns nothing, and it never counts toward life developing.
- Universal clock: A skip or abandoned run moves the player to a new region. The clock advances only by the time that passed in the run.

## Cosmic clock and new universes

The universe keeps aging across runs, so region odds depend on cosmic time t as well as on the player's choices. This makes pristine regions more expensive automatically:

```latex
C(t) = \sum_j -\ln p_j(t)
```

- **Composition:** Region odds combine a one-zone galactic chemical-evolution model with enrichment from the player's own supernovae, so each save has its own history.
- **Planet window:** Early regions lack heavy elements, while late regions have less fresh gas for new stars.
- **Run order:** A long Goldilocks run advances the universe much further than a massive-star run, so spending time is a strategic choice.
- **Refunds:** Probability is refundable, but time is not. Short massive-star runs must cost little cosmic time, so experimenting stays cheap.
- **New universe:** The final prestige restarts the clock, and a final currency lets the player skip the early grind. Exactly what it buys is still to be designed.

The gateway is the supermassive black hole at the galactic core, which turns the journey inward into the route to the next universe. Cosmological natural selection is a real but speculative hypothesis in which black holes give rise to new universes.

## Stellar endings

A star's initial mass and composition decide how the run ends and what it pays. Boundaries are approximate and shift with composition, rotation, and mass loss, and the rewards are proposals.

| Initial mass (M☉) | Ending | Proposed reward |
| --- | --- | --- |
| Below \~0.08 | Brown dwarf, no sustained hydrogen fusion | Small probability gain |
| \~0.08 to \~9 | White dwarf, after a very long life at the low end | Small heavy-element yield; recurring novae pay probability if in a close binary |
| \~9 to 25, with gaps above \~18 | Supernova, neutron star | Strong heavy-element yield |
| Some above \~18, most above \~27 | Often a black hole | Unlocks black-hole starts in region search, possibly with less ejected material |
| \~140 to 260, below about 10^-0.5 Z☉ | Pair-instability supernova, no remnant | Huge yield; needs a rare route to very high mass |

Published hydrogen-burning lifetimes run about 9.4 Gyr at 1 M☉, 33 Myr at 8 M☉, and 2.7 Myr at 120 M☉, then level off near 2 Myr. The game should use published stellar evolution grids for lifetimes and brightness, and published yield tables for heavy-element rewards.

The core tension is that a larger star pays more but leaves less time for planets.

## Mixing and Goldilocks planets

Players should see fuel mixing as an anomaly before they understand it, then earn deliberate control through a planet that survives long enough.

1. **Accident:** A fast-spinning massive star lives longer than projected because rotation mixes fresh hydrogen into the core.
2. **Second clue:** A close binary transfers mass or merges, rejuvenating a star. Blue stragglers are the real-world example.
3. **Natural control:** Players deliberately steer spin and binary interactions to extend massive stars.
4. **Engineered control:** A civilization on a Goldilocks planet attempts mixing in a sun-like star, whose stable radiative zone resists it naturally.

**Goldilocks requirements**

- Enough heavy elements to build a rocky planet
- A G- or K-type star with a long lifespan
- A stable orbit in the habitable zone
- Giant planets that do not destabilize that orbit
- Enough time for life before the star's brightening moves the habitable zone outward

Extra fuel buys time, but it does not stop the star brightening. Engineered mixing therefore extends a civilization's window without removing the clock.

This creates the game's late reversal: players chase huge stars early, then must build a small, patient one.

## Offline progress and time

Offline progress should use the same equations as live play, solved with larger steps. The viscous disk equation is linear when viscosity depends only on radius, which allows fast matrix solutions. It becomes nonlinear when temperature feeds back into viscosity, so the solver must handle both cases.

- **Quasi-steady phases:** When shells change slowly, multiply the steady flow by elapsed time.
- **Changing phases:** Use adaptive implicit steps, which remain stable when inner shells evolve far faster than outer ones.
- **Thresholds:** Split the calculation at ignition and other milestones, so offline play crosses them in the correct order.
- **Stellar death:** Hold the event until the player returns, so they always see their supernova. This is a proposal.

Each phase needs its own clock compression. Real collapse, main-sequence life, and supernovae differ by many orders of magnitude, so a single multiplier cannot work. If a roughly 5-million-year first star takes 20 minutes, a 10-billion-year sun-like star takes about 28 days at the same rate. Reaching the two-week target needs about 2× more speed from upgrades or later-phase clock compression. The Python prototype should set these rates.

**Benchmark first.** Measure a large offline jump on a low-end phone before building anything else, then repeat the test once planets and binaries exist. If the solver is too slow, add a precomputed table as a fast path.

**Precomputed table, if needed**

1. **Log player coverage:** Playtest telemetry records the regions, levers, and phases that real players use.
2. **Generate in Python:** Sweep those areas and sample around them, so coverage extends past what playtesters reached.
3. **Ship with the game:** A compact on-device table works without a connection and needs no server query.
4. **Fall back to the solver:** States outside the table's coverage use the real calculation.
5. **Monitor error:** Compare table results with the solver during testing to find weak areas.

The table must follow four rules:

- **Summary inputs:** Key it on a few values, such as total mass, angular momentum, metal content, and region settings, not on every shell.
- **Rates, not end states:** Store flow rates and time to the next milestone, then enforce conservation of mass and angular momentum in the game.
- **Separate phases:** Split tables at ignition and other sharp changes, so interpolation does not blur them.
- **Versioning:** Tie each table to a balance version and regenerate it from code whenever the rules change.

## Established models

Invented rules should give way to accepted models wherever a phone can afford them. The shell model, q, and the player levers stay, while these sources supply the physics.

| Game system | Existing theory | Game use |
| --- | --- | --- |
| Disk transport | Viscous disk equation, alpha viscosity | Core runtime rule, with α as the turbulence lever |
| Collapse | Free-fall time, Shu inside-out collapse | Collapse clock and infall rate |
| Starting stars | Salpeter or Kroupa initial mass function | Odds of star masses |
| Stellar lives | Published stellar evolution grids, such as MESA-based tracks | Lifetime, brightness, and ending lookups |
| Heavy-element rewards | Published supernova yield tables | Rewards by mass and composition |
| Planets | Streaming instability, pebble accretion, core accretion, gap opening | Planet-formation and giant-planet gates |
| Disk lifetime | Photoevaporation | Clock for planet building |
| Universal clock | Galactic chemical evolution, Kennicutt–Schmidt, cosmic star-formation history | Basis for region odds p\_j(t) and gas decline |
| Goldilocks | Kopparapu habitable-zone limits, Hill stability | Clear pass/fail rules |
| Gridlines | Schwarzschild spatial geometry, FLRW scale factor | Real shapes to exaggerate |

**Build order:** Start with the viscous disk, then the published star and yield tables, then galactic chemical evolution.

**Data status:** The prototype now uses published lifetimes, luminosity, ionizing rates, ending limits, yields, a cosmic metal clock, and a metal-and-CMB temperature floor. Primordial stars below 10^-4 Z☉ explode from about 9 to 25 M☉, which keeps the first supernova reliable. Enriched stars use a deterministic map of explosion gaps. The feedback calibration, explosion-gap edges, and tuned enrichment scale are labeled in the fidelity record, and paper values still need spot-checking against the originals.

## Learning and discovery

Players build intuition by changing one thing at a time and comparing the result. Each control should arrive once the player has felt the problem it solves, so every run works as a natural experiment.

Proposed unlock order, to be tested:

| Unlock point | New control | Problem the player has noticed |
| --- | --- | --- |
| First minute | Gravitational reach | Tapping alone feels slow |
| First gather milestone | Stronger pull | Tapping starts to matter less |
| After ignition, run 1 | Disk turbulence | Gas piles up and reaches the star too slowly |
| Run 2 | Temperature search | The first star's size was not a choice |
| Run 3 | Density search | The mass needed for collapse now feels like a target |
| After the first supernova | Radiative cooling | Heavy elements make cooler gas possible |
| When a disk stalls far from the star | Magnetic braking | Gas lands too far out |
| After seeing a black hole | Black-hole starts | A new kind of region now exists |

- **Clear controls:** Goals and each control's direct effect are always stated plainly.
- **Journal:** Each run records its region, final mass, ending, reward, and notable events. Phenomena appear as observations first and gain explanations later.
- **Visible effects:** Each control should visibly change the sky.
- **Results record:** A bubble plot shows completed runs, with log gas temperature and log density as axes. Bubble area follows final mass, with a minimum size, and color shows the ending. Selecting a bubble opens that run's journal entry. The plot starts as a temperature strip, then opens into two dimensions when density unlocks.
- **Hints:** A tiered hint system moves from direction to lever to explanation, and draws on what the player has actually done.

## Visual design

The camera starts on individual atoms and pulls back across roughly 30 orders of magnitude, from atoms to galaxies. Each new scale should feel like a reveal.

- **Atom view:** Sprites are driven by the shells' density and temperature, not simulated one by one. This keeps the opening view cheap on phones.
- **Shell view:** Once the camera reaches cloud scale, the player sees the shell simulation directly.
- **Faint gridlines:** At large scales, a 2D grid shows the spacelike metric and bends around mass.
- **Exaggerated curvature:** True spatial curvature is only about two parts per million at the Sun's surface, so the grid exaggerates Schwarzschild spatial geometry. Compact objects can show the strongest bending.
- **Cosmic expansion:** At the largest scales, the grid can stretch as the universe ages, tying the visual to the universal clock. This is a proposed extension.

## Science fidelity ledger

Everything in the game should fall into one of three categories, and only stellar engineering and new universes are deliberately speculative.

| Element | Status | Note |
| --- | --- | --- |
| Jeans collapse | Real | Denser gas lowers the Jeans mass, and cooler gas lowers it further |
| Hydrogen ignition near 0.08 M☉ | Real | Approximate limit |
| Metal-poor gas cooling poorly | Real | Supports massive first stars |
| Disk angular momentum transport | Real | Uses the viscous disk equation; magnetic turbulence is the leading physical driver |
| L4 and L5 stability | Real | Requires a mass ratio above about 25 |
| Rotational mixing, binary rejuvenation | Real | Strength depends on the star and model |
| Supernova-triggered star formation | Debated | Plausible locally, but its frequency is uncertain |
| Radial shells | Simplified | Replaces 3D structure and treats early collapse like orbiting gas |
| Alpha viscosity | Simplified | A standard parameterization, but α remains tuned, as in real disk models |
| Moving toward the galactic core | Simplified | Represents denser star-forming regions |
| Goldilocks score | Simplified | Habitability has more factors than the game can model |
| Engineered mixing | Speculative | The one deliberate leap beyond established science |
| Region search | Simplified | Real regions vary, but the budget and instant choice are game rules |
| Skipped time earning no progress | Simplified | A game rule that protects patience, not physics |
| Declining star formation | Real | Drives the universal clock's rising metals and shrinking gas supply |
| Metric gridlines | Simplified | Based on real geometry, but heavily exaggerated to be visible |
| Paying a skipped star's death reward early | Simplified | A game rule; the star has not actually died |
| New universes | Speculative | A second deliberate leap, loosely inspired by cosmological natural selection |
| Published stellar and yield tables | Simplified | Real models, reduced to compact lookup tables |

## Prototype plan

All open questions are closed, so the Python prototype is the next step. It should also inform the two remaining proposals in Decisions.

**Python prototype**

- [ ] Implement the viscous shell model, tracking mass, angular momentum, heat, and heavy elements.
- [ ] Verify conservation of mass and angular momentum at every step.
- [ ] Plot collapse time and shell profiles across α, q, and shell count.
- [ ] Test whether the player levers create meaningfully different runs.
- [ ] Compare the adaptive offline solver with fine-step results.
- [ ] Simulate six prestige layers to fit clock rates and reward curves.
- [ ] Test that massive-star and Goldilocks goals need different region setups.
- [ ] Confirm that the time skip never fires while a player can still change the outcome.
- [ ] Benchmark the offline solver on a low-end phone, then again with planets and binaries.
- [ ] If the solver is too slow, build and validate the versioned table with solver fallback.
- [ ] Source, verify, and compress the published stellar grids, yield tables, and galactic models.

**Sources:** Stephen's August 2019 notebook pages. Physics figures are approximate textbook values and have not yet been checked against published references.
