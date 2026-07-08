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

pub(super) fn parse_opening_element(slice: &str) -> Option<ParsedOpeningElement> {
    let trimmed = slice.trim();
    let body = trimmed.strip_prefix('<')?;
    let self_closing = body.trim_end().ends_with("/>");
    let body = if self_closing {
        body.trim_end().strip_suffix("/>")?.trim_end()
    } else {
        body.strip_suffix('>')?.trim_end()
    };

    let mut rest = skip_tag_name(body);
    let mut attributes = Vec::new();

    while !rest.is_empty() {
        rest = rest.trim_start();
        if rest.is_empty() {
            break;
        }
        let (attr, remaining) = parse_attribute(rest)?;
        attributes.push(attr);
        rest = remaining;
    }

    Some(ParsedOpeningElement {
        attributes,
        self_closing,
    })
}

pub(super) fn parse_call_expression(slice: &str) -> Option<ParsedCallExpression> {
    let trimmed = slice.trim();
    let open_paren = trimmed.find('(')?;
    let callee = trimmed[..open_paren].trim().to_owned();
    let paren_slice = take_balanced_parens(trimmed.get(open_paren..)?)?;
    let inner = paren_slice.strip_prefix('(')?.strip_suffix(')')?.trim();
    let args = split_top_level_args(inner);
    Some(ParsedCallExpression { callee, args })
}

fn take_balanced_parens(input: &str) -> Option<&str> {
    let mut depth = 0;
    for (index, ch) in input.char_indices() {
        match ch {
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return Some(&input[..=index]);
                }
            }
            _ => {}
        }
    }
    None
}

pub(crate) fn parse_object_literal(slice: &str) -> Option<ParsedObjectLiteral> {
    let trimmed = slice.trim();
    let inner = trimmed.strip_prefix('{')?.strip_suffix('}')?.trim();
    if inner.is_empty() {
        return Some(ParsedObjectLiteral {
            properties: Vec::new(),
        });
    }

    let mut properties = Vec::new();
    let mut rest = inner;
    while !rest.is_empty() {
        rest = rest.trim_start();
        if rest.is_empty() {
            break;
        }
        if rest.starts_with('}') {
            break;
        }
        let (prop, remaining) = parse_object_property(rest)?;
        properties.push(prop);
        rest = remaining.trim_start();
        if rest.starts_with(',') {
            rest = rest[1..].trim_start();
        }
    }

    Some(ParsedObjectLiteral { properties })
}

fn parse_object_property(input: &str) -> Option<(ParsedProperty, &str)> {
    let input = input.trim_start();
    if let Some(stripped) = input.strip_prefix("...") {
        let (expr, rest) = take_expression_until_top_level_comma(stripped)?;
        return Some((
            ParsedProperty {
                key: None,
                raw: format!("...{expr}"),
                spread: true,
                value_is_dynamic: true,
            },
            rest,
        ));
    }

    if input.starts_with('{') {
        let (raw, rest) = take_braced(input)?;
        return Some((
            ParsedProperty {
                key: None,
                raw: raw.to_owned(),
                spread: raw.starts_with("{..."),
                value_is_dynamic: true,
            },
            rest,
        ));
    }

    let (key, rest) = take_prop_key(input)?;
    let rest = rest.trim_start();
    if !rest.starts_with(':') {
        return None;
    }
    let rest = rest[1..].trim_start();
    let (value, rest) = take_prop_value(rest)?;
    let value_is_dynamic = value.trim_start().starts_with('{');
    Some((
        ParsedProperty {
            key: Some(key.to_owned()),
            raw: format!("{key}: {value}"),
            spread: false,
            value_is_dynamic,
        },
        rest,
    ))
}

fn take_prop_key(input: &str) -> Option<(&str, &str)> {
    let input = input.trim_start();
    if let Some(stripped) = input.strip_prefix('\'') {
        let end = find_closing_quote(stripped, '\'')?;
        return Some((&input[1..=end], &input[end + 2..]));
    }
    if let Some(stripped) = input.strip_prefix('"') {
        let end = find_closing_quote(stripped, '"')?;
        return Some((&input[1..=end], &input[end + 2..]));
    }
    take_attr_name(input)
}

