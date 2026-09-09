//! Parsing the `firstThatWorks(a, b)` value form.

use pandacss_shared::{is_first_that_works_value, parse_first_that_works_value};

#[test]
fn parses_a_two_member_run() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(75%, min(60rem, 100%))"),
        Some(vec!["75%", "min(60rem, 100%)"])
    );
}

#[test]
fn keeps_commas_nested_in_parentheses_inside_one_member() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(red, color-mix(in oklch, red, blue))"),
        Some(vec!["red", "color-mix(in oklch, red, blue)"])
    );
}

#[test]
fn keeps_commas_inside_brackets_and_quotes_inside_one_member() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks([a, b], 'c, d')"),
        Some(vec!["[a, b]", "'c, d'"])
    );
}

#[test]
fn parses_a_three_member_run() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(a, b, c)"),
        Some(vec!["a", "b", "c"])
    );
}

#[test]
fn tolerates_surrounding_and_inner_whitespace() {
    assert_eq!(
        parse_first_that_works_value("  firstThatWorks( 75% ,  100%  ) "),
        Some(vec!["75%", "100%"])
    );
}

#[test]
fn rejects_a_single_member() {
    assert_eq!(parse_first_that_works_value("firstThatWorks(red)"), None);
}

#[test]
fn rejects_an_empty_run() {
    assert_eq!(parse_first_that_works_value("firstThatWorks()"), None);
}

#[test]
fn rejects_unbalanced_nesting() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(red, blue"),
        None
    );
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(min(1px, 2px), b"),
        None
    );
}

#[test]
fn rejects_an_unterminated_quote() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(red, 'blue)"),
        None
    );
}

#[test]
fn rejects_an_ordinary_css_function() {
    assert_eq!(parse_first_that_works_value("min(60rem, 100%)"), None);
    assert_eq!(
        parse_first_that_works_value("color-mix(in oklch, red, blue)"),
        None
    );
}

#[test]
fn rejects_a_value_that_merely_starts_with_the_name() {
    assert_eq!(parse_first_that_works_value("fallbacks(a, b)"), None);
    assert!(!is_first_that_works_value("fallbackish(a, b)"));
}

#[test]
fn recognizes_the_form_case_insensitively() {
    assert!(is_first_that_works_value("FIRSTTHATWORKS(a, b)"));
    assert!(is_first_that_works_value("firstThatWorks (a, b)"));
}

#[test]
fn rejects_a_run_nested_in_the_first_member() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(firstThatWorks(a, b), c)"),
        None
    );
}

#[test]
fn rejects_a_run_nested_in_a_later_member() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(a, firstThatWorks(b, c))"),
        None
    );
}

#[test]
fn rejects_a_run_nested_case_insensitively() {
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(a, FIRSTTHATWORKS(b, c))"),
        None
    );
}

#[test]
fn allows_a_member_that_merely_contains_the_name_deeper_in() {
    // Only a member that *is* a run composes; one that mentions it does not.
    assert_eq!(
        parse_first_that_works_value("firstThatWorks(a, var(--fallback-color, b))"),
        Some(vec!["a", "var(--fallback-color, b)"])
    );
}
