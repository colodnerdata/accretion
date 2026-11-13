# Accretion repository review

**An outsider’s engineering and incremental-game assessment · November 10, 2026**

I reviewed `colodnerdata/accretion` on `main` at `58dab485d1e3249541701328db3b07b362c351d8`. The scope is the Layer 1 prototype, including its tracked player build, source, contributor workflow, recent merges, and plans for later layers. PR #18, the gas-visualization change, was open and is outside this snapshot. [Reviewed revision][revision] · [Open visual work][pr18]

## Verdict

I would fund another iteration of this game. I would hold expansion into the next prestige layer. Accretion already does something worth a player’s time. On my first run, changing only whether I bought disk turbulence changed the death of the star. The resulting supernova made roughly 3.79 solar masses of heavy elements available, against 0.005 on the black-hole path. That is a decision with a consequence a player can discover and use on the next run. [First-run rules][controls] · [Ending rewards][end-code]

The disk has tests for mass conservation, steady-state flow, and nonnegative ring masses. There is no comparable test showing that a player received the intended build, kept their save, or learned why their star died. A four-day-old prototype can afford disposable saves and manual release steps. Accretion is already asking contributors to maintain two engines, a research literature, a web application, and a six-layer design. That cost is real today. The evidence for the second session is thin. [Disk tests][disk-tests] · [Project mechanics][claude-mechanics] · [Playtest plan][playtest]

| Priority | Finding | Why it matters |
| --- | --- | --- |
| Before the next shared build | Green CI accepted a stale playable page. The installed hook rejects the same checkout. | Two contributors can follow the instructions and test different programs. |
| Before recruiting returning players | Save failures are silent, old keys are abandoned, and offline time changes the journal. | The player’s accumulated experiment history is the game’s principal long-term asset. |
| Before tuning another layer | The first two runs already contain a consequential purchase, a long period without a purchase, and a slider that can charge extra for an identical result. | A longer timer or another upgrade could easily hide the best part of the game. |
| Before changing the solver or porting more mechanics | Two authoritative implementations reproduce shared errors. Disk resolution can also change the ending. | A balance patch can alter the lesson, the prestige payout, and the compatibility of in-progress saves. |
| Before expanding the contributor team | The most useful architecture and design constraints live in assistant-specific files. The handoff page points to merged work. | New contributors have to reconstruct which instructions describe the product today. |

## The player’s first two runs

I ran the actual JavaScript simulation at normal game speed with fresh state. These are deterministic simulated minutes. A buy policy repeatedly bought affordable unlocked levels in a fixed order. The unattended policy sent no commands. The tap cadence and buy order for the first row match the repository bot. These measurements do not estimate the behavior of a population of players. [Repository bot][bot] · [Engine under test][engine]

| First-run policy | Gather taps | Purchases | Finish | Final mass | Ending | Heavy elements |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| Tap every 2 seconds, buy all controls every second when affordable | 72 | 23 | 13.36 min | 21.54 M☉ | Supernova | 3.794 M☉ |
| Same tapping and gathering purchases, leave turbulence alone | 72 | 19 | 12.70 min | 26.16 M☉ | Black hole | 0.005 M☉ |
| No tapping, buy every second when affordable | 0 | 25 | 16.63 min | 21.52 M☉ | Supernova | 3.788 M☉ |
| No tapping, buy affordable levels once per minute | 0 | 21 | 16.56 min | 23.48 M☉ | Supernova | 4.492 M☉ |
| Leave the game entirely alone | 0 | 0 | 25.46 min | 26.16 M☉ | Black hole | 0.005 M☉ |

**The opening has a good scientific puzzle and a weak debrief.** Four turbulence purchases turned the black hole into a supernova in the paired runs. The player gets an ending, a mass, a plot, and notes. The journal lacks a complete record of initial settings and purchase times that would let a developer reconstruct that comparison. It records effective temperature, final transport parameters and results. The universe also ages and enriches between runs, so even identical slider positions can describe different clouds. I would make the first debrief invite one prediction, then let the player compare both runs’ starting conditions, interventions, and outcomes. A correct prediction of the ending need not be exposed ahead of time. [Run record][journal] · [Journal rendering][journal-ui] · [Prediction sketch][prediction]

