//! JSX opening-element rewrites.

use std::collections::HashSet;

use pandacss_extractor::{ExtractedJsx, Literal};
use pandacss_project::Project;

use super::conditional::{
    class_expression_for_jsx_data, dynamic_class_name_expression_should_skip,
    dynamic_style_expression_should_skip, jsx_data_has_finite_conditional,
    jsx_data_within_branch_budget,
};
use crate::plan::{HelperCxMode, Rewrite};
use crate::resolve::{is_static_style_literal, span_slice};

use super::parse::{ParsedAttribute, ParsedOpeningElement, parse_opening_element};
use super::shared::{plan_opening_class_name, should_skip_style_prop};
use super::tag::{ElementTag, resolve_element_tag};

pub(super) fn rewrites_for_jsx_opening_element(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    needs_cx: &mut bool,
) -> Vec<Rewrite> {
    if opening_element_should_skip(project, source, jsx) {
        return Vec::new();
    }

    let Some(slice) = span_slice(source, jsx.span) else {
        return Vec::new();
    };
    let Some(parsed) = parse_opening_element(slice) else {
        return Vec::new();
    };
    let Some(class_name) = plan_opening_class_name(project, jsx, &parsed, helper_cx) else {
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

    if !parsed.self_closing
        && let Some(closing) = closing_tag_rewrite(source, jsx, &tag, jsx.span.end)
    {
        rewrites.push(closing);
    }

    rewrites
}

fn opening_element_should_skip(project: &Project, source: &str, jsx: &ExtractedJsx) -> bool {
    let Some(slice) = span_slice(source, jsx.span) else {
        return true;
    };
    let Some(parsed) = parse_opening_element(slice) else {
        return true;
    };

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
        if class_expression_for_jsx_data(project, jsx, &parsed).is_none() {
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
    class_name: &crate::helper::ClassNamePrint,
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

fn closing_tag_rewrite(
    source: &str,
    jsx: &ExtractedJsx,
    tag: &ElementTag,
    opening_end: u32,
) -> Option<Rewrite> {
    let needle = format!("</{}>", jsx.name);
    let start = usize::try_from(opening_end).ok()?;
    let rest = source.get(start..)?;
    let offset = rest.find(needle.as_str())?;
    let start = start + offset;
    let end = start + needle.len();
    Some(Rewrite {
        start: u32::try_from(start).ok()?,
        end: u32::try_from(end).ok()?,
        content: format!("</{}>", tag.opening_name()),
    })
}

fn data_is_static(data: &Literal) -> bool {
    match data {
        Literal::Object(entries) if entries.is_empty() => true,
        other => is_static_style_literal(other),
    }
}

fn style_prop_keys(data: &Literal) -> HashSet<&str> {
    let mut keys = HashSet::new();
    if let Literal::Object(entries) = data {
        for (key, _) in entries {
            keys.insert(key.as_str());
        }
    }
    keys
}
