use std::borrow::Cow;
use std::sync::Arc;

use regex::Regex;
use rustc_hash::{FxHashMap, FxHashSet};

use pandacss_extractor::Literal;

use crate::config::PatternDefinition;

/// Maps a pattern's config name and every JSX tag/regex it matches to its entry.
#[derive(Debug, Clone, Default)]
pub(crate) struct PatternRegistry {
    exact: FxHashMap<String, PatternEntry>,
    regexes: Vec<(Regex, PatternEntry)>,
}

#[derive(Debug, Clone)]
struct PatternEntry {
    base_name: String,
    default_values: Option<Arc<Literal>>,
    requires_transform: bool,
}

pub(crate) struct PatternTransformInput<'a> {
    pub(crate) name: &'a str,
    pub(crate) styles: Cow<'a, Literal>,
}

impl PatternRegistry {
    pub(crate) fn from_definitions(definitions: &[PatternDefinition]) -> Self {
        let mut registry = Self::default();
        for definition in definitions {
            let default_values = definition.default_values.clone().map(Arc::new);
            let entry = PatternEntry {
                base_name: definition.name.clone(),
                default_values,
                requires_transform: definition.requires_transform,
            };

            registry
                .exact
                .insert(definition.name.clone(), entry.clone());
            for jsx_name in &definition.jsx_names {
                registry.exact.insert(jsx_name.clone(), entry.clone());
            }
            registry.regexes.extend(
                definition
                    .jsx_regexes
                    .iter()
                    .cloned()
                    .map(|regex| (regex, entry.clone())),
            );
        }
        registry
    }

    pub(crate) fn transform_input<'a>(
        &'a self,
        name: &'a str,
        styles: &'a Literal,
    ) -> PatternTransformInput<'a> {
        let Some(entry) = self.find(name) else {
            return PatternTransformInput {
                name,
                styles: Cow::Borrowed(styles),
            };
        };

        PatternTransformInput {
            name: &entry.base_name,
            styles: entry
                .default_values
                .as_ref()
                .map_or(Cow::Borrowed(styles), |defaults| {
                    Cow::Owned(apply_default_values(defaults.as_ref(), styles))
                }),
        }
    }

    /// Keys the pattern fills in when a usage leaves them out.
    pub(crate) fn default_value_keys(&self, name: &str) -> FxHashSet<&str> {
        let Some(Literal::Object(entries)) = self
            .find(name)
            .and_then(|entry| entry.default_values.as_deref())
        else {
            return FxHashSet::default();
        };
        entries.iter().map(|(key, _)| key.as_str()).collect()
    }

    /// Resolve a pattern name or JSX tag to the canonical pattern name.
    pub(crate) fn resolve_name(&self, name: &str) -> Option<&str> {
        self.find(name).map(|entry| entry.base_name.as_str())
    }

    #[must_use]
    pub(crate) fn requires_transform(&self, name: &str) -> bool {
        self.find(name)
            .is_some_and(|entry| entry.requires_transform)
    }

    fn find(&self, name: &str) -> Option<&PatternEntry> {
        self.exact.get(name).or_else(|| {
            self.regexes
                .iter()
                .find_map(|(regex, entry)| regex.is_match(name).then_some(entry))
        })
    }
}

fn apply_default_values(defaults: &Literal, styles: &Literal) -> Literal {
    let Literal::Object(default_entries) = defaults else {
        return styles.clone();
    };
    let Literal::Object(style_entries) = styles else {
        return styles.clone();
    };

    let mut out = default_entries.clone();
    for (key, value) in style_entries {
        Literal::upsert_object_entry(&mut out, key.clone(), value.clone());
    }
    Literal::Object(out)
}
