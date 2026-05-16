use crate::{
    Diagnostic, ExtractorConfig, ImportSpecifierKind, Literal, MatchCategory, MatchedImport, Span,
    literal::expression_to_literal,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{Argument, CallExpression, Expression};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;
use std::borrow::Cow;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedCall {
    pub category: MatchCategory,
    /// Canonical Panda name (`"css"`, `"cardStyle"`). For namespace
    /// callees (`p.css(...)`) this is the property name.
    pub name: String,
    /// Local binding at the call site — differs from `name` when the
    /// import was aliased (`import { css as nCss }`).
    pub alias: String,
    /// One entry per source argument, in order. `None` means the
    /// argument was present but not literal-extractable yet (identifier,
    /// non-foldable expression). Calls where *every* argument is
    /// non-extractable are dropped.
    pub data: Vec<Option<Literal>>,
    pub span: Span,
}

#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedCallsResult {
    pub calls: Vec<ExtractedCall>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Extract every Panda call site's literal arguments. Handles direct
/// identifier callees (`css({...})`) and namespace member callees
/// (`p.css({...})`).
///
/// Parse-error contract: see [`crate::extract`] — `diagnostics` is
/// authoritative; `calls` may be partial when Oxc recovers.
#[must_use]
pub fn extract_calls(
    source: &str,
    path: &str,
    matched: &[MatchedImport],
    config: &ExtractorConfig,
) -> ExtractedCallsResult {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let resolver = crate::Resolver::build(
        &parser_return.program,
        matched,
        config.token_dictionary.as_ref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
    );
    let ctx = crate::VisitorContext::new(matched, &config.matchers).with_resolver(&resolver);
    ExtractedCallsResult {
        calls: collect_calls(&parser_return.program, &ctx),
        diagnostics: crate::collect_parser_diagnostics(&parser_return.errors, source),
    }
}

pub(crate) fn collect_calls(
    program: &oxc_ast::ast::Program<'_>,
    ctx: &crate::VisitorContext<'_>,
) -> Vec<ExtractedCall> {
    let mut out = Vec::new();
    let mut extractor = Extractor { ctx, out: &mut out };
    extractor.visit_program(program);
    out
}

struct Extractor<'walk, 'ctx> {
    ctx: &'walk crate::VisitorContext<'ctx>,
    out: &'walk mut Vec<ExtractedCall>,
}

/// `name` borrows from either the matched import or the AST so we don't
/// allocate per call site; only clone when committing a record.
struct ResolvedCallee<'a> {
    category: MatchCategory,
    name: Cow<'a, str>,
    alias: &'a str,
}

impl Extractor<'_, '_> {
    fn resolve_callee<'a>(&'a self, call: &'a CallExpression<'_>) -> Option<ResolvedCallee<'a>> {
        match &call.callee {
            Expression::Identifier(ident) => {
                let matched = self.ctx.aliases.get(ident.name.as_str())?;
                // `p({...})` where `p` is a namespace alias isn't a Panda call.
                if matched.kind == ImportSpecifierKind::Namespace {
                    return None;
                }
                // Scope guard: skip when the identifier binds to a local
                // (`function f(css) { css({}) }`). Stage-by-stage testing
                // entrypoints fall back to name-based matching when no
                // resolver is supplied.
                if let Some(resolver) = self.ctx.resolver
                    && !resolver.is_import_binding(ident)
                {
                    return None;
                }
                Some(ResolvedCallee {
                    category: matched.category,
                    name: Cow::Borrowed(&matched.name),
                    alias: &matched.alias,
                })
            }
            Expression::StaticMemberExpression(member) => {
                let Expression::Identifier(object) = &member.object else {
                    return None;
                };
                let matched = self.ctx.aliases.get(object.name.as_str())?;
                if matched.kind != ImportSpecifierKind::Namespace {
                    return None;
                }
                if let Some(resolver) = self.ctx.resolver
                    && !resolver.is_import_binding(object)
                {
                    return None;
                }
                let property = member.property.name.as_str();
                if !self
                    .ctx
                    .matchers
                    .category_accepts_name(matched.category, property)
                {
                    return None;
                }
                Some(ResolvedCallee {
                    category: matched.category,
                    name: Cow::Borrowed(property),
                    alias: &matched.alias,
                })
            }
            _ => None,
        }
    }
}

impl<'a> Visit<'a> for Extractor<'_, '_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if let Some(resolved) = self.resolve_callee(call) {
            let resolver = self.ctx.resolver;
            let data: Vec<Option<Literal>> = call
                .arguments
                .iter()
                .map(|arg| argument_to_literal(arg, resolver))
                .collect();
            // Drop only when nothing was extractable. Otherwise keep
            // positional `None` slots so consumers know which arg was
            // non-literal.
            if data.iter().any(Option::is_some) {
                self.out.push(ExtractedCall {
                    category: resolved.category,
                    name: resolved.name.into_owned(),
                    alias: resolved.alias.to_owned(),
                    data,
                    span: Span::from(call.span),
                });
            }
        }
        walk::walk_call_expression(self, call);
    }
}

fn argument_to_literal(
    arg: &Argument<'_>,
    resolver: Option<&crate::Resolver<'_>>,
) -> Option<Literal> {
    arg.as_expression()
        .and_then(|e| expression_to_literal(e, resolver))
}
