use pandacss_shared::{capitalize, number_to_js_string};

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
