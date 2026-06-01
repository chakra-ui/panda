mod common;

use std::collections::BTreeMap;

use common::{artifact, file, paths};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_codegen::{
    ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions, ModuleSpecifierPolicy,
};
use pandacss_config::{
    CodegenFormat, ConditionTypeData, PatternPropertyTypeData, PatternPropertyTypeKind,
    PatternTypeData, PatternTypeDefinition, PrimitiveType, RecipeTypeData, RecipeTypeDefinition,
    SlotRecipeTypeDefinition, TokenCategoryTypeData, TokenTypeData, TypeData,
    UtilityPropertyTypeData, UtilityTypeData, ValueAliasTypeData, ValueTypePart, VariantTypeData,
};

fn input() -> CodegenInput {
    CodegenInput {
        types: TypeData {
            conditions: ConditionTypeData {
                keys: vec!["base".into(), "_hover".into()],
                breakpoints: vec!["base".into(), "sm".into()],
            },
            tokens: token_type_data(),
            utilities: utility_type_data(),
            patterns: pattern_type_data(),
            recipes: recipe_type_data(),
            ..TypeData::default()
        },
        ..CodegenInput::default()
    }
}

fn strict_input() -> CodegenInput {
    let mut input = input();
    input.types.options.strict_tokens = true;
    input.types.options.strict_property_values = true;
    input
}

fn token_type_data() -> TokenTypeData {
    TokenTypeData {
        categories: BTreeMap::from([
            (
                "colors".into(),
                TokenCategoryTypeData {
                    name: "colors".into(),
                    type_name: "ColorToken".into(),
                    values: vec!["red.500".into(), "blue.500".into()],
                },
            ),
            (
                "spacing".into(),
                TokenCategoryTypeData {
                    name: "spacing".into(),
                    type_name: "SpacingToken".into(),
                    values: vec!["1".into(), "2".into()],
                },
            ),
        ]),
        color_palettes: vec!["red".into(), "blue".into()],
        ..TokenTypeData::default()
    }
}

fn utility_type_data() -> UtilityTypeData {
    UtilityTypeData {
        properties: BTreeMap::from([
            (
                "color".into(),
                UtilityPropertyTypeData {
                    name: "color".into(),
                    css_property: Some("color".into()),
                    token_category: Some("colors".into()),
                    alias: "ColorValue".into(),
                    ..UtilityPropertyTypeData::default()
                },
            ),
            (
                "gap".into(),
                UtilityPropertyTypeData {
                    name: "gap".into(),
                    css_property: Some("gap".into()),
                    token_category: Some("spacing".into()),
                    alias: "SpacingValue".into(),
                    ..UtilityPropertyTypeData::default()
                },
            ),
        ]),
        aliases: BTreeMap::from([
            (
                "ColorValue".into(),
                ValueAliasTypeData {
                    name: "ColorValue".into(),
                    parts: vec![
                        ValueTypePart::TokenCategory("colors".into()),
                        ValueTypePart::CssProperty("color".into()),
                        ValueTypePart::CssVars,
                        ValueTypePart::AnyString,
                    ],
                },
            ),
            (
                "SpacingValue".into(),
                ValueAliasTypeData {
                    name: "SpacingValue".into(),
                    parts: vec![
                        ValueTypePart::TokenCategory("spacing".into()),
                        ValueTypePart::CssProperty("gap".into()),
                        ValueTypePart::CssVars,
                        ValueTypePart::AnyString,
                        ValueTypePart::AnyNumber,
                    ],
                },
            ),
        ]),
        ..UtilityTypeData::default()
    }
}