**The headline duration hides where attention goes.** In the attentive run the first purchase arrived at 0:08, the last at 4:46, Shine started at about 5:55, and the star died at 13:22. Shine occupied about 56% of the run. Reading time is a legitimate part of this game. After the notes have been read, the same countdown has to earn its place on a repeat run. The regular skip is available only while more than an hour of Shine remains. The README’s 15–20 minute target and the test’s 13–22 minute window can both obscure this. I would test whether players can explain turbulence at the debrief before adding a minute of waiting. Let a later milestone automate a demonstrated gather routine or let players schedule the next comparison during Shine. Keep the ×10 and ×60 controls in an explicitly labeled playtest mode when collecting timings. [Skip policy][skip] · [Field notes][notes-ui] · [Pacing assertion][pacing-test] · [Test-speed controls][speed]

**The first temperature slider can misteach the physics.** I cloned the meta-state after the attentive supernova and varied only the temperature setting. On the two cold selections below, search’s main temperature readout rounds the raw draws to 127 K and 90 K. Both runs actually start at the same 138.72 K composition floor. The panel separately lists that floor, but the slider spends four times as much refundable budget on the second choice. Show the effective temperature prominently, explain the clamp where the player acts, and make the extra cost earn a consequence or stop charging it. [Search controls and preview][search-ui] · [Region creation and temperature][conditions]

| Second-run setting | Search cost | Raw temperature | Effective temperature | Final mass | Ending |
| --- | ---: | ---: | ---: | ---: | --- |
| −1 | 0.50 | 127.08 K | 138.72 K | 12.25 M☉ | Supernova |
| −2 | 2.00 | 89.55 K | 138.72 K | 12.25 M☉ | Supernova |
| 0 | 0.00 | 180.34 K | 180.34 K | 18.66 M☉ | Black hole |
| +2 | 2.00 | 363.16 K | 363.16 K | 33.73 M☉ | Black hole |

**The economy has two finite ceilings the interface treats as continuing progress.**

- The region budget is `ln(N)`. Each of three sliders ranges from −3 to +3, with cost `z²/2`, plus at most 1 for starting near a black hole. The most expensive current configuration costs **14.5**. In a neutral-region campaign that bought affordable in-run upgrades and bought no permanent upgrades, the budget reached **15.82 after ten runs**. From then on, increasing this budget unlocks no further setting in the current interface. A finite Layer 1 is fine. Give it a visible completion or a new use for the reward when the frontier runs out. Store the log budget directly if it is the quantity gameplay uses. In a separate synthetic endurance check, 355 identical +2 gains sent the raw region count to `Infinity`, which JSON serialized as `null`. This synthetic sequence isolates the numeric limit. [Budget][region-cost] · [Sliders][search-ui] · [Prestige][end-code]
- Turbulence caps at `α = 1`. With nine permanent levels and no in-run levels, I spent 512 heavy elements on level ten and measured `1 → 1`. The purchase succeeded. The same project already refuses a cooling purchase that would do nothing. Have the domain return the cost, marginal effect, and refusal reason for both the UI and the command. [Permanent purchases][conditions] · [In-run purchases][upgrades]

**The rarity currency has a sound mathematical interpretation. The player-facing odds need a different calculation.** With ordinary sliders, `exp(Σz²/2)` is the inverse ratio of the Gaussian density at the setting to its density at the mode. The UI calls it “odds of finding this” and displays “1 in …”. At one coordinate of +2, this yields 1 in 7.39. If the intended event were drawing a value at least +2, its probability would be about 1 in 44. A finite bin would have a third answer. Label the existing number as relative rarity, or define the event and calculate its probability. The distinction matters in a game whose selling point is learning from a quantitative model. [Player wording][odds] · [Fidelity record][fidelity] · [NIST on the normal density and CDF][normal]

