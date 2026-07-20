use std::collections::BTreeMap;

use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions};
use pandacss_config::{CodegenFormat, TokenTypeData, TypeData, UserConfig};

fn config() -> UserConfig {
    serde_json::from_value(serde_json::json!({ "prefix": { "cssVar": "pd" } }))
        .expect("config should deserialize")
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
    let artifacts = ArtifactGraph.generate_with_input(
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

    export const token: TokenFn = /* @__PURE__ */ Object.assign(
      function token(path: string, fallback?: string) {
        const value = tokens[path]
        return value === undefined ? colorMix(tokens, path) || fallback : value || toCssVar(path)
      },
      {
        var: function tokenVar(path: string, fallback?: string) {
          return tokens[path] === undefined ? fallback : toCssVar(path)
        },
      },
    )
    "##);
}

#[test]
fn emits_js_runtime_and_declarations() {
    let artifacts = ArtifactGraph.generate_with_input(
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

    export const token = /* @__PURE__ */ Object.assign(
      function token(path, fallback) {
        const value = tokens[path]
        return value === undefined ? colorMix(tokens, path) || fallback : value || toCssVar(path)
      },
      {
        var: function tokenVar(path, fallback) {
          return tokens[path] === undefined ? fallback : toCssVar(path)
        },
      },
    )
    "##);
    assert_snapshot!(file(tokens, "tokens/index.d.mts"), @"
    import type { Token, TokenPath } from '../types/tokens.d.mts';

    interface TokenFn {
      (path: TokenPath, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    export declare const token: TokenFn;
    ");
}
