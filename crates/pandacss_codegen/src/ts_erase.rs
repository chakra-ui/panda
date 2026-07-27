//! Type erasure over an Oxc parse.
//!
//! The parser decides what is type syntax; this module only deletes the spans it
//! reports and copies every other byte through. Nothing is reprinted, so
//! generated JS keeps the formatting the artifact templates wrote.
//!
//! Erasable syntax only, the same subset Node's `--experimental-strip-types`
//! accepts. `enum` and `namespace` have runtime semantics, so they are left
//! alone rather than mangled — codegen never emits them.

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, Expression, FormalParameter, ImportDeclaration,
    ImportOrExportKind, Program, Statement, TSTypeAnnotation, VariableDeclarator,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

/// What the input is, so it can be wrapped into a parseable program.
#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum Fragment {
    /// A whole module.
    Program,
    /// A single expression, as printed for a `const` initializer.
    Expression,
    /// A `{ … }` block, as printed for a function body.
    Block,
}

impl Fragment {
    fn wrap(self, code: &str) -> (String, u32) {
        match self {
            Self::Program => (code.to_owned(), 0),
            Self::Expression => {
                let prefix = "const __x__ = (";
                (format!("{prefix}{code})"), prefix.len() as u32)
            }
            Self::Block => {
                let prefix = "function __x__() ";
                (format!("{prefix}{code}"), prefix.len() as u32)
            }
        }
    }
}

/// Erase TypeScript from `code`, or return it unchanged when it does not parse.
///
/// A parse failure means the artifact template emitted something invalid, which
/// is a codegen bug rather than user input — the caller keeps the original text
/// so the failure surfaces downstream instead of as silently mangled output.
pub(crate) fn erase_typescript(code: &str, fragment: Fragment) -> String {
    let (source, offset) = fragment.wrap(code);
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, &source, SourceType::ts()).parse();
    if !parsed.errors.is_empty() {
        return code.to_owned();
    }

    let mut collector = Eraser {
        source: &source,
        cuts: Vec::new(),
    };
    collector.visit_program(&parsed.program);

    let mut cuts = collector.cuts;
    cuts.sort_by_key(|span| (span.start, span.end));
    apply_cuts(&source, &cuts, offset, code)
}

/// Copy `source` minus `cuts`, then strip the wrapper back off.
fn apply_cuts(source: &str, cuts: &[Span], offset: u32, original: &str) -> String {
    let mut out = String::with_capacity(source.len());
    let mut cursor = 0u32;
    for cut in cuts {
        if cut.start < cursor {
            // Nested cut already covered by an outer one.
            cursor = cursor.max(cut.end);
            continue;
        }
        let Some(text) = slice(source, cursor, cut.start) else {
            return original.to_owned();
        };
        out.push_str(text);
        cursor = cut.end;
    }
    let Some(rest) = source.get(cursor as usize..) else {
        return original.to_owned();
    };
    out.push_str(rest);

    if offset == 0 {
        return out;
    }
    // The wrapper never contains type syntax, so its bytes survive verbatim.
    let start = offset as usize;
    let end = out.len() - usize::from(offset != 0 && out.ends_with(')'));
    out.get(start..end).map_or_else(|| original.to_owned(), str::to_owned)
}

fn slice(source: &str, start: u32, end: u32) -> Option<&str> {
    source.get(start as usize..end as usize)
}

struct Eraser<'a> {
    source: &'a str,
    cuts: Vec<Span>,
}

impl Eraser<'_> {
    fn cut(&mut self, span: Span) {
        if span.end > span.start {
            self.cuts.push(span);
        }
    }

    /// Cut from the end of a kept expression to the end of the node, which is
    /// how `as T`, `satisfies T` and a trailing `!` are removed.
    fn cut_tail(&mut self, kept_end: u32, node_end: u32) {
        self.cut(Span::new(kept_end, node_end));
    }

    /// Cut the `?` that follows a binding, if there is one before `limit`.
    fn cut_optional_marker(&mut self, from: u32, limit: u32) {
        self.cut_marker(from, limit, '?');
    }

    /// Cut the definite-assignment `!` that follows a binding.
    fn cut_definite_marker(&mut self, from: u32, limit: u32) {
        self.cut_marker(from, limit, '!');
    }

    fn cut_marker(&mut self, from: u32, limit: u32, marker: char) {
        let Some(text) = slice(self.source, from, limit) else {
            return;
        };
        if let Some(index) = text.find(marker) {
            let at = from + index as u32;
            self.cut(Span::new(at, at + 1));
        }
    }

    /// A statement that only exists for the type system.
    fn is_type_only_statement(statement: &Statement<'_>) -> bool {
        match statement {
            Statement::TSInterfaceDeclaration(_)
            | Statement::TSTypeAliasDeclaration(_)
            | Statement::TSImportEqualsDeclaration(_) => true,
            Statement::ImportDeclaration(import) => import.import_kind == ImportOrExportKind::Type,
            Statement::ExportNamedDeclaration(export) => {
                export.export_kind == ImportOrExportKind::Type
                    || matches!(
                        export.declaration,
                        Some(Declaration::TSInterfaceDeclaration(_) | Declaration::TSTypeAliasDeclaration(_))
                    )
            }
            _ => false,
        }
    }
}

