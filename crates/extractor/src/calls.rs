use crate::{
    Diagnostic, DiagnosticSeverity, ImportSpecifierKind, MatchCategory, MatchedImport, Matcher,
    Matchers, Span,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, ArrayExpression, ArrayExpressionElement, CallExpression, Expression,
    ObjectExpression, ObjectPropertyKind, PropertyKey, PropertyKind,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedCall {
    pub category: MatchCategory,
    /// Canonical Panda name (e.g. `"css"`, `"cardStyle"`). For namespace
    /// callees like `p.css(...)`, this is the property name.
    pub name: String,
    /// Local binding at the call site. For namespace calls this is the
    /// namespace alias (e.g. `"p"` in `p.css(...)`).
    pub alias: String,
    /// Literal-extractable arguments in source order. Non-extractable args
    /// (identifiers, conditionals, etc.) are omitted from this list, so
    /// positional alignment with the original call is not preserved.
    pub data: Vec<serde_json::Value>,
    pub span: Span,
}

#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedCallsResult {
    pub calls: Vec<ExtractedCall>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Find every Panda call site and extract its literal arguments. Handles both
/// direct identifier callees (`css({...})`) and namespace member callees
/// (`p.css({...})`). The `matchers` argument lets us validate the property
/// name on namespace calls (e.g. only `css`/`cva`/`sva` qualify on a css
/// namespace alias).
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

    let mut result = ExtractedCallsResult::default();
    for error in &parser_return.errors {
        result.diagnostics.push(Diagnostic {
            message: error.message.to_string(),
            severity: DiagnosticSeverity::Error,
            span: None,
        });
    }

    let aliases: HashMap<&str, &MatchedImport> =
        matched.iter().map(|m| (m.alias.as_str(), m)).collect();

    let mut extractor = Extractor {
        aliases: &aliases,
        matchers,
        out: &mut result.calls,
    };
    extractor.visit_program(&parser_return.program);

    result
}

struct Extractor<'walk, 'm> {
    aliases: &'walk HashMap<&'walk str, &'m MatchedImport>,
    matchers: &'walk Matchers,
    out: &'walk mut Vec<ExtractedCall>,
}

impl Extractor<'_, '_> {
    fn resolve_callee(&self, call: &CallExpression<'_>) -> Option<(MatchCategory, String, String)> {
        match &call.callee {
            Expression::Identifier(ident) => {
                let matched = self.aliases.get(ident.name.as_str())?;
                if matched.kind == ImportSpecifierKind::Namespace {
                    // `p({...})` where `p` is a namespace alias — not a Panda call.
                    return None;
                }
                Some((
                    matched.category,
                    matched.name.clone(),
                    matched.alias.clone(),
                ))
            }
            Expression::StaticMemberExpression(member) => {
                let Expression::Identifier(object) = &member.object else {
                    return None;
                };
                let matched = self.aliases.get(object.name.as_str())?;
                if matched.kind != ImportSpecifierKind::Namespace {
                    return None;
                }
                let property = member.property.name.as_str();
                if !category_accepts_name(self.matchers, matched.category, property) {
                    return None;
                }
                Some((matched.category, property.to_owned(), matched.alias.clone()))
            }
            _ => None,
        }
    }
}

impl<'a> Visit<'a> for Extractor<'_, '_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if let Some((category, name, alias)) = self.resolve_callee(call) {
            let data: Vec<_> = call
                .arguments
                .iter()
                .filter_map(argument_to_value)
                .collect();
            if !data.is_empty() {
                self.out.push(ExtractedCall {
                    category,
                    name,
                    alias,
                    data,
                    span: Span::from(call.span),
                });
            }
        }
        walk::walk_call_expression(self, call);
    }
}

fn category_accepts_name(matchers: &Matchers, category: MatchCategory, name: &str) -> bool {
    let matcher = match category {
        MatchCategory::Css => &matchers.css,
        MatchCategory::Recipe => &matchers.recipe,
        MatchCategory::Pattern => &matchers.pattern,
        MatchCategory::Jsx => match matchers.jsx.as_ref() {
            Some(m) => m,
            None => return false,
        },
        MatchCategory::Tokens => &matchers.tokens,
    };
    matcher_accepts_name(matcher, name)
}

fn matcher_accepts_name(matcher: &Matcher, name: &str) -> bool {
    match matcher.names.as_deref() {
        None => true,
        Some(list) => list.iter().any(|n| n == name),
    }
}

fn argument_to_value(arg: &Argument<'_>) -> Option<serde_json::Value> {
    arg.as_expression().and_then(expression_to_value)
}

fn expression_to_value(expr: &Expression<'_>) -> Option<serde_json::Value> {
    match expr {
        Expression::StringLiteral(s) => Some(serde_json::Value::String(s.value.to_string())),
        Expression::NumericLiteral(n) => json_number(n.value),
        Expression::BooleanLiteral(b) => Some(serde_json::Value::Bool(b.value)),
        Expression::NullLiteral(_) => Some(serde_json::Value::Null),
        Expression::ObjectExpression(obj) => object_to_value(obj),
        Expression::ArrayExpression(arr) => array_to_value(arr),
        _ => None,
    }
}

fn object_to_value(obj: &ObjectExpression<'_>) -> Option<serde_json::Value> {
    let mut map = serde_json::Map::with_capacity(obj.properties.len());
    for prop in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            return None;
        };
        if prop.computed || prop.method || prop.kind != PropertyKind::Init {
            return None;
        }
        let key = property_key_to_string(&prop.key)?;
        let value = expression_to_value(&prop.value)?;
        map.insert(key, value);
    }
    Some(serde_json::Value::Object(map))
}

fn array_to_value(arr: &ArrayExpression<'_>) -> Option<serde_json::Value> {
    let mut out = Vec::with_capacity(arr.elements.len());
    for element in &arr.elements {
        match element {
            ArrayExpressionElement::Elision(_) => out.push(serde_json::Value::Null),
            ArrayExpressionElement::SpreadElement(_) => return None,
            _ => {
                let expr = element.as_expression()?;
                out.push(expression_to_value(expr)?);
            }
        }
    }
    Some(serde_json::Value::Array(out))
}

fn property_key_to_string(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
        PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
        PropertyKey::NumericLiteral(n) => Some(n.value.to_string()),
        _ => None,
    }
}

fn json_number(value: f64) -> Option<serde_json::Value> {
    // 2^53 is the largest integer f64 can represent without precision loss.
    const MAX_SAFE_INT: f64 = 9_007_199_254_740_992.0;
    if value.is_finite() && value.fract() == 0.0 && value.abs() <= MAX_SAFE_INT {
        #[allow(
            clippy::cast_possible_truncation,
            reason = "bounds checked against MAX_SAFE_INT (2^53)"
        )]
        return Some(serde_json::Value::Number(serde_json::Number::from(
            value as i64,
        )));
    }
    serde_json::Number::from_f64(value).map(serde_json::Value::Number)
}
