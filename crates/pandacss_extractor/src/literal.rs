//! Typed literal values read out of source by the extractor.
//!
//! `Literal` preserves intent (static literal, not arbitrary JSON), keeps
//! object-key insertion order, and is the entry point for static evaluation.
//! Serialization goes through the custom `Serialize` impl below to preserve
//! the integer/float distinction the JS extractor emits.
//!
//! With a [`Resolver`] supplied (the production hot path via `extract()`),
//! `expression_to_literal` folds primitives, objects, arrays, spreads,
//! syntactic unwraps (paren, `as`, `satisfies`, `!`), constant folding
//! (unary/binary/logical/conditional/template), scope resolution
//! (identifiers, static/computed members, indexing), optional chains,
//! tagged templates, and `token()` / `token.var()` calls. Without a
//! resolver only pure-literal expressions fold.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, BinaryExpression, BinaryOperator, CallExpression,
    ChainElement, ChainExpression, ComputedMemberExpression, ConditionalExpression, Expression,
    LogicalExpression, LogicalOperator, ObjectExpression, ObjectPropertyKind, PropertyKey,
    PropertyKind, StaticMemberExpression, TaggedTemplateExpression, TemplateLiteral,
    UnaryExpression, UnaryOperator,
};
use serde::ser::{SerializeMap, SerializeSeq};
use serde::{Serialize, Serializer};

use pandacss_shared::{is_js_safe_integer, number_to_js_string};

use crate::Resolver;

#[derive(Debug, Clone, PartialEq)]
pub enum Literal {
    String(String),
    /// A resolved `token()` / `token.var()` call. `value` is the CSS value the
    /// current config emits; `path` preserves token identity for build info.
    Token {
        path: String,
        value: String,
    },
    Number(f64),
    Bool(bool),
    Null,
    /// Keys in source order. `Vec` because extraction never looks up by key;
    /// downstream code that does can build its own index.
    Object(Vec<(String, Literal)>),
    Array(Vec<Literal>),
    /// Branches from a ternary or logical expression whose deciding side
    /// isn't statically known. The encoder emits each branch under a
    /// different runtime condition. Serializes as
    /// `{ "kind": "conditional", "branches": [...] }`.
    Conditional(Vec<Literal>),
}

impl Literal {
    // PERF(port): O(n²) on object construction (linear scan per insert).
    // Deliberately kept: real style objects rarely exceed ~50 keys, where
    // the Vec scan beats a HashMap on cache locality and zero allocation.
    // Bench before swapping; HashMap wins around n=128 for String keys.
    pub fn upsert_object_entry(entries: &mut Vec<(String, Self)>, key: String, value: Self) {
        if let Some(entry) = entries.iter_mut().find(|(existing, _)| existing == &key) {
            entry.1 = value;
        } else {
            entries.push((key, value));
        }
    }

    /// Accumulate a value into `entries` instead of overwriting: if the key
    /// already holds a value, keep both as `Conditional` alternatives. Used for
    /// conditional-spread branches (`...(cond ? a : b)`) so each branch's keys
    /// stay separately applicable and the encoder emits the union of atoms —
    /// node models these as separate `spreadConditions` objects.
    pub(crate) fn combine_object_entry(
        entries: &mut Vec<(String, Self)>,
        key: String,
        value: Self,
    ) {
        if let Some(entry) = entries.iter_mut().find(|(existing, _)| existing == &key) {
            let prev = std::mem::replace(&mut entry.1, Self::Null);
            entry.1 = prev.combine_alternative(value);
        } else {
            entries.push((key, value));
        }
    }

    /// Fold two values into a flat `Conditional` of alternatives.
    fn combine_alternative(self, other: Self) -> Self {
        let mut branches = match self {
            Self::Conditional(existing) => existing,
            single => vec![single],
        };
        match other {
            Self::Conditional(more) => branches.extend(more),
            single => branches.push(single),
        }
        Self::Conditional(branches)
    }

    #[must_use]
    pub fn to_json(&self) -> serde_json::Value {
        match self {
            Self::String(s) => serde_json::Value::String(s.clone()),
            Self::Token { value, .. } => serde_json::Value::String(value.clone()),
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
            Self::Conditional(branches) => {
                let mut map = serde_json::Map::with_capacity(2);
                map.insert(
                    "kind".into(),
                    serde_json::Value::String("conditional".into()),
                );
                map.insert(
                    "branches".into(),
                    serde_json::Value::Array(branches.iter().map(Self::to_json).collect()),
                );
                serde_json::Value::Object(map)
            }
        }
    }
}

