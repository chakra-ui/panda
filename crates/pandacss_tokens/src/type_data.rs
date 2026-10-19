//! Typegen projection: building [`TokenTypeData`] from the dictionary.

use std::collections::BTreeMap;

use pandacss_config::{Deprecated, TokenCategoryTypeData, TokenTypeData, token_category_type_name};

use crate::TokenDictionary;

impl TokenDictionary {
    /// Project the dictionary into the codegen [`TokenTypeData`]: per-category
    /// value keys/types, color palettes, the flat `path -> value` runtime map,
    /// and deprecated paths.
    #[must_use]
    pub fn type_data(&self) -> TokenTypeData {
        let mut categories = BTreeMap::new();

        for (category, values) in &self.category_values_cache {
            let name = category.as_str().to_owned();

            let mut values = values.keys().map(ToString::to_string).collect::<Vec<_>>();
            values.sort();
            values.shrink_to_fit();

            categories.insert(
                name.clone(),
                TokenCategoryTypeData {
                    type_name: token_category_type_name(&name),
                    name,
                    values,
                },
            );
        }

        let mut color_palettes = self
            .color_palettes
            .palettes()
            .keys()
            .map(ToString::to_string)
            .collect::<Vec<_>>();
        color_palettes.sort();

        let (raw_values, vars) = self.flat_maps();
        let values = raw_values
            .into_iter()
            .map(|(path, value)| {
                // Empty means the value equals the var-ref; `token.var` derives it via helpers `toCssVar(path)`.
                if vars.get(&path).is_some_and(|var| *var == value) {
                    (path, String::new())
                } else {
                    (path, value)
                }
            })
            .collect();

        TokenTypeData {
            categories,
            color_palettes,
            values,
            deprecated: self
                .deprecated_paths()
                .iter()
                .map(|path| {
                    let reason = self
                        .token(path)
                        .and_then(|token| token.deprecated_reason.clone());
                    let deprecation = reason.map_or(Deprecated::Bool(true), |reason| {
                        Deprecated::Message(reason.to_string())
                    });
                    (path.to_string(), deprecation)
                })
                .collect(),
        }
    }
}
