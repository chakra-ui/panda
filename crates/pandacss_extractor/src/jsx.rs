//! Extract JSX style-prop usages (`<Box mt="4" />`, `<styled.div color="red" />`,
//! `<JSX.Stack>`) into a single style object per element, merging literal
//! `{...spread}` attributes in source order.

use crate::{
    CssSyntaxKind, Diagnostic, ExtractorConfig, ImportSpecifierKind, Literal, MatchCategory,
    MatchedImport, Matchers, Span, VisitorContext, css_template::css_template_to_object,
    jsx_react_runtime, literal::expression_to_literal, span_from_oxc,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    CallExpression, Expression, IdentifierReference, JSXAttributeItem, JSXAttributeName,
    JSXAttributeValue, JSXElementName, JSXExpression, JSXMemberExpression,
    JSXMemberExpressionObject, JSXOpeningElement, Program, StaticMemberExpression,
    TaggedTemplateExpression,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;
use smallvec::SmallVec;
use std::borrow::Cow;

fn is_jsx_factory(matchers: &Matchers, name: &str) -> bool {
    matchers
        .jsx_factories
        .as_ref()
        .is_some_and(|factories| factories.iter().any(|factory| factory == name))
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedJsx {
    pub category: MatchCategory,
    /// Canonical name. `<styled.div>` → `"styled.div"`;
    /// `<JSX.Stack>` (namespace) → `"Stack"`.
    pub name: String,
    /// Local root binding (`"styled"` for `<styled.div>`, `"JSX"` for
    /// `<JSX.Stack>`).
    pub alias: String,
    /// Prop/value map. Non-literal attribute values are skipped. Literal
    /// `{...spread}` attributes merge in source order. Empty for matched
    /// elements with no extractable props — the element itself is the
    /// signal.
    pub data: Literal,
    pub span: Span,
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
    let allocator = Allocator::default();
    let raw_source = source;
    let source = crate::adapt_source(source, path);
    let source = source.as_ref();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let resolver = crate::Resolver::build(
        &parser_return.program,
        matched,
        Some(&config.matchers),
        config.token_dictionary.as_deref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
        None,
    );
    let ctx = VisitorContext::new(matched, config).with_resolver(&resolver);
    let mut jsx = collect_jsx(&parser_return.program, &ctx);
    jsx.extend(crate::template_styles::collect_template_styles(
        raw_source, path, matched, config,
    ));
    ExtractedJsxResult {
        jsx,
        diagnostics: crate::collect_parser_diagnostics(&parser_return.errors, source),
    }
}

pub(crate) fn collect_jsx(program: &Program<'_>, ctx: &VisitorContext<'_>) -> Vec<ExtractedJsx> {
    let mut out = Vec::new();
    let react_runtime = jsx_react_runtime::ReactRuntimeImports::from_program(program);
    let mut extractor = Extractor {
        ctx,
        out: &mut out,
        react_runtime,
    };
    extractor.visit_program(program);
    out
}

pub(crate) struct Extractor<'walk, 'ctx> {
    ctx: &'walk VisitorContext<'ctx>,
    out: &'walk mut Vec<ExtractedJsx>,
    react_runtime: jsx_react_runtime::ReactRuntimeImports,
}

pub(crate) struct ResolvedTag<'a> {
    pub(crate) category: MatchCategory,
    pub(crate) name: Cow<'a, str>,
    pub(crate) alias: Cow<'a, str>,
    pub(crate) emit_empty: bool,
}

impl Extractor<'_, '_> {
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
                    });
                }

                let tag_name = id.name.as_str();
                let is_configured_component = self.ctx.config.jsx.is_component_tag(tag_name);
                if !is_configured_component && !self.ctx.config.jsx.should_match_tag(tag_name) {
                    return None;
                }
                Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Borrowed(tag_name),
                    alias: Cow::Borrowed(tag_name),
                    emit_empty: is_configured_component,
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
            if is_configured_component || self.ctx.config.jsx.should_match_tag(&display) {
                return Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Owned(display),
                    alias: Cow::Borrowed(root),
                    emit_empty: is_configured_component,
                });
            }
            return None;
        };
        match matched.kind {
            ImportSpecifierKind::Named => {
                // Named member tags are Panda usages only for JSX factories
                // or for member names explicitly configured by recipes.
                if is_jsx_factory(&self.ctx.config.matchers, &matched.name) {
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
                    });
                }

                let tag_name = id.name.as_str();
                let is_configured_component = self.ctx.config.jsx.is_component_tag(tag_name);
                if !is_configured_component && !self.ctx.config.jsx.should_match_tag(tag_name) {
                    return None;
                }
                Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Borrowed(tag_name),
                    alias: Cow::Borrowed(tag_name),
                    emit_empty: is_configured_component,
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