impl Serialize for Literal {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::String(s) => serializer.serialize_str(s),
            Self::Token { value, .. } => serializer.serialize_str(value),
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
            Self::Conditional(branches) => {
                let mut map = serializer.serialize_map(Some(2))?;
                map.serialize_entry("kind", "conditional")?;
                map.serialize_entry("branches", branches)?;
                map.end()
            }
        }
    }
}

#[allow(
    clippy::cast_possible_truncation,
    reason = "bounds checked against Number.MAX_SAFE_INTEGER"
)]
fn serialize_number<S: Serializer>(value: f64, serializer: S) -> Result<S::Ok, S::Error> {
    if is_js_safe_integer(value) {
        serializer.serialize_i64(value as i64)
    } else {
        serializer.serialize_f64(value)
    }
}

#[allow(
    clippy::cast_possible_truncation,
    reason = "bounds checked against Number.MAX_SAFE_INTEGER"
)]
fn json_number(value: f64) -> Option<serde_json::Value> {
    if is_js_safe_integer(value) {
        Some(serde_json::Value::Number(serde_json::Number::from(
            value as i64,
        )))
    } else {
        serde_json::Number::from_f64(value).map(serde_json::Value::Number)
    }
}

/// Fold an expression to a `Literal` if it resolves to a static value.
///
/// Pass `None` for `resolver` only in unit tests that exercise pure literal
/// folding. Production `extract()` paths always supply a resolver, which
/// unlocks identifier references, shorthand props, and member access on
/// resolved objects/arrays.
pub(crate) fn expression_to_literal(
    expr: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    match expr {
        Expression::StringLiteral(s) => Some(Literal::String(collapse_whitespace(&s.value))),
        Expression::NumericLiteral(n) => Some(Literal::Number(n.value)),
        Expression::BooleanLiteral(b) => Some(Literal::Bool(b.value)),
        Expression::NullLiteral(_) => Some(Literal::Null),

        Expression::ObjectExpression(obj) => object_to_literal(obj, resolver),
        Expression::ArrayExpression(arr) => array_to_literal(arr, resolver),

        // Syntactic no-ops — recurse on the inner expression.
        Expression::ParenthesizedExpression(p) => expression_to_literal(&p.expression, resolver),
        Expression::TSAsExpression(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSSatisfiesExpression(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSNonNullExpression(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSTypeAssertion(e) => expression_to_literal(&e.expression, resolver),
        Expression::TSInstantiationExpression(e) => expression_to_literal(&e.expression, resolver),

        Expression::UnaryExpression(u) => eval_unary(u, resolver),
        Expression::BinaryExpression(b) => eval_binary(b, resolver),
        Expression::LogicalExpression(l) => eval_logical(l, resolver),
        Expression::ConditionalExpression(c) => eval_conditional(c, resolver),
        Expression::TemplateLiteral(t) => template_literal_to_literal(t, resolver),

        Expression::Identifier(ident) => resolver?.resolve_identifier(ident),
        Expression::StaticMemberExpression(member) => static_member_to_literal(member, resolver),
        Expression::ComputedMemberExpression(member) => {
            computed_member_to_literal(member, resolver)
        }

        // `a?.b` — treat as transparent unwrap. A non-resolvable base
        // returns `None`, which we accept as "short-circuited to undefined".
        Expression::ChainExpression(chain) => chain_to_literal(chain, resolver),

        // Tag identity is ignored — downstream extraction decides whether
        // the call site is a Panda usage.
        Expression::TaggedTemplateExpression(t) => tagged_template_to_literal(t, resolver),

        // Only `token(...)` / `token.var(...)` fold here; resolver gates
        // against locally-shadowed names.
        Expression::CallExpression(call) => call_to_literal(call, resolver),

        _ => None,
    }
}

/// Collapse runs of whitespace to a single space (like JS `trimWhitespace`), but
/// leave whitespace *inside* quoted substrings untouched — it's significant for
/// `content`, quoted font names, etc. (node collapses those too and loses it).
pub(crate) fn collapse_whitespace(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut quote: Option<char> = None;
    for ch in value.chars() {
        if let Some(open) = quote {
            out.push(ch);
            if ch == open {
                quote = None;
            }
        } else if ch == '"' || ch == '\'' {
            quote = Some(ch);
            out.push(ch);
        } else if !ch.is_whitespace() {
            out.push(ch);
        } else if !out.ends_with(' ') {
            out.push(' ');
        }
    }
    out
}

pub(crate) fn object_to_literal(
    obj: &ObjectExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    // PORT NOTE: lenient per-member folding to match the JS extractor. A
    // property whose key or value doesn't fold (a dynamic value, an
    // unresolvable spread) is *skipped*, not fatal — the static siblings still
    // extract. e.g. `css({ color: 'red', width: props.w })` keeps `color`, and
    // `sva({ slots: [...anatomy.keys()], base })` keeps `base` (slots infer).
    let mut entries: Vec<(String, Literal)> = Vec::with_capacity(obj.properties.len());
    // Conditional-spread keys accumulate here, separate from the regular
    // last-wins `entries`, and fold in *after* every property is processed. node
    // tracks these as a standalone `spreadConditions` channel that a later
    // static key can't overwrite, so the branch values survive regardless of
    // where the spread sits in the object literal.
    let mut spread_conditions: Vec<(String, Literal)> = Vec::new();
    for prop in &obj.properties {
        match prop {
            ObjectPropertyKind::ObjectProperty(prop) => {
                // Getters / setters / methods can't be statically evaluated — skip.
                if prop.method || prop.kind != PropertyKind::Init {
                    continue;
                }
                let Some(key) = property_key_to_string(&prop.key, prop.computed, resolver) else {
                    continue;
                };
                let Some(value) = expression_to_literal(&prop.value, resolver) else {
                    continue;
                };
                Literal::upsert_object_entry(&mut entries, key, value);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                match expression_to_literal(&spread.argument, resolver) {
                    // A static object spread overrides earlier keys (last-wins).
                    Some(Literal::Object(inner_entries)) => {
                        for (k, v) in inner_entries {
                            Literal::upsert_object_entry(&mut entries, k, v);
                        }
                    }
                    // A conditional spread (`...(cond ? a : b)`) contributes each
                    // branch's keys as separately-applicable styles; accumulate
                    // every branch value per key into the spread channel.
                    Some(Literal::Conditional(branches)) => {
                        for branch in branches {
                            if let Literal::Object(inner_entries) = branch {
                                for (k, v) in inner_entries {
                                    Literal::combine_object_entry(&mut spread_conditions, k, v);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    // Union the conditional-spread values into the final object — combining (not
    // overwriting) so a colliding static value is kept alongside the branches.
    for (k, v) in spread_conditions {
        Literal::combine_object_entry(&mut entries, k, v);
    }

    // An object whose members were *all* unresolvable carries nothing static to
    // extract: drop it so a fully-dynamic call doesn't emit a phantom empty
    // style. An explicitly-empty `{}` (no properties) still resolves to `{}`.
    if entries.is_empty() && !obj.properties.is_empty() {
        return None;
    }
    Some(Literal::Object(entries))
}

fn array_to_literal(
    arr: &ArrayExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    let mut items = Vec::with_capacity(arr.elements.len());
    for element in &arr.elements {
        match element {
            ArrayExpressionElement::Elision(_) => items.push(Literal::Null),
            ArrayExpressionElement::SpreadElement(spread) => {
                let inner = expression_to_literal(&spread.argument, resolver)?;
                let Literal::Array(inner_items) = inner else {
                    return None;
                };
                items.extend(inner_items);
            }
            // An unresolvable or `undefined` element holds its slot as `Null`
            // (like an elision) rather than dropping the whole array, so later
            // responsive values keep their breakpoint positions — matching node.
            _ => items.push(
                element
                    .as_expression()
                    .and_then(|expr| expression_to_literal(expr, resolver))
                    .unwrap_or(Literal::Null),
            ),
        }
    }
    Some(Literal::Array(items))
}

pub(crate) fn property_key_to_string(
    key: &PropertyKey<'_>,
    computed: bool,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<String> {
    if !computed {
        return match key {
            PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
            PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
            PropertyKey::NumericLiteral(n) => Some(number_as_key(n.value)),
            _ => None,
        };
    }
    let expr = key.as_expression()?;
    match expression_to_literal(expr, resolver)? {
        Literal::String(s) | Literal::Token { value: s, .. } => Some(s),
        Literal::Number(n) => Some(number_as_key(n)),
        _ => None,
    }
}

fn static_member_to_literal(
    member: &StaticMemberExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    let object = expression_to_literal(&member.object, resolver)?;
    lookup_member(&object, member.property.name.as_str())
}

fn computed_member_to_literal(
    member: &ComputedMemberExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    let object = expression_to_literal(&member.object, resolver)?;
    let key_literal = expression_to_literal(&member.expression, resolver)?;
    let key = match key_literal {
        Literal::String(s) | Literal::Token { value: s, .. } => s,
        Literal::Number(n) => number_as_key(n),
        // `obj[true]` / `obj[null]` are valid JS but don't show up in real
        // Panda code — drop to keep the surface narrow.
        _ => return None,
    };
    lookup_member(&object, &key)
}

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

fn chain_to_literal(
    chain: &ChainExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    match &chain.expression {
        ChainElement::StaticMemberExpression(member) => static_member_to_literal(member, resolver),
        ChainElement::ComputedMemberExpression(member) => {
            computed_member_to_literal(member, resolver)
        }
        ChainElement::TSNonNullExpression(e) => expression_to_literal(&e.expression, resolver),
        // Calls don't fold; private fields aren't meaningful for style extraction.
        ChainElement::CallExpression(_) | ChainElement::PrivateFieldExpression(_) => None,
    }
}

fn tagged_template_to_literal(
    t: &TaggedTemplateExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    template_literal_to_literal(&t.quasi, resolver)
}

fn call_to_literal(
    call: &CallExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    let resolver = resolver?;
    resolver
        .resolve_token_call(call)
        .or_else(|| resolver.resolve_raw_style_call(call))
}

fn number_as_key(value: f64) -> String {
    number_to_js_string(value)
}

fn eval_unary(u: &UnaryExpression<'_>, resolver: Option<&Resolver<'_, '_>>) -> Option<Literal> {
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
        // `typeof`, `void`, `delete` aren't useful for static extraction.
        _ => None,
    }
}

fn eval_binary(b: &BinaryExpression<'_>, resolver: Option<&Resolver<'_, '_>>) -> Option<Literal> {
    let left = expression_to_literal(&b.left, resolver)?;
    let right = expression_to_literal(&b.right, resolver)?;
    match b.operator {
        BinaryOperator::Addition => {
            // JS `+`: any string operand → concatenation, else numeric add.
            if is_string_like(&left) || is_string_like(&right) {
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
            // Drop Infinity / NaN — neither round-trips usefully into CSS.
            if r == 0.0 {
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

/// JS `===` for the literal subset. Object/array literals always compare
/// unequal (reference identity); cross-type pairs are always `false`.
fn strict_eq(a: &Literal, b: &Literal) -> bool {
    match (a, b) {
        (Literal::Null, Literal::Null) => true,
        (Literal::String(x), Literal::String(y)) => x == y,
        (left, right) if is_string_like(left) && is_string_like(right) => {
            coerce_to_string(left) == coerce_to_string(right)
        }
        // f64 `==` already yields false for NaN == NaN, matching JS.
        (Literal::Number(x), Literal::Number(y)) => x == y,
        (Literal::Bool(x), Literal::Bool(y)) => x == y,
        _ => false,
    }
}

/// JS `==`, restricted to literal-on-literal. Mixed object/array cases
/// return `None` — they'd need runtime `ToPrimitive` we don't model.
fn loose_eq(a: &Literal, b: &Literal) -> Option<bool> {
    if matches!(
        (a, b),
        (Literal::Null, Literal::Null)
            | (
                Literal::String(_) | Literal::Token { .. },
                Literal::String(_) | Literal::Token { .. },
            )
            | (Literal::Number(_), Literal::Number(_))
            | (Literal::Bool(_), Literal::Bool(_))
    ) {
        return Some(strict_eq(a, b));
    }
    match (a, b) {
        // null == undefined; we model both as Null.
        (Literal::Null, _) | (_, Literal::Null) => Some(false),
        (Literal::String(s) | Literal::Token { value: s, .. }, Literal::Number(n))
        | (Literal::Number(n), Literal::String(s) | Literal::Token { value: s, .. }) => {
            Some(s.trim().parse::<f64>().is_ok_and(|sn| sn == *n))
        }
        (Literal::Bool(b1), other) | (other, Literal::Bool(b1)) => {
            let coerced = Literal::Number(if *b1 { 1.0 } else { 0.0 });
            loose_eq(&coerced, other)
        }
        _ => None,
    }
}

/// JS `<`: lexicographic for two strings, else numeric with `ToNumber`
/// coercion. `None` when coercion fails on either side.
fn less_than(a: &Literal, b: &Literal) -> Option<bool> {
    if is_string_like(a) && is_string_like(b) {
        return Some(coerce_to_string(a)? < coerce_to_string(b)?);
    }
    let l = coerce_to_number(a)?;
    let r = coerce_to_number(b)?;
    Some(l < r)
}

fn eval_logical(l: &LogicalExpression<'_>, resolver: Option<&Resolver<'_, '_>>) -> Option<Literal> {
    // Left folds → short-circuit to the chosen side.
    if let Some(left) = expression_to_literal(&l.left, resolver) {
        return match l.operator {
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
                if matches!(left, Literal::Null) {
                    expression_to_literal(&l.right, resolver)
                } else {
                    Some(left)
                }
            }
        };
    }
    // Left didn't fold: it's the dynamic condition / short-circuit value, not a
    // style alternative. For `&&`/`||`/`??` the only extractable style is the
    // right operand (matches node's `maybeResolveConditionalExpression`).
    expression_to_literal(&l.right, resolver)
}

fn eval_conditional(
    c: &ConditionalExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    if let Some(test) = expression_to_literal(&c.test, resolver) {
        return if truthy(&test) {
            expression_to_literal(&c.consequent, resolver)
        } else {
            expression_to_literal(&c.alternate, resolver)
        };
    }
    conditional_from_branches(&c.consequent, &c.alternate, resolver)
}

/// Resolve a ternary's two branches the way node's `maybeResolveConditionalExpression`
/// does: keep whatever folds. Both fold → `Conditional` alternatives (collapsed
/// to one when equal); only one folds → that branch alone (the other is dynamic,
/// but the static branch is still a possible value worth emitting); neither
/// folds → drop.
fn conditional_from_branches(
    a: &Expression<'_>,
    b: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    match (
        expression_to_literal(a, resolver),
        expression_to_literal(b, resolver),
    ) {
        (Some(left), Some(right)) if left == right => Some(left),
        (Some(left), Some(right)) => Some(Literal::Conditional(vec![left, right])),
        (Some(only), None) | (None, Some(only)) => Some(only),
        (None, None) => None,
    }
}

pub(crate) fn template_literal_to_literal(
    t: &TemplateLiteral<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    let mut out = String::new();
    for (i, expr) in t.expressions.iter().enumerate() {
        let quasi = t.quasis.get(i)?;
        out.push_str(quasi.value.cooked.as_ref()?.as_str());
        let value = expression_to_literal(expr, resolver)?;
        let stringified = coerce_to_string(&value)?;
        out.push_str(&stringified);
    }
    let tail = t.quasis.last()?;
    out.push_str(tail.value.cooked.as_ref()?.as_str());
    Some(Literal::String(out))
}

fn truthy(value: &Literal) -> bool {
    match value {
        Literal::Null => false,
        Literal::Bool(b) => *b,
        Literal::Number(n) => *n != 0.0 && !n.is_nan(),
        Literal::String(s) | Literal::Token { value: s, .. } => !s.is_empty(),
        Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => true,
    }
}

/// JS `ToString` for the kinds we fold. Object/array/conditional return
/// `None` — `[object Object]` and `"a,b,c"` aren't useful for styles, and
/// `Conditional` has no single string form.
fn coerce_to_string(lit: &Literal) -> Option<String> {
    match lit {
        Literal::String(s) | Literal::Token { value: s, .. } => Some(s.clone()),
        Literal::Number(n) => Some(number_to_js_string(*n)),
        Literal::Bool(b) => Some(if *b { "true".into() } else { "false".into() }),
        Literal::Null => Some("null".into()),
        Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
    }
}

/// JS `ToNumber`. Returns `None` where JS would yield `NaN` — we drop
/// rather than emit a value that doesn't round-trip through JSON.
fn coerce_to_number(lit: &Literal) -> Option<f64> {
    match lit {
        Literal::Number(n) => Some(*n),
        Literal::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
        Literal::Null => Some(0.0),
        Literal::String(s) | Literal::Token { value: s, .. } => {
            let trimmed = s.trim();
            if trimmed.is_empty() {
                Some(0.0)
            } else {
                trimmed.parse::<f64>().ok()
            }
        }
        Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
    }
}

/// Token literals behave like strings for JS coercion/equality but keep a
/// separate path for build-info identity.
fn is_string_like(value: &Literal) -> bool {
    matches!(value, Literal::String(_) | Literal::Token { .. })
}
