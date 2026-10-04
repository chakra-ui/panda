#![allow(
    dead_code,
    reason = "each test binary uses a different subset of the helpers"
)]

use oxc_allocator::Allocator;
use oxc_parser::{ParseOptions, Parser};
use oxc_span::SourceType;

pub fn check_offsets(source: &str, canvas: &str) -> Result<(), String> {
    check_offsets_with(source, canvas, b" 0,;[]")
}

/// Vue and Svelte wrap each copied expression in `(` `)`, after a `;` or a `,`.
pub fn check_mask_offsets(source: &str, canvas: &str) -> Result<(), String> {
    check_offsets_with(source, canvas, b" ();,")
}

fn check_offsets_with(source: &str, canvas: &str, written: &[u8]) -> Result<(), String> {
    if canvas.len() != source.len() && canvas.len() != source.len() + 1 {
        return Err(format!(
            "canvas is {} bytes, source is {}",
            canvas.len(),
            source.len()
        ));
    }
    for (index, (original, lowered)) in source.bytes().zip(canvas.bytes()).enumerate() {
        let line_break = matches!(original, b'\n' | b'\r');
        let allowed = original == lowered || (!line_break && written.contains(&lowered));
        if !allowed {
            return Err(format!(
                "byte {index} changed from {original:?} to {lowered:?}"
            ));
        }
    }
    Ok(())
}

pub fn check_parses(canvas: &str) -> Result<(), String> {
    check_parses_as(canvas, SourceType::tsx())
}

pub fn check_parses_as(canvas: &str, source_type: SourceType) -> Result<(), String> {
    let allocator = Allocator::default();
    let options = ParseOptions {
        allow_return_outside_function: true,
        ..ParseOptions::default()
    };
    let parsed = Parser::new(&allocator, canvas, source_type.with_module(true))
        .with_options(options)
        .parse();
    if parsed.errors.is_empty() {
        Ok(())
    } else {
        Err(format!("{:?}", parsed.errors))
    }
}

pub fn lowered(source: &str) -> pandacss_sfc::astro::AstroDocument {
    let document = pandacss_sfc::astro::lower(source);
    check_offsets(source, &document.canvas).unwrap();
    check_parses(&document.canvas).unwrap();
    document
}

pub fn masked(source: &str, mask: String) -> String {
    check_mask_offsets(source, &mask).unwrap();
    check_parses(&mask).unwrap();
    mask
}

pub fn show(canvas: &str) -> String {
    canvas
        .split('\n')
        .map(|line| format!("|{}", line.trim_end()))
        .collect::<Vec<_>>()
        .join("\n")
}
