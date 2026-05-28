use pandacss_config::UserConfig;
use pandacss_project::{Project, System};
use pandacss_stylesheet::{StylesheetInput, StylesheetLayer, StylesheetOptions};

pub fn config(value: serde_json::Value) -> UserConfig {
    serde_json::from_value(value).expect("valid config")
}

#[allow(dead_code)]
pub fn compile_css(config: &UserConfig, source: &str) -> String {
    compile_css_with_options(config, source, StylesheetOptions::default())
}

#[allow(dead_code)]
pub fn compile_css_with_options(
    config: &UserConfig,
    source: &str,
    options: StylesheetOptions,
) -> String {
    compile_output(config, source, options).css
}

#[allow(dead_code)]
pub fn compile_layer_css(config: &UserConfig, source: &str, layers: &[StylesheetLayer]) -> String {
    compile_output(config, source, StylesheetOptions::default()).get_layer_css(layers)
}

#[allow(dead_code)]
pub fn compile_output(
    config: &UserConfig,
    source: &str,
    options: StylesheetOptions,
) -> pandacss_stylesheet::StylesheetOutput {
    let system = System::new(config.clone()).expect("valid project");
    let mut project = Project::new(system);
    project.parse_file("/style.ts", source);
    let snapshots = project.stylesheet_snapshots(config);
    pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            token_dictionary: None,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &[],
        },
        &StylesheetOptions {
            include_static: true,
            ..options
        },
    )
}
