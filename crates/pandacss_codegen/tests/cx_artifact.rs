use crate::common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::CodegenFormat;

#[test]
fn uses_out_extension_for_files() {
    let graph = ArtifactGraph;

    let js = graph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        import_extensions: false,
    });
    assert_eq!(
        paths(artifact(&js, ArtifactId::Cx)),
        vec!["css/cx.js", "css/cx.d.ts"]
    );

    let mjs = graph.generate(GenerateOptions {
        format: CodegenFormat::Mjs,
        import_extensions: false,
    });
    assert_eq!(
        paths(artifact(&mjs, ArtifactId::Cx)),
        vec!["css/cx.mjs", "css/cx.d.mts"]
    );

    let ts = graph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    assert_eq!(paths(artifact(&ts, ArtifactId::Cx)), vec!["css/cx.ts"]);
}

#[test]
fn emits_representative_js_and_ts_sources() {
    let graph = ArtifactGraph;

    let js = graph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        import_extensions: false,
    });
    let js = artifact(&js, ArtifactId::Cx);
    assert_eq!(
        file(js, "css/cx.js"),
        indoc! {r"
        /**
         * Conditionally join classNames into a single string
         */
        export function cx(...args) {
          let str = '',
            i = 0,
            arg

          for (; i < arguments.length; ) {
            if ((arg = arguments[i++]) && typeof arg === 'string') {
              str && (str += ' ')
              str += arg
            }
          }
          return str
        }
        "}
        .trim()
    );
    assert_eq!(
        file(js, "css/cx.d.ts"),
        indoc! {r"
        type Argument = string | boolean | null | undefined;

        /**
         * Conditionally join classNames into a single string
         */
        export declare function cx(...args: Argument[]): string;
        "}
        .trim()
    );

    let ts = graph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    assert_eq!(
        file(artifact(&ts, ArtifactId::Cx), "css/cx.ts"),
        indoc! {r"
        type Argument = string | boolean | null | undefined;

        /**
         * Conditionally join classNames into a single string
         */
        export function cx(...args: Argument[]): string {
          let str = '',
            i = 0,
            arg

          for (; i < arguments.length; ) {
            if ((arg = arguments[i++]) && typeof arg === 'string') {
              str && (str += ' ')
              str += arg
            }
          }
          return str
        }
        "}
        .trim()
    );
}
