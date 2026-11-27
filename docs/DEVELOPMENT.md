# Development

## Commands

The project uses uv for its environment and lockfile, Ruff for lint and
formatting, and pytest for tests. The development Python version is in
`.python-version`.

Each check is one uv command. CI and the git hook call these commands
directly, written the same way everywhere, so a local pass means the same as
a CI pass. Poe tasks in `pyproject.toml` are shortcuts for the owner;
nothing automated calls them.

| Purpose | Command | Poe shortcut |
| --- | --- | --- |
| Set up a new clone | `uv sync --locked`, then `git config core.hooksPath .githooks` | `poe setup` |
| Lint | `uv run --locked ruff check .` | `poe lint` |
| Check formatting | `uv run --locked ruff format --check .` | `poe format-check` |
| Apply formatting | `uv run --locked ruff format .` | `poe format` |
| Build check (`web/accretion.html` matches its sources) | `uv run --locked python tools/build.py --check` | `poe build-check` |
| Tests without a browser | `uv run --locked pytest -m "not property and not browser"` | |
| Browser tests | `uv run --locked pytest -m browser` | |
| All tests (browser tests skip without Chromium) | `uv run --locked pytest -m "not property"` | `poe test` |
| All four checks | | `poe check` |
| Add a runtime dependency | `uv add PACKAGE` | |
| Add a development dependency | `uv add --dev PACKAGE` | |
| Deliberately refresh dependencies | `uv lock --upgrade` | |
| Capture screenshots of a full run | `uv run python tools/shoot.py` (see also `--phase`, `--out`) | |

Run Poe as `uv run --locked poe TASK`. Commit dependency metadata and
`uv.lock` together, and rerun the checks after updates. `--locked` makes a
stale `uv.lock` fail the run instead of silently re-resolving it. Review the
dependency diff before merging it.

Tests that use the `browser` fixture get the `browser` marker from
`tests/conftest.py`. Without Chromium they skip, unless
`ACCRETION_REQUIRE_BROWSER=1` is set, as it is in CI's Browser job; then a
missing browser fails the run. To run them locally, install Chromium once
with `uv run playwright install chromium`.

Property-based tests get the `property` pytest marker and their own CI job
once the first ones exist. Until then there is no property job, and
`tests/test_ci_selection.py` fails if a `property` test appears without one.

The Tests job sets `ACCRETION_REQUIRE_NODE=1` and installs node, so the
parity and engine tests fail the run when node is missing instead of
passing it by skipping. Locally they still skip without node.

## Where each check runs

Only the edit-time hook changes files. Every later layer only checks, so a
commit or CI run never rewrites code that was already reviewed.

| When | What runs | Where it is defined |
| --- | --- | --- |
| Claude edits a `.py` file | `ruff format` on that file, then `ruff check` on it, reported without `--fix` | `.claude/hooks/format_on_edit.py` |
| Claude edits a committed test | Asks the owner first; new tests stay free to edit | `.claude/hooks/ask_before_test_edit.py` |
| Claude edits `uv.lock` or an `intent.md` | Denied, or asks the owner first | `permissions` in `.claude/settings.json` |
| Any commit | Format check, lint and build check, in seconds | `.githooks/pre-commit` |
| Claude runs `git commit` | Blocks `--no-verify`, `-n`, and `core.hooksPath` overrides | `.claude/hooks/block_no_verify.py` |
| Before work is reported done | The four checks, `poe check` | `AGENTS.md` |
| Every PR and push to main | The Lint, Format, Build, Tests and Browser jobs | `.github/workflows/ci.yml` |
| Merge to main | The five jobs must pass, once the ruleset is set | The `main` ruleset (below) |

Lint stays report-only at edit time because Claude often adds an import in one
edit and uses it in the next; an autofix in between would delete it as unused.

Git does not enable hooks from a clone by itself, so `core.hooksPath` is set
per clone. A Claude Code `SessionStart` hook sets it for every Claude session,
local or cloud, and `poe setup` sets it for the owner. CI is the backstop.

The Claude Code hooks do not see edits made through shell commands. The
ruleset on main is the backstop, once it is set as described below.

## GitHub settings

These live in the repository settings, not in files, so they are recorded
here. They are the target: the owner sets them right after the PR that
added this section merges, and until then `main` still allows every merge
method and needs no PR or checks.

- **Merges:** squash only, with the PR title and description as the default
  commit message. Merged branches are deleted automatically.
- **Ruleset `ProtectMain`:** targets the default branch. It requires a pull
  request with zero approvals, requires the Lint, Format, Build, Tests and
  Browser checks, blocks force pushes and deletion, and requires linear
  history. The bypass list is empty. It also keeps the CodeQL, code quality
  and Copilot review rules.

Zero approvals is deliberate: GitHub does not let an author approve their own
PR, so the owner's merge is the approval. The empty bypass list matters
because agent sessions act with the owner's GitHub permissions; a bypass for
the owner would be one for every agent too. When CI gains a job, merge the
workflow change before adding the job to the ruleset, or every PR waits on a
check that never reports.

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
(`ui.journal.plot_label_early`); code picks the branch and the branches
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
Once set, the `main` ruleset requires a PR for every change, prose fixes
included.
An issue is useful for a reproducible
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

The CI jobs use Python 3.12 on Linux. `pyproject.toml` requires
Python 3.11 or later; CI does not claim to have tested every permitted
version. Add a supported-version matrix when this becomes a library used by
other people. If Windows or another platform is part of the product contract,
test it too. The parity and engine tests also need `node` on `PATH`, and the
browser tests and screenshot tools need Playwright's Chromium (`uv sync` once,
then `uv run playwright install chromium`, if the browser tests skip).

## Deliverables and integrations

For a workbook, UI, native dependency, GPU, or external service, add a specific
verification command and document its environment requirement here. Keep it
separate from headless checks. A missing required environment is a reported
limitation, not a passing integration check. This repository's product is the
single-page browser build: the only integration beyond Python and `node` is
Chromium, driven by Playwright. The browser tests run it in CI's Browser job;
`tools/shoot.py` uses it too, as a development aid outside CI.

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
