use crate::{
    Diagnostic, ImportSpecifierKind, Literal, MatchCategory, MatchedImport, Matchers, Span,
    VisitorContext,
    literal::{expression_to_literal, object_to_literal},
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Expression, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXElementName,
    JSXExpression, JSXMemberExpression, JSXMemberExpressionObject, JSXOpeningElement,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;

/// Names treated as JSX factories for the purpose of accepting member-chain
/// tags like `<styled.div>`. Without this restriction a named import like
/// `Box` would also match `<Box.Item />`, which is not a Panda factory call.
///
/// TODO(port): make this configurable via `Matcher.factories: Vec<String>`
/// instead of hardcoding `"styled"`.
const JSX_FACTORY_NAMES: &[&str] = &["styled"];

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
    matchers: &Matchers,
) -> ExtractedJsxResult {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let ctx = VisitorContext::new(matched, matchers);
    ExtractedJsxResult {
        jsx: collect_jsx(&parser_return.program, &ctx),
        diagnostics: crate::collect_parser_diagnostics(&parser_return.errors),
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
                Some((
                    matched.category,
                    matched.name.clone(),
                    matched.alias.clone(),
                ))
            }
            JSXElementName::MemberExpression(member) => {
                let (root, path) = flatten_member(member)?;
                let matched = self.ctx.aliases.get(root.as_str())?;
                match matched.kind {
                    ImportSpecifierKind::Named => {
                        // <X.Y> on a named import is only valid when X is a
                        // recognized JSX factory (e.g. `styled.div`). For a
                        // recipe/pattern Component, `Box.Item` is just dot
                        // access, not a Panda usage.
                        if !JSX_FACTORY_NAMES.iter().any(|f| f == &matched.name) {
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
                merge_attribute(item, &mut entries);
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

/// Flatten a JSX member chain into (root identifier, property path).
/// `JSX.styled.div` → (`"JSX"`, `["styled", "div"]`).
fn flatten_member(member: &JSXMemberExpression<'_>) -> Option<(String, Vec<String>)> {
    let mut path = vec![member.property.name.to_string()];
    let mut current = &member.object;
    loop {
        match current {
            JSXMemberExpressionObject::IdentifierReference(id) => {
                let root = id.name.to_string();
                path.reverse();
                return Some((root, path));
            }
            JSXMemberExpressionObject::MemberExpression(inner) => {
                path.push(inner.property.name.to_string());
                current = &inner.object;
            }
            JSXMemberExpressionObject::ThisExpression(_) => return None,
        }
    }
}

fn merge_attribute(item: &JSXAttributeItem<'_>, out: &mut Vec<(String, Literal)>) {
    match item {
        JSXAttributeItem::Attribute(attr) => {
            let JSXAttributeName::Identifier(name) = &attr.name else {
                // Namespaced attribute names (`foo:bar`) — skip.
                return;
            };
            let key = name.name.to_string();
            let value = match attr.value.as_ref() {
                None => Literal::Bool(true), // boolean shorthand
                Some(v) => match attribute_value(v) {
                    Some(v) => v,
                    None => return,
                },
            };
            upsert(out, key, value);
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            // Only merge literal object spreads. Identifiers/conditionals
            // would need static evaluation (Phase 5).
            if let Expression::ObjectExpression(obj) = &spread.argument
                && let Some(Literal::Object(entries)) = object_to_literal(obj)
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
fn upsert(out: &mut Vec<(String, Literal)>, key: String, value: Literal) {
    if let Some(entry) = out.iter_mut().find(|(k, _)| k == &key) {
        entry.1 = value;
    } else {
        out.push((key, value));
    }
}

fn attribute_value(value: &JSXAttributeValue<'_>) -> Option<Literal> {
    match value {
        JSXAttributeValue::StringLiteral(s) => Some(Literal::String(s.value.to_string())),
        JSXAttributeValue::ExpressionContainer(container) => match &container.expression {
            JSXExpression::EmptyExpression(_) => None,
            other => other.as_expression().and_then(expression_to_literal),
        },
        JSXAttributeValue::Element(_) | JSXAttributeValue::Fragment(_) => None,
    }
}