## What a clean checkout actually guarantees

| Check at the reviewed revision | Observed result | What it establishes |
| --- | --- | --- |
| `uv sync --locked`, then `uv run --locked poe check` | Installed successfully. Ruff passed and all 77 tests passed with Node available. | The Python environment and main test command are reproducible here. |
| Run pytest with Node removed from its executable search path | 75 passed, 2 skipped, successful exit | Both the browser-engine boundary suite and Python/JS parity can disappear from a green result. |
| `python tools/build.py --check` on the untouched checkout | Failed | The committed page differs from the current web source. |
| `uv run --locked poe hooks`, then `git hook run pre-commit` | Failed on the same untouched tree | The hook catches a release fault that CI misses. |
| Rebuild in a separate clean copy, then run `--check` | Passed | Generation works. The checked-in file was 118,203 bytes and the rebuilt file 118,273 bytes. |
| GitHub Actions on this SHA | The push workflow passed | Its only project verification command is `poe check`. It neither checked the distributable nor launched it. |

The actual HTML difference is small. Its cooling-shop render calls `E.newRun(m).metalLog10`. The source calculates the same metallicity directly and avoids constructing the run. I found no evidence this particular difference changes a star. Its significance is that the next difference could affect rewards or saving, and the configured workflow would treat it the same way. The README explicitly tells contributors that bypassing the hook still leaves the same checks in CI. [Tracked page][tracked-diff] · [Source][source-diff] · [README][readme-hook] · [Workflow][ci] · [Successful run][green]

**Setup and distribution.** The no-account, single-page build is a strength. A new player should be one click from it. At review time GitHub reported no Pages site, no homepage, no releases, and the repository had no tags. The README starts with developer commands, uses both an ambient `python` and `uv`, and leaves the Node requirement to an assistant document. Python 3.12 is the development pin, the package accepts 3.11+, and the development guide still describes a starter allowing 3.12+. Playwright sits in the default dev group even for someone changing one sentence, while its separate Chromium installation is absent from the command table. For contributors, give one tested bootstrap, one run command and one complete check. For players, provide a stable play URL and keep a downloadable HTML file. The Windows/WSL Chrome launcher can remain a convenience. Maintaining 100 lines of OS-specific launch code should buy more than a link on the project’s home page. [README][readme] · [Manifest][manifest] · [Development guide][dev] · [Launcher][launcher] · [Releases][releases]

**CI, hooks and branch policy.** Keep SHA-pinned actions, read-only permissions, disabled checkout credential persistence, cancellation of superseded runs, the ten-minute timeout, and locked dependencies. Grouped monthly updates are sensible for this small repo. Put the artifact freshness check in the shared command now. Set up a declared Node version and fail the required job if it is unavailable. Add one Chromium smoke test against the exact deliverable being offered to players. The existing screenshot driver already knows how to reach the ending, survey and journal at two widths and two motion settings. Extract a short assertion-based journey and run the full screenshot set on demand. A screenshot tool that rebuilds first cannot catch a stale distributed file. [Workflow][ci] · [Dependabot][dependabot] · [Engine test skip][engine-test] · [Browser driver][shoot] · [Playwright CI guidance][pw-ci]

The hook is executable, opt-in, and explicit about testing the working tree. With partial staging, that can be a different program from the prospective commit. Make it quick if desired. Let CI check the exact commit and require its result on `main`. This is an observed process failure. The preceding first-parent revision, `dfd041d`, contained literal merge conflict markers in `pyproject.toml`. Its push workflow failed installing dependencies. The next revision repaired it. GitHub reported `main` unprotected and no repository rulesets during review. One required check is enough to address this failure without adding reviewer bureaucracy to a solo project. [Hook][hook] · [Broken manifest][broken-manifest] · [Failed run][red] · [Branch metadata][branch]

