//! Shared JSX rewrite helpers (including element-tag resolution).

use std::collections::HashSet;

use pandacss_extractor::{ExtractedJsx, JsxKind, Literal};

use crate::PatternTransformFn;
use crate::Project;

use super::helper::{
    ClassNamePrint, format_object_class_name, merge_class_name_fragments,
    merge_class_name_with_expression,
};
use super::jsx_parse::{
    ParsedAttribute, ParsedObjectLiteral, ParsedOpeningElement, ParsedProperty,
};
use super::plan::HelperCxMode;
use super::resolve::is_static_style_literal;
use super::style_lower::{self, LowerResult};

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

pub(super) fn plan_opening_class_name(
    project: &Project,
    file_source: &str,
    jsx: &ExtractedJsx,
    parsed: &ParsedOpeningElement,
    helper_cx: HelperCxMode,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassNamePrint> {
    let class_attr = project.config().extractor_config().class_attribute;
    if let Some(tree) = jsx.style.as_ref()
        && style_lower::style_tree_has_rewrite_sites(tree)
    {
        return match style_lower::lower_style_tree(
            project,
            file_source,
            tree,
            Some(jsx),
            pattern_transform.as_deref_mut(),
        ) {
            LowerResult::Expr(expr) => {
                let expression = style_lower::print_class_expr(&expr);
                let mut print = merge_class_name_with_expression(
                    class_attr,
                    helper_cx,
                    parsed.existing_class_name(class_attr),
                    &expression,
                    matches!(expr, style_lower::ClassExpr::Ternary { .. }),
                );
                print.ternary = top_level_ternary(&expr).filter(|_| print.expression == expression);
                Some(print)
            }
            LowerResult::Static(classes) => Some(merge_class_name_fragments(
                class_attr,
                helper_cx,
                parsed.existing_class_name(class_attr),
                &classes,
            )),
            LowerResult::Bail => None,
        };
    }

    let classes = project.class_names_for_jsx_usage(jsx, pattern_transform)?;
    Some(merge_class_name_fragments(
        class_attr,
        helper_cx,
        parsed.existing_class_name(class_attr),
        &classes.join(" "),
    ))
}

pub(super) fn plan_runtime_class_name(
    project: &Project,
    file_source: &str,
    jsx: &ExtractedJsx,
    parsed: &ParsedObjectLiteral,
    helper_cx: HelperCxMode,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<ClassNamePrint> {
    let class_attr = project.config().extractor_config().class_attribute;
    if let Some(tree) = jsx.style.as_ref()
        && style_lower::style_tree_has_rewrite_sites(tree)
    {
        return match style_lower::lower_style_tree(
            project,
            file_source,
            tree,
            Some(jsx),
            pattern_transform.as_deref_mut(),
        ) {
            LowerResult::Expr(expr) => {
                let expression = style_lower::print_class_expr(&expr);
                let mut print = merge_class_name_with_expression(
                    class_attr,
                    helper_cx,
                    parsed.existing_class_name(class_attr),
                    &expression,
                    matches!(expr, style_lower::ClassExpr::Ternary { .. }),
                );
                print.ternary = top_level_ternary(&expr).filter(|_| print.expression == expression);
                Some(ClassNamePrint {
                    attribute: format_object_class_name(class_attr, &print),
                    expression: print.expression,
                    ternary: print.ternary,
                    needs_cx: print.needs_cx,
                })
            }
            LowerResult::Static(classes) => {
                let print = merge_class_name_fragments(
                    class_attr,
                    helper_cx,
                    parsed.existing_class_name(class_attr),
                    &classes,
                );
                Some(ClassNamePrint {
                    attribute: format_object_class_name(class_attr, &print),
                    expression: print.expression,
                    ternary: print.ternary,
                    needs_cx: print.needs_cx,
                })
            }
            LowerResult::Bail => None,
        };
    }

    let classes = project.class_names_for_jsx_usage(jsx, pattern_transform)?;
    let print = merge_class_name_fragments(
        class_attr,
        helper_cx,
        parsed.existing_class_name(class_attr),
        &classes.join(" "),
    );
    Some(ClassNamePrint {
        attribute: format_object_class_name(class_attr, &print),
        expression: print.expression,
        ternary: print.ternary,
        needs_cx: print.needs_cx,
    })
}

fn top_level_ternary(expr: &style_lower::ClassExpr) -> Option<super::helper::ClassNameTernary> {
    let style_lower::ClassExpr::Ternary { test, yes, no } = expr else {
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
