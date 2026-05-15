use napi_derive::napi;

// --- compile (no-op placeholder) ---

#[napi(object)]
pub struct CompileInput {
    pub files: Option<Vec<InputFile>>,
    pub config: Option<serde_json::Value>,
    pub cwd: Option<String>,
    pub cache_dir: Option<String>,
}

#[napi(object)]
pub struct InputFile {
    pub path: String,
    pub content: String,
}

#[napi(object)]
pub struct CompileOutput {
    pub css: String,
    pub source_map: Option<String>,
    pub manifest: CompileManifest,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi(object)]
pub struct CompileManifest {
    pub hashes: Vec<String>,
    pub tokens: Vec<String>,
}

#[napi]
#[must_use]
pub fn compile(_input: Option<CompileInput>) -> CompileOutput {
    let output = engine::compile(engine::CompileInput::default());

    CompileOutput {
        css: output.css,
        source_map: output.source_map,
        manifest: CompileManifest {
            hashes: output.manifest.hashes,
            tokens: output.manifest.tokens,
        },
        diagnostics: output
            .diagnostics
            .into_iter()
            .map(|d| Diagnostic {
                message: d.message,
                severity: format!("{:?}", d.severity).to_lowercase(),
                span: None,
            })
            .collect(),
    }
}

// --- scanImports ---

#[napi(object)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

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
    pub span: Span,
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
    pub span: Span,
}

#[napi(object)]
pub struct Diagnostic {
    pub message: String,
    pub severity: String,
    pub span: Option<Span>,
}

#[napi(object)]
pub struct ImportScanResult {
    pub imports: Vec<ImportRecord>,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned String parameters"
)]
pub fn scan_imports(source: String, path: String) -> ImportScanResult {
    convert_scan_result(extractor::scan_imports(&source, &path))
}

fn convert_scan_result(result: extractor::ImportScanResult) -> ImportScanResult {
    ImportScanResult {
        imports: result.imports.into_iter().map(convert_record).collect(),
        diagnostics: result
            .diagnostics
            .into_iter()
            .map(convert_diagnostic)
            .collect(),
    }
}

fn convert_record(record: extractor::ImportRecord) -> ImportRecord {
    ImportRecord {
        module: record.module,
        kind: match record.kind {
            extractor::ImportKind::SideEffect => ImportKind::SideEffect,
            extractor::ImportKind::Value => ImportKind::Value,
        },
        type_only: record.type_only,
        specifiers: record
            .specifiers
            .into_iter()
            .map(convert_specifier)
            .collect(),
        span: convert_span(record.span),
    }
}

fn convert_specifier(specifier: extractor::ImportSpecifier) -> ImportSpecifier {
    ImportSpecifier {
        kind: match specifier.kind {
            extractor::ImportSpecifierKind::Named => ImportSpecifierKind::Named,
            extractor::ImportSpecifierKind::Default => ImportSpecifierKind::Default,
            extractor::ImportSpecifierKind::Namespace => ImportSpecifierKind::Namespace,
        },
        imported: specifier.imported,
        local: specifier.local,
        type_only: specifier.type_only,
        span: convert_span(specifier.span),
    }
}

fn convert_diagnostic(diagnostic: extractor::Diagnostic) -> Diagnostic {
    Diagnostic {
        message: diagnostic.message,
        severity: format!("{:?}", diagnostic.severity).to_lowercase(),
        span: diagnostic.span.map(convert_span),
    }
}

fn convert_span(span: extractor::Span) -> Span {
    Span {
        start: span.start,
        end: span.end,
    }
}

// --- matchImports ---

#[napi(string_enum = "camelCase")]
pub enum MatchCategory {
    Css,
    Recipe,
    Pattern,
    Jsx,
    Tokens,
}

#[napi(object)]
pub struct Matcher {
    pub modules: Vec<String>,
    /// `None` matches any imported name (used for recipes/patterns).
    pub names: Option<Vec<String>>,
}

#[napi(object)]
pub struct Matchers {
    pub css: Matcher,
    pub recipe: Matcher,
    pub pattern: Matcher,
    pub jsx: Option<Matcher>,
    pub tokens: Matcher,
}

#[napi(object)]
pub struct MatchedImport {
    pub category: MatchCategory,
    pub module: String,
    pub name: String,
    pub alias: String,
    pub kind: ImportSpecifierKind,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned arguments"
)]
pub fn match_imports(scan: ImportScanResult, matchers: Matchers) -> Vec<MatchedImport> {
    let scan = to_core_scan(scan);
    let matchers = to_core_matchers(matchers);
    extractor::match_imports(&scan, &matchers)
        .into_iter()
        .map(matched_record)
        .collect()
}

