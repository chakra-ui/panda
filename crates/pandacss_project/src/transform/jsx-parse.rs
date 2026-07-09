//! Lightweight JSX attribute and object-literal parsers for rewrite printing.

pub(crate) fn is_jsx_element_syntax(slice: &str) -> bool {
    slice.trim_start().starts_with('<')
}

#[derive(Debug)]
pub(super) struct ParsedOpeningElement {
    pub attributes: Vec<ParsedAttribute>,
    pub self_closing: bool,
}

impl ParsedOpeningElement {
    /// Build from AST-located attribute spans so boundaries are exact (no
    /// brace/quote scanning). Per-attribute value parsing still reads the
    /// correctly-bounded `raw`.
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
                    raw: source.get(start..end)?.to_owned(),
                    spread: attr.spread,
                    dynamic: attr.dynamic,
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

    pub(super) fn static_class_name(&self) -> Option<String> {
        for attr in &self.attributes {
            if attr.name.as_deref() == Some("className") && !attr.is_dynamic() {
                return attr.static_string_value();
            }
        }
        None
    }

    pub(super) fn dynamic_class_name_expression(&self) -> Option<String> {
        for attr in &self.attributes {
            if attr.name.as_deref() == Some("className") && attr.is_dynamic() {
                return attr.braced_expression_value();
            }
        }
        None
    }
}

#[derive(Debug)]
pub(super) struct ParsedAttribute {
    pub name: Option<String>,
    pub raw: String,
    pub spread: bool,
    pub dynamic: bool,
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
        if let Some(expr) = self.braced_expression_value() {
            return super::jsx_shared::is_simple_identifier(&expr);
        }
        !self.is_dynamic()
    }

    pub(super) fn static_string_value(&self) -> Option<String> {
        if self.spread || self.dynamic {
            return None;
        }
        let raw = self.raw.trim();
        let value = raw.split_once('=').map_or(raw, |(_, value)| value.trim());
        parse_static_jsx_string(value)
    }

    pub(super) fn braced_expression_value(&self) -> Option<String> {
        if self.spread || !self.dynamic {
            return None;
        }
        let value = self.raw.split_once('=')?.1.trim();
        let inner = value.strip_prefix('{')?.strip_suffix('}')?.trim();
        (!inner.is_empty()).then(|| inner.to_owned())
    }

    pub(super) fn expression_source(&self) -> Option<String> {
        if self.spread {
            return None;
        }
        if let Some(expr) = self.braced_expression_value() {
            return Some(expr);
        }
        let value = self.raw.split_once(':')?.1.trim();
        (!value.is_empty()).then(|| value.to_owned())
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

    pub(super) fn static_class_name(&self) -> Option<String> {
        for prop in &self.properties {
            if prop.key.as_deref() == Some("className") {
                return prop.static_string_value();
            }
        }
        None
    }

    pub(super) fn dynamic_class_name_expression(&self) -> Option<String> {
        for prop in &self.properties {
            if prop.key.as_deref() == Some("className") {
                if prop.static_string_value().is_some() {
                    return None;
                }
                return prop.expression_source();
            }
        }
        None
    }
}

#[derive(Debug)]
pub(crate) struct ParsedProperty {
    pub key: Option<String>,
    pub raw: String,
    pub spread: bool,
    pub value_is_dynamic: bool,
}

impl ParsedProperty {
    pub(super) fn is_spread(&self) -> bool {
        self.spread
    }

    pub(super) fn as_is_resolvable(&self) -> bool {
        if self.key.as_deref() != Some("as") {
            return true;
        }
        if self.static_string_value().is_some() || self.static_identifier_value().is_some() {
            return true;
        }
        if let Some(expr) = self.braced_expression_value() {
            return super::jsx_shared::is_simple_identifier(&expr);
        }
        false
    }

    pub(super) fn static_string_value(&self) -> Option<String> {
        let value = self.value_slice()?;
        parse_static_jsx_string(value.trim())
    }

    pub(super) fn static_identifier_value(&self) -> Option<String> {
        if self.spread || self.value_is_dynamic() {
            return None;
        }
        let value = self.value_slice()?.trim();
        super::jsx_shared::is_simple_identifier(value).then(|| value.to_owned())
    }

