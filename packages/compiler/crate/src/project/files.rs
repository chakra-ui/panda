use super::support::{
    apply_pattern_transform, apply_source_transforms, apply_utility_transform, convert_report,
    glob_options,
};
use super::{Compiler, ParseFileReport, ParsedFileView, RecipeEntry, ScanOptions};

use napi::bindgen_prelude::Env;
use napi_derive::napi;

use crate::compile::CompileFileManifest;
use crate::convert::{convert_diagnostic, to_call, to_jsx};
use crate::extract::ExtractResult;
use pandacss_encoder::AtomValue;
use pandacss_extractor::Literal;
use pandacss_fs::{FileSystem, OxcResolverFileSystem, PathSystem};

#[napi]
impl Compiler {
    /// Read a source file from the native filesystem and parse it.
    #[napi(js_name = parseFile)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_file(&mut self, env: Env, path: String) -> napi::Result<ParseFileReport> {
        let source = self
            .fs
            .read_to_string(std::path::Path::new(&path))
            .map_err(|err| napi::Error::from_reason(format!("failed to read `{path}`: {err}")))?;
        Ok(self.parse_file_source(env, path, source))
    }

    /// Extract + encode provided source text. Re-parsing a path replaces its
    /// prior contribution (atoms, recipes, diagnostics) — safe for watch mode.
    #[napi(js_name = parseFileSource)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_file_source(&mut self, env: Env, path: String, source: String) -> ParseFileReport {
        crate::init_tracing();
        let report = self.parse_inner(&env, &path, &source);
        let _span = tracing::trace_span!("boundary_encode", method = "parse_file_report").entered();
        let report = convert_report(path, report);
        crate::flush_tracing();
        report
    }

    /// Shared parse path used by `parse_file` and `scan` — wires the
    /// registered pattern/utility transform callbacks (if any) and returns the
    /// core `ParseFileReport`.
    fn parse_inner(
        &mut self,
        env: &Env,
        path: &str,
        source: &str,
    ) -> pandacss_project::ParseFileReport {
        let has_source_transforms = self.callbacks.has_source_transforms();
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_source_transforms && !has_pattern_transforms && !has_utility_transforms {
            return self.inner.parse_file(path, source);
        }
        let Compiler {
            inner, callbacks, ..
        } = self;
        let pattern_cache = &mut callbacks.transform_cache.pattern;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut transform = |name: &str, styles: &Literal| {
            apply_pattern_transform(
                name,
                styles,
                &callbacks.pattern_transform_refs,
                &callbacks.pattern_transforms,
                pattern_cache,
                env,
            )
        };
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                env,
            )
        };
        let mut source_transform = |path: &str, source: &str| {
            apply_source_transforms(path, source, &callbacks.source_transforms, env)
        };
        inner.parse_file_with(
            path,
            source,
            pandacss_project::ParseTransforms {
                source: has_source_transforms.then_some(
                    &mut source_transform as &mut pandacss_project::SourceTransformFn<'_>,
                ),
                pattern: has_pattern_transforms
                    .then_some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
                utility: has_utility_transforms.then_some(
                    &mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>,
                ),
            },
        )
    }

    /// Source paths matching the config's `include`/`exclude` (overridable via
    /// `options`), via the platform filesystem engine. Useful for file
    /// discovery and the host's watch dependency list.
    ///
    /// # Errors
    /// Returns an error when the scan fails (e.g. a non-existent `cwd`).
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn scan(&self, options: Option<ScanOptions>) -> napi::Result<Vec<String>> {
        Ok(self
            .scan_paths(options.as_ref())?
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned())
            .collect())
    }

    /// Resolve a path to its real on-disk location (absolute, symlinks followed) so
    /// two paths to the same file compare equal. Lenient: returns the input path when
    /// it can't be resolved (e.g. it was just deleted), so callers can still match it.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn realpath(&self, path: String) -> String {
        let path = std::path::PathBuf::from(path);
        self.fs
            .canonicalize(&path)
            .unwrap_or(path)
            .to_string_lossy()
            .into_owned()
    }

    /// Whether `path` is a source file the project extracts from — its
    /// `cwd`-relative form matches the configured `include`/`exclude` globs.
    /// For routing a watch event to `applyChange` vs ignoring it.
    #[napi(js_name = isSourceFile)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn is_source_file(&self, path: String) -> bool {
        let opts = glob_options(&self.user_config, None);
        pandacss_fs::matches_globs(std::path::Path::new(&path), &opts)
    }

    /// Read + parse source paths returned from `scan()`. Returns one report per
    /// successfully parsed path.
    ///
    /// # Errors
    /// Returns an error when a listed path fails to read.
    #[napi(js_name = parseFiles)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_files(
        &mut self,
        env: Env,
        paths: Vec<String>,
    ) -> napi::Result<Vec<ParseFileReport>> {
        crate::init_tracing();
        let mut reports = Vec::with_capacity(paths.len());
        for path in paths {
            let path = std::path::PathBuf::from(path);
            let Ok(source) = self.fs.read_to_string(&path) else {
                continue;
            };
            let path = path.to_string_lossy();
            let report = self.parse_inner(&env, &path, &source);
            reports.push(convert_report(path.into_owned(), report));
        }
        crate::flush_tracing();
        Ok(reports)
    }

    fn scan_paths(&self, options: Option<&ScanOptions>) -> napi::Result<Vec<std::path::PathBuf>> {
        let opts = glob_options(&self.user_config, options);
        self.fs
            .glob(&opts)
            .map_err(|err| napi::Error::from_reason(format!("scan failed: {err}")))
    }

    /// Stateless single-file extraction — raw `calls` + `jsx` + diagnostics,
    /// using the project's configured matchers + token dictionary. Unlike
    /// `parseFile`, it registers nothing; it's the read-only peek companion.
    #[napi(js_name = extractFileSource)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn extract_file_source(&self, path: String, source: String) -> ExtractResult {
        crate::init_tracing();
        let result = self.inner.extract(&path, &source);
        ExtractResult {
            calls: result.calls.into_iter().map(to_call).collect(),
            jsx: result.jsx.into_iter().map(to_jsx).collect(),
            diagnostics: result
                .diagnostics
                .into_iter()
                .map(convert_diagnostic)
                .collect(),
        }
    }

    /// Re-parse a path *only if* it is already known to the project.
    /// Returns `true` if the path was present and got re-parsed; `false`
    /// if the path is unknown (no-op). Watch-mode contract.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn refresh_file(&mut self, env: Env, path: String) -> napi::Result<bool> {
        let source = self
            .fs
            .read_to_string(std::path::Path::new(&path))
            .map_err(|err| napi::Error::from_reason(format!("failed to read `{path}`: {err}")))?;
        Ok(self.refresh_file_source(env, path, source))
    }

    /// Re-parse provided source text only if the path is already known.
    #[napi(js_name = refreshFileSource)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn refresh_file_source(&mut self, env: Env, path: String, source: String) -> bool {
        let has_source_transforms = self.callbacks.has_source_transforms();
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_source_transforms && !has_pattern_transforms && !has_utility_transforms {
            return self.inner.refresh_file(&path, &source);
        }

        let Compiler {
            inner, callbacks, ..
        } = self;
        let pattern_cache = &mut callbacks.transform_cache.pattern;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut transform = |name: &str, styles: &Literal| {
            apply_pattern_transform(
                name,
                styles,
                &callbacks.pattern_transform_refs,
                &callbacks.pattern_transforms,
                pattern_cache,
                &env,
            )
        };
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
        let mut source_transform = |path: &str, source: &str| {
            apply_source_transforms(path, source, &callbacks.source_transforms, &env)
        };
        inner.refresh_file_with(
            &path,
            &source,
            pandacss_project::ParseTransforms {
                source: has_source_transforms.then_some(
                    &mut source_transform as &mut pandacss_project::SourceTransformFn<'_>,
                ),
                pattern: has_pattern_transforms
                    .then_some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
                utility: has_utility_transforms.then_some(
                    &mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>,
                ),
            },
        )
    }

    /// Drop a file's contribution. Returns `true` if the path was known.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn remove_file(&mut self, path: String) -> bool {
        self.inner.remove_file(&path)
    }

    /// Drop every path's state. Keeps the config-derived extractor,
    /// token dictionary, and cross-file resolver intact.
    #[napi]
    pub fn clear(&mut self) {
        self.inner.clear();
        self.callbacks.transform_cache.clear();
    }

    /// Returns `true` when the project has no files and no accumulated output.
    #[napi(js_name = isEmpty)]
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }

    /// `(path, hex source_hash)` for every known file, sorted by path.
    /// The hash matches the one the re-parse short-circuit uses.
    #[napi(js_name = fileManifest)]
    #[must_use]
    pub fn file_manifest(&self) -> Vec<CompileFileManifest> {
        self.inner
            .file_manifest()
            .into_iter()
            .map(|(path, hash)| CompileFileManifest {
                path: path.as_ref().to_owned(),
                hash: format!("{hash:016x}"),
            })
            .collect()
    }

    /// Per-file view; returns `null` when `path` isn't known.
    #[napi(js_name = getFile)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn get_file(&self, path: String) -> Option<ParsedFileView> {
        let file = self.inner.get_file(&path)?;
        Some(ParsedFileView {
            path: file.path().to_owned(),
            atoms: crate::convert::to_atoms(file.atoms()),
            diagnostics: file
                .diagnostics()
                .iter()
                .cloned()
                .map(crate::convert::convert_diagnostic)
                .collect(),
            recipes: file
                .recipes()
                .map(|(span_start, recipe)| RecipeEntry {
                    file: file.path().to_owned(),
                    span_start,
                    recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
                })
                .collect(),
            slot_recipes: file
                .slot_recipes()
                .map(|(span_start, recipe)| RecipeEntry {
                    file: file.path().to_owned(),
                    span_start,
                    recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
                })
                .collect(),
        })
    }

    #[napi(js_name = resolvePath)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn resolve_path(&self, path: String, cwd: Option<String>) -> String {
        self.paths
            .resolve(&cwd.unwrap_or_else(|| self.user_config.cwd.clone()), &path)
    }

    #[napi(js_name = joinPath)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn join_path(&self, parts: Vec<String>) -> String {
        let parts = parts.iter().map(String::as_str).collect::<Vec<_>>();
        self.paths.join(&parts)
    }

    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn dirname(&self, path: String) -> String {
        self.paths.dirname(&path)
    }
}
