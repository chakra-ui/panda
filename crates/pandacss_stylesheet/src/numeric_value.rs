use pandacss_shared::{hyphenate_property, number_to_js_string};

pub(crate) fn format_number(prop: &str, value: f64) -> String {
    format_number_str(prop, &number_to_js_string(value))
}

pub(crate) fn format_number_str(prop: &str, value: &str) -> String {
    if value == "0" || prop.starts_with("--") || is_unitless_property(prop) {
        value.to_owned()
    } else {
        format!("{value}px")
    }
}

pub(crate) fn is_unitless_property(prop: &str) -> bool {
    let prop = hyphenate_property(prop);
    matches!(
        prop.as_str(),
        "animation-iteration-count"
            | "aspect-ratio"
            | "border-image-outset"
            | "border-image-slice"
            | "border-image-width"
            | "box-flex"
            | "box-flex-group"
            | "box-ordinal-group"
            | "column-count"
            | "columns"
            | "flex"
            | "flex-grow"
            | "flex-positive"
            | "flex-shrink"
            | "flex-negative"
            | "flex-order"
            | "grid-row"
            | "grid-row-end"
            | "grid-row-span"
            | "grid-row-start"
            | "grid-column"
            | "grid-column-end"
            | "grid-column-span"
            | "grid-column-start"
            | "ms-grid-row"
            | "ms-grid-row-span"
            | "ms-grid-column"
            | "ms-grid-column-span"
            | "font-weight"
            | "line-clamp"
            | "line-height"
            | "opacity"
            | "order"
            | "orphans"
            | "scale"
            | "tab-size"
            | "widows"
            | "z-index"
            | "zoom"
            | "-webkit-line-clamp"
            | "fill-opacity"
            | "flood-opacity"
            | "stop-opacity"
            | "stroke-dasharray"
            | "stroke-dashoffset"
            | "stroke-miterlimit"
            | "stroke-opacity"
            | "stroke-width"
    )
}
