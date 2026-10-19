use oxc_allocator::Allocator;
use oxc_ast::ast::CallExpression;
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;
use pandacss_sfc::mdx::lower;
use serde::Serialize;

#[derive(Serialize)]
pub(super) struct Boundaries<'a> {
    elements: Vec<Element<'a>>,
    calls: Vec<Call<'a>>,
}

#[derive(Serialize)]
struct Element<'a> {
    name: &'a str,
    start: u32,
}

#[derive(Serialize)]
struct Call<'a> {
    source: &'a str,
    start: u32,
    end: u32,
}

#[derive(Default)]
struct CallSpans(Vec<(u32, u32)>);

impl<'a> Visit<'a> for CallSpans {
    fn visit_call_expression(&mut self, expression: &CallExpression<'a>) {
        self.0.push((expression.span.start, expression.span.end));
        walk::walk_call_expression(self, expression);
    }
}

pub(super) fn boundaries(source: &str) -> Boundaries<'_> {
    let document = lower(source);
    assert!(
        document.diagnostics.is_empty(),
        "{:?}",
        document.diagnostics
    );
    assert_eq!(
        document.extraction_source.len(),
        source.len(),
        "original byte length"
    );

    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, &document.extraction_source, SourceType::tsx()).parse();
    assert!(
        parsed.errors.is_empty(),
        "{:?}\n{}",
        parsed.errors,
        document.extraction_source
    );

    let elements = document
        .elements
        .iter()
        .map(|element| Element {
            name: &source[element.name.start as usize..element.name.end as usize],
            start: element.opening.start,
        })
        .collect();
    let mut spans = CallSpans::default();
    spans.visit_program(&parsed.program);
    spans.0.sort_unstable();
    let calls = spans
        .0
        .into_iter()
        .map(|(start, end)| Call {
            source: &source[start as usize..end as usize],
            start,
            end,
        })
        .collect();

    Boundaries { elements, calls }
}
