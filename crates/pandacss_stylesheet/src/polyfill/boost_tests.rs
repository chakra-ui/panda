//! Boost placement and ID counts for every selector shape the polyfill handles.
//! Boosts match v1's polyfill one layer up, with repeated `:not(#\#)` written as
//! one compact `:not(#\##\#)`.

#![allow(clippy::too_many_lines, reason = "one assertion per selector shape")]

use super::{adjust_selector_specificity, count_id_selectors};

fn boosted(selector: &str) -> String {
    adjust_selector_specificity(selector, count_id_selectors(selector) + 1)
}

#[test]
fn boosts_class_with_escaped_exclamation_mark() {
    assert_eq!(boosted(r".a\!b"), r".a\!b:not(#\#)");
    assert_eq!(boosted(r".a\!b:hover"), r".a\!b:hover:not(#\#)");
    assert_eq!(boosted(r".a\!b .c"), r".a\!b:not(#\#) .c");
    assert_eq!(boosted(r".a\!b > .c"), r".a\!b:not(#\#) > .c");
    assert_eq!(boosted(r".a\!b::before"), r".a\!b:not(#\#)::before");
    assert_eq!(boosted(r".a\!b:before"), r".a\!b:not(#\#):before");
    assert_eq!(boosted(r".a\!b, .c"), r".a\!b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\!b:is(#x)"), r".a\!b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\!b"), r"#a\!b:not(#\##\#)");
    assert_eq!(boosted(r".a\!"), r".a\!:not(#\#)");
    assert_eq!(boosted(r".a\!:hover::after"), r".a\!:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_double_quote() {
    assert_eq!(boosted(r#".a\"b"#), r#".a\"b:not(#\#)"#);
    assert_eq!(boosted(r#".a\"b:hover"#), r#".a\"b:hover:not(#\#)"#);
    assert_eq!(boosted(r#".a\"b .c"#), r#".a\"b:not(#\#) .c"#);
    assert_eq!(boosted(r#".a\"b > .c"#), r#".a\"b:not(#\#) > .c"#);
    assert_eq!(boosted(r#".a\"b::before"#), r#".a\"b:not(#\#)::before"#);
    assert_eq!(boosted(r#".a\"b:before"#), r#".a\"b:not(#\#):before"#);
    assert_eq!(boosted(r#".a\"b, .c"#), r#".a\"b:not(#\#), .c:not(#\#)"#);
    assert_eq!(boosted(r#".a\"b:is(#x)"#), r#".a\"b:is(#x):not(#\##\#)"#);
    assert_eq!(boosted(r#"#a\"b"#), r#"#a\"b:not(#\##\#)"#);
    assert_eq!(boosted(r#".a\""#), r#".a\":not(#\#)"#);
    assert_eq!(
        boosted(r#".a\":hover::after"#),
        r#".a\":hover:not(#\#)::after"#
    );
}

#[test]
fn boosts_class_with_escaped_hash() {
    assert_eq!(boosted(r".a\#b"), r".a\#b:not(#\#)");
    assert_eq!(boosted(r".a\#b:hover"), r".a\#b:hover:not(#\#)");
    assert_eq!(boosted(r".a\#b .c"), r".a\#b:not(#\#) .c");
    assert_eq!(boosted(r".a\#b > .c"), r".a\#b:not(#\#) > .c");
    assert_eq!(boosted(r".a\#b::before"), r".a\#b:not(#\#)::before");
    assert_eq!(boosted(r".a\#b:before"), r".a\#b:not(#\#):before");
    assert_eq!(boosted(r".a\#b, .c"), r".a\#b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\#b:is(#x)"), r".a\#b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\#b"), r"#a\#b:not(#\##\#)");
    assert_eq!(boosted(r".a\#"), r".a\#:not(#\#)");
    assert_eq!(boosted(r".a\#:hover::after"), r".a\#:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_dollar_sign() {
    assert_eq!(boosted(r".a\$b"), r".a\$b:not(#\#)");
    assert_eq!(boosted(r".a\$b:hover"), r".a\$b:hover:not(#\#)");
    assert_eq!(boosted(r".a\$b .c"), r".a\$b:not(#\#) .c");
    assert_eq!(boosted(r".a\$b > .c"), r".a\$b:not(#\#) > .c");
    assert_eq!(boosted(r".a\$b::before"), r".a\$b:not(#\#)::before");
    assert_eq!(boosted(r".a\$b:before"), r".a\$b:not(#\#):before");
    assert_eq!(boosted(r".a\$b, .c"), r".a\$b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\$b:is(#x)"), r".a\$b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\$b"), r"#a\$b:not(#\##\#)");
    assert_eq!(boosted(r".a\$"), r".a\$:not(#\#)");
    assert_eq!(boosted(r".a\$:hover::after"), r".a\$:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_percent_sign() {
    assert_eq!(boosted(r".a\%b"), r".a\%b:not(#\#)");
    assert_eq!(boosted(r".a\%b:hover"), r".a\%b:hover:not(#\#)");
    assert_eq!(boosted(r".a\%b .c"), r".a\%b:not(#\#) .c");
    assert_eq!(boosted(r".a\%b > .c"), r".a\%b:not(#\#) > .c");
    assert_eq!(boosted(r".a\%b::before"), r".a\%b:not(#\#)::before");
    assert_eq!(boosted(r".a\%b:before"), r".a\%b:not(#\#):before");
    assert_eq!(boosted(r".a\%b, .c"), r".a\%b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\%b:is(#x)"), r".a\%b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\%b"), r"#a\%b:not(#\##\#)");
    assert_eq!(boosted(r".a\%"), r".a\%:not(#\#)");
    assert_eq!(boosted(r".a\%:hover::after"), r".a\%:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_ampersand() {
    assert_eq!(boosted(r".a\&b"), r".a\&b:not(#\#)");
    assert_eq!(boosted(r".a\&b:hover"), r".a\&b:hover:not(#\#)");
    assert_eq!(boosted(r".a\&b .c"), r".a\&b:not(#\#) .c");
    assert_eq!(boosted(r".a\&b > .c"), r".a\&b:not(#\#) > .c");
    assert_eq!(boosted(r".a\&b::before"), r".a\&b:not(#\#)::before");
    assert_eq!(boosted(r".a\&b:before"), r".a\&b:not(#\#):before");
    assert_eq!(boosted(r".a\&b, .c"), r".a\&b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\&b:is(#x)"), r".a\&b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\&b"), r"#a\&b:not(#\##\#)");
    assert_eq!(boosted(r".a\&"), r".a\&:not(#\#)");
    assert_eq!(boosted(r".a\&:hover::after"), r".a\&:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_single_quote() {
    assert_eq!(boosted(r".a\'b"), r".a\'b:not(#\#)");
    assert_eq!(boosted(r".a\'b:hover"), r".a\'b:hover:not(#\#)");
    assert_eq!(boosted(r".a\'b .c"), r".a\'b:not(#\#) .c");
    assert_eq!(boosted(r".a\'b > .c"), r".a\'b:not(#\#) > .c");
    assert_eq!(boosted(r".a\'b::before"), r".a\'b:not(#\#)::before");
    assert_eq!(boosted(r".a\'b:before"), r".a\'b:not(#\#):before");
    assert_eq!(boosted(r".a\'b, .c"), r".a\'b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\'b:is(#x)"), r".a\'b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\'b"), r"#a\'b:not(#\##\#)");
    assert_eq!(boosted(r".a\'"), r".a\':not(#\#)");
    assert_eq!(boosted(r".a\':hover::after"), r".a\':hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_open_paren() {
    assert_eq!(boosted(r".a\(b"), r".a\(b:not(#\#)");
    assert_eq!(boosted(r".a\(b:hover"), r".a\(b:hover:not(#\#)");
    assert_eq!(boosted(r".a\(b .c"), r".a\(b:not(#\#) .c");
    assert_eq!(boosted(r".a\(b > .c"), r".a\(b:not(#\#) > .c");
    assert_eq!(boosted(r".a\(b::before"), r".a\(b:not(#\#)::before");
    assert_eq!(boosted(r".a\(b:before"), r".a\(b:not(#\#):before");
    assert_eq!(boosted(r".a\(b, .c"), r".a\(b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\(b:is(#x)"), r".a\(b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\(b"), r"#a\(b:not(#\##\#)");
    assert_eq!(boosted(r".a\("), r".a\(:not(#\#)");
    assert_eq!(boosted(r".a\(:hover::after"), r".a\(:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_close_paren() {
    assert_eq!(boosted(r".a\)b"), r".a\)b:not(#\#)");
    assert_eq!(boosted(r".a\)b:hover"), r".a\)b:hover:not(#\#)");
    assert_eq!(boosted(r".a\)b .c"), r".a\)b:not(#\#) .c");
    assert_eq!(boosted(r".a\)b > .c"), r".a\)b:not(#\#) > .c");
    assert_eq!(boosted(r".a\)b::before"), r".a\)b:not(#\#)::before");
    assert_eq!(boosted(r".a\)b:before"), r".a\)b:not(#\#):before");
    assert_eq!(boosted(r".a\)b, .c"), r".a\)b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\)b:is(#x)"), r".a\)b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\)b"), r"#a\)b:not(#\##\#)");
    assert_eq!(boosted(r".a\)"), r".a\):not(#\#)");
    assert_eq!(boosted(r".a\):hover::after"), r".a\):hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_asterisk() {
    assert_eq!(boosted(r".a\*b"), r".a\*b:not(#\#)");
    assert_eq!(boosted(r".a\*b:hover"), r".a\*b:hover:not(#\#)");
    assert_eq!(boosted(r".a\*b .c"), r".a\*b:not(#\#) .c");
    assert_eq!(boosted(r".a\*b > .c"), r".a\*b:not(#\#) > .c");
    assert_eq!(boosted(r".a\*b::before"), r".a\*b:not(#\#)::before");
    assert_eq!(boosted(r".a\*b:before"), r".a\*b:not(#\#):before");
    assert_eq!(boosted(r".a\*b, .c"), r".a\*b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\*b:is(#x)"), r".a\*b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\*b"), r"#a\*b:not(#\##\#)");
    assert_eq!(boosted(r".a\*"), r".a\*:not(#\#)");
    assert_eq!(boosted(r".a\*:hover::after"), r".a\*:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_plus() {
    assert_eq!(boosted(r".a\+b"), r".a\+b:not(#\#)");
    assert_eq!(boosted(r".a\+b:hover"), r".a\+b:hover:not(#\#)");
    assert_eq!(boosted(r".a\+b .c"), r".a\+b:not(#\#) .c");
    assert_eq!(boosted(r".a\+b > .c"), r".a\+b:not(#\#) > .c");
    assert_eq!(boosted(r".a\+b::before"), r".a\+b:not(#\#)::before");
    assert_eq!(boosted(r".a\+b:before"), r".a\+b:not(#\#):before");
    assert_eq!(boosted(r".a\+b, .c"), r".a\+b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\+b:is(#x)"), r".a\+b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\+b"), r"#a\+b:not(#\##\#)");
    assert_eq!(boosted(r".a\+"), r".a\+:not(#\#)");
    assert_eq!(boosted(r".a\+:hover::after"), r".a\+:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_comma() {
    assert_eq!(boosted(r".a\,b"), r".a\,b:not(#\#)");
    assert_eq!(boosted(r".a\,b:hover"), r".a\,b:hover:not(#\#)");
    assert_eq!(boosted(r".a\,b .c"), r".a\,b:not(#\#) .c");
    assert_eq!(boosted(r".a\,b > .c"), r".a\,b:not(#\#) > .c");
    assert_eq!(boosted(r".a\,b::before"), r".a\,b:not(#\#)::before");
    assert_eq!(boosted(r".a\,b:before"), r".a\,b:not(#\#):before");
    assert_eq!(boosted(r".a\,b, .c"), r".a\,b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\,b:is(#x)"), r".a\,b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\,b"), r"#a\,b:not(#\##\#)");
    assert_eq!(boosted(r".a\,"), r".a\,:not(#\#)");
    assert_eq!(boosted(r".a\,:hover::after"), r".a\,:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_period() {
    assert_eq!(boosted(r".a\.b"), r".a\.b:not(#\#)");
    assert_eq!(boosted(r".a\.b:hover"), r".a\.b:hover:not(#\#)");
    assert_eq!(boosted(r".a\.b .c"), r".a\.b:not(#\#) .c");
    assert_eq!(boosted(r".a\.b > .c"), r".a\.b:not(#\#) > .c");
    assert_eq!(boosted(r".a\.b::before"), r".a\.b:not(#\#)::before");
    assert_eq!(boosted(r".a\.b:before"), r".a\.b:not(#\#):before");
    assert_eq!(boosted(r".a\.b, .c"), r".a\.b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\.b:is(#x)"), r".a\.b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\.b"), r"#a\.b:not(#\##\#)");
    assert_eq!(boosted(r".a\."), r".a\.:not(#\#)");
    assert_eq!(boosted(r".a\.:hover::after"), r".a\.:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_slash() {
    assert_eq!(boosted(r".a\/b"), r".a\/b:not(#\#)");
    assert_eq!(boosted(r".a\/b:hover"), r".a\/b:hover:not(#\#)");
    assert_eq!(boosted(r".a\/b .c"), r".a\/b:not(#\#) .c");
    assert_eq!(boosted(r".a\/b > .c"), r".a\/b:not(#\#) > .c");
    assert_eq!(boosted(r".a\/b::before"), r".a\/b:not(#\#)::before");
    assert_eq!(boosted(r".a\/b:before"), r".a\/b:not(#\#):before");
    assert_eq!(boosted(r".a\/b, .c"), r".a\/b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\/b:is(#x)"), r".a\/b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\/b"), r"#a\/b:not(#\##\#)");
    assert_eq!(boosted(r".a\/"), r".a\/:not(#\#)");
    assert_eq!(boosted(r".a\/:hover::after"), r".a\/:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_colon() {
    assert_eq!(boosted(r".a\:b"), r".a\:b:not(#\#)");
    assert_eq!(boosted(r".a\:b:hover"), r".a\:b:hover:not(#\#)");
    assert_eq!(boosted(r".a\:b .c"), r".a\:b:not(#\#) .c");
    assert_eq!(boosted(r".a\:b > .c"), r".a\:b:not(#\#) > .c");
    assert_eq!(boosted(r".a\:b::before"), r".a\:b:not(#\#)::before");
    assert_eq!(boosted(r".a\:b:before"), r".a\:b:not(#\#):before");
    assert_eq!(boosted(r".a\:b, .c"), r".a\:b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\:b:is(#x)"), r".a\:b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\:b"), r"#a\:b:not(#\##\#)");
    assert_eq!(boosted(r".a\:"), r".a\::not(#\#)");
    assert_eq!(boosted(r".a\::hover::after"), r".a\::hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_semicolon() {
    assert_eq!(boosted(r".a\;b"), r".a\;b:not(#\#)");
    assert_eq!(boosted(r".a\;b:hover"), r".a\;b:hover:not(#\#)");
    assert_eq!(boosted(r".a\;b .c"), r".a\;b:not(#\#) .c");
    assert_eq!(boosted(r".a\;b > .c"), r".a\;b:not(#\#) > .c");
    assert_eq!(boosted(r".a\;b::before"), r".a\;b:not(#\#)::before");
    assert_eq!(boosted(r".a\;b:before"), r".a\;b:not(#\#):before");
    assert_eq!(boosted(r".a\;b, .c"), r".a\;b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\;b:is(#x)"), r".a\;b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\;b"), r"#a\;b:not(#\##\#)");
    assert_eq!(boosted(r".a\;"), r".a\;:not(#\#)");
    assert_eq!(boosted(r".a\;:hover::after"), r".a\;:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_less_than() {
    assert_eq!(boosted(r".a\<b"), r".a\<b:not(#\#)");
    assert_eq!(boosted(r".a\<b:hover"), r".a\<b:hover:not(#\#)");
    assert_eq!(boosted(r".a\<b .c"), r".a\<b:not(#\#) .c");
    assert_eq!(boosted(r".a\<b > .c"), r".a\<b:not(#\#) > .c");
    assert_eq!(boosted(r".a\<b::before"), r".a\<b:not(#\#)::before");
    assert_eq!(boosted(r".a\<b:before"), r".a\<b:not(#\#):before");
    assert_eq!(boosted(r".a\<b, .c"), r".a\<b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\<b:is(#x)"), r".a\<b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\<b"), r"#a\<b:not(#\##\#)");
    assert_eq!(boosted(r".a\<"), r".a\<:not(#\#)");
    assert_eq!(boosted(r".a\<:hover::after"), r".a\<:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_equals() {
    assert_eq!(boosted(r".a\=b"), r".a\=b:not(#\#)");
    assert_eq!(boosted(r".a\=b:hover"), r".a\=b:hover:not(#\#)");
    assert_eq!(boosted(r".a\=b .c"), r".a\=b:not(#\#) .c");
    assert_eq!(boosted(r".a\=b > .c"), r".a\=b:not(#\#) > .c");
    assert_eq!(boosted(r".a\=b::before"), r".a\=b:not(#\#)::before");
    assert_eq!(boosted(r".a\=b:before"), r".a\=b:not(#\#):before");
    assert_eq!(boosted(r".a\=b, .c"), r".a\=b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\=b:is(#x)"), r".a\=b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\=b"), r"#a\=b:not(#\##\#)");
    assert_eq!(boosted(r".a\="), r".a\=:not(#\#)");
    assert_eq!(boosted(r".a\=:hover::after"), r".a\=:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_greater_than() {
    assert_eq!(boosted(r".a\>b"), r".a\>b:not(#\#)");
    assert_eq!(boosted(r".a\>b:hover"), r".a\>b:hover:not(#\#)");
    assert_eq!(boosted(r".a\>b .c"), r".a\>b:not(#\#) .c");
    assert_eq!(boosted(r".a\>b > .c"), r".a\>b:not(#\#) > .c");
    assert_eq!(boosted(r".a\>b::before"), r".a\>b:not(#\#)::before");
    assert_eq!(boosted(r".a\>b:before"), r".a\>b:not(#\#):before");
    assert_eq!(boosted(r".a\>b, .c"), r".a\>b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\>b:is(#x)"), r".a\>b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\>b"), r"#a\>b:not(#\##\#)");
    assert_eq!(boosted(r".a\>"), r".a\>:not(#\#)");
    assert_eq!(boosted(r".a\>:hover::after"), r".a\>:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_question_mark() {
    assert_eq!(boosted(r".a\?b"), r".a\?b:not(#\#)");
    assert_eq!(boosted(r".a\?b:hover"), r".a\?b:hover:not(#\#)");
    assert_eq!(boosted(r".a\?b .c"), r".a\?b:not(#\#) .c");
    assert_eq!(boosted(r".a\?b > .c"), r".a\?b:not(#\#) > .c");
    assert_eq!(boosted(r".a\?b::before"), r".a\?b:not(#\#)::before");
    assert_eq!(boosted(r".a\?b:before"), r".a\?b:not(#\#):before");
    assert_eq!(boosted(r".a\?b, .c"), r".a\?b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\?b:is(#x)"), r".a\?b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\?b"), r"#a\?b:not(#\##\#)");
    assert_eq!(boosted(r".a\?"), r".a\?:not(#\#)");
    assert_eq!(boosted(r".a\?:hover::after"), r".a\?:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_at_sign() {
    assert_eq!(boosted(r".a\@b"), r".a\@b:not(#\#)");
    assert_eq!(boosted(r".a\@b:hover"), r".a\@b:hover:not(#\#)");
    assert_eq!(boosted(r".a\@b .c"), r".a\@b:not(#\#) .c");
    assert_eq!(boosted(r".a\@b > .c"), r".a\@b:not(#\#) > .c");
    assert_eq!(boosted(r".a\@b::before"), r".a\@b:not(#\#)::before");
    assert_eq!(boosted(r".a\@b:before"), r".a\@b:not(#\#):before");
    assert_eq!(boosted(r".a\@b, .c"), r".a\@b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\@b:is(#x)"), r".a\@b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\@b"), r"#a\@b:not(#\##\#)");
    assert_eq!(boosted(r".a\@"), r".a\@:not(#\#)");
    assert_eq!(boosted(r".a\@:hover::after"), r".a\@:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_open_bracket() {
    assert_eq!(boosted(r".a\[b"), r".a\[b:not(#\#)");
    assert_eq!(boosted(r".a\[b:hover"), r".a\[b:hover:not(#\#)");
    assert_eq!(boosted(r".a\[b .c"), r".a\[b:not(#\#) .c");
    assert_eq!(boosted(r".a\[b > .c"), r".a\[b:not(#\#) > .c");
    assert_eq!(boosted(r".a\[b::before"), r".a\[b:not(#\#)::before");
    assert_eq!(boosted(r".a\[b:before"), r".a\[b:not(#\#):before");
    assert_eq!(boosted(r".a\[b, .c"), r".a\[b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\[b:is(#x)"), r".a\[b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\[b"), r"#a\[b:not(#\##\#)");
    assert_eq!(boosted(r".a\["), r".a\[:not(#\#)");
    assert_eq!(boosted(r".a\[:hover::after"), r".a\[:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_close_bracket() {
    assert_eq!(boosted(r".a\]b"), r".a\]b:not(#\#)");
    assert_eq!(boosted(r".a\]b:hover"), r".a\]b:hover:not(#\#)");
    assert_eq!(boosted(r".a\]b .c"), r".a\]b:not(#\#) .c");
    assert_eq!(boosted(r".a\]b > .c"), r".a\]b:not(#\#) > .c");
    assert_eq!(boosted(r".a\]b::before"), r".a\]b:not(#\#)::before");
    assert_eq!(boosted(r".a\]b:before"), r".a\]b:not(#\#):before");
    assert_eq!(boosted(r".a\]b, .c"), r".a\]b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\]b:is(#x)"), r".a\]b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\]b"), r"#a\]b:not(#\##\#)");
    assert_eq!(boosted(r".a\]"), r".a\]:not(#\#)");
    assert_eq!(boosted(r".a\]:hover::after"), r".a\]:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_caret() {
    assert_eq!(boosted(r".a\^b"), r".a\^b:not(#\#)");
    assert_eq!(boosted(r".a\^b:hover"), r".a\^b:hover:not(#\#)");
    assert_eq!(boosted(r".a\^b .c"), r".a\^b:not(#\#) .c");
    assert_eq!(boosted(r".a\^b > .c"), r".a\^b:not(#\#) > .c");
    assert_eq!(boosted(r".a\^b::before"), r".a\^b:not(#\#)::before");
    assert_eq!(boosted(r".a\^b:before"), r".a\^b:not(#\#):before");
    assert_eq!(boosted(r".a\^b, .c"), r".a\^b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\^b:is(#x)"), r".a\^b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\^b"), r"#a\^b:not(#\##\#)");
    assert_eq!(boosted(r".a\^"), r".a\^:not(#\#)");
    assert_eq!(boosted(r".a\^:hover::after"), r".a\^:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_backtick() {
    assert_eq!(boosted(r".a\`b"), r".a\`b:not(#\#)");
    assert_eq!(boosted(r".a\`b:hover"), r".a\`b:hover:not(#\#)");
    assert_eq!(boosted(r".a\`b .c"), r".a\`b:not(#\#) .c");
    assert_eq!(boosted(r".a\`b > .c"), r".a\`b:not(#\#) > .c");
    assert_eq!(boosted(r".a\`b::before"), r".a\`b:not(#\#)::before");
    assert_eq!(boosted(r".a\`b:before"), r".a\`b:not(#\#):before");
    assert_eq!(boosted(r".a\`b, .c"), r".a\`b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\`b:is(#x)"), r".a\`b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\`b"), r"#a\`b:not(#\##\#)");
    assert_eq!(boosted(r".a\`"), r".a\`:not(#\#)");
    assert_eq!(boosted(r".a\`:hover::after"), r".a\`:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_open_brace() {
    assert_eq!(boosted(r".a\{b"), r".a\{b:not(#\#)");
    assert_eq!(boosted(r".a\{b:hover"), r".a\{b:hover:not(#\#)");
    assert_eq!(boosted(r".a\{b .c"), r".a\{b:not(#\#) .c");
    assert_eq!(boosted(r".a\{b > .c"), r".a\{b:not(#\#) > .c");
    assert_eq!(boosted(r".a\{b::before"), r".a\{b:not(#\#)::before");
    assert_eq!(boosted(r".a\{b:before"), r".a\{b:not(#\#):before");
    assert_eq!(boosted(r".a\{b, .c"), r".a\{b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\{b:is(#x)"), r".a\{b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\{b"), r"#a\{b:not(#\##\#)");
    assert_eq!(boosted(r".a\{"), r".a\{:not(#\#)");
    assert_eq!(boosted(r".a\{:hover::after"), r".a\{:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_pipe() {
    assert_eq!(boosted(r".a\|b"), r".a\|b:not(#\#)");
    assert_eq!(boosted(r".a\|b:hover"), r".a\|b:hover:not(#\#)");
    assert_eq!(boosted(r".a\|b .c"), r".a\|b:not(#\#) .c");
    assert_eq!(boosted(r".a\|b > .c"), r".a\|b:not(#\#) > .c");
    assert_eq!(boosted(r".a\|b::before"), r".a\|b:not(#\#)::before");
    assert_eq!(boosted(r".a\|b:before"), r".a\|b:not(#\#):before");
    assert_eq!(boosted(r".a\|b, .c"), r".a\|b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\|b:is(#x)"), r".a\|b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\|b"), r"#a\|b:not(#\##\#)");
    assert_eq!(boosted(r".a\|"), r".a\|:not(#\#)");
    assert_eq!(boosted(r".a\|:hover::after"), r".a\|:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_close_brace() {
    assert_eq!(boosted(r".a\}b"), r".a\}b:not(#\#)");
    assert_eq!(boosted(r".a\}b:hover"), r".a\}b:hover:not(#\#)");
    assert_eq!(boosted(r".a\}b .c"), r".a\}b:not(#\#) .c");
    assert_eq!(boosted(r".a\}b > .c"), r".a\}b:not(#\#) > .c");
    assert_eq!(boosted(r".a\}b::before"), r".a\}b:not(#\#)::before");
    assert_eq!(boosted(r".a\}b:before"), r".a\}b:not(#\#):before");
    assert_eq!(boosted(r".a\}b, .c"), r".a\}b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\}b:is(#x)"), r".a\}b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\}b"), r"#a\}b:not(#\##\#)");
    assert_eq!(boosted(r".a\}"), r".a\}:not(#\#)");
    assert_eq!(boosted(r".a\}:hover::after"), r".a\}:hover:not(#\#)::after");
}

