//! Byte-level helpers shared by the Vue and Svelte masks: blank canvases,
//! range copies, and finding `<script>`/`<style>`/`<template>` blocks.

pub struct TagBlock {
    pub open_start: usize,
    pub open_end: usize,
    pub content_start: usize,
    pub content_end: usize,
    pub close_end: usize,
}

#[must_use]
pub fn blank_like(source: &str) -> Vec<u8> {
    source
        .bytes()
        .map(|byte| match byte {
            b'\n' | b'\r' => byte,
            _ => b' ',
        })
        .collect()
}

/// # Panics
///
/// Panics if a copy split a UTF-8 sequence; masks copy whole ranges only.
#[must_use]
pub fn finish_mask(mask: Vec<u8>) -> String {
    String::from_utf8(mask).expect("source mask remains valid utf-8")
}

pub fn copy_range(mask: &mut [u8], source: &str, start: usize, end: usize) {
    if start >= end || end > source.len() {
        return;
    }
    mask[start..end].copy_from_slice(&source.as_bytes()[start..end]);
}

pub fn copy_expression(
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
        mask[before] = if join_previous_expression(mask, before) {
            b' '
        } else {
            b'('
        };
    }
    if after < mask.len() {
        mask[after] = b')';
    }
    copy_range(mask, source, start, end);
}

/// Keeps copied expressions flat. `(a) (b)` would parse as the call `a(b)`, and
/// thousands in a row nest that deep, so a `;` goes into the nearest blank byte
/// before `open`. With none, as in `{a}{b}`, the previous `)` becomes `,` and
/// the two share one sequence `(a, b)`; `true` asks the caller to blank `open`.
fn join_previous_expression(mask: &mut [u8], open: usize) -> bool {
    for index in (0..open).rev() {
        match mask[index] {
            b' ' => {
                mask[index] = b';';
                return false;
            }
            b'\n' | b'\r' => {}
            b')' => {
                mask[index] = b',';
                return true;
            }
            _ => return false,
        }
    }
    false
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

/// How a framework writes JS in its markup text, so block finding steps over it
/// and never reads a `<` inside an expression as a tag.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Expressions {
    /// Vue: `{{ … }}` in text, ending at the first `}}`.
    Interpolations,
    /// Svelte: `{ … }` in text and in tags, matched as JS.
    Braces,
}

#[must_use]
pub fn tag_blocks(source: &str, tag: &str, expressions: Expressions) -> Vec<TagBlock> {
    tag_blocks_with(source, tag, expressions, |content_start| {
        find_close_tag(source, tag, content_start)
    })
}

/// Finds every `tag` block, using `find_close` for the end of its content.
#[must_use]
pub fn tag_blocks_with(
    source: &str,
    tag: &str,
    expressions: Expressions,
    mut find_close: impl FnMut(usize) -> Option<(usize, usize)>,
) -> Vec<TagBlock> {
    let mut blocks = Vec::new();
    walk_tags(source, expressions, |found| {
        if found.closing || !found.name.eq_ignore_ascii_case(tag) {
            return None;
        }
        let content_start = found.open_end + 1;
        let close = if found.self_closing {
            Some((content_start, content_start))
        } else {
            find_close(content_start)
        };
        let Some((content_end, close_end)) = close else {
            return Some(source.len());
        };
        blocks.push(TagBlock {
            open_start: found.open_start,
            open_end: found.open_end,
            content_start,
            content_end,
            close_end,
        });
        Some(close_end)
    });
    blocks
}

/// The `<script>` and `<style>` blocks of a component, found in one walk.
pub struct RawBlocks {
    /// The component's own scripts.
    pub scripts: Vec<TagBlock>,
    /// Scripts inside the container element, which are page markup.
    pub nested_scripts: Vec<TagBlock>,
    pub styles: Vec<TagBlock>,
}

