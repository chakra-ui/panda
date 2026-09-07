use std::sync::Arc;

use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions};
use pandacss_config::UserConfig;
use pandacss_tokens::TokenDictionary;

fn input() -> CodegenInput {
    let config: UserConfig = serde_json::from_value(serde_json::json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "500": { "value": "#ef4444" } },
                    "blue": { "600": { "value": "#2563eb" } }
                },
                "spacing": { "4": { "value": "1rem" } }
            },
            "semanticTokens": {
                "colors": {
                    "fg": { "value": { "base": "{colors.red.500}", "_dark": "{colors.blue.600}" } }
                }
            }
        }
    }))
    .expect("config should deserialize");

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
fn emits_flat_token_spec_grouped_by_category() {
    let artifacts = ArtifactGraph.generate_with_input(&input(), GenerateOptions::default());
    let specs = artifact(&artifacts, ArtifactId::Specs);

    assert_eq!(paths(specs), vec!["specs/tokens.json"]);
    // Semantic `fg` keeps only its base value; the `_dark` variant is dropped.
    assert_snapshot!(file(specs, "specs/tokens.json"), @r##"
    {
      "data": [
        {
          "type": "colors",
          "values": [
            {
              "name": "red.500",
              "value": "#ef4444"
            },
            {
              "name": "blue.600",
              "value": "#2563eb"
            },
            {
              "name": "fg",
              "value": "#ef4444"
            }
          ]
        },
        {
          "type": "spacing",
          "values": [
            {
              "name": "4",
              "value": "1rem"
            },
            {
              "name": "-4",
              "value": "calc(var(--spacing-4) * -1)"
            }
          ]
        }
      ]
    }
    "##);
}

#[test]
fn emits_empty_data_without_tokens() {
    let artifacts =
        ArtifactGraph.generate_with_input(&CodegenInput::default(), GenerateOptions::default());
    let specs = artifact(&artifacts, ArtifactId::Specs);

    assert_snapshot!(file(specs, "specs/tokens.json"), @r#"
    {
      "data": []
    }
    "#);
}
