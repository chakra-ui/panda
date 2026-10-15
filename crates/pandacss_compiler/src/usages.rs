//! Position-carrying source inspection for tooling (reporting, lint, IDE).
//! `inspect_file_source()` re-extracts a file and classifies each site (token,
//! property, recipe, pattern, keyframe) using the engine's own token
//! dictionary, utilities, and keyframes.

use pandacss_encoder::ConditionMatcher;
use pandacss_extractor::{
    ExtractedCall, ExtractedJsx, LineIndex, MatchCategory, StyleSourceOwnerKind, StyleSourceRef,
    extract_verbose,
};
use pandacss_literal::Literal;
use pandacss_shared::parse_first_that_works_value;
use pandacss_tokens::{TokenCategory, TokenDictionary, TokenSuggestion};
use pandacss_utility::{Utility, token_references};
use rustc_hash::FxHashMap;

use crate::inspection::{
    FileInspectionResult, StyleEntryInput, StyleEntryKind, StyleEntryOwner, StyleEntryRef,
    StyleEntrySyntax, UsageKind, UsageSite, ValueSpanRef, call_view, component_entry, jsx_view,
    style_entry, token_ref_site, token_value_ref,
};
use pandacss_encoder::ConditionSet;
use pandacss_extractor::{SourceRange, Span};
use pandacss_system::{
    SourceStyleKind, System, visit_call_style_objects, visit_call_style_strings,
    visit_jsx_style_strings,
};

struct Cx<'a> {
    utility: Option<&'a Utility>,
    tokens: Option<&'a TokenDictionary>,
    conditions: &'a ConditionSet,
    keyframes: &'a rustc_hash::FxHashSet<String>,
}

/// Classifies every Panda usage in a file with its source range, plus
/// file-local diagnostics. On-demand — not part of the build path.
#[must_use]
pub fn inspect_file_source(system: &System, path: &str, source: &str) -> FileInspectionResult {
    let mut result = extract_verbose(source, path, system.extractor_config());
    let line_index = LineIndex::new(source);
    pandacss_project::append_usage_diagnostics(
        system,
        &result.calls,
        &result.jsx,
        &line_index,
        &mut result.diagnostics,
    );
    let dict = system.token_dictionary();
    let cx = Cx {
        utility: system.utility(),
        tokens: dict.as_deref(),
        conditions: system.conditions(),
        keyframes: system.keyframes(),
    };

    let mut sites = Vec::new();
    let mut style_entries = Vec::new();
    let mut component_entries = Vec::new();
    let source_refs = source_ref_map(&result.style_source_refs);

    {
        let call_ctx = CallStyleCtx {
            cx: &cx,
            line_index: &line_index,
            source_refs: &source_refs,
        };
        let mut accum = InspectAccum {
            sites: &mut sites,
            style_entries: &mut style_entries,
        };
        for (index, call) in result.calls.iter().enumerate() {
            collect_call_styles(call, index, &call_ctx, &mut accum);
        }
        for (index, jsx) in result.jsx.iter().enumerate() {
            let range = line_index.locate_range(jsx.span.start, jsx.span.end);
            component_entries.push(component_entry(system, jsx, &range));
            collect_jsx_styles(jsx, index, range, &call_ctx, &mut accum);
        }
    }

    // `token()`/`token.var()` resolve to a value/var during extraction, so
    // the path only comes from the extractor's captured refs. The span is
    // the call itself — tighter than the enclosing style call.
    for token_ref in &result.token_refs {
        let range = line_index.locate_range(token_ref.span.start, token_ref.span.end);
        sites.push(site(UsageKind::Token, &token_ref.path, &range));
    }
    let token_refs = result
        .token_refs
        .iter()
        .map(|token_ref| token_ref_site(token_ref, &line_index, cx.tokens))
        .chain(style_value_token_refs(
            system,
            &result.calls,
            &result.jsx,
            source,
            &source_refs,
            &line_index,
        ))
        .collect();

    FileInspectionResult {
        usages: sites,
        diagnostics: result.diagnostics,
        calls: result
            .calls
            .iter()
            .map(|call| {
                call_view(
                    call,
                    line_index.locate_range(call.span.start, call.span.end),
                )
            })
            .collect(),
        jsx: result
            .jsx
            .iter()
            .map(|jsx| jsx_view(jsx, line_index.locate_range(jsx.span.start, jsx.span.end)))
            .collect(),
        token_refs,
        component_entries,
        style_entries,
    }
}