/// Collects `<script>` and `<style>` blocks in one walk. A script inside a
/// `container` element (Svelte's `<svelte:head>`, Vue's `<template>`) is page
/// markup, not component code.
#[must_use]
pub fn raw_blocks(source: &str, expressions: Expressions, container: &str) -> RawBlocks {
    let mut blocks = RawBlocks {
        scripts: Vec::new(),
        nested_scripts: Vec::new(),
        styles: Vec::new(),
    };
    let mut depth = 0usize;
    walk_tags(source, expressions, |found| {
        if found.name.eq_ignore_ascii_case(container) {
            if found.closing {
                depth = depth.saturating_sub(1);
            } else if !found.self_closing {
                depth += 1;
            }
            return None;
        }
        if found.closing {
            return None;
        }
        let content_start = found.open_end + 1;
        let (content_end, close_end) = found.raw_close.unwrap_or((content_start, content_start));
        let block = TagBlock {
            open_start: found.open_start,
            open_end: found.open_end,
            content_start,
            content_end,
            close_end,
        };
        if found.name.eq_ignore_ascii_case("script") {
            if depth == 0 {
                blocks.scripts.push(block);
            } else {
                blocks.nested_scripts.push(block);
            }
        } else if found.name.eq_ignore_ascii_case("style") {
            blocks.styles.push(block);
        }
        None
    });
    blocks
}

/// A tag met by [`walk_tags`].
pub struct FoundTag<'s> {
    pub name: &'s str,
    pub closing: bool,
    pub self_closing: bool,
    pub open_start: usize,
    pub open_end: usize,
    /// For `<script>` and `<style>`: where the raw body ends and the close tag ends.
    pub raw_close: Option<(usize, usize)>,
}

/// Walks the markup one tag at a time, stepping over comments, quoted attribute
/// values, framework expressions and raw `<script>`/`<style>` bodies, so none of
/// them can open a tag. `visit` returns where to resume, or `None` to read on
/// after the tag.
fn walk_tags(
    source: &str,
    expressions: Expressions,
    mut visit: impl FnMut(&FoundTag<'_>) -> Option<usize>,
) {
    let bytes = source.as_bytes();
    let mut walker = MarkupWalker::new(source, expressions);
    let mut cursor = 0;
    let mut unclosed_from = usize::MAX;

    while let Some(offset) = bytes
        .get(cursor..)
        .and_then(|rest| rest.iter().position(|byte| matches!(byte, b'<' | b'{')))
    {
        let open_start = cursor + offset;
        if bytes[open_start] == b'{' {
            cursor = walker.skip_expression(open_start).unwrap_or(open_start + 1);
            continue;
        }
        if starts_with(bytes, open_start, b"<!--") {
            let body = open_start + 4;
            let close = if body >= unclosed_from {
                None
            } else {
                find_bytes(bytes, b"-->", body)
            };
            // An unclosed comment is invalid in Vue and Svelte; read on rather
            // than end the file, and never search for its close again.
            cursor = close.map_or_else(
                || {
                    unclosed_from = unclosed_from.min(body);
                    body
                },
                |end| end + 3,
            );
            continue;
        }
        let closing = bytes.get(open_start + 1) == Some(&b'/');
        let name_start = open_start + 1 + usize::from(closing);
        let name_end = name_start
            + bytes[name_start..]
                .iter()
                .take_while(|byte| !byte.is_ascii_whitespace() && !matches!(byte, b'/' | b'>'))
                .count();
        let is_tag = name_end > name_start || closing || bytes.get(name_start) == Some(&b'!');
        if !is_tag {
            cursor = name_start;
            continue;
        }
        let Some(open_end) = walker.tag_end(name_end) else {
            break;
        };
        let name = &source[name_start..name_end];
        let self_closing = bytes.get(open_end.saturating_sub(1)) == Some(&b'/');
        let content_start = open_end + 1;
        let raw = !closing
            && !self_closing
            && ["script", "style"]
                .iter()
                .any(|raw| name.eq_ignore_ascii_case(raw));
        let raw_close = raw.then(|| {
            find_close_tag(source, name, content_start).unwrap_or((bytes.len(), bytes.len()))
        });
        let found = FoundTag {
            name,
            closing,
            self_closing,
            open_start,
            open_end,
            raw_close,
        };
        cursor = visit(&found).unwrap_or_else(|| raw_close.map_or(content_start, |(_, end)| end));
    }
}

/// The `</name>` that closes a block, allowing whitespace before `>` as HTML does.
#[must_use]
pub fn find_close_tag(source: &str, name: &str, from: usize) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let open = format!("</{name}");
    let mut cursor = from;
    while let Some(start) = find_ascii_ci(source, &open, cursor) {
        let mut end = start + open.len();
        while bytes.get(end).is_some_and(u8::is_ascii_whitespace) {
            end += 1;
        }
        if bytes.get(end) == Some(&b'>') {
            return Some((start, end + 1));
        }
        cursor = start + 1;
    }
    None
}

