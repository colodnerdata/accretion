# Anchor Accretion's placeholders to published stellar grids

No single dataset can replace Accretion's placeholders: the game needs a stitched set, with Geneva grids for lifetimes from 2 to 120 solar masses, Yusof above that, Marigo, Schaerer and Ekström 2008 at zero metallicity, MIST for luminosity, Limongi and Chieffi plus Heger and Woosley for yields, and Madau and Fragos for the cosmic metal clock. Five placeholders are wrong enough to change play. The feedback rule removes gas 450 to 6,200 times faster than published photoevaporation, the metal background passes 10⁻⁴ solar about 700 times too early, the cooling floor reaches 10 K about 75 times too low in metallicity, and the 25 solar-mass black-hole cut and the 10⁻⁴ solar pair-instability gate both have no support as single lines. Several values should stay: the 0.45 pair-instability fraction, the density width of 1.5, the alpha range of 0.05 to 1 for the embedded phase, μ = 1.22, and the 8 solar-mass white-dwarf cut. The best-supported replacements are lifetimes above 2 solar masses, zero-age luminosity, pair-instability metal fractions and the critical-metallicity scale. The weakest are low-metallicity explosion outcomes, the floor between 10⁻³ and 0.1 solar, and any disk lifetime below [Fe/H] of about −0.7. One new result matters most for implementation: the published fragmentation cap traps a run at the game's starting alpha if the infall boost is on, and the tuned default star lands in the zone where explosions become unreliable, so the tutorial needs a guaranteed first supernova.

## Nine placeholders need replacing, and several should stay

Support labels below extend the vocabulary in `FIDELITY.md`. **Established** means independent published sources agree at the precision given. **Simplified** means a published anchor exists but the game-ready form is a reduction, often the researchers' own. **Debated** means sources conflict or the anchors are too thin to settle it. I checked the constants against `web/engine.js`, and that check settled one open question: the linear metal trend is a mass fraction divided by `ZSUN`, not a value in solar units, and the four yield fractions are white dwarf, supernova, black hole and pair instability in that order.

| Rank | Game now | Literature | Replacement | Support |
|---|---|---|---|---|
| 1 | Wind ε L/v², ε = 0.015 | Rates 450 to 6,200× lower, scaling as Φ^½ | HII taper plus photoevaporation | Mechanism Established; taper is Simplified |
| 2 | Z = 0.02 × t/10 Gyr | 10⁻⁴ Z☉ near 0.5 Gyr, not 0.7 Myr | Integrated cosmic fit | Simplified |
| 3 | Floor reaches 10 K at 10⁻³ Z☉, no CMB | About 77 K there, CMB adds a hard limit | T_floor(Z, z) | CMB Established; mid-range Debated |
| 4 | Black hole above 25 M☉ | Explosion islands from 15 to 30 M☉ | Explosion bins | Debated |
| 5 | Pair instability only below 10⁻⁴ Z☉ | Quoted ceilings run up to Z☉/3 to Z☉/2 | Gate at log Z < −0.5 | Debated |
| 6 | Yield fractions 0.1 and 0.02 | Right only at 15 M☉; black-hole value depends on Z | Lookup by mass and Z | Established at solar, Simplified below |
| 7 | Lifetime 1e4 M^−2.5 + 2.5 Myr | 1.6 to 2.1× too long at 2 to 10 M☉ | Table 1 | Established above 2 M☉ |
| 8 | Base 300 K, independent of Z | 214 to 283 K primordial, 10 to 20 K enriched | 250 K primordial, Z-linked | Established |
| 9 | Disk 1660 r^−½ K, no floor, disk/star up to 100 | Primordial gas stalls near 200 K; instability near 0.1 to 1 | Floor, plus cap at μ = 0.5 | Simplified |

Keep the 0.45 pair-instability fraction, σ_ln = 1.5, alpha of 0.05 to 1, the 8 solar-mass cut, μ = 1.22 and the 10 km/s wind speed. The 0.975 Shu coefficient question can be closed, since adding it changes the rate by only 2.5%. Almost all paper values reached the researchers through a text-extraction tool, and yield sums came from the NuPyCEE and VICE redistributions rather than journal supplements, so spot-check equations and printed tables before they enter `FIDELITY.md`.

## Lifetimes follow Geneva, and metallicity matters only below 10 solar masses

