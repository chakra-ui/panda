use std::sync::Arc;

use rustc_hash::FxHashSet;

use pandacss_encoder::ConditionMatcher;

#[derive(Debug, Clone)]
pub(crate) enum ProjectConditionMatcher {
    Config(Arc<ProjectConditions>),
}

impl ConditionMatcher for ProjectConditionMatcher {
    #[inline]
    fn is_condition(&self, key: &str) -> bool {
        match self {
            Self::Config(matcher) => matcher.is_condition(key),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct ProjectConditions {
    names: FxHashSet<Box<str>>,
}

impl ProjectConditions {
    pub(crate) fn from_names<'a>(
        names: impl IntoIterator<Item = &'a str>,
    ) -> ProjectConditionMatcher {
        let mut conditions = Self::default();
        conditions.extend(names);
        ProjectConditionMatcher::Config(Arc::new(conditions))
    }

    fn extend<'a>(&mut self, names: impl IntoIterator<Item = &'a str>) {
        self.names.extend(
            names
                .into_iter()
                .filter(|name| !name.is_empty())
                .map(Box::<str>::from),
        );
    }
}

impl ConditionMatcher for ProjectConditions {
    #[inline]
    fn is_condition(&self, key: &str) -> bool {
        self.names.contains(key)
    }
}
