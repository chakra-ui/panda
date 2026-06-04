//! Vue SFC source adapter.

use crate::adapter::{
    JsState, blank_like, copy_expression, copy_range, find_bytes, find_tag_end, starts_with,
    tag_blocks,
};

#[must_use]
pub(crate) fn mask_vue(source: &str) -> String {
    let mut mask = blank_like(source);

    for block in tag_blocks(source, "script") {
        copy_range(&mut mask, source, block.content_start, block.content_end);
    }

    for block in tag_blocks(source, "template") {
        if has_non_html_lang(source, block.open_start, block.open_end) {
            continue;
        }
        copy_vue_template_expressions(&mut mask, source, block.content_start, block.content_end);
    }

    String::from_utf8(mask).expect("source mask remains valid utf-8")
}

fn has_non_html_lang(source: &str, start: usize, end: usize) -> bool {
    let Some(attrs) = source.get(start..=end) else {
        return false;
    };
    let lower = attrs.to_ascii_lowercase();
    let Some(lang_index) = lower.find("lang") else {
        return false;
    };
    let after_lang = lang_index + "lang".len();
    let Some(rest) = lower.get(after_lang..) else {
        return false;
    };
    if !rest.trim_start().starts_with('=') {
        return false;
    }
    let value = rest
        .trim_start()
        .trim_start_matches('=')
        .trim_start()
        .trim_matches(|ch| ch == '"' || ch == '\'' || ch == '>' || ch == '/')
        .split_ascii_whitespace()
        .next()
        .unwrap_or_default();
    !matches!(value, "" | "html")
}

fn copy_vue_template_expressions(mask: &mut [u8], source: &str, start: usize, end: usize) {
    let bytes = source.as_bytes();
    let mut cursor = start;
    while cursor < end {
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4).map_or(end, |index| index + 3);
            continue;
        }
        if starts_with(bytes, cursor, b"{{") {
            if let Some(close) = find_vue_interpolation_end(source, cursor + 2, end) {
                copy_expression(mask, source, cursor + 2, close, cursor, close);
                cursor = close + 2;
                continue;
            }
        }
        if bytes[cursor] == b'<' {
            if let Some(tag_end) = find_tag_end(source, cursor + 1) {
                copy_vue_tag_expressions(mask, source, cursor + 1, tag_end);
                cursor = tag_end + 1;
                continue;
            }
        }
        cursor += 1;
    }
}

fn copy_vue_tag_expressions(mask: &mut [u8], source: &str, start: usize, end: usize) {
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
                Some(_) => {}
                None if byte == b'\'' || byte == b'"' => name_quote = Some(byte),
                None if byte == b'[' => bracket_depth += 1,
                None if byte == b']' => bracket_depth = bracket_depth.saturating_sub(1),
                None if bracket_depth == 0
                    && (byte.is_ascii_whitespace() || matches!(byte, b'=' | b'/' | b'>')) =>
                {
                    break;
                }
                None => {}
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

        let (value_start, value_end, before, after) = if matches!(bytes[cursor], b'\'' | b'"') {
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
            (value_start, value_end, before, after)
        } else {
            let value_start = cursor;
            while cursor < end
                && !bytes[cursor].is_ascii_whitespace()
                && !matches!(bytes[cursor], b'>')
            {
                cursor += 1;
            }
            (value_start, cursor, value_start.saturating_sub(1), cursor)
        };

        if let Some(name) = source.get(name_start..name_end)
            && let Some((expr_start, expr_end)) =
                vue_expression_range(name, source, value_start, value_end)
        {
            copy_expression(mask, source, expr_start, expr_end, before, after);
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
