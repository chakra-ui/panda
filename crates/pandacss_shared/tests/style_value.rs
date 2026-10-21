use std::borrow::Cow;

use pandacss_shared::{is_js_whitespace, sanitize_style_value, without_space};

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
fn class_values_never_contain_whitespace() {
    assert_eq!(without_space("\"a\tb\"_\"c\u{a0}d\""), "\"a_b\"_\"c_d\"");
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

/// The generated runtime's parity test reads the same file, so both sides follow one list.
#[test]
fn every_shared_fixture_sanitizes_and_names_like_the_runtime() {
    let cases: Vec<Case> =
        serde_json::from_str(include_str!("fixtures/style-values.json")).expect("valid fixture");
    for case in cases {
        let sanitized = sanitize_style_value(&case.value);
        assert_eq!(sanitized, case.sanitized, "{}", case.name);
        assert_eq!(
            without_space(sanitized.trim()),
            case.class_value,
            "{}",
            case.name
        );
    }
}
