//! Extract Panda function-call usages (`css({…})`, `cva({…})`, `p.css({…})`,
//! pattern/recipe calls). Style args build a [`StyleTree`] first; encode
//! [`Literal`] `data` comes from [`project_literal`].

use crate::{
    CssSyntaxKind, Diagnostic, ExtractorConfig, ImportSpecifierKind, Literal, MatchCategory,
    MatchedImport, Span, StyleTree, TokenRef,
    css_template::css_template_to_style_tree,
    matcher::member_display,
    scope::flatten_static_member_path,
    source_refs::{
        StyleSourceOwner, StyleSourceOwnerKind, StyleSourceRef, collect_object_source_refs,
    },
    span_from_oxc,
    style_tree::{expression_to_style_tree, project_literal},
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{Argument, CallExpression, Expression, TaggedTemplateExpression};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};
use serde::Serialize;
use std::borrow::Cow;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum CallSyntax {
    #[default]
    Call,
    TaggedTemplate,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum CallCalleeKind {
    #[default]
    Direct,
    StaticMember,
}

/// Oxc-derived source facts consumed by the project transformer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CallFacts {
    pub syntax: CallSyntax,
    pub callee_kind: CallCalleeKind,
    pub callee_span: Span,
    pub raw: bool,
    /// One entry per argument; `true` only for a direct empty object literal.
    pub direct_empty_object_args: Vec<bool>,
    pub args: Vec<Option<crate::ExpressionFacts>>,
}

impl Default for CallFacts {
    fn default() -> Self {
        Self {
            syntax: CallSyntax::default(),
            callee_kind: CallCalleeKind::default(),
            callee_span: Span { start: 0, end: 0 },
            raw: false,
            direct_empty_object_args: Vec::new(),
            args: Vec::new(),
        }
    }
}

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
    /// One entry per source argument, in order. `None` means present but
    /// not foldable (identifier, dynamic expression). A call drops only
    /// when every argument is `None`.
    pub data: Vec<Option<Literal>>,
    /// Internal-only hint for JSX factory calls such as
    /// `styled("button", button, { defaultProps })`, where the second
    /// argument is intentionally non-literal but still names a config recipe.
    #[serde(skip)]
    pub jsx_recipe_ident: Option<String>,
    pub span: Span,
    /// Source span of each argument, from the AST — lets the transform locate an
    /// argument to rewrite without re-scanning the call for commas/parens.
    #[serde(skip)]
    pub arg_spans: Vec<Span>,
    /// Transform-facing IR (span-backed conditionals). Skipped from serde/NAPI.
    #[serde(skip)]
    pub style_args: Vec<Option<StyleTree>>,
    /// Original Oxc call shape. Skipped from serde/NAPI.
    #[serde(skip)]
    pub facts: CallFacts,
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
    let source = crate::adapt_source(source, path);
    let source = source.as_ref();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type)
        .with_options(crate::adapter::parse_options_for(path))
        .parse();

    let resolver = crate::Resolver::build(crate::scope::ResolverBuildInput {
        program: &parser_return.program,
        matched,
        matchers: Some(&config.matchers),
        tokens: config.token_dictionary.as_deref(),
        cross_file: config
            .cross_file
            .as_ref()
            .map(crate::CrossFileResolver::as_lookup),
        source_path: Some(std::path::PathBuf::from(path)),
        line_index: None,
        pattern_raw_transform: None,
    });
    let ctx = crate::VisitorContext::new(matched, config).with_resolver(&resolver);
    let line_index = crate::LineIndex::new(source);
    let (calls, diagnostics) = collect_calls_inner(&parser_return.program, &ctx, Some(&line_index));
    let mut diagnostics = diagnostics;
    diagnostics.extend(crate::collect_parser_diagnostics(
        &parser_return.errors,
        source,
    ));
    ExtractedCallsResult { calls, diagnostics }
}

