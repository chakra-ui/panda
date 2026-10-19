mod frontmatter;
mod lower;
mod template;
mod tree;

use std::ops::Range;

use crate::{ContainerDiagnostic, TemplateElement};

#[derive(Debug)]
pub struct AstroDocument {
    pub canvas: String,
    pub frontmatter: Option<Range<u32>>,
    pub elements: Vec<TemplateElement>,
    pub scripts: Vec<Range<u32>>,
    pub diagnostics: Vec<ContainerDiagnostic>,
}

#[must_use]
pub fn lower(source: &str) -> AstroDocument {
    let document = template::parse(source);
    lower::lower(source, document)
}
