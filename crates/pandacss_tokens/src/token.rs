//! One resolved token plus its wire form and builder-style constructors.

use std::sync::Arc;

use rustc_hash::FxHashMap;

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

use crate::category::TokenCategory;

// PERF(port): FxHashMap because extension keys are short well-known strings
// (`theme`, `isSemantic`, `prop`, …) where FxHash beats SipHash decisively.
pub type TokenExtensions = FxHashMap<String, String>;

/// One resolved token. `condition: None` is the base / unconditional variant.
///
/// `extensions: Option<Box<...>>` keeps the no-metadata case (the vast
/// majority of tokens) to one nullable pointer instead of an inline 48-byte
/// `HashMap` — saves ~40 bytes per token and avoids a heap allocation when
/// building dictionaries with thousands of plain tokens.
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(from = "TokenWire", into = "TokenWire"))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct Token {
    pub path: Arc<str>,
    pub value: Arc<str>,
    pub var: Arc<str>,
    pub category: TokenCategory,
    pub condition: Option<Arc<str>>,
    /// Pre-alias-substitution value. Optional because the JS path strips
    /// it once references are expanded.
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub original_value: Option<Arc<str>>,
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub description: Option<Arc<str>>,
    #[cfg_attr(feature = "serde", serde(default))]
    pub deprecated: bool,
    /// Author-provided deprecation message (`deprecated: 'use X instead'`).
    /// `None` when deprecated via plain `true`.
    #[cfg_attr(
        feature = "serde",
        serde(default, skip_serializing_if = "Option::is_none")
    )]
    pub deprecated_reason: Option<Arc<str>>,
    #[cfg_attr(
        feature = "serde",
        serde(default, skip_serializing_if = "Option::is_none")
    )]
    pub extensions: Option<Box<TokenExtensions>>,
}

#[cfg(feature = "serde")]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TokenWire {
    path: String,
    value: String,
    var: String,
    category: TokenCategory,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    condition: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    original_value: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(default)]
    deprecated: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    deprecated_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    extensions: Option<Box<TokenExtensions>>,
}

#[cfg(feature = "serde")]
impl From<TokenWire> for Token {
    fn from(value: TokenWire) -> Self {
        Self {
            path: Arc::from(value.path),
            value: Arc::from(value.value),
            var: Arc::from(value.var),
            category: value.category,
            condition: value.condition.map(Arc::from),
            original_value: value.original_value.map(Arc::from),
            description: value.description.map(Arc::from),
            deprecated: value.deprecated,
            deprecated_reason: value.deprecated_reason.map(Arc::from),
            extensions: value.extensions,
        }
    }
}

#[cfg(feature = "serde")]
impl From<Token> for TokenWire {
    fn from(value: Token) -> Self {
        Self {
            path: value.path.to_string(),
            value: value.value.to_string(),
            var: value.var.to_string(),
            category: value.category,
            condition: value.condition.map(|value| value.to_string()),
            original_value: value.original_value.map(|value| value.to_string()),
            description: value.description.map(|value| value.to_string()),
            deprecated: value.deprecated,
            deprecated_reason: value.deprecated_reason.map(|value| value.to_string()),
            extensions: value.extensions,
        }
    }
}

impl Token {
    #[must_use]
    pub fn new(
        path: impl AsRef<str>,
        value: impl AsRef<str>,
        var: impl AsRef<str>,
        category: TokenCategory,
    ) -> Self {
        Self {
            path: Arc::from(path.as_ref()),
            value: Arc::from(value.as_ref()),
            var: Arc::from(var.as_ref()),
            category,
            condition: None,
            original_value: None,
            description: None,
            deprecated: false,
            deprecated_reason: None,
            extensions: None,
        }
    }

    #[must_use]
    pub fn with_condition(mut self, condition: impl AsRef<str>) -> Self {
        self.condition = Some(Arc::from(condition.as_ref()));
        self
    }

    #[must_use]
    pub fn with_description(mut self, description: impl AsRef<str>) -> Self {
        self.description = Some(Arc::from(description.as_ref()));
        self
    }

    #[must_use]
    pub fn deprecated(mut self) -> Self {
        self.deprecated = true;
        self
    }

    #[must_use]
    pub fn deprecated_with_reason(mut self, reason: impl AsRef<str>) -> Self {
        self.deprecated = true;
        self.deprecated_reason = Some(Arc::from(reason.as_ref()));
        self
    }

    #[must_use]
    pub fn extension(&self, key: &str) -> Option<&str> {
        self.extensions
            .as_deref()
            .and_then(|m| m.get(key))
            .map(String::as_str)
    }

    /// Lazily allocates the underlying map on first write so tokens with
    /// no extensions never pay the allocation cost.
    pub fn set_extension(&mut self, key: impl Into<String>, value: impl Into<String>) {
        self.extensions
            .get_or_insert_with(|| Box::new(FxHashMap::default()))
            .insert(key.into(), value.into());
    }

    pub fn extension_entries(&self) -> impl Iterator<Item = (&str, &str)> + '_ {
        self.extensions
            .as_deref()
            .into_iter()
            .flat_map(|m| m.iter().map(|(k, v)| (k.as_str(), v.as_str())))
    }
}
