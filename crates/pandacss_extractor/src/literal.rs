//! Typed literal values read out of source, and the fold from an Oxc
//! `Expression` to a `Literal`.
//!
//! With a [`Resolver`], `expression_to_literal` also folds identifiers,
//! member access, and `token()` calls. Without one, only pure literals fold.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, BinaryExpression, BinaryOperator, CallExpression,
    ChainElement, ChainExpression, ComputedMemberExpression, ConditionalExpression, Expression,
    IdentifierReference, LogicalExpression, LogicalOperator, ObjectExpression, ObjectPropertyKind,
    PropertyKey, PropertyKind, StaticMemberExpression, TaggedTemplateExpression, TemplateLiteral,
    UnaryExpression, UnaryOperator,
};
use pandacss_literal::Literal;
use pandacss_shared::number_to_js_string;

use crate::Resolver;

/// Fold an expression to a `Literal` if it resolves to a static value.
/// `resolver` is `None` only in unit tests exercising pure literal folding —
/// production `extract()` always supplies one, unlocking identifiers, member
/// access, and shorthand props.
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

        Expression::Identifier(ident) => fold_identifier(ident, resolver),
        Expression::StaticMemberExpression(member) => static_member_to_literal(member, resolver),
        Expression::ComputedMemberExpression(member) => {
            computed_member_to_literal(member, resolver)
        }

        // `a?.b`: an unresolvable base is treated as short-circuited to undefined.
        Expression::ChainExpression(chain) => chain_to_literal(chain, resolver),

        // Tag identity is ignored; the caller decides if this is a Panda usage.
        Expression::TaggedTemplateExpression(t) => tagged_template_to_literal(t, resolver),

        // Only `token(...)` / `token.var(...)` fold; resolver gates shadowing.
        Expression::CallExpression(call) => call_to_literal(call, resolver),

        _ => None,
    }
}

