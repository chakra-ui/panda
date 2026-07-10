//! Resolve static style literals to atomic class name strings.

use std::collections::HashSet;

use pandacss_encoder::{Atom, Encoder, compare_atoms_by_emit_order};
use pandacss_extractor::Literal;
use pandacss_utility::ShorthandPolicy;

use crate::PatternTransformFn;
use crate::Project;

use super::css_conditional;
use super::helper::CX_HELPER_LOCAL;
use super::plan::{HelperCxMode, Rewrite};

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
    arg_spans: &[pandacss_shared::Span],
    helper_cx: HelperCxMode,
) -> Option<Rewrite> {
    if css_call_has_unresolved_identifier_spread(source, span) {
        return None;
    }
    if css_conditional::args_need_conditional_rewrite(source, arg_spans, args) {
        let expression =
            css_conditional::class_expression_for_css_call(project, source, arg_spans, args)?;
        return Some(Rewrite {
            start: span.start,
            end: span.end,
            content: expression,
        });
    }
    let classes = classes_for_css_args(project, args)?;
    match analyze_css_arg(source, args, arg_spans) {
        CssArgShape::AllStatic => Some(rewrite_for_class_names(span, &classes)),
        // A dynamic prop is nested (or otherwise unclean); leave the call so
        // nothing is silently dropped.
        CssArgShape::NeedsBail => None,
        // Inline the static props and keep the open-ended dynamic ones in a
        // runtime `css()` call, merged by `cx` — matches the runtime output.
        CssArgShape::TopLevelMixed(dynamic) => {
            if helper_cx == HelperCxMode::False {
                return None;
            }
            let callee = css_callee(source, span, arg_spans)?;
            Some(Rewrite {
                start: span.start,
                end: span.end,
                content: format!(
                    "{CX_HELPER_LOCAL}({}, {callee}({{ {} }}))",
                    js_string_literal(&classes.join(" ")),
                    dynamic.join(", ")
                ),
            })
        }
    }
}

enum CssArgShape {
    AllStatic,
    NeedsBail,
    /// Source of each open-ended dynamic top-level prop (`width: props.w`).
    TopLevelMixed(Vec<String>),
}

/// Classify a single-object `css()` arg into fully static, a clean top-level
/// static+dynamic mix, or "needs bail" (nested drop / spread / unparseable).
fn analyze_css_arg(
    source: &str,
    args: &[Option<Literal>],
    arg_spans: &[pandacss_shared::Span],
) -> CssArgShape {
    // When the arg can't be analyzed cleanly, fall back to the plain rewrite
    // (unchanged behavior); only a *detected* nested drop bails.
    if args.len() != 1 {
        return CssArgShape::AllStatic;
    }
    let Some(Some(Literal::Object(folded))) = args.first() else {
        return CssArgShape::AllStatic;
    };
    let Some(arg_span) = arg_spans.first() else {
        return CssArgShape::AllStatic;
    };
    let Some(arg_src) = span_slice(source, *arg_span) else {
        return CssArgShape::AllStatic;
    };
    let Some(props) = pandacss_extractor::parse_object_fragment(arg_src.trim()) else {
        return CssArgShape::AllStatic;
    };

    let mut dynamic = Vec::new();
    for prop in &props {
        // A spread reaching here already folded in (unresolvable bare-identifier
        // spreads bailed earlier); its props are already in `folded`.
        if prop.spread {
            continue;
        }
        let Some(key) = prop.key.as_deref() else {
            return CssArgShape::AllStatic;
        };
        match folded.iter().find(|(folded_key, _)| folded_key == key) {
            None => dynamic.push(prop.raw.clone()),
            Some((_, folded_value)) => {
                if prop.value_is_dynamic
                    && prop
                        .value_raw
                        .as_deref()
                        .is_none_or(|value| object_value_has_drop(value, folded_value))
                {
                    return CssArgShape::NeedsBail;
                }
            }
        }
    }

    if dynamic.is_empty() {
        CssArgShape::AllStatic
    } else {
        CssArgShape::TopLevelMixed(dynamic)
    }
}

/// `true` when the source object literal has any prop the folded value dropped
/// (recursively) — i.e. folding lost a nested dynamic prop.
fn object_value_has_drop(source_obj: &str, folded: &Literal) -> bool {
    let Literal::Object(folded) = folded else {
        return true;
    };
    let Some(props) = pandacss_extractor::parse_object_fragment(source_obj.trim()) else {
        return true;
    };
    props.iter().any(|prop| {
        if prop.spread {
            return false;
        }
        let Some(key) = prop.key.as_deref() else {
            return true;
        };
        match folded.iter().find(|(folded_key, _)| folded_key == key) {
            None => true,
            Some((_, folded_value)) => {
                prop.value_is_dynamic
                    && prop
                        .value_raw
                        .as_deref()
                        .is_none_or(|value| object_value_has_drop(value, folded_value))
            }
        }
    })
}

