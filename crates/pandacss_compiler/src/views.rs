use pandacss_config::{SelectorTypeData, Spec, TypeData, UserConfig};
use pandacss_fs::{GlobOptions, PathSystem};
use pandacss_project::Project;
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;
use serde::{Deserialize, Serialize};

/// Resolved cascade-layer names exposed to compiler hosts.
#[derive(Serialize)]
pub struct LayerNames {
    pub reset: String,
    pub base: String,
    pub tokens: String,
    pub recipes: String,
    pub utilities: String,
}

/// A source glob paired with the static directory a watcher subscribes to.
#[derive(Serialize)]
pub struct SourceEntry {
    pub base: String,
    pub pattern: String,
}

pub(crate) fn type_data(project: &Project, user_config: &UserConfig) -> TypeData {
    let _span = tracing::trace_span!(target: "codegen", "type_data").entered();
    let token_dictionary = project.system().token_dictionary();
    TypeData {
        options: user_config.typegen_options(),
        conditions: user_config.condition_type_data(),
        selectors: SelectorTypeData::default(),
        tokens: token_dictionary
            .as_deref()
            .map(TokenDictionary::type_data)
            .unwrap_or_default(),
        utilities: project
            .system()
            .utility()
            .map(Utility::type_data)
            .unwrap_or_default(),
        keyframes: user_config.keyframe_type_data(),
        patterns: user_config.pattern_type_data(),
        recipes: user_config.recipe_type_data(),
    }
}

/// Build the tooling spec from project-derived types and stylesheet ordering.
#[must_use]
pub fn compiler_spec(project: &Project, user_config: &UserConfig) -> Spec {
    let types = type_data(project, user_config);
    let property_order = pandacss_stylesheet::order_properties(
        types.utilities.properties.keys().map(String::as_str),
    );
    Spec {
        types,
        property_order,
        jsx_factory: Some(user_config.jsx_factory().to_owned()),
        import_map: user_config.import_map.clone(),
    }
}

/// Return resolved cascade-layer names.
#[must_use]
pub fn layer_names(user_config: &UserConfig) -> LayerNames {
    let layers = &user_config.layers;
    LayerNames {
        reset: layers.reset.clone(),
        base: layers.base.clone(),
        tokens: layers.tokens.clone(),
        recipes: layers.recipes.clone(),
        utilities: layers.utilities.clone(),
    }
}

/// Return watcher-ready source globs for the host path model.
#[must_use]
pub fn source_entries(user_config: &UserConfig, paths: &impl PathSystem) -> Vec<SourceEntry> {
    user_config
        .include
        .iter()
        .map(|pattern| SourceEntry {
            base: pandacss_fs::resolve_glob_base(paths, &user_config.cwd, pattern),
            pattern: pandacss_fs::relative_glob(pattern).to_owned(),
        })
        .collect()
}

/// Host overrides for a source scan. Omitted fields fall back to the config's
/// `include`, `exclude` and `cwd`.
#[derive(Clone, Debug, Default, Deserialize)]
pub struct SourceGlobOverrides {
    pub include: Option<Vec<String>>,
    pub exclude: Option<Vec<String>>,
    pub cwd: Option<String>,
}

/// Glob options that decide which files count as project sources.
#[must_use]
pub fn source_glob_options(
    user_config: &UserConfig,
    overrides: SourceGlobOverrides,
) -> GlobOptions {
    GlobOptions {
        include: overrides
            .include
            .unwrap_or_else(|| user_config.include.clone()),
        exclude: overrides
            .exclude
            .unwrap_or_else(|| user_config.scan_exclude()),
        cwd: overrides
            .cwd
            .unwrap_or_else(|| user_config.cwd.clone())
            .into(),
        absolute: true,
    }
}

/// Whether CSS declares this compiler's configured Panda layer order.
#[must_use]
pub fn has_layer_declaration(user_config: &UserConfig, css: &str) -> bool {
    let names = user_config.layers.ordered().map(|(_, name)| name);
    pandacss_stylesheet::has_layer_declaration(css, &names)
}

/// Remove this compiler's Panda layer-order statements from CSS.
#[must_use]
pub fn strip_layer_order_statements(user_config: &UserConfig, css: &str) -> String {
    let names = user_config.layers.ordered().map(|(_, name)| name);
    pandacss_stylesheet::strip_layer_order_statements(css, &names)
}
