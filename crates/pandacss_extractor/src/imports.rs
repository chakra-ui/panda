use crate::{Diagnostic, Span, diagnostic_codes, span_from_oxc};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    BindingIdentifier, ImportDeclarationSpecifier, ImportOrExportKind, ModuleExportName, Program,
    Statement,
};
use oxc_diagnostics::OxcDiagnostic;
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum ImportSpecifierKind {
    Named,
    Default,
    Namespace,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ImportSpecifier {
    pub kind: ImportSpecifierKind,
    /// `"default"` for default imports, `"*"` for namespace imports.
    pub imported: String,
    pub local: String,
    /// `true` only for the `type` marker on a single specifier
    /// (`import { type Foo }`), not for whole-declaration `import type`.
    pub type_only: bool,
    pub span: Span,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ImportKind {
    /// `import "side-effect"` — no specifiers.
    SideEffect,
    Value,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ImportRecord {
    pub module: String,
    pub kind: ImportKind,
    pub type_only: bool,
    pub specifiers: Vec<ImportSpecifier>,
    pub span: Span,
}

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ImportScanResult {
    pub imports: Vec<ImportRecord>,
    pub diagnostics: Vec<Diagnostic>,
}

/// `path` is used only for `SourceType` detection; no filesystem access.
/// Unknown extensions fall back to `tsx`.
///
/// Parse-error contract: see [`crate::extract`] — `diagnostics` is
/// authoritative, `imports` may be partial when Oxc recovers from a
/// syntax error.
#[must_use]
pub fn scan_imports(source: &str, path: &str) -> ImportScanResult {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    ImportScanResult {
        imports: collect_imports(&parser_return.program),
        diagnostics: collect_parser_diagnostics(&parser_return.errors, source),
    }
}

// Internal: borrows an Oxc `Program` which we don't expose on the public
// surface.
#[must_use]
pub(crate) fn collect_imports(program: &Program<'_>) -> Vec<ImportRecord> {
    let mut out = Vec::new();
    for stmt in &program.body {
        if let Statement::ImportDeclaration(decl) = stmt {
            let module = decl.source.value.to_string();
            let type_only = matches!(decl.import_kind, ImportOrExportKind::Type);
            let span = span_from_oxc(decl.span);
            let (kind, specifiers) = match decl.specifiers.as_ref() {
                None => (ImportKind::SideEffect, Vec::new()),
                Some(specs) => (
                    ImportKind::Value,
                    specs.iter().map(specifier_record).collect(),
                ),
            };
            out.push(ImportRecord {
                module,
                kind,
                type_only,
                specifiers,
                span,
            });
        }
    }
    out
}

/// `source` resolves byte offsets to line/column locations — must be the
/// same string fed to `Parser::new` so the indexing matches.
#[must_use]
pub(crate) fn collect_parser_diagnostics(
    errors: &[OxcDiagnostic],
    source: &str,
) -> Vec<Diagnostic> {
    if errors.is_empty() {
        return Vec::new();
    }
    let line_index = crate::LineIndex::new(source);
    errors
        .iter()
        .map(|error| {
            let span = error.labels.as_ref().and_then(|labels| {
                labels.first().map(|label| Span {
                    start: u32::try_from(label.offset()).unwrap_or(0),
                    end: u32::try_from(label.offset() + label.len()).unwrap_or(0),
                })
            });
            let location = span.map(|s| line_index.locate_range(s.start, s.end));
            let mut diagnostic =
                Diagnostic::error(diagnostic_codes::JS_PARSE_ERROR, error.message.to_string());
            diagnostic.span = span;
            diagnostic.location = location;
            diagnostic
        })
        .collect()
}

fn specifier_record(spec: &ImportDeclarationSpecifier<'_>) -> ImportSpecifier {
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => ImportSpecifier {
            kind: ImportSpecifierKind::Named,
            imported: module_export_name(&named.imported),
            local: binding_name(&named.local),
            type_only: matches!(named.import_kind, ImportOrExportKind::Type),
            span: span_from_oxc(named.span),
        },
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => ImportSpecifier {
            kind: ImportSpecifierKind::Default,
            imported: "default".to_owned(),
            local: binding_name(&default.local),
            type_only: false,
            span: span_from_oxc(default.span),
        },
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => ImportSpecifier {
            kind: ImportSpecifierKind::Namespace,
            imported: "*".to_owned(),
            local: binding_name(&ns.local),
            type_only: false,
            span: span_from_oxc(ns.span),
        },
    }
}

fn module_export_name(name: &ModuleExportName<'_>) -> String {
    match name {
        ModuleExportName::IdentifierName(n) => n.name.to_string(),
        ModuleExportName::IdentifierReference(n) => n.name.to_string(),
        ModuleExportName::StringLiteral(s) => s.value.to_string(),
    }
}

fn binding_name(binding: &BindingIdentifier<'_>) -> String {
    binding.name.to_string()
}
