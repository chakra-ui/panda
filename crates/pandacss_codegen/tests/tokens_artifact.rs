use std::{collections::BTreeMap, sync::Arc};

use crate::common::{artifact, file, paths, user_config};
use insta::assert_snapshot;
use pandacss_codegen::{
    ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions, TokenDictionarySource,
};
use pandacss_config::{CodegenFormat, TokenTypeData, TypeData, UserConfig};
use pandacss_tokens::TokenDictionary;
use serde_json::json;

fn config() -> UserConfig {
    user_config(serde_json::json!({ "prefix": { "cssVar": "pd" } }))
}

fn token_values() -> TokenTypeData {
    TokenTypeData {
        values: BTreeMap::from([
            ("colors.red.500".into(), "#ef4444".into()),
            ("opacity.half".into(), "0.5".into()),
            ("spacing.4".into(), "1rem".into()),
            // value == var → stored empty, derived at runtime
            ("colors.primary".into(), String::new()),
        ]),
        ..TokenTypeData::default()
    }
}

fn input() -> CodegenInput {
    CodegenInput {
        types: TypeData {
            tokens: token_values(),
            ..TypeData::default()
        },
        config: config(),
        ..CodegenInput::default()
    }
}

#[test]
fn emits_ts_source_tokens() {
    let artifacts = ArtifactGraph.generate_all(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let tokens = artifact(&artifacts, ArtifactId::Tokens);

    assert_eq!(paths(tokens), vec!["tokens/index.ts"]);
    assert_snapshot!(file(tokens, "tokens/index.ts"), @r##"
    import { colorMix, toCssVar } from '../helpers';
    import type { Token, TokenPath } from '../types/tokens';

    interface TokenFn {
      (path: TokenPath, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    const tokens: Record<string, string> = {"colors.primary":"","colors.red.500":"#ef4444","opacity.half":"0.5","spacing.4":"1rem"}

    const resolveVar = toCssVar

    export const token: TokenFn = /* @__PURE__ */ Object.assign(
      function token(path: string, fallback?: string) {
        const value = tokens[path]
        return value === undefined ? colorMix(tokens, path, resolveVar) || fallback : value || resolveVar(path)
      },
      {
        var: function tokenVar(path: string, fallback?: string) {
          return tokens[path] === undefined ? fallback : resolveVar(path)
        },
      },
    ) as TokenFn
    "##);
}

#[test]
fn emits_js_runtime_and_declarations() {
    let artifacts = ArtifactGraph.generate_all(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            import_extensions: true,
        },
    );
    let tokens = artifact(&artifacts, ArtifactId::Tokens);

    assert_eq!(
        paths(tokens),
        vec!["tokens/index.mjs", "tokens/index.d.mts"]
    );
    assert_snapshot!(file(tokens, "tokens/index.mjs"), @r##"
    import { colorMix, toCssVar } from '../helpers.mjs';

    const tokens = {"colors.primary":"","colors.red.500":"#ef4444","opacity.half":"0.5","spacing.4":"1rem"}

    const resolveVar = toCssVar

    export const token = /* @__PURE__ */ Object.assign(
      function token(path, fallback) {
        const value = tokens[path]
        return value === undefined ? colorMix(tokens, path, resolveVar) || fallback : value || resolveVar(path)
      },
      {
        var: function tokenVar(path, fallback) {
          return tokens[path] === undefined ? fallback : resolveVar(path)
        },
      },
    )
    "##);
    assert_snapshot!(file(tokens, "tokens/index.d.mts"), @"
    import type { Token, TokenPath } from '../types/tokens.mjs';

    interface TokenFn {
      (path: TokenPath, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    export declare const token: TokenFn;
    ");
}

#[test]
fn preserves_dotted_token_keys_from_the_compiled_dictionary() {
    let config = user_config(json!({
        "theme": {
            "tokens": {
                "spacing": {
                    "1.5": { "value": "0.375rem" },
                    "4": { "value": "1rem" }
                }
            }
        }
    }));
    let dictionary = TokenDictionary::from_config(&config)
        .expect("valid token config")
        .expect("spacing tokens");
    let input = CodegenInput {
        config,
        types: TypeData {
            tokens: dictionary.type_data(),
            ..TypeData::default()
        },
        token_dictionary: TokenDictionarySource::Provided(Some(Arc::new(dictionary))),
        ..CodegenInput::default()
    };
    let artifacts = ArtifactGraph.generate_all(
        &input,
        GenerateOptions {
            format: CodegenFormat::Mjs,
            import_extensions: true,
        },
    );
    let code = file(artifact(&artifacts, ArtifactId::Tokens), "tokens/index.mjs");
    let expected_variables = [
        ("spacing.1.5", r"var(--spacing-1\.5)"),
        ("spacing.-1.5", r"var(--spacing-1\.5)"),
        ("spacing.-4", "var(--spacing-4)"),
    ];
    for (path, reference) in expected_variables {
        let serialized_path = serde_json::to_string(path).unwrap();
        let serialized_reference = serde_json::to_string(reference).unwrap();
        let expected_entry = format!("{serialized_path}:{serialized_reference}");
        assert!(
            code.contains(&expected_entry),
            "missing reference for {path}"
        );
    }
    assert!(code.contains("colorMix(tokens, path, resolveVar)"));
    assert!(code.contains("tokens[path] === undefined ? fallback : resolveVar(path)"));
}
