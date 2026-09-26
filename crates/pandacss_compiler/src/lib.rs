//! Host-neutral output orchestration shared by the native and WASM bindings.
//!
//! - [`css`] composes project snapshots with stylesheet emission.
//! - [`codegen`] renders generated styled-system artifacts.
//! - [`views`] derives compiler-facing config and tooling views.
//! - [`inspect_file_source`] classifies a file's Panda usages for lint and IDE tooling.

mod callbacks;
mod codegen;
mod css;
mod design_system;
mod design_system_imports;
mod hook_filter;
mod host;
mod inspection;
mod output;
mod setup;
mod usages;
mod views;

pub use callbacks::{
    CallbackError, PatternTransformCache, TransformCache, UtilityTransformCache,
    apply_pattern_transform, apply_source_transforms, apply_utility_transform, callback_diagnostic,
    pattern_transform_refs, utility_transform_refs, utility_values_callback_id,
};
pub use codegen::{
    CodegenArtifact, CodegenError, CodegenFile, CodegenOverlay, GenerateArtifactOptions,
    generate_affected_artifacts, generate_artifact, generate_artifacts,
};
pub use css::{
    CompileFileManifest, CompileLayerRange, CompileLayerRanges, CompileManifest, CompileOutput,
    CssOutputOptions, SplitCssFile, SplitCssOutput, compile_css, compile_keyframes, compile_layers,
    compile_split_css,
};
pub use design_system::{
    DesignSystemManifest, MANIFEST_SCHEMA_VERSION, ManifestImportMap, ManifestInput,
    design_system_manifest,
};
pub use design_system_imports::{DesignSystemImportQuery, design_system_import_selections};
pub use hook_filter::HookFilter;
pub use host::{
    atom_value_json, format_config_diagnostics, sorted_atoms, token_suggestion_json,
    utility_value_source_json,
};
pub use inspection::{
    ComponentEntryKind, ComponentEntryRef, FileInspectionResult, StyleEntryFixability,
    StyleEntryKind, StyleEntryOrigin, StyleEntryRef, StyleEntrySyntax, TokenRefSite, UsageKind,
    UsageSite,
};
pub use output::{WriteError, write_output_file, write_relative_files};
pub use setup::{LoadSystemError, LoadedSystem, load_system};
pub use usages::{inspect_file_source, suggest_semantic_tokens, suggest_tokens};
pub use views::{
    LayerNames, SourceEntry, SourceGlobOverrides, compiler_spec, has_layer_declaration,
    layer_names, source_entries, source_glob_options, strip_layer_order_statements,
};
