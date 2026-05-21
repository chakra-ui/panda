use pandacss_shared::{capitalize, dash_case, escape_css_var_name, number_to_js_string};

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
fn dash_cases_uppercase_ascii() {
    assert_eq!(dash_case("-fontSizes-sm"), "-font-sizes-sm");
    assert_eq!(dash_case("-colors-red-500"), "-colors-red-500");
}

#[test]
fn escapes_css_var_names_like_js() {
    assert_eq!(escape_css_var_name("colors.red/500"), "colors\\.red\\/500");
    assert_eq!(escape_css_var_name("spacing-sm"), "spacing-sm");
}
