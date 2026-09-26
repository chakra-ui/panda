use super::WasmCompiler;

use serde::Serialize as _;
use wasm_bindgen::prelude::*;

use super::serde_types::ResolveUtilityValueInputSerde;

#[wasm_bindgen]
impl WasmCompiler {
    /// Stateless source inspection for tooling (reporting, lint, IDE). Returns
    /// classified Panda usage sites plus file-local extraction diagnostics.
    ///
    /// # Errors
    /// Returns a JS error if serialization fails.
    #[wasm_bindgen(js_name = inspectFileSource)]
    pub fn inspect_file_source(&self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let result = pandacss_compiler::inspect_file_source(self.inner.system(), path, source);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Resolve selector and CSS metadata for one utility value.
    ///
    /// # Errors
    /// Returns a JS error if the input or result cannot be serialized.
    #[wasm_bindgen(js_name = resolveUtilityValue)]
    pub fn resolve_utility_value(&self, input: JsValue) -> Result<JsValue, JsValue> {
        let input: ResolveUtilityValueInputSerde = serde_wasm_bindgen::from_value(input)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let Some(value) = pandacss_literal::Literal::from_json_strict(&input.value) else {
            return Err(JsValue::from_str(
                "resolveUtilityValue() requires a JSON-serializable value",
            ));
        };

        let Some(resolved) = self.inner.resolve_utility_value(&input.prop, &value) else {
            return Ok(JsValue::NULL);
        };

        let result = serde_json::json!({
            "utility": resolved.utility,
            "className": resolved.class_name,
            "cssValue": resolved.css_value.to_json(),
            "important": resolved.important,
            "source": pandacss_compiler::utility_value_source_json(resolved.source),
        });

        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Tokens that carry a hardcoded value, ranked (safe equivalents first).
    ///
    /// # Errors
    /// Returns a JS error if serialization fails.
    #[wasm_bindgen(js_name = suggestTokens)]
    pub fn suggest_tokens(&self, prop: &str, value: &str) -> Result<JsValue, JsValue> {
        let suggestions: Vec<serde_json::Value> =
            pandacss_compiler::suggest_tokens(self.inner.system(), prop, value)
                .into_iter()
                .map(|suggestion| pandacss_compiler::token_suggestion_json(&suggestion))
                .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        suggestions
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Semantic tokens that carry the same value as a token path.
    ///
    /// # Errors
    /// Returns a JS error if serialization fails.
    #[wasm_bindgen(js_name = suggestSemanticTokens)]
    pub fn suggest_semantic_tokens(&self, path: &str) -> Result<JsValue, JsValue> {
        let suggestions: Vec<serde_json::Value> =
            pandacss_compiler::suggest_semantic_tokens(self.inner.system(), path)
                .into_iter()
                .map(|suggestion| pandacss_compiler::token_suggestion_json(&suggestion))
                .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        suggestions
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Source globs + their static base dirs (for the host watcher).
    ///
    /// # Errors
    /// Returns a JS error if serialization fails.
    pub fn sources(&self) -> Result<JsValue, JsValue> {
        let entries = pandacss_compiler::source_entries(&self.user_config, &self.paths);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        entries
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Aggregate counts.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn summary(&self) -> Result<JsValue, JsValue> {
        let s = self.inner.summary();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        s.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Config validation diagnostics from construction.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn diagnostics(&self) -> Result<JsValue, JsValue> {
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        self.inner
            .diagnostics()
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }
}
