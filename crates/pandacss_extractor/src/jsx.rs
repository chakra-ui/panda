//! Extract JSX style-prop usages (`<Box mt="4" />`, `<styled.div color="red" />`,
//! `<JSX.Stack>`) into a single style object per element, merging literal
//! `{...spread}` attributes in source order.

use crate::{
    CssSyntaxKind, Diagnostic, ExpressionFacts, ExtractorConfig, ImportSpecifierKind, JsxKind,
    Literal, MatchCategory, MatchedImport, Matchers, Span, StyleTree, VisitorContext,
    css_template::css_template_to_style_tree,
    jsx_react_runtime,
    matcher::member_display,
    source_refs::{
        StyleSourceOwner, StyleSourceOwnerKind, StyleSourceRef, collect_jsx_attribute_source_refs,
    },
    span_from_oxc,
    style_tree::{jsx_attributes_to_style_tree, project_literal},
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    CallExpression, Expression, IdentifierReference, JSXAttributeItem, JSXAttributeName,
    JSXAttributeValue, JSXElement, JSXElementName, JSXMemberExpression, JSXMemberExpressionObject,
    Program, StaticMemberExpression, TaggedTemplateExpression,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};
use serde::Serialize;
use smallvec::SmallVec;
use std::borrow::Cow;

