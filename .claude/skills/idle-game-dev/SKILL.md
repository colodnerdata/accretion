---
name: "idle-game-dev"
description: "Design, balance, review, and ship idle, incremental, clicker, and prestige games. Use for economy curves, prestige formulas, pacing walls, offline progress, retention, monetization, or launch plans."
---

# Idle Game Development

Help turn an idle game idea into a testable economy, a playable loop, and a launch plan. The math is the easy part. The hard problems are finding a distinct hook, keeping decisions interesting as automation grows, and matching pacing to the platform.

## Working rules

- Treat the user's game concept, theme, and creative choices as theirs. Analyze, model, and flag risks. Suggest creative alternatives only when asked.
- Before writing economy or simulation code, state the variables, formulas, and modeling assumptions in plain language. Python is the default for modeling, even when the game client uses another language.
- Keep design notes current when the project has them. Check new decisions against earlier ones and point out repetition or contradictions.
- Separate three kinds of claims: formulas, evidence from named games, and judgment. Treat vendor benchmarks and success stories as directional because failed games rarely publish their data.
- Look up current market figures, platform rules, and SDK behavior before relying on them.

## Choose the mode

| Request | Do this |
| --- | --- |
| New concept | Pin down the format, core loop, return rhythm, and prototype test |
| Balance problem | Get the actual formulas and values, run the simulator, then diagnose |
| Design review | Use the review checklist and rank the highest-risk problems first |
| Implementation | Settle number representation, save format, offline rules, and reset boundaries first |
| Launch or monetization | Choose the platform model, then define the metrics and gates |

## Workflow

### 1. Define the format

Ask only for missing facts that change the design.

- **Short premium:** A finite game, often 2 to 10 hours, sold on its surprise and pacing. Say the length honestly on the store page.
- **Long-haul premium or free:** Hundreds of hours of depth through layered systems, content, and optimization.
- **Live-service mobile:** Frequent updates, events, ads, and IAP. Decide early if the team can sustain that operating load.
- **Ambient collection:** Short check-ins, surprise, and shareable moments. Habit matters more than session intensity.

Write one sentence each for the fantasy, the player's reason to care, and the mechanic that makes this game different from a reskin.

### 2. Map the core loop

Draw the loop as resources, conversions, choke points, and decisions. On mobile, show the main loop on one screen where practical.

Specify the player's decisions at minutes, hours, days, and weeks. If automation removes a decision, add a harder one or end that layer. Plan what each layer reveals, because discovery is often the actual fun.

Design return clocks with exponentially longer windows, such as 20 minutes, 5 hours, and 2 days. A player who misses one clock can still feel good about another, which suits engagement that decays over time.

### 3. Model the economy

Start with these standard forms:

```text
next_cost = base_cost * growth ** owned
production = base_rate * owned * multipliers
bulk_cost = base_cost * growth ** owned * (growth ** n - 1) / (growth - 1)
max_affordable = floor(log_growth(currency * (growth - 1) / (base_cost * growth ** owned) + 1))
```

Choose prestige by the behavior it creates:

| Basis | Example | Behavior | Main risk |
| --- | --- | --- | --- |
| Max run | Realm Grinder style square root, about 4x earnings to double total prestige | Rewards beating the previous best | Repeating the same depth pays nothing |
| Lifetime earnings | AdVenture Capitalist style square root, Cookie Clicker style cube root at about 8x | Repeat resets still pay, with diminishing returns | Long runs can feel weak late |
| Current run | Egg, Inc. style exponent near 0.14, about 128x to double one run's gain | Run depth matters less; suits capped offline play | Shallow reset farming can dominate |
| Purchases or upgrades | Clicker Heroes style | Can act like a log of progress | Needs careful upgrade costs |

Use milestones, generator interactions, and shifting multipliers so older generators keep mattering. If each new generator instantly makes the last one irrelevant, the purchase choice disappears.

### 4. Run the simulator

