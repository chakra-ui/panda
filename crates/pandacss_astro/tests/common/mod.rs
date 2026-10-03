#![allow(
    dead_code,
    reason = "each test binary uses a different subset of the helpers"
)]

use oxc_allocator::Allocator;
use oxc_parser::{ParseOptions, Parser};
use oxc_span::SourceType;

pub fn check_offsets(source: &str, canvas: &str) -> Result<(), String> {
    if canvas.len() != source.len() && canvas.len() != source.len() + 1 {
        return Err(format!(
            "canvas is {} bytes, source is {}",
            canvas.len(),
            source.len()
        ));
    }
    for (index, (original, lowered)) in source.bytes().zip(canvas.bytes()).enumerate() {
        let line_break = matches!(original, b'\n' | b'\r');
        let allowed = original == lowered
            || (!line_break && matches!(lowered, b' ' | b',' | b';' | b'[' | b']'));
        if !allowed {
            return Err(format!(
                "byte {index} changed from {original:?} to {lowered:?}"
            ));
        }
    }
    Ok(())
}

pub fn check_parses(canvas: &str) -> Result<(), String> {
    let allocator = Allocator::default();
    let options = ParseOptions {
        allow_return_outside_function: true,
        ..ParseOptions::default()
    };
    let parsed = Parser::new(&allocator, canvas, SourceType::tsx().with_module(true))
        .with_options(options)
        .parse();
    if parsed.errors.is_empty() {
        Ok(())
    } else {
        Err(format!("{:?}", parsed.errors))
    }
}

pub fn lowered(source: &str) -> pandacss_astro::AstroDocument {
    let document = pandacss_astro::lower(source);
    check_offsets(source, &document.canvas).unwrap();
    check_parses(&document.canvas).unwrap();
    document
}

pub fn show(canvas: &str) -> String {
    canvas
        .split('\n')
        .map(|line| format!("|{}", line.trim_end()))
        .collect::<Vec<_>>()
        .join("\n")
}
