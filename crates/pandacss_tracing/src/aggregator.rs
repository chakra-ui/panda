//! In-process span-duration aggregator, for benches/tests that need exact
//! per-span totals without parsing chrome-json: install [`SpanTimings`] as a
//! subscriber, run traced code, then call [`SpanTimings::snapshot`].
//!
//! Counts/durations come from `on_enter` → `on_exit` pairs; re-entering a
//! span accumulates time and bumps the count.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use tracing::Subscriber;
use tracing::span::{Attributes, Id};
use tracing_subscriber::layer::{Context, Layer};
use tracing_subscriber::registry::LookupSpan;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SpanStat {
    pub name: &'static str,
    pub total_nanos: u128,
    pub count: u64,
}

impl SpanStat {
    #[must_use]
    #[allow(
        clippy::cast_precision_loss,
        reason = "ms display tolerates f64 precision loss"
    )]
    pub fn total_ms(&self) -> f64 {
        (self.total_nanos as f64) / 1_000_000.0
    }
}

/// Shared collector. Cheaply cloneable via `Arc`.
#[derive(Debug, Default)]
pub struct SpanTimings {
    inner: Mutex<HashMap<&'static str, Accum>>,
}

#[derive(Debug, Default)]
struct Accum {
    total_nanos: u128,
    count: u64,
}

impl SpanTimings {
    #[must_use]
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    pub fn clear(&self) {
        if let Ok(mut map) = self.inner.lock() {
            map.clear();
        }
    }

    /// Current totals, sorted by total time descending.
    #[must_use]
    pub fn snapshot(&self) -> Vec<SpanStat> {
        let Ok(map) = self.inner.lock() else {
            return Vec::new();
        };
        let mut out: Vec<SpanStat> = map
            .iter()
            .map(|(name, accum)| SpanStat {
                name,
                total_nanos: accum.total_nanos,
                count: accum.count,
            })
            .collect();

        out.sort_by(|a, b| b.total_nanos.cmp(&a.total_nanos));
        out
    }

    #[must_use]
    pub fn layer<S>(self: &Arc<Self>) -> SpanTimingsLayer<S>
    where
        S: Subscriber + for<'a> LookupSpan<'a>,
    {
        SpanTimingsLayer {
            timings: Arc::clone(self),
            _marker: std::marker::PhantomData,
        }
    }

    fn add(&self, name: &'static str, nanos: u128) {
        if let Ok(mut map) = self.inner.lock() {
            let entry = map.entry(name).or_default();
            entry.total_nanos = entry.total_nanos.saturating_add(nanos);
            entry.count = entry.count.saturating_add(1);
        }
    }
}

pub struct SpanTimingsLayer<S> {
    timings: Arc<SpanTimings>,
    _marker: std::marker::PhantomData<fn(S)>,
}

struct EnteredAt(Instant);

impl<S> Layer<S> for SpanTimingsLayer<S>
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    fn on_new_span(&self, _attrs: &Attributes<'_>, _id: &Id, _ctx: Context<'_, S>) {}

    fn on_enter(&self, id: &Id, ctx: Context<'_, S>) {
        // Stamp the entry time on the span itself so re-entry nests correctly.
        if let Some(span) = ctx.span(id) {
            span.extensions_mut().insert(EnteredAt(Instant::now()));
        }
    }

    fn on_exit(&self, id: &Id, ctx: Context<'_, S>) {
        let Some(span) = ctx.span(id) else { return };

        // Pair with the `on_enter` stamp; absent means we never saw the enter.
        let entered = span.extensions_mut().remove::<EnteredAt>();
        let Some(EnteredAt(start)) = entered else {
            return;
        };

        let elapsed = start.elapsed().as_nanos();
        let name = span.metadata().name();
        self.timings.add(name, elapsed);
    }
}
