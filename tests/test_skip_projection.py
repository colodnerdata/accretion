"""Leaving a star early shows its projected duration, never its category or mass.

Browser checks on the built page: a run is played to the shine phase with the
engine, then skipped; the ended screen, the journal plot, its legend, the run
chips and the entry card must not name the ending or the final mass.
"""

from pathlib import Path

import build
import pytest

PAGE = Path(__file__).parents[1] / "web" / "accretion.html"

PLAY_TO_SHINE = """
() => {
  const E = Engine, s = window.accretion, meta = s.meta;
  const run = E.newRun(meta);
  for (let tick = 0; run.phase !== "main_sequence" && tick < 20000; tick++) {
    E.step(run, meta, 7.3);
    if (tick % 2 === 0) E.tap(run, meta);
    for (const name of ["reach", "tap", "cooling", "turbulence", "braking"])
      while (E.buy(run, name, meta));
  }
  s.run = run; s.view = "play"; s.speed = 0; s.skipped = false;
  update();
}
"""
LEAVE = """
() => {
  window.accretion.skipped = true;
  Engine.skip(window.accretion.run, window.accretion.meta);
  update();
}
"""
SEE_OUT = """
() => {
  const run = window.accretion.run;
  run.msElapsed = run.msDuration;
  Engine.step(run, window.accretion.meta, 1);
  update();
}
"""


@pytest.fixture
def page(browser):
    """A fresh page on the built game with a run played to the shine phase."""
    assert build.build_page() == PAGE.read_text(encoding="utf-8"), (
        "web/accretion.html is stale; run python tools/build.py"
    )
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    tab = context.new_page()
    errors = []
    tab.on("pageerror", lambda error: errors.append(str(error)))
    tab.add_init_script("try { localStorage.clear() } catch (err) {}")
    tab.goto(PAGE.as_uri())
    tab.wait_for_selector("#track span.now")
    tab.evaluate(PLAY_TO_SHINE)
    yield tab
    context.close()
    assert not errors, errors


def title_of_ending(tab):
    return tab.evaluate("ENDINGS[window.accretion.run.kind].title")


def test_shine_projects_only_the_duration(page):
    page.wait_for_selector("#stats dt")
    rows = page.eval_on_selector_all(
        "#stats dt", "(rows) => rows.map((r) => r.textContent)"
    )
    assert "Projected life" in rows
    text = page.inner_text("#panel").lower()
    assert "forecast" not in text
    assert title_of_ending(page).lower() not in text


def test_a_skipped_star_ends_on_duration_only(page):
    ending = title_of_ending(page)
    page.evaluate(LEAVE)
    page.wait_for_selector("#panel .cta")
    text = page.inner_text("#panel").lower()
    assert "moved on" in text
    assert "projected life" in text
    assert ending.lower() not in text
    assert "final mass" not in text
    assert "forecast" not in text
    assert page.locator(".bands").count() == 0


def test_a_skipped_run_is_neutral_in_the_journal(page):
    ending = title_of_ending(page)
    page.evaluate(LEAVE)
    page.wait_for_selector("#panel .cta")
    page.click("#panel .cta button")
    page.click("#journal-button")
    page.wait_for_selector(".run-chip")
    # The entry card's rows and the plot, not the saved observations: those
    # are what the player saw while the star shone.
    card = page.inner_text("#panel .stats").lower()
    assert ending.lower() not in card
    assert "final mass" not in card
    assert "projected life" in card
    chip = page.get_attribute(".run-chip", "aria-label")
    assert "left early" in chip
    assert ending not in chip
    circle = page.get_attribute("svg.plot circle", "aria-label")
    assert "left early" in circle
    assert ending not in circle
    assert "solar masses" not in circle
    # No legend entry names the category of a star the player left early.
    assert page.locator(".legend span").count() == 1


def test_a_star_seen_to_its_end_still_shows_its_category(page):
    ending = title_of_ending(page)
    page.evaluate(SEE_OUT)
    page.wait_for_selector("#panel .cta")
    text = page.inner_text("#panel").lower()
    assert ending.lower() in text
    assert "final mass" in text
