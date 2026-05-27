use pandacss_config::UserConfig;
use pandacss_project::Project;
use pandacss_stylesheet::{StylesheetInput, StylesheetOptions};

pub fn config(value: serde_json::Value) -> UserConfig {
    serde_json::from_value(value).expect("valid config")
}

pub fn compile_css(config: &UserConfig, source: &str) -> String {
    compile_css_with_options(config, source, StylesheetOptions::default())
}

pub fn compile_css_with_options(
    config: &UserConfig,
    source: &str,
    options: StylesheetOptions,
) -> String {
    let mut project = Project::from_config(config.clone()).expect("valid project");
    project.parse_file("/style.ts", source);
    let snapshot = project.encoded_recipes().snapshot();
    let static_snapshot = project.static_encoded_recipes(config);
    let atoms = project.atoms().iter().collect::<Vec<_>>();
    pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            atoms,
            encoded_recipes: &snapshot,
            static_encoded_recipes: Some(&static_snapshot),
        },
        &StylesheetOptions {
            include_static: true,
            ..options
        },
    )
    .css
}
