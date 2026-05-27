use std::collections::HashMap;

use pandacss_extractor::Literal;

use crate::project::AtomSerde;

#[derive(Default)]
pub(crate) struct TransformCache {
    pub(crate) utility: HashMap<UtilityTransformCacheKey, Vec<AtomSerde>>,
    pub(crate) pattern: HashMap<PatternTransformCacheKey, Option<Literal>>,
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

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub(crate) struct UtilityTransformCacheKey {
    pub(crate) id: String,
    pub(crate) prop: String,
    pub(crate) value: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub(crate) struct PatternTransformCacheKey {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) props: String,
}
