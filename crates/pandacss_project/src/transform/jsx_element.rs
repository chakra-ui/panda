//! JSX opening-element rewrites.

use std::fmt::Write as _;

use pandacss_extractor::{
    ExtractedJsx, JsxExtractionConfig, JsxKind, Literal, StyleObject, StyleSpread, StyleTree,
    project_literal,
};
use pandacss_shared::Span;

use crate::PatternTransformFn;
use crate::Project;

use super::helper::{self, CX_HELPER_LOCAL};
use super::jsx_parse::{
    ConditionalSpreadPlan, ParsedAttribute, ParsedOpeningElement, SpreadSyntax,
};
use super::jsx_shared::{
    ElementTag, SelectedSlots, plan_class_name, plan_slot_spreads, resolve_element_tag,
    select_slots, should_skip_style_prop, style_slots_should_skip,
};
use super::plan::{HelperCxMode, Rewrite, TransformHelperFacts};
use super::style_lower;

pub(super) fn rewrites_for_jsx_opening_element(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Vec<Rewrite> {
    let parsed =
        ParsedOpeningElement::from_ast(source, &jsx.attributes, jsx.closing_span.is_none());
    if let Some(rewrite) = partial_fold_rewrite(
        project,
        source,
        jsx,
        &parsed,
        helper_cx,
        pattern_transform.as_deref_mut(),
    ) {
        return vec![rewrite];
    }
    let Some(spread_plan) = plan_slot_spreads(
        project,
        source,
        jsx,
        &parsed.attributes,
        SpreadSyntax::JsxAttribute,
    ) else {
        return Vec::new();
    };
    if parsed.has_unresolved_as_prop()
        || style_slots_should_skip(
            project,
            source,
            jsx,
            &parsed.attributes,
            pattern_transform.as_deref_mut(),
        )
    {
        return Vec::new();
    }
    let class_attr = project.config().extractor_config().class_attribute;
    let Some(class_name) = plan_class_name(
        project,
        source,
        jsx,
        parsed.existing_class_name(class_attr),
        helper_cx,
        pattern_transform,
    ) else {
        return Vec::new();
    };
    let Some(tag) = resolve_element_tag(jsx, Some(&parsed.attributes), None) else {
        return Vec::new();
    };

    let runtime_spread = match &spread_plan {
        ConditionalSpreadPlan::Runtime(rewrite) => Some(rewrite),
        ConditionalSpreadPlan::StyleOnly => None,
    };
    let Some(selected) = select_slots(
        project,
        jsx,
        &parsed.attributes,
        &class_name,
        runtime_spread,
    ) else {
        return Vec::new();
    };
    let mut rewrites = vec![Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content: print_opening_element(&tag, &parsed, &selected, &class_name),
        preserved: selected.preserved,
        helper: TransformHelperFacts {
            needs_cx: class_name.needs_cx,
            ..TransformHelperFacts::none()
        },
    }];

    if let Some(closing) = closing_tag_rewrite(jsx, &tag) {
        rewrites.push(closing);
    }

    rewrites
}

/// Precompute the static half of a `styled.*` element that also carries an
/// opaque spread such as `{...props}`.
///
/// The factory and the spread stay, so style-prop splitting and DOM filtering
/// still happen at runtime for whatever the spread turns out to hold. Every
/// style source the transform *can* see collapses into one `className`, which
/// the factory then merges after the spread's own styles — the same precedence
/// JSX gives them today, since a later attribute overwrites a spread's key.
fn partial_fold_rewrite(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    parsed: &ParsedOpeningElement,
    helper_cx: HelperCxMode,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<Rewrite> {
    // The fold merges through `cx`; without it there is no sound way to keep
    // the spread's own `className`.
    if jsx.kind != JsxKind::Factory || helper_cx == HelperCxMode::False {
        return None;
    }
    let extractor = project.config().extractor_config();
    let class_attr = extractor.class_attribute;
    if parsed
        .attributes
        .iter()
        .any(|attr| attr.name.as_deref() == Some(class_attr))
    {
        return None;
    }

    let StyleTree::Object(object) = jsx.style.as_ref()? else {
        return None;
    };
    let [StyleSpread::Open { span: open_span }] = object.spreads.as_slice() else {
        return None;
    };
    let opaque = opaque_spread_binding(parsed, &extractor.jsx, &jsx.name, class_attr, *open_span)?;

    // Static entries only dominate the spread because they merge after it, so
    // there is nothing to precompute if the spread has no static half.
    let folded = StyleTree::Object(StyleObject {
        entries: object.entries.clone(),
        spreads: Vec::new(),
    });
    if object.entries.is_empty() || style_lower::style_tree_has_open_value(&folded) {
        return None;
    }

    let folded_jsx = ExtractedJsx {
        data: project_literal(&folded).unwrap_or_else(|| Literal::Object(Vec::new())),
        style: Some(folded.clone()),
        ..jsx.clone()
    };
    let class_name = plan_class_name(
        project,
        source,
        &folded_jsx,
        parsed.existing_class_name(class_attr),
        helper_cx,
        pattern_transform,
    )?;

    let tag = opening_tag_span(source, jsx.span)?;
    let mut out = String::from("<");
    out.push_str(super::resolve::span_slice(source, tag)?);
    let mut preserved = style_lower::preserved_source_spans(&folded);
    preserved.push(tag);

    for attr in &parsed.attributes {
        if attr.span != opaque.span
            && folds_into_class_name(attr, &extractor.jsx, &jsx.name, class_attr)
        {
            continue;
        }
        out.push(' ');
        out.push_str(&attr.raw);
        preserved.push(attr.span);
    }

    // `{...props}` with a nullish value is a legal no-op in JSX, so the class
    // read has to tolerate one.
    let _ = write!(
        out,
        " {class_attr}={{{CX_HELPER_LOCAL}({}, {}?.{class_attr})}}",
        class_name.expression, opaque.identifier
    );
    out.push_str(if parsed.self_closing { " />" } else { ">" });

    Some(Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content: out,
        preserved,
        helper: TransformHelperFacts::cx(),
    })
}

