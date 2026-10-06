use pandacss_sfc::mdx::lower;

#[test]
fn unclosed_expression_reports_a_diagnostic() {
    assert!(!lower("{css({color:'red'})").diagnostics.is_empty());
}

#[test]
fn unfinished_attribute_reports_a_diagnostic() {
    assert!(!lower("<Box color=").diagnostics.is_empty());
}

#[test]
fn unfinished_spread_reports_a_diagnostic() {
    assert!(!lower("<Box {...").diagnostics.is_empty());
}

#[test]
fn unclosed_attribute_quote_reports_a_diagnostic() {
    assert!(!lower("<Box color='red").diagnostics.is_empty());
}

#[test]
fn mismatched_closing_tag_reports_a_diagnostic() {
    assert!(!lower("<Box><span /></Other>").diagnostics.is_empty());
}
