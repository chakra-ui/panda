use std::sync::Arc;

use crate::common::{file, user_config};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions};
use pandacss_config::{TokenTypeData, TypeData};
use pandacss_tokens::TokenDictionary;

/// A system with a theme, so the document has to split `_themeBrand:_dark`
/// into a theme and a condition, and keep the reference the plain spec drops.
fn themed_input() -> CodegenInput {
    let config = user_config(serde_json::json!({
        "conditions": { "dark": "[data-theme=dark] &" },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "500": { "value": "#ef4444" } },
                    "blue": { "600": { "value": "#2563eb" } }
                },
                "spacing": { "4": { "value": "1rem", "description": "one rem" } }
            },
            "semanticTokens": {
                "colors": {
                    "fg": { "value": { "base": "{colors.red.500}", "_dark": "{colors.blue.600}" } }
                }
            }
        },
        "themes": {
            "brand": {
                "semanticTokens": {
                    "colors": { "fg": { "value": { "base": "{colors.blue.600}" } } }
                }
            }
        }
    }));

    let dictionary = TokenDictionary::from_config(&config)
        .expect("token dictionary should build")
        .expect("config defines tokens");

    CodegenInput {
        config,
        token_dictionary: pandacss_codegen::TokenDictionarySource::Provided(Some(Arc::new(
            dictionary,
        ))),
        ..CodegenInput::default()
    }
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "the inline snapshot is the whole document; splitting it hides what is asserted"
)]
fn design_system_document_keeps_token_references_and_render_order() {
    let input = themed_input();
    let specs = ArtifactGraph
        .generate(
            &input,
            GenerateOptions::default(),
            ArtifactGraph.node(ArtifactId::Specs),
        )
        .pop()
        .expect("specs artifact should exist");
    let specs = &specs;

    // `schemaVersion` is the contract with `@pandacss/compiler-shared`: changing
    // the document's shape means bumping it here and there, and both suites
    // assert on it, so neither side can drift quietly.
    assert_snapshot!(file(specs, "specs/design-system.json"), @r##"
    {
      "schemaVersion": 1,
      "categories": {
        "colors": [
          0,
          3
        ],
        "spacing": [
          3,
          5
        ]
      },
      "paths": [
        "colors.red.500",
        "colors.blue.600",
        "colors.fg",
        "spacing.4",
        "spacing.-4"
      ],
      "tokens": {
        "colors.red.500": {
          "category": "colors",
          "cssVar": "--colors-red-500"
        },
        "colors.blue.600": {
          "category": "colors",
          "cssVar": "--colors-blue-600"
        },
        "colors.fg": {
          "category": "colors",
          "cssVar": "--colors-fg",
          "originalValue": "{colors.red.500}",
          "semantic": true
        },
        "spacing.4": {
          "category": "spacing",
          "cssVar": "--spacing-4",
          "description": "one rem"
        },
        "spacing.-4": {
          "category": "spacing",
          "originalValue": "1rem",
          "description": "one rem"
        }
      },
      "conditions": {
        "_dark": "[data-theme=dark] &"
      },
      "themes": {
        "brand": {
          "id": "panda-theme-brand",
          "selector": "[data-panda-theme=brand]"
        }
      },
      "values": [
        {
          "token": "colors.blue.600",
          "value": "#2563eb"
        },
        {
          "token": "colors.fg",
          "value": "#ef4444",
          "refs": [
            "colors.red.500"
          ]
        },
        {
          "token": "colors.fg",
          "condition": "_dark",
          "value": "#2563eb",
          "refs": [
            "colors.blue.600"
          ]
        },
        {
          "token": "colors.fg",
          "theme": "brand",
          "value": "#2563eb",
          "refs": [
            "colors.blue.600"
          ]
        },
        {
          "token": "colors.red.500",
          "value": "#ef4444"
        },
        {
          "token": "spacing.-4",
          "value": "calc(1rem * -1)",
          "refs": [
            "spacing.4"
          ]
        },
        {
          "token": "spacing.4",
          "value": "1rem"
        }
      ]
    }
    "##);
}

#[test]
fn emits_nothing_without_tokens() {
    let specs = ArtifactGraph
        .generate(
            &CodegenInput::default(),
            GenerateOptions::default(),
            ArtifactGraph.node(ArtifactId::Specs),
        )
        .pop()
        .expect("specs artifact should exist");

    assert!(specs.files.is_empty());
}

fn rich_input() -> CodegenInput {
    let config = user_config(serde_json::json!({
        "theme": {
            "tokens": { "colors": { "red": { "500": { "value": "#ef4444" } } } },
            "keyframes": { "spin": { "to": { "transform": "rotate(360deg)" } } },
            "textStyles": {
                "body": { "description": "Paragraph copy", "value": { "fontSize": "1rem" } },
                "heading": { "lg": { "value": { "fontSize": "2rem" } } }
            },
            "layerStyles": { "card": { "value": { "background": "white" } } },
            "animationStyles": { "fade": { "value": { "animation": "fade 1s" } } },
            "recipes": {
                "button": {
                    "className": "btn",
                    "description": "The primary action",
                    "deprecated": "use link",
                    "variants": { "size": { "sm": {}, "md": {} }, "disabled": { "true": {} } },
                    "defaultVariants": { "size": "md" }
                }
            },
            "slotRecipes": {
                "card": { "slots": ["root", "body"], "variants": { "tone": { "neutral": {} } } }
            }
        },
        "patterns": {
            "stack": {
                "jsxName": "VStack",
                "jsx": ["VStack"],
                "description": "Vertical flow",
                "defaultValues": { "gap": "4" },
                "properties": {
                    "gap": { "type": "token", "value": "spacing", "description": "Space between" },
                    "align": { "type": "enum", "value": ["start", "center"] },
                    "wrap": { "type": "boolean" }
                }
            }
        }
    }));

    let dictionary = TokenDictionary::from_config(&config)
        .expect("token dictionary should build")
        .expect("config defines tokens");

    let types = TypeData {
        keyframes: config.keyframe_type_data(),
        patterns: config.pattern_type_data(),
        recipes: config.recipe_type_data(),
        // the token builder lives in the project crate; this is what it derives here
        tokens: TokenTypeData {
            color_palettes: vec!["red".to_owned()],
            ..TokenTypeData::default()
        },
        ..TypeData::default()
    };

    CodegenInput {
        config,
        types,
        token_dictionary: pandacss_codegen::TokenDictionarySource::Provided(Some(Arc::new(
            dictionary,
        ))),
        ..CodegenInput::default()
    }
}

fn document(input: &CodegenInput) -> serde_json::Value {
    let specs = ArtifactGraph
        .generate(
            input,
            GenerateOptions::default(),
            ArtifactGraph.node(ArtifactId::Specs),
        )
        .pop()
        .expect("specs artifact should exist");
    serde_json::from_str(file(&specs, "specs/design-system.json")).expect("valid json")
}

#[test]
fn a_token_only_system_keeps_exactly_the_original_tables() {
    let doc = document(&themed_input());
    let keys: Vec<&String> = doc.as_object().expect("object").keys().collect();

    assert_eq!(
        keys,
        [
            "schemaVersion",
            "categories",
            "paths",
            "tokens",
            "conditions",
            "themes",
            "values"
        ]
    );
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "the inline snapshot is the whole document; splitting it hides what is asserted"
)]
fn recipes_patterns_and_composition_styles_are_listed() {
    let doc = document(&rich_input());
    let sections: serde_json::Map<String, serde_json::Value> = doc
        .as_object()
        .expect("object")
        .iter()
        .filter(|(key, _)| !["categories", "paths", "tokens", "values"].contains(&key.as_str()))
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect();

    assert_snapshot!(serde_json::to_string_pretty(&sections).expect("serialize"), @r#"
    {
      "schemaVersion": 1,
      "conditions": {},
      "themes": {},
      "colorPalettes": [
        "red"
      ],
      "keyframes": [
        "spin"
      ],
      "textStyles": {
        "body": {
          "description": "Paragraph copy"
        },
        "heading.lg": {}
      },
      "layerStyles": {
        "card": {}
      },
      "animationStyles": {
        "fade": {}
      },
      "recipes": {
        "button": {
          "className": "btn",
          "variants": {
            "disabled": {
              "values": [
                "true"
              ],
              "allowsBoolean": true
            },
            "size": {
              "values": [
                "md",
                "sm"
              ],
              "allowsBoolean": false
            }
          },
          "defaultVariants": {
            "size": "md"
          },
          "deprecated": "use link",
          "description": "The primary action"
        }
      },
      "slotRecipes": {
        "card": {
          "slots": [
            "root",
            "body"
          ],
          "variants": {
            "tone": {
              "values": [
                "neutral"
              ],
              "allowsBoolean": false
            }
          }
        }
      },
      "patterns": {
        "stack": {
          "jsxName": "VStack",
          "jsx": [
            "VStack"
          ],
          "properties": {
            "align": {
              "kind": "enum",
              "values": [
                "start",
                "center"
              ]
            },
            "gap": {
              "kind": "token",
              "category": "spacing",
              "description": "Space between"
            },
            "wrap": {
              "kind": "primitive",
              "primitive": "boolean"
            }
          },
          "defaultValues": {
            "gap": "4"
          },
          "strict": false,
          "description": "Vertical flow"
        }
      }
    }
    "#);
}

#[test]
fn the_same_config_produces_identical_bytes() {
    let first = document(&rich_input());
    let second = document(&rich_input());

    assert_eq!(
        serde_json::to_string(&first).expect("serialize"),
        serde_json::to_string(&second).expect("serialize")
    );
}