/// Classify a resolved JSX tag. Factories win (matched against the local
/// `alias` or canonical `name`); pattern/recipe names come from
/// `jsx_kinds`; anything else is a plain component.
pub(crate) fn jsx_kind(matchers: &Matchers, name: &str, alias: &str) -> JsxKind {
    // The factory is the leading segment of `name`, e.g. `styled` in `styled.div`.
    let leading = name.split('.').next().unwrap_or(name);
    if matchers.is_jsx_factory(alias) || matchers.is_jsx_factory(leading) {
        return JsxKind::Factory;
    }
    matchers
        .jsx_kinds
        .get(name)
        .copied()
        .unwrap_or(JsxKind::Component)
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedJsx {
    pub category: MatchCategory,
    /// Fine-grained classification (factory / pattern / recipe / component)
    /// so consumers don't re-derive it from config.
    pub kind: JsxKind,
    /// Canonical name. `<styled.div>` → `"styled.div"`;
    /// `<JSX.Stack>` (namespace) → `"Stack"`.
    pub name: String,
    /// Local root binding (`"styled"` for `<styled.div>`, `"JSX"` for
    /// `<JSX.Stack>`).
    pub alias: String,
    /// Prop/value map; non-literal values are skipped and literal spreads
    /// merge in source order. Empty for a matched element with no
    /// extractable props — the element itself is the signal.
    pub data: Literal,
    pub span: Span,
    /// `</Name>` span from the AST; `None` when self-closing. Lets the transform
    /// edit the exact closing tag instead of text-searching for it.
    #[serde(skip)]
    pub closing_span: Option<Span>,
    /// Per-attribute spans/kinds from the AST, so the transform reconstructs the
    /// opening tag from exact boundaries instead of re-scanning source text.
    #[serde(skip)]
    pub attributes: Vec<JsxAttr>,
    /// Tag resolved via a matched Panda import (importMap-aware): the transform
    /// may rewrite it. `false` for name-only matches — extracted for CSS, but the
    /// JSX is left untouched.
    #[serde(skip)]
    pub panda_owned: bool,
    /// Transform-facing IR (span-backed conditionals). Skipped from serde/NAPI.
    #[serde(skip)]
    pub style: Option<StyleTree>,
    /// Original Oxc site shape. Skipped from serde/NAPI.
    #[serde(skip)]
    pub source: JsxSourceFacts,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum JsxSourceKind {
    #[default]
    Element,
    RuntimeCall,
    TaggedTemplate,
    FrameworkTemplate,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct JsxSourceFacts {
    pub kind: JsxSourceKind,
    pub callee_span: Option<Span>,
    pub args: Vec<ExpressionFacts>,
    pub factory_intrinsic: Option<String>,
}

/// One opening-element attribute located from the AST.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct JsxAttr {
    /// `None` for `{...spread}`.
    pub name: Option<String>,
    pub span: Span,
    pub spread: bool,
    /// Value is an expression container (`={…}`) or JSX, not a string literal.
    pub dynamic: bool,
    /// Oxc-cooked static string value.
    #[serde(skip)]
    pub static_value: Option<String>,
    /// Oxc expression facts for an expression-container value.
    #[serde(skip)]
    pub value: Option<ExpressionFacts>,
    /// Oxc expression facts for `{...spread}`.
    #[serde(skip)]
    pub spread_argument: Option<ExpressionFacts>,
}

#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedJsxResult {
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Find every Panda JSX element and extract its attributes. Handles
/// direct named tags (`<Box>`), styled factories (`<styled.div>`), and
/// namespace chains (`<JSX.styled.div>`, `<JSX.Stack>`).
///
/// Parse-error contract: see [`crate::extract`] — `diagnostics` is
/// authoritative; `jsx` may be partial when Oxc recovers.
#[must_use]
pub fn extract_jsx(
    source: &str,
    path: &str,
    matched: &[MatchedImport],
    config: &ExtractorConfig,
) -> ExtractedJsxResult {
    if !config.has_jsx_framework {
        return ExtractedJsxResult::default();
    }

    let allocator = Allocator::default();
    let raw_source = source;
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
    let ctx = VisitorContext::new(matched, config).with_resolver(&resolver);
    let mut jsx = collect_jsx(&parser_return.program, &ctx, true);
    jsx.extend(crate::template_styles::collect_template_styles(
        raw_source,
        path,
        matched,
        config,
        &parser_return.program,
        &resolver,
        true,
    ));
    ExtractedJsxResult {
        jsx,
        diagnostics: crate::collect_parser_diagnostics(&parser_return.errors, source),
    }
}

pub(crate) fn collect_jsx(
    program: &Program<'_>,
    ctx: &VisitorContext<'_, '_>,
    retain_transform_facts: bool,
) -> Vec<ExtractedJsx> {
    let mut out = Vec::new();
    let react_runtime = jsx_react_runtime::ReactRuntimeImports::from_program(program);
    let mut extractor = Extractor {
        ctx,
        out: &mut out,
        react_runtime,
        style_source_refs: None,
        retain_transform_facts,
    };
    extractor.visit_program(program);
    out
}

pub(crate) fn collect_jsx_verbose(
    program: &Program<'_>,
    ctx: &VisitorContext<'_, '_>,
) -> (Vec<ExtractedJsx>, Vec<StyleSourceRef>) {
    let mut out = Vec::new();
    let mut style_source_refs = Vec::new();
    let react_runtime = jsx_react_runtime::ReactRuntimeImports::from_program(program);
    let mut extractor = Extractor {
        ctx,
        out: &mut out,
        react_runtime,
        style_source_refs: Some(&mut style_source_refs),
        retain_transform_facts: false,
    };
    extractor.visit_program(program);
    (out, style_source_refs)
}

fn collect_jsx_attrs(attributes: &[JSXAttributeItem<'_>]) -> Vec<JsxAttr> {
    attributes
        .iter()
        .map(|item| match item {
            JSXAttributeItem::SpreadAttribute(spread) => JsxAttr {
                name: None,
                span: span_from_oxc(spread.span),
                spread: true,
                dynamic: true,
                static_value: None,
                value: None,
                spread_argument: Some(crate::transform_facts::expression_facts(&spread.argument)),
            },
            JSXAttributeItem::Attribute(attr) => {
                let static_value = match attr.value.as_ref() {
                    Some(JSXAttributeValue::StringLiteral(value)) => Some(value.value.to_string()),
                    Some(JSXAttributeValue::ExpressionContainer(container)) => container
                        .expression
                        .as_expression()
                        .and_then(|expression| match expression.get_inner_expression() {
                            Expression::StringLiteral(value) => Some(value.value.to_string()),
                            _ => None,
                        }),
                    _ => None,
                };
                let value = attr.value.as_ref().and_then(|value| match value {
                    JSXAttributeValue::ExpressionContainer(container) => container
                        .expression
                        .as_expression()
                        .map(crate::transform_facts::expression_facts),
                    _ => None,
                });
                JsxAttr {
                    name: Some(jsx_attribute_name(&attr.name)),
                    span: span_from_oxc(attr.span),
                    spread: false,
                    dynamic: matches!(
                        attr.value.as_ref(),
                        Some(
                            JSXAttributeValue::ExpressionContainer(_)
                                | JSXAttributeValue::Element(_)
                                | JSXAttributeValue::Fragment(_)
                        )
                    ),
                    static_value,
                    value,
                    spread_argument: None,
                }
            }
        })
        .collect()
}

fn jsx_attribute_name(name: &JSXAttributeName<'_>) -> String {
    match name {
        JSXAttributeName::Identifier(id) => id.name.to_string(),
        JSXAttributeName::NamespacedName(ns) => {
            format!("{}:{}", ns.namespace.name, ns.name.name)
        }
    }
}

pub(crate) struct Extractor<'walk, 'ctx, 'cb> {
    ctx: &'walk VisitorContext<'ctx, 'cb>,
    out: &'walk mut Vec<ExtractedJsx>,
    react_runtime: jsx_react_runtime::ReactRuntimeImports,
    style_source_refs: Option<&'walk mut Vec<StyleSourceRef>>,
    pub(crate) retain_transform_facts: bool,
}

pub(crate) struct ResolvedTag<'a> {
    pub(crate) category: MatchCategory,
    pub(crate) name: Cow<'a, str>,
    pub(crate) alias: Cow<'a, str>,
    pub(crate) emit_empty: bool,
    /// `true` when resolved via a matched Panda import; `false` for the
    /// name-only `should_match_tag` fallback.
    pub(crate) panda_owned: bool,
}

impl Extractor<'_, '_, '_> {
    fn resolve_tag<'a>(&'a self, name: &'a JSXElementName<'_>) -> Option<ResolvedTag<'a>> {
        // Lowercase HTML idents, `JSXNamespacedName` (`<svg:circle>`),
        // and `ThisExpression` (`<this.X>`) are never Panda usages.
        match name {
            JSXElementName::IdentifierReference(id) => {
                if let Some(matched) = self.ctx.aliases.get(id.name.as_str()) {
                    if matched.kind != ImportSpecifierKind::Named {
                        return None;
                    }
                    if !self
                        .ctx
                        .config
                        .matchers
                        .category_accepts_name(matched.category, &matched.name)
                    {
                        return None;
                    }
                    if let Some(resolver) = self.ctx.resolver
                        && !resolver.is_import_binding(id)
                    {
                        return None;
                    }
                    return Some(ResolvedTag {
                        category: matched.category,
                        name: Cow::Borrowed(&matched.name),
                        alias: Cow::Borrowed(&matched.alias),
                        emit_empty: true,
                        panda_owned: true,
                    });
                }

                let tag_name = id.name.as_str();
                let is_configured_component = self.ctx.config.jsx.is_component_tag(tag_name);
                if !is_configured_component
                    && !self
                        .ctx
                        .config
                        .jsx
                        .should_match_tag(tag_name, self.ctx.config.has_jsx_framework)
                {
                    return None;
                }
                Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Borrowed(tag_name),
                    alias: Cow::Borrowed(tag_name),
                    emit_empty: is_configured_component,
                    panda_owned: false,
                })
            }
            JSXElementName::MemberExpression(member) => {
                let (root, root_ident, path) = flatten_member(member)?;
                self.resolve_member(root, root_ident, &path)
            }
            _ => None,
        }
    }

    fn resolve_member<'a>(
        &'a self,
        root: &'a str,
        root_ident: &'a IdentifierReference<'_>,
        path: &[&str],
    ) -> Option<ResolvedTag<'a>> {
        if let Some(resolver) = self.ctx.resolver
            && !resolver.is_import_binding(root_ident)
        {
            return None;
        }
        let Some(matched) = self.ctx.aliases.get(root) else {
            let display = member_display(root, path);
            let is_configured_component = self.ctx.config.jsx.is_component_tag(&display);
            if is_configured_component
                || self
                    .ctx
                    .config
                    .jsx
                    .should_match_tag(&display, self.ctx.config.has_jsx_framework)
            {
                return Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Owned(display),
                    alias: Cow::Borrowed(root),
                    emit_empty: is_configured_component,
                    panda_owned: false,
                });
            }
            return None;
        };
        match matched.kind {
            ImportSpecifierKind::Named => {
                // A named member tag is a Panda usage only for a factory or a
                // recipe-configured member name.
                if self.ctx.config.matchers.is_jsx_factory(&matched.name) {
                    if !self
                        .ctx
                        .config
                        .matchers
                        .category_accepts_name(matched.category, &matched.name)
                    {
                        return None;
                    }
                    let display = member_display(&matched.name, path);
                    return Some(ResolvedTag {
                        category: matched.category,
                        name: Cow::Owned(display),
                        alias: Cow::Borrowed(&matched.alias),
                        emit_empty: true,
                        panda_owned: true,
                    });
                }

                let display = member_display(&matched.name, path);
                if !self.ctx.config.jsx.is_component_tag(&display) {
                    return None;
                }
                Some(ResolvedTag {
                    category: matched.category,
                    name: Cow::Owned(display),
                    alias: Cow::Borrowed(&matched.alias),
                    emit_empty: true,
                    panda_owned: true,
                })
            }
            ImportSpecifierKind::Namespace => {
                let first = path.first()?;
                if !self
                    .ctx
                    .config
                    .matchers
                    .category_accepts_name(matched.category, first)
                {
                    return None;
                }
                Some(ResolvedTag {
                    category: matched.category,
                    name: Cow::Owned(join_path(path)),
                    alias: Cow::Borrowed(&matched.alias),
                    emit_empty: true,
                    panda_owned: true,
                })
            }
            ImportSpecifierKind::Default => None,
        }
    }

    fn resolve_tagged_tag<'a>(&'a self, tag: &'a Expression<'_>) -> Option<ResolvedTag<'a>> {
        let Expression::StaticMemberExpression(member) = tag else {
            return None;
        };
        let (root, root_ident, path) = flatten_expr_member(member)?;
        self.resolve_member(root, root_ident, &path)
    }

    pub(crate) fn resolve_runtime_tag<'a>(
        &'a self,
        expr: &'a Expression<'_>,
    ) -> Option<ResolvedTag<'a>> {
        match expr {
            Expression::Identifier(id) => {
                if let Some(matched) = self.ctx.aliases.get(id.name.as_str()) {
                    if matched.kind != ImportSpecifierKind::Named {
                        return None;
                    }
                    if let Some(resolver) = self.ctx.resolver
                        && !resolver.is_import_binding(id)
                    {
                        return None;
                    }
                    if !self
                        .ctx
                        .config
                        .matchers
                        .category_accepts_name(matched.category, &matched.name)
                    {
                        return None;
                    }
                    return Some(ResolvedTag {
                        category: matched.category,
                        name: Cow::Borrowed(&matched.name),
                        alias: Cow::Borrowed(&matched.alias),
                        emit_empty: true,
                        panda_owned: true,
                    });
                }

                let tag_name = id.name.as_str();
                let is_configured_component = self.ctx.config.jsx.is_component_tag(tag_name);
                if !is_configured_component
                    && !self
                        .ctx
                        .config
                        .jsx
                        .should_match_tag(tag_name, self.ctx.config.has_jsx_framework)
                {
                    return None;
                }
                Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Borrowed(tag_name),
                    alias: Cow::Borrowed(tag_name),
                    emit_empty: is_configured_component,
                    panda_owned: false,
                })
            }
            Expression::StringLiteral(s) => {
                let tag_name = s.value.as_str();
                if !self.ctx.config.jsx.is_component_tag(tag_name) {
                    return None;
                }
                Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Borrowed(tag_name),
                    alias: Cow::Borrowed(tag_name),
                    emit_empty: true,
                    panda_owned: false,
                })
            }
            Expression::StaticMemberExpression(member) => {
                let (root, root_ident, path) = flatten_expr_member(member)?;
                self.resolve_member(root, root_ident, &path)
            }
            _ => None,
        }
    }
}

