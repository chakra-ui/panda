mod common;

use std::collections::BTreeMap;

use common::{artifact, file, paths};
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
    import type { Token } from '../types/tokens';

    interface TokenFn {
      (path: Token, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    const tokens: Record<string, string> = {"colors.primary":"","colors.red.500":"#ef4444","spacing.4":"1rem"}

    function toVar(path: string): string {
      let out = ""
      for (const ch of path.replaceAll(".", "-")) {
        if (ch >= "A" && ch <= "Z") out += "-" + ch.toLowerCase()
        else if (/[a-z0-9_-]/.test(ch) || ch >= "\u0081") out += ch
        else out += "\\" + ch
      }
      return "var(--pd-" + out + ")"
    }

    export const token: TokenFn = /* @__PURE__ */ Object.assign(
      function token(path: string, fallback?: string) {
        return path in tokens ? tokens[path] || toVar(path) : fallback
      },
      {
        var: function tokenVar(path: string, fallback?: string) {
          return path in tokens ? toVar(path) : fallback
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
    const tokens = {"colors.primary":"","colors.red.500":"#ef4444","spacing.4":"1rem"}

    function toVar(path){
      let out = ""
      for (const ch of path.replaceAll(".", "-")) {
        if (ch >= "A" && ch <= "Z") out += "-" + ch.toLowerCase()
        else if (/[a-z0-9_-]/.test(ch) || ch >= "\u0081") out += ch
        else out += "\\" + ch
      }
      return "var(--pd-" + out + ")"
    }

    export const token = /* @__PURE__ */ Object.assign(
      function token(path, fallback) {
        return path in tokens ? tokens[path] || toVar(path) : fallback
      },
      {
        var: function tokenVar(path, fallback) {
          return path in tokens ? toVar(path) : fallback
        },
      },
    )
    "##);
    assert_snapshot!(file(tokens, "tokens/index.d.mts"), @"
    import type { Token } from '../types/tokens.d.mts';

    interface TokenFn {
      (path: Token, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    export declare const token: TokenFn;
    ");
}
