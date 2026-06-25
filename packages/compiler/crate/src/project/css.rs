use super::transforms::apply_utility_transform;
use super::{Compiler, WriteCssOptions, WriteCssResult, WriteFilesResult, WriteSplitCssOptions};

use napi::bindgen_prelude::Env;
use napi_derive::napi;

use crate::compile::{
    CompileOptions, CompileOutput, CssOutputOptions, LayerCssOptions, WriteLayerCssOptions,
};
use pandacss_encoder::AtomValue;
use pandacss_fs::{FileSystem, PathSystem};

/*
 * Shared file-writing helpers for CSS and codegen outputs.
 */
#[napi]
impl Compiler {
    pub(super) fn write_relative_files<'a>(
        &self,
        root: &str,
        files: impl IntoIterator<Item = (&'a str, &'a str)>,
        label: &str,
    ) -> napi::Result<Vec<String>> {
        let mut written = Vec::new();
        for (path, code) in files {
            if self.paths.is_absolute(path) {
                return Err(napi::Error::from_reason(format!(
                    "{label} output path must be relative: {path}"
                )));
            }
            let target = self.paths.join(&[root, path]);
            self.write_target_file(&target, code)?;
            written.push(target);
        }
        Ok(written)
    }

    pub(super) fn write_target_file(&self, target: &str, code: &str) -> napi::Result<()> {
        let parent = self.paths.dirname(target);
        if !parent.is_empty() {
            self.fs
                .create_dir_all(std::path::Path::new(&parent))
                .map_err(|err| napi::Error::from_reason(err.to_string()))?;
        }
        self.fs
            .write_if_changed(std::path::Path::new(target), code.as_bytes())
            .map(|_| ())
            .map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /*
     * CSS compile/write entrypoints.
     */
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn compile(
        &mut self,
        env: Env,
        options: Option<CompileOptions>,
    ) -> napi::Result<CompileOutput> {
        crate::init_tracing();
        let _span = tracing::trace_span!("css_compile", method = "project_compile").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms(env);
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let Compiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        let output = crate::compile::build_compile_output(
            inner,
            user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            options
                .as_ref()
                .is_none_or(CompileOptions::should_emit_layer_declaration),
            has_utility_transforms
                .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
            options.as_ref().and_then(|options| options.minify),
        );
        crate::flush_tracing();
        Ok(output)
    }

    #[napi(js_name = writeCss)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_css(
        &mut self,
        env: Env,
        options: WriteCssOptions,
    ) -> napi::Result<WriteCssResult> {
        let output = self.compile(env, Some(compile_options_from_write_css(&options)))?;
        let target = self.paths.resolve(
            &options.cwd.unwrap_or_else(|| self.user_config.cwd.clone()),
            &options.outfile,
        );
        self.write_target_file(&target, &output.css)?;
        Ok(WriteCssResult {
            path: target,
            css: output.css,
            source_map: output.source_map,
            manifest: output.manifest,
            layer_ranges: output.layer_ranges,
            diagnostics: output.diagnostics,
        })
    }

    #[napi(js_name = writeSplitCss)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_split_css(
        &mut self,
        env: Env,
        options: WriteSplitCssOptions,
    ) -> napi::Result<WriteFilesResult> {
        let css_options = css_output_options_from_write_split(&options);
        let files = self.get_split_css(env, Some(css_options))?;
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let root = self.paths.resolve(&cwd, &options.outdir);
        let paths = self.write_relative_files(
            &root,
            files
                .iter()
                .map(|file| (file.path.as_str(), file.code.as_str())),
            "split css",
        )?;
        Ok(WriteFilesResult { root, paths, files })
    }

    /// CSS for the named cascade layers, concatenated in order. Sliced in Rust
    /// (byte offsets stay valid); unknown layer names are skipped.
    #[napi(js_name = getLayerCss)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn get_layer_css(
        &mut self,
        env: Env,
        options: LayerCssOptions,
    ) -> napi::Result<CompileOutput> {
        crate::init_tracing();
        let _span = tracing::trace_span!("get_layer_css").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms(env);
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let Compiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        let css_options = CssOutputOptions {
            layers: None,
            emit_layer_declaration: options.emit_layer_declaration,
            minify: options.minify,
        };
        let output = crate::compile::build_layer_compile_output(
            inner,
            user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            &options.layers,
            has_utility_transforms
                .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
            Some(&css_options),
        );
        crate::flush_tracing();
        Ok(output)
    }

    #[napi(js_name = writeLayerCss)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_layer_css(
        &mut self,
        env: Env,
        options: WriteLayerCssOptions,
    ) -> napi::Result<WriteCssResult> {
        let output = self.get_layer_css(
            env,
            LayerCssOptions {
                layers: options.layers,
                emit_layer_declaration: options.emit_layer_declaration,
                minify: options.minify,
            },
        )?;
        let target = self.paths.resolve(
            &options.cwd.unwrap_or_else(|| self.user_config.cwd.clone()),
            &options.outfile,
        );
        self.write_target_file(&target, &output.css)?;
        Ok(WriteCssResult {
            path: target,
            css: output.css,
            source_map: output.source_map,
            manifest: output.manifest,
            layer_ranges: output.layer_ranges,
            diagnostics: output.diagnostics,
        })
    }

    /// Split the stylesheet into per-file outputs (one per layer + per recipe,
    /// plus `recipes.css` / `styles.css` index files) for `--splitting`.
    #[napi(js_name = getSplitCss)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn get_split_css(
        &mut self,
        env: Env,
        options: Option<CssOutputOptions>,
    ) -> napi::Result<Vec<crate::compile::SplitCssFile>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("get_split_css").entered();
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms(env);
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let Compiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        let files = crate::compile::build_split_css(
            inner,
            user_config,
            &static_pattern_atoms,
            has_utility_transforms
                .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
            options.as_ref(),
        );
        crate::flush_tracing();
        Ok(files)
    }
}

/*
 * CSS option conversion.
 */
fn compile_options_from_write_css(options: &WriteCssOptions) -> CompileOptions {
    CompileOptions {
        emit_layer_declaration: options.emit_layer_declaration,
        minify: options.minify,
    }
}

fn css_output_options_from_write_split(options: &WriteSplitCssOptions) -> CssOutputOptions {
    CssOutputOptions {
        layers: options.layers.clone(),
        emit_layer_declaration: options.emit_layer_declaration,
        minify: options.minify,
    }
}
