---
title: Design-system spec artifact
status: current
scope:
  - crates/pandacss_config
  - crates/pandacss_project
  - packages/compiler-shared
  - packages/compiler
  - packages/compiler-wasm
  - packages/cli
related:
  - design-system-manifest.md
  - output-and-host-layer.md
---

# Design-system spec artifact

## Summary

`compiler.spec()` is the canonical, versioned description of a resolved Panda design system. `panda spec` writes that
value to `spec.json`, and `panda lib` publishes the same value at `panda/spec.json` for tools that consume a design
system from another package.

The spec serves two jobs:

1. The existing type-data fields support Panda's editor, lint, and codegen queries.
2. `catalog` preserves the resolved definitions needed by documentation, design-system catalogs, and external adapters.

Both views come from one compiler-owned model. Hosts write the serialized value but do not reconstruct it.

## The wire contract

Every spec includes `schemaVersion`. Version 1 keeps the existing type-data fields and adds a definition catalog:

```jsonc
{
  "schemaVersion": 1,
  "options": { "strictTokens": false, "strictPropertyValues": false, "jsxStyleProps": "all" },
  "conditions": { "keys": [], "breakpoints": [], "containers": [] },
  "selectors": { "selectors": [], "arbitrary": [] },
  "tokens": { "categories": {}, "colorPalettes": [], "values": {}, "deprecated": {} },
  "utilities": { "properties": {}, "shorthands": {}, "deprecated": {}, "aliases": {}, "classNames": {} },
  "recipes": {},
  "slotRecipes": {},
  "patterns": {},
  "propertyOrder": [],
  "catalog": {
    "conditions": {},
    "tokens": {},
    "recipes": {},
    "slotRecipes": {},
    "patterns": {},
    "keyframes": {},
    "textStyles": {},
    "layerStyles": {},
    "animationStyles": {},
    "viewTransitions": {},
    "positionTry": {},
    "themes": {},
  },
}
```

The type-data fields are compact indexes. The catalog is the richer JSON-safe definition layer:

- Conditions keep their resolved query, including nested condition objects.
- Tokens are grouped by path. Each entry records its category, CSS variable, semantic-token identity, and ordered
  conditional values. Resolved values and authored references are both available.
- Recipes and slot recipes include styles, variants, defaults, compounds, static CSS selections, JSX names,
  deprecations, and JSON-safe metadata.
- Patterns include their public property definitions, static defaults, JSX settings, and flags for dynamic defaults and
  transforms.
- Keyframes, composition styles, view transitions, position try definitions, and named themes retain their resolved
  values.

Named catalog entries use sorted keys. Token values put the base value first, followed by conditions in lexical order.
Nested style objects preserve their resolved config order because declaration order can affect CSS semantics. The same
resolved config therefore serializes to identical JSON.

## Dynamic config stays out of the artifact

Config bundling replaces JavaScript callbacks with callback references for the Rust boundary. The public spec does not
publish callback identifiers or function bodies. A pattern reports `hasDynamicDefaultValues` and `hasTransform` so a
consumer knows that static JSON is incomplete without depending on host code.

This rule keeps `spec.json` portable and avoids treating executable config as data. A future feature that needs callback
results must define a separate evaluated-data contract.

## Ownership and output

The layers follow the existing compiler boundary:

| Layer                    | Responsibility                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `pandacss_config`        | Serializable spec types and `SPEC_SCHEMA_VERSION`                                      |
| `pandacss_project`       | Build the complete spec from the resolved config and token dictionary                  |
| stylesheet               | Supply canonical property ordering without creating a project-to-stylesheet dependency |
| native and wasm bindings | Serialize the same Rust value                                                          |
| TypeScript host          | Write `spec.json` and expose public TypeScript types                                   |
| CLI                      | Choose the output path and render command diagnostics                                  |

`panda spec` writes `<configured outdir>/specs/spec.json` by default. `--outdir` selects another directory and
`--minify` removes formatting. `panda lib` writes `dist/panda/spec.json` and links it from `panda/lib.json` as `spec`.

The library artifact contains the fully resolved design system, including inherited presets and parent design systems.
This makes the published spec self-contained for registries and documentation tools. It does not change build-info
hydration or the config chain used by Panda consumers.

## Versioning and adapters

Consumers must inspect `schemaVersion` before reading the artifact. Additive fields can remain within version 1. A
removed field, renamed field, or changed field meaning requires a new schema version.

Adapters belong outside the compiler. They can map this stable model to DESIGN.md, uSpec, an MCP resource, or another
catalog format without adding those formats or vendors to Panda. Recipe and pattern metadata give design-system authors
a small JSON-safe extension point; Panda does not interpret adapter-specific keys.

## Non-goals

- Preserve the v1 spec byte-for-byte.
- Publish source files or executable config callbacks.
- Infer application-level component compositions from source usage.
- Add Figma, MCP, DESIGN.md, or another external format to the compiler.
- Make `spec.json` part of CSS generation or runtime behavior.
