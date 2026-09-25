use pandacss_encoder::ConditionMatcher;
use pandacss_extractor::{ExtractedCall, ExtractedJsx, LineIndex, MatchCategory, Span};
use pandacss_literal::Literal;
use pandacss_shared::{Diagnostic, diagnostic_codes};
use pandacss_utility::Utility;
use rustc_hash::FxHashSet;

use crate::ProjectConditionMatcher;

fn push_usage_diagnostics(
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    line_index: &LineIndex<'_>,
    out: &mut Vec<Diagnostic>,
    mut collect: impl FnMut(&Literal, &mut Vec<String>),
    mut build: impl FnMut(&str, Span, &LineIndex<'_>) -> Diagnostic,
) {
    let mut seen = Vec::new();
    for call in calls {
        seen.clear();
        for literal in call.data.iter().flatten() {
            collect(literal, &mut seen);
        }
        for item in seen.drain(..) {
            out.push(build(&item, call.span, line_index));
        }
    }
    for entry in jsx {
        seen.clear();
        collect(&entry.data, &mut seen);
        for item in seen.drain(..) {
            out.push(build(&item, entry.span, line_index));
        }
    }
}

pub(super) fn push_deprecated_utility_diagnostics(
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    utility: &Utility,
    line_index: &LineIndex<'_>,
    out: &mut Vec<Diagnostic>,
) {
    let deprecated = utility.deprecated_props();
    push_usage_diagnostics(
        calls,
        jsx,
        line_index,
        out,
        |literal, seen| collect_deprecated_props(literal, utility, deprecated, seen),
        deprecated_utility_diagnostic,
    );
}

fn collect_deprecated_props(
    value: &Literal,
    utility: &Utility,
    deprecated: &FxHashSet<String>,
    out: &mut Vec<String>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, child) in entries {
                let canonical = utility.resolve_shorthand(key);
                if deprecated.contains(canonical) && !out.iter().any(|seen| seen == canonical) {
                    out.push(canonical.to_owned());
                }
                collect_deprecated_props(child, utility, deprecated, out);
            }
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_deprecated_props(item, utility, deprecated, out);
            }
        }
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null => {}
    }
}

fn deprecated_utility_diagnostic(prop: &str, span: Span, line_index: &LineIndex<'_>) -> Diagnostic {
    located_warning(
        diagnostic_codes::DEPRECATED_UTILITY_USED,
        format!("utility \"{prop}\" is deprecated"),
        span,
        line_index,
    )
}

pub(super) fn push_unknown_condition_diagnostics(
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    conditions: &ProjectConditionMatcher,
    line_index: &LineIndex<'_>,
    out: &mut Vec<Diagnostic>,
) {
    push_usage_diagnostics(
        calls,
        jsx,
        line_index,
        out,
        |literal, seen| collect_unknown_conditions(literal, conditions, seen),
        |key, span, index| unknown_condition_diagnostic(key, conditions, span, index),
    );
}

fn collect_unknown_conditions(
    value: &Literal,
    conditions: &ProjectConditionMatcher,
    out: &mut Vec<String>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, child) in entries {
                if key.starts_with('_')
                    && !conditions.is_condition(key)
                    && !out.iter().any(|seen| seen == key)
                {
                    out.push(key.clone());
                }
                collect_unknown_conditions(child, conditions, out);
            }
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_unknown_conditions(item, conditions, out);
            }
        }
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null => {}
    }
}

fn unknown_condition_diagnostic(
    key: &str,
    conditions: &ProjectConditionMatcher,
    span: Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    let suggestion = pandacss_shared::closest_match(
        key,
        conditions.names().filter(|name| name.starts_with('_')),
    )
    .map(|name| format!(", did you mean `{name}`?"))
    .unwrap_or_default();
    located_warning(
        diagnostic_codes::UNKNOWN_CONDITION,
        format!("unknown condition `{key}`{suggestion}"),
        span,
        line_index,
    )
}

pub(super) fn push_invalid_color_opacity_modifier_diagnostics(
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    utility: &Utility,
    line_index: &LineIndex<'_>,
    out: &mut Vec<Diagnostic>,
) {
    push_usage_diagnostics(
        calls,
        jsx,
        line_index,
        out,
        |literal, seen| collect_invalid_color_opacity_modifiers(literal, utility, seen),
        invalid_color_opacity_modifier_diagnostic,
    );
}

fn collect_invalid_color_opacity_modifiers(
    value: &Literal,
    utility: &Utility,
    out: &mut Vec<String>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, child) in entries {
                let canonical = utility.resolve_shorthand(key);
                if utility.token_category(canonical) == Some("colors")
                    && let Literal::String(value) | Literal::Token { value, .. } = child
                    && utility.is_invalid_color_opacity_modifier(value)
                    && !out.contains(value)
                {
                    out.push(value.clone());
                }
                collect_invalid_color_opacity_modifiers(child, utility, out);
            }
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_invalid_color_opacity_modifiers(item, utility, out);
            }
        }
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null => {}
    }
}

fn invalid_color_opacity_modifier_diagnostic(
    value: &str,
    span: Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    located_warning(
        diagnostic_codes::INVALID_COLOR_OPACITY_MODIFIER,
        format!(
            "Color value `{value}` has an invalid opacity modifier; expected a number (e.g. `40`) or an opacity token (e.g. `half`)"
        ),
        span,
        line_index,
    )
}

pub(super) fn dynamic_style_value_diagnostic(
    category: MatchCategory,
    name: &str,
    span: Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    located_warning(
        diagnostic_codes::PANDA_CALL_UNEXTRACTABLE,
        format!(
            "{category:?} call `{name}` received a dynamic argument, so no static CSS was generated for this call"
        ),
        span,
        line_index,
    )
}

fn located_warning(
    code: impl Into<String>,
    message: String,
    span: Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    let mut diagnostic = Diagnostic::warning(code, message);
    diagnostic.span = Some(span);
    diagnostic.location = Some(line_index.locate_range(span.start, span.end));
    diagnostic
}
