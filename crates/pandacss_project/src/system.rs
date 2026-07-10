use std::sync::Arc;

use pandacss_config::{UserConfig, ValidationMode, validate_config};
use pandacss_shared::Diagnostic;
use pandacss_tokens::TokenDictionary;

use crate::Result;
use crate::runtime_config::Config;

/// Immutable runtime model derived from a Panda config. Separate from
/// [`crate::Project`]: config compiles once here, while a project owns
/// watch-mode file state and extraction caches.
pub struct System {
    config: Arc<Config>,
    config_fingerprint: Arc<str>,
    diagnostics: Vec<Diagnostic>,
}

pub struct SystemInput {
    pub config: UserConfig,
    pub diagnostics: Option<Vec<Diagnostic>>,
    pub token_dictionary: Option<Arc<TokenDictionary>>,
}

impl From<UserConfig> for SystemInput {
    fn from(config: UserConfig) -> Self {
        Self {
            config,
            diagnostics: None,
            token_dictionary: None,
        }
    }
}

impl System {
    /// # Errors
    /// Returns a `ConfigError` when validation fails in error mode or the
    /// config can't be compiled (invalid tokens/recipes).
    pub fn new(input: impl Into<SystemInput>) -> Result<Self> {
        let _span = tracing::debug_span!("config_compile").entered();
        let input = input.into();
        let diagnostics = input
            .diagnostics
            .unwrap_or_else(|| validate_config(&input.config));
        if input.config.validation == ValidationMode::Error && !diagnostics.is_empty() {
            return Err(crate::ConfigError::config(format_config_diagnostics(
                &diagnostics,
            )));
        }
        let config_fingerprint = config_fingerprint(&input.config);
        Ok(Self {
            config: Arc::new(crate::config::compile_config_with_token_dictionary(
                &input.config,
                input.token_dictionary,
            )?),
            config_fingerprint,
            diagnostics,
        })
    }

    #[must_use]
    pub fn config(&self) -> &Config {
        &self.config
    }

    /// Fingerprint of the config's output-affecting fields, stamped into
    /// build info as a collision guard. See [`config_fingerprint`].
    #[must_use]
    pub fn config_fingerprint(&self) -> &str {
        &self.config_fingerprint
    }

    #[must_use]
    pub(crate) fn config_fingerprint_arc(&self) -> Arc<str> {
        Arc::clone(&self.config_fingerprint)
    }

    #[must_use]
    pub(crate) fn config_arc(&self) -> Arc<Config> {
        Arc::clone(&self.config)
    }

    #[must_use]
    pub fn diagnostics(&self) -> &[Diagnostic] {
        &self.diagnostics
    }
}

/// Keys that don't affect a library's shipped atoms/recipes — machine-local
/// IO, extraction wiring, codegen options. Excluded so a changed `include`
/// glob doesn't make two otherwise-identical libraries look incompatible.
const FINGERPRINT_IGNORED_KEYS: &[&str] = &[
    "cwd",
    "outdir",
    "include",
    "exclude",
    "importMap",
    "jsxFramework",
    "jsxFactory",
    "jsxStyleProps",
    "syntax",
    "outExtension",
    "forceImportExtension",
    "validation",
    "strictTokens",
    "strictPropertyValues",
];

/// Deterministic fingerprint of a resolved [`UserConfig`]'s output-affecting
/// fields. Stable across machines: IO/codegen fields are dropped and object
/// keys are canonically ordered before hashing.
#[must_use]
pub fn config_fingerprint(config: &UserConfig) -> Arc<str> {
    let mut value = serde_json::to_value(config).unwrap_or(serde_json::Value::Null);
    if let Some(object) = value.as_object_mut() {
        for key in FINGERPRINT_IGNORED_KEYS {
            object.remove(*key);
        }
    }

    let mut canonical = String::new();
    write_canonical(&mut canonical, &value);

    let hash = pandacss_shared::fx_hash(&canonical);
    Arc::from(format!("cfg1-{hash:016x}").as_str())
}

/// Serialize a JSON value with object keys in sorted order, so the fingerprint
/// is independent of `serde_json`'s map ordering.
fn write_canonical(out: &mut String, value: &serde_json::Value) {
    use std::fmt::Write;
    match value {
        serde_json::Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort_unstable();
            out.push('{');
            for (index, key) in keys.into_iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                let _ = write!(out, "{key:?}:");
                write_canonical(out, &map[key]);
            }
            out.push('}');
        }
        serde_json::Value::Array(items) => {
            out.push('[');
            for (index, item) in items.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                write_canonical(out, item);
            }
            out.push(']');
        }
        other => {
            let _ = write!(out, "{other}");
        }
    }
}

pub(crate) fn format_config_diagnostics(diagnostics: &[Diagnostic]) -> String {
    let mut message = String::from("Invalid config:");
    for diagnostic in diagnostics {
        message.push_str("\n- [");
        message.push_str(&diagnostic.code);
        message.push_str("] ");
        message.push_str(&diagnostic.message);
    }
    message
}