/// Tokens carrying `value` on `prop`, ranked with safe equivalents first.
/// The lint rule lists these and lets the developer choose.
#[must_use]
pub fn suggest_tokens(system: &System, prop: &str, value: &str) -> Vec<TokenSuggestion> {
    let Some(utility) = system.utility() else {
        return Vec::new();
    };
    let canonical = utility.resolve_shorthand(prop);
    let Some(category) = utility.token_category(canonical) else {
        return Vec::new();
    };
    let Some(dict) = system.token_dictionary() else {
        return Vec::new();
    };
    dict.suggest_tokens(&TokenCategory::from_path_segment(category), value)
}

/// Semantic tokens that carry the same value as `path`, ranked for tooling.
#[must_use]
pub fn suggest_semantic_tokens(system: &System, path: &str) -> Vec<TokenSuggestion> {
    let Some(dict) = system.token_dictionary() else {
        return Vec::new();
    };
    dict.suggest_semantic_tokens(path)
}

type SourceRefKey = (StyleSourceOwnerKind, u32, Vec<String>);

fn source_ref_map(refs: &[StyleSourceRef]) -> FxHashMap<SourceRefKey, &StyleSourceRef> {
    let mut map = FxHashMap::default();
    for source_ref in refs {
        map.insert(
            (
                source_ref.owner.kind,
                source_ref.owner.index,
                source_ref.path.clone(),
            ),
            source_ref,
        );
    }
    map
}

/// Shared lookup context for classifying one extracted call.
struct CallStyleCtx<'a, 'source> {
    cx: &'a Cx<'a>,
    line_index: &'a LineIndex<'source>,
    source_refs: &'a FxHashMap<SourceRefKey, &'a StyleSourceRef>,
}

/// Mutable inspection outputs threaded through call/recipe walkers.
struct InspectAccum<'a> {
    sites: &'a mut Vec<UsageSite>,
    style_entries: &'a mut Vec<StyleEntryRef>,
}

/// Classifies one extracted call and collects its usages + style entries:
/// `css({...})`, the recipe factories, and recipe/pattern call sites.
fn collect_call_styles(
    call: &ExtractedCall,
    index: usize,
    ctx: &CallStyleCtx<'_, '_>,
    accum: &mut InspectAccum<'_>,
) {
    let range = ctx.line_index.locate_range(call.span.start, call.span.end);
    let collector = StyleEntryCollector {
        cx: ctx.cx,
        span: call.span,
        range,
        line_index: ctx.line_index,
        source_refs: ctx.source_refs,
        owner_kind: StyleSourceOwnerKind::Call,
        owner_index: u32::try_from(index).unwrap_or(u32::MAX),
    };
    match (call.category, call.name.as_str()) {
        (MatchCategory::Recipe, _) => accum
            .sites
            .push(site(UsageKind::Recipe, &call.name, &range)),
        (MatchCategory::Pattern, _) => {
            accum
                .sites
                .push(site(UsageKind::Pattern, &call.name, &range));
        }
        (MatchCategory::Jsx, _) => {
            if let Some(recipe) = call.jsx_recipe_ident.as_deref() {
                accum.sites.push(site(UsageKind::Recipe, recipe, &range));
            }
        }
        (MatchCategory::Css, "positionTry" | "viewTransition") => {
            if let Some(Literal::String(name)) = call.data.first().and_then(Option::as_ref) {
                let kind = if call.name == "positionTry" {
                    UsageKind::PositionTry
                } else {
                    UsageKind::ViewTransition
                };
                accum.sites.push(site(kind, name, &range));
            }
        }
        _ => {}
    }
    visit_call_style_objects(call, |kind, path, entries| {
        let syntax = match kind {
            SourceStyleKind::Css => StyleEntrySyntax::CssCall,
            SourceStyleKind::Recipe => StyleEntrySyntax::RecipeCall,
            SourceStyleKind::Jsx => StyleEntrySyntax::JsxProp,
            SourceStyleKind::Pattern => StyleEntrySyntax::PatternCall,
        };
        if kind == SourceStyleKind::Jsx {
            walk_jsx_style_props(entries, ctx.cx, &range, accum.sites);
        } else if kind != SourceStyleKind::Pattern {
            walk_object(entries, ctx.cx, &range, accum.sites);
        }
        collector.collect(entries, syntax, &mut path.to_vec(), accum.style_entries);
    });
}

