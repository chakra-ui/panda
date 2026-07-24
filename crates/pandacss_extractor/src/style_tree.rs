//! Style IR built during extract (span-backed conditionals).
//!
//! Extract builds one [`StyleTree`] per style object; [`project_literal`] feeds
//! encode/NAPI `Literal` `data`. Transform lowers the same tree. See
//! `design-notes/style-tree.md`.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, ChainElement, ChainExpression,
    ComputedMemberExpression, Expression, LogicalOperator, ObjectExpression, ObjectPropertyKind,
    PropertyKind, StaticMemberExpression,
};
use oxc_span::GetSpan;

use pandacss_shared::Span;

use crate::literal::{
    expression_to_literal, literal_to_property_key, property_key_to_string, truthy,
};
use crate::{Literal, Resolver, span_from_oxc};

#[derive(Debug, Clone, PartialEq)]
pub enum StyleTree {
    String(String),
    Number(f64),
    Bool(bool),
    Null,
    Token {
        path: String,
        value: String,
    },
    Object(StyleObject),
    Array(Vec<StyleTree>),
    Ternary {
        test: Span,
        consequent: Box<StyleTree>,
        alternate: Box<StyleTree>,
    },
    And {
        test: Span,
        value: Box<StyleTree>,
    },
    /// Span-less alternatives (`Literal::Conditional`, cross-file imports).
    /// Encode expands all branches; transform cannot rewrite (no local test).
    Branches(Vec<StyleTree>),
    /// Transform cannot rewrite this value, and encode has no fallback.
    Open,
    /// A runtime-unknown value with a known fallback. Transform bails; encode
    /// uses the fallback.
    OpenWithFallback(Box<StyleTree>),
}

impl StyleTree {
    /// True for rewrite-critical open leaves (`Open` / `OpenWithFallback`).
    #[must_use]
    pub const fn is_open(&self) -> bool {
        matches!(self, Self::Open | Self::OpenWithFallback(_))
    }
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct StyleObject {
    pub entries: Vec<(String, StyleTree)>,
    pub spreads: Vec<StyleSpread>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum StyleSpread {
    Ternary {
        test: Span,
        consequent: StyleTree,
        alternate: StyleTree,
        /// Keys overwritten by a later static entry.
        overridden: Vec<String>,
    },
    And {
        test: Span,
        value: StyleTree,
        /// Keys overwritten by a later static entry.
        overridden: Vec<String>,
    },
    /// Opaque object member or spread. Transform bails; encode skips it.
    Open,
    /// Dynamic `...(a || b)` or `...(a ?? b)` with a known fallback. Transform
    /// bails; encode merges the fallback.
    OpenWithFallback { fallback: StyleTree },
}

impl StyleSpread {
    /// True for rewrite-critical open spreads.
    #[must_use]
    pub const fn is_open(&self) -> bool {
        matches!(self, Self::Open | Self::OpenWithFallback { .. })
    }
}

/// Project a `StyleTree` to a [`Literal`] with today's encode semantics.
#[must_use]
pub fn project_literal(tree: &StyleTree) -> Option<Literal> {
    match tree {
        StyleTree::String(s) => Some(Literal::String(s.clone())),
        StyleTree::Number(n) => Some(Literal::Number(*n)),
        StyleTree::Bool(b) => Some(Literal::Bool(*b)),
        StyleTree::Null => Some(Literal::Null),
        StyleTree::Token { path, value } => Some(Literal::Token {
            path: path.clone(),
            value: value.clone(),
        }),
        StyleTree::Array(items) => {
            let mut out = Vec::with_capacity(items.len());
            for item in items {
                out.push(project_literal(item).unwrap_or(Literal::Null));
            }
            Some(Literal::Array(out))
        }
        StyleTree::Open => None,
        StyleTree::OpenWithFallback(inner) => project_literal(inner),
        StyleTree::And { value, .. } => project_literal(value),
        StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } => project_ternary_arms(consequent, alternate),
        StyleTree::Branches(items) => project_branches(items),
        StyleTree::Object(obj) => project_object(obj),
    }
}

fn project_branches(items: &[StyleTree]) -> Option<Literal> {
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        if let Some(lit) = project_literal(item) {
            out.push(lit);
        }
    }
    match out.as_slice() {
        [] => None,
        [only] => Some(only.clone()),
        [first, rest @ ..] if rest.iter().all(|item| item == first) => Some(first.clone()),
        _ => Some(Literal::Conditional(out)),
    }
}

