//! Turns condition keys (`_hover`, `md`, block-form conditions) into raw
//! selector / at-rule paths, then applies those paths to lowered rule targets.

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

    if condition.starts_with('@') || crate::css_syntax::contains_code_byte(condition, b'&') {
        return normalize_condition_paths(config, vec![vec![condition.to_owned()]]);
    }

    Vec::new()
}

pub(crate) fn resolved_condition_paths(config: &UserConfig, key: &str) -> Option<ConditionPaths> {
    let paths = condition_raw_paths(config, key);
    (!paths.is_empty()).then_some(paths)
}

pub(crate) fn lower_selector_conditions(
    base: &str,
    conditions: &[ConditionPaths],
) -> Vec<LoweredTarget> {
    // Global/token CSS resolve condition keys earlier, but still need this lowering.
    lower_target_resolved_conditions(&LoweredTarget::new(base), conditions)
}

pub(crate) fn lower_target_resolved_conditions(
    base: &LoweredTarget,
    conditions: &[ConditionPaths],
) -> Vec<LoweredTarget> {
    lower_conditions_with(base.clone(), conditions, apply_raw_condition)
}

pub(crate) fn lower_token_conditions(
    base: &str,
    conditions: &[ConditionPaths],
) -> Vec<LoweredTarget> {
    lower_conditions_with(LoweredTarget::new(base), conditions, |target, raw| {
        apply_token_raw_condition(base, target, raw);
    })
}

/// Path-product expansion: each condition key may resolve to multiple raw
/// paths, so every existing target is cloned once per path. `apply` turns one
/// raw condition part into a selector/wrapper mutation.
fn lower_conditions_with(
    base: LoweredTarget,
    conditions: &[ConditionPaths],
    mut apply: impl FnMut(&mut LoweredTarget, &str),
) -> Vec<LoweredTarget> {
    let mut targets = vec![base];
    for paths in conditions {
        let mut next = Vec::new();
        for target in &targets {
            for path in paths {
                let mut target = target.clone();
                for raw in path {
                    apply(&mut target, raw);
                }
                next.push(target);
            }
        }
        targets = next;
    }
    targets
}

pub(crate) fn is_nested_selector_key(key: &str) -> bool {
    crate::css_syntax::contains_code_byte(key, b'&')
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
    crate::selector::replace_selector_parent(nested, parent)
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

fn apply_raw_condition(target: &mut LoweredTarget, raw: &str) {
    if raw.starts_with('@') {
        target.wrappers.push(raw.to_owned());
    } else if crate::css_syntax::contains_code_byte(raw, b'&') {
        target.selector = crate::selector::replace_selector_parent(raw, &target.selector);
        target.merge_safe &= crate::css_syntax::selector_is_merge_safe(&target.selector);
    } else {
        target.selector = format!("{raw} {}", target.selector);
        target.merge_safe &= crate::css_syntax::selector_is_merge_safe(&target.selector);
    }
}

/// Token-var version of [`apply_raw_condition`]: starts from `cssVarRoot`,
/// where a ` &` parent condition replaces or nests into the root and the
/// stray root gets cleaned up afterward.
fn apply_token_raw_condition(css_var_root: &str, target: &mut LoweredTarget, raw: &str) {
    if raw.starts_with('@') {
        target.wrappers.push(raw.to_owned());
        return;
    }

    if let Some(parent) = token_parent_selector(raw) {
        target.selector = if target.selector == css_var_root {
            parent
        } else if crate::css_syntax::contains_code_byte(&parent, b'&') {
            crate::selector::replace_selector_parent(&parent, &target.selector)
        } else {
            format!("{}{parent}", target.selector)
        };
        target.merge_safe &= crate::css_syntax::selector_is_merge_safe(&target.selector);
        return;
    }

    if crate::css_syntax::contains_code_byte(raw, b'&') {
        target.selector = crate::selector::replace_selector_parent(raw, &target.selector);
        cleanup_token_selector(css_var_root, &mut target.selector);
    } else if target.selector == css_var_root {
        raw.clone_into(&mut target.selector);
    } else {
        target.selector = format!("{} {raw}", target.selector);
    }
    target.merge_safe &= crate::css_syntax::selector_is_merge_safe(&target.selector);
}

/// Extract the parent of a ` &` condition (`.dark &` -> `.dark`); multiple collapse into `:where(a, b)`.
fn token_parent_selector(raw: &str) -> Option<String> {
    let selectors = crate::selector::split_selector_list(raw)
        .into_iter()
        .filter_map(|selector| {
            let selector = selector.trim();
            crate::css_syntax::strip_spaced_code_byte(selector, b'&')
        })
        .filter(|selector| !selector.is_empty())
        .collect::<Vec<_>>();

    match selectors.len() {
        0 => None,
        1 => selectors.into_iter().next(),
        _ => Some(format!(":where({})", selectors.join(", "))),
    }
}

/// Strip the redundant `cssVarRoot` left behind by a `&` substitution.
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
