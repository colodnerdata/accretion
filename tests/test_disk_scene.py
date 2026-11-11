"""Browser checks for the accrete scene and the setup strip.

The page is the built single file, opened in Chromium. The state is seeded
with the parity stress scenario (an unstable disk and four fragments at 300,
500, 800 and 1200 AU), so fragments are guaranteed without playing a run.
The tests skip when Playwright or a Chromium build is not available.
"""

import glob
from pathlib import Path

import build
import pytest
from test_parity import STRESS_MASSES, STRESS_RADII

sync_api = pytest.importorskip("playwright.sync_api")

ROOT = Path(__file__).parents[1]
PAGE = ROOT / "web" / "accretion.html"
FALLBACK_CHROMIUM = "/opt/pw-browsers/chromium-*/chrome-linux64/chrome"

SEED_STRESS = """
([masses, radii]) => {
  const E = Engine, s = window.accretion;
  s.meta.unlocks = ["reach", "tap", "turbulence", "temperature", "density",
                    "braking", "cooling", "metals"];
  s.meta.heavyTurbulence = 2;
  const run = E.newRun(s.meta);
  Object.assign(run, { phase: "accrete", starMass: 1, envelope: 6,
                       collapseMass: 12, ignited: true });
  run.diskMasses = masses.slice();
  run.fragments = radii.map(
    (r, k) => ({ mass: 0.05, radius: r, phase: 1.6 * k + 0.4 }));
  run.fragmentsFormed = radii.length;
  run.levels.turbulence = 2;
  run.levels.braking = 1;
  s.run = run; s.view = "play"; s.speed = 0;
}
"""
BRIGHT_AT = """
([x, y]) => {
  const canvas = document.getElementById("sky");
  const ratio = canvas.width / canvas.getBoundingClientRect().width;
  const px = canvas.getContext("2d")
    .getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data;
  const [r, g, b] = px;
  return r + g + b;
}
"""


@pytest.fixture(scope="module")
def browser():
    """One Chromium for the module, or a skip when none can be launched."""
    with sync_api.sync_playwright() as playwright:
        try:
            instance = playwright.chromium.launch()
        except sync_api.Error:
            found = sorted(glob.glob(FALLBACK_CHROMIUM))
            if not found:
                pytest.skip("no Chromium available for Playwright")
            try:
                instance = playwright.chromium.launch(
                    executable_path=found[-1], args=["--no-sandbox"]
                )
            except sync_api.Error:
                pytest.skip("Chromium could not be launched")
        yield instance
        instance.close()


@pytest.fixture
def page(browser, request):
    """A fresh page on the built game, seeded with the stress disk."""
    assert build.build_page() == PAGE.read_text(encoding="utf-8"), (
        "web/accretion.html is stale; run python tools/build.py"
    )
    motion = getattr(request, "param", "no-preference")
    context = browser.new_context(
        viewport={"width": 1280, "height": 900}, reduced_motion=motion
    )
    tab = context.new_page()
    errors = []
    tab.on("pageerror", lambda error: errors.append(str(error)))
    tab.add_init_script("try { localStorage.clear() } catch (err) {}")
    tab.goto(PAGE.as_uri())
    tab.wait_for_selector("#track span.now")
    tab.evaluate(SEED_STRESS, [STRESS_MASSES, STRESS_RADII])
    tab.wait_for_function("window.accretion.scene?.clumps?.length > 0")
    yield tab
    context.close()
    assert not errors, errors


def clumps(tab):
    """The clumps the last frame drew."""
    return tab.evaluate("window.accretion.scene.clumps")


def test_every_fragment_is_drawn_with_its_mass_scale(page):
    drawn = clumps(page)
    assert [c["radius"] for c in drawn] == pytest.approx(STRESS_RADII)
    expected = page.evaluate(
        "() => VISUALS.fragmentRadiusPx(0.05, Math.min(W, H) * 0.42)"
    )
    assert [c["r"] for c in drawn] == pytest.approx([expected] * len(drawn))
    sizes = {round(c["r"], 6) for c in drawn}
    assert len(sizes) == 1, "equal masses share one size"
    assert all(c["r"] >= 2.5 for c in drawn)


@pytest.mark.parametrize("page", ["reduce"], indirect=True)
def test_fragments_change_the_canvas_pixels(page):
    """A clump's centre is bright with fragments and dark without them."""
    drawn = clumps(page)
    page.wait_for_timeout(150)
    with_fragments = [page.evaluate(BRIGHT_AT, [c["x"], c["y"]]) for c in drawn]
    page.evaluate("window.accretion.run.fragments = []")
    page.wait_for_function("window.accretion.scene.clumps.length === 0")
    page.wait_for_timeout(150)
    without = [page.evaluate(BRIGHT_AT, [c["x"], c["y"]]) for c in drawn]
    assert all(value > 650 for value in with_fragments), with_fragments
    assert all(a > b + 200 for a, b in zip(with_fragments, without, strict=True))


def test_a_clump_that_reaches_the_star_is_shown_merging(page):
    page.evaluate(
        "() => { const r = window.accretion.run; r.fragments[1].radius = 1.3;"
        " window.accretion.speed = 1; }"
    )
    page.wait_for_function(
        "clumpTrack.events.some((e) => e.kind === 'merge')", timeout=15000
    )
    assert page.evaluate("window.accretion.run.fragments.length") == 3


def test_coalescing_at_the_limit_is_shown_as_two_clumps_joining(page):
    page.evaluate(
        """() => {
          const r = window.accretion.run, f = r.fragments[0], extra = 0.03;
          const mass = f.mass + extra;
          const moment = f.mass * Math.sqrt(f.radius) + extra * Math.sqrt(900);
          f.radius = (moment / mass) ** 2;
          f.mass = mass; r.fragmentsFormed += 1;
        }"""
    )
    page.wait_for_function("clumpTrack.events.some((e) => e.kind === 'join')")
    join = page.evaluate("clumpTrack.events.find((e) => e.kind === 'join')")
    assert join["radius"] == pytest.approx(900, rel=1e-6)
    assert len(clumps(page)) == len(STRESS_RADII)


def test_setup_strip_highlights_turbulence_and_braking_while_accreting(page):
    page.wait_for_function(
        "document.querySelector('#setup li.on')?.textContent.includes('turbulence')"
    )
    marked = page.eval_on_selector_all(
        "#setup li.on", "(items) => items.map((i) => i.textContent)"
    )
    text = " ".join(marked)
    assert "Disk turbulence" in text
    assert "Magnetic braking" in text
    assert "Seeded turbulence" in text
    assert "Temperature" not in text
    everything = page.inner_text("#setup")
    for label in ("Temperature", "Density", "Seeded turbulence", "Disk turbulence"):
        assert label in everything


def test_the_gas_reaching_the_star_rate_is_in_the_stats(page):
    page.wait_for_function(
        "document.getElementById('stats').textContent.includes('Gas reaching')"
    )
    rows = page.eval_on_selector_all(
        "#stats dt", "(items) => items.map((item) => item.textContent)"
    )
    assert "Gas reaching the star" in rows


def test_the_ring_scale_rates_unstable_rings_roser_than_stable_ones(page):
    rings = page.evaluate("window.accretion.scene.rings")
    shades = [r["shade"] for r in rings if r["q"] != float("inf")]
    assert shades, "stress disk has gas"
    assert max(shades) > 0.9, "the stress disk has rings at Q near 1"
