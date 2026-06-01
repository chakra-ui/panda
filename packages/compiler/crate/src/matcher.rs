use crate::ImportSpecifierKind;
use crate::convert::{matched_record, to_core_matchers};
use napi_derive::napi;

#[napi(string_enum = "camelCase")]
pub enum MatchCategory {
    Css,
    Recipe,
    Pattern,
    Jsx,
    Tokens,
}

#[napi(object)]
pub struct Matcher {
    pub modules: Vec<String>,
    /// Omit to match any imported name (used for recipes/patterns).
    pub names: Option<Vec<String>>,
}

#[napi(object)]
pub struct Matchers {
    pub css: Matcher,
    pub recipe: Matcher,
    pub pattern: Matcher,
    pub jsx: Option<Matcher>,
    pub tokens: Matcher,
    /// When present, `token('path')` / `token.var('path')` fold during
    /// extraction. Pass parallel JS maps: `values[path]` → raw value,
    /// `vars[path]` → CSS-var form. Omit to disable.
    pub token_dictionary: Option<TokenDictionary>,
    /// JSX factory names accepting member-chain tags (`<styled.div>`).
    /// Omit for the built-in `["styled"]` default; `Some(list)` replaces
    /// it outright (not additive).
    pub jsx_factories: Option<Vec<String>>,
}

#[napi(object)]
#[derive(Clone, serde::Serialize)]
pub struct TokenDictionary {
    pub values: std::collections::HashMap<String, String>,
    pub vars: std::collections::HashMap<String, String>,
}

pub(crate) fn from_core_token_dictionary(
    dictionary: &pandacss_tokens::TokenDictionary,
) -> TokenDictionary {
    let (values, vars) = dictionary.flat_maps();
    TokenDictionary {
        values: values.into_iter().collect(),
        vars: vars.into_iter().collect(),
    }
}

#[napi(object)]
pub struct MatchedImport {
    pub category: MatchCategory,
    pub module: String,
    pub name: String,
    pub alias: String,
    pub kind: ImportSpecifierKind,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned arguments"
)]
pub fn match_imports(scan: crate::ImportScanResult, matchers: Matchers) -> Vec<MatchedImport> {
    let records: Vec<pandacss_extractor::ImportRecord> =
        scan.imports.into_iter().map(to_core_record).collect();
    let core_matchers = to_core_matchers(matchers);
    pandacss_extractor::match_import_records(&records, &core_matchers)
        .into_iter()
        .map(matched_record)
        .collect()
}

pub(crate) fn to_core_record(r: crate::ImportRecord) -> pandacss_extractor::ImportRecord {
    pandacss_extractor::ImportRecord {
        module: r.module,
        kind: match r.kind {
            crate::ImportKind::SideEffect => pandacss_extractor::ImportKind::SideEffect,
            crate::ImportKind::Value => pandacss_extractor::ImportKind::Value,
        },
        type_only: r.type_only,
        specifiers: r
            .specifiers
            .into_iter()
            .map(|s| pandacss_extractor::ImportSpecifier {
                kind: match s.kind {
                    ImportSpecifierKind::Named => pandacss_extractor::ImportSpecifierKind::Named,
                    ImportSpecifierKind::Default => {
                        pandacss_extractor::ImportSpecifierKind::Default
                    }
                    ImportSpecifierKind::Namespace => {
                        pandacss_extractor::ImportSpecifierKind::Namespace
                    }
                },
                imported: s.imported,
                local: s.local,
                type_only: s.type_only,
                span: pandacss_extractor::Span {
                    start: s.span.start,
                    end: s.span.end,
                },
            })
            .collect(),
        span: pandacss_extractor::Span {
            start: r.span.start,
            end: r.span.end,
        },
    }
}
