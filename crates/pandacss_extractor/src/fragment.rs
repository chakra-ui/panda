//! Oxc-based parsing of transform-time source fragments (object literals, call
//! expressions), so the transform reads structure from a real AST instead of
//! hand-scanning strings.

use oxc_allocator::Allocator;
use oxc_ast::ast::{Expression, ObjectPropertyKind, PropertyKey};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

/// One property of a parsed object-literal fragment.
pub struct FragmentProperty {
    /// `None` for a spread or a computed key.
    pub key: Option<String>,
    /// Source of the whole `key: value` (or `...expr`).
    pub raw: String,
    pub spread: bool,
    /// Value is a nested object literal (`key: { … }`).
    pub value_is_dynamic: bool,
    /// Source of just the value (`None` for a spread).
    pub value_raw: Option<String>,
}

/// A parsed call-expression fragment.
pub struct FragmentCall {
    pub callee: String,
    /// Source of each argument, in order.
    pub args: Vec<String>,
}

/// A parsed conditional (ternary) fragment.
pub struct FragmentTernary {
    pub condition: String,
    pub consequent: String,
    pub alternate: String,
}

fn parse_fragment<'a>(allocator: &'a Allocator, source: &'a str) -> Option<Expression<'a>> {
    Parser::new(allocator, source, SourceType::tsx())
        .parse_expression()
        .ok()
}

fn slice(source: &str, span: Span) -> Option<String> {
    let start = usize::try_from(span.start).ok()?;
    let end = usize::try_from(span.end).ok()?;
    Some(source.get(start..end)?.to_owned())
}

/// Parse an object-literal fragment (`{ … }`) and return its properties.
#[must_use]
pub fn parse_object_fragment(source: &str) -> Option<Vec<FragmentProperty>> {
    let allocator = Allocator::default();
    let Expression::ObjectExpression(object) = parse_fragment(&allocator, source)? else {
        return None;
    };
    let mut properties = Vec::with_capacity(object.properties.len());
    for property in &object.properties {
        match property {
            ObjectPropertyKind::ObjectProperty(prop) => properties.push(FragmentProperty {
                key: static_key(&prop.key),
                raw: slice(source, prop.span)?,
                spread: false,
                value_is_dynamic: matches!(prop.value, Expression::ObjectExpression(_)),
                value_raw: slice(source, prop.value.span()),
            }),
            ObjectPropertyKind::SpreadProperty(spread) => properties.push(FragmentProperty {
                key: None,
                raw: slice(source, spread.span)?,
                spread: true,
                value_is_dynamic: true,
                value_raw: None,
            }),
        }
    }
    Some(properties)
}

/// Parse a call-expression fragment (`callee(arg, …)`) and return callee + args.
#[must_use]
pub fn parse_call_fragment(source: &str) -> Option<FragmentCall> {
    let allocator = Allocator::default();
    let Expression::CallExpression(call) = parse_fragment(&allocator, source)? else {
        return None;
    };
    let callee = slice(source, call.callee.span())?;
    let args = call
        .arguments
        .iter()
        .map(|arg| slice(source, arg.span()))
        .collect::<Option<Vec<_>>>()?;
    Some(FragmentCall { callee, args })
}

/// `true` when the fragment is a top-level logical expression (`a && b`,
/// `a || b`, `a ?? b`).
#[must_use]
pub fn is_logical_expression(source: &str) -> bool {
    let allocator = Allocator::default();
    matches!(
        parse_fragment(&allocator, source),
        Some(Expression::LogicalExpression(_))
    )
}

/// Parse a ternary fragment (`test ? a : b`) and return its three parts.
#[must_use]
pub fn parse_ternary_fragment(source: &str) -> Option<FragmentTernary> {
    let allocator = Allocator::default();
    let Expression::ConditionalExpression(ternary) = parse_fragment(&allocator, source)? else {
        return None;
    };
    Some(FragmentTernary {
        condition: slice(source, ternary.test.span())?,
        consequent: slice(source, ternary.consequent.span())?,
        alternate: slice(source, ternary.alternate.span())?,
    })
}

fn static_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
        PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
        _ => None,
    }
}
