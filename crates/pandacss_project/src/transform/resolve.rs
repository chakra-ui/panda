//! Resolve static style literals to atomic class name strings.

use std::collections::HashSet;

use pandacss_encoder::{Atom, Encoder, compare_atoms_by_emit_order};
use pandacss_extractor::{CallFacts, CallSyntax, Literal, StyleTree};
use pandacss_shared::view_transition_class_name;
use pandacss_utility::ShorthandPolicy;

use crate::PatternTransformFn;
use crate::Project;

use super::helper::CX_HELPER_LOCAL;
use super::plan::{HelperCxMode, Rewrite};
use super::style_lower::{self, LowerResult};

/// Returns `None` when the literal cannot be encoded to stable class strings.
pub(crate) fn classes_for_css_args(
    project: &Project,
    args: &[Option<Literal>],
) -> Option<Vec<String>> {
    if args.is_empty() || args.iter().any(Option::is_none) {
        return None;
    }

    let conditions = project.config().conditions().clone();
    let mut atoms: Vec<Atom> = Vec::new();

    for arg in args.iter().flatten() {
        if !is_static_css_arg(arg) {
            return None;
        }
        let mut encoder = Encoder::with_conditions(conditions.clone());
        encode_css_arg(project, &mut encoder, arg);
        let batch: Vec<Atom> = encoder.into_atoms().into_iter().collect();
        let batch_keys: HashSet<(String, Vec<Box<str>>)> = batch
            .iter()
            .map(|atom| (atom.prop().to_owned(), atom.conditions().to_vec()))
            .collect();
        atoms.retain(|atom| {
            !batch_keys.contains(&(atom.prop().to_owned(), atom.conditions().to_vec()))
        });
        atoms.extend(batch);
    }

    if atoms.is_empty() {
        return None;
    }

    atoms.sort_by(compare_atoms_by_emit_order);

    let classes: Vec<String> = atoms
        .iter()
        .filter_map(|atom| class_name_for_atom(project, atom))
        .collect();

    if classes.is_empty() {
        return None;
    }

    Some(classes)
}

fn encode_css_arg(
    project: &Project,
    encoder: &mut Encoder<pandacss_encoder::ConditionSet>,
    arg: &Literal,
) {
    match arg {
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                if !matches!(item, Literal::Null | Literal::Bool(false)) {
                    encode_css_arg(project, encoder, item);
                }
            }
        }
        _ => project.encode_atomic_for_transform(encoder, arg, ShorthandPolicy::UserFacing),
    }
}

/// A style value is static (safe to fold to a class string at build time) when
/// it holds no dynamic/`Conditional` leaves anywhere in its shape.
fn is_static_css_arg(arg: &Literal) -> bool {
    match arg {
        Literal::Object(entries) => entries.iter().all(|(_, value)| is_static_css_arg(value)),
        Literal::Conditional(branches) => branches.iter().all(is_static_css_arg),
        Literal::Array(items) => items.iter().all(is_static_css_arg),
        Literal::String(_)
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null
        | Literal::Token { .. } => true,
    }
}

fn class_name_for_atom(project: &Project, atom: &Atom) -> Option<String> {
    project.atomic_class_name_for_transform(atom)
}

#[must_use]
pub(crate) fn is_static_style_literal(arg: &Literal) -> bool {
    is_static_css_arg(arg)
}

pub(crate) fn css_call_should_bail(args: &[Option<Literal>]) -> bool {
    !args.is_empty()
        && !args.iter().any(Option::is_none)
        && args.iter().flatten().any(|arg| !is_static_css_arg(arg))
}

