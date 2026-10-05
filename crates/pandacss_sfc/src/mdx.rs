//! MDX extraction islands without a Markdown AST or embedded-JavaScript parses.

use std::ops::Range;

use crate::js::find_closing_brace;

mod canvas;
mod javascript;
mod markdown;

use crate::{ContainerDiagnostic, TemplateAttribute, TemplateAttributeValue, TemplateElement};
use canvas::Canvas;
use javascript::module_end;
use markdown::{
    Images, InlineCode, LineCursor, LinePrefix, fenced_code_end, frontmatter_end, line_end,
    link_end, next_line, prefix, reference_definition_end,
};

/// Same-offset JavaScript and component attributes retained from an MDX document.
pub struct MdxDocument {
    /// JavaScript canvas. Markdown and JSX tag syntax are blanked.
    pub canvas: String,
    /// Component opening tags and attributes in source order.
    pub elements: Vec<TemplateElement>,
    /// Container syntax errors; embedded JavaScript is checked by the caller.
    pub diagnostics: Vec<ContainerDiagnostic>,
}

/// Lower MDX into one JavaScript program while retaining original byte offsets.
/// JavaScript and expression grammar remain the consuming parser's responsibility.
#[must_use]
pub fn lower(source: &str) -> MdxDocument {
    let mut scanner = Scanner::new(source);
    scanner.scan();
    MdxDocument {
        canvas: scanner.canvas.finish(),
        elements: scanner.elements,
        diagnostics: scanner.diagnostics,
    }
}

fn offset(index: usize) -> u32 {
    u32::try_from(index).unwrap_or(u32::MAX)
}
fn span(range: Range<usize>) -> Range<u32> {
    offset(range.start)..offset(range.end)
}

struct Scanner<'s> {
    source: &'s str,
    canvas: Canvas,
    elements: Vec<TemplateElement>,
    diagnostics: Vec<ContainerDiagnostic>,
    inline_code: InlineCode,
    cursor: usize,
    lines: LineCursor,
    open_tags: Vec<Range<usize>>,
    quote_depth: usize,
    images: Images,
    in_paragraph: bool,
}

impl<'source> Scanner<'source> {
    fn new(source: &'source str) -> Self {
        let start = if source.starts_with('\u{feff}') {
            '\u{feff}'.len_utf8()
        } else {
            0
        };
        Self {
            source,
            canvas: Canvas::new(source),
            elements: Vec::new(),
            diagnostics: Vec::new(),
            inline_code: InlineCode::default(),
            cursor: start,
            lines: LineCursor::new(start),
            open_tags: Vec::new(),
            quote_depth: 0,
            images: Images::default(),
            in_paragraph: false,
        }
    }

    fn scan(&mut self) {
        let bytes = self.source.as_bytes();
        let content_start = self.cursor;
        if let Some(end) = frontmatter_end(self.source, self.cursor) {
            self.cursor = end;
        }
        let mut labels = 0usize;
        while self.cursor < bytes.len() {
            if self.cursor == content_start || matches!(bytes[self.cursor - 1], b'\r' | b'\n') {
                let line = prefix(bytes, self.cursor);
                if self.skip_block(line) {
                    continue;
                }
                self.cursor = line.end;
                if self.cursor >= bytes.len() {
                    break;
                }
            }
            match bytes[self.cursor] {
                b'\\'
                    if bytes
                        .get(self.cursor + 1)
                        .is_some_and(u8::is_ascii_punctuation) =>
                {
                    self.cursor += 2;
                }
                b'`' => self.cursor = self.inline_code.end(self.source, self.cursor),
                b'!' if bytes.get(self.cursor + 1) == Some(&b'[') => {
                    if let Some(end) = self.images.end(self.source, self.cursor + 1) {
                        self.cursor = end;
                    } else {
                        self.cursor += 1;
                    }
                }
                b'[' => {
                    labels += 1;
                    self.cursor += 1;
                }
                b']' if labels > 0 => {
                    labels -= 1;
                    if bytes.get(self.cursor + 1) == Some(&b'(') {
                        self.cursor =
                            link_end(self.source, self.cursor + 1).unwrap_or(self.cursor + 1);
                    } else {
                        self.cursor += 1;
                    }
                }
                b'{' => {
                    let start = self.cursor;
                    let Some(close) = find_closing_brace(self.source, start) else {
                        self.error("Unclosed MDX expression", start..bytes.len());
                        break;
                    };
                    self.copy_expression(start, start + 1..close, close);
                    self.cursor = close + 1;
                }
                b'<' if bytes.get(self.cursor + 1).is_some_and(|b| {
                    b.is_ascii_alphabetic()
                        || matches!(b, b'/' | b'>' | b'_' | b'$')
                        || !b.is_ascii()
                }) =>
                {
                    if !self.scan_tag() {
                        break;
                    }
                }
                _ => self.cursor += 1,
            }
        }
        if let Some(tag) = self.open_tags.last() {
            self.error("Unclosed MDX JSX element", tag.clone());
        }
    }