Use the simulator below to find walls and dead systems before spending time on client tuning. Save it as `simulate_economy.py`, then run it against a JSON file:

```bash
python simulate_economy.py economy.json
```

Use this config as a starting shape, replacing every value with the game's own numbers:

```json
{
  "click_rate": 1,
  "horizon_seconds": 604800,
  "reset_wait_seconds": 1800,
  "wall_wait_seconds": 3600,
  "max_runs": 12,
  "generators": [
    {"name": "probe", "base_cost": 10, "growth": 1.07, "base_rate": 0.5, "milestones": {"25": 3, "50": 3, "100": 4}},
    {"name": "drone", "base_cost": 200, "growth": 1.09, "base_rate": 6, "milestones": {"25": 2, "75": 3}},
    {"name": "hauler", "base_cost": 4000, "growth": 1.11, "base_rate": 60, "milestones": {"50": 4}},
    {"name": "station", "base_cost": 100000, "growth": 1.13, "base_rate": 700}
  ],
  "prestige": {"basis": "lifetime", "coefficient": 1, "divisor": 1000000, "exponent": 0.5, "bonus_per_point": 0.05}
}
```

Interpret the output this way:

- **WALL:** A purchase wait exceeded `wall_wait_seconds`. Decide if this is a deliberate prestige beat or an accidental stall.
- **UNUSED or IRRELEVANT:** A generator never mattered under the greedy policy.
- **DOMINANCE:** The newest generator leads most of the time, so older choices probably collapse.
- **LADDER STALL:** Prestige barely improved the next run.
- **RESET FARM:** Repeating similar depth pays nearly the same prestige.
- **FLOAT LIMIT:** The economy needs a big-number type or a log-space simulator.
- **NO CEILING:** Costs never stopped the greedy player inside the purchase cap.

The simulator is a greedy check, not a player model. It ignores upgrades, active-play bonuses, offline caps, and real attention. Add those mechanics when they change the answer, then confirm pacing with playtests.