pub(crate) fn rewrite_for_css_call(
    project: &Project,
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    style_args: &[Option<StyleTree>],
    facts: &CallFacts,
    helper_cx: HelperCxMode,
) -> Option<Rewrite> {
    // StyleTree is the sole conditional rewrite path. Bail leaves the call;
    // open spreads must not fall through to a silent-static rewrite.
    if let Some(tree) = style_args.first().and_then(|value| value.as_ref()) {
        if style_lower::style_tree_has_rewrite_sites(tree) {
            return match style_lower::lower_style_tree(project, source, tree, None, None) {
                LowerResult::Static(classes) => Some(Rewrite {
                    start: span.start,
                    end: span.end,
                    content: js_string_literal(&classes),
                    preserved: Vec::new(),
                }),
                LowerResult::Expr(expr) => Some(Rewrite {
                    start: span.start,
                    end: span.end,
                    content: style_lower::print_class_expr(&expr),
                    preserved: style_lower::preserved_source_spans(tree),
                }),
                LowerResult::Bail => None,
            };
        }
        if tree.is_open() || style_lower::style_tree_has_open_spread(tree) {
            return None;
        }
    }
    let classes = classes_for_css_args(project, args)?;
    match analyze_css_arg(source, args, facts) {
        CssArgShape::AllStatic => {
            // StyleTree `Open` leaves (e.g. `a || 'gray'`) must not silent-rewrite
            // from encode-peeled Literal data. Top-level mixed uses Open props via
            // the branch below instead.
            if style_args
                .first()
                .and_then(|value| value.as_ref())
                .is_some_and(style_lower::style_tree_has_open_value)
            {
                return None;
            }
            Some(rewrite_for_class_names(span, &classes))
        }
        // A dynamic prop is nested (or otherwise unclean); leave the call so
        // nothing is silently dropped.
        CssArgShape::NeedsBail => None,
        // Inline the static props and keep the open-ended dynamic ones in a
        // runtime `css()` call, merged by `cx` — matches the runtime output.
        CssArgShape::TopLevelMixed {
            dynamic,
            mut preserved,
        } => {
            if helper_cx == HelperCxMode::False {
                return None;
            }
            let callee = css_callee(source, facts)?;
            preserved.push(facts.callee_span);
            Some(Rewrite {
                start: span.start,
                end: span.end,
                content: format!(
                    "{CX_HELPER_LOCAL}({}, {callee}({{ {} }}))",
                    js_string_literal(&classes.join(" ")),
                    dynamic.join(", ")
                ),
                preserved,
            })
        }
    }
}

enum CssArgShape {
    AllStatic,
    NeedsBail,
    /// Source of each open-ended dynamic top-level prop (`width: props.w`).
    TopLevelMixed {
        dynamic: Vec<String>,
        preserved: Vec<pandacss_shared::Span>,
    },
}

/// Classify a single-object `css()` arg into fully static, a clean top-level
/// static+dynamic mix, or "needs bail" (nested drop / spread / unparseable).
fn analyze_css_arg(source: &str, args: &[Option<Literal>], facts: &CallFacts) -> CssArgShape {
    // When the arg can't be analyzed cleanly, fall back to the plain rewrite
    // (unchanged behavior); only a *detected* nested drop bails.
    if args.len() != 1 {
        return CssArgShape::AllStatic;
    }
    let Some(Some(Literal::Object(folded))) = args.first() else {
        return CssArgShape::AllStatic;
    };
    let Some(object) = facts
        .args
        .first()
        .and_then(Option::as_ref)
        .and_then(|argument| argument.object.as_ref())
    else {
        return CssArgShape::AllStatic;
    };

    let mut dynamic = Vec::new();
    let mut preserved = Vec::new();
    for prop in &object.properties {
        // A spread reaching here already folded in (unresolvable bare-identifier
        // spreads bailed earlier); its props are already in `folded`.
        if prop.is_spread() {
            continue;
        }
        let Some(key) = prop.key.as_deref() else {
            return CssArgShape::NeedsBail;
        };
        match folded.iter().find(|(folded_key, _)| folded_key == key) {
            None => {
                let Some(raw) = span_slice(source, prop.span) else {
                    return CssArgShape::NeedsBail;
                };
                dynamic.push(raw.to_owned());
                preserved.push(prop.span);
            }
            Some((_, folded_value)) => {
                if prop
                    .value
                    .as_ref()
                    .and_then(|value| value.object.as_ref())
                    .is_some_and(|value| object_value_has_drop(value, folded_value))
                {
                    return CssArgShape::NeedsBail;
                }
            }
        }
    }

    if dynamic.is_empty() {
        CssArgShape::AllStatic
    } else {
        CssArgShape::TopLevelMixed { dynamic, preserved }
    }
}

