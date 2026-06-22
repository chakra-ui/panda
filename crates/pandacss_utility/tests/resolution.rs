use std::sync::Arc;

use insta::{assert_debug_snapshot, assert_snapshot};
use pandacss_extractor::Literal;
use pandacss_shared::to_hash;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::json;

use crate::common::utility_config;

#[test]
fn resolve_values_value_maps_a_string_category_to_a_token_var() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "spacing.4",
            "1rem",
            "var(--spacing-4)",
            TokenCategory::Spacing,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "spaceX": { "values": "spacing" }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    // Node passes this resolved value as the positional argument to the
    // transform callback (`getPropertyRawValue` of the `spacing` category).
    assert_snapshot!(utility.resolve_values_value("spaceX", "4"), @"var(--spacing-4)");
}

#[test]
fn resolve_values_value_maps_an_inline_value_alias() {
    let utility = Utility::from_config(&utility_config(json!({
        "marginX": { "values": { "sm": "20px", "md": "40px" } }
    })));

    assert_snapshot!(utility.resolve_values_value("marginX", "sm"), @"20px");
}

#[test]
fn resolve_values_value_passes_through_when_no_category_matches() {
    let utility = Utility::from_config(&utility_config(json!({
        "size": {}
    })));

    // No `values` category — the original value reaches the transform verbatim.
    assert_snapshot!(utility.resolve_values_value("size", "4px"), @"4px");
}

#[test]
fn class_name_value_uses_authored_literal() {
    let utility = Utility::from_config(&utility_config(json!({
        "marginBottom": {
            "className": "mb",
            "values": { "2": "0.5rem", "4": "1rem" }
        }
    })));

    assert_eq!(utility.class_name_value("2"), "2");
    assert_eq!(utility.class_name_value("0.5rem"), "0.5rem");
    assert_eq!(utility.class_name_value("0 auto "), "0_auto");
    assert_eq!(utility.class_name_value(" 0.5rem"), "0.5rem");
    assert_eq!(
        utility
            .value_alias_for_literal("marginBottom", "0.5rem")
            .as_deref(),
        Some("2"),
    );
    assert_snapshot!(
        utility.transform_str("marginBottom", "0.5rem").class_name,
        @"mb_0.5rem"
    );
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "one fixture keeps related resolver cases together"
)]
fn resolve_utility_value_describes_class_and_css_value() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#f00",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();

    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "color": {
                "className": "c",
                "values": "colors"
            },
            "marginBottom": {
                "className": "mb",
                "shorthand": "mb",
                "values": {
                    "2": "0.5rem",
                    "space": "0.5rem",
                    "4": "1rem"
                }
            },
            "width": {
                "className": "w"
            },
            "zIndex": {
                "className": "z"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let value_map_key = utility
        .resolve_utility_value("mb", &Literal::String("2".into()))
        .expect("value map key");
    let literal_with_aliases = utility
        .resolve_utility_value("marginBottom", &Literal::String("0.5rem".into()))
        .expect("literal with aliases");
    let arbitrary = utility
        .resolve_utility_value("width", &Literal::String("[calc(100% - 1rem)]".into()))
        .expect("arbitrary value");
    let arbitrary_important = utility
        .resolve_utility_value("width", &Literal::String("[4px] !important".into()))
        .expect("important arbitrary value");
    let token_reference = utility
        .resolve_utility_value("color", &Literal::String("{colors.red.500}".into()))
        .expect("token reference");
    let important = utility
        .resolve_utility_value("zIndex", &Literal::String("1002 !important".into()))
        .expect("important value");

    assert_debug_snapshot!(
        (
            value_map_key,
            literal_with_aliases,
            arbitrary,
            arbitrary_important,
            token_reference,
            important,
        ),
        @r#"
    (
        ResolvedUtilityValue {
            utility: "marginBottom",
            class_name: "mb_2",
            css_value: String(
                "0.5rem",
            ),
            important: false,
            source: ValueMap {
                key: "2",
                aliases: [
                    "space",
                ],
            },
        },
        ResolvedUtilityValue {
            utility: "marginBottom",
            class_name: "mb_0.5rem",
            css_value: String(
                "0.5rem",
            ),
            important: false,
            source: Literal {
                aliases: [
                    "2",
                    "space",
                ],
            },
        },
        ResolvedUtilityValue {
            utility: "width",
            class_name: "w_[calc(100%_-_1rem)]",
            css_value: String(
                "calc(100% - 1rem)",
            ),
            important: false,
            source: Arbitrary,
        },
        ResolvedUtilityValue {
            utility: "width",
            class_name: "w_[4px]!",
            css_value: String(
                "4px",
            ),
            important: true,
            source: Arbitrary,
        },
        ResolvedUtilityValue {
            utility: "color",
            class_name: "c_{colors.red.500}",
            css_value: String(
                "var(--colors-red-500)",
            ),
            important: false,
            source: TokenReference,
        },
        ResolvedUtilityValue {
            utility: "zIndex",
            class_name: "z_1002!",
            css_value: String(
                "1002",
            ),
            important: true,
            source: Literal {
                aliases: [],
            },
        },
    )
    "#,
    );
}

