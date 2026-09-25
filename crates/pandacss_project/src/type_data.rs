use pandacss_config::{SelectorTypeData, TypeData, UserConfig};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;

use crate::Project;

impl Project {
    /// Assembles [`TypeData`] from compiled state (tokens, utilities) and config.
    #[must_use]
    pub fn type_data(&self, user_config: &UserConfig) -> TypeData {
        let _span = tracing::trace_span!(target: "codegen", "type_data").entered();
        let token_dictionary = self.config().token_dictionary();
        self.type_data_with_token_dictionary(user_config, token_dictionary.as_deref())
    }

    fn type_data_with_token_dictionary(
        &self,
        user_config: &UserConfig,
        token_dictionary: Option<&TokenDictionary>,
    ) -> TypeData {
        let options = user_config.typegen_options();
        let conditions = user_config.condition_type_data();
        let tokens = token_dictionary
            .map(TokenDictionary::type_data)
            .unwrap_or_default();
        let utilities = self
            .config()
            .utility()
            .map(Utility::type_data)
            .unwrap_or_default();
        let keyframes = user_config.keyframe_type_data();
        let patterns = user_config.pattern_type_data();
        let recipes = user_config.recipe_type_data();

        TypeData {
            options,
            conditions,
            selectors: SelectorTypeData::default(),
            tokens,
            utilities,
            keyframes,
            patterns,
            recipes,
        }
    }
}
