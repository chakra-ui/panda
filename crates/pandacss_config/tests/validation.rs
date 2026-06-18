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

#[test]
fn reports_invalid_utility_value_maps() {
    let diagnostics = diagnostics(json!({
        "validation": "warn",
        "utilities": {
            "hideFrom": {
                "className": "hide",
                "values": {
                    "sm": { "@breakpoint sm": { "display": "none" } },
                    "lg": ["display", "none"],
                    "none": null,
                    "ok": "1rem",
                    "num": 1,
                    "bool": true
                }
            },
            "truncate": {
                "className": "trunc",
                "values": { "type": "boolean" }
            },
            "dynamic": {
                "className": "dyn",
                "values": { "kind": "js-callback", "id": "utilities.dynamic.values" }
            }
        }
    }));

    assert_yaml_snapshot!(diagnostics, @r#"
    - code: config_utility_values_invalid
      message: "`utilities.hideFrom.values` contains invalid entries: `lg`, `none`, `sm`. Each value must be a string, number, or boolean. Return style objects from `utilities.hideFrom.transform` instead."
      severity: warning
    "#);
}

#[test]
fn reports_invalid_utility_value_maps_per_utility() {
    let diagnostics = diagnostics(json!({
        "validation": "warn",
        "utilities": {
            "hideFrom": {
                "className": "hide",
                "values": {
                    "sm": { "@breakpoint sm": { "display": "none" } }
                }
            },
            "showFrom": {
                "className": "show",
                "values": {
                    "lg": ["display", "block"]
                }
            }
        }
    }));

    assert_yaml_snapshot!(diagnostics, @r#"
    - code: config_utility_values_invalid
      message: "`utilities.hideFrom.values` contains invalid entries: `sm`. Each value must be a string, number, or boolean. Return style objects from `utilities.hideFrom.transform` instead."
      severity: warning
    - code: config_utility_values_invalid
      message: "`utilities.showFrom.values` contains invalid entries: `lg`. Each value must be a string, number, or boolean. Return style objects from `utilities.showFrom.transform` instead."
      severity: warning
    "#);
}

#[test]
fn reports_invalid_container_configuration() {
    let diagnostics = diagnostics(json!({
        "theme": {
            "containerNames": ["bad/name", 4],
            "containers": {
                "bad/name": "20rem",
                "sm": "20rem",
                "md": false,
                "lg": "48em"
            }
        }
    }));

    assert_yaml_snapshot!(diagnostics, @r#"
    - code: config_container_name_invalid
      message: "Container name must be a valid CSS identifier segment: `bad/name`"
      severity: warning
    - code: config_container_name_invalid
      message: "`theme.containerNames` entries must be strings"
      severity: warning
    - code: config_container_invalid
      message: "`theme.containers.md` must be a string size"
      severity: warning
    - code: config_container_name_invalid
      message: "Container size key must be a valid condition segment: `theme.containers.bad/name`"
      severity: warning
    - code: config_container_units_mixed
      message: "All container sizes in `theme.containers` must use the same unit: `20rem, 48em`"
      severity: warning
    "#);
}
