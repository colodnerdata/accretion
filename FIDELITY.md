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
| Disk fragmentation | Simplified | A ring fragments where Toomre Q = c_s Ω / (π G Σ) falls below 1 (Toomre 1964; Gammie 2001 for the fragmentation picture). The disk temperature is prescribed, and the cooling-time condition (t_cool Ω below about 3) is not applied, so Q alone decides. This replaces the earlier cap that moved disk mass above the star's to companions (Kratter & Lodato 2016) |
| Fragment mass | Simplified | Σ H² with H = c_s / Ω, a scale-height-squared of disk gas. A ring forms at most one fragment per step, and only while its mass above the Q = 1 surface density is at least one fragment mass. That regulation is a game rule |
| Fragment growth and migration | Game rule | A fragment takes 0.3 of its ring's gas per orbit (at most half per step), keeping that gas's angular momentum. It drifts inward at the viscous inflow speed 3ν/(2r) times a factor of 1. The factor and the share are uncalibrated placeholders. A gap-opening limit on fragment growth is not applied yet |
| Fragment fate | Game rule | A fragment reaching the disk's inner edge merges with the star, adding its mass and the usual accretion energy. Fragments still orbiting when accretion ends become companions with their mass and separation recorded. At most 4 fragments exist at once; a fifth coalesces with the nearest, conserving mass and m√r. No ejection |
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
| Temperature floor | Debated between 10^-3 and 0.1 Z☉ | Plateau and CMB term are Established; the -0.47 slope and 0.076 Z☉ end are constructed. Purchased dust-and-metal cooling multiplies the composition bound by 0.9 per level toward the CMB — a Game rule on a constructed quantity |
| Cosmic metal clock | Simplified | Fit to integrated Madau & Fragos 2017, starting at 0.12 Gyr and blended from 10^-8 Z☉ before 0.2 Gyr |
| Local gas mass | Game rule | 10^6 M☉, tuned so one supernova enriches but does not end the primordial era |
| Density distribution | Established | Log-normal with width 1.5, near Mach 7 to 9 |
| Temperature distribution | Simplified | 250 K primordial with width 0.15. Enriched regions sit 30% above their floor, a tuned margin, with width 0.35 |
| Region rarity | Simplified | Cost z^2/2, the Gaussian log-density relative to the mode. Metal spread among regions is tuned, with no published width found |
| Novae | Not modeled | Planned for Layer 3 |
| Visible gas display (Survey, Gather, Collapse) | Simplified | Thermal speed on the true sqrt(T/m) scale (hydrogen at 10 K = 7 px/s, helium 4 amu half, a 16 amu metal a quarter); true metal share by number 10^(log10 Z - 3), drawn amplified - linear in log10 Z from the engine's primordial threshold to a 0.28-of-particles cap at solar, labeled on-canvas; helium drawn as a fixed 8% of particles at every metallicity; linear size proportional to density^(-1/3). The 7 px/s base, the 110 px/s safety cap, the fixed 8% helium, the amplification and its 0.28 cap are calibrations. Display only; does not affect any game rule |
| Disk display (Accrete scene) | Simplified | Ring color is the engine's own Toomre Q on one log scale, calm at Q >= 10 to unstable at Q = 1; Q_CALM = 10 is a calibration of the scale, not a physical threshold. Clump size is logarithmic in mass (one Jupiter mass at a base size, a fixed step per decade, capped); clump angular speed is the true Keplerian rate where slow and capped where it would strobe on screen. Gas-dot drift speed is proportional to alpha, the viscous inflow speed v_r ~ alpha; the sideways jitter grows as alpha^1.2 and is a visual cue for turbulence, not a physical velocity. The gas-reaching-the-star stat is the solver's inner-boundary flux evaluated at the current cell masses (read-only). Merge and join animations are inferred from frame-to-frame changes in the fragment list; a join is shown only when one clump clearly gained the most mass and none sits near the star (the host is the largest absolute gain), its birth radius is approximate (momentum back-solve, ignoring gas take and drift in the same steps), and any frame the diff cannot read resyncs with no animation. After a turbulence purchase the jitter is exaggerated 2.5x for 1.2 s so the change is noticed; it then settles to the true amplitude. Display only; no game rule changes |
| Reach, tap power, upgrade costs, clocks | Game rule | Tuned for pacing, with no physical basis |
| Control unlock order | Game rule | Teaches one change at a time |
| Skipped-run death reward | Game rule | The star has not actually died |

Domain of validity: early-universe star formation at game-level fidelity. Stellar masses are order-of-magnitude outcomes of a simplified disk model, not predictions.