fn project_ternary_arms(consequent: &StyleTree, alternate: &StyleTree) -> Option<Literal> {
    match (project_literal(consequent), project_literal(alternate)) {
        (Some(left), Some(right)) if left == right => Some(left),
        (Some(left), Some(right)) => Some(Literal::Conditional(vec![left, right])),
        (Some(only), None) | (None, Some(only)) => Some(only),
        (None, None) => None,
    }
}

fn project_object(obj: &StyleObject) -> Option<Literal> {
    let mut entries: Vec<(String, Literal)> = Vec::with_capacity(obj.entries.len());
    for (key, value) in &obj.entries {
        if let Some(lit) = project_literal(value) {
            Literal::upsert_object_entry(&mut entries, key.clone(), lit);
        }
    }

    let mut spread_conditions: Vec<(String, Literal)> = Vec::new();
    for spread in &obj.spreads {
        match spread {
            StyleSpread::Ternary {
                consequent,
                alternate,
                ..
            } => {
                for arm in [consequent, alternate] {
                    if let Some(Literal::Object(inner)) = project_literal(arm) {
                        for (k, v) in inner {
                            Literal::combine_object_entry(&mut spread_conditions, k, v);
                        }
                    }
                }
            }
            StyleSpread::And { value, .. } | StyleSpread::OpenWithFallback { fallback: value } => {
                // Encode peels `cond && obj` / `unk || obj` to the object and last-wins merges.
                if let Some(Literal::Object(inner)) = project_literal(value) {
                    for (k, v) in inner {
                        Literal::upsert_object_entry(&mut entries, k, v);
                    }
                }
            }
            StyleSpread::Open => {}
        }
    }

    for (k, v) in spread_conditions {
        Literal::combine_object_entry(&mut entries, k, v);
    }

    if entries.is_empty() && (!obj.entries.is_empty() || !obj.spreads.is_empty()) {
        // Mirror object_to_literal: all-unresolvable non-empty object → drop.
        if obj
            .entries
            .iter()
            .all(|(_, v)| project_literal(v).is_none())
            && obj.spreads.iter().all(|s| match s {
                StyleSpread::Open => true,
                StyleSpread::Ternary {
                    consequent,
                    alternate,
                    ..
                } => project_literal(consequent).is_none() && project_literal(alternate).is_none(),
                StyleSpread::And { value, .. }
                | StyleSpread::OpenWithFallback { fallback: value } => {
                    project_literal(value).is_none()
                }
            })
        {
            return None;
        }
    }

    Some(Literal::Object(entries))
}

