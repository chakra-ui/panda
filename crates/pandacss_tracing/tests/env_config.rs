use pandacss_tracing::{TraceConfig, TraceOutput};
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

    let initialized = pandacss_tracing::init(TraceConfig {
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

    pandacss_tracing::flush();
    assert!(pandacss_tracing::shutdown());

    let contents = std::fs::read_to_string(&trace_file).expect("trace file should exist");
    let json: serde_json::Value =
        serde_json::from_str(&contents).expect("trace file should be valid JSON");
    assert!(json.as_array().is_some_and(|entries| !entries.is_empty()));
    assert!(contents.contains("file_parse"));

    let _ = std::fs::remove_file(trace_file);
}
