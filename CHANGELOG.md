# 0.4.6

## Added

- `move_note` frontmatter merge support
- `move_note` frontmatter stripping support

## Improved

- Patch operation documentation
- `move_note` workflow flexibility
- Inbox-to-workflow note staging support
- Centralized exempt path handling through `buildExemptList()`

## Changed

- Removed `import_note` patch operation
- `move_note` now operates on any vault path, including `System/`
- `move_note` now supports optional frontmatter mutation during move operations
- Commands now use shared exempt path resolution instead of manually merging schema and internal exclusions

## Removed

- `import_note` patch operation documentation

---

# 0.4.5

## Added

- Vault-native operational documentation
- Schema validation workflows
- Patch reports and restore manifests
- Lint run reporting
- Import note patch operation
- Normalize frontmatter command

## Improved

- Community plugin readiness
- README and onboarding documentation
- Patch operation documentation
- Lint output formatting
- Settings organization
- Screenshot coverage

## Changed

- Renamed `LintRuns` to `LintReports`
- Removed generated `config.md`
- Improved patch workflow visibility