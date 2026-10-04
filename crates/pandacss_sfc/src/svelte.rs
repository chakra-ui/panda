//! Svelte source adapter.

use crate::js::{TokenKind, find_closing_brace, top_level_tokens};
use crate::markup::{
    Expressions, RawBlocks, blank_like, copy_expression, copy_range, find_bytes, finish_mask,
    is_block_closer, raw_blocks, starts_with,
};

#[must_use]
pub fn mask(source: &str) -> String {
    mask_with(source, &blocks(source))
}

/// [`mask`] with blocks the caller already found.
#[must_use]
pub fn mask_with(source: &str, blocks: &RawBlocks) -> String {
    let mut mask = blank_like(source);
    for block in &blocks.scripts {
        copy_range(&mut mask, source, block.content_start, block.content_end);
    }

    // A component script or style is skipped whole; a `<script>` in
    // `<svelte:head>` is page markup, so only its raw body is skipped.
    let mut excluded: Vec<_> = blocks
        .scripts
        .iter()
        .chain(&blocks.styles)
        .map(|block| (block.open_start, block.close_end))
        .chain(
            blocks
                .nested_scripts
                .iter()
                .map(|block| (block.content_start, block.content_end)),
        )
        .collect();
    excluded.sort_unstable();

    copy_svelte_markup_expressions(&mut mask, source, &excluded);

    finish_mask(mask)
}

/// The component's `<script>` and `<style>` blocks. A `<script>` in
/// `<svelte:head>` is page markup.
#[must_use]
pub fn blocks(source: &str) -> RawBlocks {
    raw_blocks(source, Expressions::Braces, "svelte:head")
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
        if bytes[cursor] == b'{' {
            // Svelte rejects a file with an unclosed `{`, so nothing after it builds.
            let Some(close) = svelte_tag_close(source, cursor, in_tag) else {
                break;
            };
            let expr_start = cursor + 1;
            if let Some((start, end)) = svelte_expression_range(source, expr_start, close, in_tag) {
                copy_expression(mask, source, start, end, cursor, close);
            }
            cursor = close + 1;
            continue;
        }
        cursor += 1;
    }
}

/// In text, `{/if}` closes a block and holds no JS. Inside a tag,
/// `{/\}/.test(v)}` is an expression whose `/` starts a regex, and anywhere
/// `{/* … */ x}` starts with a comment.
fn svelte_tag_close(source: &str, open: usize, in_tag: bool) -> Option<usize> {
    let bytes = source.as_bytes();
    if !in_tag && is_block_closer(bytes, open + 1) {
        return find_bytes(bytes, b"}", open);
    }
    find_closing_brace(source, open)
}

fn svelte_expression_range(
    source: &str,
    mut start: usize,
    end: usize,
    in_tag: bool,
) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    while start < end && bytes[start].is_ascii_whitespace() {
        start += 1;
    }
    if starts_with(bytes, start, b"...") {
        return Some((start + 3, end));
    }
    match bytes.get(start).copied()? {
        b'#' => block_expression_range(source, start + 1, end),
        b':' => else_expression_range(source, start + 1, end),
        b'@' => special_tag_expression_range(source, start + 1, end),
        b'/' if !in_tag && is_block_closer(bytes, start) => None,
        _ => declaration_init(source, start, end).or(Some((start, end))),
    }
}

/// `{const x = …}` and `{let x = …}` declare a template variable; only the
/// initializer is an expression.
fn declaration_init(source: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let (keyword, after) = read_word(bytes, start, end)?;
    let declares =
        matches!(keyword, "const" | "let") && bytes.get(after).is_some_and(u8::is_ascii_whitespace);
    if !declares {
        return None;
    }
    top_level_punctuator(source, after, end, "=").map(|index| (index + 1, end))
}

fn block_expression_range(source: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let (keyword, expr_start) = read_word(bytes, start, end)?;
    match keyword {
        "if" | "key" => Some((expr_start, end)),
        // The last top-level `as` names the item, so `[…] as const as side` keeps
        // `as const`; with no `as`, `{#each items, i}` ends at the comma.
        "each" => Some((
            expr_start,
            top_level_word(source, expr_start, end, &["as"])
                .last()
                .copied()
                .or_else(|| top_level_punctuator(source, expr_start, end, ","))
                .unwrap_or(end),
        )),
        "await" => Some((
            expr_start,
            top_level_word(source, expr_start, end, &["then", "catch"])
                .first()
                .copied()
                .unwrap_or(end),
        )),
        _ => None,
    }
}

fn else_expression_range(source: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let (keyword, expr_start) = read_word(bytes, start, end)?;
    if keyword != "else" {
        return None;
    }
    let (keyword, expr_start) = read_word(bytes, expr_start, end)?;
    (keyword == "if").then_some((expr_start, end))
}

fn special_tag_expression_range(source: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let (keyword, expr_start) = read_word(bytes, start, end)?;
    match keyword {
        "const" => top_level_punctuator(source, expr_start, end, "=").map(|index| (index + 1, end)),
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

/// The start of the first top-level token in `start..end` whose text is one of
/// `words`, skipping property names such as `promise.then`.
fn top_level_word(source: &str, start: usize, end: usize, words: &[&str]) -> Vec<usize> {
    let tokens = top_level_tokens(source, start, end);
    tokens
        .iter()
        .enumerate()
        .filter(|(index, token)| {
            token.kind == TokenKind::Identifier
                && words.contains(&&source[token.start..token.end])
                && !index.checked_sub(1).is_some_and(|before| {
                    matches!(
                        &source[tokens[before].start..tokens[before].end],
                        "." | "?."
                    )
                })
        })
        .map(|(_, token)| token.start)
        .collect()
}

fn top_level_punctuator(source: &str, start: usize, end: usize, punctuator: &str) -> Option<usize> {
    top_level_tokens(source, start, end)
        .into_iter()
        .find(|token| {
            token.kind == TokenKind::Punctuator && &source[token.start..token.end] == punctuator
        })
        .map(|token| token.start)
}
