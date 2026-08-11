//! Combined single-parse entrypoint: one Oxc parse feeds import scanning,
//! import-map matching, and both the call and JSX collectors, sharing a single
//! [`Resolver`]. [`extract`] returns the lean production result; `extract_debug`
//! additionally surfaces raw + matched imports for tooling/parity tests.

use crate::calls::{collect_calls_verbose, collect_calls_with_token_refs};
use crate::jsx::{collect_jsx, collect_jsx_verbose};
use std::cell::RefCell;

use crate::scope::{
    PatternRawTransformCell, PatternRawTransformFn, RecipeRawResolveCell, RecipeRawResolveFn,
    Resolver,
};
use crate::source_refs::StyleSourceRef;
use crate::{
    Diagnostic, ExportInfo, ExtractedCall, ExtractedJsx, ExtractorConfig, ImportRecord, Literal,
    MatchCategory, MatchedImport, Span, VisitorContext, collect_imports,
    collect_parser_diagnostics, match_import_records_resolved,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{Comment, Program};
use oxc_ast_visit::Visit as _;
use oxc_parser::Parser;
use oxc_span::SourceType;
use rustc_hash::FxHashSet;
use serde::Serialize;

/// A folded `imported.raw(props)` call on an inline `cva`/`sva` exported from
/// another file. The definition file precomputes its class strings, so the
/// transform must rewrite this site to the styles it resolved to.
#[derive(Debug, Clone, PartialEq)]
pub struct ImportedRecipeRawCall {
    pub span: Span,
    pub styles: Literal,
}

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
    /// Local bindings initialized from a collected Panda call site.
    /// Populated only by [`extract_for_transform`].
    pub local_call_bindings: Vec<crate::LocalCallBinding>,
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
    /// Folded `.raw(...)` calls on recipes imported from another file.
    #[serde(skip)]
    pub imported_recipe_raw_calls: Vec<ImportedRecipeRawCall>,
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
    let outcome = run_extract(source, path, config, None, None, false, false);
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
    let outcome = run_extract(source, path, config, None, None, false, true);
    extract_usage(outcome)
}

/// [`extract_for_transform`] plus the project-supplied resolver for imported
/// inline `cva`/`sva` recipes, so `imported.raw(props)` folds to its styles.
pub fn extract_for_transform_with_recipe_resolver<R>(
    source: &str,
    path: &str,
    config: &ExtractorConfig,
    recipe_resolve: &mut R,
) -> ExtractUsage
where
    R: FnMut(&str, &Literal, &Literal) -> Option<Literal>,
{
    let _span = tracing::trace_span!(
        target: "extract",
        "extract_for_transform",
        path = path,
        source_len = source.len()
    )
    .entered();
    let erased: &mut RecipeRawResolveFn<'_> = recipe_resolve;
    let cell: RecipeRawResolveCell<'_> = RefCell::new(erased);
    let outcome = run_extract(source, path, config, None, Some(&cell), false, true);
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
        imported_recipe_raw_calls: outcome.imported_recipe_raw_calls,
    }
}

/// [`extract`] plus the project-supplied hooks that resolve `.raw(...)` calls:
/// the pattern transform, and the resolver for imported inline `cva`/`sva`
/// recipes. Both need config the extractor doesn't own.
pub fn extract_with_raw_resolvers<P, R>(
    source: &str,
    path: &str,
    config: &ExtractorConfig,
    pattern_transform: Option<&mut P>,
    recipe_resolve: &mut R,
) -> ExtractUsage
where
    P: FnMut(&str, &Literal) -> Result<Option<Literal>, Diagnostic>,
    R: FnMut(&str, &Literal, &Literal) -> Option<Literal>,
{
    let has_pattern_transform = pattern_transform.is_some();
    let _span = tracing::trace_span!(
        target: "extract",
        "extract",
        path = path,
        source_len = source.len(),
        pattern_raw_transform = has_pattern_transform
    )
    .entered();
    let pattern_cell = pattern_transform.map(|transform| {
        let erased: &mut PatternRawTransformFn<'_> = transform;
        RefCell::new(erased)
    });
    let recipe_erased: &mut RecipeRawResolveFn<'_> = recipe_resolve;
    let recipe_cell: RecipeRawResolveCell<'_> = RefCell::new(recipe_erased);
    let outcome = run_extract(
        source,
        path,
        config,
        pattern_cell.as_ref(),
        Some(&recipe_cell),
        false,
        false,
    );
    extract_usage(outcome)
}

