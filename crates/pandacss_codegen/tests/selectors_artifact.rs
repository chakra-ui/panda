mod common;

use common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions, ModuleSpecifierPolicy};
use pandacss_config::CodegenFormat;

#[test]
fn emits_ts_source() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        specifiers: ModuleSpecifierPolicy::Extensionless,
    });
    let selectors = artifact(&artifacts, ArtifactId::Selectors);

    assert_eq!(paths(selectors), vec!["selectors.ts"]);
    assert_eq!(
        file(selectors, "selectors.ts"),
        indoc! {r"
        import type { Pseudos } from './csstype';

        type AriaAttributes = '[aria-disabled]'
          | '[aria-hidden]'
          | '[aria-invalid]'
          | '[aria-readonly]'
          | '[aria-required]'
          | '[aria-selected]'
          | '[aria-checked]'
          | '[aria-expanded]'
          | '[aria-pressed]'
          | `[aria-current=${'page' | 'step' | 'location' | 'date' | 'time'}]`
          | `[aria-sort=${'ascending' | 'descending'}]`;

        type DataAttributes = '[data-selected]'
          | '[data-highlighted]'
          | '[data-hover]'
          | '[data-active]'
          | '[data-checked]'
          | '[data-disabled]'
          | '[data-readonly]'
          | '[data-focus]'
          | '[data-focus-visible]'
          | '[data-invalid]'
          | '[data-pressed]'
          | '[data-expanded]'
          | `[data-part=${string}]`
          | `[data-placement=${string}]`
          | `[data-theme=${string}]`
          | `[data-size=${string}]`
          | `[data-state=${string}]`;

        type AttributeSelector = `&${Pseudos | DataAttributes | AriaAttributes}`;

        type ParentSelector = `${DataAttributes | AriaAttributes} &`;

        type AtRuleType = 'media' | 'layer' | 'container' | 'supports' | 'page' | 'scope' | 'starting-style';

        export type AnySelector = `${string}&` | `&${string}` | `@${AtRuleType}${string}`;

        export type Selectors =
          | AttributeSelector
          | ParentSelector
        "}
        .trim()
    );
}

#[test]
fn emits_declarations_only_for_js_format() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate(GenerateOptions {
        format: CodegenFormat::Js,
        specifiers: ModuleSpecifierPolicy::Extensionless,
    });
    let selectors = artifact(&artifacts, ArtifactId::Selectors);

    assert_eq!(paths(selectors), vec!["selectors.d.ts"]);
    assert_eq!(
        file(selectors, "selectors.d.ts"),
        indoc! {r"
        import type { Pseudos } from './csstype';

        type AriaAttributes = '[aria-disabled]'
          | '[aria-hidden]'
          | '[aria-invalid]'
          | '[aria-readonly]'
          | '[aria-required]'
          | '[aria-selected]'
          | '[aria-checked]'
          | '[aria-expanded]'
          | '[aria-pressed]'
          | `[aria-current=${'page' | 'step' | 'location' | 'date' | 'time'}]`
          | `[aria-sort=${'ascending' | 'descending'}]`;

        type DataAttributes = '[data-selected]'
          | '[data-highlighted]'
          | '[data-hover]'
          | '[data-active]'
          | '[data-checked]'
          | '[data-disabled]'
          | '[data-readonly]'
          | '[data-focus]'
          | '[data-focus-visible]'
          | '[data-invalid]'
          | '[data-pressed]'
          | '[data-expanded]'
          | `[data-part=${string}]`
          | `[data-placement=${string}]`
          | `[data-theme=${string}]`
          | `[data-size=${string}]`
          | `[data-state=${string}]`;

        type AttributeSelector = `&${Pseudos | DataAttributes | AriaAttributes}`;

        type ParentSelector = `${DataAttributes | AriaAttributes} &`;

        type AtRuleType = 'media' | 'layer' | 'container' | 'supports' | 'page' | 'scope' | 'starting-style';

        export type AnySelector = `${string}&` | `&${string}` | `@${AtRuleType}${string}`;

        export type Selectors =
          | AttributeSelector
          | ParentSelector
        "}
        .trim()
    );
}
