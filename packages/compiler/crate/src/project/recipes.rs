use super::transforms::apply_pattern_transform;
use super::{Compiler, RecipeEntry, StaticPatternResult};

use napi::bindgen_prelude::Env;
use napi_derive::napi;

use crate::convert::to_atoms;
use pandacss_extractor::Literal;

#[napi]
impl Compiler {
    /// Deduplicated atoms across every currently-known file. Sorted by
    /// `(prop, conditions, value)` for stable iteration / snapshot tests.
    #[napi]
    pub fn atoms(&mut self, env: Env) -> napi::Result<Vec<crate::Atom>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "atoms").entered();
        let _ = env;
        let atoms = to_atoms(self.inner.atoms());
        crate::flush_tracing();
        Ok(atoms)
    }

    /// Every `cva()` recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn recipes(&self) -> Vec<RecipeEntry> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "recipes").entered();
        let entries = self
            .inner
            .recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        crate::flush_tracing();
        entries
    }

    /// Every `sva()` slot recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn slot_recipes(&self) -> Vec<RecipeEntry> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "slot_recipes").entered();
        let entries = self
            .inner
            .slot_recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        crate::flush_tracing();
        entries
    }

    /// Encoded config recipe styles, separate from atomic utility atoms.
    #[napi(js_name = encodedRecipes)]
    pub fn encoded_recipes(&mut self, env: Env) -> napi::Result<serde_json::Value> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "encoded_recipes").entered();
        let _ = env;
        let encoded = serde_json::to_value(self.inner.encoded_recipes().snapshot())
            .unwrap_or(serde_json::Value::Null);
        crate::flush_tracing();
        Ok(encoded)
    }

    /// `staticCss.patterns` expansion as raw atoms, without compiling.
    /// Routes through the same callback host as `parseFile`.
    #[napi(js_name = staticPatternAtoms)]
    pub fn static_pattern_atoms(&mut self, env: Env) -> napi::Result<StaticPatternResult> {
        crate::init_tracing();
        let (atoms, diagnostics) = self.collect_static_pattern_atoms(env);
        crate::flush_tracing();
        Ok(StaticPatternResult {
            atoms: crate::convert::slice_to_atoms(&atoms),
            diagnostics: diagnostics
                .into_iter()
                .map(crate::convert::convert_diagnostic)
                .collect(),
        })
    }

    pub(super) fn collect_static_pattern_atoms(
        &mut self,
        env: Env,
    ) -> (
        Vec<pandacss_encoder::Atom>,
        Vec<pandacss_extractor::Diagnostic>,
    ) {
        let Compiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        if callbacks.has_pattern_transforms() {
            let pattern_cache = &mut callbacks.transform_cache.pattern;
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
            inner.static_pattern_atoms(
                user_config,
                Some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
            )
        } else {
            inner.static_pattern_atoms(user_config, None)
        }
    }
}
