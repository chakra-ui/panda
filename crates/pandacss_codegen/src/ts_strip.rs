#[must_use]
pub fn strip_typescript(code: &str) -> String {
    let chars = code.chars().collect::<Vec<_>>();
    let mut out = String::with_capacity(code.len());
    let mut index = 0;
    let mut paren_brace_depths = Vec::new();
    let mut brace_depth = 0usize;
    let mut string_quote = None;

    while index < chars.len() {
        let ch = chars[index];

        if let Some(quote) = string_quote {
            out.push(ch);
            if ch == '\\' {
                index += 1;
                if index < chars.len() {
                    out.push(chars[index]);
                }
            } else if ch == quote {
                string_quote = None;
            }
            index += 1;
            continue;
        }

        if ch == '\'' || ch == '"' || ch == '`' {
            string_quote = Some(ch);
            out.push(ch);
            index += 1;
            continue;
        }

        if ch == '(' {
            paren_brace_depths.push(brace_depth);
            out.push(ch);
            index += 1;
            continue;
        }

        if ch == ')' {
            paren_brace_depths.pop();
            out.push(ch);
            index += 1;
            continue;
        }

        if ch == '{' {
            brace_depth += 1;
            out.push(ch);
            index += 1;
            continue;
        }

        if ch == '}' {
            brace_depth = brace_depth.saturating_sub(1);
            out.push(ch);
            index += 1;
            continue;
        }

        if ch == ':' && should_strip_param_type(&chars, index, &paren_brace_depths, brace_depth) {
            index = skip_type_annotation(&chars, index + 1);
            push_space_before_delimiter(&mut out, chars.get(index).copied());
            continue;
        }

        if ch == ':' && should_strip_return_type(&chars, index) {
            index = skip_return_type_annotation(&chars, index + 1);
            continue;
        }

        if ch == ':' && should_strip_variable_type(&chars, index) {
            index = skip_until_top_level(&chars, index + 1, '=');
            push_space_before_delimiter(&mut out, chars.get(index).copied());
            continue;
        }

        if ch == '<' && should_strip_generic_call(&chars, index) {
            index = skip_balanced_angle(&chars, index + 1);
            continue;
        }

        if ch == ' ' && starts_with_word(&chars, index + 1, "as") {
            let after_as = index + 3;
            if after_as < chars.len() && chars[after_as].is_whitespace() {
                index = skip_type_cast(&chars, after_as + 1);
                continue;
            }
        }

        out.push(ch);
        index += 1;
    }

    out
}

fn should_strip_return_type(chars: &[char], colon: usize) -> bool {
    if previous_significant(chars, colon) != Some(')') {
        return false;
    }

    let candidate_end = skip_return_type_annotation(chars, colon + 1);

    // A genuine return type is immediately followed by the function body `{`.
    // Without this guard a ternary whose `:` also follows a `)` — e.g.
    // `cond ? foo(x) : bar` — looks identical and would be wrongly stripped.
    if chars.get(candidate_end) != Some(&'{') {
        return false;
    }

    is_type_annotation_candidate(&chars[colon + 1..candidate_end])
}

fn should_strip_param_type(
    chars: &[char],
    colon: usize,
    paren_brace_depths: &[usize],
    brace_depth: usize,
) -> bool {
    if paren_brace_depths.last().copied() != Some(brace_depth) {
        return false;
    }

    if !previous_significant(chars, colon)
        .is_some_and(|ch| ch.is_alphanumeric() || ch == '_' || ch == '}')
    {
        return false;
    }

    let candidate_end = skip_type_annotation(chars, colon + 1);
    is_type_annotation_candidate(&chars[colon + 1..candidate_end])
}

fn should_strip_variable_type(chars: &[char], colon: usize) -> bool {
    let mut line_start = colon;
    while line_start > 0 && chars[line_start - 1] != '\n' {
        line_start -= 1;
    }
    let line = chars[line_start..colon].iter().collect::<String>();
    let trimmed = line.trim_start();

    ["const ", "let ", "var "].iter().any(|prefix| {
        trimmed.strip_prefix(prefix).is_some_and(|name| {
            name.chars()
                .all(|ch| ch.is_alphanumeric() || ch == '_' || ch == '$')
        })
    })
}

