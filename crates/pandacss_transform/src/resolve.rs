//! Resolve static style literals to atomic class name strings.

use pandacss_encoder::{Atom, Encoder, compare_atoms_by_emit_order};
use pandacss_extractor::{
    CallFacts, ExpressionKind, ExtractedCall, ObjectLiteralContext, StyleTree,
};
use pandacss_literal::Literal;
use pandacss_shared::{CssFactory, FIRST_THAT_WORKS_MIN_MEMBERS, format_first_that_works};
use pandacss_utility::ShorthandPolicy;

use pandacss_system::PatternTransformFn;
use pandacss_system::System;

use super::js;
use super::plan::{HelperCxMode, Rewrite};
use super::style_lower::{self, LowerTarget};

/// Returns `None` when the literal cannot be encoded to stable class strings.
pub(crate) fn classes_for_css_args(
    system: &System,
    args: &[Option<Literal>],
) -> Option<Vec<String>> {
    if args.iter().any(Option::is_none) {
        return None;
    }

    if args.iter().flatten().all(empty_css_arg) {
        return Some(Vec::new());
    }

    let mut layers = Vec::new();
    for arg in args.iter().flatten() {
        if !is_static_style_literal(arg) {
            return None;
        }
        collect_css_layers(arg, &mut layers);
    }
    let style = if layers.len() > 1 {
        system.merged_style_literal(&layers)?
    } else {
        layers.into_iter().next().flatten()?
    };
    if empty_css_arg(&style) {
        return Some(Vec::new());
    }
    let mut encoder = Encoder::with_conditions(system.conditions().clone());
    encode_css_arg(system, &mut encoder, &style);
    let mut atoms: Vec<Atom> = encoder.into_atoms().into_iter().collect();

    if atoms.is_empty() {
        return None;
    }

    atoms.sort_by(compare_atoms_by_emit_order);

    let classes: Vec<String> = atoms
        .iter()
        .filter_map(|atom| system.atomic_class_name(atom))
        .collect();

    if classes.is_empty() {
        return None;
    }

    Some(classes)
}

fn collect_css_layers(arg: &Literal, layers: &mut Vec<Option<Literal>>) {
    match arg {
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_css_layers(item, layers);
            }
        }
        Literal::Object(entries) if !entries.is_empty() => layers.push(Some(arg.clone())),
        _ => {}
    }
}

fn empty_css_arg(arg: &Literal) -> bool {
    match arg {
        Literal::Object(entries) => entries.iter().all(|(_, value)| empty_css_value(value)),
        Literal::Array(items) | Literal::Conditional(items) => items.iter().all(empty_css_arg),
        _ => true,
    }
}

fn empty_css_value(value: &Literal) -> bool {
    match value {
        Literal::Null => true,
        Literal::Object(entries) => entries.iter().all(|(_, value)| empty_css_value(value)),
        Literal::Array(items) | Literal::Conditional(items) => items.iter().all(empty_css_value),
        _ => false,
    }
}

fn encode_css_arg(
    system: &System,
    encoder: &mut Encoder<pandacss_encoder::ConditionSet>,
    arg: &Literal,
) {
    match arg {
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                if !matches!(item, Literal::Null | Literal::Bool(false)) {
                    encode_css_arg(system, encoder, item);
                }
            }
        }
        _ => {
            system.encode_style(encoder, arg, ShorthandPolicy::UserFacing);
        }
    }
}

/// A style value is static (safe to fold to a class string at build time) when
/// it holds no dynamic/`Conditional` leaves anywhere in its shape.
#[must_use]
pub(crate) fn is_static_style_literal(arg: &Literal) -> bool {
    match arg {
        Literal::Object(entries) => entries
            .iter()
            .all(|(_, value)| is_static_style_literal(value)),
        Literal::Conditional(branches) => branches.iter().all(is_static_style_literal),
        Literal::Array(items) => items.iter().all(is_static_style_literal),
        Literal::String(_)
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null
        | Literal::Token { .. } => true,
    }
}

pub(crate) fn css_call_should_bail(args: &[Option<Literal>]) -> bool {
    !args.is_empty()
        && !args.iter().any(Option::is_none)
        && args
            .iter()
            .flatten()
            .any(|arg| !is_static_style_literal(arg))
}

pub(crate) fn rewrite_for_css_call(
    system: &System,
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    style_args: &[Option<StyleTree>],
    facts: &CallFacts,
    helper_cx: HelperCxMode,
) -> Option<Rewrite> {
    if let Some(rewrite) = rewrite_finite_css_call(system, source, span, args, style_args) {
        return Some(rewrite);
    }
    super::css_partial::rewrite(system, source, span, style_args, facts, helper_cx)
}

