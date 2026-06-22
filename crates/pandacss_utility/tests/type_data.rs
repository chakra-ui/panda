use std::sync::Arc;

use insta::assert_yaml_snapshot;
use pandacss_config::ValueTypePart;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::json;

use crate::common::utility_config;

#[test]
fn exposes_properties_shorthands_aliases_and_deprecations() {
    let utility = Utility::from_config(&utility_config(json!({
        "gap": {
            "shorthand": "g",
            "values": "spacing"
        },
        "display": {
            "deprecated": true,
            "values": ["flex", "grid"]
        }
    })));

    assert_yaml_snapshot!(json!(utility.type_data()), @"
    properties:
      display:
        name: display
        cssProperty: display
        mappedCssProperty: ~
        tokenCategory: ~
        literals:
          - flex
          - grid
        primitive: ~
        alias: DisplayValue
      g:
        name: g
        cssProperty: gap
        mappedCssProperty: ~
        tokenCategory: spacing
        literals: []
        primitive: ~
        alias: SpacingValue
      gap:
        name: gap
        cssProperty: gap
        mappedCssProperty: ~
        tokenCategory: spacing
        literals: []
        primitive: ~
        alias: SpacingValue
    shorthands:
      g: gap
    deprecated:
      display: true
    aliases:
      DisplayValue:
        name: DisplayValue
        parts:
          - kind: literal
            value: flex
          - kind: literal
            value: grid
          - kind: cssVars
          - kind: anyString
      SpacingValue:
        name: SpacingValue
        parts:
          - kind: tokenCategory
            value: spacing
          - kind: cssVars
          - kind: anyString
    classNames:
      display: display
      gap: g
    ");
}

#[test]
fn float_with_explicit_property_includes_css_property_type_part() {
    let utility = Utility::from_config(&utility_config(json!({
        "float": {
            "values": ["start", "end"],
            "property": "float"
        }
    })));

    assert_yaml_snapshot!(json!(utility.type_data().aliases.get("FloatValue")), @"
    name: FloatValue
    parts:
      - kind: cssProperty
        value: float
      - kind: literal
        value: end
      - kind: literal
        value: start
      - kind: cssVars
      - kind: anyString
    ");
}

#[test]
fn gap_without_explicit_property_omits_css_property_type_part() {
    let utility = Utility::from_config(&utility_config(json!({
        "gap": {
            "values": "spacing"
        }
    })));

    let type_data = utility.type_data();
    let alias = type_data.aliases.get("SpacingValue").expect("alias");
    assert!(
        !alias
            .parts
            .iter()
            .any(|part| matches!(part, ValueTypePart::CssProperty(_)))
    );
}

#[test]
fn marks_deprecated_shorthands_and_fallback_class_names() {
    let utility = Utility::from_config(&utility_config(json!({
        "backgroundColor": {
            "shorthand": ["bg", "bgColor"],
            "deprecated": true,
            "values": "colors"
        },
        "borderRadius": {}
    })));

    assert_yaml_snapshot!(json!(utility.type_data()), @"
    properties:
      backgroundColor:
        name: backgroundColor
        cssProperty: backgroundColor
        mappedCssProperty: ~
        tokenCategory: colors
        literals: []
        primitive: ~
        alias: ColorsValue
      bg:
        name: bg
        cssProperty: backgroundColor
        mappedCssProperty: ~
        tokenCategory: colors
        literals: []
        primitive: ~
        alias: ColorsValue
      bgColor:
        name: bgColor
        cssProperty: backgroundColor
        mappedCssProperty: ~
        tokenCategory: colors
        literals: []
        primitive: ~
        alias: ColorsValue
      borderRadius:
        name: borderRadius
        cssProperty: borderRadius
        mappedCssProperty: ~
        tokenCategory: ~
        literals: []
        primitive: ~
        alias: BorderRadiusValue
    shorthands:
      bg: backgroundColor
      bgColor: backgroundColor
    deprecated:
      backgroundColor: true
      bg: true
      bgColor: true
    aliases:
      BorderRadiusValue:
        name: BorderRadiusValue
        parts:
          - kind: primitive
            value: string
          - kind: primitive
            value: number
          - kind: cssVars
          - kind: anyString
      ColorsValue:
        name: ColorsValue
        parts:
          - kind: tokenCategory
            value: colors
          - kind: cssVars
          - kind: anyString
    classNames:
      backgroundColor: bg
      borderRadius: border-radius
    ");
}

#[test]
fn collapses_resolved_theme_category_keys_for_typegen() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "marginBottom": {
                "values": {
                    "sm": "var(--spacing-sm)",
                    "md": "var(--spacing-md)",
                    "auto": "auto"
                }
            },
            "width": {
                "values": {
                    "2": "var(--sizes-2)",
                    "4": "var(--sizes-4)",
                    "1/2": "50%",
                    "full": "100%"
                }
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(
                TokenDictionary::builder()
                    .insert(Token::new(
                        "sizes.2",
                        "0.5rem",
                        "var(--sizes-2)",
                        TokenCategory::Sizes,
                    ))
                    .insert(Token::new(
                        "sizes.4",
                        "1rem",
                        "var(--sizes-4)",
                        TokenCategory::Sizes,
                    ))
                    .insert(Token::new(
                        "spacing.sm",
                        "0.5rem",
                        "var(--spacing-sm)",
                        TokenCategory::Spacing,
                    ))
                    .insert(Token::new(
                        "spacing.md",
                        "1rem",
                        "var(--spacing-md)",
                        TokenCategory::Spacing,
                    ))
                    .build(),
            )),
            ..UtilityOptions::default()
        },
    );

    let type_data = utility.type_data();
    let margin = type_data.properties.get("marginBottom").expect("margin");
    assert_eq!(margin.token_category.as_deref(), Some("spacing"));
    assert_eq!(margin.literals, ["auto"]);
    assert_eq!(margin.alias, "SpacingValue");

    let width = type_data.properties.get("width").expect("width");
    assert_eq!(width.token_category.as_deref(), Some("sizes"));
    assert_eq!(width.literals, ["1/2", "full"]);
    assert_eq!(width.alias, "WidthValue");

    let spacing_alias = type_data
        .aliases
        .get("SpacingValue")
        .expect("spacing alias");
    assert!(
        spacing_alias.parts.iter().any(|part| {
            matches!(part, ValueTypePart::TokenCategory(value) if value == "spacing")
        })
    );

    let width_alias = type_data.aliases.get("WidthValue").expect("width alias");
    assert!(
        width_alias.parts.iter().any(|part| {
            matches!(part, ValueTypePart::TokenCategory(value) if value == "sizes")
        })
    );
    assert!(
        width_alias
            .parts
            .iter()
            .any(|part| { matches!(part, ValueTypePart::Literal(value) if value == "1/2") })
    );
}

#[test]
fn collapses_resolved_gradient_category_keys_for_typegen() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "backgroundGradient": {
                "values": {
                    "primary": "var(--gradients-primary)",
                    "to-r": "linear-gradient(var(--gradient-stops))"
                }
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(
                TokenDictionary::builder()
                    .insert(Token::new(
                        "gradients.primary",
                        "linear-gradient(to right, red, blue)",
                        "var(--gradients-primary)",
                        TokenCategory::Gradients,
                    ))
                    .build(),
            )),
            ..UtilityOptions::default()
        },
    );

    let type_data = utility.type_data();
    let gradient = type_data
        .properties
        .get("backgroundGradient")
        .expect("gradient");
    assert_eq!(gradient.token_category.as_deref(), Some("gradients"));
    assert_eq!(gradient.literals, ["to-r"]);
    assert_eq!(gradient.alias, "BackgroundGradientValue");
}
