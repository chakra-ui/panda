//! JavaScript island boundaries; Oxc still owns parsing and validation.

use crate::js::{Lexer, TokenKind, find_closing_brace};

// Stop only at a top-level blank line; braces and templates are read by the shared JS lexer.
pub(super) fn module_end(source: &str, start: usize) -> usize {
    let mut lexer = Lexer::new(source, start);
    let mut depth = 0usize;
    let mut interpolations = Vec::new();
    let mut operand = true;
    let mut previous_end = start;
    let mut import_source = false;
    loop {
        let position = lexer.position();
        let rest = &source[position..];
        let trivia_end = rest
            .find(|ch: char| !ch.is_whitespace())
            .map_or(source.len(), |length| position + length);
        let whitespace = &source[position..trivia_end];
        let lines = whitespace.bytes().filter(|&b| b == b'\n').count();
        if depth == 0 && interpolations.is_empty() && lines >= 2 && !operand && !import_source {
            return previous_end;
        }
        let token = lexer.next_token(operand);
        if token.kind == TokenKind::Eof {
            return source.len();
        }
        let text = &source[token.start..token.end];
        if text == "{"
            && let Some(close) = find_closing_brace(source, token.start)
        {
            lexer.set_position(close + 1);
            previous_end = close + 1;
            operand = false;
            continue;
        }
        if text == "<"
            && operand
            && let Some(end) = jsx_end(source, token.start)
        {
            lexer.set_position(end);
            previous_end = end;
            operand = false;
            continue;
        }
        operand = match token.kind {
            TokenKind::TemplateHead => {
                interpolations.push(depth);
                true
            }
            TokenKind::Identifier => {
                if depth == 0 && text == "import" {
                    import_source = true;
                }
                matches!(
                    text,
                    "import" | "export" | "from" | "const" | "let" | "var" | "default"
                ) || crate::js::OPERAND_KEYWORDS.contains(&text)
            }
            TokenKind::String => {
                if depth == 0 {
                    import_source = false;
                }
                false
            }
            TokenKind::Punctuator => match text {
                "{" | "(" | "[" => {
                    depth += 1;
                    true
                }
                "}" if interpolations.last() == Some(&depth) => {
                    lexer.set_position(token.start);
                    let piece = lexer.continue_template();
                    if piece.kind == TokenKind::TemplateTail {
                        interpolations.pop();
                        false
                    } else {
                        true
                    }
                }
                "}" | ")" | "]" => {
                    depth = depth.saturating_sub(1);
                    false
                }
                ";" => false,
                "++" | "--" | "!" if !operand => false,
                _ => true,
            },
            _ => false,
        };
        previous_end = lexer.position();
    }
}

pub(super) fn jsx_tag_end(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut cursor = start + 1;
    while cursor < bytes.len() {
        match bytes[cursor] {
            b'\'' | b'"' => {
                let quote = bytes[cursor];
                cursor += 1;
                while bytes.get(cursor).is_some_and(|b| *b != quote) {
                    cursor += 1;
                }
                cursor += usize::from(cursor < bytes.len());
            }
            b'{' => cursor = find_closing_brace(source, cursor)? + 1,
            b'>' => return Some(cursor + 1),
            _ => cursor += 1,
        }
    }
    None
}

fn jsx_end(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut cursor = start;
    let mut depth = 0usize;
    loop {
        match bytes.get(cursor)? {
            b'<' => {
                let end = jsx_tag_end(source, cursor)?;
                if bytes.get(cursor + 1) == Some(&b'/') {
                    depth = depth.checked_sub(1)?;
                } else if bytes.get(end - 2) != Some(&b'/') {
                    depth += 1;
                }
                cursor = end;
                if depth == 0 {
                    return Some(cursor);
                }
            }
            b'{' => cursor = find_closing_brace(source, cursor)? + 1,
            _ => cursor += 1,
        }
    }
}
