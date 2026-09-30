//! Vue SFC source adapter.

use crate::adapter::{
    JsState, blank_like, copy_expression, copy_range, find_bytes, find_tag_end, finish_mask,
    has_non_html_lang, starts_with, tag_blocks,
};

#[must_use]
pub(crate) fn mask_vue(source: &str) -> String {
    let mut mask = blank_like(source);

    for block in tag_blocks(source, "script") {
        copy_range(&mut mask, source, block.content_start, block.content_end);
    }

    visit_template_expressions(source, &mut |expr| {
        copy_expression(
            &mut mask,
            source,
            expr.start,
            expr.end,
            expr.before,
            expr.after,
        );
    });

    finish_mask(mask)
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct QuotedExpression {
    pub start: usize,
    pub end: usize,
    pub quote: u8,
}

#[must_use]
pub fn vue_quoted_expressions(source: &str) -> Vec<QuotedExpression> {
    let mut quoted = Vec::new();
    visit_template_expressions(source, &mut |expr| {
        if let Some(quote) = expr.quote {
            quoted.push(QuotedExpression {
                start: expr.start,
                end: expr.end,
                quote,
            });
        }
    });
    quoted
}

struct TemplateExpression {
    start: usize,
    end: usize,
    before: usize,
    after: usize,
    quote: Option<u8>,
}

fn visit_template_expressions(source: &str, visit: &mut impl FnMut(TemplateExpression)) {
    for block in tag_blocks(source, "template") {
        if has_non_html_lang(source, block.open_start, block.open_end) {
            continue;
        }
        visit_block_expressions(source, block.content_start, block.content_end, visit);
    }
}

fn visit_block_expressions(
    source: &str,
    start: usize,
    end: usize,
    visit: &mut impl FnMut(TemplateExpression),
) {
    let bytes = source.as_bytes();
    let mut cursor = start;
    while cursor < end {
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4).map_or(end, |index| index + 3);
            continue;
        }
        if starts_with(bytes, cursor, b"{{")
            && let Some(close) = find_vue_interpolation_end(source, cursor + 2, end)
        {
            visit(TemplateExpression {
                start: cursor + 2,
                end: close,
                before: cursor,
                after: close,
                quote: None,
            });
            cursor = close + 2;
            continue;
        }
        if bytes[cursor] == b'<'
            && let Some(tag_end) = find_tag_end(source, cursor + 1)
        {
            visit_tag_expressions(source, cursor + 1, tag_end, visit);
            cursor = tag_end + 1;
            continue;
        }
        cursor += 1;
    }
}

fn visit_tag_expressions(
    source: &str,
    start: usize,
    end: usize,
    visit: &mut impl FnMut(TemplateExpression),
) {
    let bytes = source.as_bytes();
    let mut cursor = start;
    while cursor < end && !bytes[cursor].is_ascii_whitespace() {
        cursor += 1;
    }

    while cursor < end {
        while cursor < end && bytes[cursor].is_ascii_whitespace() {
            cursor += 1;
        }
        if cursor >= end || matches!(bytes[cursor], b'/' | b'>') {
            break;
        }

        let name_start = cursor;
        let mut bracket_depth = 0usize;
        let mut name_quote = None;
        while cursor < end {
            let byte = bytes[cursor];
            match name_quote {
                Some(quote) if byte == quote => name_quote = None,
                None if byte == b'\'' || byte == b'"' => name_quote = Some(byte),
                None if byte == b'[' => bracket_depth += 1,
                None if byte == b']' => bracket_depth = bracket_depth.saturating_sub(1),
                None if bracket_depth == 0
                    && (byte.is_ascii_whitespace() || matches!(byte, b'=' | b'/' | b'>')) =>
                {
                    break;
                }
                Some(_) | None => {}
            }
            cursor += 1;
        }
        let name_end = cursor;
        while cursor < end && bytes[cursor].is_ascii_whitespace() {
            cursor += 1;
        }
        if cursor >= end || bytes[cursor] != b'=' {
            continue;
        }
        cursor += 1;
        while cursor < end && bytes[cursor].is_ascii_whitespace() {
            cursor += 1;
        }
        if cursor >= end {
            break;
        }

        let (value_start, value_end, before, after, quote) =
            if matches!(bytes[cursor], b'\'' | b'"') {
                let quote = bytes[cursor];
                let before = cursor;
                cursor += 1;
                let value_start = cursor;
                while cursor < end && bytes[cursor] != quote {
                    cursor += 1;
                }
                let value_end = cursor;
                let after = cursor;
                if cursor < end {
                    cursor += 1;
                }
                (value_start, value_end, before, after, Some(quote))
            } else {
                let value_start = cursor;
                while cursor < end
                    && !bytes[cursor].is_ascii_whitespace()
                    && !matches!(bytes[cursor], b'>')
                {
                    cursor += 1;
                }
                (
                    value_start,
                    cursor,
                    value_start.saturating_sub(1),
                    cursor,
                    None,
                )
            };

        if let Some(name) = source.get(name_start..name_end)
            && let Some((expr_start, expr_end)) =
                vue_expression_range(name, source, value_start, value_end)
        {
            visit(TemplateExpression {
                start: expr_start,
                end: expr_end,
                before,
                after,
                quote,
            });
        }
    }
}

fn vue_expression_range(
    name: &str,
    source: &str,
    start: usize,
    end: usize,
) -> Option<(usize, usize)> {
    if name == "v-for" {
        return v_for_source_range(source, start, end);
    }
    // v-on values may legally hold multiple statements (`@click="a(); b()"`),
    // which can't survive the parenthesized-expression copy. Handlers are
    // never style-relevant, so drop them instead of mis-parsing the file.
    if (name.starts_with('@') || name.starts_with("v-on"))
        && source
            .get(start..end)
            .is_some_and(|value| value.contains(';'))
    {
        return None;
    }
    let is_expression = name.starts_with(':')
        || name.starts_with('@')
        || name.starts_with('.')
        || name.starts_with('#')
        || name.starts_with("v-");
    is_expression.then_some((start, end))
}

fn v_for_source_range(source: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let value = source.get(start..end)?;
    let separator = value.rfind(" in ").or_else(|| value.rfind(" of "))?;
    let expr_start = start + separator + 4;
    (expr_start < end).then_some((expr_start, end))
}

fn find_vue_interpolation_end(source: &str, from: usize, end: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut index = from;
    let mut state = JsState::default();
    while index + 1 < end {
        if state.step(bytes, &mut index) {
            continue;
        }
        if starts_with(bytes, index, b"}}") {
            return Some(index);
        }
        index += 1;
    }
    None
}
