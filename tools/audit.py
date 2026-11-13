"""Audit the engine: the true relationship between each input and each outcome.

A test is a sweep. A context (a kind of region and a player's progress) is
held fixed, one input moves across a grid, each run is played to its end by
the simulated player in ``bot.py``, and the outcomes are read from the run
record (the journal entry). Each input-outcome series is sorted into a bin:
no change, up, down, peaked, dipped, threshold or irregular. A pair whose bin
differs between contexts is context-dependent.

Two purchase policies are compared. In ``held`` the in-run upgrades other
than reach and tap stay at level 0 unless they are the swept input, so only
that input differs between runs. In ``greedy`` the player buys turbulence and
braking whenever energy allows (never gather cooling, as in ``bot.py``), so
the timing of purchases moves with the input too.

The report is for checking relationship text and writing explanations. It
never grades a player's untested prediction.

Run it with ``uv run python tools/audit.py --out docs/audit/report.md``.
"""

import argparse
import datetime
import hashlib
import math
import sys
from pathlib import Path

import bot

from accretion import game, physics

ROOT = Path(__file__).parents[1]
ENGINE_FILES = ("physics.py", "disk.py", "game.py")
STEP_TOLERANCE = 1.0e-6
THRESHOLD_SHARE = 0.8
ALL_UNLOCKS = (
    "reach",
    "tap",
    "temperature",
    "density",
    "cooling",
    "turbulence",
    "braking",
    "metals",
)
HELD_CAPS = {"cooling": 0, "turbulence": 0, "braking": 0}
GREEDY_CAPS = {"cooling": 0}
MODES = {"held": HELD_CAPS, "greedy": GREEDY_CAPS}

# Each context is the Meta a sweep starts from. "first run" is a new player:
# turbulence unlocks only at ignition and cooling and braking not at all.
# The others have every control unlocked.
CONTEXTS = {
    "first run": {},
    "hot pristine": {"z_temperature": 1.5, "unlocks": ALL_UNLOCKS},
    "cold pristine": {"z_temperature": -1.5, "unlocks": ALL_UNLOCKS},
    "enriched": {
        "cosmic_myr": 2000.0,
        "local_metals": 20.0,
        "runs": 6,
        "supernovae": 3,
        "unlocks": ALL_UNLOCKS,
    },
}

# name: (kind, field, values, record key for the x value, x label)
# kind "meta" sets a Meta field; kind "cap" caps an in-run upgrade.
INPUTS = {
    "temperature setting": (
        "meta",
        "z_temperature",
        (-2.0, -1.0, 0.0, 1.0, 2.0),
        "start_temperature",
        "K",
    ),
    "density setting": (
        "meta",
        "z_density",
        (-2.0, -1.0, 0.0, 1.0, 2.0),
        "density",
        "cm⁻³",
    ),
    "metal setting": (
        "meta",
        "z_metal",
        (-2.0, -1.0, 0.0, 1.0, 2.0),
        "metal_log10",
        "log Z/Z☉",
    ),
    "black hole start": (
        "meta",
        "black_hole_start",
        (False, True),
        "black_hole_start",
        "",
    ),
    "cooling level": ("cap", "cooling", (0, 1, 2, 3, 4), "cooling", "level"),
    "turbulence level": (
        "cap",
        "turbulence",
        (0, 1, 2, 3, 4, 5, 6),
        "turbulence",
        "level",
    ),
    "braking level": ("cap", "braking", (0, 1, 2, 3, 4), "braking", "level"),
    "permanent cooling": (
        "meta",
        "heavy_cooling",
        (0, 1, 2, 3, 4),
        "heavy_cooling",
        "level",
    ),
    "permanent turbulence": (
        "meta",
        "heavy_turbulence",
        (0, 1, 2, 3, 4),
        "heavy_turbulence",
        "level",
    ),
    "universal clock": (
        "meta",
        "cosmic_myr",
        (0.0, 100.0, 300.0, 1000.0, 3000.0, 8000.0),
        "cosmic_age_gyr",
        "Gyr",
    ),
}
QUICK_INPUTS = ("density setting", "turbulence level")
LEVEL_KEYS = ("cooling", "turbulence", "braking", "heavy_cooling", "heavy_turbulence")