**The shipped HTML needs an ordinary standards-mode entry point.** The builder starts with a title and emits no doctype, UTF-8 declaration or document language. Supply all three, especially in a game that teaches with Unicode units and scientific notation. The page already implements keyboard activation for the canvas, focus restoration, live announcements, reduced-motion handling, text hints and a chip list alongside its SVG plot. Protect those features with keyboard-only and narrow-viewport checks. I would measure reduced-motion behavior, layout, and frame time on a phone before making a performance or accessibility claim. [Builder][build] · [Focus handling][focus] · [Canvas input][frame] · [HTML parsing modes][doctype]

## Saving, offline time and simulation integrity

**The same star has two recorded lifetimes on the player’s clock.** Starting with a fresh unattended cloud, I advanced 3,600 seconds as one call and repeated the experiment in one-second increments. Both arrived at a 26.162 M☉ black hole after 1,527.44 game seconds. The first journal recorded **1,156.76 seconds**. The second recorded **1,527.00**. The engine appends the journal inside the transition, then adds the just-consumed time to `run.seconds`. In a large offline call, that omitted interval can be the whole remaining Shine phase. Both languages implement this order. The existing long-step test checks the final run and reuses one meta object across its two trajectories. Give each trajectory independent state, timestamp the event after consuming its interval, and compare the complete journal, rewards, unlocks, and clocks. [Browser step and journal][journal] · [Python step][python-step] · [Existing test][long-test]

**Going away for 59 seconds and going away for 61 seconds are different rules.** With a stubbed clock and storage driving the actual loader, the first credited zero and the second credited all 61. The game can also assign a parsed save to live state before validating it. A JSON object with a run and no meta replaced the good default meta with `undefined`. Exceptions from saving and loading are swallowed. A second tab can write its older state over a newer tab’s progress because both autosave to the same key. I inferred the two-tab risk from the write path. [Save and load][save] · [Autosave and page hide][frame]

The README explicitly makes incompatible saves disposable and recommends `localStorage.clear()`, which clears the entire origin. Opening the game directly from a file also makes persistence browser-dependent. Put ordinary play on a stable origin. Keep the current key readable, use a versioned save envelope, validate before installing state, retain a last-known-good copy, and provide export/import plus a visible saving-disabled state. Accept elapsed time below a minute while reserving the return banner for longer absences. Choose whether a second tab becomes read-only or detects a newer save before it writes. A test should be able to load a historical save, spend a single reward, reload, and see the same journal entry and balance. Trimps gives players an export/import path. Antimatter Dimensions’ historical migrations show what preserving earned progress looks like when rules change. [README save policy][readme-save] · [MDN storage behavior][storage] · [Trimps developer FAQ][trimps] · [Antimatter Dimensions migrations][ad-save]

**Specify the payout for leaving early.** A skippable star is recorded with its forecast ending. Prestige pays the full outcome-based region gain and heavy-element yield, and counts applicable ending unlocks, while advancing the universe by the fraction of the lifetime actually spent. A synthetic 1 M☉ white-dwarf fixture left after 60 of 7,200 seconds paid the full 0.0003 M☉ yield. The UI tells the player they left before the ending happened. Whether this is a valuable convenience or the best way to collect an unobserved outcome is a design decision. Show what is paid now and what is forgone before confirmation. Make settling the same completed run twice harmless at the command boundary. [Settlement code][end-code] · [Ending presentation][ended-ui]

**The pending 16-versus-32-ring decision is a game balance and save-format decision.** I changed only `CELLS` in disposable copies of the JS engine, then held the post-first-run world, purchase policy and search settings fixed. Across 41 affordable second-run temperatures from −2 to +2 in 0.1 steps, **five** produced a different ending somewhere among 16, 32, and 64 rings. At the default temperature, 16 rings yielded an 18.66 M☉ black hole. At 32 and 64, the same experiment yielded 16.87 and 16.82 M☉ supernovae. The attentive first-run ending stayed a supernova at all three resolutions, even as the fragment count changed from two to one to zero. A first-run-only balance check misses this entirely. The sweep is a selected slice of the state space and higher resolution alone does not establish physical truth. [Grid and tuning][engine] · [Stellar endings][endings] · [Open resolution decision][next]

