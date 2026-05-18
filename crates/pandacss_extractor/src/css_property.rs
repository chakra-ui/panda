use crate::generated::css_properties::CSS_PROPERTIES;

#[must_use]
pub fn is_css_property(prop: &str) -> bool {
    prop.starts_with("--")
        || prop.contains('&')
        || prop.contains('@')
        || CSS_PROPERTIES.binary_search(&prop).is_ok()
}

#[must_use]
pub fn css_property_names() -> &'static [&'static str] {
    CSS_PROPERTIES
}
