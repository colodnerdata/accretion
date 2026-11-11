# Development

## Commands

The project uses uv for its environment and lockfile, Poe for commands, Ruff
for lint and formatting, and pytest for tests. `pyproject.toml` is the command
source of truth. The development Python version is in `.python-version`.

| Purpose | Command |
| --- | --- |
| Reproduce the environment | `uv sync --locked` |
| Run the CI checks locally | `uv run --locked poe check` |
| Run tests | `uv run --locked poe test` |
| Lint | `uv run --locked poe lint` |
| Apply formatting | `uv run --locked poe format` |
| Check formatting | `uv run --locked poe format-check` |
| Add a runtime dependency | `uv add PACKAGE` |
| Add a development dependency | `uv add --dev PACKAGE` |
| Deliberately refresh dependencies | `uv lock --upgrade` |
| Capture screenshots of a full run | `uv run python tools/shoot.py` (see also `--phase`, `--out`) |

Commit dependency metadata and `uv.lock` together, and rerun `check` after
updates. `--locked` detects stale dependency metadata instead of silently
refreshing it. Review the dependency diff before merging it.

### WSL launch note

If you run from WSL with a Windows virtual environment active, uv may print:
`VIRTUAL_ENV=... does not match the project environment path .venv`.
Use `uv run --active poe launch` to target the active environment and silence
that warning.

`uv run poe launch` builds `web/accretion.html` and, in WSL, opens it in
Windows Chrome through PowerShell.

## Editing game text

All player-facing wording lives in `content/*.toml`, not in code. The build
validates the tables and embeds them into `web/accretion.html`; `web/app.js`
reads them through `t(key, values)`. Edit, then run `python tools/build.py`
and commit the rebuilt page together with the content change (the same rule
as any web source edit; `build.py --check` fails when the page is stale).

| File | Holds |
| --- | --- |
| `content/ui.toml` | Phase names, buttons, labels, stat names, progress labels, confirmations, banners, screen-reader text, static page text |
| `content/hints.toml` | Tiered hints: `tier1` (direction), `tier2` (lever), `tier3` (explanation) |
| `content/notes.toml` | Shine field notes, distance milestones, new-control announcements, upgrade descriptions, headlines, goals |
| `content/endings.toml` | Ending titles, descriptions, and band labels |
| `content/voice.toml` | Reserved for a future narrator voice; no entries yet |

Keys are dotted and file-scoped — `ui.phases.accrete`, `hints.small.tier2`,
`endings.supernova.title`. Build fails on duplicate keys. Wording that differs
by situation gets its own entry with a full sentence
(`hints.small.tier2_with_density`); code picks the branch and the branches
never share a sentence.

Entries are either a plain string or a table with `text` plus optional `kind`
metadata. `kind` is one of `hook` (5–12 words), `tooltip` (25–50), `panel`
(60–150), or `reference` (unlimited), matching the text tiers in
`docs/planning/teaching-principles.md`. To add a new metadata field, extend
`ALLOWED_FIELDS` in `tools/text.py` and the tests. Only text is embedded into
the page — metadata is for authors and checks.

Computed values are named placeholders, filled by the call site:
`"Core hydrogen fused: {percent}% of the way"`. Names describe the meaning
(`{brightness}`, `{distance_old}`), not the formatting — the code keeps all
formatting choices (scientific notation, units, rounding) and passes finished
strings. A missing key or placeholder renders as `[missing: key]` in the
interface and logs a console warning; it never throws.

`tests/test_text.py` guards the tables:

- Files load and validate; unknown metadata, bad kinds, and malformed
  placeholders fail there.
- Every `t("...")` key and `{{ui...}}` body placeholder exists; every entry is
  used (voice.toml is exempt).
- Each call site supplies exactly the placeholders its entry names.
- No banned words in any entry — "burn" and its forms, "dying", "zero
  gravity", "gravity cancels". Extend the list in the `BANNED` tuple at the
  top of the test.
- Two reports, neither failing: word counts per `kind`
  (`uv run --locked pytest tests/test_text.py::test_length_report -s`) and a
  leftover-English-literal warning for `web/app.js`
  (`tests/test_text.py::test_leftover_text_report`).

## A small development loop

1. Write down the expected behavior and the smallest useful change.
2. Use a short-lived branch for substantive work or AI-generated changes.
3. Implement the change and a test that could detect a real mistake.
4. Run the relevant focused test, then `check` before merging.
5. Read the diff yourself. Check assumptions, boundary cases, error behavior,
   dependencies, and anything an AI reviewer missed.
6. Merge the completed change and remove its branch.

A PR is a useful checkpoint even when you are its only human reviewer.
Small prose fixes can use a direct commit when that is simpler. Choose any
enforced main-branch rules accordingly. An issue is useful for a reproducible
bug or a larger chunk of work; it need not precede every edit.

## Tests that earn their maintenance cost

- Test observable behavior and mathematical invariants.
- Use hand-computable cases or an independent reference implementation for
  numerical results. Record tolerances and their reason.
- Include invalid inputs, degenerate cases, and past failure cases.
- A bug fix should normally have a test that fails without the fix.
- Use mocks to isolate boundaries, then test the real boundary when needed.
- Add property-based tests, type checking, coverage reporting, and additional
  Python/OS CI jobs when they address a specific risk. A coverage percentage
  is a diagnostic, not proof of correctness.

The initial CI job uses Python 3.12 on Linux. `pyproject.toml` requires
Python 3.11 or later; CI does not claim to have tested every permitted
version. Add a supported-version matrix when this becomes a library used by
other people. If Windows or another platform is part of the product contract,
test it too. The parity and engine tests also need `node` on `PATH`, and the
browser screenshot tools need Playwright's Chromium (`uv sync` once, then
`uv run playwright install chromium`, if the browser tests skip).

## Deliverables and integrations

For a workbook, UI, native dependency, GPU, or external service, add a specific
verification command and document its environment requirement here. Keep it
separate from headless checks. A missing required environment is a reported
limitation, not a passing integration check. This repository's product is the
single-page browser build: the only integration beyond Python and `node` is
Chromium, driven by Playwright from `tools/shoot.py`, which is a development
aid and not part of CI.

For generated files, use the order: build, verify that output, then publish.
If a check cannot run in CI, retain concise evidence tied to the commit,
command, environment, and artifact. Save useful failures as well as successes;
keep routine terminal logs out of the repository.

Keep source and generated output ownership clear. Prefer release assets for
large distributables; commit a generated artifact only when it serves a clear
purpose. Do not hand-edit a generated file whose source can be rebuilt.

## Resume without rereading a conversation

Use `docs/NEXT.md` for the current objective and a few next actions. Put detailed
work in issues if needed, and link to them instead of maintaining two backlogs.
Use `docs/DECISIONS.md` for decisions that explain an otherwise surprising
constraint, a rejected alternative, or a tradeoff likely to be revisited.
Add architecture documentation when actual boundaries become worth explaining.

## Release when there is something to release

Choose a license, document an example, verify the actual deliverable, and tag
the release. Keep a short changelog once users rely on versioned behavior.
Mark incompatible changes explicitly. Add publishing automation when the
manual sequence is stable and repeated often enough to justify it.

Dependabot is configured for monthly grouped uv and Actions update PRs, with
one open version-update PR per ecosystem. Review and test them; nothing here
auto-merges or publishes a release. Configure GitHub security alerts separately
where available so important notices do not wait for a monthly maintenance pass.
