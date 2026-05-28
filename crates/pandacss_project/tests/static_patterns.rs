mod common;

use common::create_config;
use insta::assert_snapshot;
use pandacss_encoder::{Atom, AtomValue};
use pandacss_extractor::Literal;
use pandacss_project::{Diagnostic, Project};
use serde_json::json;

fn build(overrides: serde_json::Value) -> (Project, pandacss_config::UserConfig) {
    let config = create_config(overrides);
    let project = Project::from_config(config.clone()).expect("project");
    (project, config)
}

fn summary(atoms: &[Atom], diagnostics: &[Diagnostic]) -> String {
    let mut atom_lines: Vec<String> = atoms.iter().map(format_atom).collect();
    atom_lines.sort();
    let diag_lines: Vec<String> = diagnostics
        .iter()
        .map(|d| format!("- {:?} {}", d.severity, d.code))
        .collect();
    let mut out = String::new();
    out.push_str("atoms:\n");
    for line in &atom_lines {
        out.push_str("  ");
        out.push_str(line);
        out.push('\n');
    }
    out.push_str("diagnostics:\n");
    for line in &diag_lines {
        out.push_str("  ");
        out.push_str(line);
        out.push('\n');
    }
    out
}

fn format_atom(atom: &Atom) -> String {
    let value = match atom.value() {
        AtomValue::String(s) | AtomValue::Number(s) => s.to_string(),
        AtomValue::Bool(true) => "true".to_owned(),
        AtomValue::Bool(false) => "false".to_owned(),
        AtomValue::Null => "null".to_owned(),
    };
    let conditions = atom
        .conditions()
        .iter()
        .map(|c| format!(" @{}", c.as_ref()))
        .collect::<String>();
    format!("{}: {value}{conditions}", atom.prop())
}

fn shorthand_to_css(_name: &str, styles: &Literal) -> Result<Option<Literal>, Diagnostic> {
    let Literal::Object(entries) = styles else {
        return Ok(Some(styles.clone()));
    };
    let mapped = entries
        .iter()
        .map(|(key, value)| {
            let mapped_key = match key.as_str() {
                "align" => "alignItems".to_owned(),
                "justify" => "justifyContent".to_owned(),
                "direction" => "flexDirection".to_owned(),
                _ => key.clone(),
            };
            (mapped_key, value.clone())
        })
        .collect();
    Ok(Some(Literal::Object(mapped)))
}

#[test]
fn no_static_patterns_section_produces_nothing() {
    let (project, config) = build(json!({
        "patterns": {
            "stack": { "properties": { "gap": { "type": "token", "value": "spacing" } } }
        }
    }));
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, None);
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
    diagnostics:
    ");
}

#[test]
fn unknown_pattern_name_emits_warning() {
    let (project, config) = build(json!({
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "gap": ["4"] } }] }
        }
    }));
    let mut transform = shorthand_to_css;
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, Some(&mut transform));
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
    diagnostics:
      - Warning static_css_pattern_unknown
    ");
}

#[test]
fn pattern_with_transform_but_no_callback_skips_with_warning() {
    let (project, config) = build(json!({
        "patterns": {
            "stack": {
                "properties": { "gap": { "type": "token", "value": "spacing" } },
                "transform": { "kind": "js-callback", "id": "stack" }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "gap": ["4"] } }] }
        }
    }));
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, None);
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
    diagnostics:
      - Warning static_css_pattern_missing_transform
    ");
}

#[test]
fn explicit_values_emit_one_atom_per_value() {
    let (project, config) = build(json!({
        "patterns": {
            "stack": {
                "properties": { "align": { "type": "enum", "value": ["center", "flex-end"] } }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "align": ["center", "flex-end"] } }] }
        }
    }));
    let mut transform = shorthand_to_css;
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, Some(&mut transform));
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
      alignItems: center
      alignItems: flex-end
    diagnostics:
    ");
}

