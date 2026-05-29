use std::collections::BTreeMap;

use pandacss_codegen::{
    Artifact, ArtifactGraph, ArtifactId, CodegenInput, DependencySet, GenerateOptions,
    PatternCodegenMeta,
};
use pandacss_config::{RecipeTypeData, SelectorTypeData, TypeData, UserConfig};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;

use crate::Project;

impl Project {
    #[must_use]
    pub fn codegen_input(&self, user_config: &UserConfig) -> CodegenInput {
        let _span = tracing::trace_span!("codegen_input").entered();
        CodegenInput {
            config: user_config.clone(),
            types: self.type_data(user_config),
            patterns: BTreeMap::<String, PatternCodegenMeta>::new(),
        }
    }

    #[must_use]
    pub fn type_data(&self, user_config: &UserConfig) -> TypeData {
        let _span = tracing::trace_span!("type_data").entered();
        TypeData {
            options: user_config.typegen_options(),
            conditions: user_config.condition_type_data(),
            selectors: SelectorTypeData::default(),
            tokens: self
                .config()
                .token_dictionary()
                .as_deref()
                .map(TokenDictionary::type_data)
                .unwrap_or_default(),
            utilities: self
                .config()
                .utility()
                .map(Utility::type_data)
                .unwrap_or_default(),
            patterns: user_config.pattern_type_data(),
            recipes: RecipeTypeData::default(),
        }
    }

    #[must_use]
    pub fn generate_artifacts(
        &self,
        user_config: &UserConfig,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let _span = tracing::trace_span!("codegen_generate").entered();
        ArtifactGraph.generate_with_input(&self.codegen_input(user_config), options)
    }

    #[must_use]
    pub fn generate_artifact(
        &self,
        user_config: &UserConfig,
        id: ArtifactId,
        options: GenerateOptions,
    ) -> Option<Artifact> {
        let _span = tracing::trace_span!("codegen_generate_artifact", id = id.as_str()).entered();
        self.generate_artifacts(user_config, options)
            .into_iter()
            .find(|artifact| artifact.id == id)
    }

    #[must_use]
    pub fn generate_affected_artifacts(
        &self,
        user_config: &UserConfig,
        changed: DependencySet,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let _span = tracing::trace_span!("codegen_generate_affected").entered();
        ArtifactGraph.generate_affected_with_input(
            &self.codegen_input(user_config),
            changed,
            options,
        )
    }
}