fn collect_calls_inner(
    program: &oxc_ast::ast::Program<'_>,
    ctx: &crate::VisitorContext<'_, '_>,
    line_index: Option<&crate::LineIndex<'_>>,
) -> (Vec<ExtractedCall>, Vec<Diagnostic>) {
    let mut out = Vec::new();
    let mut diagnostics = Vec::new();
    let mut extractor = Extractor {
        ctx,
        out: &mut out,
        diagnostics: &mut diagnostics,
        line_index,
        token_refs: None,
        style_source_refs: None,
        retain_transform_facts: true,
    };
    extractor.visit_program(program);
    (out, diagnostics)
}

pub(crate) fn collect_calls_with_token_refs(
    program: &oxc_ast::ast::Program<'_>,
    ctx: &crate::VisitorContext<'_, '_>,
    line_index: &crate::LineIndex<'_>,
    retain_transform_facts: bool,
) -> (Vec<ExtractedCall>, Vec<Diagnostic>, Vec<TokenRef>) {
    let mut calls = Vec::new();
    let mut diagnostics = Vec::new();
    let mut token_refs = Vec::new();
    let mut extractor = Extractor {
        ctx,
        out: &mut calls,
        diagnostics: &mut diagnostics,
        line_index: Some(line_index),
        token_refs: Some(&mut token_refs),
        style_source_refs: None,
        retain_transform_facts,
    };
    extractor.visit_program(program);
    (calls, diagnostics, token_refs)
}

pub(crate) fn collect_calls_verbose(
    program: &oxc_ast::ast::Program<'_>,
    ctx: &crate::VisitorContext<'_, '_>,
    line_index: &crate::LineIndex<'_>,
) -> (
    Vec<ExtractedCall>,
    Vec<Diagnostic>,
    Vec<TokenRef>,
    Vec<StyleSourceRef>,
) {
    let mut calls = Vec::new();
    let mut diagnostics = Vec::new();
    let mut token_refs = Vec::new();
    let mut style_source_refs = Vec::new();
    let mut extractor = Extractor {
        ctx,
        out: &mut calls,
        diagnostics: &mut diagnostics,
        line_index: Some(line_index),
        token_refs: Some(&mut token_refs),
        style_source_refs: Some(&mut style_source_refs),
        retain_transform_facts: false,
    };
    extractor.visit_program(program);
    (calls, diagnostics, token_refs, style_source_refs)
}

struct Extractor<'walk, 'ctx, 'cb> {
    ctx: &'walk crate::VisitorContext<'ctx, 'cb>,
    out: &'walk mut Vec<ExtractedCall>,
    diagnostics: &'walk mut Vec<Diagnostic>,
    line_index: Option<&'walk crate::LineIndex<'walk>>,
    token_refs: Option<&'walk mut Vec<TokenRef>>,
    style_source_refs: Option<&'walk mut Vec<StyleSourceRef>>,
    retain_transform_facts: bool,
}

/// `name` borrows from either the matched import or the AST so we don't
/// allocate per call site; only clone when committing a record.
struct ResolvedCallee<'a> {
    category: MatchCategory,
    name: Cow<'a, str>,
    alias: &'a str,
    raw: bool,
}

