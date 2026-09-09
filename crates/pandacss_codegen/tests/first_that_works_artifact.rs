use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::CodegenFormat;

#[test]
fn emits_ts_source_first_that_works() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    let ftw = artifact(&artifacts, ArtifactId::FirstThatWorks);

    assert_eq!(paths(ftw), vec!["css/first-that-works.ts"]);
    assert_snapshot!(file(ftw, "css/first-that-works.ts"), @"
    export type FirstThatWorksMember = string | number;

    export type FirstThatWorksFn = {
      <T>(first: T, second: T, ...rest: T[]): T
      <A extends FirstThatWorksMember, B extends FirstThatWorksMember, R extends FirstThatWorksMember[]>(
        first: A,
        second: B,
        ...rest: R,
      ): A | B | R[number]
    };

    export const firstThatWorks: FirstThatWorksFn = (...values: any[]) => `firstThatWorks(${values.join(', ')})`
    ");
}

#[test]
fn emits_js_and_dts_first_that_works() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        import_extensions: false,
    });
    let ftw = artifact(&artifacts, ArtifactId::FirstThatWorks);

    assert_eq!(
        paths(ftw),
        vec!["css/first-that-works.js", "css/first-that-works.d.ts"]
    );
    assert_snapshot!(file(ftw, "css/first-that-works.js"), @"export const firstThatWorks = (...values) => `firstThatWorks(${values.join(', ')})`");
    assert_snapshot!(file(ftw, "css/first-that-works.d.ts"), @"
    export type FirstThatWorksMember = string | number;

    export type FirstThatWorksFn = {
      <T>(first: T, second: T, ...rest: T[]): T
      <A extends FirstThatWorksMember, B extends FirstThatWorksMember, R extends FirstThatWorksMember[]>(
        first: A,
        second: B,
        ...rest: R,
      ): A | B | R[number]
    };

    export declare const firstThatWorks: FirstThatWorksFn;
    ");
}
