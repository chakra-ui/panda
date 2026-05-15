use crate::{
    Diagnostic, ImportSpecifierKind, Literal, MatchCategory, MatchedImport, Matchers, Span,
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
    /// Canonical Panda name (e.g. `"css"`, `"cardStyle"`). For namespace
    /// callees like `p.css(...)`, this is the property name.
    pub name: String,
    /// Local binding actually used at the call site — may differ from `name`
    /// if the import was aliased (`import { css as nCss }`).
    pub alias: String,
    /// One entry per source argument, in order. `None` means the argument
    /// was present but not literal-extractable yet (identifier, conditional,
    /// template literal with interpolation, etc.) — Phase 5 will resolve
    /// many of those. Callers can rely on `data.len()` matching the source
    /// arity. Calls where *every* argument is non-extractable are dropped.
    pub data: Vec<Option<Literal>>,
    pub span: Span,
}

#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedCallsResult {
    pub calls: Vec<ExtractedCall>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Find every Panda call site and extract its literal arguments. Handles both
/// direct identifier callees (`css({...})`) and namespace member callees
/// (`p.css({...})`).
///
/// Parse-error contract: see [`crate::extract`] — `diagnostics` is
/// authoritative, `calls` may be partial when Oxc recovers from a syntax
/// error.
#[must_use]
pub fn extract_calls(
    source: &str,
    path: &str,
    matched: &[MatchedImport],
    matchers: &Matchers,
) -> ExtractedCallsResult {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let resolver = crate::Resolver::build(&parser_return.program);
    let ctx = crate::VisitorContext::new(matched, matchers).with_resolver(&resolver);
    ExtractedCallsResult {
        calls: collect_calls(&parser_return.program, &ctx),
        diagnostics: crate::collect_parser_diagnostics(&parser_return.errors, source),
    }
}

/// Run the call-site visitor on a parsed program. Used internally by
/// `extract_calls` and the combined `extract` entrypoint.
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

/// Resolved callee. `name` borrows from either the matched import or the
/// AST so we don't allocate per call site; the visitor only clones when it
/// commits to pushing a record.
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
                if matched.kind == ImportSpecifierKind::Namespace {
                    // `p({...})` where `p` is a namespace alias — not a Panda call.
                    return None;
                }
                // Scope guard: if the resolver says this identifier binds to a
                // local (e.g. `function f(css)` parameter), skip even though
                // the name matches a Panda alias. Without a resolver we fall
                // back to name-based matching for the stage-by-stage testing
                // entrypoints.
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
            // Drop the call only if no argument was extractable at all —
            // otherwise keep it and preserve positional `None` slots so
            // consumers know which arg was non-literal.
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