impl Extractor<'_, '_, '_> {
    fn resolve_callee<'a>(&'a self, call: &'a CallExpression<'_>) -> Option<ResolvedCallee<'a>> {
        self.resolve_callee_expr(&call.callee)
    }

    fn resolve_callee_expr<'a>(&'a self, callee: &'a Expression<'_>) -> Option<ResolvedCallee<'a>> {
        match callee {
            Expression::Identifier(ident) => {
                let matched = self.ctx.aliases.get(ident.name.as_str())?;
                if matched.category == MatchCategory::Jsx && !self.ctx.config.has_jsx_framework {
                    return None;
                }
                // `p({...})` where `p` is a namespace alias isn't a Panda call.
                if matched.kind == ImportSpecifierKind::Namespace {
                    return None;
                }
                // Skip a local shadowing the import (`function f(css) { css({}) }`).
                // Staged testing entrypoints have no resolver, so they fall
                // back to name-based matching.
                if let Some(resolver) = self.ctx.resolver
                    && !resolver.is_import_binding(ident)
                {
                    return None;
                }
                Some(ResolvedCallee {
                    category: matched.category,
                    name: Cow::Borrowed(&matched.name),
                    alias: &matched.alias,
                    raw: false,
                })
            }
            Expression::StaticMemberExpression(_) => {
                let (object, path) = flatten_static_member_path(callee)?;
                let matched = self.ctx.aliases.get(object.name.as_str())?;
                if matched.category == MatchCategory::Jsx && !self.ctx.config.has_jsx_framework {
                    return None;
                }
                if let Some(resolver) = self.ctx.resolver
                    && !resolver.is_import_binding(object)
                {
                    return None;
                }

                if matched.kind == ImportSpecifierKind::Named {
                    if matched.category == MatchCategory::Jsx
                        && self.ctx.config.matchers.is_jsx_factory(&matched.name)
                    {
                        return Some(ResolvedCallee {
                            category: matched.category,
                            name: Cow::Owned(member_display(&matched.name, &path)),
                            alias: &matched.alias,
                            raw: false,
                        });
                    }
                    if path.as_slice() != ["raw"] || !matched.category.supports_raw() {
                        return None;
                    }
                    return Some(ResolvedCallee {
                        category: matched.category,
                        name: Cow::Borrowed(&matched.name),
                        alias: &matched.alias,
                        raw: true,
                    });
                }

                if matched.kind != ImportSpecifierKind::Namespace {
                    return None;
                }
                let (&property, raw_tail) = path.split_first()?;
                if !raw_tail.is_empty() && raw_tail != ["raw"] {
                    return None;
                }
                if raw_tail == ["raw"] && !matched.category.supports_raw() {
                    return None;
                }
                if !self
                    .ctx
                    .config
                    .matchers
                    .category_accepts_name(matched.category, property)
                {
                    return None;
                }

                Some(ResolvedCallee {
                    category: matched.category,
                    name: Cow::Borrowed(property),
                    alias: &matched.alias,
                    raw: raw_tail == ["raw"],
                })
            }
            _ => None,
        }
    }
}

fn should_emit_call(
    category: MatchCategory,
    data: &[Option<Literal>],
    jsx_recipe_ident: Option<&str>,
) -> bool {
    if category == MatchCategory::Jsx {
        return jsx_recipe_ident.is_some()
            || data
                .iter()
                .flatten()
                .any(|literal| matches!(literal, Literal::Object(_)));
    }
    if matches!(category, MatchCategory::Recipe | MatchCategory::Pattern) {
        // A config-recipe/pattern call always renders base + default styles,
        // even with a missing or dynamic arg (destructures to "no selection"
        // at runtime) — so it always emits.
        return true;
    }
    data.iter().any(Option::is_some)
}

fn dynamic_style_value_diagnostic(
    category: MatchCategory,
    name: &str,
    span: Span,
    line_index: Option<&crate::LineIndex<'_>>,
) -> Diagnostic {
    let mut diagnostic = Diagnostic::warning(
        crate::diagnostic_codes::PANDA_CALL_UNEXTRACTABLE,
        format!(
            "{category:?} call `{name}` received a dynamic argument, so no static CSS was generated for this call"
        ),
    );
    diagnostic.span = Some(span);
    if let Some(line_index) = line_index {
        diagnostic.location = Some(line_index.locate_range(span.start, span.end));
    }
    diagnostic
}