impl<'a> Visit<'a> for Extractor<'_, '_, '_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if let Some(extracted) =
            jsx_react_runtime::extract_call(call, self.ctx, &self.react_runtime, self)
        {
            self.out.push(extracted);
        }
        walk::walk_call_expression(self, call);
    }

    fn visit_jsx_element(&mut self, jsx_el: &JSXElement<'a>) {
        let element = &jsx_el.opening_element;
        if let Some(resolved) = self.resolve_tag(&element.name) {
            let category = resolved.category;
            let tag_name = resolved.name.as_ref().to_owned();
            let alias = resolved.alias.into_owned();
            let emit_empty = resolved.emit_empty;
            let panda_owned = resolved.panda_owned;

            let style = jsx_attributes_to_style_tree(
                &element.attributes,
                self.ctx.resolver,
                &self.ctx.config.jsx,
                &tag_name,
            );
            let data = style
                .as_ref()
                .and_then(project_literal)
                .unwrap_or_else(|| Literal::Object(vec![]));
            let data_empty = matches!(&data, Literal::Object(entries) if entries.is_empty());
            if data_empty && !emit_empty {
                walk::walk_jsx_element(self, jsx_el);
                return;
            }

            let kind = jsx_kind(&self.ctx.config.matchers, &tag_name, &alias);
            if let Some(style_source_refs) = self.style_source_refs.as_deref_mut() {
                let owner = StyleSourceOwner {
                    kind: StyleSourceOwnerKind::Jsx,
                    index: u32::try_from(self.out.len()).unwrap_or(u32::MAX),
                    span: span_from_oxc(element.span),
                };
                collect_jsx_attribute_source_refs(
                    &element.attributes,
                    self.ctx.resolver,
                    &self.ctx.config.jsx,
                    &tag_name,
                    owner,
                    style_source_refs,
                );
            }

            let retain = self.retain_transform_facts;
            self.out.push(ExtractedJsx {
                category,
                kind,
                name: tag_name,
                alias,
                data,
                span: span_from_oxc(element.span),
                closing_span: if retain {
                    jsx_el
                        .closing_element
                        .as_ref()
                        .map(|closing| span_from_oxc(closing.span))
                } else {
                    None
                },
                attributes: if retain {
                    collect_jsx_attrs(&element.attributes)
                } else {
                    Vec::new()
                },
                panda_owned,
                style: if retain { style } else { None },
                source: if retain {
                    JsxSourceFacts {
                        kind: JsxSourceKind::Element,
                        factory_intrinsic: factory_intrinsic_from_jsx_name(&element.name),
                        ..Default::default()
                    }
                } else {
                    JsxSourceFacts::default()
                },
            });
        }
        walk::walk_jsx_element(self, jsx_el);
    }

    fn visit_tagged_template_expression(&mut self, tagged: &TaggedTemplateExpression<'a>) {
        if self.ctx.config.syntax != CssSyntaxKind::TemplateLiteral {
            walk::walk_tagged_template_expression(self, tagged);
            return;
        }

        if let Some(resolved) = self.resolve_tagged_tag(&tagged.tag)
            && let Some(tree) = css_template_to_style_tree(&tagged.quasi, self.ctx.resolver)
            && matches!(tree, StyleTree::Object(_))
        {
            let kind = jsx_kind(&self.ctx.config.matchers, &resolved.name, &resolved.alias);
            let data = project_literal(&tree).unwrap_or(Literal::Object(vec![]));
            let retain = self.retain_transform_facts;
            self.out.push(ExtractedJsx {
                category: resolved.category,
                kind,
                name: resolved.name.into_owned(),
                alias: resolved.alias.into_owned(),
                data,
                span: span_from_oxc(tagged.span),
                closing_span: None,
                attributes: Vec::new(),
                panda_owned: resolved.panda_owned,
                style: if retain { Some(tree) } else { None },
                source: if retain {
                    JsxSourceFacts {
                        kind: JsxSourceKind::TaggedTemplate,
                        callee_span: Some(span_from_oxc(tagged.tag.span())),
                        args: Vec::new(),
                        factory_intrinsic: factory_intrinsic_from_expression(&tagged.tag),
                    }
                } else {
                    JsxSourceFacts::default()
                },
            });
        }
        walk::walk_tagged_template_expression(self, tagged);
    }
}

