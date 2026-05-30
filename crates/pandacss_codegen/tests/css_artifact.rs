mod common;

use std::collections::BTreeMap;

use common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{
    ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions, ModuleSpecifierPolicy,
};
use pandacss_config::{CodegenFormat, TypeData, UserConfig, UtilityTypeData};

fn config() -> UserConfig {
    serde_json::from_value(serde_json::json!({
        "theme": { "breakpoints": { "sm": "30rem" } },
        "separator": "_"
    }))
    .expect("config should deserialize")
}

fn utilities() -> UtilityTypeData {
    UtilityTypeData {
        class_names: BTreeMap::from([
            ("color".into(), "text".into()),
            ("flexDirection".into(), "flex".into()),
            ("marginLeft".into(), "ml".into()),
            // default className + no shorthand → omitted (runtime fallback covers it)
            ("display".into(), "display".into()),
            // default className + shorthand → keep only the shorthand (`marginInlineStart:/ms`)
            ("marginInlineStart".into(), "margin-inline-start".into()),
            // vendor-prefixed: runtime hyphenate adds a leading dash, so the stored
            // class differs from the fallback → must be kept
            ("WebkitLineClamp".into(), "webkit-line-clamp".into()),
        ]),
        shorthands: BTreeMap::from([
            ("flexDir".into(), "flexDirection".into()),
            ("ml".into(), "marginLeft".into()),
            ("ms".into(), "marginInlineStart".into()),
        ]),
        ..UtilityTypeData::default()
    }
}

fn input() -> CodegenInput {
    CodegenInput {
        types: TypeData {
            utilities: utilities(),
            ..TypeData::default()
        },
        config: config(),
        ..CodegenInput::default()
    }
}

#[test]
fn emits_ts_source_css() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );
    let css = artifact(&artifacts, ArtifactId::Css);

    assert_eq!(paths(css), vec!["css.ts"]);
    assert_snapshot!(file(css, "css.ts"), @r#"
    import { createCss, createMergeCss, hypenateProperty, withoutSpace } from './helpers';

    import { finalizeConditions, sortConditions } from './conditions';

    import type { SystemStyleObject } from './types';

    type Styles = SystemStyleObject | undefined | null | false

    interface CssRawFunction {
      (styles: Styles): SystemStyleObject
      (styles: Styles[]): SystemStyleObject
      (...styles: Array<Styles | Styles[]>): SystemStyleObject
    }

    interface CssFunction {
      (styles: Styles): string
      (styles: Styles[]): string
      (...styles: Array<Styles | Styles[]>): string

      raw: CssRawFunction
    }

    const utilities = "WebkitLineClamp:webkit-line-clamp,color:text,flexDirection:flex/flexDir,marginInlineStart:/ms,marginLeft:ml/1"

    const classNameByProp = new Map<string, string>()
    const shorthands = new Map<string, string>()
    utilities.split(",").forEach((utility: string) => {
      const [prop, meta] = utility.split(":")
      const [className, ...shorthandList] = meta.split("/")
      if (className) classNameByProp.set(prop, className)
      shorthandList.forEach((shorthand: string) => {
        const key = shorthand === "1" ? className : shorthand
        shorthands.set(key, prop)
      })
    })

    const resolveShorthand = (prop: string) => shorthands.get(prop) || prop

    const context = {
      hash: false,
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: ["base","sm"] },
      },
      utility: {
        prefix: null,
        hasShorthand: true,
        toHash: (path: string[], hashFn: any) => hashFn(path.join(":")),
        transform: (prop: string, value: string) => {
          const key = resolveShorthand(prop)
          const propKey = classNameByProp.get(key) || hypenateProperty(key)
          return { className: `${propKey}_${withoutSpace(value)}` }
        },
        resolveShorthand,
      },
    }

    const cssFn = createCss(context)

    export const css: CssFunction = /* @__PURE__ */ Object.assign(
      (...styles: any[]) => cssFn(mergeCss(...styles)),
      { raw: (...styles: any[]) => mergeCss(...styles) },
    )

    export const { mergeCss, assignCss } = createMergeCss(context)
    "#);
}

#[test]
fn emits_js_runtime_and_declarations() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            specifiers: ModuleSpecifierPolicy::RuntimeAndTypes,
        },
    );
    let css = artifact(&artifacts, ArtifactId::Css);

    assert_eq!(paths(css), vec!["css.mjs", "css.d.mts"]);
    assert_snapshot!(file(css, "css.mjs"), @r#"
    import { createCss, createMergeCss, hypenateProperty, withoutSpace } from './helpers.mjs';

    import { finalizeConditions, sortConditions } from './conditions.mjs';

    const utilities = "WebkitLineClamp:webkit-line-clamp,color:text,flexDirection:flex/flexDir,marginInlineStart:/ms,marginLeft:ml/1"

    const classNameByProp = new Map()
    const shorthands = new Map()
    utilities.split(",").forEach((utility) => {
      const [prop, meta] = utility.split(":")
      const [className, ...shorthandList] = meta.split("/")
      if (className) classNameByProp.set(prop, className)
      shorthandList.forEach((shorthand) => {
        const key = shorthand === "1" ? className : shorthand
        shorthands.set(key, prop)
      })
    })

    const resolveShorthand = (prop) => shorthands.get(prop) || prop

    const context = {
      hash: false,
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: ["base","sm"] },
      },
      utility: {
        prefix: null,
        hasShorthand: true,
        toHash: (path, hashFn) => hashFn(path.join(":")),
        transform: (prop, value) => {
          const key = resolveShorthand(prop)
          const propKey = classNameByProp.get(key) || hypenateProperty(key)
          return { className: `${propKey}_${withoutSpace(value)}` }
        },
        resolveShorthand,
      },
    }

    const cssFn = createCss(context)

    export const css = /* @__PURE__ */ Object.assign(
      (...styles) => cssFn(mergeCss(...styles)),
      { raw: (...styles) => mergeCss(...styles) },
    )

    export const { mergeCss, assignCss } = createMergeCss(context)
    "#);
    assert_snapshot!(file(css, "css.d.mts"), @"
    import type { SystemStyleObject } from './types.d.mts';

    type Styles = SystemStyleObject | undefined | null | false

    interface CssRawFunction {
      (styles: Styles): SystemStyleObject
      (styles: Styles[]): SystemStyleObject
      (...styles: Array<Styles | Styles[]>): SystemStyleObject
    }

    interface CssFunction {
      (styles: Styles): string
      (styles: Styles[]): string
      (...styles: Array<Styles | Styles[]>): string

      raw: CssRawFunction
    }

    export declare const css: CssFunction;
    ");
}
