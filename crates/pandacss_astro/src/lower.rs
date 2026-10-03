use std::ops::Range;

use crate::tree::{Attribute, Child, ChildKind, Document, Element, Expression, Markup, Value};
use crate::{AstroAttribute, AstroAttributeValue, AstroDocument, AstroElement};

pub(crate) fn lower(source: &str, document: Document) -> AstroDocument {
    let mut lowering = Lowering {
        source: source.as_bytes(),
        canvas: blank(source),
        elements: Vec::new(),
    };
    let opened = lowering.root(&document);
    let mut canvas = lowering.canvas;
    if opened {
        canvas.push(b']');
    }
    let mut elements = lowering.elements;
    elements.sort_by_key(|element| element.opening.start);
    AstroDocument {
        canvas: String::from_utf8_lossy(&canvas).into_owned(),
        elements,
        diagnostics: document.diagnostics,
    }
}

pub(crate) fn offset(index: usize) -> u32 {
    u32::try_from(index).unwrap_or(u32::MAX)
}

fn range(span: &Range<usize>) -> Range<u32> {
    offset(span.start)..offset(span.end)
}

fn blank(source: &str) -> Vec<u8> {
    source
        .bytes()
        .map(|byte| {
            if matches!(byte, b'\n' | b'\r') {
                byte
            } else {
                b' '
            }
        })
        .collect()
}

struct Lowering<'s> {
    source: &'s [u8],
    canvas: Vec<u8>,
    elements: Vec<AstroElement>,
}

impl Lowering<'_> {
    fn root(&mut self, document: &Document) -> bool {
        let opened = if let Some(frontmatter) = &document.frontmatter {
            let close = frontmatter.close;
            self.copy(frontmatter.content.start..close);
            self.end_frontmatter(close);
            true
        } else if let Some(open) = document
            .body
            .first()
            .and_then(|first| self.inline_byte(first.start..self.source.len()))
        {
            self.put(open, b'[');
            true
        } else {
            false
        };
        self.children(&document.body);
        opened
    }

    fn end_frontmatter(&mut self, close: usize) {
        let mut cursor = close;
        while cursor > 0 && matches!(self.source[cursor - 1], b' ' | b'\t') {
            cursor -= 1;
        }
        if cursor == 0 || matches!(self.source[cursor - 1], b'\n' | b'\r') {
            self.put(close, b'0');
            self.put(close + 1, b';');
            self.put(close + 2, b'[');
        } else if cursor < close {
            self.put(close - 1, b';');
            self.put(close, b'[');
        } else {
            self.put(close, b';');
            self.put(close + 1, b'[');
        }
    }

    fn children(&mut self, children: &[Child]) {
        for child in children {
            match &child.kind {
                ChildKind::Element(element) => self.element(element),
                ChildKind::Fragment(fragment) => self.children(&fragment.children),
                ChildKind::Expression(expression) => self.container(expression),
                ChildKind::Spread(expression) => self.spread(expression),
                ChildKind::Other => {}
            }
        }
    }

    fn element(&mut self, element: &Element) {
        let mut attributes = Vec::with_capacity(element.attributes.len());
        for Attribute { name, value } in &element.attributes {
            let value = match value {
                Value::Spread(expression) => {
                    self.spread(expression);
                    attributes.push(AstroAttribute {
                        name: None,
                        value: AstroAttributeValue::Spread(range(&expression.span)),
                    });
                    continue;
                }
                Value::Boolean => AstroAttributeValue::Boolean,
                Value::Static { span, quoted } => AstroAttributeValue::Static(if *quoted {
                    offset(span.start + 1)..offset(span.end.saturating_sub(1))
                } else {
                    range(span)
                }),
                Value::Expression(expression) => {
                    self.container(expression);
                    AstroAttributeValue::Expression(range(&expression.span))
                }
                Value::Empty => AstroAttributeValue::Empty,
                Value::Markup(markup) => {
                    let span = markup.span();
                    self.lead(span.start);
                    self.markup(markup);
                    AstroAttributeValue::Expression(range(&span))
                }
            };
            attributes.push(AstroAttribute {
                name: name.as_ref().map(range),
                value,
            });
        }
        if element.name.start < element.name.end {
            self.elements.push(AstroElement {
                name: range(&element.name),
                opening: range(&element.opening),
                attributes,
            });
        }
        self.children(&element.children);
    }

    fn container(&mut self, expression: &Expression) {
        self.expression(expression.span.clone(), expression);
    }

    fn spread(&mut self, argument: &Expression) {
        let span = &argument.span;
        let mut start = span.start;
        while start > 0
            && self
                .source
                .get(start - 1)
                .is_some_and(u8::is_ascii_whitespace)
        {
            start -= 1;
        }
        let copy_start = if start >= 3 && self.source.get(start - 3..start) == Some(b"...") {
            start - 3
        } else {
            span.start
        };
        self.expression(copy_start..span.end, argument);
    }

    fn expression(&mut self, copy: Range<usize>, expression: &Expression) {
        self.lead(copy.start);
        self.copy(copy);
        for markup in &expression.markup {
            self.markup(markup);
        }
    }

    fn markup(&mut self, markup: &Markup) {
        match markup {
            Markup::Element { span, element } => {
                self.markup_at_js(span.clone(), |this| this.element(element));
            }
            Markup::Fragment(fragment) => {
                self.markup_at_js(fragment.span.clone(), |this| {
                    this.children(&fragment.children);
                });
            }
        }
    }

    fn lead(&mut self, before: usize) {
        let mut index = before.min(self.source.len());
        while index > 0 {
            index -= 1;
            if !self.source[index].is_ascii_whitespace() {
                if self.canvas[index] == b' ' {
                    self.canvas[index] = b',';
                }
                return;
            }
        }
    }

    fn markup_at_js(&mut self, region: Range<usize>, lower_inner: impl FnOnce(&mut Self)) {
        let Some(open) = self.inline_byte(region.clone()) else {
            return;
        };
        let Some(close) = self
            .inline_byte_back(region.clone())
            .filter(|&close| close > open)
        else {
            return;
        };
        if let Some(bytes) = self.canvas.get_mut(region) {
            for byte in bytes {
                if !matches!(*byte, b'\n' | b'\r') {
                    *byte = b' ';
                }
            }
        }
        lower_inner(self);
        self.put(open, b'[');
        self.put(close, b']');
    }

    fn inline_byte(&self, region: Range<usize>) -> Option<usize> {
        let end = region.end.min(self.source.len());
        (region.start..end).find(|&index| !matches!(self.source[index], b'\n' | b'\r'))
    }

    fn inline_byte_back(&self, region: Range<usize>) -> Option<usize> {
        let end = region.end.min(self.source.len());
        (region.start..end)
            .rev()
            .find(|&index| !matches!(self.source[index], b'\n' | b'\r'))
    }

    fn copy(&mut self, range: Range<usize>) {
        if range.start < range.end && range.end <= self.source.len() {
            self.canvas[range.clone()].copy_from_slice(&self.source[range]);
        }
    }

    fn put(&mut self, index: usize, byte: u8) {
        if let Some(slot) = self.canvas.get_mut(index) {
            *slot = byte;
        }
    }
}
