//! Shared source-adapter helpers for non-JS containers.

use std::borrow::Cow;
use std::path::Path;

use oxc_diagnostics::OxcDiagnostic;
use oxc_parser::ParseOptions;
use oxc_span::SourceType;

use crate::{Diagnostic, Span};

/// Single-file-component container format, resolved once per file from its
/// extension. Distinct from the template `Framework` dialect: Astro is its own
/// container but reuses Svelte's attribute syntax.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub(crate) enum SfcFormat {
    Vue,
    Svelte,
    Astro,
}

impl SfcFormat {
    #[must_use]
    pub(crate) fn from_path(path: &str) -> Option<Self> {
        let extension = Path::new(path).extension()?;
        [
            ("vue", Self::Vue),
            ("svelte", Self::Svelte),
            ("astro", Self::Astro),
        ]
        .into_iter()
        .find_map(|(candidate, format)| extension.eq_ignore_ascii_case(candidate).then_some(format))
    }
}

pub(crate) struct AdaptedSource<'a> {
    pub(crate) format: Option<SfcFormat>,
    pub(crate) code: Cow<'a, str>,
    pub(crate) astro_elements: Vec<pandacss_astro::AstroElement>,
    astro_diagnostics: Vec<pandacss_astro::AstroDiagnostic>,
    source_len: usize,
}

impl<'a> AdaptedSource<'a> {
    #[must_use]
    pub(crate) fn new(source: &'a str, path: &str) -> Self {
        let format = SfcFormat::from_path(path);
        let code = match format {
            Some(SfcFormat::Astro) => {
                let document = pandacss_astro::lower(source);
                return Self {
                    format,
                    code: Cow::Owned(document.canvas),
                    astro_elements: document.elements,
                    astro_diagnostics: document.diagnostics,
                    source_len: source.len(),
                };
            }
            Some(SfcFormat::Vue) => Cow::Owned(crate::vue_adapter::mask_vue(source)),
            Some(SfcFormat::Svelte) => Cow::Owned(crate::svelte_adapter::mask_svelte(source)),
            None => Cow::Borrowed(source),
        };
        Self {
            format,
            code,
            astro_elements: Vec::new(),
            astro_diagnostics: Vec::new(),
            source_len: source.len(),
        }
    }

    #[must_use]
    pub(crate) fn source_type(&self, path: &str) -> SourceType {
        match self.format {
            Some(SfcFormat::Astro) => SourceType::tsx().with_module(true),
            _ => SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx()),
        }
    }

    #[must_use]
    pub(crate) fn parse_options(&self) -> ParseOptions {
        ParseOptions {
            allow_return_outside_function: matches!(self.format, Some(SfcFormat::Astro)),
            ..ParseOptions::default()
        }
    }

    #[must_use]
    pub(crate) fn parse_diagnostics(&self, errors: &[OxcDiagnostic]) -> Vec<Diagnostic> {
        let limit = u32::try_from(self.source_len).unwrap_or(u32::MAX);
        let mut diagnostics = crate::imports::parse_error_diagnostics(
            self.astro_diagnostics.iter().map(|diagnostic| {
                (
                    diagnostic.message.as_str(),
                    diagnostic.span.as_ref().map(|span| Span {
                        start: span.start.min(limit),
                        end: span.end.min(limit),
                    }),
                )
            }),
            &self.code,
        );
        diagnostics.extend(crate::collect_parser_diagnostics(errors, &self.code, limit));
        diagnostics
    }
}

/// `true` when a Vue `<template lang="…">` attribute names something other than
/// HTML (`pug`, etc.) — such templates aren't scanned by either the mask or the
/// template-style collector. `start`/`end` bound the opening tag's attribute text.
#[must_use]
pub(crate) fn has_non_html_lang(source: &str, start: usize, end: usize) -> bool {
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

pub(crate) fn finish_mask(mask: Vec<u8>) -> String {
    String::from_utf8(mask).expect("source mask remains valid utf-8")
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
    let close = format!("</{tag}>");
    tag_blocks_with(source, tag, |content_start| {
        find_ascii_ci(source, &close, content_start).map(|start| (start, start + close.len()))
    })
}

pub(crate) fn tag_blocks_with(
    source: &str,
    tag: &str,
    mut find_close: impl FnMut(usize) -> Option<(usize, usize)>,
) -> Vec<TagBlock> {
    let mut blocks = Vec::new();
    let mut cursor = 0;
    let open = format!("<{tag}");

    while let Some(open_start) = find_ascii_ci(source, &open, cursor) {
        if let Some(comment) =
            find_bytes(source.as_bytes(), b"<!--", cursor).filter(|&comment| comment < open_start)
        {
            cursor = find_bytes(source.as_bytes(), b"-->", comment + 4)
                .map_or(source.len(), |end| end + 3);
            continue;
        }

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

        let Some((close_start, close_end)) = find_close(content_start) else {
            break;
        };
        blocks.push(TagBlock {
            open_start,
            open_end,
            content_start,
            content_end: close_start,
            close_end,
        });
        cursor = close_end;
    }

    blocks
}

pub(crate) fn find_ascii_ci(source: &str, needle: &str, from: usize) -> Option<usize> {
    let haystack = source.as_bytes();
    let needle = needle.as_bytes();
    if needle.is_empty() || from >= haystack.len() || needle.len() > haystack.len() {
        return None;
    }
    let last = haystack.len().saturating_sub(needle.len());
    (from..=last).find(|&index| ascii_eq_ci(&haystack[index..index + needle.len()], needle))
}

pub(crate) fn ascii_eq_ci(left: &[u8], right: &[u8]) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| left.eq_ignore_ascii_case(right))
}

pub(crate) fn is_tag_name_boundary(bytes: &[u8], index: usize) -> bool {
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
            None if byte == b'\'' || byte == b'"' => quote = Some(byte),
            None if byte == b'>' => return Some(index),
            Some(_) | None => {}
        }
        index += 1;
    }
    None
}

pub(crate) fn find_matching_brace(source: &str, open: usize) -> Option<usize> {
    pandacss_astro::js::find_closing_brace(source, open)
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

#[cfg(test)]
mod tests {
    use super::SfcFormat;

    #[test]
    fn sfc_formats_are_resolved_from_the_extension() {
        assert_eq!(SfcFormat::from_path("Card.vue"), Some(SfcFormat::Vue));
        assert_eq!(SfcFormat::from_path("Card.SVELTE"), Some(SfcFormat::Svelte));
        assert_eq!(SfcFormat::from_path("Card.astro"), Some(SfcFormat::Astro));
    }

    #[test]
    fn script_files_are_not_sfc_containers() {
        for path in ["Card.ts", "Card.tsx", "Card.jsx", "Card.vue.ts", "Card"] {
            assert_eq!(
                SfcFormat::from_path(path),
                None,
                "expected {path} to be skipped"
            );
        }
    }
}
