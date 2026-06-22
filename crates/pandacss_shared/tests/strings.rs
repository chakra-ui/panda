use pandacss_shared::{
    capitalize, closest_match, find_matching_paren, hyphenate_property, number_to_js_string,
};

#[test]
fn numbers_use_js_integer_format_inside_safe_range() {
    assert_eq!(number_to_js_string(12.0), "12");
    assert_eq!(number_to_js_string(12.5), "12.5");
}

#[test]
fn capitalizes_first_scalar() {
    assert_eq!(capitalize("button").as_ref(), "Button");
    assert_eq!(capitalize("Button").as_ref(), "Button");
    assert_eq!(capitalize("").as_ref(), "");
}

#[test]
fn hyphenate_property_lowercases_camel_case() {
    assert_eq!(hyphenate_property("backgroundColor"), "background-color");
}

#[test]
fn hyphenate_property_special_cases_ms_vendor_prefix() {
    // A leading `ms` segment becomes `-ms-`; other vendor prefixes keep their
    // plain hyphenation.
    assert_eq!(hyphenate_property("msTransform"), "-ms-transform");
    assert_eq!(hyphenate_property("MozAppearance"), "-moz-appearance");
    assert_eq!(hyphenate_property("WebkitTransform"), "-webkit-transform");
}

#[test]
fn hyphenate_property_preserves_custom_properties() {
    assert_eq!(hyphenate_property("--shadow-color"), "--shadow-color");
}

#[test]
fn find_matching_paren_locates_the_closing_paren() {
    // `value` starts just after the opening `(`.
    assert_eq!(find_matching_paren("a, b)"), Some(4));
}

#[test]
fn find_matching_paren_skips_balanced_nested_groups() {
    assert_eq!(find_matching_paren("rgb(1 2 3) x)"), Some(12));
}

#[test]
fn find_matching_paren_returns_none_when_unclosed() {
    assert_eq!(find_matching_paren("a, b"), None);
}

#[test]
fn closest_match_suggests_a_near_miss() {
    assert_eq!(
        closest_match("_hovr", ["_hover", "_focus", "_active"]),
        Some("_hover")
    );
}

#[test]
fn closest_match_returns_none_when_nothing_is_close() {
    assert_eq!(closest_match("_zzz", ["_hover", "_focus"]), None);
}

#[test]
fn closest_match_prefers_the_smallest_distance() {
    // "_hoer" is distance 1 from "_hover", 2 from "_focus".
    assert_eq!(closest_match("_hoer", ["_focus", "_hover"]), Some("_hover"));
}
