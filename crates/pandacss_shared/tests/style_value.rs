use std::borrow::Cow;

use pandacss_shared::{class_value, is_js_whitespace, sanitize_style_value};

#[test]
fn unquoted_whitespace_runs_collapse_to_one_space() {
    assert_eq!(sanitize_style_value("1px  solid   red"), "1px solid red");
    assert_eq!(class_value("1px  solid   red"), "1px_solid_red");
}

#[test]
fn tabs_and_newlines_collapse() {
    assert_eq!(sanitize_style_value("1rem\t\n 2rem"), "1rem 2rem");
    assert_eq!(class_value("1rem\t\n 2rem"), "1rem_2rem");
}

#[test]
fn grid_template_areas_keep_quoted_spacing_in_css_only() {
    let value = "\"col1  col2\" \"col3 col4\"";
    assert_eq!(sanitize_style_value(value), value);
    assert_eq!(class_value(value), "\"col1_col2\"_\"col3_col4\"");
}

#[test]
fn multi_line_grid_template_areas() {
    let value = "\n  \"col1  col2\"\n  \"col3 col4\"\n";
    assert_eq!(
        sanitize_style_value(value),
        " \"col1  col2\" \"col3 col4\" "
    );
    assert_eq!(class_value(value), "\"col1_col2\"_\"col3_col4\"");
}

#[test]
fn a_tab_inside_quotes_stays_in_css_and_becomes_an_underscore_in_the_class() {
    assert_eq!(sanitize_style_value("\"a\tb\""), "\"a\tb\"");
    assert_eq!(class_value("\"a\tb\""), "\"a_b\"");
}

#[test]
fn content_in_single_quotes_keeps_its_spacing() {
    assert_eq!(sanitize_style_value("'a  b'"), "'a  b'");
    assert_eq!(class_value("'a  b'"), "'a_b'");
}

#[test]
fn content_with_a_function_keeps_quoted_spacing() {
    let value = "attr(title)  \"  x  \"";
    assert_eq!(sanitize_style_value(value), "attr(title) \"  x  \"");
    assert_eq!(class_value(value), "attr(title)_\"_x_\"");
}

#[test]
fn an_unterminated_quote_keeps_the_rest_as_written() {
    assert_eq!(sanitize_style_value("\"open  run"), "\"open  run");
    assert_eq!(class_value("\"open  run"), "\"open_run");
}

#[test]
fn no_break_spaces_collapse() {
    assert_eq!(sanitize_style_value("1px\u{a0}\u{a0}solid"), "1px solid");
    assert_eq!(class_value("1px\u{a0}\u{a0}solid"), "1px_solid");
}

#[test]
fn line_separators_and_byte_order_marks_collapse_like_javascript() {
    assert_eq!(sanitize_style_value("a\u{2028}b"), "a b");
    assert_eq!(sanitize_style_value("a\u{feff}b"), "a b");
    assert_eq!(class_value("a\u{feff}b"), "a_b");
}

#[test]
fn next_line_is_not_javascript_whitespace() {
    assert!(!is_js_whitespace('\u{85}'));
    assert_eq!(sanitize_style_value("a\u{85}b"), "a\u{85}b");
    assert_eq!(class_value("a\u{85}b"), "a\u{85}b");
}

#[test]
fn important_keeps_one_space_before_it() {
    assert_eq!(
        sanitize_style_value("1rem  2rem  !important"),
        "1rem 2rem !important"
    );
}

#[test]
fn a_clean_value_is_borrowed() {
    assert!(matches!(
        sanitize_style_value("1px solid red"),
        Cow::Borrowed(_)
    ));
    assert_eq!(class_value("1px solid red"), "1px_solid_red");
}
