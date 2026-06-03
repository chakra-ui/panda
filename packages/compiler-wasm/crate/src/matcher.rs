//! JS-shaped matcher input — deserialized from a plain JS object via
//! `serde-wasm-bindgen`, then converted to the core
//! `pandacss_extractor::Matchers` type for extraction.

use pandacss_extractor::{Matcher, Matchers, NameMatcher};
use serde::{Deserialize, Serialize};

/// Matchers config the JS host passes in. Shape mirrors the napi
/// binding's `Matchers` so JS callers can construct it the same way.
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct MatchersInput {
    pub css: MatcherInput,
    pub recipe: MatcherInput,
    pub pattern: MatcherInput,
    pub jsx: Option<MatcherInput>,
    pub tokens: MatcherInput,
    pub jsx_framework: Option<String>,
    pub jsx_factories: Option<Vec<String>>,
    pub token_dictionary: Option<TokenDictionaryInput>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct MatcherInput {
    pub modules: Vec<String>,
    /// `None` (or omitted) → any imported name matches. Used by
    /// recipes/patterns where allowed names are user-defined.
    pub names: Option<Vec<String>>,
}

#[derive(Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct TokenDictionaryInput {
    pub values: std::collections::HashMap<String, String>,
    pub vars: std::collections::HashMap<String, String>,
}

pub(crate) fn from_core_token_dictionary(
    dictionary: &pandacss_tokens::TokenDictionary,
) -> TokenDictionaryInput {
    let (values, vars) = dictionary.flat_maps();
    TokenDictionaryInput {
        values: values.into_iter().collect(),
        vars: vars.into_iter().collect(),
    }
}

pub(crate) fn to_core_matchers(input: MatchersInput) -> Matchers {
    Matchers {
        css: to_core_matcher(input.css),
        recipe: to_core_matcher(input.recipe),
        pattern: to_core_matcher(input.pattern),
        jsx: input.jsx.map(to_core_matcher),
        tokens: to_core_matcher(input.tokens),
        jsx_factories: input.jsx_factories,
    }
}

fn to_core_matcher(input: MatcherInput) -> Matcher {
    Matcher {
        modules: input.modules,
        names: match input.names {
            None => NameMatcher::Any,
            Some(list) => NameMatcher::only(list),
        },
    }
}

pub(crate) fn to_core_token_dictionary(
    input: TokenDictionaryInput,
) -> pandacss_extractor::TokenDictionary {
    pandacss_extractor::TokenDictionary::builder()
        .extend_flat(input.values, &input.vars)
        .build()
}
