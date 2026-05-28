# Forge 1.5.1

Forge 1.5.1 extends Vault Maintenance to cover Shape Lint and Shape Repair artifacts.

## What changed

- Vault Maintenance now trims old Shape Lint run notes in `System/Exports/ShapeLintReports`.
- Vault Maintenance now trims Shape Repair history entries in `shape-repair-history.json`.
- Vault Maintenance now trims old Shape Repair run notes in the configured Shape Repair runs folder.
- Added a Maintenance setting for Shape Lint run retention.
- Shape Repair maintenance reuses the existing Shape Repair history retention setting for both history entries and run notes.

## Compatibility

- The latest `shape-lint-report.json` is preserved.
- Existing maintenance, lint, patch, dashboard, and shape workflows are otherwise unchanged.
- No user migration is required.
