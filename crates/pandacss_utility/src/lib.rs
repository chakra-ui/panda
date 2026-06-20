//! Utility metadata support for config-derived native extraction.
//!
//! This is intentionally narrower than Panda's JavaScript `Utility`
//! engine. V1 handles serialized, data-only utility metadata needed to
//! canonicalize extracted style props. Executable transforms remain host
//! callbacks on the binding side.

use std::borrow::Cow;
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

use pandacss_config::{
    CallbackRef, DEFAULT_SEPARATOR, Deprecated, PrimitiveType, StringOrStringArray, UtilityConfig,
    UtilityPropertyTypeData, UtilityTypeData, UtilityValues, ValueAliasTypeData, ValueTypePart,
    value_alias_name,
};
use pandacss_extractor::Literal;
use pandacss_shared::{css_escape, number_to_js_string, pascal_case, split_important, to_hash};
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
    fallback_transform: bool,
    hash_class_names: bool,
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
            ..Self::default()
        };
        for (property, config) in entries {
            if config.deprecated {
                utility.deprecated.insert(property.clone());
            }

            if options.shorthands {
                utility.collect_shorthands(property, config.shorthand.as_ref());
            }
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
    pub fn is_known(&self, prop: &str) -> bool {
        self.properties.contains_key(prop) || self.shorthands.contains_key(prop)
    }

    #[must_use]
    pub fn should_transform(&self, prop: &str) -> bool {
        self.fallback_transform || self.is_known(prop)
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

    /// Project the utility metadata into the codegen [`UtilityTypeData`]
    /// (property value types, shorthands, value aliases, class names).
    #[must_use]
    pub fn type_data(&self) -> UtilityTypeData {
        let mut properties = BTreeMap::new();
        let mut aliases = BTreeMap::new();
        let mut class_names = BTreeMap::new();

        // This is a codegen snapshot, not an extraction hot path. Sort once so
        // generated types are stable across runs.
        let mut property_entries = self.properties.iter().collect::<Vec<_>>();
        property_entries.sort_unstable_by(|(left, _), (right, _)| left.cmp(right));

        let tokens = self.tokens.as_deref();
        for (name, property) in property_entries {
            let data = property_type_data(name, property, tokens);

            aliases
                .entry(data.alias.clone())
                .or_insert_with(|| value_alias_type_data(&data));

            class_names.insert(
                name.clone(),
                property
                    .class_name
                    .clone()
                    .unwrap_or_else(|| hyphenate_property(name)),
            );

            properties.insert(name.clone(), data);
        }

        let mut shorthands = BTreeMap::new();
        let mut shorthand_entries = self.shorthands.iter().collect::<Vec<_>>();
        shorthand_entries.sort_unstable_by(|(left, _), (right, _)| left.cmp(right));

        for (name, target) in shorthand_entries {
            shorthands.insert(name.clone(), target.clone());

            let Some(property) = self.properties.get(target) else {
                continue;
            };

            let data = property_type_data(name, property, tokens);

            // Many shorthands share the same value alias as their longhand.
            // Keep one alias body and let properties reference it by name.
            aliases
                .entry(data.alias.clone())
                .or_insert_with(|| value_alias_type_data(&data));

            properties.insert(name.clone(), data);
        }

        UtilityTypeData {
            properties,
            shorthands,
            deprecated: self
                .deprecated
                .iter()
                .map(|prop| (prop.clone(), Deprecated::Bool(true)))
                .collect(),
            aliases,
            class_names,
        }
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
        StyleNormalizer {
            utility: Some(self),
            breakpoints: &[],
            shorthand: true,
        }
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

fn split_top_level_slash(value: &str) -> Option<(&str, &str)> {
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

/// Type info for one utility property: its literal value keys (sorted) and the
/// name of the value-alias type its values resolve to (a token category alias,
/// or `<Prop>Value`).
fn property_type_data(
    name: &str,
    property: &UtilityProperty,
    tokens: Option<&TokenDictionary>,
) -> UtilityPropertyTypeData {
    let primitive = primitive_type_hint(&property.values);
    let mut literals = if primitive.is_some() {
        Vec::new()
    } else {
        property.values.keys().cloned().collect::<Vec<_>>()
    };
    literals.sort();

    let explicit_category = property.values_category.as_deref();
    let (token_category, literals) =
        collapse_inferred_token_category(literals, explicit_category, tokens);
    let alias = utility_value_alias_name(name, property, token_category.as_deref(), &literals);

    UtilityPropertyTypeData {
        name: name.to_owned(),
        css_property: property.css_property.clone(),
        mapped_css_property: property.mapped_css_property.clone(),
        token_category,
        literals,
        primitive,
        alias,
    }
}

/// When a utility's resolved value map contains every key from a token category
/// (typical of `values(theme) { ...theme('spacing') }`), collapse those keys to
/// `TokenValue<"category">` for typegen — matching v1's `type:Tokens["…"]` stub.
fn collapse_inferred_token_category(
    literals: Vec<String>,
    explicit_category: Option<&str>,
    tokens: Option<&TokenDictionary>,
) -> (Option<String>, Vec<String>) {
    if explicit_category.is_some() {
        return (explicit_category.map(str::to_owned), literals);
    }

    let Some(tokens) = tokens else {
        return (None, literals);
    };

    if literals.is_empty() {
        return (None, literals);
    }

    let remaining_set: BTreeSet<&str> = literals.iter().map(String::as_str).collect();

    let mut matches: Vec<(TokenCategory, usize)> = tokens
        .categories()
        .filter_map(|category| {
            let keys = tokens.category_values_str(category)?;
            if keys.is_empty() {
                return None;
            }
            let all_present = keys.keys().all(|key| remaining_set.contains(key.as_ref()));
            all_present.then_some((category.clone(), keys.len()))
        })
        .collect();

    matches.sort_by(|(left, left_count), (right, right_count)| {
        right_count
            .cmp(left_count)
            .then_with(|| left.as_str().cmp(right.as_str()))
    });

    let Some(best_count) = matches.first().map(|(_, count)| *count) else {
        return (None, literals);
    };

    let best_matches: Vec<_> = matches
        .iter()
        .filter(|(_, count)| *count == best_count)
        .collect();

    if best_matches.len() != 1 {
        return (None, literals);
    }

    let (category, _) = best_matches[0];

    let mut remaining: BTreeSet<String> = literals.into_iter().collect();
    if let Some(keys) = tokens.category_values_str(category) {
        for key in keys.keys() {
            remaining.remove(key.as_ref());
        }
    }

    let mut remaining_literals: Vec<String> = remaining.into_iter().collect();
    remaining_literals.sort();

    (Some(category.as_str().to_owned()), remaining_literals)
}

fn is_category_global_literal(category: &str, literal: &str) -> bool {
    matches!(
        (category, literal),
        ("spacing" | "zIndex" | "aspectRatios", "auto")
            | (
                "sizes",
                "auto" | "fit-content" | "max-content" | "min-content"
            )
    )
}

fn utility_value_alias_name(
    name: &str,
    property: &UtilityProperty,
    inferred_category: Option<&str>,
    literals: &[String],
) -> String {
    if let Some(category) = property.values_category.as_deref() {
        return value_alias_name(category);
    }

    if let Some(category) = inferred_category {
        let only_globals = literals.is_empty()
            || literals
                .iter()
                .all(|literal| is_category_global_literal(category, literal));
        if only_globals {
            return value_alias_name(category);
        }
    }

    let alias_property = property.css_property.as_deref().unwrap_or(name);
    format!("{}Value", pascal_case(alias_property))
}

/// `values: { type: 'boolean' }` is a type hint, not a values map — the
/// property accepts the named primitive instead of literal keys.
fn primitive_type_hint(values: &FxHashMap<String, Literal>) -> Option<PrimitiveType> {
    if values.len() != 1 {
        return None;
    }
    match values.get("type")? {
        Literal::String(value) => match value.as_str() {
            "boolean" => Some(PrimitiveType::Boolean),
            "number" => Some(PrimitiveType::Number),
            "string" => Some(PrimitiveType::String),
            _ => None,
        },
        _ => None,
    }
}

/// Build the union of value-type parts a property's alias accepts — token
/// category, raw CSS property values, configured literals, and an optional
/// primitive fallback — in the order they should appear in the generated type.
fn value_alias_type_data(property: &UtilityPropertyTypeData) -> ValueAliasTypeData {
    let capacity = property.literals.len()
        + usize::from(property.token_category.is_some())
        + usize::from(property.mapped_css_property.is_some())
        + 4;
    let mut parts = Vec::with_capacity(capacity);

    if let Some(category) = &property.token_category {
        parts.push(ValueTypePart::TokenCategory(category.clone()));
    }

    if let Some(css_property) = &property.mapped_css_property {
        parts.push(ValueTypePart::CssProperty(css_property.clone()));
    }

    parts.extend(
        property
            .literals
            .iter()
            .cloned()
            .map(ValueTypePart::Literal),
    );

    if let Some(primitive) = property.primitive {
        parts.push(ValueTypePart::Primitive(primitive));
    } else if property.token_category.is_none() && property.literals.is_empty() {
        parts.push(ValueTypePart::Primitive(PrimitiveType::String));
        parts.push(ValueTypePart::Primitive(PrimitiveType::Number));
    }

    parts.push(ValueTypePart::CssVars);
    parts.push(ValueTypePart::AnyString);

    ValueAliasTypeData {
        name: property.alias.clone(),
        parts,
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
                        _ => value.clone(),
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
            Literal::Token { path, value } => Literal::Token {
                path: path.clone(),
                value: value.clone(),
            },
            Literal::Number(value) => Literal::Number(*value),
            Literal::Bool(value) => Literal::Bool(*value),
            Literal::Null => Literal::Null,
        }
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

        // With breakpoints, a positional array becomes a keyed object
        // (`["a", "b"]` -> `{ sm: "a", md: "b" }`); `null` slots are skipped.
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

/// Drives the encoder's fused walker — no upfront normalization pass, no
/// `Cow<Literal>` allocation when nothing actually changes.
impl pandacss_encoder::NormalizeAtomic for StyleNormalizer<'_> {
    fn resolve_key<'a>(&'a self, key: &'a str) -> &'a str {
        if self.shorthand {
            self.utility
                .map_or(key, |utility| utility.resolve_shorthand(key))
        } else {
            key
        }
    }

    fn normalize_leaf<'a>(&self, _: &str, value: &'a Literal) -> Cow<'a, Literal> {
        Cow::Borrowed(value)
    }

    fn array_condition(&self, index: usize) -> Option<&str> {
        self.breakpoints.get(index).map(String::as_str)
    }
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

fn without_space(value: &str) -> String {
    value.replace(' ', "_")
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

#[must_use]
pub fn hyphenate_property(property: &str) -> String {
    if property.starts_with("--") {
        return property.to_owned();
    }

    let mut out = String::with_capacity(property.len() + 4);
    for ch in property.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
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

fn expand_token_references(value: &str, tokens: &TokenDictionary) -> String {
    let with_braces = replace_wrapped_references(value, '{', '}', tokens);
    replace_token_functions(&with_braces, tokens)
}

/// Replace each `{token.path}` occurrence with its CSS-var form, leaving an
/// unterminated `{` (no closing brace) and the rest of the string verbatim.
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
        if let Some(value) = color_mix_or_var(path, tokens) {
            out.push_str(value.as_ref());
        } else {
            out.push_str(&unresolved_wrapped_reference(path));
        }
        rest = &after_open[end + close.len_utf8()..];
    }
    out.push_str(rest);
    out
}

/// Replace each `token(path, fallback?)` call with the resolved var, using the
/// fallback (or the raw path) when the token is unknown. Paren-matched so
/// nested `token(...)` args don't truncate early.
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
        let path = path.trim();
        if let Some(value) = color_mix_or_var(path, tokens) {
            out.push_str(value.as_ref());
        } else {
            let value = fallback.map_or_else(|| css_escape(path), |value| value.trim().to_owned());
            out.push_str(value.as_str());
        }
        rest = &after_open[end + 1..];
    }
    out.push_str(rest);
    out
}

fn unresolved_wrapped_reference(path: &str) -> String {
    if is_token_path_like(path) {
        css_escape(path)
    } else {
        path.to_owned()
    }
}

fn is_token_path_like(path: &str) -> bool {
    path.as_bytes()
        .windows(3)
        .any(|window| is_word_byte(window[0]) && window[1] == b'.' && is_word_byte(window[2]))
}

fn is_plain_token_path_like(value: &str) -> bool {
    let value = value.trim();
    let value = split_top_level_slash(value).map_or(value, |(path, _)| path.trim());
    let Some(first) = value.bytes().next() else {
        return false;
    };

    (first.is_ascii_alphabetic() || first == b'_')
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'))
        && is_token_path_like(value)
}

fn is_word_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_'
}

