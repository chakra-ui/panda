mod frontmatter;
pub mod js;

use std::ops::Range;

use astro_oxc_allocator::Allocator;
use astro_oxc_ast::ast::{
    AstroRoot, Expression, JSXAttributeItem, JSXAttributeValue, JSXChild, JSXElement,
    JSXExpression, JSXExpressionContainer, JSXFragment,
};
use astro_oxc_ast_visit::Visit;
use astro_oxc_parser::Parser;
use astro_oxc_span::{GetSpan, SourceType, Span};

#[derive(Debug)]
pub struct AstroDocument {
    pub canvas: String,
    pub elements: Vec<AstroElement>,
    pub diagnostics: Vec<AstroDiagnostic>,
}

#[derive(Debug)]
pub struct AstroElement {
    pub name: Range<u32>,
    pub opening: Range<u32>,
    pub attributes: Vec<AstroAttribute>,
}

#[derive(Debug)]
pub struct AstroAttribute {
    pub name: Option<Range<u32>>,
    pub value: AstroAttributeValue,
}

#[derive(Debug, PartialEq, Eq)]
pub enum AstroAttributeValue {
    Boolean,
    Static(Range<u32>),
    Expression(Range<u32>),
    Spread(Range<u32>),
    Empty,
}

#[derive(Debug)]
pub struct AstroDiagnostic {
    pub message: String,
    pub span: Option<Range<u32>>,
}

#[must_use]
pub fn lower(source: &str) -> AstroDocument {
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, source, SourceType::astro()).parse_astro();
    let mut lowering = Lowering {
        source: source.as_bytes(),
        canvas: blank(source),
        elements: Vec::new(),
    };
    let opened = lowering.root(&parsed.root);
    let mut canvas = lowering.canvas;
    if opened {
        canvas.push(b']');
    }
    let mut elements = lowering.elements;
    elements.sort_by_key(|element| element.opening.start);
    AstroDocument {
        canvas: String::from_utf8_lossy(&canvas).into_owned(),
        elements,
        diagnostics: parsed
            .errors
            .iter()
            .map(|error| AstroDiagnostic {
                message: error.message.to_string(),
                span: error
                    .labels
                    .as_ref()
                    .and_then(|labels| labels.first())
                    .map(|label| offset(label.offset())..offset(label.offset() + label.len())),
            })
            .collect(),
    }
}

fn offset(index: usize) -> u32 {
    u32::try_from(index).unwrap_or(u32::MAX)
}

