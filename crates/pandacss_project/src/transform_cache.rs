//! Owned cache keys for transform memoization. Token variants keep path + value
//! so two token-backed inputs with the same resolved CSS still cache separately
//! when their paths differ (relevant for build-info round-trips).

use pandacss_encoder::AtomValue;
use pandacss_extractor::Literal;

/// Owned, bounded cache key for values passed to utility transform callbacks.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum AtomValueCacheKey {
    String(String),
    Token { path: String, value: String },
    Number(String),
    Bool(bool),
    Null,
}

/// Owned, bounded cache key for props passed to pattern transform callbacks.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum LiteralCacheKey {
    String(String),
    Token { path: String, value: String },
    Number(u64),
    Bool(bool),
    Null,
    Object(Vec<(String, LiteralCacheKey)>),
    Array(Vec<LiteralCacheKey>),
    Conditional(Vec<LiteralCacheKey>),
}

/// Build a cache key without first serializing the value to JSON.
#[must_use]
pub fn atom_value_cache_key(value: &AtomValue) -> AtomValueCacheKey {
    match value {
        AtomValue::String(value) => AtomValueCacheKey::String(value.to_string()),
        AtomValue::Token { path, value } => AtomValueCacheKey::Token {
            path: path.to_string(),
            value: value.to_string(),
        },
        AtomValue::Number(value) => AtomValueCacheKey::Number(value.to_string()),
        AtomValue::Bool(value) => AtomValueCacheKey::Bool(*value),
        AtomValue::Null => AtomValueCacheKey::Null,
    }
}

/// Build a cache key without first serializing the literal to JSON.
///
/// Returns `None` once the approximate retained key size exceeds
/// `max_key_bytes`, letting callers skip caching large transform inputs before
/// allocating a JSON string just for lookup.
#[must_use]
pub fn literal_cache_key(value: &Literal, max_key_bytes: usize) -> Option<LiteralCacheKey> {
    let mut budget = CacheKeyBudget::new(max_key_bytes);
    literal_cache_key_inner(value, &mut budget)
}

fn literal_cache_key_inner(
    value: &Literal,
    budget: &mut CacheKeyBudget,
) -> Option<LiteralCacheKey> {
    budget.take(1)?;
    match value {
        Literal::String(value) => {
            budget.take(value.len())?;
            Some(LiteralCacheKey::String(value.clone()))
        }
        Literal::Token { path, value } => {
            budget.take(path.len() + value.len())?;
            Some(LiteralCacheKey::Token {
                path: path.clone(),
                value: value.clone(),
            })
        }
        Literal::Number(value) => Some(LiteralCacheKey::Number(value.to_bits())),
        Literal::Bool(value) => Some(LiteralCacheKey::Bool(*value)),
        Literal::Null => Some(LiteralCacheKey::Null),
        Literal::Object(entries) => {
            let mut next = Vec::with_capacity(entries.len());
            for (key, value) in entries {
                budget.take(key.len())?;
                next.push((key.clone(), literal_cache_key_inner(value, budget)?));
            }
            Some(LiteralCacheKey::Object(next))
        }
        Literal::Array(items) => {
            let mut next = Vec::with_capacity(items.len());
            for item in items {
                next.push(literal_cache_key_inner(item, budget)?);
            }
            Some(LiteralCacheKey::Array(next))
        }
        Literal::Conditional(branches) => {
            let mut next = Vec::with_capacity(branches.len());
            for branch in branches {
                next.push(literal_cache_key_inner(branch, budget)?);
            }
            Some(LiteralCacheKey::Conditional(next))
        }
    }
}

struct CacheKeyBudget {
    remaining: usize,
}

impl CacheKeyBudget {
    fn new(remaining: usize) -> Self {
        Self { remaining }
    }

    fn take(&mut self, amount: usize) -> Option<()> {
        self.remaining = self.remaining.checked_sub(amount)?;
        Some(())
    }
}
