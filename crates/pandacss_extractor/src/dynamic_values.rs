use oxc_ast::ast::{
    Argument, ArrayExpressionElement, Expression, ObjectPropertyKind, PropertyKind,
};
use oxc_span::GetSpan;
use serde::Serialize;

use crate::literal::{expression_to_literal, property_key_to_string};
use crate::style_tree::{OpenSpreadKind, StyleSpread, StyleTree};
use crate::{JsxKind, MatchCategory, Resolver, Span, span_from_oxc};

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum DynamicStyleValueKind {
    Value,
    Fallback,
    Property,
    Argument,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DynamicStyleValue {
    pub kind: DynamicStyleValueKind,
    pub path: Vec<String>,
    pub span: Span,
}

pub(crate) fn collect_call(
    category: MatchCategory,
    arguments: &[Argument<'_>],
    trees: &[Option<StyleTree>],
    out: &mut Vec<DynamicStyleValue>,
) {
    let whole_arguments = match category {
        MatchCategory::Css | MatchCategory::Pattern => true,
        MatchCategory::Jsx => false,
        MatchCategory::Recipe | MatchCategory::Tokens => return,
    };
    for (argument, tree) in arguments.iter().zip(trees) {
        match tree {
            Some(tree) => collect_tree(tree, &mut Vec::new(), out),
            None if whole_arguments => out.push(DynamicStyleValue {
                kind: DynamicStyleValueKind::Argument,
                path: Vec::new(),
                span: span_from_oxc(argument.span()),
            }),
            None => {}
        }
    }
}

pub(crate) fn reports_jsx_tag(kind: JsxKind, panda_owned: bool, configured: bool) -> bool {
    kind != JsxKind::Recipe && (panda_owned || configured)
}

pub(crate) fn collect_jsx(
    kind: JsxKind,
    panda_owned: bool,
    configured: bool,
    tree: Option<&StyleTree>,
    out: &mut Vec<DynamicStyleValue>,
) {
    if !reports_jsx_tag(kind, panda_owned, configured) {
        return;
    }
    if let Some(tree) = tree {
        collect_tree(tree, &mut Vec::new(), out);
    }
}

pub(crate) fn collect_literal_container(
    expr: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
    path: &mut Vec<String>,
    out: &mut Vec<DynamicStyleValue>,
) {
    match expr.get_inner_expression() {
        Expression::ObjectExpression(object) => {
            for property in &object.properties {
                let ObjectPropertyKind::ObjectProperty(property) = property else {
                    continue;
                };
                let key = (!property.method && property.kind == PropertyKind::Init)
                    .then(|| property_key_to_string(&property.key, property.computed, resolver))
                    .flatten();
                let Some(key) = key else {
                    push(
                        DynamicStyleValueKind::Property,
                        path,
                        span_from_oxc(property.span),
                        out,
                    );
                    continue;
                };
                path.push(key);
                collect_literal_member(&property.value, resolver, path, out);
                path.pop();
            }
        }
        Expression::ArrayExpression(array) => {
            for (index, element) in array.elements.iter().enumerate() {
                if matches!(
                    element,
                    ArrayExpressionElement::Elision(_) | ArrayExpressionElement::SpreadElement(_)
                ) {
                    continue;
                }
                let Some(element) = element.as_expression() else {
                    continue;
                };
                path.push(index.to_string());
                collect_literal_member(element, resolver, path, out);
                path.pop();
            }
        }
        _ => {}
    }
}

fn collect_literal_member(
    expr: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
    path: &mut Vec<String>,
    out: &mut Vec<DynamicStyleValue>,
) {
    match expr.get_inner_expression() {
        Expression::ObjectExpression(_) | Expression::ArrayExpression(_) => {
            collect_literal_container(expr, resolver, path, out);
        }
        _ if expression_to_literal(expr, resolver).is_none() => {
            push(
                DynamicStyleValueKind::Value,
                path,
                span_from_oxc(expr.span()),
                out,
            );
        }
        _ => {}
    }
}

pub(crate) fn dedupe(values: &mut Vec<DynamicStyleValue>) {
    values.sort_by_key(|value| (value.span.start, value.span.end));
    values.dedup_by_key(|value| value.span);
}

fn collect_tree(tree: &StyleTree, path: &mut Vec<String>, out: &mut Vec<DynamicStyleValue>) {
    match tree {
        StyleTree::Open { span } => push(DynamicStyleValueKind::Value, path, *span, out),
        StyleTree::OpenWithFallback { span, fallback } => {
            push(DynamicStyleValueKind::Fallback, path, *span, out);
            collect_tree(fallback, path, out);
        }
        StyleTree::Object(object) => {
            for (key, value) in &object.entries {
                path.push(key.clone());
                collect_tree(value, path, out);
                path.pop();
            }
            for spread in &object.spreads {
                collect_spread(spread, path, out);
            }
        }
        StyleTree::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                path.push(index.to_string());
                collect_tree(item, path, out);
                path.pop();
            }
        }
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => {
            collect_tree(consequent, path, out);
            collect_tree(alternate, path, out);
        }
        StyleTree::And { value, .. } => collect_tree(value, path, out),
        StyleTree::Branches(items) => {
            for item in items {
                collect_tree(item, path, out);
            }
        }
        StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => {}
    }
}

fn collect_spread(spread: &StyleSpread, path: &mut Vec<String>, out: &mut Vec<DynamicStyleValue>) {
    match spread {
        StyleSpread::Ternary {
            consequent,
            alternate,
            ..
        } => {
            collect_spread_arm(consequent, path, out);
            collect_spread_arm(alternate, path, out);
        }
        StyleSpread::And { value, .. } | StyleSpread::OpenWithFallback { fallback: value } => {
            collect_spread_arm(value, path, out);
        }
        StyleSpread::Open {
            span,
            kind: OpenSpreadKind::Property,
        } => push(DynamicStyleValueKind::Property, path, *span, out),
        StyleSpread::Open {
            kind: OpenSpreadKind::Spread,
            ..
        } => {}
    }
}

fn collect_spread_arm(tree: &StyleTree, path: &mut Vec<String>, out: &mut Vec<DynamicStyleValue>) {
    match tree {
        StyleTree::Open { .. } => {}
        StyleTree::OpenWithFallback { fallback: arm, .. } | StyleTree::And { value: arm, .. } => {
            collect_spread_arm(arm, path, out);
        }
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => {
            collect_spread_arm(consequent, path, out);
            collect_spread_arm(alternate, path, out);
        }
        StyleTree::Branches(arms) => {
            for arm in arms {
                collect_spread_arm(arm, path, out);
            }
        }
        StyleTree::Object(_)
        | StyleTree::Array(_)
        | StyleTree::String(_)
        | StyleTree::Number(_)
        | StyleTree::Bool(_)
        | StyleTree::Null
        | StyleTree::Token { .. } => collect_tree(tree, path, out),
    }
}

fn push(
    kind: DynamicStyleValueKind,
    path: &[String],
    span: Span,
    out: &mut Vec<DynamicStyleValue>,
) {
    out.push(DynamicStyleValue {
        kind,
        path: path.to_vec(),
        span,
    });
}
