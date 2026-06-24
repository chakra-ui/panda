use super::WasmCompiler;

use serde::Serialize as _;
use wasm_bindgen::prelude::*;

use crate::matcher::from_core_token_dictionary;

use super::serde_types::LayerNamesSerde;

#[wasm_bindgen]
impl WasmCompiler {
    /// Return the serialized config snapshot this project was constructed
    /// with.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn config(&self) -> Result<JsValue, JsValue> {
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        self.config
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Tooling introspection snapshot (read once, index on the host).
    ///
    /// # Errors
    /// Returns a JS error if the snapshot fails to serialize.
    pub fn spec(&self) -> Result<JsValue, JsValue> {
        let types = self.inner.type_data(&self.user_config);
        let property_order = pandacss_stylesheet::order_properties(
            types.utilities.properties.keys().map(String::as_str),
        );
        let spec = pandacss_config::Spec {
            types,
            property_order,
            jsx_factory: Some(self.user_config.jsx_factory().to_owned()),
            import_map: self.user_config.import_map.clone(),
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        spec.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// The resolved cascade-layer names (config overrides merged over defaults).
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn layers(&self) -> Result<JsValue, JsValue> {
        let layers = &self.user_config.layers;
        let names = LayerNamesSerde {
            reset: &layers.reset,
            base: &layers.base,
            tokens: &layers.tokens,
            recipes: &layers.recipes,
            utilities: &layers.utilities,
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        names
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Whether `css` declares Panda's cascade layers (`@layer reset, base, …;`),
    /// marking it as the stylesheet root to inject the compiled CSS into.
    #[wasm_bindgen(js_name = hasLayerDeclaration)]
    #[must_use]
    pub fn has_layer_declaration(&self, css: &str) -> bool {
        let names = self.user_config.layers.ordered().map(|(_, name)| name);
        pandacss_stylesheet::has_layer_declaration(css, &names)
    }

    /// Rust-built token dictionary projected into the small JS interop shape.
    #[wasm_bindgen(js_name = token_dictionary)]
    pub fn token_dictionary(&self) -> Result<JsValue, JsValue> {
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        match self.inner.config().token_dictionary() {
            Some(dictionary) => from_core_token_dictionary(dictionary.as_ref())
                .serialize(&serializer)
                .map_err(|err| JsValue::from_str(&err.to_string())),
            None => Ok(JsValue::UNDEFINED),
        }
    }

    /// Engine-owned fingerprint of the resolved config's output-affecting fields,
    /// stamped into build info as `configFingerprint`.
    #[wasm_bindgen(js_name = configFingerprint)]
    #[must_use]
    pub fn config_fingerprint(&self) -> String {
        self.inner.config_fingerprint().to_string()
    }
}