fn should_strip_generic_call(chars: &[char], angle: usize) -> bool {
    let before = chars[..angle].iter().collect::<String>();
    before.ends_with("new Set") || before.ends_with("new Map")
}

fn skip_type_annotation(chars: &[char], mut index: usize) -> usize {
    let mut angle = 0usize;
    let mut bracket = 0usize;
    let mut brace = 0usize;

    while index < chars.len() {
        match chars[index] {
            '<' => angle += 1,
            '>' => angle = angle.saturating_sub(1),
            '[' => bracket += 1,
            ']' => bracket = bracket.saturating_sub(1),
            '{' => brace += 1,
            '}' => brace = brace.saturating_sub(1),
            ',' | ')' | '=' if angle == 0 && bracket == 0 && brace == 0 => break,
            _ => {}
        }
        index += 1;
    }
    index
}

fn skip_return_type_annotation(chars: &[char], mut index: usize) -> usize {
    let mut angle = 0usize;
    let mut bracket = 0usize;
    let mut brace = 0usize;

    while index < chars.len() {
        match chars[index] {
            '{' | '\n' if angle == 0 && bracket == 0 && brace == 0 => break,
            '<' => angle += 1,
            '>' => angle = angle.saturating_sub(1),
            '[' => bracket += 1,
            ']' => bracket = bracket.saturating_sub(1),
            '{' => brace += 1,
            '}' => brace = brace.saturating_sub(1),
            _ => {}
        }
        index += 1;
    }
    index
}

fn is_type_annotation_candidate(chars: &[char]) -> bool {
    let mut saw_type_start = false;

    for ch in chars.iter().copied() {
        if ch.is_whitespace() {
            continue;
        }

        if !saw_type_start {
            if !(ch.is_ascii_alphabetic() || ch == '_' || ch == '{' || ch == '[') {
                return false;
            }
            saw_type_start = true;
            continue;
        }

        if !(ch.is_ascii_alphanumeric()
            || matches!(
                ch,
                '_' | '$' | '[' | ']' | '<' | '>' | '{' | '}' | ',' | '|' | '&' | ' ' | '.'
            ))
        {
            return false;
        }
    }

    saw_type_start
}

fn push_space_before_delimiter(out: &mut String, delimiter: Option<char>) {
    if !matches!(delimiter, Some('=')) {
        return;
    }

    if !out.ends_with(char::is_whitespace) {
        out.push(' ');
    }
}

fn skip_until_top_level(chars: &[char], mut index: usize, delimiter: char) -> usize {
    let mut angle = 0usize;
    let mut bracket = 0usize;

    while index < chars.len() {
        match chars[index] {
            '<' => angle += 1,
            '>' => angle = angle.saturating_sub(1),
            '[' => bracket += 1,
            ']' => bracket = bracket.saturating_sub(1),
            ch if ch == delimiter
                && angle == 0
                && bracket == 0
                && chars.get(index + 1).copied() != Some('>') =>
            {
                break;
            }
            '\n' => break,
            _ => {}
        }
        index += 1;
    }
    index
}

fn skip_balanced_angle(chars: &[char], mut index: usize) -> usize {
    let mut depth = 1usize;
    while index < chars.len() {
        match chars[index] {
            '<' => depth += 1,
            '>' => {
                depth -= 1;
                if depth == 0 {
                    return index + 1;
                }
            }
            _ => {}
        }
        index += 1;
    }
    index
}

fn skip_type_cast(chars: &[char], mut index: usize) -> usize {
    let mut angle = 0usize;
    let mut bracket = 0usize;
    while index < chars.len() {
        match chars[index] {
            '<' => angle += 1,
            '>' => angle = angle.saturating_sub(1),
            '[' => bracket += 1,
            ']' => bracket = bracket.saturating_sub(1),
            ',' | ')' | '\n' if angle == 0 && bracket == 0 => break,
            _ => {}
        }
        index += 1;
    }
    index
}

fn previous_significant(chars: &[char], index: usize) -> Option<char> {
    chars[..index]
        .iter()
        .rev()
        .find(|ch| !ch.is_whitespace())
        .copied()
}

fn starts_with_word(chars: &[char], index: usize, word: &str) -> bool {
    let word_chars = word.chars().collect::<Vec<_>>();
    chars
        .get(index..index + word_chars.len())
        .is_some_and(|slice| slice == word_chars.as_slice())
}