/// Steps through Vue or Svelte markup: over text expressions and to the end of
/// each tag. Searches that fail are remembered, so a walk stays linear.
pub struct MarkupWalker<'s> {
    source: &'s str,
    expressions: Expressions,
    interpolation_close: Forward,
    braces_balanced: bool,
}

impl<'s> MarkupWalker<'s> {
    #[must_use]
    pub fn new(source: &'s str, expressions: Expressions) -> Self {
        MarkupWalker {
            source,
            expressions,
            interpolation_close: Forward::default(),
            braces_balanced: true,
        }
    }

    /// The end of the expression starting at `at`, or `None` when none starts there.
    pub fn skip_expression(&mut self, at: usize) -> Option<usize> {
        let bytes = self.source.as_bytes();
        match self.expressions {
            Expressions::Interpolations => {
                if !starts_with(bytes, at, b"{{") {
                    return None;
                }
                self.interpolation_close
                    .find(bytes, b"}}", at + 2)
                    .map(|close| close + 2)
            }
            Expressions::Braces => {
                if !self.braces_balanced || bytes.get(at) != Some(&b'{') {
                    return None;
                }
                // `{/if}` closes a block and holds no JS: its `/` is not a regex.
                let close = if is_block_closer(bytes, at + 1) {
                    find_bytes(bytes, b"}", at)
                } else {
                    crate::js::find_closing_brace(self.source, at)
                };
                // Svelte rejects an unclosed `{`; stop matching braces so the
                // rest of the file is walked once, not rescanned per `{`.
                self.braces_balanced = close.is_some();
                close.map(|close| close + 1)
            }
        }
    }

    /// The `>` that ends a tag opened before `from`, skipping quoted values and,
    /// for Svelte, `{ … }` attribute expressions such as `{() => a > b}`.
    pub fn tag_end(&mut self, from: usize) -> Option<usize> {
        let bytes = self.source.as_bytes();
        let mut quote = None;
        let mut index = from;
        while index < bytes.len() {
            let byte = bytes[index];
            if byte == b'{'
                && self.expressions == Expressions::Braces
                && let Some(end) = self.skip_expression(index)
            {
                index = end;
                continue;
            }
            match quote {
                Some(current) if byte == current => quote = None,
                None if byte == b'\'' || byte == b'"' => quote = Some(byte),
                None if byte == b'>' => return Some(index),
                Some(_) | None => {}
            }
            index += 1;
        }
        None
    }
}

/// Whether `start` begins a Svelte block closer such as `/if}`, after any
/// whitespace. A `/` that starts a comment, as in `{/* … */ x}`, is not one.
#[must_use]
pub fn is_block_closer(bytes: &[u8], mut start: usize) -> bool {
    while bytes.get(start).is_some_and(u8::is_ascii_whitespace) {
        start += 1;
    }
    bytes.get(start) == Some(&b'/') && !matches!(bytes.get(start + 1), Some(b'/' | b'*'))
}

/// A forward search whose last answer is reused while it still lies ahead, so
/// repeated searches from increasing offsets scan the source once.
#[derive(Default)]
pub(crate) struct Forward {
    searched: bool,
    from: usize,
    found: Option<usize>,
}

impl Forward {
    pub(crate) fn find(&mut self, bytes: &[u8], needle: &[u8], from: usize) -> Option<usize> {
        if self.searched && self.from <= from && self.found.is_none_or(|index| index >= from) {
            return self.found;
        }
        self.searched = true;
        self.from = from;
        self.found = find_bytes(bytes, needle, from);
        self.found
    }
}

