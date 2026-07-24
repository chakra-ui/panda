//! Combined single-parse entrypoint: one Oxc parse feeds import scanning,
//! import-map matching, and both the call and JSX collectors, sharing a single
//! [`Resolver`]. [`extract`] returns the lean production result; `extract_debug`
//! additionally surfaces raw + matched imports for tooling/parity tests.

use crate::calls::{collect_calls_verbose, collect_calls_with_token_refs};
use crate::jsx::{collect_jsx, collect_jsx_verbose};
use std::cell::RefCell;

use crate::scope::{PatternRawTransformCell, PatternRawTransformFn, Resolver};
use crate::source_refs::StyleSourceRef;
use crate::{
    Diagnostic, ExportInfo, ExtractedCall, ExtractedJsx, ExtractorConfig, ImportRecord, Literal,
    MatchCategory, MatchedImport, Span, VisitorContext, collect_imports,
    collect_parser_diagnostics, match_import_records_resolved,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{Comment, Program};
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;

/// A resolved `token()` / `token.var()` call site: the referenced token path and
/// its span. Token-call resolution lowers the call to its value/var, erasing the
/// path, so it is captured at resolution time for on-demand tooling (`usages`).
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TokenRef {
    pub path: String,
    pub span: Span,
    #[serde(default)]
    pub needs_css_var: bool,
    /// `true` when the call was `token.var(...)` rather than `token(...)`.
    #[serde(default)]
    pub is_var: bool,
    /// Resolved value the source transform inlines; `None` keeps the runtime call.
    #[serde(skip)]
    pub value: Option<String>,
}

/// One imported local binding and every Oxc-resolved reference to it.
///
/// This is transform-only IR. It stays off the serialized extraction result so
/// import cleanup can use symbol identity without adding binding payload.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ImportBindingFacts {
    pub local: String,
    pub references: Vec<Span>,
}

/// Module facts retained from the extractor's original Oxc parse.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ModuleFacts {
    pub imports: Vec<ImportRecord>,
    pub import_bindings: Vec<ImportBindingFacts>,
    /// Safe helper-import insertion point after a hashbang/directive prologue.
    pub after_directives: u32,
    /// Whether `import_bindings` came from an Oxc semantic pass.
    pub symbols_resolved: bool,
}

/// Lean extraction result for the production hot path — strips `imports`
/// and `matched` so callers don't pay serialization cost for fields they
/// don't use.
#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractUsage {
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
    /// `token()` call sites, captured for on-demand tooling. Not serialized —
    /// it never crosses the binding boundary and stays off the hot path's wire.
    #[serde(skip)]
    pub token_refs: Vec<TokenRef>,
    /// Top-level export facts — drives the build-info `exports` map. Off the
    /// wire (consumed project-side only).
    #[serde(skip)]
    pub exports: ExportInfo,
    /// Resolved cross-file module paths read to fold imported values. Surfaced
    /// as transform build dependencies for watch invalidation. Project-side only.
    #[serde(skip)]
    pub dependencies: Vec<String>,
    /// Original-parse module and symbol facts used by source transforms.
    #[serde(skip)]
    pub module: ModuleFacts,
}

/// Verbose extraction result for on-demand tooling. Includes the same core
/// usage data as [`ExtractUsage`] plus source refs that are intentionally kept
/// off the production hot path.
#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractVerboseResult {
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
    pub token_refs: Vec<TokenRef>,
    pub style_source_refs: Vec<StyleSourceRef>,
    #[serde(skip)]
    pub exports: ExportInfo,
}

/// Kitchen-sink extraction result — includes raw imports and matched
/// imports for tooling / parity-compare flows.
#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractDebugResult {
    pub imports: Vec<ImportRecord>,
    pub matched: Vec<MatchedImport>,
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Single-parse, single-pass extract.
///
/// # Parse-error contract
///
/// Oxc recovers from parse errors and emits a partial AST; visitors run
/// on whatever it produces, so the result may carry extractions *and* a
/// non-empty `diagnostics` list at the same time. **`diagnostics` is the
/// authoritative signal** — callers needing strict correctness should
/// check `diagnostics.is_empty()` before trusting `calls` / `jsx`.
#[must_use]
pub fn extract(source: &str, path: &str, config: &ExtractorConfig) -> ExtractUsage {
    let _span =
        tracing::trace_span!(target: "extract", "extract", path = path, source_len = source.len())
            .entered();
    let outcome = run_extract(source, path, config, None, false, false);
    extract_usage(outcome)
}

