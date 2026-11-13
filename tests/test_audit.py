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
        ([1.0, 1.1, 9.0, 9.1, 9.2], "threshold (up)"),
        ([9.0, 8.9, 1.0, 0.9, 0.8], "threshold (down)"),
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


def test_report_names_the_engine_it_was_generated_from():
    results = audit.audit(("black hole start",))
    text = audit.report(results, quick=True)
    assert f"`{audit.engine_fingerprint()}`" in text
    assert "| black hole start |" in text
