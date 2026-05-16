use crate::{ImportRecord, ImportScanResult, ImportSpecifierKind, Resolver};
use rustc_hash::{FxHashMap, FxHashSet};
use serde::Serialize;

pub use pandacss_tokens::TokenDictionary;

/// Panda category a matched import resolves to. Mirrors the JS
/// `ImportMap.matchers` keys in `packages/core/src/import-map.ts`.
#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum MatchCategory {
    Css,
    Recipe,
    Pattern,
    Jsx,
    Tokens,
}

/// `Any` matches anything (recipes/patterns where names are user-defined);
/// `Only(set)` restricts to an allowlist (css → css/cva/sva).
// PERF(port): FxHashSet on short trusted keys like "css" is ~2× faster
// than std::HashSet's SipHash.
#[derive(Debug, Clone)]
pub enum NameMatcher {
    Any,
    Only(FxHashSet<String>),
}

impl Default for NameMatcher {
    /// Empty `Only` so a default-constructed matcher is inert, not
    /// "accept everything".
    fn default() -> Self {
        Self::Only(FxHashSet::default())
    }
}

impl NameMatcher {
    /// `NameMatcher::only(["css", "cva"])` without the `FxHashSet::from`
    /// boilerplate at call sites.
    pub fn only<I, S>(names: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        Self::Only(names.into_iter().map(Into::into).collect())
    }

    #[must_use]
    pub fn accepts(&self, name: &str) -> bool {
        match self {
            Self::Any => true,
            Self::Only(set) => set.contains(name),
        }
    }
}

/// One category's matching rule. `modules` is substring-matched against
/// the source import (see [`mod_matches`]).
#[derive(Debug, Clone, Default)]
pub struct Matcher {
    pub modules: Vec<String>,
    pub names: NameMatcher,
}

/// Pre-built matchers for each Panda category. Constructed by the TS
/// bridge from `context.config.importMap` plus JSX/recipe/pattern names.
/// Purely import-matching config — runtime extraction state lives on
/// [`ExtractorConfig`].
#[derive(Debug, Clone, Default)]
pub struct Matchers {
    pub css: Matcher,
    pub recipe: Matcher,
    pub pattern: Matcher,
    pub jsx: Option<Matcher>,
    pub tokens: Matcher,
    /// JSX factories that accept member-chain tags like `<styled.div>`.
    /// `None` falls back to the built-in `["styled"]`; `Some(list)`
    /// replaces the default — useful when a preset renames the factory
    /// or adds aliases (`panda.css` alongside `styled`).
    pub jsx_factories: Option<Vec<String>>,
}

/// Full extractor configuration: import matchers plus the runtime state
/// the extractor needs (resolved token dictionary, cross-file resolver).
/// Separate from [`Matchers`] so the import-matching config stays small
/// and reusable.
#[derive(Debug, Default)]
pub struct ExtractorConfig {
    pub matchers: Matchers,
    /// When `Some`, `token('x.y')` calls fold to the looked-up value.
    pub token_dictionary: Option<TokenDictionary>,
    /// When `Some`, references to imported `const` exports from local
    /// files are loaded and folded at extraction time. The resolver's
    /// internal cache is shared across every `extract()` call that uses
    /// this config — build once per session and reuse across the batch.
    pub cross_file: Option<crate::CrossFileResolver>,
}

impl ExtractorConfig {
    #[must_use]
    pub fn new(matchers: Matchers) -> Self {
        Self {
            matchers,
            token_dictionary: None,
            cross_file: None,
        }
    }

    #[must_use]
    pub fn with_token_dictionary(mut self, dictionary: TokenDictionary) -> Self {
        self.token_dictionary = Some(dictionary);
        self
    }

    #[must_use]
    pub fn with_cross_file(mut self, resolver: crate::CrossFileResolver) -> Self {
        self.cross_file = Some(resolver);
        self
    }
}

