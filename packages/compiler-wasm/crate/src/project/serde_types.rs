use serde::Deserialize;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CompileOutputSerde {
    pub(super) css: String,
    pub(super) source_map: Option<String>,
    pub(super) manifest: CompileManifestSerde,
    pub(super) layer_ranges: CompileLayerRangesSerde,
    pub(super) diagnostics: Vec<pandacss_shared::Diagnostic>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct WriteCssResultSerde {
    pub(super) path: String,
    pub(super) css: String,
    pub(super) source_map: Option<String>,
    pub(super) manifest: CompileManifestSerde,
    pub(super) layer_ranges: CompileLayerRangesSerde,
    pub(super) diagnostics: Vec<pandacss_shared::Diagnostic>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct WriteFilesResultSerde {
    pub(super) root: String,
    pub(super) paths: Vec<String>,
    pub(super) files: Vec<SplitCssFileSerde>,
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CompileOptionsSerde {
    pub(super) emit_layer_declaration: Option<bool>,
    pub(super) minify: Option<bool>,
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct GenerateArtifactOptionsSerde {
    pub(super) force_import_extension: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ResolveUtilityValueInputSerde {
    pub(super) prop: String,
    pub(super) value: serde_json::Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct WriteArtifactsOptionsSerde {
    pub(super) outdir: String,
    pub(super) cwd: Option<String>,
    pub(super) force_import_extension: Option<bool>,
    pub(super) artifacts: Option<Vec<CodegenArtifactSerde>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct LayerCssOptionsSerde {
    pub(super) layers: Vec<String>,
    pub(super) emit_layer_declaration: Option<bool>,
    pub(super) minify: Option<bool>,
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CssOutputOptionsSerde {
    pub(super) layers: Option<Vec<String>>,
    pub(super) emit_layer_declaration: Option<bool>,
    pub(super) minify: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct WriteCssOptionsSerde {
    pub(super) outfile: String,
    pub(super) cwd: Option<String>,
    pub(super) emit_layer_declaration: Option<bool>,
    pub(super) minify: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct WriteLayerCssOptionsSerde {
    pub(super) outfile: String,
    pub(super) cwd: Option<String>,
    pub(super) layers: Vec<String>,
    pub(super) emit_layer_declaration: Option<bool>,
    pub(super) minify: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct WriteSplitCssOptionsSerde {
    pub(super) outdir: String,
    pub(super) cwd: Option<String>,
    pub(super) layers: Option<Vec<String>>,
    pub(super) emit_layer_declaration: Option<bool>,
    pub(super) minify: Option<bool>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CompileManifestSerde {
    pub(super) files: Vec<CompileFileManifestSerde>,
    pub(super) tokens: Vec<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CompileFileManifestSerde {
    pub(super) path: String,
    pub(super) hash: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CompileLayerRangesSerde {
    pub(super) reset: Option<CompileLayerRangeSerde>,
    pub(super) base: Option<CompileLayerRangeSerde>,
    pub(super) tokens: Option<CompileLayerRangeSerde>,
    pub(super) recipes: Option<CompileLayerRangeSerde>,
    pub(super) utilities: Option<CompileLayerRangeSerde>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CompileLayerRangeSerde {
    pub(super) start: u32,
    pub(super) end: u32,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ParsedFileViewSerde {
    pub(super) path: String,
    pub(super) atoms: Vec<AtomSerde>,
    pub(super) diagnostics: Vec<pandacss_shared::Diagnostic>,
    pub(super) recipes: Vec<RecipeEntrySerde>,
    pub(super) slot_recipes: Vec<RecipeEntrySerde>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct StaticPatternResultSerde {
    pub(super) atoms: Vec<AtomSerde>,
    pub(super) diagnostics: Vec<pandacss_extractor::Diagnostic>,
}

#[derive(Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CodegenArtifactSerde {
    pub(super) id: String,
    pub(super) files: Vec<CodegenFileSerde>,
}

#[derive(Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CodegenFileSerde {
    pub(super) path: String,
    pub(super) code: String,
    pub(super) dependencies: Vec<String>,
}

/// One file in a `--splitting` output set. Host writes `path -> code`.
#[derive(serde::Serialize)]
pub(super) struct SplitCssFileSerde {
    pub(super) path: String,
    pub(super) code: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AtomSerde {
    pub(super) prop: String,
    pub(super) value: serde_json::Value,
    pub(super) conditions: Vec<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct RecipeEntrySerde {
    pub(super) file: String,
    pub(super) span_start: u32,
    pub(super) recipe: serde_json::Value,
}

/// Serialized per-file parse report. Mirrors the native `ParseFileReport`.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ParseFileReportSerde {
    pub(super) path: String,
    pub(super) css_calls: u32,
    pub(super) cva_calls: u32,
    pub(super) sva_calls: u32,
    pub(super) jsx_usages: u32,
    pub(super) diagnostics: Vec<pandacss_project::Diagnostic>,
}

/// Serialized source entry. Mirrors the native `SourceEntry`.
#[derive(serde::Serialize)]
pub(super) struct SourceEntrySerde {
    pub(super) base: String,
    pub(super) pattern: String,
}

/// Serialized resolved cascade-layer names. Mirrors the native `LayerNames`.
#[derive(serde::Serialize)]
pub(super) struct LayerNamesSerde<'a> {
    pub(super) reset: &'a str,
    pub(super) base: &'a str,
    pub(super) tokens: &'a str,
    pub(super) recipes: &'a str,
    pub(super) utilities: &'a str,
}

/// Glob overrides accepted by `scan`/`glob`; omitted fields fall back to the
/// config's `include`/`exclude`/`cwd`.
#[derive(Default, Deserialize)]
pub(super) struct GlobOverrides {
    pub(super) include: Option<Vec<String>>,
    pub(super) exclude: Option<Vec<String>>,
    pub(super) cwd: Option<String>,
}
