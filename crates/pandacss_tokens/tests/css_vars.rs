//! `css_vars` view: base vs conditional grouping, theme-prefix handling, and
//! expanded reference / color-mix values.

use crate::common::t;
use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use serde_json::json;

#[test]
fn css_vars_view_groups_emittable_token_vars() {
    let mut negative = t(
        "spacing.-2",
        "calc(var(--spacing-2) * -1)",
        "",
        TokenCategory::Spacing,
    )
    .with_condition("_dark");
    negative.set_extension("isNegative", "true");
    let mut virtual_token = t(
        "colors.colorPalette",
        "colors.colorPalette",
        "var(--colors-color-palette)",
        TokenCategory::Colors,
    );
    virtual_token.set_extension("isVirtual", "true");

    let dict = TokenDictionary::builder()
        .insert(t(
            "colors.red",
            "#f00",
            "var(--colors-red)",
            TokenCategory::Colors,
        ))
        .insert(
            t(
                "colors.fg",
                "var(--colors-red)",
                "var(--colors-fg)",
                TokenCategory::Colors,
            )
            .with_condition("_dark"),
        )
        .insert(
            t(
                "colors.fg",
                "#000",
                "var(--colors-fg)",
                TokenCategory::Colors,
            )
            .with_condition("_themeDark"),
        )
        .insert(negative)
        .insert(virtual_token)
        .build();

    assert_yaml_snapshot!(snapshot_css_vars(&dict), @r##"
    base:
      - name: "--colors-red"
        value: "#f00"
    conditions:
      - condition: _dark
        vars:
          - name: "--colors-fg"
            value: var(--colors-red)
    "##);
}

#[test]
fn css_vars_view_does_not_skip_user_conditions_with_theme_prefix() {
    let dict = TokenDictionary::builder()
        .insert(
            t(
                "colors.fg",
                "#111",
                "var(--colors-fg)",
                TokenCategory::Colors,
            )
            .with_condition("_themeify"),
        )
        .build();

    assert_yaml_snapshot!(snapshot_css_vars(&dict), @r##"
    base: []
    conditions:
      - condition: _themeify
        vars:
          - name: "--colors-fg"
            value: "#111"
    "##);
}

#[test]
fn css_vars_view_uses_expanded_reference_and_color_mix_values() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "pink": { "value": "#ff00ff" },
                    "border": { "value": "{colors.pink/30}" }
                },
                "opacity": {
                    "half": { "value": 0.5 }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.pink}",
                            "_dark": "{colors.border/half}"
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

    assert_yaml_snapshot!(snapshot_css_vars(&dict), @r##"
    base:
      - name: "--opacity-half"
        value: "0.5"
      - name: "--colors-pink"
        value: "#ff00ff"
      - name: "--colors-border"
        value: "color-mix(in oklab, var(--colors-pink) 30%, transparent)"
      - name: "--colors-fg"
        value: var(--colors-pink)
    conditions:
      - condition: _dark
        vars:
          - name: "--colors-fg"
            value: "color-mix(in oklab, var(--colors-border) 50%, transparent)"
    "##);
}

fn snapshot_css_vars(dict: &TokenDictionary) -> serde_json::Value {
    let vars = dict.css_vars();
    json!({
        "base": vars
            .base
            .iter()
            .map(|var| json!({ "name": var.name, "value": var.value }))
            .collect::<Vec<_>>(),
        "conditions": vars
            .conditions
            .iter()
            .map(|group| {
                json!({
                    "condition": group.condition,
                    "vars": group
                        .vars
                        .iter()
                        .map(|var| json!({ "name": var.name, "value": var.value }))
                        .collect::<Vec<_>>(),
                })
            })
            .collect::<Vec<_>>(),
    })
}
