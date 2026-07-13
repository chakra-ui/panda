use pandacss_tracing::{SlowestInstance, SpanStat, render_timings_json};

#[test]
fn renders_totals_and_slowest_instances() {
    let json = render_timings_json(&[SpanStat {
        name: "extraction",
        total_nanos: 4_000_000,
        count: 2,
        slowest: vec![
            SlowestInstance {
                label: "src/BigFile.tsx".to_owned(),
                nanos: 3_000_000,
            },
            SlowestInstance {
                label: "src/Small.tsx".to_owned(),
                nanos: 1_000_000,
            },
        ],
    }]);

    insta::assert_snapshot!(json, @r#"
    {
      "totalSpans": 2,
      "totalTimeMs": 4.0,
      "spans": [
        {
          "name": "extraction",
          "count": 2,
          "totalMs": 4.0,
          "slowest": [
            {
              "label": "src/BigFile.tsx",
              "ms": 3.0
            },
            {
              "label": "src/Small.tsx",
              "ms": 1.0
            }
          ]
        }
      ]
    }
    "#);
}

#[test]
fn renders_empty_report_for_no_spans() {
    let json = render_timings_json(&[]);

    insta::assert_snapshot!(json, @r#"
    {
      "totalSpans": 0,
      "totalTimeMs": 0.0,
      "spans": []
    }
    "#);
}
