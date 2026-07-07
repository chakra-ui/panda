//! Resolved JSX / runtime component tags (`div`, `section`, `Link`, …).

use pandacss_extractor::{ExtractedJsx, JsxKind};

use super::parse::{ParsedAttribute, ParsedProperty};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum ElementTag {
    Intrinsic(String),
    Component(String),
}

impl ElementTag {
    pub(super) fn opening_name(&self) -> &str {
        match self {
            Self::Intrinsic(name) | Self::Component(name) => name.as_str(),
        }
    }

    pub(super) fn runtime_first_arg(&self) -> String {
        match self {
            Self::Intrinsic(name) => format!("'{name}'"),
            Self::Component(name) => name.clone(),
        }
    }
}

pub(super) fn is_simple_identifier(expression: &str) -> bool {
    let expression = expression.trim();
    let mut chars = expression.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    if !(first == '_' || first.is_ascii_alphabetic()) {
        return false;
    }
    chars.all(|ch| ch == '_' || ch.is_ascii_alphanumeric())
}

pub(super) fn parse_as_attribute(attr: &ParsedAttribute) -> Option<ElementTag> {
    if attr.name.as_deref() != Some("as") {
        return None;
    }
    if let Some(value) = attr.static_string_value() {
        return Some(ElementTag::Intrinsic(value));
    }
    let expr = attr.braced_expression_value()?;
    is_simple_identifier(&expr).then_some(ElementTag::Component(expr))
}

pub(super) fn parse_as_property(prop: &ParsedProperty) -> Option<ElementTag> {
    if prop.key.as_deref() != Some("as") {
        return None;
    }
    if let Some(value) = prop.static_string_value() {
        return Some(ElementTag::Intrinsic(value));
    }
    if let Some(ident) = prop.static_identifier_value() {
        return Some(ElementTag::Component(ident));
    }
    let expr = prop.braced_expression_value()?;
    is_simple_identifier(&expr).then_some(ElementTag::Component(expr))
}

pub(super) fn resolve_element_tag(
    jsx: &ExtractedJsx,
    as_from_attributes: Option<&[ParsedAttribute]>,
    as_from_properties: Option<&[ParsedProperty]>,
) -> Option<ElementTag> {
    if let Some(attrs) = as_from_attributes {
        for attr in attrs {
            if let Some(tag) = parse_as_attribute(attr) {
                return Some(tag);
            }
        }
        if attrs
            .iter()
            .any(|attr| attr.name.as_deref() == Some("as") && !attr.as_is_resolvable())
        {
            return None;
        }
    }

    if let Some(props) = as_from_properties {
        for prop in props {
            if let Some(tag) = parse_as_property(prop) {
                return Some(tag);
            }
        }
        if props
            .iter()
            .any(|prop| prop.key.as_deref() == Some("as") && !prop.as_is_resolvable())
        {
            return None;
        }
    }

    if jsx.kind == JsxKind::Factory && jsx.name.contains('.') {
        return jsx
            .name
            .rsplit('.')
            .next()
            .map(|segment| ElementTag::Intrinsic(segment.to_owned()));
    }

    Some(ElementTag::Intrinsic("div".to_owned()))
}