fn pattern_type_data() -> PatternTypeData {
    PatternTypeData {
        patterns: BTreeMap::from([(
            "stack".into(),
            PatternTypeDefinition {
                name: "stack".into(),
                type_name: "Stack".into(),
                properties: BTreeMap::from([
                    (
                        "align".into(),
                        PatternPropertyTypeData {
                            name: "align".into(),
                            description: Some("Align items".into()),
                            kind: PatternPropertyTypeKind::Enum {
                                values: vec!["start".into(), "center".into()],
                            },
                        },
                    ),
                    (
                        "gap".into(),
                        PatternPropertyTypeData {
                            name: "gap".into(),
                            description: None,
                            kind: PatternPropertyTypeKind::Token {
                                category: "spacing".into(),
                                property: Some("gap".into()),
                            },
                        },
                    ),
                    (
                        "unstyled".into(),
                        PatternPropertyTypeData {
                            name: "unstyled".into(),
                            description: None,
                            kind: PatternPropertyTypeKind::Primitive {
                                primitive: PrimitiveType::Boolean,
                            },
                        },
                    ),
                ]),
                ..PatternTypeDefinition::default()
            },
        )]),
    }
}

fn recipe_type_data() -> RecipeTypeData {
    RecipeTypeData {
        recipes: BTreeMap::from([(
            "button".into(),
            RecipeTypeDefinition {
                name: "button".into(),
                type_name: "Button".into(),
                variants: BTreeMap::from([
                    (
                        "size".into(),
                        VariantTypeData {
                            values: vec!["sm".into(), "md".into()],
                            allows_boolean: false,
                        },
                    ),
                    (
                        "disabled".into(),
                        VariantTypeData {
                            values: vec!["true".into(), "false".into()],
                            allows_boolean: true,
                        },
                    ),
                ]),
            },
        )]),
        slot_recipes: BTreeMap::from([(
            "card".into(),
            SlotRecipeTypeDefinition {
                name: "card".into(),
                type_name: "Card".into(),
                slots: vec!["root".into(), "label".into()],
                variants: BTreeMap::from([(
                    "tone".into(),
                    VariantTypeData {
                        values: vec!["info".into(), "danger".into()],
                        allows_boolean: false,
                    },
                )]),
            },
        )]),
    }
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "inline snapshot for the full types artifact"
)]
fn emits_ts_source_types() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);

    assert_eq!(
        paths(types),
        vec![
            "types/conditions.ts",
            "types/selectors.ts",
            "types/csstype.ts",
            "types/tokens.ts",
            "types/values.ts",
            "types/properties.ts",
            "types/system-types.ts",
            "types/pattern.ts",
            "types/recipe.ts",
            "types/index.ts"
        ]
    );

    assert_eq!(
        file(types, "types/conditions.ts"),
        indoc! {r#"
        export interface Conditions {
          "base": string
          "_hover": string
        }

        export interface Breakpoints {
          "base": string
          "sm": string
        }

        export type Condition = keyof Conditions

        export type ConditionalValue<T> =
          | T
          | Array<T | null>
          | { [K in Condition]?: ConditionalValue<T> }
        "#}
        .trim()
    );

    assert_eq!(
        file(types, "types/tokens.ts"),
        indoc! {r#"
        export type ColorToken = "red.500" | "blue.500"

        export type SpacingToken = "1" | "2"

        export interface Tokens {
          colors: ColorToken
          spacing: SpacingToken
        }

        export type ColorPalette = "red" | "blue"

        export type TokenValue<T extends keyof Tokens> = Tokens[T]
        "#}
        .trim()
    );

    assert_eq!(
        file(types, "types/properties.ts"),
        indoc! {r"
        import type { ConditionalValue } from './conditions';

        import type { AnyNumber, AnyString, CssVars, ColorValue, SpacingValue } from './values';

        export type CssVarValue = ConditionalValue<CssVars | AnyString | AnyNumber>

        export type CssVarProperties = {
          [K in `--${string}`]?: CssVarValue
        }

        export interface SystemProperties {
          color?: ConditionalValue<ColorValue>
          gap?: ConditionalValue<SpacingValue>
        }
        "}
        .trim()
    );

    assert_snapshot!(file(types, "types/recipe.ts"), @"
    import type { Pretty, SystemStyleObject } from './system-types';

    export type RecipeVariantProps<T> = T extends (props?: infer Props) => unknown ? Props : never

    export type RecipeVariant<T> = Pretty<Required<NonNullable<RecipeVariantProps<T>>>>

    export type RecipeVariantMap<Variant extends object> = {
      [K in keyof Variant]-?: Array<Variant[K]>
    }

    export type RecipeRuntimeFn<Props extends object = object, Map extends object = object> = ((props?: Props) => string) & {
      __type: Props
      variantMap: Map
      variantKeys: Array<keyof Props>
      raw: (props?: Props) => SystemStyleObject
      splitVariantProps<T extends Record<string, any>>(props: T): [Props, Pretty<Omit<T, keyof Props>>]
      getVariantProps: (props?: Props) => Props
      merge(recipe: RecipeRuntimeFn): RecipeRuntimeFn
    }

    export type SlotRecord<Slot extends string, Value> = Partial<Record<Slot, Value>>

    export type SlotRecipeRuntimeFn<Slot extends string, Props extends object = object, Map extends object = object> = ((props?: Props) => SlotRecord<Slot, string>) & {
      __type: Props
      __slot: Slot
      variantMap: Map
      variantKeys: Array<keyof Props>
      raw: (props?: Props) => Record<Slot, SystemStyleObject>
      splitVariantProps<T extends Record<string, any>>(props: T): [Props, Pretty<Omit<T, keyof Props>>]
      getVariantProps: (props?: Props) => Props
    }

    export type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

    export type RecipeVariantRecord = Record<string, Record<string, SystemStyleObject>>

    export type RecipeSelection<T extends RecipeVariantRecord> = {
      [K in keyof T]?: StringToBoolean<keyof T[K]>
    }

    export interface RecipeDefinition<T extends RecipeVariantRecord = RecipeVariantRecord> {
      base?: SystemStyleObject
      variants?: T
      defaultVariants?: RecipeSelection<T>
      compoundVariants?: Array<RecipeSelection<T> & { css: SystemStyleObject }>
    }

    export type RecipeCreatorFn = <T extends RecipeVariantRecord>(
      config: RecipeDefinition<T>,
    ) => RecipeRuntimeFn<RecipeSelection<T>, { [K in keyof T]: Array<keyof T[K]> }>

    export type SlotRecipeVariantRecord<Slot extends string> = Record<string, Record<string, SlotRecord<Slot, SystemStyleObject>>>

    export interface SlotRecipeDefinition<Slot extends string = string, T extends SlotRecipeVariantRecord<Slot> = SlotRecipeVariantRecord<Slot>> {
      className?: string
      slots: Slot[]
      base?: SlotRecord<Slot, SystemStyleObject>
      variants?: T
      defaultVariants?: RecipeSelection<T>
      compoundVariants?: Array<RecipeSelection<T> & { css: SlotRecord<Slot, SystemStyleObject> }>
    }

    export type SlotRecipeCreatorFn = <Slot extends string, T extends SlotRecipeVariantRecord<Slot>>(
      config: SlotRecipeDefinition<Slot, T>,
    ) => SlotRecipeRuntimeFn<Slot, RecipeSelection<T>, { [K in keyof T]: Array<keyof T[K]> }>
    ");
}

#[test]
fn emits_ts_system_and_index_types() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);

    assert_eq!(
        file(types, "types/system-types.ts"),
        indoc! {r#"
        import type { Condition } from './conditions';

        import type { Selector } from './selectors';

        import type { CssProperties } from './csstype';

        import type { CssVarProperties, SystemProperties } from './properties';

        export type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

        export type NestedSelectors = {
          [K in Selector]?: SystemStyleObject
        }

        export type NestedConditions = {
          [K in Condition]?: SystemStyleObject
        }

        export type NestedArbitrary = {
          [K in `&${string}` | `@${string}`]?: SystemStyleObject
        }

        export interface SystemStyleObject extends SystemProperties, CssVarProperties, NestedSelectors, NestedConditions, NestedArbitrary {}

        export interface GlobalStyleObject {
          [selector: string]: SystemStyleObject
        }

        export interface CssKeyframes {
          [name: string]: {
            [time: string]: CssProperties
          }
        }

        export interface GlobalFontfaceRule {
          fontFamily: string
          src: string
          fontStyle?: string
          fontWeight?: string | number
          fontDisplay?: "auto" | "block" | "swap" | "fallback" | "optional"
          unicodeRange?: string
          fontFeatureSettings?: string
          fontVariationSettings?: string
          fontStretch?: string
          ascentOverride?: string
          descentOverride?: string
          lineGapOverride?: string
          sizeAdjust?: string
        }

        export type FontfaceRule = Omit<GlobalFontfaceRule, "fontFamily">

        export interface GlobalFontface {
          [name: string]: FontfaceRule | FontfaceRule[]
        }
        "#}
        .trim()
    );

    assert_eq!(
        file(types, "types/index.ts"),
        indoc! {r"
        export type * from './conditions';

        export type * from './selectors';

        export type * from './tokens';

        export type * from './values';

        export type * from './properties';

        export type * from './system-types';

        export type * from './pattern';

        export type * from './recipe';

        export type { CssProperties } from './csstype';
        "}
        .trim()
    );
}

#[test]
fn emits_js_declaration_types() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Js,
            ..GenerateOptions::default()
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);

    assert_eq!(
        paths(types),
        vec![
            "types/conditions.d.ts",
            "types/selectors.d.ts",
            "types/csstype.d.ts",
            "types/tokens.d.ts",
            "types/values.d.ts",
            "types/properties.d.ts",
            "types/system-types.d.ts",
            "types/pattern.d.ts",
            "types/recipe.d.ts",
            "types/index.d.ts"
        ]
    );

    assert_eq!(
        file(types, "types/values.d.ts"),
        indoc! {r#"
        import type { CssProperties } from './csstype';

        import type { TokenValue } from './tokens';

        export type AnyString = string & {}

        export type AnyNumber = number & {}

        export type CssVars = `var(--${string})`

        export type WithEscapeHatch<T> = T | `[${string}]`

        export type OnlyKnown<Value> = Value extends boolean ? Value : Value extends `${infer _}` ? Value : never

        export type ColorValue = TokenValue<"colors"> | CssProperties["color"] | CssVars | AnyString

        export type SpacingValue = TokenValue<"spacing"> | CssProperties["gap"] | CssVars | AnyString | AnyNumber
        "#}
        .trim()
    );

    assert_eq!(
        file(types, "types/pattern.d.ts"),
        indoc! {r"
        import type { ConditionalValue } from './conditions';

        import type { SystemProperties } from './properties';

        import type { SystemStyleObject } from './system-types';

        export type PatternPrimitive = string | number | boolean

        export type PatternPropertyValue<Property extends keyof SystemProperties> = SystemProperties[Property]

        export type PatternTokenValue<Value> = ConditionalValue<Value>

        export interface PatternHelpers {
          map(value: unknown, fn: (value: string) => string | undefined): unknown
          isCssUnit(value: unknown): boolean
          isCssVar(value: unknown): boolean
          isCssFunction(value: unknown): boolean
        }

        export interface PatternConfig<Props extends object = object> {
          properties?: Props
          defaultValues?: Partial<Props> | ((props: Props) => Partial<Props>)
          transform?: (props: Props, helpers: PatternHelpers) => SystemStyleObject
          strict?: boolean
          blocklist?: Array<keyof SystemProperties>
        }

        export interface PatternRuntimeConfig<Props extends object = object> extends PatternConfig<Props> {
          transform: (props: Props, helpers: PatternHelpers) => SystemStyleObject
        }
        "}
        .trim()
    );
}

#[test]
fn emits_strict_value_types_without_repeating_large_unions() {
    let artifacts = ArtifactGraph.generate_with_input(
        &strict_input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);

    assert_eq!(
        file(types, "types/values.ts"),
        indoc! {r#"
        import type { CssProperties } from './csstype';

        import type { TokenValue } from './tokens';

        export type AnyString = string & {}

        export type AnyNumber = number & {}

        export type CssVars = `var(--${string})`

        export type WithEscapeHatch<T> = T | `[${string}]`

        export type OnlyKnown<Value> = Value extends boolean ? Value : Value extends `${infer _}` ? Value : never

        export type ColorValue = WithEscapeHatch<TokenValue<"colors"> | CssVars>

        export type SpacingValue = WithEscapeHatch<TokenValue<"spacing"> | CssVars>
        "#}
        .trim()
    );

    assert_eq!(
        file(types, "types/properties.ts"),
        indoc! {r"
        import type { ConditionalValue } from './conditions';

        import type { AnyNumber, AnyString, CssVars, ColorValue, SpacingValue } from './values';

        export type CssVarValue = ConditionalValue<CssVars | AnyString | AnyNumber>

        export type CssVarProperties = {
          [K in `--${string}`]?: CssVarValue
        }

        export interface SystemProperties {
          color?: ConditionalValue<ColorValue>
          gap?: ConditionalValue<SpacingValue>
        }
        "}
        .trim()
    );
}

#[test]
fn can_emit_extensioned_type_specifiers() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            specifiers: ModuleSpecifierPolicy::RuntimeAndTypes,
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);

    assert_eq!(
        file(types, "types/values.d.mts"),
        indoc! {r#"
        import type { CssProperties } from './csstype.d.mts';

        import type { TokenValue } from './tokens.d.mts';

        export type AnyString = string & {}

        export type AnyNumber = number & {}

        export type CssVars = `var(--${string})`

        export type WithEscapeHatch<T> = T | `[${string}]`

        export type OnlyKnown<Value> = Value extends boolean ? Value : Value extends `${infer _}` ? Value : never

        export type ColorValue = TokenValue<"colors"> | CssProperties["color"] | CssVars | AnyString

        export type SpacingValue = TokenValue<"spacing"> | CssProperties["gap"] | CssVars | AnyString | AnyNumber
        "#}
        .trim()
    );

    assert_eq!(
        file(types, "types/index.d.mts"),
        indoc! {r"
        export * from './conditions.d.mts';

        export * from './selectors.d.mts';

        export * from './tokens.d.mts';

        export * from './values.d.mts';

        export * from './properties.d.mts';

        export * from './system-types.d.mts';

        export * from './pattern.d.mts';

        export * from './recipe.d.mts';

        export { CssProperties } from './csstype.d.mts';
        "}
        .trim()
    );
}

#[test]
fn csstype_module_exposes_keyword_unions_and_pseudos() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);
    let csstype = file(types, "types/csstype.ts");

    // Public surface the rest of the generated types depend on: `properties`
    // indexes `CssProperties["..."]` and `selectors` imports `Pseudos`.
    assert!(csstype.contains("export interface CssProperties"));
    assert!(csstype.contains("export type Pseudos"));
    assert!(csstype.contains("export namespace Property"));
    assert!(csstype.contains("export namespace DataType"));

    // Per-property keyword unions survive, so `CssProperties["display"]` keeps
    // autocomplete instead of collapsing to a primitive.
    assert!(csstype.contains("export type Display ="));

    // `DataType` members must be exported. Upstream leaves them bare, which only
    // type-checks because csstype ships as a `.d.ts` consumed under skipLibCheck.
    assert!(csstype.contains("export type Color ="));

    // The duplicate families Panda never consumes are dropped from the output.
    assert!(!csstype.contains("PropertiesHyphen"));
    assert!(!csstype.contains("PropertiesFallback"));
    assert!(!csstype.contains("HtmlAttributes"));
    assert!(!csstype.contains("namespace AtRule"));

    // The asset's provenance header stays on disk but never reaches the artifact.
    assert!(csstype.starts_with("export "));
    assert!(!csstype.contains("vendor-csstype"));
}
