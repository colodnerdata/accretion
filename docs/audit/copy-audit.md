# Copy audit

> Written by hand on 2026-11-13 against the engine at `main` after PR #26 and
> the audit report in `report.md`. Covers every entry in `content/ui.toml`,
> `content/notes.toml`, `content/hints.toml` and `content/endings.toml` that
> states a cause, a direction, a number or a control's effect. Labels,
> headings, button text and placeholders with no claim are not listed.

**Verdict:** *true* means the engine agrees everywhere it was checked.
*true in part* means it holds only in some regions or up to a bound.
*false* means the engine does the opposite or something different.
*outside the engine* means general astrophysics the engine does not model, so
it can only be checked against the literature (the `physics.py` spot-check,
still open).

**Label:** *physics* follows an Established or Simplified row in
`FIDELITY.md`. *game rule* is pacing, cost, unlock order or reward.

## Changed in this pass

| Key | Was | Problem | Now |
| --- | --- | --- | --- |
| `hints.accrete.tier2` | "Disk controls mainly change how quickly gas gets through. Final mass depends more on how fast gas falls in." | Not clearly true. Four turbulence levels change a first star's mass by 18% (26.16 → 21.54 M☉) and its ending; a one-step temperature change moves it by about as much (slope +1.04). | "Disk controls change how quickly gas moves through the disk. How fast gas falls in is set by the region's gas temperature, which cannot change during this phase." Both halves are direct effects, and the hint no longer points at a control the player cannot use mid-run (ui-ux review). |
| `hints.accrete.tier3` | "Faster infall feeds the star for longer before its ionizing light shuts the supply off." | False. Growth time falls as infall rises: 176,000 yr at 215 K, 140,000 yr at 338 K, while final mass rises from 22.4 to 35.6 M☉. | "Faster infall lets the star grow larger before its ionizing light shuts the supply off." |
| `hints.small.tier3` | "…so the star gains mass before its light clears the gas." | Every star gains mass; the point is how much. | "…gains more mass…" |
| `hints.big.tier2` | "Try a cooler region, or aim for a slightly different mass." | The second half names no control; the game has no direct mass control. | "Search for a cooler region." The gaps are explained in tier 3. |
| `endings.bands.brown_dwarf.range` | "below 0.08 M☉" | The limit is 0.075, 0.083 or 0.09 M☉ by metal content (`physics.hydrogen_limit`). | "below about 0.08 M☉" |
| `notes.controls.cooling` | "New control: Radiative cooling. Heavy elements from your supernova make cooler gas possible." | The unlock is a game rule; the control works the same without those elements. Owner ruling, 2026-11-13. | "New control: Radiative cooling. Cools the gas, so less mass is needed for collapse." |
| `ui.search.metals_note` | "More metals let gas cool further." | True only past log Z/Z☉ = −4, and the slider looked dead below it. Owner ruling, 2026-11-13: the Temperature slider shows a padlock at the coldest allowed gas, and metals move it. | "Metals unlock colder gas: past a trace amount, more metals move the Temperature padlock toward absolute zero." |
| `notes.controls.metals` | "New search option: Metal content. Enriched gas cools better." | Reworded to match the padlock. | "New search option: Metal content. Metals unlock colder gas." |
| `ui.search.temperature_note` | (the sentence on hotter gas) | The padlock needed naming. | adds "The padlock marks the coldest gas this region allows." |
| `ui.heavy.cooling_note` | "Permanently cools gas by 10% per level." | It also lowers the region floor by 10% per level, which is the padlock. | adds "…and moves the Temperature padlock with it." |
| `ui.search.temperature_lock` (new) | — | — | "Locked below {value} K, the coldest this gas can be." The value is the region's floor (`region_floor`). |

## Left as written, for the owner's ruling

| Key | Text | Why it is flagged |
| --- | --- | --- |
| `notes.observations.ignite` | "Hydrogen fusion has begun. Starlight will now start clearing the disk." | The engine starts clearing earlier. `physics.ionizing_rate` holds its table constant below 5 M☉, so `disk_loss_rate` is 2.8 × 10⁻⁶ M☉/yr (at 1,000 AU) from the first seed, before ignition, and the "Boiled off the disk" row shows it. The text is the physics; the engine is the departure. Fixing it is an engine change (both engines, `FIDELITY.md`), not a wording change. |
| `notes.headlines.shine.body` | "Its final mass is set, and it will decide how this star ends." | True within one region. Across regions the metal content also decides: pristine stars from 9.2 to 25 M☉ always explode (game rule), enriched ones have gaps. `shine.running_low` already says "mostly". |