```python
#!/usr/bin/env python3
"""Stress-test an idle game economy with a greedy, event-driven player.

The model is a pacing check, not a forecast of real player behavior. Each
step buys the generator with the lowest wait plus payback time. A run ends
when the next purchase wait exceeds ``reset_wait_seconds`` and prestige pays.

Usage: ``python simulate_economy.py economy.json [--json]``
"""

import argparse
import json
import math
from dataclasses import dataclass, field
from itertools import pairwise
from pathlib import Path


@dataclass
class Generator:
    """Define one generator and its purchase state."""

    name: str
    base_cost: float
    growth: float
    base_rate: float
    milestones: dict[int, float] = field(default_factory=dict)
    owned: int = 0

    def cost(self) -> float:
        """Return the next purchase cost."""
        return self.base_cost * self.growth**self.owned

    def income(self, owned: int | None = None) -> float:
        """Return income before global multipliers."""
        count = self.owned if owned is None else owned
        multiplier = math.prod(
            value for threshold, value in self.milestones.items() if count >= threshold
        )
        return self.base_rate * count * multiplier


def prestige_target(basis_value: float, prestige: dict) -> float:
    """Return ``coefficient * (basis_value / divisor) ** exponent``."""
    scaled = max(basis_value, 0.0) / prestige["divisor"]
    return prestige.get("coefficient", 1.0) * scaled ** prestige["exponent"]


def prestige_gain(lifetime: float, best_run: float, run: float, owned: float, prestige: dict) -> float:
    """Return whole prestige points available at reset."""
    basis = prestige["basis"]
    if basis == "run":
        return math.floor(prestige_target(run, prestige))
    value = lifetime if basis == "lifetime" else max(best_run, run)
    return max(0.0, math.floor(prestige_target(value, prestige)) - owned)


def choose_purchase(
    generators: list[Generator], currency: float, income: float, global_multiplier: float
) -> tuple[Generator, float, float]:
    """Return the generator, wait, and cost with the best wait plus payback."""
    best = None
    for generator in generators:
        cost = generator.cost()
        gain = (generator.income(generator.owned + 1) - generator.income()) * global_multiplier
        wait = max(0.0, cost - currency) / income
        score = wait + cost / gain
        if best is None or score < best[0]:
            best = (score, generator, wait, cost)
    return best[1], best[2], best[3]


def simulate(config: dict) -> dict:
    """Simulate an economy and return run summaries and design flags."""
    generators = [
        Generator(
            item["name"],
            item["base_cost"],
            item["growth"],
            item["base_rate"],
            {int(key): value for key, value in item.get("milestones", {}).items()},
        )
        for item in config["generators"]
    ]
    prestige = config.get("prestige")
    click_rate = config.get("click_rate", 0.0)
    if click_rate <= 0.0:
        raise ValueError("click_rate must be positive so the first purchase is reachable")

    horizon = config.get("horizon_seconds", 2_592_000.0)
    reset_wait = config.get("reset_wait_seconds", 1_800.0)
    wall_wait = config.get("wall_wait_seconds", reset_wait)
    max_runs = config.get("max_runs", 20)
    max_purchases = config.get("max_purchases", 500_000)
    bonus = prestige.get("bonus_per_point", 0.0) if prestige else 0.0

    clock = currency = lifetime = run_earned = best_run = 0.0
    points = 0.0
    run_start = 0.0
    purchases = 0
    runs: list[dict] = []
    walls: list[dict] = []
    stop_reason = "horizon"
    previous_leader = None
    leader_changes = 0
    newest_leads_time = 0.0
    tracked_time = 0.0
    peak_share = {generator.name: 0.0 for generator in generators}
    purchase_counts = {generator.name: 0 for generator in generators}

    while purchases < max_purchases:
        multiplier = 1.0 + bonus * points
        outputs = [generator.income() * multiplier for generator in generators]
        income = click_rate + sum(outputs)
        try:
            generator, wait, cost = choose_purchase(generators, currency, income, multiplier)
        except OverflowError:
            stop_reason = "float_limit"
            break
        if not math.isfinite(cost) or not math.isfinite(income):
            stop_reason = "float_limit"
            break

        gain = prestige_gain(lifetime, best_run, run_earned, points, prestige) if prestige else 0.0
        if wait > reset_wait and gain >= 1.0:
            best_run = max(best_run, run_earned)
            runs.append(
                {
                    "run": len(runs) + 1,
                    "seconds": clock - run_start,
                    "purchases": sum(item.owned for item in generators),
                    "earned": run_earned,
                    "end_income": income,
                    "prestige_gain": gain,
                    "prestige_total": points + gain,
                }
            )
            points += gain
            currency = run_earned = 0.0
            run_start = clock
            for item in generators:
                item.owned = 0
            if len(runs) >= max_runs:
                stop_reason = "max_runs"
                break
            continue

        if wait > wall_wait:
            walls.append({"run": len(runs) + 1, "clock": clock, "buy": generator.name, "wait": wait})

        step = wait if clock + wait <= horizon else horizon - clock
        total_output = sum(outputs)
        if total_output > 0.0:
            shares = [output / total_output for output in outputs]
            leader = max(range(len(shares)), key=shares.__getitem__)
            newest = max(i for i, output in enumerate(outputs) if output > 0.0)
            leader_name = generators[leader].name
            leader_changes += previous_leader not in (None, leader_name)
            previous_leader = leader_name
            tracked_time += step
            newest_leads_time += step if leader == newest else 0.0
            for item, share in zip(generators, shares, strict=True):
                peak_share[item.name] = max(peak_share[item.name], share)

        earned = income * step
        clock += step
        currency += earned
        run_earned += earned
        lifetime += earned
        if step < wait:
            break

        currency = max(0.0, currency - cost)
        generator.owned += 1
        purchases += 1
        purchase_counts[generator.name] += 1
    else:
        stop_reason = "max_purchases"

    return {
        "runs": runs,
        "walls": walls,
        "peak_share": peak_share,
        "purchase_counts": purchase_counts,
        "leader_changes": leader_changes,
        "newest_leads_fraction": newest_leads_time / tracked_time if tracked_time else 0.0,
        "stop_reason": stop_reason,
        "seconds": clock,
        "flags": build_flags(runs, walls, peak_share, purchase_counts, newest_leads_time, tracked_time, stop_reason),
    }


def build_flags(
    runs: list[dict],
    walls: list[dict],
    peak_share: dict[str, float],
    purchase_counts: dict[str, int],
    newest_leads_time: float,
    tracked_time: float,
    stop_reason: str,
) -> list[str]:
    """Translate simulation results into design warnings."""
    flags = []
    if walls:
        worst = max(walls, key=lambda wall: wall["wait"])
        flags.append(f"WALL: {len(walls)} waits over threshold; worst {format_time(worst['wait'])} for {worst['buy']}")
    for name, count in purchase_counts.items():
        if count == 0:
            flags.append(f"UNUSED: {name} was never bought")
        elif peak_share[name] < 0.05:
            flags.append(f"IRRELEVANT: {name} peaked at {peak_share[name]:.1%} of generator income")
    if tracked_time and newest_leads_time / tracked_time > 0.9:
        flags.append("DOMINANCE: the newest generator leads over 90% of tracked time")
    for earlier, later in pairwise(runs):
        if later["end_income"] <= 1.05 * earlier["end_income"]:
            flags.append(f"LADDER STALL: run {later['run']} ended within 5% of run {earlier['run']} income")
        if later["earned"] <= 1.1 * earlier["earned"] and later["prestige_gain"] >= 0.9 * earlier["prestige_gain"]:
            flags.append(f"RESET FARM: run {later['run']} repeated run {earlier['run']} depth for similar prestige")
    if stop_reason == "float_limit":
        flags.append("FLOAT LIMIT: values left double range; adopt a big-number type")
    if stop_reason == "max_purchases":
        flags.append("NO CEILING: purchase cap reached before a wall or horizon")
    return flags


def format_time(seconds: float) -> str:
    """Return a compact duration."""
    for limit, unit in ((60, "s"), (3_600, "m"), (86_400, "h")):
        if seconds < limit:
            divisor = {"s": 1, "m": 60, "h": 3_600}[unit]
            return f"{seconds / divisor:.1f}{unit}"
    return f"{seconds / 86_400:.1f}d"


def print_report(result: dict) -> None:
    """Print a readable simulation report."""
    print("run  duration  purchases  earned      end_income  prestige_gain")
    for run in result["runs"]:
        print(
            f"{run['run']:>3}  {format_time(run['seconds']):>8}  {run['purchases']:>9}  "
            f"{run['earned']:<10.3g}  {run['end_income']:<10.3g}  {run['prestige_gain']:g}"
        )
    print(f"\nstopped: {result['stop_reason']} at {format_time(result['seconds'])}")
    print(f"leader changes: {result['leader_changes']}")
    print(f"newest generator leads: {result['newest_leads_fraction']:.1%} of tracked time")
    print("\ngenerator  purchases  peak_share")
    for name, share in result["peak_share"].items():
        print(f"{name:<9}  {result['purchase_counts'][name]:>9}  {share:.1%}")
    print("\nflags:")
    print("\n".join(f"- {flag}" for flag in result["flags"]) or "- none")


def main() -> None:
    """Run the command-line interface."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", type=Path)
    parser.add_argument("--json", action="store_true", help="print full JSON results")
    args = parser.parse_args()
    result = simulate(json.loads(args.config.read_text()))
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print_report(result)


if __name__ == "__main__":
    main()
```

