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
braking whenever energy allows (gather cooling only when it is the swept
input, as in ``bot.py``), so the timing of purchases moves with the input too.

Region settings and permanent levels are set directly in every context,
whether or not that player could have reached them. Only the in-run caps
respect unlocks and energy.

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
        "temperature",
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


RUNS_PLAYED = [0]


def play(context: dict, caps: dict, **changes) -> dict:
    """Play one run and return its run record."""
    RUNS_PLAYED[0] += 1
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
            # A setting a bound clamped to the value already in the series
            # (two temperature settings that both rest on the floor, say).
            shortfalls.append((value, x))
            continue
        xs.append(x)
        records.append(record)
    return {"xs": xs, "records": records, "shortfalls": shortfalls}


def classify(ys: list) -> str:
    """Sort a numeric series, ordered by its input, into a bin.

    Steps smaller than ``STEP_TOLERANCE`` of the largest magnitude are
    ignored. With every remaining step of one sign the series is up or down,
    or a threshold when it is flat at one end: the outcome does not respond
    until, or stops responding after, some value of the input. That rule
    does not depend on how the grid is spaced. One change of sign is peaked
    or dipped. More than one is irregular. A series of fewer than two points
    (the player could not move the input) is untested.
    """
    if len(ys) < 2:
        return "untested"
    scale = max(abs(y) for y in ys)
    raw = [b - a for a, b in zip(ys, ys[1:], strict=False)]
    moved = [abs(d) > STEP_TOLERANCE * scale for d in raw]
    steps = [d for d, real in zip(raw, moved, strict=True) if real]
    if not steps:
        return "no change"
    signs = [1 if d > 0 else -1 for d in steps]
    flips = sum(a != b for a, b in zip(signs, signs[1:], strict=False))
    if flips == 0:
        direction = "up" if signs[0] > 0 else "down"
        flat_end = not moved[0] or not moved[-1]
        return f"threshold ({direction})" if flat_end else direction
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
                if INPUTS[name][1] in context:
                    # The sweep would overwrite the one thing that makes
                    # this context different, and repeat another context.
                    continue
                series = sweep(context, name, mode)
                series["bins"] = {
                    key: classify([r[key] for r in series["records"]])
                    for key in OUTCOMES
                }
                results[mode][name][label] = series
    return results


def engine_fingerprint() -> str:
    """Return a short hash of the engine sources, the player and this tool."""
    digest = hashlib.sha256()
    for name in ENGINE_FILES:
        digest.update((ROOT / "src" / "accretion" / name).read_bytes())
    for name in ("bot.py", "audit.py"):
        digest.update((ROOT / "tools" / name).read_bytes())
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


def cell(bins_by_context: dict) -> str:
    """Return a summary cell: the bin, and how many contexts it rests on."""
    tested = sum(b != "untested" for b in bins_by_context.values())
    label = agreed(bins_by_context)
    if tested in (0, len(CONTEXTS)):
        return label
    return f"{label} ({tested}/{len(CONTEXTS)})"


def start_source(run: game.Run) -> str:
    """Return which rule in ``game.new_run`` set a region's start temperature."""
    if run.metal_log10 < physics.PRIMORDIAL_METAL_LOG10:
        above = game.BASE_TEMPERATURE >= run.floor_temperature
        return "pristine base" if above else "floor"
    above = game.ENRICHED_ENVIRONMENT >= run.floor_temperature
    return "environment × margin" if above else "floor × margin"


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
                start_source(run),
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
    # Played before the header is written, so its run count includes them.
    drift = None if quick else (clock_rows(), enrichment_rows())
    out = [
        "# Engine audit",
        "",
        f"> Generated by `tools/audit.py` on {datetime.date.today().isoformat()} from "
        "engine "
        f"fingerprint `{engine_fingerprint()}` ({RUNS_PLAYED[0]} runs"
        f"{', quick subset' if quick else ''}). Do not edit by hand: rerun the tool. "
        "`tools/audit.py --check` says whether the engine, the simulated player or "
        "this tool has changed since.",
        "",
        "Each cell is the bin of one outcome against one input, moved alone across "
        "its grid. Bins: no change, up, down, peaked, dipped, threshold (one "
        "direction, but flat at one end of the grid), irregular (more than one "
        "change of direction). `depends` means the bin differs between contexts; the "
        "details follow each table. `untested` means the simulated player could not "
        "buy that level. A count such as `(2/4)` says how many of the four contexts "
        "the bin rests on. The simulated player taps 0.5 times a second and buys "
        "reach and tap whenever energy allows.",
        "",
        "Contexts: " + "; ".join(f"**{label}**" for label in CONTEXTS) + ". "
        "Region settings and permanent levels are set directly in every context, "
        "whether or not that player could have reached them. Only in-run purchases "
        "respect unlocks and energy: on a first run cooling and braking cannot be "
        "bought and turbulence unlocks at ignition. A context is left out of a sweep "
        "that would overwrite the setting that defines it.",
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
            "turbulence and braking are bought whenever energy allows; cooling only "
            "when "
            "it is the swept input",
        ),
    ):
        out += ["", f"## Bins, {mode} purchases", "", f"Policy: {blurb}.", ""]
        rows = []
        for name in names:
            cells = [
                cell({c: s["bins"][key] for c, s in results[mode][name].items()})
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
            for context in results["held"][name]:
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
        if INPUTS[name][3] not in ("temperature", "density"):
            continue
        for context, series in results["held"][name].items():
            cells = []
            middle = len(series["xs"]) // 2
            around = {r["ending"] for r in series["records"][middle - 1 : middle + 2]}
            for key in OUTCOMES:
                # A slope taken across a change of ending measures the jump.
                jumps = len(series["xs"]) >= 3 and len(around) > 1
                if jumps and key in PAID_BY_ENDING:
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
            "purchases. Candidate epoch boundaries are wherever a column changes "
            "regime: `primordial` turning to no, the composition bound starting or "
            "ceasing to fall, a change in what sets the floor, and a change in what "
            "sets the start temperature.",
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
                    "start set by",
                    "final mass (M☉)",
                    "ending",
                ],
                drift[0],
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
                drift[1],
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
