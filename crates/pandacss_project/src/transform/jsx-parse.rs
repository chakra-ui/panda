//! Lightweight JSX attribute and object-literal parsers for rewrite printing.

use std::collections::HashSet;

use pandacss_extractor::{
    ExpressionFacts, ExpressionKind, JsxExtractionConfig, LogicalExpressionOperator, ObjectFacts,
    StyleSpread, StyleTree,
};

use super::helper::{ClassNamePrint, ExistingClassName};

#[derive(Debug)]
pub(super) struct ParsedOpeningElement {
    pub attributes: Vec<ParsedAttribute>,
    pub self_closing: bool,
}

impl ParsedOpeningElement {
    /// Builds from AST-located attribute spans, so boundaries are exact
    /// without brace/quote scanning.
    pub(super) fn from_ast(
        source: &str,
        attributes: &[pandacss_extractor::JsxAttr],
        self_closing: bool,
    ) -> Self {
        let attributes = attributes
            .iter()
            .filter_map(|attr| {
                let start = usize::try_from(attr.span.start).ok()?;
                let end = usize::try_from(attr.span.end).ok()?;
                Some(ParsedAttribute {
                    name: attr.name.clone(),
                    span: attr.span,
                    raw: source.get(start..end)?.to_owned(),
                    spread: attr.spread,
                    dynamic: attr.dynamic,
                    static_value: attr.static_value.clone(),
                    expression: attr
                        .value
                        .as_ref()
                        .and_then(|facts| ParsedExpression::from_facts(source, facts)),
                    spread_expression: attr
                        .spread_argument
                        .as_ref()
                        .and_then(|facts| ParsedExpression::from_facts(source, facts)),
                })
            })
            .collect();
        ParsedOpeningElement {
            attributes,
            self_closing,
        }
    }

    pub(super) fn has_unresolved_as_prop(&self) -> bool {
        self.attributes
            .iter()
            .any(|attr| attr.name.as_deref() == Some("as") && !attr.as_is_resolvable())
    }

    pub(super) fn existing_class_name(&self, class_attr: &str) -> ExistingClassName<'_> {
        let Some(attribute) = self
            .attributes
            .iter()
            .find(|attr| attr.name.as_deref() == Some(class_attr))
        else {
            return ExistingClassName::default();
        };
        if !attribute.is_dynamic() {
            return ExistingClassName {
                static_value: attribute.static_string_value(),
                ..Default::default()
            };
        }
        let expression = attribute.expression.as_ref();
        ExistingClassName {
            dynamic_value: expression.map(|expression| expression.source.as_str()),
            dynamic_kind: expression.map(|expression| expression.facts.kind),
            dynamic_array_insert: expression.and_then(ParsedExpression::array_insert),
            dynamic_array_has_elements: expression
                .is_some_and(|expression| expression.facts.array_has_elements),
            dynamic_parenthesize: expression
                .is_some_and(|expression| expression.facts.parenthesize_for_addition),
            ..Default::default()
        }
    }
}

#[derive(Debug)]
pub(super) struct ParsedAttribute {
    pub name: Option<String>,
    pub span: pandacss_shared::Span,
    pub raw: String,
    pub spread: bool,
    pub dynamic: bool,
    pub static_value: Option<String>,
    pub expression: Option<ParsedExpression>,
    pub spread_expression: Option<ParsedExpression>,
}

impl ParsedAttribute {
    pub(super) fn is_spread(&self) -> bool {
        self.spread
    }

    pub(super) fn is_dynamic(&self) -> bool {
        self.dynamic
    }

    pub(super) fn as_is_resolvable(&self) -> bool {
        if self.name.as_deref() != Some("as") {
            return true;
        }
        if self.static_string_value().is_some() {
            return true;
        }
        if self
            .expression
            .as_ref()
            .is_some_and(|expression| expression.facts.kind == ExpressionKind::Identifier)
        {
            return true;
        }
        !self.is_dynamic()
    }

    pub(super) fn static_string_value(&self) -> Option<&str> {
        (!self.spread)
            .then_some(self.static_value.as_deref())
            .flatten()
    }

    pub(super) fn expression_facts(&self) -> Option<&ExpressionFacts> {
        self.expression.as_ref().map(|expression| &expression.facts)
    }
}

#[derive(Debug)]
pub(crate) struct ParsedObjectLiteral {
    pub properties: Vec<ParsedProperty>,
}

impl ParsedObjectLiteral {
    pub(super) fn has_unresolved_as_prop(&self) -> bool {
        self.properties
            .iter()
            .any(|prop| prop.key.as_deref() == Some("as") && !prop.as_is_resolvable())
    }

