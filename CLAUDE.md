@AGENTS.md

Shared project rules live in AGENTS.md. This file keeps only what is specific
to Claude Code: the shell conventions and how the project's subagents work.

## Shell conventions

- Run each git step as its own command, or join steps with `&&` only when every step is covered by an allow rule in `.claude/settings.json`.
- Put scratch scripts, probe output and screenshots in `.scratch/` at the repo root. It is gitignored.
- To check a number or a boundary in the engine, write a pytest test, or a script in `.scratch/` run as a file. Prefer the test: it stays as a regression check.
- Take browser screenshots with `uv run python tools/shoot.py`.

## Working with agents

Project subagents live in `.claude/agents/`. They load this file but cannot see the main
conversation and cannot message each other, so the main session coordinates them: it delegates,
collects their reports, and decides what happens next.

### Roles and ownership

- **code-reviewer** reviews correctness, engine parity, conservation, determinism, tests, and
  `FIDELITY.md`.
- **ui-ux** reviews player experience, clarity, accessibility, and layout.
- **graphic-designer** (planned, not yet added) may edit `web/style.css`, `web/body.html`, and the
  canvas drawing code in `web/app.js` only. It never changes engine rules or physics.
- Only the main session or graphic-designer edits files. Reviewers only report.

### One editor at a time

Never run two editing agents at once. If parallel editing is ever needed, give each editor
`isolation: worktree`.

### Review order

After any change:

1. code-reviewer runs on engine or logic changes.
2. ui-ux runs on interface or visual changes.
3. code-reviewer runs last on any change that touched `web/app.js`, because visual code can still
   break behavior.

### Handoffs

Agents start with no context. Every delegation message states the goal, the files changed, what to
check, and what is out of scope.

### Findings format

Every finding gives severity (blocking, should fix, or minor), file and line, the problem, the
evidence, and a recommendation. Reviewers stay in their own lane. A concern that belongs to another
agent is noted briefly as "outside my area" and not investigated.

### Conflicts

Agents never overrule each other. When they disagree, such as a visual change that hurts clarity or
performance, the main session summarizes both sides and asks the user to decide.

### Protected decisions

No agent changes a decided mechanic, a design principle, or a Game rule versus physics label in
`FIDELITY.md` without flagging it to the user first.

### Shared guardrails

- Run the tests (`uv run poe check`) after any edit.
- Editors keep the build output current with `python tools/build.py` after editing any web source.
  Reviewers never build inside the repository; they build a scratch copy outside it.
- Never edit `web/accretion.html` directly.
