//! Condition resolution and selector lowering for stylesheet emission.
//!
//! This module turns condition keys such as `_hover`, `md`, and block-form
//! conditions into raw selector or at-rule paths, then applies those paths to
//! lowered rule targets.

use pandacss_config::{ConditionQuery, UserConfig};

use crate::style_rules::LoweredTarget;

/// One concrete raw condition chain, ordered outer-to-inner.
pub(crate) type ConditionPath = Vec<String>;
/// Alternative raw condition chains for a single condition key.
pub(crate) type ConditionPaths = Vec<ConditionPath>;

pub(crate) fn condition_raw_paths(config: &UserConfig, condition: &str) -> Vec<ConditionPath> {
    if let Some(raw) = config.breakpoint_condition(condition) {
        return vec![vec![raw]];
    }

    if let Some(raw) = config.container_condition(condition) {
        return vec![vec![raw]];
    }

    let key = condition.trim_start_matches('_');
    let query = config
        .conditions
        .get(condition)
        .or_else(|| config.conditions.get(key));

    if let Some(query) = query {
        return normalize_condition_paths(config, query_raw_paths(query));
    }

    if let Some(raw) = config.theme_condition(condition) {
        return vec![vec![raw]];
    }

    if condition.starts_with('@') || condition.contains('&') {
        return normalize_condition_paths(config, vec![vec![condition.to_owned()]]);
    }

    Vec::new()
}

pub(crate) fn resolved_condition_paths(config: &UserConfig, key: &str) -> Option<ConditionPaths> {
    let paths = condition_raw_paths(config, key);
    (!paths.is_empty()).then_some(paths)
}

pub(crate) fn lower_target_conditions(
    config: &UserConfig,
    target: &LoweredTarget,
    conditions: &[&str],
) -> Vec<LoweredTarget> {
    // Each condition can expand to multiple paths, so lowering builds the
    // cartesian product while preserving the caller's condition order.
    let mut targets = vec![target.clone()];
    for condition in conditions {
        let mut next = Vec::new();
        for target in &targets {
            for path in condition_raw_paths(config, condition) {
                let mut target = target.clone();
                for raw in path {
                    apply_raw_condition(&mut target.selector, &mut target.wrappers, &raw);
                }
                next.push(target);
            }
        }
        targets = next;
    }
    targets
}

pub(crate) fn lower_selector_conditions(
    base: &str,
    conditions: &[ConditionPaths],
) -> Vec<LoweredTarget> {
    // Global CSS and token CSS resolve condition keys before they reach this
    // point, but still need the same path-product lowering as atom rules.
    let mut targets = vec![LoweredTarget::new(base)];
    for paths in conditions {
        let mut next = Vec::new();
        for target in &targets {
            for path in paths {
                let mut target = target.clone();
                for raw in path {
                    apply_raw_condition(&mut target.selector, &mut target.wrappers, raw);
                }
                next.push(target);
            }
        }
        targets = next;
    }
    targets
}

pub(crate) fn lower_token_conditions(
    base: &str,
    conditions: &[ConditionPaths],
) -> Vec<LoweredTarget> {
    let mut targets = vec![LoweredTarget::new(base)];
    for paths in conditions {
        let mut next = Vec::new();
        for target in &targets {
            for path in paths {
                let mut target = target.clone();
                for raw in path {
                    apply_token_raw_condition(
                        base,
                        &mut target.selector,
                        &mut target.wrappers,
                        raw,
                    );
                }
                next.push(target);
            }
        }
        targets = next;
    }
    targets
}

pub(crate) fn is_nested_selector_key(key: &str) -> bool {
    key.contains('&')
        || key.contains(',')
        || key.contains(' ')
        || key.contains('>')
        || key.contains('+')
        || key.contains('~')
        || matches!(
            key.as_bytes().first(),
            Some(b'.' | b'#' | b':' | b'[' | b'*')
        )
}

pub(crate) fn nested_selector(parent: &str, nested: &str) -> String {
    if nested.contains('&') {
        crate::selector::replace_selector_parent(nested, parent)
    } else {
        format!("{parent} {nested}")
    }
}

fn query_raw_paths(query: &ConditionQuery) -> Vec<ConditionPath> {
    match query {
        ConditionQuery::String(value) => vec![vec![value.clone()]],
        ConditionQuery::Nested(items) => block_raw_paths(items),
    }
}

