use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::{CodegenFormat, CssSyntaxKind, UserConfig};

#[test]
fn emits_ts_source_cva() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    let cva = artifact(&artifacts, ArtifactId::Cva);

    assert_eq!(paths(cva), vec!["css/cva.ts"]);
    assert_snapshot!(file(cva, "css/cva.ts"), @"
    import { getCompoundVariantCss, memo, mergeProps, splitProps, toVariantMap, uniq, withDefaults } from '../helpers';
    import { css, mergeCss } from './css';
    import type { RecipeCreatorFn } from '../types/recipe';

    export const cva: RecipeCreatorFn = (config) => {
      const defaults = (c: Record<string, any>) => ({ base: {}, variants: {}, defaultVariants: {}, compoundVariants: [], ...c })
      const { base, variants, defaultVariants, compoundVariants } = defaults(config)

      const getVariantProps = (props: Record<string, any>) => withDefaults(defaultVariants, props)

      const resolve = (props: Record<string, any> = {}) => {
        const computed = getVariantProps(props)
        const styles = [base]
        for (const key in computed) {
          const value = computed[key]
          if (variants[key]?.[value]) styles.push(variants[key][value])
        }
        styles.push(getCompoundVariantCss(compoundVariants, computed))
        return mergeCss(...styles)
      }

      const variantKeys = Object.keys(variants)
      const variantMap = toVariantMap(variants)

      const merge = (other: Record<string, any>) => {
        const override = defaults(other.config)
        const keys = uniq(other.variantKeys, variantKeys)
        return cva({
          base: mergeCss(base, override.base),
          variants: Object.fromEntries(keys.map((key) => [key, mergeCss(variants[key], override.variants[key])])),
          defaultVariants: mergeProps(defaultVariants, override.defaultVariants),
          compoundVariants: [...compoundVariants, ...override.compoundVariants],
        })
      }

      return Object.assign(memo(function cvaFn(props: Record<string, any>) {
        return css(resolve(props))
      }), {
        __cva__: true,
        variantMap,
        variantKeys,
        raw: resolve,
        config,
        merge,
        splitVariantProps(props: Record<string, any>) {
          return splitProps(props, variantKeys)
        },
        getVariantProps,
      })
    }
    ");
}

#[test]
fn emits_js_runtime_and_declarations() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Mjs,
        import_extensions: true,
    });
    let cva = artifact(&artifacts, ArtifactId::Cva);

    assert_eq!(paths(cva), vec!["css/cva.mjs", "css/cva.d.mts"]);
    assert_snapshot!(file(cva, "css/cva.mjs"), @"
    import { getCompoundVariantCss, memo, mergeProps, splitProps, toVariantMap, uniq, withDefaults } from '../helpers.mjs';
    import { css, mergeCss } from './css.mjs';

    export const cva = (config) => {
      const defaults = (c) => ({ base: {}, variants: {}, defaultVariants: {}, compoundVariants: [], ...c })
      const { base, variants, defaultVariants, compoundVariants } = defaults(config)

      const getVariantProps = (props) => withDefaults(defaultVariants, props)

      const resolve = (props = {}) => {
        const computed = getVariantProps(props)
        const styles = [base]
        for (const key in computed) {
          const value = computed[key]
          if (variants[key]?.[value]) styles.push(variants[key][value])
        }
        styles.push(getCompoundVariantCss(compoundVariants, computed))
        return mergeCss(...styles)
      }

      const variantKeys = Object.keys(variants)
      const variantMap = toVariantMap(variants)

      const merge = (other) => {
        const override = defaults(other.config)
        const keys = uniq(other.variantKeys, variantKeys)
        return cva({
          base: mergeCss(base, override.base),
          variants: Object.fromEntries(keys.map((key) => [key, mergeCss(variants[key], override.variants[key])])),
          defaultVariants: mergeProps(defaultVariants, override.defaultVariants),
          compoundVariants: [...compoundVariants, ...override.compoundVariants],
        })
      }

      return Object.assign(memo(function cvaFn(props) {
        return css(resolve(props))
      }), {
        __cva__: true,
        variantMap,
        variantKeys,
        raw: resolve,
        config,
        merge,
        splitVariantProps(props) {
          return splitProps(props, variantKeys)
        },
        getVariantProps,
      })
    }
    ");
    assert_snapshot!(file(cva, "css/cva.d.mts"), @"
    import type { RecipeCreatorFn } from '../types/recipe.d.mts';

    export declare const cva: RecipeCreatorFn;
    ");
}

#[test]
fn template_literal_syntax_skips_cva_artifact() {
    let config = UserConfig {
        syntax: CssSyntaxKind::TemplateLiteral,
        ..Default::default()
    };
    let artifacts = ArtifactGraph.generate_with_config(&config, GenerateOptions::default());
    let cva = artifact(&artifacts, ArtifactId::Cva);

    assert!(paths(cva).is_empty());
}
