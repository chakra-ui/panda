use crate::{
    Diagnostic, ExtractorConfig, ImportSpecifierKind, Literal, MatchCategory, MatchedImport,
    Matchers, Span, VisitorContext, literal::expression_to_literal,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    IdentifierReference, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXElementName,
    JSXExpression, JSXMemberExpression, JSXMemberExpressionObject, JSXOpeningElement,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;

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

impl Extractor<'_, '_> {
    fn resolve_tag(&self, name: &JSXElementName<'_>) -> Option<(MatchCategory, String, String)> {
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
                    return Some((
                        matched.category,
                        matched.name.clone(),
                        matched.alias.clone(),
                    ));
                }

                let tag_name = id.name.as_str();
                if !self.ctx.config.jsx.is_component_tag(tag_name) {
                    return None;
                }
                Some((MatchCategory::Jsx, tag_name.to_owned(), tag_name.to_owned()))
            }
            JSXElementName::MemberExpression(member) => {
                let (root, root_ident, path) = flatten_member(member)?;
                if let Some(resolver) = self.ctx.resolver
                    && !resolver.is_import_binding(root_ident)
                {
                    return None;
                }
                let Some(matched) = self.ctx.aliases.get(root.as_str()) else {
                    let display = format!("{}.{}", root, path.join("."));
                    if self.ctx.config.jsx.is_component_tag(&display) {
                        return Some((MatchCategory::Jsx, display, root));
                    }
                    return None;
                };
                match matched.kind {
                    ImportSpecifierKind::Named => {
                        // `<X.Y>` on a named import is only a Panda usage
                        // when X is a JSX factory like `styled.div`. For
                        // a recipe Component, `Box.Item` is plain dot
                        // access — skip.
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
                        let display = format!("{}.{}", matched.name, path.join("."));
                        Some((matched.category, display, matched.alias.clone()))
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
                        Some((matched.category, path.join("."), matched.alias.clone()))
                    }
                    ImportSpecifierKind::Default => None,
                }
            }
            _ => None,
        }
    }
}

impl<'a> Visit<'a> for Extractor<'_, '_> {
    fn visit_jsx_opening_element(&mut self, element: &JSXOpeningElement<'a>) {
        if let Some((category, name, alias)) = self.resolve_tag(&element.name) {
            let mut entries: Vec<(String, Literal)> = Vec::new();
            for item in &element.attributes {
                merge_attribute(item, &mut entries, self.ctx.resolver);
            }
            entries.retain(|(prop, _)| self.ctx.config.jsx.should_extract_prop(&name, prop));
            self.out.push(ExtractedJsx {
                category,
                name,
                alias,
                data: Literal::Object(entries),
                span: Span::from(element.span),
            });
        }
        walk::walk_jsx_opening_element(self, element);
    }
}

/// `JSX.styled.div` → (`"JSX"`, `&JSX`, `["styled", "div"]`). The
/// reference is returned so callers can ask the resolver whether the
/// root is actually an imported binding.
fn flatten_member<'a>(
    member: &'a JSXMemberExpression<'_>,
) -> Option<(String, &'a IdentifierReference<'a>, Vec<String>)> {
    let mut path = vec![member.property.name.to_string()];
    let mut current = &member.object;
    loop {
        match current {
            JSXMemberExpressionObject::IdentifierReference(id) => {
                let root_name = id.name.to_string();
                path.reverse();
                return Some((root_name, id, path));
            }
            JSXMemberExpressionObject::MemberExpression(inner) => {
                path.push(inner.property.name.to_string());
                current = &inner.object;
            }
            JSXMemberExpressionObject::ThisExpression(_) => return None,
        }
    }
}

fn merge_attribute(
    item: &JSXAttributeItem<'_>,
    out: &mut Vec<(String, Literal)>,
    resolver: Option<&crate::Resolver<'_>>,
) {
    match item {
        JSXAttributeItem::Attribute(attr) => {
            // Namespaced attribute names (`foo:bar`) — skip.
            let JSXAttributeName::Identifier(name) = &attr.name else {
                return;
            };
            let key = name.name.to_string();
            let value = match attr.value.as_ref() {
                None => Literal::Bool(true), // boolean shorthand: `<Box hidden />`
                Some(v) => match attribute_value(v, resolver) {
                    Some(v) => v,
                    None => return,
                },
            };
            Literal::upsert_object_entry(out, key, value);
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            // With a resolver, `{...local}` folds when `local` binds to
            // a const object literal. Without one, only inline object
            // spreads merge.
            if let Some(Literal::Object(entries)) =
                expression_to_literal(&spread.argument, resolver)
            {
                for (k, v) in entries {
                    Literal::upsert_object_entry(out, k, v);
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
