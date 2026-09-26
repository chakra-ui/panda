use std::convert::Infallible;
use std::error::Error;

use pandacss_compiler::{LoadSystemError, LoadSystemErrorKind, load_system};
use serde_json::json;

#[test]
fn validation_failure_preserves_structured_diagnostics() {
    let error = load_system(
        json!({
            "validation": "error",
            "conditions": { "pinkTheme": "[data-theme=pink]" }
        }),
        |_, _| Ok::<(), Infallible>(()),
    )
    .err()
    .expect("invalid config should fail");

    assert_eq!(error.kind(), Some(LoadSystemErrorKind::ConfigValidation));
    assert_eq!(error.code(), Some("config_validation_failed"));
    assert_eq!(error.diagnostics().len(), 1);
    assert_eq!(
        error.diagnostics()[0].code,
        "config_condition_selector_invalid"
    );
}

#[test]
fn deserialize_failure_keeps_validation_context() {
    let error = load_system(json!({ "outdir": 42 }), |_, _| Ok::<(), Infallible>(()))
        .err()
        .expect("invalid config shape should fail");

    assert_eq!(error.kind(), Some(LoadSystemErrorKind::ConfigDeserialize));
    assert_eq!(error.code(), Some("config_deserialize_failed"));
    assert!(error.to_string().starts_with("invalid config:"));
    assert!(error.source().is_some());
}

#[test]
fn host_failure_keeps_its_original_type() {
    #[derive(Debug, Eq, PartialEq)]
    struct HostError;

    let error = load_system(json!({}), |_, _| Err(HostError))
        .err()
        .expect("host callback should fail");

    assert!(matches!(error, LoadSystemError::Host(HostError)));
}

#[test]
fn host_neutral_errors_are_thread_safe_standard_errors() {
    fn assert_error<T: Error + Send + Sync + 'static>() {}

    assert_error::<pandacss_tokens::TokenError>();
    assert_error::<pandacss_system::SystemError>();
    assert_error::<LoadSystemError<Infallible>>();
}