Geneva is the right backbone because it is the only family with same-grid rotating and non-rotating pairs from Z = 0.0004 to solar ([Ekström 2012](https://arxiv.org/pdf/1110.5049), [Georgy 2013](https://arxiv.org/pdf/1308.2914), [Groh 2019](https://ar5iv.labs.arxiv.org/html/1904.04009)). Table 1 extends it with [Yusof 2013](https://arxiv.org/pdf/1305.2099) above 120 solar masses, and uses [Marigo 2001](https://www.research.unipd.it/bitstream/11577/2470574/1/Marigo_2001_Z0_aah2588.pdf), [Ekström 2008](https://arxiv.org/pdf/0807.0573), [Murphy 2021](https://keele-repository.worktribe.com/OutputFile/465357) and [Schaerer 2002](https://arxiv.org/pdf/astro-ph/0110697) for Z = 0. Interpolate in log M and log τ.

**Table 1. Non-rotating core-hydrogen lifetime in Myr.** Italics are interpolated. A dagger marks a value derived from [FSPS-packaged PARSEC isochrones](https://github.com/cconroy20/fsps), not printed in any paper.

| M☉ | Z = 0 | Z = 4e-4 | Z = 0.002 | Z = 0.014 | Game now | Game ÷ solar |
|---|---|---|---|---|---|---|
| 0.1 | *3.3e6* | *3.3e6* | *4.8e6* | 6e6 | 3.2e6 | 0.53 |
| 0.3 | *3.1e5* | *3.1e5* | *3.8e5* | *5.6e5* | 2.0e5 | 0.36 |
| 0.5 | *5.1e4* | *5.1e4* | *6e4* | *1e5* | 5.7e4 | 0.57 |
| 0.8 | 13749 | 11130† | 11575 | *2.1e4* | 1.7e4 | 0.83 |
| 1 | 6108 | 4912† | 5492 | 9400 | 10003 | 1.06 |
| 2 | 634.5 | 582.6 | 667.0 | 1008.8 | 1770 | 1.75 |
| 3 | 209.3 | 215.8 | 240.3 | 320.6 | 644 | 2.01 |
| 5 | 67.29 | 72.99 | 77.36 | 88.19 | 181 | 2.06 |
| 8 | 26.95 | *30.7* | *31.45* | *32.62* | 57.7 | 1.77 |
| 10 | 18.92 | *20.7* | *21.03* | *21.56* | 34.1 | 1.58 |
| 15 | 11.31 | 10.95 | 11.00 | 11.02 | 14.0 | 1.27 |
| 20 | 8.47 | 7.90 | 7.89 | 7.74 | 8.09 | 1.05 |
| 25 | *6.94* | 6.48 | 6.45 | 6.31 | 5.70 | 0.90 |
| 40 | *4.83* | 4.47 | 4.51 | 4.44 | 3.49 | 0.79 |
| 60 | *3.75* | 3.51 | 3.56 | 3.53 | 2.86 | 0.81 |
| 85 | *3.17* | 2.98 | 3.02 | 3.02 | 2.65 | 0.88 |
| 120 | 2.74 | 2.61 | 2.65 | 2.67 | 2.56 | 0.96 |
| 150 | *2.51* | *2.51* | *2.51* | 2.50 | 2.54 | 1.02 |
| 200 | 2.27 | *2.29* | *2.29* | 2.32 | 2.52 | 1.09 |
| 300 | 2.05 | *2.10* | *2.10* | 2.15 | 2.51 | 1.17 |

Three cautions govern this table. **The Z = 4e-4 Geneva column replaces the Z = 10⁻⁴ PARSEC column the researchers first proposed**, because PARSEC runs 10 to 20% long relative to Geneva at the same mass and a grid change would read as a false metallicity step at 8 to 25 solar masses. Below 1.7 and above 120 solar masses that column borrows other grids. The 1 solar-mass solar value is a choice within a spread: Ekström about 8540 from a garbled row, PARSEC 9356, and MIST 10320 from the [FSPS MIST isochrones](https://raw.githubusercontent.com/cconroy20/fsps/master/ISOCHRONES/MIST/isoc_feh_p000_afe_p0_vvcrit0.4_full.dat). Everything under 0.8 solar masses is order-of-magnitude: printed values exist only at 0.08 to 0.25 solar masses at solar composition ([Laughlin 1997](https://iopscience.iop.org/article/10.1086/304125/fulltext/35131.text.html)), and the rest are the researchers' log-log and luminosity scalings. These lifetimes exceed any game clock, so that weakness costs nothing.

The physics gives the game a simple rule. Above about 10 solar masses, τ_H stays within 3% from Z = 0.0004 to 0.014 at 15 to 120 solar masses. Below that it shrinks with falling Z, with τ(0.0004)/τ(0.014) of about 0.58 at 2, 0.67 at 3, 0.83 at 5 and 0.93 at 7 solar masses (computed from the Geneva tables above). Cross-grid scatter of 10 to 20% above 8 solar masses is real and unresolved. The game's 2.5 Myr asymptote also sits too high: published values reach 2.15 at 300 solar masses and the top-end limit is near **1.9 Myr** ([Köhler 2015](https://arxiv.org/pdf/1501.03794)). For time to death rather than main-sequence time, add about 11% above 10 solar masses, the He-burning share in Table 2 of [Ekström 2012](https://arxiv.org/pdf/1110.5049). Swapping in Table 1 moves the 3,600-second skip threshold from about 8 to about 6 solar masses at solar Z.

**Table 2. Log L/L☉ on the main sequence.** Z = 0 is [Schaerer 2002](https://arxiv.org/pdf/astro-ph/0110697). The other columns are derived from [FSPS MIST files](https://github.com/cconroy20/fsps), not printed tables.

| M☉ | Z = 0 ZAMS | [Fe/H] −2.5 ZAMS | Solar ZAMS | [Fe/H] −2.5 mean | Solar mean | Game now |
|---|---|---|---|---|---|---|
| 0.1 | — | −2.80 | −3.07 | −2.79 | −3.06 | −3.50 |
| 0.5 | — | −1.11 | −1.43 | −1.03 | −1.39 | −1.05 |
| 1 | — | 0.25 | −0.14 | 0.51 | 0.08 | 0.00 |
| 2 | — | 1.48 | 1.23 | 1.63 | 1.31 | 1.05 |
| 5 | 2.87 | 2.90 | 2.73 | 3.03 | 2.85 | 2.45 |
| 10 | — | 3.80 | 3.75 | 3.97 | 3.89 | 3.50 |
| 25 | 4.89 | 4.86 | 4.87 | 5.05 | 5.04 | 4.89 |
| 40 | 5.42 | 5.35 | 5.35 | 5.56 | 5.46 | 5.60 |
| 60 | 5.72 | 5.71 | 5.71 | 5.87 | 5.80 | 5.78 |
| 120 | 6.24 | 6.24 | 6.24 | 6.37 | 6.28 | 6.08 |
| 200 | 6.57 | 6.57 | 6.57 | 6.72 | 6.59 | 6.30 |
| 300 | 6.82 | 6.84 | 6.81 | — | — | 6.48 |

ZAMS luminosity is the best-agreed quantity in this report: at 120 solar masses Yusof, Schaerer, MIST, PARSEC and the [Gräfener 2011](https://arxiv.org/pdf/1106.5361) fit span only 6.23 to 6.25, an **Established** result. The game's law misses by up to 0.43 dex at 0.1 solar masses and 0.33 dex at 300, and lacks Z entirely. Below 3 solar masses ZAMS L rises 0.25 to 0.4 dex from solar to [Fe/H] = −2.5. At high mass the real signal is in the mean, where wind stripping lowers solar stars by about 0.12 dex at 200 solar masses. The 1e4 L/M cap is not an Eddington limit. Electron-scattering Eddington is **3.8e4 L☉ per M☉** at X = 0.7, from 6.5e4/(1+X) derived from Eq. 8 of [Gräfener 2011](https://arxiv.org/pdf/1106.5361). Real ZAMS stars stay below it, with Γ_e of 0.57 at 300 and 0.67 at 500 solar masses ([Yusof 2013](https://arxiv.org/pdf/1305.2099)). Above 100 solar masses the slope flattens toward 1.3, so a table beats any single power law.

The 25% rotation bonus is right only for solar metallicity near 25 to 60 solar masses. The Geneva tables give +22 to +28% at Z = 0.014 from 15 to 85 solar masses, +15 to +20% at Z = 0.002 and 0.0004, and about +5 to +15% at Z = 0 in Murphy ([Ekström 2012](https://arxiv.org/pdf/1110.5049), [Murphy 2021](https://keele-repository.worktribe.com/OutputFile/465357)). Use +25%, +18% and +10% respectively, tapering to +14% at 200 and +10% at 300 solar masses ([Yusof 2013](https://arxiv.org/pdf/1305.2099)). The 15 solar-mass threshold has no physical basis, since gains of 17 to 28% persist down to 2 solar masses, so it should stay labelled a game rule. Slower stars gain far less: a 60 solar-mass LMC star gains only 3% at 273 km/s against 24% at 532 km/s ([Köhler 2015](https://arxiv.org/pdf/1501.03794)).

## Endings need metallicity and islands, not a single black-hole line

`ending()` already receives metallicity, so most of Table 3 slots in directly. The 0.08 cut appears at three sites (`ending`, `startMainSequence` and the ignition check), and all three must move together.

**Table 3. Ending by initial mass and metallicity.**

| Initial mass (M☉) | Rule | Support |
|---|---|---|
| Below 0.075 / 0.083 / 0.09 | Brown dwarf at Z☉ / 0.01–0.1 Z☉ / Z = 0 | Established |
| Up to M_SN(Z) | White dwarf. M_SN = 9.4 at Z☉, 8.6 at 0.1 Z☉, 8.4 at 0.01 Z☉, 8.6 at 10⁻⁴ Z☉, 9.2 at Z = 0 | Simplified; models span 1 to 3 M☉ |
| M_SN to 15 | Supernova, neutron star, near-certain | Established at solar |
| 15–20 | Explodes with p = 0.58 to 0.76 | Debated |
| 20–25 | p = 0.22 to 0.26 | Debated |
| 25–30 | p = 0.34 to 0.54 | Debated |
| 30–70 (30–60 near solar) | Black hole | Simplified |
| 60–120 near solar | Stripped by winds; S16 has some explosions | Debated |
| 70–140 below about 0.1 Z☉ | Pulsational pair instability, then black hole | Simplified |
| 140–260, log Z < −0.5 | Pair instability, no remnant | Debated |
| Above 260, or above 120 near solar | Direct collapse or black hole | Simplified |

Hydrogen-burning limits come from [Chabrier and Baraffe 2000](https://arxiv.org/abs/astro-ph/0006383), [Burrows 2001](https://arxiv.org/abs/astro-ph/0103383) and [Marley 2021](https://arxiv.org/abs/2107.07434). The game's 0.08 is close, and only the Z dependence is missing. The minimum supernova mass is the [Ibeling and Heger 2013](https://arxiv.org/abs/1301.5783) polynomial, whose full coefficients fit in one line of code, but that paper disagrees with itself at solar (9.2, 9.41 and about 9.5), and [Doherty 2017](https://arxiv.org/abs/1703.06895) puts the carbon-ignition limit anywhere from 5.5 to 9 at Z = 0.02. So 8 remains acceptable; 9 at solar is slightly better. Electron-capture supernovae occupy a sliver of 0.1 to 0.2 solar masses in [Doherty 2015](https://arxiv.org/abs/1410.5431), small enough to ignore. For white-dwarf masses use the MIST calibration of [Cummings 2018](https://arxiv.org/abs/1809.01673): M_f = 0.080 M + 0.489 for 0.83 to 2.85 solar masses, 0.187 M + 0.184 to 3.60, and 0.107 M + 0.471 to 7.20, with scatter of 0.06.

The neutron-star and black-hole boundary is where the game departs most from the science. Core structure decides, and it is non-monotonic in mass: [Sukhbold 2016](https://arxiv.org/abs/1510.04643) finds that stars below 15 solar masses always explode, 22 to 25 and 27 to 30 rarely do, and no single mass marks the transition. The bin probabilities above were derived from the [VICE copy of the S16 grids](https://pypi.org/project/vice/1.3.1/#vice/yields/ccsne/S16), W18 to N20 calibrations, treating zero explosive yield as failure. [Ertl 2016](https://arxiv.org/abs/1503.07522) and [Sukhbold 2018](https://arxiv.org/abs/1710.03243) support this structure, and observation broadly agrees: the upper type II-P progenitor mass is about 18 to 19 ([Smartt 2015](https://arxiv.org/abs/1504.02635), [Davies and Beasor 2020](https://arxiv.org/abs/2005.13855)), and a failed-supernova fraction of 0.16 has a 90% interval of 0.037 to 0.394 ([Neustadt 2021](https://arxiv.org/abs/2104.03318)). Recent 3D work widens the problem, finding black holes after strong explosions at 19.56 and 40 solar masses and persistent failures at 12.25 and 14 ([Burrows 2024](https://arxiv.org/abs/2412.07831)). **S16 is solar-only, and no low-Z equivalent was found**, so applying these probabilities at low metallicity is an assumption. Implement the islands as a deterministic function of mass rather than a random draw: the published explosion intervals in W18 can be a lookup table, which keeps Python and JavaScript parity and lets players learn the map.

For remnant masses, use about 1.4 solar masses for neutron stars, and 9 to 14 for solar-metallicity black holes depending on whether only the helium core or the whole star implodes ([Sukhbold 2016](https://arxiv.org/abs/1510.04643)). At low Z, the whole star collapses in the direct-collapse models of [Limongi and Chieffi 2018](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/agb_and_massive_stars_K10_LC18_R000.txt), an assumption of that set rather than a result, while pair-instability pulses cap black holes near **43 to 46 solar masses** over Z = 10⁻⁵ to 3×10⁻³ ([Farmer 2019](https://arxiv.org/abs/1910.12874)).

The pair-instability range is well defined in helium-core mass and less so in initial mass. The anchor is a helium core of 64 to 133 solar masses, or 140 to 260 initial, with M_He ≈ (13/24)(M − 20) ([Heger and Woosley 2002](https://arxiv.org/abs/astro-ph/0107037)), so **the game's 140 to 260 band is right as a reference**. It is not stable: a modified ¹²C(α,γ) rate shifts it to 175–270 or as far as 310–430 ([Takahashi 2018](https://arxiv.org/abs/1807.05373)), and core edges move by 10 to 15 solar masses ([Farmer 2020](https://arxiv.org/abs/2006.06678)). The metallicity gate is the real disagreement. The game's 10⁻⁴ solar comes from the conservative bound in [Heger 2003](https://arxiv.org/abs/astro-ph/0212469), while [Langer 2007](https://arxiv.org/abs/0708.1970) allows hydrogen-rich events to Z☉/3 and [Spera and Mapelli 2017](https://arxiv.org/abs/1706.06109) to about Z☉/2. Yet Takahashi cites a lower mass limit of 300 or more at Z☉/5. That conflict comes from wind recipes and is unresolved. I recommend log Z < −0.5 with the fixed band, marked Debated, because a mass of 140 already demands a rare route under the new feedback. No unambiguous event has been observed; [SN 2018ibb](https://arxiv.org/abs/2305.05796) is the best candidate. A game-visible pulsational ending would have strong support: the range is 70 to 140 solar masses at 0.1 Z☉ in [Woosley 2017](https://arxiv.org/abs/1608.08939) and about 100 to 140 at Z = 0 in [Heger 2003](https://arxiv.org/abs/astro-ph/0212469), and in bare helium cores of 34 to 60 solar masses at Z = 0, ejecta rise from 0.13 to 12 and remnants reach 34 to 48, in Woosley's Table 1.

## Yields need a mass table, and failed explosions matter more than metallicity

Replace the mass-fraction rule with metal mass by initial mass. Failure to explode is the biggest single effect, cutting a star to its wind yield; birth metallicity moves an exploding star's yield by only about 15% across 15 to 25 solar masses.

**Table 4. Metal mass per star in M☉.**

| Ending | Initial mass | Mz total | Mz net | Source | Support |
|---|---|---|---|---|---|
| Brown dwarf | Any | 0 | 0 | — | Established |
| White dwarf, solar | 1 / 2.5 / 3 / 6 | 0.008 / 0.041 / 0.062 / 0.116 | 0.000 / 0.006 / 0.018 / 0.020 | [Karakas 2010](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/agb_and_massive_stars_K10_K06_0.0HNe.txt) | Simplified |
| White dwarf, Z = 10⁻⁴ | 1 / 2.5 / 3 / 6 | 0.0003 / 0.057 / 0.026 / 0.038 | Same | Same | Simplified |
| Supernova | 13 / 15 / 20 / 25 | 0.68 / 1.3 / 2.6 / 4.6 | 0.52 / 1.1 / 2.4 / 4.3 | [LC18 R000](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/agb_and_massive_stars_K10_LC18_R000.txt) | Established to within ×2 |
| Black hole, Z ≤ 10⁻³ | 30 to 120 | Below 0.01 | About 0 | Same | Simplified |
| Black hole, solar | 30 / 60 / 120 | 0.26 / 0.97 / 3.4 | 0.0 / 0.39 / 2.2 | Same | Debated |
| Pair instability | 140 / 177 / 205 / 232 / 260 | 63 / 83 / 99 / 112 / 124 | Same | [Heger and Woosley 2002](https://arxiv.org/abs/astro-ph/0107037) | Established within models |

A one-line supernova rule fits for code: **Mz ≈ max(0.2, 0.36 (M − 11))**, a derived fit within about 25% of the Sukhbold, Woosley and Weaver and Limongi sets from 13 to 40 solar masses. It runs 35 to 50% low at 10 to 12 and 1.5 to 2.4× above [Kobayashi 2006](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/agb_and_massive_stars_K10_K06_0.0HNe.txt) at 15 to 20. The game's flat 0.1 M gives 1.3 at 13 solar masses against 0.68 to 0.88, and 2.5 at 25 against 4.6 to 5.2. It is about 2× high at the bottom, 2× low at the top, and right only at 15.

The 0.45 pair-instability fraction is the best-supported yield in the game: the Heger and Woosley sum gives 0.45 to 0.49 of initial mass, and [Umeda and Nomoto](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/popIII_N13.txt) gives 0.43 to 0.57. In contrast, the black-hole fraction of 0.02 overstates low-metallicity stars by orders of magnitude, because direct collapse leaves only wind ejecta, and wind mass falls with Z. At solar the models themselves disagree: a 60 solar-mass star yields 0.97 in LC18 and 10.3 in [S16](https://pypi.org/project/vice/1.3.1/#vice/yields/ccsne/S16), a mass-loss difference. The white-dwarf fraction of 0.002 tracks net yield at solar but runs about 11× low for a 2.5 solar-mass star at Z = 10⁻⁴.

Two choices should be explicit. Feed `localMetals` from net yield, since a recycled metal is not new; pay out `heavy` from either. They converge for massive stars, while at solar a white dwarf's net is 0 to 30% of its total. Then decide on Z ≈ 0 stars, where results depend on assumed explosion energy: a 20 solar-mass star yields 0.10 in [WW95](https://pypi.org/project/vice/1.3.1/#vice/yields/ccsne/WW95), 1.98 in [Heger and Woosley 2010](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/popIII_heger10.txt), and 3.51 in [Nomoto 2013](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/popIII_N13.txt) with 50% hypernovae. Rotation adds further spread, with a 13 solar-mass star climbing from 0.68 to 2.59 at 300 km/s ([LC18 R300](https://github.com/NuGrid/NuPyCEE/blob/master/yield_tables/agb_and_massive_stars_K10_LC18_R300.txt)). I recommend using the 0.36 rule at all Z and not modelling fallback spikes. Novae can be skipped: a whole system releases about 0.1 solar masses of metals, roughly one AGB star, in a derived estimate built on [Epelstain 2007](https://arxiv.org/abs/astro-ph/0611154).

## Gas conditions split into primordial and enriched regimes

The floor needs three pieces: a plateau, a metal-driven decline, and the CMB. The researchers' fit is the recommended form:

T_cool(Z) = 200 K for Z ≤ 1.3×10⁻⁴ Z☉; 200 K × (Z/1.3×10⁻⁴)^−0.47 up to 0.076 Z☉; 10 K above that. T_floor = max[2.725(1+z) K, T_cool(Z)].

| Z/Z☉ | 10⁻⁴ | 3×10⁻⁴ | 10⁻³ | 3×10⁻³ | 10⁻² | 0.03 | 0.076+ |
|---|---|---|---|---|---|---|---|
| Recommended T_cool (K) | 200 | 135 | 77 | 46 | 26 | 16 | 10 |
| Game now (K) | 200 | 48 | 10 | 10 | 10 | 10 | 10 |

The anchors are sound and the middle is not. The 200 K plateau is **Established** ([Klessen and Glover 2023](https://arxiv.org/pdf/2303.12500), [Omukai 2005](https://arxiv.org/pdf/astro-ph/0503010)), the transition near 10^−3.9 Z☉ comes from [Smith 2009](https://arxiv.org/pdf/0806.1653), and cooling to the CMB near 10⁻³ to 10^−2.5 Z☉ at z ≈ 20 comes from the same paper. The −0.47 slope is a line through those two points, and the 0.076 Z☉ endpoint is an extrapolation with no published value behind it. Omukai's tracks sit in figures nobody read, so this fit should be replaced from them. The CMB term is **Established** and missing entirely from the game: at z = 20 the game permits 10 K where physics forbids anything below 57 K.

There are two critical metallicities, and the game has one. Line cooling acts near 10⁻⁴ to 3×10⁻⁴ Z☉ ([Bromm and Loeb 2003](https://ar5iv.labs.arxiv.org/html/astro-ph/0310622), [Frebel 2007](https://arxiv.org/pdf/astro-ph/0701395)). Dust-driven fragmentation acts near 10⁻⁶ to 3×10⁻⁵ Z☉ ([Chiaki 2015](https://ar5iv.labs.arxiv.org/html/1410.8384), [Dopcke 2013](https://ar5iv.labs.arxiv.org/html/1203.6842)) but at densities above 10⁶ cm⁻³, so it belongs in a fragmentation rule, not the region floor. The game's start point of 10⁻⁴ can stay.

| Parameter | Primordial | Enriched | Game now | Verdict | Support |
|---|---|---|---|---|---|
| Median T | 250 K, range 214–283 | Quiet cloud 10 K, clump 15 K, massive-star GMC 20–40 K, CMZ-like 60–90 K | 300 K for all | High at primordial, 15–30× high enriched | Established; GMC upper bound unsourced |
| σ_ln T | 0.15 | 0.35 | 0.4 | Too wide for primordial | Simplified; three runs only |
| Median n | 10⁴ cm⁻³ | Clump 10³–10⁴, cloud 50–500, core 10⁴–10⁵ | 10⁴ | Good as a star-forming draw | Established |
| σ_ln n | sqrt(ln(1 + (bM)²)), b = 0.4 | Same | 1.5 | Good: M ≈ 7–9 | Established |

The primordial values rest on [Bromm 2002](https://arxiv.org/abs/astro-ph/0102503) and [Smith 2009](https://arxiv.org/pdf/0806.1653), the enriched ones on [Bergin and Tafalla 2007](https://ar5iv.arxiv.org/html/0705.3765), [Ginsburg 2016](https://www.aanda.org/articles/aa/abs/2016/02/aa26100-15/aa26100-15.html) and [Yue 2026](https://arxiv.org/pdf/2604.08909). I recommend 250 K rather than the quoted 200 K for a specific design reason: at Z ≈ 0, the floor stops the cooling upgrade, and 300 × 0.9ⁿ currently gives four levels of room. A 250 K base leaves two, and an HD tier down to about 128 K ([Klessen and Glover 2023](https://arxiv.org/pdf/2303.12500)) can legitimately extend it. Enriched regions need a base temperature tied to the floor, since `newRun` draws 300 K at any metallicity: use max(T_floor, T_environment) × exp(σ z), treating the CMZ as added heating. The density width of 1.5 inverts to M = 8.8 at b = 0.33 and 7.3 at b = 0.4, close to Orion B's M ≈ 8 and Aquila's M ≈ 6, whose Mach numbers carry 30 to 40% uncertainty ([Federrath 2008](https://arxiv.org/pdf/0808.0605), [Schneider 2013](https://arxiv.org/pdf/1304.0327)). Two definitions need care: 1e4 is a median, the mean density at σ = 1.5 is 3.08× higher, and the mass-weighted median is 9.49× higher, which matters if regions are sampled by mass.

One unflagged mismatch remains. The game's Jeans formula gives 1,755 solar masses at 200 K and 10⁴ cm⁻³, against 400 in [Bromm and Loeb 2003](https://ar5iv.labs.arxiv.org/html/astro-ph/0310622) and 500 in [Dopcke 2013](https://ar5iv.labs.arxiv.org/html/1203.6842). This is a definition difference rather than an error, but `FIDELITY.md` should note it, because the patch mass sets the envelope.

## The metal clock should follow a t^3.4 curve, not a line

Integrating the [Madau and Fragos 2017](https://arxiv.org/pdf/1606.07887) star-formation history with R = 0.39 and y = 0.033 ([Peroux and Howk 2020](https://arxiv.org/pdf/2011.01935)) gives a compact age-based form, the researchers' own fit, accurate to 0.01 dex from 0.2 to 13.7 Gyr:

**Z_mean/Z☉ = 0.108 x^3.42 / (1 + x^3.20), x = t / 3.82 Gyr**

| z | 20 | 12 | 10 | 8 | 6 | 4 | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|
| Age (Gyr) | 0.18 | 0.37 | 0.47 | 0.64 | 0.92 | 1.53 | 2.13 | 3.26 | 5.82 | 13.73 |
| log Z_mean/Z☉ | −5.51 | −4.45 | −4.08 | −3.63 | −3.08 | −2.34 | −1.89 | −1.40 | −1.03 | −0.84 |
| T_CMB (K) | 57 | 35 | 30 | 25 | 19 | 14 | 11 | 8.2 | 5.5 | 2.7 |

It crosses 10⁻⁴ Z☉ at z ≈ 10 to 12 and 10⁻³ at z ≈ 6, matching "about 0.001 solar by z = 6" in [Madau and Dickinson 2014](https://arxiv.org/pdf/1403.0007) and the simulated −3.5 at z = 8 in [Jaacks 2019](https://arxiv.org/pdf/1804.07372). Support is **Simplified**: it is a closed-box estimate that assumes Z☉ = 0.0134 and neglects remnant lock-up. It also overshoots Jaacks by 2 dex at z ≈ 26, so below 0.2 Gyr blend from the game's 10⁻⁸ start, which fits that epoch.

The current trend fails at the harsher of the two readings the researchers considered. The code treats it as a mass fraction, so it passes 10⁻⁴ Z☉ after **0.7 Myr** of clock and 10⁻³ Z☉ after 7 Myr, about 700× and 140× too early, and reaches 2 Z☉ by 13.7 Gyr against the mean of 0.14 Z☉. The clock also advances by adding finished stellar lifetimes, starting from zero, so **one 8 Myr star lifts the background to log Z = −2.94**. That completes the whole cooling ramp and shuts the pair-instability gate after a single death. Replacing it requires an offset, t = 0.12 Gyr + `cosmicMyr`. Under the new curve, about 50 to 125 massive-star lifetimes would be needed to raise the background to 10⁻⁴ Z☉, so the `localMetals` term carries nearly all enrichment. That is the right behaviour: only about 10⁻⁴ of cosmic volume exceeded 10⁻⁴ Z☉ at z = 7.5 ([Jaacks 2019](https://arxiv.org/pdf/1804.07372)). With `LOCAL_GAS_MASS` of 10⁵, one solar mass of metals adds about 7×10⁻⁴ Z☉, so a single supernova crosses the line-cooling threshold locally.

Regions should sit above the mean. Bound gas plateaus near log Z = −2.5 ([Jaacks 2019](https://arxiv.org/pdf/1804.07372)), and newly formed stars follow log Z/Z☉ = 0.153 − 0.074 z^1.34 ([Madau and Fragos 2017](https://arxiv.org/pdf/1606.07887)), about 1 to 2.5 dex above the mean at z = 8. No published width for metallicity among star-forming gas at fixed age was found, so the game's 1 dex draw stays a **tuned parameter** in `FIDELITY.md`.

For a later galaxy-level mode, the standard forms are closed box Z = y ln(1/μ) and leaky box Z = [y/(1+λ)] ln[(1+λ)/μ − λ] ([Spitoni 2015](https://arxiv.org/pdf/1505.01280)). Use y = 0.033 ± 0.010 with R = 0.39 to 0.41 and a depletion time of 2 Gyr ([Kennicutt 1998](https://arxiv.org/pdf/astro-ph/9712213), [Sun 2023](https://arxiv.org/pdf/2302.12267)). Here the old linear form has a defence: one closed galaxy does grow linearly at first, at about 0.0097 per Gyr in mass fraction, or 5× the game's slope. The inflow-balanced limit gives Z_eq = y/(1+λ), which at λ = 1 reaches 1.2 Z☉ in 1.7 Gyr, though λ = 1 is illustrative and unsourced. The radial gradient is **Established**: −0.052 ± 0.004 dex/kpc in O/H ([Wenger 2019](https://arxiv.org/pdf/1910.14605)), −0.060 ± 0.002 in Fe ([Genovali 2014](https://arxiv.org/abs/1403.6128)), or −0.1 dex/R_e for disks generally ([Sánchez 2014](https://arxiv.org/abs/1311.7052)). Cloud-scale star formation, if needed, runs at ε_ff ≈ 0.01 per free-fall time with 0.5 dex scatter and 4 to 10% whole-cloud efficiency ([Utomo 2018](https://arxiv.org/pdf/1806.11121), [Chevance 2020](https://arxiv.org/abs/1911.03479)).

## Feedback needs two mechanisms, and the fragmentation cap has a trap

> Superseded in part (2026-11-10): the game no longer moves disk mass above
> the star's to companions. `FIDELITY.md`'s "Disk fragmentation" and
> "Fragment mass/fate" rows now carry the Toomre-Q fragmentation rule that
> replaced the cap, which kept runs from stalling at low alpha without
> sending mass to phantom companions. The cap-harness rows below are kept
> for the reasoning that led there; their "to companions" numbers no longer
> describe the shipped game.

The infall rate is the smallest problem. At 300 K the game gives 6.9e-4 solar masses per year, about 2 to 10× below simulated early rates of 10⁻³ to 10⁻² ([Klessen and Glover 2023](https://arxiv.org/pdf/2303.12500), [Hirano 2014](https://arxiv.org/pdf/1308.4456), [Hosokawa 2011](https://arxiv.org/pdf/1111.3649)). Real rates also fall with mass, as M^(−3/7) in [McKee and Tan 2008](https://arxiv.org/pdf/0711.4116). Lowering the base temperature widens the gap to 5.2e-4 at 250 K. The researchers' optional factor, f(M) = 3 (M/20)^(−3/7) clamped to 1–10, closes it, but its normalization is a compromise.

The feedback rule is the largest error in the game. Photoevaporation scales as Mdot = 5.4e-5 (Φ/10⁴⁹ s⁻¹)^½ (r_d/1000 AU)^½ solar masses per year ([Tanaka 2013](https://arxiv.org/pdf/1306.6623)), uncertain by a factor of 2. The game exceeds this by 450× at 5 solar masses and 6,200× at 120. Fixing ε alone fails, because photoevaporation alone cannot stop growth: on the game's solver it gives 280 to 640 solar masses. What ends accretion in simulations is the bipolar HII region cutting off the infall feed ([Hosokawa 2011](https://arxiv.org/pdf/1111.3649), [McKee and Tan 2008](https://arxiv.org/pdf/0711.4116)). So the replacement has two parts. The researchers' taper sets M_b = 20 (Mdot/1.6e-3)^(2/3), scales infall by max(0, 1 − (M − M_b)/M_b), and removes 5× the Tanaka rate from disk gas only. M_b and the factor of 5 are their calibrations, not published values. Ionizing photons come from the ZAMS column of [Schaerer 2002](https://www.aanda.org/articles/aa/pdf/2002/04/aa1629.pdf), log-log interpolated:

| M☉ | 5 | 9 | 15 | 25 | 40 | 60 | 80 | 120 | 200 | 300 | 500 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Q(H) (s⁻¹) | 1.1e45 | 1.8e47 | 1.4e48 | 5.5e48 | 1.9e49 | 3.5e49 | 5.9e49 | 1.1e50 | 2.3e50 | 4.0e50 | 7.4e50 |

Do not use the [Tanaka](https://arxiv.org/pdf/1306.6623) power law below 40 solar masses, since it runs 15× high at 9. Above Z ≈ 10⁻² Z☉, drop the taper and use M_final = 0.3–0.5 × M_core, set by disk winds ([Tanaka 2017](https://arxiv.org/abs/1610.08856v2)), a simple and directly supported rule.

For a target, Pop III final masses span 10 to 1,600 solar masses ([Hirano 2014](https://arxiv.org/pdf/1308.4456)) or about 1 to 300 ([Susa 2014](https://ar5iv.arxiv.org/html/1407.1374)), with 43 in the 2D fiducial run of Hosokawa and most archaeological fits below 40 ([Ishigaki 2018](https://ar5iv.arxiv.org/html/1801.07763)). Klessen and Glover call feedback's end point inconclusive, so the game's 15 to 21 is low but defensible. Physical support is in the slope, not the value: M = 100 (Mdot/2.8e-3)^0.8 ([Hirano 2014](https://arxiv.org/pdf/1308.4456)) against the game's nearly flat response of 14 to 17 solar masses from 200 to 500 K.

The earlier harness tested only the taper, so I ran the full recommended set together on a scratch copy of the game's disk solver, with a 1000 solar-mass envelope and main-sequence Q(H) from the start. The first two rows come from the earlier harness and the rest are new.

| Setup | T (K) | α | Final M | To companions | Finished (yr) |
|---|---|---|---|---|---|
| Current game | 300 | 0.05–1 | 15–21 | 0 | about 9e4–2.9e5 |
| Taper only | 300 | 0.05 / 0.3 / 1 | 40 / 32 / 27 | 0 | 7.4e5 / 2.8e5 / 1.5e5 |
| Full set, no boost | 250 | 0.05 | 20 | 411 | 1.2e6 |
| Full set, no boost | 250 | 0.1 | 21 | 99 | 4.2e5 |
| Full set, no boost | 250 | 0.3 | 22 | 6 | 1.5e5 |
| Full set, no boost | 200 | 0.3 | 17 | 0.4 | 1.4e5 |
| Full set, f(M) | 250 | 0.3 | 44 | 431 | 3.1e5 |
| Full set, f(M) | 250 | 1 | 43 | 31 | 8.1e4 |
| Full set, f(M) | 250 | 0.15 | 7 | 992 | Never |
| Full set, f(M) | 200–300 | 0.05 | 2 | 998 | Never |

"Full set" means the taper, a 200 K disk floor, r_c = 400 (M/10)^0.6 AU clamped to 50–3,000, and moving disk mass above the star's mass to companions (the μ = 0.5 limit of [Kratter and Lodato 2016](https://arxiv.org/pdf/1603.01280)), active above 1 solar mass. Three lessons follow. **With f(M) on, the cap traps runs at alpha of 0.2 or below at 250 K**: the disk cannot deliver gas, the cap sends nearly all of it to companions, and the star stalls. The game starts at alpha 0.05, so this would break the first run. Next, the phase needs an explicit end condition: 200 K at alpha 1 with no boost stalled at 14.9 solar masses without ever finishing, most likely because disk loss matched the tapered feed just below 2 M_b. Finally, alpha stops controlling mass. In the no-boost set it controls duration and companion mass, which fits a turbulence upgrade well.

I recommend shipping no-boost at 250 K with `BASE_ALPHA` raised to 0.1, for about 21 solar masses over about 420 seconds at 1000 yr/s, shortening to 150 seconds at alpha 0.3. This keeps the first-run mass near today's, at a somewhat longer run than today's 90 to 290 seconds. It knowingly leaves infall below simulated rates, which should be logged. Add f(M) later as an upgrade that also requires alpha of 0.3 or more; it gives a default near 44 solar masses, close to Hosokawa's 43. These runs ignore the protostellar UV delay and were not full playthroughs, so they are checks, not calibrations.

The conflict with Table 3 needs a decision. A default star of 17 to 22 solar masses lands where S16 gives only 0.22 to 0.76 explosion odds, and `cooling` and `metals` unlock on supernova counts. Guarantee the early supernovae as a labelled game rule, or set the Z ≈ 0 explosion rule from low-metal models, where a 25 solar-mass hypernova fits many extremely metal-poor stars ([Ishigaki 2018](https://ar5iv.arxiv.org/html/1801.07763)). Either way, `FIDELITY.md` should say so.

## Alpha is fine for now, but planets need other numbers

Alpha and the disk clock describe different eras. The game's 0.05 to 1 is correct for massive embedded disks, where gravitational instability gives about 0.01 to 1, with a local limit near 0.1 and values approaching 1 as disk mass nears stellar mass ([Kratter and Lodato 2016](https://arxiv.org/pdf/1603.01280)). Pop III work implies 0.06 to 1 ([Clark 2011](https://ar5iv.arxiv.org/html/1101.5284), [Latif and Schleicher 2015](https://arxiv.org/pdf/1411.0096)). Label the upgrade gravitational turbulence, not MRI, and note that the top of the range exceeds the local limit. A self-regulating cell-based form exists, α_loc = 0.14 (1.69/Q² − 1)(1 − μ)^1.15 ([Krumholz 2008](https://ar5iv.labs.arxiv.org/html/0712.0853)), but `disk.step` takes only one alpha and it was not tested. Class II disks are different: observations give about 10⁻⁵ to 10⁻², demographics favor about **5×10⁻⁴**, and whether winds or turbulence drive accretion remains open ([Rosotti 2023](https://ar5iv.labs.arxiv.org/html/2302.01433), [Manara 2022](https://arxiv.org/pdf/2203.09930)). A planet phase should therefore use its own constant, 1 to 4 orders of magnitude below the current range.

The disk profile has a comment bug and a physics gap. `CS2_1AU = 0.5` is **1660 K at 1 AU for μ = 1.22, not the "about 660 K" in `disk.py`**, and the profile falls to 52 K at 1000 AU, below primordial gas's 200 K floor. That cold outer disk is one reason the disk/star ratio reaches 10 to 100 when instability sets in near 0.1 to 0.3. Use T = max(200 K, 1660 r^−½). The r^−½ slope is fine, though [Latif and Schleicher 2015](https://arxiv.org/pdf/1411.0096) give a hotter marginally stable disk of about 3100 K at 10 AU and 400 K at 300 AU. The landing radius of 1000 AU is too large early: simulations give about 400 AU at 10 solar masses and 600 at 20 ([Hosokawa 2011](https://arxiv.org/pdf/1111.3649)). The 400 (M/10)^0.6 fit comes from those two points only. Under the taper it barely affects final mass, so braking stays a pacing control. For present-day stars, the percentage cut should become an absolute scale: Class 0 disks are mostly under 60 AU ([Maury 2019](https://arxiv.org/abs/1810.11221v2)), averaging 45 AU in dust in Orion ([Tobin 2020](https://arxiv.org/abs/2001.04468)).

The game has no disk clock yet, and the embedded phase's 10⁵-year clearing should not be confused with one. For a planet phase use τ_disk = 2.5 Myr × g(M) × 10^(0.75 [Fe/H]), where g = 1.2 below 0.1 solar masses, 1 from 0.1 to 1.3, and 0.5 above, and the survival fraction is exp(−t/τ). The solar anchor is **Established** as "a few Myr", at 2.5 Myr in [Mamajek 2009](https://arxiv.org/pdf/0906.5011), 2.3 to 2.9 in [Fedele 2010](https://arxiv.org/pdf/0911.3320), and half gone by 3 Myr in [Haisch 2001](https://arxiv.org/pdf/astro-ph/0104347), though cluster ages may be low by up to 2× ([Ribas 2015](https://www.arxiv.org/pdf/1502.00631)). The mass factor is **Simplified** from Mamajek and Ribas. The metallicity exponent is **Debated**: it is the midpoint of 1 ± 0.5 from two points in [Yasui 2010](https://arxiv.org/pdf/1010.1668) and 0.52 from [Ercolano and Clarke 2010](https://arxiv.org/pdf/0910.5110). No data exist below [Fe/H] of about −0.7, so clamp the factor near 0.075 as a game choice, not a finding.

## Conclusion

The most useful result is that this is less a data-entry job than a coupling problem. Each replacement is defensible alone, yet the lower base temperature starves infall, the infall boost breaks the cap at low alpha, the corrected metal clock shifts enrichment onto the local term, and the correct explosion map threatens the supernova unlocks. Implement in this order so each break appears alone: metal clock and floor, then lifetimes and luminosity, then feedback and disk changes, then endings and yields, retuning first-run pacing with `tools/bot.py` after each.

The fidelity record should also change character. Lifetimes, luminosity, the Q(H) table and pair-instability yields can move toward Established, but explosion islands at low metallicity, the taper, the floor's middle section and the disk clock's metallicity term are honest Simplified or Debated entries. Those are the places where a player's surprise is closest to a real open question, which makes them the best targets for in-game discovery. The highest-value next reads are Omukai's temperature tracks, a low-metallicity explosion survey if one exists, and the Yusof and Ekström PDFs for a final table check.
