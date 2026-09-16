use std::sync::Arc;

use crate::common::{file, user_config};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions};
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
        token_dictionary: Some(Arc::new(dictionary)),
        token_dictionary_provided: true,
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
          "semantic": true
        },
        "spacing.4": {
          "category": "spacing",
          "cssVar": "--spacing-4",
          "description": "one rem"
        },
        "spacing.-4": {
          "category": "spacing",
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
