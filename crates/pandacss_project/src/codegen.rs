use std::collections::BTreeMap;

use pandacss_codegen::{
    Artifact, ArtifactGraph, ArtifactId, CodegenInput, DependencySet, GenerateOptions,
    PatternCodegenMeta,
};
use pandacss_config::{SelectorTypeData, TypeData, UserConfig};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;

use crate::Project;

impl Project {
    #[must_use]
    pub fn codegen_input(&self, user_config: &UserConfig) -> CodegenInput {
        let _span = tracing::trace_span!(target: "codegen", "codegen_input").entered();
        let token_dictionary = self.config().token_dictionary();
        let types = self.type_data_with_token_dictionary(user_config, token_dictionary.as_deref());
        let patterns = {
            let _span =
                tracing::trace_span!(target: "codegen", "codegen_input_pattern_meta").entered();
            pattern_codegen_meta(user_config)
        };
        let config_clone = {
            let _span =
                tracing::trace_span!(target: "codegen", "codegen_input_clone_config").entered();
            user_config.clone()
        };
        CodegenInput {
            config: config_clone,
            types,
            patterns,
            token_dictionary,
            token_dictionary_provided: true,
        }
    }

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
        let options = {
            let _span = tracing::trace_span!(target: "codegen", "type_data_options").entered();
            user_config.typegen_options()
        };
        let conditions = {
            let _span = tracing::trace_span!(target: "codegen", "type_data_conditions").entered();
            user_config.condition_type_data()
        };
        let tokens = {
            let _span = tracing::trace_span!(target: "codegen", "type_data_tokens").entered();
            token_dictionary
                .map(TokenDictionary::type_data)
                .unwrap_or_default()
        };
        let utilities = {
            let _span = tracing::trace_span!(target: "codegen", "type_data_utilities").entered();
            self.config()
                .utility()
                .map(Utility::type_data)
                .unwrap_or_default()
        };
        let keyframes = {
            let _span = tracing::trace_span!(target: "codegen", "type_data_keyframes").entered();
            user_config.keyframe_type_data()
        };
        let patterns = {
            let _span = tracing::trace_span!(target: "codegen", "type_data_patterns").entered();
            user_config.pattern_type_data()
        };
        let recipes = {
            let _span = tracing::trace_span!(target: "codegen", "type_data_recipes").entered();
            user_config.recipe_type_data()
        };

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

    #[must_use]
    pub fn generate_artifacts(
        &self,
        user_config: &UserConfig,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let span = tracing::trace_span!(
            target: "codegen",
            "codegen_generate",
            artifact_count = tracing::field::Empty
        );
        let _entered = span.enter();
        let artifacts =
            ArtifactGraph.generate_with_input(&self.codegen_input(user_config), options);
        span.record("artifact_count", artifacts.len());
        artifacts
    }

    #[must_use]
    pub fn generate_artifact(
        &self,
        user_config: &UserConfig,
        id: ArtifactId,
        options: GenerateOptions,
    ) -> Option<Artifact> {
        let _span = tracing::trace_span!(target: "codegen", "artifact", id = id.as_str()).entered();
        self.generate_artifacts(user_config, options)
            .into_iter()
            .find(|artifact| artifact.id == id)
    }

    /// Regenerates only the artifacts whose config dependencies intersect `changed`.
    #[must_use]
    pub fn generate_affected_artifacts(
        &self,
        user_config: &UserConfig,
        changed: DependencySet,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let span = tracing::trace_span!(
            target: "codegen",
            "affected_artifacts",
            artifact_count = tracing::field::Empty
        );
        let _entered = span.enter();
        let artifacts = ArtifactGraph.generate_affected_with_input(
            &self.codegen_input(user_config),
            changed,
            options,
        );
        span.record("artifact_count", artifacts.len());
        artifacts
    }
}

/// Pattern transform/defaultValues source from the JS config loader, embedded
/// verbatim by the pattern generator. No source falls back to identity.
fn pattern_codegen_meta(config: &UserConfig) -> BTreeMap<String, PatternCodegenMeta> {
    config
        .patterns
        .iter()
        .filter_map(|(name, pattern)| {
            pattern.codegen_source.as_ref().map(|source| {
                (
                    name.clone(),
                    PatternCodegenMeta {
                        config_source: source.clone(),
                    },
                )
            })
        })
        .collect()
}
