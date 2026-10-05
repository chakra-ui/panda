//! Markdown exclusions and line prefixes; these helpers do not emit JavaScript.

use super::javascript::jsx_tag_end;
use crate::js::find_closing_brace;
use std::collections::BTreeMap;

#[derive(Clone, Copy)]
pub(super) struct LinePrefix {
    pub(super) end: usize,
    pub(super) quotes: usize,
    pub(super) indent: usize,
    pub(super) container: bool,
    pub(super) list_width: usize,
}

pub(super) fn line_end(bytes: &[u8], start: usize) -> usize {
    bytes[start..]
        .iter()
        .position(|b| matches!(b, b'\r' | b'\n'))
        .map_or(bytes.len(), |length| start + length)
}
pub(super) fn next_line(bytes: &[u8], end: usize) -> usize {
    let end = end + usize::from(bytes.get(end) == Some(&b'\r'));
    end + usize::from(bytes.get(end) == Some(&b'\n'))
}
pub(super) fn prefix(bytes: &[u8], start: usize) -> LinePrefix {
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
    LinePrefix {
        end,
        quotes,
        indent,
        container,
        list_width,
    }
}

struct BacktickRun {
    start: usize,
    end: usize,
    next: Option<usize>,
}

// Index unmatched delimiters once; a failed inline-code search must not rescan the document.
fn backtick_runs(source: &str, start: usize) -> Vec<BacktickRun> {
    let bytes = source.as_bytes();
    if !bytes.contains(&b'`') {
        return Vec::new();
    }
    let mut runs: Vec<BacktickRun> = Vec::new();
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
            runs.push(BacktickRun {
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

fn destination_end(source: &str, mut cursor: usize) -> Option<usize> {
    const MAX_DESTINATION_DEPTH: usize = 32;
    let bytes = source.as_bytes();
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
            match bytes.get(cursor) {
                None | Some(b')') if depth == 0 => break,
                None | Some(b'<') => return None,
                Some(b'(') => {
                    depth += 1;
                    if depth > MAX_DESTINATION_DEPTH {
                        return None;
                    }
                }
                Some(b')') => depth -= 1,
                Some(b) if b.is_ascii_whitespace() => break,
                Some(b'\\') => {
                    cursor += 2;
                    continue;
                }
                _ => {}
            }
            cursor += 1;
        }
    }
    Some(cursor)
}

pub(super) fn link_end(source: &str, open: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let start = link_space(bytes, open + 1)?;
    let mut cursor = destination_end(source, start)?;
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

/// A definition must consume its line; trailing prose or JSX is still live content.
pub(super) fn reference_definition_end(source: &str, start: usize) -> Option<usize> {
    const MAX_LABEL_CHARACTERS: usize = 999;
    let bytes = source.as_bytes();
    if bytes.get(start) != Some(&b'[') {
        return None;
    }
    let mut cursor = start + 1;
    loop {
        match bytes.get(cursor)? {
            b']' => break,
            b'[' | b'\r' | b'\n' => return None,
            b'\\' => cursor += 1,
            _ => {}
        }
        cursor += 1;
    }
    if source[start + 1..cursor].chars().count() > MAX_LABEL_CHARACTERS
        || source[start + 1..cursor].trim().is_empty()
        || bytes.get(cursor + 1) != Some(&b':')
    {
        return None;
    }
    let end = line_end(bytes, cursor);
    let line = &source[..end];
    let bytes = line.as_bytes();
    let destination = link_space(bytes, cursor + 2)?;
    cursor = destination_end(line, destination)?;
    if cursor == destination {
        return None;
    }
    cursor = link_space(bytes, cursor)?;
    if cursor == end {
        return Some(next_line(source.as_bytes(), end));
    }
    let closing = match bytes.get(cursor)? {
        b'\'' => b'\'',
        b'"' => b'"',
        b'(' => b')',
        _ => return None,
    };
    cursor += 1;
    loop {
        match bytes.get(cursor)? {
            byte if *byte == closing => {
                cursor += 1;
                break;
            }
            b'\r' | b'\n' => return None,
            b'\\' => cursor += 1,
            _ => {}
        }
        cursor += 1;
    }
    (source[cursor..end].trim().is_empty()).then(|| next_line(source.as_bytes(), end))
}

#[derive(Default)]
pub(super) struct Images {
    labels: BTreeMap<usize, Option<usize>>,
}

impl Images {
    pub(super) fn end(&mut self, source: &str, open: usize) -> Option<usize> {
        let bytes = source.as_bytes();
        if !self.labels.contains_key(&open) {
            let mut stack = vec![open];
            let mut cursor = open + 1;
            while cursor < bytes.len() {
                match bytes[cursor] {
                    b'[' => stack.push(cursor),
                    b']' => {
                        if let Some(start) = stack.pop() {
                            self.labels.insert(start, Some(cursor));
                        }
                        if stack.is_empty() {
                            break;
                        }
                    }
                    b'{' => match find_closing_brace(source, cursor) {
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
                self.labels.insert(start, None);
            }
        }
        let close = self.labels.get(&open).copied().flatten()?;
        if bytes.get(close + 1) == Some(&b'(') {
            link_end(source, close + 1)
        } else {
            None
        }
    }
}

pub(super) fn frontmatter_end(source: &str, start: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let end = line_end(bytes, start);
    let marker = source[start..end].trim_end();
    if !matches!(marker, "---" | "+++") {
        return None;
    }
    let mut cursor = next_line(bytes, end);
    while cursor < bytes.len() {
        let end = line_end(bytes, cursor);
        let line = source[cursor..end].trim_end();
        if line == marker || (marker == "---" && line == "...") {
            return Some(next_line(bytes, end));
        }
        cursor = next_line(bytes, end);
    }
    None
}

pub(super) fn fenced_code_end(source: &str, opening: LinePrefix) -> Option<usize> {
    let start = opening.end;
    let bytes = source.as_bytes();
    let Some(&marker @ (b'`' | b'~')) = bytes.get(start) else {
        return None;
    };
    let length = bytes[start..]
        .iter()
        .take_while(|&&byte| byte == marker)
        .count();
    if length < 3 {
        return None;
    }
    let end = line_end(bytes, start);
    if marker == b'`' && bytes[start + length..end].contains(&b'`') {
        return None;
    }
    let mut cursor = next_line(bytes, end);
    while cursor < bytes.len() {
        let line = prefix(bytes, cursor);
        let end = line_end(bytes, line.end);
        if !bytes[line.end..end].iter().all(u8::is_ascii_whitespace)
            && (line.quotes < opening.quotes
                || (opening.list_width > 0 && line.indent < opening.list_width))
        {
            return Some(cursor);
        }
        let count = bytes[line.end..end]
            .iter()
            .take_while(|&&byte| byte == marker)
            .count();
        if count >= length
            && bytes[line.end + count..end]
                .iter()
                .all(u8::is_ascii_whitespace)
        {
            return Some(next_line(bytes, end));
        }
        cursor = next_line(bytes, end);
    }
    Some(bytes.len())
}

#[derive(Default)]
pub(super) struct InlineCode {
    runs: Option<Vec<BacktickRun>>,
    next_run: usize,
}

impl InlineCode {
    pub(super) fn end(&mut self, source: &str, start: usize) -> usize {
        let runs = self
            .runs
            .get_or_insert_with(|| backtick_runs(source, start));
        while runs.get(self.next_run).is_some_and(|run| run.start < start) {
            self.next_run += 1;
        }
        runs.get(self.next_run).map_or(start + 1, |run| {
            run.next.map_or(run.end, |next| runs[next].end)
        })
    }
}

/// Find tag line starts without rescanning a long inline paragraph for every tag.
pub(super) struct LineCursor {
    start: usize,
    checked_until: usize,
}

impl LineCursor {
    pub(super) const fn new(start: usize) -> Self {
        Self {
            start,
            checked_until: start,
        }
    }

    pub(super) fn start_at(&mut self, bytes: &[u8], position: usize) -> usize {
        if let Some(newline) = bytes[self.checked_until..position]
            .iter()
            .rposition(|byte| matches!(byte, b'\r' | b'\n'))
        {
            self.start = self.checked_until + newline + 1;
        }
        self.checked_until = position;
        self.start
    }
}
