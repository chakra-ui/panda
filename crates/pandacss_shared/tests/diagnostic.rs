use pandacss_shared::{Diagnostic, SourceLocation, SourceRange, Span, diagnostic_codes as codes};
use serde_json::json;

#[test]
fn serializes_diagnostic_wire_shape() {
    let diagnostic = Diagnostic::warning(codes::COMPILE_PLACEHOLDER, "not implemented")
        .with_span(Span { start: 1, end: 4 })
        .with_location(SourceRange {
            start: SourceLocation { line: 1, column: 2 },
            end: SourceLocation { line: 1, column: 5 },
        });

    assert_eq!(
        serde_json::to_value(diagnostic).expect("serialize"),
        json!({
            "code": "compile_placeholder",
            "message": "not implemented",
            "severity": "warning",
            "span": { "start": 1, "end": 4 },
            "location": {
                "start": { "line": 1, "column": 2 },
                "end": { "line": 1, "column": 5 }
            }
        }),
    );
}
