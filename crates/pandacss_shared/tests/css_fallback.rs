//! Parsing the `fallback(a, b)` value form.

use pandacss_shared::{is_fallback_value, parse_fallback_value};

#[test]
fn parses_a_two_member_run() {
    assert_eq!(
        parse_fallback_value("fallback(75%, min(60rem, 100%))"),
        Some(vec!["75%", "min(60rem, 100%)"])
    );
}

#[test]
fn keeps_commas_nested_in_parentheses_inside_one_member() {
    assert_eq!(
        parse_fallback_value("fallback(red, color-mix(in oklch, red, blue))"),
        Some(vec!["red", "color-mix(in oklch, red, blue)"])
    );
}

#[test]
fn keeps_commas_inside_brackets_and_quotes_inside_one_member() {
    assert_eq!(
        parse_fallback_value("fallback([a, b], 'c, d')"),
        Some(vec!["[a, b]", "'c, d'"])
    );
}

#[test]
fn parses_a_three_member_run() {
    assert_eq!(
        parse_fallback_value("fallback(a, b, c)"),
        Some(vec!["a", "b", "c"])
    );
}

#[test]
fn tolerates_surrounding_and_inner_whitespace() {
    assert_eq!(
        parse_fallback_value("  fallback( 75% ,  100%  ) "),
        Some(vec!["75%", "100%"])
    );
}

#[test]
fn rejects_a_single_member() {
    assert_eq!(parse_fallback_value("fallback(red)"), None);
}

#[test]
fn rejects_an_empty_run() {
    assert_eq!(parse_fallback_value("fallback()"), None);
}

#[test]
fn rejects_unbalanced_nesting() {
    assert_eq!(parse_fallback_value("fallback(red, blue"), None);
    assert_eq!(parse_fallback_value("fallback(min(1px, 2px), b"), None);
}

#[test]
fn rejects_an_unterminated_quote() {
    assert_eq!(parse_fallback_value("fallback(red, 'blue)"), None);
}

#[test]
fn rejects_an_ordinary_css_function() {
    assert_eq!(parse_fallback_value("min(60rem, 100%)"), None);
    assert_eq!(parse_fallback_value("color-mix(in oklch, red, blue)"), None);
}

#[test]
fn rejects_a_value_that_merely_starts_with_the_name() {
    assert_eq!(parse_fallback_value("fallbacks(a, b)"), None);
    assert!(!is_fallback_value("fallbackish(a, b)"));
}

#[test]
fn recognizes_the_form_case_insensitively() {
    assert!(is_fallback_value("FALLBACK(a, b)"));
    assert!(is_fallback_value("fallback (a, b)"));
}

#[test]
fn rejects_a_run_nested_in_the_first_member() {
    assert_eq!(parse_fallback_value("fallback(fallback(a, b), c)"), None);
}

#[test]
fn rejects_a_run_nested_in_a_later_member() {
    assert_eq!(parse_fallback_value("fallback(a, fallback(b, c))"), None);
}

#[test]
fn rejects_a_run_nested_case_insensitively() {
    assert_eq!(parse_fallback_value("fallback(a, FALLBACK(b, c))"), None);
}

#[test]
fn allows_a_member_that_merely_contains_the_name_deeper_in() {
    // Only a member that *is* a run composes; one that mentions it does not.
    assert_eq!(
        parse_fallback_value("fallback(a, var(--fallback-color, b))"),
        Some(vec!["a", "var(--fallback-color, b)"])
    );
}
