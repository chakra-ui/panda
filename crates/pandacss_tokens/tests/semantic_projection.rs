//! `TokenDictionary::semantic_projection`: resolved semantic-token
//! condition/theme data for design-system tooling — base + theme variants and
//! nested conditions, with `{ref}` aliases resolved to literals.

use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::{SemanticTokenEntry, TokenDictionary};
use serde_json::json;

fn config_from(value: serde_json::Value) -> UserConfig {
    serde_json::from_value(value).expect("config")
}

fn dictionary(config: &UserConfig) -> TokenDictionary {
    TokenDictionary::from_config(config)
        .expect("token dictionary")
        .expect("non-empty dictionary")
}

fn base_value<'a>(entries: &'a [SemanticTokenEntry], path: &str) -> &'a str {
    let entry = entries
        .iter()
        .find(|entry| entry.path == path)
        .expect("path present");
    let condition = entry
        .conditions
        .iter()
        .find(|condition| condition.theme.is_none() && condition.condition == "base")
        .expect("base condition present");
    &condition.value
}

fn snapshot_projection(entries: &[SemanticTokenEntry]) -> Vec<serde_json::Value> {
    entries
        .iter()
        .map(|entry| {
            json!({
                "path": entry.path,
                "conditions": entry
                    .conditions
                    .iter()
                    .map(|condition| json!({
                        "theme": condition.theme,
                        "condition": condition.condition,
                        "value": condition.value,
                    }))
                    .collect::<Vec<_>>(),
            })
        })
        .collect()
}

#[test]
fn projects_base_and_theme_variants() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "white": { "value": "#fff" },
                    "black": { "value": "#000" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "bg": {
                        "value": { "base": "{colors.white}", "_dark": "{colors.black}" }
                    }
                }
            }
        },
        "themes": {
            "ocean": {
                "semanticTokens": {
                    "colors": {
                        "bg": { "value": { "base": "#e0f2fe" } }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_projection(&dict.semantic_projection(&config)), @r###"
    - path: colors.bg
      conditions:
        - theme: ~
          condition: base
          value: "#fff"
        - theme: ~
          condition: _dark
          value: "#000"
        - theme: ocean
          condition: base
          value: "#e0f2fe"
    "###);
}

#[test]
fn projects_nested_conditions() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "white": { "value": "#fff" },
                    "black": { "value": "#000" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "brand": {
                        "value": {
                            "base": "{colors.white}",
                            "_dark": { "base": "{colors.black}", "_sunset": "{colors.white}" }
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_projection(&dict.semantic_projection(&config)), @r###"
    - path: colors.brand
      conditions:
        - theme: ~
          condition: base
          value: "#fff"
        - theme: ~
          condition: "_dark:base"
          value: "#000"
        - theme: ~
          condition: "_dark:_sunset"
          value: "#fff"
    "###);
}

#[test]
fn keeps_literal_and_unresolved_ref_values_verbatim() {
    let config = config_from(json!({
        "theme": {
            "tokens": { "colors": { "white": { "value": "#fff" } } },
            "semanticTokens": {
                "colors": {
                    "solid": { "value": "salmon" },
                    "missing": { "value": "{colors.nope}" }
                }
            }
        }
    }));
    let entries = dictionary(&config).semantic_projection(&config);
    assert_eq!(base_value(&entries, "colors.solid"), "salmon");
    assert_eq!(base_value(&entries, "colors.missing"), "{colors.nope}");
}

#[test]
fn empty_when_config_has_no_semantic_tokens() {
    let config = config_from(json!({
        "theme": { "tokens": { "colors": { "white": { "value": "#fff" } } } }
    }));
    assert!(dictionary(&config).semantic_projection(&config).is_empty());
}

#[test]
fn recovers_original_theme_name_across_capitalization() {
    let config = config_from(json!({
        "themes": {
            "Ocean": { "semanticTokens": { "colors": { "bg": { "value": { "base": "#001" } } } } },
            "highContrast": { "semanticTokens": { "colors": { "bg": { "value": { "base": "#002" } } } } }
        }
    }));
    let entries = dictionary(&config).semantic_projection(&config);
    let bg = entries
        .iter()
        .find(|entry| entry.path == "colors.bg")
        .expect("colors.bg present");
    let theme_value = |theme: &str| {
        bg.conditions
            .iter()
            .find(|condition| condition.theme.as_deref() == Some(theme))
            .map(|condition| condition.value.as_str())
    };
    assert_eq!(theme_value("Ocean"), Some("#001"));
    assert_eq!(theme_value("highContrast"), Some("#002"));
}

#[test]
fn excludes_core_primitive_sharing_a_semantic_path() {
    let config = config_from(json!({
        "theme": {
            "tokens": { "colors": { "brand": { "value": "#111" }, "black": { "value": "#000" } } },
            "semanticTokens": { "colors": { "brand": { "value": { "_dark": "{colors.black}" } } } }
        }
    }));
    let entries = dictionary(&config).semantic_projection(&config);
    let brand = entries
        .iter()
        .find(|entry| entry.path == "colors.brand")
        .expect("colors.brand present");
    assert_eq!(brand.conditions.len(), 1);
    assert_eq!(brand.conditions[0].condition, "_dark");
    assert_eq!(brand.conditions[0].value, "#000");
    assert!(
        !brand
            .conditions
            .iter()
            .any(|condition| condition.value == "#111"),
        "core primitive #111 leaked into the semantic projection"
    );
}

#[test]
fn excludes_negative_tokens_derived_from_semantic_spacing() {
    let config = config_from(json!({
        "theme": {
            "tokens": { "spacing": { "sm": { "value": "1rem" } } },
            "semanticTokens": { "spacing": { "gutter": { "value": "{spacing.sm}" } } }
        }
    }));
    let entries = dictionary(&config).semantic_projection(&config);
    let paths: Vec<&str> = entries.iter().map(|entry| entry.path.as_str()).collect();
    assert!(
        paths.contains(&"spacing.gutter"),
        "declared semantic token missing"
    );
    assert!(
        !paths.contains(&"spacing.-gutter"),
        "derived negative token leaked into the semantic projection"
    );
}
