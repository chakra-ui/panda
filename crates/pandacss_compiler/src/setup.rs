//! Turning a host's resolved config JSON into a [`System`]: validate, stop in
//! `validation: 'error'` mode, deserialize, build tokens, let the host resolve
//! `utility.values` callbacks, then compile.

use std::fmt;
use std::sync::Arc;

use pandacss_config::{
    UserConfig, ValidationMode, validate_config_value, validation_mode_from_value,
};
use pandacss_shared::Diagnostic;
use pandacss_system::{System, SystemInput};
use pandacss_tokens::TokenDictionary;

use crate::format_config_diagnostics;

/// A compiled [`System`] plus the config it was built from.
pub struct LoadedSystem {
    /// The compiled config, ready for `Project::new` or a transform.
    pub system: System,
    /// The config after host callbacks resolved `utility.values`.
    pub user_config: UserConfig,
    /// `user_config` as JSON, for hosts that hand the config back to JS.
    pub snapshot: serde_json::Value,
}

/// Why a config couldn't become a [`System`]. `E` is the host's own error from
/// resolving `utility.values` callbacks.
#[derive(Debug)]
pub enum LoadSystemError<E> {
    /// Validation failed and the config asked for `validation: 'error'`.
    Invalid(Vec<Diagnostic>),
    /// The config JSON didn't match the expected shape.
    Deserialize(String),
    /// The theme tokens couldn't be built into a dictionary.
    Tokens(String),
    /// The host's `utility.values` resolver failed.
    Host(E),
    /// The config deserialized but couldn't be compiled (e.g. invalid recipes).
    Compile(String),
}

impl<E> LoadSystemError<E> {
    /// The user-facing message, or `None` for a host error the host reports itself.
    #[must_use]
    pub fn message(&self) -> Option<String> {
        match self {
            Self::Invalid(diagnostics) => Some(format_config_diagnostics(diagnostics)),
            Self::Deserialize(message) => Some(message.clone()),
            Self::Tokens(err) => Some(format!("invalid token config: {err}")),
            Self::Host(_) => None,
            Self::Compile(err) => Some(format!("invalid config: {err}")),
        }
    }
}

impl<E: fmt::Display> fmt::Display for LoadSystemError<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Host(err) => write!(f, "{err}"),
            other => f.write_str(&other.message().unwrap_or_default()),
        }
    }
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
        return Err(LoadSystemError::Invalid(diagnostics));
    }
    let mut user_config: UserConfig = serde_json::from_value(config.clone()).map_err(|err| {
        LoadSystemError::Deserialize(if diagnostics.is_empty() {
            format!("invalid config: {err}")
        } else {
            format!(
                "invalid config: {err}\n{}",
                format_config_diagnostics(&diagnostics)
            )
        })
    })?;
    let token_dictionary = TokenDictionary::from_config(&user_config)
        .map_err(|err| LoadSystemError::Tokens(err.to_string()))?
        .map(Arc::new);
    resolve_utility_values(&mut user_config, token_dictionary.as_ref())
        .map_err(LoadSystemError::Host)?;
    let snapshot = serde_json::to_value(&user_config).unwrap_or(config);
    let system = System::new(SystemInput {
        config: user_config.clone(),
        diagnostics: Some(diagnostics),
        token_dictionary,
    })
    .map_err(|err| LoadSystemError::Compile(err.to_string()))?;
    Ok(LoadedSystem {
        system,
        user_config,
        snapshot,
    })
}
