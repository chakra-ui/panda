//! Utility metadata support for config-derived native extraction.
//!
//! This is intentionally narrower than Panda's JavaScript `Utility`
//! engine. V1 handles serialized, data-only utility metadata needed to
//! canonicalize extracted style props. Executable transforms remain host
//! callbacks on the binding side.

use std::collections::BTreeMap;
use std::sync::Arc;

use pandacss_config::{
    CallbackRef, DEFAULT_SEPARATOR, StringOrStringArray, UtilityConfig, UtilityValues,
};
use pandacss_extractor::Literal;
use pandacss_shared::{
    css_escape, hyphenate_property, number_to_js_string, split_important, to_hash, without_space,
};
use pandacss_tokens::{TokenCategory, TokenDictionary};
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;

mod normalize;
mod token_ref;
mod type_data;

pub use normalize::{ShorthandPolicy, StyleNormalizer};
pub use token_ref::{expand_token_references_to_values, expand_token_references_to_vars};

use token_ref::is_plain_token_path_like;

#[derive(Debug, Clone, Default)]
pub struct Utility {
    properties: FxHashMap<String, UtilityProperty>,
    shorthands: FxHashMap<String, String>,
    deprecated: FxHashSet<String>,
    separator: String,
    prefix: String,
    tokens: Option<Arc<TokenDictionary>>,
    fallback_transform: bool,
    hash_class_names: bool,
    shorthands_enabled: bool,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct UtilityProperty {
    pub class_name: Option<String>,
    pub css_property: Option<String>,
    /// Explicit `property` from utility config — used for type generation only.
    pub mapped_css_property: Option<String>,
    pub layer: Option<String>,
    pub values: FxHashMap<String, Literal>,
    pub values_category: Option<String>,
    pub transform_callback_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct UtilityOptions {
    pub separator: Option<String>,
    pub prefix: Option<String>,
    pub tokens: Option<Arc<TokenDictionary>>,
    pub shorthands: bool,
    pub hash_class_names: bool,
}

impl Default for UtilityOptions {
    fn default() -> Self {
        Self {
            separator: None,
            prefix: None,
            tokens: None,
            shorthands: true,
            hash_class_names: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct UtilityTransformResult {
    pub layer: Option<String>,
    pub class_name: String,
    pub styles: Literal,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ResolvedUtilityValue {
    pub utility: String,
    pub class_name: String,
    pub css_value: Literal,
    pub important: bool,
    pub source: UtilityValueSource,
}

#[derive(Debug, Clone, PartialEq)]
pub enum UtilityValueSource {
    ValueMap { key: String, aliases: Vec<String> },
    Literal { aliases: Vec<String> },
    TokenReference,
    Arbitrary,
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
            separator: options
                .separator
                .unwrap_or_else(|| DEFAULT_SEPARATOR.to_owned()),
            prefix: options.prefix.unwrap_or_default(),
            tokens: options.tokens,
            fallback_transform: !entries.is_empty(),
            hash_class_names: options.hash_class_names,
            shorthands_enabled: options.shorthands,
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
                    css_property: Some(config.property.clone().unwrap_or_else(|| property.clone())),
                    mapped_css_property: config.property.clone(),
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

        utility.register_color_palette_property();

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
    pub fn shorthands_enabled(&self) -> bool {
        self.shorthands_enabled
    }

    #[must_use]
    pub fn is_known(&self, prop: &str) -> bool {
        self.properties.contains_key(prop)
            || (self.shorthands_enabled && self.shorthands.contains_key(prop))
    }

    #[must_use]
    pub fn should_transform(&self, prop: &str) -> bool {
        self.fallback_transform || self.is_known(prop)
    }

    pub fn known_prop_names(&self) -> impl Iterator<Item = &str> + '_ {
        let shorthands = self
            .shorthands_enabled
            .then(|| self.shorthands.keys().map(String::as_str))
            .into_iter()
            .flatten();
        self.properties.keys().map(String::as_str).chain(shorthands)
    }

    #[must_use]
    pub fn property_keys(&self, prop: &str) -> Vec<String> {
        let key = self.resolve_shorthand(prop);
        let Some(config) = self.properties.get(key) else {
            return Vec::new();
        };

        // Explicit value keys win; otherwise fall back to the token category.
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
    pub fn deprecated_props(&self) -> &FxHashSet<String> {
        &self.deprecated
    }

    #[must_use]
    pub fn resolve_shorthand<'a>(&'a self, prop: &'a str) -> &'a str {
        if !self.shorthands_enabled {
            return prop;
        }
        self.canonical_property(prop)
    }

    #[must_use]
    pub fn canonical_property<'a>(&'a self, prop: &'a str) -> &'a str {
        self.shorthands
            .get(prop)
            .map_or(prop, std::string::String::as_str)
    }

    /// Token category a property's values resolve against (e.g. `colors`).
    /// Resolves shorthands first.
    #[must_use]
    pub fn token_category(&self, prop: &str) -> Option<&str> {
        self.properties
            .get(self.resolve_shorthand(prop))?
            .values_category
            .as_deref()
    }

    /// Resolves shorthand defensively before looking up the override.
    #[must_use]
    pub fn layer(&self, prop: &str) -> Option<&str> {
        let prop = self.resolve_shorthand(prop);
        self.properties.get(prop)?.layer.as_deref()
    }

    pub fn register_property(&mut self, name: String, property: UtilityProperty) {
        self.fallback_transform = true;
        self.properties.insert(name, property);
    }

    pub fn register_compositions(&mut self, theme: &pandacss_config::Theme) {
        register_composition_group(self, "textStyle", &theme.text_styles);
        register_composition_group(self, "layerStyle", &theme.layer_styles);
        register_composition_group(self, "animationStyle", &theme.animation_styles);
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
    pub fn class_name_value(&self, value: &str) -> String {
        without_space(value.trim())
    }

    #[must_use]
    pub fn value_alias_for_literal(&self, prop: &str, value: &str) -> Option<String> {
        self.value_aliases_for_literal(prop, value)
            .into_iter()
            .next()
    }

    #[must_use]
    pub fn value_aliases_for_literal(&self, prop: &str, value: &str) -> Vec<String> {
        let key = self.resolve_shorthand(prop);
        let normalized = without_space(value);
        let Some(config) = self.properties.get(key) else {
            return Vec::new();
        };

        let mut aliases = config
            .values
            .iter()
            .filter(|(_, literal)| literal_matches_class_input(literal, &normalized))
            .map(|(alias, _)| without_space(alias))
            .collect::<Vec<_>>();
        aliases.sort();
        aliases.dedup();
        aliases
    }

    #[must_use]
    pub fn resolve_utility_value(
        &self,
        prop: &str,
        value: &Literal,
    ) -> Option<ResolvedUtilityValue> {
        let authored = literal_to_class_value(value)?;

        let (raw, important) = split_important(&authored);
        let raw = raw.as_ref();

        let utility = self.resolve_shorthand(prop).to_owned();

        let style_value = self.expand_reference_in_value(&arbitrary_value(raw));
        let css_value = self.raw_property_value(&utility, &style_value);
        let css_value_text = literal_to_class_value(&css_value)?;

        let class_value = self.class_name_value(raw);
        let class_name = self.get_class_name(&utility, &class_value);
        let class_name = if self.hash_class_names {
            self.format_class_name_owned(to_hash(&class_name))
        } else {
            self.format_class_name(&class_name)
        };

        let value_map_key = self.properties.get(&utility).and_then(|config| {
            config
                .values
                .contains_key(style_value.as_str())
                .then_some(style_value.clone())
        });

        let mut aliases = self.value_aliases_for_literal(&utility, &css_value_text);

        if let Some(value_map_key) = &value_map_key {
            aliases.retain(|alias| alias != value_map_key);
        }

        let class_name = append_important(class_name, important);

        let source = if let Some(key) = value_map_key {
            UtilityValueSource::ValueMap { key, aliases }
        } else if is_arbitrary_value(raw) {
            UtilityValueSource::Arbitrary
        } else if has_token_reference(raw) {
            UtilityValueSource::TokenReference
        } else if !aliases.is_empty() {
            UtilityValueSource::Literal { aliases }
        } else {
            UtilityValueSource::Literal {
                aliases: Vec::new(),
            }
        };

        Some(ResolvedUtilityValue {
            utility,
            class_name,
            css_value,
            important,
            source,
        })
    }

    #[must_use]
    pub fn transform_str(&self, prop: &str, value: &str) -> UtilityTransformResult {
        self.transform_str_with_class(prop, value, None)
    }

    #[must_use]
    pub fn transform_str_with_class(
        &self,
        prop: &str,
        value: &str,
        class_input: Option<&str>,
    ) -> UtilityTransformResult {
        let key = self.resolve_shorthand(prop);
        let class_value =
            class_input.map_or_else(|| self.class_name_value(value), |c| without_space(c.trim()));
        let style_value = self.expand_reference_in_value(&arbitrary_value(value));
        let style_prop = self
            .properties
            .get(key)
            .and_then(|config| config.css_property.as_deref())
            .unwrap_or(key);
        let styles = self.default_style(style_prop, &self.raw_property_value(key, &style_value));

        UtilityTransformResult {
            layer: self
                .properties
                .get(key)
                .and_then(|config| config.layer.clone()),
            class_name: self.get_class_name(key, &class_value),
            styles,
        }
    }

    /// Resolve a raw value through the utility's `values` category (token refs,
    /// `[arbitrary]`, then category lookup `spacing.4` → `var(--spacing-4)`) —
    /// the value node feeds a `transform` callback as its positional arg.
    /// Passes the input through unchanged when no category matches.
    #[must_use]
    pub fn resolve_values_value(&self, prop: &str, value: &str) -> String {
        let key = self.resolve_shorthand(prop);
        let style_value = self.expand_reference_in_value(&arbitrary_value(value));
        let resolved = self.raw_property_value(key, &style_value);
        literal_to_class_value(&resolved).unwrap_or(style_value)
    }

    #[must_use]
    pub fn normalize_style_object(&self, style: &Literal) -> Literal {
        StyleNormalizer::internal(Some(self), &[])
            .normalize(style)
            .into_owned()
    }

    fn raw_property_value(&self, prop: &str, value: &str) -> Literal {
        let Some(config) = self.properties.get(prop) else {
            return Literal::String(value.to_owned());
        };

        if let Some(value) = config.values.get(value) {
            return value.clone();
        }

        if config.values_category.as_deref() == Some("colors")
            && let Some(value) = self.color_mix_category_value(value)
        {
            return Literal::String(value);
        }

        if let Some(category) = &config.values_category
            && let Some(value) = self.token_category_value(category, value)
        {
            return Literal::String(value.to_owned());
        }

        if self.tokens.is_some()
            && config.values_category.is_some()
            && is_plain_token_path_like(value)
        {
            return Literal::String(css_escape(value));
        }

        Literal::String(value.to_owned())
    }

    fn token_category_value<'a>(&'a self, category: &str, value: &str) -> Option<&'a str> {
        self.tokens.as_ref()?.category_value_str(category, value)
    }

    fn color_mix_category_value(&self, value: &str) -> Option<String> {
        let tokens = self.tokens.as_ref()?;
        let (color, opacity) = split_top_level_slash(value)?;
        let color = color.trim();
        let color_path = format!("colors.{color}");
        if tokens.token(&color_path).is_some() {
            let path = format!("{color_path}/{opacity}");
            tokens.color_mix_str(&path)
        } else if tokens.token(color).is_some() || !is_plain_token_path_like(color) {
            tokens.color_mix_str(value)
        } else {
            None
        }
    }

    /// Whether a color-category value uses an opacity modifier that cannot be
    /// resolved to `color-mix`.
    #[must_use]
    pub fn is_invalid_color_opacity_modifier(&self, value: &str) -> bool {
        split_top_level_slash(value).is_some()
            && self.tokens.is_some()
            && self.color_mix_category_value(value).is_none()
    }

    fn default_style(&self, prop: &str, value: &Literal) -> Literal {
        // Composition-style values (Object/Array/Conditional from a values
        // map) are already the final style shape — pass through with token
        // refs expanded, no extra `prop: value` wrap.
        if matches!(
            value,
            Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_)
        ) {
            return self.expand_styles_tree(value);
        }

        // A `--custom-prop` string value may itself reference a token var.
        let value = if prop.starts_with("--") {
            if let Literal::String(value) | Literal::Token { value, .. } = value
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

    fn expand_styles_tree(&self, value: &Literal) -> Literal {
        match value {
            Literal::Object(entries) => Literal::Object(
                entries
                    .iter()
                    .map(|(k, v)| (k.clone(), self.expand_styles_tree(v)))
                    .collect(),
            ),

            Literal::Array(items) => {
                Literal::Array(items.iter().map(|v| self.expand_styles_tree(v)).collect())
            }

            Literal::Conditional(branches) => Literal::Conditional(
                branches
                    .iter()
                    .map(|v| self.expand_styles_tree(v))
                    .collect(),
            ),

            Literal::String(s) | Literal::Token { value: s, .. } => {
                Literal::String(self.expand_reference_in_value(s))
            }

            Literal::Number(_) | Literal::Bool(_) | Literal::Null => value.clone(),
        }
    }

    fn expand_reference_in_value(&self, value: &str) -> String {
        let Some(tokens) = &self.tokens else {
            return value.to_owned();
        };
        expand_token_references_to_vars(value, tokens)
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

    fn register_color_palette_property(&mut self) {
        let Some(tokens) = &self.tokens else {
            return;
        };

        let palettes = tokens.color_palettes();

        if palettes.is_empty() {
            return;
        }

        let mut values = FxHashMap::default();
        for (palette, vars) in palettes.palettes() {
            let mut entries: Vec<_> = vars
                .iter()
                .map(|(virtual_var, token_var)| {
                    (
                        virtual_var.to_string(),
                        Literal::String(token_var.to_string()),
                    )
                })
                .collect();
            entries.sort_by(|(left, _), (right, _)| left.cmp(right));
            values.insert(palette.to_string(), Literal::Object(entries));
        }

        self.properties.insert(
            "colorPalette".to_owned(),
            UtilityProperty {
                class_name: None,
                css_property: None,
                mapped_css_property: None,
                layer: None,
                values,
                values_category: None,
                transform_callback_id: None,
            },
        );
    }
}

pub(crate) fn split_top_level_slash(value: &str) -> Option<(&str, &str)> {
    let mut nesting_depth = 0usize;
    let mut active_quote = None;
    let mut escaped = false;

    for (index, ch) in value.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }

        if ch == '\\' {
            escaped = true;
            continue;
        }

        if let Some(quote) = active_quote {
            if ch == quote {
                active_quote = None;
            }
            continue;
        }

        match ch {
            '"' | '\'' => active_quote = Some(ch),
            '(' | '[' => nesting_depth += 1,
            ')' | ']' => nesting_depth = nesting_depth.saturating_sub(1),
            '/' if nesting_depth == 0 => {
                return Some((&value[..index], &value[index + 1..]));
            }
            _ => {}
        }
    }

    None
}

const COMPOSITIONS_LAYER: &str = "compositions";

fn register_composition_group(utility: &mut Utility, prop_name: &str, source: &Value) {
    let Value::Object(root) = source else {
        return;
    };

    let mut values: FxHashMap<String, Literal> = FxHashMap::default();
    walk_composition_tree(root, "", &mut values);

    if values.is_empty() {
        return;
    }
    utility.register_property(
        prop_name.to_owned(),
        UtilityProperty {
            class_name: Some(prop_name.to_owned()),
            css_property: None,
            mapped_css_property: None,
            layer: Some(COMPOSITIONS_LAYER.to_owned()),
            values,
            values_category: None,
            transform_callback_id: None,
        },
    );
}

fn walk_composition_tree(
    node: &serde_json::Map<String, Value>,
    prefix: &str,
    out: &mut FxHashMap<String, Literal>,
) {
    for (key, value) in node {
        let path = if prefix.is_empty() {
            key.clone()
        } else {
            format!("{prefix}.{key}")
        };

        match value {
            Value::Object(entries) => {
                if let Some(styles) = entries.get("value") {
                    if let Some(literal) = value_to_literal(styles) {
                        out.insert(path, literal);
                    }
                } else {
                    walk_composition_tree(entries, &path, out);
                }
            }
            _ => {
                if let Some(literal) = value_to_literal(value) {
                    out.insert(path, literal);
                }
            }
        }
    }
}

fn value_to_literal(value: &Value) -> Option<Literal> {
    match value {
        Value::String(s) => Some(Literal::String(s.clone())),
        Value::Number(n) => n.as_f64().map(Literal::Number),
        Value::Bool(b) => Some(Literal::Bool(*b)),
        Value::Null => Some(Literal::Null),
        Value::Array(items) => Some(Literal::Array(
            items.iter().filter_map(value_to_literal).collect(),
        )),
        Value::Object(entries) => Some(Literal::Object(
            entries
                .iter()
                .filter_map(|(k, v)| Some((k.clone(), value_to_literal(v)?)))
                .collect(),
        )),
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
        Literal::String(value) | Literal::Token { value, .. } => Some(value.clone()),
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

fn append_important(mut value: String, important: bool) -> String {
    if important {
        value.push('!');
    }
    value
}

fn literal_matches_class_input(literal: &Literal, value: &str) -> bool {
    match literal {
        Literal::String(s) | Literal::Token { value: s, .. } => without_space(s) == value,
        Literal::Number(n) => number_to_js_string(*n) == value,
        Literal::Bool(b) => b.to_string() == value,
        Literal::Null | Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => false,
    }
}

fn is_arbitrary_value(value: &str) -> bool {
    let value = value.trim();
    value.starts_with('[') && value.ends_with(']')
}

fn has_token_reference(value: &str) -> bool {
    value.contains("token(") || (value.contains('{') && value.contains('}'))
}

/// Unwrap the `[arbitrary]` escape hatch (`[2px]` -> `2px`), but only when the
/// brackets balance — a stray inner `]` leaves the value untouched.
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
    use super::split_top_level_slash;

    // These cases are not observable through the public `transform` API because
    // the color-mix resolver rejects them before the split is visible, so they
    // are covered here against the private helper directly.

    #[test]
    fn splits_after_a_color_function_with_inner_slash() {
        assert_eq!(
            split_top_level_slash("color(display-p3 1 0 0 / 0.5)/40"),
            Some(("color(display-p3 1 0 0 / 0.5)", "40")),
        );
    }

    #[test]
    fn skips_escaped_slashes() {
        assert_eq!(
            split_top_level_slash(r"foo\/bar/40"),
            Some((r"foo\/bar", "40")),
        );
    }

    #[test]
    fn skips_quoted_slashes() {
        assert_eq!(
            split_top_level_slash(r#"url("/x/y")/40"#),
            Some((r#"url("/x/y")"#, "40")),
        );
    }

    #[test]
    fn ignores_slashes_inside_color_function_parentheses() {
        assert_eq!(split_top_level_slash("rgb(251 146 60 / 0.3)"), None);
    }
}
