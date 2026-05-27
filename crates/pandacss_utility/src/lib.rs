//! Utility metadata support for config-derived native extraction.
//!
//! This is intentionally narrower than Panda's JavaScript `Utility`
//! engine. V1 handles serialized, data-only utility metadata needed to
//! canonicalize extracted style props. Executable transforms remain host
//! callbacks on the binding side.

use std::borrow::Cow;
use std::collections::BTreeMap;
use std::sync::Arc;

use pandacss_config::{CallbackRef, StringOrStringArray, UtilityConfig, UtilityValues};
use pandacss_extractor::Literal;
use pandacss_shared::number_to_js_string;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;

#[derive(Debug, Clone, Default)]
pub struct Utility {
    properties: FxHashMap<String, UtilityProperty>,
    shorthands: FxHashMap<String, String>,
    deprecated: FxHashSet<String>,
    separator: String,
    prefix: String,
    tokens: Option<Arc<TokenDictionary>>,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct UtilityProperty {
    pub class_name: Option<String>,
    pub layer: Option<String>,
    pub values: FxHashMap<String, Literal>,
    pub values_category: Option<String>,
    pub transform_callback_id: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct UtilityOptions {
    pub separator: Option<String>,
    pub prefix: Option<String>,
    pub tokens: Option<Arc<TokenDictionary>>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct UtilityTransformResult {
    pub layer: Option<String>,
    pub class_name: String,
    pub styles: Literal,
}

impl Utility {
    #[must_use]
    pub fn from_config(value: &BTreeMap<String, UtilityConfig>) -> Self {
        Self::from_config_with_options(value, UtilityOptions::default())
    }

    #[must_use]
    pub fn from_config_with_options(
        entries: &BTreeMap<String, UtilityConfig>,
        options: UtilityOptions,
    ) -> Self {
        let mut utility = Self {
            separator: options.separator.unwrap_or_else(|| "_".to_owned()),
            prefix: options.prefix.unwrap_or_default(),
            tokens: options.tokens,
            ..Self::default()
        };
        for (property, config) in entries {
            if config.deprecated {
                utility.deprecated.insert(property.clone());
            }

            utility.collect_shorthands(property, config.shorthand.as_ref());
            utility.properties.insert(
                property.clone(),
                UtilityProperty {
                    class_name: config
                        .class_name
                        .clone()
                        .or_else(|| default_class_name(config.shorthand.as_ref())),
                    layer: config.layer.clone(),
                    values: values_map(config.values.as_ref()),
                    values_category: match config.values.as_ref() {
                        Some(UtilityValues::Category(value)) => Some(value.clone()),
                        _ => None,
                    },
                    transform_callback_id: callback_ref_id(config.transform.as_ref()),
                },
            );
        }

        utility
    }

    #[must_use]
    pub fn with_token_dictionary(mut self, dictionary: TokenDictionary) -> Self {
        self.tokens = Some(Arc::new(dictionary));
        self
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
    pub fn property_keys(&self, prop: &str) -> Vec<String> {
        let key = self.resolve_shorthand(prop);
        let Some(config) = self.properties.get(key) else {
            return Vec::new();
        };
        if !config.values.is_empty() {
            let mut keys: Vec<_> = config.values.keys().cloned().collect();
            keys.sort();
            return keys;
        }
        let Some(category) = &config.values_category else {
            return Vec::new();
        };
        let Some(tokens) = &self.tokens else {
            return Vec::new();
        };
        let category = TokenCategory::from_path_segment(category);
        tokens
            .category_values_str(&category)
            .map(|values| {
                let mut keys: Vec<_> = values.keys().map(ToString::to_string).collect();
                keys.sort();
                keys
            })
            .unwrap_or_default()
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
    pub fn separator(&self) -> &str {
        &self.separator
    }

    #[must_use]
    pub fn prefix(&self) -> &str {
        &self.prefix
    }

    #[must_use]
    pub fn format_class_name(&self, class_name: &str) -> String {
        self.format_class_name_owned(class_name.to_owned())
    }

    #[must_use]
    pub fn format_class_name_owned(&self, class_name: String) -> String {
        if self.prefix.is_empty() {
            return class_name;
        }
        let mut out = String::with_capacity(self.prefix.len() + class_name.len() + 1);
        out.push_str(&self.prefix);
        out.push('-');
        out.push_str(&class_name);
        out
    }

    #[must_use]
    pub fn get_class_name(&self, property: &str, raw: &str) -> String {
        let key = self.resolve_shorthand(property);
        let prefix = self
            .properties
            .get(key)
            .and_then(|config| config.class_name.as_deref())
            .map_or_else(|| hyphenate_property(key), str::to_owned);
        join_class_name(&prefix, &self.separator, raw)
    }

    #[must_use]
    pub fn transform(&self, prop: &str, value: &Literal) -> Option<UtilityTransformResult> {
        let value = literal_to_class_value(value)?;
        Some(self.transform_str(prop, &value))
    }

    #[must_use]
    pub fn transform_str(&self, prop: &str, value: &str) -> UtilityTransformResult {
        let key = self.resolve_shorthand(prop);
        let class_value = without_space(value);
        let style_value = self.expand_reference_in_value(&arbitrary_value(value));
        let styles = self.default_style(key, &self.raw_property_value(key, &style_value));
        UtilityTransformResult {
            layer: self
                .properties
                .get(key)
                .and_then(|config| config.layer.clone()),
            class_name: self.get_class_name(key, &class_value),
            styles,
        }
    }

    #[must_use]
    pub fn normalize_style_object(&self, style: &Literal) -> Literal {
        StyleNormalizer {
            utility: Some(self),
            breakpoints: &[],
            shorthand: true,
        }
        .normalize(style)
        .into_owned()
    }

    #[must_use]
    pub fn normalize_property_value(&self, prop: &str, value: &Literal) -> Literal {
        let Some(config) = self.properties.get(prop) else {
            return value.clone();
        };
        let mapped = match value {
            Literal::String(value) => config.values.get(value.as_str()),
            Literal::Bool(true) => config.values.get("true"),
            Literal::Bool(false) => config.values.get("false"),
            Literal::Number(value) => {
                let key = number_to_js_string(*value);
                config.values.get(key.as_str())
            }
            Literal::Null | Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => {
                None
            }
        };
        mapped.cloned().unwrap_or_else(|| value.clone())
    }

    fn raw_property_value(&self, prop: &str, value: &str) -> Literal {
        let Some(config) = self.properties.get(prop) else {
            return Literal::String(value.to_owned());
        };
        if let Some(value) = config.values.get(value) {
            return value.clone();
        }
        if let Some(category) = &config.values_category
            && let Some(value) = self.token_category_value(category, value)
        {
            return Literal::String(value.to_owned());
        }
        Literal::String(value.to_owned())
    }

    fn token_category_value<'a>(&'a self, category: &str, value: &str) -> Option<&'a str> {
        self.tokens.as_ref()?.category_value_str(category, value)
    }

    fn default_style(&self, prop: &str, value: &Literal) -> Literal {
        let value = if prop.starts_with("--") {
            if let Literal::String(value) = value
                && let Some(tokens) = &self.tokens
                && let Some(value) = tokens.get_var_str(value, None)
            {
                Literal::String(value.to_owned())
            } else {
                value.clone()
            }
        } else {
            value.clone()
        };
        Literal::Object(vec![(prop.to_owned(), value)])
    }

    fn expand_reference_in_value(&self, value: &str) -> String {
        let Some(tokens) = &self.tokens else {
            return value.to_owned();
        };
        expand_token_references(value, tokens)
    }

    fn collect_shorthands(&mut self, property: &str, value: Option<&StringOrStringArray>) {
        match value {
            Some(StringOrStringArray::String(shorthand)) => {
                self.shorthands
                    .insert(shorthand.clone(), property.to_owned());
                if self.deprecated.contains(property) {
                    self.deprecated.insert(shorthand.clone());
                }
            }
            Some(StringOrStringArray::Array(items)) => {
                for shorthand in items {
                    self.shorthands
                        .insert(shorthand.clone(), property.to_owned());
                    if self.deprecated.contains(property) {
                        self.deprecated.insert(shorthand.clone());
                    }
                }
            }
            _ => {}
        }
    }
}

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
                        _ => self.normalize_property_value(&key, value),
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
            Literal::Number(value) => Literal::Number(*value),
            Literal::Bool(value) => Literal::Bool(*value),
            Literal::Null => Literal::Null,
        }
    }

