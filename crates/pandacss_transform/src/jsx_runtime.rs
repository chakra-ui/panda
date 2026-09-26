//! React runtime call rewrites (`jsx`, `jsxs`, `createElement`, …).

use pandacss_extractor::{ExtractedJsx, JsxKind, StyleObject, StyleTree, project_literal};
use pandacss_literal::Literal;

use pandacss_project::Config;
use pandacss_project::PatternTransformFn;

use super::helper::format_object_class_name;
use super::jsx_parse::{
    ConditionalSpreadPlan, ParsedObjectLiteral, ParsedProperty, SpreadSyntax,
    parsed_object_from_facts,
};
use super::jsx_shared::{
    SelectedSlots, plan_class_name, plan_slot_spreads, resolve_element_tag, select_slots,
    style_slots_should_skip,
};
use super::plan::{HelperCxMode, Rewrite, TransformHelperFacts};
use super::resolve::span_slice;
use super::style_lower;

pub(super) fn rewrites_for_jsx_runtime_call(
    config: &Config,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
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
    if jsx.kind == JsxKind::Recipe {
        return recipe_style_prop_rewrite(
            config,
            source,
            jsx,
            callee,
            &props,
            helper_cx,
            pattern_transform,
        )
        .map_or_else(Vec::new, |rewrite| vec![rewrite]);
    }
    let Some(spread_plan) = plan_slot_spreads(
        config,
        source,
        jsx,
        &props.properties,
        SpreadSyntax::ObjectProperty,
    ) else {
        return Vec::new();
    };
    if props.has_unresolved_as_prop()
        || style_slots_should_skip(
            config,
            source,
            jsx,
            &props.properties,
            pattern_transform.as_deref_mut(),
        )
    {
        return Vec::new();
    }
    let Some(tag) = resolve_element_tag(jsx, None, Some(&props.properties)) else {
        return Vec::new();
    };
    let Some(class_name) = plan_class_name(
        config,
        source,
        jsx,
        props.existing_class_name(config.extractor_config().class_attribute),
        helper_cx,
        pattern_transform,
    ) else {
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
        ConditionalSpreadPlan::StyleOnly => None,
    };
    let Some(selected) = select_slots(config, jsx, &props.properties, &class_name, runtime_spread)
    else {
        return Vec::new();
    };
    args[1] = print_props_object(config, &selected, &class_name);
    let mut preserved = selected.preserved;
    preserved.push(callee_span);
    preserved.extend(jsx.source.args.iter().skip(2).map(|argument| argument.span));
    let content = format!("{callee}({})", args.join(", "));

    vec![Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content,
        preserved,
        helper: TransformHelperFacts {
            needs_cx: class_name.needs_cx,
            ..TransformHelperFacts::none()
        },
    }]
}

/// The object spelling of `jsx_element::recipe_style_prop_rewrite`.
fn recipe_style_prop_rewrite(
    config: &Config,
    source: &str,
    jsx: &ExtractedJsx,
    callee: &str,
    props: &ParsedObjectLiteral,
    helper_cx: HelperCxMode,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<Rewrite> {
    if props
        .properties
        .iter()
        .any(|prop: &ParsedProperty| prop.spread_expression.is_some() || prop.key.is_none())
    {
        return None;
    }
    let extractor = config.extractor_config();
    let class_attr = extractor.class_attribute;
    let variant_props = config.jsx_recipe_variant_props(&jsx.name);

    let folds = |prop: &ParsedProperty| {
        prop.key.as_deref().is_some_and(|key| {
            !variant_props.contains(key)
                && key != class_attr
                && !super::jsx_shared::should_skip_style_prop(key)
                && extractor.jsx.should_extract_prop(&jsx.name, key)
        })
    };
    if !props.properties.iter().any(folds) {
        return None;
    }

    let StyleTree::Object(object) = jsx.style.as_ref()? else {
        return None;
    };
    let style_only = StyleTree::Object(StyleObject {
        entries: object
            .entries
            .iter()
            .filter(|(key, _)| !variant_props.contains(key.as_str()))
            .cloned()
            .collect(),
        spreads: Vec::new(),
    });
    if style_lower::style_tree_has_open_value(&style_only) {
        return None;
    }

    let style_jsx = ExtractedJsx {
        kind: JsxKind::Component,
        data: project_literal(&style_only).unwrap_or_else(|| Literal::Object(Vec::new())),
        style: Some(style_only.clone()),
        ..jsx.clone()
    };
    let class_name = plan_class_name(
        config,
        source,
        &style_jsx,
        props.existing_class_name(class_attr),
        helper_cx,
        pattern_transform,
    )?;

    let mut args = jsx
        .source
        .args
        .iter()
        .filter_map(|argument| span_slice(source, argument.span).map(str::to_owned))
        .collect::<Vec<_>>();
    if args.len() != jsx.source.args.len() {
        return None;
    }

    let mut parts: Vec<String> = props
        .properties
        .iter()
        .filter(|prop| !folds(prop) && prop.key.as_deref() != Some(class_attr))
        .map(|prop| prop.raw.clone())
        .collect();
    parts.push(format_object_class_name(class_attr, &class_name));
    args[1] = format!("{{ {} }}", parts.join(", "));

    let mut preserved = style_lower::preserved_source_spans(&style_only);
    preserved.push(jsx.source.callee_span?);
    // The component argument stays, so its binding is live.
    preserved.push(jsx.source.args.first()?.span);
    preserved.extend(
        props
            .properties
            .iter()
            .filter(|prop| !folds(prop))
            .map(|prop| prop.span),
    );
    preserved.extend(jsx.source.args.iter().skip(2).map(|argument| argument.span));

    Some(Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content: format!("{callee}({})", args.join(", ")),
        preserved,
        helper: TransformHelperFacts {
            needs_cx: class_name.needs_cx,
            ..TransformHelperFacts::none()
        },
    })
}

/// `{ …props, className: … }` — the object spelling of the selected slots.
fn print_props_object(
    config: &Config,
    selected: &SelectedSlots,
    class_name: &super::helper::ClassNamePrint,
) -> String {
    let class_attr = config.extractor_config().class_attribute;
    let mut parts = selected.parts.clone();
    if !selected.embedded_class {
        parts.push(format_object_class_name(class_attr, class_name));
    }
    format!("{{ {} }}", parts.join(", "))
}
