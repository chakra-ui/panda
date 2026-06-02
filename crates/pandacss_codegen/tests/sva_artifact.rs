mod common;

use common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions, ModuleSpecifierPolicy};
use pandacss_config::CodegenFormat;

#[test]
fn emits_ts_source_sva() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        specifiers: ModuleSpecifierPolicy::Extensionless,
    });
    let sva = artifact(&artifacts, ArtifactId::Sva);

    assert_eq!(paths(sva), vec!["css/sva.ts"]);
    assert_snapshot!(file(sva, "css/sva.ts"), @"
    import { getSlotRecipes, memo, splitProps, toVariantMap, withDefaults } from '../helpers';
    import { cva } from './cva';
    import { cx } from './cx';
    import type { SlotRecipeCreatorFn } from '../types/recipe';

    export const sva: SlotRecipeCreatorFn = (config) => {
      const slotRecipes = getSlotRecipes(config)
      const slots: Array<[string, any]> = []
      for (const slot in slotRecipes) slots.push([slot, cva(slotRecipes[slot])])

      const defaultVariants = config.defaultVariants ?? {}

      const classNameMap: Record<string, any> = {}
      if (config.className) {
        for (const [slot, slotFn] of slots) classNameMap[slot] = slotFn.config.className
      }

      const variants = config.variants ?? {}
      const variantKeys = Object.keys(variants)
      const variantMap = toVariantMap(variants)

      const svaFn = (props: Record<string, any>) => {
        const result: Record<string, any> = {}
        for (const [slot, slotFn] of slots) result[slot] = cx(slotFn(props), classNameMap[slot])
        return result
      }

      const raw = (props: Record<string, any>) => {
        const result: Record<string, any> = {}
        for (const [slot, slotFn] of slots) result[slot] = slotFn.raw(props)
        return result
      }

      return Object.assign(memo(svaFn), {
        __cva__: false,
        raw,
        config,
        variantMap,
        variantKeys,
        classNameMap,
        splitVariantProps(props: Record<string, any>) {
          return splitProps(props, variantKeys)
        },
        getVariantProps(props: Record<string, any>) {
          return withDefaults(defaultVariants, props)
        },
      })
    }
    ");
}

#[test]
fn emits_js_runtime_and_declarations() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Mjs,
        specifiers: ModuleSpecifierPolicy::RuntimeAndTypes,
    });
    let sva = artifact(&artifacts, ArtifactId::Sva);

    assert_eq!(paths(sva), vec!["css/sva.mjs", "css/sva.d.mts"]);
    assert_snapshot!(file(sva, "css/sva.mjs"), @"
    import { getSlotRecipes, memo, splitProps, toVariantMap, withDefaults } from '../helpers.mjs';
    import { cva } from './cva.mjs';
    import { cx } from './cx.mjs';

    export const sva = (config) => {
      const slotRecipes = getSlotRecipes(config)
      const slots = []
      for (const slot in slotRecipes) slots.push([slot, cva(slotRecipes[slot])])

      const defaultVariants = config.defaultVariants ?? {}

      const classNameMap = {}
      if (config.className) {
        for (const [slot, slotFn] of slots) classNameMap[slot] = slotFn.config.className
      }

      const variants = config.variants ?? {}
      const variantKeys = Object.keys(variants)
      const variantMap = toVariantMap(variants)

      const svaFn = (props) => {
        const result = {}
        for (const [slot, slotFn] of slots) result[slot] = cx(slotFn(props), classNameMap[slot])
        return result
      }

      const raw = (props) => {
        const result = {}
        for (const [slot, slotFn] of slots) result[slot] = slotFn.raw(props)
        return result
      }

      return Object.assign(memo(svaFn), {
        __cva__: false,
        raw,
        config,
        variantMap,
        variantKeys,
        classNameMap,
        splitVariantProps(props) {
          return splitProps(props, variantKeys)
        },
        getVariantProps(props) {
          return withDefaults(defaultVariants, props)
        },
      })
    }
    ");
    assert_snapshot!(file(sva, "css/sva.d.mts"), @"
    import type { SlotRecipeCreatorFn } from '../types/recipe.d.mts';

    export declare const sva: SlotRecipeCreatorFn;
    ");
}
