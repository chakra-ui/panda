use pandacss_tokens::TokenError;

pub type Result<T> = std::result::Result<T, SystemError>;

/// A failure while compiling a resolved Panda config into a [`crate::System`].
#[derive(Debug, thiserror::Error)]
pub enum SystemError {
    #[error("Config error: {0}")]
    Config(String),
    #[error("Config error: invalid token config: {0}")]
    Token(#[source] TokenError),
    #[error("Regex error at {path}[{index}]: {pattern}")]
    Regex {
        path: String,
        index: usize,
        pattern: String,
    },
}

impl SystemError {
    #[must_use]
    pub fn config(message: impl Into<String>) -> Self {
        Self::Config(message.into())
    }

    #[must_use]
    pub fn regex(path: impl Into<String>, index: usize, pattern: impl Into<String>) -> Self {
        Self::Regex {
            path: path.into(),
            index,
            pattern: pattern.into(),
        }
    }
}
