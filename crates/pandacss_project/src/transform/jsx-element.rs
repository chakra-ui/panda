//! JSX opening-element rewrites.

use pandacss_extractor::ExtractedJsx;

use crate::PatternTransformFn;
use crate::Project;

use super::helper;
use super::jsx_conditional::{
    class_expression_for_jsx_data, dynamic_class_name_expression_should_skip,
    dynamic_style_expression_should_skip, jsx_data_has_finite_conditional,
    jsx_data_within_branch_budget,
};
use super::jsx_parse::{ParsedAttribute, ParsedOpeningElement};
use super::jsx_shared::{
    ElementTag, data_is_static, plan_opening_class_name, resolve_element_tag,
    should_skip_style_prop, style_prop_keys,
};
use super::plan::{HelperCxMode, Rewrite};

pub(super) fn rewrites_for_jsx_opening_element(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    needs_cx: &mut bool,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Vec<Rewrite> {
    if opening_element_should_skip(project, source, jsx, pattern_transform.as_deref_mut()) {
        return Vec::new();
    }

    let parsed =
        ParsedOpeningElement::from_ast(source, &jsx.attributes, jsx.closing_span.is_none());
    let Some(class_name) =
        plan_opening_class_name(project, jsx, &parsed, helper_cx, pattern_transform)
    else {
        return Vec::new();
    };
    let Some(tag) = resolve_element_tag(jsx, Some(&parsed.attributes), None) else {
        return Vec::new();
    };

    if class_name.needs_cx {
        *needs_cx = true;
    }

    let mut rewrites = vec![Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content: format_opening_element(project, jsx, &tag, &parsed, &class_name),
    }];

    if let Some(closing) = closing_tag_rewrite(jsx, &tag) {
        rewrites.push(closing);
    }

    rewrites
}

fn opening_element_should_skip(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> bool {
    let parsed =
        ParsedOpeningElement::from_ast(source, &jsx.attributes, jsx.closing_span.is_none());

    if parsed.attributes.iter().any(ParsedAttribute::is_spread) {
        return true;
    }
    if parsed.has_unresolved_as_prop() {
        return true;
    }
    if !data_is_static(&jsx.data) {
        return true;
    }
    if jsx_data_has_finite_conditional(&jsx.data) {
        if !jsx_data_within_branch_budget(&jsx.data) {
            return true;
        }
        if class_expression_for_jsx_data(project, jsx, &parsed, pattern_transform).is_none() {
            return true;
        }
    }

    let tag_name = &jsx.name;
    let jsx_config = &project.config().extractor_config().jsx;
    let data_keys = style_prop_keys(&jsx.data);

    for attr in &parsed.attributes {
        let Some(name) = attr.name.as_deref() else {
            continue;
        };
        if should_skip_style_prop(name) {
            continue;
        }
        if let Some(expr) = attr.expression_source() {
            if name == "className" && dynamic_class_name_expression_should_skip(&expr) {
                return true;
            }
            if jsx_config.should_extract_prop(tag_name, name)
                && dynamic_style_expression_should_skip(&expr)
            {
                return true;
            }
        }
        if !jsx_config.should_extract_prop(tag_name, name) {
            continue;
        }
        if data_keys.contains(name) {
            continue;
        }
        if attr.is_dynamic() {
            return true;
        }
    }

    false
}

fn format_opening_element(
    project: &Project,
    jsx: &ExtractedJsx,
    tag: &ElementTag,
    parsed: &ParsedOpeningElement,
    class_name: &helper::ClassNamePrint,
) -> String {
    let jsx_config = &project.config().extractor_config().jsx;
    let tag_name = &jsx.name;
    let mut out = String::new();
    out.push('<');
    out.push_str(tag.opening_name());

    for attr in &parsed.attributes {
        let Some(name) = attr.name.as_deref() else {
            continue;
        };
        if name == "as" || name == "className" || should_skip_style_prop(name) {
            continue;
        }
        if jsx_config.should_extract_prop(tag_name, name) {
            continue;
        }
        out.push(' ');
        out.push_str(&attr.raw);
    }

    out.push(' ');
    out.push_str(&class_name.attribute);

    if parsed.self_closing {
        out.push_str(" />");
    } else {
        out.push('>');
    }

    out
}

fn closing_tag_rewrite(jsx: &ExtractedJsx, tag: &ElementTag) -> Option<Rewrite> {
    let closing = jsx.closing_span?;
    Some(Rewrite {
        start: closing.start,
        end: closing.end,
        content: format!("</{}>", tag.opening_name()),
    })
}
