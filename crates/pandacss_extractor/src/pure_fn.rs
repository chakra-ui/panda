//! Static folding of simple pure callables.
//!
//! This is not a JS interpreter. Callables whose bodies lower to a closed
//! [`OwnedPureExpr`] can be applied with folded arguments at extract time —
//! same-file or across files (via the cross-file export cache).

use oxc_ast::ast::{
    ArrayExpressionElement, ArrowFunctionExpression, BinaryOperator, BindingPattern,
    CallExpression, Expression, FormalParameters, Function, FunctionBody, LogicalOperator,
    ObjectPropertyKind, PropertyKey, PropertyKind, Statement, UnaryOperator,
};

use crate::literal::{
    coerce_to_number, coerce_to_string, collapse_whitespace, expression_to_literal, is_string_like,
    less_than, literal_to_property_key, loose_eq, strict_eq, truthy,
};
use crate::{Literal, Resolver};

/// Owned, closed representation of a pure function body.
#[derive(Debug, Clone, PartialEq)]
pub(crate) struct OwnedPureFn {
    /// Number of positional parameters (simple identifiers only).
    pub(crate) param_count: usize,
    /// Optional folded default for each param slot (`None` = required).
    pub(crate) defaults: Vec<Option<OwnedPureExpr>>,
    pub(crate) body: OwnedPureExpr,
}