#[test]
fn boosts_class_with_escaped_tilde() {
    assert_eq!(boosted(r".a\~b"), r".a\~b:not(#\#)");
    assert_eq!(boosted(r".a\~b:hover"), r".a\~b:hover:not(#\#)");
    assert_eq!(boosted(r".a\~b .c"), r".a\~b:not(#\#) .c");
    assert_eq!(boosted(r".a\~b > .c"), r".a\~b:not(#\#) > .c");
    assert_eq!(boosted(r".a\~b::before"), r".a\~b:not(#\#)::before");
    assert_eq!(boosted(r".a\~b:before"), r".a\~b:not(#\#):before");
    assert_eq!(boosted(r".a\~b, .c"), r".a\~b:not(#\#), .c:not(#\#)");
    assert_eq!(boosted(r".a\~b:is(#x)"), r".a\~b:is(#x):not(#\##\#)");
    assert_eq!(boosted(r"#a\~b"), r"#a\~b:not(#\##\#)");
    assert_eq!(boosted(r".a\~"), r".a\~:not(#\#)");
    assert_eq!(boosted(r".a\~:hover::after"), r".a\~:hover:not(#\#)::after");
}

#[test]
fn boosts_across_combinators() {
    assert_eq!(boosted(r".a"), r".a:not(#\#)");
    assert_eq!(boosted(r"#a"), r"#a:not(#\##\#)");
    assert_eq!(boosted(r"a b"), r"a:not(#\#) b");
    assert_eq!(boosted(r"a > b"), r"a:not(#\#) > b");
    assert_eq!(boosted(r"a>b"), r"a:not(#\#)>b");
    assert_eq!(boosted(r"a+b"), r"a:not(#\#)+b");
    assert_eq!(boosted(r"a~b"), r"a:not(#\#)~b");
    assert_eq!(boosted(r"a ~ b"), r"a:not(#\#) ~ b");
    assert_eq!(boosted(r"a + b"), r"a:not(#\#) + b");
    assert_eq!(boosted(r"a   b"), r"a:not(#\#)   b");
    assert_eq!(boosted(r"a > b ~ c + d e"), r"a:not(#\#) > b ~ c + d e");
}

