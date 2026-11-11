# Feature backlog

> Planning note; last updated 2026-11-11. Candidate features by layer; statuses live in the text.

Candidate features by layer. Status: **Decided**, **Proposed**, or **Idea**. Physics notes come from the research reports; values marked in `verification-checklist.md` need checking before they are hard-coded.

## Now

| Feature | Status | Notes |
| --- | --- | --- |
| Copy audit | Proposed | Replace "Fuel burned" on the main-sequence meter, for example with "Hydrogen fused". Audit all text for "burn", "dying", "zero gravity", and "gravity cancels". |
| Audit tool | Decided | Standalone report. Samples regions, nudges one input at a time, and classifies each input–outcome pair as up, down, unrelated, context-dependent, peaked, or threshold. Reports elasticities, interactions, and direct versus total effects. |
| Prediction system | Decided | Rules in `prediction-system.md`, screens in `prediction-system-sketch/`. v1 is relationship predictions only, with no rewards. Insight later pays for board milestones only. |
| Prestige debrief | Proposed | Summarize what the run showed and invite a prediction for the next run. |
| Disk breakup and companions | Decided | Visible temperature and infall, Toomre-based fragmentation, companions simulated as objects. Details in the spec addition. |
| Infall surge | Proposed | Raises infall toward primordial rates. With low turbulence the disk fragments and traps the star small, so it needs a turbulence guard. |
| Closing pristine window | Proposed | Pristine regions grow rarer as enrichment spreads; pair-instability supernovae become a race. |
| Live physics gauges | Idea | Core temperature, gravity–pressure balance, fusion rate, infall versus ionizing output. |
| Physics and game-rule labels | Idea | Icons, model cards, time-compression display, tutorial-rule label on the first supernova. |
| Endings atlas | Idea | Fills in through play; supports ranking puzzles such as ordering stars by lifetime. |
| Pulsational pair-instability ending | Idea | Pulses shed mass before collapse, for helium cores of about 40 to 63 M☉. |

## Binaries (Layer 3)

- **Companion odds:** By primary mass, with core splits giving wide pairs and disk splits giving close, near-equal pairs. Close solar-type binaries are about 4 times more common at low metallicity.
- **One mass-transfer pathway:** Detached, then Roche-lobe overflow, then a stable stream or a runaway common envelope, then a supernova, then a walkaway, runaway, or bound compact pair.
- **Stability chart:** Donor radius and lobe radius plotted against mass lost, with the crossing marked as runaway.
- **Accretor spin-up cap:** About 10% of the gainer's mass, after which transfer turns non-conservative.
- **Nova ledger:** Accreted versus ejected mass per cycle. In most conditions the white dwarf erodes.
- **Triples:** A tilted third star drives eccentricity cycles between 39.2° and 140.8°.
- **Gravitational-wave mergers:** Merger time scales as separation to the fourth power.

## Lagrange storage (Layer 3)

- L4 and L5 hold material only when the primary outweighs the secondary by more than 24.96 times.
- L1 to L3 are leaky buffers that need upkeep.
- Storage opens in order, L1, then L2, then L3, following the real energy gates.
- A Trojan planet is a rare event: allowed in theory, never confirmed.

## Planets (Layer 3 and 4)

- **Planetesimal gate:** Streaming instability needs about 0.4% local solids, tying planets to metallicity.
- **Growth barriers:** Dust growth stalls and needs a trap, such as a pressure bump or snow line, not more dust.
- **Gas-on and gas-off phases:** Fast pebble growth and migration while gas remains, then slow giant impacts.
- **Giant planets:** A race against the disk lifetime, with occurrence rising steeply with metallicity.
- **Spacing:** Planet slots measured in mutual Hill radii. Below about 3.5 is unstable, 3.5 to 10 runs a decay clock, and 10 to 12 lasts gigayears. Eccentricity raises the requirement.
- **Resonance dead zones:** A giant's resonances clear gaps in debris belts.
- **Refutation at unlock:** "Planets did not come from the Big Bang. Their metals were made in earlier stars."
- **Typical outcomes:** Compact super-Earth chains are common; a system like ours is a rare achievement.

## Habitability (Layer 4)

- A habitable zone that moves outward as the star brightens.
- Habitability windows by star type: long and stable for K dwarfs, long with activity penalties for M dwarfs, short for F stars.
- A complex-life milestone that favors long-lived stars.
- The galactic habitable zone as a debated story beat.

## Galaxy (Layers 5 and 6)

- **Spiral arms:** Moving high-density zones the region passes through. They raise star-formation rate but not efficiency.
- **Arm count:** Heavier disks give fewer, stronger arms.
- **Central Molecular Zone:** Dense gas that forms stars slowly, a "more gas, fewer stars" twist.
- **Sgr A\*:** S2's orbit as the final approach; Hills ejections as an event.
- **Black-hole growth:** Eddington-limited e-folding of about 50 Myr at 10% efficiency; heavy versus light seeds as an open question.
- **Cosmic star-formation history:** A global epoch multiplier, rich early and declining late.

## Cosmology and new universes (Layer 6)

- **Universal clock:** Run on cosmic time, with redshift derived from a standard cosmology table.
- **Early phases:** Dark ages, minihalo first stars, Lyman-Werner throttling, first galaxies, reionization, cosmic noon.
- **Log-time display:** Handles millions of years through about 10^100 years.
- **Far-future eras:** Degenerate and black-hole eras as late layers.
- **Final prestige:** Based on Smolin's cosmological natural selection, labeled Speculative, with its failing neutron-star test explained.
- **Open questions:** The Hubble tension and evolving dark energy shown as ranges.
- **Possible cyclic variant:** Based on conformal cyclic cosmology, noting its claimed evidence was not confirmed.

## HR diagram

- One star's track first, then lifetime against mass across the player's stars, then a population view with a turnoff.
