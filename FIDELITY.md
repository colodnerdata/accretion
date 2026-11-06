# Fidelity record

Values come from the research report "Accretion prototype stellar data". Most paper values were read through a text-extraction tool, and yield sums came from redistributed tables, so spot-check them against the original papers before treating them as final.

| Element | Status | Assumption and source |
| --- | --- | --- |
| Jeans mass, free-fall time | Established | Standard forms. The Jeans definition gives about 1,755 M☉ at 200 K and 10^4 /cm3, against 400 to 500 in Bromm & Loeb and Dopcke |
| Infall rate c_s^3/G | Established | Shu scaling. Primordial simulations run 2 to 10 times higher early on, so this is knowingly low |
| Viscous disk, alpha viscosity | Established | Lynden-Bell & Pringle, Shakura-Sunyaev. Alpha 0.1 to 1 suits gravitationally unstable embedded disks; a planet phase needs its own, far lower value |
| HII taper | Simplified | Mechanism from Hosokawa 2011 and McKee & Tan 2008. Infall runs at the full Shu rate up to the break mass, then falls linearly to zero at twice that mass. The break-mass formula and the linear shape are calibrations, not published |
| HII region (Shine view and field notes only) | Simplified | Stromgren radius with case-B recombination 2.6×10^-13 cm3/s, Spitzer (1978) expansion at c_i = 10 km/s, capped at the stagnation radius R_s (c_i/c_0)^(4/3) (Raga et al. 2012). Uses zero-age Q held constant, uniform gas at the run's density and temperature, and hydrogen density taken as the total number density. Drawn only above 5 M☉, the bottom of the ionizing-photon table. Does not affect any game rule |
| Disk photoevaporation | Simplified | Tanaka 2013 rate with Schaerer 2002 Q(H). The factor of 5 is a calibration |
| Fragmentation cap | Simplified | Disk mass above the star's goes to companions, from Kratter & Lodato 2016 |
| Landing radius | Simplified | 400 (M/10)^0.6 AU, fit to two points from Hosokawa 2011 |
| Disk temperature | Simplified | 1660 r^-1/2 K with a floor at the gas temperature |
| Lifetimes | Established above 2 M☉ | Geneva grids, Yusof 2013 above 120 M☉, and Z=0 grids. Below 0.8 M☉ is order of magnitude. Cross-grid scatter is 10 to 20% |
| Luminosity | Established | MIST-derived ZAMS table; agrees across grids to about 0.02 dex at 120 M☉ |
| Rotation lifetime gain | Simplified | +25%, +18%, +10% by metallicity, tapering above 120 M☉. The 15 M☉ threshold and the link to magnetic braking are game rules |
| Hydrogen-burning limit | Established | 0.075, 0.083, 0.09 M☉ by metallicity |
| Minimum supernova mass | Simplified | Ibeling & Heger 2013; models span 1 to 3 M☉ |
| Explosion islands | Debated | Deterministic intervals chosen to match fractions derived from Sukhbold 2016, a solar-only grid. The interval edges are game choices |
| Pristine explosions | Simplified | Below 10^-4 Z☉, stars from about 9 to 25 M☉ explode. This is a design choice supported by metal-poor star fits, and it keeps the first supernova reliable |
| Pair instability | Debated | 140 to 260 M☉ below 10^-0.5 Z☉. Band and metallicity limit vary between studies |
| Supernova yield | Simplified | max(0.2, 0.36 (M - 11)) M☉, within about 25% from 13 to 40 M☉ against three of four tables |
| White dwarf and black hole yields | Simplified | Karakas 2010 and Limongi & Chieffi 2018 values, blended by metallicity. Black-hole yields at solar metallicity disagree strongly between models |
| Pair-instability yield | Established within models | 0.45 of initial mass, Heger & Woosley 2002 |
| Metal yields paid to the region | Simplified | Uses total metals, not net new metals |
| Temperature floor | Debated between 10^-3 and 0.1 Z☉ | Plateau and CMB term are Established; the -0.47 slope and 0.076 Z☉ end are constructed |
| Cosmic metal clock | Simplified | Fit to integrated Madau & Fragos 2017, starting at 0.12 Gyr and blended from 10^-8 Z☉ before 0.2 Gyr |
| Local gas mass | Game rule | 10^6 M☉, tuned so one supernova enriches but does not end the primordial era |
| Density distribution | Established | Log-normal with width 1.5, near Mach 7 to 9 |
| Temperature distribution | Simplified | 250 K primordial with width 0.15. Enriched regions sit 30% above their floor, a tuned margin, with width 0.35 |
| Region rarity | Simplified | Cost z^2/2, the Gaussian log-density relative to the mode. Metal spread among regions is tuned, with no published width found |
| Novae | Not modeled | Planned for Layer 3 |
| Reach, tap power, upgrade costs, clocks | Game rule | Tuned for pacing, with no physical basis |
| Control unlock order | Game rule | Teaches one change at a time |
| Skipped-run death reward | Game rule | The star has not actually died |

Domain of validity: early-universe star formation at game-level fidelity. Stellar masses are order-of-magnitude outcomes of a simplified disk model, not predictions.