    fn normalize_property_value(&self, prop: &str, value: &Literal) -> Literal {
        self.utility.map_or_else(
            || value.clone(),
            |utility| utility.normalize_property_value(prop, value),
        )
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

fn default_class_name(shorthand: Option<&StringOrStringArray>) -> Option<String> {
    match shorthand {
        Some(StringOrStringArray::String(value)) => Some(value.clone()),
        Some(StringOrStringArray::Array(items)) => items.first().cloned(),
        _ => None,
    }
}

fn callback_ref_id(value: Option<&CallbackRef>) -> Option<String> {
    let value = value?;
    if value.kind != "js-callback" {
        return None;
    }
    value.id.clone()
}

fn values_map(value: Option<&UtilityValues>) -> FxHashMap<String, Literal> {
    let mut out = FxHashMap::default();
    match value {
        Some(UtilityValues::Array(items)) => {
            for key in items {
                out.insert(key.clone(), Literal::String(key.clone()));
            }
        }
        Some(UtilityValues::Map(values)) => {
            for (key, value) in values {
                if let Some(value) = json_to_literal(value) {
                    out.insert(key.clone(), value);
                }
            }
        }
        _ => {}
    }
    out
}

fn literal_to_class_value(value: &Literal) -> Option<String> {
    match value {
        Literal::String(value) => Some(value.clone()),
        Literal::Number(value) => Some(number_to_js_string(*value)),
        Literal::Bool(value) => Some(value.to_string()),
        Literal::Null | Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
    }
}

fn join_class_name(prop: &str, separator: &str, value: &str) -> String {
    let mut out = String::with_capacity(prop.len() + separator.len() + value.len());
    out.push_str(prop);
    out.push_str(separator);
    out.push_str(value);
    out
}

fn without_space(value: &str) -> String {
    value.replace(' ', "_")
}

#[must_use]
pub fn hyphenate_property(property: &str) -> String {
    if property.starts_with("--") {
        return property.to_owned();
    }

    let mut out = String::with_capacity(property.len() + 4);
    for (index, ch) in property.char_indices() {
        if ch.is_ascii_uppercase() {
            if index > 0 {
                out.push('-');
            }
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    if let Some(rest) = out.strip_prefix("ms-") {
        let mut prefixed = String::with_capacity(out.len() + 1);
        prefixed.push_str("-ms-");
        prefixed.push_str(rest);
        return prefixed;
    }
    out
}

fn arbitrary_value(value: &str) -> String {
    let value = value.trim();
    if !value.starts_with('[') || !value.ends_with(']') {
        return value.to_owned();
    }

    let inner = &value[1..value.len() - 1];
    let mut bracket_count = 0u32;
    for ch in inner.chars() {
        match ch {
            '[' => bracket_count += 1,
            ']' if bracket_count == 0 => return value.to_owned(),
            ']' => bracket_count -= 1,
            _ => {}
        }
    }

    if bracket_count == 0 {
        inner.trim().to_owned()
    } else {
        value.to_owned()
    }
}

fn expand_token_references(value: &str, tokens: &TokenDictionary) -> String {
    let with_braces = replace_wrapped_references(value, '{', '}', tokens);
    replace_token_functions(&with_braces, tokens)
}

fn replace_wrapped_references(
    value: &str,
    open: char,
    close: char,
    tokens: &TokenDictionary,
) -> String {
    let mut out = String::with_capacity(value.len());
    let mut rest = value;
    while let Some(start) = rest.find(open) {
        out.push_str(&rest[..start]);
        let after_open = &rest[start + open.len_utf8()..];
        let Some(end) = after_open.find(close) else {
            out.push_str(&rest[start..]);
            return out;
        };
        let path = after_open[..end].trim();
        out.push_str(tokens.get_var_str(path, None).unwrap_or(path));
        rest = &after_open[end + close.len_utf8()..];
    }
    out.push_str(rest);
    out
}

fn replace_token_functions(value: &str, tokens: &TokenDictionary) -> String {
    let mut out = String::with_capacity(value.len());
    let mut rest = value;
    while let Some(start) = rest.find("token(") {
        out.push_str(&rest[..start]);
        let after_open = &rest[start + "token(".len()..];
        let Some(end) = find_matching_paren(after_open) else {
            out.push_str(&rest[start..]);
            return out;
        };
        let args = &after_open[..end];
        let (path, fallback) = split_token_args(args);
        let resolved = tokens
            .get_var_str(path.trim(), None)
            .unwrap_or_else(|| fallback.map(str::trim).unwrap_or_else(|| path.trim()));
        out.push_str(resolved);
        rest = &after_open[end + 1..];
    }
    out.push_str(rest);
    out
}

fn find_matching_paren(value: &str) -> Option<usize> {
    let mut depth = 0u32;
    for (index, ch) in value.char_indices() {
        match ch {
            '(' => depth += 1,
            ')' if depth == 0 => return Some(index),
            ')' => depth -= 1,
            _ => {}
        }
    }
    None
}

fn split_token_args(value: &str) -> (&str, Option<&str>) {
    let mut depth = 0u32;
    for (index, ch) in value.char_indices() {
        match ch {
            '(' => depth += 1,
            ')' if depth > 0 => depth -= 1,
            ',' if depth == 0 => return (&value[..index], Some(&value[index + 1..])),
            _ => {}
        }
    }
    (value, None)
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

#[cfg(test)]
mod tests {
    use super::*;
    use insta::assert_debug_snapshot;
    use pandacss_tokens::{Token, TokenCategory};
    use serde_json::json;

    fn utility_config(value: Value) -> BTreeMap<String, UtilityConfig> {
        serde_json::from_value(value).expect("utility config")
    }

    #[test]
    fn string_shorthand_maps_to_property() {
        let utility = Utility::from_config(&utility_config(json!({
            "padding": { "shorthand": "p" }
        })));

        assert_eq!(utility.resolve_shorthand("p"), "padding");
        assert_eq!(utility.resolve_shorthand("padding"), "padding");
        assert!(utility.is_known("p"));
        assert!(utility.is_known("padding"));
    }

    #[test]
    fn array_shorthands_map_to_same_property() {
        let utility = Utility::from_config(&utility_config(json!({
            "margin": { "shorthand": ["m", "mg"] }
        })));

        assert_eq!(utility.resolve_shorthand("m"), "margin");
        assert_eq!(utility.resolve_shorthand("mg"), "margin");
    }

    #[test]
    fn callback_transform_refs_are_exposed() {
        let utility = Utility::from_config(&utility_config(json!({
            "size": {
                "shorthand": "sz",
                "transform": {
                    "kind": "js-callback",
                    "id": "utilities.size.transform"
                }
            }
        })));

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
        let utility = Utility::from_config(&utility_config(json!({
            "spacing": {
                "shorthand": "s",
                "values": {
                    "sm": "4px",
                    "md": "8px"
                }
            }
        })));
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
        let utility = Utility::from_config(&utility_config(json!({
            "spacing": {
                "values": {
                    "sm": "4px"
                }
            }
        })));
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
        let utility = Utility::from_config(&utility_config(json!({})));

        assert!(utility.is_empty());
        assert_eq!(utility.resolve_shorthand("p"), "p");
    }

    #[test]
    fn normalizes_nested_style_object_keys() {
        let utility = Utility::from_config(&utility_config(json!({
            "padding": { "shorthand": "p" },
            "margin": { "shorthand": ["m"] }
        })));
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

    #[test]
    fn transform_uses_separator_prefix_and_class_name() {
        let utility = Utility::from_config_with_options(
            &utility_config(json!({
                "spacing": {
                    "shorthand": "s",
                    "className": "sp",
                    "values": {
                        "sm": "4px"
                    }
                }
            })),
            UtilityOptions {
                separator: Some("__".into()),
                prefix: Some("panda".into()),
                tokens: None,
            },
        );

        let result = utility
            .transform("s", &Literal::String("sm".into()))
            .expect("transform");

        assert_debug_snapshot!((utility.format_class_name(&result.class_name), result), @r#"
        (
            "panda-sp__sm",
            UtilityTransformResult {
                layer: None,
                class_name: "sp__sm",
                styles: Object(
                    [
                        (
                            "spacing",
                            String(
                                "4px",
                            ),
                        ),
                    ],
                ),
            },
        )
        "#);
    }

    #[test]
    fn transform_falls_back_to_hyphenated_property_class_name() {
        let utility = Utility::from_config(&utility_config(json!({})));

        let result = utility
            .transform("backgroundColor", &Literal::String("red".into()))
            .expect("transform");

        assert_debug_snapshot!(result, @r#"
        UtilityTransformResult {
            layer: None,
            class_name: "background-color_red",
            styles: Object(
                [
                    (
                        "backgroundColor",
                        String(
                            "red",
                        ),
                    ),
                ],
            ),
        }
        "#);
    }

    #[test]
    fn transform_uses_configured_class_name_for_preset_utility() {
        let utility = Utility::from_config(&utility_config(json!({
            "backgroundColor": {
                "shorthand": "bgColor",
                "className": "bg-c",
                "values": "colors"
            }
        })));

        let result = utility
            .transform("bgColor", &Literal::String("red".into()))
            .expect("transform");

        assert_debug_snapshot!(result, @r#"
        UtilityTransformResult {
            layer: None,
            class_name: "bg-c_red",
            styles: Object(
                [
                    (
                        "backgroundColor",
                        String(
                            "red",
                        ),
                    ),
                ],
            ),
        }
        "#);
    }

    #[test]
    fn transform_supports_token_category_values() {
        let tokens = TokenDictionary::builder()
            .insert(Token::new(
                "spacing.sm",
                "4px",
                "var(--spacing-sm)",
                TokenCategory::Spacing,
            ))
            .build();
        let utility = Utility::from_config_with_options(
            &utility_config(json!({
                "spacing": {
                    "values": "spacing"
                }
            })),
            UtilityOptions {
                tokens: Some(Arc::new(tokens)),
                ..UtilityOptions::default()
            },
        );

        let result = utility
            .transform("spacing", &Literal::String("sm".into()))
            .expect("transform");

        assert_debug_snapshot!(result, @r#"
        UtilityTransformResult {
            layer: None,
            class_name: "spacing_sm",
            styles: Object(
                [
                    (
                        "spacing",
                        String(
                            "4px",
                        ),
                    ),
                ],
            ),
        }
        "#);
    }

    #[test]
    fn transform_expands_token_references_in_values() {
        let tokens = TokenDictionary::builder()
            .insert(Token::new(
                "colors.red.500",
                "#f00",
                "var(--colors-red-500)",
                TokenCategory::Colors,
            ))
            .build();
        let utility = Utility::from_config_with_options(
            &utility_config(json!({})),
            UtilityOptions {
                tokens: Some(Arc::new(tokens)),
                ..UtilityOptions::default()
            },
        );

        let result = utility
            .transform("color", &Literal::String("token(colors.red.500)".into()))
            .expect("transform");

        assert_debug_snapshot!(result, @r#"
        UtilityTransformResult {
            layer: None,
            class_name: "color_token(colors.red.500)",
            styles: Object(
                [
                    (
                        "color",
                        String(
                            "var(--colors-red-500)",
                        ),
                    ),
                ],
            ),
        }
        "#);
    }

    #[test]
    fn transform_preserves_layer() {
        let utility = Utility::from_config(&utility_config(json!({
            "textStyle": {
                "layer": "recipes",
                "values": ["body"]
            }
        })));

        let result = utility
            .transform("textStyle", &Literal::String("body".into()))
            .expect("transform");

        assert_debug_snapshot!(result, @r#"
        UtilityTransformResult {
            layer: Some(
                "recipes",
            ),
            class_name: "text-style_body",
            styles: Object(
                [
                    (
                        "textStyle",
                        String(
                            "body",
                        ),
                    ),
                ],
            ),
        }
        "#);
    }
}
