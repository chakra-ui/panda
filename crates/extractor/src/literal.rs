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
//! (identifiers, conditionals, template-with-interpolation, member access,
//! getters/setters) returns `None`. Operators are *constant-folded* when
//! their operands are themselves literal: `-1` → `Number(-1.0)`,
//! `'a' + 'b'` → `String("ab")`, etc. AST-only unwrappers like
//! `ParenthesizedExpression` and `TSAsExpression` recurse on the inner
//! expression and have no runtime effect.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, BinaryExpression, BinaryOperator,
    ComputedMemberExpression, ConditionalExpression, Expression, LogicalExpression,
    LogicalOperator, ObjectExpression, ObjectPropertyKind, PropertyKey, PropertyKind,
    StaticMemberExpression, TemplateLiteral, UnaryExpression, UnaryOperator,
};
use serde::ser::{SerializeMap, SerializeSeq};
use serde::{Serialize, Serializer};

use crate::Resolver;

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

/// Convert an expression to a `Literal` if it folds to a static value.
///
/// `resolver` is the [`Resolver`] built from `oxc_semantic` for the file
/// being extracted. Pass `None` only for unit tests that exercise pure
/// literal folding without scope context — production call paths (the
/// `extract()` family) always pass `Some`. With a resolver, `Identifier`
/// references, shorthand object props, and member access on resolved
/// objects/arrays fold as well; without one, they all return `None`.
pub(crate) fn expression_to_literal(
    expr: &Expression<'_>,
    resolver: Option<&Resolver<'_>>,
) -> Option<Literal> {
    match expr {
        // Primitive literals.
        Expression::StringLiteral(s) => Some(Literal::String(s.value.to_string())),
        Expression::NumericLiteral(n) => Some(Literal::Number(n.value)),
        Expression::BooleanLiteral(b) => Some(Literal::Bool(b.value)),
        Expression::NullLiteral(_) => Some(Literal::Null),

        // Composite literals.
        Expression::ObjectExpression(obj) => object_to_literal(obj, resolver),
        Expression::ArrayExpression(arr) => array_to_literal(arr, resolver),

        // Transparent unwraps — these are purely syntactic and have no
        // runtime effect, so recurse on the inner expression.
        Expression::ParenthesizedExpression(p) => expression_to_literal(&p.expression, resolver),
        Expression::TSAsExpression(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSSatisfiesExpression(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSNonNullExpression(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSTypeAssertion(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSInstantiationExpression(e) => expression_to_literal(&e.expression, resolver),

        // Constant folding.
        Expression::UnaryExpression(u) => eval_unary(u, resolver),
        Expression::BinaryExpression(b) => eval_binary(b, resolver),
        Expression::LogicalExpression(l) => eval_logical(l, resolver),
        Expression::ConditionalExpression(c) => eval_conditional(c, resolver),
        Expression::TemplateLiteral(t) => template_literal_to_literal(t, resolver),

        // Same-file scope resolution.
        Expression::Identifier(ident) => resolver?.resolve_identifier(ident),
        Expression::StaticMemberExpression(member) => static_member_to_literal(member, resolver),
        Expression::ComputedMemberExpression(member) => {
            computed_member_to_literal(member, resolver)
        }

        _ => None,
    }
}

pub(crate) fn object_to_literal(
    obj: &ObjectExpression<'_>,
    resolver: Option<&Resolver<'_>>,
) -> Option<Literal> {
    let mut entries: Vec<(String, Literal)> = Vec::with_capacity(obj.properties.len());
    for prop in &obj.properties {
        match prop {
            ObjectPropertyKind::ObjectProperty(prop) => {
                if prop.method || prop.kind != PropertyKind::Init {
                    return None;
                }
                let key = property_key_to_string(&prop.key, prop.computed, resolver)?;
                let value = expression_to_literal(&prop.value, resolver)?;
                upsert(&mut entries, key, value);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                // With a resolver, `{ ...base }` where `base` is a local
                // const-bound object folds naturally — `expression_to_literal`
                // chases the identifier through `Resolver::resolve_identifier`.
                let inner = expression_to_literal(&spread.argument, resolver)?;
                let Literal::Object(inner_entries) = inner else {
                    return None;
                };
                for (k, v) in inner_entries {
                    upsert(&mut entries, k, v);
                }
            }
        }
    }
    Some(Literal::Object(entries))
}

fn array_to_literal(arr: &ArrayExpression<'_>, resolver: Option<&Resolver<'_>>) -> Option<Literal> {
    let mut items = Vec::with_capacity(arr.elements.len());
    for element in &arr.elements {
        match element {
            ArrayExpressionElement::Elision(_) => items.push(Literal::Null),
            ArrayExpressionElement::SpreadElement(spread) => {
                // Literal-array spreads inline; resolver also unlocks
                // `[...local]` when `local` is a const-bound array.
                let inner = expression_to_literal(&spread.argument, resolver)?;
                let Literal::Array(inner_items) = inner else {
                    return None;
                };
                items.extend(inner_items);
            }
            _ => {
                let expr = element.as_expression()?;
                items.push(expression_to_literal(expr, resolver)?);
            }
        }
    }
    Some(Literal::Array(items))
}

fn property_key_to_string(
    key: &PropertyKey<'_>,
    computed: bool,
    resolver: Option<&Resolver<'_>>,
) -> Option<String> {
    if !computed {
        return match key {
            PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
            PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
            PropertyKey::NumericLiteral(n) => Some(number_as_key(n.value)),
            _ => None,
        };
    }
    // Computed: evaluate the key expression and stringify if literal.
    let expr = key.as_expression()?;
    match expression_to_literal(expr, resolver)? {
        Literal::String(s) => Some(s),
        Literal::Number(n) => Some(number_as_key(n)),
        _ => None,
    }
}

// --- member access ---

/// `obj.prop` — resolve `obj` to a literal object/array and look up `prop`.
fn static_member_to_literal(
    member: &StaticMemberExpression<'_>,
    resolver: Option<&Resolver<'_>>,
) -> Option<Literal> {
    let object = expression_to_literal(&member.object, resolver)?;
    lookup_member(&object, member.property.name.as_str())
}

/// `obj[key]` — resolve both sides and look up by string-or-number key.
fn computed_member_to_literal(
    member: &ComputedMemberExpression<'_>,
    resolver: Option<&Resolver<'_>>,
) -> Option<Literal> {
    let object = expression_to_literal(&member.object, resolver)?;
    let key_literal = expression_to_literal(&member.expression, resolver)?;
    let key = match key_literal {
        Literal::String(s) => s,
        Literal::Number(n) => number_as_key(n),
        // `obj[true]` / `obj[null]` are valid JS — coerce to `"true"`/`"null"` —
        // but they don't show up in real Panda code. Drop to keep the surface
        // narrow.
        _ => return None,
    };
    lookup_member(&object, &key)
}

/// Look up a member on a resolved object or array literal.
///
/// - Object: case-sensitive key match against insertion-ordered entries.
/// - Array: parse the key as an integer index; out-of-bounds returns `None`
///   (JS would return `undefined`; we treat that as "not foldable").
/// - Other literal kinds: not addressable, return `None`.
fn lookup_member(object: &Literal, key: &str) -> Option<Literal> {
    match object {
        Literal::Object(entries) => entries
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.clone()),
        Literal::Array(items) => {
            let idx = key.parse::<usize>().ok()?;
            items.get(idx).cloned()
        }
        _ => None,
    }
}

fn number_as_key(value: f64) -> String {
    number_to_js_string(value)
}

/// Insert-or-overwrite by key — last-writer-wins on duplicate keys,
/// preserving the first-occurrence position. Same semantics as ES object
/// initializers with duplicate keys / spread overwrites.
fn upsert(out: &mut Vec<(String, Literal)>, key: String, value: Literal) {
    if let Some(entry) = out.iter_mut().find(|(k, _)| k == &key) {
        entry.1 = value;
    } else {
        out.push((key, value));
    }
}

// --- constant folding ---

fn eval_unary(u: &UnaryExpression<'_>, resolver: Option<&Resolver<'_>>) -> Option<Literal> {
    let inner = expression_to_literal(&u.argument, resolver)?;
    match (u.operator, inner) {
        (UnaryOperator::UnaryPlus, Literal::Number(n)) => Some(Literal::Number(n)),
        (UnaryOperator::UnaryNegation, Literal::Number(n)) => Some(Literal::Number(-n)),
        (UnaryOperator::LogicalNot, value) => Some(Literal::Bool(!truthy(&value))),
        #[allow(
            clippy::cast_possible_truncation,
            reason = "JS bitwise ops are defined on Int32 and truncate"
        )]
        (UnaryOperator::BitwiseNot, Literal::Number(n)) => {
            Some(Literal::Number(f64::from(!(n as i32))))
        }
        // `typeof`, `void`, `delete` are skipped — not useful for static
        // style extraction.
        _ => None,
    }
}

fn eval_binary(b: &BinaryExpression<'_>, resolver: Option<&Resolver<'_>>) -> Option<Literal> {
    let left = expression_to_literal(&b.left, resolver)?;
    let right = expression_to_literal(&b.right, resolver)?;
    match b.operator {
        BinaryOperator::Addition => {
            // JS `+` semantics: if either operand is a string, the other is
            // coerced to string and the result is concatenation. Otherwise
            // both are coerced to numbers and added.
            if matches!(left, Literal::String(_)) || matches!(right, Literal::String(_)) {
                let l = coerce_to_string(&left)?;
                let r = coerce_to_string(&right)?;
                Some(Literal::String(format!("{l}{r}")))
            } else {
                let l = coerce_to_number(&left)?;
                let r = coerce_to_number(&right)?;
                Some(Literal::Number(l + r))
            }
        }
        BinaryOperator::Subtraction => {
            let l = coerce_to_number(&left)?;
            let r = coerce_to_number(&right)?;
            Some(Literal::Number(l - r))
        }
        BinaryOperator::Multiplication => {
            let l = coerce_to_number(&left)?;
            let r = coerce_to_number(&right)?;
            Some(Literal::Number(l * r))
        }
        BinaryOperator::Division => {
            let l = coerce_to_number(&left)?;
            let r = coerce_to_number(&right)?;
            if r == 0.0 {
                // JS yields Infinity / -Infinity / NaN here; emitting any of
                // those into a style object isn't useful, so we drop.
                return None;
            }
            Some(Literal::Number(l / r))
        }
        BinaryOperator::Remainder => {
            let l = coerce_to_number(&left)?;
            let r = coerce_to_number(&right)?;
            if r == 0.0 {
                return None;
            }
            Some(Literal::Number(l % r))
        }
        BinaryOperator::Exponential => {
            let l = coerce_to_number(&left)?;
            let r = coerce_to_number(&right)?;
            Some(Literal::Number(l.powf(r)))
        }

        BinaryOperator::StrictEquality => Some(Literal::Bool(strict_eq(&left, &right))),
        BinaryOperator::StrictInequality => Some(Literal::Bool(!strict_eq(&left, &right))),
        BinaryOperator::Equality => Some(Literal::Bool(loose_eq(&left, &right)?)),
        BinaryOperator::Inequality => Some(Literal::Bool(!loose_eq(&left, &right)?)),

        BinaryOperator::LessThan => Some(Literal::Bool(less_than(&left, &right)?)),
        BinaryOperator::LessEqualThan => Some(Literal::Bool(!less_than(&right, &left)?)),
        BinaryOperator::GreaterThan => Some(Literal::Bool(less_than(&right, &left)?)),
        BinaryOperator::GreaterEqualThan => Some(Literal::Bool(!less_than(&left, &right)?)),

        _ => None,
    }
}

/// JS `===` semantics for the literal subset we care about. Same-type
/// equality; cross-type comparisons are always `false`. Object/Array
/// literals compare by reference in JS, so two distinct AST occurrences
/// are always `false`.
fn strict_eq(a: &Literal, b: &Literal) -> bool {
    match (a, b) {
        (Literal::Null, Literal::Null) => true,
        (Literal::String(x), Literal::String(y)) => x == y,
        // f64 equality already produces `false` for `NaN === NaN`, which
        // matches JS.
        (Literal::Number(x), Literal::Number(y)) => x == y,
        (Literal::Bool(x), Literal::Bool(y)) => x == y,
        // Object/array literals are always distinct references, so any
        // pair involving one of them is `false`. Cross-type pairs (e.g.
        // Number vs String) are also `false` per strict equality rules.
        _ => false,
    }
}

/// JS `==` semantics, restricted to literal-on-literal. Implements the
/// common coercion rules; mixed object/array cases return `None` since
/// they'd require runtime-style `ToPrimitive` we don't model.
fn loose_eq(a: &Literal, b: &Literal) -> Option<bool> {
    // Same type → identical to strict.
    if matches!(
        (a, b),
        (Literal::Null, Literal::Null)
            | (Literal::String(_), Literal::String(_))
            | (Literal::Number(_), Literal::Number(_))
            | (Literal::Bool(_), Literal::Bool(_))
    ) {
        return Some(strict_eq(a, b));
    }
    // null == undefined (we model undefined as Null already).
    match (a, b) {
        (Literal::Null, _) | (_, Literal::Null) => Some(false),
        // String ↔ number: coerce string to number; if it doesn't parse,
        // JS yields NaN and NaN == n is false.
        (Literal::String(s), Literal::Number(n)) | (Literal::Number(n), Literal::String(s)) => {
            Some(s.trim().parse::<f64>().is_ok_and(|sn| sn == *n))
        }
        // Bool ↔ anything: coerce bool to number, then re-run.
        (Literal::Bool(b1), other) | (other, Literal::Bool(b1)) => {
            let coerced = Literal::Number(if *b1 { 1.0 } else { 0.0 });
            loose_eq(&coerced, other)
        }
        // Object/array coercion is heavier than worth modelling.
        _ => None,
    }
}

/// JS `<` semantics: lexicographic for two strings, otherwise numeric with
/// `ToNumber` coercion. Returns `None` if coercion fails for either side
/// (JS would say `false`, but we'd rather drop the call than pretend).
fn less_than(a: &Literal, b: &Literal) -> Option<bool> {
    if let (Literal::String(x), Literal::String(y)) = (a, b) {
        return Some(x < y);
    }
    let l = coerce_to_number(a)?;
    let r = coerce_to_number(b)?;
    // NaN comparisons are always `false` in JS; f64::partial_cmp returns
    // `None` for NaN — same effective answer.
    Some(l < r)
}

fn eval_logical(l: &LogicalExpression<'_>, resolver: Option<&Resolver<'_>>) -> Option<Literal> {
    // Short-circuit: evaluate left first. If left determines the result,
    // skip evaluating right (and importantly, allow right to be non-literal
    // since it's unreachable). When left doesn't decide, both sides must
    // be literal for us to fold.
    let left = expression_to_literal(&l.left, resolver)?;
    match l.operator {
        LogicalOperator::And => {
            if truthy(&left) {
                expression_to_literal(&l.right, resolver)
            } else {
                Some(left)
            }
        }
        LogicalOperator::Or => {
            if truthy(&left) {
                Some(left)
            } else {
                expression_to_literal(&l.right, resolver)
            }
        }
        LogicalOperator::Coalesce => {
            // `?? right` only short-circuits when left is null/undefined.
            // We model `undefined` as `Null` (we have no separate variant).
            if matches!(left, Literal::Null) {
                expression_to_literal(&l.right, resolver)
            } else {
                Some(left)
            }
        }
    }
}

fn eval_conditional(
    c: &ConditionalExpression<'_>,
    resolver: Option<&Resolver<'_>>,
) -> Option<Literal> {
    // Only fold when the test is literal-resolvable. When `cond` is an
    // identifier, callers can't know which branch will run at build time —
    // a future slice may emit both branches as alternative extractions
    // (atomic CSS pattern), but that needs a richer output type.
    let test = expression_to_literal(&c.test, resolver)?;
    if truthy(&test) {
        expression_to_literal(&c.consequent, resolver)
    } else {
        expression_to_literal(&c.alternate, resolver)
    }
}

fn template_literal_to_literal(
    t: &TemplateLiteral<'_>,
    resolver: Option<&Resolver<'_>>,
) -> Option<Literal> {
    // Walk the template: quasi[0] expr[0] quasi[1] expr[1] ... quasi[N].
    // Each interpolation must be a literal-foldable expression; stringify
    // it via JS coercion rules and concatenate.
    let mut out = String::new();
    for (i, expr) in t.expressions.iter().enumerate() {
        let quasi = t.quasis.get(i)?;
        out.push_str(quasi.value.cooked.as_ref()?.as_str());
        let value = expression_to_literal(expr, resolver)?;
        let stringified = coerce_to_string(&value)?;
        out.push_str(&stringified);
    }
    // Final tail quasi.
    let tail = t.quasis.last()?;
    out.push_str(tail.value.cooked.as_ref()?.as_str());
    Some(Literal::String(out))
}

fn truthy(value: &Literal) -> bool {
    match value {
        Literal::Null => false,
        Literal::Bool(b) => *b,
        Literal::Number(n) => *n != 0.0 && !n.is_nan(),
        Literal::String(s) => !s.is_empty(),
        Literal::Object(_) | Literal::Array(_) => true,
    }
}

/// JS `ToString` for literal values. Mirrors `String(x)` semantics for the
/// kinds we can fold; returns `None` for object/array (which JS would map
/// to `"[object Object]"` / `"a,b,c"`-style strings — not useful for style
/// extraction).
fn coerce_to_string(lit: &Literal) -> Option<String> {
    match lit {
        Literal::String(s) => Some(s.clone()),
        Literal::Number(n) => Some(number_to_js_string(*n)),
        Literal::Bool(b) => Some(if *b { "true".into() } else { "false".into() }),
        Literal::Null => Some("null".into()),
        Literal::Object(_) | Literal::Array(_) => None,
    }
}

/// JS `ToNumber` for literal values. Returns `None` when JS would yield
/// `NaN` (e.g. `Number('foo')`) — we'd rather drop the extraction than
/// emit `NaN`, which doesn't round-trip through JSON.
fn coerce_to_number(lit: &Literal) -> Option<f64> {
    match lit {
        Literal::Number(n) => Some(*n),
        Literal::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
        Literal::Null => Some(0.0),
        Literal::String(s) => {
            let trimmed = s.trim();
            if trimmed.is_empty() {
                Some(0.0)
            } else {
                trimmed.parse::<f64>().ok()
            }
        }
        Literal::Object(_) | Literal::Array(_) => None,
    }
}

fn number_to_js_string(value: f64) -> String {
    if fits_as_integer(value) {
        #[allow(clippy::cast_possible_truncation, reason = "bounds checked")]
        return (value as i64).to_string();
    }
    value.to_string()
}
