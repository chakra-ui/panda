//! Style-object normalization: shorthand resolution and responsive-array
//! keying, both as a standalone pass and as an encoder `NormalizeAtomic` impl.

use std::borrow::Cow;

use pandacss_extractor::Literal;

use crate::Utility;

pub struct StyleNormalizer<'a> {
    pub utility: Option<&'a Utility>,
    pub breakpoints: &'a [String],
    pub shorthand: bool,
}

impl StyleNormalizer<'_> {
    #[must_use]
    pub fn normalize<'a>(&self, style: &'a Literal) -> Cow<'a, Literal> {
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
                    let key = if self.shorthand {
                        self.utility
                            .map_or(key.as_str(), |utility| utility.resolve_shorthand(key))
                            .to_owned()
                    } else {
                        key.clone()
                    };
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
        if self.shorthand {
            self.utility
                .map_or(key, |utility| utility.resolve_shorthand(key))
        } else {
            key
        }
    }

    fn normalize_leaf<'a>(&self, _: &str, value: &'a Literal) -> Cow<'a, Literal> {
        Cow::Borrowed(value)
    }

    fn array_condition(&self, index: usize) -> Option<&str> {
        self.breakpoints.get(index).map(String::as_str)
    }
}