I also loaded a valid 16-ring mid-accretion checkpoint, taken at game second 950, into the experimental 32-ring engine. Advancing five seconds produced `NaN` for the star and all 32 disk masses. The 16-ring control remained finite. This is a forward-compatibility experiment on a proposed change. Decide whether an existing run finishes on its original solver or migrates its radial mass distribution. Assert mass conservation and check the angular-momentum error. Track ending flips and reward changes near mass thresholds separately from floating-point agreement. [Saved disk shape][conditions] · [Disk solve][disk] · [Disk invariants][disk-tests]

## Code ownership, languages, and repository layout

**Choose one implementation for the rules that determine a player’s result.** Python has a useful split among physics, disk transport and game rules. JavaScript collapses the three into a 458-line closure. Both hold physical tables, thresholds, pacing constants, purchases and prestige behavior. The Python bot and a Node parity driver exercise selected cases, and the parity test itself duplicates its action policy in two languages. The test covers several regions, an injected unstable disk, an early exit, and numerical boundaries. That is valuable evidence. A contributor changing an unlock must still find both implementations and know which scenarios exercise it. Both can agree on the wrong journal timestamp. [Python rules][rules] · [JS engine][engine] · [Parity scenarios][parity] · [JS parity driver][parity-js]

Starting from zero, I would ship a **small TypeScript simulation** that runs in the browser, in a headless scenario runner, and in tests. Keep HTML/CSS, the canvas and a static output. Keep Python for science, data preparation, independent numerical reference cases and plots. Let it drive the shipping engine through a batch command when it needs exact *game* outcomes. Keep sourced tables and unit metadata in one reviewed dataset. Keep independent values for a few published anchors and analytically solvable cases outside the generation path. The independent reference earns its keep by catching errors the shipping code could make. A second implementation of the shop or journal has no such justification. For this repo, I would extract the existing DOM-free JS into modules, protect the behavior with fixtures, and introduce checking incrementally. A rewrite would throw away the best available regression evidence. [Engine interface][engine-api] · [Physical tables][physics] · [Independent disk checks][disk-tests]

**The biggest boundary failure is in the player interface.** In 883 lines, `web/app.js` owns session state, persistence, the clock, eligibility explanations, region-budget enforcement, notes, the journal, screen construction, input and telescope graphics. The survey budget clamp lives in a slider handler. Other code paths can construct an over-budget run. The shop recalculates affordability and floor explanations to match the engine, the exact location of the stale artifact. `renderEnded` can record an observation as a side effect of rendering. A button currently holds both presentation work and domain decisions. Split these by the reasons they change. Have a region quote or purchase quote return the effective conditions, cost, eligibility, and explanation code. Have the corresponding command enforce that same result. Have the journal consume completion events. The renderer should be able to paint the same outcome twice without creating history. [Slider rules and shop][search-ui] · [Ending renderer][ended-ui] · [Eligibility in the UI][buy-ui]

**Text ownership has improved, with too much machinery devoted to enforcing spelling conventions in JavaScript.** TOML is an appropriate choice for an author editing hints and complete sentences. The build checks keys, metadata, and placeholders and embeds sorted text without runtime fetching. Keep that. The 246-line Python text test contains a miniature parser for JS call syntax. It also asserts that the reserved narrator file stays empty. Meanwhile the Sun comparison sentence remains in JS, and journal filtering depends on an English `"New "` prefix. Prefer structured note IDs and typed or generated message keys. Keep the curricular vocabulary checks that catch genuine misconceptions. Allow ordinary content growth without editing a test whose job is to enforce an empty file. [Content loader][text-loader] · [Text tests][text-tests] · [Sun comparison][text-ui] · [Journal formatting][journal-ui]

