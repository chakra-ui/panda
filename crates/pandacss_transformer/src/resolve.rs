//! Resolve static style literals to atomic class name strings.

use std::collections::HashSet;

use pandacss_encoder::{Atom, Encoder, compare_atoms_by_emit_order};
use pandacss_extractor::Literal;
use pandacss_project::Project;
use pandacss_utility::ShorthandPolicy;

use crate::css_conditional;
use crate::plan::Rewrite;

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

fn is_static_css_arg(arg: &Literal) -> bool {
    match arg {
        Literal::Object(entries) => entries.iter().all(|(_, value)| is_static_css_value(value)),
        Literal::Conditional(branches) => branches.iter().all(is_static_css_arg),
        Literal::Array(items) => items.iter().all(is_static_css_arg),
        _ => true,
    }
}

fn is_static_css_value(value: &Literal) -> bool {
    match value {
        Literal::Object(entries) => entries.iter().all(|(_, value)| is_static_css_value(value)),
        Literal::Conditional(branches) => branches.iter().all(is_static_css_value),
        Literal::Array(items) => items.iter().all(is_static_css_value),
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
) -> Option<Rewrite> {
    if css_call_has_unresolved_identifier_spread(source, span) {
        return None;
    }
    if css_conditional::args_need_conditional_rewrite(source, span, args) {
        let expression =
            css_conditional::class_expression_for_css_call(project, source, span, args)?;
        return Some(Rewrite {
            start: span.start,
            end: span.end,
            content: expression,
        });
    }
    let classes = classes_for_css_args(project, args)?;
    Some(rewrite_for_class_names(span, &classes))
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
) -> Option<Rewrite> {
    if pattern_call_has_unextractable_args(source, span, args) {
        return None;
    }
    let classes = project.class_names_for_pattern_call(pattern_name, args)?;
    Some(rewrite_for_class_names(span, &classes))
}

fn rewrite_for_class_names(span: pandacss_shared::Span, classes: &[String]) -> Rewrite {
    let class_string = classes.join(" ");
    Rewrite {
        start: span.start,
        end: span.end,
        content: format!("\"{class_string}\""),
    }
}

pub(crate) fn span_slice(source: &str, span: pandacss_shared::Span) -> Option<&str> {
    let start = usize::try_from(span.start).ok()?;
    let end = usize::try_from(span.end).ok()?;
    source.get(start..end)
}

pub(crate) fn call_is_raw_member(source: &str, span: pandacss_shared::Span) -> bool {
    span_slice(source, span).is_some_and(|slice| slice.contains(".raw("))
}

/// Byte span of the `index`th argument inside a call expression.
pub(crate) fn call_arg_span(
    source: &str,
    call_span: pandacss_shared::Span,
    index: usize,
) -> Option<(u32, u32)> {
    let slice = span_slice(source, call_span)?;
    let open_paren = slice.find('(')?;
    let args_start = open_paren + 1;
    let args_end = slice.rfind(')')?;
    let args = &slice[args_start..args_end];
    let (rel_start, rel_end) = arg_range_in_list(args, index)?;
    let base = call_span.start + u32::try_from(args_start).ok()?;
    Some((
        base + u32::try_from(rel_start).ok()?,
        base + u32::try_from(rel_end).ok()?,
    ))
}

fn arg_range_in_list(args: &str, target_index: usize) -> Option<(usize, usize)> {
    let bytes = args.as_bytes();
    let mut index = 0;
    let mut arg_index = 0;
    let mut arg_start: Option<usize> = None;
    let mut depth_paren = 0_i32;
    let mut depth_brace = 0_i32;
    let mut depth_bracket = 0_i32;
    let mut in_string: Option<u8> = None;

    while index < bytes.len() {
        let byte = bytes[index];

        if let Some(quote) = in_string {
            if byte == b'\\' {
                index = index.saturating_add(2);
                continue;
            }
            if byte == quote {
                in_string = None;
            }
            index += 1;
            continue;
        }

        if byte == b'\'' || byte == b'"' {
            in_string = Some(byte);
            arg_start.get_or_insert(index);
            index += 1;
            continue;
        }

        if depth_paren == 0 && depth_brace == 0 && depth_bracket == 0 && byte == b',' {
            if let Some(start) = arg_start {
                if arg_index == target_index {
                    return Some((start, trim_end_whitespace(args, index)));
                }
                arg_index += 1;
                arg_start = None;
            }
            index += 1;
            continue;
        }

        match byte {
            b'(' => depth_paren += 1,
            b')' => depth_paren -= 1,
            b'{' => depth_brace += 1,
            b'}' => depth_brace -= 1,
            b'[' => depth_bracket += 1,
            b']' => depth_bracket -= 1,
            _ => {}
        }

        if arg_start.is_none() && !byte.is_ascii_whitespace() {
            arg_start = Some(index);
        }
        index += 1;
    }

    arg_start.and_then(|start| {
        if arg_index == target_index {
            Some((start, trim_end_whitespace(args, bytes.len())))
        } else {
            None
        }
    })
}

fn trim_end_whitespace(input: &str, end: usize) -> usize {
    let mut end = end.min(input.len());
    while end > 0 && input.as_bytes()[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    end
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
