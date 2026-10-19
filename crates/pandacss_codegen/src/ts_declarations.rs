//! `.d.ts` output derived from typed TypeScript with Oxc isolated declarations,
//! so an artifact's declarations come from the same source as its runtime.

use oxc_allocator::Allocator;
use oxc_ast::ast::{Declaration, Statement};
use oxc_codegen::{Codegen, CodegenOptions, IndentChar};
use oxc_isolated_declarations::{IsolatedDeclarations, IsolatedDeclarationsOptions};
use oxc_parser::Parser;
use oxc_span::SourceType;

/// Declarations for `code`. Panics in debug builds when the template doesn't parse,
/// an export lacks the annotations isolated declarations needs, or an export's
/// declaration uses a name the template doesn't export, which consumers can't name.
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
    let statements = &declarations.program.body;
    debug_assert!(
        statements
            .iter()
            .all(|statement| unexported_declaration(statement).is_none()),
        "typed source declares names its declarations use but doesn't export: {:?}\n{code}",
        statements
            .iter()
            .filter_map(unexported_declaration)
            .filter_map(Declaration::id)
            .map(|id| id.name.as_str())
            .collect::<Vec<_>>()
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

// `declare global` and `declare module '…'` augmentations have no name to export.
fn unexported_declaration<'s, 'a>(statement: &'s Statement<'a>) -> Option<&'s Declaration<'a>> {
    match statement {
        Statement::TSGlobalDeclaration(_) => None,
        Statement::TSModuleDeclaration(module) if module.id.is_string_literal() => None,
        _ => statement.as_declaration(),
    }
}