#[test]
fn resolve_utility_value_formats_class_prefix_and_separator() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "opacity": {
                "className": "op"
            }
        })),
        UtilityOptions {
            separator: Some("__".into()),
            prefix: Some("pd".into()),
            ..UtilityOptions::default()
        },
    );

    let resolved = utility
        .resolve_utility_value("opacity", &Literal::Number(0.5))
        .expect("resolved utility value");

    assert_eq!(resolved.class_name, "pd-op__0.5");
    assert_eq!(resolved.css_value, Literal::String("0.5".into()));
}

#[test]
fn resolve_utility_value_hashes_class_names_when_enabled() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "opacity": {
                "className": "op"
            }
        })),
        UtilityOptions {
            prefix: Some("pd".into()),
            hash_class_names: true,
            ..UtilityOptions::default()
        },
    );

    let resolved = utility
        .resolve_utility_value("opacity", &Literal::Number(0.5))
        .expect("resolved utility value");

    assert_eq!(resolved.class_name, format!("pd-{}", to_hash("op_0.5")));
}

#[test]
fn resolve_utility_value_rejects_non_scalar_values() {
    let utility = Utility::from_config(&utility_config(json!({
        "hideFrom": {
            "className": "hide",
            "values": {
                "sm": {
                    "@breakpoint sm": {
                        "display": "none"
                    }
                }
            }
        },
        "width": {
            "className": "w"
        }
    })));

    assert!(
        utility
            .resolve_utility_value("width", &Literal::Null)
            .is_none()
    );
    assert!(
        utility
            .resolve_utility_value(
                "width",
                &Literal::Array(vec![Literal::String("4px".into())])
            )
            .is_none()
    );
    assert!(
        utility
            .resolve_utility_value("hideFrom", &Literal::String("sm".into()))
            .is_none()
    );
}

#[test]
fn transform_str_emits_custom_property_target_from_serialized_property() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.border.muted",
            "#ccc",
            "var(--colors-border-muted)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "boxShadowColor": {
                "className": "bx-sh-c",
                "shorthand": "shadowColor",
                "values": "colors",
                "property": "--shadow-color",
                "transform": {
                    "kind": "js-callback",
                    "id": "utilities.boxShadowColor.transform"
                }
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    assert_debug_snapshot!(
        utility.transform_str("shadowColor", "border.muted").styles,
        @r#"
    Object(
        [
            (
                "--shadow-color",
                String(
                    "var(--colors-border-muted)",
                ),
            ),
        ],
    )
    "#);
}

#[test]
fn transform_str_does_not_reconstruct_color_mix_transform_callbacks() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.300",
            "#fca5a5",
            "var(--colors-red-300)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "boxShadowColor": {
                "className": "bx-sh-c",
                "values": "colors",
                "property": "--shadow-color",
                "transform": {
                    "kind": "js-callback",
                    "id": "utilities.boxShadowColor.transform"
                }
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    // The JS callback path and pure Rust config emission both write color
    // opacity modifiers directly to the serialized target property.
    assert_debug_snapshot!(
        utility.transform_str("boxShadowColor", "red.300/40").styles,
        @r#"
    Object(
        [
            (
                "--shadow-color",
                String(
                    "color-mix(in oklab, var(--colors-red-300) 40%, transparent)",
                ),
            ),
        ],
    )
    "#);
}