    pub(super) fn existing_class_name(&self, class_attr: &str) -> ExistingClassName<'_> {
        let Some(property) = self
            .properties
            .iter()
            .find(|prop| prop.key.as_deref() == Some(class_attr))
        else {
            return ExistingClassName::default();
        };
        if let Some(value) = property.static_string_value() {
            return ExistingClassName {
                static_value: Some(value),
                ..Default::default()
            };
        }
        let expression = property.value.as_ref();
        ExistingClassName {
            dynamic_value: expression.map(|expression| expression.source.as_str()),
            dynamic_kind: expression.map(|expression| expression.facts.kind),
            dynamic_array_insert: expression.and_then(ParsedExpression::array_insert),
            dynamic_array_has_elements: expression
                .is_some_and(|expression| expression.facts.array_has_elements),
            dynamic_parenthesize: expression
                .is_some_and(|expression| expression.facts.parenthesize_for_addition),
            ..Default::default()
        }
    }
}

#[derive(Debug)]
pub(crate) struct ParsedProperty {
    pub key: Option<String>,
    pub span: pandacss_shared::Span,
    pub raw: String,
    pub value: Option<ParsedExpression>,
    pub spread_expression: Option<ParsedExpression>,
}

impl ParsedProperty {
    pub(super) fn is_spread(&self) -> bool {
        self.spread_expression.is_some()
    }

    pub(super) fn as_is_resolvable(&self) -> bool {
        if self.key.as_deref() != Some("as") {
            return true;
        }
        if self.static_string_value().is_some() || self.static_identifier_value().is_some() {
            return true;
        }
        self.value
            .as_ref()
            .is_some_and(|value| value.facts.kind == ExpressionKind::Identifier)
    }

    pub(super) fn static_string_value(&self) -> Option<&str> {
        self.value
            .as_ref()
            .and_then(|value| value.facts.string_value.as_deref())
    }

    pub(super) fn static_identifier_value(&self) -> Option<&str> {
        self.value
            .as_ref()
            .and_then(|value| value.facts.identifier.as_deref())
    }

    pub(super) fn value_is_dynamic(&self) -> bool {
        self.value.as_ref().is_some_and(|value| {
            !matches!(
                value.facts.kind,
                ExpressionKind::String | ExpressionKind::Static
            )
        })
    }

    pub(super) fn expression_facts(&self) -> Option<&ExpressionFacts> {
        self.value.as_ref().map(|value| &value.facts)
    }
}

#[derive(Debug, Clone)]
pub(super) struct ParsedExpression {
    pub source: String,
    pub facts: ExpressionFacts,
}

impl ParsedExpression {
    fn from_facts(source: &str, facts: &ExpressionFacts) -> Option<Self> {
        let start = usize::try_from(facts.span.start).ok()?;
        let end = usize::try_from(facts.span.end).ok()?;
        Some(Self {
            source: source.get(start..end)?.to_owned(),
            facts: facts.clone(),
        })
    }

    fn array_insert(&self) -> Option<usize> {
        if self.facts.kind != ExpressionKind::Array {
            return None;
        }
        self.facts
            .array_append_at?
            .checked_sub(self.facts.span.start)
            .and_then(|offset| usize::try_from(offset).ok())
            .filter(|offset| *offset <= self.source.len())
    }
}

pub(crate) fn parsed_object_from_facts(
    source: &str,
    object: &ObjectFacts,
) -> Option<ParsedObjectLiteral> {
    let properties = object
        .properties
        .iter()
        .map(|property| {
            let start = usize::try_from(property.span.start).ok()?;
            let end = usize::try_from(property.span.end).ok()?;
            Some(ParsedProperty {
                key: property.key.clone(),
                span: property.span,
                raw: source.get(start..end)?.to_owned(),
                value: property
                    .value
                    .as_ref()
                    .and_then(|facts| ParsedExpression::from_facts(source, facts)),
                spread_expression: property
                    .spread_argument
                    .as_ref()
                    .and_then(|facts| ParsedExpression::from_facts(source, facts)),
            })
        })
        .collect::<Option<Vec<_>>>()?;
    Some(ParsedObjectLiteral { properties })
}

#[derive(Clone, Copy)]
pub(super) enum SpreadSyntax {
    JsxAttribute,
    ObjectProperty,
}

enum ConditionalSpreadParts {
    Ternary {
        condition: String,
        consequent: ResidualObject,
        alternate: ResidualObject,
    },
    And {
        condition: String,
        consequent: ResidualObject,
    },
}

struct ResidualObject {
    properties: Vec<String>,
    has_runtime_props: bool,
}

pub(super) enum ConditionalSpreadPlan {
    None,
    StyleOnly,
    Runtime(ConditionalSpreadRewrite),
}