# Direct outcomes are fixed when the region collapses; net outcomes when
# growth ends or the star dies.
OUTCOMES = {
    "collapse_mass": "collapse mass (M☉)",
    "infall_rate": "infall rate (M☉/yr)",
    "mass": "final mass (M☉)",
    "ejected": "ejected (M☉)",
    "companion_mass": "companions (M☉)",
    "accrete_years": "growth time (yr)",
    "seconds": "run time (s)",
    "lifetime_myr": "star life (Myr)",
    "gain": "region gain",
    "heavy": "heavy elements (M☉)",
}
DIRECT = ("collapse_mass", "infall_rate")
# These pay by ending category, so they jump where the ending changes.
PAID_BY_ENDING = ("gain", "heavy")


def make_meta(context: dict, **changes) -> game.Meta:
    """Return a fresh Meta for a context, with fields overridden."""
    fields = {**context, **changes}
    fields["unlocks"] = list(fields.get("unlocks", ()))
    return game.Meta(**fields)


def play(context: dict, caps: dict, **changes) -> dict:
    """Play one run and return its run record."""
    meta = make_meta(context, **changes)
    run, meta, _ = bot.play(0.5, True, meta=meta, caps=caps, fast_shine=True)
    if run.phase != "ended":
        raise RuntimeError(f"run did not end: {context} {changes} {caps}")
    return meta.journal[-1]


def x_value(record: dict, key: str):
    """Return the effective input value a record holds for an input key."""
    return record["levels"][key] if key in LEVEL_KEYS else record[key]


def sweep(context: dict, name: str, mode: str) -> dict:
    """Move one input across its grid and return the series.

    Returns the effective x values, the records, and the shortfalls: grid
    values the player could not reach (a capped level that energy or an
    unlock did not allow). A run that fell short is dropped from the series,
    since it repeats an x value already there.
    """
    kind, field, values, key, _ = INPUTS[name]
    xs, records, shortfalls = [], [], []
    for value in values:
        if kind == "cap":
            record = play(context, {**MODES[mode], field: value})
        else:
            record = play(context, MODES[mode], **{field: value})
        x = x_value(record, key)
        if kind == "cap" and x != value:
            shortfalls.append((value, x))
            continue
        if xs and x == xs[-1]:
            # A setting clamped by a bound (the temperature floor, say).
            shortfalls.append((value, x))
            continue
        xs.append(x)
        records.append(record)
    return {"xs": xs, "records": records, "shortfalls": shortfalls}


def classify(ys: list) -> str:
    """Sort a numeric series, ordered by its input, into a bin.

    Steps smaller than ``STEP_TOLERANCE`` of the largest magnitude are
    ignored. With every remaining step of one sign the series is up or down,
    or a threshold when one step carries at least ``THRESHOLD_SHARE`` of the
    total change (four or more points). One change of sign is peaked or
    dipped. More than one is irregular. A series of fewer than two points
    (the player could not move the input) is untested.
    """
    if len(ys) < 2:
        return "untested"
    scale = max(abs(y) for y in ys)
    steps = [b - a for a, b in zip(ys, ys[1:], strict=False)]
    steps = [d for d in steps if abs(d) > STEP_TOLERANCE * scale]
    if not steps:
        return "no change"
    signs = [1 if d > 0 else -1 for d in steps]
    flips = sum(a != b for a, b in zip(signs, signs[1:], strict=False))
    if flips == 0:
        direction = "up" if signs[0] > 0 else "down"
        total = sum(abs(d) for d in steps)
        if len(ys) >= 4 and max(abs(d) for d in steps) >= THRESHOLD_SHARE * total:
            return f"threshold ({direction})"
        return direction
    if flips == 1:
        return "peaked" if signs[0] > 0 else "dipped"
    return "irregular"


