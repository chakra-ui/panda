//! Lower extract-time [`StyleTree`] to class string expressions (no source re-parse).

use std::collections::HashSet;

use rustc_hash::FxHashSet;

use pandacss_extractor::{
    ExtractedJsx, JsxKind, Literal, StyleObject, StyleSpread, StyleTree, project_literal,
};
use pandacss_shared::Span;

use crate::PatternTransformFn;
use crate::Project;

use super::resolve::{classes_for_css_args, js_string_literal, span_slice};

const MAX_CONDITIONAL_SITES: usize = 64;

/// Ceiling on the leaves of a [`lower_combinations`] decision tree. Past this,
/// the inlined string is bigger than the call it replaces.
const MAX_COMBINATION_LEAVES: usize = 16;

/// A lowered class value. `Lit` is a plain class list — callers that can inline
/// a static string check for it rather than carrying a parallel "is static" flag.
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

/// What a lowered branch encodes to. Lowering is shape-driven and shared; the
/// targets differ only in how one branch literal becomes class names.
#[derive(Debug, Clone, Copy)]
pub(crate) enum LowerTarget<'a> {
    Css,
    Jsx(&'a ExtractedJsx),
    Recipe(&'a str),
}

impl LowerTarget<'_> {
    fn encode(
        self,
        project: &Project,
        lit: Literal,
        pattern_transform: Option<&mut PatternTransformFn<'_>>,
    ) -> Option<String> {
        let classes = match self {
            Self::Css => classes_for_css_args(project, &[Some(lit)])?,
            Self::Jsx(jsx) => {
                let branch_jsx = ExtractedJsx {
                    data: lit,
                    style: None,
                    ..jsx.clone()
                };
                project.class_names_for_jsx_usage(&branch_jsx, pattern_transform)?
            }
            Self::Recipe(recipe_name) => {
                project.class_names_for_recipe_call(recipe_name, &[Some(lit)])?
            }
        };
        Some(classes.join(" "))
    }

    /// Whether a branch with no static answer can be emitted as no classes.
    /// True where empty props really do mean no classes; a recipe or pattern
    /// still applies its base and defaults, so `None` there means the branch is
    /// unresolvable and the call belongs to the runtime.
    fn unresolved_branch_is_empty(self) -> bool {
        match self {
            Self::Css => true,
            Self::Jsx(jsx) => matches!(jsx.kind, JsxKind::Factory | JsxKind::Component),
            Self::Recipe(_) => false,
        }
    }

    /// Recipe base + defaults repeat in every arm, so one site is already worth
    /// hoisting. css/jsx keep the bare ternary for the class attribute to merge.
    fn hoist_single_site(self) -> bool {
        matches!(self, Self::Recipe(_))
    }

    /// Keys whose absence from a branch doesn't mean "unset": a recipe fills in
    /// `defaultVariants`, a pattern its `defaultValues`. Branches that touch
    /// these can't be lowered one site at a time — see [`lower_combinations`].
    fn default_bearing_props(self, project: &Project) -> FxHashSet<&str> {
        let config = project.config();
        match self {
            Self::Recipe(recipe_name) => config.recipes.variant_props_for(&[recipe_name]),
            Self::Jsx(jsx) if jsx.kind == JsxKind::Recipe => {
                let recipes = &config.recipes;
                recipes.variant_props_for(&recipes.find_by_jsx(&jsx.name))
            }
            Self::Jsx(jsx) if jsx.kind == JsxKind::Pattern => {
                config.patterns.default_value_keys(&jsx.name)
            }
            Self::Css | Self::Jsx(_) => FxHashSet::default(),
        }
    }
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

/// True when the tree contains a branch only the runtime can decide.
///
/// Callers that collapse a whole call to one value — pattern calls, which emit
/// a single class string or a single object — can't express a branch, so they
/// have to leave the call to the runtime.
#[must_use]
pub(crate) fn style_tree_has_runtime_branch(tree: &StyleTree) -> bool {
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
pub(crate) fn style_tree_has_open_value(tree: &StyleTree) -> bool {
    match tree {
        StyleTree::Open | StyleTree::OpenWithFallback(_) => true,
        StyleTree::Object(obj) => {
            obj.spreads.iter().any(|s| match s {
                StyleSpread::Open { .. } | StyleSpread::OpenWithFallback { .. } => true,
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
            format!("{test} ? {} : {}", print_arm(yes), print_class_expr(no))
        }
        ClassExpr::Join(parts) => print_join(parts),
    }
}

/// A ternary nested in the *consequent* is parenthesized. The parse is
/// unambiguous either way, but `a ? b ? x : y : z` isn't readable; a chain of
/// alternates (`a ? x : b ? y : z`) is.
fn print_arm(expr: &ClassExpr) -> String {
    match expr {
        ClassExpr::Ternary { .. } => format!("({})", print_class_expr(expr)),
        _ => print_class_expr(expr),
    }
}

/// Print `a + " " + b`, except that a part which can be empty carries its own
/// separator inside each branch — otherwise an empty branch leaves a stray
/// space in the class attribute.
fn print_join(parts: &[ClassExpr]) -> String {
    let mut out = String::new();
    for (index, part) in parts.iter().enumerate() {
        if index == 0 {
            out.push_str(&print_operand(part));
            continue;
        }
        if has_empty_leaf(part) {
            out.push_str(" + ");
            out.push_str(&print_operand(&with_leading_separator(part)));
        } else {
            out.push_str(" + \" \" + ");
            out.push_str(&print_operand(part));
        }
    }
    out
}

fn print_operand(expr: &ClassExpr) -> String {
    match expr {
        // A string literal needs no grouping as a `+` operand.
        ClassExpr::Lit(value) => js_string_literal(value),
        _ => format!("({})", print_class_expr(expr)),
    }
}

fn has_empty_leaf(expr: &ClassExpr) -> bool {
    match expr {
        ClassExpr::Lit(value) => value.is_empty(),
        ClassExpr::Ternary { yes, no, .. } => has_empty_leaf(yes) || has_empty_leaf(no),
        ClassExpr::Join(parts) => parts.iter().any(has_empty_leaf),
    }
}

/// Push a leading space into every non-empty leaf, so an empty branch
/// contributes nothing at all.
fn with_leading_separator(expr: &ClassExpr) -> ClassExpr {
    match expr {
        ClassExpr::Lit(value) if value.is_empty() => ClassExpr::Lit(String::new()),
        ClassExpr::Lit(value) => ClassExpr::Lit(format!(" {value}")),
        ClassExpr::Ternary { test, yes, no } => ClassExpr::Ternary {
            test: test.clone(),
            yes: Box::new(with_leading_separator(yes)),
            no: Box::new(with_leading_separator(no)),
        },
        ClassExpr::Join(parts) => {
            let mut parts = parts.clone();
            if let Some(first) = parts.first_mut() {
                *first = with_leading_separator(first);
            }
            ClassExpr::Join(parts)
        }
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
                    StyleSpread::Open { .. } | StyleSpread::OpenWithFallback { .. } => {}
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
pub(crate) fn lower_style_tree(
    project: &Project,
    source: &str,
    tree: &StyleTree,
    target: LowerTarget<'_>,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    if tree.is_open() || style_tree_has_open_value(tree) {
        return None;
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
            target,
            pattern_transform.as_deref_mut(),
        );
    }

    let StyleTree::Object(obj) = tree else {
        return encode_tree(project, tree, target, pattern_transform.as_deref_mut())
            .map(ClassExpr::Lit);
    };

    let mut path: Vec<PathSeg> = Vec::new();
    let mut sites = Vec::new();
    collect_sites(obj, &mut path, &mut sites)?;
    if sites.len() > MAX_CONDITIONAL_SITES {
        return None;
    }
    if sites.is_empty() {
        return encode_tree(project, tree, target, pattern_transform.as_deref_mut())
            .map(ClassExpr::Lit);
    }

    sites.sort_by_key(Site::test_start);

    let affected_paths = affected_paths_by_site(&sites);
    if affected_paths_overlap(&affected_paths) {
        return None;
    }
    let full_base = projected_base(obj);
    let mut shared_base = full_base.clone();
    for path in affected_paths.iter().flatten() {
        remove_base_path(&mut shared_base, path);
    }
    let mut exprs = Vec::with_capacity(sites.len());
    let ctx = LowerCtx {
        source,
        shared_base: &shared_base,
        full_base: &full_base,
        project,
        target,
    };
    match lower_default_bearing_sites(
        &sites,
        &affected_paths,
        &shared_base,
        &ctx,
        &mut pattern_transform,
    ) {
        SiteLowering::Deferred => return None,
        SiteLowering::Combined(combined) => {
            // One site keeps the bare ternary the per-site path would print;
            // several repeat the base in every leaf, so hoist it out.
            let lowered = if sites.len() == 1 && !target.hoist_single_site() {
                combined
            } else {
                hoist_into_join(vec![combined])
            };
            return Some(prune_empty(lowered));
        }
        SiteLowering::PerSite => {}
    }

    for site in &sites {
        exprs.push(lower_site(site, &ctx, &mut pattern_transform)?);
    }

    let lowered = if exprs.len() == 1 && !target.hoist_single_site() {
        exprs.pop()?
    } else {
        hoist_into_join(exprs)
    };
    Some(prune_empty(lowered))
}

/// How a site set has to be lowered.
enum SiteLowering {
    /// Branch classes depend only on the keys each branch sets, so sites lower
    /// one at a time.
    PerSite,
    /// The combination walk's result.
    Combined(ClassExpr),
    /// Combinations are required but can't be produced — leave it to the runtime.
    Deferred,
}

/// Sites that set a [default-bearing key](LowerTarget::default_bearing_props)
/// can't be lowered independently, because a branch that omits one still
/// resolves the default.
fn lower_default_bearing_sites(
    sites: &[Site],
    affected_paths: &[Vec<Vec<PathSeg>>],
    shared_base: &[(String, Literal)],
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> SiteLowering {
    let props = ctx.target.default_bearing_props(ctx.project);
    if props.is_empty() {
        return SiteLowering::PerSite;
    }
    let touches = |paths: &Vec<Vec<PathSeg>>| {
        paths
            .iter()
            .filter_map(|path| match path.first() {
                Some(PathSeg::Key(key)) => Some(key.as_str()),
                _ => None,
            })
            .any(|key| props.contains(key))
    };
    if !affected_paths.iter().any(touches) {
        return SiteLowering::PerSite;
    }

    // `cond && 'sm'` falls back to the test's own value when falsy: `undefined`
    // keeps the default, `false` replaces it with a value that matches nothing.
    // One class string can't be both.
    let undecidable = sites
        .iter()
        .zip(affected_paths)
        .any(|(site, paths)| matches!(site, Site::PropertyAnd { .. }) && touches(paths));
    if undecidable || combination_leaves(sites) > MAX_COMBINATION_LEAVES {
        return SiteLowering::Deferred;
    }
    lower_combinations(sites, shared_base, ctx, pattern_transform)
        .map_or(SiteLowering::Deferred, SiteLowering::Combined)
}

/// Walk the sites into a decision tree, resolving each leaf against the whole
/// selection it stands for. Costlier to print than independent sites, but it's
/// the only shape that gets defaults — and compound variants, which depend on
/// several keys at once — right.
fn lower_combinations(
    sites: &[Site],
    entries: &[(String, Literal)],
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    let Some((site, rest)) = sites.split_first() else {
        return encode_literal_object(
            ctx.project,
            entries,
            ctx.target,
            pattern_transform.as_deref_mut(),
        )
        .map(ClassExpr::Lit);
    };

    match site {
        Site::PropertyTernary {
            path,
            test,
            consequent,
            alternate,
        } => {
            let test_src = span_slice(ctx.source, *test)?.to_owned();
            let yes =
                lower_arm_combinations(path, consequent, rest, entries, ctx, pattern_transform)?;
            let no =
                lower_arm_combinations(path, alternate, rest, entries, ctx, pattern_transform)?;
            Some(ternary(test_src, yes, no))
        }
        // Only reached for keys with no default, where the falsy arm simply
        // drops the key.
        Site::PropertyAnd { path, test, value } => {
            let test_src = span_slice(ctx.source, *test)?.to_owned();
            let yes = lower_arm_combinations(path, value, rest, entries, ctx, pattern_transform)?;
            let no = lower_combinations(rest, entries, ctx, pattern_transform)?;
            Some(ternary(test_src, yes, no))
        }
        Site::SpreadTernary {
            path,
            test,
            consequent,
            alternate,
            overridden,
        } => {
            let test_src = span_slice(ctx.source, *test)?.to_owned();
            let mut affected = affected_keys_from_arms(consequent, alternate);
            affected.retain(|key| !overridden.contains(key));
            let yes_entries =
                spread_branch_entries(ctx, path, &affected, consequent, overridden, entries)?;
            let yes = lower_combinations(rest, &yes_entries, ctx, pattern_transform)?;
            let no_entries =
                spread_branch_entries(ctx, path, &affected, alternate, overridden, entries)?;
            let no = lower_combinations(rest, &no_entries, ctx, pattern_transform)?;
            Some(ternary(test_src, yes, no))
        }
    }
}

fn lower_arm_combinations(
    path: &[PathSeg],
    arm: &StyleTree,
    rest: &[Site],
    entries: &[(String, Literal)],
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    if let StyleTree::Ternary {
        test,
        consequent,
        alternate,
    } = arm
    {
        let test_src = span_slice(ctx.source, *test)?.to_owned();
        let yes = lower_arm_combinations(path, consequent, rest, entries, ctx, pattern_transform)?;
        let no = lower_arm_combinations(path, alternate, rest, entries, ctx, pattern_transform)?;
        return Some(ternary(test_src, yes, no));
    }
    let mut next = entries.to_vec();
    apply_branch(&mut next, path, project_literal(arm)?);
    lower_combinations(rest, &next, ctx, pattern_transform)
}

fn combination_leaves(sites: &[Site]) -> usize {
    sites
        .iter()
        .map(|site| match site {
            Site::PropertyTernary {
                consequent,
                alternate,
                ..
            } => arm_leaves(consequent) + arm_leaves(alternate),
            Site::PropertyAnd { .. } | Site::SpreadTernary { .. } => 2,
        })
        .fold(1usize, usize::saturating_mul)
}

fn arm_leaves(arm: &StyleTree) -> usize {
    match arm {
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => arm_leaves(consequent) + arm_leaves(alternate),
        _ => 1,
    }
}

/// Drop conditions that don't change the class list, rather than print
/// `a ? "" : ""`.
fn prune_empty(expr: ClassExpr) -> ClassExpr {
    match expr {
        ClassExpr::Lit(value) => ClassExpr::Lit(value),
        ClassExpr::Ternary { test, yes, no } => {
            let yes = prune_empty(*yes);
            let no = prune_empty(*no);
            // Arms that resolve alike make the condition pointless — but only
            // drop it when evaluating the test can't be observed.
            if yes == no && test_is_side_effect_free(&test) {
                return yes;
            }
            ternary(test, yes, no)
        }
        ClassExpr::Join(parts) => {
            let mut kept: Vec<ClassExpr> = parts
                .into_iter()
                .map(prune_empty)
                .filter(|part| !is_empty_expr(part))
                .collect();
            match kept.len() {
                0 => ClassExpr::Lit(String::new()),
                1 => kept.remove(0),
                _ => ClassExpr::Join(kept),
            }
        }
    }
}

/// An identifier or dotted path, optionally negated. Anything else — a call, an
/// assignment, an index — is left in place, since the transform must not drop an
/// expression the source may rely on running.
fn test_is_side_effect_free(test: &str) -> bool {
    let test = test.trim().trim_start_matches('!').trim_start();
    !test.is_empty()
        && test.split('.').all(|segment| {
            let mut chars = segment.chars();
            chars
                .next()
                .is_some_and(|first| first.is_ascii_alphabetic() || first == '_' || first == '$')
                && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$')
        })
}

fn is_empty_expr(expr: &ClassExpr) -> bool {
    let mut empty = true;
    for_each_leaf(expr, &mut |leaf| empty &= leaf.is_empty());
    empty
}

/// Emit the tokens every leaf shares once, in front of the rest.
fn hoist_into_join(mut exprs: Vec<ClassExpr>) -> ClassExpr {
    let shared = hoist_shared_classes(&mut exprs);
    match (shared, exprs.len()) {
        (None, 1) => exprs.remove(0),
        (None, _) => ClassExpr::Join(exprs),
        (Some(shared), _) => {
            let mut parts = Vec::with_capacity(exprs.len() + 1);
            parts.push(ClassExpr::Lit(shared));
            parts.append(&mut exprs);
            ClassExpr::Join(parts)
        }
    }
}

/// Every site encodes the object's static base alongside its own branch, so a
/// class list with N sites repeats that base N times at runtime. Class order
/// doesn't affect the cascade, so tokens present in every branch of every site
/// are pulled out and emitted once.
fn hoist_shared_classes(exprs: &mut [ClassExpr]) -> Option<String> {
    let mut shared: Option<Vec<String>> = None;
    for expr in exprs.iter() {
        let mut bail = false;
        for_each_leaf(expr, &mut |leaf| {
            if bail {
                return;
            }
            match &mut shared {
                None => shared = Some(leaf.split_whitespace().map(str::to_owned).collect()),
                Some(shared) => shared
                    .retain(|token| leaf.split_whitespace().any(|candidate| candidate == token)),
            }
            bail = shared.as_ref().is_some_and(Vec::is_empty);
        });
        if bail {
            return None;
        }
    }

    let shared = shared.filter(|shared| !shared.is_empty())?;
    for expr in exprs.iter_mut() {
        for_each_leaf_mut(expr, &mut |leaf| {
            let kept: Vec<&str> = leaf
                .split_whitespace()
                .filter(|token| !shared.iter().any(|s| s == token))
                .collect();
            *leaf = kept.join(" ");
        });
    }
    Some(shared.join(" "))
}

fn for_each_leaf<'a>(expr: &'a ClassExpr, visit: &mut impl FnMut(&'a str)) {
    match expr {
        ClassExpr::Lit(value) => visit(value),
        ClassExpr::Ternary { yes, no, .. } => {
            for_each_leaf(yes, visit);
            for_each_leaf(no, visit);
        }
        ClassExpr::Join(parts) => {
            for part in parts {
                for_each_leaf(part, visit);
            }
        }
    }
}

fn for_each_leaf_mut(expr: &mut ClassExpr, visit: &mut impl FnMut(&mut String)) {
    match expr {
        ClassExpr::Lit(value) => visit(value),
        ClassExpr::Ternary { yes, no, .. } => {
            for_each_leaf_mut(yes, visit);
            for_each_leaf_mut(no, visit);
        }
        ClassExpr::Join(parts) => {
            for part in parts {
                for_each_leaf_mut(part, visit);
            }
        }
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
}

impl Site {
    const fn test_start(&self) -> u32 {
        match self {
            Self::PropertyTernary { test, .. }
            | Self::PropertyAnd { test, .. }
            | Self::SpreadTernary { test, .. } => test.start,
        }
    }
}

/// Both spread forms lower to `SpreadTernary`: `a && X` spreads X or nothing,
/// which is what `a ? X : {}` does, so downstream sees one spread shape.
fn collect_spread_sites(obj: &StyleObject, path: &[PathSeg], sites: &mut Vec<Site>) -> Option<()> {
    for spread in &obj.spreads {
        let (test, consequent, alternate, overridden) = match spread {
            StyleSpread::Open { .. } | StyleSpread::OpenWithFallback { .. } => {
                return None;
            }
            StyleSpread::Ternary {
                test,
                consequent,
                alternate,
                overridden,
            } => (test, consequent, alternate.clone(), overridden),
            StyleSpread::And {
                test,
                value,
                overridden,
            } => (
                test,
                value,
                StyleTree::Object(StyleObject::default()),
                overridden,
            ),
        };
        if tree_has_open(consequent) || tree_has_open(&alternate) {
            return None;
        }
        sites.push(Site::SpreadTernary {
            path: path.to_vec(),
            test: *test,
            consequent: consequent.clone(),
            alternate,
            overridden: overridden.clone(),
        });
    }
    Some(())
}

fn collect_sites(obj: &StyleObject, path: &mut Vec<PathSeg>, sites: &mut Vec<Site>) -> Option<()> {
    collect_spread_sites(obj, path, sites)?;

    for (key, value) in &obj.entries {
        match value {
            StyleTree::Open | StyleTree::OpenWithFallback(_) => return None,
            StyleTree::Ternary {
                test,
                consequent,
                alternate,
            } => {
                if tree_has_open(consequent) || tree_has_open(alternate) {
                    return None;
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
                    return None;
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
                let outcome = collect_sites(nested, path, sites);
                path.pop();
                outcome?;
            }
            StyleTree::Array(items) => {
                path.push(PathSeg::Key(key.clone()));
                let outcome = collect_array_sites(items, path, sites);
                path.pop();
                outcome?;
            }
            StyleTree::Branches(_)
            | StyleTree::String(_)
            | StyleTree::Number(_)
            | StyleTree::Bool(_)
            | StyleTree::Null
            | StyleTree::Token { .. } => {}
        }
    }
    Some(())
}

fn collect_array_sites(
    items: &[StyleTree],
    path: &mut Vec<PathSeg>,
    sites: &mut Vec<Site>,
) -> Option<()> {
    for (i, item) in items.iter().enumerate() {
        match item {
            StyleTree::Open | StyleTree::OpenWithFallback(_) => return None,
            StyleTree::Ternary {
                test,
                consequent,
                alternate,
            } => {
                if tree_has_open(consequent) || tree_has_open(alternate) {
                    return None;
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
                    return None;
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
                let outcome = collect_sites(nested, path, sites);
                path.pop();
                outcome?;
            }
            StyleTree::Array(inner) => {
                path.push(PathSeg::Index(i));
                let outcome = collect_array_sites(inner, path, sites);
                path.pop();
                outcome?;
            }
            StyleTree::Branches(_)
            | StyleTree::String(_)
            | StyleTree::Number(_)
            | StyleTree::Bool(_)
            | StyleTree::Null
            | StyleTree::Token { .. } => {}
        }
    }
    Some(())
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
                    StyleSpread::Open { .. } | StyleSpread::OpenWithFallback { .. } => true,
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
    target: LowerTarget<'_>,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    if tree_has_open(consequent) || tree_has_open(alternate) {
        return None;
    }
    let test_src = span_slice(source, test)?;
    let yes = encode_tree(
        project,
        consequent,
        target,
        pattern_transform.as_deref_mut(),
    )?;
    let no = encode_tree(project, alternate, target, pattern_transform)?;
    let expr = ternary(test_src.to_owned(), ClassExpr::Lit(yes), ClassExpr::Lit(no));
    Some(if target.hoist_single_site() {
        hoist_into_join(vec![expr])
    } else {
        expr
    })
}

/// Shared inputs for site/property-arm lowering (`pattern_transform` stays a
/// separate reborrowable param — packing `&mut dyn FnMut` into this struct
/// fights borrowck across sequential arm encodes).
struct LowerCtx<'a> {
    source: &'a str,
    /// Static entries no conditional site owns. Emitted in every branch, and
    /// hoisted back out when several sites share it.
    shared_base: &'a [(String, Literal)],
    /// Every static entry, including the ones sites own. A spread branch that
    /// omits an affected key falls back to the value here.
    full_base: &'a [(String, Literal)],
    project: &'a Project,
    target: LowerTarget<'a>,
}

fn ternary(test: String, yes: ClassExpr, no: ClassExpr) -> ClassExpr {
    ClassExpr::Ternary {
        test,
        yes: Box::new(yes),
        no: Box::new(no),
    }
}

fn lower_site(
    site: &Site,
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    match site {
        Site::PropertyTernary {
            path,
            test,
            consequent,
            alternate,
        } => lower_property_ternary(path, *test, consequent, alternate, ctx, pattern_transform),
        Site::PropertyAnd { path, test, value } => {
            lower_property_and(path, *test, value, ctx, pattern_transform)
        }
        Site::SpreadTernary {
            path,
            test,
            consequent,
            alternate,
            overridden,
        } => lower_spread_site(
            path,
            *test,
            consequent,
            alternate,
            overridden,
            ctx,
            pattern_transform,
        ),
    }
}

fn lower_property_ternary(
    path: &[PathSeg],
    test: pandacss_shared::Span,
    consequent: &StyleTree,
    alternate: &StyleTree,
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    let test_src = span_slice(ctx.source, test)?.to_owned();
    let yes = lower_property_arm(path, consequent, ctx, pattern_transform)?;
    let no = lower_property_arm(path, alternate, ctx, pattern_transform)?;
    Some(ternary(test_src, yes, no))
}

fn lower_property_and(
    path: &[PathSeg],
    test: pandacss_shared::Span,
    value: &StyleTree,
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    let test_src = span_slice(ctx.source, test)?.to_owned();
    let lit = project_literal(value)?;
    let mut truthy = ctx.shared_base.to_vec();
    apply_branch(&mut truthy, path, lit);
    let yes = encode_literal_object(
        ctx.project,
        &truthy,
        ctx.target,
        pattern_transform.as_deref_mut(),
    )?;
    let no = encode_literal_object(
        ctx.project,
        ctx.shared_base,
        ctx.target,
        pattern_transform.as_deref_mut(),
    )?;
    Some(ternary(test_src, ClassExpr::Lit(yes), ClassExpr::Lit(no)))
}

fn lower_spread_site(
    path: &[PathSeg],
    test: pandacss_shared::Span,
    consequent: &StyleTree,
    alternate: &StyleTree,
    overridden: &[String],
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    let test_src = span_slice(ctx.source, test)?.to_owned();
    let mut affected = affected_keys_from_arms(consequent, alternate);
    affected.retain(|key| !overridden.contains(key));
    let yes = encode_spread_branch(
        ctx,
        path,
        &affected,
        consequent,
        overridden,
        pattern_transform.as_deref_mut(),
    )?;
    let no = encode_spread_branch(
        ctx,
        path,
        &affected,
        alternate,
        overridden,
        pattern_transform.as_deref_mut(),
    )?;
    Some(ternary(test_src, ClassExpr::Lit(yes), ClassExpr::Lit(no)))
}

/// Entries at `path` in `entries` whose key is in `keys`.
fn entries_at_path_for_keys(
    entries: &[(String, Literal)],
    path: &[PathSeg],
    keys: &HashSet<String>,
) -> Vec<(String, Literal)> {
    let scope = if path.is_empty() {
        entries
    } else {
        match literal_at_path(entries, path) {
            Some(Literal::Object(nested)) => nested.as_slice(),
            _ => return Vec::new(),
        }
    };
    scope
        .iter()
        .filter(|(key, _)| keys.contains(key))
        .cloned()
        .collect()
}

fn lower_property_arm(
    path: &[PathSeg],
    arm: &StyleTree,
    ctx: &LowerCtx<'_>,
    pattern_transform: &mut Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassExpr> {
    if let StyleTree::Ternary {
        test,
        consequent,
        alternate,
    } = arm
    {
        let test_src = span_slice(ctx.source, *test)?.to_owned();
        let yes = lower_property_arm(path, consequent, ctx, pattern_transform)?;
        let no = lower_property_arm(path, alternate, ctx, pattern_transform)?;
        return Some(ternary(test_src, yes, no));
    }
    let lit = project_literal(arm)?;
    let mut next = ctx.shared_base.to_vec();
    apply_branch(&mut next, path, lit);
    let classes = encode_literal_object(
        ctx.project,
        &next,
        ctx.target,
        pattern_transform.as_deref_mut(),
    )?;
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
    ctx: &LowerCtx<'_>,
    path: &[PathSeg],
    affected: &HashSet<String>,
    branch: &StyleTree,
    overridden: &[String],
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    let next = spread_branch_entries(ctx, path, affected, branch, overridden, ctx.shared_base)?;
    encode_literal_object(ctx.project, &next, ctx.target, pattern_transform)
}

/// The entries a spread branch resolves to, layered over `base`.
fn spread_branch_entries(
    ctx: &LowerCtx<'_>,
    path: &[PathSeg],
    affected: &HashSet<String>,
    branch: &StyleTree,
    overridden: &[String],
    base: &[(String, Literal)],
) -> Option<Vec<(String, Literal)>> {
    let branch_obj = match project_literal(branch) {
        Some(Literal::Object(entries)) => entries
            .into_iter()
            .filter(|(key, _)| !overridden.contains(key))
            .collect(),
        Some(_) => return None,
        None => Vec::new(),
    };
    // Spreading an object that omits an affected key leaves the static value in
    // place, so resolve the branch against `full_base` before encoding.
    let mut resolved = entries_at_path_for_keys(ctx.full_base, path, affected);
    for (key, value) in branch_obj {
        Literal::upsert_object_entry(&mut resolved, key, value);
    }

    let next = if path.is_empty() {
        let mut result: Vec<(String, Literal)> = base
            .iter()
            .filter(|(key, _)| !affected.contains(key))
            .cloned()
            .collect();
        for (k, v) in resolved {
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
        for (k, v) in resolved {
            Literal::upsert_object_entry(&mut filtered, k, v);
        }
        let mut result = base.to_vec();
        apply_branch(&mut result, path, Literal::Object(filtered));
        result
    };
    Some(next)
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
    target: LowerTarget<'_>,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    target.encode(project, project_literal(tree)?, pattern_transform)
}

fn encode_literal_object(
    project: &Project,
    entries: &[(String, Literal)],
    target: LowerTarget<'_>,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    match target.encode(
        project,
        Literal::Object(entries.to_vec()),
        pattern_transform,
    ) {
        Some(classes) => Some(classes),
        None => target.unresolved_branch_is_empty().then(String::new),
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