### 5. Prototype before polish

Build the smallest playable version that tests the hook and first-session loop. Leave out long-term meta, social features, localization, ads, and final art unless one of them is the hook.

Kolibri's Idle Miner prototype reached 63% to 81% D1 retention without IAP, 3D art, or cloud saves. Their later process used internal testing through about week 8, then roughly 4 weeks of external testing before scaling. Their earlier project was scrapped at about 60% complete, which is the lesson: test early enough that stopping is cheap.

Run small playtests before early access. When players ask for a change, ask why, because the underlying problem is usually more useful than the requested fix.

### 6. Build the systems safely

Settle these before content production:

- **Big numbers:** Choose a mantissa-exponent or similar type early and use it through saves, UI, and analytics.
- **Time:** Treat the device clock as untrusted. Cap offline earnings, use trusted time where available, and make checks tolerant of sleep, time zones, and clock drift.
- **Offline progress:** Compute it from a single tested function and clamp negative or extreme deltas.
- **Prestige reset:** Define exactly what persists. Test partial saves, reset failure, app kills, and repeated taps.
- **Saves:** Version them, migrate them, keep a backup, and validate before overwriting.
- **Abstraction:** Keep early code plain until the design proves what needs generalizing.
- **Operations:** Avoid global economies and player trading unless the team can absorb cheating and support costs. One solo developer lost almost half their time to this.
- **Platforms:** Launch on as few platforms as the plan allows until the game is stable.

