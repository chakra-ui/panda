use std::num::NonZeroUsize;

use lru::LruCache;
use pandacss_extractor::Literal;
use pandacss_project::{AtomValueCacheKey, LiteralCacheKey};

const MAX_TRANSFORM_CACHE_ENTRIES: usize = 4096;
pub(crate) const MAX_TRANSFORM_CACHE_KEY_BYTES: usize = 16 * 1024;

pub(crate) struct TransformCache {
    /// The raw style object a utility transform returned (className/layer are
    /// recomputed by the emitter, not cached).
    pub(crate) utility: LruCache<UtilityTransformCacheKey, Literal>,
    pub(crate) pattern: LruCache<PatternTransformCacheKey, Option<Literal>>,
}

impl Default for TransformCache {
    fn default() -> Self {
        Self {
            utility: LruCache::new(cache_capacity()),
            pattern: LruCache::new(cache_capacity()),
        }
    }
}

impl TransformCache {
    pub(crate) fn clear(&mut self) {
        self.utility.clear();
        self.pattern.clear();
    }

    pub(crate) fn clear_utility(&mut self) {
        self.utility.clear();
    }

    pub(crate) fn clear_pattern(&mut self) {
        self.pattern.clear();
    }
}

fn cache_capacity() -> NonZeroUsize {
    NonZeroUsize::new(MAX_TRANSFORM_CACHE_ENTRIES).expect("transform cache capacity is non-zero")
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub(crate) struct UtilityTransformCacheKey {
    pub(crate) id: String,
    pub(crate) prop: String,
    pub(crate) value: AtomValueCacheKey,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub(crate) struct PatternTransformCacheKey {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) props: LiteralCacheKey,
}