/// The callee text of a call, e.g. `css` or `p.css`, from between the call
/// start and its first argument.
fn css_callee(
    source: &str,
    span: pandacss_shared::Span,
    arg_spans: &[pandacss_shared::Span],
) -> Option<String> {
    let arg_start = usize::try_from(arg_spans.first()?.start).ok()?;
    let start = usize::try_from(span.start).ok()?;
    let prefix = source.get(start..arg_start)?;
    Some(
        prefix
            .trim_end()
            .trim_end_matches('(')
            .trim_end()
            .to_owned(),
    )
}

pub(crate) fn rewrite_for_recipe_call(
    project: &Project,
    source: &str,
    recipe_name: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> Option<Rewrite> {
    if recipe_call_has_unextractable_args(source, span, args) {
        return None;
    }
    let classes = project.class_names_for_recipe_call(recipe_name, args)?;
    Some(rewrite_for_class_names(span, &classes))
}

pub(crate) fn rewrite_for_pattern_call(
    project: &Project,
    source: &str,
    pattern_name: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<Rewrite> {
    if pattern_call_has_unextractable_args(source, span, args) {
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

pub(crate) fn call_is_raw_member(source: &str, span: pandacss_shared::Span) -> bool {
    span_slice(source, span).is_some_and(|slice| slice.contains(".raw("))
}

fn is_tagged_template_span(slice: &str) -> bool {
    slice.contains('`')
}

fn call_args_inner(source: &str, span: pandacss_shared::Span) -> Option<&str> {
    let slice = span_slice(source, span)?;
    if is_tagged_template_span(slice) {
        return None;
    }
    let open = slice.find('(')?;
    let close = slice.rfind(')')?;
    Some(slice[open + 1..close].trim())
}

fn css_call_has_unresolved_identifier_spread(source: &str, span: pandacss_shared::Span) -> bool {
    let Some(slice) = span_slice(source, span) else {
        return true;
    };
    if is_tagged_template_span(slice) {
        return false;
    }
    let Some(inner) = call_args_inner(source, span) else {
        return true;
    };

    let mut rest = inner;
    while let Some(index) = rest.find("...") {
        let after = rest[index + 3..].trim_start();
        if after.starts_with('{') {
            rest = &rest[index + 3..];
            continue;
        }
        let Some(ident) = take_identifier(after) else {
            rest = &rest[index + 3..];
            continue;
        };
        let after_ident = after[ident.len()..].trim_start();
        if !(after_ident.is_empty() || after_ident.starts_with(',') || after_ident.starts_with('}'))
        {
            // Expression spread (`...(cond && obj)`, `...(a ? b : c)`) — not a bare identifier.
            rest = &rest[index + 3..];
            continue;
        }
        if !is_resolvable_style_spread_binding(source, ident) {
            return true;
        }
        rest = &rest[index + 3 + ident.len()..];
    }
    false
}

fn take_identifier(input: &str) -> Option<&str> {
    let first = input.chars().next()?;
    if !(first == '_' || first.is_ascii_alphabetic()) {
        return None;
    }
    let mut len = first.len_utf8();
    for ch in input[len..].chars() {
        if ch == '_' || ch.is_ascii_alphanumeric() {
            len += ch.len_utf8();
        } else {
            break;
        }
    }
    Some(&input[..len])
}

fn is_resolvable_style_spread_binding(source: &str, name: &str) -> bool {
    let patterns = [
        format!("const {name} = css.raw"),
        format!("const {name} = {{"),
        format!("let {name} = css.raw"),
        format!("let {name} = {{"),
        format!("import {{ {name} }}"),
        format!("import {{ {name},"),
        format!("import {name} from"),
        format!("import {name},"),
    ];
    patterns
        .iter()
        .any(|pattern| source.contains(pattern.as_str()))
}

fn recipe_call_has_unextractable_args(
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> bool {
    if args.iter().any(Option::is_none) {
        return true;
    }
    let Some(inner) = call_args_inner(source, span) else {
        return true;
    };
    if inner.is_empty() || inner == "{}" {
        return false;
    }
    matches!(
        args.first().and_then(|arg| arg.as_ref()),
        Some(Literal::Object(entries)) if entries.is_empty()
    )
}

fn pattern_call_has_unextractable_args(
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> bool {
    if args.iter().any(Option::is_none) {
        return true;
    }
    let Some(inner) = call_args_inner(source, span) else {
        return true;
    };
    if inner.is_empty() || inner == "{}" {
        return false;
    }
    !matches!(
        args.first().and_then(|arg| arg.as_ref()),
        Some(Literal::Object(_))
    )
}
