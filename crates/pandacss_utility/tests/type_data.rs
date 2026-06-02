use std::collections::BTreeMap;

use insta::assert_yaml_snapshot;
use pandacss_config::UtilityConfig;
use pandacss_utility::Utility;
use serde_json::{Value, json};

fn utility_config(value: Value) -> BTreeMap<String, UtilityConfig> {
    serde_json::from_value(value).expect("utility config")
}

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
        tokenCategory: ~
        literals:
          - flex
          - grid
        primitive: ~
        alias: DisplayValue
      g:
        name: g
        cssProperty: gap
        tokenCategory: spacing
        literals: []
        primitive: ~
        alias: SpacingValue
      gap:
        name: gap
        cssProperty: gap
        tokenCategory: spacing
        literals: []
        primitive: ~
        alias: SpacingValue
    shorthands:
      g: gap
    deprecated:
      - display
    aliases:
      DisplayValue:
        name: DisplayValue
        parts:
          - kind: cssProperty
            value: display
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
          - kind: cssProperty
            value: gap
          - kind: cssVars
          - kind: anyString
    classNames:
      display: display
      gap: g
    ");
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
        tokenCategory: colors
        literals: []
        primitive: ~
        alias: ColorsValue
      bg:
        name: bg
        cssProperty: backgroundColor
        tokenCategory: colors
        literals: []
        primitive: ~
        alias: ColorsValue
      bgColor:
        name: bgColor
        cssProperty: backgroundColor
        tokenCategory: colors
        literals: []
        primitive: ~
        alias: ColorsValue
      borderRadius:
        name: borderRadius
        cssProperty: borderRadius
        tokenCategory: ~
        literals: []
        primitive: ~
        alias: BorderRadiusValue
    shorthands:
      bg: backgroundColor
      bgColor: backgroundColor
    deprecated:
      - backgroundColor
      - bg
      - bgColor
    aliases:
      BorderRadiusValue:
        name: BorderRadiusValue
        parts:
          - kind: cssProperty
            value: borderRadius
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
          - kind: cssProperty
            value: backgroundColor
          - kind: cssVars
          - kind: anyString
    classNames:
      backgroundColor: bg
      borderRadius: border-radius
    ");
}
