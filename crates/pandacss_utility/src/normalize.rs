//! Style-object normalization: shorthand resolution and responsive-array
//! keying, both as a standalone pass and as an encoder `NormalizeAtomic` impl.

use std::borrow::Cow;

use pandacss_extractor::Literal;

use crate::Utility;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ShorthandPolicy {
    #[default]
    UserFacing,
    Internal,
}

pub struct StyleNormalizer<'a> {
    pub utility: Option<&'a Utility>,
    pub breakpoints: &'a [String],
    pub policy: ShorthandPolicy,
}

impl<'a> StyleNormalizer<'a> {
    #[must_use]
    pub fn new(
        utility: Option<&'a Utility>,
        breakpoints: &'a [String],
        policy: ShorthandPolicy,
    ) -> Self {
        Self {
            utility,
            breakpoints,
            policy,
        }
    }

    #[must_use]
    pub fn user_facing(utility: Option<&'a Utility>, breakpoints: &'a [String]) -> Self {
        Self::new(utility, breakpoints, ShorthandPolicy::UserFacing)
    }

    #[must_use]
    pub fn internal(utility: Option<&'a Utility>, breakpoints: &'a [String]) -> Self {
        Self::new(utility, breakpoints, ShorthandPolicy::Internal)
    }

    fn resolves_shorthands(&self) -> bool {
        match self.policy {
            ShorthandPolicy::Internal => true,
            ShorthandPolicy::UserFacing => self.utility.is_some_and(Utility::shorthands_enabled),
        }
    }

    fn canonical_key<'b>(&'b self, key: &'b str) -> &'b str {
        if !self.resolves_shorthands() {
            return key;
        }
        self.utility
            .map_or(key, |utility| utility.canonical_property(key))
    }

    #[must_use]
    pub fn normalize<'b>(&self, style: &'b Literal) -> Cow<'b, Literal> {
        if self.utility.is_none() && self.breakpoints.is_empty() {
            return Cow::Borrowed(style);
        }
        Cow::Owned(self.normalize_owned(style))
    }

    fn normalize_owned(&self, style: &Literal) -> Literal {
        match style {
            Literal::Object(entries) => {
                let mut out = Vec::with_capacity(entries.len());

                for (key, value) in entries {
                    let key = self.canonical_key(key).to_owned();

                    let value = match value {
                        Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => {
                            self.normalize_owned(value)
                        }
                        _ => value.clone(),
                    };

                    Literal::upsert_object_entry(&mut out, key, value);
                }

                Literal::Object(out)
            }

            Literal::Array(items) => self.normalize_responsive_array(items),

            Literal::Conditional(branches) => Literal::Conditional(
                branches
                    .iter()
                    .map(|branch| self.normalize_owned(branch))
                    .collect(),
            ),

            Literal::String(value) => Literal::String(value.clone()),

            Literal::Token { path, value } => Literal::Token {
                path: path.clone(),
                value: value.clone(),
            },

            Literal::Number(value) => Literal::Number(*value),

            Literal::Bool(value) => Literal::Bool(*value),

            Literal::Null => Literal::Null,
        }
    }

    fn normalize_responsive_array(&self, items: &[Literal]) -> Literal {
        if self.breakpoints.is_empty() {
            return Literal::Array(
                items
                    .iter()
                    .map(|item| self.normalize_owned(item))
                    .collect(),
            );
        }

        // With breakpoints, a positional array becomes a keyed object
        // (`["a", "b"]` -> `{ sm: "a", md: "b" }`); `null` slots are skipped.
        let mut out = Vec::with_capacity(items.len().min(self.breakpoints.len()));
        for (index, item) in items.iter().enumerate() {
            let Some(key) = self.breakpoints.get(index) else {
                continue;
            };
            if matches!(item, Literal::Null) {
                continue;
            }

            Literal::upsert_object_entry(&mut out, key.clone(), self.normalize_owned(item));
        }

        Literal::Object(out)
    }
}

/// Drives the encoder's fused walker — no upfront normalization pass, no
/// `Cow<Literal>` allocation when nothing actually changes.
impl pandacss_encoder::NormalizeAtomic for StyleNormalizer<'_> {
    fn resolve_key<'a>(&'a self, key: &'a str) -> &'a str {
        self.canonical_key(key)
    }

    fn normalize_leaf<'a>(&self, _: &str, value: &'a Literal) -> Cow<'a, Literal> {
        Cow::Borrowed(value)
    }

    fn array_condition(&self, index: usize) -> Option<&str> {
        self.breakpoints.get(index).map(String::as_str)
    }
}
