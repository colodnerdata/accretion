# Verification checklist

> Planning note; last updated 2026-11-08. Primary-source checks; see its own last-checked line.

Values to confirm against primary sources before they become game rules. Last checked 2026-11-07, reading papers online. PDFs could not be downloaded from this environment, so links are listed at the end.

**Status:** **Verified** means read in the paper or its abstract. **Verified (secondary)** means confirmed through a paper or reference that quotes the original. **Partly** and **Not verified** mean the original still needs reading.

## Results

| Priority | Value | Status | What the source says | Source read |
| --- | --- | --- | --- | --- |
| 1 | Habitable-zone limits and coefficients | Verified | Sun: recent Venus 0.75 AU, runaway greenhouse 0.97, moist greenhouse 0.99, maximum greenhouse 1.70, early Mars 1.77. Valid for 2,600 to 7,200 K. Coefficients below. The authors note the moist-greenhouse edge is probably too far out because the models omit clouds. | Kopparapu et al. 2013, full text |
| 2 | Giant-planet occurrence ∝ 10^(2[Fe/H]) | Verified (secondary) | P(planet) = 0.03 × 10^(2.0[Fe/H]). About 25% of stars above +0.3 host planets, and fewer than 3% below −0.5. Applies to planets detectable with K > 30 m/s and periods under 4 years. | Marcy et al. 2005 review, co-authored by Fischer; the original journal page blocks automated access |
| 3 | Eggleton Roche-lobe formula | Verified (secondary) | r_L/a = 0.49q^(2/3) / [0.6q^(2/3) + ln(1 + q^(1/3))], accurate to about 1% for all q, where q is the donor's mass over the accretor's. | Jackson et al. 2017, quoting Eggleton; the original abstract confirms only that an approximation is given |
| 4a | S-type stability | Verified | a_c = [(0.464 ± 0.006) + (−0.380 ± 0.010)μ + (−0.631 ± 0.034)e + (0.586 ± 0.061)μe + (0.150 ± 0.041)e² + (−0.198 ± 0.074)μe²] a_b. About 4% typical error, 11% worst case, for 0.1 ≤ μ ≤ 0.9 and 0 ≤ e ≤ 0.8. | Holman & Wiegert 1999, full text |
| 4b | Circumbinary stability | Verified (secondary) | a_c = [(1.60 ± 0.04) + (5.10 ± 0.05)e + (−2.22 ± 0.11)e² + (4.12 ± 0.09)μ + (−4.27 ± 0.17)eμ + (−5.09 ± 0.11)μ² + (4.61 ± 0.36)e²μ²] a_b. An equal-mass circular pair gives about 2.39 a_b (derived). Check the original's validity range: one reading gives 0.1 ≤ μ ≤ 0.9, another says the outer region was studied for 0.1 ≤ μ ≤ 0.5. | A 2014 stability study quoting Holman & Wiegert |
| 5 | Planck 2018 parameters | Verified | H₀ = 67.4 ± 0.5, Ω_m = 0.315 ± 0.007, τ = 0.054 ± 0.007, n_s = 0.965 ± 0.004, σ₈ = 0.811 ± 0.006, Ω_b h² = 0.0224 ± 0.0001, Ω_c h² = 0.120 ± 0.001. Age 13.787 ± 0.020 Gyr and reionization redshift 7.68 ± 0.79 are confirmed only through a reference citing Table 2. | Planck 2018 VI abstract; Wikipedia for age and reionization |
| 5b | Cosmic age–redshift table | Not built | Can be computed with Astropy's `Planck18` cosmology rather than looked up. | — |
| 6 | Far-future eras | Partly | Gas runs out at about 10^12 to 10^13 years, and the smallest stars finish burning hydrogen near 10^13 years. Through a secondary summary: star formation ceases near 10^14 years, the black-hole era runs to about 10^100 years, and black holes evaporate in about 2×10^64 years (1 M☉) to 2×10^93 years (10^11 M☉). The online full text was truncated, and the paper predates dark energy. | Adams & Laughlin 1997, partial text; Wikipedia |
| 6b | Proton lifetime limit | Verified | τ/B(p → e⁺π⁰) > 2.4 × 10^34 years, 90% confidence. | Super-Kamiokande 2020 abstract |
| 7a | Radius valley | Verified | A deficit of at least a factor of 2 at 1.5 to 2.0 Earth radii, from 2,025 Kepler planets. | Fulton et al. 2017 abstract |
| 7b | Kepler-like system occurrence | Verified | 30 ± 3% of Sun-like stars have Kepler-like systems, with 3.0 ± 0.3 planets each within 400 days. | Zhu et al. 2018 abstract |
| 7c | Snow lines, core-accretion timeline, M-dwarf occurrence | Not verified | Still from memory. | — |
| 8 | Orbital formulas | Partly | Verified: L4 and L5 stable for M₁/M₂ > 24.96; Sun–Earth L1 and L2 about 1.5 million km from Earth and unstable on about 23 days. Not verified: Roche limit coefficients, tidal locking and circularization scaling, tadpole period. | NASA and Wikipedia; Murray & Dermott is a book and was not accessible |
| 9a | Central Molecular Zone | Verified, with a correction | About 10^7 M☉ of dense gas in the region studied, forming stars about ten times slower than predicted, comparable to Orion. The earlier "about 0.1 M☉ per year" figure was not found and should not be used yet. | Longmore et al. 2013, full text |
| 9b | Hypervelocity star S5-HVS1 | Verified | 1,755 ± 50 km/s, ejected from Sgr A* about 4.8 Myr ago, about 9 kpc from the Sun. | Koposov et al. 2020 abstract |
| 9c | Tidal disruption rate | Verified | Theory gives about 10^-4 to 10^-5 per galaxy per year. Observed X-ray rates are about 1 to 3 × 10^-5. | Gezari 2021, full text |
| 9d | Black-hole growth | Verified, with corrections | E-folding time about 50 Myr at 10% radiative efficiency, not 45. Light seeds about 10 to 100 M☉; heavy seeds about 10^5 M☉. | Inayoshi, Visbal & Haiman 2020, full text |
| 10 | Resonant chains | Verified (secondary) | TRAPPIST-1: 8:5, 5:3, 3:2, 3:2, and 4:3 from b:c to g:f, with planet h at 18.77 days. Kepler-223: a 3:4:6:8 chain. | A 2018 resonant-chain paper; Luger et al. 2017 abstract |

