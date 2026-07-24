//! Position-carrying source inspection for tooling (reporting, lint, IDE).
//! `inspect_file_source()` re-extracts a file and classifies each site (token,
//! property, recipe, pattern, keyframe) using the engine's own token
//! dictionary, utilities, and keyframes.

use pandacss_encoder::ConditionMatcher;
use pandacss_extractor::{
    ExtractedCall, LineIndex, Literal, MatchCategory, StyleSourceOwnerKind, StyleSourceRef,
    extract_verbose,
};
use pandacss_tokens::{TokenCategory, TokenDictionary, TokenSuggestion};
use pandacss_utility::Utility;
use rustc_hash::FxHashMap;

use crate::inspection::{
    FileInspectionResult, StyleEntryInput, StyleEntryKind, StyleEntryOwner, StyleEntryRef,
    StyleEntrySyntax, UsageKind, UsageSite, ValueSpanRef, call_view, component_entry, jsx_view,
    style_entry, token_ref_site, token_value_ref,
};
use crate::{Project, ProjectConditionMatcher, SourceRange, Span};

struct Cx<'a> {
    utility: Option<&'a Utility>,
    tokens: Option<&'a TokenDictionary>,
    conditions: &'a ProjectConditionMatcher,
    keyframes: &'a rustc_hash::FxHashSet<String>,
}

impl Project {
    /// Classifies every Panda usage in a file with its source range, plus
    /// file-local diagnostics. On-demand — not part of the build path.
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
    pub fn suggest_tokens(&self, prop: &str, value: &str) -> Vec<TokenSuggestion> {
        let Some(utility) = self.config.utility() else {
            return Vec::new();
        };
        let canonical = utility.resolve_shorthand(prop);
        let Some(category) = utility.token_category(canonical) else {
            return Vec::new();
        };
        let Some(dict) = self.config.token_dictionary() else {
            return Vec::new();
        };
        dict.suggest_tokens(&TokenCategory::from_path_segment(category), value)
    }

    /// Semantic tokens that carry the same value as `path`, ranked for tooling.
    #[must_use]
    pub fn suggest_semantic_tokens(&self, path: &str) -> Vec<TokenSuggestion> {
        let Some(dict) = self.config.token_dictionary() else {
            return Vec::new();
        };
        dict.suggest_semantic_tokens(path)
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
#[allow(
    clippy::too_many_lines,
    reason = "each MatchCategory arm is an independent style walk"
)]
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
        (MatchCategory::Css, "css") => {
            // `css(a, b, …)` merges every arg, so inspect them all.
            for index in 0..call.data.len() {
                if let Some(entries) = call_object(call, index) {
                    walk_object(entries, ctx.cx, &range, accum.sites);
                    collector.collect(
                        entries,
                        StyleEntrySyntax::CssCall,
                        &mut Vec::new(),
                        accum.style_entries,
                    );
                }
            }
        }
        // The recipe config is the first argument for both `cva` and `sva`.
        (MatchCategory::Css, "cva") => {
            collect_recipe(
                call_object(call, 0),
                false,
                &RecipeWalkCtx {
                    cx: ctx.cx,
                    range: &range,
                    collector: &collector,
                },
                accum,
            );
        }
        (MatchCategory::Css, "sva") => {
            collect_recipe(
                call_object(call, 0),
                true,
                &RecipeWalkCtx {
                    cx: ctx.cx,
                    range: &range,
                    collector: &collector,
                },
                accum,
            );
        }
        (MatchCategory::Css, "viewTransition") => {
            if let Some(entries) = call_object(call, 0) {
                for (key, value) in entries {
                    if !matches!(key.as_str(), "group" | "imagePair" | "old" | "new") {
                        continue;
                    }
                    let Literal::Object(slot) = value else {
                        continue;
                    };
                    walk_object(slot, ctx.cx, &range, accum.sites);
                    collector.collect(
                        slot,
                        StyleEntrySyntax::CssCall,
                        &mut Vec::new(),
                        accum.style_entries,
                    );
                }
            }
        }
        // `styled('div', config)` puts config at arg 1; `styled.div(config)` at
        // arg 0. A config with recipe keys is walked as a recipe, else flat.
        (MatchCategory::Jsx, _) => {
            if let Some(config) = call_object(call, 1).or_else(|| call_object(call, 0)) {
                if has_recipe_keys(config) {
                    collect_recipe(
                        Some(config),
                        false,
                        &RecipeWalkCtx {
                            cx: ctx.cx,
                            range: &range,
                            collector: &collector,
                        },
                        accum,
                    );
                } else {
                    walk_object(config, ctx.cx, &range, accum.sites);
                    collector.collect(
                        config,
                        StyleEntrySyntax::CssCall,
                        &mut Vec::new(),
                        accum.style_entries,
                    );
                }
            }
        }
        (MatchCategory::Recipe, _) => {
            accum
                .sites
                .push(site(UsageKind::Recipe, &call.name, &range));
        }
        (MatchCategory::Pattern, _) => {
            accum
                .sites
                .push(site(UsageKind::Pattern, &call.name, &range));
        }
        _ => {}
    }
}

