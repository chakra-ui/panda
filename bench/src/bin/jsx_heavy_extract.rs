#![allow(
    clippy::cast_precision_loss,
    clippy::disallowed_macros,
    clippy::print_stdout,
    reason = "benchmark binaries intentionally print JSON timing output"
)]

use std::time::Instant;

use pandacss_extractor::{
    ExtractorConfig, JsxExtractionConfig, JsxStyleProps, Matcher, Matchers, NameMatcher, extract,
};
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::json;

#[derive(Debug, Clone, Copy)]
struct Args {
    elements: usize,
    warm: usize,
    iterations: usize,
}

fn main() {
    let args = parse_args();
    let source = generated_source(args.elements);
    let config = config();

    assert_fixture_contract(&config);

    for _ in 0..args.warm {
        let _ = extract(&source, "fixture.tsx", &config);
    }

    let start = Instant::now();
    let mut calls = 0usize;
    let mut jsx = 0usize;
    let mut diagnostics = 0usize;
    for _ in 0..args.iterations {
        let result = extract(&source, "fixture.tsx", &config);
        calls = calls.wrapping_add(result.calls.len());
        jsx = jsx.wrapping_add(result.jsx.len());
        diagnostics = diagnostics.wrapping_add(result.diagnostics.len());
    }
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
    let checksum = calls.wrapping_add(jsx).wrapping_add(diagnostics);

    println!(
        "{}",
        json!({
            "engine": "rust",
            "scenario": "jsx-heavy-extract",
            "elements": args.elements,
            "iterations": args.iterations,
            "elapsedMs": elapsed_ms,
            "perIterationMs": elapsed_ms / args.iterations as f64,
            "callsPerIteration": calls / args.iterations,
            "jsxPerIteration": jsx / args.iterations,
            "diagnosticsPerIteration": diagnostics / args.iterations,
            "checksum": checksum,
        })
    );
}

fn assert_fixture_contract(config: &ExtractorConfig) {
    let preflight = extract(&generated_source(8), "fixture.tsx", config);
    assert!(
        preflight.diagnostics.is_empty(),
        "JSX benchmark fixture produced diagnostics: {:?}",
        preflight.diagnostics
    );
    assert_eq!(preflight.calls.len(), 1, "expected one css() call");
    let mut jsx_names: Vec<_> = preflight
        .jsx
        .iter()
        .map(|entry| entry.name.as_str())
        .collect();
    jsx_names.sort_unstable();
    assert_eq!(
        jsx_names,
        [
            "Box",
            "FieldInput",
            "Grid",
            "PrimaryAction",
            "Stack",
            "styled.div"
        ],
        "expected the configured JSX component and factory cases"
    );
}

fn parse_args() -> Args {
    parse_args_from(std::env::args().skip(1))
}

fn parse_args_from(argv: impl IntoIterator<Item = String>) -> Args {
    let mut parsed = Args {
        elements: 2_000,
        warm: 10,
        iterations: 50,
    };
    let mut iter = argv.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--elements" => {
                parsed.elements = parse_usize_value(&mut iter, "--elements");
            }
            "--warm" => {
                parsed.warm = parse_usize_value(&mut iter, "--warm");
            }
            "--iterations" => {
                parsed.iterations = parse_usize_value(&mut iter, "--iterations");
            }
            _ => {}
        }
    }
    assert!(parsed.elements > 0, "--elements must be greater than zero");
    assert!(
        parsed.iterations > 0,
        "--iterations must be greater than zero"
    );
    parsed
}

fn parse_usize_value(iter: &mut impl Iterator<Item = String>, flag: &str) -> usize {
    let value = iter
        .next()
        .unwrap_or_else(|| panic!("missing {flag} value"));
    value
        .parse()
        .unwrap_or_else(|_| panic!("invalid {flag} value: {value}"))
}

fn config() -> ExtractorConfig {
    let mut component_names = FxHashSet::default();
    component_names.extend([
        "Button".to_owned(),
        "Card".to_owned(),
        "Stack".to_owned(),
        "Grid".to_owned(),
    ]);

    let component_regexes = vec![
        regex::Regex::new("Action$").expect("regex"),
        regex::Regex::new("^Field[A-Z]").expect("regex"),
    ];
    let valid_style_props = ["color", "bg", "padding", "margin", "display", "gap", "css"]
        .into_iter()
        .map(str::to_owned)
        .collect();

    ExtractorConfig::new(Matchers {
        css: Matcher {
            modules: vec!["@panda/css".to_owned()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        recipe: Matcher {
            modules: vec!["@panda/recipes".to_owned()],
            names: NameMatcher::Any,
        },
        pattern: Matcher {
            modules: vec!["@panda/patterns".to_owned()],
            names: NameMatcher::Any,
        },
        jsx: Some(Matcher {
            modules: vec!["@panda/jsx".to_owned()],
            names: NameMatcher::only(["styled", "Box", "Stack", "Grid"]),
        }),
        tokens: Matcher {
            modules: vec!["@panda/tokens".to_owned()],
            names: NameMatcher::only(["token"]),
        },
        jsx_factories: Some(vec!["styled".to_owned()]),
        ..Default::default()
    })
    .with_jsx(JsxExtractionConfig {
        style_props: JsxStyleProps::All,
        component_names,
        component_regexes,
        component_regex_set: None,
        component_props: FxHashMap::default(),
        component_regex_props: Vec::new(),
        component_regex_prop_set: None,
        component_strict: FxHashSet::default(),
        component_regex_strict: Vec::new(),
        component_regex_strict_set: None,
        component_blocklist: FxHashMap::default(),
        component_regex_blocklist: Vec::new(),
        component_regex_blocklist_set: None,
        valid_style_props,
    })
    .with_jsx_framework(true)
}

fn generated_source(elements: usize) -> String {
    let mut source = String::from(
        "import { css } from '@panda/css';\n\
         import { Box, Stack, Grid, styled } from '@panda/jsx';\n\
         import { button, card } from '@panda/recipes';\n\
         const shared = { color: 'red', padding: '4' };\n\
         export function Fixture() {\n\
         return <>\n",
    );
    for index in 0..elements {
        match index % 8 {
            0 => source.push_str("<Box color='red' padding='4' css={{ bg: 'blue' }} />\n"),
            1 => source.push_str("<Stack gap='3' {...shared} />\n"),
            2 => source.push_str("<Grid display='grid' margin='2' />\n"),
            3 => source.push_str("<styled.div color='green' />\n"),
            4 => source.push_str("<PrimaryAction color='purple' />\n"),
            5 => source.push_str("<FieldInput bg='gray.100' />\n"),
            6 => source.push_str("<button.Root size='md' />\n"),
            _ => source.push_str("<div data-id='skip' />\n"),
        }
    }
    source.push_str("</>;\n}\ncss({ color: 'red' });\n");
    source
}

#[cfg(test)]
mod tests {
    use super::{assert_fixture_contract, config, parse_args_from};

    #[test]
    fn fixture_exercises_jsx_extraction() {
        assert_fixture_contract(&config());
    }

    #[test]
    #[should_panic(expected = "--iterations must be greater than zero")]
    fn zero_iterations_are_rejected() {
        parse_args_from(["--iterations".to_owned(), "0".to_owned()]);
    }
}