fn block_raw_paths(
    items: &std::collections::BTreeMap<String, ConditionQuery>,
) -> Vec<ConditionPath> {
    let mut paths = Vec::new();
    for (raw, query) in items {
        match query {
            ConditionQuery::String(value) if value == "@slot" => {
                // `@slot` marks the leaf of one usable block-form condition
                // path; intermediate string leaves are config metadata only.
                paths.push(vec![raw.clone()]);
            }
            ConditionQuery::String(_) => {}
            ConditionQuery::Nested(children) => {
                for mut path in block_raw_paths(children) {
                    path.insert(0, raw.clone());
                    paths.push(path);
                }
            }
        }
    }
    paths
}

fn normalize_condition_paths(config: &UserConfig, paths: Vec<ConditionPath>) -> Vec<ConditionPath> {
    paths
        .into_iter()
        .map(|path| {
            path.into_iter()
                .map(|raw| expand_breakpoint_at_rule(config, &raw).unwrap_or(raw))
                .collect()
        })
        .collect()
}

fn expand_breakpoint_at_rule(config: &UserConfig, raw: &str) -> Option<String> {
    let params = raw.strip_prefix("@breakpoint")?.trim();
    if params.is_empty() {
        return None;
    }
    config.breakpoint_condition(params)
}

/// Apply one raw condition part to a lowered target: at-rules wrap, `&`
/// substitutes the selector, and plain selectors become ancestors.
fn apply_raw_condition(selector: &mut String, wrappers: &mut Vec<String>, raw: &str) {
    if raw.starts_with('@') {
        wrappers.push(raw.to_owned());
    } else if raw.contains('&') {
        *selector = crate::selector::replace_selector_parent(raw, selector);
    } else {
        *selector = format!("{raw} {selector}");
    }
}

/// Like [`apply_raw_condition`] but for token-var rules, which start from the
/// `cssVarRoot` selector. A ` &` parent condition replaces the root outright
/// (or nests into it); plain conditions append as descendants and the stray
/// root is cleaned up afterward.
fn apply_token_raw_condition(
    css_var_root: &str,
    selector: &mut String,
    wrappers: &mut Vec<String>,
    raw: &str,
) {
    if raw.starts_with('@') {
        wrappers.push(raw.to_owned());
        return;
    }

    if let Some(parent) = token_parent_selector(raw) {
        *selector = if selector == css_var_root {
            parent
        } else if parent.contains('&') {
            crate::selector::replace_selector_parent(&parent, selector)
        } else {
            format!("{selector}{parent}")
        };
        return;
    }

    if raw.contains('&') {
        *selector = crate::selector::replace_selector_parent(raw, selector);
        cleanup_token_selector(css_var_root, selector);
    } else if selector == css_var_root {
        raw.clone_into(selector);
    } else {
        *selector = format!("{selector} {raw}");
    }
}

/// Extract the parent part of a ` &` condition (`.dark &` -> `.dark`). Multiple
/// such selectors collapse into a single `:where(a, b)` group.
fn token_parent_selector(raw: &str) -> Option<String> {
    let selectors = crate::selector::split_selector_list(raw)
        .into_iter()
        .filter_map(|selector| {
            let selector = selector.trim();
            selector
                .contains(" &")
                .then(|| selector.replace(" &", "").trim().to_owned())
        })
        .filter(|selector| !selector.is_empty())
        .collect::<Vec<_>>();

    match selectors.len() {
        0 => None,
        1 => selectors.into_iter().next(),
        _ => Some(format!(":where({})", selectors.join(", "))),
    }
}

/// Strip the now-redundant `cssVarRoot` left behind after a `&` substitution
/// nested a condition into the root selector.
fn cleanup_token_selector(css_var_root: &str, selector: &mut String) {
    if selector == css_var_root {
        return;
    }
    let cleaned = crate::selector::split_selector_list(selector)
        .into_iter()
        .filter_map(|selector| {
            let selector = selector.trim();
            if selector == css_var_root {
                None
            } else {
                let cleaned = selector.replace(css_var_root, "").trim().to_owned();
                (!cleaned.is_empty()).then_some(cleaned)
            }
        })
        .collect::<Vec<_>>();
    if !cleaned.is_empty() {
        *selector = cleaned.join(", ");
    }
}
