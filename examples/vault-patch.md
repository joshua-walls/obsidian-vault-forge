This is an example patch note.

Copy this structure to:

```text
{{patchFile}}
```

# Patch

```yaml
meta:
  description: Activate Home note

operations:
  - op: set_field
    target: "Home.md"
    field: status
    value: active

  - op: add_tag
    target: "Home.md"
    tag: topic/home

  - op: normalize_tags
    target_pattern: "Projects/**/*.md"

  - op: sort_frontmatter
    target_pattern: "Notes/**/*.md"
```

# Notes

Forge reads only the fenced YAML block for operations. The rest of this note is for humans.