def elasticity(xs: list, ys: list) -> float | None:
    """Return d ln y / d ln x by central difference at the middle point.

    Needs three or more points with positive x and y around the middle.
    """
    if len(xs) < 3:
        return None
    i = len(xs) // 2
    lo, hi = i - 1, i + 1
    if min(xs[lo], xs[hi], ys[lo], ys[hi]) <= 0:
        return None
    return math.log(ys[hi] / ys[lo]) / math.log(xs[hi] / xs[lo])


def ending_changes(xs: list, records: list) -> list:
    """Return ``(x_before, x_after, ending_before, ending_after)`` per change."""
    endings = [r["ending"] for r in records]
    pairs = zip(range(len(xs)), range(1, len(xs)), strict=False)
    return [
        (xs[a], xs[b], endings[a], endings[b])
        for a, b in pairs
        if endings[a] != endings[b]
    ]


def audit(names=None) -> dict:
    """Run every sweep and return ``results[mode][name][context]``."""
    names = names or tuple(INPUTS)
    results = {}
    for mode in MODES:
        results[mode] = {}
        for name in names:
            results[mode][name] = {}
            for label, context in CONTEXTS.items():
                series = sweep(context, name, mode)
                series["bins"] = {
                    key: classify([r[key] for r in series["records"]])
                    for key in OUTCOMES
                }
                results[mode][name][label] = series
    return results


def engine_fingerprint() -> str:
    """Return a short hash of the Python engine sources."""
    digest = hashlib.sha256()
    for name in ENGINE_FILES:
        digest.update((ROOT / "src" / "accretion" / name).read_bytes())
    return digest.hexdigest()[:12]


def fmt(value) -> str:
    """Format a value for a report cell."""
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, int):
        return str(value)
    if value == 0:
        return "0"
    if 1.0e-3 <= abs(value) < 1.0e5:
        return f"{value:.4g}"
    return f"{value:.3e}"


def table(header: list, rows: list) -> list:
    """Return the lines of a Markdown table."""
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join("---" for _ in header) + " |",
    ]
    lines += ["| " + " | ".join(str(c) for c in row) + " |" for row in rows]
    return lines


def agreed(bins_by_context: dict) -> str:
    """Return the shared bin, or ``depends`` when contexts disagree.

    Contexts where the input could not be moved are left out.
    """
    found = set(bins_by_context.values()) - {"untested"}
    if not found:
        return "untested"
    return found.pop() if len(found) == 1 else "depends"


def clock_rows() -> list:
    """Return composition and temperature bounds along the universal clock."""
    rows = []
    for myr in (0, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 13000):
        meta = game.Meta(cosmic_myr=float(myr))
        run = game.new_run(meta)
        age = game.cosmic_age_gyr(meta)
        composition = physics.cooling_temperature(run.metal_log10)
        background = physics.cmb_temperature(age)
        record = play({"cosmic_myr": float(myr)}, HELD_CAPS)
        rows.append(
            [
                myr,
                fmt(age),
                fmt(run.metal_log10),
                "yes" if run.metal_log10 < physics.PRIMORDIAL_METAL_LOG10 else "no",
                fmt(composition),
                fmt(background),
                "cosmic background" if background > composition else "composition",
                fmt(run.base_temperature),
                fmt(record["mass"]),
                record["ending"],
            ]
        )
    return rows


def enrichment_rows() -> list:
    """Return composition against the player's own released metals."""
    rows = []
    for metals in (0.0, 0.01, 0.1, 1.0, 10.0, 100.0):
        meta = game.Meta(local_metals=metals)
        run = game.new_run(meta)
        rows.append(
            [
                fmt(metals),
                fmt(run.metal_log10),
                "yes" if run.metal_log10 < physics.PRIMORDIAL_METAL_LOG10 else "no",
                fmt(run.floor_temperature),
                fmt(run.base_temperature),
            ]
        )
    return rows