fn take_prop_value(input: &str) -> Option<(&str, &str)> {
    let input = input.trim_start();
    if input.starts_with('{') {
        let (raw, rest) = take_braced(input)?;
        return Some((raw, rest));
    }
    if input.starts_with('\'') || input.starts_with('"') {
        return take_attr_value(input);
    }
    let mut len = 0;
    for (index, ch) in input.char_indices() {
        if ch == ',' {
            break;
        }
        len = index + ch.len_utf8();
    }
    if len == 0 {
        return None;
    }
    Some((&input[..len], &input[len..]))
}

fn split_top_level_args(input: &str) -> Vec<String> {
    let mut args = Vec::new();
    let mut start = 0;
    let mut depth_paren = 0;
    let mut depth_brace = 0;
    let mut depth_bracket = 0;
    let mut in_string = None::<char>;
    let mut escaped = false;
    let bytes = input.as_bytes();
    let mut index = 0;

    while index < bytes.len() {
        let ch = input[index..].chars().next().expect("valid utf8");
        let ch_len = ch.len_utf8();

        if let Some(quote) = in_string {
            if escaped {
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else if ch == quote {
                in_string = None;
            }
            index += ch_len;
            continue;
        }

        match ch {
            '\'' | '"' => in_string = Some(ch),
            '(' => depth_paren += 1,
            ')' => depth_paren -= 1,
            '{' => depth_brace += 1,
            '}' => depth_brace -= 1,
            '[' => depth_bracket += 1,
            ']' => depth_bracket -= 1,
            ',' if depth_paren == 0 && depth_brace == 0 && depth_bracket == 0 => {
                args.push(input[start..index].trim().to_owned());
                start = index + ch_len;
            }
            _ => {}
        }
        index += ch_len;
    }

    let tail = input[start..].trim();
    if !tail.is_empty() {
        args.push(tail.to_owned());
    }
    args
}

fn skip_tag_name(input: &str) -> &str {
    let mut end = 0;
    for (i, ch) in input.char_indices() {
        if ch.is_whitespace() || ch == '/' || ch == '>' {
            end = i;
            break;
        }
        end = i + ch.len_utf8();
    }
    &input[end..]
}

fn parse_attribute(input: &str) -> Option<(ParsedAttribute, &str)> {
    if input.starts_with('{') {
        let (raw, rest) = take_braced(input)?;
        return Some((
            ParsedAttribute {
                name: None,
                raw: raw.to_owned(),
                spread: raw.starts_with("{..."),
                dynamic: true,
            },
            rest,
        ));
    }

    let (name, rest) = take_attr_name(input)?;
    let rest = rest.trim_start();
    if rest.is_empty() || rest.starts_with('>') || rest.starts_with('/') {
        return Some((
            ParsedAttribute {
                name: Some(name.to_owned()),
                raw: name.to_owned(),
                spread: false,
                dynamic: false,
            },
            rest,
        ));
    }

    if !rest.starts_with('=') {
        return Some((
            ParsedAttribute {
                name: Some(name.to_owned()),
                raw: name.to_owned(),
                spread: false,
                dynamic: false,
            },
            rest,
        ));
    }

    let (value, rest) = take_attr_value(&rest[1..])?;
    let dynamic = value.starts_with('{');
    Some((
        ParsedAttribute {
            name: Some(name.to_owned()),
            raw: format!("{name}={value}"),
            spread: false,
            dynamic,
        },
        rest,
    ))
}

fn take_attr_name(input: &str) -> Option<(&str, &str)> {
    let mut len = 0;
    for ch in input.chars() {
        if ch.is_whitespace() || ch == '=' || ch == '>' || ch == '/' || ch == ':' || ch == ',' {
            break;
        }
        len += ch.len_utf8();
    }
    if len == 0 {
        return None;
    }
    Some((&input[..len], &input[len..]))
}

fn take_attr_value(input: &str) -> Option<(&str, &str)> {
    let input = input.trim_start();
    if let Some(inner) = input.strip_prefix('"') {
        let end = find_closing_quote(inner, '"')? + 1;
        return Some((&input[..=end], &input[end + 1..]));
    }
    if let Some(inner) = input.strip_prefix('\'') {
        let end = find_closing_quote(inner, '\'')? + 1;
        return Some((&input[..=end], &input[end + 1..]));
    }
    if input.starts_with('{') {
        let (raw, rest) = take_braced(input)?;
        return Some((raw, rest));
    }
    None
}

fn find_closing_quote(input: &str, quote: char) -> Option<usize> {
    let mut escaped = false;
    for (idx, ch) in input.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == quote {
            return Some(idx);
        }
    }
    None
}