#[test]
fn per_property_wildcard_expands_to_every_enum_value() {
    let (project, config) = build(json!({
        "patterns": {
            "stack": {
                "properties": {
                    "align": { "type": "enum", "value": ["flex-start", "center", "flex-end"] }
                }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "align": ["*"] } }] }
        }
    }));
    let mut transform = shorthand_to_css;
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, Some(&mut transform));
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
      alignItems: center
      alignItems: flex-end
      alignItems: flex-start
    diagnostics:
    ");
}

#[test]
fn per_property_wildcard_expands_token_category_values() {
    let (project, config) = build(json!({
        "theme": {
            "tokens": {
                "spacing": {
                    "4": { "value": "1rem" },
                    "8": { "value": "2rem" }
                }
            }
        },
        "patterns": {
            "stack": {
                "properties": { "gap": { "type": "token", "value": "spacing" } }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "gap": ["*"] } }] }
        }
    }));
    let mut transform = shorthand_to_css;
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, Some(&mut transform));
    // Panda auto-generates negative spacing tokens; wildcard picks them up.
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
      gap: -4
      gap: -8
      gap: 4
      gap: 8
    diagnostics:
    ");
}

#[test]
fn whole_rule_wildcard_expands_every_property() {
    let (project, config) = build(json!({
        "patterns": {
            "stack": {
                "properties": {
                    "align":     { "type": "enum", "value": ["center"] },
                    "direction": { "type": "enum", "value": ["row", "column"] },
                    "inline":    { "type": "boolean" }
                }
            }
        },
        "staticCss": {
            "patterns": { "stack": ["*"] }
        }
    }));
    let mut transform = shorthand_to_css;
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, Some(&mut transform));
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
      alignItems: center
      flexDirection: column
      flexDirection: row
      inline: false
      inline: true
    diagnostics:
    ");
}

#[test]
fn responsive_rule_adds_breakpoint_conditions() {
    let (project, config) = build(json!({
        "theme": { "breakpoints": { "sm": "40rem", "md": "48rem" } },
        "patterns": {
            "stack": {
                "properties": { "align": { "type": "enum", "value": ["center"] } }
            }
        },
        "staticCss": {
            "patterns": {
                "stack": [{ "properties": { "align": ["center"] }, "responsive": true }]
            }
        }
    }));
    let mut transform = shorthand_to_css;
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, Some(&mut transform));
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
      alignItems: center
      alignItems: center @md
      alignItems: center @sm
    diagnostics:
    ");
}

#[test]
fn conditions_list_adds_named_conditions_per_value() {
    let (project, config) = build(json!({
        "conditions": { "hover": "&:hover" },
        "patterns": {
            "stack": {
                "properties": { "align": { "type": "enum", "value": ["center"] } }
            }
        },
        "staticCss": {
            "patterns": {
                "stack": [{ "properties": { "align": ["center"] }, "conditions": ["hover"] }]
            }
        }
    }));
    let mut transform = shorthand_to_css;
    let (atoms, diagnostics) = project.static_pattern_atoms(&config, Some(&mut transform));
    assert_snapshot!(summary(&atoms, &diagnostics), @r"
    atoms:
      alignItems: center
      alignItems: center @_hover
    diagnostics:
    ");
}

#[test]
fn default_values_are_merged_before_transform_runs() {
    let captured: std::rc::Rc<std::cell::RefCell<Option<Literal>>> =
        std::rc::Rc::new(std::cell::RefCell::new(None));
    let captured_clone = captured.clone();
    let mut transform =
        move |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
            *captured_clone.borrow_mut() = Some(styles.clone());
            Ok(Some(styles.clone()))
        };
    let (project, config) = build(json!({
        "patterns": {
            "stack": {
                "properties": { "align": { "type": "enum", "value": ["center"] } },
                "defaultValues": { "gap": "4" }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "align": ["center"] } }] }
        }
    }));
    let (_atoms, _diagnostics) =
        project.static_pattern_atoms(&config, Some(&mut transform));
    let captured = captured.borrow().clone().expect("transform was invoked");
    assert_snapshot!(format!("{captured:?}"), @r#"Object([("gap", String("4")), ("align", String("center"))])"#);
}
