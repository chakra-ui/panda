use pandacss_config::UserConfig;
use pandacss_encoder::EncodedRecipesSnapshot;
use pandacss_project::{Project, ProjectStylesheetSnapshots};
use pandacss_stylesheet::{StylesheetInput, StylesheetLayer, StylesheetOptions, StylesheetOutput};
use pandacss_system::System;

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
pub fn compile_tsx_layer_css(
    config: &UserConfig,
    source: &str,
    layers: &[StylesheetLayer],
) -> String {
    let mut project = project_with_file(config, "/style.tsx", source);
    let snapshots = project.stylesheet_snapshots(config);
    pandacss_stylesheet::compile(
        project_input(config, &snapshots),
        &with_static(StylesheetOptions::default()),
    )
    .get_layer_css(layers)
}

#[allow(dead_code)]
#[allow(
    clippy::needless_pass_by_value,
    reason = "test helper; owned options read more naturally at call sites"
)]
pub fn compile_output(
    config: &UserConfig,
    source: &str,
    options: StylesheetOptions,
) -> StylesheetOutput {
    let mut project = project_with_source(config, source);
    let snapshots = project.stylesheet_snapshots(config);
    pandacss_stylesheet::compile(project_input(config, &snapshots), &with_static(options))
}

#[allow(dead_code)]
#[allow(
    clippy::needless_pass_by_value,
    reason = "test helper; owned options read more naturally at call sites"
)]
pub fn compile_keyframes_output(
    config: &UserConfig,
    source: &str,
    options: StylesheetOptions,
) -> StylesheetOutput {
    let mut project = project_with_source(config, source);
    let snapshots = project.stylesheet_snapshots(config);
    pandacss_stylesheet::compile_keyframes(project_input(config, &snapshots), &with_static(options))
}

#[allow(dead_code)]
pub fn split_output(
    config: &UserConfig,
    source: &str,
    options: StylesheetOptions,
) -> Vec<pandacss_stylesheet::SplitCssFile> {
    split_result(config, source, options).files
}

#[allow(dead_code)]
#[allow(
    clippy::needless_pass_by_value,
    reason = "test helper; owned options read more naturally at call sites"
)]
pub fn split_result(
    config: &UserConfig,
    source: &str,
    options: StylesheetOptions,
) -> pandacss_stylesheet::SplitCssOutput {
    let mut project = project_with_source(config, source);
    let snapshots = project.stylesheet_snapshots(config);
    pandacss_stylesheet::split_css(&project_input(config, &snapshots), &with_static(options))
}

fn project_with_source(config: &UserConfig, source: &str) -> Project {
    project_with_file(config, "/style.ts", source)
}

fn project_with_file(config: &UserConfig, path: &str, source: &str) -> Project {
    let system = System::new(config.clone()).expect("valid project");
    let mut project = Project::new(system);
    project.parse_file(path, source);
    project
}

fn with_static(options: StylesheetOptions) -> StylesheetOptions {
    StylesheetOptions {
        include_static: true,
        ..options
    }
}

/// Everything the project extracted, ready to compile.
#[allow(dead_code)]
pub fn project_input<'a>(
    config: &'a UserConfig,
    snapshots: &ProjectStylesheetSnapshots<'a>,
) -> StylesheetInput<'a> {
    StylesheetInput {
        config,
        token_dictionary: None,
        atoms: snapshots.atoms,
        utility_styles: snapshots.utility_styles,
        view_transitions: snapshots.view_transitions,
        position_try: snapshots.position_try,
        inline_keyframes: snapshots.inline_keyframes,
        encoded_recipes: snapshots.encoded_recipes,
        static_encoded_recipes: Some(snapshots.static_encoded_recipes),
        static_pattern_atoms: &[],
        token_refs: snapshots.token_refs,
    }
}

/// No source usage at all; tests fill in the one input they exercise.
#[allow(dead_code)]
pub fn empty_input(config: &UserConfig) -> StylesheetInput<'_> {
    StylesheetInput {
        config,
        token_dictionary: None,
        atoms: &[],
        utility_styles: Box::leak(Box::default()),
        view_transitions: &[],
        position_try: &[],
        inline_keyframes: &[],
        encoded_recipes: Box::leak(Box::new(EncodedRecipesSnapshot {
            base: Vec::new(),
            variants: Vec::new(),
            compounds: Vec::new(),
            atomic: Vec::new(),
        })),
        static_encoded_recipes: None,
        static_pattern_atoms: &[],
        token_refs: &[],
    }
}

/// Deep-merge `patch` into `target`; a `null` in the patch removes the key.
#[allow(dead_code)]
pub fn merge(target: &mut serde_json::Value, patch: serde_json::Value) {
    match (target, patch) {
        (serde_json::Value::Object(target), serde_json::Value::Object(patch)) => {
            for (key, value) in patch {
                if value.is_null() {
                    target.remove(&key);
                } else {
                    merge(target.entry(key).or_insert(serde_json::Value::Null), value);
                }
            }
        }
        (target, patch) => *target = patch,
    }
}
