//! Position-carrying source inspection for tooling (reporting, lint, IDE).
//! `inspect_file_source()` re-extracts a file and classifies each site (token,
//! property, recipe, pattern, keyframe) — the engine knows the token
//! dictionary, utilities, and keyframes, so classification is authoritative.

use pandacss_encoder::ConditionMatcher;
use pandacss_extractor::{
    LineIndex, Literal, MatchCategory, StyleSourceOwnerKind, StyleSourceRef, extract_verbose,
};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;
use rustc_hash::FxHashMap;

use crate::inspection::{
    FileInspectionResult, StyleEntryInput, StyleEntryKind, StyleEntryRef, StyleEntrySyntax,
    UsageKind, UsageSite, call_view, component_entry, jsx_view, style_entry, token_ref_site,
};
use crate::{Project, ProjectConditionMatcher, SourceRange, Span};

struct Cx<'a> {
    utility: Option<&'a Utility>,
    tokens: Option<&'a TokenDictionary>,
    conditions: &'a ProjectConditionMatcher,
    keyframes: &'a rustc_hash::FxHashSet<String>,
}

impl Project {
    /// Classify every Panda usage in a file (token / property / recipe / pattern)
    /// with its source range, plus file-local extraction diagnostics. On-demand
    /// — not part of the build path.
    #[must_use]
    pub fn inspect_file_source(&self, path: &str, source: &str) -> FileInspectionResult {
        let result = extract_verbose(source, path, &self.config.extractor_config);
        let line_index = LineIndex::new(source);
        let dict = self.config.token_dictionary();
        let cx = Cx {
            utility: self.config.utility(),
            tokens: dict.as_deref(),
            conditions: &self.config.conditions,
            keyframes: &self.config.keyframes,
        };

        let mut sites = Vec::new();
        let mut style_entries = Vec::new();
        let mut component_entries = Vec::new();
        let source_refs = source_ref_map(&result.style_source_refs);
        for (index, call) in result.calls.iter().enumerate() {
            let range = line_index.locate_range(call.span.start, call.span.end);
            match call.category {
                MatchCategory::Css if call.name == "css" => {
                    if let Some(Some(Literal::Object(entries))) = call.data.first() {
                        walk_object(entries, &cx, &range, &mut sites);
                        StyleEntryCollector {
                            cx: &cx,
                            span: call.span,
                            range,
                            line_index: &line_index,
                            source_refs: &source_refs,
                            owner_kind: StyleSourceOwnerKind::Call,
                            owner_index: u32::try_from(index).unwrap_or(u32::MAX),
                        }
                        .collect(
                            entries,
                            StyleEntrySyntax::CssCall,
                            &mut Vec::new(),
                            &mut style_entries,
                        );
                    }
                }
                MatchCategory::Recipe => sites.push(site(UsageKind::Recipe, &call.name, &range)),
                MatchCategory::Pattern => sites.push(site(UsageKind::Pattern, &call.name, &range)),
                _ => {}
            }
        }
        for (index, jsx) in result.jsx.iter().enumerate() {
            let range = line_index.locate_range(jsx.span.start, jsx.span.end);
            component_entries.push(component_entry(self, jsx, &range));
            match jsx.category {
                MatchCategory::Recipe => sites.push(site(UsageKind::Recipe, &jsx.name, &range)),
                MatchCategory::Pattern => sites.push(site(UsageKind::Pattern, &jsx.name, &range)),
                _ => {
                    if let Literal::Object(entries) = &jsx.data {
                        walk_object(entries, &cx, &range, &mut sites);
                        StyleEntryCollector {
                            cx: &cx,
                            span: jsx.span,
                            range,
                            line_index: &line_index,
                            source_refs: &source_refs,
                            owner_kind: StyleSourceOwnerKind::Jsx,
                            owner_index: u32::try_from(index).unwrap_or(u32::MAX),
                        }
                        .collect(
                            entries,
                            StyleEntrySyntax::JsxProp,
                            &mut Vec::new(),
                            &mut style_entries,
                        );
                    }
                }
            }
        }
        // `token()` / `token.var()` calls resolve to a value/var during extraction,
        // so the path is only available from the extractor's captured refs. Their
        // span is the call itself — a tighter site than the enclosing style call.
        for token_ref in &result.token_refs {
            let range = line_index.locate_range(token_ref.span.start, token_ref.span.end);
            sites.push(site(UsageKind::Token, &token_ref.path, &range));
        }
        let token_refs = result
            .token_refs
            .iter()
            .map(|token_ref| token_ref_site(token_ref, &line_index, cx.tokens))
            .collect();
        FileInspectionResult {
            usages: sites,
            diagnostics: result.diagnostics,
            calls: result.calls.iter().map(call_view).collect(),
            jsx: result.jsx.iter().map(jsx_view).collect(),
            token_refs,
            component_entries,
            style_entries,
        }
    }
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
            if syntax == StyleEntrySyntax::JsxProp
                && is_jsx_css_prop(key)
                && let Literal::Object(nested) = value
            {
                self.collect(nested, StyleEntrySyntax::JsxStyleProp, path, out);
                path.pop();
                continue;
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
                    name: key,
                    canonical: None,
                    value,
                    span: self.span,
                    range: &self.range,
                    path,
                    source_ref,
                    source_range,
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
                out.push(style_entry(&StyleEntryInput {
                    kind,
                    syntax,
                    name: key,
                    canonical,
                    value,
                    span: self.span,
                    range: &self.range,
                    path,
                    source_ref,
                    source_range,
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

            if let Some(dict) = cx.tokens
                // `Literal::Token` already records the path via `token_refs` — skip
                // the category-relative heuristic to avoid duplicate sites.
                && !matches!(value, Literal::Token { .. })
            {
                // Bare category-relative value on a known utility — `color: 'red.300'`,
                // with an optional `/opacity` modifier (`red.300/40`).
                if let Some(utility) = cx.utility
                    && let Some(category) = utility.token_category(prop)
                {
                    let path = format!("{category}.{}", strip_modifier(raw));
                    if dict.token(&path).is_some() {
                        sites.push(site(UsageKind::Token, &path, range));
                    }
                }
                // References embedded in the value string: `{colors.red.200}`, a
                // resolved `token(...)` call (lowered to `var(--…)` by extraction),
                // or a value that is itself a token path.
                collect_token_refs(raw, dict, &mut |path| {
                    sites.push(site(UsageKind::Token, path, range));
                });
            }

            // `animation` / `animationName` reference a defined keyframe by name.
            // Matching every whitespace/comma-separated word against the keyframe
            // set captures shorthands (`spin 1s linear`) and lists (`spin, fade`)
            // regardless of where the name sits.
            if matches!(canonical, "animation" | "animationName") {
                for word in raw
                    .split([' ', ','])
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

/// Strip a trailing `/opacity` color modifier — `red.300/40` → `red.300`. Token
/// paths never contain `/`, so this is safe to apply to any candidate path.
fn strip_modifier(value: &str) -> &str {
    value
        .split_once('/')
        .map_or(value, |(base, _)| base.trim_end())
}

/// Emit every token path referenced inside a value string. Covers the forms that
/// survive extraction as text, including when interpolated into a longhand value
/// (`border: '1px solid {colors.red.300}'`):
/// - `{colors.red.200}` curly references,
/// - `token(colors.red.300)` references written *inside* a string (a call
///   expression `token(...)` is instead resolved during extraction and captured
///   via [`token_refs`](pandacss_extractor::TokenRef)),
/// - a value that is itself a token path (`'colors.red.400'`).
///
/// Every candidate path is run through [`strip_modifier`] so `/opacity` suffixes
/// still resolve to the base token.
fn collect_token_refs(raw: &str, dict: &TokenDictionary, emit: &mut impl FnMut(&str)) {
    let mut embedded = false;

    let mut rest = raw;
    while let Some(open) = rest.find('{') {
        let after = &rest[open + 1..];
        let Some(close) = after.find('}') else { break };
        let key = strip_modifier(after[..close].trim());
        if dict.token(key).is_some() {
            emit(key);
        }
        embedded = true;
        rest = &after[close + 1..];
    }

    let mut rest = raw;
    while let Some(open) = rest.find("token(") {
        let after = &rest[open + "token(".len()..];
        let end = after.find([',', ')']).unwrap_or(after.len());
        let arg = after[..end].trim().trim_matches(['\'', '"']);
        let key = strip_modifier(arg);
        if dict.token(key).is_some() {
            emit(key);
        }
        embedded = true;
        rest = &after[end..];
    }

    // A whole-value token path (e.g. `'--ring': 'colors.red.400'`). Skip when the
    // value already carried `{…}` / `token(…)` references handled above.
    if !embedded {
        let key = strip_modifier(raw.trim());
        if !key.is_empty() && dict.token(key).is_some() {
            emit(key);
        }
    }
}

/// A key that nests a style object rather than naming a property: a configured
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
