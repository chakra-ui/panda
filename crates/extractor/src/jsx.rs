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

/// Built-in JSX factory names — the default fallback when the JSX
/// `Matcher` doesn't specify `jsx_factories`. Member-chain tags like
/// `<styled.div>` are accepted only when the root name appears in
/// this list (or in the matcher's override list); without it, a named
/// import like `Box` would over-match on `<Box.Item />`.
const DEFAULT_JSX_FACTORY_NAMES: &[&str] = &["styled"];

/// `true` when `name` is configured as a JSX factory: either via the
/// caller's `jsx_factories` override or in the built-in default list.
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
    /// Canonical name of the matched JSX element. For `<styled.div>` this is
    /// `"styled.div"`; for `<JSX.Stack>` (namespace) it's `"Stack"`.
    pub name: String,
    /// Local root binding at the call site (`"styled"` for `<styled.div>`,
    /// `"JSX"` for `<JSX.Stack>`).
    pub alias: String,
    /// Prop/value map as a `Literal::Object`. Non-literal attribute values
    /// are skipped (omitted from the object). Literal `{...spread}` attrs
    /// are merged in source order. Empty for matched elements with no
    /// extractable props — the element itself is the signal.
    pub data: Literal,
    pub span: Span,
}

#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedJsxResult {
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Find every Panda JSX element and extract its attributes. Handles direct
/// named tags (`<Box>`), styled factories (`<styled.div>`), and namespace
/// chains (`<JSX.styled.div>`, `<JSX.Stack>`).
///
/// Parse-error contract: see [`crate::extract`] — `diagnostics` is
/// authoritative, `jsx` may be partial when Oxc recovers from a syntax
/// error.
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
        config.token_dictionary.as_ref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
    );
    let ctx = VisitorContext::new(matched, &config.matchers).with_resolver(&resolver);
    ExtractedJsxResult {
        jsx: collect_jsx(&parser_return.program, &ctx),
        diagnostics: crate::collect_parser_diagnostics(&parser_return.errors, source),
    }
}

/// Run the JSX visitor on a parsed program. Used internally by `extract_jsx`
/// and the combined `extract` entrypoint.
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
        // `JSXElementName::Identifier` (lowercase HTML tags),
        // `JSXNamespacedName` (`<svg:circle>`), and `ThisExpression`
        // (`<this.X>`) are never Panda usages, so they fall through to `_`.
        match name {
            JSXElementName::IdentifierReference(id) => {
                let matched = self.ctx.aliases.get(id.name.as_str())?;
                if matched.kind != ImportSpecifierKind::Named {
                    return None;
                }
                if !self
                    .ctx
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
                Some((
                    matched.category,
                    matched.name.clone(),
                    matched.alias.clone(),
                ))
            }
            JSXElementName::MemberExpression(member) => {
                let (root, root_ident, path) = flatten_member(member)?;
                let matched = self.ctx.aliases.get(root.as_str())?;
                if let Some(resolver) = self.ctx.resolver
                    && !resolver.is_import_binding(root_ident)
                {
                    return None;
                }
                match matched.kind {
                    ImportSpecifierKind::Named => {
                        // <X.Y> on a named import is only valid when X is a
                        // recognized JSX factory (e.g. `styled.div`). For a
                        // recipe/pattern Component, `Box.Item` is just dot
                        // access, not a Panda usage.
                        if !is_jsx_factory(self.ctx.matchers, &matched.name) {
                            return None;
                        }
                        if !self
                            .ctx
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

/// Flatten a JSX member chain into (root identifier name, root identifier
/// reference, property path). `JSX.styled.div` → (`"JSX"`, `&JSX`,
/// `["styled", "div"]`). The reference is returned so callers can ask the
/// resolver whether the root is actually an imported binding.
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
            let JSXAttributeName::Identifier(name) = &attr.name else {
                // Namespaced attribute names (`foo:bar`) — skip.
                return;
            };
            let key = name.name.to_string();
            let value = match attr.value.as_ref() {
                None => Literal::Bool(true), // boolean shorthand
                Some(v) => match attribute_value(v, resolver) {
                    Some(v) => v,
                    None => return,
                },
            };
            upsert(out, key, value);
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            // With the resolver, `{...local}` folds when `local` binds to a
            // const object literal. Without it, only inline object spreads
            // (`{...{ a: 1 }}`) merge — same as before.
            if let Some(Literal::Object(entries)) =
                expression_to_literal(&spread.argument, resolver)
            {
                for (k, v) in entries {
                    upsert(out, k, v);
                }
            }
        }
    }
}

/// Insert-or-overwrite by key — last-writer-wins on duplicate keys,
/// preserving the first-occurrence position.
// PERF(port): mirrors `literal::upsert` — same O(n²) trade-off applies.
// JSX prop lists are even smaller than nested style objects in practice
// (rarely > 30 props), so a `Vec` scan stays the better choice. Swap to
// a `FxHashMap<String, usize>` builder only if benches show otherwise.
fn upsert(out: &mut Vec<(String, Literal)>, key: String, value: Literal) {
    if let Some(entry) = out.iter_mut().find(|(k, _)| k == &key) {
        entry.1 = value;
    } else {
        out.push((key, value));
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
