# Disk breakup and companions: plan for step 4

> Planning note; written 2026-11-13. A plan, not a decision record. Nothing
> here is built. The formulas are quoted from memory of the cited papers and
> must be confirmed in the primary sources before any is coded (see
> "Verification before coding").

Step 4 of `implementation-order.md` builds disk breakup in three stages and
reruns the audit after each. This note sets out what each stage models, the
equations, how it fits the two engines, what must stay true, and the choices
that need an owner ruling.

## Where the engine is today

The engine already fragments the disk (`game._form_fragments`,
`_evolve_fragments`, `_settle_fragments`; rows 13 to 16 of `FIDELITY.md`).
Measured on 2026-11-13 with purchases held at level 0 unless noted:

| Region | Final mass | Fragments formed | Most at once | Companions | Lowest Q |
| --- | --- | --- | --- | --- | --- |
| First run, 250 K | 26.16 M☉ | 5 | 2 | none | 0.91 |
| Hot pristine, 313 K | 33.12 M☉ | 5 | 2 | none | 0.90 |
| Cold pristine, 200 K | 21.45 M☉ | 5 | 2 | none | 0.98 |
| First run region, greedy turbulence, every control unlocked | 21.71 M☉ | 2 | 1 | none | 0.97 |
| Near a black hole | 42.07 M☉ | 18 | 4 | none | 0.93 |
| Enriched, 29 K | 2.32 M☉ | 0 | 0 | none | 6.36 |

What that shows:

- **Every fragment merges with the star.** No run in the audit leaves a
  companion. Fragments form at 0.03 to 0.15 M☉ between 35 and 190 AU while the
  star is 0.3 to 5 M☉, then drift in at the viscous speed and are absorbed.
  Fragmentation today only delays gas; it does not change where mass ends up.
- **Birth radii sit on the grid.** Fragments are born at ring centres (35, 64,
  114, 191 AU), so any plot of separations would show the 16 rings, not the
  physics.
- **Cold enriched disks never fragment.** Infall scales as T^1.5, so a 29 K
  region feeds a light disk that stays at Q above 6.
- **Three rules are placeholders:** the growth share (0.3 of the ring per
  orbit), the migration factor (1 × the viscous speed), and the limit of four
  fragments.

## What the plan adds, in one paragraph

A fragment becomes an object with a life: it forms when an unstable ring has
had time to clump, starts as an extended gas ball, grows by pulling in disk
gas until it opens a gap, drifts inward, and either is torn apart by the
star's tide (returning its gas to the disk), merges with the star, or
contracts in time and survives as a companion. Which fate it meets depends on
the race between drifting and contracting, and that race depends on disk
temperature, turbulence, landing radius and metal content. That is what gives
the player relationships that hold in one region and break in another.

## Concepts and conserved quantities

- **Level of description:** the 1-D viscous disk stays as it is (rings of gas
  on a specific-angular-momentum grid). Fragments are point objects with a
  mass, a radius, an age and a state. No N-body dynamics, no randomness.
- **Mass:** `star + disk + envelope + fragments + ejected + companions` equals
  the collapse mass at every step. Every transfer below moves mass between two
  of those terms and nothing else.
- **Angular momentum:** tracked as Σ m·√r in grid units (as `_add_fragment`
  already does). Gas a fragment accretes brings its own; gas returned by a
  disrupted fragment goes back at the fragment's radius; migration hands the
  fragment's loss to the disk as a torque, or is logged as a boundary loss.
  The "angular-momentum ledger" open in `NEXT.md` is a prerequisite: stage (a)
  adds it as a tested budget, like the mass budget.
- **Determinism:** every rule is a function of state. Sub-ring positions come
  from the golden-angle sequence already used for orbital phase.
- **Step-size independence:** all rules advance on the engine's fixed
  `SIM_STEP_YEARS`, so offline progress and live play agree as now.

## Stage (a): what happens to a fragment once it exists

Stage (a) leaves formation alone and replaces the three placeholders. It
comes first because it decides whether companions can exist at all.

### (a1) Migration

Two regimes, chosen by whether the fragment has opened a gap.

- **No gap (Type I):** the fragment drifts inward on
  `t_I = (1 / C) · (M* / m) · (M* / (Σ r²)) · (H / r)² / Ω`, with `C` of order
  2.7 + 1.1·s for Σ ∝ r^−s (Tanaka, Takeuchi & Ward 2002). In
  self-gravitating disks this is a few orbits (Baruteau, Meru & Paardekooper
  2011), far faster than the viscous speed used today.
- **Gap opened (Type II):** the fragment follows the disk's viscous inflow,
  `v = 3ν / (2r)`, slowed when the fragment outweighs the local disk
  (`v × min(1, 4πΣr² / m)`).