struct OpaqueSpread<'a> {
    span: Span,
    identifier: &'a str,
}

/// The source spread that produced `open_span`, when the fold can reason about
/// it: a bare identifier (so re-reading `.className` is free of side effects)
/// that no other style source precedes.
fn opaque_spread_binding<'a>(
    parsed: &'a ParsedOpeningElement,
    jsx_config: &JsxExtractionConfig,
    tag_name: &str,
    class_attr: &str,
    open_span: Span,
) -> Option<OpaqueSpread<'a>> {
    let mut opaque: Option<OpaqueSpread<'a>> = None;
    for attr in &parsed.attributes {
        let expression = attr.spread_expression.as_ref();
        if expression.is_some_and(|expression| expression.facts.span == open_span) {
            if opaque.is_some() {
                return None;
            }
            opaque = Some(OpaqueSpread {
                span: attr.span,
                identifier: expression?.facts.identifier.as_deref()?,
            });
            continue;
        }
        // A style source ahead of the spread would lose to it at runtime but
        // win in the precomputed class string.
        if opaque.is_none() && folds_into_class_name(attr, jsx_config, tag_name, class_attr) {
            return None;
        }
    }
    opaque
}

/// Whether the partial fold absorbs this attribute into the class name.
fn folds_into_class_name(
    attr: &ParsedAttribute,
    jsx_config: &JsxExtractionConfig,
    tag_name: &str,
    class_attr: &str,
) -> bool {
    if attr.is_spread() {
        return true;
    }
    let Some(name) = attr.name.as_deref() else {
        return false;
    };
    name != class_attr
        && !should_skip_style_prop(name)
        && jsx_config.should_extract_prop(tag_name, name)
}

/// Span of the tag name inside an opening element, e.g. `styled.button`.
fn opening_tag_span(source: &str, element: Span) -> Option<Span> {
    let start = element.start.checked_add(1)?;
    let bytes = source.as_bytes();
    let mut end = usize::try_from(start).ok()?;
    while bytes
        .get(end)
        .is_some_and(|byte| !matches!(byte, b' ' | b'\t' | b'\n' | b'\r' | b'/' | b'>'))
    {
        end += 1;
    }
    let end = u32::try_from(end).ok()?;
    (end > start).then_some(Span { start, end })
}

/// `<tag …attrs className=…>` — the JSX spelling of the selected slots.
fn print_opening_element(
    tag: &ElementTag,
    parsed: &ParsedOpeningElement,
    selected: &SelectedSlots,
    class_name: &helper::ClassNamePrint,
) -> String {
    let mut out = String::from("<");
    out.push_str(tag.opening_name());
    for part in &selected.parts {
        out.push(' ');
        out.push_str(part);
    }
    if !selected.embedded_class {
        out.push(' ');
        out.push_str(&class_name.attribute);
    }
    out.push_str(if parsed.self_closing { " />" } else { ">" });
    out
}

fn closing_tag_rewrite(jsx: &ExtractedJsx, tag: &ElementTag) -> Option<Rewrite> {
    let closing = jsx.closing_span?;
    Some(Rewrite {
        start: closing.start,
        end: closing.end,
        content: format!("</{}>", tag.opening_name()),
        preserved: Vec::new(),
        helper: TransformHelperFacts::none(),
    })
}
