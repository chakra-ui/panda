//! Owned export expressions whose pattern calls need the consuming host.
//!
//! Object writes stay ordered until every spread has its real value. These
//! descriptors never enter `Literal`, the encoder, or a host callback.

use std::sync::Arc;

use oxc_ast::ast::{
    ArrayExpressionElement, BindingPattern, Expression, LogicalOperator, ObjectExpression,
    ObjectPropertyKind, PropertyKind,
};
use oxc_semantic::SymbolId;

use crate::literal::{logical_uses_right, property_key_to_string};
use crate::pure_fn::{OwnedPureFn, apply_pure_fn};
use crate::style_tree::{expression_to_style_tree, literal_to_style_tree, project_literal};
use crate::{Literal, MatchCategory, Resolver, Span, StyleObject, StyleTree};

/// Private export plan; pattern callbacks run only when the importer resolves it.
#[derive(Debug, Clone)]
pub(crate) enum DeferredValue {
    Literal(Literal),
    Object(Vec<ObjectPart>),
    Array(Vec<ArrayPart>),
    PatternRaw {
        name: String,
        props: Box<Self>,
    },
    Call {
        function: Arc<OwnedPureFn>,
        args: Vec<Self>,
    },
    Member {
        object: Box<Self>,
        key: Box<Self>,
    },
    Binding {
        source: Box<Self>,
        path: Vec<BindingStep>,
    },
    Alternatives(Vec<Self>),
    Fallback(Box<Self>),
    Unknown,
}

#[derive(Debug, Clone)]
pub(crate) enum ObjectPart {
    Property(String, DeferredValue),
    Spread(DeferredValue),
}

#[derive(Debug, Clone)]
pub(crate) enum ArrayPart {
    Item(DeferredValue),
    Spread(DeferredValue),
}

#[derive(Debug, Clone)]
pub(crate) enum BindingStep {
    Property(String),
    ObjectRest(Vec<String>),
    ArrayRest(usize),
    Default(DeferredValue),
}

impl DeferredValue {
    #[must_use]
    pub(crate) fn needs_pattern(&self) -> bool {
        match self {
            Self::PatternRaw { .. } => true,
            Self::Call { args, .. } => args.iter().any(Self::needs_pattern),
            Self::Object(parts) => parts.iter().any(|part| match part {
                ObjectPart::Property(_, value) | ObjectPart::Spread(value) => value.needs_pattern(),
            }),
            Self::Array(parts) => parts.iter().any(|part| match part {
                ArrayPart::Item(value) | ArrayPart::Spread(value) => value.needs_pattern(),
            }),
            Self::Member { object, key } => object.needs_pattern() || key.needs_pattern(),
            Self::Binding { source, path } => {
                source.needs_pattern()
                    || path.iter().any(
                        |step| matches!(step, BindingStep::Default(value) if value.needs_pattern()),
                    )
            }
            Self::Alternatives(values) => values.iter().any(Self::needs_pattern),
            Self::Fallback(value) => value.needs_pattern(),
            Self::Literal(_) | Self::Unknown => false,
        }
    }

    /// Evaluate in the importing extraction; never retain callback output in the export cache.
    #[must_use]
    pub(crate) fn resolve(&self, resolver: &Resolver<'_, '_>, anchor: Span) -> StyleTree {
        let open = StyleTree::Open { span: anchor };
        match self {
            Self::Literal(value) => literal_to_style_tree(value.clone()),
            Self::Unknown => open,
            Self::Fallback(value) => StyleTree::OpenWithFallback {
                span: anchor,
                fallback: Box::new(value.resolve(resolver, anchor)),
            },
            Self::Alternatives(values) => StyleTree::Branches(
                values
                    .iter()
                    .map(|value| value.resolve(resolver, anchor))
                    .collect(),
            ),
            Self::PatternRaw { name, props } => {
                let props = props.resolve(resolver, anchor);
                if !props.is_static() {
                    return open;
                }
                project_literal(&props)
                    .and_then(|props| resolver.pattern_raw_styles(name, &props))
                    .map_or(open, literal_to_style_tree)
            }
            Self::Call { function, args } => {
                let args: Option<Vec<_>> = args
                    .iter()
                    .map(|arg| {
                        let tree = arg.resolve(resolver, anchor);
                        tree.is_static().then(|| project_literal(&tree)).flatten()
                    })
                    .collect();
                args.and_then(|args| apply_pure_fn(function, &args))
                    .map_or(open, literal_to_style_tree)
            }
            Self::Object(parts) => resolve_object(parts, resolver, anchor),
            Self::Array(parts) => resolve_array(parts, resolver, anchor),
            Self::Binding { source, path } => {
                resolve_binding(source.resolve(resolver, anchor), path, resolver, anchor)
            }
            Self::Member { object, key } => {
                let object = object.resolve(resolver, anchor);
                let key = key.resolve(resolver, anchor);
                if !key.is_static() {
                    return open;
                }
                project_literal(&key)
                    .and_then(|key| key.to_property_key())
                    .and_then(|key| crate::style_tree::lookup_style_member(&object, &key))
                    .unwrap_or(open)
            }
        }
    }
}

