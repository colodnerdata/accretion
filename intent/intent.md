---
title: Accretion, a science-grounded idle game about making stars
status: draft
author: Stephen Colodner
created: 2026-11-26
---

# Intent: Accretion

The owner's own statement of what is wanted and why. An agent proposes edits
rather than making them. Set `status: accepted` when it reads as yours.

> Back-filled on 2026-11-26 from the design spec (`intent/spec.md`: Concept,
> Decisions, Learning and discovery, Prototype plan) and from the design
> principles that were in `CLAUDE.md`. Every line comes from those sources;
> nothing here is new. Lines marked **Owner:** are gaps the sources do not
> fill. Rewrite freely before accepting it.

## Problem

The spec's first design pillar sets Accretion against the themed spreadsheet,
an idle game whose theme is decoration on its numbers. No study has yet tested
teaching methods inside an idle game (`docs/planning/playtest-measures.md`).

**Owner:** who the game is for, in your words (for example curious players
with no physics background, or players who already like idle games).

## Proposed outcome

A game in which the player begins as an unusually dense patch of interstellar
hydrogen and works toward a civilization that can engineer stars. Each stellar
lifetime is one run, and each stellar death seeds the next. The player
influences a small, real physical model, and by changing one thing at a time
builds an accurate intuition for how stars form, live and die.

## Priorities

In order, so tradeoffs have a tiebreaker:

1. **Scientifically grounded.** The simulation is the game. Prefer an
   established model or published table over an invented rule, and label every
   departure in `FIDELITY.md`. Stellar engineering and new universes are the
   only deliberately speculative elements.
2. **Players build intuition by changing one thing at a time.** Controls unlock
   one at a time, each when the player has felt the problem it solves. The
   game never forecasts; the player may make their own predictions.
3. **Controls are never mysterious, but phenomena can be.** A control's direct
   effect is always stated plainly; the science behind what happened is
   explained after the player has seen it.
4. **Every run is recorded.** The journal and its bubble plot are how a player
   compares experiments.
5. **Pacing:** early runs of about 15 to 20 minutes, growing toward an hour as
   controls unlock.

**Owner:** confirm this order. The sources state each point but do not rank
them against each other.

## Scope

- **In, now (Layer 1 prototype):** gather, collapse, accrete, shine and die, a
  region search paid for with the probability budget, the journal and bubble
  plot, tiered hints, offline progress through the live engine, and a
  single-page browser build.
- **In, later:** six prestige layers in all, with heavy elements as a second
  currency, binaries and novae from Layer 3, planets and a Goldilocks planet
  that opens Layer 5, and a new universe from the galactic core's
  supermassive black hole. Player predictions follow
  `docs/planning/prediction-system.md`.
- **Out:** previews, forecasts, ghost markers and model runs of a player's
  choices; changing the physical constants (region search changes only where
  the player starts).

**Owner:** anything else you want listed as out of scope, such as
monetization or a mobile app.

## Affected users and systems

- Players, through the single-page build `web/accretion.html`.
- Two engines that must agree: the Python reference in `src/accretion/` and the
  browser port in `web/engine.js`.
- Saved games in the browser's `localStorage`, which a change must keep
  loading or migrate.

## Constraints

- Every rule change goes into both engines; the parity test holds them to
  `rel=1e-9`.
- The engine stays deterministic and step-size independent, so offline
  progress matches live play.
- Physics values come from published sources (`DATA_REPORT.md`), and each
  modeled element carries a label in `FIDELITY.md`.
- Python for modeling and tooling, with uv, ruff and numpydoc docstrings.

**Owner:** any deadline, platform target (desktop, phone) or license
constraint.

## Success criteria

- A first run lasts about 15 to 20 minutes, and a pristine 9 to 25 M☉ star
  reliably explodes, so the first supernova objective is reachable.
- Different settings of the player's levers produce meaningfully different
  runs and endings (a Prototype plan item).
- Mass is conserved through every run, and the two engines agree.
- Players understand more of the physics after several sessions than before,
  measured by the questions in `docs/planning/playtest-measures.md`.

**Owner:** which of these you want as the bar for Layer 1, and any you would
add.

## Open questions

- The two design proposals not yet confirmed: about 10 to 20 log-spaced
  shells, and prestige moving runs toward denser regions and the galactic core.
- The epoch boundaries for the prediction system (`docs/NEXT.md`).
