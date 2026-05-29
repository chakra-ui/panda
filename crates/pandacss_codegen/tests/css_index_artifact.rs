mod common;

use common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions, ModuleSpecifierPolicy};
use pandacss_config::CodegenFormat;

#[test]
fn reexports_cx() {
    let graph = ArtifactGraph;

    let ts = graph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        specifiers: ModuleSpecifierPolicy::Extensionless,
    });
    let index = artifact(&ts, ArtifactId::CssIndex);
    assert_eq!(paths(index), vec!["index.ts"]);
    assert_eq!(file(index, "index.ts"), "export * from './cx';");
}

#[test]
fn can_emit_extensioned_specifiers() {
    let graph = ArtifactGraph;

    let js = graph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        specifiers: ModuleSpecifierPolicy::RuntimeAndTypes,
    });
    let index = artifact(&js, ArtifactId::CssIndex);
    assert_eq!(
        file(index, "index.js"),
        indoc! {r"
        export * from './cx.js';
        "}
        .trim()
    );
    assert_eq!(
        file(index, "index.d.ts"),
        indoc! {r"
        export * from './cx.d.ts';
        "}
        .trim()
    );

    let mjs = graph.generate(GenerateOptions {
        format: CodegenFormat::Mjs,
        specifiers: ModuleSpecifierPolicy::RuntimeAndTypes,
    });
    let index = artifact(&mjs, ArtifactId::CssIndex);
    assert_eq!(
        file(index, "index.mjs"),
        indoc! {r"
        export * from './cx.mjs';
        "}
        .trim()
    );
    assert_eq!(
        file(index, "index.d.mts"),
        indoc! {r"
        export * from './cx.d.mts';
        "}
        .trim()
    );
}