The ui-ux review rated both remaining items minor from the player's side.
The cooling announcement and the metals note, which it rated "should fix",
were ruled on and changed (above).

## Checked and true

### `content/ui.toml`

| Key | Claim | Verdict | Evidence | Label |
| --- | --- | --- | --- | --- |
| `play.controls_note` | Energy comes from falling gas | true | `binding_energy` while gathering, accretion energy in `_accrete_step` | physics |
| `skip.note`, `ended.left_early_note` | Moving on ages the universe only by the time stayed; the reward is the same | true | `prestige`: clock advances by `ms_elapsed` share, gain and yield paid in full | game rule |
| `search.intro` | The full budget returns after every run | true | `region_cost` is recomputed from the settings; nothing is spent | game rule |
| `search.bh` | Gas falls in 50% faster, cost 1.00 | true | `BLACK_HOLE_INFALL_FACTOR = 1.5`, `BLACK_HOLE_START_COST = 1.0`; audit: infall rate up | game rule |
| `search.temperature_note` | Hotter gas needs more mass to collapse, falls in faster, feeds a bigger star | true | audit: collapse mass up (+1.50), infall up (+1.50), final mass up (+1.04), in both contexts tested | physics |
| `search.density_note` | Denser gas collapses with less total mass | true | audit: collapse mass down, slope −0.50, all four contexts | physics |
| `heavy.cooling_note` | Permanently cools gas by 10% per level, and moves the padlock | true in part | `temperature_at` counts permanent levels with in-run ones, ×0.9 each, until the floor; the purchase is refused once the cosmic background sets the bound | game rule |
| `heavy.turbulence_note` | Permanently speeds the disk by 30% per level | true in part | `alpha = min(1, 0.1 × 1.3^level)`; refused at the cap | game rule |
| `ended.fine` | Gas, energy and upgrades reset; probability, unlocks and heavy elements stay | true | `prestige` → `new_run`; `Meta` keeps regions, unlocks, heavy | game rule |
| `journal.intro` and legend | Bubble area is final mass; a dashed arrow is a star left early | true | DECISIONS 2026-11-12 | game rule |

### `content/notes.toml`

| Key | Claim | Verdict | Evidence | Label |
| --- | --- | --- | --- | --- |
| `headlines.gather.body`, `observations.collapse` | At the stated mass gravity beats pressure | true | `jeans_log_reach`, `_check_collapse` | physics |
| `headlines.collapse.body` | The real fall takes about the stated time | true | `physics.free_fall_time` | physics |
| `headlines.accrete.body` | Starlight ends the infall and boils the disk away | true | HII taper in `infall_now`; `disk_loss_rate`. Final mass does not depend on how much gas the cloud held (audit: density → final mass, no change), so the taper, not the supply, ends growth in every context | physics (Simplified) |
| `controls.turbulence` | Gas is piling up in the disk faster than it reaches the star | true on a first run | at ignition the disk holds 0.37 M☉ against a 0.11 M☉ star; landing 5.2 × 10⁻⁴, reaching the star 1.5 × 10⁻⁴ M☉/yr. The unlock rule itself tests only ignition | game rule |
| `controls.density` | The mass needed for collapse can now be targeted | true | audit: density → collapse mass down | game rule |
| `controls.braking` | Gas is landing far out and stalling in the disk | true | unlock needs disk gas above five star masses | game rule |
| `controls.metals` | Metals unlock colder gas | true in part | `physics.cooling_temperature` falls with metal content past −4 | physics |
| `observations.first_clump` | A clump drifts inward and joins the star, or stays as a companion | true | `_evolve_fragments`, `_settle_fragments` | physics (Simplified) |
| `milestones.m` | A 1 m patch weighs less than a speck of dust | true | about 10⁻¹⁷ kg at 10⁴ atoms/cm³ | physics |
| `upgrades.reach` | Gas gathers 25% faster | true | `reach_rate`: ×1.25 per level | game rule |
| `upgrades.tap` | Each tap pulls in 50% more | true | `tap_power`: ×1.5 per level | game rule |
| `upgrades.cooling` | Gas cools to the stated temperature; collapse mass falls | true | values come from `temperature_at` and `jeans_mass`; audit: cooling → collapse mass down | physics |
| `upgrades.turbulence` | Gas moves through the disk 30% faster, reaching the star sooner | true | `alpha` ×1.3 per level | game rule |
| `upgrades.braking` | Gas lands closer to the star | true | `feed_radius` ×0.75 per level | game rule |
| `shine.brightness_*`, `shine.running_low` | Heavier stars spend fuel faster; the ending depends mostly on birth mass | true | audit: temperature → star life down while mass up; `physics.ending` | physics |
| `shine.starlight_bubble`, `shine.bubble_stalls` | The ionized bubble grows, then stalls at pressure balance | true | `physics.hii_radius` with its stagnation cap | physics (Simplified) |
| `shine.main_sequence`, `fusion_route.*`, `fusion_future.*`, `helium_ash` | Core fusion, the CNO cycle, later fuels, "silicon lasts days" | outside the engine | not modeled; check in the spot-check | physics |