fn collect_jsx_styles(
    jsx: &ExtractedJsx,
    index: usize,
    range: SourceRange,
    ctx: &CallStyleCtx<'_, '_>,
    accum: &mut InspectAccum<'_>,
) {
    match jsx.category {
        MatchCategory::Recipe => {
            accum.sites.push(site(UsageKind::Recipe, &jsx.name, &range));
            return;
        }
        MatchCategory::Pattern => accum
            .sites
            .push(site(UsageKind::Pattern, &jsx.name, &range)),
        _ => {}
    }
    let Literal::Object(entries) = &jsx.data else {
        return;
    };
    if jsx.category != MatchCategory::Pattern {
        walk_object(entries, ctx.cx, &range, accum.sites);
    }
    StyleEntryCollector {
        cx: ctx.cx,
        span: jsx.span,
        range,
        line_index: ctx.line_index,
        source_refs: ctx.source_refs,
        owner_kind: StyleSourceOwnerKind::Jsx,
        owner_index: u32::try_from(index).unwrap_or(u32::MAX),
    }
    .collect(
        entries,
        StyleEntrySyntax::JsxProp,
        &mut Vec::new(),
        accum.style_entries,
    );
}

struct StyleEntryCollector<'a, 'source> {
    cx: &'a Cx<'a>,
    span: Span,
    range: SourceRange,
    line_index: &'a LineIndex<'source>,
    source_refs: &'a FxHashMap<SourceRefKey, &'a StyleSourceRef>,
    owner_kind: StyleSourceOwnerKind,
    owner_index: u32,
}

impl StyleEntryCollector<'_, '_> {
    fn owner(&self) -> StyleEntryOwner {
        StyleEntryOwner {
            kind: self.owner_kind,
            index: self.owner_index,
        }
    }

    fn collect(
        &self,
        entries: &[(String, Literal)],
        syntax: StyleEntrySyntax,
        path: &mut Vec<String>,
        out: &mut Vec<StyleEntryRef>,
    ) {
        for (key, value) in entries {
            let is_nesting_key = is_nesting(key, self.cx);
            path.push(key.clone());
            if syntax == StyleEntrySyntax::JsxProp && is_jsx_css_prop(key) {
                match value {
                    // `css={{ ... }}`
                    Literal::Object(nested) => {
                        self.collect(nested, StyleEntrySyntax::JsxStyleProp, path, out);
                        path.pop();
                        continue;
                    }
                    // `css={[{ ... }, { ... }]}` — each element is a merged style object.
                    Literal::Array(items) => {
                        for (index, item) in items.iter().enumerate() {
                            if let Literal::Object(nested) = item {
                                path.push(index.to_string());
                                self.collect(nested, StyleEntrySyntax::JsxStyleProp, path, out);
                                path.pop();
                            }
                        }
                        path.pop();
                        continue;
                    }
                    _ => {}
                }
            }
            let source_ref = self.source_ref(path);
            let source_range = source_ref.map(|source_ref| {
                self.line_index
                    .locate_range(source_ref.span.start, source_ref.span.end)
            });
            if is_nesting_key {
                let kind = if is_raw_selector(key) {
                    StyleEntryKind::Selector
                } else {
                    StyleEntryKind::Condition
                };
                out.push(style_entry(&StyleEntryInput {
                    kind,
                    syntax,
                    owner: self.owner(),
                    name: key,
                    canonical: None,
                    value,
                    span: self.span,
                    range: &self.range,
                    path,
                    source_ref,
                    source_range,
                    value_spans: Vec::new(),
                }));
                if let Literal::Object(nested) = value {
                    self.collect(nested, syntax, path, out);
                }
            } else {
                let canonical = self
                    .cx
                    .utility
                    .map(|utility| utility.resolve_shorthand(key))
                    .filter(|canonical| *canonical != key);
                let is_known = self.cx.utility.is_some_and(|utility| utility.is_known(key));
                let kind = if is_known {
                    StyleEntryKind::Utility
                } else {
                    match syntax {
                        StyleEntrySyntax::PatternCall => StyleEntryKind::PatternProp,
                        StyleEntrySyntax::RecipeCall => StyleEntryKind::RecipeVariant,
                        _ => StyleEntryKind::Unknown,
                    }
                };
                let token_category = (kind == StyleEntryKind::Utility)
                    .then(|| {
                        self.cx
                            .utility
                            .and_then(|utility| utility.token_category(key))
                            .map(TokenCategory::from_path_segment)
                    })
                    .flatten();
                out.push(style_entry(&StyleEntryInput {
                    kind,
                    syntax,
                    owner: self.owner(),
                    name: key,
                    canonical,
                    value,
                    span: self.span,
                    range: &self.range,
                    path,
                    source_ref,
                    source_range,
                    value_spans: self.value_spans(path, value, token_category.as_ref()),
                }));
            }
            path.pop();
        }
    }