/// `true` when the source object literal has any prop the folded value dropped
/// (recursively) — i.e. folding lost a nested dynamic prop.
fn object_value_has_drop(object: &pandacss_extractor::ObjectFacts, folded: &Literal) -> bool {
    let Literal::Object(folded) = folded else {
        return true;
    };
    object.properties.iter().any(|prop| {
        if prop.is_spread() {
            return false;
        }
        let Some(key) = prop.key.as_deref() else {
            return true;
        };
        match folded.iter().find(|(folded_key, _)| folded_key == key) {
            None => true,
            Some((_, folded_value)) => prop
                .value
                .as_ref()
                .and_then(|value| value.object.as_ref())
                .is_some_and(|value| object_value_has_drop(value, folded_value)),
        }
    })
}

/// The callee text of a call, e.g. `css` or `p.css`, from between the call
/// start and its first argument.
fn css_callee(source: &str, facts: &CallFacts) -> Option<String> {
    span_slice(source, facts.callee_span).map(str::to_owned)
}

pub(crate) fn rewrite_for_view_transition_call(
    project: &Project,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> Option<Rewrite> {
    let arg = args.first()?.as_ref()?;
    if !matches!(arg, Literal::Object(_)) {
        return None;
    }
    let class_name =
        view_transition_class_name(&arg.to_json(), &project.config().class_name_prefix);
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: js_string_literal(&class_name),
        preserved: Vec::new(),
    })
}

pub(crate) fn rewrite_for_recipe_call(
    project: &Project,
    recipe_name: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    facts: &CallFacts,
) -> Option<Rewrite> {
    if recipe_call_has_unextractable_args(args, facts) {
        return None;
    }
    let classes = project.class_names_for_recipe_call(recipe_name, args)?;
    Some(rewrite_for_class_names(span, &classes))
}

pub(crate) fn rewrite_for_pattern_call(
    project: &Project,
    pattern_name: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    facts: &CallFacts,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<Rewrite> {
    if pattern_call_has_unextractable_args(args, facts) {
        return None;
    }
    let classes = project.class_names_for_pattern_call(pattern_name, args, pattern_transform)?;
    Some(rewrite_for_class_names(span, &classes))
}

fn rewrite_for_class_names(span: pandacss_shared::Span, classes: &[String]) -> Rewrite {
    Rewrite {
        start: span.start,
        end: span.end,
        content: js_string_literal(&classes.join(" ")),
        preserved: Vec::new(),
    }
}

/// Quote a class string as a JS string literal, escaping embedded quotes and
/// backslashes (arbitrary values like `content: '"x"'`).
pub(crate) fn js_string_literal(value: &str) -> String {
    serde_json::to_string(value).expect("string serializes as JSON")
}

pub(crate) fn span_slice(source: &str, span: pandacss_shared::Span) -> Option<&str> {
    let start = usize::try_from(span.start).ok()?;
    let end = usize::try_from(span.end).ok()?;
    source.get(start..end)
}

fn recipe_call_has_unextractable_args(args: &[Option<Literal>], facts: &CallFacts) -> bool {
    if facts.syntax != CallSyntax::Call || args.iter().any(Option::is_none) {
        return true;
    }
    if args.is_empty()
        || facts
            .direct_empty_object_args
            .first()
            .is_some_and(|is_empty| *is_empty)
    {
        return false;
    }
    matches!(
        args.first().and_then(|arg| arg.as_ref()),
        Some(Literal::Object(entries)) if entries.is_empty()
    )
}

fn pattern_call_has_unextractable_args(args: &[Option<Literal>], facts: &CallFacts) -> bool {
    if facts.syntax != CallSyntax::Call || args.iter().any(Option::is_none) {
        return true;
    }
    if args.is_empty()
        || facts
            .direct_empty_object_args
            .first()
            .is_some_and(|is_empty| *is_empty)
    {
        return false;
    }
    !matches!(
        args.first().and_then(|arg| arg.as_ref()),
        Some(Literal::Object(_))
    )
}
