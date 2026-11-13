import audit
import pytest


@pytest.mark.parametrize(
    ("series", "bin_name"),
    [
        ([5.0], "untested"),
        ([2.0, 2.0, 2.0, 2.0, 2.0], "no change"),
        ([2.0, 2.0 + 1e-9, 2.0, 2.0 - 1e-9, 2.0], "no change"),
        ([1.0, 2.0, 3.0, 4.0, 5.0], "up"),
        ([5.0, 4.0, 4.0, 2.0, 1.0], "down"),
        ([1.0, 3.0, 5.0, 4.0, 2.0], "peaked"),
        ([5.0, 3.0, 1.0, 2.0, 4.0], "dipped"),
        ([1.0, 1.0, 1.0, 2.0, 3.0], "threshold (up)"),
        ([9.0, 5.0, 1.0, 1.0, 1.0], "threshold (down)"),
        ([26.0, 26.0, 26.0, 7.0, 1.5, 1.5], "threshold (down)"),
        # A steep power law on a coarse grid is still a plain trend.
        ([4.4817 ** (1.2 * i) for i in range(5)], "up"),
        ([1.0, 1.1, 9.0, 9.1, 9.2], "up"),
        ([1.0, 3.0, 2.0, 4.0, 3.0], "irregular"),
        ([1.0, 2.0], "up"),
    ],
)
def test_classify_sorts_a_series_into_its_bin(series, bin_name):
    assert audit.classify(series) == bin_name


def test_elasticity_recovers_a_power_law_exponent():
    xs = [1.0, 2.0, 4.0, 8.0, 16.0]
    assert audit.elasticity(xs, [x**1.5 for x in xs]) == pytest.approx(1.5)
    assert audit.elasticity(xs[:2], [1.0, 2.0]) is None
    assert audit.elasticity(xs, [0.0] * 5) is None


def test_agreed_ignores_contexts_where_the_input_could_not_move():
    assert audit.agreed({"a": "down", "b": "untested"}) == "down"
    assert audit.agreed({"a": "down", "b": "up"}) == "depends"
    assert audit.agreed({"a": "untested"}) == "untested"


def test_turbulence_sweep_on_a_first_run_matches_the_documented_masses():
    # docs/planning/prediction-system.md, "Prerequisites before v1".
    series = audit.sweep(audit.CONTEXTS["first run"], "turbulence level", "held")
    assert series["xs"] == [0, 1, 2, 3, 4]
    masses = [record["mass"] for record in series["records"]]
    assert masses == pytest.approx([26.16, 25.08, 21.36, 21.14, 21.54], abs=0.005)
    assert audit.classify(masses) == "dipped"
    # A first run cannot afford more than four levels.
    assert series["shortfalls"] == [(5, 4), (6, 4)]
    assert audit.ending_changes(series["xs"], series["records"]) == [
        (1, 2, "black_hole", "supernova")
    ]


def test_density_sweep_changes_collapse_mass_but_not_final_mass():
    series = audit.sweep(audit.CONTEXTS["first run"], "density setting", "held")
    records = series["records"]
    assert audit.classify([r["collapse_mass"] for r in records]) == "down"
    assert audit.classify([r["mass"] for r in records]) == "no change"
    slope = audit.elasticity(series["xs"], [r["collapse_mass"] for r in records])
    assert slope == pytest.approx(-0.5, abs=1e-6)


def test_cell_says_how_many_contexts_a_bin_rests_on():
    full = dict.fromkeys(audit.CONTEXTS, "down")
    assert audit.cell(full) == "down"
    assert audit.cell({**full, "first run": "untested"}) == "down (3/4)"
    assert audit.cell({"first run": "up", "enriched": "up"}) == "up (2/4)"


def test_a_context_is_left_out_of_a_sweep_that_would_overwrite_it(monkeypatch):
    record = {**dict.fromkeys(audit.OUTCOMES, 1.0), "ending": "supernova"}
    record.update(temperature=250.0, levels={})
    monkeypatch.setattr(audit, "play", lambda *a, **k: dict(record))
    results = audit.audit(("temperature setting",))
    assert set(results["held"]["temperature setting"]) == {"first run", "enriched"}


def test_report_names_what_it_was_generated_from():
    record = {**dict.fromkeys(audit.OUTCOMES, 1.0), "ending": "supernova"}
    series = {
        "xs": [False, True],
        "records": [record, {**record, "mass": 2.0, "ending": "black_hole"}],
        "shortfalls": [],
    }
    series["bins"] = {
        key: audit.classify([r[key] for r in series["records"]])
        for key in audit.OUTCOMES
    }
    results = {
        mode: {"black hole start": {"first run": series}} for mode in audit.MODES
    }
    text = audit.report(results, quick=True)
    assert f"`{audit.engine_fingerprint()}`" in text
    assert "| black hole start |" in text
    assert "up (1/4)" in text
    assert "supernova → black_hole" in text
