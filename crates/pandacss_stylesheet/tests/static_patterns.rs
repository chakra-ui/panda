//! Wire-up smoke test: project's `static_pattern_atoms` feeds into
//! `StylesheetInput.static_pattern_atoms` and ends up in the utilities layer.
//! Unit coverage for the expansion itself lives in `pandacss_project`'s
//! `tests/static_patterns.rs`.

use crate::common::{config, project_input};
use insta::assert_snapshot;
use pandacss_config::UserConfig;
use pandacss_literal::Literal;
use pandacss_project::{Diagnostic, PatternTransformFn, Project, System};
use pandacss_stylesheet::{StylesheetInput, StylesheetLayer, StylesheetOptions};
use serde_json::json;

fn static_pattern_utilities(cfg: &UserConfig, transform: &mut PatternTransformFn<'_>) -> String {
    let mut project = Project::new(System::new(cfg.clone()).expect("project"));
    let (pattern_atoms, diagnostics) = project.static_pattern_atoms(cfg, Some(transform));
    assert!(diagnostics.is_empty(), "no expansion diagnostics expected");

    let snapshots = project.stylesheet_snapshots(cfg);
    pandacss_stylesheet::compile(
        StylesheetInput {
            static_pattern_atoms: &pattern_atoms,
            ..project_input(cfg, &snapshots)
        },
        &StylesheetOptions {
            include_static: true,
            ..Default::default()
        },
    )
    .layer_css(StylesheetLayer::Utilities)
    .expect("utilities layer present")
    .to_owned()
}

/// Stands in for a pattern `transform` that maps the `align` prop to `alignItems`.
#[allow(
    clippy::unnecessary_wraps,
    clippy::result_large_err,
    reason = "signature must match the pattern transform callback"
)]
fn align_to_align_items(_name: &str, styles: &Literal) -> Result<Option<Literal>, Diagnostic> {
    let Literal::Object(entries) = styles else {
        return Ok(Some(styles.clone()));
    };
    Ok(Some(Literal::Object(
        entries
            .iter()
            .map(|(k, v)| {
                let mapped = if k == "align" {
                    "alignItems".to_owned()
                } else {
                    k.clone()
                };
                (mapped, v.clone())
            })
            .collect(),
    )))
}

#[test]
fn a_static_css_pattern_emits_its_transformed_styles_as_utilities() {
    let cfg = config(json!({
        "utilities": {
            "alignItems": { "className": "ai" }
        },
        "patterns": {
            "stack": {
                "properties": { "align": { "type": "enum", "value": ["center"] } }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "align": ["center"] } }] }
        }
    }));

    assert_snapshot!(static_pattern_utilities(&cfg, &mut align_to_align_items), @r"
    @layer utilities {
      .ai_center {
        align-items: center;
      }
    }
    ");
}

#[test]
fn a_stack_pattern_in_static_css_emits_display_and_gap() {
    let cfg = config(json!({
        "utilities": {
            "display": { "className": "d" },
            "gap": { "className": "gap" }
        },
        "patterns": {
            "stack": {
                "properties": { "gap": { "type": "string" } },
                "defaultValues": { "gap": "8px", "direction": "column" }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "gap": ["8px"] } }] }
        }
    }));

    let mut transform = |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
        let Literal::Object(entries) = styles else {
            return Ok(Some(styles.clone()));
        };
        let gap = entries
            .iter()
            .find(|(k, _)| k == "gap")
            .map_or_else(|| Literal::String("8px".into()), |(_, v)| v.clone());
        Ok(Some(Literal::Object(vec![
            ("display".to_owned(), Literal::String("flex".to_owned())),
            ("gap".to_owned(), gap),
        ])))
    };

    assert_snapshot!(static_pattern_utilities(&cfg, &mut transform), @"
    @layer utilities {
      .gap_8px {
        gap: 8px;
      }
      .d_flex {
        display: flex;
      }
    }
    ");
}

#[test]
fn static_css_pattern_conditions_and_breakpoints_emit_as_utilities() {
    let cfg = config(json!({
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "containers": {
                "md": "32rem"
            },
            "containerNames": ["card"]
        },
        "utilities": {
            "alignItems": { "className": "ai" }
        },
        "patterns": {
            "stack": {
                "properties": { "align": { "type": "enum", "value": ["center"] } }
            }
        },
        "staticCss": {
            "patterns": {
                "stack": [
                    {
                        "properties": { "align": ["center"] },
                        "conditions": ["hover", "@card/md"],
                        "responsive": true
                    }
                ]
            }
        }
    }));

    assert_snapshot!(static_pattern_utilities(&cfg, &mut align_to_align_items), @r"
    @layer utilities {
      .ai_center, .hover\:ai_center:hover {
        align-items: center;
      }
      @media (width >= 48rem) {
        .md\:ai_center {
          align-items: center;
        }
      }
      @container card (inline-size >= 32rem) {
        .\@card\/md\:ai_center {
          align-items: center;
        }
      }
    }
    ");
}
