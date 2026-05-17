use pandacss_config::{DerivedEngineConfig, EngineConfig, SerializedConfig};
use serde_json::json;

#[test]
fn derives_import_map_and_jsx_names() {
    let config: SerializedConfig = serde_json::from_value(json!({
        "outdir": "styled-system",
        "importMap": {
            "css": ["@panda/css"],
            "recipe": ["@panda/recipes"],
            "pattern": ["@panda/patterns"],
            "jsx": ["@panda/jsx"],
            "tokens": ["@panda/tokens"]
        },
        "jsxFactory": "panda",
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "jsx": ["VStack"]
            }
        },
        "theme": {
            "recipes": {
                "button": {
                    "jsx": ["Button"]
                }
            },
            "slotRecipes": {
                "card": {
                    "jsx": ["CardRoot"]
                }
            }
        }
    }))
    .expect("valid serialized config");

    let derived = DerivedEngineConfig::from_serialized_config(&config);

    assert_eq!(derived.import_map.css, vec!["@panda/css"]);
    assert_eq!(derived.jsx_factory, "panda");
    assert_eq!(
        derived.jsx_names,
        vec![
            "panda",
            "Box",
            "Stack",
            "VStack",
            "Button",
            "CardRoot",
            "Card.Root"
        ]
    );
}

#[test]
fn derives_condition_names_from_conditions_and_breakpoints() {
    let config: SerializedConfig = serde_json::from_value(json!({
        "conditions": {
            "cqSm": "@container (min-width: 320px)",
            "supportsGrid": "@supports (display: grid)"
        },
        "theme": {
            "breakpoints": {
                "tablet": "768px",
                "wide": "1440px"
            }
        }
    }))
    .expect("valid serialized config");

    let derived = DerivedEngineConfig::from_serialized_config(&config);

    assert_eq!(
        derived.condition_names,
        vec!["cqSm", "supportsGrid", "tablet", "wide"]
    );
}

#[test]
fn default_import_map_uses_outdir_basename() {
    let config: SerializedConfig = serde_json::from_value(json!({
        "outdir": "packages/app/styled-system"
    }))
    .expect("valid serialized config");

    let derived = DerivedEngineConfig::from_serialized_config(&config);

    assert_eq!(derived.import_map.css, vec!["styled-system/css"]);
    assert_eq!(derived.import_map.recipe, vec!["styled-system/recipes"]);
    assert_eq!(derived.import_map.pattern, vec!["styled-system/patterns"]);
    assert_eq!(derived.import_map.jsx, vec!["styled-system/jsx"]);
    assert_eq!(derived.import_map.tokens, vec!["styled-system/tokens"]);
}

#[test]
fn engine_config_derives_component_and_recipe_metadata() {
    let config: SerializedConfig = serde_json::from_value(json!({
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "jsx": [{ "kind": "regex", "source": "^PandaStack$", "flags": "" }],
                "properties": {
                    "gap": {},
                    "direction": {}
                }
            }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "btn",
                    "jsx": ["Button", { "kind": "regex", "source": "^Action$", "flags": "" }],
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" }
                        }
                    },
                    "defaultVariants": {
                        "size": "sm"
                    }
                }
            },
            "slotRecipes": {
                "card": {
                    "jsx": ["Card"],
                    "slots": ["root"],
                    "variants": {
                        "tone": {
                            "info": {
                                "root": { "color": "blue" }
                            }
                        }
                    }
                }
            }
        }
    }))
    .expect("valid serialized config");

    let engine = EngineConfig::from_serialized_config(&config);

    assert_eq!(engine.patterns[0].jsx_names, vec!["Stack"]);
    assert_eq!(engine.patterns[0].props, vec!["gap", "direction"]);
    assert!(engine.patterns[0].jsx_regexes[0].is_match("PandaStack"));

    assert_eq!(engine.recipes[0].name, "button");
    assert_eq!(engine.recipes[0].class_name, "btn");
    assert_eq!(engine.recipes[0].jsx_names, vec!["Button"]);
    assert_eq!(engine.recipes[0].variant_props, vec!["size"]);
    assert!(engine.recipes[0].jsx_regexes[0].is_match("Action"));
    assert_eq!(
        engine.recipes[0].recipe.default_variants,
        vec![("size".into(), "sm".into())]
    );

    assert_eq!(
        engine.slot_recipes[0].jsx_names,
        vec!["Card", "Card.Root", "CardRoot"]
    );
    assert_eq!(engine.slot_recipes[0].variant_props, vec!["tone"]);
}
