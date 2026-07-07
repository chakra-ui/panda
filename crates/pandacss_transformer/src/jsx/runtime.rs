//! React runtime call rewrites (`jsx`, `jsxs`, `createElement`, …).

use std::collections::HashSet;

use pandacss_extractor::{ExtractedJsx, Literal};
use pandacss_project::Project;

use super::conditional::{
    class_expression_for_runtime_props, dynamic_class_name_expression_should_skip,
    dynamic_style_expression_should_skip, jsx_data_has_finite_conditional,
    jsx_data_within_branch_budget,
};
use crate::helper::format_object_class_name;
use crate::plan::{HelperCxMode, Rewrite};
use crate::resolve::{is_static_style_literal, span_slice};

use super::parse::{
    ParsedObjectLiteral, ParsedProperty, parse_call_expression, parse_object_literal,
};
use super::shared::{plan_runtime_class_name, should_skip_style_prop};
use super::tag::resolve_element_tag;

pub(super) fn rewrites_for_jsx_runtime_call(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    needs_cx: &mut bool,
) -> Vec<Rewrite> {
    if runtime_call_should_skip(project, source, jsx) {
        return Vec::new();
    }

    let Some(slice) = span_slice(source, jsx.span) else {
        return Vec::new();
    };
    let Some(call) = parse_call_expression(slice) else {
        return Vec::new();
    };
    if call.args.len() < 2 {
        return Vec::new();
    }
    let Some(props) = parse_object_literal(&call.args[1]) else {
        return Vec::new();
    };
    let Some(tag) = resolve_element_tag(jsx, None, Some(&props.properties)) else {
        return Vec::new();
    };
    let Some(class_name) = plan_runtime_class_name(project, jsx, &props, &call.args[1], helper_cx)
    else {
        return Vec::new();
    };

    if class_name.needs_cx {
        *needs_cx = true;
    }

    let mut args = call.args.clone();
    args[0] = tag.runtime_first_arg();
    args[1] = format_props_object(project, jsx, &props, &class_name);

    let content = format!("{}({})", call.callee, args.join(", "));

    vec![Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content,
    }]
}

fn runtime_call_should_skip(project: &Project, source: &str, jsx: &ExtractedJsx) -> bool {
    let Some(slice) = span_slice(source, jsx.span) else {
        return true;
    };
    let Some(call) = parse_call_expression(slice) else {
        return true;
    };
    if call.args.len() < 2 {
        return true;
    }
    let Some(props) = parse_object_literal(&call.args[1]) else {
        return true;
    };

    if props.properties.iter().any(ParsedProperty::is_spread) {
        return true;
    }
    if props.has_unresolved_as_prop() {
        return true;
    }
    if !data_is_static(&jsx.data) {
        return true;
    }
    if jsx_data_has_finite_conditional(&jsx.data) {
        if !jsx_data_within_branch_budget(&jsx.data) {
            return true;
        }
        if class_expression_for_runtime_props(project, jsx, &call.args[1]).is_none() {
            return true;
        }
    }

    let tag_name = &jsx.name;
    let jsx_config = &project.config().extractor_config().jsx;
    let data_keys = style_prop_keys(&jsx.data);

    for prop in &props.properties {
        let Some(key) = prop.key.as_deref() else {
            continue;
        };
        if should_skip_style_prop(key) {
            continue;
        }
        if let Some(expr) = prop.expression_source() {
            if key == "className" && dynamic_class_name_expression_should_skip(&expr) {
                return true;
            }
            if jsx_config.should_extract_prop(tag_name, key)
                && dynamic_style_expression_should_skip(&expr)
            {
                return true;
            }
        }
        if !jsx_config.should_extract_prop(tag_name, key) {
            continue;
        }
        if data_keys.contains(key) {
            continue;
        }
        if prop.value_is_dynamic() {
            return true;
        }
    }

    false
}

fn format_props_object(
    project: &Project,
    jsx: &ExtractedJsx,
    parsed: &ParsedObjectLiteral,
    class_name: &crate::helper::ClassNamePrint,
) -> String {
    let jsx_config = &project.config().extractor_config().jsx;
    let tag_name = &jsx.name;
    let mut parts = Vec::new();

    for prop in &parsed.properties {
        let Some(key) = prop.key.as_deref() else {
            continue;
        };
        if key == "as" || key == "className" {
            continue;
        }
        if jsx_config.should_extract_prop(tag_name, key) {
            continue;
        }
        parts.push(prop.raw.clone());
    }

    parts.push(format_object_class_name(class_name));
    format!("{{ {} }}", parts.join(", "))
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
