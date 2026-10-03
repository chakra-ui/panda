mod common;

use std::fs;
use std::path::PathBuf;

use astro_oxc_allocator::Allocator;
use astro_oxc_ast::ast::{JSXElement, JSXExpressionContainer, JSXFragment};
use astro_oxc_ast_visit::{Visit, walk};
use astro_oxc_parser::Parser;
use astro_oxc_span::{GetSpan, SourceType};
use insta::assert_snapshot;

fn corpus() -> Vec<PathBuf> {
    let dir = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/corpus");
    let mut paths: Vec<_> = fs::read_dir(dir)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .filter(|path| {
            path.extension()
                .is_some_and(|extension| extension == "astro")
        })
        .collect();
    paths.sort();
    paths
}

#[test]
fn every_compiler_rs_test_input_lowers_to_a_clean_program() {
    let paths = corpus();
    let mut rejected_by_astro = 0;
    let mut failures = Vec::new();
    for path in &paths {
        let source = fs::read_to_string(path).unwrap();
        let document = pandacss_astro::lower(&source);
        if let Err(problem) = common::check_offsets(&source, &document.canvas) {
            failures.push(format!("{}: {problem}", path.display()));
            continue;
        }
        if !document.diagnostics.is_empty() {
            rejected_by_astro += 1;
            continue;
        }
        if let Err(problem) = common::check_parses(&document.canvas) {
            failures.push(format!("{}: {problem}", path.display()));
        }
    }
    assert!(
        failures.is_empty(),
        "{} of {} inputs failed:\n{}",
        failures.len(),
        paths.len(),
        failures.join("\n")
    );
    assert_snapshot!(
        format!("inputs: {}\nrejected by astro: {rejected_by_astro}", paths.len()),
        @r"
    inputs: 2636
    rejected by astro: 546
    "
    );
}

#[derive(Default)]
struct LeafExpressions(Vec<(usize, usize)>);

struct ContainsMarkup(bool);

impl<'a> Visit<'a> for ContainsMarkup {
    fn visit_jsx_element(&mut self, _: &JSXElement<'a>) {
        self.0 = true;
    }

    fn visit_jsx_fragment(&mut self, _: &JSXFragment<'a>) {
        self.0 = true;
    }
}

impl<'a> Visit<'a> for LeafExpressions {
    fn visit_jsx_expression_container(&mut self, container: &JSXExpressionContainer<'a>) {
        if let Some(expression) = container.expression.as_expression() {
            let mut markup = ContainsMarkup(false);
            markup.visit_expression(expression);
            if !markup.0 {
                let span = expression.span();
                self.0.push((span.start as usize, span.end as usize));
            }
        }
        walk::walk_jsx_expression_container(self, container);
    }
}

#[test]
fn every_expression_without_markup_is_copied_verbatim() {
    let mut checked = 0;
    let mut failures = Vec::new();
    for path in corpus() {
        let source = fs::read_to_string(&path).unwrap();
        let document = pandacss_astro::lower(&source);
        if !document.diagnostics.is_empty() {
            continue;
        }
        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, &source, SourceType::astro()).parse_astro();
        let mut leaves = LeafExpressions::default();
        for child in &parsed.root.body {
            leaves.visit_jsx_child(child);
        }
        for (start, end) in leaves.0 {
            checked += 1;
            if document.canvas.as_bytes()[start..end] != source.as_bytes()[start..end] {
                failures.push(format!("{}: {}", path.display(), &source[start..end]));
            }
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
    assert_eq!(checked, 575);
}
