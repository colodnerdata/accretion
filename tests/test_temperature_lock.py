"""The survey's Temperature slider: a kelvin track with a padlock at the floor.

Browser checks on the built page. The track runs from absolute zero; the
padlock marks the coldest gas the region allows; the thumb cannot pass it;
metals move it toward absolute zero; a saved setting below it is raised.
"""

from pathlib import Path

import build
import pytest

PAGE = Path(__file__).parents[1] / "web" / "accretion.html"

SURVEY = """
(meta) => {
  const s = window.accretion;
  Object.assign(s.meta, { regions: 200, runs: 6, supernovae: 3 }, meta);
  s.meta.unlocks = ["reach", "tap", "temperature", "density", "cooling",
    "turbulence", "braking", "metals"];
  s.view = "search";
  update();
  refreshSearch();
}
"""
READ = """
() => {
  const m = window.accretion.meta, run = Engine.newRun(m);
  const style = (id) => getComputedStyle(document.getElementById(id));
  const px = (id) => style(id).getPropertyValue("--p");
  return {
    z: m.zTemperature,
    readout: document.getElementById("temperature-out").textContent,
    floor: run.floorTemperature,
    temperature: Engine.temperature(run, m),
    lock: Number(px("temperature-padlock")),
    thumb: Number(document.getElementById("temperature").value) / 1000,
    note: document.getElementById("temperature-lock-note").textContent,
    aria: document.getElementById("temperature").getAttribute("aria-valuetext"),
    cost: Engine.regionCost(m),
  };
}
"""
DRAG = """
(position) => {
  const input = document.getElementById("temperature");
  input.value = position;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
"""


@pytest.fixture
def page(browser):
    """A fresh page on the built game."""
    assert build.build_page() == PAGE.read_text(encoding="utf-8"), (
        "web/accretion.html is stale; run python tools/build.py"
    )
    context = browser.new_context(viewport={"width": 390, "height": 844})
    tab = context.new_page()
    errors = []
    tab.on("pageerror", lambda error: errors.append(str(error)))
    tab.add_init_script("try { localStorage.clear() } catch (err) {}")
    tab.goto(PAGE.as_uri())
    tab.wait_for_selector("#track span.now")
    yield tab
    assert not errors, errors
    context.close()


def test_the_padlock_sits_at_the_floor_and_the_thumb_cannot_pass_it(page):
    page.evaluate(SURVEY, {})
    start = page.evaluate(READ)
    assert start["floor"] == pytest.approx(200.0)
    assert start["z"] == 0 and start["readout"] == "250 K"
    assert "200 K" in start["note"]
    assert 0 < start["lock"] < start["thumb"] < 1

    page.evaluate(DRAG, 0)  # all the way to absolute zero
    held = page.evaluate(READ)
    assert held["temperature"] == pytest.approx(200.0)
    assert held["readout"] == "200 K"
    assert held["thumb"] == pytest.approx(held["lock"], abs=0.002)
    # The setting stops at the lock, so nothing is paid for gas below it.
    assert held["z"] == pytest.approx(-1.4876, abs=1e-3)
    assert held["cost"] == pytest.approx(held["z"] ** 2 / 2)
    assert held["aria"] == "200 K. Coldest allowed here: 200 K."


def test_the_free_point_is_easy_to_land_on(page):
    page.evaluate(SURVEY, {})
    free = page.evaluate(READ)["thumb"]
    page.evaluate(DRAG, 0)
    page.evaluate(DRAG, round(free * 1000) + 2)
    assert page.evaluate(READ)["z"] == 0


def test_metals_move_the_padlock_toward_absolute_zero(page):
    page.evaluate(SURVEY, {})
    pristine = page.evaluate(READ)
    page.evaluate(SURVEY, {"cosmicMyr": 2000, "localMetals": 20})
    enriched = page.evaluate(READ)
    assert enriched["floor"] < pristine["floor"]
    assert 0 < enriched["lock"] < pristine["lock"]


def test_a_saved_setting_below_the_padlock_is_raised_to_it(page):
    page.evaluate(SURVEY, {"zTemperature": -2.5})
    read = page.evaluate(READ)
    assert read["z"] == pytest.approx(-1.4876, abs=1e-3)
    assert read["temperature"] == pytest.approx(200.0)


def test_the_budget_still_stops_the_thumb_on_the_hot_side(page):
    page.evaluate(SURVEY, {"regions": 1.2})
    page.evaluate(DRAG, 1000)
    read = page.evaluate(READ)
    budget = page.evaluate("() => Engine.budget(window.accretion.meta)")
    assert read["cost"] <= budget + 1e-9
    assert read["z"] == pytest.approx((2 * budget) ** 0.5, abs=1e-6)
    assert page.evaluate("() => !document.getElementById('limit').hidden")
