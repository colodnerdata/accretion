# Decisions

Record the choices future-you or a coding assistant might otherwise repeat.
Add an entry when a decision affects interfaces, architecture, dependencies,
data formats, verification, or a meaningful constraint. Keep entries short.

Preserve the original reasoning when a decision changes. Mark the old entry
superseded and link to the new one. Record rejected alternatives when the
reason is likely to be useful again. Search by mechanism before proposing a
design change.

## Entry pattern

- **Date and title:** YYYY-MM-DD — the decision in a few words.
- **Status:** accepted, rejected, deferred, or superseded (with a link).
- **Context:** the problem and constraint.
- **Decision:** what we chose.
- **Why:** the tradeoff and important alternative.
- **Revisit when:** evidence or a changed condition that would alter the choice.

## Entries

- **Date and title:** 2026-11-08 — Game text lives in content TOML tables, embedded at build time.
- **Status:** accepted
- **Context:** All player-facing text was string literals scattered through
  `web/app.js`, so every wording change touched UI code and none of it was
  reviewable in one place. The text also needs banned-word and tier-structure
  checks that cannot run on scattered literals.
- **Decision:** Five files under `content/` (`ui`, `hints`, `notes`, `endings`,
  `voice`) hold every player-facing string, keyed `$file.table.subkey`.
  Sentence branches become separate full-sentence entries. Computed values are
  named placeholders (`{brightness}`) filled by the call site, which keeps all
  formatting in code. The build validates the tables (one optional metadata
  field, `kind`) and embeds only their text as a JSON object before
  `web/app.js`; the page reads them through `t(key, values)`. `voice.toml` is
  reserved for a future narrator and holds no entries.
- **Why:** Build-time embedding keeps the single-file page self-contained and
  offline, and lets the build fail on duplicate keys and malformed
  placeholders before anything ships. Alternative loaders considered: runtime
  `fetch` of the TOML (breaks the offline single-file deliverable) and
  generating JavaScript per-file (duplicates validation). The `kind` field is
  the only metadata now because it maps to the teaching tiers in
  `docs/planning/teaching-principles.md`; adding more means one list in
  `tools/text.py`. This required `requires-python >= 3.11` for stdlib
  `tomllib` (CI runs 3.12, `.python-version` pins 3.12).
- **Revisit when:** Text becomes per-locale or player-authored (embedding may
  need versioning), or a second metadata field is needed (extend
  `ALLOWED_FIELDS` and update `tests/test_text.py`).
