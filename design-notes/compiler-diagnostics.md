# Compiler Diagnostics

## Summary

Recoverable compiler issues use `Diagnostic` from `pandacss_shared`. Fatal setup failures still use
`PandaError`/`Result`, so callers can distinguish "the operation failed" from "the operation completed with warnings
or source-level errors".

## Stable Codes

`Diagnostic.code` is a stable public API. Messages can become clearer over time, but codes should not be renamed or
removed without a compatibility plan.

Current codes:

- `compile_placeholder`
- `config_artifact_name_conflict`
- `config_breakpoint_units_mixed`
- `config_condition_selector_invalid`
- `config_token_circular_reference`
- `config_token_key_contains_space`
- `config_token_missing_reference`
- `config_token_missing_value`
- `config_token_nested_value`
- `config_token_self_reference`
- `config_token_unknown_reference`
- `js_parse_error`
- `static_css_patterns_unsupported`
- `static_css_recipes_missing_snapshot`
- `static_css_themes_unsupported`
- `static_css_wildcard_empty`
- `transform_callback_failed`

## Shape

Diagnostics serialize as camelCase fields:

- `code`: stable snake_case string
- `message`: human-readable text
- `severity`: `info`, `warning`, or `error`
- `span`: optional UTF-8 byte offsets
- `location`: optional 1-indexed UTF-16 line/column range

## Boundary

Rust crates should reuse the shared diagnostic type. JS/NAPI bindings may mirror the shape for `napi`, but conversion
must preserve `code`, `severity`, `span`, and `location`.

Config validation diagnostics are collected before typed config deserialization so malformed-but-readable config can
surface actionable warnings. Binding layers pass those diagnostics into `pandacss_project` instead of validating again,
which keeps project construction to one validation pass on the hot binding path.

## Related

- [atomic-encoding](./atomic-encoding.md)
- [crate-layering](./crate-layering.md)
