use std::collections::BTreeMap;

use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions};
use pandacss_config::{CodegenFormat, CssSyntaxKind, TypeData, UserConfig, UtilityTypeData};

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
            import_extensions: false,
        },
    );
    let css = artifact(&artifacts, ArtifactId::Css);

    assert_eq!(paths(css), vec!["css/css.ts"]);
    assert_snapshot!(file(css, "css/css.ts"), @r#"
    import { createCssRuntime, hypenateProperty, isObject, withoutSpace } from '../helpers';
    import { breakpointKeys, finalizeConditions, sortConditions } from './conditions';
    import type { SystemStyleObject } from '../types/system';

    type Styles = SystemStyleObject | undefined | null | false

    interface CssRawFunction {
      (styles: Styles): SystemStyleObject
      (styles: Styles[]): SystemStyleObject
      (...styles: Array<Styles | Styles[]>): SystemStyleObject
      (styles: Styles): SystemStyleObject
    }

    interface CssFunction {
      (styles: Styles): string
      (styles: Styles[]): string
      (...styles: Array<Styles | Styles[]>): string
      (styles: Styles): string

      raw: CssRawFunction
    }

    const utilities = "WebkitLineClamp:webkit-line-clamp,color:text,flexDirection:flex/flexDir,marginInlineStart:/ms,marginLeft:ml/1"

    const classNameByProp = new Map<string, string>()
    const shorthands = new Map<string, string>()
    if (utilities) {
      utilities.split(",").forEach((utility: string) => {
        const [prop, meta] = utility.split(":")
        const [className, ...shorthandList] = meta.split("/")
        if (className) classNameByProp.set(prop, className)
        shorthandList.forEach((shorthand: string) => {
          const key = shorthand === "1" ? className : shorthand
          shorthands.set(key, prop)
        })
      })
    }

    const resolveShorthand = (prop: string) => shorthands.get(prop) || prop

    const { serializeCss, mergeCss, assignCss } = createCssRuntime({
      hash: false,
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: breakpointKeys },
      },
      utility: {
        prefix: null,
        hasShorthand: true,
        toHash(path: string[], hashFn: any) {
          return hashFn(path.join(":"))
        },
        transform(prop: string, value: string) {
          const key = resolveShorthand(prop)
          const propKey = classNameByProp.get(key) || hypenateProperty(key)
          return { className: `${propKey}_${withoutSpace(value)}` }
        },
        resolveShorthand,
      },
    })

    export const css: CssFunction = /* @__PURE__ */ Object.assign(
      function css(...styles: any[]) {
        if (styles.length === 1 && isObject(styles[0])) return serializeCss(styles[0])
        return serializeCss(mergeCss(...styles))
      },
      {
        raw: function cssRaw(...styles: any[]) {
          return mergeCss(...styles)
        },
      },
    )

    export { mergeCss, assignCss }
    "#);
}

#[test]
fn emits_configured_separator_in_css_runtime() {
    let mut input = input();
    input.config.separator = "__".into();
    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let css = artifact(&artifacts, ArtifactId::Css);

    assert!(file(css, "css/css.ts").contains("`${propKey}__${withoutSpace(value)}`"));
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
    let css = artifact(&artifacts, ArtifactId::Css);

    assert_eq!(paths(css), vec!["css/css.mjs", "css/css.d.mts"]);
    assert_snapshot!(file(css, "css/css.mjs"), @r#"
    import { createCssRuntime, hypenateProperty, isObject, withoutSpace } from '../helpers.mjs';
    import { breakpointKeys, finalizeConditions, sortConditions } from './conditions.mjs';

    const utilities = "WebkitLineClamp:webkit-line-clamp,color:text,flexDirection:flex/flexDir,marginInlineStart:/ms,marginLeft:ml/1"

    const classNameByProp = new Map()
    const shorthands = new Map()
    if (utilities) {
      utilities.split(",").forEach((utility) => {
        const [prop, meta] = utility.split(":")
        const [className, ...shorthandList] = meta.split("/")
        if (className) classNameByProp.set(prop, className)
        shorthandList.forEach((shorthand) => {
          const key = shorthand === "1" ? className : shorthand
          shorthands.set(key, prop)
        })
      })
    }

    const resolveShorthand = (prop) => shorthands.get(prop) || prop

    const { serializeCss, mergeCss, assignCss } = createCssRuntime({
      hash: false,
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: breakpointKeys },
      },
      utility: {
        prefix: null,
        hasShorthand: true,
        toHash(path, hashFn) {
          return hashFn(path.join(":"))
        },
        transform(prop, value) {
          const key = resolveShorthand(prop)
          const propKey = classNameByProp.get(key) || hypenateProperty(key)
          return { className: `${propKey}_${withoutSpace(value)}` }
        },
        resolveShorthand,
      },
    })

    export const css = /* @__PURE__ */ Object.assign(
      function css(...styles) {
        if (styles.length === 1 && isObject(styles[0])) return serializeCss(styles[0])
        return serializeCss(mergeCss(...styles))
      },
      {
        raw: function cssRaw(...styles) {
          return mergeCss(...styles)
        },
      },
    )

    export { mergeCss, assignCss }
    "#);
    assert_snapshot!(file(css, "css/css.d.mts"), @"
    import type { SystemStyleObject } from '../types/system.d.mts';

    type Styles = SystemStyleObject | undefined | null | false

    interface CssRawFunction {
      (styles: Styles): SystemStyleObject
      (styles: Styles[]): SystemStyleObject
      (...styles: Array<Styles | Styles[]>): SystemStyleObject
      (styles: Styles): SystemStyleObject
    }

    interface CssFunction {
      (styles: Styles): string
      (styles: Styles[]): string
      (...styles: Array<Styles | Styles[]>): string
      (styles: Styles): string

      raw: CssRawFunction
    }

    export declare const css: CssFunction;
    ");
}

