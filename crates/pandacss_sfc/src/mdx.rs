//! MDX extraction islands without a Markdown AST or embedded-JavaScript parses.

use std::{collections::BTreeMap, ops::Range};

use crate::js::{Lexer, TokenKind, find_closing_brace};
use crate::markup::{copy_range, finish_mask};
use crate::{ContainerDiagnostic, TemplateAttribute, TemplateAttributeValue, TemplateElement};

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
    let mut canvas = Vec::with_capacity(source.len());
    canvas.extend(source.bytes().map(|byte| {
        if matches!(byte, b'\n' | b'\r') {
            byte
        } else {
            b' '
        }
    }));
    let mut scanner = Scanner {
        source,
        canvas,
        elements: Vec::new(),
        diagnostics: Vec::new(),
        ticks: None,
        tick: 0,
        cursor: 0,
        array_close: None,
        esm_end: None,
        tags: Vec::new(),
        quote_depth: 0,
        image_labels: BTreeMap::new(),
        paragraph: false,
    };
    scanner.scan();
    scanner.close_array();
    MdxDocument {
        canvas: finish_mask(scanner.canvas),
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

#[derive(Clone, Copy)]
struct Prefix {
    end: usize,
    quotes: usize,
    indent: usize,
    container: bool,
    list_width: usize,
}

fn line_end(bytes: &[u8], start: usize) -> usize {
    bytes[start..]
        .iter()
        .position(|b| matches!(b, b'\r' | b'\n'))
        .map_or(bytes.len(), |length| start + length)
}
fn next_line(bytes: &[u8], end: usize) -> usize {
    let end = end + usize::from(bytes.get(end) == Some(&b'\r'));
    end + usize::from(bytes.get(end) == Some(&b'\n'))
}
fn prefix(bytes: &[u8], start: usize) -> Prefix {
    let mut end = start;
    let mut quotes = 0;
    let mut indent;
    let mut container = false;
    let mut list_width = 0;
    loop {
        indent = 0;
        while bytes.get(end).is_some_and(|b| matches!(b, b' ' | b'\t')) {
            indent += if bytes[end] == b'\t' { 4 } else { 1 };
            end += 1;
        }
        if indent <= 3 && bytes.get(end) == Some(&b'>') {
            quotes += 1;
            container = true;
            end += 1;
            if bytes.get(end) == Some(&b' ') {
                end += 1;
            }
        } else {
            break;
        }
    }
    if matches!(bytes.get(end), Some(b'-' | b'+' | b'*'))
        && bytes.get(end + 1).is_some_and(u8::is_ascii_whitespace)
    {
        let list_start = end;
        end += 2;
        container = true;
        while bytes.get(end).is_some_and(|b| matches!(b, b' ' | b'\t')) {
            end += 1;
        }
        list_width = end - list_start + indent;
    } else {
        let digits = end;
        while bytes.get(end).is_some_and(u8::is_ascii_digit) && end - digits < 9 {
            end += 1;
        }
        if end > digits
            && matches!(bytes.get(end), Some(b'.' | b')'))
            && bytes.get(end + 1).is_some_and(u8::is_ascii_whitespace)
        {
            end += 2;
            container = true;
            while bytes.get(end).is_some_and(|b| matches!(b, b' ' | b'\t')) {
                end += 1;
            }
            list_width = end - digits + indent;
        } else {
            end = digits;
        }
    }
    Prefix {
        end,
        quotes,
        indent,
        container,
        list_width,
    }
}

struct TickRun {
    start: usize,
    end: usize,
    next: Option<usize>,
}

// Index unmatched delimiters once; a failed inline-code search must not rescan the document.
fn tick_runs(source: &str, start: usize) -> Vec<TickRun> {
    let bytes = source.as_bytes();
    if !bytes.contains(&b'`') {
        return Vec::new();
    }
    let mut runs: Vec<TickRun> = Vec::new();
    let mut previous = [None; 4];
    let mut longer: BTreeMap<usize, usize> = BTreeMap::new();
    let mut cursor = start;
    while cursor < bytes.len() {
        if cursor == 0 || matches!(bytes[cursor - 1], b'\r' | b'\n') {
            let p = prefix(bytes, cursor);
            if p.end == bytes.len()
                || matches!(bytes[p.end], b'\r' | b'\n' | b'#' | b'>' | b'~')
                || (bytes[p.end] == b'<'
                    && jsx_tag_end(&source[..line_end(bytes, p.end)], p.end)
                        .is_none_or(|end| source[end..line_end(bytes, end)].trim().is_empty()))
                || p.container
                || bytes[p.end..].starts_with(b"```")
            {
                previous.fill(None);
                longer.clear();
            }
        }
        if bytes[cursor] == b'`' {
            let start = cursor;
            while bytes.get(cursor) == Some(&b'`') {
                cursor += 1;
            }
            let index = runs.len();
            let length = cursor - start;
            let old = if let Some(slot) = previous.get_mut(length) {
                slot.replace(index)
            } else {
                longer.insert(length, index)
            };
            if let Some(old) = old {
                runs[old].next = Some(index);
            }
            runs.push(TickRun {
                start,
                end: cursor,
                next: None,
            });
        } else {
            cursor += 1;
        }
    }
    runs
}

struct Scanner<'s> {
    source: &'s str,
    canvas: Vec<u8>,
    elements: Vec<TemplateElement>,
    diagnostics: Vec<ContainerDiagnostic>,
    ticks: Option<Vec<TickRun>>,
    tick: usize,
    cursor: usize,
    array_close: Option<usize>,
    esm_end: Option<usize>,
    tags: Vec<Range<usize>>,
    quote_depth: usize,
    image_labels: BTreeMap<usize, Option<usize>>,
    paragraph: bool,
}