/// Collapse whitespace runs to a single space, like JS `trimWhitespace` —
/// except *inside* quoted substrings, which stay untouched even though node
/// collapses (and loses) them too. Matters for `content`, quoted font names.
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
    // PORT NOTE: folding is lenient per-member, matching the JS extractor. A
    // property that doesn't fold is skipped, not fatal, so static siblings
    // still extract (`css({ color: 'red', width: props.w })` keeps `color`).
    let mut entries: Vec<(String, Literal)> = Vec::with_capacity(obj.properties.len());

    // Conditional-spread keys land here instead of `entries` and fold in after
    // every property, so a later static key can't overwrite a branch value —
    // this is node's standalone `spreadConditions` channel.
    let mut spread_conditions: Vec<(String, Literal)> = Vec::new();

    for prop in &obj.properties {
        match prop {
            ObjectPropertyKind::ObjectProperty(prop) => {
                // Getters, setters, and methods can't be statically evaluated.
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
                    // `...(cond ? a : b)`: each branch's keys stay separately
                    // applicable, so accumulate them in the spread channel.
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

    // Combine, don't overwrite — a colliding static value survives alongside the branches.
    for (k, v) in spread_conditions {
        Literal::combine_object_entry(&mut entries, k, v);
    }

    // All members unresolvable → nothing static to extract, so drop it rather
    // than emit a phantom empty style. An explicit `{}` still resolves to `{}`.
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
            // An unresolvable/`undefined` element holds its slot as `Null`
            // instead of dropping the array, so later breakpoints keep their
            // position — matches node.
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
    expression_to_literal(expr, resolver)?.to_property_key()
}

fn static_member_to_literal(
    member: &StaticMemberExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    let object = expression_to_literal(&member.object, resolver)?;
    object.get_member(member.property.name.as_str())
}

fn computed_member_to_literal(
    member: &ComputedMemberExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    let object = expression_to_literal(&member.object, resolver)?;
    let key_literal = expression_to_literal(&member.expression, resolver)?;
    let key = key_literal.to_property_key()?;
    object.get_member(&key)
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
        // Calls don't fold; private fields aren't style-relevant.
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
        .or_else(|| resolver.resolve_first_that_works_call(call))
        .or_else(|| resolver.resolve_css_value_factory_call(call))
        .or_else(|| resolver.resolve_raw_style_call(call))
        .or_else(|| resolver.resolve_imported_recipe_raw_call(call))
        .or_else(|| resolver.resolve_pure_call(call))
}

fn number_as_key(value: f64) -> String {
    number_to_js_string(value)
}

/// Fold an identifier. Bound locals use [`Resolver`]; free global `undefined`
/// is modeled as [`Literal::Null`] (same as array slots / `null == undefined`).
/// A local binding named `undefined` that fails to resolve stays open.
fn fold_identifier(
    ident: &IdentifierReference<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    if let Some(r) = resolver {
        if let Some(lit) = r.resolve_identifier(ident) {
            return Some(lit);
        }
        if r.symbol_for_identifier(ident).is_some() {
            return None;
        }
    }
    if ident.name.as_str() == "undefined" {
        return Some(Literal::Null);
    }
    None
}

fn eval_unary(u: &UnaryExpression<'_>, resolver: Option<&Resolver<'_, '_>>) -> Option<Literal> {
    let inner = expression_to_literal(&u.argument, resolver)?;
    match (u.operator, inner) {
        (UnaryOperator::UnaryPlus, Literal::Number(n)) => Some(Literal::Number(n)),
        (UnaryOperator::UnaryNegation, Literal::Number(n)) => Some(Literal::Number(-n)),
        (UnaryOperator::LogicalNot, value) => Some(Literal::Bool(!value.is_truthy())),
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
            if left.is_string_like() || right.is_string_like() {
                let l = left.to_loose_string()?;
                let r = right.to_loose_string()?;
                Some(Literal::String(format!("{l}{r}")))
            } else {
                let l = left.to_number()?;
                let r = right.to_number()?;
                Some(Literal::Number(l + r))
            }
        }
        BinaryOperator::Subtraction => {
            let l = left.to_number()?;
            let r = right.to_number()?;
            Some(Literal::Number(l - r))
        }
        BinaryOperator::Multiplication => {
            let l = left.to_number()?;
            let r = right.to_number()?;
            Some(Literal::Number(l * r))
        }
        BinaryOperator::Division => {
            let l = left.to_number()?;
            let r = right.to_number()?;
            // Drop Infinity / NaN — neither round-trips usefully into CSS.
            if r == 0.0 {
                return None;
            }
            Some(Literal::Number(l / r))
        }
        BinaryOperator::Remainder => {
            let l = left.to_number()?;
            let r = right.to_number()?;
            if r == 0.0 {
                return None;
            }
            Some(Literal::Number(l % r))
        }
        BinaryOperator::Exponential => {
            let l = left.to_number()?;
            let r = right.to_number()?;
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

/// JS `===`. Objects/arrays compare unequal (reference identity); cross-type
/// pairs are always `false`.
pub(crate) fn strict_eq(a: &Literal, b: &Literal) -> bool {
    match (a, b) {
        (Literal::Null, Literal::Null) => true,
        (Literal::String(x), Literal::String(y)) => x == y,
        (left, right) if left.is_string_like() && right.is_string_like() => {
            left.to_loose_string() == right.to_loose_string()
        }
        // f64 `==` already yields false for NaN == NaN, matching JS.
        (Literal::Number(x), Literal::Number(y)) => x == y,
        (Literal::Bool(x), Literal::Bool(y)) => x == y,
        _ => false,
    }
}

/// JS `==` for literals. Mixed object/array pairs return `None` — they'd
/// need runtime `ToPrimitive`, which we don't model.
pub(crate) fn loose_eq(a: &Literal, b: &Literal) -> Option<bool> {
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
        (left, Literal::Number(n)) | (Literal::Number(n), left) if left.is_string_like() => left
            .to_loose_string()
            .and_then(|s| s.trim().parse::<f64>().ok())
            .map(|sn| sn == *n),
        (Literal::Bool(b1), other) | (other, Literal::Bool(b1)) => {
            let coerced = Literal::Number(if *b1 { 1.0 } else { 0.0 });
            loose_eq(&coerced, other)
        }
        _ => None,
    }
}

/// JS `<`: lexicographic for two strings, else `ToNumber`-coerced. `None`
/// if coercion fails on either side.
pub(crate) fn less_than(a: &Literal, b: &Literal) -> Option<bool> {
    if a.is_string_like() && b.is_string_like() {
        return Some(a.to_loose_string()? < b.to_loose_string()?);
    }
    let l = a.to_number()?;
    let r = b.to_number()?;
    Some(l < r)
}

fn eval_logical(l: &LogicalExpression<'_>, resolver: Option<&Resolver<'_, '_>>) -> Option<Literal> {
    if let Some(left) = expression_to_literal(&l.left, resolver) {
        return match l.operator {
            LogicalOperator::And => {
                if left.is_truthy() {
                    expression_to_literal(&l.right, resolver)
                } else {
                    Some(left)
                }
            }
            LogicalOperator::Or => {
                if left.is_truthy() {
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
    // Left didn't fold, so it's a dynamic condition, not a style alternative —
    // the right operand is the only extractable style (node's
    // `maybeResolveConditionalExpression` does the same).
    expression_to_literal(&l.right, resolver)
}

fn eval_conditional(
    c: &ConditionalExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Literal> {
    if let Some(test) = expression_to_literal(&c.test, resolver) {
        return if test.is_truthy() {
            expression_to_literal(&c.consequent, resolver)
        } else {
            expression_to_literal(&c.alternate, resolver)
        };
    }
    pandacss_literal::merge_optional_branches(
        expression_to_literal(&c.consequent, resolver),
        expression_to_literal(&c.alternate, resolver),
    )
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
        let stringified = value.to_loose_string()?;
        out.push_str(&stringified);
    }
    let tail = t.quasis.last()?;
    out.push_str(tail.value.cooked.as_ref()?.as_str());
    Some(Literal::String(collapse_whitespace(&out).trim().to_owned()))
}
