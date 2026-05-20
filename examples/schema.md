This is a small example schema. Copy the YAML block into your real schema note if you want a starter contract.

> Locations are built dynamically based on the Settings of Forge. To update, either manually edit the file, or delete and Install Documentation to build new notes.

Configured schema location:

```text
{{schemaFile}}
```

# Schema

```yaml
meta:
  author: vault
  schemaRef: "{{schemaFile}}"

required_fields:
  - name: type
    type: enum
    values:
      - reference
      - procedure
      - project
      - concept
    severity: error

  - name: status
    type: enum
    values: [draft, active, complete, archived]
    severity: error

  - name: tags
    type: list
    min_items: 1
    severity: error

  - name: created
    type: date
    format: "yyyy-MM-dd"
    severity: error

  - name: updated
    type: date
    format: "yyyy-MM-dd"
    severity: warning

  - name: ai_private
    type: boolean
    severity: warning

  - name: review_cycle
    type: enum
    values: [1, 3, 6, 12, never]
    severity: error

optional_fields: []

inline_fields:
  - source
  - version
  - schema_version
  - errors
  - warnings

tag_rules:
  require_namespace: true
  unknown_tags: warning
  severity: warning
  allowed_namespaces:
    - meta
    - skill
    - tool
    - topic

exempt_paths: []
```
