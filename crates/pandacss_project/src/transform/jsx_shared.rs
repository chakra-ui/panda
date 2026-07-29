//! Shared JSX rewrite helpers (including element-tag resolution).

use std::collections::HashSet;

use pandacss_extractor::{ExtractedJsx, JsxKind, Literal, StyleTree};

use crate::PatternTransformFn;
use crate::Project;

use super::helper::{
    ClassNamePrint, ExistingClassName, merge_class_name_fragments, merge_class_name_with_expression,
};
use super::jsx_parse::{
    ConditionalSpreadPlan, ConditionalSpreadRewrite, ParsedAttribute, ParsedProperty, SlotName,
    SpreadSyntax, StyleSlot, plan_conditional_spreads,
};
use super::jsx_skip::{
    dynamic_class_name_expression_should_skip, dynamic_style_expression_should_skip,
};
use super::plan::HelperCxMode;
use super::resolve::is_static_style_literal;
use super::style_lower::{self, ClassExpr};

pub(super) fn should_skip_style_prop(key: &str) -> bool {
    matches!(key, "children" | "key" | "ref")
}

/// Whether a JSX site's extracted `data` is static enough to rewrite: empty,
/// or free of dynamic/conditional values.
pub(super) fn data_is_static(data: &Literal) -> bool {
    match data {
        Literal::Object(entries) if entries.is_empty() => true,
        other => is_static_style_literal(other),
    }
}

/// Top-level keys of a JSX site's extracted `data` object, for skipping props
/// already captured there.
pub(super) fn style_prop_keys(data: &Literal) -> HashSet<&str> {
    let mut keys = HashSet::new();
    if let Literal::Object(entries) = data {
        for (key, _) in entries {
            keys.insert(key.as_str());
        }
    }
    keys
}