**The folder names mix audiences and lifecycles.** An outsider sees `src/` and naturally looks there for the product. The shipped implementation sits in `web/` alongside its generated duplicate. The `tools/` directory contains a builder, text validator, platform launcher, simulated player, screenshot driver, parity runner and boundary tests. The current `tests/` directory makes sense to a Python developer, but a browser developer has to follow a Python subprocess to find their test. Move tests beside the behavior or into clearly named suites. Put generated distributions in their own output directory or attach them to releases. Keep the no-install HTML download if players use it. [Repository tree][revision] · [Builder][build] · [Browser boundary test][engine-test]

A small target layout would give each area an owner and a reason to exist.

| Location | Owns | Dependency boundary |
| --- | --- | --- |
| `src/sim/` | Physical relations, disk steps, game commands, progression, event emission | Deterministic, no DOM, wall clock, storage, or formatting. Node and the browser import the same code. |
| `src/ui/` | Play, survey, journal, telescope and accessible controls | Reads snapshots, sends commands, renders events. |
| `src/platform/` | Clock adapter, save schema, migrations and storage | Handles interrupted writes, returning players and multiple tabs. |
| `content/` | Player wording, reviewed science data, separately identified tuning values | Each value has a clear owner. Scientific tables can carry units, source, and version. |
| `tests/` | Independent numerical fixtures, playthrough policies, historical saves, browser journeys | A fixture names its expected outcome and why that outcome matters. |
| `analysis/` | Python research, parameter sweeps, reference calculations, comparison plots | May call the shipping engine in batches. An ordinary game build needs none of its research dependencies. |
| `docs/`, `dist/` | Maintained human documentation, archived research, and generated release output in distinct locations | Architecture, design intent, and distributables each have one place to look. |

**Documentation has valuable substance and poor authority.** `FIDELITY.md` distinguishes established relations, simplifications, disputed choices and pacing rules. That is worth preserving even if the rest of the tree moves. `AGENTS.md` declares itself canonical while `CLAUDE.md` grants itself precedence on commands and contains the richest account of what the game actually is. The README says edits to `src/` merit a browser rebuild, yet the builder never reads `src/`. The development guide mentions workbooks and GPUs. The next-action page calls for merging the already-merged metals change. The research report still discusses a disk cap while the fidelity record describes simulated fragments. The prediction sketch documents that it requires an external canvas runtime to open. Each example gives a newcomer another reason to distrust the next instruction. [Agent entry][agents] · [Project-specific guidance][claude] · [Build inputs][build] · [Current handoff][next] · [Historical research][data] · [Sketch constraints][prediction]

Give a human three short entry points. The README explains how to play and contribute, the architecture note explains how a scientific result becomes a game rule, and the design note names the next playtest question. Point assistant-specific files there. Label old research with its date, status, and successor, and keep a standalone image of a mock-up if its native runtime is external. The four files under `.claude/` alone contain 9,709 words by `wc -w`, compared with 462 in the README. Moving the game’s governing decisions onto the human reading path matters more than deleting words. Keep the decision log for consequential choices, the PR template’s request for evidence, and the issue template’s problem-and-outcome fields. The public repo carries an all-rights-reserved notice. If outside collaboration is a goal, tell people whether you want playtest feedback, bug reports or code submissions and where to send each. [Decision log][decisions] · [PR template][pr-template] · [License][license]

## What I would ship next

