use crate::{ImportRecord, ImportScanResult, ImportSpecifierKind, Resolver};
use rustc_hash::{FxHashMap, FxHashSet};
use serde::Serialize;

// Re-export so extractor consumers don't need a separate `tokens` import.
pub use tokens::TokenDictionary;

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

/// Which imported names qualify for a category. `Any` matches anything
/// (used by recipes/patterns where allowed names are user-defined);
/// `Only(set)` restricts to the given allowlist (used by css → css/cva/sva).
/// Backed by an `FxHashSet` — non-cryptographic hash for short, internal,
/// trusted keys; ~2× faster than `std::HashSet` on names like `"css"`.
#[derive(Debug, Clone)]
pub enum NameMatcher {
    Any,
    Only(FxHashSet<String>),
}

impl Default for NameMatcher {
    /// An empty `Only` — accepts nothing — so a default-constructed matcher
    /// is inert, not "accept everything".
    fn default() -> Self {
        Self::Only(FxHashSet::default())
    }
}

impl NameMatcher {
    /// Construct an `Only` matcher from any iterable of name-like values.
    /// Lets call sites stay readable (`NameMatcher::only(["css", "cva"])`)
    /// without needing `FxHashSet::from(...)` boilerplate.
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

/// One category's matching rule. `modules` is the list of module specifiers
/// that count as Panda imports for this category (substring-matched against
/// the source import).
#[derive(Debug, Clone, Default)]
pub struct Matcher {
    pub modules: Vec<String>,
    pub names: NameMatcher,
}

/// Pre-built matchers for each Panda category. The TS bridge constructs
/// this from `context.config.importMap` plus JSX/recipe/pattern names.
/// Purely import-matching config — no runtime extraction state. Runtime
/// inputs like the resolved token dictionary live on [`ExtractorConfig`].
#[derive(Debug, Clone, Default)]
pub struct Matchers {
    pub css: Matcher,
    pub recipe: Matcher,
    pub pattern: Matcher,
    pub jsx: Option<Matcher>,
    pub tokens: Matcher,
    /// JSX factory names that accept member-chain tags like
    /// `<styled.div>`. `None` falls back to the built-in default
    /// (`["styled"]`); `Some(list)` replaces the default — useful when
    /// a Panda preset renames the factory or adds aliases (`panda.css`
    /// alongside `styled`).
    pub jsx_factories: Option<Vec<String>>,
}

/// Full extractor configuration: import matchers plus any runtime state
/// the extractor needs (resolved token dictionary, cross-file resolver,
/// etc.). Keep this separate from [`Matchers`] so the import-matching
/// config stays small and reusable.
#[derive(Debug, Default)]
pub struct ExtractorConfig {
    pub matchers: Matchers,
    /// Resolved token values. When `Some`, `token('x.y')` calls fold to
    /// the looked-up value via the [`tokens`] crate. `None` disables
    /// token resolution entirely.
    pub token_dictionary: Option<TokenDictionary>,
    /// Cross-file import resolver. When `Some`, references to imported
    /// `const` exports from local files (`import { brand } from
    /// './tokens'`) are loaded and folded at extraction time. The
    /// resolver's internal cache is shared across every `extract()`
    /// call that uses this config, so build a config once per session
    /// and reuse it for the full file batch.
    pub cross_file: Option<crate::CrossFileResolver>,
}

impl ExtractorConfig {
    /// Convenience: wrap a `Matchers` config with no runtime state.
    /// Equivalent to `ExtractorConfig { matchers, token_dictionary:
    /// None, cross_file: None }`.
    #[must_use]
    pub fn new(matchers: Matchers) -> Self {
        Self {
            matchers,
            token_dictionary: None,
            cross_file: None,
        }
    }

    /// Builder-style attach a token dictionary.
    #[must_use]
    pub fn with_token_dictionary(mut self, dictionary: TokenDictionary) -> Self {
        self.token_dictionary = Some(dictionary);
        self
    }

    /// Builder-style attach a cross-file resolver.
    #[must_use]
    pub fn with_cross_file(mut self, resolver: crate::CrossFileResolver) -> Self {
        self.cross_file = Some(resolver);
        self
    }
}

impl Matchers {
    /// `true` if the given `name` is acceptable for `category` under the
    /// current `Matchers` configuration. Used by the call-site and JSX
    /// visitors to validate namespace property names (`p.css` is OK only if
    /// `css` is in the css matcher's allowlist).
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

/// Per-file context shared between the call and JSX visitors. Owns the
/// alias lookup and an optional [`Resolver`] for same-file scope resolution
/// so visitor code doesn't have to thread arguments through every helper.
pub(crate) struct VisitorContext<'a> {
    pub aliases: FxHashMap<&'a str, &'a MatchedImport>,
    pub matchers: &'a Matchers,
    /// `None` for the stage-by-stage entrypoints (`extract_calls`,
    /// `extract_jsx`) which re-parse and skip semantic-build cost for
    /// targeted testing. `Some` for the combined `extract()` hot path.
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

/// Filter a scan result against Panda import-map rules. Thin wrapper over
/// [`match_import_records`] that takes the same shape as `scan_imports`
/// returns.
#[must_use]
pub fn match_imports(scan: &ImportScanResult, matchers: &Matchers) -> Vec<MatchedImport> {
    match_import_records(&scan.imports, matchers)
}

/// Filter raw import records against Panda import-map rules. Default and
/// side-effect imports never match (TS does the same). Type-only imports
/// (declaration- or specifier-level) are skipped.
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

/// Module match is *substring* by design — Panda's JS `ImportMap.match()`
/// uses the same rule so configs like `modules: ["panda/css"]` match both
/// `@my-org/panda/css` and `styled-system/css`. The trade-off is that an
/// accidentally short candidate (e.g. `"css"`) would over-match. The
/// reviewer flagged this as worth pinning with tests; see
/// `tests/import_map.rs` for the overlap cases that lock in the
/// category-priority order.
fn mod_matches(module: &str, candidates: &[String]) -> bool {
    candidates.iter().any(|c| module.contains(c.as_str()))
}