fn take_braced(input: &str) -> Option<(&str, &str)> {
    let mut depth = 0;
    for (idx, ch) in input.char_indices() {
        match ch {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some((&input[..=idx], &input[idx + 1..]));
                }
            }
            _ => {}
        }
    }
    None
}

fn take_expression_until_top_level_comma(input: &str) -> Option<(&str, &str)> {
    let input = input.trim_start();
    let mut depth_paren = 0_i32;
    let mut depth_brace = 0_i32;
    let mut depth_bracket = 0_i32;
    let mut in_string = None::<char>;
    let mut escaped = false;
    let mut index = 0;
    let chars: Vec<char> = input.chars().collect();

    while index < chars.len() {
        let ch = chars[index];
        if let Some(quote) = in_string {
            if escaped {
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else if ch == quote {
                in_string = None;
            }
            index += 1;
            continue;
        }

        match ch {
            '\'' | '"' | '`' => in_string = Some(ch),
            '(' => depth_paren += 1,
            ')' => depth_paren -= 1,
            '{' => depth_brace += 1,
            '}' => depth_brace -= 1,
            '[' => depth_bracket += 1,
            ']' => depth_bracket -= 1,
            ',' if depth_paren == 0 && depth_brace == 0 && depth_bracket == 0 => {
                return Some((input[..index].trim(), &input[index + 1..]));
            }
            _ => {}
        }
        index += 1;
    }

    (!input.is_empty()).then_some((input.trim(), ""))
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
    let expression = expression.trim();
    let question = find_top_level_operator(expression, '?')?;
    let condition = expression[..question].trim().to_owned();
    let rest = expression[question + 1..].trim_start();
    let colon = find_top_level_operator(rest, ':')?;
    let consequent = rest[..colon].trim().to_owned();
    let alternate = rest[colon + 1..].trim().to_owned();
    if condition.is_empty() || consequent.is_empty() || alternate.is_empty() {
        return None;
    }
    Some(ParsedTernary {
        condition,
        consequent,
        alternate,
    })
}

fn find_top_level_operator(input: &str, operator: char) -> Option<usize> {
    let mut depth_paren = 0;
    let mut depth_brace = 0;
    let mut depth_bracket = 0;
    let mut in_string = None::<char>;
    let mut escaped = false;

    for (index, ch) in input.char_indices() {
        if let Some(quote) = in_string {
            if escaped {
                escaped = false;
                continue;
            }
            if ch == '\\' {
                escaped = true;
                continue;
            }
            if ch == quote {
                in_string = None;
            }
            continue;
        }

        match ch {
            '\'' | '"' | '`' => in_string = Some(ch),
            '(' => depth_paren += 1,
            ')' => depth_paren -= 1,
            '{' => depth_brace += 1,
            '}' => depth_brace -= 1,
            '[' => depth_bracket += 1,
            ']' => depth_bracket -= 1,
            ch if ch == operator && depth_paren == 0 && depth_brace == 0 && depth_bracket == 0 => {
                return Some(index);
            }
            _ => {}
        }
    }
    None
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