| Order | Change | Evidence that would close it |
| ---: | --- | --- |
| 1 | Repair distribution and establish a known playable build. | A deliberately stale bundle fails CI. A clean clone with the documented prerequisites passes. CI opens the verified build and completes a first run, survey and journal inspection. The exact verified output reaches a stable play URL and downloadable release. |
| 2 | Make return play trustworthy. | A 59-second absence, a two-hour absence, repeated reloads, an old save, malformed JSON, a valid JSON object with missing fields, and a denied write have explicit outcomes. Online/offline partitions yield the same completed record. A stale tab cannot erase a newer run. |
| 3 | Get the first two experiments in front of outsiders. | Observe a full-activity player, a periodic checker and someone who leaves the game alone. Capture the last consequential choice, what the player thinks changed the star, their first independent prediction, and whether they voluntarily start another region. Include an accessible keyboard journey. Keep a locally exportable trace, with simulated and wall time distinct. |
| 4 | Give the engine ownership of commands, records, and effective values. | The display, buy command and headless runner agree at the cooling floor, turbulence cap, budget boundary and skip cutoff. A saved run carries its initial conditions, action history or sufficient replay data, and rules version. Pin the current JS behavior before moving modules. |
| 5 | Use the results to choose the next scientific investment. | Run paired comparisons around ending thresholds and quantify fate changes, reward changes, mass error, and catch-up time on a phone. If another layer or more rings changes a decision players can recognize, build it. Otherwise spend the iteration on the debrief and on retiring solved gather chores. |

**Why these comparisons informed the recommendation.** Antimatter Dimensions’ second Eternity milestone preserves autobuyers, which changes what the player must repeat. In Kittens Game, building a mine opens a miner job, giving a purchase a new decision as well as a production boost. Trimps makes save export/import part of playing across environments. Anthony Pecorella’s treatment of prestige compares how reset rewards reshape later runs. For Accretion the distinctive permanent reward could be the ability to conduct a better experiment. The thing to test is whether the player can ask and answer a more interesting question on run two. [Antimatter Dimensions milestones][ad-milestones] · [Kittens Game mine][kittens] · [Trimps FAQ][trimps] · [The Math of Idle Games, Part III][prestige-math]

## Reproduction and limits

The commands below establish the CI/hook discrepancy at the reviewed revision. The freshness check must be run **before** rebuilding. A separate checkout can be used to verify that regenerating the file makes it pass.

```bash
git clone https://github.com/colodnerdata/accretion.git
cd accretion
git checkout --detach 58dab485d1e3249541701328db3b07b362c351d8
uv sync --locked
uv run --locked poe check
uv run --locked python tools/build.py --check
```

The offline journal discrepancy can be reproduced from the checkout root with Node alone.

```javascript
const E = require("./web/engine.js");
for (const secondsPerStep of [1, 3600]) {
  const meta = E.newMeta();
  const run = E.newRun(meta);
  for (let left = 3600; left > 0; left -= secondsPerStep) {
    E.step(run, meta, secondsPerStep);
  }
  console.log(secondsPerStep, run.kind, run.seconds, meta.journal[0].seconds);
}
```

For the pacing results, step one game second, tap on every second tick while gathering if enabled, and buy affordable levels in the order `reach`, `tap`, `cooling`, `turbulence`, `braking`. For the second-run experiments, settle the attentive first supernova once and copy that same meta-state for every setting. For the ring sweep, change only `CELLS` in temporary engine copies, use that original 16-ring meta-state in all three, and scan temperature in 0.1 increments. Every point was affordable on the first payout.

I ran the locked suite, both headless engines, the bot, the hook, build comparisons, and targeted JavaScript probes on Linux with Python 3.12.14 and Node 24.22.1. The pinned Playwright browser download failed, the installed Chromium could not open its process socket, and the shared browser blocked local-file navigation. I could inspect the UI source and exercise its isolated storage logic. Actual desktop and phone rendering, assistive technology, and human enjoyment remain unverified. I did not independently revalidate the underlying stellar grids. The analysis used an isolated checkout and experimental copies. No repository changes were published.