/// `JSX.styled.div` → (`"JSX"`, `&JSX`, `["styled", "div"]`). The
/// reference is returned so callers can ask the resolver whether the
/// root is actually an imported binding.
fn flatten_member<'a>(
    member: &'a JSXMemberExpression<'_>,
) -> Option<(&'a str, &'a IdentifierReference<'a>, SmallVec<[&'a str; 3]>)> {
    let mut path = SmallVec::new();
    path.push(member.property.name.as_str());
    let mut current = &member.object;
    loop {
        match current {
            JSXMemberExpressionObject::IdentifierReference(id) => {
                path.reverse();
                return Some((id.name.as_str(), id, path));
            }
            JSXMemberExpressionObject::MemberExpression(inner) => {
                path.push(inner.property.name.as_str());
                current = &inner.object;
            }
            JSXMemberExpressionObject::ThisExpression(_) => return None,
        }
    }
}

fn factory_intrinsic_from_jsx_name(name: &JSXElementName<'_>) -> Option<String> {
    match name {
        JSXElementName::MemberExpression(member) => Some(member.property.name.to_string()),
        _ => None,
    }
}

pub(crate) fn factory_intrinsic_from_expression(expression: &Expression<'_>) -> Option<String> {
    match expression.get_inner_expression() {
        Expression::StaticMemberExpression(member) => Some(member.property.name.to_string()),
        _ => None,
    }
}

