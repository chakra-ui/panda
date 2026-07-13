//! Typegen projection: building [`UtilityTypeData`] from utility metadata.

use std::collections::{BTreeMap, BTreeSet};

use pandacss_config::{
    Deprecated, PrimitiveType, UtilityPropertyTypeData, UtilityTypeData, ValueAliasTypeData,
    ValueTypePart, value_alias_name,
};
use pandacss_extractor::Literal;
use pandacss_shared::{hyphenate_property, pascal_case};
use pandacss_tokens::{TokenCategory, TokenDictionary};
use rustc_hash::FxHashMap;

use crate::{Utility, UtilityProperty};

impl Utility {
    /// Projects the utility metadata into the codegen [`UtilityTypeData`].
    #[must_use]
    pub fn type_data(&self) -> UtilityTypeData {
        let _span = tracing::trace_span!(
            target: "codegen",
            "utility_type_data",
            property_count = self.properties.len(),
            shorthand_count = self.shorthands.len()
        )
        .entered();
        let mut properties = BTreeMap::new();
        let mut aliases = BTreeMap::new();
        let mut class_names = BTreeMap::new();

        // Codegen snapshot, not a hot path — sort once for stable output across runs.
        let mut property_entries = self.properties.iter().collect::<Vec<_>>();
        property_entries.sort_unstable_by(|(left, _), (right, _)| left.cmp(right));

        let tokens = self.tokens.as_deref();
        {
            let _span =
                tracing::trace_span!(target: "codegen", "utility_type_data_properties").entered();
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
        }

        let mut shorthands = BTreeMap::new();
        let mut shorthand_entries = self.shorthands.iter().collect::<Vec<_>>();
        shorthand_entries.sort_unstable_by(|(left, _), (right, _)| left.cmp(right));

        let _shorthand_span =
            tracing::trace_span!(target: "codegen", "utility_type_data_shorthands").entered();
        for (name, target) in shorthand_entries {
            if !self.shorthands_enabled {
                continue;
            }
            shorthands.insert(name.clone(), target.clone());

            let Some(property) = self.properties.get(target) else {
                continue;
            };

            let data = property_type_data(name, property, tokens);

            // Shorthands often share their longhand's alias — keep one body, reference by name.
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
}

/// Type info for one property: sorted literal value keys, plus the value-alias
/// type name (a token category alias, or `<Prop>Value`).
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

/// Collapses a value map that covers a whole token category (e.g.
/// `values(theme) { ...theme('spacing') }`) to `TokenValue<"category">`,
/// matching v1's `type:Tokens["…"]` stub.
fn collapse_inferred_token_category(
    literals: Vec<String>,
    explicit_category: Option<&str>,
    tokens: Option<&TokenDictionary>,
) -> (Option<String>, Vec<String>) {
    if let Some(category) = explicit_category {
        let token_category = TokenCategory::from_path_segment(category);
        let empty_known = !matches!(token_category, TokenCategory::Other(_))
            && tokens.is_some_and(|tokens| {
                tokens
                    .category_values_str(&token_category)
                    .is_none_or(FxHashMap::is_empty)
            });
        if empty_known {
            return (None, literals);
        }
        return (Some(category.to_owned()), literals);
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

/// `values: { type: 'boolean' }` is a primitive type hint, not a values map.
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

/// Union of value-type parts a property's alias accepts, in generated-type
/// order: token category, mapped CSS property, literals, primitive fallback.
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
