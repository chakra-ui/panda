use std::borrow::Cow;
use std::sync::Arc;

use regex::Regex;
use rustc_hash::FxHashMap;

use pandacss_extractor::Literal;

use crate::config::PatternDefinition;

/// Maps a pattern's config name and every JSX tag/regex it matches to its
/// entry, so an extracted call or component can be resolved to its pattern.
#[derive(Debug, Clone, Default)]
pub(crate) struct PatternRegistry {
    exact: FxHashMap<String, PatternEntry>,
    regexes: Vec<(Regex, PatternEntry)>,
}

#[derive(Debug, Clone)]
struct PatternEntry {
    base_name: String,
    default_values: Option<Arc<Literal>>,
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

    /// Resolve a pattern name or JSX tag to the canonical pattern name.
    pub(crate) fn resolve_name(&self, name: &str) -> Option<&str> {
        self.find(name).map(|entry| entry.base_name.as_str())
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