fn range(span: Span) -> Range<u32> {
    span.start..span.end
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
    fn root(&mut self, root: &AstroRoot<'_>) -> bool {
        let opened =
            if let Some(frontmatter) = root.frontmatter.as_ref().filter(|fm| fm.span.end > 0) {
                let close = frontmatter.program.span.end as usize;
                let open = find(self.source, b"---").map_or(close, |index| index + 3);
                self.copy(open..close);
                self.canvas[close] = b';';
                self.canvas[close + 1] = b'[';
                true
            } else if let Some(open) = root
                .body
                .first()
                .and_then(|first| self.inline_byte(first.span().start as usize..self.source.len()))
            {
                self.canvas[open] = b'[';
                true
            } else {
                false
            };
        self.children(&root.body);
        opened
    }

    fn children(&mut self, children: &[JSXChild<'_>]) {
        for child in children {
            match child {
                JSXChild::Element(element) => self.element(element),
                JSXChild::Fragment(fragment) => self.children(&fragment.children),
                JSXChild::ExpressionContainer(container) => self.container(container),
                JSXChild::Spread(spread) => self.spread(&spread.expression),
                JSXChild::Text(_)
                | JSXChild::AstroScript(_)
                | JSXChild::AstroDoctype(_)
                | JSXChild::AstroComment(_) => {}
            }
        }
    }

    fn element(&mut self, element: &JSXElement<'_>) {
        let opening = &element.opening_element;
        let mut attributes = Vec::with_capacity(opening.attributes.len());
        for item in &opening.attributes {
            match item {
                JSXAttributeItem::SpreadAttribute(spread) => {
                    self.spread(&spread.argument);
                    attributes.push(AstroAttribute {
                        name: None,
                        value: AstroAttributeValue::Spread(range(spread.argument.span())),
                    });
                }
                JSXAttributeItem::Attribute(attribute) => {
                    let value = match &attribute.value {
                        None => AstroAttributeValue::Boolean,
                        Some(JSXAttributeValue::StringLiteral(literal)) => {
                            let span = literal.span;
                            AstroAttributeValue::Static(if literal.raw.is_some() {
                                span.start + 1..span.end - 1
                            } else {
                                range(span)
                            })
                        }
                        Some(JSXAttributeValue::ExpressionContainer(container)) => {
                            self.container(container);
                            match &container.expression {
                                JSXExpression::EmptyExpression(_) => AstroAttributeValue::Empty,
                                expression => {
                                    AstroAttributeValue::Expression(range(expression.span()))
                                }
                            }
                        }
                        Some(JSXAttributeValue::Element(value)) => {
                            self.lead(value.span.start);
                            self.markup_at_js(value.span, |this| this.element(value));
                            AstroAttributeValue::Expression(range(value.span))
                        }
                        Some(JSXAttributeValue::Fragment(value)) => {
                            self.lead(value.span.start);
                            self.markup_at_js(value.span, |this| this.children(&value.children));
                            AstroAttributeValue::Expression(range(value.span))
                        }
                    };
                    attributes.push(AstroAttribute {
                        name: Some(range(attribute.name.span())),
                        value,
                    });
                }
            }
        }
        let name = opening.name.span();
        if name.start < name.end {
            self.elements.push(AstroElement {
                name: range(name),
                opening: range(opening.span),
                attributes,
            });
        }
        self.children(&element.children);
    }

    fn container(&mut self, container: &JSXExpressionContainer<'_>) {
        if let Some(expression) = container.expression.as_expression() {
            self.expression(expression.span(), expression);
        }
    }

    fn spread(&mut self, argument: &Expression<'_>) {
        let span = argument.span();
        let mut start = span.start as usize;
        while start > 0 && self.source[start - 1].is_ascii_whitespace() {
            start -= 1;
        }
        let copy_start = if start >= 3 && &self.source[start - 3..start] == b"..." {
            offset(start - 3)
        } else {
            span.start
        };
        self.expression(Span::new(copy_start, span.end), argument);
    }

    fn expression(&mut self, copy: Span, expression: &Expression<'_>) {
        self.lead(copy.start);
        self.copy(copy.start as usize..copy.end as usize);
        let mut markup = JsMarkup { lowering: self };
        markup.visit_expression(expression);
    }

    fn lead(&mut self, before: u32) {
        let mut index = before as usize;
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

    fn markup_at_js(&mut self, span: Span, lower_inner: impl FnOnce(&mut Self)) {
        let region = span.start as usize..span.end as usize;
        let Some(open) = self.inline_byte(region.clone()) else {
            return;
        };
        let Some(close) = self
            .inline_byte_back(region.clone())
            .filter(|&close| close > open)
        else {
            return;
        };
        for byte in &mut self.canvas[region] {
            if !matches!(*byte, b'\n' | b'\r') {
                *byte = b' ';
            }
        }
        lower_inner(self);
        self.canvas[open] = b'[';
        self.canvas[close] = b']';
    }

    fn inline_byte(&self, region: Range<usize>) -> Option<usize> {
        region
            .into_iter()
            .find(|&index| !matches!(self.source[index], b'\n' | b'\r'))
    }

    fn inline_byte_back(&self, region: Range<usize>) -> Option<usize> {
        region
            .into_iter()
            .rev()
            .find(|&index| !matches!(self.source[index], b'\n' | b'\r'))
    }

    fn copy(&mut self, range: Range<usize>) {
        if range.start < range.end && range.end <= self.source.len() {
            self.canvas[range.clone()].copy_from_slice(&self.source[range]);
        }
    }
}

struct JsMarkup<'l, 's> {
    lowering: &'l mut Lowering<'s>,
}

impl<'a> Visit<'a> for JsMarkup<'_, '_> {
    fn visit_jsx_element(&mut self, element: &JSXElement<'a>) {
        self.lowering
            .markup_at_js(element.span, |this| this.element(element));
    }

    fn visit_jsx_fragment(&mut self, fragment: &JSXFragment<'a>) {
        self.lowering
            .markup_at_js(fragment.span, |this| this.children(&fragment.children));
    }
}

fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}