impl<'a> Visit<'a> for Extractor<'_, '_, '_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if let (Some(resolver), Some(token_refs)) =
            (self.ctx.resolver, self.token_refs.as_deref_mut())
        {
            if let Some(path) = resolver.resolved_token_call_path(call) {
                token_refs.push(TokenRef {
                    path,
                    span: span_from_oxc(call.span),
                    needs_css_var: resolver.token_call_needs_css_var(call),
                    is_var: resolver.token_call_is_var(call),
                    value: resolver.token_call_value(call),
                });
            } else if let Some(path) = resolver.token_call_path(call) {
                token_refs.push(TokenRef {
                    path,
                    span: span_from_oxc(call.span),
                    needs_css_var: resolver.token_call_needs_css_var(call),
                    is_var: resolver.token_call_is_var(call),
                    value: resolver.token_call_value(call),
                });
            }
        }

        if let Some(resolved) = self.resolve_callee(call) {
            let resolver = self.ctx.resolver;
            let category = resolved.category;
            let raw = resolved.raw;
            let name = resolved.name.into_owned();
            let alias = resolved.alias.to_owned();
            let jsx_recipe_ident = (category == MatchCategory::Jsx)
                .then(|| self.jsx_recipe_identifier(call))
                .flatten();

            let style_args: Vec<Option<StyleTree>> = call
                .arguments
                .iter()
                .map(|arg| argument_to_style_tree(arg, resolver))
                .collect();
            let data: Vec<Option<Literal>> = style_args
                .iter()
                .map(|tree| tree.as_ref().and_then(project_literal))
                .collect();
            let arg_spans = if self.retain_transform_facts {
                call.arguments
                    .iter()
                    .map(|arg| span_from_oxc(arg.span()))
                    .collect()
            } else {
                Vec::new()
            };

            if should_emit_call(category, &data, jsx_recipe_ident.as_deref()) {
                if let Some(style_source_refs) = self.style_source_refs.as_deref_mut() {
                    let owner = StyleSourceOwner {
                        kind: StyleSourceOwnerKind::Call,
                        index: u32::try_from(self.out.len()).unwrap_or(u32::MAX),
                        span: span_from_oxc(call.span),
                    };
                    collect_call_style_source_refs(
                        call,
                        self.ctx.resolver,
                        owner,
                        style_source_refs,
                    );
                }
                self.out.push(ExtractedCall {
                    category,
                    name,
                    alias,
                    data,
                    jsx_recipe_ident,
                    span: span_from_oxc(call.span),
                    arg_spans,
                    style_args: if self.retain_transform_facts {
                        style_args
                    } else {
                        Vec::new()
                    },
                    facts: if self.retain_transform_facts {
                        call_facts(call, raw)
                    } else {
                        CallFacts::default()
                    },
                });
            } else if category != MatchCategory::Jsx
                && !data.is_empty()
                && !self.ctx.config.has_jsx_framework
            {
                self.diagnostics.push(dynamic_style_value_diagnostic(
                    category,
                    &name,
                    span_from_oxc(call.span),
                    self.line_index,
                ));
            }
        }
        walk::walk_call_expression(self, call);
    }

    fn visit_tagged_template_expression(&mut self, tagged: &TaggedTemplateExpression<'a>) {
        if self.ctx.config.syntax != CssSyntaxKind::TemplateLiteral {
            walk::walk_tagged_template_expression(self, tagged);
            return;
        }

        if let Expression::CallExpression(call) = &tagged.tag
            && let Some(resolved) = self.resolve_callee_expr(&call.callee)
            && resolved.category == MatchCategory::Jsx
            && let Some(tree) = css_template_to_style_tree(&tagged.quasi, self.ctx.resolver)
            && matches!(tree, StyleTree::Object(_))
        {
            self.out.push(ExtractedCall {
                category: MatchCategory::Css,
                name: "css".to_owned(),
                alias: resolved.alias.to_owned(),
                data: vec![project_literal(&tree)],
                jsx_recipe_ident: None,
                span: span_from_oxc(tagged.span),
                arg_spans: if self.retain_transform_facts {
                    vec![span_from_oxc(tagged.span)]
                } else {
                    Vec::new()
                },
                style_args: if self.retain_transform_facts {
                    vec![Some(tree)]
                } else {
                    Vec::new()
                },
                facts: if self.retain_transform_facts {
                    CallFacts {
                        syntax: CallSyntax::TaggedTemplate,
                        callee_kind: call_callee_kind(&call.callee),
                        callee_span: span_from_oxc(tagged.tag.span()),
                        raw: resolved.raw,
                        direct_empty_object_args: Vec::new(),
                        args: Vec::new(),
                    }
                } else {
                    CallFacts::default()
                },
            });
        }

        if let Some(resolved) = self.resolve_callee_expr(&tagged.tag)
            && resolved.category == MatchCategory::Css
            && resolved.name.as_ref() == "css"
            && let Some(tree) = css_template_to_style_tree(&tagged.quasi, self.ctx.resolver)
            && matches!(tree, StyleTree::Object(_))
        {
            self.out.push(ExtractedCall {
                category: resolved.category,
                name: resolved.name.into_owned(),
                alias: resolved.alias.to_owned(),
                data: vec![project_literal(&tree)],
                jsx_recipe_ident: None,
                span: span_from_oxc(tagged.span),
                arg_spans: if self.retain_transform_facts {
                    vec![span_from_oxc(tagged.span)]
                } else {
                    Vec::new()
                },
                style_args: if self.retain_transform_facts {
                    vec![Some(tree)]
                } else {
                    Vec::new()
                },
                facts: if self.retain_transform_facts {
                    CallFacts {
                        syntax: CallSyntax::TaggedTemplate,
                        callee_kind: call_callee_kind(&tagged.tag),
                        callee_span: span_from_oxc(tagged.tag.span()),
                        raw: resolved.raw,
                        direct_empty_object_args: Vec::new(),
                        args: Vec::new(),
                    }
                } else {
                    CallFacts::default()
                },
            });
        }
        walk::walk_tagged_template_expression(self, tagged);
    }
}

