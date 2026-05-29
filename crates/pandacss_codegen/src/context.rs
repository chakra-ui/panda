use std::collections::BTreeMap;

use pandacss_config::UserConfig;

#[derive(Debug, Clone, Copy)]
pub struct CodegenContext<'a> {
    pub config: &'a UserConfig,
    pub patterns: &'a BTreeMap<String, PatternCodegenMeta>,
}

#[derive(Debug, Clone, Default)]
pub struct CodegenInput {
    pub config: UserConfig,
    pub patterns: BTreeMap<String, PatternCodegenMeta>,
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
            patterns: empty_patterns(),
        }
    }

    #[must_use]
    pub const fn from_input(input: &'a CodegenInput) -> Self {
        Self {
            config: &input.config,
            patterns: &input.patterns,
        }
    }

    #[must_use]
    pub fn condition_keys(&self) -> Vec<String> {
        self.config.condition_names()
    }
}

fn empty_patterns() -> &'static BTreeMap<String, PatternCodegenMeta> {
    static EMPTY: std::sync::OnceLock<BTreeMap<String, PatternCodegenMeta>> =
        std::sync::OnceLock::new();
    EMPTY.get_or_init(BTreeMap::new)
}