[ad-milestones]: https://github.com/IvarK/AntimatterDimensionsSourceCode/blob/5409e320cecef96a917cca1dfb68f1f183e499ca/src/core/secret-formula/eternity/eternity-milestones.js#L1-L23
[ad-save]: https://github.com/IvarK/AntimatterDimensionsSourceCode/blob/5409e320cecef96a917cca1dfb68f1f183e499ca/src/core/storage/migrations.js#L3-L35
[agents]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/AGENTS.md
[bot]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tools/bot.py#L6-L28
[branch]: https://api.github.com/repos/colodnerdata/accretion/branches/main
[broken-manifest]: https://github.com/colodnerdata/accretion/blob/dfd041deb2ed3557baa87c27954dbba946d5efc3/pyproject.toml#L9-L16
[build]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tools/build.py#L15-L58
[buy-ui]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L575-L593
[ci]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/.github/workflows/ci.yml
[claude]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/CLAUDE.md#L1-L53
[claude-mechanics]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/CLAUDE.md#L77-L102
[conditions]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/engine.js#L155-L214
[controls]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/src/accretion/game.py#L111-L130
[data]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/DATA_REPORT.md#L173-L207
[decisions]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/docs/DECISIONS.md
[dependabot]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/.github/dependabot.yml
[dev]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/docs/DEVELOPMENT.md
[disk]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/src/accretion/disk.py#L95-L155
[disk-tests]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tests/test_disk.py#L12-L57
[doctype]: https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Quirks_mode_and_standards_mode
[end-code]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/engine.js#L400-L448
[ended-ui]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L381-L401
[endings]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/engine.js#L96-L116
[engine]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/engine.js#L1-L53
[engine-api]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/engine.js#L450-L458
[engine-test]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tests/test_engine.py#L11-L22
[fidelity]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/FIDELITY.md
[focus]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L303-L335
[frame]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L857-L883
[green]: https://github.com/colodnerdata/accretion/actions/runs/42741380688
[hook]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/.githooks/pre-commit
[journal]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/engine.js#L365-L419
[journal-ui]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L490-L524
[kittens]: https://github.com/nuclear-unicorn/kittensgame/blob/master/res/i18n/en.json
[launcher]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tools/launch.py
[license]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/LICENSE
[long-test]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tests/test_game.py#L62-L78
[manifest]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/pyproject.toml
[next]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/docs/NEXT.md
[normal]: https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm
[notes-ui]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L71-L108
[odds]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/content/ui.toml#L106-L117
[pacing-test]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tests/test_game.py#L62-L92
[parity]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tests/test_parity.py
[parity-js]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tools/parity_runner.js
[physics]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/src/accretion/physics.py#L8-L75
[playtest]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/docs/planning/playtest-measures.md
[pr-template]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/.github/pull_request_template.md
[pr18]: https://github.com/colodnerdata/accretion/pull/18
[prediction]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/docs/planning/prediction-system-sketch/README.md
[prestige-math]: https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii
[pw-ci]: https://playwright.dev/python/docs/ci
[python-step]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/src/accretion/game.py#L552-L586
[readme]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/README.md
[readme-hook]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/README.md#L50-L62
[readme-save]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/README.md#L36-L44
[red]: https://github.com/colodnerdata/accretion/actions/runs/42737156708
[region-cost]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/src/accretion/game.py#L173-L181
[releases]: https://github.com/colodnerdata/accretion/releases
[revision]: https://github.com/colodnerdata/accretion/tree/58dab485d1e3249541701328db3b07b362c351d8
[rules]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/src/accretion/game.py
[save]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L177-L198
[search-ui]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L404-L485
[shoot]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tools/shoot.py#L101-L170
[skip]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/src/accretion/game.py#L537-L549
[source-diff]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L459-L475
[speed]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L526-L545
[storage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[text-loader]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tools/text.py
[text-tests]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/tests/test_text.py
[text-ui]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/app.js#L29-L57
[tracked-diff]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/accretion.html#L1085-L1090
[trimps]: https://steamcommunity.com/app/1877960/discussions/0/5281042383591273809/
[upgrades]: https://github.com/colodnerdata/accretion/blob/58dab485d1e3249541701328db3b07b362c351d8/web/engine.js#L204-L246
