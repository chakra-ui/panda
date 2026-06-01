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