fn rewrite_finite_css_call(
    system: &System,
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    style_args: &[Option<StyleTree>],
) -> Option<Rewrite> {
    if style_args
        .iter()
        .flatten()
        .any(style_lower::style_tree_is_open)
    {
        return None;
    }
    if style_args
        .iter()
        .flatten()
        .any(style_lower::style_tree_has_rewrite_sites)
    {
        let (expr, preserved) = if args.len() == 1 {
            let tree = style_args.first()?.as_ref()?;
            if matches!(tree, StyleTree::Object(_))
                && !style_lower::style_tree_has_value_and(tree)
                && !style_lower::has_nested_spread_branches(tree)
            {
                let expr =
                    style_lower::lower_style_tree(system, source, tree, LowerTarget::Css, None)?;
                (expr, style_lower::preserved_source_spans(tree))
            } else {
                style_lower::lower_css_args(system, source, style_args)?
            }
        } else {
            style_lower::lower_css_args(system, source, style_args)?
        };
        return Some(Rewrite::replace_preserving(
            span,
            style_lower::print_class_expr(&expr),
            preserved,
        ));
    }
    let classes = classes_for_css_args(system, args)?;
    Some(Rewrite::replace(span, js::string(&classes.join(" "))))
}

/// Inline a standalone `firstThatWorks(...)` call to its value form. A dynamic
/// member does not rewrite, so the runtime helper keeps producing it.
pub(crate) fn rewrite_for_first_that_works_call(
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> Option<Rewrite> {
    if args.len() < FIRST_THAT_WORKS_MIN_MEMBERS {
        return None;
    }
    let members = args
        .iter()
        .map(|arg| arg.as_ref()?.to_css_value_text())
        .collect::<Option<Vec<_>>>()?;
    let value = format_first_that_works(members.iter().map(String::as_str));
    Some(Rewrite::replace(span, js::string(&value)))
}

/// Inline a css factory call to its generated name: object form hashes, string
/// form resolves a named `theme` bag. Dynamic/unknown args don't rewrite.
pub(crate) fn rewrite_for_css_factory_call(
    system: &System,
    factory: CssFactory,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> Option<Rewrite> {
    let arg = args.first()?.as_ref()?;
    let name = match arg {
        Literal::Object(_) => factory.ident(&arg.to_json(), system.class_name_prefix()),
        Literal::String(name) => match factory {
            CssFactory::PositionTry => system.position_try(name)?.ident.clone(),
            CssFactory::ViewTransition => system.view_transition(name)?.class_name.clone(),
            CssFactory::Keyframes => return None,
        },
        _ => return None,
    };
    Some(Rewrite::replace(span, js::string(&name)))
}

pub(crate) fn rewrite_for_recipe_call(
    system: &System,
    source: &str,
    recipe_name: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    style_args: &[Option<StyleTree>],
    facts: &CallFacts,
) -> Option<Rewrite> {
    if recipe_call_has_unextractable_args(args, facts) {
        return None;
    }
    let tree = style_args.first().and_then(Option::as_ref);
    // Finite conditionals become a class ternary. Flattening both branches is
    // never correct — if we can't emit the expression, leave the call.
    if let Some(tree) = tree.filter(|tree| style_lower::style_tree_has_rewrite_sites(tree)) {
        let content = lower_recipe_call(system, source, recipe_name, tree)?;
        return Some(Rewrite::replace_preserving(
            span,
            content,
            style_lower::preserved_source_spans(tree),
        ));
    }
    if tree.is_some_and(style_lower::style_tree_is_open) {
        return None;
    }
    let content = resolve_recipe_call(system, recipe_name, args)?;
    Some(Rewrite::replace(span, content))
}

/// A recipe call resolves to one class string; a slot recipe call to an object
/// literal with one per slot.
fn resolve_recipe_call(
    system: &System,
    recipe_name: &str,
    args: &[Option<Literal>],
) -> Option<String> {
    if system.slot_recipe_slots(recipe_name).is_none() {
        let classes = system.class_names_for_recipe_call(recipe_name, args)?;
        return Some(js::string(&classes.join(" ")));
    }
    let slots = system.class_names_for_slot_recipe_call(recipe_name, args)?;
    let fields = slots
        .iter()
        .map(|(slot, classes)| js::field(slot, js::string(&classes.join(" "))));
    Some(js::object(fields))
}

fn lower_recipe_call(
    system: &System,
    source: &str,
    recipe_name: &str,
    tree: &StyleTree,
) -> Option<String> {
    let Some(slots) = system.slot_recipe_slots(recipe_name) else {
        let target = LowerTarget::Recipe(recipe_name);
        let expr = style_lower::lower_style_tree(system, source, tree, target, None)?;
        return Some(style_lower::print_class_expr(&expr));
    };
    let fields = slots
        .iter()
        .map(|slot| {
            let target = LowerTarget::SlotRecipe {
                recipe: recipe_name,
                slot,
            };
            let expr = style_lower::lower_style_tree(system, source, tree, target, None)?;
            Some(js::field(slot, style_lower::print_class_expr(&expr)))
        })
        .collect::<Option<Vec<_>>>()?;
    Some(js::object(fields))
}

pub(crate) fn rewrite_for_pattern_call(
    system: &System,
    pattern_name: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    style_args: &[Option<StyleTree>],
    facts: &CallFacts,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<Rewrite> {
    if pattern_call_has_unextractable_args(args, style_args, facts) {
        return None;
    }
    let classes = system.class_names_for_pattern_call(pattern_name, args, pattern_transform)?;
    Some(Rewrite::replace(span, js::string(&classes.join(" "))))
}

/// Unwrap an identity `.raw({ … })` call to its object literal.
///
/// Callers decide which `.raw` qualifies; this only enforces the shape a
/// wrapper-strip needs — one object-literal argument, call syntax. Multiple
/// args are rejected because `css.raw(a, b)` deep-merges and normalizes.
///
/// Emitted as two edits around the argument rather than one call-wide rewrite so
/// nested rewrites (token folding) inside the object still apply.
pub(crate) fn rewrites_for_identity_raw_call(
    span: pandacss_shared::Span,
    arg_spans: &[pandacss_shared::Span],
    facts: &CallFacts,
) -> Option<[Rewrite; 2]> {
    let [arg] = arg_spans else {
        return None;
    };
    if facts.args.first()?.as_ref()?.kind != ExpressionKind::Object {
        return None;
    }

    let (open, close) = if facts.object_literal_context.needs_parentheses() {
        ("(", ")")
    } else {
        ("", "")
    };
    let before = pandacss_shared::Span {
        start: span.start,
        end: arg.start,
    };
    let after = pandacss_shared::Span {
        start: arg.end,
        end: span.end,
    };
    Some([
        Rewrite::replace(before, open.to_owned()),
        Rewrite::replace(after, close.to_owned()),
    ])
}

/// Fold `css.raw(a, b, …)` to the single object the runtime would build.
///
/// Only static object arguments qualify. `Literal::Conditional` is a runtime
/// branch rather than data, so anything carrying one is left alone.
pub(crate) fn rewrite_for_merged_raw_call(
    system: &System,
    call: &ExtractedCall,
) -> Option<Rewrite> {
    let merged = system.merged_style_literal(&call.data)?;
    rewrite_for_style_literal(call.span, call.facts.object_literal_context, &merged)
}

/// Fold `pattern.raw(props)` to the style object the pattern's transform
/// returns — the same value the runtime would hand back.
pub(crate) fn rewrite_for_pattern_raw_call(
    system: &System,
    call: &ExtractedCall,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<Rewrite> {
    if pattern_call_has_unextractable_args(&call.data, &call.style_args, &call.facts) {
        return None;
    }
    let styles =
        system.style_literal_for_pattern_call(&call.name, &call.data, pattern_transform)?;
    rewrite_for_style_literal(call.span, call.facts.object_literal_context, &styles)
}

/// Replace a whole call with the object literal it evaluates to.
///
/// `Literal::Conditional` is a runtime branch rather than data, so anything
/// carrying one is left alone.
pub(crate) fn rewrite_for_style_literal(
    span: pandacss_shared::Span,
    position: ObjectLiteralContext,
    styles: &Literal,
) -> Option<Rewrite> {
    if !matches!(styles, Literal::Object(_)) || styles.has_conditional() {
        return None;
    }
    let object = serde_json::to_string(styles).ok()?;
    let content = if position.needs_parentheses() {
        format!("({object})")
    } else {
        object
    };
    Some(Rewrite::replace(span, content))
}

pub(crate) fn span_slice(source: &str, span: pandacss_shared::Span) -> Option<&str> {
    let start = usize::try_from(span.start).ok()?;
    let end = usize::try_from(span.end).ok()?;
    source.get(start..end)
}

fn recipe_call_has_unextractable_args(args: &[Option<Literal>], facts: &CallFacts) -> bool {
    if args.iter().any(Option::is_none) {
        return true;
    }
    if call_has_no_props(args, facts) {
        return false;
    }
    matches!(
        args.first().and_then(|arg| arg.as_ref()),
        Some(Literal::Object(entries)) if entries.is_empty()
    )
}

/// No arguments, or a literal `{}` written directly at the call.
fn call_has_no_props(args: &[Option<Literal>], facts: &CallFacts) -> bool {
    args.is_empty()
        || facts
            .direct_empty_object_args
            .first()
            .is_some_and(|is_empty| *is_empty)
}

fn pattern_call_has_unextractable_args(
    args: &[Option<Literal>],
    style_args: &[Option<StyleTree>],
    facts: &CallFacts,
) -> bool {
    if args.iter().any(Option::is_none) {
        return true;
    }
    // A pattern call collapses to one value, so anything the literal can't
    // carry on its own — a dropped dynamic spread, or a branch only the
    // runtime can pick — has to stay a runtime call.
    if style_args.iter().flatten().any(|tree| {
        style_lower::style_tree_is_open(tree) || style_lower::style_tree_has_runtime_branch(tree)
    }) {
        return true;
    }
    if call_has_no_props(args, facts) {
        return false;
    }
    !matches!(
        args.first().and_then(|arg| arg.as_ref()),
        Some(Literal::Object(_))
    )
}
