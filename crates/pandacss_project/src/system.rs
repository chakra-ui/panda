use std::sync::Arc;

use pandacss_config::UserConfig;

use crate::Result;
use crate::runtime_config::Config;

/// Immutable runtime model derived from a Panda config.
///
/// `System` is intentionally separate from [`crate::Project`]: config
/// compilation happens once here, while a project owns watch-mode file
/// state and extraction caches.
pub struct System {
    config: Arc<Config>,
}

impl System {
    pub fn new(config: UserConfig) -> Result<Self> {
        let _span = tracing::debug_span!("config_compile").entered();
        Ok(Self {
            config: Arc::new(Config::from_user_config(&config)?),
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
}