impl Matchers {
    /// Used by the call-site and JSX visitors to validate namespace
    /// property names (`p.css` is OK only if `css` is in the css
    /// matcher's allowlist).
    #[must_use]
    pub fn category_accepts_name(&self, category: MatchCategory, name: &str) -> bool {
        let matcher = match category {
            MatchCategory::Css => &self.css,
            MatchCategory::Recipe => &self.recipe,
            MatchCategory::Pattern => &self.pattern,
            MatchCategory::Tokens => &self.tokens,
            MatchCategory::Jsx => match self.jsx.as_ref() {
                Some(m) => m,
                None => return false,
            },
        };
        matcher.names.accepts(name)
    }
}

/// Per-file context shared between the call and JSX visitors.
pub(crate) struct VisitorContext<'a> {
    pub aliases: FxHashMap<&'a str, &'a MatchedImport>,
    pub matchers: &'a Matchers,
    /// `None` for staged entrypoints (`extract_calls`, `extract_jsx`)
    /// that skip semantic-build cost; `Some` for the combined `extract()`
    /// hot path.
    pub resolver: Option<&'a Resolver<'a>>,
}

impl<'a> VisitorContext<'a> {
    pub(crate) fn new(matched: &'a [MatchedImport], matchers: &'a Matchers) -> Self {
        Self {
            aliases: matched.iter().map(|m| (m.alias.as_str(), m)).collect(),
            matchers,
            resolver: None,
        }
    }

    pub(crate) fn with_resolver(mut self, resolver: &'a Resolver<'a>) -> Self {
        self.resolver = Some(resolver);
        self
    }
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MatchedImport {
    pub category: MatchCategory,
    pub module: String,
    pub name: String,
    pub alias: String,
    pub kind: ImportSpecifierKind,
}

#[must_use]
pub fn match_imports(scan: &ImportScanResult, matchers: &Matchers) -> Vec<MatchedImport> {
    match_import_records(&scan.imports, matchers)
}

/// Default and side-effect imports never match (TS does the same).
/// Type-only imports (declaration or specifier level) are skipped.
#[must_use]
pub fn match_import_records(records: &[ImportRecord], matchers: &Matchers) -> Vec<MatchedImport> {
    let categories: [(MatchCategory, &Matcher); 5] = [
        (MatchCategory::Css, &matchers.css),
        (MatchCategory::Tokens, &matchers.tokens),
        (MatchCategory::Recipe, &matchers.recipe),
        (MatchCategory::Pattern, &matchers.pattern),
        (
            MatchCategory::Jsx,
            matchers.jsx.as_ref().unwrap_or(&matchers.recipe),
        ),
    ];

    let mut out = Vec::new();
    for record in records {
        if record.type_only {
            continue;
        }
        for specifier in &record.specifiers {
            if specifier.type_only {
                continue;
            }
            if specifier.kind == ImportSpecifierKind::Default {
                continue;
            }
            for (category, matcher) in &categories {
                if *category == MatchCategory::Jsx && matchers.jsx.is_none() {
                    continue;
                }
                if !mod_matches(&record.module, &matcher.modules) {
                    continue;
                }
                if specifier.kind != ImportSpecifierKind::Namespace
                    && !matcher.names.accepts(&specifier.imported)
                {
                    continue;
                }
                out.push(MatchedImport {
                    category: *category,
                    module: record.module.clone(),
                    name: specifier.imported.clone(),
                    alias: specifier.local.clone(),
                    kind: specifier.kind,
                });
                break;
            }
        }
    }
    out
}

// PORT NOTE: substring match by design — Panda's JS `ImportMap.match()`
// does the same so configs like `modules: ["panda/css"]` match both
// `@my-org/panda/css` and `styled-system/css`. A pathologically short
// candidate (`"css"`) would over-match; `tests/import_map.rs` locks in
// the category-priority order for overlap cases.
fn mod_matches(module: &str, candidates: &[String]) -> bool {
    candidates.iter().any(|c| module.contains(c.as_str()))
}