/// Build a `StyleTree` from an Oxc expression (sole folder for style objects).
#[must_use]
pub(crate) fn expression_to_style_tree(
    expr: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<StyleTree> {
    match expr {
        Expression::ParenthesizedExpression(p) => expression_to_style_tree(&p.expression, resolver),
        Expression::TSAsExpression(e) => expression_to_style_tree(&e.expression, resolver),
        Expression::TSSatisfiesExpression(e) => expression_to_style_tree(&e.expression, resolver),
        Expression::TSNonNullExpression(e) => expression_to_style_tree(&e.expression, resolver),
        Expression::TSTypeAssertion(e) => expression_to_style_tree(&e.expression, resolver),
        Expression::TSInstantiationExpression(e) => {
            expression_to_style_tree(&e.expression, resolver)
        }

        Expression::ConditionalExpression(c) => {
            if let Some(test) = expression_to_literal(&c.test, resolver) {
                return if truthy(&test) {
                    expression_to_style_tree(&c.consequent, resolver)
                } else {
                    expression_to_style_tree(&c.alternate, resolver)
                };
            }
            let consequent =
                expression_to_style_tree(&c.consequent, resolver).unwrap_or(StyleTree::Open);
            let alternate =
                expression_to_style_tree(&c.alternate, resolver).unwrap_or(StyleTree::Open);
            if matches!(
                (&consequent, &alternate),
                (StyleTree::Open, StyleTree::Open)
            ) {
                return None;
            }
            Some(StyleTree::Ternary {
                test: span_from_oxc(c.test.span()),
                consequent: Box::new(consequent),
                alternate: Box::new(alternate),
            })
        }

        Expression::LogicalExpression(l) => {
            if let Some(left) = expression_to_literal(&l.left, resolver) {
                return match l.operator {
                    LogicalOperator::And => {
                        if truthy(&left) {
                            expression_to_style_tree(&l.right, resolver)
                        } else {
                            Some(literal_to_style_tree(left))
                        }
                    }
                    LogicalOperator::Or => {
                        if truthy(&left) {
                            Some(literal_to_style_tree(left))
                        } else {
                            expression_to_style_tree(&l.right, resolver)
                        }
                    }
                    LogicalOperator::Coalesce => {
                        if matches!(left, Literal::Null) {
                            expression_to_style_tree(&l.right, resolver)
                        } else {
                            Some(literal_to_style_tree(left))
                        }
                    }
                };
            }
            // Dynamic left: And keeps right for encode+transform; Or/?? →
            // OpenWithFallback(right) when the right folds (encode peels; transform bails).
            match l.operator {
                LogicalOperator::And => {
                    let value = expression_to_style_tree(&l.right, resolver)?;
                    Some(StyleTree::And {
                        test: span_from_oxc(l.left.span()),
                        value: Box::new(value),
                    })
                }
                LogicalOperator::Or | LogicalOperator::Coalesce => {
                    Some(match expression_to_style_tree(&l.right, resolver) {
                        Some(right) => StyleTree::OpenWithFallback(Box::new(right)),
                        None => StyleTree::Open,
                    })
                }
            }
        }

        Expression::ObjectExpression(obj) => object_to_style_tree(obj, resolver),
        Expression::ArrayExpression(arr) => array_to_style_tree(arr, resolver),

        Expression::Identifier(ident) => resolver
            .and_then(|r| r.resolve_identifier_style_tree(ident))
            .or_else(|| expression_to_literal(expr, resolver).map(literal_to_style_tree)),

        Expression::CallExpression(call) => {
            if let Some(r) = resolver
                && let Some(tree) = r.resolve_raw_style_call_style_tree(call)
            {
                Some(tree)
            } else {
                expression_to_literal(expr, resolver).map(literal_to_style_tree)
            }
        }

        Expression::StaticMemberExpression(member) => static_member_to_style_tree(member, resolver),
        Expression::ComputedMemberExpression(member) => {
            computed_member_to_style_tree(member, resolver)
        }
        Expression::ChainExpression(chain) => chain_to_style_tree(chain, resolver),

        _ => expression_to_literal(expr, resolver).map(literal_to_style_tree),
    }
}

fn static_member_to_style_tree(
    member: &StaticMemberExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<StyleTree> {
    let object = expression_to_style_tree(&member.object, resolver)?;
    lookup_style_member(&object, member.property.name.as_str())
}

fn computed_member_to_style_tree(
    member: &ComputedMemberExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<StyleTree> {
    let object = expression_to_style_tree(&member.object, resolver)?;
    let key_literal = expression_to_literal(&member.expression, resolver)?;
    let key = literal_to_property_key(&key_literal)?;
    lookup_style_member(&object, &key)
}

fn chain_to_style_tree(
    chain: &ChainExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<StyleTree> {
    match &chain.expression {
        ChainElement::StaticMemberExpression(member) => {
            static_member_to_style_tree(member, resolver)
        }
        ChainElement::ComputedMemberExpression(member) => {
            computed_member_to_style_tree(member, resolver)
        }
        ChainElement::TSNonNullExpression(e) => expression_to_style_tree(&e.expression, resolver),
        ChainElement::CallExpression(_) | ChainElement::PrivateFieldExpression(_) => None,
    }
}

fn lookup_style_member(object: &StyleTree, key: &str) -> Option<StyleTree> {
    match object {
        StyleTree::Object(obj) => obj
            .entries
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.clone()),
        StyleTree::Array(items) => {
            let idx = key.parse::<usize>().ok()?;
            items.get(idx).cloned()
        }
        _ => None,
    }
}

fn array_to_style_tree(
    arr: &ArrayExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<StyleTree> {
    let mut items = Vec::with_capacity(arr.elements.len());
    for element in &arr.elements {
        match element {
            ArrayExpressionElement::Elision(_) => items.push(StyleTree::Null),
            ArrayExpressionElement::SpreadElement(spread) => {
                let Some(StyleTree::Array(inner)) =
                    expression_to_style_tree(&spread.argument, resolver)
                else {
                    return None;
                };
                items.extend(inner);
            }
            element => {
                let expr = element.as_expression()?;
                // Unresolvable slots become Null so breakpoint arity is preserved
                // (same as array_to_literal).
                items.push(expression_to_style_tree(expr, resolver).unwrap_or(StyleTree::Null));
            }
        }
    }
    Some(StyleTree::Array(items))
}

fn object_to_style_tree(
    obj: &ObjectExpression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<StyleTree> {
    let mut entries: Vec<(String, StyleTree)> = Vec::with_capacity(obj.properties.len());
    let mut spreads: Vec<StyleSpread> = Vec::new();

    for prop in &obj.properties {
        match prop {
            ObjectPropertyKind::ObjectProperty(prop) => {
                if prop.method || prop.kind != PropertyKind::Init {
                    spreads.push(StyleSpread::Open);
                    continue;
                }
                let Some(key) = property_key_to_string(&prop.key, prop.computed, resolver) else {
                    spreads.push(StyleSpread::Open);
                    continue;
                };
                mark_spreads_overridden(&mut spreads, &key);
                match expression_to_style_tree(&prop.value, resolver) {
                    Some(value) => upsert_style_entry(&mut entries, key, value),
                    None => upsert_open_style_entry(&mut entries, key),
                }
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                push_style_spread(&mut entries, &mut spreads, &spread.argument, resolver);
            }
        }
    }

    if entries.is_empty() && spreads.is_empty() && !obj.properties.is_empty() {
        return None;
    }
    Some(StyleTree::Object(StyleObject { entries, spreads }))
}

fn push_style_spread(
    entries: &mut Vec<(String, StyleTree)>,
    spreads: &mut Vec<StyleSpread>,
    argument: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) {
    let argument = argument.get_inner_expression();
    match argument {
        Expression::ConditionalExpression(c) => {
            if let Some(test) = expression_to_literal(&c.test, resolver) {
                let branch = if truthy(&test) {
                    &c.consequent
                } else {
                    &c.alternate
                };
                merge_static_spread_object(entries, spreads, branch, resolver);
                return;
            }
            let consequent =
                expression_to_style_tree(&c.consequent, resolver).unwrap_or(StyleTree::Open);
            let alternate =
                expression_to_style_tree(&c.alternate, resolver).unwrap_or(StyleTree::Open);
            spreads.push(StyleSpread::Ternary {
                test: span_from_oxc(c.test.span()),
                consequent,
                alternate,
                overridden: Vec::new(),
            });
        }
        Expression::LogicalExpression(l) => {
            if let Some(left) = expression_to_literal(&l.left, resolver) {
                match l.operator {
                    LogicalOperator::And => {
                        if truthy(&left) {
                            merge_static_spread_object(entries, spreads, &l.right, resolver);
                        }
                    }
                    LogicalOperator::Or => {
                        if truthy(&left) {
                            merge_static_spread_object(entries, spreads, &l.left, resolver);
                        } else {
                            merge_static_spread_object(entries, spreads, &l.right, resolver);
                        }
                    }
                    LogicalOperator::Coalesce => {
                        if matches!(left, Literal::Null) {
                            merge_static_spread_object(entries, spreads, &l.right, resolver);
                        } else {
                            merge_static_spread_object(entries, spreads, &l.left, resolver);
                        }
                    }
                }
                return;
            }
            match l.operator {
                LogicalOperator::And => {
                    let value =
                        expression_to_style_tree(&l.right, resolver).unwrap_or(StyleTree::Open);
                    spreads.push(StyleSpread::And {
                        test: span_from_oxc(l.left.span()),
                        value,
                        overridden: Vec::new(),
                    });
                }
                LogicalOperator::Or | LogicalOperator::Coalesce => {
                    match expression_to_style_tree(&l.right, resolver) {
                        Some(fallback) => {
                            spreads.push(StyleSpread::OpenWithFallback { fallback });
                        }
                        None => spreads.push(StyleSpread::Open),
                    }
                }
            }
        }
        _ => match expression_to_style_tree(argument, resolver) {
            Some(StyleTree::Object(inner)) => {
                for (k, v) in inner.entries {
                    mark_spreads_overridden(spreads, &k);
                    upsert_style_entry(entries, k, v);
                }
                spreads.extend(inner.spreads);
            }
            Some(StyleTree::Open) | None => spreads.push(StyleSpread::Open),
            Some(StyleTree::OpenWithFallback(inner)) => {
                spreads.push(StyleSpread::OpenWithFallback { fallback: *inner });
            }
            // Ignore known non-object values. Keep unknown expressions opaque
            // so transforms preserve their evaluation.
            Some(_) => {}
        },
    }
}

fn merge_static_spread_object(
    entries: &mut Vec<(String, StyleTree)>,
    spreads: &mut Vec<StyleSpread>,
    expr: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
) {
    if let Some(StyleTree::Object(inner)) = expression_to_style_tree(expr, resolver) {
        for (k, v) in inner.entries {
            mark_spreads_overridden(spreads, &k);
            upsert_style_entry(entries, k, v);
        }
        spreads.extend(inner.spreads);
    } else if let Some(Literal::Object(inner)) = expression_to_literal(expr, resolver) {
        for (k, v) in inner {
            mark_spreads_overridden(spreads, &k);
            upsert_style_entry(entries, k, literal_to_style_tree(v));
        }
    }
}

fn mark_spreads_overridden(spreads: &mut [StyleSpread], key: &str) {
    for spread in spreads {
        let overridden = match spread {
            StyleSpread::Ternary { overridden, .. } | StyleSpread::And { overridden, .. } => {
                overridden
            }
            StyleSpread::Open | StyleSpread::OpenWithFallback { .. } => continue,
        };
        if !overridden.iter().any(|existing| existing == key) {
            overridden.push(key.to_owned());
        }
    }
}

fn upsert_style_entry(entries: &mut Vec<(String, StyleTree)>, key: String, value: StyleTree) {
    if let Some(entry) = entries.iter_mut().find(|(existing, _)| existing == &key) {
        entry.1 = if entry.1.is_open() {
            StyleTree::OpenWithFallback(Box::new(value))
        } else {
            value
        };
    } else {
        entries.push((key, value));
    }
}

fn upsert_open_style_entry(entries: &mut Vec<(String, StyleTree)>, key: String) {
    if let Some(entry) = entries.iter_mut().find(|(existing, _)| existing == &key) {
        if !entry.1.is_open() {
            let fallback = std::mem::replace(&mut entry.1, StyleTree::Open);
            entry.1 = StyleTree::OpenWithFallback(Box::new(fallback));
        }
    } else {
        entries.push((key, StyleTree::Open));
    }
}

pub(crate) fn literal_to_style_tree(lit: Literal) -> StyleTree {
    match lit {
        Literal::String(s) => StyleTree::String(s),
        Literal::Number(n) => StyleTree::Number(n),
        Literal::Bool(b) => StyleTree::Bool(b),
        Literal::Null => StyleTree::Null,
        Literal::Token { path, value } => StyleTree::Token { path, value },
        Literal::Array(items) => {
            StyleTree::Array(items.into_iter().map(literal_to_style_tree).collect())
        }
        Literal::Object(entries) => StyleTree::Object(StyleObject {
            entries: entries
                .into_iter()
                .map(|(k, v)| (k, literal_to_style_tree(v)))
                .collect(),
            spreads: Vec::new(),
        }),
        // No local test span (cross-file / Literal rehydrate) — encode keeps branches.
        Literal::Conditional(branches) => {
            StyleTree::Branches(branches.into_iter().map(literal_to_style_tree).collect())
        }
    }
}

/// Build a `StyleTree` object from JSX attributes (parallel to literal merge).
#[must_use]
pub(crate) fn jsx_attributes_to_style_tree(
    attributes: &[oxc_ast::ast::JSXAttributeItem<'_>],
    resolver: Option<&Resolver<'_, '_>>,
    jsx: &crate::JsxExtractionConfig,
    tag_name: &str,
) -> Option<StyleTree> {
    use oxc_ast::ast::{JSXAttributeName, JSXAttributeValue, JSXExpression};

    let mut entries: Vec<(String, StyleTree)> = Vec::with_capacity(attributes.len());
    let mut spreads: Vec<StyleSpread> = Vec::new();

    for item in attributes {
        match item {
            oxc_ast::ast::JSXAttributeItem::Attribute(attr) => {
                let JSXAttributeName::Identifier(name) = &attr.name else {
                    continue;
                };
                let key = name.name.as_str();
                if !jsx.should_extract_prop(tag_name, key) {
                    continue;
                }
                let value = match attr.value.as_ref() {
                    None => StyleTree::Bool(true),
                    Some(JSXAttributeValue::StringLiteral(s)) => {
                        StyleTree::String(crate::literal::collapse_whitespace(&s.value))
                    }
                    Some(JSXAttributeValue::ExpressionContainer(container)) => {
                        match &container.expression {
                            JSXExpression::EmptyExpression(_) => continue,
                            other => {
                                let Some(expr) = other.as_expression() else {
                                    continue;
                                };
                                expression_to_style_tree(expr, resolver).unwrap_or(StyleTree::Open)
                            }
                        }
                    }
                    Some(JSXAttributeValue::Element(_) | JSXAttributeValue::Fragment(_)) => {
                        continue;
                    }
                };
                mark_spreads_overridden(&mut spreads, key);
                upsert_style_entry(&mut entries, key.to_owned(), value);
            }
            oxc_ast::ast::JSXAttributeItem::SpreadAttribute(spread) => {
                let before = spreads.len();
                push_style_spread(&mut entries, &mut spreads, &spread.argument, resolver);
                // Filter spread keys through jsx.should_extract_prop for ternary/and arms.
                for spread in &mut spreads[before..] {
                    filter_spread_props(spread, jsx, tag_name);
                }
            }
        }
    }

    // Static spreads merge into `entries`, so apply the component prop policy
    // after all source-order merges.
    entries.retain(|(key, _)| jsx.should_extract_prop(tag_name, key));

    if entries.is_empty() && spreads.is_empty() {
        return None;
    }
    Some(StyleTree::Object(StyleObject { entries, spreads }))
}

fn filter_spread_props(spread: &mut StyleSpread, jsx: &crate::JsxExtractionConfig, tag_name: &str) {
    match spread {
        StyleSpread::Ternary {
            consequent,
            alternate,
            ..
        } => {
            filter_object_props(consequent, jsx, tag_name);
            filter_object_props(alternate, jsx, tag_name);
        }
        StyleSpread::And { value, .. } | StyleSpread::OpenWithFallback { fallback: value } => {
            filter_object_props(value, jsx, tag_name);
        }
        StyleSpread::Open => {}
    }
}

fn filter_object_props(tree: &mut StyleTree, jsx: &crate::JsxExtractionConfig, tag_name: &str) {
    if let StyleTree::Object(obj) = tree {
        obj.entries
            .retain(|(key, _)| jsx.should_extract_prop(tag_name, key));
    }
}

/// `StyleTree` from a props object expression (React runtime `jsx(Tag, props)`).
#[must_use]
pub(crate) fn props_expression_to_style_tree(
    props: &Expression<'_>,
    resolver: Option<&Resolver<'_, '_>>,
    jsx: &crate::JsxExtractionConfig,
    tag_name: &str,
) -> Option<StyleTree> {
    let mut tree = expression_to_style_tree(props, resolver)?;
    if let StyleTree::Object(obj) = &mut tree {
        obj.entries.retain(|(key, _)| {
            !is_react_runtime_only_prop(key) && jsx.should_extract_prop(tag_name, key)
        });
        for spread in &mut obj.spreads {
            filter_spread_props(spread, jsx, tag_name);
            filter_react_runtime_props_in_spread(spread);
        }
    }
    Some(tree)
}

fn is_react_runtime_only_prop(key: &str) -> bool {
    matches!(key, "children" | "key" | "ref")
}

fn filter_react_runtime_props_in_spread(spread: &mut StyleSpread) {
    match spread {
        StyleSpread::Ternary {
            consequent,
            alternate,
            ..
        } => {
            filter_react_runtime_props_in_tree(consequent);
            filter_react_runtime_props_in_tree(alternate);
        }
        StyleSpread::And { value, .. } | StyleSpread::OpenWithFallback { fallback: value } => {
            filter_react_runtime_props_in_tree(value);
        }
        StyleSpread::Open => {}
    }
}

fn filter_react_runtime_props_in_tree(tree: &mut StyleTree) {
    if let StyleTree::Object(obj) = tree {
        obj.entries
            .retain(|(key, _)| !is_react_runtime_only_prop(key));
        for spread in &mut obj.spreads {
            filter_react_runtime_props_in_spread(spread);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    fn fold_style(source: &str) -> Option<StyleTree> {
        let allocator = Allocator::default();
        let wrapped = format!("({source})");
        let source_type = SourceType::tsx();
        let ret = Parser::new(&allocator, &wrapped, source_type).parse();
        let stmt = ret.program.body.first()?;
        let oxc_ast::ast::Statement::ExpressionStatement(expr_stmt) = stmt else {
            return None;
        };
        expression_to_style_tree(&expr_stmt.expression, None)
    }

    #[test]
    fn project_literal_ternary_both_arms() {
        let tree = StyleTree::Ternary {
            test: Span { start: 0, end: 1 },
            consequent: Box::new(StyleTree::String("red".into())),
            alternate: Box::new(StyleTree::String("blue".into())),
        };
        assert_eq!(
            project_literal(&tree),
            Some(Literal::Conditional(vec![
                Literal::String("red".into()),
                Literal::String("blue".into()),
            ]))
        );
    }

    #[test]
    fn project_literal_ternary_open_arm_encode_lenient() {
        let tree = StyleTree::Ternary {
            test: Span { start: 0, end: 1 },
            consequent: Box::new(StyleTree::Number(1.0)),
            alternate: Box::new(StyleTree::Open),
        };
        assert_eq!(project_literal(&tree), Some(Literal::Number(1.0)));
    }

    #[test]
    fn project_literal_and_peels_value() {
        let tree = StyleTree::And {
            test: Span { start: 0, end: 1 },
            value: Box::new(StyleTree::String("red".into())),
        };
        assert_eq!(project_literal(&tree), Some(Literal::String("red".into())));
    }

    #[test]
    fn expression_to_style_tree_property_ternary() {
        let tree = fold_style("{ opacity: isHovered ? 1 : 0 }").expect("tree");
        let StyleTree::Object(obj) = tree else {
            panic!("expected object");
        };
        let (_, value) = obj.entries.iter().find(|(k, _)| k == "opacity").unwrap();
        let StyleTree::Ternary {
            consequent,
            alternate,
            ..
        } = value
        else {
            panic!("expected ternary");
        };
        assert_eq!(**consequent, StyleTree::Number(1.0));
        assert_eq!(**alternate, StyleTree::Number(0.0));
    }

    #[test]
    fn expression_to_style_tree_or_is_open_with_fallback() {
        let tree = fold_style("{ color: maybeColor || 'gray' }").expect("tree");
        let StyleTree::Object(obj) = tree else {
            panic!("expected object");
        };
        let (_, value) = obj.entries.iter().find(|(k, _)| k == "color").unwrap();
        assert_eq!(
            value,
            &StyleTree::OpenWithFallback(Box::new(StyleTree::String("gray".into())))
        );
        assert_eq!(project_literal(value), Some(Literal::String("gray".into())));
    }

    #[test]
    fn project_literal_open_with_fallback_peels() {
        let tree = StyleTree::OpenWithFallback(Box::new(StyleTree::String("gray".into())));
        assert_eq!(project_literal(&tree), Some(Literal::String("gray".into())));
    }

    #[test]
    fn project_literal_matches_object_to_literal_for_static() {
        let source = "{ color: 'red', fontSize: 12 }";
        let tree = fold_style(source).expect("tree");
        let projected = project_literal(&tree).expect("literal");
        let allocator = Allocator::default();
        let wrapped = format!("({source})");
        let ret = Parser::new(&allocator, &wrapped, SourceType::tsx()).parse();
        let oxc_ast::ast::Statement::ExpressionStatement(stmt) = &ret.program.body[0] else {
            panic!("expr");
        };
        let expected = expression_to_literal(&stmt.expression, None).expect("lit");
        assert_eq!(projected, expected);
    }
}
