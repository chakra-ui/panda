use std::sync::Arc;

use rustc_hash::FxHashSet;

use pandacss_config::DerivedEngineConfig;
use pandacss_encoder::ConditionMatcher;

#[derive(Debug, Clone)]
pub(crate) enum ProjectConditionMatcher {
    Default(pandacss_encoder::DefaultConditions),
    Config(Arc<ProjectConditions>),
}

impl ConditionMatcher for ProjectConditionMatcher {
    #[inline]
    fn is_condition(&self, key: &str) -> bool {
        match self {
            Self::Default(matcher) => matcher.is_condition(key),
            Self::Config(matcher) => matcher.is_condition(key),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct ProjectConditions {
    names: FxHashSet<Box<str>>,
}

impl ProjectConditions {
    pub(crate) fn from_derived_config(config: &DerivedEngineConfig) -> ProjectConditionMatcher {
        let mut conditions = Self::default();
        conditions.extend(config.condition_names.iter().map(String::as_str));
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
        key.starts_with('_') || self.names.contains(key)
    }
}
