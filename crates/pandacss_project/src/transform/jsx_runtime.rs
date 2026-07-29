//! React runtime call rewrites (`jsx`, `jsxs`, `createElement`, …).

use pandacss_extractor::{ExtractedJsx, StyleTree};

use crate::PatternTransformFn;
use crate::Project;

use super::helper;
use super::helper::format_object_class_name;
use super::jsx_parse::{
    ConditionalSpreadPlan, ConditionalSpreadRewrite, ParsedObjectLiteral, SpreadSyntax,
    parsed_object_from_facts, plan_conditional_spreads,
};
use super::jsx_shared::{
    data_is_static, plan_runtime_class_name, resolve_element_tag, should_skip_style_prop,
    style_prop_keys,
};
use super::jsx_skip::{
    dynamic_class_name_expression_should_skip, dynamic_style_expression_should_skip,
};
use super::plan::{HelperCxMode, Rewrite};
use super::resolve::span_slice;
use super::style_lower::{self, LowerResult};

pub(super) fn rewrites_for_jsx_runtime_call(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    needs_cx: &mut bool,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Vec<Rewrite> {
    let Some(callee_span) = jsx.source.callee_span else {
        return Vec::new();
    };
    let Some(callee) = span_slice(source, callee_span) else {
        return Vec::new();
    };
    if jsx.source.args.len() < 2 {
        return Vec::new();
    }
    let Some(props_facts) = jsx.source.args[1].object.as_ref() else {
        return Vec::new();
    };
    let Some(props) = parsed_object_from_facts(source, props_facts) else {
        return Vec::new();
    };
    let Some(spread_plan) = runtime_spread_plan(project, source, jsx, &props) else {
        return Vec::new();
    };
    if runtime_call_should_skip(
        project,
        source,
        jsx,
        &props,
        pattern_transform.as_deref_mut(),
    ) {
        return Vec::new();
    }
    let Some(tag) = resolve_element_tag(jsx, None, Some(&props.properties)) else {
        return Vec::new();
    };
    let Some(class_name) =
        plan_runtime_class_name(project, source, jsx, &props, helper_cx, pattern_transform)
    else {
        return Vec::new();
    };

    let mut args = jsx
        .source
        .args
        .iter()
        .filter_map(|argument| span_slice(source, argument.span).map(str::to_owned))
        .collect::<Vec<_>>();
    if args.len() != jsx.source.args.len() {
        return Vec::new();
    }
    args[0] = tag.runtime_first_arg();
    let runtime_spread = match &spread_plan {
        ConditionalSpreadPlan::Runtime(rewrite) => Some(rewrite),
        ConditionalSpreadPlan::None | ConditionalSpreadPlan::StyleOnly => None,
    };
    let Some((formatted_props, mut preserved)) =
        format_props_object(project, jsx, &props, &class_name, runtime_spread)
    else {
        return Vec::new();
    };
    args[1] = formatted_props;
    preserved.push(callee_span);
    preserved.extend(jsx.source.args.iter().skip(2).map(|argument| argument.span));
    if class_name.needs_cx {
        *needs_cx = true;
    }

    let content = format!("{callee}({})", args.join(", "));

    vec![Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content,
        preserved,
    }]
}

fn runtime_call_should_skip(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    props: &ParsedObjectLiteral,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> bool {
    if props.has_unresolved_as_prop() {
        return true;
    }
    if let Some(tree) = jsx.style.as_ref() {
        if style_lower::style_tree_has_rewrite_sites(tree) {
            match style_lower::lower_style_tree(project, source, tree, Some(jsx), pattern_transform)
            {
                LowerResult::Bail => return true,
                LowerResult::Static(_) | LowerResult::Expr(_) => {}
            }
        } else if style_lower::style_tree_has_open_spread(tree)
            || (!data_is_static(&jsx.data) && !matches!(tree, StyleTree::Object(_)))
        {
            return true;
        }
    } else if !data_is_static(&jsx.data) {
        return true;
    }

    let tag_name = &jsx.name;
    let extractor_config = project.config().extractor_config();
    let jsx_config = &extractor_config.jsx;
    let class_attr = extractor_config.class_attribute;
    let data_keys = style_prop_keys(&jsx.data);

    for prop in &props.properties {
        if prop.is_spread() {
            continue;
        }
        let Some(key) = prop.key.as_deref() else {
            return true;
        };
        if should_skip_style_prop(key) {
            continue;
        }
        if let Some(expression) = prop.expression_facts() {
            if key == class_attr && dynamic_class_name_expression_should_skip(expression) {
                return true;
            }
            if jsx_config.should_extract_prop(tag_name, key)
                && dynamic_style_expression_should_skip(expression)
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

fn runtime_spread_plan(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    parsed: &ParsedObjectLiteral,
) -> Option<ConditionalSpreadPlan> {
    let extractor = project.config().extractor_config();
    let plan = plan_conditional_spreads(
        source,
        parsed
            .properties
            .iter()
            .filter(|property| property.is_spread())
            .filter_map(|property| property.spread_expression.as_ref()),
        jsx.style.as_ref(),
        SpreadSyntax::ObjectProperty,
        &extractor.jsx,
        &jsx.name,
        extractor.class_attribute,
    )?;
    if matches!(plan, ConditionalSpreadPlan::Runtime(_))
        && !parsed
            .properties
            .iter()
            .all(|property| property.key.as_deref() != Some(extractor.class_attribute))
    {
        return None;
    }
    Some(plan)
}

fn format_props_object(
    project: &Project,
    jsx: &ExtractedJsx,
    parsed: &ParsedObjectLiteral,
    class_name: &helper::ClassNamePrint,
    runtime_spread: Option<&ConditionalSpreadRewrite>,
) -> Option<(String, Vec<pandacss_shared::Span>)> {
    let extractor_config = project.config().extractor_config();
    let jsx_config = &extractor_config.jsx;
    let class_attr = extractor_config.class_attribute;
    let tag_name = &jsx.name;
    let mut parts = Vec::new();
    let mut preserved = jsx
        .style
        .as_ref()
        .map(style_lower::preserved_source_spans)
        .unwrap_or_default();
    let mut embedded_class = false;

    for prop in &parsed.properties {
        if prop.is_spread() {
            if let Some(rewrite) = runtime_spread {
                let rewritten = rewrite.embed_class(class_attr, class_name)?;
                parts.push(rewritten);
                embedded_class = true;
                preserved.push(prop.span);
            }
            continue;
        }
        let key = prop.key.as_deref()?;
        if key == "as" || key == class_attr {
            if prop.value.is_some() {
                preserved.push(prop.span);
            }
            continue;
        }
        if should_skip_style_prop(key) {
            parts.push(prop.raw.clone());
            preserved.push(prop.span);
            continue;
        }
        if jsx_config.should_extract_prop(tag_name, key) {
            continue;
        }
        parts.push(prop.raw.clone());
        preserved.push(prop.span);
    }

    if !embedded_class {
        parts.push(format_object_class_name(class_attr, class_name));
    }
    Some((format!("{{ {} }}", parts.join(", ")), preserved))
}
