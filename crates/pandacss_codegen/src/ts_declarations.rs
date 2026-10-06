//! `.d.ts` output derived from typed TypeScript with Oxc isolated declarations,
//! so an artifact's declarations come from the same source as its runtime.

use oxc_allocator::Allocator;
use oxc_codegen::{Codegen, CodegenOptions, IndentChar};
use oxc_isolated_declarations::{IsolatedDeclarations, IsolatedDeclarationsOptions};
use oxc_parser::Parser;
use oxc_span::SourceType;

/// Declarations for `code`. Panics in debug builds when the template doesn't parse
/// or an export lacks the annotations isolated declarations needs.
pub(crate) fn typescript_declarations(code: &str) -> String {
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, code, SourceType::ts()).parse();
    debug_assert!(
        parsed.errors.is_empty(),
        "typed source does not parse: {:?}\n{code}",
        parsed.errors
    );

    let declarations = IsolatedDeclarations::new(
        &allocator,
        IsolatedDeclarationsOptions {
            strip_internal: false,
        },
    )
    .build(&parsed.program);
    debug_assert!(
        declarations.errors.is_empty(),
        "typed source needs explicit annotations: {:?}\n{code}",
        declarations.errors
    );

    Codegen::new()
        .with_options(CodegenOptions {
            single_quote: true,
            indent_char: IndentChar::Space,
            indent_width: 2,
            ..CodegenOptions::default()
        })
        .build(&declarations.program)
        .code
        .trim_end()
        .to_owned()
}
