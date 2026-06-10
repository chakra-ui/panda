use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions};
use pandacss_config::{CodegenFormat, TypeData, UserConfig};

fn config() -> UserConfig {
    serde_json::from_value(serde_json::json!({
        "theme": {
            "breakpoints": {
                "sm": "30rem"
            },
            "recipes": {
                "button": {
                    "className": "btn",
                    "defaultVariants": {
                        "size": "sm"
                    },
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        },
                        "disabled": {
                            "true": { "opacity": 0.5 },
                            "false": {}
                        }
                    },
                    "compoundVariants": [
                        {
                            "size": ["sm", "md"],
                            "disabled": true,
                            "css": { "boxShadow": "md" }
                        }
                    ]
                }
            },
            "slotRecipes": {
                "card": {
                    "className": "card",
                    "slots": ["root", "label"],
                    "variants": {
                        "tone": {
                            "info": {
                                "root": { "color": "blue" },
                                "label": { "fontWeight": "600" }
                            },
                            "danger": {
                                "root": { "color": "red" }
                            }
                        }
                    },
                    "compoundVariants": [
                        {
                            "tone": "info",
                            "css": {
                                "root": { "boxShadow": "md" },
                                "label": { "fontWeight": "700" }
                            }
                        }
                    ]
                }
            }
        },
        "prefix": "p",
        "separator": "_"
    }))
    .expect("config should deserialize")
}

