use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use serde_json::json;

#[test]
fn config_exposes_typegen_options_conditions_and_patterns() {
    let config: UserConfig = serde_json::from_value(json!({
        "strictTokens": true,
        "strictPropertyValues": true,
        "jsxStyleProps": "minimal",
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "sm": "640px"
            },
            "containers": {
                "sm": "20rem"
            },
            "containerNames": ["card"]
        },
        "patterns": {
            "stack": {
                "strict": true,
                "blocklist": ["color"],
                "properties": {
                    "gap": { "type": "token", "value": "spacing", "property": "gap", "description": "Gap" },
                    "direction": { "type": "enum", "value": ["row", "column"] },
                    "align": { "property": "alignItems" }
                }
            }
        }
    }))
    .expect("config should deserialize");

    assert_yaml_snapshot!(json!({
        "options": config.typegen_options(),
        "conditions": config.condition_type_data(),
        "patterns": config.pattern_type_data(),
    }), @r#"
    options:
      strictTokens: true
      strictPropertyValues: true
      jsxStyleProps: minimal
    conditions:
      keys:
        - "@/sm"
        - "@/smDown"
        - "@/smOnly"
        - "@card/sm"
        - "@card/smDown"
        - "@card/smOnly"
        - _hover
        - base
        - sm
        - smDown
        - smOnly
      breakpoints:
        - base
        - sm
      containers:
        - card
    patterns:
      patterns:
        stack:
          name: stack
          typeName: Stack
          strict: true
          blocklist:
            - color
          properties:
            align:
              name: align
              description: ~
              kind:
                kind: property
                property: alignItems
            direction:
              name: direction
              description: ~
              kind:
                kind: enum
                values:
                  - row
                  - column
            gap:
              name: gap
              description: Gap
              kind:
                kind: token
                category: spacing
                property: gap
    "#);
}