### 7. Monetize the wait

Use pay-or-wait as the base model, tied to visible choke points. Keep rewarded ads optional and useful. Delay pressure until the player understands the loop. Do not sell solutions to walls the economy created by mistake.

- **Mobile:** Consider ad boosts, offline multipliers, skips, season passes, and events. Measure effects on retention, not just immediate revenue.
- **Premium:** Use a clear price and an honest scope. Weird or short games benefit from a low opportunity cost.

### 8. Launch and operate

- **Steam:** Build a demo early, because some small hits were slow until a demo landed. Use Next Fest and an early launch date when appropriate. Design for streamers and YouTubers, since visible escalation and strange combinations travel well. Treat the current flood of idlers as a quality bar: clear art direction, strong game feel, and a novel layer now matter more.
- **Mobile:** Use a soft launch, cohort analysis, and staged updates. Do not scale user acquisition on a broken retention curve.

Read retention as a diagnostic:

- Low D1 points to the first session or mismatched acquisition.
- Low D7 points to the habit loop.
- Low D30 points to content depth or live operations.

As of a July 2026 cross-genre vendor synthesis, 35/15/5 is a good D1/D7/D30 profile and 40/20/10 is top-quartile. Prefer idle-specific and same-revenue-model data when available.

## Review checklist

- Can a new player explain the goal and next useful action within minutes?
- Does the first session deliver the core fantasy and a meaningful purchase?
- What new decision appears at each major stage?
- Do older systems stay relevant or end deliberately?
- Are walls intentional, signposted, and followed by a meaningful unlock?
- Does prestige change the next run, not just inflate it?
- Does the chosen prestige basis resist shallow farming?
- Does the return rhythm suit the target player's real life?
- Does the design respect time, or rely on obligation and punishment?
- Are offline rules, big numbers, and save migration tested?
- Can the team sustain the promised content and support?
- What makes this game worth watching or sharing?

## Common dead ends

- Bigger numbers replacing new decisions
- A reskin with no distinct fantasy or mechanic
- Building meta systems before the first session works
- Feature creep that dilutes the core loop
- Long grind added to hide missing content
- Prestige that barely changes the next run
- Run-based rewards that make early resets optimal
- Trusting the device clock
- Rewriting engines or adding global systems without a proven need
- Assuming launch-month sales or engagement will continue
- Adding complexity for existing fans while new players cannot start

## Reporting

For a balance or design review, lead with the verdict, then give the top risks, evidence, and the smallest test that would confirm each fix. Show formulas and assumptions when numbers change. Keep creative options separate from analysis, and include them only if the user asked for them.