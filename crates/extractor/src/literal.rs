//! Compiler-internal literal value type.
//!
//! `Literal` is the typed shape used by the extractor for object/array/
//! primitive values read out of source. Compared to `serde_json::Value` it
//! preserves intent (this is a static literal, not arbitrary JSON), keeps
//! object-key ordering, and gives us a single place to attach static-evaluator
//! plumbing later. JSON-side serialization (NAPI and snapshots) goes through
//! the custom `Serialize` impl below, which produces the same wire shape as
//! before — integer/float distinction included.
//!
//! Conversion from Oxc AST nodes lives in this module. Anything non-literal
//! (identifiers, conditionals, template-with-interpolation, spread, computed
//! property keys, getters/setters) returns `None`.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, Expression, ObjectExpression, ObjectPropertyKind,
    PropertyKey, PropertyKind,
};
use serde::ser::{SerializeMap, SerializeSeq};
use serde::{Serialize, Serializer};

#[derive(Debug, Clone, PartialEq)]
pub enum Literal {
    String(String),
    Number(f64),
    Bool(bool),
    Null,
    /// Keys preserved in source order. `Vec` instead of a map type because
    /// we never look up by key during extraction; downstream code that does
    /// can build whatever index it needs.
    Object(Vec<(String, Literal)>),
    Array(Vec<Literal>),
}

impl Literal {
    /// Convert to `serde_json::Value` for the NAPI boundary. The TS side
    /// sees identical shapes whether the source is `serde_json::Value` or
    /// `Literal`.
    #[must_use]
    pub fn to_json(&self) -> serde_json::Value {
        match self {
            Self::String(s) => serde_json::Value::String(s.clone()),
            Self::Number(n) => json_number(*n).unwrap_or(serde_json::Value::Null),
            Self::Bool(b) => serde_json::Value::Bool(*b),
            Self::Null => serde_json::Value::Null,
            Self::Object(entries) => {
                let mut map = serde_json::Map::with_capacity(entries.len());
                for (k, v) in entries {
                    map.insert(k.clone(), v.to_json());
                }
                serde_json::Value::Object(map)
            }
            Self::Array(items) => {
                serde_json::Value::Array(items.iter().map(Self::to_json).collect())
            }
        }
    }
}

// Custom Serialize so snapshots produce the same shape as the old
// `serde_json::Value` path — including the integer/float number distinction.
impl Serialize for Literal {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::String(s) => serializer.serialize_str(s),
            Self::Number(n) => serialize_number(*n, serializer),
            Self::Bool(b) => serializer.serialize_bool(*b),
            Self::Null => serializer.serialize_unit(),
            Self::Object(entries) => {
                let mut map = serializer.serialize_map(Some(entries.len()))?;
                for (k, v) in entries {
                    map.serialize_entry(k, v)?;
                }
                map.end()
            }
            Self::Array(items) => {
                let mut seq = serializer.serialize_seq(Some(items.len()))?;
                for item in items {
                    seq.serialize_element(item)?;
                }
                seq.end()
            }
        }
    }
}

// 2^53 — the largest integer f64 can represent without precision loss.
const MAX_SAFE_INT: f64 = 9_007_199_254_740_992.0;

fn fits_as_integer(value: f64) -> bool {
    value.is_finite() && value.fract() == 0.0 && value.abs() <= MAX_SAFE_INT
}

#[allow(
    clippy::cast_possible_truncation,
    reason = "bounds checked against MAX_SAFE_INT (2^53)"
)]
fn serialize_number<S: Serializer>(value: f64, serializer: S) -> Result<S::Ok, S::Error> {
    if fits_as_integer(value) {
        serializer.serialize_i64(value as i64)
    } else {
        serializer.serialize_f64(value)
    }
}

#[allow(
    clippy::cast_possible_truncation,
    reason = "bounds checked against MAX_SAFE_INT (2^53)"
)]
fn json_number(value: f64) -> Option<serde_json::Value> {
    if fits_as_integer(value) {
        Some(serde_json::Value::Number(serde_json::Number::from(
            value as i64,
        )))
    } else {
        serde_json::Number::from_f64(value).map(serde_json::Value::Number)
    }
}

// --- AST → Literal conversion ---

pub(crate) fn expression_to_literal(expr: &Expression<'_>) -> Option<Literal> {
    match expr {
        Expression::StringLiteral(s) => Some(Literal::String(s.value.to_string())),
        Expression::NumericLiteral(n) => Some(Literal::Number(n.value)),
        Expression::BooleanLiteral(b) => Some(Literal::Bool(b.value)),
        Expression::NullLiteral(_) => Some(Literal::Null),
        Expression::ObjectExpression(obj) => object_to_literal(obj),
        Expression::ArrayExpression(arr) => array_to_literal(arr),
        _ => None,
    }
}

pub(crate) fn object_to_literal(obj: &ObjectExpression<'_>) -> Option<Literal> {
    let mut entries = Vec::with_capacity(obj.properties.len());
    for prop in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            return None;
        };
        if prop.computed || prop.method || prop.kind != PropertyKind::Init {
            return None;
        }
        let key = property_key_to_string(&prop.key)?;
        let value = expression_to_literal(&prop.value)?;
        entries.push((key, value));
    }
    Some(Literal::Object(entries))
}

fn array_to_literal(arr: &ArrayExpression<'_>) -> Option<Literal> {
    let mut items = Vec::with_capacity(arr.elements.len());
    for element in &arr.elements {
        match element {
            ArrayExpressionElement::Elision(_) => items.push(Literal::Null),
            ArrayExpressionElement::SpreadElement(_) => return None,
            _ => {
                let expr = element.as_expression()?;
                items.push(expression_to_literal(expr)?);
            }
        }
    }
    Some(Literal::Array(items))
}

fn property_key_to_string(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
        PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
        PropertyKey::NumericLiteral(n) => Some(n.value.to_string()),
        _ => None,
    }
}
