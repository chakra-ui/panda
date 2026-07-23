//! JSX opening-element rewrites.

use pandacss_extractor::{ExtractedJsx, StyleTree};

use crate::PatternTransformFn;
use crate::Project;

use super::helper;
use super::jsx_parse::{
    ConditionalSpreadPlan, ConditionalSpreadRewrite, ParsedOpeningElement, SpreadSyntax,
    plan_conditional_spreads,
};
use super::jsx_shared::{
    ElementTag, data_is_static, plan_opening_class_name, resolve_element_tag,
    should_skip_style_prop, style_prop_keys,
};
use super::jsx_skip::{
    dynamic_class_name_expression_should_skip, dynamic_style_expression_should_skip,
};
use super::plan::{HelperCxMode, Rewrite};
use super::style_lower::{self, LowerResult};

pub(super) fn rewrites_for_jsx_opening_element(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    needs_cx: &mut bool,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Vec<Rewrite> {
    let parsed =
        ParsedOpeningElement::from_ast(source, &jsx.attributes, jsx.closing_span.is_none());
    let Some(spread_plan) = opening_spread_plan(project, source, jsx, &parsed) else {
        return Vec::new();
    };
    if opening_element_should_skip(
        project,
        source,
        jsx,
        &parsed,
        pattern_transform.as_deref_mut(),
    ) {
        return Vec::new();
    }
    let Some(class_name) =
        plan_opening_class_name(project, source, jsx, &parsed, helper_cx, pattern_transform)
    else {
        return Vec::new();
    };
    let Some(tag) = resolve_element_tag(jsx, Some(&parsed.attributes), None) else {
        return Vec::new();
    };

    let runtime_spread = match &spread_plan {
        ConditionalSpreadPlan::Runtime(rewrite) => Some(rewrite),
        ConditionalSpreadPlan::None | ConditionalSpreadPlan::StyleOnly => None,
    };
    let Some((content, preserved)) =
        format_opening_element(project, jsx, &tag, &parsed, &class_name, runtime_spread)
    else {
        return Vec::new();
    };
    if class_name.needs_cx {
        *needs_cx = true;
    }
    let mut rewrites = vec![Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content,
        preserved,
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
    parsed: &ParsedOpeningElement,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> bool {
    if parsed.has_unresolved_as_prop() {
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

    for attr in &parsed.attributes {
        let Some(name) = attr.name.as_deref() else {
            continue;
        };
        if should_skip_style_prop(name) {
            continue;
        }
        if let Some(expression) = attr.expression_facts() {
            if name == class_attr && dynamic_class_name_expression_should_skip(expression) {
                return true;
            }
            if jsx_config.should_extract_prop(tag_name, name)
                && dynamic_style_expression_should_skip(expression)
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

/// Plans conditional JSX spread rewrites. Returns `None` when the original
/// element must stay unchanged.
fn opening_spread_plan(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    parsed: &ParsedOpeningElement,
) -> Option<ConditionalSpreadPlan> {
    let extractor = project.config().extractor_config();
    let plan = plan_conditional_spreads(
        source,
        parsed
            .attributes
            .iter()
            .filter(|attribute| attribute.is_spread())
            .filter_map(|attribute| attribute.spread_expression.as_ref()),
        jsx.style.as_ref(),
        SpreadSyntax::JsxAttribute,
        &extractor.jsx,
        &jsx.name,
        extractor.class_attribute,
    )?;
    if matches!(plan, ConditionalSpreadPlan::Runtime(_))
        && !parsed
            .attributes
            .iter()
            .all(|attribute| attribute.name.as_deref() != Some(extractor.class_attribute))
    {
        return None;
    }
    Some(plan)
}

fn format_opening_element(
    project: &Project,
    jsx: &ExtractedJsx,
    tag: &ElementTag,
    parsed: &ParsedOpeningElement,
    class_name: &helper::ClassNamePrint,
    runtime_spread: Option<&ConditionalSpreadRewrite>,
) -> Option<(String, Vec<pandacss_shared::Span>)> {
    let extractor_config = project.config().extractor_config();
    let jsx_config = &extractor_config.jsx;
    let class_attr = extractor_config.class_attribute;
    let tag_name = &jsx.name;
    let mut out = String::new();
    let mut preserved = jsx
        .style
        .as_ref()
        .map(style_lower::preserved_source_spans)
        .unwrap_or_default();
    let mut embedded_class = false;
    out.push('<');
    out.push_str(tag.opening_name());

    for attr in &parsed.attributes {
        if attr.is_spread() {
            if let Some(rewrite) = runtime_spread {
                let rewritten = rewrite.embed_class(class_attr, class_name)?;
                out.push(' ');
                out.push_str(&rewritten);
                embedded_class = true;
                preserved.push(attr.span);
            }
            continue;
        }
        let Some(name) = attr.name.as_deref() else {
            continue;
        };
        if name == "as" || name == class_attr {
            if attr.expression.is_some() {
                preserved.push(attr.span);
            }
            continue;
        }
        if should_skip_style_prop(name) {
            out.push(' ');
            out.push_str(&attr.raw);
            preserved.push(attr.span);
            continue;
        }
        if jsx_config.should_extract_prop(tag_name, name) {
            continue;
        }
        out.push(' ');
        out.push_str(&attr.raw);
        preserved.push(attr.span);
    }

    if !embedded_class {
        out.push(' ');
        out.push_str(&class_name.attribute);
    }

    if parsed.self_closing {
        out.push_str(" />");
    } else {
        out.push('>');
    }

    Some((out, preserved))
}

fn closing_tag_rewrite(jsx: &ExtractedJsx, tag: &ElementTag) -> Option<Rewrite> {
    let closing = jsx.closing_span?;
    Some(Rewrite {
        start: closing.start,
        end: closing.end,
        content: format!("</{}>", tag.opening_name()),
        preserved: Vec::new(),
    })
}
