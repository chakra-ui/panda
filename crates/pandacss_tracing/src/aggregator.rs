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
use tracing::field::{Field, Visit};
use tracing::span::{Attributes, Id};
use tracing_subscriber::layer::{Context, Layer};
use tracing_subscriber::registry::LookupSpan;

/// How many slowest instances to retain per span name.
const SLOWEST_CAP: usize = 5;

/// One slow instance of a span, labeled by its `path` field.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlowestInstance {
    pub label: String,
    pub nanos: u128,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SpanStat {
    pub name: &'static str,
    pub total_nanos: u128,
    pub count: u64,
    /// Slowest instances, descending, capped at [`SLOWEST_CAP`].
    pub slowest: Vec<SlowestInstance>,
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
    /// Sorted and capped to [`SLOWEST_CAP`] only at [`SpanTimings::snapshot`].
    slowest: Vec<SlowestInstance>,
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
            .map(|(name, accum)| {
                let mut slowest = accum.slowest.clone();
                slowest.sort_by(|a, b| b.nanos.cmp(&a.nanos));
                slowest.truncate(SLOWEST_CAP);
                SpanStat {
                    name,
                    total_nanos: accum.total_nanos,
                    count: accum.count,
                    slowest,
                }
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

    pub fn record(&self, name: &'static str, nanos: u128, label: Option<String>) {
        if let Ok(mut map) = self.inner.lock() {
            let entry = map.entry(name).or_default();
            entry.total_nanos = entry.total_nanos.saturating_add(nanos);
            entry.count = entry.count.saturating_add(1);
            if let Some(label) = label {
                entry.slowest.push(SlowestInstance { label, nanos });
            }
        }
    }
}

pub struct SpanTimingsLayer<S> {
    timings: Arc<SpanTimings>,
    _marker: std::marker::PhantomData<fn(S)>,
}

struct EnteredAt(Instant);

/// A span's `path` or `id` field, if it recorded one — whichever identifies
/// *which instance* this span ran for (a file, a codegen artifact, …).
struct InstanceLabel(String);

/// Picks out a span's `path`/`id` field for [`InstanceLabel`]. `path` wins if
/// a span somehow records both.
#[derive(Default)]
struct PathFieldVisitor {
    path: Option<String>,
    id: Option<String>,
}

impl PathFieldVisitor {
    fn label(self) -> Option<String> {
        self.path.or(self.id)
    }
}

impl Visit for PathFieldVisitor {
    fn record_str(&mut self, field: &Field, value: &str) {
        match field.name() {
            "path" => self.path = Some(value.to_owned()),
            "id" => self.id = Some(value.to_owned()),
            _ => {}
        }
    }

    fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
        match field.name() {
            "path" if self.path.is_none() => {
                self.path = Some(unquote_debug(&format!("{value:?}")));
            }
            "id" if self.id.is_none() => {
                self.id = Some(unquote_debug(&format!("{value:?}")));
            }
            _ => {}
        }
    }
}

/// `Debug` on string-like values (e.g. `&Path`) wraps them in quotes; strip a
/// matching pair so labels read as plain paths, not `"like this"`.
fn unquote_debug(value: &str) -> String {
    value
        .strip_prefix('"')
        .and_then(|rest| rest.strip_suffix('"'))
        .map_or_else(|| value.to_owned(), ToOwned::to_owned)
}

impl<S> Layer<S> for SpanTimingsLayer<S>
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    fn on_new_span(&self, attrs: &Attributes<'_>, id: &Id, ctx: Context<'_, S>) {
        let mut visitor = PathFieldVisitor::default();
        attrs.record(&mut visitor);
        if let Some(label) = visitor.label()
            && let Some(span) = ctx.span(id)
        {
            span.extensions_mut().insert(InstanceLabel(label));
        }
    }

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
        let label = span
            .extensions()
            .get::<InstanceLabel>()
            .map(|InstanceLabel(label)| label.clone());
        self.timings.record(name, elapsed, label);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_orders_spans_by_total_time_descending() {
        let timings = SpanTimings::new();
        timings.record("beta", 2_000, None);
        timings.record("alpha", 5_000, None);

        let names: Vec<&str> = timings.snapshot().iter().map(|s| s.name).collect();
        assert_eq!(names, ["alpha", "beta"]);
    }

    #[test]
    fn snapshot_orders_slowest_instances_by_duration_descending() {
        let timings = SpanTimings::new();
        timings.record("extraction", 5, Some("a.tsx".into()));
        timings.record("extraction", 30, Some("b.tsx".into()));
        timings.record("extraction", 15, Some("c.tsx".into()));

        let snap = timings.snapshot();
        let extraction = snap.iter().find(|s| s.name == "extraction").expect("span");
        let labels: Vec<&str> = extraction
            .slowest
            .iter()
            .map(|i| i.label.as_str())
            .collect();
        assert_eq!(labels, ["b.tsx", "c.tsx", "a.tsx"]);
    }

    #[test]
    fn snapshot_caps_slowest_instances_at_five_in_descending_order() {
        let timings = SpanTimings::new();
        for i in 0..8u128 {
            timings.record("extraction", (i + 1) * 15, Some(format!("file-{i}.tsx")));
        }

        let snap = timings.snapshot();
        let extraction = snap.iter().find(|s| s.name == "extraction").expect("span");
        assert_eq!(extraction.count, 8);
        let labels: Vec<&str> = extraction
            .slowest
            .iter()
            .map(|i| i.label.as_str())
            .collect();
        assert_eq!(
            labels,
            [
                "file-7.tsx",
                "file-6.tsx",
                "file-5.tsx",
                "file-4.tsx",
                "file-3.tsx"
            ],
        );
    }
}
