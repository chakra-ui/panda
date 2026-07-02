//! Inputs every generator reads: the resolved config, the derived [`TypeData`]
//! (token/condition/property type info for the `.d.ts` artifacts), and
//! per-pattern codegen metadata. [`CodegenContext`] borrows them; [`CodegenInput`]
//! owns them for callers that build the data up first.

use std::{collections::BTreeMap, sync::Arc};

use pandacss_config::{DEFAULT_PATTERN_JSX_ELEMENT, PatternConfig, TypeData, UserConfig};
use pandacss_shared::{file_stem, js_ident, pascal_case};
use pandacss_tokens::TokenDictionary;

use crate::CodegenOverlay;

#[derive(Debug, Clone, Copy)]
pub struct CodegenContext<'a> {
    pub config: &'a UserConfig,
    pub types: &'a TypeData,
    pub patterns: &'a BTreeMap<String, PatternCodegenMeta>,
    pub token_dictionary: Option<&'a TokenDictionary>,
    pub token_dictionary_provided: bool,
    pub overlay: Option<&'a CodegenOverlay>,
}

#[derive(Debug, Clone, Default)]
pub struct CodegenInput {
    pub config: UserConfig,
    pub types: TypeData,
    pub patterns: BTreeMap<String, PatternCodegenMeta>,
    pub token_dictionary: Option<Arc<TokenDictionary>>,
    pub token_dictionary_provided: bool,
    pub overlay: Option<CodegenOverlay>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PatternCodegenMeta {
    pub config_source: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PatternJsxCodegenMeta {
    pub stem: String,
    pub raw_name: String,
    pub jsx_name: String,
    pub jsx_element: String,
    pub props_name: String,
    pub component_props: String,
    pub html_props: String,
    pub omit_keys: String,
}

impl<'a> CodegenContext<'a> {
    #[must_use]
    pub fn new(config: &'a UserConfig) -> Self {
        Self {
            config,
            types: empty_types(),
            patterns: empty_patterns(),
            token_dictionary: None,
            token_dictionary_provided: false,
            overlay: None,
        }
    }

    #[must_use]
    pub fn from_input(input: &'a CodegenInput) -> Self {
        Self {
            config: &input.config,
            types: &input.types,
            patterns: &input.patterns,
            token_dictionary: input.token_dictionary.as_deref(),
            token_dictionary_provided: input.token_dictionary_provided
                || input.token_dictionary.is_some(),
            overlay: input.overlay.as_ref(),
        }
    }

    #[must_use]
    pub fn condition_keys(&self) -> Vec<String> {
        self.config.condition_names()
    }

    #[must_use]
    pub fn jsx_factory(&self) -> &str {
        self.config.jsx_factory()
    }

    #[must_use]
    pub fn has_recipe_artifacts(&self) -> bool {
        !self.config.theme.recipes.is_empty() || !self.config.theme.slot_recipes.is_empty()
    }

    #[must_use]
    pub fn separator(&self) -> &str {
        self.config.separator()
    }

    #[must_use]
    pub fn pattern_jsx_meta(&self, name: &str, pattern: &PatternConfig) -> PatternJsxCodegenMeta {
        let stem = file_stem(name);
        let raw_name = format!("{}Raw", js_ident(name));
        let upper_name = pascal_case(name);
        let props_name = format!("{upper_name}Properties");
        let component_props = format!("{upper_name}Props");
        let jsx_name = pattern
            .jsx_name
            .clone()
            .unwrap_or_else(|| pascal_case(name));
        let jsx_element = pattern
            .extra
            .get("jsxElement")
            .and_then(serde_json::Value::as_str)
            .unwrap_or(DEFAULT_PATTERN_JSX_ELEMENT)
            .to_owned();
        let html_props = format!("HTML{}Props", pascal_case(self.jsx_factory()));
        let blocklist = self.types.patterns.patterns.get(name).map_or_else(
            || pattern.blocklist.clone(),
            |definition| definition.blocklist.clone(),
        );

        PatternJsxCodegenMeta {
            stem,
            raw_name,
            jsx_name,
            jsx_element,
            props_name: props_name.clone(),
            component_props,
            html_props,
            omit_keys: pattern_omit_keys(&props_name, &blocklist),
        }
    }
}

fn pattern_omit_keys(properties_name: &str, blocklist: &[String]) -> String {
    let mut keys = vec![format!("keyof {properties_name}")];
    keys.extend(blocklist.iter().map(|key| format!("{key:?}")));
    keys.join(" | ")
}

fn empty_types() -> &'static TypeData {
    static EMPTY: std::sync::OnceLock<TypeData> = std::sync::OnceLock::new();
    EMPTY.get_or_init(TypeData::default)
}

fn empty_patterns() -> &'static BTreeMap<String, PatternCodegenMeta> {
    static EMPTY: std::sync::OnceLock<BTreeMap<String, PatternCodegenMeta>> =
        std::sync::OnceLock::new();
    EMPTY.get_or_init(BTreeMap::new)
}
