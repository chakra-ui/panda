use std::borrow::Cow;

use pandacss_shared::{is_important, without_important};

#[test]
fn strips_bang_important_marker() {
    assert!(is_important("red !important"));
    assert_eq!(without_important("red !important").as_ref(), "red");
    assert_eq!(without_important("red!important").as_ref(), "red");
    assert_eq!(without_important("red !IMPORTANT").as_ref(), "red");
}

#[test]
fn strips_bang_marker() {
    assert!(is_important("red!"));
    assert_eq!(without_important("red!").as_ref(), "red");
    assert_eq!(without_important("red !").as_ref(), "red");
}

#[test]
fn returns_borrowed_when_marker_is_absent() {
    let value = "red";
    assert!(!is_important(value));
    assert!(matches!(without_important(value), Cow::Borrowed("red")));
}

#[test]
fn ignores_a_bang_inside_the_value() {
    let value = r#""hello!""#;
    assert!(!is_important(value));
    assert!(matches!(
        without_important(value),
        Cow::Borrowed(r#""hello!""#)
    ));

    assert!(is_important(r#""hello!" !important"#));
    assert_eq!(
        without_important(r#""hello!" !important"#).as_ref(),
        r#""hello!""#
    );
}