impl Scanner<'_> {
    fn scan(&mut self) {
        let bytes = self.source.as_bytes();
        if bytes.starts_with(&[0xef, 0xbb, 0xbf]) {
            self.cursor = 3;
        }
        self.frontmatter();
        let mut labels = 0usize;
        while self.cursor < bytes.len() {
            if self.cursor == 0 || matches!(bytes[self.cursor - 1], b'\r' | b'\n') {
                let p = prefix(bytes, self.cursor);
                self.quote_depth = p.quotes;
                if self.fence(p) {
                    self.paragraph = false;
                    continue;
                }
                if !self.paragraph
                    && !p.container
                    && p.indent <= 3
                    && self.tags.is_empty()
                    && self.is_esm(p.end)
                {
                    self.close_array();
                    let end = esm_end(self.source, p.end);
                    copy_range(&mut self.canvas, self.source, p.end, end);
                    self.esm_end = Some(end);
                    self.cursor = end;
                    continue;
                }
                if bytes.get(p.end) == Some(&b'[') {
                    let end = line_end(bytes, p.end);
                    if self.source[p.end..end]
                        .find("]:")
                        .is_some_and(|index| !self.source[p.end + index + 2..end].trim().is_empty())
                    {
                        self.cursor = next_line(bytes, end);
                        continue;
                    }
                }
                self.paragraph = !matches!(bytes.get(p.end), None | Some(b'\r' | b'\n' | b'#'));
                self.cursor = p.end;
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
                b'`' => self.inline_code(),
                b'!' if bytes.get(self.cursor + 1) == Some(&b'[') => {
                    if let Some(end) = self.image_end(self.cursor + 1) {
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
                    self.container(start, start + 1..close, close);
                    self.cursor = close + 1;
                }
                b'<' if bytes.get(self.cursor + 1).is_some_and(|b| {
                    b.is_ascii_alphabetic()
                        || matches!(b, b'/' | b'>' | b'_' | b'$')
                        || !b.is_ascii()
                }) =>
                {
                    if !self.tag() {
                        break;
                    }
                }
                _ => self.cursor += 1,
            }
        }
        if let Some(tag) = self.tags.last() {
            self.error("Unclosed MDX JSX element", tag.clone());
        }
    }

    fn image_end(&mut self, open: usize) -> Option<usize> {
        let bytes = self.source.as_bytes();
        if !self.image_labels.contains_key(&open) {
            let mut stack = vec![open];
            let mut cursor = open + 1;
            while cursor < bytes.len() {
                match bytes[cursor] {
                    b'[' => stack.push(cursor),
                    b']' => {
                        if let Some(start) = stack.pop() {
                            self.image_labels.insert(start, Some(cursor));
                        }
                        if stack.is_empty() {
                            break;
                        }
                    }
                    b'{' => match find_closing_brace(self.source, cursor) {
                        Some(close) => cursor = close,
                        None => break,
                    },
                    b'\\' => cursor += 1,
                    b'\n' if bytes.get(cursor + 1) == Some(&b'\n') => break,
                    _ => {}
                }
                cursor += 1;
            }
            for start in stack {
                self.image_labels.insert(start, None);
            }
        }
        let close = self.image_labels.get(&open).copied().flatten()?;
        if bytes.get(close + 1) == Some(&b'(') {
            link_end(self.source, close + 1)
        } else {
            None
        }
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

    fn frontmatter(&mut self) {
        let bytes = self.source.as_bytes();
        let start = self.cursor;
        let end = line_end(bytes, start);
        let marker = self.source[start..end].trim_end();
        if !matches!(marker, "---" | "+++") {
            return;
        }
        let mut cursor = next_line(bytes, end);
        while cursor < bytes.len() {
            let end = line_end(bytes, cursor);
            let line = self.source[cursor..end].trim_end();
            if line == marker || (marker == "---" && line == "...") {
                self.cursor = next_line(bytes, end);
                return;
            }
            cursor = next_line(bytes, end);
        }
    }

    fn fence(&mut self, opening: Prefix) -> bool {
        let start = opening.end;
        let bytes = self.source.as_bytes();
        let Some(&marker @ (b'`' | b'~')) = bytes.get(start) else {
            return false;
        };
        let length = bytes[start..]
            .iter()
            .take_while(|&&byte| byte == marker)
            .count();
        if length < 3 {
            return false;
        }
        let end = line_end(bytes, start);
        if marker == b'`' && bytes[start + length..end].contains(&b'`') {
            return false;
        }
        let mut cursor = next_line(bytes, end);
        while cursor < bytes.len() {
            let p = prefix(bytes, cursor);
            let end = line_end(bytes, p.end);
            if !bytes[p.end..end].iter().all(u8::is_ascii_whitespace)
                && (p.quotes < opening.quotes
                    || (opening.list_width > 0 && p.indent < opening.list_width))
            {
                self.cursor = cursor;
                return true;
            }
            let count = bytes[p.end..end]
                .iter()
                .take_while(|&&byte| byte == marker)
                .count();
            if count >= length
                && bytes[p.end + count..end]
                    .iter()
                    .all(u8::is_ascii_whitespace)
            {
                self.cursor = next_line(bytes, end);
                return true;
            }
            cursor = next_line(bytes, end);
        }
        self.cursor = bytes.len();
        true
    }

    fn inline_code(&mut self) {
        let ticks = self
            .ticks
            .get_or_insert_with(|| tick_runs(self.source, self.cursor));
        while ticks
            .get(self.tick)
            .is_some_and(|run| run.start < self.cursor)
        {
            self.tick += 1;
        }
        let Some(run) = ticks.get(self.tick) else {
            self.cursor += 1;
            return;
        };
        self.cursor = run.next.map_or(run.end, |next| ticks[next].end);
    }

    fn close_array(&mut self) {
        if let Some(close) = self.array_close.take() {
            self.canvas[close] = b']';
        }
    }

    fn container(&mut self, start: usize, content: Range<usize>, close: usize) {
        self.canvas[start] = if self.array_close.is_some() {
            b','
        } else {
            b'['
        };
        if let Some(end) = self.esm_end.take() {
            // An ASI separator uses an existing byte; diagnostics use the original source.
            if let Some(separator) = (end..start)
                .find(|&i| self.canvas[i] == b' ')
                .or_else(|| (end..start).find(|&i| matches!(self.canvas[i], b'\n' | b'\r')))
            {
                self.canvas[separator] = b';';
            }
        }
        copy_range(&mut self.canvas, self.source, content.start, content.end);
        self.strip_quotes(content);
        self.array_close = Some(close);
    }

    fn strip_quotes(&mut self, range: Range<usize>) {
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
            let p = prefix(bytes, cursor);
            if p.quotes == self.quote_depth {
                self.canvas[cursor..p.end].fill(b' ');
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

    fn attribute(&mut self, cursor: &mut usize) -> Option<TemplateAttribute> {
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
            self.container(*cursor, content..close, close);
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
            self.attribute_value(cursor)?
        } else {
            TemplateAttributeValue::Boolean
        };
        Some(TemplateAttribute {
            name: Some(name),
            value,
        })
    }

    fn attribute_value(&mut self, cursor: &mut usize) -> Option<TemplateAttributeValue> {
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
                self.container(*cursor, content.clone(), close);
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

    fn tag(&mut self) -> bool {
        let bytes = self.source.as_bytes();
        let start = self.cursor;
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
                    let Some(attribute) = self.attribute(&mut cursor) else {
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
                .tags
                .pop()
                .is_none_or(|opening| self.source[opening] != self.source[name.clone()])
            {
                self.error("Mismatched JSX closing tag", start..cursor);
                return false;
            }
        } else {
            if !self_closing {
                self.tags.push(name.clone());
            }
            if !name.is_empty() {
                self.elements.push(TemplateElement {
                    name: span(name),
                    opening: span(start..cursor),
                    attributes,
                });
            }
        }
        let line_start = bytes[..start]
            .iter()
            .rposition(|b| matches!(b, b'\r' | b'\n'))
            .map_or(0, |index| index + 1);
        if prefix(bytes, line_start).end == start
            && self.source[cursor..line_end(bytes, cursor)]
                .trim()
                .is_empty()
        {
            self.paragraph = false;
        }
        self.cursor = cursor;
        true
    }
}

// Stop only at a top-level blank line; braces and templates are read by the shared JS lexer.
fn esm_end(source: &str, start: usize) -> usize {
    let mut lexer = Lexer::new(source, start);
    let mut depth = 0usize;
    let mut interpolations = Vec::new();
    let mut operand = true;
    let mut previous_end = start;
    let mut import_source = false;
    loop {
        let position = lexer.position();
        let rest = &source[position..];
        let trivia_end = rest
            .find(|ch: char| !ch.is_whitespace())
            .map_or(source.len(), |length| position + length);
        let whitespace = &source[position..trivia_end];
        let lines = whitespace.bytes().filter(|&b| b == b'\n').count();
        if depth == 0 && interpolations.is_empty() && lines >= 2 && !operand && !import_source {
            return previous_end;
        }
        let token = lexer.next_token(operand);
        if token.kind == TokenKind::Eof {
            return source.len();
        }
        let text = &source[token.start..token.end];
        if text == "{"
            && let Some(close) = find_closing_brace(source, token.start)
        {
            lexer.set_position(close + 1);
            previous_end = close + 1;
            operand = false;
            continue;
        }
        if text == "<"
            && operand
            && let Some(end) = jsx_end(source, token.start)
        {
            lexer.set_position(end);
            previous_end = end;
            operand = false;
            continue;
        }
        operand = match token.kind {
            TokenKind::TemplateHead => {
                interpolations.push(depth);
                true
            }
            TokenKind::Identifier => {
                if depth == 0 && text == "import" {
                    import_source = true;
                }
                matches!(
                    text,
                    "import" | "export" | "from" | "const" | "let" | "var" | "default"
                ) || crate::js::OPERAND_KEYWORDS.contains(&text)
            }
            TokenKind::String => {
                if depth == 0 {
                    import_source = false;
                }
                false
            }
            TokenKind::Punctuator => match text {
                "{" | "(" | "[" => {
                    depth += 1;
                    true
                }
                "}" if interpolations.last() == Some(&depth) => {
                    lexer.set_position(token.start);
                    let piece = lexer.continue_template();
                    if piece.kind == TokenKind::TemplateTail {
                        interpolations.pop();
                        false
                    } else {
                        true
                    }
                }
                "}" | ")" | "]" => {
                    depth = depth.saturating_sub(1);
                    false
                }
                ";" => false,
                "++" | "--" | "!" if !operand => false,
                _ => true,
            },
            _ => false,
        };
        previous_end = lexer.position();
    }
}

fn jsx_tag_end(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut cursor = start + 1;
    while cursor < bytes.len() {
        match bytes[cursor] {
            b'\'' | b'"' => {
                let quote = bytes[cursor];
                cursor += 1;
                while bytes.get(cursor).is_some_and(|b| *b != quote) {
                    cursor += 1;
                }
                cursor += usize::from(cursor < bytes.len());
            }
            b'{' => cursor = find_closing_brace(source, cursor)? + 1,
            b'>' => return Some(cursor + 1),
            _ => cursor += 1,
        }
    }
    None
}

fn jsx_end(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut cursor = start;
    let mut depth = 0usize;
    loop {
        match bytes.get(cursor)? {
            b'<' => {
                let end = jsx_tag_end(source, cursor)?;
                if bytes.get(cursor + 1) == Some(&b'/') {
                    depth = depth.checked_sub(1)?;
                } else if bytes.get(end - 2) != Some(&b'/') {
                    depth += 1;
                }
                cursor = end;
                if depth == 0 {
                    return Some(cursor);
                }
            }
            b'{' => cursor = find_closing_brace(source, cursor)? + 1,
            _ => cursor += 1,
        }
    }
}

fn link_space(bytes: &[u8], mut cursor: usize) -> Option<usize> {
    let mut lines = 0;
    while bytes.get(cursor).is_some_and(u8::is_ascii_whitespace) {
        if bytes[cursor] == b'\n' {
            lines += 1;
        }
        if lines > 1 {
            return None;
        }
        cursor += 1;
    }
    Some(cursor)
}

fn link_end(source: &str, open: usize) -> Option<usize> {
    const MAX_DESTINATION_DEPTH: usize = 32;
    let bytes = source.as_bytes();
    let mut cursor = link_space(bytes, open + 1)?;
    if bytes.get(cursor) == Some(&b'<') {
        cursor += 1;
        loop {
            match bytes.get(cursor)? {
                b'>' => {
                    cursor += 1;
                    break;
                }
                b'\n' | b'\r' | b'<' => return None,
                b'\\' => cursor += 2,
                _ => cursor += 1,
            }
        }
    } else {
        let mut depth = 0usize;
        loop {
            match bytes.get(cursor)? {
                b')' if depth == 0 => return Some(cursor + 1),
                b'(' => {
                    depth += 1;
                    if depth > MAX_DESTINATION_DEPTH {
                        return None;
                    }
                }
                b')' => depth -= 1,
                b'<' => return None,
                b if b.is_ascii_whitespace() => break,
                b'\\' => {
                    cursor += 2;
                    continue;
                }
                _ => {}
            }
            cursor += 1;
        }
    }
    cursor = link_space(bytes, cursor)?;
    if bytes.get(cursor) == Some(&b')') {
        return Some(cursor + 1);
    }
    let closing = match bytes.get(cursor)? {
        b'\'' => b'\'',
        b'"' => b'"',
        b'(' => b')',
        _ => return None,
    };
    cursor += 1;
    loop {
        match *bytes.get(cursor)? {
            byte if byte == closing => {
                cursor += 1;
                break;
            }
            b'\\' => cursor += 2,
            b'\r' | b'\n' => cursor = link_space(bytes, cursor)?,
            _ => cursor += 1,
        }
    }
    cursor = link_space(bytes, cursor)?;
    (bytes.get(cursor) == Some(&b')')).then_some(cursor + 1)
}
