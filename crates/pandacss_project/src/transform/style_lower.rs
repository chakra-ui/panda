//! Lower extract-time [`StyleTree`] to class string expressions (no source re-parse).

use std::collections::HashSet;

use pandacss_extractor::{
    ExtractedJsx, Literal, StyleObject, StyleSpread, StyleTree, project_literal,
};
use pandacss_shared::Span;

use crate::PatternTransformFn;
use crate::Project;

use super::resolve::{classes_for_css_args, js_string_literal, span_slice};

const MAX_CONDITIONAL_SITES: usize = 64;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ClassExpr {
    Lit(String),
    Ternary {
        test: String,
        yes: Box<ClassExpr>,
        no: Box<ClassExpr>,
    },
    Join(Vec<ClassExpr>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LowerResult {
    Static(String),
    Expr(ClassExpr),
    Bail,
}

/// True when `StyleTree` carries finite conditionals that transform should lower.
#[must_use]
pub(crate) fn style_tree_has_rewrite_sites(tree: &StyleTree) -> bool {
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

/// True when `StyleTree` has a rewrite-critical open spread (`||` / `??` / bare rest).
/// Top-level open *property* values are excluded — those use the mixed static/`cx` path.
#[must_use]
pub(crate) fn style_tree_has_open_spread(tree: &StyleTree) -> bool {
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

/// True when any leaf/`Open` value is present (including property-level `||` / `??`).
#[must_use]
pub(crate) fn style_tree_has_open_value(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::Open | StyleTree::OpenWithFallback(_) => true,
        StyleTree::Object(obj) => {
            obj.spreads.iter().any(|s| match s {
                StyleSpread::Open | StyleSpread::OpenWithFallback { .. } => true,
                StyleSpread::Ternary {
                    consequent,
                    alternate,
                    ..
                } => style_tree_has_open_value(consequent) || style_tree_has_open_value(alternate),
                StyleSpread::And { value, .. } => style_tree_has_open_value(value),
            }) || obj
                .entries
                .iter()
                .any(|(_, v)| style_tree_has_open_value(v))
        }
        StyleTree::Array(items) | StyleTree::Branches(items) => {
            items.iter().any(style_tree_has_open_value)
        }
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => style_tree_has_open_value(consequent) || style_tree_has_open_value(alternate),
        StyleTree::And { value, .. } => style_tree_has_open_value(value),
        StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => false,
    }
}

/// Walk a config object `StyleTree` for a named entry (e.g. cva `base`).
#[must_use]
pub(crate) fn style_tree_object_entry<'a>(tree: &'a StyleTree, key: &str) -> Option<&'a StyleTree> {
    let StyleTree::Object(obj) = tree else {
        return None;
    };
    obj.entries
        .iter()
        .find(|(entry_key, _)| entry_key == key)
        .map(|(_, value)| value)
}

#[must_use]
pub fn print_class_expr(expr: &ClassExpr) -> String {
    match expr {
        ClassExpr::Lit(s) => js_string_literal(s),
        ClassExpr::Ternary { test, yes, no } => {
            format!(
                "{test} ? {} : {}",
                print_class_expr(yes),
                print_class_expr(no)
            )
        }
        ClassExpr::Join(parts) => parts
            .iter()
            .map(|part| format!("({})", print_class_expr(part)))
            .collect::<Vec<_>>()
            .join(" + \" \" + "),
    }
}

#[must_use]
pub(crate) fn preserved_source_spans(tree: &StyleTree) -> Vec<Span> {
    let mut spans = Vec::new();
    collect_preserved_source_spans(tree, &mut spans);
    spans
}

fn collect_preserved_source_spans(tree: &StyleTree, spans: &mut Vec<Span>) {
    match tree {
        StyleTree::Ternary {
            test,
            consequent,
            alternate,
        } => {
            spans.push(*test);
            collect_preserved_source_spans(consequent, spans);
            collect_preserved_source_spans(alternate, spans);
        }
        StyleTree::And { test, value } => {
            spans.push(*test);
            collect_preserved_source_spans(value, spans);
        }
        StyleTree::Object(object) => {
            for spread in &object.spreads {
                match spread {
                    StyleSpread::Ternary {
                        test,
                        consequent,
                        alternate,
                        ..
                    } => {
                        spans.push(*test);
                        collect_preserved_source_spans(consequent, spans);
                        collect_preserved_source_spans(alternate, spans);
                    }
                    StyleSpread::And { test, value, .. } => {
                        spans.push(*test);
                        collect_preserved_source_spans(value, spans);
                    }
                    StyleSpread::Open | StyleSpread::OpenWithFallback { .. } => {}
                }
            }
            for (_, value) in &object.entries {
                collect_preserved_source_spans(value, spans);
            }
        }
        StyleTree::Array(items) | StyleTree::Branches(items) => {
            for item in items {
                collect_preserved_source_spans(item, spans);
            }
        }
        StyleTree::Open
        | StyleTree::OpenWithFallback(_)
        | StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => {}
    }
}

#[must_use]
pub fn lower_style_tree(
    project: &Project,
    source: &str,
    tree: &StyleTree,
    for_jsx: Option<&ExtractedJsx>,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> LowerResult {
    if tree.is_open() || style_tree_has_open_value(tree) {
        return LowerResult::Bail;
    }

    if let StyleTree::Ternary {
        test,
        consequent,
        alternate,
    } = tree
        && is_object_tree(consequent)
        && is_object_tree(alternate)
    {
        return lower_whole_arg_ternary(
            project,
            source,
            *test,
            consequent,
            alternate,
            for_jsx,
            pattern_transform.as_deref_mut(),
        );
    }

    let StyleTree::Object(obj) = tree else {
        return match encode_tree(project, tree, for_jsx, pattern_transform.as_deref_mut()) {
            Some(classes) => LowerResult::Static(classes),
            None => LowerResult::Bail,
        };
    };

    let mut path: Vec<PathSeg> = Vec::new();
    let mut sites = Vec::new();
    if collect_sites(obj, &mut path, &mut sites) == CollectOutcome::Bail {
        return LowerResult::Bail;
    }
    if sites.len() > MAX_CONDITIONAL_SITES {
        return LowerResult::Bail;
    }
    if sites.is_empty() {
        return match encode_tree(project, tree, for_jsx, pattern_transform.as_deref_mut()) {
            Some(classes) => LowerResult::Static(classes),
            None => LowerResult::Bail,
        };
    }

    sites.sort_by_key(Site::test_start);

    let affected_paths = affected_paths_by_site(&sites);
    if affected_paths_overlap(&affected_paths) {
        return LowerResult::Bail;
    }

    let mut base = projected_base(obj);
    for path in affected_paths.iter().flatten() {
        remove_base_path(&mut base, path);
    }
    let mut exprs = Vec::with_capacity(sites.len());
    let encode = LowerEncodeCtx { project, for_jsx };
    for site in &sites {
        match lower_site(source, &base, site, &encode, &mut pattern_transform) {
            Some(expr) => exprs.push(expr),
            None => return LowerResult::Bail,
        }
    }

    if exprs.len() == 1 {
        LowerResult::Expr(exprs.pop().expect("one expr"))
    } else {
        LowerResult::Expr(ClassExpr::Join(exprs))
    }
}

/// Object key or responsive-array index.
#[derive(Debug, Clone, PartialEq, Eq)]
enum PathSeg {
    Key(String),
    Index(usize),
}

#[derive(Debug)]
enum Site {
    PropertyTernary {
        path: Vec<PathSeg>,
        test: Span,
        consequent: StyleTree,
        alternate: StyleTree,
    },
    PropertyAnd {
        path: Vec<PathSeg>,
        test: Span,
        value: StyleTree,
    },
    SpreadTernary {
        path: Vec<PathSeg>,
        test: Span,
        consequent: StyleTree,
        alternate: StyleTree,
        overridden: Vec<String>,
    },
    SpreadAnd {
        path: Vec<PathSeg>,
        test: Span,
        value: StyleTree,
        overridden: Vec<String>,
    },
}

impl Site {
    const fn test_start(&self) -> u32 {
        match self {
            Self::PropertyTernary { test, .. }
            | Self::PropertyAnd { test, .. }
            | Self::SpreadTernary { test, .. }
            | Self::SpreadAnd { test, .. } => test.start,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum CollectOutcome {
    Ok,
    Bail,
}

fn collect_sites(
    obj: &StyleObject,
    path: &mut Vec<PathSeg>,
    sites: &mut Vec<Site>,
) -> CollectOutcome {
    for spread in &obj.spreads {
        match spread {
            StyleSpread::Open | StyleSpread::OpenWithFallback { .. } => {
                return CollectOutcome::Bail;
            }
            StyleSpread::Ternary {
                test,
                consequent,
                alternate,
                overridden,
            } => {
                if tree_has_open(consequent) || tree_has_open(alternate) {
                    return CollectOutcome::Bail;
                }
                sites.push(Site::SpreadTernary {
                    path: path.clone(),
                    test: *test,
                    consequent: consequent.clone(),
                    alternate: alternate.clone(),
                    overridden: overridden.clone(),
                });
            }
            StyleSpread::And {
                test,
                value,
                overridden,
            } => {
                if tree_has_open(value) {
                    return CollectOutcome::Bail;
                }
                sites.push(Site::SpreadAnd {
                    path: path.clone(),
                    test: *test,
                    value: value.clone(),
                    overridden: overridden.clone(),
                });
            }
        }
    }

    for (key, value) in &obj.entries {
        match value {
            StyleTree::Open | StyleTree::OpenWithFallback(_) => return CollectOutcome::Bail,
            StyleTree::Ternary {
                test,
                consequent,
                alternate,
            } => {
                if tree_has_open(consequent) || tree_has_open(alternate) {
                    return CollectOutcome::Bail;
                }
                sites.push(Site::PropertyTernary {
                    path: {
                        let mut p = path.clone();
                        p.push(PathSeg::Key(key.clone()));
                        p
                    },
                    test: *test,
                    consequent: consequent.as_ref().clone(),
                    alternate: alternate.as_ref().clone(),
                });
            }
            StyleTree::And { test, value } => {
                if tree_has_open(value) {
                    return CollectOutcome::Bail;
                }
                sites.push(Site::PropertyAnd {
                    path: {
                        let mut p = path.clone();
                        p.push(PathSeg::Key(key.clone()));
                        p
                    },
                    test: *test,
                    value: value.as_ref().clone(),
                });
            }
            StyleTree::Object(nested) => {
                path.push(PathSeg::Key(key.clone()));
                if collect_sites(nested, path, sites) == CollectOutcome::Bail {
                    path.pop();
                    return CollectOutcome::Bail;
                }
                path.pop();
            }
            StyleTree::Array(items) => {
                path.push(PathSeg::Key(key.clone()));
                if collect_array_sites(items, path, sites) == CollectOutcome::Bail {
                    path.pop();
                    return CollectOutcome::Bail;
                }
                path.pop();
            }
            StyleTree::Branches(_)
            | StyleTree::String(_)
            | StyleTree::Number(_)
            | StyleTree::Bool(_)
            | StyleTree::Null
            | StyleTree::Token { .. } => {}
        }
    }
    CollectOutcome::Ok
}

fn collect_array_sites(
    items: &[StyleTree],
    path: &mut Vec<PathSeg>,
    sites: &mut Vec<Site>,
) -> CollectOutcome {
    for (i, item) in items.iter().enumerate() {
        match item {
            StyleTree::Open | StyleTree::OpenWithFallback(_) => return CollectOutcome::Bail,
            StyleTree::Ternary {
                test,
                consequent,
                alternate,
            } => {
                if tree_has_open(consequent) || tree_has_open(alternate) {
                    return CollectOutcome::Bail;
                }
                sites.push(Site::PropertyTernary {
                    path: {
                        let mut p = path.clone();
                        p.push(PathSeg::Index(i));
                        p
                    },
                    test: *test,
                    consequent: consequent.as_ref().clone(),
                    alternate: alternate.as_ref().clone(),
                });
            }
            StyleTree::And { test, value } => {
                if tree_has_open(value) {
                    return CollectOutcome::Bail;
                }
                sites.push(Site::PropertyAnd {
                    path: {
                        let mut p = path.clone();
                        p.push(PathSeg::Index(i));
                        p
                    },
                    test: *test,
                    value: value.as_ref().clone(),
                });
            }
            StyleTree::Object(nested) => {
                path.push(PathSeg::Index(i));
                if collect_sites(nested, path, sites) == CollectOutcome::Bail {
                    path.pop();
                    return CollectOutcome::Bail;
                }
                path.pop();
            }
            StyleTree::Array(inner) => {
                path.push(PathSeg::Index(i));
                if collect_array_sites(inner, path, sites) == CollectOutcome::Bail {
                    path.pop();
                    return CollectOutcome::Bail;
                }
                path.pop();
            }
            StyleTree::Branches(_)
            | StyleTree::String(_)
            | StyleTree::Number(_)
            | StyleTree::Bool(_)
            | StyleTree::Null
            | StyleTree::Token { .. } => {}
        }
    }
    CollectOutcome::Ok
}

fn tree_has_open(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::Open | StyleTree::OpenWithFallback(_) => true,
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => tree_has_open(consequent) || tree_has_open(alternate),
        StyleTree::And { value, .. } => tree_has_open(value),
        StyleTree::Object(obj) => {
            obj.entries.iter().any(|(_, v)| tree_has_open(v))
                || obj.spreads.iter().any(|s| match s {
                    StyleSpread::Open | StyleSpread::OpenWithFallback { .. } => true,
                    StyleSpread::Ternary {
                        consequent,
                        alternate,
                        ..
                    } => tree_has_open(consequent) || tree_has_open(alternate),
                    StyleSpread::And { value, .. } => tree_has_open(value),
                })
        }
        StyleTree::Array(items) => items.iter().any(tree_has_open),
        _ => false,
    }
}

fn is_object_tree(tree: &StyleTree) -> bool {
    matches!(tree, StyleTree::Object(_))
}

fn lower_whole_arg_ternary(
    project: &Project,
    source: &str,
    test: Span,
    consequent: &StyleTree,
    alternate: &StyleTree,
    for_jsx: Option<&ExtractedJsx>,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> LowerResult {
    if tree_has_open(consequent) || tree_has_open(alternate) {
        return LowerResult::Bail;
    }
    let Some(test_src) = span_slice(source, test) else {
        return LowerResult::Bail;
    };
    let Some(yes) = encode_tree(
        project,
        consequent,
        for_jsx,
        pattern_transform.as_deref_mut(),
    ) else {
        return LowerResult::Bail;
    };
    let Some(no) = encode_tree(project, alternate, for_jsx, pattern_transform) else {
        return LowerResult::Bail;
    };
    LowerResult::Expr(ClassExpr::Ternary {
        test: test_src.to_owned(),
        yes: Box::new(ClassExpr::Lit(yes)),
        no: Box::new(ClassExpr::Lit(no)),
    })
}

/// Shared encode refs for site/property-arm lowering (`pattern_transform` stays
/// a separate reborrowable param — packing `&mut dyn FnMut` into this struct
/// fights borrowck across sequential arm encodes).
struct LowerEncodeCtx<'a> {
    project: &'a Project,
    for_jsx: Option<&'a ExtractedJsx>,
}

#[allow(
    clippy::too_many_lines,
    reason = "each Site arm builds an independent class expression"
)]
fn lower_site(
    source: &str,
    base: &[(String, Literal)],
    site: &Site,
    encode: &LowerEncodeCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    match site {
        Site::PropertyTernary {
            path,
            test,
            consequent,
            alternate,
        } => {
            let test_src = span_slice(source, *test)?.to_owned();
            let yes =
                lower_property_arm(source, base, path, consequent, encode, pattern_transform)?;
            let no = lower_property_arm(source, base, path, alternate, encode, pattern_transform)?;
            Some(ClassExpr::Ternary {
                test: test_src,
                yes: Box::new(yes),
                no: Box::new(no),
            })
        }
        Site::PropertyAnd { path, test, value } => {
            let test_src = span_slice(source, *test)?.to_owned();
            let lit = project_literal(value)?;
            let mut truthy = base.to_vec();
            apply_branch(&mut truthy, path, lit);
            let yes = encode_literal_object(
                encode.project,
                &truthy,
                encode.for_jsx,
                pattern_transform.as_deref_mut(),
            );
            let no = encode_literal_object(
                encode.project,
                base,
                encode.for_jsx,
                pattern_transform.as_deref_mut(),
            );
            Some(ClassExpr::Ternary {
                test: test_src,
                yes: Box::new(ClassExpr::Lit(yes)),
                no: Box::new(ClassExpr::Lit(no)),
            })
        }
        Site::SpreadTernary {
            path,
            test,
            consequent,
            alternate,
            overridden,
        } => {
            let test_src = span_slice(source, *test)?.to_owned();
            let mut affected = affected_keys_from_arms(consequent, alternate);
            affected.retain(|key| !overridden.contains(key));
            let yes = encode_spread_branch(
                encode,
                base,
                path,
                &affected,
                consequent,
                overridden,
                pattern_transform.as_deref_mut(),
            )?;
            let no = encode_spread_branch(
                encode,
                base,
                path,
                &affected,
                alternate,
                overridden,
                pattern_transform.as_deref_mut(),
            )?;
            Some(ClassExpr::Ternary {
                test: test_src,
                yes: Box::new(ClassExpr::Lit(yes)),
                no: Box::new(ClassExpr::Lit(no)),
            })
        }
        Site::SpreadAnd {
            path,
            test,
            value,
            overridden,
        } => {
            let test_src = span_slice(source, *test)?.to_owned();
            let mut affected = affected_keys_from_arm(value);
            affected.retain(|key| !overridden.contains(key));
            let yes = encode_spread_branch(
                encode,
                base,
                path,
                &affected,
                value,
                overridden,
                pattern_transform.as_deref_mut(),
            )?;
            let empty = StyleTree::Object(StyleObject::default());
            let no = encode_spread_branch(
                encode,
                base,
                path,
                &affected,
                &empty,
                overridden,
                pattern_transform.as_deref_mut(),
            )?;
            Some(ClassExpr::Ternary {
                test: test_src,
                yes: Box::new(ClassExpr::Lit(yes)),
                no: Box::new(ClassExpr::Lit(no)),
            })
        }
    }
}

fn lower_property_arm(
    source: &str,
    base: &[(String, Literal)],
    path: &[PathSeg],
    arm: &StyleTree,
    encode: &LowerEncodeCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    if let StyleTree::Ternary {
        test,
        consequent,
        alternate,
    } = arm
    {
        let test_src = span_slice(source, *test)?.to_owned();
        let yes = lower_property_arm(source, base, path, consequent, encode, pattern_transform)?;
        let no = lower_property_arm(source, base, path, alternate, encode, pattern_transform)?;
        return Some(ClassExpr::Ternary {
            test: test_src,
            yes: Box::new(yes),
            no: Box::new(no),
        });
    }
    let lit = project_literal(arm)?;
    let mut next = base.to_vec();
    apply_branch(&mut next, path, lit);
    let classes = encode_literal_object(
        encode.project,
        &next,
        encode.for_jsx,
        pattern_transform.as_deref_mut(),
    );
    Some(ClassExpr::Lit(classes))
}

fn projected_base(obj: &StyleObject) -> Vec<(String, Literal)> {
    base_entries_from_style_object(obj)
}

fn affected_paths_by_site(sites: &[Site]) -> Vec<Vec<Vec<PathSeg>>> {
    sites
        .iter()
        .map(|site| match site {
            Site::PropertyTernary { path, .. } | Site::PropertyAnd { path, .. } => {
                vec![path.clone()]
            }
            Site::SpreadTernary {
                path,
                consequent,
                alternate,
                overridden,
                ..
            } => spread_affected_paths(
                path,
                affected_keys_from_arms(consequent, alternate),
                overridden,
            ),
            Site::SpreadAnd {
                path,
                value,
                overridden,
                ..
            } => spread_affected_paths(path, affected_keys_from_arm(value), overridden),
        })
        .collect()
}

fn spread_affected_paths(
    path: &[PathSeg],
    affected: HashSet<String>,
    overridden: &[String],
) -> Vec<Vec<PathSeg>> {
    affected
        .into_iter()
        .filter(|key| !overridden.contains(key))
        .map(|key| {
            let mut affected_path = Vec::with_capacity(path.len() + 1);
            affected_path.extend_from_slice(path);
            affected_path.push(PathSeg::Key(key));
            affected_path
        })
        .collect()
}

fn affected_paths_overlap(paths_by_site: &[Vec<Vec<PathSeg>>]) -> bool {
    for (site_index, paths) in paths_by_site.iter().enumerate() {
        for other_paths in &paths_by_site[site_index + 1..] {
            if paths.iter().any(|path| {
                other_paths
                    .iter()
                    .any(|other| path.starts_with(other) || other.starts_with(path))
            }) {
                return true;
            }
        }
    }
    false
}

fn remove_base_path(entries: &mut Vec<(String, Literal)>, path: &[PathSeg]) {
    let Some((head, tail)) = path.split_first() else {
        return;
    };
    let PathSeg::Key(key) = head else {
        return;
    };
    let Some(index) = entries.iter().position(|(entry_key, _)| entry_key == key) else {
        return;
    };
    if tail.is_empty() {
        entries.remove(index);
        return;
    }
    remove_literal_path(&mut entries[index].1, tail);
}

fn remove_literal_path(literal: &mut Literal, path: &[PathSeg]) {
    let Some((head, tail)) = path.split_first() else {
        return;
    };
    match (literal, head) {
        (Literal::Object(entries), PathSeg::Key(key)) => {
            let Some(index) = entries.iter().position(|(entry_key, _)| entry_key == key) else {
                return;
            };
            if tail.is_empty() {
                entries.remove(index);
            } else {
                remove_literal_path(&mut entries[index].1, tail);
            }
        }
        (Literal::Array(items), PathSeg::Index(index)) => {
            let Some(item) = items.get_mut(*index) else {
                return;
            };
            if tail.is_empty() {
                *item = Literal::Null;
            } else {
                remove_literal_path(item, tail);
            }
        }
        _ => {}
    }
}

/// Static siblings only — rewrite leaves filled by `apply_branch`.
fn base_entries_from_style_object(obj: &StyleObject) -> Vec<(String, Literal)> {
    let mut out = Vec::new();
    for (key, value) in &obj.entries {
        match value {
            StyleTree::Open
            | StyleTree::OpenWithFallback(_)
            | StyleTree::Ternary { .. }
            | StyleTree::And { .. } => {}
            StyleTree::Object(nested) => {
                out.push((
                    key.clone(),
                    Literal::Object(base_entries_from_style_object(nested)),
                ));
            }
            StyleTree::Array(items) => {
                out.push((key.clone(), Literal::Array(base_entries_from_array(items))));
            }
            other => {
                if let Some(lit) = project_literal(other) {
                    out.push((key.clone(), lit));
                }
            }
        }
    }
    out
}

fn base_entries_from_array(items: &[StyleTree]) -> Vec<Literal> {
    items
        .iter()
        .map(|item| match item {
            StyleTree::Open
            | StyleTree::OpenWithFallback(_)
            | StyleTree::Ternary { .. }
            | StyleTree::And { .. } => Literal::Null,
            StyleTree::Object(nested) => Literal::Object(base_entries_from_style_object(nested)),
            StyleTree::Array(inner) => Literal::Array(base_entries_from_array(inner)),
            other => project_literal(other).unwrap_or(Literal::Null),
        })
        .collect()
}

fn encode_spread_branch(
    encode: &LowerEncodeCtx<'_>,
    base: &[(String, Literal)],
    path: &[PathSeg],
    affected: &HashSet<String>,
    branch: &StyleTree,
    overridden: &[String],
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    let branch_obj = match project_literal(branch) {
        Some(Literal::Object(entries)) => entries
            .into_iter()
            .filter(|(key, _)| !overridden.contains(key))
            .collect(),
        Some(_) => return None,
        None => Vec::new(),
    };

    let next = if path.is_empty() {
        let mut result: Vec<(String, Literal)> = base
            .iter()
            .filter(|(key, _)| !affected.contains(key))
            .cloned()
            .collect();
        for (k, v) in branch_obj {
            Literal::upsert_object_entry(&mut result, k, v);
        }
        result
    } else {
        let nested = literal_at_path(base, path)
            .cloned()
            .unwrap_or(Literal::Object(vec![]));
        let Literal::Object(nested_entries) = nested else {
            return None;
        };
        let mut filtered: Vec<(String, Literal)> = nested_entries
            .into_iter()
            .filter(|(key, _)| !affected.contains(key))
            .collect();
        for (k, v) in branch_obj {
            Literal::upsert_object_entry(&mut filtered, k, v);
        }
        let mut result = base.to_vec();
        apply_branch(&mut result, path, Literal::Object(filtered));
        result
    };
    Some(encode_literal_object(
        encode.project,
        &next,
        encode.for_jsx,
        pattern_transform,
    ))
}

fn affected_keys_from_arms(a: &StyleTree, b: &StyleTree) -> HashSet<String> {
    let mut keys = affected_keys_from_arm(a);
    keys.extend(affected_keys_from_arm(b));
    keys
}

fn affected_keys_from_arm(tree: &StyleTree) -> HashSet<String> {
    let mut keys = HashSet::new();
    if let StyleTree::Object(obj) = tree {
        for (key, _) in &obj.entries {
            keys.insert(key.clone());
        }
    } else if let Some(Literal::Object(entries)) = project_literal(tree) {
        for (key, _) in entries {
            keys.insert(key);
        }
    }
    keys
}

fn encode_tree(
    project: &Project,
    tree: &StyleTree,
    for_jsx: Option<&ExtractedJsx>,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    let lit = project_literal(tree)?;
    match for_jsx {
        Some(jsx) => {
            let branch_jsx = ExtractedJsx {
                data: lit,
                style: None,
                ..jsx.clone()
            };
            Some(
                project
                    .class_names_for_jsx_usage(&branch_jsx, pattern_transform)?
                    .join(" "),
            )
        }
        None => Some(classes_for_css_args(project, &[Some(lit)])?.join(" ")),
    }
}

fn encode_literal_object(
    project: &Project,
    entries: &[(String, Literal)],
    for_jsx: Option<&ExtractedJsx>,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> String {
    let lit = Literal::Object(entries.to_vec());
    match for_jsx {
        Some(jsx) => {
            let branch_jsx = ExtractedJsx {
                data: lit,
                style: None,
                ..jsx.clone()
            };
            // Empty branch objects encode to `""` (falsy ternary arm), not Bail.
            project
                .class_names_for_jsx_usage(&branch_jsx, pattern_transform)
                .map(|classes| classes.join(" "))
                .unwrap_or_default()
        }
        None => classes_for_css_args(project, &[Some(lit)])
            .map(|classes| classes.join(" "))
            .unwrap_or_default(),
    }
}

fn apply_branch(entries: &mut Vec<(String, Literal)>, path: &[PathSeg], branch: Literal) {
    let Some((head, tail)) = path.split_first() else {
        return;
    };
    match head {
        PathSeg::Key(key) => {
            if tail.is_empty() {
                Literal::upsert_object_entry(entries, key.clone(), branch);
                return;
            }
            match tail.first() {
                Some(PathSeg::Index(_)) => {
                    let mut arr = match entries.iter().find(|(k, _)| k == key).map(|(_, v)| v) {
                        Some(Literal::Array(items)) => items.clone(),
                        _ => Vec::new(),
                    };
                    apply_branch_array(&mut arr, tail, branch);
                    Literal::upsert_object_entry(entries, key.clone(), Literal::Array(arr));
                }
                Some(PathSeg::Key(_)) => {
                    let mut nested = match entries.iter().find(|(k, _)| k == key).map(|(_, v)| v) {
                        Some(Literal::Object(inner)) => inner.clone(),
                        _ => Vec::new(),
                    };
                    apply_branch(&mut nested, tail, branch);
                    Literal::upsert_object_entry(entries, key.clone(), Literal::Object(nested));
                }
                None => {}
            }
        }
        PathSeg::Index(_) => {}
    }
}

fn apply_branch_array(items: &mut Vec<Literal>, path: &[PathSeg], branch: Literal) {
    let Some((head, tail)) = path.split_first() else {
        return;
    };
    let PathSeg::Index(index) = head else {
        return;
    };
    if items.len() <= *index {
        items.resize(index + 1, Literal::Null);
    }
    if tail.is_empty() {
        items[*index] = branch;
        return;
    }
    match tail.first() {
        Some(PathSeg::Key(_)) => {
            let mut nested = match &items[*index] {
                Literal::Object(entries) => entries.clone(),
                _ => Vec::new(),
            };
            apply_branch(&mut nested, tail, branch);
            items[*index] = Literal::Object(nested);
        }
        Some(PathSeg::Index(_)) => {
            let mut nested = match &items[*index] {
                Literal::Array(inner) => inner.clone(),
                _ => Vec::new(),
            };
            apply_branch_array(&mut nested, tail, branch);
            items[*index] = Literal::Array(nested);
        }
        None => {}
    }
}

fn literal_at_path<'a>(entries: &'a [(String, Literal)], path: &[PathSeg]) -> Option<&'a Literal> {
    let (head, tail) = path.split_first()?;
    let PathSeg::Key(key) = head else {
        return None;
    };
    let value = entries
        .iter()
        .find(|(k, _)| k == key)
        .map(|(_, value)| value)?;
    if tail.is_empty() {
        return Some(value);
    }
    match value {
        Literal::Object(nested) => literal_at_path(nested, tail),
        Literal::Array(items) => literal_at_array_path(items, tail),
        _ => None,
    }
}

fn literal_at_array_path<'a>(items: &'a [Literal], path: &[PathSeg]) -> Option<&'a Literal> {
    let (head, tail) = path.split_first()?;
    let PathSeg::Index(i) = head else {
        return None;
    };
    let item = items.get(*i)?;
    if tail.is_empty() {
        return Some(item);
    }
    match item {
        Literal::Object(nested) => literal_at_path(nested, tail),
        Literal::Array(inner) => literal_at_array_path(inner, tail),
        _ => None,
    }
}
