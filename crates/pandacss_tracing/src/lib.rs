//! Tracing bootstrap for native Panda Rust entrypoints.
//!
//! Core crates should only emit `tracing` spans. This crate owns subscriber
//! setup so output choices stay at the executable / binding boundary.

use std::fmt::Write as _;
use std::io::Write as _;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock};

use tracing::Subscriber;
use tracing_chrome::FlushGuard;
use tracing_subscriber::filter::EnvFilter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

mod aggregator;
pub use aggregator::{SpanStat, SpanTimings, SpanTimingsLayer};

const DEFAULT_FILTER: &str = "info";
const DEFAULT_TRACE_FILE: &str = ".panda/trace.json";
const FMT_SUMMARY_LIMIT: usize = 20;

static CHROME_GUARD: OnceLock<Mutex<Option<FlushGuard>>> = OnceLock::new();
static FMT_TIMINGS: OnceLock<Mutex<Option<Arc<SpanTimings>>>> = OnceLock::new();
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
        // An empty/whitespace filter means tracing is off — bail without a config.
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
    // Fall back to a sane default rather than failing if the filter is malformed.
    let filter =
        EnvFilter::try_new(&config.filter).unwrap_or_else(|_| EnvFilter::new(DEFAULT_FILTER));
    let registry = tracing_subscriber::registry().with(filter);

    match config.output {
        TraceOutput::Fmt => {
            let timings = SpanTimings::new();
            let subscriber = registry.with(timings.layer());

            if try_init(subscriber) {
                let timing_slot = FMT_TIMINGS.get_or_init(|| Mutex::new(None));
                if let Ok(mut slot) = timing_slot.lock() {
                    *slot = Some(timings);
                }

                true
            } else {
                false
            }
        }

        TraceOutput::ChromeJson { file } => {
            // Create the trace file's parent dir before the writer opens it.
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
                // Park the flush guard in a static — dropping it would truncate
                // the trace. `shutdown`/`flush` reach it from there.
                let guard_slot = CHROME_GUARD.get_or_init(|| Mutex::new(None));
                if let Ok(mut slot) = guard_slot.lock() {
                    *slot = Some(guard);
                }

                true
            } else {
                // Another subscriber won the race; flush what we built and bail.
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
    if shutdown_fmt() {
        return true;
    }

    shutdown_chrome_json()
}

fn shutdown_fmt() -> bool {
    let Some(timing_slot) = FMT_TIMINGS.get() else {
        return false;
    };
    let Ok(mut slot) = timing_slot.lock() else {
        return false;
    };
    let Some(timings) = slot.take() else {
        return false;
    };

    let summary = render_fmt_summary(&timings.snapshot());
    let _ = std::io::stderr().write_all(summary.as_bytes());
    true
}

fn shutdown_chrome_json() -> bool {
    let Some(guard_slot) = CHROME_GUARD.get() else {
        return false;
    };
    let Ok(mut slot) = guard_slot.lock() else {
        return false;
    };
    slot.take().is_some()
}

#[must_use]
pub fn render_fmt_summary(stats: &[SpanStat]) -> String {
    let total_spans = stats.iter().map(|stat| stat.count).sum::<u64>();
    let total_time = stats
        .iter()
        .fold(0_u128, |total, stat| total.saturating_add(stat.total_nanos));

    let mut out = String::new();
    out.push_str("trace summary\n");
    writeln!(&mut out, "total spans: {total_spans}").expect("write to string");
    writeln!(&mut out, "total span time: {}", format_duration(total_time))
        .expect("write to string");

    if stats.is_empty() {
        out.push_str("\nno spans recorded\n");
        return out;
    }

    let limit = stats.len().min(FMT_SUMMARY_LIMIT);
    writeln!(&mut out, "\n{:<32}{:>10}{:>14}", "span", "count", "total").expect("write to string");
    out.push_str("--------------------------------------------------------\n");

    for stat in stats.iter().take(limit) {
        writeln!(
            &mut out,
            "{:<32}{:>10}{:>14}",
            truncate_name(stat.name),
            stat.count,
            format_duration(stat.total_nanos),
        )
        .expect("write to string");
    }

    let omitted = stats.len().saturating_sub(limit);
    if omitted > 0 {
        writeln!(&mut out, "... {omitted} more spans omitted").expect("write to string");
    }

    out
}

fn truncate_name(name: &str) -> String {
    const WIDTH: usize = 32;

    if name.chars().count() <= WIDTH {
        return name.to_owned();
    }

    let mut truncated = name
        .chars()
        .take(WIDTH.saturating_sub(3))
        .collect::<String>();
    truncated.push_str("...");
    truncated
}

#[allow(
    clippy::cast_precision_loss,
    reason = "human trace summary formatting tolerates f64 precision loss"
)]
fn format_duration(nanos: u128) -> String {
    if nanos < 1_000 {
        return format!("{nanos}ns");
    }

    if nanos < 1_000_000 {
        return format!("{:.2}us", (nanos as f64) / 1_000.0);
    }

    if nanos < 1_000_000_000 {
        return format!("{:.2}ms", (nanos as f64) / 1_000_000.0);
    }

    format!("{:.2}s", (nanos as f64) / 1_000_000_000.0)
}

fn try_init<S>(subscriber: S) -> bool
where
    S: Subscriber + Send + Sync + 'static,
{
    subscriber.try_init().is_ok()
}
