# Teaching principles

> Planning note; last updated 2026-11-08. Design principles from the teaching research reports.

How Accretion explains its physics. Evidence labels: **Strong** (meta-analyses or validated instruments), **Moderate** (one large or controlled study), **Weak** (case studies or practitioner advice), **Design inference** (derived from the evidence, untested in games). Sources are in the research reports "Teaching stellar astrophysics in games" and "Binaries, planets, and cosmology for Accretion".

## Core findings

- Guided discovery with feedback beats other methods (d = 0.50), while unassisted discovery does worse than explicit instruction (d = -0.38). **Strong.**
- Scaffolded simulations beat bare ones (g = 0.49). **Strong.**
- Struggling first helps only when an explanation follows (g = 0.36). **Strong.**
- Asking learners to explain or predict helps (d = 0.36). **Strong.**
- Games help most when combined with debriefing and played over several sessions. They show no reliable motivation advantage. **Strong.**
- Refutation text is among the most effective text-based ways to change misconceptions. **Strong.**

## Principles

1. **The physics is the mechanic.** Controls change physical parameters, and the simulation decides outcomes. Upgrades never buy results directly, such as "more fusion." **Moderate.**
2. **One new thing at a time.** Each control, bin, and layer arrives alone, and each prestige layer lifts one simplification. **Design inference.**
3. **Predict, observe, explain.** Players commit to predictions before outcomes resolve, then get the reason. See the prediction system sketch. **Design inference from Strong evidence.**
4. **Debrief every prestige.** The prestige screen summarizes what the run showed and invites a prediction for the next run. **Design inference from Strong evidence.**
5. **Make wrong intuitions fail visibly.** A simulation that only avoids contradicting a misconception leaves it intact. **Weak.**
6. **Show the invisible.** Live gauges for quantities players can't see, such as core temperature, the balance between gravity and pressure, and fusion rate. **Design inference.**
7. **Climb the ladder of abstraction.** One star's behavior first, then a pattern across many stars, then a population view. **Weak.**
8. **Fade help.** Reduce hints and tooltips as predictions succeed, since help that benefits novices slows experts. **Strong, not re-checked.**
9. **Deterministic outcomes.** A fixed map of outcomes is learnable; a random draw is not. **Design inference.**
10. **Thresholds teach well.** Many later-layer rules are thresholds a player can predict, such as a mass ratio or a spacing limit. **Design inference.**

## Writing

- **Refutation format:** State the common belief, say it is wrong, then give the correct account.
- **Causal chains:** And, But, Therefore. "The core runs out of hydrogen, BUT gravity never stops, THEREFORE the core shrinks and heats until helium ignites."
- **Named structures:** Negative feedback loops stabilize, positive feedback loops run away, races between timescales decide outcomes, and balance points sit where opposing effects meet.
- **Layered text:**
  1. A 5 to 12 word hook.
  2. A 25 to 50 word refutation or causal tooltip.
  3. An optional 60 to 150 word "how it works" panel with a key or scale bar.
  4. An optional reference entry with numbers, ranges, the governing relation, and open questions.
- **Length:** About 60 words or fewer per label, at or below a 12th-grade reading level. **Weak to Moderate.**
- **Analogies:** Always state where they break down.
- **Uncertainty:** Give numeric ranges with an "Open question" tag. Ranges keep trust in the source; vague hedges erode it. **Moderate to Strong.**
- **Word choice:** Avoid "burn" for fusion and "dying" without the physical event. Say "free fall," not "zero gravity," and "where gravity and orbital motion balance," not "where gravity cancels."

## Visuals

- **Color:** Call mapped color "representative color," order hues by energy from red to blue, and always show a key. Label false-color heat maps as such. **Moderate.**
- **Temperature cue:** Show "blue is hottest" wherever star color appears, since about 80% of novices read red as hot. **Moderate.**
- **Scale:** Zoomable views, scale bars, and relational anchors. Teach logarithmic axes explicitly.
- **HR diagram:** Introduce one axis at a time and label the reversed temperature axis. Show evolution as a moving point separate from the population. **Moderate to Weak.**
- **Potential maps:** Any Roche or Lagrange surface is labeled as an effective-potential map that includes rotation, not a picture of spacetime.

## Honest modeling

- **Separate physics from game rules:** Physics-driven values get one consistent icon and an optional model card. Currency, multipliers, and acceleration get another.
- **Disclose time compression:** Show real timescales beside compressed ones, for example "this collapse took 10 Myr; you watched 7 minutes."
- **Label game rules:** The guaranteed first supernova and any other pacing rule say they are rules.
- **Speculative content:** New-universe mechanics carry a visible Speculative tag.
- **The economy layer is the main teaching risk:** Exponential costs, bundled upgrades, and hidden time compression can teach false cause and effect more strongly than text can correct.
