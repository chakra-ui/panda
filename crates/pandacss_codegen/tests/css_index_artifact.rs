mod common;

use common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::CodegenFormat;

#[test]
fn reexports_css_modules() {
    let graph = ArtifactGraph;

    let ts = graph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    let index = artifact(&ts, ArtifactId::CssIndex);
    assert_eq!(paths(index), vec!["css/index.ts"]);
    assert_eq!(
        file(index, "css/index.ts"),
        indoc! {r"
        export * from './css';
        export * from './cva';
        export * from './cx';
        export * from './sva';
        "}
        .trim()
    );
}

#[test]
fn can_emit_import_extensions() {
    let graph = ArtifactGraph;

    let js = graph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        import_extensions: true,
    });
    let index = artifact(&js, ArtifactId::CssIndex);
    assert_eq!(
        file(index, "css/index.js"),
        indoc! {r"
        export * from './css.js';
        export * from './cva.js';
        export * from './cx.js';
        export * from './sva.js';
        "}
        .trim()
    );
    assert_eq!(
        file(index, "css/index.d.ts"),
        indoc! {r"
        export * from './css.d.ts';
        export * from './cva.d.ts';
        export * from './cx.d.ts';
        export * from './sva.d.ts';
        "}
        .trim()
    );

    let mjs = graph.generate(GenerateOptions {
        format: CodegenFormat::Mjs,
        import_extensions: true,
    });
    let index = artifact(&mjs, ArtifactId::CssIndex);
    assert_eq!(
        file(index, "css/index.mjs"),
        indoc! {r"
        export * from './css.mjs';
        export * from './cva.mjs';
        export * from './cx.mjs';
        export * from './sva.mjs';
        "}
        .trim()
    );
    assert_eq!(
        file(index, "css/index.d.mts"),
        indoc! {r"
        export * from './css.d.mts';
        export * from './cva.d.mts';
        export * from './cx.d.mts';
        export * from './sva.d.mts';
        "}
        .trim()
    );
}
