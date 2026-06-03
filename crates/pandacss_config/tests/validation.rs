use insta::assert_yaml_snapshot;
use pandacss_config::{UserConfig, ValidationMode, validate_config, validate_config_value};
use serde_json::json;

#[allow(
    clippy::needless_pass_by_value,
    reason = "test helper takes owned json! values"
)]
fn diagnostics(value: serde_json::Value) -> Vec<serde_json::Value> {
    validate_config_value(&value)
        .into_iter()
        .map(|diagnostic| {
            json!({
                "code": diagnostic.code,
                "message": diagnostic.message,
                "severity": diagnostic.severity,
            })
        })
        .collect()
}

#[test]
fn validates_breakpoints_conditions_tokens_and_artifact_names() {
    let diagnostics = diagnostics(json!({
        "validation": "warn",
        "theme": {
            "breakpoints": {
                "sm": "640em",
                "md": "768px"
            },
            "tokens": {
                "colors": {
                    "primary": { "value": "{colors.primary}" },
                    "missing ref": { "value": "red" },
                    "usesMissing": { "value": "{colors.missing}" },
                    "invalid": "#fff"
                }
            },
            "semanticTokens": {
                "colors": {
                    "bg": {
                        "value": {
                            "value": "{colors.primary}"
                        }
                    }
                }
            },
            "recipes": {
                "button": {}
            },
            "slotRecipes": {
                "card": {}
            }
        },
        "conditions": {
            "pinkTheme": "[data-theme=pink]"
        },
        "patterns": {
            "button": {},
            "card": {}
        }
    }));

    assert_yaml_snapshot!(diagnostics, @r#"
    - code: config_breakpoint_units_mixed
      message: "All breakpoints must use the same unit: `640em, 768px`"
      severity: warning
    - code: config_condition_selector_invalid
      message: "Selectors should contain the `&` character: `[data-theme=pink]`"
      severity: warning
    - code: config_token_key_contains_space
      message: "Token key must not contain spaces: `theme.tokens.colors.missing ref`"
      severity: warning
    - code: config_token_missing_value
      message: "Token must contain 'value': `theme.tokens.colors.invalid`"
      severity: warning
    - code: config_token_nested_value
      message: "You used `value` twice resulting in an invalid token `theme.tokens.colors.bg.value.value`"
      severity: warning
    - code: config_token_self_reference
      message: "Self token reference: `colors.primary`"
      severity: warning
    - code: config_token_circular_reference
      message: "Circular token reference: `colors.primary` -> `colors.primary` -> ... -> `colors.primary`"
      severity: warning
    - code: config_token_missing_reference
      message: "Missing token: `colors.missing` used in `theme.tokens.colors.usesMissing`"
      severity: warning
    - code: config_artifact_name_conflict
      message: "This recipe name is already used in `patterns`: `button`"
      severity: warning
    - code: config_artifact_name_conflict
      message: "This recipe name is already used in `patterns`: card"
      severity: warning
    "#);
}

#[test]
fn validation_none_skips_diagnostics() {
    let diagnostics = validate_config_value(&json!({
        "validation": "none",
        "conditions": {
            "pinkTheme": "[data-theme=pink]"
        }
    }));
    assert!(diagnostics.is_empty());
}

#[test]
fn typed_config_preserves_validation_mode() {
    let config: UserConfig = serde_json::from_value(json!({
        "validation": "error",
        "conditions": {
            "hover": "&:hover"
        }
    }))
    .expect("valid config");

    assert_eq!(config.validation, ValidationMode::Error);
    assert!(validate_config(&config).is_empty());
}

#[test]
fn reports_array_conditions_and_accepts_block_form() {
    let diagnostics = diagnostics(json!({
        "conditions": {
            "hoverFine": ["@media (hover: hover)", "&:hover"],
            "validBlock": {
                "@media (hover: hover)": {
                    "&:hover": "@slot"
                }
            }
        }
    }));

    assert_yaml_snapshot!(diagnostics, @r#"
    - code: config_condition_array_unsupported
      message: "Array conditions are not supported in v2: `conditions.hoverFine`. Use block form with `@slot` instead."
      severity: warning
    "#);
}
