//! Serializable source-inspection data used by editor and lint tooling.

use pandacss_extractor::StyleSourceOwnerKind;
use pandacss_extractor::StyleSourceRef;
use pandacss_extractor::{
    ExtractedCall, ExtractedJsx, JsxKind, LineIndex, Literal, MatchCategory, TokenRef,
};
use pandacss_tokens::TokenDictionary;
use serde::Serialize;
use serde_json::Value;

use crate::{Project, SourceRange, Span};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInspectionResult {
    pub usages: Vec<UsageSite>,
    pub diagnostics: Vec<crate::Diagnostic>,
    pub calls: Vec<InspectionCall>,
    pub jsx: Vec<InspectionJsx>,
    pub token_refs: Vec<TokenRefSite>,
    pub component_entries: Vec<ComponentEntryRef>,
    pub style_entries: Vec<StyleEntryRef>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageSite {
    pub kind: UsageKind,
    /// Token path, canonical property, or recipe/pattern name.
    pub name: String,
    pub range: SourceRange,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum UsageKind {
    Token,
    Property,
    Recipe,
    Pattern,
    Keyframe,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionCall {
    pub category: MatchCategory,
    pub name: String,
    pub alias: String,
    pub data: Vec<InspectionArg>,
    pub span: Span,
    pub range: SourceRange,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionArg {
    pub kind: InspectionArgKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<Value>,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum InspectionArgKind {
    Value,
    Missing,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionJsx {
    pub category: MatchCategory,
    pub kind: JsxKind,
    pub name: String,
    pub alias: String,
    pub data: Value,
    pub span: Span,
    pub range: SourceRange,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenRefSite {
    pub path: String,
    pub span: Span,
    pub range: SourceRange,
    pub needs_css_var: bool,
    /// `true` when the call was `token.var(...)` rather than `token(...)`.
    pub is_var: bool,
    pub resolved: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComponentEntryRef {
    pub kind: ComponentEntryKind,
    pub name: String,
    pub span: Span,
    pub range: SourceRange,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recipe: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slot: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pattern: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ComponentEntryKind {
    JsxComponent,
    JsxPattern,
    JsxRecipe,
    JsxSlotRecipe,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StyleEntryRef {
    pub kind: StyleEntryKind,
    pub syntax: StyleEntrySyntax,
    pub origin: StyleEntryOrigin,
    pub owner: StyleEntryOwner,
    pub span: Span,
    pub range: SourceRange,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_span: Option<Span>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value_span: Option<Span>,
    pub path: Vec<String>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub canonical_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shorthand_of: Option<String>,
    pub source_value: Value,
    pub resolved_value: Value,
    pub fixable: StyleEntryFixability,
    /// Source span of each string leaf, so fixers can target the exact literal.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub value_spans: Vec<ValueSpanRef>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValueSpanRef {
    pub value: String,
    pub span: Span,
}

/// Enclosing style owner (call or JSX element). `(owner, parent path)` groups
/// sibling entries from one style block; `span`/`range` are per-property.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StyleEntryOwner {
    pub kind: StyleSourceOwnerKind,
    pub index: u32,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum StyleEntryKind {
    Utility,
    Condition,
    Selector,
    RecipeVariant,
    PatternProp,
    Unknown,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum StyleEntrySyntax {
    CssCall,
    JsxProp,
    JsxStyleProp,
    RecipeCall,
    PatternCall,
    TemplateStyle,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum StyleEntryOrigin {
    Local,
    CrossFile,
    Generated,
    Unknown,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum StyleEntryFixability {
    ReportOnly,
    Safe,
}

pub(crate) fn call_view(call: &ExtractedCall, range: SourceRange) -> InspectionCall {
    InspectionCall {
        category: call.category,
        name: call.name.clone(),
        alias: call.alias.clone(),
        data: call
            .data
            .iter()
            .map(|arg| match arg {
                Some(value) => InspectionArg {
                    kind: InspectionArgKind::Value,
                    value: Some(literal_value(value)),
                },
                None => InspectionArg {
                    kind: InspectionArgKind::Missing,
                    value: None,
                },
            })
            .collect(),
        span: call.span,
        range,
    }
}

pub(crate) fn jsx_view(jsx: &ExtractedJsx, range: SourceRange) -> InspectionJsx {
    InspectionJsx {
        category: jsx.category,
        kind: jsx.kind,
        name: jsx.name.clone(),
        alias: jsx.alias.clone(),
        data: literal_value(&jsx.data),
        span: jsx.span,
        range,
    }
}

pub(crate) fn token_ref_site(
    token_ref: &TokenRef,
    line_index: &LineIndex,
    tokens: Option<&TokenDictionary>,
) -> TokenRefSite {
    let range = line_index.locate_range(token_ref.span.start, token_ref.span.end);
    TokenRefSite {
        path: token_ref.path.clone(),
        span: token_ref.span,
        range,
        needs_css_var: token_ref.needs_css_var,
        is_var: token_ref.is_var,
        resolved: tokens.is_some_and(|dict| dict.token(&token_ref.path).is_some()),
        category: token_ref
            .path
            .split_once('.')
            .map(|(category, _)| category.to_owned()),
    }
}

pub(crate) fn component_entry(
    project: &Project,
    jsx: &ExtractedJsx,
    range: &SourceRange,
) -> ComponentEntryRef {
    let recipe_names = project.config.recipes.find_by_jsx(&jsx.name);
    let recipe = recipe_names.first().map(|name| (*name).to_owned());
    let slot = recipe
        .as_deref()
        .and_then(|name| project.config.recipes.slot_for_jsx(name, &jsx.name))
        .map(ToOwned::to_owned);
    let pattern = matches!(jsx.kind, JsxKind::Pattern)
        .then(|| project.config.patterns.resolve_name(&jsx.name))
        .flatten()
        .map(ToOwned::to_owned);
    let kind = match jsx.kind {
        JsxKind::Pattern => ComponentEntryKind::JsxPattern,
        JsxKind::Recipe if slot.is_some() => ComponentEntryKind::JsxSlotRecipe,
        JsxKind::Recipe => ComponentEntryKind::JsxRecipe,
        _ => ComponentEntryKind::JsxComponent,
    };

    ComponentEntryRef {
        kind,
        name: jsx.name.clone(),
        span: jsx.span,
        range: *range,
        recipe,
        slot,
        pattern,
    }
}

pub(crate) struct StyleEntryInput<'a> {
    pub(crate) kind: StyleEntryKind,
    pub(crate) syntax: StyleEntrySyntax,
    pub(crate) owner: StyleEntryOwner,
    pub(crate) name: &'a str,
    pub(crate) canonical: Option<&'a str>,
    pub(crate) value: &'a Literal,
    pub(crate) span: Span,
    pub(crate) range: &'a SourceRange,
    pub(crate) path: &'a [String],
    pub(crate) source_ref: Option<&'a StyleSourceRef>,
    pub(crate) source_range: Option<SourceRange>,
    pub(crate) value_spans: Vec<ValueSpanRef>,
}

pub(crate) fn style_entry(input: &StyleEntryInput<'_>) -> StyleEntryRef {
    let source_ref = input.source_ref;
    StyleEntryRef {
        kind: input.kind,
        syntax: input.syntax,
        owner: input.owner,
        origin: source_ref.map_or(StyleEntryOrigin::Generated, |_| StyleEntryOrigin::Local),
        span: source_ref.map_or(input.span, |source_ref| source_ref.span),
        range: input.source_range.unwrap_or(*input.range),
        key_span: source_ref.map(|source_ref| source_ref.key_span),
        value_span: source_ref.and_then(|source_ref| source_ref.value_span),
        path: input.path.to_vec(),
        name: input.name.to_owned(),
        canonical_name: input.canonical.map(ToOwned::to_owned),
        shorthand_of: input.canonical.map(ToOwned::to_owned),
        source_value: literal_value(input.value),
        resolved_value: literal_value(input.value),
        fixable: source_ref.map_or(StyleEntryFixability::ReportOnly, |source_ref| {
            if source_ref.is_safe_local_property() {
                StyleEntryFixability::Safe
            } else {
                StyleEntryFixability::ReportOnly
            }
        }),
        value_spans: input.value_spans.clone(),
    }
}

fn literal_value(value: &Literal) -> Value {
    serde_json::to_value(value).unwrap_or(Value::Null)
}