fn call_callee_kind(callee: &Expression<'_>) -> CallCalleeKind {
    if matches!(
        callee.get_inner_expression(),
        Expression::StaticMemberExpression(_)
    ) {
        CallCalleeKind::StaticMember
    } else {
        CallCalleeKind::Direct
    }
}

fn call_facts(call: &CallExpression<'_>, raw: bool) -> CallFacts {
    CallFacts {
        syntax: CallSyntax::Call,
        callee_kind: call_callee_kind(&call.callee),
        callee_span: span_from_oxc(call.callee.span()),
        raw,
        direct_empty_object_args: call
            .arguments
            .iter()
            .map(|arg| {
                matches!(
                    arg.as_expression().map(Expression::get_inner_expression),
                    Some(Expression::ObjectExpression(object)) if object.properties.is_empty()
                )
            })
            .collect(),
        args: call
            .arguments
            .iter()
            .map(|arg| {
                arg.as_expression()
                    .map(crate::transform_facts::expression_facts)
            })
            .collect(),
    }
}

fn collect_call_style_source_refs(
    call: &CallExpression<'_>,
    resolver: Option<&crate::Resolver<'_, '_>>,
    owner: StyleSourceOwner,
    out: &mut Vec<StyleSourceRef>,
) {
    for arg in &call.arguments {
        let Some(Expression::ObjectExpression(obj)) = arg.as_expression() else {
            continue;
        };
        collect_object_source_refs(obj, resolver, owner, &mut Vec::new(), out);
    }
}

impl Extractor<'_, '_, '_> {
    fn jsx_recipe_identifier(&self, call: &CallExpression<'_>) -> Option<String> {
        let arg = call.arguments.get(1)?.as_expression()?;
        let Expression::Identifier(ident) = arg else {
            return None;
        };
        if let Some(resolver) = self.ctx.resolver
            && !resolver.is_import_binding(ident)
        {
            return None;
        }
        let matched = self.ctx.aliases.get(ident.name.as_str())?;
        (matched.category == MatchCategory::Recipe).then(|| matched.name.clone())
    }
}

fn argument_to_style_tree(
    arg: &Argument<'_>,
    resolver: Option<&crate::Resolver<'_, '_>>,
) -> Option<StyleTree> {
    arg.as_expression()
        .and_then(|e| expression_to_style_tree(e, resolver))
}