### `content/hints.toml`

| Key | Claim | Verdict | Evidence | Label |
| --- | --- | --- | --- | --- |
| `start.*`, `reach.tier1` | The patch must grow until gravity beats pressure; taps release energy; gas can gather untapped | true | as above | physics / game rule |
| `reach.tier3` | Reach compounds, so early levels save the most time | true | ×1.25 per level on the gather rate | game rule |
| `gather.tier2` | Buy Gravitational reach as soon as energy allows; each level costs far more than the last, but energy rises quickly too | true | PR #24; reach changes only run time. Cost ratio per level is 10¹⁰ (`UPGRADES`); binding energy rises as reach⁵ | game rule |
| `gather.tier3` | Binding energy climbs steeply as the patch grows | true | `binding_energy` ∝ reach⁵ at fixed density | physics |
| `accrete.tier1` | Mass depends on a race between feeding and clearing | true | taper and disk loss | physics (Simplified) |
| `shine.tier1`, `shine.tier3` | Nothing changes the star now; fuel lasts less as mass rises | true | no purchase in `main_sequence`; `physics.lifetime_myr` | physics |
| `small.tier2` | Search for a hotter region | true | audit: temperature → final mass up | physics |
| `big.tier1`, `big.tier3` | A black hole keeps most heavy elements; some masses fail between ones that explode | true | `heavy_yield`: 0.005 M☉ against several for a supernova; `EXPLOSION_ISLANDS` | physics (gap edges are a calibration) |
| `compare.tier1` | Most stars from about 9 to 25 M☉ explode, not all | true | pristine: all from 9.2 to 25; enriched: gaps at 18.5–20 and 21.2–25 | game rule (pristine), physics (gaps) |
| `compare.tier2`, `compare.tier3` | Change one search option and compare | true | the method the prediction system rests on | game rule |

### `content/endings.toml`

| Key | Claim | Verdict | Evidence | Label |
| --- | --- | --- | --- | --- |
| `brown_dwarf.description` | This run counts as a failed search | true | `run_gain`: ln(`FAILED_RUN_FACTOR`) | game rule |
| `white_dwarf.description` | Few heavy elements escaped | true | `heavy_yield`: at most about 0.1 M☉ | physics |
| `supernova.description` | Heavy elements now drift through the region | true | `heavy_yield`, added to `local_metals` | physics |
| `black_hole.description` | Most heavy elements fell in; near-miss masses exist; the black hole search option unlocks | true | `heavy_yield`, `EXPLOSION_ISLANDS`, `black_hole_unlocked` | physics / game rule |
| `bands.white_dwarf` | Up to about 9 M☉ | true | `SN_MIN_MASS`: 8.4 to 9.4 by metal content | physics |
| `bands.supernova` | About 9–25 M☉, with gaps | true | enriched stars also explode from 25 to 27 M☉ | physics / game rule |
| `bands.black_hole` | Some above 18 M☉, most above 27 M☉ | true | enriched gaps start at 18.5; all above 27 except the pair-instability range | physics |

## Word list

The backlog asked for a search for "burn", "dying", "zero gravity" and
"gravity cancels". None appears in the player-facing text. "Fuel burned" is
already "Core hydrogen fused". The only hit is the internal function name
`burned()` in `web/app.js`. "Fuel" remains in three shine notes and one hint
("spends its fuel", "sip their fuel", "fuel lasts"), used for hydrogen as
fusion fuel, which is accurate.

## Not covered

- In-game physics and game-rule labels (icons, model cards). They are an
  Idea in `planning/feature-backlog.md`; the labels above are the input if
  that is taken up.
- The numbers behind the "outside the engine" rows.
