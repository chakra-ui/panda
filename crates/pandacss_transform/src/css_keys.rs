//! Canonical merge keys shared by finite and partial CSS lowering.

use pandacss_encoder::Encoder;
use pandacss_extractor::{StyleObject, StyleSpread, StyleTree, project_literal};
use pandacss_literal::Literal;
use pandacss_utility::ShorthandPolicy;
use rustc_hash::FxHashSet;

use pandacss_project::Config;

type StyleKey = (String, Vec<Box<str>>);
pub(super) type StyleKeys = FxHashSet<StyleKey>;

/// Values do not affect merge conflicts. Encode marker values through the same
/// normalizer as real styles to resolve shorthands and responsive conditions.
#[must_use]
pub(super) fn style_keys(config: &Config, tree: &StyleTree) -> Option<StyleKeys> {
    let literal = project_literal(&marker_tree(tree)?)?;
    let mut keys = StyleKeys::default();
    collect_keys(config, &literal, &mut Vec::new(), &mut keys)?;
    Some(keys)
}

fn collect_keys(
    config: &Config,
    value: &Literal,
    path: &mut Vec<String>,
    keys: &mut StyleKeys,
) -> Option<()> {
    match value {
        Literal::Object(entries) => {
            for (key, value) in entries {
                path.push(key.clone());
                collect_keys(config, value, path, keys)?;
                path.pop();
            }
        }
        Literal::Conditional(items) => {
            for item in items {
                collect_keys(config, item, path, keys)?;
            }
        }
        Literal::Array(items) if path.is_empty() => {
            for item in items {
                collect_keys(config, item, path, keys)?;
            }
        }
        _ => {
            let mut literal = value.clone();
            for key in path.iter().rev() {
                literal = Literal::Object(vec![(key.clone(), literal)]);
            }
            let mut encoder = Encoder::with_conditions(config.conditions().clone());
            config.encode_atomic_for_transform(&mut encoder, &literal, ShorthandPolicy::UserFacing);
            let atoms = encoder.into_atoms();
            // A scalar at a selector/condition scope can overwrite its subtree.
            // Without a canonical leaf key, independence cannot be proved.
            if atoms.is_empty() {
                return None;
            }
            keys.extend(
                atoms
                    .into_iter()
                    .map(|atom| (atom.prop().to_owned(), atom.conditions().to_vec())),
            );
        }
    }
    Some(())
}

#[must_use]
pub(super) fn insert_disjoint(keys: &mut StyleKeys, next: StyleKeys) -> Option<()> {
    if !keys.is_disjoint(&next) {
        return None;
    }
    keys.extend(next);
    Some(())
}

fn marker_tree(tree: &StyleTree) -> Option<StyleTree> {
    Some(match tree {
        StyleTree::Object(object) => StyleTree::Object(StyleObject {
            entries: object
                .entries
                .iter()
                .map(|(key, value)| Some((key.clone(), marker_tree(value)?)))
                .collect::<Option<_>>()?,
            spreads: object
                .spreads
                .iter()
                .map(marker_spread)
                .collect::<Option<_>>()?,
        }),
        StyleTree::Array(items) => {
            StyleTree::Array(items.iter().map(marker_tree).collect::<Option<_>>()?)
        }
        StyleTree::Ternary {
            test,
            consequent,
            alternate,
        } => StyleTree::Ternary {
            test: *test,
            consequent: Box::new(marker_tree(consequent)?),
            alternate: Box::new(marker_tree(alternate)?),
        },
        StyleTree::And { test, value } => StyleTree::And {
            test: *test,
            value: Box::new(marker_tree(value)?),
        },
        StyleTree::Branches(_) => return None,
        _ => StyleTree::String("__panda_merge_key__".into()),
    })
}

fn marker_spread(spread: &StyleSpread) -> Option<StyleSpread> {
    Some(match spread {
        StyleSpread::Ternary {
            test,
            consequent,
            alternate,
            overridden,
        } => StyleSpread::Ternary {
            test: *test,
            consequent: marker_tree(consequent)?,
            alternate: marker_tree(alternate)?,
            overridden: overridden.clone(),
        },
        StyleSpread::And {
            test,
            value,
            overridden,
        } => StyleSpread::And {
            test: *test,
            value: marker_tree(value)?,
            overridden: overridden.clone(),
        },
        StyleSpread::Open { .. } | StyleSpread::OpenWithFallback { .. } => return None,
    })
}
