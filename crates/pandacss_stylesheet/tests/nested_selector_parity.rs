//! Nested `&` / combinator parity via nested `css({ … })` object keys.

use insta::assert_snapshot;
use pandacss_config::UserConfig;
use pandacss_stylesheet::StylesheetLayer;

use crate::common::{compile_layer_css, config};

fn base_config() -> UserConfig {
    config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "display": { "className": "d" },
            "padding": { "className": "p" }
        }
    }))
}

fn compile_nested(source_body: &str) -> String {
    let source = format!("import {{ css }} from '@panda/css'; css({source_body})");
    compile_layer_css(&base_config(), &source, &[StylesheetLayer::Utilities])
}

#[test]
fn nested_ampersand_replaces_with_pseudo() {
    assert_snapshot!(compile_nested("{ '&:hover': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:hover\]\:c_red:hover {
    color: red;
  }
}
"#);
}

#[test]
fn nested_ampersand_replaces_comma_list_pseudos() {
    assert_snapshot!(compile_nested("{ '&:hover, &:active': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:hover\,_\&\:active\]\:c_red:hover, .\[\&\:hover\,_\&\:active\]\:c_red:active {
    color: red;
  }
}
"#);
}

#[test]
fn nested_ampersand_replaces_bem_elem_shorthand() {
    assert_snapshot!(compile_nested("{ '&_elem': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_elem\]\:c_red_elem {
    color: red;
  }
}
"#);
}

