use crate::convert::convert_record;
use napi_derive::napi;

#[napi(string_enum = "camelCase")]
pub enum ImportSpecifierKind {
    Named,
    Default,
    Namespace,
}

#[napi(object)]
pub struct ImportSpecifier {
    pub kind: ImportSpecifierKind,
    pub imported: String,
    pub local: String,
    pub type_only: bool,
    pub span: crate::Span,
}

#[napi(string_enum = "camelCase")]
pub enum ImportKind {
    SideEffect,
    Value,
}

#[napi(object)]
pub struct ImportRecord {
    pub module: String,
    pub kind: ImportKind,
    pub type_only: bool,
    pub specifiers: Vec<ImportSpecifier>,
    pub span: crate::Span,
}

#[napi(object)]
pub struct ImportScanResult {
    pub imports: Vec<ImportRecord>,
    pub diagnostics: Vec<crate::Diagnostic>,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned String parameters"
)]
pub fn scan_imports(source: String, path: String) -> ImportScanResult {
    let result = extractor::scan_imports(&source, &path);
    ImportScanResult {
        imports: result.imports.into_iter().map(convert_record).collect(),
        diagnostics: result
            .diagnostics
            .into_iter()
            .map(crate::convert::convert_diagnostic)
            .collect(),
    }
}
