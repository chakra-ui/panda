//! Warns when a style object's written order can't decide which condition wins.
//!
//! Atomic rules are shared across files, so Panda orders them globally. Two
//! conditions on the same property with equal specificity and rank fall back to
//! selector text. When that order disagrees with how they were written, the
//! later one doesn't override the earlier one where both match.

use std::cmp::Ordering;

use pandacss_config::UserConfig;
use pandacss_shared::{Diagnostic, diagnostic_codes, is_important};
use pandacss_stylesheet::order_decided_by_selector_text;
use serde_json::Value;

use crate::inspection::{StyleEntryKind, StyleEntryRef};

struct ConditionedEntry<'a> {
    entry: &'a StyleEntryRef,
    property: &'a str,
    /// The style object it sits in: a `cva` option or `sva` slot has its own.
    scope: Vec<&'a str>,
    conditions: Vec<&'a str>,
    important: bool,
    /// Where it was written: the entry, then the leaf inside a conditional value.
    position: (u32, usize),
}

struct Leaf<'a> {
    conditions: Vec<&'a str>,
    important: bool,
}

pub(crate) fn condition_order_diagnostics(
    config: &UserConfig,
    entries: &[StyleEntryRef],
    is_condition: impl Fn(&str) -> bool,
) -> Vec<Diagnostic> {
    let mut conditioned = Vec::new();
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == StyleEntryKind::Utility)
    {
        let parents = entry
            .path
            .split_last()
            .map_or(&[][..], |(_, parents)| parents);
        let (mut conditions, scope): (Vec<&str>, Vec<&str>) = parents
            .iter()
            .map(String::as_str)
            .filter(|segment| *segment != "base")
            .partition(|segment| is_condition(segment));
        let mut leaves = Vec::new();
        collect_leaves(
            &entry.source_value,
            &mut conditions,
            &is_condition,
            &mut leaves,
        );
        let property = entry.canonical_name.as_deref().unwrap_or(&entry.name);
        conditioned.extend(
            leaves
                .into_iter()
                .enumerate()
                .filter(|(_, leaf)| !leaf.conditions.is_empty())
                .map(|(index, leaf)| ConditionedEntry {
                    entry,
                    property,
                    scope: scope.clone(),
                    conditions: leaf.conditions,
                    important: leaf.important,
                    position: (entry.span.start, index),
                }),
        );
    }
    conditioned.sort_by_key(|item| item.position);

    let mut diagnostics = Vec::new();
    for (index, later) in conditioned.iter().enumerate() {
        let overridden_by = conditioned[..index].iter().find(|earlier| {
            earlier.entry.owner == later.entry.owner
                && earlier.scope == later.scope
                && earlier.property == later.property
                && earlier.important == later.important
                && order_decided_by_selector_text(config, &earlier.conditions, &later.conditions)
                    == Some(Ordering::Greater)
        });
        if let Some(earlier) = overridden_by {
            diagnostics.push(diagnostic(earlier, later));
        }
    }
    diagnostics
}

/// The condition stack of each value leaf: `{ base: 'a', _hover: 'b' }` has two.
fn collect_leaves<'a>(
    value: &'a Value,
    conditions: &mut Vec<&'a str>,
    is_condition: &impl Fn(&str) -> bool,
    out: &mut Vec<Leaf<'a>>,
) {
    let Value::Object(object) = value else {
        out.push(Leaf {
            conditions: conditions.clone(),
            important: value.as_str().is_some_and(is_important),
        });
        return;
    };
    for (key, value) in object {
        if key == "base" {
            collect_leaves(value, conditions, is_condition, out);
        } else if is_condition(key) {
            conditions.push(key);
            collect_leaves(value, conditions, is_condition, out);
            conditions.pop();
        }
    }
}

fn diagnostic(earlier: &ConditionedEntry<'_>, later: &ConditionedEntry<'_>) -> Diagnostic {
    let earlier_condition = earlier.conditions.join(" ");
    let later_condition = later.conditions.join(" ");
    let mut diagnostic = Diagnostic::warning(
        diagnostic_codes::CONDITION_ORDER_BY_TEXT,
        format!(
            "`{later_condition}` doesn't override `{earlier_condition}` for `{}`. Both have the same specificity, so Panda orders them by selector text and `{earlier_condition}` comes last.",
            later.property
        ),
    )
    .with_help(format!(
        "To make `{later_condition}` win where both match, nest it inside `{earlier_condition}`."
    ));
    diagnostic.span = Some(later.entry.span);
    diagnostic.location = Some(later.entry.range);
    diagnostic
}
