//! Svelte source adapter.

use crate::adapter::{
    blank_like, copy_expression, copy_range, find_bytes, find_matching_brace, starts_with,
    tag_blocks,
};

#[must_use]
pub(crate) fn mask_svelte(source: &str) -> String {
    let mut mask = blank_like(source);
    let scripts = tag_blocks(source, "script");
    let styles = tag_blocks(source, "style");

    for block in &scripts {
        copy_range(&mut mask, source, block.content_start, block.content_end);
    }

    let mut excluded = Vec::with_capacity(scripts.len() + styles.len());
    excluded.extend(
        scripts
            .iter()
            .map(|block| (block.open_start, block.close_end)),
    );
    excluded.extend(
        styles
            .iter()
            .map(|block| (block.open_start, block.close_end)),
    );
    excluded.sort_unstable();

    copy_svelte_markup_expressions(&mut mask, source, &excluded);

    String::from_utf8(mask).expect("source mask remains valid utf-8")
}

fn copy_svelte_markup_expressions(mask: &mut [u8], source: &str, excluded: &[(usize, usize)]) {
    let bytes = source.as_bytes();
    let mut excluded_index = 0;
    let mut cursor = 0;
    let mut in_tag = false;
    let mut tag_quote = None;

    while cursor < bytes.len() {
        while excluded_index < excluded.len() && cursor >= excluded[excluded_index].1 {
            excluded_index += 1;
        }
        if let Some((start, end)) = excluded.get(excluded_index).copied()
            && cursor >= start
            && cursor < end
        {
            cursor = end;
            continue;
        }
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4).map_or(bytes.len(), |index| index + 3);
            continue;
        }
        if in_tag {
            match tag_quote {
                Some(quote) if bytes[cursor] == quote => tag_quote = None,
                None if bytes[cursor] == b'\'' || bytes[cursor] == b'"' => {
                    tag_quote = Some(bytes[cursor]);
                }
                None if starts_with(bytes, cursor, b"//") => {
                    cursor =
                        find_bytes(bytes, b"\n", cursor + 2).map_or(bytes.len(), |index| index + 1);
                    continue;
                }
                None if starts_with(bytes, cursor, b"/*") => {
                    cursor =
                        find_bytes(bytes, b"*/", cursor + 2).map_or(bytes.len(), |index| index + 2);
                    continue;
                }
                None if bytes[cursor] == b'>' => in_tag = false,
                Some(_) | None => {}
            }
        } else if bytes[cursor] == b'<' {
            in_tag = true;
            cursor += 1;
            continue;
        }
        if bytes[cursor] == b'{'
            && let Some(close) = find_matching_brace(source, cursor)
        {
            let expr_start = cursor + 1;
            if let Some((start, end)) = svelte_expression_range(bytes, expr_start, close) {
                copy_expression(mask, source, start, end, cursor, close);
            }
            cursor = close + 1;
            continue;
        }
        cursor += 1;
    }
}

fn svelte_expression_range(bytes: &[u8], mut start: usize, end: usize) -> Option<(usize, usize)> {
    while start < end && bytes[start].is_ascii_whitespace() {
        start += 1;
    }
    if starts_with(bytes, start, b"...") {
        return Some((start + 3, end));
    }
    match bytes.get(start).copied()? {
        b'#' => block_expression_range(bytes, start + 1, end),
        b':' => else_expression_range(bytes, start + 1, end),
        b'@' => special_tag_expression_range(bytes, start + 1, end),
        b'/' | b'!' => None,
        _ => Some((start, end)),
    }
}

fn block_expression_range(bytes: &[u8], start: usize, end: usize) -> Option<(usize, usize)> {
    let (keyword, expr_start) = read_word(bytes, start, end)?;
    match keyword {
        "if" | "key" => Some((expr_start, end)),
        "each" => Some((
            expr_start,
            find_word(bytes, expr_start, end, b" as ").unwrap_or(end),
        )),
        "await" => Some((
            expr_start,
            find_word(bytes, expr_start, end, b" then ")
                .or_else(|| find_word(bytes, expr_start, end, b" catch "))
                .unwrap_or(end),
        )),
        _ => None,
    }
}

fn else_expression_range(bytes: &[u8], start: usize, end: usize) -> Option<(usize, usize)> {
    let (keyword, expr_start) = read_word(bytes, start, end)?;
    if keyword != "else" {
        return None;
    }
    let (keyword, expr_start) = read_word(bytes, expr_start, end)?;
    (keyword == "if").then_some((expr_start, end))
}

fn special_tag_expression_range(bytes: &[u8], start: usize, end: usize) -> Option<(usize, usize)> {
    let (keyword, expr_start) = read_word(bytes, start, end)?;
    match keyword {
        "const" => find_byte(bytes, expr_start, end, b'=').map(|index| (index + 1, end)),
        "html" | "render" | "debug" | "attach" => Some((expr_start, end)),
        _ => None,
    }
}

fn read_word(bytes: &[u8], mut start: usize, end: usize) -> Option<(&str, usize)> {
    while start < end && bytes[start].is_ascii_whitespace() {
        start += 1;
    }
    let word_start = start;
    while start < end && (bytes[start].is_ascii_alphanumeric() || bytes[start] == b'_') {
        start += 1;
    }
    let word = std::str::from_utf8(bytes.get(word_start..start)?).ok()?;
    Some((word, start))
}

fn find_word(bytes: &[u8], start: usize, end: usize, needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || start >= end || needle.len() > end.saturating_sub(start) {
        return None;
    }
    let last = end.saturating_sub(needle.len());
    (start..=last).find(|&index| bytes.get(index..index + needle.len()) == Some(needle))
}

fn find_byte(bytes: &[u8], start: usize, end: usize, needle: u8) -> Option<usize> {
    (start..end).find(|&index| bytes[index] == needle)
}