- **Blend:** scale the Type I rate by the gap depth below, so the switch is
  smooth and there is no threshold for parity to disagree on.

### (a2) Gap opening

- Criterion (Crida, Morbidelli & Masset 2006):
  `(3/4)·H / R_Hill + 50 / (q·Re) ≲ 1`, with `q = m / M*`,
  `R_Hill = r·(q/3)^(1/3)` and `Re = r²Ω / ν`.
- Gap depth (Kanagawa et al. 2015): `Σ_gap / Σ = 1 / (1 + 0.04·K)`,
  `K = q² · (H/r)^−5 · α^−1`. One smooth factor that both slows migration and
  starves growth. This is the "gap-opening limit" `FIDELITY.md` says is
  missing.
- **Why it matters for play:** turbulence (α) is the player's control. More
  turbulence fills gaps, so fragments keep growing and keep migrating fast.
  Less turbulence lets a fragment open a gap, slow down and survive. That is a
  direct, physical reason for a turbulence relationship that can reverse.

### (a3) Growth

- Before a gap: gas enters the fragment's Hill sphere at about
  `ṁ = Σ · Ω · R_Hill²` (order-unity coefficient to be taken from the
  literature).
- With a gap: the same rate times `Σ_gap / Σ`.
- Replaces the fixed 0.3-per-orbit share. Still capped at the ring's gas.

### (a4) Contraction and tidal disruption

