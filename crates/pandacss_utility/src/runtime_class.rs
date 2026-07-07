//! Runtime `css()` class strings with condition prefixes — mirrors generated
//! `createCssRuntime` (`toClass` + `finalizeConditions` + `sortConditions`).

use std::cmp::Ordering;

use pandacss_encoder::{ConditionMatcher, ConditionSet};
use pandacss_extractor::Literal;
use pandacss_shared::{split_important, to_hash, without_space};

use crate::{Utility, literal_to_class_value};

/// Build the class string one runtime `css()` call would return for an encoded atom.
#[must_use]
pub fn runtime_class_name_for_atom(
    utility: &Utility,
    conditions: &ConditionSet,
    prop: &str,
    atom_conditions: &[Box<str>],
    value: &Literal,
    important: bool,
) -> Option<String> {
    let authored = literal_to_class_value(value)?;
    let (raw, lit_important) = split_important(&authored);
    let important = important || lit_important;
    let mut base = utility.transform_str(prop, raw.as_ref()).class_name;
    if important {
        base.push('!');
    }

    let mut finalized = atom_conditions
        .iter()
        .map(|condition| finalize_condition_path(condition.as_ref(), conditions))
        .collect::<Vec<_>>();
    sort_condition_paths(&mut finalized, |key| conditions.is_condition(key));

    if utility.hash_class_names() {
        let mut parts = finalized;
        parts.push(base);
        Some(utility.format_class_name_owned(to_hash(&parts.join(":"))))
    } else {
        let formatted_base = utility.format_class_name(&base);
        if finalized.is_empty() {
            Some(formatted_base)
        } else {
            Some(format!("{}:{formatted_base}", finalized.join(":")))
        }
    }
}

fn finalize_condition_path(path: &str, conditions: &ConditionSet) -> String {
    if conditions.is_configured_name(path) {
        path.strip_prefix('_')
            .map_or_else(|| path.to_owned(), str::to_owned)
    } else if path.contains('&') || path.starts_with('@') {
        format!("[{}]", without_space(path.trim()))
    } else {
        path.to_owned()
    }
}

fn sort_condition_paths(paths: &mut [String], is_condition: impl Fn(&str) -> bool) {
    paths.sort_by(|a, b| {
        let aa = is_condition(a);
        let bb = is_condition(b);
        match (aa, bb) {
            (true, false) => Ordering::Greater,
            (false, true) => Ordering::Less,
            _ => Ordering::Equal,
        }
    });
}