#[test]
fn boosts_each_selector_in_a_list() {
    assert_eq!(boosted(r".a, .b"), r".a:not(#\#), .b:not(#\#)");
    assert_eq!(boosted(r".a,.b"), r".a:not(#\#),.b:not(#\#)");
    assert_eq!(boosted(r"  .a  "), r"  .a:not(#\#)  ");
}

#[test]
fn boosts_universal_and_nesting_selectors() {
    assert_eq!(boosted(r"*"), r"*:not(#\#)");
    assert_eq!(boosted(r"&"), r"&:not(#\#)");
    assert_eq!(boosted(r"& .a"), r"&:not(#\#) .a");
    assert_eq!(boosted(r".a &"), r".a:not(#\#) &");
}

#[test]
fn boosts_before_pseudo_elements() {
    assert_eq!(boosted(r".btn::before"), r".btn:not(#\#)::before");
    assert_eq!(boosted(r".btn:before"), r".btn:not(#\#):before");
    assert_eq!(boosted(r".btn:after"), r".btn:not(#\#):after");
    assert_eq!(boosted(r".btn:first-line"), r".btn:not(#\#):first-line");
    assert_eq!(boosted(r".btn:first-letter"), r".btn:not(#\#):first-letter");
    assert_eq!(boosted(r".btn:BEFORE"), r".btn:not(#\#):BEFORE");
    assert_eq!(boosted(r".btn::BEFORE"), r".btn:not(#\#)::BEFORE");
    assert_eq!(boosted(r".btn::placeholder"), r".btn:not(#\#)::placeholder");
    assert_eq!(
        boosted(r"input::-webkit-input-placeholder"),
        r"input:not(#\#)::-webkit-input-placeholder"
    );
    assert_eq!(boosted(r".btn::part(label)"), r".btn:not(#\#)::part(label)");
    assert_eq!(
        boosted(r".btn::slotted(#a)"),
        r".btn:not(#\##\#)::slotted(#a)"
    );
    assert_eq!(boosted(r"::selection"), r":not(#\#)::selection");
}

#[test]
fn boosts_functional_pseudos() {
    assert_eq!(boosted(r":root"), r":root:not(#\#)");
    assert_eq!(boosted(r":root:not(#a)"), r":root:not(#a):not(#\##\#)");
    assert_eq!(boosted(r":is(#a, #b)"), r":is(#a, #b):not(#\##\#)");
    assert_eq!(boosted(r":Is(#a, #b)"), r":Is(#a, #b):not(#\##\#)");
    assert_eq!(boosted(r":not(#a, #b#c)"), r":not(#a, #b#c):not(#\##\##\#)");
    assert_eq!(boosted(r":has(#a) #b"), r":has(#a):not(#\##\##\#) #b");
    assert_eq!(boosted(r":has(> #a)"), r":has(> #a):not(#\##\#)");
    assert_eq!(boosted(r":where(#a #b)"), r":where(#a #b):not(#\#)");
    assert_eq!(
        boosted(r":where(#a #b) #c"),
        r":where(#a #b):not(#\##\#) #c"
    );
    assert_eq!(
        boosted(r"#x:where(#a, #b)"),
        r"#x:where(#a, #b):not(#\##\#)"
    );
    assert_eq!(
        boosted(r":is(#a, :where(#b #c))"),
        r":is(#a, :where(#b #c)):not(#\##\#)"
    );
    assert_eq!(
        boosted(r":matches(#a, .b)"),
        r":matches(#a, .b):not(#\##\#)"
    );
    assert_eq!(
        boosted(r":is(:not(#a), :where(#b #c), #d#e)"),
        r":is(:not(#a), :where(#b #c), #d#e):not(#\##\##\#)"
    );
    assert_eq!(
        boosted(r":not(:is(#a, #b))"),
        r":not(:is(#a, #b)):not(#\##\#)"
    );
    assert_eq!(boosted(r":host(#a)"), r":host(#a):not(#\##\#)");
    assert_eq!(
        boosted(r":nth-child(2n+1 of #a)"),
        r":nth-child(2n+1 of #a):not(#\##\#)"
    );
    assert_eq!(
        boosted(r":nth-child(2n + 1)"),
        r":nth-child(2n + 1):not(#\#)"
    );
    assert_eq!(boosted(r".x:has(> .a) .y"), r".x:has(> .a):not(#\#) .y");
    assert_eq!(boosted(r".x:has(.a, .b) .y"), r".x:has(.a, .b):not(#\#) .y");
}

