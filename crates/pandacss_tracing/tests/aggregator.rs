use pandacss_tracing::{SpanStat, SpanTimings, render_fmt_summary};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

#[test]
fn aggregates_span_enter_exit() {
    let timings = SpanTimings::new();
    let subscriber = tracing_subscriber::registry().with(timings.layer());
    let _guard = subscriber.set_default();

    for _ in 0..3 {
        let _entered = tracing::trace_span!("alpha").entered();
        std::thread::sleep(std::time::Duration::from_millis(1));
    }
    {
        let _entered = tracing::trace_span!("beta").entered();
        std::thread::sleep(std::time::Duration::from_millis(2));
    }

    let snap = timings.snapshot();
    assert_eq!(snap.len(), 2);
    let alpha = snap.iter().find(|s| s.name == "alpha").expect("alpha");
    let beta = snap.iter().find(|s| s.name == "beta").expect("beta");
    assert_eq!(alpha.count, 3);
    assert_eq!(beta.count, 1);
    assert!(alpha.total_nanos > 0);
    assert!(beta.total_nanos > 0);
}

#[test]
fn records_slowest_instances_by_path_field() {
    let timings = SpanTimings::new();
    let subscriber = tracing_subscriber::registry().with(timings.layer());
    let _guard = subscriber.set_default();

    for path in ["a.tsx", "b.tsx", "c.tsx"] {
        let _entered = tracing::trace_span!("extraction", path = path).entered();
    }

    let snap = timings.snapshot();
    let extraction = snap.iter().find(|s| s.name == "extraction").expect("span");
    assert_eq!(extraction.count, 3);
    let mut labels: Vec<&str> = extraction
        .slowest
        .iter()
        .map(|instance| instance.label.as_str())
        .collect();
    labels.sort_unstable();
    assert_eq!(labels, ["a.tsx", "b.tsx", "c.tsx"]);
}

#[test]
fn strips_debug_quoting_from_non_str_path_fields() {
    let timings = SpanTimings::new();
    let subscriber = tracing_subscriber::registry().with(timings.layer());
    let _guard = subscriber.set_default();

    let path = std::path::PathBuf::from("/virtual/src");
    {
        let _entered = tracing::trace_span!("resolve", path = ?path).entered();
    }

    let snap = timings.snapshot();
    let resolve = snap.iter().find(|s| s.name == "resolve").expect("span");
    assert_eq!(resolve.slowest[0].label, "/virtual/src");
}

#[test]
fn records_slowest_instances_by_id_field_when_no_path() {
    let timings = SpanTimings::new();
    let subscriber = tracing_subscriber::registry().with(timings.layer());
    let _guard = subscriber.set_default();

    for id in ["conditions", "types", "css"] {
        let _entered = tracing::trace_span!("artifact", id = id).entered();
    }

    let snap = timings.snapshot();
    let artifact = snap.iter().find(|s| s.name == "artifact").expect("span");
    let mut labels: Vec<&str> = artifact
        .slowest
        .iter()
        .map(|instance| instance.label.as_str())
        .collect();
    labels.sort_unstable();
    assert_eq!(labels, ["conditions", "css", "types"]);
}

#[test]
fn spans_without_path_field_have_empty_slowest() {
    let timings = SpanTimings::new();
    let subscriber = tracing_subscriber::registry().with(timings.layer());
    let _guard = subscriber.set_default();

    let _ = tracing::trace_span!("encoder_atomic").entered();

    let snap = timings.snapshot();
    let span = snap
        .iter()
        .find(|s| s.name == "encoder_atomic")
        .expect("span");
    assert!(span.slowest.is_empty());
}

#[test]
fn slowest_instances_are_capped_at_five() {
    let timings = SpanTimings::new();

    // Fixed durations keep ordering deterministic — real elapsed time flakes under CI jitter.
    for i in 0..8u64 {
        timings.record(
            "extraction",
            u128::from(i + 1),
            Some(format!("file-{i}.tsx")),
        );
    }

    let snap = timings.snapshot();
    let extraction = snap.iter().find(|s| s.name == "extraction").expect("span");
    assert_eq!(extraction.count, 8);
    assert_eq!(extraction.slowest.len(), 5);
    // Slowest overall (file-7 through file-3) survive the cap, in descending order.
    let labels: Vec<&str> = extraction
        .slowest
        .iter()
        .map(|instance| instance.label.as_str())
        .collect();
    assert_eq!(
        labels,
        [
            "file-7.tsx",
            "file-6.tsx",
            "file-5.tsx",
            "file-4.tsx",
            "file-3.tsx"
        ]
    );
}

#[test]
fn clear_resets_totals() {
    let timings = SpanTimings::new();
    let subscriber = tracing_subscriber::registry().with(timings.layer());
    let _guard = subscriber.set_default();

    let entered = tracing::trace_span!("gamma").entered();
    drop(entered);
    assert!(!timings.snapshot().is_empty());
    timings.clear();
    assert!(timings.snapshot().is_empty());
}

#[test]
fn renders_human_trace_summary() {
    let summary = render_fmt_summary(&[
        SpanStat {
            name: "codegen_generate",
            total_nanos: 1_500_000,
            count: 1,
            slowest: vec![],
        },
        SpanStat {
            name: "token_dictionary_build",
            total_nanos: 12_000,
            count: 3,
            slowest: vec![],
        },
    ]);

    insta::assert_snapshot!(summary, @r"
    trace summary
    total spans: 4
    total span time: 1.51ms

    span                                 count         total
    --------------------------------------------------------
    codegen_generate                         1        1.50ms
    token_dictionary_build                   3       12.00us
    ");
}
