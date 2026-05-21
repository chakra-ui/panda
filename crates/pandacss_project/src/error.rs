use pandacss_shared::PandaError;

pub type Result<T> = std::result::Result<T, ConfigError>;
pub type ConfigError = PandaError;
