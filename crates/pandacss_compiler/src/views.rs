use pandacss_config::{Spec, UserConfig};
use pandacss_fs::PathSystem;
use pandacss_project::Project;
use serde::Serialize;

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

/// Build the tooling spec from project-derived types and stylesheet ordering.
#[must_use]
pub fn compiler_spec(project: &Project, user_config: &UserConfig) -> Spec {
    let types = project.type_data(user_config);
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
