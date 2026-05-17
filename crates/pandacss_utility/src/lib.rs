//! Utility metadata support for config-derived native extraction.
//!
//! This is intentionally narrower than Panda's JavaScript `Utility`
//! engine. V1 handles serialized, data-only utility metadata needed to
//! canonicalize extracted style props. Executable transforms remain host
//! callbacks on the binding side.

use pandacss_extractor::Literal;
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;

#[derive(Debug, Clone, Default)]
pub struct Utility {
    properties: FxHashMap<String, UtilityProperty>,
    shorthands: FxHashMap<String, String>,
    deprecated: FxHashSet<String>,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct UtilityProperty {
    pub class_name: Option<String>,
    pub values: FxHashMap<String, Literal>,
    pub transform_callback_id: Option<String>,
}

impl Utility {
    #[must_use]
    pub fn from_serialized(value: &Value) -> Self {
        let Some(entries) = value.as_object() else {
            return Self::default();
        };

        let mut utility = Self::default();
        for (property, config) in entries {
            let Some(config) = config.as_object() else {
                continue;
            };

            if config.get("deprecated").and_then(Value::as_bool) == Some(true) {
                utility.deprecated.insert(property.clone());
            }

            utility.collect_shorthands(property, config.get("shorthand"));
            utility.properties.insert(
                property.clone(),
                UtilityProperty {
                    class_name: config
                        .get("className")
                        .and_then(Value::as_str)
                        .map(str::to_owned)
                        .or_else(|| default_class_name(config.get("shorthand"))),
                    values: values_map(config.get("values")),
                    transform_callback_id: callback_ref_id(config.get("transform")),
                },
            );
        }

        utility
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.properties.is_empty() && self.shorthands.is_empty()
    }

    #[must_use]
    pub fn is_known(&self, prop: &str) -> bool {
        self.properties.contains_key(prop) || self.shorthands.contains_key(prop)
    }

    pub fn known_prop_names(&self) -> impl Iterator<Item = &str> {
        self.properties
            .keys()
            .map(String::as_str)
            .chain(self.shorthands.keys().map(String::as_str))
    }

    #[must_use]
    pub fn is_deprecated(&self, prop: &str) -> bool {
        self.deprecated.contains(prop)
    }

    #[must_use]
    pub fn resolve_shorthand<'a>(&'a self, prop: &'a str) -> &'a str {
        self.shorthands
            .get(prop)
            .map_or(prop, std::string::String::as_str)
    }

    #[must_use]
    pub fn callback_transform_id(&self, prop: &str) -> Option<&str> {
        let prop = self.resolve_shorthand(prop);
        self.properties
            .get(prop)
            .and_then(|config| config.transform_callback_id.as_deref())
    }

    #[must_use]
    pub fn normalize_style_object(&self, style: &Literal) -> Literal {
        match style {
            Literal::Object(entries) => {
                let mut out = Vec::with_capacity(entries.len());
                for (key, value) in entries {
                    let key = self.resolve_shorthand(key).to_owned();
                    let value = match value {
                        Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => {
                            self.normalize_style_object(value)
                        }
                        _ => self.normalize_property_value(&key, value),
                    };
                    upsert(&mut out, key, value);
                }
                Literal::Object(out)
            }
            Literal::Array(items) => Literal::Array(
                items
                    .iter()
                    .map(|item| self.normalize_style_object(item))
                    .collect(),
            ),
            Literal::Conditional(branches) => Literal::Conditional(
                branches
                    .iter()
                    .map(|branch| self.normalize_style_object(branch))
                    .collect(),
            ),
            Literal::String(value) => Literal::String(value.clone()),
            Literal::Number(value) => Literal::Number(*value),
            Literal::Bool(value) => Literal::Bool(*value),
            Literal::Null => Literal::Null,
        }
    }

    fn normalize_property_value(&self, prop: &str, value: &Literal) -> Literal {
        let Some(config) = self.properties.get(prop) else {
            return value.clone();
        };
        let Some(key) = literal_key(value) else {
            return value.clone();
        };
        config
            .values
            .get(&key)
            .cloned()
            .unwrap_or_else(|| value.clone())
    }

