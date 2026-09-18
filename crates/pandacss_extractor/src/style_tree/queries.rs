//! Structural queries over the shared style tree.

use super::{StyleSpread, StyleTree};

/// True when `StyleTree` carries finite conditionals that transform should lower.
#[must_use]
pub fn style_tree_has_rewrite_sites(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::Ternary { .. } | StyleTree::And { .. } => true,
        StyleTree::Object(obj) => {
            obj.spreads
                .iter()
                .any(|s| matches!(s, StyleSpread::Ternary { .. } | StyleSpread::And { .. }))
                || obj
                    .entries
                    .iter()
                    .any(|(_, v)| style_tree_has_rewrite_sites(v))
        }
        StyleTree::Array(items) | StyleTree::Branches(items) => {
            items.iter().any(style_tree_has_rewrite_sites)
        }
        StyleTree::Open
        | StyleTree::OpenWithFallback(_)
        | StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => false,
    }
}

/// True when a conditional spread arm contains another runtime branch.
#[must_use]
pub fn has_nested_spread_branches(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::Object(object) => {
            object.spreads.iter().any(|spread| match spread {
                StyleSpread::Ternary {
                    consequent,
                    alternate,
                    ..
                } => {
                    style_tree_has_runtime_branch(consequent)
                        || style_tree_has_runtime_branch(alternate)
                }
                StyleSpread::And { value, .. } => style_tree_has_runtime_branch(value),
                _ => false,
            }) || object
                .entries
                .iter()
                .any(|(_, value)| has_nested_spread_branches(value))
        }
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => has_nested_spread_branches(consequent) || has_nested_spread_branches(alternate),
        StyleTree::And { value, .. } => has_nested_spread_branches(value),
        StyleTree::Array(items) | StyleTree::Branches(items) => {
            items.iter().any(has_nested_spread_branches)
        }
        _ => false,
    }
}

/// Property logical values retain the unknown falsy value of their test.
#[must_use]
pub fn style_tree_has_value_and(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::And { .. } => true,
        StyleTree::Object(object) => {
            object
                .entries
                .iter()
                .any(|(_, value)| style_tree_has_value_and(value))
                || object.spreads.iter().any(|spread| match spread {
                    StyleSpread::Ternary {
                        consequent,
                        alternate,
                        ..
                    } => {
                        style_tree_has_value_and(consequent) || style_tree_has_value_and(alternate)
                    }
                    StyleSpread::And { value, .. } => style_tree_has_value_and(value),
                    _ => false,
                })
        }
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => style_tree_has_value_and(consequent) || style_tree_has_value_and(alternate),
        StyleTree::Array(items) | StyleTree::Branches(items) => {
            items.iter().any(style_tree_has_value_and)
        }
        _ => false,
    }
}

/// Carries something only the runtime can resolve: an open leaf, spread, or value.
#[must_use]
pub fn style_tree_is_open(tree: &StyleTree) -> bool {
    style_tree_has_open_value(tree)
}

/// True for open spreads; open property values are handled separately.
#[must_use]
pub fn style_tree_has_open_spread(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::Object(obj) => {
            obj.spreads.iter().any(StyleSpread::is_open)
                || obj
                    .entries
                    .iter()
                    .any(|(_, v)| style_tree_has_open_spread(v))
        }
        StyleTree::Array(items) | StyleTree::Branches(items) => {
            items.iter().any(style_tree_has_open_spread)
        }
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => style_tree_has_open_spread(consequent) || style_tree_has_open_spread(alternate),
        StyleTree::And { value, .. } => style_tree_has_open_spread(value),
        StyleTree::Open
        | StyleTree::OpenWithFallback(_)
        | StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => false,
    }
}

/// True when the tree contains a branch only the runtime can decide.
///
/// Callers that collapse a whole call to one value — pattern calls, which emit
/// a single class string or a single object — can't express a branch, so they
/// have to leave the call to the runtime.
#[must_use]
pub fn style_tree_has_runtime_branch(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::Ternary { .. } | StyleTree::And { .. } | StyleTree::Branches(_) => true,
        StyleTree::Object(obj) => {
            obj.spreads.iter().any(|spread| {
                matches!(
                    spread,
                    StyleSpread::Ternary { .. } | StyleSpread::And { .. }
                )
            }) || obj
                .entries
                .iter()
                .any(|(_, v)| style_tree_has_runtime_branch(v))
        }
        StyleTree::Array(items) => items.iter().any(style_tree_has_runtime_branch),
        StyleTree::Open
        | StyleTree::OpenWithFallback(_)
        | StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => false,
    }
}

/// True when any leaf/`Open` value is present (including property-level `||` / `??`).
#[must_use]
pub fn style_tree_has_open_value(tree: &StyleTree) -> bool {
    contains_open_values(tree, BranchScope::All)
}

/// True for open values in locally rewriteable branches; skips spanless alternatives.
#[must_use]
pub fn style_tree_has_open_local_value(tree: &StyleTree) -> bool {
    contains_open_values(tree, BranchScope::Local)
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum BranchScope {
    All,
    Local,
}

fn contains_open_values(tree: &StyleTree, scope: BranchScope) -> bool {
    match tree {
        StyleTree::Open | StyleTree::OpenWithFallback(_) => true,
        StyleTree::Object(obj) => {
            obj.spreads.iter().any(|s| match s {
                StyleSpread::Open { .. } | StyleSpread::OpenWithFallback { .. } => true,
                StyleSpread::Ternary {
                    consequent,
                    alternate,
                    ..
                } => {
                    contains_open_values(consequent, scope)
                        || contains_open_values(alternate, scope)
                }
                StyleSpread::And { value, .. } => contains_open_values(value, scope),
            }) || obj
                .entries
                .iter()
                .any(|(_, v)| contains_open_values(v, scope))
        }
        StyleTree::Branches(_) if scope == BranchScope::Local => false,
        StyleTree::Array(items) | StyleTree::Branches(items) => {
            items.iter().any(|item| contains_open_values(item, scope))
        }
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => contains_open_values(consequent, scope) || contains_open_values(alternate, scope),
        StyleTree::And { value, .. } => contains_open_values(value, scope),
        StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => false,
    }
}

/// Walk a config object `StyleTree` for a named entry (e.g. cva `base`).
#[must_use]
pub fn style_tree_object_entry<'a>(tree: &'a StyleTree, key: &str) -> Option<&'a StyleTree> {
    let StyleTree::Object(obj) = tree else {
        return None;
    };
    obj.entries
        .iter()
        .find(|(entry_key, _)| entry_key == key)
        .map(|(_, value)| value)
}