/// Extract source while retaining the Oxc facts required by source transforms.
#[must_use]
pub fn extract_for_transform(source: &str, path: &str, config: &ExtractorConfig) -> ExtractUsage {
    let _span = tracing::trace_span!(
        target: "extract",
        "extract_for_transform",
        path = path,
        source_len = source.len()
    )
    .entered();
    let outcome = run_extract(source, path, config, None, false, true);
    extract_usage(outcome)
}

fn extract_usage(outcome: ExtractResult) -> ExtractUsage {
    ExtractUsage {
        calls: outcome.calls,
        jsx: outcome.jsx,
        diagnostics: outcome.diagnostics,
        token_refs: outcome.token_refs,
        exports: outcome.exports,
        dependencies: outcome.dependencies,
        module: outcome.module,
    }
}

pub fn extract_with_pattern_raw_transform<F>(
    source: &str,
    path: &str,
    config: &ExtractorConfig,
    pattern_transform: &mut F,
) -> ExtractUsage
where
    F: FnMut(&str, &Literal) -> Result<Option<Literal>, Diagnostic>,
{
    let _span = tracing::trace_span!(
        target: "extract",
        "extract",
        path = path,
        source_len = source.len(),
        pattern_raw_transform = true
    )
    .entered();
    let erased: &mut PatternRawTransformFn<'_> = pattern_transform;
    let transform_cell: PatternRawTransformCell<'_> = RefCell::new(erased);
    let outcome = run_extract(source, path, config, Some(&transform_cell), false, false);
    extract_usage(outcome)
}

#[must_use]
pub fn extract_debug(source: &str, path: &str, config: &ExtractorConfig) -> ExtractDebugResult {
    let _span = tracing::trace_span!(target: "extract", "extract_debug", path = path, source_len = source.len())
        .entered();
    let outcome = run_extract(source, path, config, None, false, true);
    ExtractDebugResult {
        imports: outcome.module.imports,
        matched: outcome.matched,
        calls: outcome.calls,
        jsx: outcome.jsx,
        diagnostics: outcome.diagnostics,
    }
}

#[must_use]
pub fn extract_verbose(source: &str, path: &str, config: &ExtractorConfig) -> ExtractVerboseResult {
    let _span = tracing::trace_span!(
        target: "extract",
        "extract_verbose",
        path = path,
        source_len = source.len()
    )
    .entered();
    let outcome = run_extract(source, path, config, None, true, false);
    ExtractVerboseResult {
        calls: outcome.calls,
        jsx: outcome.jsx,
        diagnostics: outcome.diagnostics,
        token_refs: outcome.token_refs,
        style_source_refs: outcome.style_source_refs,
        exports: outcome.exports,
    }
}

/// Everything the extraction pipeline produces. Public entrypoints project
/// this into their narrower result shape — the work is shared.
struct ExtractResult {
    module: ModuleFacts,
    matched: Vec<MatchedImport>,
    calls: Vec<ExtractedCall>,
    jsx: Vec<ExtractedJsx>,
    diagnostics: Vec<Diagnostic>,
    token_refs: Vec<TokenRef>,
    style_source_refs: Vec<StyleSourceRef>,
    exports: ExportInfo,
    dependencies: Vec<String>,
}

fn match_file_imports(
    config: &ExtractorConfig,
    path: &str,
    imports: &[ImportRecord],
) -> Vec<MatchedImport> {
    let file_path = std::path::Path::new(path);
    match_import_records_resolved(imports, &config.matchers, |specifier| {
        config
            .cross_file
            .as_ref()
            .and_then(|resolver| resolver.resolve_path(file_path, specifier))
            .map(|resolved| resolved.to_string_lossy().into_owned())
    })
}