fn flatten_expr_member<'a>(
    member: &'a StaticMemberExpression<'a>,
) -> Option<(&'a str, &'a IdentifierReference<'a>, SmallVec<[&'a str; 3]>)> {
    let mut path = SmallVec::new();
    path.push(member.property.name.as_str());
    let mut current = &member.object;
    loop {
        match current {
            Expression::Identifier(id) => {
                path.reverse();
                return Some((id.name.as_str(), id, path));
            }
            Expression::StaticMemberExpression(inner) => {
                path.push(inner.property.name.as_str());
                current = &inner.object;
            }
            _ => return None,
        }
    }
}

fn join_path(path: &[&str]) -> String {
    let mut out = String::with_capacity(
        path.iter().map(|part| part.len()).sum::<usize>() + path.len().saturating_sub(1),
    );
    for (index, part) in path.iter().enumerate() {
        if index > 0 {
            out.push('.');
        }
        out.push_str(part);
    }
    out
}

pub(crate) fn merge_style_prop(
    out: &mut Vec<(String, Literal)>,
    jsx: &crate::JsxExtractionConfig,
    tag_name: &str,
    key: &str,
    value: Literal,
) {
    if jsx.should_extract_prop(tag_name, key) {
        Literal::upsert_object_entry(out, key.to_owned(), value);
    }
}

pub(crate) fn merge_style_props(
    out: &mut Vec<(String, Literal)>,
    jsx: &crate::JsxExtractionConfig,
    tag_name: &str,
    entries: Vec<(String, Literal)>,
) {
    for (key, value) in entries {
        merge_style_prop(out, jsx, tag_name, &key, value);
    }
}