#[must_use]
pub fn extract_debug(source: &str, path: &str, config: &ExtractorConfig) -> ExtractDebugResult {
    let _span = tracing::trace_span!(target: "extract", "extract_debug", path = path, source_len = source.len())
        .entered();
    let outcome = run_extract(source, path, config, None, None, false, true);
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
    let outcome = run_extract(source, path, config, None, None, true, false);
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
    imported_recipe_raw_calls: Vec<ImportedRecipeRawCall>,
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
    recipe_raw_resolve: Option<&'cb RecipeRawResolveCell<'cb>>,
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

    // A file with no Panda imports can still consume one: `button.raw(...)` on
    // a recipe imported from another module. The definition file desugars
    // independently, so skipping here would leave the call reading a class
    // string. Only relevant when the project supplied a recipe resolver.
    let would_skip = should_skip_extraction(&matched, config);
    let consumes_imported_recipe = would_skip
        && recipe_raw_resolve.is_some()
        && calls_raw_on_an_imported_binding(&parser_return.program, &imports);

    if would_skip && !consumes_imported_recipe {
        let module = if retain_transform_facts {
            ModuleFacts {
                imports,
                import_bindings: Vec::new(),
                local_call_bindings: Vec::new(),
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
            imported_recipe_raw_calls: Vec::new(),
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
            recipe_raw_resolve,
        })
    };
    let ctx = VisitorContext::new(&matched, config).with_resolver(&resolver);

    let (calls, call_diagnostics, mut token_refs, mut style_source_refs) =
        if consumes_imported_recipe || should_collect_calls(&matched, config) {
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
    let imported_recipe_raw_calls = resolver.take_imported_recipe_raw_calls();
    let module = if retain_transform_facts {
        let local_call_bindings = if calls.is_empty() {
            Vec::new()
        } else {
            let init_spans = calls.iter().map(|call| call.span).collect();
            crate::local_bindings::collect_local_call_bindings(
                &parser_return.program,
                resolver.semantic(),
                &init_spans,
            )
        };
        ModuleFacts {
            import_bindings: resolver.import_binding_facts(&imports),
            imports,
            local_call_bindings,
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
        imported_recipe_raw_calls,
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
        recipe_raw_resolve: None,
    });
    let import_bindings = resolver.import_binding_facts(&imports);
    ModuleFacts {
        imports,
        import_bindings,
        local_call_bindings: Vec::new(),
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

/// True when the file calls `.raw(...)` on a binding it imported.
///
/// Deliberately syntactic: no resolution, no filesystem. A false positive
/// costs one file's extraction, which then finds nothing.
fn calls_raw_on_an_imported_binding(program: &Program<'_>, imports: &[ImportRecord]) -> bool {
    let locals: FxHashSet<&str> = imports
        .iter()
        .filter(|record| !record.type_only)
        .flat_map(|record| record.specifiers.iter())
        .filter(|specifier| !specifier.type_only)
        .map(|specifier| specifier.local.as_str())
        .collect();
    if locals.is_empty() {
        return false;
    }

    let mut finder = ImportedRawCallFinder {
        locals: &locals,
        found: false,
    };
    finder.visit_program(program);
    finder.found
}

struct ImportedRawCallFinder<'a> {
    locals: &'a FxHashSet<&'a str>,
    found: bool,
}

impl<'a> oxc_ast_visit::Visit<'a> for ImportedRawCallFinder<'_> {
    fn visit_call_expression(&mut self, call: &oxc_ast::ast::CallExpression<'a>) {
        if !self.found
            && let oxc_ast::ast::Expression::StaticMemberExpression(member) =
                call.callee.get_inner_expression()
            && member.property.name == "raw"
            && let oxc_ast::ast::Expression::Identifier(object) =
                member.object.get_inner_expression()
            && self.locals.contains(object.name.as_str())
        {
            self.found = true;
        }
        oxc_ast_visit::walk::walk_call_expression(self, call);
    }
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