    pub(super) fn braced_expression_value(&self) -> Option<String> {
        if self.spread || !self.value_is_dynamic() {
            return None;
        }
        let value = self.value_slice()?.trim();
        let inner = value.strip_prefix('{')?.strip_suffix('}')?.trim();
        (!inner.is_empty()).then(|| inner.to_owned())
    }

    pub(crate) fn spread_expression(&self) -> Option<String> {
        if !self.spread {
            return None;
        }
        self.raw
            .strip_prefix("...")
            .map(str::trim)
            .filter(|expr| !expr.is_empty())
            .map(ToOwned::to_owned)
    }

    pub(crate) fn expression_source(&self) -> Option<String> {
        if self.spread {
            return None;
        }
        if let Some(expr) = self.braced_expression_value() {
            return Some(expr);
        }
        let value = self.value_slice()?.trim();
        (!value.is_empty()).then(|| value.to_owned())
    }

    pub(super) fn value_is_dynamic(&self) -> bool {
        self.value_is_dynamic
    }

    fn value_slice(&self) -> Option<&str> {
        self.raw.split_once(':').map(|(_, value)| value)
    }
}

#[derive(Debug)]
pub(super) struct ParsedCallExpression {
    pub callee: String,
    pub args: Vec<String>,
}

pub(super) fn parse_call_expression(slice: &str) -> Option<ParsedCallExpression> {
    let call = pandacss_extractor::parse_call_fragment(slice.trim())?;
    Some(ParsedCallExpression {
        callee: call.callee,
        args: call.args,
    })
}

pub(crate) fn parse_object_literal(slice: &str) -> Option<ParsedObjectLiteral> {
    let properties = pandacss_extractor::parse_object_fragment(slice.trim())?
        .into_iter()
        .map(|property| ParsedProperty {
            key: property.key,
            raw: property.raw,
            spread: property.spread,
            value_is_dynamic: property.value_is_dynamic,
        })
        .collect();
    Some(ParsedObjectLiteral { properties })
}

pub(crate) fn parse_static_string(value: &str) -> Option<String> {
    parse_static_jsx_string(value)
}

fn parse_static_jsx_string(value: &str) -> Option<String> {
    if (value.starts_with('"') && value.ends_with('"'))
        || (value.starts_with('\'') && value.ends_with('\''))
    {
        return Some(unquote(value));
    }
    if value.starts_with('{') && value.ends_with('}') {
        let inner = value[1..value.len() - 1].trim();
        if (inner.starts_with('"') && inner.ends_with('"'))
            || (inner.starts_with('\'') && inner.ends_with('\''))
        {
            return Some(unquote(inner));
        }
    }
    None
}

fn unquote(value: &str) -> String {
    value
        .trim_matches('"')
        .trim_matches('\'')
        .replace("\\\"", "\"")
        .replace("\\'", "'")
}

// --- ternary (merged from ternary.rs) ---
#[derive(Debug, Clone)]
pub(crate) struct ParsedTernary {
    pub condition: String,
    #[allow(dead_code, reason = "reserved for branch source validation")]
    pub consequent: String,
    #[allow(dead_code, reason = "reserved for branch source validation")]
    pub alternate: String,
}

pub(crate) fn parse_top_level_ternary(expression: &str) -> Option<ParsedTernary> {
    let ternary = pandacss_extractor::parse_ternary_fragment(expression.trim())?;
    Some(ParsedTernary {
        condition: ternary.condition,
        consequent: ternary.consequent,
        alternate: ternary.alternate,
    })
}

#[cfg(test)]
mod tests {
    use super::parse_top_level_ternary;

    #[test]
    fn parses_simple_ternary() {
        let parsed = parse_top_level_ternary("isError ? 'red' : 'blue'").expect("ternary");
        assert_eq!(parsed.condition, "isError");
        assert_eq!(parsed.consequent, "'red'");
        assert_eq!(parsed.alternate, "'blue'");
    }

    #[test]
    fn parses_ternary_with_parenthesized_condition() {
        let parsed =
            parse_top_level_ternary("(isReady && isError) ? 'red' : 'blue'").expect("ternary");
        assert_eq!(parsed.condition, "(isReady && isError)");
    }
}
