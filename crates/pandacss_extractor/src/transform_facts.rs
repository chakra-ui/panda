use oxc_ast::ast::{
    CallExpression, Expression, LogicalOperator, ObjectExpression, ObjectPropertyKind, PropertyKey,
};
use oxc_span::GetSpan;
use oxc_syntax::precedence::{GetPrecedence, Precedence};

use crate::{Span, span_from_oxc};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum ExpressionKind {
    Identifier,
    String,
    Static,
    Object,
    Array,
    Conditional,
    Logical,
    Template,
    Call,
    #[default]
    Other,
}

/// Compact, owned expression facts retained after the Oxc allocator is dropped.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExpressionFacts {
    pub span: Span,
    pub kind: ExpressionKind,
    pub identifier: Option<String>,
    pub string_value: Option<String>,
    pub call_name: Option<String>,
    pub object: Option<ObjectFacts>,
    pub conditional: Option<Box<ConditionalExpressionFacts>>,
    pub logical: Option<Box<LogicalExpressionFacts>>,
    /// Oxc-located insertion point after the last array element, or before
    /// the closing bracket for an empty array.
    pub array_append_at: Option<u32>,
    pub array_has_elements: bool,
    pub parenthesize_for_addition: bool,
}

impl Default for ExpressionFacts {
    fn default() -> Self {
        Self {
            span: Span { start: 0, end: 0 },
            kind: ExpressionKind::Other,
            identifier: None,
            string_value: None,
            call_name: None,
            object: None,
            conditional: None,
            logical: None,
            array_append_at: None,
            array_has_elements: false,
            parenthesize_for_addition: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConditionalExpressionFacts {
    pub test: ExpressionFacts,
    pub consequent: ExpressionFacts,
    pub alternate: ExpressionFacts,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogicalExpressionOperator {
    And,
    Or,
    Coalesce,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogicalExpressionFacts {
    pub operator: LogicalExpressionOperator,
    pub left: ExpressionFacts,
    pub right: ExpressionFacts,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ObjectFacts {
    pub properties: Vec<ObjectPropertyFacts>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ObjectPropertyFacts {
    pub span: Span,
    pub key: Option<String>,
    pub value: Option<ExpressionFacts>,
    pub spread_argument: Option<ExpressionFacts>,
}

impl Default for ObjectPropertyFacts {
    fn default() -> Self {
        Self {
            span: Span { start: 0, end: 0 },
            key: None,
            value: None,
            spread_argument: None,
        }
    }
}

impl ObjectPropertyFacts {
    #[must_use]
    pub fn is_spread(&self) -> bool {
        self.spread_argument.is_some()
    }
}

#[must_use]
pub(crate) fn expression_facts(expression: &Expression<'_>) -> ExpressionFacts {
    let inner = expression.get_inner_expression();
    let mut facts = ExpressionFacts {
        span: span_from_oxc(expression.span()),
        parenthesize_for_addition: needs_addition_parentheses(expression),
        ..Default::default()
    };

    match inner {
        Expression::Identifier(identifier) => {
            facts.kind = ExpressionKind::Identifier;
            facts.identifier = Some(identifier.name.to_string());
        }
        Expression::StringLiteral(string) => {
            facts.kind = ExpressionKind::String;
            facts.string_value = Some(string.value.to_string());
        }
        Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::BigIntLiteral(_)
        | Expression::RegExpLiteral(_) => facts.kind = ExpressionKind::Static,
        Expression::ObjectExpression(object) => {
            facts.kind = ExpressionKind::Object;
            facts.object = Some(object_facts(object));
        }
        Expression::ArrayExpression(array) => {
            facts.kind = ExpressionKind::Array;
            facts.array_has_elements = !array.elements.is_empty();
            facts.array_append_at = array
                .elements
                .last()
                .map(GetSpan::span)
                .map(|span| span.end)
                .or_else(|| array.span.end.checked_sub(1));
        }
        Expression::ConditionalExpression(conditional) => {
            facts.kind = ExpressionKind::Conditional;
            facts.conditional = Some(Box::new(ConditionalExpressionFacts {
                test: expression_facts(&conditional.test),
                consequent: expression_facts(&conditional.consequent),
                alternate: expression_facts(&conditional.alternate),
            }));
        }
        Expression::LogicalExpression(logical) => {
            facts.kind = ExpressionKind::Logical;
            facts.logical = Some(Box::new(LogicalExpressionFacts {
                operator: match logical.operator {
                    LogicalOperator::And => LogicalExpressionOperator::And,
                    LogicalOperator::Or => LogicalExpressionOperator::Or,
                    LogicalOperator::Coalesce => LogicalExpressionOperator::Coalesce,
                },
                left: expression_facts(&logical.left),
                right: expression_facts(&logical.right),
            }));
        }
        Expression::TemplateLiteral(template) if template.expressions.is_empty() => {
            facts.kind = ExpressionKind::Static;
            facts.string_value = template
                .quasis
                .first()
                .and_then(|quasi| quasi.value.cooked.as_ref())
                .map(ToString::to_string);
        }
        Expression::TemplateLiteral(_) => facts.kind = ExpressionKind::Template,
        Expression::CallExpression(call) => {
            facts.kind = ExpressionKind::Call;
            facts.call_name = static_call_name(call);
        }
        _ => {}
    }

    facts
}

#[must_use]
pub(crate) fn object_facts(object: &ObjectExpression<'_>) -> ObjectFacts {
    ObjectFacts {
        properties: object
            .properties
            .iter()
            .map(|property| match property {
                ObjectPropertyKind::ObjectProperty(property) => ObjectPropertyFacts {
                    span: span_from_oxc(property.span),
                    key: static_key(&property.key),
                    value: Some(expression_facts(&property.value)),
                    spread_argument: None,
                },
                ObjectPropertyKind::SpreadProperty(spread) => ObjectPropertyFacts {
                    span: span_from_oxc(spread.span),
                    key: None,
                    value: None,
                    spread_argument: Some(expression_facts(&spread.argument)),
                },
            })
            .collect(),
    }
}

fn static_key(key: &PropertyKey<'_>) -> Option<String> {
    key.static_name().map(std::borrow::Cow::into_owned)
}

fn static_call_name(call: &CallExpression<'_>) -> Option<String> {
    match call.callee.get_inner_expression() {
        Expression::Identifier(identifier) => Some(identifier.name.to_string()),
        Expression::StaticMemberExpression(member) => Some(member.property.name.to_string()),
        _ => None,
    }
}

fn needs_addition_parentheses(expression: &Expression<'_>) -> bool {
    if matches!(expression, Expression::ParenthesizedExpression(_)) {
        return false;
    }
    let inner = expression.get_inner_expression();
    expression_precedence(inner).is_some_and(|precedence| precedence < Precedence::Add)
}

fn expression_precedence(expression: &Expression<'_>) -> Option<Precedence> {
    match expression {
        Expression::SequenceExpression(_)
        | Expression::AssignmentExpression(_)
        | Expression::YieldExpression(_)
        | Expression::ConditionalExpression(_)
        | Expression::LogicalExpression(_)
        | Expression::BinaryExpression(_)
        | Expression::UnaryExpression(_)
        | Expression::UpdateExpression(_)
        | Expression::AwaitExpression(_)
        | Expression::NewExpression(_)
        | Expression::CallExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::StaticMemberExpression(_)
        | Expression::PrivateFieldExpression(_) => Some(expression.precedence()),
        Expression::ChainExpression(chain) => Some(chain.precedence()),
        Expression::ArrowFunctionExpression(_) => Some(Precedence::Assign),
        _ => None,
    }
}