def report(results: dict, quick: bool = False) -> str:
    """Return the Markdown report for a set of audit results."""
    names = list(results["held"])
    runs = sum(
        len(INPUTS[name][2])
        for mode in results
        for name in results[mode]
        for _ in CONTEXTS
    )
    out = [
        "# Engine audit",
        "",
        f"> Generated by `tools/audit.py` on {datetime.date.today().isoformat()} from "
        "engine "
        f"fingerprint `{engine_fingerprint()}` ({runs} runs"
        f"{', quick subset' if quick else ''}). Do not edit by hand: rerun the tool. "
        "`tools/audit.py --check` says whether the engine has changed since.",
        "",
        "Each cell is the bin of one outcome against one input, moved alone across "
        "its grid. Bins: no change, up, down, peaked, dipped, threshold (at least "
        f"{THRESHOLD_SHARE:.0%} of the change in one step), irregular (more than one "
        "change of direction). `depends` means the bin differs between contexts; the "
        "details follow each table. `untested` means the simulated player could not "
        "move that input. The simulated player taps 0.5 times a second and "
        "buys reach and tap whenever energy allows.",
        "",
        "Contexts: " + "; ".join(f"**{label}**" for label in CONTEXTS) + ". "
        "A first run has only the controls a new player has, so cooling and braking "
        "cannot be bought there and turbulence unlocks at ignition.",
        "",
        "These bins are for checking text and writing explanations. They never grade "
        "a player's untested prediction.",
    ]
    for mode, blurb in (
        (
            "held",
            "other in-run upgrades stay at level 0, so only the swept input differs",
        ),
        (
            "greedy",
            "turbulence and braking are bought whenever energy allows, never cooling",
        ),
    ):
        out += ["", f"## Bins, {mode} purchases", "", f"Policy: {blurb}.", ""]
        rows = []
        for name in names:
            cells = [
                agreed({c: s["bins"][key] for c, s in results[mode][name].items()})
                for key in OUTCOMES
            ]
            rows.append([name, *cells])
        out += table(["input", *OUTCOMES.values()], rows)
        depends = []
        for name in names:
            for key, label in OUTCOMES.items():
                bins = {c: s["bins"][key] for c, s in results[mode][name].items()}
                if agreed(bins) == "depends":
                    parts = ", ".join(f"{c}: {b}" for c, b in bins.items())
                    depends.append(f"- **{name} → {label}**: {parts}")
        if depends:
            out += ["", "Context-dependent pairs:", "", *depends]

    out += ["", "## Where purchase timing changes the bin", ""]
    differs = []
    for name in names:
        for key, label in OUTCOMES.items():
            for context in CONTEXTS:
                held = results["held"][name][context]["bins"][key]
                greedy = results["greedy"][name][context]["bins"][key]
                if held != greedy:
                    differs.append([name, label, context, held, greedy])
    if differs:
        out += table(["input", "outcome", "context", "held", "greedy"], differs)
    else:
        out += ["None: every bin is the same under both policies."]

    out += [
        "",
        "## Endings",
        "",
        "Where the ending changes along a sweep (held purchases).",
        "",
    ]
    rows = []
    for name in names:
        unit = INPUTS[name][4]
        for context, series in results["held"][name].items():
            for before, after, was, now in ending_changes(
                series["xs"], series["records"]
            ):
                rows.append(
                    [
                        name,
                        context,
                        f"{fmt(before)} → {fmt(after)} {unit}",
                        f"{was} → {now}",
                    ]
                )
    out += (
        table(["input", "context", "between", "ending"], rows)
        if rows
        else ["No changes."]
    )

    out += [
        "",
        "## Elasticities",
        "",
        "d ln(outcome) / d ln(input) at the middle of the sweep, held purchases, for "
        "the "
        "inputs measured on a positive scale.",
        "",
    ]
    rows = []
    for name in names:
        if INPUTS[name][3] not in ("start_temperature", "density"):
            continue
        for context, series in results["held"][name].items():
            cells = []
            middle = len(series["xs"]) // 2
            around = {r["ending"] for r in series["records"][middle - 1 : middle + 2]}
            for key in OUTCOMES:
                # A slope taken across a change of ending measures the jump.
                if len(around) > 1 and key in PAID_BY_ENDING:
                    cells.append("ending changes")
                    continue
                value = elasticity(series["xs"], [r[key] for r in series["records"]])
                cells.append("—" if value is None else f"{value:+.2f}")
            rows.append([name, context, *cells])
    out += (
        table(["input", "context", *OUTCOMES.values()], rows)
        if rows
        else ["Not in this run."]
    )

    out += ["", "## Values the player could not reach", ""]
    rows = []
    for mode in results:
        for name in names:
            for context, series in results[mode][name].items():
                for wanted, got in series["shortfalls"]:
                    rows.append([name, context, mode, fmt(wanted), fmt(got)])
    if rows:
        out += [
            "A capped level that energy or an unlock did not allow, or a setting a "
            "bound "
            "clamped. These runs are left out of the series above.",
            "",
            *table(
                ["input", "context", "policy", "asked for", "effective value"], rows
            ),
        ]
    else:
        out += ["None."]

    if not quick:
        out += [
            "",
            "## Clock drift",
            "",
            "Composition and the temperature bounds along the universal clock, for a "
            "player who has released no metals, with final mass and ending under held "
            "purchases. The candidate epoch boundaries are where `primordial` turns to "
            "no, where the composition bound starts to fall, and where the cosmic "
            "background stops setting the floor.",
            "",
            *table(
                [
                    "clock (Myr)",
                    "age (Gyr)",
                    "log Z/Z☉",
                    "primordial",
                    "composition bound (K)",
                    "cosmic background (K)",
                    "floor set by",
                    "start temperature (K)",
                    "final mass (M☉)",
                    "ending",
                ],
                clock_rows(),
            ),
            "",
            "Composition against the player's own released metals, at the starting "
            "clock:",
            "",
            *table(
                [
                    "released metals (M☉)",
                    "log Z/Z☉",
                    "primordial",
                    "floor (K)",
                    "start temperature (K)",
                ],
                enrichment_rows(),
            ),
        ]

    out += ["", "## Series", "", "Every sweep, held purchases first.", ""]
    for mode in results:
        for name in names:
            unit = INPUTS[name][4]
            for context, series in results[mode][name].items():
                out += [f"### {name}, {context}, {mode}", ""]
                rows = [
                    [fmt(x), *(fmt(r[key]) for key in OUTCOMES), r["ending"]]
                    for x, r in zip(series["xs"], series["records"], strict=True)
                ]
                header = [
                    f"{name} ({unit})" if unit else name,
                    *OUTCOMES.values(),
                    "ending",
                ]
                out += [*table(header, rows), ""]
    return "\n".join(out).rstrip() + "\n"


def main() -> int:
    """Write the report, or check a written report against the engine."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--out", type=Path, help="write the report here (default: stdout)"
    )
    parser.add_argument("--quick", action="store_true", help="two inputs only")
    parser.add_argument(
        "--check",
        type=Path,
        nargs="?",
        const=ROOT / "docs" / "audit" / "report.md",
        help="exit 1 if this report was generated from a different engine",
    )
    args = parser.parse_args()
    if args.check:
        fresh = f"`{engine_fingerprint()}`" in args.check.read_text(encoding="utf-8")
        print(
            "audit report is current"
            if fresh
            else "audit report is stale: rerun tools/audit.py"
        )
        return 0 if fresh else 1
    text = report(audit(QUICK_INPUTS if args.quick else None), quick=args.quick)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