#[allow(
    clippy::too_many_lines,
    reason = "single-parse pipeline stays readable as one ordered function; splitting would scatter the per-stage span+record pairs across helpers"
)]
fn run_extract<'cb>(
    source: &str,
    path: &str,
    config: &ExtractorConfig,
    pattern_raw_transform: Option<&'cb PatternRawTransformCell<'cb>>,
    verbose: bool,
    retain_transform_facts: bool,
) -> ExtractResult {
    let allocator = Allocator::default();
    let raw_source = source;
    let source = crate::adapt_source(source, path);
    let source = source.as_ref();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = {
        let _span = tracing::trace_span!("oxc_parse", path = path).entered();
        Parser::new(&allocator, source, source_type)
            .with_options(crate::adapter::parse_options_for(path))
            .parse()
    };
    let mut diagnostics = collect_parser_diagnostics(&parser_return.errors, source);
    let imports = {
        let span = tracing::trace_span!(target: "extract", "scan_imports", import_count = tracing::field::Empty);
        let _entered = span.enter();
        let imports = collect_imports(&parser_return.program);
        span.record("import_count", imports.len());
        imports
    };
    let after_directives = module_after_directives(&parser_return.program, source);
    let matched = {
        let span = tracing::trace_span!(target: "extract", "match_imports", matched_count = tracing::field::Empty);
        let _entered = span.enter();
        let matched = match_file_imports(config, path, &imports);
        span.record("matched_count", matched.len());
        matched
    };

    // Export surface is collected from the same parse — no second AST walk.
    let exports = {
        let span = tracing::trace_span!(target: "extract", "scan_exports", export_count = tracing::field::Empty);
        let _entered = span.enter();
        let exports = crate::collect_export_info(&parser_return.program);
        span.record(
            "export_count",
            exports.local.len() + exports.re_exports.len() + exports.export_all.len(),
        );
        exports
    };

    if should_skip_extraction(&matched, config) {
        let module = if retain_transform_facts {
            ModuleFacts {
                imports,
                import_bindings: Vec::new(),
                after_directives,
                symbols_resolved: false,
            }
        } else {
            ModuleFacts::default()
        };
        return ExtractResult {
            module,
            matched,
            calls: Vec::new(),
            jsx: Vec::new(),
            diagnostics,
            token_refs: Vec::new(),
            style_source_refs: Vec::new(),
            exports,
            dependencies: Vec::new(),
        };
    }

    let line_index = crate::LineIndex::new(source);
    let resolver = {
        let _span = tracing::trace_span!(target: "parse", "resolve_scopes", path = path).entered();
        Resolver::build(crate::scope::ResolverBuildInput {
            program: &parser_return.program,
            matched: &matched,
            matchers: Some(&config.matchers),
            tokens: config.token_dictionary.as_deref(),
            cross_file: config
                .cross_file
                .as_ref()
                .map(crate::CrossFileResolver::as_lookup),
            source_path: Some(std::path::PathBuf::from(path)),
            line_index: Some(&line_index),
            pattern_raw_transform,
        })
    };
    let ctx = VisitorContext::new(&matched, config).with_resolver(&resolver);

    let (calls, call_diagnostics, mut token_refs, mut style_source_refs) = if should_collect_calls(
        &matched, config,
    ) {
        let span = tracing::trace_span!(target: "extract", "extract_calls", call_count = tracing::field::Empty);
        let _entered = span.enter();
        let result = if verbose {
            collect_calls_verbose(&parser_return.program, &ctx, &line_index)
        } else {
            let (calls, diagnostics, token_refs) = collect_calls_with_token_refs(
                &parser_return.program,
                &ctx,
                &line_index,
                retain_transform_facts,
            );
            (calls, diagnostics, token_refs, Vec::new())
        };
        span.record("call_count", result.0.len());
        result
    } else {
        (Vec::new(), Vec::new(), Vec::new(), Vec::new())
    };

    let mut jsx = if should_collect_jsx(config) {
        let span = tracing::trace_span!(target: "extract", "extract_jsx", jsx_count = tracing::field::Empty);
        let _entered = span.enter();
        let jsx = if verbose {
            let (jsx, refs) = collect_jsx_verbose(&parser_return.program, &ctx);
            style_source_refs.extend(refs);
            jsx
        } else {
            collect_jsx(&parser_return.program, &ctx, retain_transform_facts)
        };
        span.record("jsx_count", jsx.len());
        jsx
    } else {
        Vec::new()
    };
    if should_collect_jsx(config) {
        let span = tracing::trace_span!(
            target: "extract",
            "extract_templates",
            template_count = tracing::field::Empty
        );
        let _entered = span.enter();
        let templates = crate::template_styles::collect_template_styles(
            raw_source,
            path,
            &matched,
            config,
            &parser_return.program,
            &resolver,
            retain_transform_facts,
        );
        span.record("template_count", templates.len());
        jsx.extend(templates);
    }

    diagnostics.extend(call_diagnostics);
    diagnostics.extend(resolver.take_diagnostics());
    token_refs.extend(resolver.take_token_refs());
    let token_refs = dedupe_token_refs(token_refs);
    let dependencies = resolver.take_cross_file_deps();
    let module = if retain_transform_facts {
        ModuleFacts {
            import_bindings: resolver.import_binding_facts(&imports),
            imports,
            after_directives,
            symbols_resolved: true,
        }
    } else {
        ModuleFacts::default()
    };

    ExtractResult {
        module,
        matched,
        calls,
        jsx,
        diagnostics,
        token_refs,
        style_source_refs,
        exports,
        dependencies,
    }
}