/// Merges the site's lowered classes into whatever class value the source
/// already carried. `existing` is the only thing the two JSX syntaxes disagree
/// on, so both go through here.
pub(super) fn plan_class_name(
    project: &Project,
    file_source: &str,
    jsx: &ExtractedJsx,
    existing: ExistingClassName<'_>,
    helper_cx: HelperCxMode,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassNamePrint> {
    let class_attr = project.config().extractor_config().class_attribute;
    let lowered = match jsx.style.as_ref() {
        Some(tree) if style_lower::style_tree_has_rewrite_sites(tree) => {
            style_lower::lower_style_tree(
                project,
                file_source,
                tree,
                Some(jsx),
                pattern_transform.as_deref_mut(),
            )?
        }
        _ => ClassExpr::Lit(
            project
                .class_names_for_jsx_usage(jsx, pattern_transform)?
                .join(" "),
        ),
    };

    // A plain class list still merges as a static fragment, so it can land in a
    // quoted attribute instead of a concatenation.
    let ClassExpr::Lit(classes) = &lowered else {
        let expression = style_lower::print_class_expr(&lowered);
        let mut print = merge_class_name_with_expression(
            class_attr,
            helper_cx,
            existing,
            &expression,
            matches!(lowered, ClassExpr::Ternary { .. }),
        );
        print.ternary = top_level_ternary(&lowered).filter(|_| print.expression == expression);
        return Some(print);
    };
    Some(merge_class_name_fragments(
        class_attr, helper_cx, existing, classes,
    ))
}

fn top_level_ternary(expr: &ClassExpr) -> Option<super::helper::ClassNameTernary> {
    let ClassExpr::Ternary { test, yes, no } = expr else {
        return None;
    };
    Some(super::helper::ClassNameTernary {
        condition: test.clone(),
        consequent: style_lower::print_class_expr(yes),
        alternate: style_lower::print_class_expr(no),
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum ElementTag {
    Intrinsic(String),
    Component(String),
}

impl ElementTag {
    pub(super) fn opening_name(&self) -> &str {
        match self {
            Self::Intrinsic(name) | Self::Component(name) => name.as_str(),
        }
    }

    pub(super) fn runtime_first_arg(&self) -> String {
        match self {
            Self::Intrinsic(name) => format!("'{name}'"),
            Self::Component(name) => name.clone(),
        }
    }
}

pub(super) fn parse_as_attribute(attr: &ParsedAttribute) -> Option<ElementTag> {
    if attr.name.as_deref() != Some("as") {
        return None;
    }
    if let Some(value) = attr.static_string_value() {
        return Some(ElementTag::Intrinsic(value.to_owned()));
    }
    let expression = attr.expression.as_ref()?;
    (expression.facts.kind == pandacss_extractor::ExpressionKind::Identifier)
        .then(|| ElementTag::Component(expression.source.clone()))
}

pub(super) fn parse_as_property(prop: &ParsedProperty) -> Option<ElementTag> {
    if prop.key.as_deref() != Some("as") {
        return None;
    }
    if let Some(value) = prop.static_string_value() {
        return Some(ElementTag::Intrinsic(value.to_owned()));
    }
    if let Some(ident) = prop.static_identifier_value() {
        return Some(ElementTag::Component(ident.to_owned()));
    }
    None
}

pub(super) fn resolve_element_tag(
    jsx: &ExtractedJsx,
    as_from_attributes: Option<&[ParsedAttribute]>,
    as_from_properties: Option<&[ParsedProperty]>,
) -> Option<ElementTag> {
    if let Some(attrs) = as_from_attributes {
        for attr in attrs {
            if let Some(tag) = parse_as_attribute(attr) {
                return Some(tag);
            }
        }
        if attrs
            .iter()
            .any(|attr| attr.name.as_deref() == Some("as") && !attr.as_is_resolvable())
        {
            return None;
        }
    }

    if let Some(props) = as_from_properties {
        for prop in props {
            if let Some(tag) = parse_as_property(prop) {
                return Some(tag);
            }
        }
        if props
            .iter()
            .any(|prop| prop.key.as_deref() == Some("as") && !prop.as_is_resolvable())
        {
            return None;
        }
    }

    if jsx.kind == JsxKind::Factory
        && let Some(intrinsic) = &jsx.source.factory_intrinsic
    {
        return Some(ElementTag::Intrinsic(intrinsic.clone()));
    }

    Some(ElementTag::Intrinsic("div".to_owned()))
}

/// Whether the site's own style tree rules out a rewrite, independent of how
/// its props are spelled.
fn style_tree_should_skip(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> bool {
    let Some(tree) = jsx.style.as_ref() else {
        return !data_is_static(&jsx.data);
    };
    if style_lower::style_tree_has_rewrite_sites(tree) {
        return style_lower::lower_style_tree(project, source, tree, Some(jsx), pattern_transform)
            .is_none();
    }
    style_lower::style_tree_has_open_spread(tree)
        || (!data_is_static(&jsx.data) && !matches!(tree, StyleTree::Object(_)))
}

/// Whether any slot carries something the transform can't account for. A skip
/// leaves the whole site untouched, so this stays conservative.
pub(super) fn style_slots_should_skip(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    slots: &[impl StyleSlot],
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> bool {
    if style_tree_should_skip(project, source, jsx, pattern_transform) {
        return true;
    }

    let extractor_config = project.config().extractor_config();
    let jsx_config = &extractor_config.jsx;
    let class_attr = extractor_config.class_attribute;
    let tag_name = &jsx.name;
    let data_keys = style_prop_keys(&jsx.data);

    for slot in slots {
        let name = match slot.name() {
            SlotName::Spread => continue,
            SlotName::Computed => return true,
            SlotName::Named(name) => name,
        };
        if should_skip_style_prop(name) {
            continue;
        }
        if let Some(expression) = slot.expression_facts() {
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
        if slot.value_is_dynamic() {
            return true;
        }
    }

    false
}

/// Plans conditional spread rewrites for a site. `None` means the site must
/// stay unchanged.
pub(super) fn plan_slot_spreads(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    slots: &[impl StyleSlot],
    syntax: SpreadSyntax,
) -> Option<ConditionalSpreadPlan> {
    let extractor = project.config().extractor_config();
    let class_attr = extractor.class_attribute;
    let plan = plan_conditional_spreads(
        source,
        slots.iter().filter_map(StyleSlot::spread_expression),
        jsx.style.as_ref(),
        syntax,
        &extractor.jsx,
        &jsx.name,
        class_attr,
    )?;
    // A runtime spread embeds the class into each branch, which an explicit
    // class prop would then silently override.
    if matches!(plan, ConditionalSpreadPlan::Runtime(_))
        && slots
            .iter()
            .any(|slot| matches!(slot.name(), SlotName::Named(name) if name == class_attr))
    {
        return None;
    }
    Some(plan)
}

/// Slots that survive into the rewritten site, in source order.
pub(super) struct SelectedSlots {
    /// Raw source of each kept slot. The class is already embedded when a
    /// conditional spread absorbed it.
    pub parts: Vec<String>,
    pub preserved: Vec<pandacss_shared::Span>,
    pub embedded_class: bool,
}

/// Drops the slots that folded into the class name and keeps the rest as-is.
pub(super) fn select_slots(
    project: &Project,
    jsx: &ExtractedJsx,
    slots: &[impl StyleSlot],
    class_name: &ClassNamePrint,
    runtime_spread: Option<&ConditionalSpreadRewrite>,
) -> Option<SelectedSlots> {
    let extractor_config = project.config().extractor_config();
    let jsx_config = &extractor_config.jsx;
    let class_attr = extractor_config.class_attribute;
    let tag_name = &jsx.name;

    let mut selected = SelectedSlots {
        parts: Vec::new(),
        preserved: jsx
            .style
            .as_ref()
            .map(style_lower::preserved_source_spans)
            .unwrap_or_default(),
        embedded_class: false,
    };

    for slot in slots {
        let name = match slot.name() {
            SlotName::Spread => {
                if let Some(rewrite) = runtime_spread {
                    selected
                        .parts
                        .push(rewrite.embed_class(class_attr, class_name)?);
                    selected.embedded_class = true;
                    selected.preserved.push(slot.span());
                }
                continue;
            }
            SlotName::Computed => return None,
            SlotName::Named(name) => name,
        };
        // The class is rebuilt from scratch, and `as` was resolved into the tag.
        if name == "as" || name == class_attr {
            if slot.has_expression() {
                selected.preserved.push(slot.span());
            }
            continue;
        }
        if !should_skip_style_prop(name) && jsx_config.should_extract_prop(tag_name, name) {
            continue;
        }
        selected.parts.push(slot.raw().to_owned());
        selected.preserved.push(slot.span());
    }

    Some(selected)
}