fn resolve_object(parts: &[ObjectPart], resolver: &Resolver<'_, '_>, anchor: Span) -> StyleTree {
    let mut entries = Vec::with_capacity(parts.len());
    let mut open_spread = false;
    for part in parts {
        match part {
            ObjectPart::Property(key, value) => {
                upsert(&mut entries, key.clone(), value.resolve(resolver, anchor));
            }
            ObjectPart::Spread(value) => match value.resolve(resolver, anchor) {
                StyleTree::Object(object) if object.spreads.is_empty() => {
                    for (key, value) in object.entries {
                        upsert(&mut entries, key, value);
                    }
                }
                StyleTree::Null | StyleTree::Bool(_) | StyleTree::Number(_) => {}
                // Keep known CSS without claiming that an unknown spread is empty.
                fallback => {
                    open_spread = true;
                    if let Some(known) = project_literal(&fallback) {
                        let mut alternatives = Vec::new();
                        collect_spread_styles(known, &mut alternatives);
                        for (key, mut value) in alternatives {
                            if let Some((_, previous)) =
                                entries.iter().find(|(name, _)| name == &key)
                                && let Some(previous) = project_literal(previous)
                                && previous != value
                            {
                                value = Literal::Conditional(vec![previous, value]);
                            }
                            upsert(&mut entries, key, literal_to_style_tree(value));
                        }
                    }
                }
            },
        }
    }
    let object = StyleTree::Object(StyleObject {
        entries,
        spreads: Vec::new(),
    });
    if open_spread {
        StyleTree::OpenWithFallback {
            span: anchor,
            fallback: Box::new(object),
        }
    } else {
        object
    }
}

fn collect_spread_styles(value: Literal, entries: &mut Vec<(String, Literal)>) {
    match value {
        Literal::Object(properties) => {
            for (key, value) in properties {
                Literal::combine_object_entry(entries, key, value);
            }
        }
        Literal::Conditional(branches) => {
            for branch in branches {
                collect_spread_styles(branch, entries);
            }
        }
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null
        | Literal::Array(_) => {}
    }
}

fn upsert(entries: &mut Vec<(String, StyleTree)>, key: String, value: StyleTree) {
    if let Some((_, existing)) = entries.iter_mut().find(|(existing, _)| existing == &key) {
        *existing = value;
    } else {
        entries.push((key, value));
    }
}

fn resolve_array(parts: &[ArrayPart], resolver: &Resolver<'_, '_>, anchor: Span) -> StyleTree {
    let mut items = Vec::with_capacity(parts.len());
    for part in parts {
        match part {
            ArrayPart::Item(value) => items.push(value.resolve(resolver, anchor)),
            ArrayPart::Spread(value) => match value.resolve(resolver, anchor) {
                StyleTree::Array(values) => items.extend(values),
                _ => return StyleTree::Open { span: anchor },
            },
        }
    }
    StyleTree::Array(items)
}