/// Parse only module layout and import-reference facts.
///
/// Source transforms normally receive these facts through [`ExtractUsage`].
/// This entrypoint supports standalone helper-import synchronization without
/// routing through the full Panda extraction pipeline.
#[must_use]
pub fn analyze_module(source: &str, path: &str) -> ModuleFacts {
    let allocator = Allocator::default();
    let adapted = crate::adapt_source(source, path);
    let source = adapted.as_ref();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type)
        .with_options(crate::adapter::parse_options_for(path))
        .parse();
    let imports = collect_imports(&parser_return.program);
    let after_directives = module_after_directives(&parser_return.program, source);
    let matched = Vec::new();
    let resolver = Resolver::build(crate::scope::ResolverBuildInput {
        program: &parser_return.program,
        matched: &matched,
        matchers: None,
        tokens: None,
        cross_file: None,
        source_path: None,
        line_index: None,
        pattern_raw_transform: None,
    });
    let import_bindings = resolver.import_binding_facts(&imports);
    ModuleFacts {
        imports,
        import_bindings,
        after_directives,
        symbols_resolved: true,
    }
}

fn module_after_directives(program: &Program<'_>, source: &str) -> u32 {
    if let Some(directive) = program.directives.last() {
        return after_statement_line(directive.span.end, &program.comments, source);
    }
    if let Some(hashbang) = &program.hashbang {
        return after_line_terminator(hashbang.span.end, source);
    }
    0
}

fn after_statement_line(start: u32, comments: &[Comment], source: &str) -> u32 {
    let mut cursor = usize::try_from(start)
        .unwrap_or(source.len())
        .min(source.len());

    loop {
        cursor = skip_horizontal_whitespace(source, cursor);
        let Some(comment) = comments
            .iter()
            .find(|comment| usize::try_from(comment.span.start).ok() == Some(cursor))
        else {
            break;
        };
        cursor = usize::try_from(comment.span.end)
            .unwrap_or(source.len())
            .min(source.len());
    }

    after_line_terminator(u32::try_from(cursor).unwrap_or(start), source)
}

fn skip_horizontal_whitespace(source: &str, mut cursor: usize) -> usize {
    while let Some(ch) = source.get(cursor..).and_then(|rest| rest.chars().next()) {
        if !matches!(ch, ' ' | '\t') {
            break;
        }
        cursor += ch.len_utf8();
    }
    cursor
}

fn after_line_terminator(start: u32, source: &str) -> u32 {
    let cursor = usize::try_from(start)
        .unwrap_or(source.len())
        .min(source.len());
    let rest = source.get(cursor..).unwrap_or_default();
    let end = if rest.starts_with("\r\n") {
        cursor + 2
    } else if rest.starts_with(['\n', '\r']) {
        cursor + 1
    } else {
        cursor
    };
    u32::try_from(end).unwrap_or(start)
}

fn should_collect_calls(matched: &[MatchedImport], config: &ExtractorConfig) -> bool {
    matched
        .iter()
        .any(|import| import.category != MatchCategory::Jsx || config.has_jsx_framework)
}

fn should_skip_extraction(matched: &[MatchedImport], config: &ExtractorConfig) -> bool {
    !should_collect_calls(matched, config) && !should_collect_jsx(config)
}

fn should_collect_jsx(config: &ExtractorConfig) -> bool {
    config.has_jsx_framework
}

fn dedupe_token_refs(token_refs: Vec<TokenRef>) -> Vec<TokenRef> {
    let mut deduped = Vec::with_capacity(token_refs.len());
    for token_ref in token_refs {
        if !deduped.iter().any(|existing: &TokenRef| {
            existing.path == token_ref.path
                && existing.span == token_ref.span
                && existing.needs_css_var == token_ref.needs_css_var
        }) {
            deduped.push(token_ref);
        }
    }
    deduped
}
