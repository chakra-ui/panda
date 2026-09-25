use std::collections::BTreeMap;

use pandacss_codegen::{
    Artifact, ArtifactGraph, ArtifactId, CodegenInput, DependencySet, PatternCodegenMeta,
};
use pandacss_config::UserConfig;
use pandacss_project::Project;
use serde::{Deserialize, Serialize};

/// Host-neutral codegen options shared by native and WASM bindings.
#[derive(Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateArtifactOptions {
    pub force_import_extension: Option<bool>,
    pub overlay: Option<CodegenOverlay>,
}

/// Runtime module overrides supplied by the JS driver.
#[derive(Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodegenOverlay {
    pub jsx: String,
    pub recipes: String,
    pub patterns: String,
    pub css: String,
    pub helpers: String,
    pub owned_recipes: Vec<String>,
    pub owned_patterns: Vec<String>,
    pub virtualize_helpers: bool,
    pub virtualize_css: bool,
}

/// One generated styled-system artifact.
#[derive(Serialize)]
pub struct CodegenArtifact {
    pub id: String,
    pub files: Vec<CodegenFile>,
}

/// One generated file and the config fields that affect it.
#[derive(Serialize)]
pub struct CodegenFile {
    pub path: String,
    pub code: String,
    pub dependencies: Vec<String>,
}

/// Generate every artifact from the resolved compiler state.
#[must_use]
pub fn generate_artifacts(
    project: &Project,
    user_config: &UserConfig,
    options: GenerateArtifactOptions,
) -> Vec<CodegenArtifact> {
    let span = tracing::trace_span!(
        target: "codegen",
        "codegen_generate",
        artifact_count = tracing::field::Empty
    );
    let _entered = span.enter();
    let generate_options = generate_options(user_config, options.force_import_extension);
    let input = codegen_input(project, user_config, options.overlay);
    let artifacts = ArtifactGraph.generate_all(&input, generate_options);
    span.record("artifact_count", artifacts.len());
    artifacts.into_iter().map(to_codegen_artifact).collect()
}

/// Generate one artifact by its public id.
///
/// # Errors
/// Returns an error when `id` is not a known artifact id.
pub fn generate_artifact(
    project: &Project,
    user_config: &UserConfig,
    id: &str,
    options: GenerateArtifactOptions,
) -> Result<Option<CodegenArtifact>, String> {
    let id = id
        .parse::<ArtifactId>()
        .map_err(|()| format!("unknown codegen artifact `{id}`"))?;
    let _span = tracing::trace_span!(target: "codegen", "artifact", id = id.as_str()).entered();
    let generate_options = generate_options(user_config, options.force_import_extension);
    let input = codegen_input(project, user_config, options.overlay);
    Ok(ArtifactGraph
        .generate(&input, generate_options, ArtifactGraph.node(id))
        .pop()
        .map(to_codegen_artifact))
}

/// Generate artifacts affected by the named config dependencies.
///
/// # Errors
/// Returns an error when a dependency name is unknown.
pub fn generate_affected_artifacts(
    project: &Project,
    user_config: &UserConfig,
    dependencies: &[String],
    options: GenerateArtifactOptions,
) -> Result<Vec<CodegenArtifact>, String> {
    let changed = dependency_set_from_names(dependencies)?;
    let span = tracing::trace_span!(
        target: "codegen",
        "affected_artifacts",
        artifact_count = tracing::field::Empty
    );
    let _entered = span.enter();
    let generate_options = generate_options(user_config, options.force_import_extension);
    let input = codegen_input(project, user_config, options.overlay);
    let artifacts =
        ArtifactGraph.generate(&input, generate_options, ArtifactGraph.affected(changed));
    span.record("artifact_count", artifacts.len());
    Ok(artifacts.into_iter().map(to_codegen_artifact).collect())
}

fn codegen_input(
    project: &Project,
    user_config: &UserConfig,
    overlay: Option<CodegenOverlay>,
) -> CodegenInput {
    let _span = tracing::trace_span!(target: "codegen", "codegen_input").entered();
    let token_dictionary = project.config().token_dictionary();
    let patterns = pattern_codegen_meta(user_config);
    CodegenInput {
        config: user_config.clone(),
        types: project.type_data(user_config),
        patterns,
        token_dictionary,
        token_dictionary_provided: true,
        overlay: overlay.map(Into::into),
    }
}

fn generate_options(
    user_config: &UserConfig,
    force_import_extension: Option<bool>,
) -> pandacss_codegen::GenerateOptions {
    pandacss_codegen::GenerateOptions {
        format: user_config.out_extension,
        import_extensions: force_import_extension.unwrap_or(user_config.force_import_extension),
    }
}

fn dependency_set_from_names(dependencies: &[String]) -> Result<DependencySet, String> {
    let mut set = DependencySet::EMPTY;
    for dependency in dependencies {
        let parsed = dependency
            .parse::<pandacss_codegen::ConfigDependency>()
            .map_err(|()| format!("unknown config dependency `{dependency}`"))?;
        set = set.union(DependencySet::one(parsed));
    }
    Ok(set)
}

fn to_codegen_artifact(artifact: Artifact) -> CodegenArtifact {
    CodegenArtifact {
        id: artifact.id.as_str().to_owned(),
        files: artifact
            .files
            .into_iter()
            .map(|file| CodegenFile {
                path: file.path,
                code: file.code,
                dependencies: file
                    .dependencies
                    .to_vec()
                    .into_iter()
                    .map(|dependency| dependency.as_str().to_owned())
                    .collect(),
            })
            .collect(),
    }
}

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

impl From<CodegenOverlay> for pandacss_codegen::CodegenOverlay {
    fn from(overlay: CodegenOverlay) -> Self {
        Self {
            jsx: overlay.jsx,
            recipes: overlay.recipes,
            patterns: overlay.patterns,
            css: overlay.css,
            helpers: overlay.helpers,
            owned_recipes: overlay.owned_recipes,
            owned_patterns: overlay.owned_patterns,
            virtualize_helpers: overlay.virtualize_helpers,
            virtualize_css: overlay.virtualize_css,
        }
    }
}