impl<'a> Visit<'a> for Extractor<'_, '_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if let Some(extracted) =
            jsx_react_runtime::extract_call(call, self.ctx, &self.react_runtime, self)
        {
            self.out.push(extracted);
        }
        walk::walk_call_expression(self, call);
    }

    fn visit_jsx_opening_element(&mut self, element: &JSXOpeningElement<'a>) {
        if let Some(resolved) = self.resolve_tag(&element.name) {
            let tag_name = resolved.name.as_ref();
            let mut entries: Vec<(String, Literal)> = Vec::with_capacity(element.attributes.len());
            for item in &element.attributes {
                merge_attribute(
                    item,
                    &mut entries,
                    self.ctx.resolver,
                    &self.ctx.config.jsx,
                    tag_name,
                );
            }
            if entries.is_empty() && !resolved.emit_empty {
                walk::walk_jsx_opening_element(self, element);
                return;
            }
            self.out.push(ExtractedJsx {
                category: resolved.category,
                name: resolved.name.into_owned(),
                alias: resolved.alias.into_owned(),
                data: Literal::Object(entries),
                span: span_from_oxc(element.span),
            });
        }
        walk::walk_jsx_opening_element(self, element);
    }

    fn visit_tagged_template_expression(&mut self, tagged: &TaggedTemplateExpression<'a>) {
        if self.ctx.config.syntax != CssSyntaxKind::TemplateLiteral {
            walk::walk_tagged_template_expression(self, tagged);
            return;
        }

        if let Some(resolved) = self.resolve_tagged_tag(&tagged.tag)
            && let Some(data @ Literal::Object(_)) =
                css_template_to_object(&tagged.quasi, self.ctx.resolver)
        {
            self.out.push(ExtractedJsx {
                category: resolved.category,
                name: resolved.name.into_owned(),
                alias: resolved.alias.into_owned(),
                data,
                span: span_from_oxc(tagged.span),
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

fn member_display(root: &str, path: &[&str]) -> String {
    let mut out = String::with_capacity(
        root.len()
            + 1
            + path.iter().map(|part| part.len()).sum::<usize>()
            + path.len().saturating_sub(1),
    );
    out.push_str(root);
    for part in path {
        out.push('.');
        out.push_str(part);
    }
    out
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

fn merge_attribute(
    item: &JSXAttributeItem<'_>,
    out: &mut Vec<(String, Literal)>,
    resolver: Option<&crate::Resolver<'_>>,
    jsx: &crate::JsxExtractionConfig,
    tag_name: &str,
) {
    match item {
        JSXAttributeItem::Attribute(attr) => {
            let JSXAttributeName::Identifier(name) = &attr.name else {
                return;
            };
            let key = name.name.as_str();
            if !jsx.should_extract_prop(tag_name, key) {
                return;
            }
            let value = match attr.value.as_ref() {
                None => Literal::Bool(true),
                Some(v) => match attribute_value(v, resolver) {
                    Some(v) => v,
                    None => return,
                },
            };
            merge_style_prop(out, jsx, tag_name, key, value);
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            if let Some(Literal::Object(entries)) =
                expression_to_literal(&spread.argument, resolver)
            {
                merge_style_props(out, jsx, tag_name, entries);
            }
        }
    }
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

fn attribute_value(
    value: &JSXAttributeValue<'_>,
    resolver: Option<&crate::Resolver<'_>>,
) -> Option<Literal> {
    match value {
        JSXAttributeValue::StringLiteral(s) => Some(Literal::String(s.value.to_string())),
        JSXAttributeValue::ExpressionContainer(container) => match &container.expression {
            JSXExpression::EmptyExpression(_) => None,
            other => other
                .as_expression()
                .and_then(|e| expression_to_literal(e, resolver)),
        },
        JSXAttributeValue::Element(_) | JSXAttributeValue::Fragment(_) => None,
    }
}