### Habitable-zone coefficients (Kopparapu et al. 2013)

S_eff = S_eff,☉ + aT + bT² + cT³ + dT⁴, with T = T_eff − 5780 K. Distance d = (L/L☉ / S_eff)^0.5 AU.

| Limit | S_eff,☉ | a | b | c | d |
| --- | --- | --- | --- | --- | --- |
| Recent Venus | 1.7753 | 1.4316×10⁻⁴ | 2.9875×10⁻⁹ | −7.5702×10⁻¹² | −1.1635×10⁻¹⁵ |
| Runaway greenhouse | 1.0512 | 1.3242×10⁻⁴ | 1.5418×10⁻⁸ | −7.9895×10⁻¹² | −1.8328×10⁻¹⁵ |
| Moist greenhouse | 1.0140 | 8.1774×10⁻⁵ | 1.7063×10⁻⁹ | −4.3241×10⁻¹² | −6.6462×10⁻¹⁶ |
| Maximum greenhouse | 0.3438 | 5.8942×10⁻⁵ | 1.6558×10⁻⁹ | −3.0045×10⁻¹² | −5.2983×10⁻¹⁶ |
| Early Mars | 0.3179 | 5.4513×10⁻⁵ | 1.5313×10⁻⁹ | −2.7786×10⁻¹² | −4.8997×10⁻¹⁶ |

These are from the arXiv version. Check whether they match the published version and any erratum before hard-coding.

## Corrections to earlier notes

- Black-hole e-folding time: about 50 Myr, not 45 Myr.
- Heavy black-hole seeds: about 10^5 M☉, not 10^4 to 10^5 M☉.
- Central Molecular Zone: use "about 10^7 M☉ of dense gas, forming stars about ten times slower than predicted." Drop the 0.1 M☉ per year figure until it is sourced.
- Giant-planet law: it applies to giants detectable with K > 30 m/s and periods under 4 years, not all giant planets.

## Still unsourced

- Critical mass ratios for stable mass transfer.
- Cataclysmic-variable period gap and minimum period.
- X-ray binary demographics and millisecond-pulsar recycling.
- Milky Way disk scale heights, bar length and pattern speed, and halo mass.
- The latest evolving-dark-energy central values.
- Whether debris-disk incidence depends on metallicity.

## Values already in the prototype

- Paper values in `physics.py` were mostly read through a text-extraction tool, and yield tables came from redistributed copies. Spot-check them against the original papers before marking them Established in `FIDELITY.md`.
- Classic education figures from Hake 1998, Crouch & Mazur 2001, Kalyuga 2003, Habgood & Ainsworth 2011, and Clark et al. 2016 should be checked before being quoted in game text.
- Textbook relations, including the virial theorem, Chandrasekhar mass, and fusion temperature exponents, should be checked against a standard text.

## PDF links

- [Kopparapu et al. 2013](https://arxiv.org/pdf/1301.6674), habitable zones
- [Fischer & Valenti 2005](https://ui.adsabs.harvard.edu/abs/2005ApJ...622.1102F/abstract), planet–metallicity correlation (ADS record)
- [Marcy et al. 2005](https://arxiv.org/pdf/astro-ph/0505003), review quoting Fischer & Valenti
- [Eggleton 1983](https://ui.adsabs.harvard.edu/abs/1983ApJ...268..368E/abstract), Roche-lobe radius (ADS record with scanned full text)
- [Jackson et al. 2017](https://arxiv.org/pdf/1612.04332), quotes the Eggleton formula
- [Holman & Wiegert 1999](https://arxiv.org/pdf/astro-ph/9809315), binary-system stability
- [Circumbinary stability study, 2014](https://arxiv.org/pdf/1411.7761), quotes the circumbinary fit
- [Planck 2018 VI](https://arxiv.org/pdf/1807.06209), cosmological parameters
- [Adams & Laughlin 1997](https://arxiv.org/pdf/astro-ph/9701131), far future
- [Super-Kamiokande 2020](https://arxiv.org/pdf/2010.16098), proton decay limits
- [Fulton et al. 2017](https://arxiv.org/pdf/1703.10375), radius valley
- [Zhu et al. 2018](https://arxiv.org/pdf/1802.09526), Kepler-like systems
- [Longmore et al. 2013](https://arxiv.org/pdf/1208.4256), Central Molecular Zone
- [Koposov et al. 2020](https://arxiv.org/pdf/1907.11725), S5-HVS1
- [Gezari 2021](https://arxiv.org/pdf/2104.14580), tidal disruption events
- [Inayoshi, Visbal & Haiman 2020](https://arxiv.org/pdf/1911.05791), black-hole seeds
- [Mills et al. 2016](https://arxiv.org/pdf/1612.07376), Kepler-223
- [Luger et al. 2017](https://arxiv.org/pdf/1703.04166), TRAPPIST-1h
- [Resonant-chain pathways, 2018](https://arxiv.org/pdf/1809.06443), quotes both chains