/// Lower only the container structure needed to defer pattern calls; other
/// expressions keep the ordinary evaluator's static/fallback semantics.
#[must_use]
pub(crate) fn lower(expr: &Expression<'_>, resolver: &Resolver<'_, '_>) -> DeferredValue {
    match expr.get_inner_expression() {
        Expression::Identifier(ident) => resolver
            .resolve_deferred_identifier(ident)
            .unwrap_or_else(|| folded(expr, resolver)),
        Expression::ObjectExpression(object) => lower_object(object, resolver),
        Expression::ArrayExpression(array) => DeferredValue::Array(
            array
                .elements
                .iter()
                .map(|element| match element {
                    ArrayExpressionElement::SpreadElement(spread) => {
                        ArrayPart::Spread(lower(&spread.argument, resolver))
                    }
                    ArrayExpressionElement::Elision(_) => {
                        ArrayPart::Item(DeferredValue::Literal(Literal::Null))
                    }
                    element => ArrayPart::Item(
                        element
                            .as_expression()
                            .map_or(DeferredValue::Unknown, |expr| lower(expr, resolver)),
                    ),
                })
                .collect(),
        ),
        Expression::CallExpression(call) => {
            lower_call(call, resolver).unwrap_or_else(|| folded(expr, resolver))
        }
        Expression::StaticMemberExpression(member) => DeferredValue::Member {
            object: Box::new(lower(&member.object, resolver)),
            key: Box::new(DeferredValue::Literal(Literal::String(
                member.property.name.to_string(),
            ))),
        },
        Expression::ComputedMemberExpression(member) => DeferredValue::Member {
            object: Box::new(lower(&member.object, resolver)),
            key: Box::new(lower(&member.expression, resolver)),
        },
        Expression::ConditionalExpression(condition) => {
            let test = expression_to_style_tree(&condition.test, Some(resolver));
            if let Some(truthy) = test
                .filter(StyleTree::is_static)
                .as_ref()
                .and_then(project_literal)
                .as_ref()
                .and_then(Literal::truthiness)
            {
                lower(
                    if truthy {
                        &condition.consequent
                    } else {
                        &condition.alternate
                    },
                    resolver,
                )
            } else {
                DeferredValue::Alternatives(vec![
                    lower(&condition.consequent, resolver),
                    lower(&condition.alternate, resolver),
                ])
            }
        }
        Expression::LogicalExpression(logical) => {
            let left = expression_to_style_tree(&logical.left, Some(resolver));
            if let Some(left) = left
                .filter(StyleTree::is_static)
                .as_ref()
                .and_then(project_literal)
            {
                match logical_uses_right(logical.operator, &left) {
                    Some(true) => lower(&logical.right, resolver),
                    Some(false) => DeferredValue::Literal(left),
                    None if logical.operator != LogicalOperator::And => {
                        let mut alternatives = left
                            .values_kept_by_default(logical.operator == LogicalOperator::Coalesce)
                            .into_iter()
                            .cloned()
                            .map(DeferredValue::Literal)
                            .collect::<Vec<_>>();
                        alternatives.push(lower(&logical.right, resolver));
                        DeferredValue::Alternatives(alternatives)
                    }
                    None => DeferredValue::Fallback(Box::new(lower(&logical.right, resolver))),
                }
            } else {
                DeferredValue::Fallback(Box::new(lower(&logical.right, resolver)))
            }
        }
        _ => folded(expr, resolver),
    }
}

fn lower_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    resolver: &Resolver<'_, '_>,
) -> Option<DeferredValue> {
    if call.optional {
        return Some(DeferredValue::Unknown);
    }
    if let Some((name, category)) = resolver.match_raw_style_call(call) {
        let props = match call.arguments.as_slice() {
            [] => DeferredValue::Literal(Literal::Object(Vec::new())),
            [arg] => arg
                .as_expression()
                .map_or(DeferredValue::Unknown, |expr| lower(expr, resolver)),
            _ => return Some(DeferredValue::Unknown),
        };
        return Some(if category == MatchCategory::Pattern {
            DeferredValue::PatternRaw {
                name: name.to_owned(),
                props: Box::new(props),
            }
        } else {
            props
        });
    }
    if let Some(function) = resolver.lookup_callable(&call.callee) {
        let args = call
            .arguments
            .iter()
            .map(|arg| {
                arg.as_expression()
                    .map_or(DeferredValue::Unknown, |expr| lower(expr, resolver))
            })
            .collect();
        Some(DeferredValue::Call {
            function: Arc::new(function),
            args,
        })
    } else {
        None
    }
}

