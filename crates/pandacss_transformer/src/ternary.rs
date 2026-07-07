//! Top-level ternary parsing for finite conditional rewrites.

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