#[test]
fn guards_empty_utility_metadata() {
    let artifacts = ArtifactGraph.generate_with_input(
        &CodegenInput::default(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            import_extensions: true,
        },
    );
    let css = artifact(&artifacts, ArtifactId::Css);
    let runtime = file(css, "css/css.mjs");

    assert!(runtime.contains("const utilities = \"\""));
    assert!(runtime.contains("if (utilities) {\n  utilities.split(\",\").forEach((utility) => {"));
}

#[test]
fn emits_template_literal_css_runtime_and_declarations() {
    let mut input = input();
    input.config.syntax = CssSyntaxKind::TemplateLiteral;
    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Mjs,
            import_extensions: true,
        },
    );
    let css = artifact(&artifacts, ArtifactId::Css);

    assert_eq!(paths(css), vec!["css/css.mjs", "css/css.d.mts"]);
    assert_snapshot!(file(css, "css/css.mjs"), @r#"
    import { createCssRuntime, isObject, mergeProps, withoutSpace } from '../helpers.mjs';
    import { finalizeConditions, sortConditions } from './conditions.mjs';

    const newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g
    const ruleClean = /\/\*[^]*?\*\/|  +/g
    const ruleNewline = /\n+/g

    const astish = (val, tree = [{}]) => {
      if (!val) return tree[0]
      val = val.replace(ruleClean, "")
      newRule.lastIndex = 0
      let block
      let left
      while ((block = newRule.exec(val))) {
        if (block[4]) tree.shift()
        else if (block[3]) {
          left = block[3].replace(ruleNewline, " ").trim()
          if (!left.includes("&") && !left.startsWith("@")) left = "& " + left
          tree.unshift(tree[0][left] = tree[0][left] || {})
        } else {
          tree[0][block[1]] = block[2].replace(ruleNewline, " ").trim()
        }
      }
      return tree[0]
    }

    const { serializeCss, mergeCss, assignCss } = createCssRuntime({
      hash: false,
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: [] },
      },
      utility: {
        prefix: null,
        hasShorthand: false,
        toHash(path, hashFn) {
          return hashFn(path.join(":"))
        },
        transform(prop, value) {
          return { className: `${prop}_${withoutSpace(value)}` }
        },
        resolveShorthand(prop) {
          return prop
        },
      },
    })
    const templateCache = new WeakMap()
    const toStyleObject = (style) => {
      if (isObject(style)) return style
      let cached = templateCache.get(style)
      if (!cached) {
        cached = astish(style[0])
        templateCache.set(style, cached)
      }
      return cached
    }

    function mergeTemplateStyles(styles) {
      let out
      for (let i = 0; i < styles.length; i++) {
        const style = styles[i]
        if (!style) continue
        const next = toStyleObject(style)
        out = out ? mergeProps(out, next) : next
      }
      return out || {}
    }

    export const css = /* @__PURE__ */ Object.assign(
      function css(...styles) {
        return serializeCss(mergeTemplateStyles(arguments))
      },
      {
        raw: function cssRaw(...styles) {
          return mergeTemplateStyles(arguments)
        },
      },
    )

    export { mergeCss, assignCss }
    "#);
    assert_snapshot!(file(css, "css/css.d.mts"), @"
    type CssTemplate = { raw: readonly string[] | ArrayLike<string> }

    interface CssRawFunction {
      (template: CssTemplate): Record<string, any>
    }

    interface CssFunction {
      (template: CssTemplate): string

      raw: CssRawFunction
    }

    export declare const css: CssFunction;
    ");
}
