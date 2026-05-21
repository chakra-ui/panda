use std::io;

pub type PandaResult<T> = std::result::Result<T, PandaError>;

#[derive(Debug, thiserror::Error)]
pub enum PandaError {
    #[error("Config error: {0}")]
    Config(String),

    #[error("Token error: {0}")]
    Token(String),

    #[error("Regex error at {path}[{index}]: {message}")]
    Regex {
        path: String,
        index: usize,
        message: String,
    },

    #[error("I/O error: {0}")]
    Io(#[from] io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl PandaError {
    #[must_use]
    pub fn config(message: impl Into<String>) -> Self {
        Self::Config(message.into())
    }

    #[must_use]
    pub fn token(message: impl Into<String>) -> Self {
        Self::Token(message.into())
    }

    #[must_use]
    pub fn regex(path: impl Into<String>, index: usize, message: impl Into<String>) -> Self {
        Self::Regex {
            path: path.into(),
            index,
            message: message.into(),
        }
    }
}
