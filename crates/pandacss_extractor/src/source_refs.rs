use oxc_ast::ast::{
    Expression, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXExpression,
    ObjectExpression, ObjectPropertyKind, PropertyKind,
};
use oxc_span::GetSpan;
use serde::Serialize;

use crate::literal::{expression_to_literal, property_key_to_string};
use crate::{JsxExtractionConfig, Resolver, Span, span_from_oxc};

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "kebab-case")]
pub enum StyleSourceOwnerKind {
    Call,
    Jsx,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StyleSourceOwner {
    pub kind: StyleSourceOwnerKind,
    pub index: u32,
    pub span: Span,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum StyleSourceRefSafety {
    Safe,
    Computed,
    Shorthand,
    Method,
    Spread,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StyleSourceRef {
    pub owner: StyleSourceOwner,
    pub path: Vec<String>,
    pub name: String,
    pub span: Span,
    pub key_span: Span,
    pub value_span: Option<Span>,
    pub safety: StyleSourceRefSafety,
}

impl StyleSourceRef {
    #[must_use]
    pub fn is_safe_local_property(&self) -> bool {
        self.safety == StyleSourceRefSafety::Safe
    }
}

pub(crate) fn collect_object_source_refs(
    obj: &ObjectExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
    owner: StyleSourceOwner,
    path: &mut Vec<String>,
    out: &mut Vec<StyleSourceRef>,
) {
    for item in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = item else {
            continue;
        };
        let Some(key) = property_key_to_string(&prop.key, prop.computed, resolver) else {
            continue;
        };
        if expression_to_literal(&prop.value, resolver).is_none() {
            continue;
        }

        path.push(key.clone());
        out.push(StyleSourceRef {
            owner,
            path: path.clone(),
            name: key,
            span: span_from_oxc(prop.span),
            key_span: span_from_oxc(prop.key.span()),
            value_span: Some(span_from_oxc(prop.value.span())),
            safety: object_property_safety(prop.computed, prop.shorthand, prop.method),
        });

        if prop.kind == PropertyKind::Init
            && !prop.method
            && let Some(child) = object_expression(&prop.value)
        {
            collect_object_source_refs(child, resolver, owner, path, out);
        }
        path.pop();
    }
}

pub(crate) fn collect_jsx_attribute_source_refs(
    attrs: &[JSXAttributeItem<'_>],
    resolver: Option<&Resolver<'_, '_>>,
    jsx: &JsxExtractionConfig,
    tag_name: &str,
    owner: StyleSourceOwner,
    out: &mut Vec<StyleSourceRef>,
) {
    for item in attrs {
        let JSXAttributeItem::Attribute(attr) = item else {
            continue;
        };
        let JSXAttributeName::Identifier(name) = &attr.name else {
            continue;
        };
        let key = name.name.as_str();
        if !jsx.should_extract_prop(tag_name, key)
            || !jsx_attribute_is_extractable(attr.value.as_ref(), resolver)
        {
            continue;
        }

        let path = vec![key.to_owned()];
        out.push(StyleSourceRef {
            owner,
            path: path.clone(),
            name: key.to_owned(),
            span: span_from_oxc(attr.span),
            key_span: span_from_oxc(attr.name.span()),
            value_span: attr.value.as_ref().map(|value| span_from_oxc(value.span())),
            safety: if attr.value.is_none() {
                StyleSourceRefSafety::Shorthand
            } else {
                StyleSourceRefSafety::Safe
            },
        });

        if let Some(value) = attr.value.as_ref()
            && let Some(obj) = jsx_attribute_object(value)
        {
            let mut nested_path = path;
            collect_object_source_refs(obj, resolver, owner, &mut nested_path, out);
        }
    }
}

fn jsx_attribute_is_extractable(
    value: Option<&JSXAttributeValue<'_>>,
    resolver: Option<&Resolver<'_, '_>>,
) -> bool {
    match value {
        None | Some(JSXAttributeValue::StringLiteral(_)) => true,
        Some(JSXAttributeValue::ExpressionContainer(container)) => match &container.expression {
            JSXExpression::EmptyExpression(_) => false,
            other => other
                .as_expression()
                .is_some_and(|expr| expression_to_literal(expr, resolver).is_some()),
        },
        Some(JSXAttributeValue::Element(_) | JSXAttributeValue::Fragment(_)) => false,
    }
}

fn object_property_safety(computed: bool, shorthand: bool, method: bool) -> StyleSourceRefSafety {
    if computed {
        StyleSourceRefSafety::Computed
    } else if shorthand {
        StyleSourceRefSafety::Shorthand
    } else if method {
        StyleSourceRefSafety::Method
    } else {
        StyleSourceRefSafety::Safe
    }
}

fn jsx_attribute_object<'a>(value: &'a JSXAttributeValue<'a>) -> Option<&'a ObjectExpression<'a>> {
    let JSXAttributeValue::ExpressionContainer(container) = value else {
        return None;
    };
    let expr = container.expression.as_expression()?;
    object_expression(expr)
}

fn object_expression<'a>(expr: &'a Expression<'a>) -> Option<&'a ObjectExpression<'a>> {
    match expr {
        Expression::ObjectExpression(obj) => Some(obj),
        Expression::ParenthesizedExpression(parenthesized) => {
            object_expression(&parenthesized.expression)
        }
        Expression::TSAsExpression(ts) => object_expression(&ts.expression),
        Expression::TSSatisfiesExpression(ts) => object_expression(&ts.expression),
        Expression::TSNonNullExpression(ts) => object_expression(&ts.expression),
        Expression::TSTypeAssertion(ts) => object_expression(&ts.expression),
        Expression::TSInstantiationExpression(ts) => object_expression(&ts.expression),
        _ => None,
    }
}
