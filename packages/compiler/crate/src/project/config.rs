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
        pandacss_compiler::layer_names(&self.user_config).into()
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
        pandacss_compiler::has_layer_declaration(&self.user_config, &css)
    }

    /// Remove Panda `@layer a, b;` order statements; leave unrelated ones.
    #[napi(js_name = stripLayerOrderStatements)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn strip_layer_order_statements(&self, css: String) -> String {
        pandacss_compiler::strip_layer_order_statements(&self.user_config, &css)
    }

    /// Tooling introspection snapshot (read once, index on the host).
    ///
    /// # Errors
    /// Returns an error if the snapshot fails to serialize.
    #[napi]
    pub fn spec(&self) -> napi::Result<serde_json::Value> {
        let spec = pandacss_compiler::compiler_spec(&self.inner, &self.user_config);
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
    #[napi(js_name = tokenDictionary)]
    #[must_use]
    pub fn token_dictionary(&self) -> Option<TokenDictionary> {
        self.inner
            .system()
            .token_dictionary()
            .as_deref()
            .map(from_core_token_dictionary)
    }
}

impl From<pandacss_compiler::LayerNames> for LayerNames {
    fn from(names: pandacss_compiler::LayerNames) -> Self {
        Self {
            reset: names.reset,
            base: names.base,
            tokens: names.tokens,
            recipes: names.recipes,
            utilities: names.utilities,
        }
    }
}