pub(super) struct ConditionalSpreadRewrite {
    parts: ConditionalSpreadParts,
    syntax: SpreadSyntax,
}

impl ConditionalSpreadRewrite {
    /// Add the generated class to each branch. This evaluates the condition
    /// once and preserves property order.
    pub(super) fn embed_class(
        &self,
        class_attr: &str,
        class_print: &ClassNamePrint,
    ) -> Option<String> {
        let class_expression = &class_print.expression;
        let class_ternary = class_print.ternary.as_ref();

        let expression = match &self.parts {
            ConditionalSpreadParts::Ternary {
                condition,
                consequent,
                alternate,
            } => {
                let (consequent_class, alternate_class) = class_ternary.map_or_else(
                    || (class_expression.as_str(), class_expression.as_str()),
                    |ternary| (ternary.consequent.as_str(), ternary.alternate.as_str()),
                );
                if class_ternary
                    .is_some_and(|ternary| !same_expression(condition, &ternary.condition))
                {
                    return None;
                }
                format!(
                    "{condition} ? {} : {}",
                    render_object(consequent, class_attr, consequent_class),
                    render_object(alternate, class_attr, alternate_class)
                )
            }
            ConditionalSpreadParts::And {
                condition,
                consequent,
            } => {
                let (consequent_class, alternate_class) = class_ternary.map_or_else(
                    || (class_expression.as_str(), class_expression.as_str()),
                    |ternary| (ternary.consequent.as_str(), ternary.alternate.as_str()),
                );
                if class_ternary
                    .is_some_and(|ternary| !same_expression(condition, &ternary.condition))
                {
                    return None;
                }
                format!(
                    "{condition} ? {} : {}",
                    render_object(consequent, class_attr, consequent_class),
                    render_empty_object(class_attr, alternate_class),
                )
            }
        };

        Some(match self.syntax {
            SpreadSyntax::JsxAttribute => format!("{{...({expression})}}"),
            SpreadSyntax::ObjectProperty => format!("...({expression})"),
        })
    }
}

/// Analyze each source spread once. Returns `None` if any rewrite could change
/// runtime behavior.
pub(super) fn plan_conditional_spreads<'a>(
    source: &str,
    source_spreads: impl Iterator<Item = &'a ParsedExpression>,
    style: Option<&StyleTree>,
    syntax: SpreadSyntax,
    jsx: &JsxExtractionConfig,
    tag_name: &str,
    class_attr: &str,
) -> Option<ConditionalSpreadPlan> {
    let mut source_spreads = source_spreads.peekable();
    if source_spreads.peek().is_none() {
        return Some(ConditionalSpreadPlan::None);
    }
    let StyleTree::Object(style) = style? else {
        return None;
    };
    let mut style_spreads = style.spreads.iter().peekable();
    let mut count = 0_usize;
    let mut runtime = None;

    for expression in source_spreads {
        let parts = style_spreads.peek().and_then(|spread| {
            matches!(
                spread,
                StyleSpread::Ternary { .. } | StyleSpread::And { .. }
            )
            .then(|| {
                conditional_spread_parts(source, expression, spread, jsx, tag_name, class_attr)
            })
            .flatten()
        });
        let Some(parts) = parts else {
            if is_style_only_object_spread(source, expression, jsx, tag_name, class_attr) {
                continue;
            }
            return None;
        };
        style_spreads.next();
        let has_runtime_props = match &parts {
            ConditionalSpreadParts::Ternary {
                consequent,
                alternate,
                ..
            } => consequent.has_runtime_props || alternate.has_runtime_props,
            ConditionalSpreadParts::And { consequent, .. } => consequent.has_runtime_props,
        };
        if has_runtime_props {
            if runtime.is_some() {
                return None;
            }
            runtime = Some(ConditionalSpreadRewrite { parts, syntax });
        }
        count += 1;
    }
    if style_spreads.next().is_some() {
        return None;
    }
    if count == 0 {
        return None;
    }

    let Some(runtime) = runtime else {
        return Some(ConditionalSpreadPlan::StyleOnly);
    };
    if count != 1
        || style.entries.iter().any(|(_, value)| {
            super::style_lower::style_tree_has_rewrite_sites(value)
                || super::style_lower::style_tree_has_open_value(value)
        })
        || !spread_arms_are_static(&style.spreads[0])
    {
        return None;
    }
    Some(ConditionalSpreadPlan::Runtime(runtime))
}

