use oxc_allocator::Allocator;
use oxc_ast::ast::CallExpression;
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};
use pandacss_sfc::mdx::lower;
use serde_json::json;

#[derive(Default)]
struct Calls(Vec<(u32, u32)>);
impl<'a> Visit<'a> for Calls {
    fn visit_call_expression(&mut self, expression: &CallExpression<'a>) {
        let span = expression.span();
        self.0.push((span.start, span.end));
        walk::walk_call_expression(self, expression);
    }
}

#[test]
fn extraction_boundaries_match_the_official_mdx_parser() {
    let corpus_text = std::env::var("PANDA_MDX_CORPUS")
        .ok()
        .map(|path| std::fs::read_to_string(path).unwrap());
    let corpus: serde_json::Value = serde_json::from_str(
        corpus_text
            .as_deref()
            .unwrap_or(include_str!("fixtures/mdx-parity.json")),
    )
    .unwrap();
    let mut failures = Vec::new();
    for case in corpus["cases"].as_array().unwrap() {
        let source = case["source"].as_str().unwrap();
        let name = case["name"].as_str().unwrap();
        let document = lower(source);
        if !document.diagnostics.is_empty() {
            failures.push(format!("{name}: {:?}", document.diagnostics));
            continue;
        }
        assert_eq!(source.len(), document.canvas.len(), "{name}: byte length");
        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, &document.canvas, SourceType::tsx()).parse();
        if !parsed.errors.is_empty() {
            failures.push(format!("{name}: {:?}\n{}", parsed.errors, document.canvas));
            continue;
        }
        let elements: Vec<_> = document.elements.iter().map(|element|
            json!({"name": &source[element.name.start as usize..element.name.end as usize], "start": element.opening.start})
        ).collect();
        if json!(elements) != case["elements"] {
            failures.push(format!(
                "{name}: elements {} != {}",
                json!(elements),
                case["elements"]
            ));
        }
        let mut calls = Calls::default();
        calls.visit_program(&parsed.program);
        calls.0.sort_unstable();
        if json!(calls.0) != case["calls"] {
            failures.push(format!(
                "{name}: calls {} != {}",
                json!(calls.0),
                case["calls"]
            ));
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}

#[test]
fn malformed_containers_return_diagnostics_without_panicking() {
    for source in [
        "{css({color:'red'})",
        "<Box color=",
        "<Box {...",
        "<Box color='red",
        "<Box><span /></Other>",
    ] {
        assert!(!lower(source).diagnostics.is_empty(), "{source}");
    }
}

#[test]
fn frontmatter_is_excluded() {
    for marker in ["---", "+++"] {
        let source =
            format!("{marker}\nvalue: '<Box color=\"wrong\" />'\n{marker}\n<Box color=\"red\" />");
        let document = lower(&source);
        assert!(document.diagnostics.is_empty());
        assert_eq!(document.elements.len(), 1);
    }
}