    fn skip_block(&mut self, line: LinePrefix) -> bool {
        let bytes = self.source.as_bytes();
        self.quote_depth = line.quotes;
        if let Some(end) = fenced_code_end(self.source, line) {
            self.cursor = end;
            self.in_paragraph = false;
            return true;
        }
        if !self.in_paragraph
            && !line.container
            && line.indent <= 3
            && self.open_tags.is_empty()
            && self.is_esm(line.end)
        {
            let end = module_end(self.source, line.end);
            self.canvas.push_module(self.source, line.end..end);
            self.cursor = end;
            return true;
        }
        if !self.in_paragraph
            && let Some(end) = reference_definition_end(self.source, line.end)
        {
            self.cursor = end;
            return true;
        }
        self.in_paragraph = !matches!(bytes.get(line.end), None | Some(b'\r' | b'\n' | b'#'));
        false
    }

    fn error(&mut self, message: &str, range: Range<usize>) {
        self.diagnostics.push(ContainerDiagnostic {
            message: message.into(),
            span: Some(span(range)),
        });
    }

    fn is_esm(&self, start: usize) -> bool {
        self.source.get(start..).is_some_and(|text| {
            ["import", "export"].iter().any(|word| {
                text.strip_prefix(word).is_some_and(|rest| {
                    rest.as_bytes().first().is_some_and(u8::is_ascii_whitespace)
                })
            })
        })
    }

    fn copy_expression(&mut self, start: usize, content: Range<usize>, close: usize) {
        self.canvas
            .push_expression(self.source, start, content.clone(), close);
        self.strip_blockquote_prefixes(content);
    }

    fn strip_blockquote_prefixes(&mut self, range: Range<usize>) {
        if self.quote_depth == 0 {
            return;
        }
        let bytes = self.source.as_bytes();
        let mut cursor = range.start;
        while cursor < range.end {
            let end = line_end(bytes, cursor);
            cursor = next_line(bytes, end);
            if cursor >= range.end {
                break;
            }
            let line = prefix(bytes, cursor);
            if line.quotes == self.quote_depth {
                self.canvas.clear(cursor..line.end);
            }
        }
    }

    fn tag_space(&self, mut cursor: usize) -> usize {
        let bytes = self.source.as_bytes();
        loop {
            while bytes.get(cursor).is_some_and(|b| matches!(b, b' ' | b'\t')) {
                cursor += 1;
            }
            if matches!(bytes.get(cursor), Some(b'\r' | b'\n')) {
                cursor = next_line(bytes, cursor);
                if self.quote_depth > 0 {
                    cursor = prefix(bytes, cursor).end;
                }
            } else {
                return cursor;
            }
        }
    }

