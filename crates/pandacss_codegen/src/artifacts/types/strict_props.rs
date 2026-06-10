//! Keyword unions for the v1 `strictPropertyList` — the css-native keyword-only
//! properties that `strictPropertyValues` narrows (see Panda v1
//! `packages/generator/src/artifacts/types/style-props.ts`).
//!
//! Sourced from csstype@3.2.3 `index.d.ts` by expanding each `Property.<Name>`
//! alias through its `DataType.*` unions — the same unions v1's generator read
//! from its vendored csstype. CSS-wide keywords (csstype `Globals`) are excluded
//! here; the generated alias adds the shared `Globals` type instead. `open`
//! marks unions that include csstype's `(string & {})` escape member
//! (multi-keyword properties such as `display` or `overflow`); v1 kept those
//! assignable from any string under `strictTokens` alone, so they only narrow
//! when `strictPropertyValues` is on.

pub(crate) struct StrictPropertyEntry {
    pub name: &'static str,
    pub keywords: &'static [&'static str],
    /// Whether the csstype union includes the `(string & {})` escape member.
    pub open: bool,
}

#[rustfmt::skip]
pub(crate) const STRICT_PROPERTIES: &[StrictPropertyEntry] = &[
    StrictPropertyEntry { name: "alignContent", open: true, keywords: &["baseline", "center", "end", "flex-end", "flex-start", "normal", "space-around", "space-between", "space-evenly", "start", "stretch"] },
    StrictPropertyEntry { name: "alignItems", open: true, keywords: &["anchor-center", "baseline", "center", "end", "flex-end", "flex-start", "normal", "self-end", "self-start", "start", "stretch"] },
    StrictPropertyEntry { name: "alignSelf", open: true, keywords: &["anchor-center", "auto", "baseline", "center", "end", "flex-end", "flex-start", "normal", "self-end", "self-start", "start", "stretch"] },
    StrictPropertyEntry { name: "all", open: false, keywords: &[] },
    StrictPropertyEntry { name: "animationComposition", open: true, keywords: &["accumulate", "add", "replace"] },
    StrictPropertyEntry { name: "animationDirection", open: true, keywords: &["alternate", "alternate-reverse", "normal", "reverse"] },
    StrictPropertyEntry { name: "animationFillMode", open: true, keywords: &["backwards", "both", "forwards", "none"] },
    StrictPropertyEntry { name: "appearance", open: false, keywords: &["auto", "button", "checkbox", "listbox", "menulist", "menulist-button", "meter", "none", "progress-bar", "radio", "searchfield", "textarea", "textfield"] },
    StrictPropertyEntry { name: "backfaceVisibility", open: false, keywords: &["hidden", "visible"] },
    StrictPropertyEntry { name: "backgroundAttachment", open: true, keywords: &["fixed", "local", "scroll"] },
    StrictPropertyEntry { name: "backgroundClip", open: true, keywords: &["border-area", "border-box", "content-box", "padding-box", "text"] },
    StrictPropertyEntry { name: "borderBlockEndStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderBlockStartStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderBlockStyle", open: true, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderBottomStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderCollapse", open: false, keywords: &["collapse", "separate"] },
    StrictPropertyEntry { name: "borderInlineEndStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderInlineStartStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderInlineStyle", open: true, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderLeftStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderRightStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "borderTopStyle", open: false, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "boxDecorationBreak", open: false, keywords: &["clone", "slice"] },
    StrictPropertyEntry { name: "boxSizing", open: false, keywords: &["border-box", "content-box"] },
    StrictPropertyEntry { name: "breakAfter", open: false, keywords: &["all", "always", "auto", "avoid", "avoid-column", "avoid-page", "avoid-region", "column", "left", "page", "recto", "region", "right", "verso"] },
    StrictPropertyEntry { name: "breakBefore", open: false, keywords: &["all", "always", "auto", "avoid", "avoid-column", "avoid-page", "avoid-region", "column", "left", "page", "recto", "region", "right", "verso"] },
    StrictPropertyEntry { name: "breakInside", open: false, keywords: &["auto", "avoid", "avoid-column", "avoid-page", "avoid-region"] },
    StrictPropertyEntry { name: "captionSide", open: false, keywords: &["bottom", "top"] },
    StrictPropertyEntry { name: "clear", open: false, keywords: &["both", "inline-end", "inline-start", "left", "none", "right"] },
    StrictPropertyEntry { name: "columnFill", open: false, keywords: &["auto", "balance"] },
    StrictPropertyEntry { name: "columnRuleStyle", open: true, keywords: &["dashed", "dotted", "double", "groove", "hidden", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "contentVisibility", open: false, keywords: &["auto", "hidden", "visible"] },
    StrictPropertyEntry { name: "direction", open: false, keywords: &["ltr", "rtl"] },
    StrictPropertyEntry { name: "display", open: true, keywords: &["-ms-flexbox", "-ms-grid", "-ms-inline-flexbox", "-ms-inline-grid", "-webkit-flex", "-webkit-inline-flex", "block", "contents", "flex", "flow", "flow-root", "grid", "inline", "inline-block", "inline-flex", "inline-grid", "inline-list-item", "inline-table", "list-item", "none", "ruby", "ruby-base", "ruby-base-container", "ruby-text", "ruby-text-container", "run-in", "table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row", "table-row-group"] },
    StrictPropertyEntry { name: "emptyCells", open: false, keywords: &["hide", "show"] },
    StrictPropertyEntry { name: "flexDirection", open: false, keywords: &["column", "column-reverse", "row", "row-reverse"] },
    StrictPropertyEntry { name: "flexWrap", open: false, keywords: &["nowrap", "wrap", "wrap-reverse"] },
    StrictPropertyEntry { name: "float", open: false, keywords: &["inline-end", "inline-start", "left", "none", "right"] },
    StrictPropertyEntry { name: "fontKerning", open: false, keywords: &["auto", "none", "normal"] },
    StrictPropertyEntry { name: "forcedColorAdjust", open: false, keywords: &["auto", "none", "preserve-parent-color"] },
    StrictPropertyEntry { name: "isolation", open: false, keywords: &["auto", "isolate"] },
    StrictPropertyEntry { name: "lineBreak", open: false, keywords: &["anywhere", "auto", "loose", "normal", "strict"] },
    StrictPropertyEntry { name: "mixBlendMode", open: false, keywords: &["color", "color-burn", "color-dodge", "darken", "difference", "exclusion", "hard-light", "hue", "lighten", "luminosity", "multiply", "normal", "overlay", "plus-darker", "plus-lighter", "saturation", "screen", "soft-light"] },
    StrictPropertyEntry { name: "objectFit", open: false, keywords: &["contain", "cover", "fill", "none", "scale-down"] },
    StrictPropertyEntry { name: "outlineStyle", open: false, keywords: &["auto", "dashed", "dotted", "double", "groove", "inset", "none", "outset", "ridge", "solid"] },
    StrictPropertyEntry { name: "overflow", open: true, keywords: &["-moz-hidden-unscrollable", "auto", "clip", "hidden", "overlay", "scroll", "visible"] },
    StrictPropertyEntry { name: "overflowBlock", open: false, keywords: &["auto", "clip", "hidden", "scroll", "visible"] },
    StrictPropertyEntry { name: "overflowInline", open: false, keywords: &["auto", "clip", "hidden", "scroll", "visible"] },
    StrictPropertyEntry { name: "overflowWrap", open: false, keywords: &["anywhere", "break-word", "normal"] },
    StrictPropertyEntry { name: "overflowX", open: false, keywords: &["-moz-hidden-unscrollable", "auto", "clip", "hidden", "overlay", "scroll", "visible"] },
    StrictPropertyEntry { name: "overflowY", open: false, keywords: &["-moz-hidden-unscrollable", "auto", "clip", "hidden", "overlay", "scroll", "visible"] },
    StrictPropertyEntry { name: "pointerEvents", open: false, keywords: &["all", "auto", "fill", "none", "painted", "stroke", "visible", "visibleFill", "visiblePainted", "visibleStroke"] },
    StrictPropertyEntry { name: "position", open: false, keywords: &["-webkit-sticky", "absolute", "fixed", "relative", "static", "sticky"] },
    StrictPropertyEntry { name: "resize", open: false, keywords: &["block", "both", "horizontal", "inline", "none", "vertical"] },
    StrictPropertyEntry { name: "scrollBehavior", open: false, keywords: &["auto", "smooth"] },
    StrictPropertyEntry { name: "touchAction", open: true, keywords: &["-ms-manipulation", "-ms-none", "-ms-pan-x", "-ms-pan-y", "-ms-pinch-zoom", "auto", "manipulation", "none", "pan-down", "pan-left", "pan-right", "pan-up", "pan-x", "pan-y", "pinch-zoom"] },
    StrictPropertyEntry { name: "transformBox", open: false, keywords: &["border-box", "content-box", "fill-box", "stroke-box", "view-box"] },
    StrictPropertyEntry { name: "transformStyle", open: false, keywords: &["flat", "preserve-3d"] },
    StrictPropertyEntry { name: "userSelect", open: false, keywords: &["-moz-none", "all", "auto", "none", "text"] },
    StrictPropertyEntry { name: "visibility", open: false, keywords: &["collapse", "hidden", "visible"] },
    StrictPropertyEntry { name: "wordBreak", open: false, keywords: &["auto-phrase", "break-all", "break-word", "keep-all", "normal"] },
    StrictPropertyEntry { name: "writingMode", open: false, keywords: &["horizontal-tb", "sideways-lr", "sideways-rl", "vertical-lr", "vertical-rl"] },
];

pub(crate) fn strict_property_entry(property: &str) -> Option<&'static StrictPropertyEntry> {
    STRICT_PROPERTIES
        .binary_search_by(|entry| entry.name.cmp(property))
        .ok()
        .map(|index| &STRICT_PROPERTIES[index])
}