fn input() -> CodegenInput {
    let config = config();
    CodegenInput {
        types: TypeData {
            recipes: config.recipe_type_data(),
            ..TypeData::default()
        },
        config,
        ..CodegenInput::default()
    }
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "inline snapshots for the full recipe artifact"
)]
fn emits_ts_source_recipes() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let recipes = artifact(&artifacts, ArtifactId::Recipes);

    assert_eq!(
        paths(recipes),
        vec![
            "recipes/runtime.ts",
            "recipes/button.ts",
            "recipes/card.ts",
            "recipes/index.ts"
        ]
    );
    assert_snapshot!(file(recipes, "recipes/runtime.ts"), @r#"
    import { createCssRuntime, getCompoundVariantClassNames, getSlotCompoundVariant, memo, splitProps, toHash, uniq, withDefaults, withoutSpace } from '../helpers';
    import { breakpointKeys, finalizeConditions, sortConditions } from '../css/conditions';
    import { cx } from '../css/cx';

    function normalize(config: Record<string, any>) {
      const variantMap = config.variantMap ?? {}
      return {
        name: config.name,
        className: config.className ?? config.name,
        slots: config.slots ?? [],
        variantMap,
        variantKeys: Object.keys(variantMap),
        defaults: config.defaultVariants ?? {},
        compounds: config.compoundVariants ?? [],
      }
    }

    export function createRecipe(config: Record<string, any>) {
      const { name, className, variantMap, variantKeys, defaults, compounds } = normalize(config)
      const classPrefix = "p"

      const { serializeCss: recipeCss } = createCssRuntime({
        hash: false,
        conditions: {
          shift: sortConditions,
          finalize: finalizeConditions,
          breakpoints: { keys: breakpointKeys },
        },
        utility: {
          prefix: classPrefix,
          toHash,
          transform(prop: string, value: string) {
            return { className: value === "__ignore__" ? className : `${className}--${prop}_${withoutSpace(value)}` }
          },
        },
      })
      const formatClassName = (name: string) => {
        const next = false ? toHash(name) : name
        return classPrefix ? `${classPrefix}-${next}` : next
      }

      function resolve(props: Record<string, any> = {}) {
        const result = withDefaults(defaults, props)
        result[className] = "__ignore__"
        return result
      }

      function compoundClasses(props: Record<string, any>) {
        return getCompoundVariantClassNames(compounds, resolve(props), formatClassName)
      }

      const recipe = attach(memo(function recipeFn(props: Record<string, any> = {}, withCompoundVariants = true) {
        const recipeClass = recipeCss(resolve(props))
        if (!withCompoundVariants) return recipeClass
        const compoundsClass = compoundClasses(props)
        return cx(recipeClass, compoundsClass)
      }), name, variantKeys, variantMap, resolve)
      recipe.__recipe__ = true
      recipe.__getCompoundVariantCss__ = compoundClasses
      recipe.merge = function merge(other: any) {
        return mergeRecipes(recipe, other)
      }
      return recipe
    }

    export function createSlotRecipe(config: Record<string, any>) {
      const { name, className, slots, variantMap, variantKeys, defaults, compounds } = normalize(config)

      const slotFns = slots.map(function toSlotRecipe(slot: string) {
        return [slot, createRecipe({
          name,
          className: `${className}__${slot}`,
          variantMap,
          defaultVariants: defaults,
          compoundVariants: getSlotCompoundVariant(compounds, slot),
        })]
      })

      const recipe = memo(function slotRecipeFn(props: Record<string, any> = {}) {
        const result: Record<string, any> = {}
        for (const [slot, slotFn] of slotFns) result[slot] = slotFn(props)
        return result
      })
      attach(recipe, name, variantKeys, variantMap, function getVariantProps(props: Record<string, any> = {}) {
        return withDefaults(defaults, props)
      })
      recipe.__recipe__ = false
      recipe.classNameMap = {}
      return recipe
    }

    function mergeRecipes(recipeA: any, recipeB: any) {
      if (recipeA && !recipeB) return recipeA
      if (!recipeA && recipeB) return recipeB
      function merged(...args: any[]) {
        const classA = recipeA(...args)
        const classB = recipeB(...args)
        return classA && classB ? `${classA} ${classB}` : classA || classB
      }
      const variantKeys = uniq(recipeA.variantKeys, recipeB.variantKeys)
      const variantMap: Record<string, any> = {}
      for (const key of variantKeys) variantMap[key] = uniq(recipeA.variantMap[key], recipeB.variantMap[key])
      attach(merged, `${recipeA.__name__} ${recipeB.__name__}`, variantKeys, variantMap, function getVariantProps(props: any) {
        return props
      })
      merged.__recipe__ = true
      return merged
    }

    function attach(recipe: any, name: string, variantKeys: string[], variantMap: Record<string, any>, getVariantProps: any) {
      recipe.__name__ = name
      recipe.raw = function raw(props: any) {
        return props
      }
      recipe.variantKeys = variantKeys
      recipe.variantMap = variantMap
      recipe.splitVariantProps = function splitVariantProps(props: any) {
        return splitProps(props, variantKeys)
      }
      recipe.getVariantProps = getVariantProps
      return recipe
    }
    "#);
    assert_snapshot!(file(recipes, "recipes/button.ts"), @r#"
    import { createRecipe } from './runtime';
    import type { ConditionalValue } from '../types/system';
    import type { RecipeRuntimeFn, RecipeVariantMap } from '../types/recipe';

    export type ButtonVariant = {
      disabled?: boolean
      size?: "md" | "sm"
    }

    export type ButtonVariantProps = {
      [K in keyof ButtonVariant]?: ConditionalValue<ButtonVariant[K]>
    }

    export type ButtonVariantMap = RecipeVariantMap<ButtonVariant>

    export type ButtonRecipe = RecipeRuntimeFn<ButtonVariantProps, ButtonVariantMap>

    const buttonConfig = {"name":"button","className":"btn","defaultVariants":{"size":"sm"},"compoundVariants":[{"disabled":true,"size":["sm","md"],"className":"btn--compound__disabled_true__size_sm|md"}],"variantMap":{"disabled":["false","true"],"size":["md","sm"]}}

    export const button: ButtonRecipe = /* @__PURE__ */ createRecipe(buttonConfig)
    "#);
    assert_snapshot!(file(recipes, "recipes/card.ts"), @r#"
    import { createSlotRecipe } from './runtime';
    import type { ConditionalValue } from '../types/system';
    import type { SlotRecipeRuntimeFn, RecipeVariantMap } from '../types/recipe';

    export type CardVariant = {
      tone?: "danger" | "info"
    }

    export type CardVariantProps = {
      [K in keyof CardVariant]?: ConditionalValue<CardVariant[K]>
    }

    export type CardVariantMap = RecipeVariantMap<CardVariant>

    export type CardSlot = "root" | "label"

    export type CardRecipe = SlotRecipeRuntimeFn<CardSlot, CardVariantProps, CardVariantMap>

    const cardConfig = {"name":"card","slots":["root","label"],"compoundVariants":[{"tone":"info","classNames":{"root":"card__root--compound__tone_info","label":"card__label--compound__tone_info"}}],"variantMap":{"tone":["danger","info"]}}

    export const card: CardRecipe = /* @__PURE__ */ createSlotRecipe(cardConfig)
    "#);
    assert_snapshot!(file(recipes, "recipes/index.ts"), @r#"
    export * from './button';
    export * from './card';
    "#);
}

#[test]
fn emits_configured_separator_in_recipe_runtime() {
    let mut input = input();
    input.config.separator = "__".into();
    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let recipes = artifact(&artifacts, ArtifactId::Recipes);

    assert!(
        file(recipes, "recipes/runtime.ts")
            .contains("`${className}--${prop}__${withoutSpace(value)}`")
    );
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "inline snapshots for the full recipe artifact"
)]
fn emits_js_runtime_and_declarations() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            import_extensions: true,
        },
    );
    let recipes = artifact(&artifacts, ArtifactId::Recipes);

    assert_eq!(
        paths(recipes),
        vec![
            "recipes/runtime.mjs",
            "recipes/button.mjs",
            "recipes/button.d.mts",
            "recipes/card.mjs",
            "recipes/card.d.mts",
            "recipes/index.mjs",
            "recipes/index.d.mts"
        ]
    );
    assert_snapshot!(file(recipes, "recipes/runtime.mjs"), @r#"
    import { createCssRuntime, getCompoundVariantClassNames, getSlotCompoundVariant, memo, splitProps, toHash, uniq, withDefaults, withoutSpace } from '../helpers.mjs';
    import { breakpointKeys, finalizeConditions, sortConditions } from '../css/conditions.mjs';
    import { cx } from '../css/cx.mjs';

    function normalize(config) {
      const variantMap = config.variantMap ?? {}
      return {
        name: config.name,
        className: config.className ?? config.name,
        slots: config.slots ?? [],
        variantMap,
        variantKeys: Object.keys(variantMap),
        defaults: config.defaultVariants ?? {},
        compounds: config.compoundVariants ?? [],
      }
    }

    export function createRecipe(config) {
      const { name, className, variantMap, variantKeys, defaults, compounds } = normalize(config)
      const classPrefix = "p"

      const { serializeCss: recipeCss } = createCssRuntime({
        hash: false,
        conditions: {
          shift: sortConditions,
          finalize: finalizeConditions,
          breakpoints: { keys: breakpointKeys },
        },
        utility: {
          prefix: classPrefix,
          toHash,
          transform(prop, value) {
            return { className: value === "__ignore__" ? className : `${className}--${prop}_${withoutSpace(value)}` }
          },
        },
      })
      const formatClassName = (name) => {
        const next = false ? toHash(name) : name
        return classPrefix ? `${classPrefix}-${next}` : next
      }

      function resolve(props = {}) {
        const result = withDefaults(defaults, props)
        result[className] = "__ignore__"
        return result
      }

      function compoundClasses(props) {
        return getCompoundVariantClassNames(compounds, resolve(props), formatClassName)
      }

      const recipe = attach(memo(function recipeFn(props = {}, withCompoundVariants = true) {
        const recipeClass = recipeCss(resolve(props))
        if (!withCompoundVariants) return recipeClass
        const compoundsClass = compoundClasses(props)
        return cx(recipeClass, compoundsClass)
      }), name, variantKeys, variantMap, resolve)
      recipe.__recipe__ = true
      recipe.__getCompoundVariantCss__ = compoundClasses
      recipe.merge = function merge(other) {
        return mergeRecipes(recipe, other)
      }
      return recipe
    }

    export function createSlotRecipe(config) {
      const { name, className, slots, variantMap, variantKeys, defaults, compounds } = normalize(config)

      const slotFns = slots.map(function toSlotRecipe(slot) {
        return [slot, createRecipe({
          name,
          className: `${className}__${slot}`,
          variantMap,
          defaultVariants: defaults,
          compoundVariants: getSlotCompoundVariant(compounds, slot),
        })]
      })

      const recipe = memo(function slotRecipeFn(props = {}) {
        const result = {}
        for (const [slot, slotFn] of slotFns) result[slot] = slotFn(props)
        return result
      })
      attach(recipe, name, variantKeys, variantMap, function getVariantProps(props = {}) {
        return withDefaults(defaults, props)
      })
      recipe.__recipe__ = false
      recipe.classNameMap = {}
      return recipe
    }

    function mergeRecipes(recipeA, recipeB) {
      if (recipeA && !recipeB) return recipeA
      if (!recipeA && recipeB) return recipeB
      function merged(...args) {
        const classA = recipeA(...args)
        const classB = recipeB(...args)
        return classA && classB ? `${classA} ${classB}` : classA || classB
      }
      const variantKeys = uniq(recipeA.variantKeys, recipeB.variantKeys)
      const variantMap = {}
      for (const key of variantKeys) variantMap[key] = uniq(recipeA.variantMap[key], recipeB.variantMap[key])
      attach(merged, `${recipeA.__name__} ${recipeB.__name__}`, variantKeys, variantMap, function getVariantProps(props) {
        return props
      })
      merged.__recipe__ = true
      return merged
    }

    function attach(recipe, name, variantKeys, variantMap, getVariantProps) {
      recipe.__name__ = name
      recipe.raw = function raw(props) {
        return props
      }
      recipe.variantKeys = variantKeys
      recipe.variantMap = variantMap
      recipe.splitVariantProps = function splitVariantProps(props) {
        return splitProps(props, variantKeys)
      }
      recipe.getVariantProps = getVariantProps
      return recipe
    }
    "#);
    assert_snapshot!(file(recipes, "recipes/button.mjs"), @r#"
    import { createRecipe } from './runtime.mjs';

    const buttonConfig = {"name":"button","className":"btn","defaultVariants":{"size":"sm"},"compoundVariants":[{"disabled":true,"size":["sm","md"],"className":"btn--compound__disabled_true__size_sm|md"}],"variantMap":{"disabled":["false","true"],"size":["md","sm"]}}

    export const button = /* @__PURE__ */ createRecipe(buttonConfig)
    "#);
    assert_snapshot!(file(recipes, "recipes/button.d.mts"), @r#"
    import type { ConditionalValue } from '../types/system.d.mts';
    import type { RecipeRuntimeFn, RecipeVariantMap } from '../types/recipe.d.mts';

    export type ButtonVariant = {
      disabled?: boolean
      size?: "md" | "sm"
    }

    export type ButtonVariantProps = {
      [K in keyof ButtonVariant]?: ConditionalValue<ButtonVariant[K]>
    }

    export type ButtonVariantMap = RecipeVariantMap<ButtonVariant>

    export type ButtonRecipe = RecipeRuntimeFn<ButtonVariantProps, ButtonVariantMap>

    export declare const button: ButtonRecipe;
    "#);
    assert_snapshot!(file(recipes, "recipes/card.mjs"), @r#"
    import { createSlotRecipe } from './runtime.mjs';

    const cardConfig = {"name":"card","slots":["root","label"],"compoundVariants":[{"tone":"info","classNames":{"root":"card__root--compound__tone_info","label":"card__label--compound__tone_info"}}],"variantMap":{"tone":["danger","info"]}}

    export const card = /* @__PURE__ */ createSlotRecipe(cardConfig)
    "#);
    assert_snapshot!(file(recipes, "recipes/card.d.mts"), @r#"
    import type { ConditionalValue } from '../types/system.d.mts';
    import type { SlotRecipeRuntimeFn, RecipeVariantMap } from '../types/recipe.d.mts';

    export type CardVariant = {
      tone?: "danger" | "info"
    }

    export type CardVariantProps = {
      [K in keyof CardVariant]?: ConditionalValue<CardVariant[K]>
    }

    export type CardVariantMap = RecipeVariantMap<CardVariant>

    export type CardSlot = "root" | "label"

    export type CardRecipe = SlotRecipeRuntimeFn<CardSlot, CardVariantProps, CardVariantMap>

    export declare const card: CardRecipe;
    "#);
    assert_snapshot!(file(recipes, "recipes/index.mjs"), @r#"
    export * from './button.mjs';
    export * from './card.mjs';
    "#);
    assert_snapshot!(file(recipes, "recipes/index.d.mts"), @r#"
    export * from './button.d.mts';
    export * from './card.d.mts';
    "#);
}

#[test]
fn wires_class_name_hash_into_runtime() {
    let config: UserConfig = serde_json::from_value(serde_json::json!({
        "hash": true,
        "theme": {
            "recipes": {
                "button": {
                    "className": "btn",
                    "variants": {
                        "size": { "sm": { "fontSize": "12px" } }
                    }
                }
            }
        }
    }))
    .expect("config should deserialize");

    let input = CodegenInput {
        types: TypeData {
            recipes: config.recipe_type_data(),
            ..TypeData::default()
        },
        config,
        ..CodegenInput::default()
    };

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let recipes = artifact(&artifacts, ArtifactId::Recipes);

    assert!(file(recipes, "recipes/runtime.ts").contains("hash: true"));
}
