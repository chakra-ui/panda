use std::borrow::Cow;

use pandacss_shared::{class_value, is_js_whitespace, sanitize_style_value};

#[test]
fn unquoted_whitespace_runs_collapse_to_one_space() {
    assert_eq!(sanitize_style_value("1px  solid \t\n red"), "1px solid red");
}

#[test]
fn grid_template_areas_keep_their_quoted_spacing() {
    assert_eq!(
        sanitize_style_value("\n  \"col1  col2\"\n  \"col3 col4\"\n"),
        " \"col1  col2\" \"col3 col4\" "
    );
}

#[test]
fn content_strings_keep_tabs_and_newlines() {
    assert_eq!(sanitize_style_value("'a\tb\nc'"), "'a\tb\nc'");
}

#[test]
fn a_clean_value_is_borrowed() {
    assert!(matches!(
        sanitize_style_value("1px solid red"),
        Cow::Borrowed(_)
    ));
}

#[test]
fn class_values_collapse_quoted_whitespace_like_the_runtime() {
    assert_eq!(
        class_value("\n  \"col1  col2\"\n  \"col3 col4\"\n"),
        "\"col1_col2\"_\"col3_col4\""
    );
}

#[test]
fn class_values_never_contain_whitespace() {
    assert_eq!(class_value("\"a\tb\" \"c\u{a0}d\""), "\"a_b\"_\"c_d\"");
}

#[test]
fn whitespace_matches_javascript_not_unicode() {
    assert!(is_js_whitespace('\u{feff}'));
    assert!(!is_js_whitespace('\u{85}'));
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Case {
    name: String,
    value: String,
    sanitized: String,
    class_value: String,
}

/// The runtime parity test in `packages/compiler` reads the same file.
#[test]
fn every_shared_fixture_value_has_the_expected_css_and_class_value() {
    let cases: Vec<Case> =
        serde_json::from_str(include_str!("fixtures/style-values.json")).expect("valid fixture");
    for case in cases {
        let sanitized = sanitize_style_value(&case.value);
        assert_eq!(sanitized, case.sanitized, "{}", case.name);
        assert_eq!(class_value(&case.value), case.class_value, "{}", case.name);
    }
}
