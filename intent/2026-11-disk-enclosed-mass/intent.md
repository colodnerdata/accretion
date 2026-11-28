---
title: Disk rotation from enclosed mass, with an angular-momentum ledger
status: draft
author: Stephen Colodner
created: 2026-11-28
---

# Intent: disk rotation from enclosed mass

The owner's own statement of what is wanted and why. An agent proposes edits
rather than making them. Set `status: accepted` when it reads as yours.

> Drafted on 2026-11-28 from issue #33 and the owner's ruling in the
> project chat: the star as a point mass outside its radius, point-mass and
> moment-of-inertia treatment for fragments, and the angular-momentum link.
> Rewrite freely before accepting it.

## Problem

Every rotation-dependent rule uses the star's mass alone:
`orbital_frequency`, `viscosity` and `critical_surface_density` in
`src/accretion/disk.py`, the fragment code in `src/accretion/game.py`, and
the same functions in `web/engine.js`. Early in a run the disk weighs about
as much as the star (the bot's first run has 1.9 M☉ of disk around a
1.0 M☉ star at 5,600 yr). Counting the mass inside each ring, the outer
rings orbit up to about 1.7 times faster than the engine says. So Toomre Q
reads up to 1.7 times too low, which overstates fragmentation, and the
viscosity ν = α c_s²/Ω is overstated by the same factor.

The accepted spec's orbital rule already uses the enclosed mass M(<r), so
the engine departs from the spec, and `FIDELITY.md` does not say so.

## Proposed outcome

Rotation comes from the mass inside each radius. The star acts as a point
mass at the center for everything outside it, which the shell theorem makes
exact for a spherical star. The disk and fragment mass inside a ring is
added to it, which is the usual approximation for a flat disk. Angular
momentum is kept in a ledger, so changing the enclosed mass cannot create or
destroy it. Fragments are point masses that carry their own orbital and
spin angular momentum, and a collision merges them.

## Priorities

1. **Mass and angular momentum are conserved exactly**, apart from what is
   ejected, and a test sums them across a run.
2. **The two engines agree**, as the parity test requires.
3. **Rotation uses M(<r)**, and every simplification is labeled in
   `FIDELITY.md`.
4. **The pacing targets still hold**: a first run of about 15 to 20 minutes,
   and a pristine 9 to 25 M☉ star reliably explodes.
5. **Saved games keep loading**, migrated where their shape changes.

## Scope

- **In, now:**
  - M(<r) = star mass + disk mass inside the ring + fragment mass inside
    it, for Ω, ν, Toomre Q, fragment mass and fragment orbits.
  - Each ring's angular momentum stored, not derived from its radius.
  - Fragments as point masses with orbital and spin angular momentum. A
    collision is a perfect merger: mass and momentum are kept, and the
    leftover orbital angular momentum becomes the merged body's spin.
  - `FIDELITY.md` labels: the flat disk treated as spherical for its own
    gravity is Simplified.
- **In, later:**
  - Collision outcomes (merge, bounce or shatter) decided by impact speed
    against the bodies' escape speed. Density enters through the escape
    speed and the bodies' sizes.
  - The flat disk's own gravity solved directly instead of as enclosed mass.
- **Out:** full N-body or hydrodynamic simulation.

## Affected users and systems

- Players: star masses, fragment counts and endings will shift.
- Both engines (`src/accretion/`, `web/engine.js`) and the parity test.
- `docs/audit/report.md`, which is regenerated after the change.
- Saved games: a saved fragment has no spin, and saved rings have no stored
  angular momentum.

## Constraints

- The engine stays deterministic and step-size independent, so offline
  progress matches live play.
- Parity holds at `rel=1e-9`.

## Success criteria

- With an empty disk, every rate equals today's star-only value.
- With a disk as heavy as the star, outer-ring Ω and Q rise as M(<r)
  predicts, checked against hand-computed cases.
- Total angular momentum (rings, fragment orbits and spins, and whatever the
  star takes) is conserved to rounding across a full run.
- Parity passes, and the bot's first run still meets the pacing targets.

## Open questions

- The disk solver's grid coordinate is √r, which stands for specific angular
  momentum only while the central mass is fixed. Does the spec keep the
  fixed radial grid and move gas inward as its stored angular momentum
  requires, or move the grid to a specific-angular-momentum coordinate?
- When gas or a fragment reaches the star, does the star's spin take its
  angular momentum (with a breakup limit), or is it recorded as removed?
- Does a fragment's mass count in M(<r) for rings outside it, or only in
  its own orbit? The proposed outcome above counts it.
- Should the retune for the pacing targets ship in this change or follow it?
- How does this sit with the open 16-versus-32-ring decision and its save
  migration (`docs/NEXT.md`)?