/// Closed expression IR. Identifiers that aren't params are baked to
/// [`OwnedPureExpr::Value`] at lower time (captures must already fold).
#[derive(Debug, Clone, PartialEq)]
pub(crate) enum OwnedPureExpr {
    Value(Literal),
    Param(usize),
    Template {
        quasis: Vec<String>,
        exprs: Vec<OwnedPureExpr>,
    },
    BinaryAdd(Box<OwnedPureExpr>, Box<OwnedPureExpr>),
    Binary {
        op: PureBinaryOp,
        left: Box<OwnedPureExpr>,
        right: Box<OwnedPureExpr>,
    },
    Unary {
        op: PureUnaryOp,
        arg: Box<OwnedPureExpr>,
    },
    Logical {
        op: PureLogicalOp,
        left: Box<OwnedPureExpr>,
        right: Box<OwnedPureExpr>,
    },
    Conditional {
        test: Box<OwnedPureExpr>,
        consequent: Box<OwnedPureExpr>,
        alternate: Box<OwnedPureExpr>,
    },
    Object(Vec<(OwnedKey, OwnedPureExpr)>),
    Array(Vec<OwnedPureExpr>),
    Member {
        object: Box<OwnedPureExpr>,
        prop: String,
    },
    Index {
        object: Box<OwnedPureExpr>,
        index: Box<OwnedPureExpr>,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub(crate) enum OwnedKey {
    Static(String),
    Computed(OwnedPureExpr),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PureBinaryOp {
    Sub,
    Mul,
    Div,
    Rem,
    Exp,
    EqEq,
    NotEq,
    StrictEq,
    StrictNotEq,
    Lt,
    LtEq,
    Gt,
    GtEq,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PureUnaryOp {
    Plus,
    Minus,
    Not,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PureLogicalOp {
    And,
    Or,
    Coalesce,
}

/// Try to lower an expression that is itself a function/arrow into a pure fn.
pub(crate) fn lower_callable_expr(
    expr: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<OwnedPureFn> {
    match expr.get_inner_expression() {
        Expression::ArrowFunctionExpression(arrow) => lower_arrow(arrow, resolver),
        Expression::FunctionExpression(func) => lower_function(func, resolver),
        _ => None,
    }
}

pub(crate) fn lower_arrow(
    arrow: &ArrowFunctionExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<OwnedPureFn> {
    if arrow.r#async {
        return None;
    }
    let (param_count, defaults) = lower_params(&arrow.params, resolver)?;
    let body_expr = callable_body_expression(&arrow.body, arrow.expression)?;
    let params = param_names(&arrow.params)?;
    let body = lower_expr(body_expr, &params, resolver)?;
    Some(OwnedPureFn {
        param_count,
        defaults,
        body,
    })
}

pub(crate) fn lower_function(
    func: &Function<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<OwnedPureFn> {
    if func.r#async || func.generator {
        return None;
    }
    let body = func.body.as_ref()?;
    let (param_count, defaults) = lower_params(&func.params, resolver)?;
    let body_expr = callable_body_expression(body, false)?;
    let params = param_names(&func.params)?;
    let body = lower_expr(body_expr, &params, resolver)?;
    Some(OwnedPureFn {
        param_count,
        defaults,
        body,
    })
}

/// Apply a pure fn to already-folded call arguments.
pub(crate) fn apply_pure_fn(func: &OwnedPureFn, args: &[Literal]) -> Option<Literal> {
    let mut bound = Vec::with_capacity(func.param_count);
    for i in 0..func.param_count {
        if let Some(arg) = args.get(i) {
            bound.push(arg.clone());
        } else if let Some(Some(default)) = func.defaults.get(i) {
            bound.push(eval_expr(default, &bound)?);
        } else {
            return None;
        }
    }
    eval_expr(&func.body, &bound)
}

/// Fold the argument list of a [`CallExpression`] to literals (spread rejected).
pub(crate) fn fold_call_args(
    call: &CallExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<Vec<Literal>> {
    let mut args = Vec::with_capacity(call.arguments.len());
    for arg in &call.arguments {
        let expr = arg.as_expression()?;
        args.push(expression_to_literal(expr, resolver)?);
    }
    Some(args)
}

fn callable_body_expression<'a>(
    body: &'a FunctionBody<'a>,
    is_expression_arrow: bool,
) -> Option<&'a Expression<'a>> {
    if is_expression_arrow {
        // `() => expr` — body is a single ExpressionStatement.
        match body.statements.as_slice() {
            [Statement::ExpressionStatement(stmt)] => Some(&stmt.expression),
            _ => None,
        }
    } else {
        // `{ return expr; }` — exactly one return, no other statements.
        match body.statements.as_slice() {
            [Statement::ReturnStatement(ret)] => ret.argument.as_ref(),
            _ => None,
        }
    }
}

fn param_names(params: &FormalParameters<'_>) -> Option<Vec<String>> {
    if params.rest.is_some() {
        return None;
    }
    let mut names = Vec::with_capacity(params.items.len());
    for item in &params.items {
        match &item.pattern {
            BindingPattern::BindingIdentifier(id) => names.push(id.name.to_string()),
            _ => return None,
        }
    }
    Some(names)
}

fn lower_params(
    params: &FormalParameters<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<(usize, Vec<Option<OwnedPureExpr>>)> {
    if params.rest.is_some() {
        return None;
    }
    let mut defaults = Vec::with_capacity(params.items.len());
    let names = param_names(params)?;
    for (index, item) in params.items.iter().enumerate() {
        match &item.initializer {
            None => defaults.push(None),
            Some(init) => {
                // Defaults may only reference earlier params + closed captures.
                let earlier = &names[..index];
                defaults.push(Some(lower_expr(init, earlier, resolver)?));
            }
        }
    }
    Some((names.len(), defaults))
}

#[allow(
    clippy::too_many_lines,
    reason = "expression lowering is a flat match over Oxc Expression variants"
)]
fn lower_expr(
    expr: &Expression<'_>,
    params: &[String],
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<OwnedPureExpr> {
    match expr {
        Expression::StringLiteral(s) => Some(OwnedPureExpr::Value(Literal::String(
            collapse_whitespace(&s.value),
        ))),
        Expression::NumericLiteral(n) => Some(OwnedPureExpr::Value(Literal::Number(n.value))),
        Expression::BooleanLiteral(b) => Some(OwnedPureExpr::Value(Literal::Bool(b.value))),
        Expression::NullLiteral(_) => Some(OwnedPureExpr::Value(Literal::Null)),

        Expression::ParenthesizedExpression(p) => lower_expr(&p.expression, params, resolver),
        Expression::TSAsExpression(e) => lower_expr(&e.expression, params, resolver),
        Expression::TSSatisfiesExpression(e) => lower_expr(&e.expression, params, resolver),
        Expression::TSNonNullExpression(e) => lower_expr(&e.expression, params, resolver),
        Expression::TSTypeAssertion(e) => lower_expr(&e.expression, params, resolver),
        Expression::TSInstantiationExpression(e) => lower_expr(&e.expression, params, resolver),

        Expression::Identifier(ident) => {
            let name = ident.name.as_str();
            if let Some(index) = params.iter().position(|p| p == name) {
                return Some(OwnedPureExpr::Param(index));
            }
            // Bake closed captures.
            let lit = resolver?.resolve_identifier(ident)?;
            Some(OwnedPureExpr::Value(lit))
        }

        Expression::TemplateLiteral(t) => {
            let mut quasis = Vec::with_capacity(t.quasis.len());
            for quasi in &t.quasis {
                quasis.push(
                    quasi
                        .value
                        .cooked
                        .as_deref()
                        .unwrap_or(&quasi.value.raw)
                        .to_owned(),
                );
            }
            let mut exprs = Vec::with_capacity(t.expressions.len());
            for e in &t.expressions {
                exprs.push(lower_expr(e, params, resolver)?);
            }
            Some(OwnedPureExpr::Template { quasis, exprs })
        }

        Expression::BinaryExpression(b) => {
            let left = lower_expr(&b.left, params, resolver)?;
            let right = lower_expr(&b.right, params, resolver)?;
            match b.operator {
                BinaryOperator::Addition => {
                    Some(OwnedPureExpr::BinaryAdd(Box::new(left), Box::new(right)))
                }
                other => {
                    let op = pure_binary_op(other)?;
                    Some(OwnedPureExpr::Binary {
                        op,
                        left: Box::new(left),
                        right: Box::new(right),
                    })
                }
            }
        }

        Expression::UnaryExpression(u) => {
            let op = match u.operator {
                UnaryOperator::UnaryPlus => PureUnaryOp::Plus,
                UnaryOperator::UnaryNegation => PureUnaryOp::Minus,
                UnaryOperator::LogicalNot => PureUnaryOp::Not,
                _ => return None,
            };
            Some(OwnedPureExpr::Unary {
                op,
                arg: Box::new(lower_expr(&u.argument, params, resolver)?),
            })
        }

        Expression::LogicalExpression(l) => {
            let op = match l.operator {
                LogicalOperator::And => PureLogicalOp::And,
                LogicalOperator::Or => PureLogicalOp::Or,
                LogicalOperator::Coalesce => PureLogicalOp::Coalesce,
            };
            Some(OwnedPureExpr::Logical {
                op,
                left: Box::new(lower_expr(&l.left, params, resolver)?),
                right: Box::new(lower_expr(&l.right, params, resolver)?),
            })
        }

        Expression::ConditionalExpression(c) => Some(OwnedPureExpr::Conditional {
            test: Box::new(lower_expr(&c.test, params, resolver)?),
            consequent: Box::new(lower_expr(&c.consequent, params, resolver)?),
            alternate: Box::new(lower_expr(&c.alternate, params, resolver)?),
        }),

        Expression::ObjectExpression(obj) => {
            let mut entries = Vec::with_capacity(obj.properties.len());
            for prop in &obj.properties {
                match prop {
                    ObjectPropertyKind::SpreadProperty(_) => return None,
                    ObjectPropertyKind::ObjectProperty(p) => {
                        if p.method || p.kind != PropertyKind::Init {
                            return None;
                        }
                        let key = lower_key(&p.key, p.computed, params, resolver)?;
                        let value = if p.shorthand {
                            match &key {
                                OwnedKey::Static(name) => {
                                    lower_shorthand_value(name, params, resolver)?
                                }
                                OwnedKey::Computed(_) => return None,
                            }
                        } else {
                            lower_expr(&p.value, params, resolver)?
                        };
                        entries.push((key, value));
                    }
                }
            }
            Some(OwnedPureExpr::Object(entries))
        }

        Expression::ArrayExpression(arr) => {
            let mut items = Vec::with_capacity(arr.elements.len());
            for el in &arr.elements {
                match el {
                    ArrayExpressionElement::SpreadElement(_) => return None,
                    ArrayExpressionElement::Elision(_) => {
                        items.push(OwnedPureExpr::Value(Literal::Null));
                    }
                    other => {
                        let e = other.as_expression()?;
                        items.push(lower_expr(e, params, resolver)?);
                    }
                }
            }
            Some(OwnedPureExpr::Array(items))
        }

        Expression::StaticMemberExpression(m) => {
            if m.optional {
                return None;
            }
            Some(OwnedPureExpr::Member {
                object: Box::new(lower_expr(&m.object, params, resolver)?),
                prop: m.property.name.to_string(),
            })
        }

        Expression::ComputedMemberExpression(m) => {
            if m.optional {
                return None;
            }
            Some(OwnedPureExpr::Index {
                object: Box::new(lower_expr(&m.object, params, resolver)?),
                index: Box::new(lower_expr(&m.expression, params, resolver)?),
            })
        }

        // Calls, nested functions, mutation, and other impure/unsupported forms.
        _ => None,
    }
}

fn lower_shorthand_value(
    name: &str,
    params: &[String],
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<OwnedPureExpr> {
    if let Some(index) = params.iter().position(|p| p == name) {
        return Some(OwnedPureExpr::Param(index));
    }
    let lit = resolver?.resolve_root_name(name)?;
    Some(OwnedPureExpr::Value(lit))
}

fn lower_key(
    key: &PropertyKey<'_>,
    computed: bool,
    params: &[String],
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<OwnedKey> {
    if computed {
        let expr = key.as_expression()?;
        return Some(OwnedKey::Computed(lower_expr(expr, params, resolver)?));
    }
    match key {
        PropertyKey::StaticIdentifier(id) => Some(OwnedKey::Static(id.name.to_string())),
        PropertyKey::StringLiteral(s) => Some(OwnedKey::Static(s.value.to_string())),
        PropertyKey::NumericLiteral(n) => Some(OwnedKey::Static(
            pandacss_shared::number_to_js_string(n.value),
        )),
        _ => None,
    }
}

fn pure_binary_op(op: BinaryOperator) -> Option<PureBinaryOp> {
    Some(match op {
        BinaryOperator::Subtraction => PureBinaryOp::Sub,
        BinaryOperator::Multiplication => PureBinaryOp::Mul,
        BinaryOperator::Division => PureBinaryOp::Div,
        BinaryOperator::Remainder => PureBinaryOp::Rem,
        BinaryOperator::Exponential => PureBinaryOp::Exp,
        BinaryOperator::Equality => PureBinaryOp::EqEq,
        BinaryOperator::Inequality => PureBinaryOp::NotEq,
        BinaryOperator::StrictEquality => PureBinaryOp::StrictEq,
        BinaryOperator::StrictInequality => PureBinaryOp::StrictNotEq,
        BinaryOperator::LessThan => PureBinaryOp::Lt,
        BinaryOperator::LessEqualThan => PureBinaryOp::LtEq,
        BinaryOperator::GreaterThan => PureBinaryOp::Gt,
        BinaryOperator::GreaterEqualThan => PureBinaryOp::GtEq,
        _ => return None,
    })
}

#[allow(
    clippy::too_many_lines,
    reason = "owned IR evaluation is a flat match over OwnedPureExpr variants"
)]
fn eval_expr(expr: &OwnedPureExpr, args: &[Literal]) -> Option<Literal> {
    match expr {
        OwnedPureExpr::Value(lit) => Some(lit.clone()),
        OwnedPureExpr::Param(i) => args.get(*i).cloned(),
        OwnedPureExpr::Template { quasis, exprs } => {
            let mut out = String::new();
            for (i, quasi) in quasis.iter().enumerate() {
                out.push_str(quasi);
                if let Some(e) = exprs.get(i) {
                    out.push_str(&coerce_to_string(&eval_expr(e, args)?)?);
                }
            }
            Some(Literal::String(collapse_whitespace(&out)))
        }
        OwnedPureExpr::BinaryAdd(left, right) => {
            let left_val = eval_expr(left, args)?;
            let right_val = eval_expr(right, args)?;
            // JS `+`: any string operand → concatenation, else numeric add.
            if is_string_like(&left_val) || is_string_like(&right_val) {
                Some(Literal::String(collapse_whitespace(&format!(
                    "{}{}",
                    coerce_to_string(&left_val)?,
                    coerce_to_string(&right_val)?
                ))))
            } else {
                Some(Literal::Number(
                    coerce_to_number(&left_val)? + coerce_to_number(&right_val)?,
                ))
            }
        }
        OwnedPureExpr::Binary { op, left, right } => {
            let left_val = eval_expr(left, args)?;
            let right_val = eval_expr(right, args)?;
            eval_binary(*op, &left_val, &right_val)
        }
        OwnedPureExpr::Unary { op, arg } => {
            let value = eval_expr(arg, args)?;
            eval_unary(*op, &value)
        }
        OwnedPureExpr::Logical { op, left, right } => {
            let left_val = eval_expr(left, args)?;
            match op {
                PureLogicalOp::And => {
                    if truthy(&left_val) {
                        eval_expr(right, args)
                    } else {
                        Some(left_val)
                    }
                }
                PureLogicalOp::Or => {
                    if truthy(&left_val) {
                        Some(left_val)
                    } else {
                        eval_expr(right, args)
                    }
                }
                PureLogicalOp::Coalesce => {
                    if matches!(left_val, Literal::Null) {
                        eval_expr(right, args)
                    } else {
                        Some(left_val)
                    }
                }
            }
        }
        OwnedPureExpr::Conditional {
            test,
            consequent,
            alternate,
        } => {
            if truthy(&eval_expr(test, args)?) {
                eval_expr(consequent, args)
            } else {
                eval_expr(alternate, args)
            }
        }
        OwnedPureExpr::Object(entries) => {
            let mut out = Vec::with_capacity(entries.len());
            for (key, value) in entries {
                let key_name = match key {
                    OwnedKey::Static(s) => s.clone(),
                    OwnedKey::Computed(e) => literal_to_property_key(&eval_expr(e, args)?)?,
                };
                let value = eval_expr(value, args)?;
                Literal::upsert_object_entry(&mut out, key_name, value);
            }
            Some(Literal::Object(out))
        }
        OwnedPureExpr::Array(items) => {
            let mut out = Vec::with_capacity(items.len());
            for item in items {
                out.push(eval_expr(item, args)?);
            }
            Some(Literal::Array(out))
        }
        OwnedPureExpr::Member { object, prop } => {
            let object = eval_expr(object, args)?;
            match object {
                Literal::Object(entries) => {
                    entries.into_iter().find(|(k, _)| k == prop).map(|(_, v)| v)
                }
                _ => None,
            }
        }
        OwnedPureExpr::Index { object, index } => {
            let object = eval_expr(object, args)?;
            let index = eval_expr(index, args)?;
            let key = literal_to_property_key(&index)?;
            match object {
                Literal::Array(items) => {
                    let idx = key.parse::<usize>().ok()?;
                    items.get(idx).cloned()
                }
                Literal::Object(entries) => entries
                    .into_iter()
                    .find(|(name, _)| name == &key)
                    .map(|(_, v)| v),
                _ => None,
            }
        }
    }
}

fn eval_unary(op: PureUnaryOp, v: &Literal) -> Option<Literal> {
    match op {
        PureUnaryOp::Plus => coerce_to_number(v).map(Literal::Number),
        PureUnaryOp::Minus => match v {
            Literal::Number(n) => Some(Literal::Number(-n)),
            _ => None,
        },
        PureUnaryOp::Not => Some(Literal::Bool(!truthy(v))),
    }
}

fn eval_binary(op: PureBinaryOp, left: &Literal, right: &Literal) -> Option<Literal> {
    match op {
        PureBinaryOp::Sub
        | PureBinaryOp::Mul
        | PureBinaryOp::Div
        | PureBinaryOp::Rem
        | PureBinaryOp::Exp => {
            let a = coerce_to_number(left)?;
            let b = coerce_to_number(right)?;
            let n = match op {
                PureBinaryOp::Sub => a - b,
                PureBinaryOp::Mul => a * b,
                PureBinaryOp::Div => {
                    if b == 0.0 {
                        return None;
                    }
                    a / b
                }
                PureBinaryOp::Rem => {
                    if b == 0.0 {
                        return None;
                    }
                    a % b
                }
                PureBinaryOp::Exp => {
                    let result = a.powf(b);
                    if !result.is_finite() {
                        return None;
                    }
                    result
                }
                _ => unreachable!(),
            };
            Some(Literal::Number(n))
        }
        PureBinaryOp::StrictEq => Some(Literal::Bool(strict_eq(left, right))),
        PureBinaryOp::StrictNotEq => Some(Literal::Bool(!strict_eq(left, right))),
        PureBinaryOp::EqEq => Some(Literal::Bool(loose_eq(left, right)?)),
        PureBinaryOp::NotEq => Some(Literal::Bool(!loose_eq(left, right)?)),
        PureBinaryOp::Lt => Some(Literal::Bool(less_than(left, right)?)),
        PureBinaryOp::LtEq => Some(Literal::Bool(!less_than(right, left)?)),
        PureBinaryOp::Gt => Some(Literal::Bool(less_than(right, left)?)),
        PureBinaryOp::GtEq => Some(Literal::Bool(!less_than(left, right)?)),
    }
}