fn color_mix_or_var<'a>(path: &'a str, tokens: &'a TokenDictionary) -> Option<Cow<'a, str>> {
    if path.contains('/') {
        return tokens.color_mix_str(path).map(Cow::Owned);
    }
    tokens.get_var_str(path, None).map(Cow::Borrowed)
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
    use super::split_top_level_slash;

    #[test]
    fn splits_token_opacity_modifier() {
        assert_eq!(split_top_level_slash("red/40"), Some(("red", "40")));
    }

    #[test]
    fn ignores_slash_inside_css_color_function() {
        assert_eq!(split_top_level_slash("rgb(251 146 60 / 0.3)"), None);
    }

    #[test]
    fn splits_after_css_function() {
        assert_eq!(
            split_top_level_slash("color(display-p3 1 0 0 / 0.5)/40"),
            Some(("color(display-p3 1 0 0 / 0.5)", "40"))
        );
    }

    #[test]
    fn ignores_escaped_or_quoted_slashes() {
        assert_eq!(
            split_top_level_slash(r"foo\/bar/40"),
            Some((r"foo\/bar", "40"))
        );
        assert_eq!(
            split_top_level_slash(r#"url("/x/y")/40"#),
            Some((r#"url("/x/y")"#, "40"))
        );
    }
}
