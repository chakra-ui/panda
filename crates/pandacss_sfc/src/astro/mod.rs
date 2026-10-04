mod frontmatter;
mod lower;
mod template;
mod tree;

use std::ops::Range;

#[derive(Debug)]
pub struct AstroDocument {
    pub canvas: String,
    pub frontmatter: Option<Range<u32>>,
    pub elements: Vec<AstroElement>,
    pub scripts: Vec<Range<u32>>,
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
    let document = template::parse(source);
    lower::lower(source, document)
}
