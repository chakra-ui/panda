//! Shared source-adapter helpers for non-JS containers.

use std::borrow::Cow;

#[must_use]
pub(crate) fn adapt_source<'a>(source: &'a str, path: &str) -> Cow<'a, str> {
    if path.ends_with(".vue") {
        return Cow::Owned(crate::vue_adapter::mask_vue(source));
    }
    if path.ends_with(".svelte") {
        return Cow::Owned(crate::svelte_adapter::mask_svelte(source));
    }
    Cow::Borrowed(source)
}

pub(crate) struct TagBlock {
    pub(crate) open_start: usize,
    pub(crate) open_end: usize,
    pub(crate) content_start: usize,
    pub(crate) content_end: usize,
    pub(crate) close_end: usize,
}

pub(crate) fn blank_like(source: &str) -> Vec<u8> {
    source
        .bytes()
        .map(|byte| match byte {
            b'\n' | b'\r' => byte,
            _ => b' ',
        })
        .collect()
}

pub(crate) fn copy_range(mask: &mut [u8], source: &str, start: usize, end: usize) {
    if start >= end || end > source.len() {
        return;
    }
    mask[start..end].copy_from_slice(&source.as_bytes()[start..end]);
}

pub(crate) fn copy_expression(
    mask: &mut [u8],
    source: &str,
    start: usize,
    end: usize,
    before: usize,
    after: usize,
) {
    let (start, end) = trim_ascii(source.as_bytes(), start, end);
    if start >= end {
        return;
    }
    if before < mask.len() {
        mask[before] = b'(';
    }
    if after < mask.len() {
        mask[after] = b')';
    }
    copy_range(mask, source, start, end);
}

fn trim_ascii(bytes: &[u8], mut start: usize, mut end: usize) -> (usize, usize) {
    while start < end && bytes[start].is_ascii_whitespace() {
        start += 1;
    }
    while end > start && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    (start, end)
}

pub(crate) fn tag_blocks(source: &str, tag: &str) -> Vec<TagBlock> {
    let mut blocks = Vec::new();
    let mut cursor = 0;
    let open = format!("<{tag}");
    let close = format!("</{tag}>");

    while let Some(open_start) = find_ascii_ci(source, &open, cursor) {
        let name_end = open_start + open.len();
        if !is_tag_name_boundary(source.as_bytes(), name_end) {
            cursor = name_end;
            continue;
        }

        let Some(open_end) = find_tag_end(source, name_end) else {
            break;
        };
        let content_start = open_end + 1;
        let self_closing = source.as_bytes().get(open_end.saturating_sub(1)) == Some(&b'/');
        if self_closing {
            blocks.push(TagBlock {
                open_start,
                open_end,
                content_start,
                content_end: content_start,
                close_end: content_start,
            });
            cursor = content_start;
            continue;
        }

        let Some(close_start) = find_ascii_ci(source, &close, content_start) else {
            break;
        };
        blocks.push(TagBlock {
            open_start,
            open_end,
            content_start,
            content_end: close_start,
            close_end: close_start + close.len(),
        });
        cursor = close_start + close.len();
    }

    blocks
}

fn find_ascii_ci(source: &str, needle: &str, from: usize) -> Option<usize> {
    let haystack = source.as_bytes();
    let needle = needle.as_bytes();
    if needle.is_empty() || from >= haystack.len() || needle.len() > haystack.len() {
        return None;
    }
    let last = haystack.len().saturating_sub(needle.len());
    (from..=last).find(|&index| ascii_eq_ci(&haystack[index..index + needle.len()], needle))
}

fn ascii_eq_ci(left: &[u8], right: &[u8]) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| left.eq_ignore_ascii_case(right))
}

fn is_tag_name_boundary(bytes: &[u8], index: usize) -> bool {
    match bytes.get(index) {
        None => true,
        Some(byte) => byte.is_ascii_whitespace() || matches!(*byte, b'>' | b'/' | b'\'' | b'"'),
    }
}

pub(crate) fn find_tag_end(source: &str, from: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut quote = None;
    let mut index = from;
    while index < bytes.len() {
        let byte = bytes[index];
        match quote {
            Some(current) if byte == current => quote = None,
            Some(_) => {}
            None if byte == b'\'' || byte == b'"' => quote = Some(byte),
            None if byte == b'>' => return Some(index),
            None => {}
        }
        index += 1;
    }
    None
}

pub(crate) fn find_matching_brace(source: &str, open: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut depth = 0usize;
    let mut index = open;
    let mut state = JsState::default();

    while index < bytes.len() {
        if index != open && state.step(bytes, &mut index) {
            continue;
        }
        match bytes[index] {
            b'{' => depth += 1,
            b'}' => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
        index += 1;
    }
    None
}

#[derive(Default)]
pub(crate) struct JsState {
    quote: Option<u8>,
    line_comment: bool,
    block_comment: bool,
    escaped: bool,
}

impl JsState {
    pub(crate) fn step(&mut self, bytes: &[u8], index: &mut usize) -> bool {
        let byte = bytes[*index];
        if self.line_comment {
            if byte == b'\n' {
                self.line_comment = false;
            }
            *index += 1;
            return true;
        }
        if self.block_comment {
            if starts_with(bytes, *index, b"*/") {
                self.block_comment = false;
                *index += 2;
            } else {
                *index += 1;
            }
            return true;
        }
        if let Some(quote) = self.quote {
            if self.escaped {
                self.escaped = false;
            } else if byte == b'\\' {
                self.escaped = true;
            } else if byte == quote {
                self.quote = None;
            }
            *index += 1;
            return true;
        }
        if starts_with(bytes, *index, b"//") {
            self.line_comment = true;
            *index += 2;
            return true;
        }
        if starts_with(bytes, *index, b"/*") {
            self.block_comment = true;
            *index += 2;
            return true;
        }
        if matches!(byte, b'\'' | b'"' | b'`') {
            self.quote = Some(byte);
            *index += 1;
            return true;
        }
        false
    }
}

pub(crate) fn starts_with(bytes: &[u8], index: usize, needle: &[u8]) -> bool {
    bytes
        .get(index..index.saturating_add(needle.len()))
        .is_some_and(|slice| slice == needle)
}

pub(crate) fn find_bytes(bytes: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    if needle.is_empty() || from >= bytes.len() || needle.len() > bytes.len() {
        return None;
    }
    let last = bytes.len().saturating_sub(needle.len());
    (from..=last).find(|&index| starts_with(bytes, index, needle))
}