    fn scan_attribute(&mut self, cursor: &mut usize) -> Option<TemplateAttribute> {
        let bytes = self.source.as_bytes();
        if bytes.get(*cursor) == Some(&b'{') {
            let close = find_closing_brace(self.source, *cursor).or_else(|| {
                self.error("Unclosed JSX spread", *cursor..bytes.len());
                None
            })?;
            let mut content = *cursor + 1;
            while content < close && bytes[content].is_ascii_whitespace() {
                content += 1;
            }
            if !self.source[content..close].starts_with("...") {
                self.error("Expected a JSX spread attribute", *cursor..close);
                return None;
            }
            content += 3;
            self.copy_expression(*cursor, content..close, close);
            *cursor = close + 1;
            return Some(TemplateAttribute {
                name: None,
                value: TemplateAttributeValue::Spread(span(content..close)),
            });
        }
        let start = *cursor;
        while bytes.get(*cursor).is_some_and(|b| {
            !b.is_ascii_whitespace() && !matches!(b, b'=' | b'/' | b'>' | b'{' | b'}')
        }) {
            *cursor += 1;
        }
        if *cursor == start {
            self.error("Invalid JSX attribute", start..start + 1);
            return None;
        }
        let name = span(start..*cursor);
        *cursor = self.tag_space(*cursor);
        let value = if bytes.get(*cursor) == Some(&b'=') {
            *cursor = self.tag_space(*cursor + 1);
            self.scan_attribute_value(cursor)?
        } else {
            TemplateAttributeValue::Boolean
        };
        Some(TemplateAttribute {
            name: Some(name),
            value,
        })
    }

    fn scan_attribute_value(&mut self, cursor: &mut usize) -> Option<TemplateAttributeValue> {
        let bytes = self.source.as_bytes();
        match bytes.get(*cursor).copied() {
            Some(quote @ (b'\'' | b'"')) => {
                *cursor += 1;
                let start = *cursor;
                while bytes.get(*cursor).is_some_and(|b| *b != quote) {
                    *cursor += 1;
                }
                if *cursor == bytes.len() {
                    self.error("Unclosed JSX attribute string", start..*cursor);
                    return None;
                }
                let value = TemplateAttributeValue::Static(span(start..*cursor));
                *cursor += 1;
                Some(value)
            }
            Some(b'{') => {
                let close = find_closing_brace(self.source, *cursor).or_else(|| {
                    self.error("Unclosed JSX attribute expression", *cursor..bytes.len());
                    None
                })?;
                let content = *cursor + 1..close;
                self.copy_expression(*cursor, content.clone(), close);
                *cursor = close + 1;
                Some(TemplateAttributeValue::Expression(span(content)))
            }
            _ => {
                self.error(
                    "Expected a quoted value or JSX expression",
                    *cursor..*cursor,
                );
                None
            }
        }
    }

    fn scan_tag(&mut self) -> bool {
        let bytes = self.source.as_bytes();
        let start = self.cursor;
        let line_start = self.lines.start_at(bytes, start);
        let closing = bytes.get(start + 1) == Some(&b'/');
        let mut cursor = start + 1 + usize::from(closing);
        let name_start = cursor;
        while bytes
            .get(cursor)
            .is_some_and(|b| !b.is_ascii_whitespace() && !matches!(b, b'/' | b'>'))
        {
            cursor += 1;
        }
        let name = name_start..cursor;
        let mut attributes = Vec::new();
        let mut self_closing = false;
        loop {
            cursor = self.tag_space(cursor);
            match bytes.get(cursor) {
                Some(b'>') => {
                    cursor += 1;
                    break;
                }
                Some(b'/') if bytes.get(cursor + 1) == Some(&b'>') => {
                    cursor += 2;
                    self_closing = true;
                    break;
                }
                Some(_) if !closing => {
                    let Some(attribute) = self.scan_attribute(&mut cursor) else {
                        return false;
                    };
                    attributes.push(attribute);
                }
                _ => {
                    self.error("Unclosed JSX tag", start..bytes.len());
                    return false;
                }
            }
        }
        if closing {
            if self
                .open_tags
                .pop()
                .is_none_or(|opening| self.source[opening] != self.source[name.clone()])
            {
                self.error("Mismatched JSX closing tag", start..cursor);
                return false;
            }
        } else {
            if !self_closing {
                self.open_tags.push(name.clone());
            }
            if !name.is_empty() {
                self.elements.push(TemplateElement {
                    name: span(name),
                    opening: span(start..cursor),
                    attributes,
                });
            }
        }
        if prefix(bytes, line_start).end == start
            && self.source[cursor..line_end(bytes, cursor)]
                .trim()
                .is_empty()
        {
            self.in_paragraph = false;
        }
        self.cursor = cursor;
        true
    }
}
