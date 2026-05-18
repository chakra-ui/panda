use pandacss_extractor::{CrossFileResolver, ExtractorConfig, extract};
use serde::Serialize as _;
use wasm_bindgen::prelude::*;

use crate::fs::WasmFileSystem;
use crate::matcher::{MatchersInput, to_core_matchers, to_core_token_dictionary};

/// JS-facing extractor handle. Constructed once per session with a
/// [`WasmFileSystem`] handle and a `MatchersInput`; the cross-file
/// resolver is wired up automatically against the same FS.
///
/// ```js
/// const fs = new WasmFileSystem();
/// fs.addFile('/src/code.tsx', '...');
/// const ext = new WasmExtractor(fs, matchers);
/// const result = ext.parseFile('/src/code.tsx', source);
/// ```
#[wasm_bindgen]
pub struct WasmExtractor {
    config: ExtractorConfig,
}

#[wasm_bindgen]
impl WasmExtractor {
    /// Construct from a JS matchers object (see `MatchersInput`).
    ///
    /// # Errors
    /// Returns a JS error string when `matchers` doesn't deserialize
    /// into a `MatchersInput` shape.
    #[wasm_bindgen(constructor)]
    pub fn new(fs: &WasmFileSystem, matchers: JsValue) -> Result<WasmExtractor, JsValue> {
        let mut input: MatchersInput = serde_wasm_bindgen::from_value(matchers)
            .map_err(|err| JsValue::from_str(&format!("invalid matchers: {err}")))?;

        // Take token_dictionary out first so the rest of `input` can be
        // moved into `to_core_matchers`.
        let token_dictionary = input.token_dictionary.take().map(to_core_token_dictionary);
        let core_matchers = to_core_matchers(input);

        let mut config = ExtractorConfig::new(core_matchers);
        config.token_dictionary = token_dictionary;
        config.cross_file = Some(CrossFileResolver::with_fs(fs.inner.clone()));

        Ok(Self { config })
    }

    /// Single-file extract. Returns the lean `ExtractUsage` shape as a
    /// plain JS object (`{ calls, jsx, diagnostics }`).
    ///
    /// # Errors
    /// Returns a JS error string when serializing the result to `JsValue`
    /// fails (effectively never — the shape is bounded JSON).
    #[wasm_bindgen(js_name = parseFile)]
    pub fn parse_file(&self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let result = extract(source, path, &self.config);
        // `serialize_maps_as_objects(true)` turns serde `serialize_map` calls
        // into plain JS objects rather than `Map` instances — matches what
        // JS callers expect from a JSON-shaped result.
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }
}