    fn source_ref(&self, path: &[String]) -> Option<&StyleSourceRef> {
        self.source_refs
            .get(&(self.owner_kind, self.owner_index, path.to_vec()))
            .copied()
    }

    fn value_spans(
        &self,
        path: &[String],
        value: &Literal,
        token_category: Option<&TokenCategory>,
    ) -> Vec<ValueSpanRef> {
        let mut out = Vec::new();
        let mut path = path.to_vec();
        self.collect_value_spans(&mut path, value, token_category, &mut out);
        out
    }

    fn collect_value_spans(
        &self,
        path: &mut Vec<String>,
        value: &Literal,
        token_category: Option<&TokenCategory>,
        out: &mut Vec<ValueSpanRef>,
    ) {
        match value {
            Literal::String(text) | Literal::Token { value: text, .. } => {
                if let Some(source_ref) = self.source_ref(path)
                    && let Some(span) = source_ref.value_span
                {
                    let token = self
                        .cx
                        .tokens
                        .zip(token_category)
                        .and_then(|(dict, category)| dict.resolve_token_path(category, text))
                        .map(token_value_ref);
                    out.push(ValueSpanRef {
                        value: text.clone(),
                        span,
                        token,
                    });
                }
            }
            Literal::Object(entries) => {
                for (key, nested) in entries {
                    path.push(key.clone());
                    self.collect_value_spans(path, nested, token_category, out);
                    path.pop();
                }
            }
            Literal::Array(items) => {
                for (index, nested) in items.iter().enumerate() {
                    path.push(index.to_string());
                    self.collect_value_spans(path, nested, token_category, out);
                    path.pop();
                }
            }
            _ => {}
        }
    }
}

/// A style object: keys are properties, conditions, or raw selectors.
fn walk_object(
    entries: &[(String, Literal)],
    cx: &Cx,
    range: &SourceRange,
    sites: &mut Vec<UsageSite>,
) {
    for (key, value) in entries {
        if is_nesting(key, cx) {
            if let Literal::Object(nested) = value {
                walk_object(nested, cx, range, sites);
            }
        } else {
            walk_prop(key, value, cx, range, sites);
        }
    }
}

fn walk_jsx_style_props(
    entries: &[(String, Literal)],
    cx: &Cx,
    range: &SourceRange,
    sites: &mut Vec<UsageSite>,
) {
    for (key, value) in entries {
        if is_jsx_css_prop(key) {
            match value {
                Literal::Object(nested) => walk_object(nested, cx, range, sites),
                Literal::Array(items) => {
                    for item in items {
                        if let Literal::Object(nested) = item {
                            walk_object(nested, cx, range, sites);
                        }
                    }
                }
                _ => {}
            }
        } else if is_nesting(key, cx) {
            if let Literal::Object(nested) = value {
                walk_jsx_style_props(nested, cx, range, sites);
            }
        } else {
            walk_prop(key, value, cx, range, sites);
        }
    }
}

/// One property and its value (descending responsive arrays + per-prop conditions).
fn walk_prop(
    prop: &str,
    value: &Literal,
    cx: &Cx,
    range: &SourceRange,
    sites: &mut Vec<UsageSite>,
) {
    match value {
        Literal::String(raw) | Literal::Token { value: raw, .. } => {
            let canonical = cx
                .utility
                .map_or(prop, |utility| utility.resolve_shorthand(prop));
            sites.push(site(UsageKind::Property, canonical, range));

            // Each member is a value for this property in its own right, or its
            // tokens and keyframes look unused and get pruned.
            let members = parse_first_that_works_value(raw).unwrap_or_else(|| vec![raw.as_str()]);

            // A `Literal::Token` already has its path via `token_refs`, so skip
            // the category-relative heuristic to avoid duplicate sites.
            if let Some(dict) = cx.tokens
                && !matches!(value, Literal::Token { .. })
            {
                for member in &members {
                    // Bare category-relative value on a known utility, e.g.
                    // `color: 'red.300'` (optionally `red.300/40`).
                    if let Some(utility) = cx.utility
                        && let Some(category) = utility.token_category(prop)
                    {
                        let path = format!("{category}.{}", strip_modifier(member));
                        if dict.token(&path).is_some() {
                            sites.push(site(UsageKind::Token, &path, range));
                        }
                    }
                    collect_token_refs(member, dict, &mut |path| {
                        sites.push(site(UsageKind::Token, path, range));
                    });
                }
            }

            // Match each whitespace/comma-separated word against the keyframe
            // set, catching shorthands (`spin 1s linear`) and lists (`spin, fade`).
            if matches!(canonical, "animation" | "animationName") {
                for word in members
                    .iter()
                    .flat_map(|member| member.split([' ', ',']))
                    .map(str::trim)
                    .filter(|word| !word.is_empty())
                {
                    if cx.keyframes.contains(word) {
                        sites.push(site(UsageKind::Keyframe, word, range));
                    }
                }
            }
        }
        Literal::Number(_) | Literal::Bool(_) => {
            let canonical = cx
                .utility
                .map_or(prop, |utility| utility.resolve_shorthand(prop));
            sites.push(site(UsageKind::Property, canonical, range));
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                walk_prop(prop, item, cx, range, sites);
            }
        }
        // Per-prop conditions: `{ base: 'red.500', _hover: 'blue.500' }`.
        Literal::Object(entries) => {
            for (_, nested) in entries {
                walk_prop(prop, nested, cx, range, sites);
            }
        }
        Literal::Null => {}
    }
}