- A new fragment is an extended, pressure-supported gas ball (a "first
  core"), a few AU across. It contracts as it cools; when its centre reaches
  about 2,000 K, molecular hydrogen breaks up and it collapses to a compact
  object in a short time (Masunaga & Inutsuka 2000; Nayakshin 2010).
- Model: each fragment carries an age and a contraction time `t_c(m, Z)`.
  While `age < t_c` it is extended with radius `R_c`; after that it is
  compact.
- **Tidal disruption:** an extended fragment whose radius exceeds a fraction
  of its Hill radius is torn apart: `R_c > f · r · (m / 3M*)^(1/3)`. Its gas
  returns to the ring it is in. A compact fragment cannot be disrupted.
- **The race:** disruption happens when migration (a1) carries the fragment
  inward faster than it contracts. Zhu et al. 2012 find all three fates
  (disruption, merger, survival) in simulations; Vorobyov & Basu 2006 tie
  disrupted clumps to bursts of accretion onto the star.
- `t_c` and `R_c` are the least certain inputs in the whole plan. They need a
  published fit, not an invented curve. Metal content enters here (opacity
  sets the cooling), which is one of the two places metals change the outcome.

### (a5) Fates

| Fate | Condition | Where the mass goes |
| --- | --- | --- |
| Disrupted | extended and larger than its tidal limit | back to its ring |
| Merged | reaches the inner edge | the star (with accretion energy, as now) |
| Companion | still orbiting when accretion ends | a companion record |

Companions stay records only in Layer 1 (decided in `implementation-order.md`).
The record gains how the companion formed and its mass ratio.

## Stage (b): when and where a ring fragments

Stage (b) replaces "Q below 1 fragments at once, at the ring centre, with mass
ΣH²" by the linear theory of the instability.

- **Fastest-growing wavelength:** `λ = 2π² G Σ / Ω² = 2πH / Q`.
  (`implementation-order.md` says "spacing 2πQH". The two agree only at Q = 1;
  the note should read 2πH/Q.)
- **Growth rate:** from the dispersion relation
  `ω² = Ω² − 2πGΣ|k| + c_s² k²`, the fastest mode grows at
  `γ = Ω · √(1/Q² − 1)` for Q < 1, and not at all for Q ≥ 1.
- **Growth clock:** each ring accumulates `∫ γ dt` while unstable and loses it
  when stable. A fragment forms when the clock passes a set number of
  e-foldings. A ring that dips below Q = 1 for a moment no longer fragments;
  one held there does. Deterministic, and it removes the "at most one per
  step" game rule.
- **Count and mass:** a ring of radius r holds about `2πr / λ` clumps of mass
  about `Σ λ²`. That mass is up to 4π² ≈ 40 times today's ΣH². The literature
  spans that range (Kratter & Lodato 2016 review it; Boley et al. 2010 argue
  for the low end). This single choice moves every result, so it is an owner
  ruling below.
- **Birth radius:** a continuous position inside the ring, from the
  golden-angle sequence, weighted toward the edge nearer the Q minimum. This
  removes the grid from the separation record without changing the ring
  count, so the queued 16-versus-32-ring ruling is not needed for step 4.
- **Fragment limit:** the cap of four stays as a performance bound. When a
  ring would form several clumps, they are formed as one body of their
  combined mass (the same merge rule as today, applied at birth).

## Stage (c): the cooling-time gate

Q below 1 is necessary, not sufficient. A clump must also lose its heat
faster than the disk shears it apart.

- **Criterion (Gammie 2001):** fragmentation needs `β = t_cool · Ω ≲ 3`.
  Later work puts the critical value between about 3 and 30 and it remains
  debated (Meru & Bate 2011; Rafikov 2005 for where in a disk it can be met).
- **Cooling time:** `t_cool = Σ c_s² / ((γ_a − 1) · 2σ T_eff⁴)`, with
  `T_eff⁴ = T⁴ / (τ + 1/τ)` and optical depth `τ = κ Σ / 2`.
- **Opacity** `κ(T, Z)` is where metals enter. In an optically thick disk more
  metals mean slower cooling and less fragmentation; in a thin one, the
  reverse. Pristine gas cools through molecular hydrogen lines and needs its
  own rate. This gives the metal setting a relationship that depends on the
  region, and it is the engine's route to the observed trend that close
  binaries are more common at low metal content (Moe, Kratter & Badenes 2019),
  already noted in `feature-backlog.md`.
- **In the model:** the gate multiplies the growth clock's rate by a smooth
  function of β (1 for fast cooling, 0 for slow), so there is again no hard
  switch.
- **What it needs that the engine lacks:** an opacity table and a pristine
  cooling rate. The disk temperature stays prescribed (1,660 K at 1 AU,
  falling as r^−½, with the gas floor), so this is a gate on a fixed
  temperature profile, not a thermal model. That limit goes in `FIDELITY.md`.

## Not in step 4

- Heating of the disk by the star's own light, which stabilizes massive-star
  disks. It would be the natural stage (d).
- Fragments scattering or ejecting each other. It needs N-body dynamics or a
  random draw.
- Any use of companions after the run (binaries, mass transfer): Layer 3.
- The disk being cleared before ignition (`ionizing_rate` is flat below
  5 M☉). It is a separate engine item from the copy audit, but it changes how
  much disk a small star has, so it should be ruled on before stage (a) is
  calibrated.

## What must stay true

Checked after every stage, in both engines:

1. **Mass budget** closes to 1e-8, with fragments and returned gas included.
2. **Angular-momentum budget** closes, with boundary and migration terms
   listed.
3. **Parity** to 1e-9, with a parity region that forms, disrupts and keeps a
   fragment (the current stress scenario covers coalescing only).
4. **Step-size independence:** one long step equals many short ones.
5. **The first supernova stays reliable.** A first run with greedy turbulence
   ends as a supernova today (21.5 M☉ under the `tools/bot.py` policy). A companion that takes several solar
   masses could push a first star below 9 M☉ or change which side of 25 M☉ it
   lands. Each stage reports the first-run mass and ending under the bot
   policy, and a stage that breaks the outcome is retuned before it merges.
6. **Pacing:** first-run time stays inside the 15 to 20 minute target (it is
   13.4 minutes now, already short).
7. **Old saves:** a run saved mid-accretion has fragments without the new
   fields. Either they get defaults on load or `SAVE_KEY` is bumped; decide
   once, in stage (a).

## How each stage is built and checked

| Stage | Engine work | New tests | Audit |
| --- | --- | --- | --- |
| (a) | Fragment fields `age`, `state`; migration, gap depth, growth, contraction, disruption; companion record fields; the angular-momentum ledger | budgets; each fate reached in a constructed disk; limits (no gap at high α, gap at low α; Type I rate against the formula) | rerun; diff against today's report; companions should no longer be "no change" everywhere |
| (b) | Ring growth clocks; wavelength, count, mass; continuous birth radius | growth rate against the formula; a brief dip does not fragment; birth radii not on ring centres | rerun; check density and temperature rows for new `depends` |
| (c) | Opacity table, cooling time, the β gate | β against hand values; metal setting moves the fragmenting zone | rerun; the metal setting should gain relationships in enriched gas |

Each stage is its own PR. The audit report is regenerated and committed in
the same PR, and its diff is part of the review. `FIDELITY.md` rows 13 to 16
are rewritten stage by stage, and `docs/audit/copy-audit.md` rows that cite
the report are rechecked.

Display changes ride with the stage that needs them and go through the ui-ux
review: an extended fragment drawn differently from a compact one, a gap as a
dim ring, a disruption as gas returning. No new control is added in step 4,
and nothing forecasts a fragment's fate.

## Benchmarks to calibrate against

Order-of-magnitude targets, not fits:

- **Massive stars usually have companions.** Most O stars are in binaries
  close enough to interact (Sana et al. 2012); companion frequency rises
  steeply with primary mass (Moe & Di Stefano 2017). A pristine 20 M☉ run that
  never leaves a companion, as today, is the wrong way round.
- **Disk-born companions are close and not tiny:** separations of tens to
  hundreds of AU at birth, mass ratios well above 0.1 after growth.
- **Low-mass enriched stars from light, stable disks have few disk-born
  companions.** The engine already gives none.
- **Low metal content favours close companions** (stage (c)).

## Fidelity record for the plan

| Element | Status | Basis and what would change it |
| --- | --- | --- |
| Toomre Q, fastest-growing wavelength, growth rate | Established | Linear theory of a thin gas disk (Toomre 1964) |
| Cooling-time criterion | Debated | Gammie 2001; critical β between about 3 and 30, resolution-dependent |
| Initial fragment mass | Debated | Between ΣH² and Σλ²; chosen by calibration, labeled so |
| Type I migration of fragments | Established, Simplified here | Tanaka et al. 2002; Baruteau et al. 2011 for self-gravitating disks |
| Gap opening and gap depth | Established | Crida et al. 2006; Kanagawa et al. 2015 |
| Growth by Hill-sphere accretion | Simplified | Order-unity coefficient from the literature |
| Contraction time and size of a first core | Simplified, weakest input | Masunaga & Inutsuka 2000; Nayakshin 2010; needs a published fit |
| Tidal disruption at a Hill-radius fraction | Simplified | Zhu et al. 2012; Vorobyov & Basu 2006 |
| Opacity and pristine cooling | Simplified | Standard tables; prescribed disk temperature limits what they can do |
| Fragment limit of four, merge at birth | Game rule | Performance bound |
| Growth-clock threshold (e-foldings) | Game rule | Tuned so brief dips do not fragment |

## Domain of validity

The model describes fragmentation of a thin, viscous, axisymmetric disk
around a single growing star, with a prescribed temperature. It does not
describe spiral arms, which carry most of the transport in real
self-gravitating disks before they fragment, nor disks more massive than
their star (true in the first few thousand years of every run, when the
"star" is a 0.01 M☉ seed). Early fragments there are better read as the
cloud core splitting, and the plan treats them the same way for want of a
second model.

## Verification before coding

In the style of `verification-checklist.md`, read in the primary source and
record the exact form, constants and stated range for: the Type I coefficient
(Tanaka et al. 2002); the gap criterion (Crida et al. 2006); the gap-depth
fit and its tested range of K (Kanagawa et al. 2015); the fragment-mass
estimates (Kratter & Lodato 2016; Boley et al. 2010); first-core size and
lifetime (Masunaga & Inutsuka 2000; Nayakshin 2010); the fates in Zhu et al.
2012; the critical β (Gammie 2001; Meru & Bate 2011); the multiplicity
numbers (Sana et al. 2012; Moe & Di Stefano 2017; Moe, Kratter & Badenes
2019).

## Owner rulings needed

1. **Fragment starting mass:** ΣH² (today), Σλ² (linear theory, about 40
   times larger), or a calibrated value between. Recommendation: calibrate
   between them against the companion benchmarks, and label it Debated.
2. **How much a companion may cost the star.** Recommendation: no cap, but
   stage (a) may not merge if the bot's first run stops ending as a
   supernova; retune the contraction time first.
3. **Old saves:** defaults for the new fragment fields, or a `SAVE_KEY` bump.
   Recommendation: defaults, since the fields have safe values (age 0,
   extended).
4. **Stage order:** (a) then (b) then (c), as in `implementation-order.md`.
   An alternative is (b) first, since it is the smallest and removes the grid
   from birth radii. Recommendation: keep (a) first; without it no companion
   survives to have a separation.
5. **The disk cleared before ignition:** fix it before stage (a) is
   calibrated, or accept it as a labeled simplification.
6. **Correct "2πQH" to "2πH/Q"** in `implementation-order.md`.

## Sources

Toomre 1964, ApJ 139, 1217. Gammie 2001, ApJ 553, 174. Rafikov 2005, ApJ 621,
L69. Tanaka, Takeuchi & Ward 2002, ApJ 565, 1257. Crida, Morbidelli & Masset
2006, Icarus 181, 587. Kanagawa et al. 2015, ApJ 806, L15. Baruteau, Meru &
Paardekooper 2011, MNRAS 416, 1971. Boley et al. 2010, Icarus 207, 509.
Kratter & Lodato 2016, ARA&A 54, 271. Kratter, Matzner, Krumholz & Klein
2010, ApJ 708, 1585. Masunaga & Inutsuka 2000, ApJ 531, 350. Nayakshin 2010,
MNRAS 408, L36. Vorobyov & Basu 2006, ApJ 650, 956. Zhu, Hartmann, Nelson &
Gammie 2012, ApJ 746, 110. Meru & Bate 2011, MNRAS 411, L1. Sana et al. 2012,
Science 337, 444. Moe & Di Stefano 2017, ApJS 230, 15. Moe, Kratter & Badenes
2019, ApJ 875, 61. Citations are from memory and are part of what the
verification pass confirms.
