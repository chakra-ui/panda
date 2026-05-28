use std::sync::Arc;

use pandacss_config::{UserConfig, ValidationMode, validate_config};
use pandacss_shared::Diagnostic;

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

impl System {
    pub fn new(config: UserConfig) -> Result<Self> {
        let _span = tracing::debug_span!("config_compile").entered();
        let diagnostics = validate_config(&config);
        Self::from_config_and_diagnostics(config, diagnostics)
    }

    pub fn from_config_and_diagnostics(
        config: UserConfig,
        diagnostics: Vec<Diagnostic>,
    ) -> Result<Self> {
        if config.validation == ValidationMode::Error && !diagnostics.is_empty() {
            return Err(crate::ConfigError::config(format_config_diagnostics(
                &diagnostics,
            )));
        }
        Ok(Self {
            config: Arc::new(Config::from_user_config(&config)?),
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
