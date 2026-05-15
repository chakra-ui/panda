use crate::{ImportScanResult, ImportSpecifierKind};
use serde::Serialize;

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

/// One category's matching rule. `modules` is the list of module specifiers
/// that count as Panda imports for this category (substring-matched against
/// the source import). `names`, when `Some`, restricts which named imports
/// qualify; `None` matches any name (used for recipes/patterns where the
/// allowed names depend on user config).
#[derive(Debug, Clone)]
pub struct Matcher {
    pub modules: Vec<String>,
    pub names: Option<Vec<String>>,
}

impl Default for Matcher {
    fn default() -> Self {
        Self {
            modules: Vec::new(),
            names: Some(Vec::new()),
        }
    }
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

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MatchedImport {
    pub category: MatchCategory,
    pub module: String,
    pub name: String,
    pub alias: String,
    pub kind: ImportSpecifierKind,
}

/// Filter raw scan results against Panda import-map rules. Default and
/// side-effect imports never match (TS does the same). Type-only imports
/// (declaration- or specifier-level) are skipped.
#[must_use]
pub fn match_imports(scan: &ImportScanResult, matchers: &Matchers) -> Vec<MatchedImport> {
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
    for record in &scan.imports {
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
                    && !name_matches(&specifier.imported, matcher.names.as_deref())
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

fn name_matches(name: &str, allowed: Option<&[String]>) -> bool {
    match allowed {
        None => true,
        Some(list) => list.iter().any(|n| n == name),
    }
}
