use std::sync::Arc;

use pandacss_config::{UserConfig, ValidationMode, validate_config};
use pandacss_shared::Diagnostic;
use pandacss_tokens::TokenDictionary;

use crate::Result;
use crate::runtime_config::Config;

/// Immutable runtime model derived from a Panda config.
///
/// `System` is intentionally separate from [`crate::Project`]: config
/// compilation happens once here, while a project owns watch-mode file
/// state and extraction caches.
pub struct System {
    config: Arc<Config>,
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
        Ok(Self {
            config: Arc::new(crate::config::compile_config_with_token_dictionary(
                &input.config,
                input.token_dictionary,
            )?),
            diagnostics,
        })
    }

    #[must_use]
    pub fn config(&self) -> &Config {
        &self.config
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
