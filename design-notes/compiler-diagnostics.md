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
- `deprecated_token_used`
- `deprecated_utility_used`
- `invalid_color_opacity_modifier`
- `js_parse_error`
- `layer_name_collision`
- `panda_call_unextractable`
- `static_css_pattern_missing_transform`
- `static_css_pattern_unknown`
- `static_css_property_unknown`
- `static_css_recipe_unknown`
- `static_css_recipe_variant_unknown`
- `static_css_recipe_variant_value_unknown`
- `static_css_recipes_missing_snapshot`
- `static_css_token_reference_unknown`
- `static_css_wildcard_large`
- `static_css_wildcard_empty`
- `token_dictionary_build_failed`
- `transform_callback_failed`
- `unknown_condition`

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

Prefer emitting diagnostics at the layer that owns the facts:

- The extractor owns source-level issues with spans, such as parse errors and direct Panda calls that cannot be
  statically extracted.
- The project owns diagnostics that require compiled project state, such as deprecated utility use and transform
  callback failures.
- The stylesheet owns CSS generation diagnostics, including static CSS authoring issues and unsupported stylesheet
  modes.

`panda_call_unextractable` is intentionally narrow. It is emitted only for direct Panda calls whose arguments are all
dynamic enough that no static CSS can be generated for that call. It is disabled when `jsxFramework` is configured,
because component APIs commonly forward style objects through props (`css`, `inputCss`, etc.) and those patterns are too
ambiguous to warn on reliably. JSX import-map entries or recipe component names alone should not suppress it. The
message should describe extraction behavior, not claim the user's runtime code is invalid.

`transform_callback_failed` should include the callback target when available, such as the utility/pattern name and the
value being transformed. This keeps JS callback failures actionable without requiring the host to reconstruct the Rust
call site.

## Related

- [atomic-encoding](./atomic-encoding.md)
- [crate-layering](./crate-layering.md)