/// The value of attribute `name` in an opening tag such as `<script lang = "tsx">`,
/// read as HTML does: any whitespace around `=`, quoted or unquoted, and the
/// name matched whole and case-insensitively.
#[must_use]
pub fn attribute_value<'s>(opening: &'s str, name: &str) -> Option<&'s str> {
    let bytes = opening.as_bytes();
    let skip_whitespace = |mut index: usize| {
        while bytes.get(index).is_some_and(u8::is_ascii_whitespace) {
            index += 1;
        }
        index
    };
    let mut cursor = usize::from(bytes.first() == Some(&b'<'));
    cursor += bytes[cursor..]
        .iter()
        .take_while(|byte| !byte.is_ascii_whitespace() && !matches!(byte, b'>' | b'/'))
        .count();
    loop {
        cursor = skip_whitespace(cursor);
        let name_start = cursor;
        while bytes
            .get(cursor)
            .is_some_and(|byte| !byte.is_ascii_whitespace() && !matches!(byte, b'=' | b'>' | b'/'))
        {
            cursor += 1;
        }
        if cursor == name_start {
            if bytes.get(cursor) == Some(&b'/') {
                cursor += 1;
                continue;
            }
            return None;
        }
        let matches = opening[name_start..cursor].eq_ignore_ascii_case(name);
        let after_name = skip_whitespace(cursor);
        if bytes.get(after_name) != Some(&b'=') {
            if matches {
                return Some("");
            }
            continue;
        }
        let value_start = skip_whitespace(after_name + 1);
        let (value, next) = if let Some(&quote @ (b'"' | b'\'')) = bytes.get(value_start) {
            let end = bytes[value_start + 1..]
                .iter()
                .position(|&byte| byte == quote)
                .map_or(bytes.len(), |offset| value_start + 1 + offset);
            (&opening[value_start + 1..end], end + 1)
        } else {
            let end = bytes[value_start..]
                .iter()
                .position(|byte| byte.is_ascii_whitespace() || *byte == b'>')
                .map_or(bytes.len(), |offset| value_start + offset);
            (&opening[value_start..end], end)
        };
        if matches {
            return Some(value);
        }
        cursor = next;
    }
}

#[must_use]
pub fn find_ascii_ci(source: &str, needle: &str, from: usize) -> Option<usize> {
    let haystack = source.as_bytes();
    let needle = needle.as_bytes();
    if needle.is_empty() || from >= haystack.len() || needle.len() > haystack.len() {
        return None;
    }
    let last = haystack.len().saturating_sub(needle.len());
    (from..=last).find(|&index| ascii_eq_ci(&haystack[index..index + needle.len()], needle))
}

#[must_use]
pub fn ascii_eq_ci(left: &[u8], right: &[u8]) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| left.eq_ignore_ascii_case(right))
}

#[must_use]
pub fn is_tag_name_boundary(bytes: &[u8], index: usize) -> bool {
    match bytes.get(index) {
        None => true,
        Some(byte) => byte.is_ascii_whitespace() || matches!(*byte, b'>' | b'/' | b'\'' | b'"'),
    }
}

#[must_use]
pub fn find_tag_end(source: &str, from: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut quote = None;
    let mut index = from;
    while index < bytes.len() {
        let byte = bytes[index];
        match quote {
            Some(current) if byte == current => quote = None,
            None if byte == b'\'' || byte == b'"' => quote = Some(byte),
            None if byte == b'>' => return Some(index),
            Some(_) | None => {}
        }
        index += 1;
    }
    None
}

#[must_use]
pub fn starts_with(bytes: &[u8], index: usize, needle: &[u8]) -> bool {
    bytes
        .get(index..index.saturating_add(needle.len()))
        .is_some_and(|slice| slice == needle)
}

#[must_use]
pub fn find_bytes(bytes: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    if needle.is_empty() || from >= bytes.len() || needle.len() > bytes.len() {
        return None;
    }
    let last = bytes.len().saturating_sub(needle.len());
    (from..=last).find(|&index| starts_with(bytes, index, needle))
}
