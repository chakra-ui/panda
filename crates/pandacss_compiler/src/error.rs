use pandacss_shared::Diagnostic;
use pandacss_system::SystemError;
use pandacss_tokens::TokenError;

/// Stable category for a failure while loading a [`pandacss_system::System`].
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LoadSystemErrorKind {
    ConfigValidation,
    ConfigDeserialize,
    TokenDictionary,
    SystemCompile,
}

impl LoadSystemErrorKind {
    /// Stable machine-readable code for host integrations.
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::ConfigValidation => "config_validation_failed",
            Self::ConfigDeserialize => "config_deserialize_failed",
            Self::TokenDictionary => "token_dictionary_build_failed",
            Self::SystemCompile => "system_compile_failed",
        }
    }
}

/// A setup failure, preserving host callback errors without erasing their type.
#[derive(Debug, thiserror::Error)]
pub enum LoadSystemError<E> {
    #[error("{message}")]
    Validation {
        message: String,
        diagnostics: Vec<Diagnostic>,
    },
    #[error("{message}")]
    Deserialize {
        message: String,
        diagnostics: Vec<Diagnostic>,
        #[source]
        source: serde_json::Error,
    },
    #[error("invalid token config: {source}")]
    Tokens {
        diagnostics: Vec<Diagnostic>,
        #[source]
        source: TokenError,
    },
    #[error("{0}")]
    Host(E),
    #[error("invalid config: {source}")]
    System {
        diagnostics: Vec<Diagnostic>,
        #[source]
        source: SystemError,
    },
}

impl<E> LoadSystemError<E> {
    #[must_use]
    pub const fn kind(&self) -> Option<LoadSystemErrorKind> {
        match self {
            Self::Host(_) => None,
            Self::Validation { .. } => Some(LoadSystemErrorKind::ConfigValidation),
            Self::Deserialize { .. } => Some(LoadSystemErrorKind::ConfigDeserialize),
            Self::Tokens { .. } => Some(LoadSystemErrorKind::TokenDictionary),
            Self::System { .. } => Some(LoadSystemErrorKind::SystemCompile),
        }
    }

    #[must_use]
    pub fn code(&self) -> Option<&'static str> {
        self.kind().map(LoadSystemErrorKind::code)
    }

    #[must_use]
    pub fn diagnostics(&self) -> &[Diagnostic] {
        match self {
            Self::Validation { diagnostics, .. }
            | Self::Deserialize { diagnostics, .. }
            | Self::Tokens { diagnostics, .. }
            | Self::System { diagnostics, .. } => diagnostics,
            Self::Host(_) => &[],
        }
    }

    /// User-facing message for host-neutral failures. Host errors stay in
    /// their original type and are reported by the binding.
    #[must_use]
    pub fn message(&self) -> Option<String> {
        match self {
            Self::Validation { message, .. } | Self::Deserialize { message, .. } => {
                Some(message.clone())
            }
            Self::Tokens { source, .. } => Some(format!("invalid token config: {source}")),
            Self::System { source, .. } => Some(format!("invalid config: {source}")),
            Self::Host(_) => None,
        }
    }
}