fn is_style_only_object_spread(
    source: &str,
    expression: &ParsedExpression,
    jsx: &JsxExtractionConfig,
    tag_name: &str,
    class_attr: &str,
) -> bool {
    let Some(object) = expression.facts.object.as_ref() else {
        return false;
    };
    let Some(parsed) = parsed_object_from_facts(source, object) else {
        return false;
    };

    parsed.properties.iter().all(|property| {
        let Some(key) = property.key.as_deref() else {
            return false;
        };
        key != "as"
            && key != class_attr
            && !super::jsx_shared::should_skip_style_prop(key)
            && jsx.should_extract_prop(tag_name, key)
    })
}

fn spread_arms_are_static(spread: &StyleSpread) -> bool {
    match spread {
        StyleSpread::Ternary {
            consequent,
            alternate,
            ..
        } => {
            !super::style_lower::style_tree_has_rewrite_sites(consequent)
                && !super::style_lower::style_tree_has_rewrite_sites(alternate)
                && !super::style_lower::style_tree_has_open_value(consequent)
                && !super::style_lower::style_tree_has_open_value(alternate)
        }
        StyleSpread::And { value, .. } => {
            !super::style_lower::style_tree_has_rewrite_sites(value)
                && !super::style_lower::style_tree_has_open_value(value)
        }
        StyleSpread::Open | StyleSpread::OpenWithFallback { .. } => false,
    }
}

fn conditional_spread_parts(
    source: &str,
    expression: &ParsedExpression,
    spread: &StyleSpread,
    jsx: &JsxExtractionConfig,
    tag_name: &str,
    class_attr: &str,
) -> Option<ConditionalSpreadParts> {
    match spread {
        StyleSpread::Ternary {
            consequent,
            alternate,
            ..
        } => {
            let parsed = expression.facts.conditional.as_ref()?;
            Some(ConditionalSpreadParts::Ternary {
                condition: source_slice(source, parsed.test.span)?.to_owned(),
                consequent: residual_object(
                    source,
                    parsed.consequent.object.as_ref()?,
                    consequent,
                    jsx,
                    tag_name,
                    class_attr,
                )?,
                alternate: residual_object(
                    source,
                    parsed.alternate.object.as_ref()?,
                    alternate,
                    jsx,
                    tag_name,
                    class_attr,
                )?,
            })
        }
        StyleSpread::And { value, .. } => {
            let parsed = expression.facts.logical.as_ref()?;
            if parsed.operator != LogicalExpressionOperator::And {
                return None;
            }
            Some(ConditionalSpreadParts::And {
                condition: source_slice(source, parsed.left.span)?.to_owned(),
                consequent: residual_object(
                    source,
                    parsed.right.object.as_ref()?,
                    value,
                    jsx,
                    tag_name,
                    class_attr,
                )?,
            })
        }
        StyleSpread::Open | StyleSpread::OpenWithFallback { .. } => None,
    }
}

fn residual_object(
    source: &str,
    object: &ObjectFacts,
    extracted: &StyleTree,
    jsx: &JsxExtractionConfig,
    tag_name: &str,
    class_attr: &str,
) -> Option<ResidualObject> {
    let StyleTree::Object(style) = extracted else {
        return None;
    };
    let extracted_keys: HashSet<&str> = style.entries.iter().map(|(key, _)| key.as_str()).collect();
    let parsed = parsed_object_from_facts(source, object)?;
    let mut properties = Vec::with_capacity(parsed.properties.len());

    for property in parsed.properties {
        let Some(key) = property.key.as_deref() else {
            // Computed keys and nested spreads may affect runtime props.
            return None;
        };
        if extracted_keys.contains(key) {
            continue;
        }
        if key == "as" || key == class_attr {
            return None;
        }
        if !super::jsx_shared::should_skip_style_prop(key) && jsx.should_extract_prop(tag_name, key)
        {
            // This is a style prop, but its value could not be extracted.
            return None;
        }
        properties.push(property.raw);
    }

    let has_runtime_props = !properties.is_empty();
    Some(ResidualObject {
        properties,
        has_runtime_props,
    })
}

fn render_object(residual: &ResidualObject, class_attr: &str, class_value: &str) -> String {
    let mut out = String::from("{ ");
    for property in &residual.properties {
        out.push_str(property);
        out.push_str(", ");
    }
    out.push_str(class_attr);
    out.push_str(": ");
    out.push_str(class_value.trim());
    out.push_str(" }");
    out
}

fn render_empty_object(class_attr: &str, class_value: &str) -> String {
    format!("{{ {class_attr}: {} }}", class_value.trim())
}

fn same_expression(left: &str, right: &str) -> bool {
    left.trim() == right.trim()
}

fn source_slice(source: &str, span: pandacss_shared::Span) -> Option<&str> {
    let start = usize::try_from(span.start).ok()?;
    let end = usize::try_from(span.end).ok()?;
    source.get(start..end)
}