/// Strips a trailing `/opacity` color modifier: `red.300/40` -> `red.300`.
/// Safe on any candidate path since token paths never contain `/`.
fn strip_modifier(value: &str) -> &str {
    value
        .split_once('/')
        .map_or(value, |(base, _)| base.trim_end())
}

/// Emits every token path referenced inside a value string: `{colors.red.200}`
/// curly refs, `token(...)` written inside a string (a bare `token(...)` call
/// is resolved during extraction and captured via
/// [`token_refs`](pandacss_extractor::TokenRef) instead), and a value that's
/// itself a token path. Each candidate runs through [`strip_modifier`] first.
fn collect_token_refs(raw: &str, dict: &TokenDictionary, emit: &mut impl FnMut(&str)) {
    let references = token_references(raw, dict);
    for (path, _) in &references {
        if dict.token(path).is_some() {
            emit(path);
        }
    }

    // A whole-value token path, e.g. `'--ring': 'colors.red.400'`. Skip if the
    // value already carried a `{…}`/`token(…)` reference handled above.
    if references.is_empty() {
        let key = strip_modifier(raw.trim());
        if !key.is_empty() && dict.token(key).is_some() {
            emit(key);
        }
    }
}

fn style_value_token_refs(
    system: &System,
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    source: &str,
    source_refs: &FxHashMap<SourceRefKey, &StyleSourceRef>,
    line_index: &LineIndex<'_>,
) -> Vec<crate::inspection::TokenRefSite> {
    let Some(dict) = system.token_dictionary() else {
        return Vec::new();
    };
    let mut out = Vec::new();
    let mut collect = |kind, index, owner_span, path: &[String], text: &str| {
        let references = token_references(text, &dict);
        if references.is_empty() {
            return;
        }
        let leaf = source_refs
            .get(&(kind, index, path.to_vec()))
            .and_then(|source_ref| source_ref.value_span);
        let base = leaf.and_then(|leaf| {
            let literal = source.get(leaf.start as usize..leaf.end as usize)?;
            Some(leaf.start as usize + literal.find(text)?)
        });
        for (reference, range) in references {
            let span = base
                .and_then(|base| {
                    Some(Span {
                        start: u32::try_from(base + range.start).ok()?,
                        end: u32::try_from(base + range.end).ok()?,
                    })
                })
                .or(leaf)
                .unwrap_or(owner_span);
            out.push(crate::inspection::embedded_token_ref_site(
                reference, span, line_index, &dict,
            ));
        }
    };
    for (index, call) in calls.iter().enumerate() {
        let index = u32::try_from(index).unwrap_or(u32::MAX);
        visit_call_style_strings(system, call, |path, text| {
            collect(StyleSourceOwnerKind::Call, index, call.span, path, text);
        });
    }
    for (index, jsx) in jsx.iter().enumerate() {
        let index = u32::try_from(index).unwrap_or(u32::MAX);
        visit_jsx_style_strings(system, jsx, |path, text| {
            collect(StyleSourceOwnerKind::Jsx, index, jsx.span, path, text);
        });
    }
    out
}

/// A key that nests a style object rather than naming a property: a
/// condition, a raw selector (`&:hover`), or an at-rule (`@media`).
fn is_nesting(key: &str, cx: &Cx) -> bool {
    cx.conditions.is_condition(key) || is_raw_selector(key)
}

fn is_raw_selector(key: &str) -> bool {
    key.starts_with('&') || key.starts_with('@') || key.contains('&')
}

fn is_jsx_css_prop(key: &str) -> bool {
    key == "css" || key.ends_with("Css")
}

fn site(kind: UsageKind, name: &str, range: &SourceRange) -> UsageSite {
    UsageSite {
        kind,
        name: name.to_owned(),
        range: *range,
    }
}