fn lower_object(object: &ObjectExpression<'_>, resolver: &Resolver<'_, '_>) -> DeferredValue {
    let parts = object
        .properties
        .iter()
        .map(|part| match part {
            ObjectPropertyKind::SpreadProperty(spread) => {
                ObjectPart::Spread(lower(&spread.argument, resolver))
            }
            ObjectPropertyKind::ObjectProperty(prop) => {
                let Some(key) = property_key_to_string(&prop.key, prop.computed, Some(resolver))
                else {
                    return ObjectPart::Spread(DeferredValue::Unknown);
                };
                let value = if prop.method || prop.kind != PropertyKind::Init {
                    DeferredValue::Unknown
                } else {
                    lower(&prop.value, resolver)
                };
                ObjectPart::Property(key, value)
            }
        })
        .collect();
    DeferredValue::Object(parts)
}

/// Keep destructuring as reads after the source expression has resolved.
#[must_use]
pub(crate) fn binding_path(
    pattern: &BindingPattern<'_>,
    target: SymbolId,
    resolver: &Resolver<'_, '_>,
) -> Option<Vec<BindingStep>> {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            (id.symbol_id.get() == Some(target)).then(Vec::new)
        }
        BindingPattern::AssignmentPattern(assignment) => {
            let mut path = binding_path(&assignment.left, target, resolver)?;
            path.insert(0, BindingStep::Default(lower(&assignment.right, resolver)));
            Some(path)
        }
        BindingPattern::ObjectPattern(object) => {
            let mut consumed = Vec::with_capacity(object.properties.len());
            for prop in &object.properties {
                let key =
                    crate::scope::binding_property_key(&prop.key, prop.computed, Some(resolver))?;
                consumed.push(key.clone());
                if let Some(mut path) = binding_path(&prop.value, target, resolver) {
                    path.insert(0, BindingStep::Property(key));
                    return Some(path);
                }
            }
            let mut path = binding_path(&object.rest.as_ref()?.argument, target, resolver)?;
            path.insert(0, BindingStep::ObjectRest(consumed));
            Some(path)
        }
        BindingPattern::ArrayPattern(array) => {
            for (index, pattern) in array.elements.iter().enumerate() {
                if let Some(mut path) = pattern
                    .as_ref()
                    .and_then(|pattern| binding_path(pattern, target, resolver))
                {
                    path.insert(0, BindingStep::Property(index.to_string()));
                    return Some(path);
                }
            }
            let mut path = binding_path(&array.rest.as_ref()?.argument, target, resolver)?;
            path.insert(0, BindingStep::ArrayRest(array.elements.len()));
            Some(path)
        }
    }
}

fn resolve_binding(
    source: StyleTree,
    path: &[BindingStep],
    resolver: &Resolver<'_, '_>,
    anchor: Span,
) -> StyleTree {
    let open = || StyleTree::Open { span: anchor };
    let mut value = Some(source);
    for step in path {
        value = match (step, value) {
            (BindingStep::Default(fallback), None) => Some(fallback.resolve(resolver, anchor)),
            (BindingStep::Default(_), known) => known,
            (BindingStep::Property(key), Some(StyleTree::Object(object)))
                if object.spreads.is_empty() =>
            {
                object
                    .entries
                    .into_iter()
                    .find(|(name, _)| name == key)
                    .map(|(_, value)| value)
            }
            (BindingStep::Property(key), Some(StyleTree::Array(items))) => key
                .parse::<usize>()
                .ok()
                .and_then(|index| items.into_iter().nth(index)),
            (BindingStep::Property(key), Some(other)) => {
                Some(crate::style_tree::lookup_style_member(&other, key).unwrap_or_else(open))
            }
            (BindingStep::ObjectRest(excluded), Some(StyleTree::Object(mut object)))
                if object.spreads.is_empty() =>
            {
                object.entries.retain(|(key, _)| !excluded.contains(key));
                Some(StyleTree::Object(object))
            }
            (BindingStep::ArrayRest(start), Some(StyleTree::Array(items))) => {
                Some(StyleTree::Array(items.into_iter().skip(*start).collect()))
            }
            _ => Some(open()),
        };
    }
    value.unwrap_or_else(open)
}

fn folded(expr: &Expression<'_>, resolver: &Resolver<'_, '_>) -> DeferredValue {
    let Some(tree) = expression_to_style_tree(expr, Some(resolver)) else {
        return DeferredValue::Unknown;
    };
    let is_static = tree.is_static();
    let Some(value) = project_literal(&tree) else {
        return DeferredValue::Unknown;
    };
    let value = DeferredValue::Literal(value);
    if is_static {
        value
    } else {
        DeferredValue::Fallback(Box::new(value))
    }
}
