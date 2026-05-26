# Forge 1.3.0

Forge 1.3.0 adds a dedicated Shape Health dashboard section and splits Shape Lint from the general Vault Lint workflow.

---

## What changed

### Shape Health dashboard section

The Vault Health Dashboard now includes a Shape Health card for structural Shape/template issues. It reports:

- files scanned
- total Shape issues
- missing headings
- heading order issues
- extra headings
- empty sections

Shape issues are listed separately from general Active Issues and include Open actions for affected files.

### Separate Shape Lint workflow

Forge now has a dedicated `Forge: Run Shape Lint` command backed by a Shape Lint service. Shape lint results are cached independently from Vault Lint results.

Vault Lint continues to report general vault/schema/frontmatter/metadata issues. Shape Lint reports structural heading/template drift.

### Shape Lint exports

Shape Lint writes its own artifacts:

- `System/Exports/shape-lint-report.json`
- `System/Exports/ShapeLintReports/shape-lint-run-{timestamp}.md`

### Dashboard refresh behavior

Manual dashboard refresh runs Shape Lint only when Shape lint is enabled in settings. Existing cached Shape Lint results are shown when available.

---

## Scope notes

Shape Health is read-only. It does not run Shape Repair or mutate notes.
