//! Astro source adapter.
//!
//! Oxc has no `.astro` parser and its error recovery can't survive the `---`
//! frontmatter fences (ts-morph forces `ScriptKind.TSX` and recovers; Oxc bails),
//! so we mask `.astro` into plain TSX before parsing — same strategy as
//! [`mask_vue`](crate::vue_adapter)/[`mask_svelte`](crate::svelte_adapter).
//!
//! Two regions are copied onto a blanked canvas:
//! - the `---`-fenced frontmatter, verbatim, so its `import`s and `const`s stay in
//!   module scope (the import matcher and same-file resolution depend on them);
//! - each `{ expr }` template interpolation/attribute (Astro uses plain JSX
//!   expression syntax — no Vue `{{ }}` or Svelte `{#…}` blocks), wrapped in
//!   parens. `<script>`/`<style>` blocks and `<!-- -->` comments are dropped.

use crate::adapter::{
    blank_like, copy_expression, copy_range, find_bytes, find_matching_brace, starts_with,
    tag_blocks,
};

#[must_use]
pub(crate) fn mask_astro(source: &str) -> String {
    let mut mask = blank_like(source);

    // Frontmatter JS → module scope. Terminate it with `;` (written into the now-blank
    // closing fence) so a semicolon-less last statement (`const x = {…}`) can't merge
    // with the first parenthesized template expression via ASI (`{…}(expr)`).
    let template_start = match frontmatter_body(source) {
        Some((body_start, body_end, after_close)) => {
            copy_range(&mut mask, source, body_start, body_end);
            if body_end < mask.len() {
                mask[body_end] = b';';
            }
            after_close
        }
        None => 0,
    };

    // `<script>`/`<style>` blocks in the template are not JS expressions; skip them
    // so a stray `{` inside (e.g. `<style>.a{}</style>`) isn't mistaken for one.
    let mut excluded: Vec<(usize, usize)> = Vec::new();
    for tag in ["script", "style"] {
        for block in tag_blocks(source, tag) {
            if block.open_start >= template_start {
                excluded.push((block.open_start, block.close_end));
            }
        }
    }
    excluded.sort_unstable();

    copy_astro_template_expressions(&mut mask, source, template_start, &excluded);

    String::from_utf8(mask).expect("source mask remains valid utf-8")
}

/// Byte offset just past the closing `---` fence (template start), or `None` when
/// the file has no frontmatter. Lets the template-style scanner skip the frontmatter.
#[must_use]
pub(crate) fn frontmatter_end(source: &str) -> Option<usize> {
    frontmatter_body(source).map(|(_, _, after_close)| after_close)
}

/// Locate the leading `---` frontmatter. Returns `(body_start, body_end, after_close)`
/// where `body` is the JS between the fences. Astro only treats `---` as frontmatter
/// when it opens the file (after optional leading whitespace) and sits alone on its line.
fn frontmatter_body(source: &str) -> Option<(usize, usize, usize)> {
    let bytes = source.as_bytes();
    let mut open = 0;
    while open < bytes.len() && bytes[open].is_ascii_whitespace() {
        open += 1;
    }
    if !starts_with(bytes, open, b"---") || !rest_of_line_blank(bytes, open + 3) {
        return None;
    }
    let body_start = line_end(bytes, open + 3); // newline after the opening fence (or EOF)

    let mut cursor = body_start;
    while cursor < bytes.len() {
        if (cursor == 0 || bytes[cursor - 1] == b'\n')
            && starts_with(bytes, cursor, b"---")
            && rest_of_line_blank(bytes, cursor + 3)
        {
            let after_close = line_end(bytes, cursor + 3);
            let after_close = if after_close < bytes.len() {
                after_close + 1
            } else {
                after_close
            };
            return Some((body_start, cursor, after_close));
        }
        cursor += 1;
    }
    None
}

/// Whether everything from `from` to the next newline (or EOF) is ASCII whitespace.
fn rest_of_line_blank(bytes: &[u8], from: usize) -> bool {
    let mut i = from;
    while i < bytes.len() && bytes[i] != b'\n' {
        if !bytes[i].is_ascii_whitespace() {
            return false;
        }
        i += 1;
    }
    true
}

/// Index of the newline ending the line that contains `from` (or EOF if none).
fn line_end(bytes: &[u8], from: usize) -> usize {
    let mut i = from;
    while i < bytes.len() && bytes[i] != b'\n' {
        i += 1;
    }
    i
}

fn copy_astro_template_expressions(
    mask: &mut [u8],
    source: &str,
    start: usize,
    excluded: &[(usize, usize)],
) {
    let bytes = source.as_bytes();
    let mut excluded_index = 0;
    let mut cursor = start;
    let mut in_tag = false;
    let mut tag_quote: Option<u8> = None;

    while cursor < bytes.len() {
        while excluded_index < excluded.len() && cursor >= excluded[excluded_index].1 {
            excluded_index += 1;
        }
        if let Some((block_start, block_end)) = excluded.get(excluded_index).copied()
            && cursor >= block_start
            && cursor < block_end
        {
            cursor = block_end;
            continue;
        }
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4).map_or(bytes.len(), |index| index + 3);
            continue;
        }
        if in_tag {
            // Quotes are only meaningful inside a tag (attribute values); in text a
            // stray `"` must not swallow a following `{expr}`.
            match tag_quote {
                Some(quote) if bytes[cursor] == quote => tag_quote = None,
                None if bytes[cursor] == b'\'' || bytes[cursor] == b'"' => {
                    tag_quote = Some(bytes[cursor]);
                }
                None if bytes[cursor] == b'>' => in_tag = false,
                Some(_) | None => {}
            }
        } else if bytes[cursor] == b'<' {
            in_tag = true;
            cursor += 1;
            continue;
        }
        if tag_quote.is_none()
            && bytes[cursor] == b'{'
            && let Some(close) = find_matching_brace(source, cursor)
        {
            let (expr_start, expr_end) = astro_expression_range(bytes, cursor + 1, close);
            // Skip JSX comments (`{/* … */}`): copying them yields `(/* … */)`,
            // an empty parenthesized expression Oxc rejects.
            if expr_start < expr_end && !is_comment_or_blank(bytes, expr_start, expr_end) {
                copy_expression(mask, source, expr_start, expr_end, cursor, close);
            }
            cursor = close + 1;
            continue;
        }
        cursor += 1;
    }
}

/// Trim leading whitespace and a `...` spread so the copied range is a bare
/// expression (`{...props}` → `props`; `(...props)` would be a syntax error).
fn astro_expression_range(bytes: &[u8], mut start: usize, end: usize) -> (usize, usize) {
    while start < end && bytes[start].is_ascii_whitespace() {
        start += 1;
    }
    if starts_with(bytes, start, b"...") {
        start += 3;
    }
    (start, end)
}

/// Whether the range holds only whitespace and `//` / `/* … */` comments. Strings
/// and any other token count as real content (so `{'x'}` is kept, `{/* x */}` dropped).
fn is_comment_or_blank(bytes: &[u8], mut start: usize, end: usize) -> bool {
    while start < end {
        if bytes[start].is_ascii_whitespace() {
            start += 1;
        } else if starts_with(bytes, start, b"//") {
            start = find_bytes(bytes, b"\n", start + 2).map_or(end, |index| index + 1);
        } else if starts_with(bytes, start, b"/*") {
            start = find_bytes(bytes, b"*/", start + 2).map_or(end, |index| index + 2);
        } else {
            return false;
        }
    }
    true
}
