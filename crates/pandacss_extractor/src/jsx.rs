use crate::{
    Diagnostic, ExtractorConfig, ImportSpecifierKind, Literal, MatchCategory, MatchedImport,
    Matchers, Span, VisitorContext, css_template::css_template_to_object,
    literal::expression_to_literal, span_from_oxc,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Expression, IdentifierReference, JSXAttributeItem, JSXAttributeName, JSXAttributeValue,
    JSXElementName, JSXExpression, JSXMemberExpression, JSXMemberExpressionObject,
    JSXOpeningElement, StaticMemberExpression, TaggedTemplateExpression,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;
use smallvec::SmallVec;
use std::borrow::Cow;

/// Member-chain tags like `<styled.div>` are accepted only when the root
/// name is configured as a JSX factory; otherwise a named import like
/// `Box` would over-match on `<Box.Item />`.
const DEFAULT_JSX_FACTORY_NAMES: &[&str] = &["styled"];

fn is_jsx_factory(matchers: &Matchers, name: &str) -> bool {
    if let Some(overrides) = matchers.jsx_factories.as_ref() {
        return overrides.iter().any(|f| f == name);
    }
    DEFAULT_JSX_FACTORY_NAMES.contains(&name)
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
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let resolver = crate::Resolver::build(
        &parser_return.program,
        matched,
        Some(&config.matchers),
        config.token_dictionary.as_deref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
    );
    let ctx = VisitorContext::new(matched, config).with_resolver(&resolver);
    ExtractedJsxResult {
        jsx: collect_jsx(&parser_return.program, &ctx),
        diagnostics: crate::collect_parser_diagnostics(&parser_return.errors, source),
    }
}

pub(crate) fn collect_jsx(
    program: &oxc_ast::ast::Program<'_>,
    ctx: &VisitorContext<'_>,
) -> Vec<ExtractedJsx> {
    let mut out = Vec::new();
    let mut extractor = Extractor { ctx, out: &mut out };
    extractor.visit_program(program);
    out
}

struct Extractor<'walk, 'ctx> {
    ctx: &'walk VisitorContext<'ctx>,
    out: &'walk mut Vec<ExtractedJsx>,
}

struct ResolvedTag<'a> {
    category: MatchCategory,
    name: Cow<'a, str>,
    alias: Cow<'a, str>,
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
                    });
                }

                let tag_name = id.name.as_str();
                if !self.ctx.config.jsx.is_component_tag(tag_name) {
                    return None;
                }
                Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Borrowed(tag_name),
                    alias: Cow::Borrowed(tag_name),
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
            if self.ctx.config.jsx.is_component_tag(&display) {
                return Some(ResolvedTag {
                    category: MatchCategory::Jsx,
                    name: Cow::Owned(display),
                    alias: Cow::Borrowed(root),
                });
            }
            return None;
        };
        match matched.kind {
            ImportSpecifierKind::Named => {
                // `X.Y` on a named import is only a Panda usage when X is a
                // JSX factory like `styled.div`. For a recipe Component,
                // `Box.Item` is plain dot access — skip.
                if !is_jsx_factory(&self.ctx.config.matchers, &matched.name) {
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
                let display = member_display(&matched.name, path);
                Some(ResolvedTag {
                    category: matched.category,
                    name: Cow::Owned(display),
                    alias: Cow::Borrowed(&matched.alias),
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
}

impl<'a> Visit<'a> for Extractor<'_, '_> {
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
            Literal::upsert_object_entry(out, key.to_owned(), value);
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            if let Some(Literal::Object(entries)) =
                expression_to_literal(&spread.argument, resolver)
            {
                for (k, v) in entries {
                    if jsx.should_extract_prop(tag_name, &k) {
                        Literal::upsert_object_entry(out, k, v);
                    }
                }
            }
        }
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
