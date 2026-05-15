use crate::{ImportRecord, ImportScanResult, ImportSpecifierKind};
use serde::Serialize;
use std::collections::HashMap;

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
/// `Only(list)` restricts to the given allowlist (used by css → css/cva/sva).
#[derive(Debug, Clone)]
pub enum NameMatcher {
    Any,
    Only(Vec<String>),
}

impl Default for NameMatcher {
    /// An empty `Only` — accepts nothing — so a default-constructed matcher
    /// is inert, not "accept everything".
    fn default() -> Self {
        Self::Only(Vec::new())
    }
}

impl NameMatcher {
    #[must_use]
    pub fn accepts(&self, name: &str) -> bool {
        match self {
            Self::Any => true,
            Self::Only(list) => list.iter().any(|n| n == name),
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
#[derive(Debug, Clone, Default)]
pub struct Matchers {
    pub css: Matcher,
    pub recipe: Matcher,
    pub pattern: Matcher,
    pub jsx: Option<Matcher>,
    pub tokens: Matcher,
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
/// alias lookup so visitor code doesn't have to thread three arguments
/// (program, aliases, matchers) through every helper.
pub(crate) struct VisitorContext<'a> {
    pub aliases: HashMap<&'a str, &'a MatchedImport>,
    pub matchers: &'a Matchers,
}

impl<'a> VisitorContext<'a> {
    pub(crate) fn new(matched: &'a [MatchedImport], matchers: &'a Matchers) -> Self {
        Self {
            aliases: matched.iter().map(|m| (m.alias.as_str(), m)).collect(),
            matchers,
        }
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

fn mod_matches(module: &str, candidates: &[String]) -> bool {
    candidates.iter().any(|c| module.contains(c.as_str()))
}