/// The object literal at argument `index` of an extracted call, if present.
fn call_object(call: &ExtractedCall, index: usize) -> Option<&[(String, Literal)]> {
    match call.data.get(index) {
        Some(Some(Literal::Object(entries))) => Some(entries),
        _ => None,
    }
}

/// Whether a factory config carries recipe keys (`base`/`variants`/…) rather
/// than being a flat style object.
fn has_recipe_keys(config: &[(String, Literal)]) -> bool {
    config.iter().any(|(key, _)| {
        matches!(
            key.as_str(),
            "base" | "variants" | "defaultVariants" | "compoundVariants"
        )
    })
}

/// Shared context for walking a recipe config's style objects.
struct RecipeWalkCtx<'a, 'source> {
    cx: &'a Cx<'a>,
    range: &'a SourceRange,
    collector: &'a StyleEntryCollector<'a, 'source>,
}

/// Walks a recipe config and collects the style objects it holds: `base`,
/// every `variants.<key>.<value>`, and each `compoundVariants[].css`. Slotted
/// recipes (`sva`) nest a slot level inside each style object.
fn collect_recipe(
    config: Option<&[(String, Literal)]>,
    slotted: bool,
    walk: &RecipeWalkCtx<'_, '_>,
    accum: &mut InspectAccum<'_>,
) {
    let Some(config) = config else { return };
    for (key, value) in config {
        match key.as_str() {
            "base" => recipe_style(value, slotted, &["base".to_owned()], walk, accum),
            "variants" => {
                if let Literal::Object(variants) = value {
                    for (variant, options) in variants {
                        if let Literal::Object(options) = options {
                            for (option, style) in options {
                                recipe_style(
                                    style,
                                    slotted,
                                    &["variants".to_owned(), variant.clone(), option.clone()],
                                    walk,
                                    accum,
                                );
                            }
                        }
                    }
                }
            }
            "compoundVariants" => {
                if let Literal::Array(items) = value {
                    for (index, item) in items.iter().enumerate() {
                        if let Literal::Object(entries) = item
                            && let Some((_, css)) = entries.iter().find(|(key, _)| key == "css")
                        {
                            recipe_style(
                                css,
                                slotted,
                                &[
                                    "compoundVariants".to_owned(),
                                    index.to_string(),
                                    "css".to_owned(),
                                ],
                                walk,
                                accum,
                            );
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

/// Collects one recipe style object at `base_path`. A slotted value is
/// `{ slot: styleObject }`; otherwise it's the style object directly.
fn recipe_style(
    value: &Literal,
    slotted: bool,
    base_path: &[String],
    walk: &RecipeWalkCtx<'_, '_>,
    accum: &mut InspectAccum<'_>,
) {
    let Literal::Object(entries) = value else {
        return;
    };
    if slotted {
        for (slot, slot_value) in entries {
            if let Literal::Object(style) = slot_value {
                let mut path = base_path.to_vec();
                path.push(slot.clone());
                walk_object(style, walk.cx, walk.range, accum.sites);
                walk.collector.collect(
                    style,
                    StyleEntrySyntax::RecipeCall,
                    &mut path,
                    accum.style_entries,
                );
            }
        }
    } else {
        let mut path = base_path.to_vec();
        walk_object(entries, walk.cx, walk.range, accum.sites);
        walk.collector.collect(
            entries,
            StyleEntrySyntax::RecipeCall,
            &mut path,
            accum.style_entries,
        );
    }
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

            // A `Literal::Token` already has its path via `token_refs`, so skip
            // the category-relative heuristic to avoid duplicate sites.
            if let Some(dict) = cx.tokens
                && !matches!(value, Literal::Token { .. })
            {
                // Bare category-relative value on a known utility, e.g.
                // `color: 'red.300'` (optionally `red.300/40`).
                if let Some(utility) = cx.utility
                    && let Some(category) = utility.token_category(prop)
                {
                    let path = format!("{category}.{}", strip_modifier(raw));
                    if dict.token(&path).is_some() {
                        sites.push(site(UsageKind::Token, &path, range));
                    }
                }
                collect_token_refs(raw, dict, &mut |path| {
                    sites.push(site(UsageKind::Token, path, range));
                });
            }

            // Match each whitespace/comma-separated word against the keyframe
            // set, catching shorthands (`spin 1s linear`) and lists (`spin, fade`).
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

    // A whole-value token path, e.g. `'--ring': 'colors.red.400'`. Skip if the
    // value already carried a `{…}`/`token(…)` reference handled above.
    if !embedded {
        let key = strip_modifier(raw.trim());
        if !key.is_empty() && dict.token(key).is_some() {
            emit(key);
        }
    }
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
