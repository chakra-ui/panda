use super::WasmCompiler;

use pandacss_encoder::Atom as CoreAtom;
use pandacss_extractor::Literal;
use serde::Serialize as _;
use wasm_bindgen::prelude::*;

use super::serde_types::{RecipeEntrySerde, StaticPatternResultSerde};
use super::support::{collect_sorted_atoms, slice_to_atom_serde};
use super::transforms::apply_pattern_transform;

#[wasm_bindgen]
impl WasmCompiler {
    /// Deduplicated atoms across every currently-known file, sorted by
    /// `(prop, conditions, value)` for stable iteration.
    ///
    /// # Errors
    /// Returns a JS error if serializing the atom array fails.
    pub fn atoms(&mut self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "atoms").entered();
        let atoms = collect_sorted_atoms(self.inner.atoms());
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        atoms
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Every `cva()` recipe entry in `(file, span_start)` order.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn recipes(&self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "recipes").entered();
        let entries: Vec<RecipeEntrySerde> = self
            .inner
            .recipes()
            .map(|(file, span_start, recipe)| RecipeEntrySerde {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        entries
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Every `sva()` slot-recipe entry.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = slotRecipes)]
    pub fn slot_recipes(&self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "slot_recipes").entered();
        let entries: Vec<RecipeEntrySerde> = self
            .inner
            .slot_recipes()
            .map(|(file, span_start, recipe)| RecipeEntrySerde {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        entries
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Encoded config recipe styles, separate from atomic utility atoms.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = encodedRecipes)]
    pub fn encoded_recipes(&mut self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "encoded_recipes").entered();
        let snapshot = serde_json::to_value(self.inner.encoded_recipes().snapshot())
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let json =
            serde_json::to_string(&snapshot).map_err(|err| JsValue::from_str(&err.to_string()))?;
        js_sys::JSON::parse(&json)
    }

    /// `staticCss.patterns` expansion as raw atoms, without compiling.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = staticPatternAtoms)]
    pub fn static_pattern_atoms(&mut self) -> Result<JsValue, JsValue> {
        let (atoms, diagnostics) = self.collect_static_pattern_atoms();
        let result = StaticPatternResultSerde {
            atoms: slice_to_atom_serde(&atoms),
            diagnostics,
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    pub(super) fn collect_static_pattern_atoms(
        &mut self,
    ) -> (Vec<CoreAtom>, Vec<pandacss_extractor::Diagnostic>) {
        let WasmCompiler {
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
