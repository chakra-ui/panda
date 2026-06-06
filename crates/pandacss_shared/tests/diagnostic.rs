use pandacss_shared::{
    Diagnostic, DiagnosticLabel, SourceLocation, SourceRange, Span, diagnostic_codes as codes,
};
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

#[test]
fn serializes_rich_diagnostic_fields_when_present() {
    let range = SourceRange {
        start: SourceLocation { line: 2, column: 4 },
        end: SourceLocation {
            line: 2,
            column: 10,
        },
    };
    let diagnostic = Diagnostic::error(codes::JS_PARSE_ERROR, "unexpected token")
        .with_file("src/App.tsx")
        .with_category("parse")
        .with_span(Span { start: 12, end: 18 })
        .with_location(range)
        .with_label(DiagnosticLabel {
            message: Some("this expression is incomplete".to_owned()),
            span: Some(Span { start: 12, end: 18 }),
            location: Some(range),
        })
        .with_help("finish the expression");

    assert_eq!(
        serde_json::to_value(diagnostic).expect("serialize"),
        json!({
            "code": "js_parse_error",
            "message": "unexpected token",
            "severity": "error",
            "file": "src/App.tsx",
            "category": "parse",
            "span": { "start": 12, "end": 18 },
            "location": {
                "start": { "line": 2, "column": 4 },
                "end": { "line": 2, "column": 10 }
            },
            "labels": [{
                "message": "this expression is incomplete",
                "span": { "start": 12, "end": 18 },
                "location": {
                    "start": { "line": 2, "column": 4 },
                    "end": { "line": 2, "column": 10 }
                }
            }],
            "help": ["finish the expression"]
        }),
    );
}
