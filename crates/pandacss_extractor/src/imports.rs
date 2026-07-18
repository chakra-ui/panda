//! Scan a file's external module bindings into [`ImportRecord`]s.
//! Default is `import` only (extract / match / cross-file). Opt into
//! `export … from` via [`ScanImportsOptions::reexports`] for DS hydrate narrowing.
//! Opt into `import()` / `require()` via [`ScanImportsOptions::dynamic`].

use crate::{Diagnostic, Span, diagnostic_codes, span_from_oxc};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, BindingIdentifier, CallExpression, Expression, ImportDeclarationSpecifier,
    ImportExpression, ImportOrExportKind, ModuleExportName, Program, Statement,
};
use oxc_ast_visit::{Visit, walk};
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

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ScanImportsOptions {
    /// Also emit `export { … } from` / `export * from` as import records.
    pub reexports: bool,
    /// Also emit `import('…')` / `require('…')` as side-effect records.
    pub dynamic: bool,
}

/// `path` is used only for `SourceType` detection; no filesystem access.
/// Unknown extensions fall back to `tsx`.
///
/// Parse-error contract: see [`crate::extract`] — `diagnostics` is
/// authoritative, `imports` may be partial when Oxc recovers from a
/// syntax error.
#[must_use]
pub fn scan_imports(source: &str, path: &str) -> ImportScanResult {
    scan_imports_with(source, path, ScanImportsOptions::default())
}

#[must_use]
pub fn scan_imports_with(
    source: &str,
    path: &str,
    options: ScanImportsOptions,
) -> ImportScanResult {
    let allocator = Allocator::default();
    let source = crate::adapt_source(source, path);
    let source = source.as_ref();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type)
        .with_options(crate::adapter::parse_options_for(path))
        .parse();

    ImportScanResult {
        imports: collect_imports_with(&parser_return.program, options),
        diagnostics: collect_parser_diagnostics(&parser_return.errors, source),
    }
}

#[must_use]
pub(crate) fn collect_imports(program: &Program<'_>) -> Vec<ImportRecord> {
    collect_imports_with(program, ScanImportsOptions::default())
}

#[must_use]
pub(crate) fn collect_imports_with(
    program: &Program<'_>,
    options: ScanImportsOptions,
) -> Vec<ImportRecord> {
    let mut out = Vec::new();
    for stmt in &program.body {
        match stmt {
            Statement::ImportDeclaration(decl) => {
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
            Statement::ExportNamedDeclaration(decl) if options.reexports => {
                if decl.export_kind == ImportOrExportKind::Type {
                    continue;
                }
                let Some(source) = &decl.source else {
                    continue;
                };
                let module = source.value.to_string();
                let span = span_from_oxc(decl.span);
                let mut specifiers = Vec::new();
                for specifier in &decl.specifiers {
                    if specifier.export_kind == ImportOrExportKind::Type {
                        continue;
                    }
                    let imported = module_export_name(&specifier.local);
                    let local = module_export_name(&specifier.exported);
                    let kind = if imported == "default" {
                        ImportSpecifierKind::Default
                    } else {
                        ImportSpecifierKind::Named
                    };
                    specifiers.push(ImportSpecifier {
                        kind,
                        imported,
                        local,
                        type_only: false,
                        span: span_from_oxc(specifier.span),
                    });
                }
                if specifiers.is_empty() {
                    continue;
                }
                out.push(ImportRecord {
                    module,
                    kind: ImportKind::Value,
                    type_only: false,
                    specifiers,
                    span,
                });
            }
            Statement::ExportAllDeclaration(decl) if options.reexports => {
                if decl.export_kind == ImportOrExportKind::Type {
                    continue;
                }
                let module = decl.source.value.to_string();
                let span = span_from_oxc(decl.span);
                let (kind, specifiers) = if let Some(exported) = &decl.exported {
                    (
                        ImportKind::Value,
                        vec![ImportSpecifier {
                            kind: ImportSpecifierKind::Namespace,
                            imported: "*".to_owned(),
                            local: module_export_name(exported),
                            type_only: false,
                            span,
                        }],
                    )
                } else {
                    (ImportKind::SideEffect, Vec::new())
                };
                out.push(ImportRecord {
                    module,
                    kind,
                    type_only: false,
                    specifiers,
                    span,
                });
            }
            _ => {}
        }
    }

    if options.dynamic {
        let mut dynamic = DynamicImportCollector { out: Vec::new() };
        dynamic.visit_program(program);
        out.append(&mut dynamic.out);
    }

    out
}

struct DynamicImportCollector {
    out: Vec<ImportRecord>,
}

impl<'a> Visit<'a> for DynamicImportCollector {
    fn visit_import_expression(&mut self, expr: &ImportExpression<'a>) {
        if let Some(module) = string_literal_expr(&expr.source) {
            self.out
                .push(side_effect_record(module, span_from_oxc(expr.span)));
        }
        walk::walk_import_expression(self, expr);
    }

    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if is_require_call(call)
            && let Some(module) = first_string_argument(call)
        {
            self.out
                .push(side_effect_record(module, span_from_oxc(call.span)));
        }
        walk::walk_call_expression(self, call);
    }
}

fn side_effect_record(module: String, span: Span) -> ImportRecord {
    ImportRecord {
        module,
        kind: ImportKind::SideEffect,
        type_only: false,
        specifiers: Vec::new(),
        span,
    }
}

fn is_require_call(call: &CallExpression<'_>) -> bool {
    match &call.callee {
        Expression::Identifier(id) => id.name == "require",
        _ => false,
    }
}

fn first_string_argument(call: &CallExpression<'_>) -> Option<String> {
    let arg = call.arguments.first()?;
    match arg {
        Argument::StringLiteral(lit) => Some(lit.value.to_string()),
        Argument::TemplateLiteral(lit) if lit.expressions.is_empty() && lit.quasis.len() == 1 => {
            Some(lit.quasis[0].value.cooked.as_ref()?.to_string())
        }
        _ => None,
    }
}

fn string_literal_expr(expr: &Expression<'_>) -> Option<String> {
    match expr {
        Expression::StringLiteral(lit) => Some(lit.value.to_string()),
        Expression::TemplateLiteral(lit) if lit.expressions.is_empty() && lit.quasis.len() == 1 => {
            Some(lit.quasis[0].value.cooked.as_ref()?.to_string())
        }
        _ => None,
    }
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
            // A parse error warns rather than aborts the build; the bundler reports real
            // syntax errors. `--max-warnings 0` restores strict failure.
            let message = format!(
                "{}. Panda could not fully parse this file; some styles may be missing.",
                error.message.to_string().trim_end_matches('.')
            );
            let mut diagnostic = Diagnostic::warning(diagnostic_codes::JS_PARSE_ERROR, message);
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

/// Shared by `export_names.rs` and `cross_file.rs`, which handle the same
/// `ModuleExportName` shape on the export side of specifiers.
pub(crate) fn module_export_name(name: &ModuleExportName<'_>) -> String {
    name.name().to_string()
}

fn binding_name(binding: &BindingIdentifier<'_>) -> String {
    binding.name.to_string()
}
