//! Tracing bootstrap for native Panda Rust entrypoints.
//!
//! Core crates should only emit `tracing` spans. This crate owns subscriber
//! setup so output choices stay at the executable / binding boundary.

use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use tracing::Subscriber;
use tracing_chrome::FlushGuard;
use tracing_subscriber::filter::EnvFilter;
use tracing_subscriber::fmt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

const DEFAULT_FILTER: &str = "info";
const DEFAULT_TRACE_FILE: &str = ".panda/trace.json";

static CHROME_GUARD: OnceLock<Mutex<Option<FlushGuard>>> = OnceLock::new();
static ENV_CONFIG: OnceLock<Option<TraceConfig>> = OnceLock::new();
static INIT_RESULT: OnceLock<bool> = OnceLock::new();

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TraceOutput {
    Fmt,
    ChromeJson { file: PathBuf },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TraceConfig {
    pub filter: String,
    pub output: TraceOutput,
}

impl TraceConfig {
    #[must_use]
    pub fn from_env() -> Option<Self> {
        Self::from_values(
            std::env::var("PANDA_TRACE").ok().as_deref(),
            std::env::var("PANDA_TRACE_OUTPUT").ok().as_deref(),
            std::env::var("PANDA_TRACE_FILE").ok().as_deref(),
        )
    }

    #[must_use]
    pub fn from_values(
        filter: Option<&str>,
        output: Option<&str>,
        file: Option<&str>,
    ) -> Option<Self> {
        let filter = filter.filter(|value| !value.trim().is_empty())?;
        let output = match output.unwrap_or("fmt") {
            "fmt" | "stderr" => TraceOutput::Fmt,
            "chrome-json" => TraceOutput::ChromeJson {
                file: PathBuf::from(file.unwrap_or(DEFAULT_TRACE_FILE)),
            },
            _ => return None,
        };
        Some(Self {
            filter: filter.to_owned(),
            output,
        })
    }
}

/// Initialize native tracing from `PANDA_TRACE*` env vars.
///
/// Calling this multiple times is intentionally harmless. Env parsing and
/// subscriber installation both happen at most once per process.
pub fn init_from_env() {
    let Some(config) = ENV_CONFIG.get_or_init(TraceConfig::from_env).clone() else {
        return;
    };
    let _ = init(config);
}

#[must_use]
pub fn init(config: TraceConfig) -> bool {
    *INIT_RESULT.get_or_init(|| install(config))
}

fn install(config: TraceConfig) -> bool {
    let filter =
        EnvFilter::try_new(&config.filter).unwrap_or_else(|_| EnvFilter::new(DEFAULT_FILTER));
    let registry = tracing_subscriber::registry().with(filter);

    match config.output {
        TraceOutput::Fmt => {
            let subscriber = registry.with(fmt::layer().with_writer(std::io::stderr));
            try_init(subscriber)
        }
        TraceOutput::ChromeJson { file } => {
            if let Some(parent) = file
                .parent()
                .filter(|parent| !parent.as_os_str().is_empty())
            {
                let _ = std::fs::create_dir_all(parent);
            }
            let (chrome_layer, guard) =
                tracing_chrome::ChromeLayerBuilder::new().file(file).build();
            let subscriber = registry.with(chrome_layer);
            if try_init(subscriber) {
                let guard_slot = CHROME_GUARD.get_or_init(|| Mutex::new(None));
                if let Ok(mut slot) = guard_slot.lock() {
                    *slot = Some(guard);
                }
                true
            } else {
                guard.flush();
                false
            }
        }
    }
}

pub fn flush() {
    let Some(guard_slot) = CHROME_GUARD.get() else {
        return;
    };
    if let Ok(slot) = guard_slot.lock()
        && let Some(guard) = slot.as_ref()
    {
        guard.flush();
    }
}

#[must_use]
pub fn shutdown() -> bool {
    let Some(guard_slot) = CHROME_GUARD.get() else {
        return false;
    };
    let Ok(mut slot) = guard_slot.lock() else {
        return false;
    };
    slot.take().is_some()
}

fn try_init<S>(subscriber: S) -> bool
where
    S: Subscriber + Send + Sync + 'static,
{
    subscriber.try_init().is_ok()
}

#[cfg(test)]
mod tests {
    use super::{TraceConfig, TraceOutput};
    use std::path::PathBuf;

    #[test]
    fn no_filter_disables_tracing() {
        assert_eq!(TraceConfig::from_values(None, None, None), None);
        assert_eq!(TraceConfig::from_values(Some(""), None, None), None);
    }

    #[test]
    fn parses_fmt_output() {
        assert_eq!(
            TraceConfig::from_values(Some("debug"), Some("fmt"), None),
            Some(TraceConfig {
                filter: "debug".to_owned(),
                output: TraceOutput::Fmt,
            })
        );
    }

    #[test]
    fn parses_chrome_json_output() {
        assert_eq!(
            TraceConfig::from_values(
                Some("trace"),
                Some("chrome-json"),
                Some("target/panda-trace.json")
            ),
            Some(TraceConfig {
                filter: "trace".to_owned(),
                output: TraceOutput::ChromeJson {
                    file: PathBuf::from("target/panda-trace.json"),
                },
            })
        );
    }

    #[test]
    fn unknown_output_disables_tracing() {
        assert_eq!(
            TraceConfig::from_values(Some("trace"), Some("otlp"), None),
            None
        );
    }

    #[test]
    fn shutdown_finalizes_chrome_json() {
        let trace_file = std::env::temp_dir().join(format!(
            "panda-trace-{}-{}.json",
            std::process::id(),
            "shutdown"
        ));
        let _ = std::fs::remove_file(&trace_file);

        let initialized = super::init(TraceConfig {
            filter: "trace".to_owned(),
            output: TraceOutput::ChromeJson {
                file: trace_file.clone(),
            },
        });
        if !initialized {
            return;
        }

        let span = tracing::info_span!("file_parse", path = "/virtual/Button.tsx");
        let entered = span.enter();
        tracing::info!("parsed");
        drop(entered);

        super::flush();
        assert!(super::shutdown());

        let contents = std::fs::read_to_string(&trace_file).expect("trace file should exist");
        let json: serde_json::Value =
            serde_json::from_str(&contents).expect("trace file should be valid JSON");
        assert!(json.as_array().is_some_and(|entries| !entries.is_empty()));
        assert!(contents.contains("file_parse"));

        let _ = std::fs::remove_file(trace_file);
    }
}
