use insta::assert_yaml_snapshot;
use pandacss_extractor::{
    Span, StyleObject, StyleSpread, StyleTree, style_tree_has_open_local_value,
    style_tree_has_open_value, style_tree_has_rewrite_sites, style_tree_has_runtime_branch,
    style_tree_has_value_and,
};
use serde_json::json;

#[test]
fn spanless_alternatives_are_runtime_branches_without_local_rewrite_sites() {
    let tree = StyleTree::Branches(vec![StyleTree::String("red".into())]);

    assert_yaml_snapshot!(json!({
        "runtime_branch": style_tree_has_runtime_branch(&tree),
        "local_rewrite_site": style_tree_has_rewrite_sites(&tree),
    }), @"
    runtime_branch: true
    local_rewrite_site: false
    ");
}

#[test]
fn whole_tree_analysis_checks_open_values_in_spanless_alternatives() {
    let tree = StyleTree::Branches(vec![StyleTree::Open]);

    assert_yaml_snapshot!(json!({
        "open_value": style_tree_has_open_value(&tree),
        "local_open_value": style_tree_has_open_local_value(&tree),
    }), @"
    open_value: true
    local_open_value: false
    ");
}

#[test]
fn open_values_in_conditional_spread_arms_are_visible() {
    let tree = StyleTree::Object(StyleObject {
        entries: vec![],
        spreads: vec![StyleSpread::And {
            test: Span { start: 0, end: 5 },
            value: StyleTree::Open,
            overridden: vec![],
        }],
    });

    assert_yaml_snapshot!(json!({
        "open_value": style_tree_has_open_value(&tree),
        "local_open_value": style_tree_has_open_local_value(&tree),
    }), @"
    open_value: true
    local_open_value: true
    ");
}

#[test]
fn logical_spreads_are_not_logical_property_values() {
    let tree = StyleTree::Object(StyleObject {
        entries: vec![],
        spreads: vec![StyleSpread::And {
            test: Span { start: 0, end: 5 },
            value: StyleTree::Object(StyleObject {
                entries: vec![("color".into(), StyleTree::String("red".into()))],
                spreads: vec![],
            }),
            overridden: vec![],
        }],
    });

    assert_yaml_snapshot!(json!({
        "local_rewrite_site": style_tree_has_rewrite_sites(&tree),
        "logical_property_value": style_tree_has_value_and(&tree),
    }), @"
    local_rewrite_site: true
    logical_property_value: false
    ");
}
