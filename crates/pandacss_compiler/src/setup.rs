//! Turning a host's resolved config JSON into a [`System`]: validate, stop in
//! `validation: 'error'` mode, deserialize, build tokens, let the host resolve
//! `utility.values` callbacks, then compile.

use std::sync::Arc;

use pandacss_config::{
    UserConfig, ValidationMode, validate_config_value, validation_mode_from_value,
};
use pandacss_system::{System, SystemInput};
use pandacss_tokens::TokenDictionary;

use crate::{LoadSystemError, format_config_diagnostics};

/// A compiled [`System`] plus the config it was built from.
pub struct LoadedSystem {
    /// The compiled config, ready for `Project::new` or a transform.
    pub system: System,
    /// The config after host callbacks resolved `utility.values`.
    pub user_config: UserConfig,
    /// `user_config` as JSON, for hosts that hand the config back to JS.
    pub snapshot: serde_json::Value,
}

/// Compiles the resolved config JSON into a [`System`].
///
/// # Errors
/// See [`LoadSystemError`].
pub fn load_system<E>(
    config: serde_json::Value,
    resolve_utility_values: impl FnOnce(&mut UserConfig, Option<&Arc<TokenDictionary>>) -> Result<(), E>,
) -> Result<LoadedSystem, LoadSystemError<E>> {
    let diagnostics = validate_config_value(&config);
    if validation_mode_from_value(&config) == ValidationMode::Error && !diagnostics.is_empty() {
        let message = format_config_diagnostics(&diagnostics);
        return Err(LoadSystemError::Validation {
            message,
            diagnostics,
        });
    }
    let mut user_config: UserConfig = serde_json::from_value(config.clone()).map_err(|err| {
        let message = if diagnostics.is_empty() {
            format!("invalid config: {err}")
        } else {
            format!(
                "invalid config: {err}\n{}",
                format_config_diagnostics(&diagnostics)
            )
        };
        LoadSystemError::Deserialize {
            message,
            diagnostics: diagnostics.clone(),
            source: err,
        }
    })?;
    let token_dictionary = TokenDictionary::from_config(&user_config)
        .map_err(|err| LoadSystemError::Tokens {
            diagnostics: diagnostics.clone(),
            source: err,
        })?
        .map(Arc::new);
    resolve_utility_values(&mut user_config, token_dictionary.as_ref())
        .map_err(LoadSystemError::Host)?;
    let snapshot = serde_json::to_value(&user_config).unwrap_or(config);
    let system = System::new(SystemInput {
        config: user_config.clone(),
        diagnostics: Some(diagnostics.clone()),
        token_dictionary,
    })
    .map_err(|err| LoadSystemError::System {
        diagnostics,
        source: err,
    })?;
    Ok(LoadedSystem {
        system,
        user_config,
        snapshot,
    })
}
