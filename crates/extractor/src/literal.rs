//! Conversion of Oxc literal AST nodes to `serde_json::Value`.
//!
//! Shared between call-argument extraction (`calls.rs`) and JSX attribute
//! extraction (`jsx.rs`). Anything that isn't a literal (identifiers,
//! conditionals, template strings with interpolation, spread, computed keys,
//! getters/setters) returns `None` so the caller can decide whether to skip
//! the parent record or just drop that field.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, Expression, ObjectExpression, ObjectPropertyKind,
    PropertyKey, PropertyKind,
};

pub(crate) fn expression_to_value(expr: &Expression<'_>) -> Option<serde_json::Value> {
    match expr {
        Expression::StringLiteral(s) => Some(serde_json::Value::String(s.value.to_string())),
        Expression::NumericLiteral(n) => json_number(n.value),
        Expression::BooleanLiteral(b) => Some(serde_json::Value::Bool(b.value)),
        Expression::NullLiteral(_) => Some(serde_json::Value::Null),
        Expression::ObjectExpression(obj) => object_to_value(obj),
        Expression::ArrayExpression(arr) => array_to_value(arr),
        _ => None,
    }
}

pub(crate) fn object_to_value(obj: &ObjectExpression<'_>) -> Option<serde_json::Value> {
    let mut map = serde_json::Map::with_capacity(obj.properties.len());
    for prop in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            return None;
        };
        if prop.computed || prop.method || prop.kind != PropertyKind::Init {
            return None;
        }
        let key = property_key_to_string(&prop.key)?;
        let value = expression_to_value(&prop.value)?;
        map.insert(key, value);
    }
    Some(serde_json::Value::Object(map))
}

pub(crate) fn array_to_value(arr: &ArrayExpression<'_>) -> Option<serde_json::Value> {
    let mut out = Vec::with_capacity(arr.elements.len());
    for element in &arr.elements {
        match element {
            ArrayExpressionElement::Elision(_) => out.push(serde_json::Value::Null),
            ArrayExpressionElement::SpreadElement(_) => return None,
            _ => {
                let expr = element.as_expression()?;
                out.push(expression_to_value(expr)?);
            }
        }
    }
    Some(serde_json::Value::Array(out))
}

pub(crate) fn property_key_to_string(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
        PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
        PropertyKey::NumericLiteral(n) => Some(n.value.to_string()),
        _ => None,
    }
}

fn json_number(value: f64) -> Option<serde_json::Value> {
    // 2^53 is the largest integer f64 can represent without precision loss.
    const MAX_SAFE_INT: f64 = 9_007_199_254_740_992.0;
    if value.is_finite() && value.fract() == 0.0 && value.abs() <= MAX_SAFE_INT {
        #[allow(
            clippy::cast_possible_truncation,
            reason = "bounds checked against MAX_SAFE_INT (2^53)"
        )]
        return Some(serde_json::Value::Number(serde_json::Number::from(
            value as i64,
        )));
    }
    serde_json::Number::from_f64(value).map(serde_json::Value::Number)
}