impl<'a> Visit<'a> for Eraser<'_> {
    fn visit_program(&mut self, program: &Program<'a>) {
        for statement in &program.body {
            if Self::is_type_only_statement(statement) {
                self.cut(statement.span());
                continue;
            }
            self.visit_statement(statement);
        }
    }

    fn visit_ts_type_annotation(&mut self, annotation: &TSTypeAnnotation<'a>) {
        // The span starts at the `:`, so the whole annotation goes in one cut.
        self.cut(annotation.span);
    }

    fn visit_formal_parameter(&mut self, param: &FormalParameter<'a>) {
        if param.optional {
            let limit = param
                .type_annotation
                .as_ref()
                .map_or(param.span.end, |annotation| annotation.span.start);
            self.cut_optional_marker(param.pattern.span().end, limit);
        }
        walk::walk_formal_parameter(self, param);
    }

    fn visit_variable_declarator(&mut self, declarator: &VariableDeclarator<'a>) {
        if declarator.definite {
            let limit = declarator
                .type_annotation
                .as_ref()
                .map_or(declarator.span.end, |annotation| annotation.span.start);
            self.cut_definite_marker(declarator.id.span().end, limit);
        }
        walk::walk_variable_declarator(self, declarator);
    }

    fn visit_expression(&mut self, expression: &Expression<'a>) {
        match expression {
            Expression::TSAsExpression(node) => {
                self.cut_tail(node.expression.span().end, node.span.end);
                self.visit_expression(&node.expression);
                return;
            }
            Expression::TSSatisfiesExpression(node) => {
                self.cut_tail(node.expression.span().end, node.span.end);
                self.visit_expression(&node.expression);
                return;
            }
            Expression::TSNonNullExpression(node) => {
                self.cut_tail(node.expression.span().end, node.span.end);
                self.visit_expression(&node.expression);
                return;
            }
            Expression::TSInstantiationExpression(node) => {
                self.cut(node.type_arguments.span);
                self.visit_expression(&node.expression);
                return;
            }
            Expression::TSTypeAssertion(node) => {
                self.cut(Span::new(node.span.start, node.expression.span().start));
                self.visit_expression(&node.expression);
                return;
            }
            _ => {}
        }
        walk::walk_expression(self, expression);
    }

    fn visit_ts_type_parameter_declaration(
        &mut self,
        declaration: &oxc_ast::ast::TSTypeParameterDeclaration<'a>,
    ) {
        self.cut(declaration.span);
    }

    fn visit_ts_type_parameter_instantiation(
        &mut self,
        instantiation: &oxc_ast::ast::TSTypeParameterInstantiation<'a>,
    ) {
        self.cut(instantiation.span);
    }

    fn visit_import_declaration(&mut self, import: &ImportDeclaration<'a>) {
        if import.import_kind == ImportOrExportKind::Type {
            self.cut(import.span);
            return;
        }
        walk::walk_import_declaration(self, import);
    }

    fn visit_export_named_declaration(&mut self, export: &ExportNamedDeclaration<'a>) {
        if export.export_kind == ImportOrExportKind::Type {
            self.cut(export.span);
            return;
        }
        walk::walk_export_named_declaration(self, export);
    }
}

/// Erase types from a whole module.
#[must_use]
pub fn erase_typescript_program(code: &str) -> String {
    erase_typescript(code, Fragment::Program)
}

/// Erase types from a printed expression, such as a `const` initializer.
#[must_use]
pub fn erase_typescript_expr(code: &str) -> String {
    erase_typescript(code, Fragment::Expression)
}

/// Erase types from a printed `{ … }` block, such as a function body.
#[must_use]
pub fn erase_typescript_block(code: &str) -> String {
    erase_typescript(code, Fragment::Block)
}
