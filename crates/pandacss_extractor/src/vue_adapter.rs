//! Vue SFC source adapter.

use crate::adapter::{
    JsState, TagBlock, ascii_eq_ci, blank_like, copy_expression, copy_range, find_ascii_ci,
    find_bytes, find_tag_end, finish_mask, has_non_html_lang, is_tag_name_boundary, starts_with,
    tag_blocks, tag_blocks_with,
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

/// Nested `<template>` (slots, `v-if` groups) must not end the root block.
pub(crate) fn vue_template_blocks(source: &str) -> Vec<TagBlock> {
    tag_blocks_with(source, "template", |content_start| {
        find_matching_template_close(source, content_start).or_else(|| {
            find_ascii_ci(source, "</template>", content_start)
                .map(|start| (start, start + "</template>".len()))
        })
    })
    .into_iter()
    .filter(|block| !has_non_html_lang(source, block.open_start, block.open_end))
    .collect()
}

fn find_matching_template_close(source: &str, from: usize) -> Option<(usize, usize)> {
    const TEMPLATE: &[u8] = b"template";
    let bytes = source.as_bytes();
    let mut depth = 1usize;
    let mut cursor = from;
    while cursor < bytes.len() {
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4)? + 3;
            continue;
        }
        if starts_with(bytes, cursor, b"{{")
            && let Some(close) = find_vue_interpolation_end(source, cursor + 2, bytes.len())
        {
            cursor = close + 2;
            continue;
        }
        let closing = bytes.get(cursor + 1) == Some(&b'/');
        let name_start = cursor + 1 + usize::from(closing);
        if bytes[cursor] != b'<' || !bytes.get(name_start).is_some_and(u8::is_ascii_alphabetic) {
            cursor += 1;
            continue;
        }
        let tag_end = find_tag_end(source, name_start)?;
        let name_end = name_start + TEMPLATE.len();
        let is_template = bytes
            .get(name_start..name_end)
            .is_some_and(|name| ascii_eq_ci(name, TEMPLATE))
            && is_tag_name_boundary(bytes, name_end);
        if is_template && closing {
            depth -= 1;
            if depth == 0 {
                return Some((cursor, tag_end + 1));
            }
        } else if is_template && bytes[tag_end - 1] != b'/' {
            depth += 1;
        }
        cursor = tag_end + 1;
    }
    None
}

fn visit_template_expressions(source: &str, visit: &mut impl FnMut(TemplateExpression)) {
    for block in vue_template_blocks(source) {
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
    let mut v_pre_depth = 0usize;
    while cursor < end {
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4).map_or(end, |index| index + 3);
            continue;
        }
        if v_pre_depth == 0
            && starts_with(bytes, cursor, b"{{")
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
            let tag_start = cursor + 1;
            let closing = bytes.get(tag_start) == Some(&b'/');
            let name_start = tag_start + usize::from(closing);
            let name_end = (name_start..tag_end)
                .find(|&index| bytes[index].is_ascii_whitespace() || bytes[index] == b'/')
                .unwrap_or(tag_end);
            let name = source.get(name_start..name_end).unwrap_or_default();
            if !name.is_empty() && name.as_bytes()[0].is_ascii_alphabetic() {
                if closing {
                    v_pre_depth = v_pre_depth.saturating_sub(1);
                } else if v_pre_depth == 0 {
                    let has_v_pre = visit_tag_expressions(source, tag_start, tag_end, visit);
                    if has_v_pre
                        && bytes.get(tag_end.saturating_sub(1)) != Some(&b'/')
                        && !is_void_tag(name)
                    {
                        v_pre_depth = 1;
                    }
                } else if bytes.get(tag_end.saturating_sub(1)) != Some(&b'/') && !is_void_tag(name)
                {
                    v_pre_depth += 1;
                }
            }
            cursor = tag_end + 1;
            continue;
        }
        cursor += 1;
    }
}

fn is_void_tag(name: &str) -> bool {
    [
        "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param",
        "source", "track", "wbr",
    ]
    .iter()
    .any(|void| name.eq_ignore_ascii_case(void))
}

fn visit_tag_expressions(
    source: &str,
    start: usize,
    end: usize,
    visit: &mut impl FnMut(TemplateExpression),
) -> bool {
    let bytes = source.as_bytes();
    let mut cursor = start;
    let mut v_pre = false;
    let mut expressions = Vec::new();
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
        if source.get(name_start..name_end) == Some("v-pre") {
            v_pre = true;
        }
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
            expressions.push(TemplateExpression {
                start: expr_start,
                end: expr_end,
                before,
                after,
                quote,
            });
        }
    }

    if !v_pre {
        for expression in expressions {
            visit(expression);
        }
    }
    v_pre
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
