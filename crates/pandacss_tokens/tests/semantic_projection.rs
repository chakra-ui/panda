//! `TokenDictionary::semantic_projection`: resolved semantic-token
//! condition/theme data for design-system tooling — base + theme variants and
//! nested conditions, with `{ref}` aliases resolved to literals.

use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::{SemanticTokenEntry, TokenDictionary};
use serde_json::json;

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
