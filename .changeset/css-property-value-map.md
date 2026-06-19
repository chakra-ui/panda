---
'@pandacss/compiler': patch
---

Improve generated CSS property value types from a unified property registry.

- Emit a unified `SystemProperties` interface (native CSS props plus utility overrides) and composite aliases (`LengthValue`, `ColorCssValue`, `NumericCssValue`, `ZIndexValue`, plus `BgSizeValue`, `FontSizeValue`, `FontWeightValue`, `LineWidthValue`, `PositionValue`, `FontFamilyValue`)
- Sync csstype `DataType.*` literals (`NamedColor`, `SystemColor`, `GenericFamily`, …) via `data_type.rs`
- Keyword props use `PropertyValueKind::Keywords`; length/color/numeric props use composite kinds
- Regenerate the registry with `crates/pandacss_codegen/scripts/sync_strict_props.py --write`
- Utility shorthands (`bg`, `bgColor`, `color`, …) union `PropertyValueMap[mapped-prop]` on `SystemProperties` when `strictTokens` is off (v1 `cssFallback` parity)
- Keyframe steps are typed as `SystemStyleObject` and lowered through the same utility/token pipeline as global CSS
