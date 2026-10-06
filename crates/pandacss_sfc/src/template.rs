//! Span-backed element and attribute shapes shared by the Astro and MDX lowerers.

use std::ops::Range;

#[derive(Debug)]
pub struct TemplateElement {
    pub name: Range<u32>,
    pub opening: Range<u32>,
    pub attributes: Vec<TemplateAttribute>,
}

#[derive(Debug)]
pub struct TemplateAttribute {
    pub name: Option<Range<u32>>,
    pub value: TemplateAttributeValue,
}

#[derive(Debug, PartialEq, Eq)]
pub enum TemplateAttributeValue {
    Boolean,
    Static(Range<u32>),
    Expression(Range<u32>),
    Spread(Range<u32>),
    Empty,
}

#[derive(Debug)]
pub struct ContainerDiagnostic {
    pub message: String,
    pub span: Option<Range<u32>>,
}