    fn collect_shorthands(&mut self, property: &str, value: Option<&Value>) {
        match value {
            Some(Value::String(shorthand)) => {
                self.shorthands
                    .insert(shorthand.clone(), property.to_owned());
                if self.deprecated.contains(property) {
                    self.deprecated.insert(shorthand.clone());
                }
            }
            Some(Value::Array(items)) => {
                for shorthand in items.iter().filter_map(Value::as_str) {
                    self.shorthands
                        .insert(shorthand.to_owned(), property.to_owned());
                    if self.deprecated.contains(property) {
                        self.deprecated.insert(shorthand.to_owned());
                    }
                }
            }
            _ => {}
        }
    }
}

fn default_class_name(shorthand: Option<&Value>) -> Option<String> {
    match shorthand {
        Some(Value::String(value)) => Some(value.clone()),
        Some(Value::Array(items)) => items.first().and_then(Value::as_str).map(str::to_owned),
        _ => None,
    }
}

fn callback_ref_id(value: Option<&Value>) -> Option<String> {
    let value = value?.as_object()?;
    let kind = value.get("kind").and_then(Value::as_str)?;
    if kind != "js-callback" {
        return None;
    }
    value.get("id").and_then(Value::as_str).map(str::to_owned)
}

fn values_map(value: Option<&Value>) -> FxHashMap<String, Literal> {
    let mut out = FxHashMap::default();
    let Some(Value::Object(values)) = value else {
        return out;
    };
    if values.contains_key("kind") {
        return out;
    }
    for (key, value) in values {
        if let Some(value) = json_to_literal(value) {
            out.insert(key.clone(), value);
        }
    }
    out
}

fn json_to_literal(value: &Value) -> Option<Literal> {
    match value {
        Value::String(value) => Some(Literal::String(value.clone())),
        Value::Number(value) => value.as_f64().map(Literal::Number),
        Value::Bool(value) => Some(Literal::Bool(*value)),
        Value::Null => Some(Literal::Null),
        Value::Array(items) => items
            .iter()
            .map(json_to_literal)
            .collect::<Option<Vec<_>>>()
            .map(Literal::Array),
        Value::Object(entries) => entries
            .iter()
            .map(|(key, value)| json_to_literal(value).map(|value| (key.clone(), value)))
            .collect::<Option<Vec<_>>>()
            .map(Literal::Object),
    }
}

fn literal_key(value: &Literal) -> Option<String> {
    match value {
        Literal::String(value) => Some(value.clone()),
        Literal::Number(value) => Some(number_key(*value)),
        Literal::Bool(value) => Some(value.to_string()),
        Literal::Null | Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
    }
}

fn number_key(value: f64) -> String {
    if value.is_finite() && value.fract() == 0.0 {
        format!("{value:.0}")
    } else {
        value.to_string()
    }
}

fn upsert(entries: &mut Vec<(String, Literal)>, key: String, value: Literal) {
    if let Some((_, existing)) = entries.iter_mut().find(|(existing, _)| existing == &key) {
        *existing = value;
        return;
    }
    entries.push((key, value));
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn string_shorthand_maps_to_property() {
        let utility = Utility::from_serialized(&json!({
            "padding": { "shorthand": "p" }
        }));

        assert_eq!(utility.resolve_shorthand("p"), "padding");
        assert_eq!(utility.resolve_shorthand("padding"), "padding");
        assert!(utility.is_known("p"));
        assert!(utility.is_known("padding"));
    }

    #[test]
    fn array_shorthands_map_to_same_property() {
        let utility = Utility::from_serialized(&json!({
            "margin": { "shorthand": ["m", "mg"] }
        }));

        assert_eq!(utility.resolve_shorthand("m"), "margin");
        assert_eq!(utility.resolve_shorthand("mg"), "margin");
    }

    #[test]
    fn callback_transform_refs_are_exposed() {
        let utility = Utility::from_serialized(&json!({
            "size": {
                "shorthand": "sz",
                "transform": {
                    "kind": "js-callback",
                    "id": "utilities.size.transform"
                }
            }
        }));

        assert_eq!(
            utility.callback_transform_id("size"),
            Some("utilities.size.transform")
        );
        assert_eq!(
            utility.callback_transform_id("sz"),
            Some("utilities.size.transform")
        );
    }

    #[test]
    fn utility_values_normalize_aliases_to_raw_values() {
        let utility = Utility::from_serialized(&json!({
            "spacing": {
                "shorthand": "s",
                "values": {
                    "sm": "4px",
                    "md": "8px"
                }
            }
        }));
        let style = Literal::Object(vec![
            ("spacing".into(), Literal::String("sm".into())),
            ("s".into(), Literal::String("md".into())),
        ]);

        assert_eq!(
            utility.normalize_style_object(&style),
            Literal::Object(vec![("spacing".into(), Literal::String("8px".into()))])
        );
    }

    #[test]
    fn utility_values_normalize_nested_conditions() {
        let utility = Utility::from_serialized(&json!({
            "spacing": {
                "values": {
                    "sm": "4px"
                }
            }
        }));
        let style = Literal::Object(vec![(
            "_hover".into(),
            Literal::Object(vec![("spacing".into(), Literal::String("sm".into()))]),
        )]);

        assert_eq!(
            utility.normalize_style_object(&style),
            Literal::Object(vec![(
                "_hover".into(),
                Literal::Object(vec![("spacing".into(), Literal::String("4px".into()))])
            )])
        );
    }

    #[test]
    fn malformed_entries_are_ignored() {
        let utility = Utility::from_serialized(&json!({
            "padding": null,
            "margin": "bad"
        }));

        assert!(utility.is_empty());
        assert_eq!(utility.resolve_shorthand("p"), "p");
    }

    #[test]
    fn normalizes_nested_style_object_keys() {
        let utility = Utility::from_serialized(&json!({
            "padding": { "shorthand": "p" },
            "margin": { "shorthand": ["m"] }
        }));
        let style = Literal::Object(vec![(
            "_hover".into(),
            Literal::Object(vec![
                ("p".into(), Literal::String("4".into())),
                ("m".into(), Literal::String("2".into())),
            ]),
        )]);

        assert_eq!(
            utility.normalize_style_object(&style),
            Literal::Object(vec![(
                "_hover".into(),
                Literal::Object(vec![
                    ("padding".into(), Literal::String("4".into())),
                    ("margin".into(), Literal::String("2".into())),
                ])
            )])
        );
    }
}
