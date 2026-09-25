//! Host-neutral output orchestration shared by the native and WASM bindings.
//!
//! - [`css`] composes project snapshots with stylesheet emission.
//! - [`codegen`] renders generated styled-system artifacts.
//! - [`views`] derives compiler-facing config and tooling views.

mod codegen;
mod css;
mod views;

pub use codegen::{
    CodegenArtifact, CodegenFile, CodegenOverlay, GenerateArtifactOptions,
    generate_affected_artifacts, generate_artifact, generate_artifacts,
};
pub use css::{
    CompileFileManifest, CompileLayerRange, CompileLayerRanges, CompileManifest, CompileOutput,
    CssOutputOptions, SplitCssFile, SplitCssOutput, compile_css, compile_keyframes, compile_layers,
    compile_split_css,
};
pub use views::{
    LayerNames, SourceEntry, compiler_spec, has_layer_declaration, layer_names, source_entries,
    strip_layer_order_statements,
};