#[test]
fn boosts_around_attribute_selectors() {
    assert_eq!(boosted(r"[href=#foo]"), r"[href=#foo]:not(#\#)");
    assert_eq!(boosted(r##"[href="#foo"]"##), r##"[href="#foo"]:not(#\#)"##);
    assert_eq!(boosted(r"[href='#foo']"), r"[href='#foo']:not(#\#)");
    assert_eq!(
        boosted(r"#real-id[href=#foo]"),
        r"#real-id[href=#foo]:not(#\##\#)"
    );
    assert_eq!(
        boosted(r#"[data-x="a,b"], .y"#),
        r#"[data-x="a,b"]:not(#\#), .y:not(#\#)"#
    );
    assert_eq!(
        boosted(r"[data-x='a,b'], .y"),
        r"[data-x='a,b']:not(#\#), .y:not(#\#)"
    );
    assert_eq!(
        boosted(r#"[data-x="\""] .y"#),
        r#"[data-x="\""]:not(#\#) .y"#
    );
    assert_eq!(boosted(r"[data-x='\''] .y"), r"[data-x='\'']:not(#\#) .y");
    assert_eq!(
        boosted(r#"[data-x="a\"b"]::before"#),
        r#"[data-x="a\"b"]:not(#\#)::before"#
    );
    assert_eq!(boosted(r#"[data-x="]"] .y"#), r#"[data-x="]"]:not(#\#) .y"#);
    assert_eq!(boosted(r#"[data-x="("] .y"#), r#"[data-x="("]:not(#\#) .y"#);
    assert_eq!(boosted(r#"[data-x=")"] .y"#), r#"[data-x=")"]:not(#\#) .y"#);
    assert_eq!(boosted(r".a[data-x] .b"), r".a[data-x]:not(#\#) .b");
    assert_eq!(
        boosted(r".a:not([data-x]) .b"),
        r".a:not([data-x]):not(#\#) .b"
    );
}

#[test]
fn boosts_hex_and_backslash_escapes() {
    assert_eq!(boosted(r"#\31 a"), r"#\31 a:not(#\##\#)");
    assert_eq!(boosted(r"#\31 a .b"), r"#\31 a:not(#\##\#) .b");
    assert_eq!(boosted(r".\31 23"), r".\31 23:not(#\#)");
    assert_eq!(boosted(r".\31 23 .b"), r".\31 23:not(#\#) .b");
    assert_eq!(boosted(r".\31 23::before"), r".\31 23:not(#\#)::before");
    assert_eq!(boosted(r".a\ b"), r".a\ b:not(#\#)");
    assert_eq!(boosted(r".a\ b .c"), r".a\ b:not(#\#) .c");
    assert_eq!(boosted(r".a\\ .b"), r".a\\:not(#\#) .b");
    assert_eq!(boosted(r".a\\:hover"), r".a\\:hover:not(#\#)");
    assert_eq!(boosted(r".a\:\:before"), r".a\:\:before:not(#\#)");
    assert_eq!(boosted(r".a\::before"), r".a\::not(#\#):before");
}

#[test]
fn boosts_unicode_selectors() {
    assert_eq!(boosted(r".日本語 .café"), r".日本語:not(#\#) .café");
    assert_eq!(boosted(r".日本語::before"), r".日本語:not(#\#)::before");
    assert_eq!(boosted(r".café:hover"), r".café:hover:not(#\#)");
    assert_eq!(boosted(r"#é"), r"#é:not(#\##\#)");
}

#[test]
fn boosts_ids_and_mid_word_pseudo_names() {
    assert_eq!(boosted(r".a#b#c"), r".a#b#c:not(#\##\##\#)");
    assert_eq!(boosted(r"#a#b#c"), r"#a#b#c:not(#\##\##\##\#)");
    assert_eq!(
        boosted(r"#a, .b, #c#d"),
        r"#a:not(#\##\##\#), .b:not(#\##\##\#), #c#d:not(#\##\##\#)"
    );
    assert_eq!(boosted(r".beforehand"), r".beforehand:not(#\#)");
    assert_eq!(boosted(r".after-x"), r".after-x:not(#\#)");
}

#[test]
fn boosts_panda_class_names() {
    assert_eq!(
        boosted(r".hover\:before\:opacity_0\.5:is(:hover, [data-hover])::before"),
        r".hover\:before\:opacity_0\.5:is(:hover, [data-hover]):not(#\#)::before"
    );
    assert_eq!(
        boosted(r#".before\:content_\"\"::before"#),
        r#".before\:content_\"\":not(#\#)::before"#
    );
    assert_eq!(
        boosted(r".animation_fadeIn_1s\,_slideUp_1s"),
        r".animation_fadeIn_1s\,_slideUp_1s:not(#\#)"
    );
    assert_eq!(boosted(r".c_\#f00"), r".c_\#f00:not(#\#)");
    assert_eq!(
        boosted(r".w_calc\(100\%_-_2px\)"),
        r".w_calc\(100\%_-_2px\):not(#\#)"
    );
    assert_eq!(boosted(r".bg_red\/50"), r".bg_red\/50:not(#\#)");
    assert_eq!(
        boosted(r".\[\&\>p\]\:mt_2 > p"),
        r".\[\&\>p\]\:mt_2:not(#\#) > p"
    );
    assert_eq!(
        boosted(r".sm\:hover\:c_red:is(:hover, [data-hover])"),
        r".sm\:hover\:c_red:is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(r".group:is(:hover) .group-hover\:c_red"),
        r".group:is(:hover):not(#\#) .group-hover\:c_red"
    );
    assert_eq!(
        boosted(r".peer:is(:checked) ~ .peer-checked\:c_red"),
        r".peer:is(:checked):not(#\#) ~ .peer-checked\:c_red"
    );
    assert_eq!(
        boosted(r".dark .dark\:c_red"),
        r".dark:not(#\#) .dark\:c_red"
    );
    assert_eq!(boosted(r".c_red\!"), r".c_red\!:not(#\#)");
    assert_eq!(
        boosted(r"[data-theme=dark] .c_red"),
        r"[data-theme=dark]:not(#\#) .c_red"
    );
    assert_eq!(
        boosted(r".a:is(:hover, [data-hover]):not(:disabled)"),
        r".a:is(:hover, [data-hover]):not(:disabled):not(#\#)"
    );
    assert_eq!(boosted(r".a:focus-visible"), r".a:focus-visible:not(#\#)");
    assert_eq!(boosted(r".a:nth-child(odd)"), r".a:nth-child(odd):not(#\#)");
    assert_eq!(
        boosted(r".a:nth-of-type(2n+1)"),
        r".a:nth-of-type(2n+1):not(#\#)"
    );
    assert_eq!(boosted(r".a::after:hover"), r".a:not(#\#)::after:hover");
    assert_eq!(boosted(r".a::before .b"), r".a:not(#\#)::before .b");
    assert_eq!(boosted(r"html :where(.a)"), r"html:not(#\#) :where(.a)");
    assert_eq!(boosted(r":where(html) .a"), r":where(html):not(#\#) .a");
    assert_eq!(boosted(r".a :where(#b) .c"), r".a:not(#\#) :where(#b) .c");
    assert_eq!(boosted(r".a:is(.b .c) .d"), r".a:is(.b .c):not(#\#) .d");
    assert_eq!(boosted(r".a\,.b"), r".a\,.b:not(#\#)");
    assert_eq!(boosted(r".a\,.b, .c"), r".a\,.b:not(#\#), .c:not(#\#)");
}

#[test]
fn boosts_real_arbitrary_selector_classes() {
    assert_eq!(
        boosted(
            r".dark .\[\&_\.bracket-highlighting-1\,_\&_\.bracket-highlighting-3\]\:dark\:c_\#EBDBB2\! .bracket-highlighting-1, .dark .\[\&_\.bracket-highlighting-1\,_\&_\.bracket-highlighting-3\]\:dark\:c_\#EBDBB2\! .bracket-highlighting-3"
        ),
        r".dark:not(#\#) .\[\&_\.bracket-highlighting-1\,_\&_\.bracket-highlighting-3\]\:dark\:c_\#EBDBB2\! .bracket-highlighting-1, .dark:not(#\#) .\[\&_\.bracket-highlighting-1\,_\&_\.bracket-highlighting-3\]\:dark\:c_\#EBDBB2\! .bracket-highlighting-3"
    );
    assert_eq!(
        boosted(
            r".dark .\[\&_\.jsx-expression-braces\,_\&_\.bracket-highlighting-0\,_\&_\.bracket-highlighting-4\]\:dark\:c_\#A89984\! .jsx-expression-braces, .dark .\[\&_\.jsx-expression-braces\,_\&_\.bracket-highlighting-0\,_\&_\.bracket-highlighting-4\]\:dark\:c_\#A89984\! .bracket-highlighting-0, .dark .\[\&_\.jsx-expression-braces\,_\&_\.bracket-highlighting-0\,_\&_\.bracket-highlighting-4\]\:dark\:c_\#A89984\! .bracket-highlighting-4"
        ),
        r".dark:not(#\#) .\[\&_\.jsx-expression-braces\,_\&_\.bracket-highlighting-0\,_\&_\.bracket-highlighting-4\]\:dark\:c_\#A89984\! .jsx-expression-braces, .dark:not(#\#) .\[\&_\.jsx-expression-braces\,_\&_\.bracket-highlighting-0\,_\&_\.bracket-highlighting-4\]\:dark\:c_\#A89984\! .bracket-highlighting-0, .dark:not(#\#) .\[\&_\.jsx-expression-braces\,_\&_\.bracket-highlighting-0\,_\&_\.bracket-highlighting-4\]\:dark\:c_\#A89984\! .bracket-highlighting-4"
    );
    assert_eq!(
        boosted(r".\[\&_\.jsx-tag-angle-bracket\]\:c_\#000000\! .jsx-tag-angle-bracket"),
        r".\[\&_\.jsx-tag-angle-bracket\]\:c_\#000000\!:not(#\#) .jsx-tag-angle-bracket"
    );
    assert_eq!(
        boosted(
            r".dark .\[\&_\.jsx-tag-angle-bracket\]\:dark\:c_\#83A598\! .jsx-tag-angle-bracket"
        ),
        r".dark:not(#\#) .\[\&_\.jsx-tag-angle-bracket\]\:dark\:c_\#83A598\! .jsx-tag-angle-bracket"
    );
    assert_eq!(
        boosted(r".\[\&_svg\]\:c_rgba\(156\,163\,175\,1\) svg"),
        r".\[\&_svg\]\:c_rgba\(156\,163\,175\,1\):not(#\#) svg"
    );
    assert_eq!(
        boosted(r".\[\&_svg\]\:trf_rotate\(-135deg\) svg"),
        r".\[\&_svg\]\:trf_rotate\(-135deg\):not(#\#) svg"
    );
    assert_eq!(
        boosted(r".\[\&_svg\]\:h_4 svg"),
        r".\[\&_svg\]\:h_4:not(#\#) svg"
    );
    assert_eq!(
        boosted(r".dark .\[\&_svg\]\:dark\:c_\#FFFFFF4D svg"),
        r".dark:not(#\#) .\[\&_svg\]\:dark\:c_\#FFFFFF4D svg"
    );
    assert_eq!(
        boosted(r".\[\&\[data-resizing\]\]\:pointer-events_none[data-resizing]"),
        r".\[\&\[data-resizing\]\]\:pointer-events_none[data-resizing]:not(#\#)"
    );
    assert_eq!(
        boosted(
            r".dark .\[\&\:not\(\[data-expanded\]\)\]\:dark\:bg_\#1d1e1fc4:not([data-expanded])"
        ),
        r".dark:not(#\#) .\[\&\:not\(\[data-expanded\]\)\]\:dark\:bg_\#1d1e1fc4:not([data-expanded])"
    );
    assert_eq!(
        boosted(
            r".dark .\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:dark\:c_\#FABD2F\! .jsx-tag-attribute-key, .dark .\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:dark\:c_\#FABD2F\! .jsx-expression-braces + :not(.jsx-tag-angle-bracket):not(.bracket-highlighting-3)"
        ),
        r".dark:not(#\#) .\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:dark\:c_\#FABD2F\! .jsx-tag-attribute-key, .dark:not(#\#) .\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:dark\:c_\#FABD2F\! .jsx-expression-braces + :not(.jsx-tag-angle-bracket):not(.bracket-highlighting-3)"
    );
    assert_eq!(
        boosted(
            r".dark .\[\&\:hover\,_\&\[data-active\]\]\:dark\:bg_\#3A3A3AFF:hover, .dark .\[\&\:hover\,_\&\[data-active\]\]\:dark\:bg_\#3A3A3AFF[data-active]"
        ),
        r".dark:not(#\#) .\[\&\:hover\,_\&\[data-active\]\]\:dark\:bg_\#3A3A3AFF:hover, .dark:not(#\#) .\[\&\:hover\,_\&\[data-active\]\]\:dark\:bg_\#3A3A3AFF[data-active]"
    );
    assert_eq!(
        boosted(
            r".dark .\[\&\:hover\,_\&\[data-active\]\]\:dark\:c_gray\.100:hover, .dark .\[\&\:hover\,_\&\[data-active\]\]\:dark\:c_gray\.100[data-active]"
        ),
        r".dark:not(#\#) .\[\&\:hover\,_\&\[data-active\]\]\:dark\:c_gray\.100:hover, .dark:not(#\#) .\[\&\:hover\,_\&\[data-active\]\]\:dark\:c_gray\.100[data-active]"
    );
    assert_eq!(
        boosted(
            r".dark .\[\&\[data-resizing\]\,_\&\:hover\]\:dark\:bg_rgba\(24\,24\,24\,0\.5\)[data-resizing], .dark .\[\&\[data-resizing\]\,_\&\:hover\]\:dark\:bg_rgba\(24\,24\,24\,0\.5\):hover"
        ),
        r".dark:not(#\#) .\[\&\[data-resizing\]\,_\&\:hover\]\:dark\:bg_rgba\(24\,24\,24\,0\.5\)[data-resizing], .dark:not(#\#) .\[\&\[data-resizing\]\,_\&\:hover\]\:dark\:bg_rgba\(24\,24\,24\,0\.5\):hover"
    );
    assert_eq!(
        boosted(r".\[\&\:not\(\[data-expanded\]\)\]\:bg_gray\.100:not([data-expanded])"),
        r".\[\&\:not\(\[data-expanded\]\)\]\:bg_gray\.100:not([data-expanded]):not(#\#)"
    );
    assert_eq!(
        boosted(r".\[\&\:not\(\[data-expanded\]\)\]\:bdr_md:not([data-expanded])"),
        r".\[\&\:not\(\[data-expanded\]\)\]\:bdr_md:not([data-expanded]):not(#\#)"
    );
    assert_eq!(
        boosted(
            r".\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:c_\#6f42c1\! .jsx-tag-attribute-key, .\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:c_\#6f42c1\! .jsx-expression-braces + :not(.jsx-tag-angle-bracket):not(.bracket-highlighting-3)"
        ),
        r".\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:c_\#6f42c1\!:not(#\#) .jsx-tag-attribute-key, .\[\&_\.jsx-tag-attribute-key\,_\&_\.jsx-expression-braces_\+_\:not\(\.jsx-tag-angle-bracket\)\:not\(\.bracket-highlighting-3\)\]\:c_\#6f42c1\!:not(#\#) .jsx-expression-braces + :not(.jsx-tag-angle-bracket):not(.bracket-highlighting-3)"
    );
    assert_eq!(
        boosted(
            r".\[\&\:hover\,_\&\[data-active\]\]\:bg_gray\.100:hover, .\[\&\:hover\,_\&\[data-active\]\]\:bg_gray\.100[data-active]"
        ),
        r".\[\&\:hover\,_\&\[data-active\]\]\:bg_gray\.100:hover:not(#\#), .\[\&\:hover\,_\&\[data-active\]\]\:bg_gray\.100[data-active]:not(#\#)"
    );
    assert_eq!(
        boosted(
            r".\[\&\[data-resizing\]\,_\&\:hover\]\:bg_rgb\(204_204_204_\/_63\%\)[data-resizing], .\[\&\[data-resizing\]\,_\&\:hover\]\:bg_rgb\(204_204_204_\/_63\%\):hover"
        ),
        r".\[\&\[data-resizing\]\,_\&\:hover\]\:bg_rgb\(204_204_204_\/_63\%\)[data-resizing]:not(#\#), .\[\&\[data-resizing\]\,_\&\:hover\]\:bg_rgb\(204_204_204_\/_63\%\):hover:not(#\#)"
    );
    assert_eq!(
        boosted(
            r".\[\&_\>_\*\:not\(\:last-child\)\:not\(\:first-child\)\]\:show_md > *:not(:last-child):not(:first-child)"
        ),
        r".\[\&_\>_\*\:not\(\:last-child\)\:not\(\:first-child\)\]\:show_md:not(#\#) > *:not(:last-child):not(:first-child)"
    );
    assert_eq!(
        boosted(r".\[\&_code\]\:fs_11\.5px code"),
        r".\[\&_code\]\:fs_11\.5px:not(#\#) code"
    );
    assert_eq!(
        boosted(r#".\[\&\[data-precise\=\"true\"\]\]\:bg_ink[data-precise="true"]"#),
        r#".\[\&\[data-precise\=\"true\"\]\]\:bg_ink[data-precise="true"]:not(#\#)"#
    );
    assert_eq!(
        boosted(r".\[\&\[data-state\=\'closed\'\]\]\:op_0[data-state='closed']"),
        r".\[\&\[data-state\=\'closed\'\]\]\:op_0[data-state='closed']:not(#\#)"
    );
    assert_eq!(
        boosted(r".\[\&\:not\(\:first-child\)\]\:bd-c_line:not(:first-child)"),
        r".\[\&\:not\(\:first-child\)\]\:bd-c_line:not(:first-child):not(#\#)"
    );
    assert_eq!(
        boosted(
            r".\[\&\:hover_\[data-part\=\'trigger\'\]\[data-scope\=\'popover\'\]\]\:op_1:hover [data-part='trigger'][data-scope='popover']"
        ),
        r".\[\&\:hover_\[data-part\=\'trigger\'\]\[data-scope\=\'popover\'\]\]\:op_1:hover:not(#\#) [data-part='trigger'][data-scope='popover']"
    );
    assert_eq!(
        boosted(
            r".\[\&\:is\(\:hover\,_\[data-hover\]\)\:not\(\[data-selected\]\)\]\:bg_subtle:is(:hover, [data-hover]):not([data-selected])"
        ),
        r".\[\&\:is\(\:hover\,_\[data-hover\]\)\:not\(\[data-selected\]\)\]\:bg_subtle:is(:hover, [data-hover]):not([data-selected]):not(#\#)"
    );
    assert_eq!(
        boosted(r".\[\&\:\:-webkit-scrollbar\]\:d_none::-webkit-scrollbar"),
        r".\[\&\:\:-webkit-scrollbar\]\:d_none:not(#\#)::-webkit-scrollbar"
    );
    assert_eq!(
        boosted(r".\[\&\:hover\]\:fs_2\.25rem:hover"),
        r".\[\&\:hover\]\:fs_2\.25rem:hover:not(#\#)"
    );
    assert_eq!(
        boosted(r".\[\&_\+_\&\]\:bd-c_border + .\[\&_\+_\&\]\:bd-c_border"),
        r".\[\&_\+_\&\]\:bd-c_border:not(#\#) + .\[\&_\+_\&\]\:bd-c_border"
    );
    assert_eq!(
        boosted(
            r#".dark .\[\&_\>_h3\]\:before\:dark\:bd-c_rgba\(17\,17\,17\,1\) > h3::before, [data-theme="dark"] .\[\&_\>_h3\]\:before\:dark\:bd-c_rgba\(17\,17\,17\,1\) > h3::before"#
        ),
        r#".dark:not(#\#) .\[\&_\>_h3\]\:before\:dark\:bd-c_rgba\(17\,17\,17\,1\) > h3::before, [data-theme="dark"]:not(#\#) .\[\&_\>_h3\]\:before\:dark\:bd-c_rgba\(17\,17\,17\,1\) > h3::before"#
    );
    assert_eq!(
        boosted(r".\[\&_\>_h3\]\:before\:bg_yellow\.300 > h3::before"),
        r".\[\&_\>_h3\]\:before\:bg_yellow\.300:not(#\#) > h3::before"
    );
    assert_eq!(
        boosted(r".\[\&_\>_h3\]\:before\:bd-c_white > h3::before"),
        r".\[\&_\>_h3\]\:before\:bd-c_white:not(#\#) > h3::before"
    );
    assert_eq!(
        boosted(r".\[\&_\>_h3\]\:before\:content_counter\(step\) > h3::before"),
        r".\[\&_\>_h3\]\:before\:content_counter\(step\):not(#\#) > h3::before"
    );
    assert_eq!(
        boosted(r".\[\&_\>_summary\]\:c_fg\.muted > summary"),
        r".\[\&_\>_summary\]\:c_fg\.muted:not(#\#) > summary"
    );
    assert_eq!(
        boosted(r".\[\&_\>_summary\]\:hover\:c_fg > summary:is(:hover, [data-hover])"),
        r".\[\&_\>_summary\]\:hover\:c_fg:not(#\#) > summary:is(:hover, [data-hover])"
    );
    assert_eq!(
        boosted(r#".\[\&_\>_summary\]\:before\:content_\"\+\" > summary::before"#),
        r#".\[\&_\>_summary\]\:before\:content_\"\+\":not(#\#) > summary::before"#
    );
    assert_eq!(
        boosted(r".\[\&_\>_summary_\+_\*\]\:mt_0 > summary + *"),
        r".\[\&_\>_summary_\+_\*\]\:mt_0:not(#\#) > summary + *"
    );
    assert_eq!(
        boosted(r".\[\&_code\[data-language\]_\.line\]\:px_4 code[data-language] .line"),
        r".\[\&_code\[data-language\]_\.line\]\:px_4:not(#\#) code[data-language] .line"
    );
    assert_eq!(
        boosted(r".\[\&_pre\.shiki\]\:bdr-b_lg\! pre.shiki"),
        r".\[\&_pre\.shiki\]\:bdr-b_lg\!:not(#\#) pre.shiki"
    );
    assert_eq!(
        boosted(r".\[\&\[data-current\]\]\:\[\&_svg\]\:c_accent\.emphasis[data-current] svg"),
        r".\[\&\[data-current\]\]\:\[\&_svg\]\:c_accent\.emphasis[data-current]:not(#\#) svg"
    );
    assert_eq!(
        boosted(
            r".\[\&_ul\,_\&_ol\]\:--margin_spacing\.2 ul, .\[\&_ul\,_\&_ol\]\:--margin_spacing\.2 ol"
        ),
        r".\[\&_ul\,_\&_ol\]\:--margin_spacing\.2:not(#\#) ul, .\[\&_ul\,_\&_ol\]\:--margin_spacing\.2:not(#\#) ol"
    );
    assert_eq!(
        boosted(r".\[\&\[data-current\]\]\:c_accent\.emphasis[data-current]"),
        r".\[\&\[data-current\]\]\:c_accent\.emphasis[data-current]:not(#\#)"
    );
    assert_eq!(
        boosted(r".\[\&\[open\]_\>_summary\]\:c_fg[open] > summary"),
        r".\[\&\[open\]_\>_summary\]\:c_fg[open]:not(#\#) > summary"
    );
    assert_eq!(
        boosted(
            r#".\[\&\[open\]_\>_summary\]\:before\:content_\"\\2212\"[open] > summary::before"#
        ),
        r#".\[\&\[open\]_\>_summary\]\:before\:content_\"\\2212\"[open]:not(#\#) > summary::before"#
    );
    assert_eq!(
        boosted(r"[data-state=open] .\[\[data-state\=open\]_\&\]\:trf_rotate\(180deg\)"),
        r"[data-state=open]:not(#\#) .\[\[data-state\=open\]_\&\]\:trf_rotate\(180deg\)"
    );
    assert_eq!(
        boosted(
            r".\[\&\:not\(\[data-selected\]\)\]\:hover\:bg_bg\.muted:not([data-selected]):is(:hover, [data-hover])"
        ),
        r".\[\&\:not\(\[data-selected\]\)\]\:hover\:bg_bg\.muted:not([data-selected]):is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(r".\[\&\[open\]_\>_\*\:not\(summary\)\]\:c_fg\.muted[open] > *:not(summary)"),
        r".\[\&\[open\]_\>_\*\:not\(summary\)\]\:c_fg\.muted[open]:not(#\#) > *:not(summary)"
    );
    assert_eq!(
        boosted(r".\[\&_\>_\*\:first-child\]\:mt_0 > *:first-child"),
        r".\[\&_\>_\*\:first-child\]\:mt_0:not(#\#) > *:first-child"
    );
    assert_eq!(
        boosted(r".\[\&_\>_\:first-child\]\:bdr-e_0 > :first-child"),
        r".\[\&_\>_\:first-child\]\:bdr-e_0:not(#\#) > :first-child"
    );
    assert_eq!(
        boosted(r".\[\&\[open\]_\>_\*\:last-child\]\:mb_5[open] > *:last-child"),
        r".\[\&\[open\]_\>_\*\:last-child\]\:mb_5[open]:not(#\#) > *:last-child"
    );
    assert_eq!(
        boosted(r".\[\&\:not\(\:has\(\.line\)\)\]\:px_4:not(:has(.line))"),
        r".\[\&\:not\(\:has\(\.line\)\)\]\:px_4:not(:has(.line)):not(#\#)"
    );
    assert_eq!(
        boosted(r".\[\&\[open\]_\>_\*\:not\(summary\)\]\:textStyle_sm[open] > *:not(summary)"),
        r".\[\&\[open\]_\>_\*\:not\(summary\)\]\:textStyle_sm[open]:not(#\#) > *:not(summary)"
    );
}

#[test]
fn boosts_real_color_classes() {
    assert_eq!(
        boosted(r".dark .dark\:bg_\#262626"),
        r".dark:not(#\#) .dark\:bg_\#262626"
    );
    assert_eq!(
        boosted(r".dark .dark\:dvd-c_\#282828 > :not([hidden]) ~ :not([hidden])"),
        r".dark:not(#\#) .dark\:dvd-c_\#282828 > :not([hidden]) ~ :not([hidden])"
    );
    assert_eq!(
        boosted(
            r".\-webkit-mask-image_linear-gradient\(to_right\,_\#000_calc\(100\%_-_32px\)\,_transparent\)"
        ),
        r".\-webkit-mask-image_linear-gradient\(to_right\,_\#000_calc\(100\%_-_32px\)\,_transparent\):not(#\#)"
    );
    assert_eq!(
        boosted(
            r".bg-i_linear-gradient\(45deg\,_\#eee_25\%\,_transparent_25\%\)\,_linear-gradient\(-45deg\,_\#eee_25\%\,_transparent_25\%\)\,_linear-gradient\(45deg\,_transparent_75\%\,_\#eee_75\%\)\,_linear-gradient\(-45deg\,_transparent_75\%\,_\#eee_75\%\)"
        ),
        r".bg-i_linear-gradient\(45deg\,_\#eee_25\%\,_transparent_25\%\)\,_linear-gradient\(-45deg\,_\#eee_25\%\,_transparent_25\%\)\,_linear-gradient\(45deg\,_transparent_75\%\,_\#eee_75\%\)\,_linear-gradient\(-45deg\,_transparent_75\%\,_\#eee_75\%\):not(#\#)"
    );
    assert_eq!(
        boosted(r".bg-i_repeating-linear-gradient\(45deg\,_\#64748b_0_9px\,_\#cbd5e1_9px_18px\)"),
        r".bg-i_repeating-linear-gradient\(45deg\,_\#64748b_0_9px\,_\#cbd5e1_9px_18px\):not(#\#)"
    );
    assert_eq!(
        boosted(
            r#"[data-theme="dark"] .dark\:bg-i_linear-gradient\(45deg\,_\#2a2a2a_25\%\,_transparent_25\%\)\,_linear-gradient\(-45deg\,_\#2a2a2a_25\%\,_transparent_25\%\)\,_linear-gradient\(45deg\,_transparent_75\%\,_\#2a2a2a_75\%\)\,_linear-gradient\(-45deg\,_transparent_75\%\,_\#2a2a2a_75\%\)"#
        ),
        r#"[data-theme="dark"]:not(#\#) .dark\:bg-i_linear-gradient\(45deg\,_\#2a2a2a_25\%\,_transparent_25\%\)\,_linear-gradient\(-45deg\,_\#2a2a2a_25\%\,_transparent_25\%\)\,_linear-gradient\(45deg\,_transparent_75\%\,_\#2a2a2a_75\%\)\,_linear-gradient\(-45deg\,_transparent_75\%\,_\#2a2a2a_75\%\)"#
    );
    assert_eq!(
        boosted(r".hover\:bd-c_\#34d399:is(:hover, [data-hover])"),
        r".hover\:bd-c_\#34d399:is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(r#".dark .dark\:bg_\#191919, [data-theme="dark"] .dark\:bg_\#191919"#),
        r#".dark:not(#\#) .dark\:bg_\#191919, [data-theme="dark"]:not(#\#) .dark\:bg_\#191919"#
    );
}

#[test]
fn boosts_real_important_classes() {
    assert_eq!(boosted(r".bg_bg\.muted\!"), r".bg_bg\.muted\!:not(#\#)");
    assert_eq!(
        boosted(r".sy_0\! > :not([hidden]) ~ :not([hidden])"),
        r".sy_0\!:not(#\#) > :not([hidden]) ~ :not([hidden])"
    );
}

#[test]
fn boosts_real_function_value_classes() {
    assert_eq!(
        boosted(r".bg_rgba\(233\,236\,239\,1\)"),
        r".bg_rgba\(233\,236\,239\,1\):not(#\#)"
    );
    assert_eq!(
        boosted(r".h_var\(--height\)"),
        r".h_var\(--height\):not(#\#)"
    );
    assert_eq!(
        boosted(r".dark .dark\:bg_rgba\(24\,24\,24\,0\.3\)"),
        r".dark:not(#\#) .dark\:bg_rgba\(24\,24\,24\,0\.3\)"
    );
    assert_eq!(
        boosted(
            r#".expanded\:trf_rotate\(180deg\):is([aria-expanded=true], [data-expanded], [data-state="expanded"])"#
        ),
        r#".expanded\:trf_rotate\(180deg\):is([aria-expanded=true], [data-expanded], [data-state="expanded"]):not(#\#)"#
    );
    assert_eq!(
        boosted(
            r".hover\:bg_rgba\(255\,_255\,_255\,_0\.10\):is(:hover, [data-hover]):not(:disabled)"
        ),
        r".hover\:bg_rgba\(255\,_255\,_255\,_0\.10\):is(:hover, [data-hover]):not(:disabled):not(#\#)"
    );
    assert_eq!(
        boosted(r".bg_rgba\(10\,10\,10\,0\.55\)"),
        r".bg_rgba\(10\,10\,10\,0\.55\):not(#\#)"
    );
    assert_eq!(
        boosted(
            r".bg-i_radial-gradient\(ellipse_95\%_68\%_at_50\%_118\%\,_rgba\(124\,108\,255\,0\.42\)\,_rgba\(56\,189\,248\,0\.24\)_38\%\,_rgba\(52\,211\,153\,0\.18\)_58\%\,_transparent_76\%\)"
        ),
        r".bg-i_radial-gradient\(ellipse_95\%_68\%_at_50\%_118\%\,_rgba\(124\,108\,255\,0\.42\)\,_rgba\(56\,189\,248\,0\.24\)_38\%\,_rgba\(52\,211\,153\,0\.18\)_58\%\,_transparent_76\%\):not(#\#)"
    );
    assert_eq!(
        boosted(r".w_min\(420px\,_100\%\)"),
        r".w_min\(420px\,_100\%\):not(#\#)"
    );
    assert_eq!(
        boosted(r#"[data-theme="dark"] .dark\:filter_invert\(0\)"#),
        r#"[data-theme="dark"]:not(#\#) .dark\:filter_invert\(0\)"#
    );
    assert_eq!(
        boosted(
            r".hover\:bx-sh_0_0_22px_-4px_rgba\(52\,211\,153\,0\.55\):is(:hover, [data-hover])"
        ),
        r".hover\:bx-sh_0_0_22px_-4px_rgba\(52\,211\,153\,0\.55\):is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(r".hover\:trf_translateX\(4px\):is(:hover, [data-hover])"),
        r".hover\:trf_translateX\(4px\):is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(r".md\:grid-tc_repeat\(2\,_1fr\)"),
        r".md\:grid-tc_repeat\(2\,_1fr\):not(#\#)"
    );
    assert_eq!(
        boosted(
            r".bg-i_url\(https\:\/\/images\.unsplash\.com\/photo-1501785888041-af3ef285b470\?w\=800\&q\=80\)"
        ),
        r".bg-i_url\(https\:\/\/images\.unsplash\.com\/photo-1501785888041-af3ef285b470\?w\=800\&q\=80\):not(#\#)"
    );
    assert_eq!(
        boosted(r".bg_rgb\(229_229_229_\/_0\.7\)"),
        r".bg_rgb\(229_229_229_\/_0\.7\):not(#\#)"
    );
    assert_eq!(
        boosted(r".z_calc\(var\(--dialog-z-index\)_\+_var\(--layer-index\,_0\)\)"),
        r".z_calc\(var\(--dialog-z-index\)_\+_var\(--layer-index\,_0\)\):not(#\#)"
    );
    assert_eq!(
        boosted(r".max-h_calc\(100\%_-_7\.5rem\)"),
        r".max-h_calc\(100\%_-_7\.5rem\):not(#\#)"
    );
    assert_eq!(
        boosted(
            r".pt_calc\(var\(--navbar-height\)_\+_var\(--banner-height\)_\+_var\(--tabbar-height\)\)"
        ),
        r".pt_calc\(var\(--navbar-height\)_\+_var\(--banner-height\)_\+_var\(--tabbar-height\)\):not(#\#)"
    );
    assert_eq!(
        boosted(
            r#".dark .dark\:bg_rgb\(17_17_17_\/_0\.2\), [data-theme="dark"] .dark\:bg_rgb\(17_17_17_\/_0\.2\)"#
        ),
        r#".dark:not(#\#) .dark\:bg_rgb\(17_17_17_\/_0\.2\), [data-theme="dark"]:not(#\#) .dark\:bg_rgb\(17_17_17_\/_0\.2\)"#
    );
    assert_eq!(
        boosted(
            r#".dark .dark\:bg_rgba\(255\,_255\,_255\,_0\.1\), [data-theme="dark"] .dark\:bg_rgba\(255\,_255\,_255\,_0\.1\)"#
        ),
        r#".dark:not(#\#) .dark\:bg_rgba\(255\,_255\,_255\,_0\.1\), [data-theme="dark"]:not(#\#) .dark\:bg_rgba\(255\,_255\,_255\,_0\.1\)"#
    );
    assert_eq!(
        boosted(
            r#".dark .dark\:bd-c_rgb\(38_38_38_\/_1\), [data-theme="dark"] .dark\:bd-c_rgb\(38_38_38_\/_1\)"#
        ),
        r#".dark:not(#\#) .dark\:bd-c_rgb\(38_38_38_\/_1\), [data-theme="dark"]:not(#\#) .dark\:bd-c_rgb\(38_38_38_\/_1\)"#
    );
    assert_eq!(
        boosted(
            r#".dark .hover\:dark\:bg_rgb\(219_234_254_\/_0\.1\):is(:hover, [data-hover]), [data-theme="dark"] .hover\:dark\:bg_rgb\(219_234_254_\/_0\.1\):is(:hover, [data-hover])"#
        ),
        r#".dark:not(#\#) .hover\:dark\:bg_rgb\(219_234_254_\/_0\.1\):is(:hover, [data-hover]), [data-theme="dark"]:not(#\#) .hover\:dark\:bg_rgb\(219_234_254_\/_0\.1\):is(:hover, [data-hover])"#
    );
    assert_eq!(
        boosted(
            r".hover\:bx-sh_6px_6px_0px_0px_var\(--shadow-color\,_black\):is(:hover, [data-hover])"
        ),
        r".hover\:bx-sh_6px_6px_0px_0px_var\(--shadow-color\,_black\):is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(r".hover\:trf_scale\(1\.1\):is(:hover, [data-hover])"),
        r".hover\:trf_scale\(1\.1\):is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(
            r".before\:top_calc\(var\(--navbar-height\)_\+_var\(--banner-height\)_\+_var\(--tabbar-height\)\)::before"
        ),
        r".before\:top_calc\(var\(--navbar-height\)_\+_var\(--banner-height\)_\+_var\(--tabbar-height\)\):not(#\#)::before"
    );
    assert_eq!(
        boosted(r".lg\:grid-tc_1\.5fr_repeat\(4\,_minmax\(0\,_1fr\)\)"),
        r".lg\:grid-tc_1\.5fr_repeat\(4\,_minmax\(0\,_1fr\)\):not(#\#)"
    );
}

#[test]
fn boosts_real_condition_classes() {
    assert_eq!(
        boosted(r".dark .dark\:bg_blue\.300"),
        r".dark:not(#\#) .dark\:bg_blue\.300"
    );
    assert_eq!(
        boosted(
            r#".dark .expanded\:dark\:c_primary:is([aria-expanded=true], [data-expanded], [data-state="expanded"])"#
        ),
        r#".dark:not(#\#) .expanded\:dark\:c_primary:is([aria-expanded=true], [data-expanded], [data-state="expanded"])"#
    );
    assert_eq!(
        boosted(
            r#".expanded\:bg_primary:is([aria-expanded=true], [data-expanded], [data-state="expanded"])"#
        ),
        r#".expanded\:bg_primary:is([aria-expanded=true], [data-expanded], [data-state="expanded"]):not(#\#)"#
    );
    assert_eq!(
        boosted(r".selected\:c_text\.complementary:is([aria-selected=true], [data-selected])"),
        r".selected\:c_text\.complementary:is([aria-selected=true], [data-selected]):not(#\#)"
    );
    assert_eq!(
        boosted(r".loading\:vis_hidden:is([data-loading], [aria-busy=true])"),
        r".loading\:vis_hidden:is([data-loading], [aria-busy=true]):not(#\#)"
    );
    assert_eq!(
        boosted(r".hidden\:d_none:is([hidden])"),
        r".hidden\:d_none:is([hidden]):not(#\#)"
    );
    assert_eq!(
        boosted(
            r#".group:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) .groupExpanded\:bg_primary"#
        ),
        r#".group:is([aria-expanded=true], [data-expanded], [data-state="expanded"]):not(#\#) .groupExpanded\:bg_primary"#
    );
    assert_eq!(
        boosted(
            r#".group:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) .checked\:groupExpanded\:c_black:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])"#
        ),
        r#".group:is([aria-expanded=true], [data-expanded], [data-state="expanded"]):not(#\#) .checked\:groupExpanded\:c_black:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])"#
    );
    assert_eq!(
        boosted(
            r".disabled\:cursor_not-allowed:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])"
        ),
        r".disabled\:cursor_not-allowed:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]):not(#\#)"
    );
    assert_eq!(
        boosted(
            r#".checked\:c_black:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])"#
        ),
        r#".checked\:c_black:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]):not(#\#)"#
    );
    assert_eq!(
        boosted(
            r#".checked\:hover\:c_text\.default:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]):is(:hover, [data-hover]):not(:disabled)"#
        ),
        r#".checked\:hover\:c_text\.default:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]):is(:hover, [data-hover]):not(:disabled):not(#\#)"#
    );
    assert_eq!(
        boosted(r".trs_background_0\.12s\,_color_0\.12s"),
        r".trs_background_0\.12s\,_color_0\.12s:not(#\#)"
    );
    assert_eq!(boosted(r".md\:gap_0\.5"), r".md\:gap_0\.5:not(#\#)");
    assert_eq!(
        boosted(r".dark .dark\:bg_neutral\.950\/90"),
        r".dark:not(#\#) .dark\:bg_neutral\.950\/90"
    );
    assert_eq!(
        boosted(r".hover\:bg_red\.400:is(:hover, [data-hover])"),
        r".hover\:bg_red\.400:is(:hover, [data-hover]):not(#\#)"
    );
    assert_eq!(
        boosted(
            r#".dark .dark\:button--color_main, [data-theme="dark"] .dark\:button--color_main"#
        ),
        r#".dark:not(#\#) .dark\:button--color_main, [data-theme="dark"]:not(#\#) .dark\:button--color_main"#
    );
    assert_eq!(
        boosted(r".\--banner-height_2\.5rem"),
        r".\--banner-height_2\.5rem:not(#\#)"
    );
    assert_eq!(
        boosted(r".highlighted\:bg_bg\.muted[data-highlighted]"),
        r".highlighted\:bg_bg\.muted[data-highlighted]:not(#\#)"
    );
    assert_eq!(
        boosted(r".highlighted\:c_fg[data-highlighted]"),
        r".highlighted\:c_fg[data-highlighted]:not(#\#)"
    );
    assert_eq!(
        boosted(r".highlighted\:before\:bg_accent\.emphasis[data-highlighted]::before"),
        r".highlighted\:before\:bg_accent\.emphasis[data-highlighted]:not(#\#)::before"
    );
    assert_eq!(
        boosted(r#".dark .dark\:bg_gray\.800, [data-theme="dark"] .dark\:bg_gray\.800"#),
        r#".dark:not(#\#) .dark\:bg_gray\.800, [data-theme="dark"]:not(#\#) .dark\:bg_gray\.800"#
    );
    assert_eq!(
        boosted(
            r#".dark .expanded\:dark\:bg_whiteAlpha\.300:is([aria-expanded=true], [data-expanded], [data-state="expanded"]), [data-theme="dark"] .expanded\:dark\:bg_whiteAlpha\.300:is([aria-expanded=true], [data-expanded], [data-state="expanded"])"#
        ),
        r#".dark:not(#\#) .expanded\:dark\:bg_whiteAlpha\.300:is([aria-expanded=true], [data-expanded], [data-state="expanded"]), [data-theme="dark"]:not(#\#) .expanded\:dark\:bg_whiteAlpha\.300:is([aria-expanded=true], [data-expanded], [data-state="expanded"])"#
    );
    assert_eq!(
        boosted(
            r#".dark .hover\:dark\:bg_yellow\.300:is(:hover, [data-hover]), [data-theme="dark"] .hover\:dark\:bg_yellow\.300:is(:hover, [data-hover])"#
        ),
        r#".dark:not(#\#) .hover\:dark\:bg_yellow\.300:is(:hover, [data-hover]), [data-theme="dark"]:not(#\#) .hover\:dark\:bg_yellow\.300:is(:hover, [data-hover])"#
    );
    assert_eq!(
        boosted(
            r#".dark .hover\:dark\:c_black:is(:hover, [data-hover]), [data-theme="dark"] .hover\:dark\:c_black:is(:hover, [data-hover])"#
        ),
        r#".dark:not(#\#) .hover\:dark\:c_black:is(:hover, [data-hover]), [data-theme="dark"]:not(#\#) .hover\:dark\:c_black:is(:hover, [data-hover])"#
    );
    assert_eq!(
        boosted(
            r#".dark .dark\:hover\:c_gray\.50:is(:hover, [data-hover]), [data-theme="dark"] .dark\:hover\:c_gray\.50:is(:hover, [data-hover]), .dark .hover\:dark\:c_gray\.50:is(:hover, [data-hover]), [data-theme="dark"] .hover\:dark\:c_gray\.50:is(:hover, [data-hover])"#
        ),
        r#".dark:not(#\#) .dark\:hover\:c_gray\.50:is(:hover, [data-hover]), [data-theme="dark"]:not(#\#) .dark\:hover\:c_gray\.50:is(:hover, [data-hover]), .dark:not(#\#) .hover\:dark\:c_gray\.50:is(:hover, [data-hover]), [data-theme="dark"]:not(#\#) .hover\:dark\:c_gray\.50:is(:hover, [data-hover])"#
    );
    assert_eq!(
        boosted(r".icon\:size_4 :where(svg)"),
        r".icon\:size_4:not(#\#) :where(svg)"
    );
    assert_eq!(
        boosted(r".icon\:c_yellow\.400 :where(svg)"),
        r".icon\:c_yellow\.400:not(#\#) :where(svg)"
    );
    assert_eq!(
        boosted(
            r#".expanded\:bg_bg\.subtle:is([aria-expanded=true], [data-expanded], [data-state="expanded"])"#
        ),
        r#".expanded\:bg_bg\.subtle:is([aria-expanded=true], [data-expanded], [data-state="expanded"]):not(#\#)"#
    );
    assert_eq!(
        boosted(r".selected\:fw_medium:is([aria-selected=true], [data-selected])"),
        r".selected\:fw_medium:is([aria-selected=true], [data-selected]):not(#\#)"
    );
    assert_eq!(
        boosted(r#".closed\:anim-dur_150ms:is([closed], [data-closed], [data-state="closed"])"#),
        r#".closed\:anim-dur_150ms:is([closed], [data-closed], [data-state="closed"]):not(#\#)"#
    );
    assert_eq!(
        boosted(
            r#".closed\:anim-n_slide-to-bottom-full\,_fade-out:is([closed], [data-closed], [data-state="closed"])"#
        ),
        r#".closed\:anim-n_slide-to-bottom-full\,_fade-out:is([closed], [data-closed], [data-state="closed"]):not(#\#)"#
    );
    assert_eq!(
        boosted(
            r#":where([dir=rtl], :dir(rtl)) .closed\:rtl\:anim-n_slide-to-left-full\,_fade-out:is([closed], [data-closed], [data-state="closed"])"#
        ),
        r#":where([dir=rtl], :dir(rtl)):not(#\#) .closed\:rtl\:anim-n_slide-to-left-full\,_fade-out:is([closed], [data-closed], [data-state="closed"])"#
    );
    assert_eq!(
        boosted(r".even\:bg_bg\.subtle:nth-child(even)"),
        r".even\:bg_bg\.subtle:nth-child(even):not(#\#)"
    );
    assert_eq!(
        boosted(
            r#".open\:bg_bg\.subtle:is([open], [data-open], [data-state="open"], :popover-open)"#
        ),
        r#".open\:bg_bg\.subtle:is([open], [data-open], [data-state="open"], :popover-open):not(#\#)"#
    );
    assert_eq!(
        boosted(
            r#".open\:anim-dur_200ms:is([open], [data-open], [data-state="open"], :popover-open)"#
        ),
        r#".open\:anim-dur_200ms:is([open], [data-open], [data-state="open"], :popover-open):not(#\#)"#
    );
    assert_eq!(
        boosted(
            r#".open\:anim-n_slide-from-bottom-full\,_fade-in:is([open], [data-open], [data-state="open"], :popover-open)"#
        ),
        r#".open\:anim-n_slide-from-bottom-full\,_fade-in:is([open], [data-open], [data-state="open"], :popover-open):not(#\#)"#
    );
    assert_eq!(
        boosted(
            r#":where([dir=rtl], :dir(rtl)) .open\:rtl\:anim-n_slide-from-left-full\,_fade-in:is([open], [data-open], [data-state="open"], :popover-open)"#
        ),
        r#":where([dir=rtl], :dir(rtl)):not(#\#) .open\:rtl\:anim-n_slide-from-left-full\,_fade-in:is([open], [data-open], [data-state="open"], :popover-open)"#
    );
    assert_eq!(
        boosted(r".hover\:after\:bg_accent:is(:hover, [data-hover])::after"),
        r".hover\:after\:bg_accent:is(:hover, [data-hover]):not(#\#)::after"
    );
}

#[test]
fn boosts_cascade_layer_spec_selectors() {
    assert_eq!(boosted(r"target"), r"target:not(#\#)");
    assert_eq!(boosted(r"#target::before"), r"#target:not(#\##\#)::before");
    assert_eq!(
        boosted(r"#foo #bar target::before:hover"),
        r"#foo:not(#\##\##\#) #bar target::before:hover"
    );
    assert_eq!(boosted(r"target:before"), r"target:not(#\#):before");
    assert_eq!(boosted(r"#foo #fooz"), r"#foo:not(#\##\##\#) #fooz");
    assert_eq!(
        boosted(r"#foo #fooz #foos"),
        r"#foo:not(#\##\##\##\#) #fooz #foos"
    );
    assert_eq!(
        boosted(r"span h1, span p"),
        r"span:not(#\#) h1, span:not(#\#) p"
    );
    assert_eq!(boosted(r":where(.foo)"), r":where(.foo):not(#\#)");
}

#[test]
fn counts_no_ids_inside_where() {
    assert_eq!(count_id_selectors(r":where(*)"), 0);
    assert_eq!(count_id_selectors(r":where"), 0);
    assert_eq!(count_id_selectors(r":where()"), 0);
    assert_eq!(count_id_selectors(r":where(.a)"), 0);
    assert_eq!(
        count_id_selectors(r"header:where(#top) nav li:nth-child(2n + 1)"),
        0
    );
    assert_eq!(count_id_selectors(r":where(#foo, .bar, baz)"), 0);
}

#[test]
fn counts_ids_inside_not() {
    assert_eq!(count_id_selectors(r":not(*)"), 0);
    assert_eq!(count_id_selectors(r":not"), 0);
    assert_eq!(count_id_selectors(r":not()"), 0);
    assert_eq!(count_id_selectors(r":not(.a)"), 0);
    assert_eq!(count_id_selectors(r"#s12:not(FOO)"), 1);
    assert_eq!(count_id_selectors(r":not(#foo, .bar, baz)"), 1);
    assert_eq!(count_id_selectors(r"#footer *:not(nav) li"), 1);
}

#[test]
fn counts_ids_inside_has() {
    assert_eq!(count_id_selectors(r":has"), 0);
    assert_eq!(count_id_selectors(r":has()"), 0);
    assert_eq!(count_id_selectors(r":has(.a)"), 0);
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-child(2n + 1)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-child(2n + 1 of)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-child(2n + 1 of of)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-child(2n + 1 of .foo)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-child(2n + 1 of .foo, #bar)"),
        2
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-child(2n + 1 of .foo, #bar, #bar > #baz)"),
        3
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-child(2n + 1 of #bar > #baz, .foo, #bar)"),
        3
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-last-child(2n + 1)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-last-child(2n + 1 of)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-last-child(2n + 1 of of)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-last-child(2n + 1 of .foo)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"header:has(#top) nav li:nth-last-child(2n + 1 of .foo, #bar)"),
        2
    );
    assert_eq!(
        count_id_selectors(
            r"header:has(#top) nav li:nth-last-child(2n + 1 of .foo, #bar, #bar > #baz)"
        ),
        3
    );
    assert_eq!(
        count_id_selectors(
            r"header:has(#top) nav li:nth-last-child(2n + 1 of #bar > #baz, .foo, #bar)"
        ),
        3
    );
    assert_eq!(count_id_selectors(r":has(#foo, .bar, baz)"), 1);
}

#[test]
fn counts_ids_inside_nth_child_of() {
    assert_eq!(count_id_selectors(r":nth-child"), 0);
    assert_eq!(count_id_selectors(r":nth-child()"), 0);
    assert_eq!(count_id_selectors(r":nth-child(1n)"), 0);
    assert_eq!(count_id_selectors(r":nth-child(.a)"), 0);
    assert_eq!(count_id_selectors(r":nth-last-child"), 0);
    assert_eq!(count_id_selectors(r":nth-last-child()"), 0);
    assert_eq!(count_id_selectors(r":nth-last-child(1n)"), 0);
    assert_eq!(count_id_selectors(r":nth-last-child(.a)"), 0);
    assert_eq!(count_id_selectors(r"#foo:nth-child(2)"), 1);
    assert_eq!(count_id_selectors(r"#foo:nth-child(even)"), 1);
    assert_eq!(count_id_selectors(r"#foo:nth-child(-n + 2)"), 1);
    assert_eq!(count_id_selectors(r"#foo:nth-child(n of.li)"), 1);
    assert_eq!(count_id_selectors(r"#foo:nth-child(n of.li,.li.li)"), 1);
    assert_eq!(count_id_selectors(r"#foo:nth-child(n of.li, .li.li)"), 1);
    assert_eq!(count_id_selectors(r"#foo:nth-child(n of li)"), 1);
    assert_eq!(
        count_id_selectors(r"#foo:nth-child(-n+3 of li.important)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"#foo:nth-child(-n+3 of li.important, .class1.class2.class3)"),
        1
    );
    assert_eq!(
        count_id_selectors(r"#foo:nth-last-child(-n+3 of li, .important)"),
        1
    );
    assert_eq!(
        count_id_selectors(r":nth-child(n of .foo > .bar, .fooz > a.baz)"),
        0
    );
    assert_eq!(count_id_selectors(r":nth-of-type"), 0);
    assert_eq!(count_id_selectors(r":nth-of-type()"), 0);
    assert_eq!(count_id_selectors(r":nth-of-type(1n)"), 0);
    assert_eq!(count_id_selectors(r":nth-of-type(.a)"), 0);
    assert_eq!(count_id_selectors(r":nth-last-of-type"), 0);
    assert_eq!(count_id_selectors(r":nth-last-of-type()"), 0);
    assert_eq!(count_id_selectors(r":nth-last-of-type(1n)"), 0);
    assert_eq!(count_id_selectors(r":nth-last-of-type(.a)"), 0);
    assert_eq!(count_id_selectors(r"li:nth-child(even)+p"), 0);
    assert_eq!(count_id_selectors(r"li:nth-child(2n+1)+p"), 0);
    assert_eq!(count_id_selectors(r"li:nth-child( 2n + 1 )+p"), 0);
    assert_eq!(count_id_selectors(r"li:nth-child(2n-1)+p"), 0);
    assert_eq!(count_id_selectors(r"li:nth-child(2n-1) p"), 0);
    assert_eq!(count_id_selectors(r":local(:nth-child(2n) .test)"), 0);
}

#[test]
fn counts_ids_inside_is_matches_and_any() {
    assert_eq!(count_id_selectors(r":is(*)"), 0);
    assert_eq!(count_id_selectors(r":-moz-any"), 0);
    assert_eq!(count_id_selectors(r":-moz-any()"), 0);
    assert_eq!(count_id_selectors(r":-moz-any(.a)"), 0);
    assert_eq!(count_id_selectors(r":-webkit-any"), 0);
    assert_eq!(count_id_selectors(r":-webkit-any()"), 0);
    assert_eq!(count_id_selectors(r":-webkit-any(.a)"), 0);
    assert_eq!(count_id_selectors(r":any"), 0);
    assert_eq!(count_id_selectors(r":any()"), 0);
    assert_eq!(count_id_selectors(r":any(.a)"), 0);
    assert_eq!(count_id_selectors(r":is"), 0);
    assert_eq!(count_id_selectors(r":is()"), 0);
    assert_eq!(count_id_selectors(r":is(.a)"), 0);
    assert_eq!(count_id_selectors(r":matches"), 0);
    assert_eq!(count_id_selectors(r":matches()"), 0);
    assert_eq!(count_id_selectors(r":matches(.a)"), 0);
    assert_eq!(count_id_selectors(r":is(a + a, b + b + b)"), 0);
    assert_eq!(count_id_selectors(r":is(.a + .a, .b + .b + .b)"), 0);
    assert_eq!(count_id_selectors(r":is(#a + #a, #b + #b + #b)"), 3);
    assert_eq!(count_id_selectors(r":is(a + a + a, b + b)"), 0);
    assert_eq!(count_id_selectors(r":is(.a + .a + .a, .b + .b)"), 0);
    assert_eq!(count_id_selectors(r":is(#a + #a + #a, #b + #b)"), 3);
    assert_eq!(
        count_id_selectors(r":is(a + a, b + b + b, :is(a + a, b + b + b))"),
        0
    );
    assert_eq!(
        count_id_selectors(r":is(.a + .a, .b + .b + .b, :is(.a + .a, .b + .b + .b))"),
        0
    );
    assert_eq!(
        count_id_selectors(r":is(#a + #a, #b + #b + #b, :is(#a + #a, #b + #b + #b))"),
        3
    );
    assert_eq!(count_id_selectors(r":is(a + a + a, b + b + b)"), 0);
    assert_eq!(count_id_selectors(r":is(.a + .a + .a, .b + .b + .b)"), 0);
    assert_eq!(count_id_selectors(r":is(#a + #a + #a, #b + #b + #b)"), 3);
    assert_eq!(count_id_selectors(r":is(.a + .a + a.a, .b + .b + .b)"), 0);
    assert_eq!(count_id_selectors(r":is(#a + #a + a#a, #b + #b + #b)"), 3);
    assert_eq!(count_id_selectors(r":is(#a + #a + #a.a, #b + #b + #b)"), 3);
    assert_eq!(count_id_selectors(r":is(.a + .a + .a, .b + .b + b.b)"), 0);
    assert_eq!(count_id_selectors(r":is(#a + #a + #a, #b + #b + b#b)"), 3);
    assert_eq!(count_id_selectors(r":is(#a + #a + #a, #b + #b + #b.b)"), 3);
    assert_eq!(count_id_selectors(r".foo :is(.bar, #baz)"), 1);
    assert_eq!(count_id_selectors(r"ul > li:is(.highlighted, .active)"), 0);
    assert_eq!(count_id_selectors(r":is(#foo, .bar, baz)"), 1);
    assert_eq!(count_id_selectors(r":matches(#foo, .bar, baz)"), 1);
    assert_eq!(count_id_selectors(r":-moz-any(#foo, .bar, baz)"), 1);
    assert_eq!(count_id_selectors(r":any(#foo, .bar, baz)"), 0);
    assert_eq!(count_id_selectors(r":-webkit-any(#foo, .bar, baz)"), 0);
}

#[test]
fn counts_ids_inside_host_and_slotted() {
    assert_eq!(count_id_selectors(r":host"), 0);
    assert_eq!(count_id_selectors(r":host()"), 0);
    assert_eq!(count_id_selectors(r":host(#foo.bar)"), 1);
    assert_eq!(count_id_selectors(r":host-context()"), 0);
    assert_eq!(count_id_selectors(r":host-context(#foo.bar)"), 1);
    assert_eq!(count_id_selectors(r":host(#foo.bar invalid)"), 1);
    assert_eq!(count_id_selectors(r":host-context(#foo.bar invalid)"), 1);
    assert_eq!(count_id_selectors(r"::slotted"), 0);
    assert_eq!(count_id_selectors(r"::slotted()"), 0);
    assert_eq!(count_id_selectors(r"::slotted(div#foo)"), 1);
    assert_eq!(count_id_selectors(r"::slotted(#foo.bar)"), 1);
    assert_eq!(count_id_selectors(r"::slotted(#foo invalid)"), 1);
    assert_eq!(count_id_selectors(r"::slotted(#foo.bar invalid)"), 1);
}

#[test]
fn counts_ids_in_pseudo_elements() {
    assert_eq!(count_id_selectors(r"::before"), 0);
    assert_eq!(count_id_selectors(r"::view-transition"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-group(foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-group()"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-group(*)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-group(*.foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-group(foo.foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-group(.foo.fooz)"), 0);
    assert_eq!(
        count_id_selectors(r"::view-transition-group(foo.foo.fooz)"),
        0
    );
    assert_eq!(
        count_id_selectors(r"::view-transition-group(*.foo.fooz)"),
        0
    );
    assert_eq!(count_id_selectors(r"::view-transition-image-pair(foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-image-pair(*)"), 0);
    assert_eq!(
        count_id_selectors(r"::view-transition-image-pair(*.foo)"),
        0
    );
    assert_eq!(
        count_id_selectors(r"::view-transition-image-pair(foo.foo)"),
        0
    );
    assert_eq!(
        count_id_selectors(r"::view-transition-image-pair(.foo.fooz)"),
        0
    );
    assert_eq!(
        count_id_selectors(r"::view-transition-image-pair(foo.foo.fooz)"),
        0
    );
    assert_eq!(
        count_id_selectors(r"::view-transition-image-pair(*.foo.fooz)"),
        0
    );
    assert_eq!(count_id_selectors(r"::view-transition-old(foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-old()"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-old(*)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-old(*.foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-old(foo.foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-old(.foo.fooz)"), 0);
    assert_eq!(
        count_id_selectors(r"::view-transition-old(foo.foo.fooz)"),
        0
    );
    assert_eq!(count_id_selectors(r"::view-transition-old(*.foo.fooz)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-new(foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-new()"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-new(*)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-new(*.foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-new(foo.foo)"), 0);
    assert_eq!(count_id_selectors(r"::view-transition-new(.foo.fooz)"), 0);
    assert_eq!(
        count_id_selectors(r"::view-transition-new(foo.foo.fooz)"),
        0
    );
    assert_eq!(count_id_selectors(r"::view-transition-new(*.foo.fooz)"), 0);
    assert_eq!(count_id_selectors(r"::after"), 0);
    assert_eq!(count_id_selectors(r"::cue"), 0);
    assert_eq!(count_id_selectors(r"::BEFORE"), 0);
    assert_eq!(count_id_selectors(r"::first-line"), 0);
    assert_eq!(count_id_selectors(r"::first-letter"), 0);
}

#[test]
fn counts_ids_in_plain_selectors() {
    assert_eq!(count_id_selectors(r"*"), 0);
    assert_eq!(count_id_selectors(r":local"), 0);
    assert_eq!(count_id_selectors(r":local()"), 0);
    assert_eq!(count_id_selectors(r":local(.a)"), 0);
    assert_eq!(count_id_selectors(r":global"), 0);
    assert_eq!(count_id_selectors(r":global()"), 0);
    assert_eq!(count_id_selectors(r":global(.a)"), 0);
    assert_eq!(count_id_selectors(r":before"), 0);
    assert_eq!(count_id_selectors(r":focus"), 0);
    assert_eq!(count_id_selectors(r":active-view-transition"), 0);
    assert_eq!(count_id_selectors(r":active-view-transition-type(foo)"), 0);
    assert_eq!(count_id_selectors(r":active-view-transition-type(.foo)"), 0);
    assert_eq!(
        count_id_selectors(r":active-view-transition-type(.foo.bar)"),
        0
    );
    assert_eq!(
        count_id_selectors(r":active-view-transition-type(.foo .bar)"),
        0
    );
    assert_eq!(
        count_id_selectors(r":active-view-transition-type(foo, bar)"),
        0
    );
    assert_eq!(count_id_selectors(r":active-view-transition(*)"), 0);
    assert_eq!(count_id_selectors(r":active-view-transition(*, bar)"), 0);
    assert_eq!(count_id_selectors(r":active-view-transition(*, *)"), 0);
    assert_eq!(count_id_selectors(r":active-view-transition-type(*)"), 0);
    assert_eq!(
        count_id_selectors(r":active-view-transition-type(*, bar)"),
        0
    );
    assert_eq!(count_id_selectors(r":active-view-transition-type(*, *)"), 0);
    assert_eq!(count_id_selectors(r":lang()"), 0);
    assert_eq!(count_id_selectors(r":lang(nl-be)"), 0);
    assert_eq!(count_id_selectors(r":lang(nl-be, fr-be)"), 0);
    assert_eq!(count_id_selectors(r":lang(nl-be fr-be)"), 0);
    assert_eq!(count_id_selectors(r":lang(\*-Latn)"), 0);
    assert_eq!(count_id_selectors(r#":lang("*-Latn")"#), 0);
    assert_eq!(count_id_selectors(r":dir()"), 0);
    assert_eq!(count_id_selectors(r":dir(rtl)"), 0);
    assert_eq!(count_id_selectors(r":dir(rtl, ltr)"), 0);
    assert_eq!(count_id_selectors(r":dir(rtl ltr)"), 0);
    assert_eq!(count_id_selectors(r":state()"), 0);
    assert_eq!(count_id_selectors(r":state(foo)"), 0);
    assert_eq!(count_id_selectors(r":state(foo bar)"), 0);
    assert_eq!(count_id_selectors(r":state(foo, bar)"), 0);
    assert_eq!(count_id_selectors(r"li"), 0);
    assert_eq!(count_id_selectors(r"ul li"), 0);
    assert_eq!(count_id_selectors(r"UL OL+LI "), 0);
    assert_eq!(count_id_selectors(r"H1 + *[REL=up]"), 0);
    assert_eq!(count_id_selectors(r"UL OL LI.red"), 0);
    assert_eq!(count_id_selectors(r"LI.red.level"), 0);
    assert_eq!(count_id_selectors(r"#x34y"), 1);
    assert_eq!(count_id_selectors(r"header h1#sitetitle > .logo"), 1);
    assert_eq!(count_id_selectors(r":BEFORE"), 0);
    assert_eq!(count_id_selectors(r":after"), 0);
    assert_eq!(count_id_selectors(r":AFTER"), 0);
    assert_eq!(count_id_selectors(r":first-line"), 0);
    assert_eq!(count_id_selectors(r":first-letter"), 0);
    assert_eq!(count_id_selectors(r":hover"), 0);
    assert_eq!(count_id_selectors(r"ns|*"), 0);
    assert_eq!(count_id_selectors(r"ns|a"), 0);
    assert_eq!(count_id_selectors(r""), 0);
    assert_eq!(count_id_selectors(r"ul#nav li.active a"), 1);
    assert_eq!(count_id_selectors(r"body.ie7 .col_3 h2 ~ h2"), 0);
    assert_eq!(count_id_selectors(r"ul > li ul li ol li:first-letter"), 0);
    assert_eq!(count_id_selectors(r"body#home div#warning p.message"), 2);
    assert_eq!(count_id_selectors(r"* body#home>div#warning p.message"), 2);
    assert_eq!(count_id_selectors(r"#home #warning p.message"), 2);
    assert_eq!(count_id_selectors(r"#warning p.message"), 1);
    assert_eq!(count_id_selectors(r"#warning p"), 1);
    assert_eq!(count_id_selectors(r"p.message"), 0);
    assert_eq!(count_id_selectors(r"p"), 0);
    assert_eq!(count_id_selectors(r"li:bEfoRE"), 0);
    assert_eq!(count_id_selectors(r"li:first-child+p"), 0);
    assert_eq!(count_id_selectors(r".\3A -\)"), 0);
    assert_eq!(count_id_selectors(r".\3A \`\("), 0);
    assert_eq!(count_id_selectors(r".\3A .\`\("), 0);
    assert_eq!(count_id_selectors(r".\31 a2b3c"), 0);
    assert_eq!(count_id_selectors(r".\000031a2b3c"), 0);
    assert_eq!(count_id_selectors(r"#\#fake-id"), 1);
    assert_eq!(count_id_selectors(r".\#fake-id"), 0);
    assert_eq!(count_id_selectors(r"#\<p\>"), 1);
    assert_eq!(count_id_selectors(r".\#\.\#\.\#"), 0);
    assert_eq!(count_id_selectors(r".foo\.bar"), 0);
    assert_eq!(count_id_selectors(r".\:hover\:active"), 0);
    assert_eq!(count_id_selectors(r".\3A hover\3A active"), 0);
    assert_eq!(count_id_selectors(r".\000031  p"), 0);
    assert_eq!(count_id_selectors(r".\3A \`\( .another"), 0);
    assert_eq!(count_id_selectors(r".\--cool"), 0);
    assert_eq!(count_id_selectors(r"#home .\[page\]"), 1);
    assert_eq!(count_id_selectors(r"ul#nav#nav-main li.active a"), 2);
    assert_eq!(count_id_selectors(r".root :global .text"), 0);
    assert_eq!(
        count_id_selectors(r".localA :global .global-b :local(.local-c) .global-d"),
        0
    );
    assert_eq!(
        count_id_selectors(r".localA :global .global-b .global-c :local(.localD.localE) .global-d"),
        0
    );
    assert_eq!(
        count_id_selectors(r".localA :global(.global-b) .local-b"),
        0
    );
}
