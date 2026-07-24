//! Oxc-based parsing of transform-time source fragments (object literals, call
//! expressions), so the transform reads structure from a real AST instead of
//! hand-scanning strings.

use oxc_allocator::Allocator;
use oxc_ast::ast::{Expression, LogicalOperator, ObjectPropertyKind, PropertyKey};
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

/// A parsed `cond && obj` fragment.
pub struct FragmentLogicalAnd {
    pub condition: String,
    pub consequent: String,
}

/// A parsed `left || right` or `left ?? right` fragment.
pub struct FragmentLogicalOrNullish {
    pub left: String,
    pub right: String,
    pub operator: LogicalOrNullishOp,
}

/// Top-level `||` vs `??` (not `&&`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogicalOrNullishOp {
    Or,
    Coalesce,
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
    let expression = parse_fragment(&allocator, source)?;
    let Expression::ObjectExpression(object) = expression.get_inner_expression() else {
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
    let Some(expr) = parse_fragment(&allocator, source) else {
        return false;
    };
    matches!(
        expr.get_inner_expression(),
        Expression::LogicalExpression(_)
    )
}

/// Parse a ternary fragment (`test ? a : b`) and return its three parts.
#[must_use]
pub fn parse_ternary_fragment(source: &str) -> Option<FragmentTernary> {
    let allocator = Allocator::default();
    let expr = parse_fragment(&allocator, source)?;
    let Expression::ConditionalExpression(ternary) = expr.get_inner_expression() else {
        return None;
    };
    Some(FragmentTernary {
        condition: slice(source, ternary.test.span())?,
        consequent: slice(source, ternary.consequent.span())?,
        alternate: slice(source, ternary.alternate.span())?,
    })
}

/// Parse a `cond && obj` fragment. Returns `None` when the operator is not `&&`.
#[must_use]
pub fn parse_logical_and_fragment(source: &str) -> Option<FragmentLogicalAnd> {
    let allocator = Allocator::default();
    let expr = parse_fragment(&allocator, source)?;
    let Expression::LogicalExpression(logical) = expr.get_inner_expression() else {
        return None;
    };
    if !matches!(logical.operator, LogicalOperator::And) {
        return None;
    }
    Some(FragmentLogicalAnd {
        condition: slice(source, logical.left.span())?,
        consequent: slice(source, logical.right.span())?,
    })
}

/// Parse a top-level `left || right` or `left ?? right` fragment.
#[must_use]
pub fn parse_logical_or_nullish_fragment(source: &str) -> Option<FragmentLogicalOrNullish> {
    let allocator = Allocator::default();
    let expr = parse_fragment(&allocator, source)?;
    let Expression::LogicalExpression(logical) = expr.get_inner_expression() else {
        return None;
    };
    let operator = match logical.operator {
        LogicalOperator::Or => LogicalOrNullishOp::Or,
        LogicalOperator::Coalesce => LogicalOrNullishOp::Coalesce,
        LogicalOperator::And => return None,
    };
    Some(FragmentLogicalOrNullish {
        left: slice(source, logical.left.span())?,
        right: slice(source, logical.right.span())?,
        operator,
    })
}

fn static_key(key: &PropertyKey<'_>) -> Option<String> {
    key.static_name().map(std::borrow::Cow::into_owned)
}