fn to_core_scan(scan: ImportScanResult) -> extractor::ImportScanResult {
    extractor::ImportScanResult {
        imports: scan
            .imports
            .into_iter()
            .map(|r| extractor::ImportRecord {
                module: r.module,
                kind: match r.kind {
                    ImportKind::SideEffect => extractor::ImportKind::SideEffect,
                    ImportKind::Value => extractor::ImportKind::Value,
                },
                type_only: r.type_only,
                specifiers: r
                    .specifiers
                    .into_iter()
                    .map(|s| extractor::ImportSpecifier {
                        kind: match s.kind {
                            ImportSpecifierKind::Named => extractor::ImportSpecifierKind::Named,
                            ImportSpecifierKind::Default => extractor::ImportSpecifierKind::Default,
                            ImportSpecifierKind::Namespace => {
                                extractor::ImportSpecifierKind::Namespace
                            }
                        },
                        imported: s.imported,
                        local: s.local,
                        type_only: s.type_only,
                        span: extractor::Span {
                            start: s.span.start,
                            end: s.span.end,
                        },
                    })
                    .collect(),
                span: extractor::Span {
                    start: r.span.start,
                    end: r.span.end,
                },
            })
            .collect(),
        diagnostics: Vec::new(),
    }
}

fn to_core_matchers(m: Matchers) -> extractor::Matchers {
    extractor::Matchers {
        css: extractor::Matcher {
            modules: m.css.modules,
            names: m.css.names,
        },
        recipe: extractor::Matcher {
            modules: m.recipe.modules,
            names: m.recipe.names,
        },
        pattern: extractor::Matcher {
            modules: m.pattern.modules,
            names: m.pattern.names,
        },
        jsx: m.jsx.map(|j| extractor::Matcher {
            modules: j.modules,
            names: j.names,
        }),
        tokens: extractor::Matcher {
            modules: m.tokens.modules,
            names: m.tokens.names,
        },
    }
}

fn matched_record(m: extractor::MatchedImport) -> MatchedImport {
    MatchedImport {
        category: convert_category(m.category),
        module: m.module,
        name: m.name,
        alias: m.alias,
        kind: match m.kind {
            extractor::ImportSpecifierKind::Named => ImportSpecifierKind::Named,
            extractor::ImportSpecifierKind::Default => ImportSpecifierKind::Default,
            extractor::ImportSpecifierKind::Namespace => ImportSpecifierKind::Namespace,
        },
    }
}

fn convert_category(c: extractor::MatchCategory) -> MatchCategory {
    match c {
        extractor::MatchCategory::Css => MatchCategory::Css,
        extractor::MatchCategory::Recipe => MatchCategory::Recipe,
        extractor::MatchCategory::Pattern => MatchCategory::Pattern,
        extractor::MatchCategory::Jsx => MatchCategory::Jsx,
        extractor::MatchCategory::Tokens => MatchCategory::Tokens,
    }
}

fn to_core_matched(m: MatchedImport) -> extractor::MatchedImport {
    extractor::MatchedImport {
        category: match m.category {
            MatchCategory::Css => extractor::MatchCategory::Css,
            MatchCategory::Recipe => extractor::MatchCategory::Recipe,
            MatchCategory::Pattern => extractor::MatchCategory::Pattern,
            MatchCategory::Jsx => extractor::MatchCategory::Jsx,
            MatchCategory::Tokens => extractor::MatchCategory::Tokens,
        },
        module: m.module,
        name: m.name,
        alias: m.alias,
        kind: match m.kind {
            ImportSpecifierKind::Named => extractor::ImportSpecifierKind::Named,
            ImportSpecifierKind::Default => extractor::ImportSpecifierKind::Default,
            ImportSpecifierKind::Namespace => extractor::ImportSpecifierKind::Namespace,
        },
    }
}

// --- extractCalls ---

#[napi(object)]
pub struct ExtractedCall {
    pub category: MatchCategory,
    pub name: String,
    pub alias: String,
    pub data: Vec<serde_json::Value>,
    pub span: Span,
}

#[napi(object)]
pub struct ExtractedCallsResult {
    pub calls: Vec<ExtractedCall>,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned arguments"
)]
pub fn extract_calls(
    source: String,
    path: String,
    matched: Vec<MatchedImport>,
    matchers: Matchers,
) -> ExtractedCallsResult {
    let matched: Vec<extractor::MatchedImport> = matched.into_iter().map(to_core_matched).collect();
    let core_matchers = to_core_matchers(matchers);
    let result = extractor::extract_calls(&source, &path, &matched, &core_matchers);
    ExtractedCallsResult {
        calls: result
            .calls
            .into_iter()
            .map(|c| ExtractedCall {
                category: convert_category(c.category),
                name: c.name,
                alias: c.alias,
                data: c.data,
                span: Span {
                    start: c.span.start,
                    end: c.span.end,
                },
            })
            .collect(),
        diagnostics: result
            .diagnostics
            .into_iter()
            .map(|d| Diagnostic {
                message: d.message,
                severity: format!("{:?}", d.severity).to_lowercase(),
                span: d.span.map(|s| Span {
                    start: s.start,
                    end: s.end,
                }),
            })
            .collect(),
    }
}
