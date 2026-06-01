use pandacss_tracing::SpanTimings;
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
    assert!(snap.first().expect("first").total_nanos >= snap.last().expect("last").total_nanos);
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
