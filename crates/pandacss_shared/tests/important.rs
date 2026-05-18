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
