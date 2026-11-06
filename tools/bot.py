"""Simulate an attentive first-time player."""

from accretion import game


def play(taps_per_second=0.5, gather_buys=True, meta=None):
    meta = meta or game.Meta()
    run = game.new_run(meta)
    marks = {}
    last = run.phase
    tick = 0
    while run.phase != "ended" and tick < 200000:
        game.step(run, meta, 1.0)
        for _ in range(int((tick + 1) * taps_per_second) - int(tick * taps_per_second)):
            game.tap(run, meta)
        for name in ("reach", "tap", "cooling", "turbulence", "braking"):
            if name == "cooling" and not gather_buys:
                continue
            while game.buy(run, name, meta):
                pass
        if run.phase != last:
            marks[run.phase] = run.seconds
            last = run.phase
        tick += 1
    return run, meta, marks


if __name__ == "__main__":
    for t, cool in ((0.5, False), (0, False)):
        run, meta, marks = play(t, cool)
        mins = {k: round(v / 60, 1) for k, v in marks.items()}
        print(
            f"taps={t} cool={cool}",
            mins,
            "M*",
            round(run.star_mass, 2),
            run.kind,
            "T",
            round(game.temperature(run, meta)),
            run.levels,
            "alpha",
            round(game.alpha(run, meta), 3),
            "life",
            round(run.lifetime_myr, 1),
            "collapse M",
            round(run.collapse_mass, 1),
            "ej",
            round(run.ejected, 1),
        )
