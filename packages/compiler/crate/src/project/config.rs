use super::{Compiler, LayerNames};

use napi_derive::napi;

use crate::matcher::{TokenDictionary, from_core_token_dictionary};

#[napi]
impl Compiler {
    /// Return the serialized config snapshot this project was constructed
    /// with.
    #[napi]
    #[must_use]
    pub fn config(&self) -> serde_json::Value {
        self.config.clone()
    }

    /// The resolved cascade-layer names (config overrides merged over defaults).
    /// The host needs these to recognize the user's `@layer …;` directive
    /// without re-deriving the Rust defaults.
    #[napi]
    #[must_use]
    pub fn layers(&self) -> LayerNames {
        let layers = &self.user_config.layers;
        LayerNames {
            reset: layers.reset.clone(),
            base: layers.base.clone(),
            tokens: layers.tokens.clone(),
            recipes: layers.recipes.clone(),
            utilities: layers.utilities.clone(),
        }
    }

    /// Whether `css` declares Panda's cascade layers (`@layer reset, base, …;`),
    /// marking it as the stylesheet root to inject the compiled CSS into.
    #[napi(js_name = hasLayerDeclaration)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn has_layer_declaration(&self, css: String) -> bool {
        let names = self.user_config.layers.ordered().map(|(_, name)| name);
        pandacss_stylesheet::has_layer_declaration(&css, &names)
    }

    /// Tooling introspection snapshot (read once, index on the host).
    ///
    /// # Errors
    /// Returns an error if the snapshot fails to serialize.
    #[napi]
    pub fn spec(&self) -> napi::Result<serde_json::Value> {
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
        serde_json::to_value(&spec).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Engine-owned fingerprint of the resolved config's output-affecting fields.
    /// Stamped into build info as `configFingerprint`; also exposed so a consumer
    /// host can compare its own config against a library's artifact.
    #[napi(js_name = configFingerprint)]
    #[must_use]
    pub fn config_fingerprint(&self) -> String {
        self.inner.config_fingerprint().to_string()
    }

    /// Rust-built token dictionary projected into the small JS interop shape.
    #[napi(js_name = token_dictionary)]
    #[must_use]
    pub fn token_dictionary(&self) -> Option<TokenDictionary> {
        self.inner
            .config()
            .token_dictionary()
            .as_deref()
            .map(from_core_token_dictionary)
    }
}