#[test]
fn nested_ampersand_with_ancestor_and_pseudo() {
    assert_snapshot!(compile_nested("{ 'body &:hover b': { color: 'red' } }"), @r#"
@layer utilities {
  body .\[body_\&\:hover_b\]\:c_red:hover b {
    color: red;
  }
}
"#);
}

#[test]
fn nested_adjacent_sibling_ampersands() {
    assert_snapshot!(compile_nested("{ '& + &': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\+_\&\]\:c_red + .\[\&_\+_\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_general_sibling() {
    assert_snapshot!(compile_nested("{ '& ~ .sibling': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\~_\.sibling\]\:c_red ~ .sibling {
    color: red;
  }
}
"#);
}

#[test]
fn nested_tail_ampersand_one_level() {
    assert_snapshot!(compile_nested("{ '.b &': { color: 'red' } }"), @r#"
@layer utilities {
  .b .\[\.b_\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_tail_ampersand_three_levels() {
    assert_snapshot!(compile_nested("{ '&:hover': { '& .b': { '.c &': { color: 'red' } } } }"), @r#"
@layer utilities {
  .c .\[\&\:hover\]\:\[\&_\.b\]\:\[\.c_\&\]\:c_red:hover .b {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_chain_hover_before() {
    assert_snapshot!(compile_nested("{ '&:hover': { '&::before': { color: 'red' } } }"), @r#"
@layer utilities {
  .\[\&\:hover\]\:\[\&\:\:before\]\:c_red:hover::before {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_then_descendant_space() {
    assert_snapshot!(compile_nested("{ '&:last-child': { '& .divider': { display: 'none' } } }"), @r#"
@layer utilities {
  .\[\&\:last-child\]\:\[\&_\.divider\]\:d_none:last-child .divider {
    display: none;
  }
}
"#);
}

#[test]
fn nested_pseudo_then_descendant_child() {
    assert_snapshot!(compile_nested("{ '&:last-child': { '& > .divider': { display: 'none' } } }"), @r#"
@layer utilities {
  .\[\&\:last-child\]\:\[\&_\>_\.divider\]\:d_none:last-child > .divider {
    display: none;
  }
}
"#);
}

#[test]
fn nested_pseudo_then_descendant_hover_child() {
    assert_snapshot!(compile_nested("{ '&:hover': { '& .child': { color: 'red' } } }"), @r#"
@layer utilities {
  .\[\&\:hover\]\:\[\&_\.child\]\:c_red:hover .child {
    color: red;
  }
}
"#);
}

#[test]
fn nested_descendant_then_pseudo_reversed_author_order() {
    assert_snapshot!(compile_nested("{ '& .divider': { '&:last-child': { display: 'none' } } }"), @r#"
@layer utilities {
  .\[\&_\.divider\]\:\[\&\:last-child\]\:d_none .divider:last-child {
    display: none;
  }
}
"#);
}

#[test]
fn nested_not_with_ampersand() {
    assert_snapshot!(compile_nested("{ '&:not(&.no)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:not\(\&\.no\)\]\:c_red:not(.\[\&\:not\(\&\.no\)\]\:c_red.no) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_comma_descendant_list() {
    assert_snapshot!(compile_nested("{ '& .one, & .two': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\.one\,_\&_\.two\]\:c_red .one, .\[\&_\.one\,_\&_\.two\]\:c_red .two {
    color: red;
  }
}
"#);
}

#[test]
fn nested_plain_selector_becomes_descendant() {
    assert_snapshot!(compile_nested("{ '& .child': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\.child\]\:c_red .child {
    color: red;
  }
}
"#);
}

#[test]
fn nested_attribute_selector_with_ampersand_in_string() {
    assert_snapshot!(compile_nested(r#"{ '&[data-category="sound & vision"]': { color: 'red' } }"#), @r#"
@layer utilities {
  .\[\&\[data-category\=\"sound_\&_vision\"\]\]\:c_red[data-category="sound & vision"] {
    color: red;
  }
}
"#);
}

#[test]
fn nested_attribute_selector_single_quoted_ampersand_in_string() {
    assert_snapshot!(compile_nested(r#"{ "&[data-category='Sound & Vision']": { color: 'red' } }"#), @r#"
@layer utilities {
  .\[\&\[data-category\=\'Sound_\&_Vision\'\]\]\:c_red[data-category='Sound & Vision'] {
    color: red;
  }
}
"#);
}

#[test]
fn nested_has_with_not_ampersand_list() {
    assert_snapshot!(compile_nested("{ '&:has(&, :not(&))': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:has\(\&\,_\:not\(\&\)\)\]\:c_red:has(.\[\&\:has\(\&\,_\:not\(\&\)\)\]\:c_red, :not(.\[\&\:has\(\&\,_\:not\(\&\)\)\]\:c_red)) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_chained_adjacent_sibling_ampersands() {
    assert_snapshot!(compile_nested("{ '&&+&': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\&\+\&\]\:c_red.\[\&\&\+\&\]\:c_red+.\[\&\&\+\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_general_sibling_between_ampersands() {
    assert_snapshot!(compile_nested("{ '& ~ &': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\~_\&\]\:c_red ~ .\[\&_\~_\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_double_ampersand_compound() {
    assert_snapshot!(compile_nested("{ '&&': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\&\]\:c_red.\[\&\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_triple_ampersand_compound() {
    assert_snapshot!(compile_nested("{ '&&&': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\&\&\]\:c_red.\[\&\&\&\]\:c_red.\[\&\&\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_tag_suffix() {
    assert_snapshot!(compile_nested("{ '&html': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&html\]\:c_redhtml {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_tag_prefix() {
    assert_snapshot!(compile_nested("{ 'html&': { color: 'red' } }"), @r#"
@layer utilities {
  html.\[html\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_not_with_adjacent_sibling_ampersands() {
    assert_snapshot!(compile_nested("{ '&.b :not(& + &)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\.b_\:not\(\&_\+_\&\)\]\:c_red.b :not(.\[\&\.b_\:not\(\&_\+_\&\)\]\:c_red + .\[\&\.b_\:not\(\&_\+_\&\)\]\:c_red) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_not_with_adjacent_sibling_ampersands() {
    assert_snapshot!(compile_nested("{ '&.b:not(& + &)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\.b\:not\(\&_\+_\&\)\]\:c_red.b:not(.\[\&\.b\:not\(\&_\+_\&\)\]\:c_red + .\[\&\.b\:not\(\&_\+_\&\)\]\:c_red) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_then_descendant_ampersand() {
    assert_snapshot!(compile_nested("{ '&.b &': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\.b_\&\]\:c_red.b .\[\&\.b_\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_is_pseudo_with_ampersand() {
    assert_snapshot!(compile_nested("{ '&.b :is(&)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\.b_\:is\(\&\)\]\:c_red.b :is(.\[\&\.b_\:is\(\&\)\]\:c_red) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_double_compound_ampersand() {
    assert_snapshot!(compile_nested("{ '&.b&': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\.b\&\]\:c_red.b.\[\&\.b\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_is_pseudo_with_ampersand() {
    assert_snapshot!(compile_nested("{ '&.b:is(&)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\.b\:is\(\&\)\]\:c_red.b:is(.\[\&\.b\:is\(\&\)\]\:c_red) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_adjacent_sibling_no_spaces() {
    assert_snapshot!(compile_nested("{ '&+&': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\+\&\]\:c_red+.\[\&\+\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_tag_list() {
    assert_snapshot!(compile_nested("{ '&h1, &h2': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&h1\,_\&h2\]\:c_redh1, .\[\&h1\,_\&h2\]\:c_redh2 {
    color: red;
  }
}
"#);
}

#[test]
fn nested_where() {
    assert_snapshot!(compile_nested("{ '&:where(h1)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:where\(h1\)\]\:c_red:where(h1) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_multi_ampersand_in_one_selector() {
    assert_snapshot!(compile_nested("{ '& .bar & .baz & .qux': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\.bar_\&_\.baz_\&_\.qux\]\:c_red .bar .\[\&_\.bar_\&_\.baz_\&_\.qux\]\:c_red .baz .\[\&_\.bar_\&_\.baz_\&_\.qux\]\:c_red .qux {
    color: red;
  }
}
"#);
}

#[test]
fn nested_is_with_inner_compound_ampersand() {
    assert_snapshot!(compile_nested("{ '&:is(.bar, &.baz)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:is\(\.bar\,_\&\.baz\)\]\:c_red:is(.bar, .\[\&\:is\(\.bar\,_\&\.baz\)\]\:c_red.baz) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_not_root_ampersand() {
    assert_snapshot!(compile_nested("{ '&:not(&)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:not\(\&\)\]\:c_red:not(.\[\&\:not\(\&\)\]\:c_red) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_compound_after() {
    assert_snapshot!(compile_nested("{ '&::after': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:\:after\]\:c_red::after {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_descendant_after() {
    assert_snapshot!(compile_nested("{ '& ::after': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\:\:after\]\:c_red ::after {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_then_pseudo_class() {
    assert_snapshot!(compile_nested("{ '&::before': { '&:focus': { color: 'red' } } }"), @r#"
@layer utilities {
  .\[\&\:\:before\]\:\[\&\:focus\]\:c_red:focus::before {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_then_hover() {
    assert_snapshot!(compile_nested("{ '&::after': { '&:hover': { color: 'red' } } }"), @r#"
@layer utilities {
  .\[\&\:\:after\]\:\[\&\:hover\]\:c_red:hover::after {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_before_after_list() {
    assert_snapshot!(compile_nested("{ '&::before, &::after': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\:\:before\,_\&\:\:after\]\:c_red::before, .\[\&\:\:before\,_\&\:\:after\]\:c_red::after {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_compound_suffix_before() {
    assert_snapshot!(compile_nested("{ '::before&': { color: 'red' } }"), @r#"
@layer utilities {
  ::before.\[\:\:before\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_single_colon_compound_suffix_before() {
    assert_snapshot!(compile_nested("{ ':before&': { color: 'red' } }"), @r#"
@layer utilities {
  :before.\[\:before\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_pseudo_element_descendant_before() {
    assert_snapshot!(compile_nested("{ '::before &': { color: 'red' } }"), @r#"
@layer utilities {
  ::before .\[\:\:before_\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_tail_ampersand_with_child_combinator() {
    assert_snapshot!(compile_nested("{ '.something > &': { color: 'red' } }"), @r#"
@layer utilities {
  .something > .\[\.something_\>_\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_host_functional_pseudo() {
    assert_snapshot!(compile_nested("{ '&(:focus)': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\(\:focus\)\]\:c_red(:focus) {
    color: red;
  }
}
"#);
}

#[test]
fn nested_is_pseudo_with_pseudo_then_descendant() {
    assert_snapshot!(compile_nested("{ '&:last-child': { '& :is(.a, .b)': { display: 'none' } } }"), @r#"
@layer utilities {
  .\[\&\:last-child\]\:\[\&_\:is\(\.a\,_\.b\)\]\:d_none:last-child :is(.a, .b) {
    display: none;
  }
}
"#);
}

#[test]
fn nested_deep_unwrap_stack() {
    assert_snapshot!(compile_nested("{ '& .b': { '& .c': { '& .d': { color: 'red' } } } }"), @r#"
@layer utilities {
  .\[\&_\.b\]\:\[\&_\.c\]\:\[\&_\.d\]\:c_red .b .c .d {
    color: red;
  }
}
"#);
}

#[test]
fn nested_child_combinator_stack() {
    assert_snapshot!(compile_nested("{ '& > .row': { '& > .cell': { padding: '1px' } } }"), @r#"
@layer utilities {
  .\[\&_\>_\.row\]\:\[\&_\>_\.cell\]\:p_1px > .row > .cell {
    padding: 1px;
  }
}
"#);
}

#[test]
fn nested_descendant_attr_ampersand_in_string() {
    assert_snapshot!(compile_nested(r#"{ '& b[a="a&b"]': { color: 'red' } }"#), @r#"
@layer utilities {
  .\[\&_b\[a\=\"a\&b\"\]\]\:c_red b[a="a&b"] {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_combinator_list() {
    assert_snapshot!(compile_nested("{ '&+.baz, &.qux': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\+\.baz\,_\&\.qux\]\:c_red+.baz, .\[\&\+\.baz\,_\&\.qux\]\:c_red.qux {
    color: red;
  }
}
"#);
}

#[test]
fn nested_child_combinator_no_space() {
    assert_snapshot!(compile_nested("{ '&>.bar': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\>\.bar\]\:c_red>.bar {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_body_suffix() {
    assert_snapshot!(compile_nested("{ 'body&': { color: 'red' } }"), @r#"
@layer utilities {
  body.\[body\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_compound_class_suffix_no_space() {
    assert_snapshot!(compile_nested("{ '.foo&': { color: 'red' } }"), @r#"
@layer utilities {
  .foo.\[\.foo\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_standalone_ampersand() {
    assert_snapshot!(compile_nested("{ '&': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&\]\:c_red {
    color: red;
  }
}
"#);
}

#[test]
fn nested_comma_group_scopes_member_without_ampersand() {
    assert_snapshot!(compile_nested("{ '&:not(:first-child), :only-child': { display: 'none' } }"), @r#"
@layer utilities {
  .\[\&\:not\(\:first-child\)\,_\:only-child\]\:d_none:not(:first-child), .\[\&\:not\(\:first-child\)\,_\:only-child\]\:d_none :only-child {
    display: none;
  }
}
"#);
}

#[test]
fn nested_comma_group_with_descendant_nesting() {
    assert_snapshot!(compile_nested("{ '&:not(:first-child), :only-child': { '& .left-border': { display: 'none' } } }"), @r#"
@layer utilities {
  .\[\&\:not\(\:first-child\)\,_\:only-child\]\:\[\&_\.left-border\]\:d_none:not(:first-child) .left-border, .\[\&\:not\(\:first-child\)\,_\:only-child\]\:\[\&_\.left-border\]\:d_none :only-child .left-border {
    display: none;
  }
}
"#);
}

#[test]
fn nested_comma_group_mixed_ampersand_and_class() {
    assert_snapshot!(compile_nested("{ '& .one, .two': { color: 'red' } }"), @r#"
@layer utilities {
  .\[\&_\.one\,_\.two\]\:c_red .one, .\[\&_\.one\,_\.two\]\:c_red .two {
    color: red;
  }
}
"#);
}

#[test]
fn nested_multi_ampersand_under_descendant_parent_uses_is() {
    assert_snapshot!(compile_nested("{ '& .divider': { '& .bar & .baz': { color: 'red' } } }"), @r#"
@layer utilities {
  :is(.\[\&_\.divider\]\:\[\&_\.bar_\&_\.baz\]\:c_red .divider) .bar :is(.\[\&_\.divider\]\:\[\&_\.bar_\&_\.baz\]\:c_red .divider) .baz {
    color: red;
  }
}
"#);
}

#[test]
fn nested_sibling_ampersands_under_child_parent_uses_is() {
    assert_snapshot!(compile_nested("{ '& > .row': { '& + &': { color: 'red' } } }"), @r#"
@layer utilities {
  :is(.\[\&_\>_\.row\]\:\[\&_\+_\&\]\:c_red > .row) + :is(.\[\&_\>_\.row\]\:\[\&_\+_\&\]\:c_red > .row) {
    color: red;
  }
}
"#);
}
