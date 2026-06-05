//! Wire-up smoke test: project's `static_pattern_atoms` feeds into
//! `StylesheetInput.static_pattern_atoms` and ends up in the utilities layer.
//! Unit coverage for the expansion itself lives in `pandacss_project`'s
//! `tests/static_patterns.rs`.

use crate::common::config;
use insta::assert_snapshot;
use pandacss_extractor::Literal;
use pandacss_project::{Diagnostic, Project, System};
use pandacss_stylesheet::{StylesheetInput, StylesheetLayer, StylesheetOptions};
use serde_json::json;

#[test]
fn static_pattern_atoms_flow_into_utilities_layer() {
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

    let mut transform = |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
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
    };

    let system = System::new(cfg.clone()).expect("project");
    let mut project = Project::new(system);
    let (pattern_atoms, diagnostics) = project.static_pattern_atoms(&cfg, Some(&mut transform));
    assert!(diagnostics.is_empty(), "no expansion diagnostics expected");

    let snapshots = project.stylesheet_snapshots(&cfg);
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &StylesheetOptions {
            include_static: true,
            ..Default::default()
        },
    );

    let utilities = output
        .layer_css(StylesheetLayer::Utilities)
        .expect("utilities layer present");
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .ai_center {
        align-items: center;
      }
    }
    ");
}

#[test]
fn stack_like_transform_emits_display_and_gap_utilities() {
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
            .map(|(_, v)| v.clone())
            .unwrap_or_else(|| Literal::String("8px".into()));
        Ok(Some(Literal::Object(vec![
            ("display".to_owned(), Literal::String("flex".to_owned())),
            ("gap".to_owned(), gap),
        ])))
    };

    let system = System::new(cfg.clone()).expect("project");
    let mut project = Project::new(system);
    let (pattern_atoms, diagnostics) = project.static_pattern_atoms(&cfg, Some(&mut transform));
    assert!(diagnostics.is_empty());

    let snapshots = project.stylesheet_snapshots(&cfg);
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &StylesheetOptions {
            include_static: true,
            ..Default::default()
        },
    );

    let utilities = output
        .layer_css(StylesheetLayer::Utilities)
        .expect("utilities layer present");
    assert_snapshot!(utilities, @"
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
fn static_pattern_conditions_and_responsive_flow_into_utilities_layer() {
    let cfg = config(json!({
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            }
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
                        "conditions": ["hover"],
                        "responsive": true
                    }
                ]
            }
        }
    }));

    let mut transform = |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
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
    };

    let system = System::new(cfg.clone()).expect("project");
    let mut project = Project::new(system);
    let (pattern_atoms, diagnostics) = project.static_pattern_atoms(&cfg, Some(&mut transform));
    assert!(diagnostics.is_empty(), "no expansion diagnostics expected");

    let snapshots = project.stylesheet_snapshots(&cfg);
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &StylesheetOptions {
            include_static: true,
            ..Default::default()
        },
    );

    let utilities = output
        .layer_css(StylesheetLayer::Utilities)
        .expect("utilities layer present");
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .ai_center {
        align-items: center;
      }
      .hover\:ai_center:hover {
        align-items: center;
      }
      @media (width >= 48rem) {
        .md\:ai_center {
          align-items: center;
        }
      }
    }
    ");
}
