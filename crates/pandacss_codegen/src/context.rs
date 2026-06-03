//! Inputs every generator reads: the resolved config, the derived [`TypeData`]
//! (token/condition/property type info for the `.d.ts` artifacts), and
//! per-pattern codegen metadata. [`CodegenContext`] borrows them; [`CodegenInput`]
//! owns them for callers that build the data up first.

use std::{collections::BTreeMap, sync::Arc};

use pandacss_config::{TypeData, UserConfig};
use pandacss_tokens::TokenDictionary;

#[derive(Debug, Clone, Copy)]
pub struct CodegenContext<'a> {
    pub config: &'a UserConfig,
    pub types: &'a TypeData,
    pub patterns: &'a BTreeMap<String, PatternCodegenMeta>,
    pub token_dictionary: Option<&'a TokenDictionary>,
    pub token_dictionary_provided: bool,
}

#[derive(Debug, Clone, Default)]
pub struct CodegenInput {
    pub config: UserConfig,
    pub types: TypeData,
    pub patterns: BTreeMap<String, PatternCodegenMeta>,
    pub token_dictionary: Option<Arc<TokenDictionary>>,
    pub token_dictionary_provided: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PatternCodegenMeta {
    pub config_source: String,
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
        }
    }

    #[must_use]
    pub fn condition_keys(&self) -> Vec<String> {
        self.config.condition_names()
    }
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
