use std::collections::BTreeMap;

use crate::common::{artifact, file, paths};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions};
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
                containers: vec!["card".into()],
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
                "opacity".into(),
                TokenCategoryTypeData {
                    name: "opacity".into(),
                    type_name: "OpacityToken".into(),
                    values: vec!["half".into()],
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
                deprecated: None,
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
                deprecated: None,
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
            "types/tokens.ts",
            "types/system.ts",
            "types/pattern.ts",
            "types/recipe.ts",
            "types/index.ts"
        ]
    );

    assert_eq!(
        file(types, "types/tokens.ts"),
        indoc! {r#"
        export type ColorToken = "red.500" | "blue.500"

        export type OpacityToken = "half"

        export type SpacingToken = "1" | "2"

        export interface Tokens {
          colors: ColorToken
          opacity: OpacityToken
          spacing: SpacingToken
        }

        export type Token = `colors.${ColorToken}` | `opacity.${OpacityToken}` | `spacing.${SpacingToken}`

        export type ColorOpacityModifier = `${number}` | OpacityToken

        export type ColorOpacityToken = `colors.${ColorToken}/${ColorOpacityModifier}`

        export type TokenPath = Token | ColorOpacityToken

        export type ColorPalette = "red" | "blue"

        export type TokenValue<T extends keyof Tokens> = Tokens[T]
        "#}
        .trim()
    );

    // `types/system` is the merged surface (own csstype + properties + selectors +
    // system-types). It's ~825 members, so assert its shape rather than full content.
    let system = file(types, "types/system.ts");
    assert!(system.contains("export interface Conditions {"));
    assert!(system.contains("  \"base\": string"));
    assert!(system.contains("  \"_hover\": string"));
    assert!(system.contains("export interface Breakpoints {"));
    assert!(system.contains("export type ContainerName = \"card\" | AnyString"));
    assert!(system.contains(
        "export type ContainerValue = ContainerName | `${ContainerName} / inline-size` | `${ContainerName} / size` | AnyString"
    ));
    assert!(system.contains("export type Condition = keyof Conditions"));
    assert!(system.contains("export type ConditionalValue<T> ="));
    // value aliases live in system because they are only used by system properties
    assert!(system.contains("import type { TokenValue } from './tokens';"));
    assert!(system.contains("export type AnyString = string & {}"));
    assert!(system.contains("export type AnyNumber = number & {}"));
    assert!(system.contains("export type CssVars = `var(--${string})`"));
    assert!(system.contains(
        "export type Assign<T, U> = {\n  [K in keyof T]: K extends keyof U ? U[K] : T[K]\n} & U"
    ));
    assert!(system.contains(
        "export type ColorValue = ColorGlobals | TokenValue<\"colors\"> | CssVars | AnyString | AnyNumber"
    ));
    assert!(system.contains(
        "export type SpacingValue = AutoGlobals | TokenValue<\"spacing\"> | CssVars | AnyString | AnyNumber"
    ));
    // own csstype: globals + the single shared CssValue
    assert!(system.contains(
        r#"export type Globals = "inherit" | "initial" | "revert" | "revert-layer" | "unset""#
    ));
    assert!(system.contains("export type CssValue = Globals | (string & {}) | number"));
    assert!(system.contains("export type PropertyValueMap = {"));
    assert!(system.contains(
        r#"  float: Globals | "inline-end" | "inline-start" | "left" | "none" | "right""#
    ));
    assert!(!system.contains(
        "export type CssPropertyValue<K extends keyof PropertyValueMap> = PropertyValueMap[K]"
    ));
    assert!(system.contains(r#"  placeItems: PropertyValueMap["alignItems"]"#));
    assert!(system.contains(r#"  alignItems?: ConditionalValue<PropertyValueMap["alignItems"]>"#));
    // SystemProperties: native css props plus configured utility overrides
    assert!(system.contains("export interface SystemProperties {"));
    assert!(!system.contains("export interface CssProperties {"));
    assert!(!system.contains("extends CssProperties"));
    assert!(
        system.contains(r#"  float?: ConditionalValue<PropertyValueMap["float"] | AnyString>"#)
    );
    assert!(
        system.contains(
            r#"  textAlign?: ConditionalValue<PropertyValueMap["textAlign"] | AnyString>"#
        )
    );
    assert!(system.contains("export type LengthValue = DimensionGlobals | (string & {}) | number"));
    assert!(system.contains(
        "export type ColorCssValue = ColorGlobals | NamedColor | SystemColor | (string & {})"
    ));
    assert!(system.contains(r#"export type SystemColor = "AccentColor""#));
    assert!(system.contains(r#"| "Canvas""#));
    assert!(system.contains(r#"export type NamedColor = "aliceblue""#));
    assert!(
        system.contains(r#"export type BgSizeValue = LengthValue | "auto" | "contain" | "cover""#)
    );
    assert!(system.contains(
        r#"export type FontSizeValue = LengthValue | AbsoluteSize | "larger" | "smaller" | "math""#
    ));
    assert!(system.contains(
        r#"export type FontWeightValue = Globals | "bold" | "normal" | (string & {}) | number"#
    ));
    assert!(
        system
            .contains(r#"export type LineWidthValue = LengthValue | "medium" | "thick" | "thin""#)
    );
    assert!(system.contains(
        r#"export type LineStyleValue = Globals | "dashed" | "dotted" | "double" | "groove" | "hidden" | "inset" | "none" | "outset" | "ridge" | "solid""#
    ));
    assert!(system.contains("export type OpenLineStyleValue = LineStyleValue | (string & {})"));
    assert!(system.contains(
        r#"export type RepeatStyleValue = Globals | "no-repeat" | "repeat" | "repeat-x" | "repeat-y" | "round" | "space" | (string & {})"#
    ));
    assert!(system.contains(
        r#"export type FontStretchValue = Globals | "condensed" | "expanded" | "extra-condensed" | "extra-expanded" | "normal" | "semi-condensed" | "semi-expanded" | "ultra-condensed" | "ultra-expanded" | (string & {})"#
    ));
    assert!(system.contains(
        r#"export type OverflowCssValue = Globals | "-moz-hidden-unscrollable" | "auto" | "clip" | "hidden" | "overlay" | "scroll" | "visible""#
    ));
    assert!(system.contains("export type OpenOverflowCssValue = OverflowCssValue | (string & {})"));
    assert!(system.contains(
        r#"export type OverflowShortCssValue = Globals | "auto" | "clip" | "hidden" | "scroll" | "visible""#
    ));
    assert!(system.contains(
        r#"export type OverscrollBehaviorCssValue = Globals | "auto" | "contain" | "none""#
    ));
    assert!(system.contains(
        "export type OpenOverscrollBehaviorCssValue = OverscrollBehaviorCssValue | (string & {})"
    ));
    assert!(system.contains("  borderTopStyle: LineStyleValue"));
    assert!(system.contains("  borderStyle: OpenLineStyleValue"));
    assert!(system.contains("  columnRuleStyle: OpenLineStyleValue"));
    assert!(system.contains("  backgroundRepeat: RepeatStyleValue"));
    assert!(system.contains("  maskRepeat: RepeatStyleValue"));
    assert!(system.contains("  fontStretch: FontStretchValue"));
    assert!(system.contains("  fontWidth: FontStretchValue"));
    assert!(system.contains("  overflowX: OverflowCssValue"));
    assert!(system.contains("  overflow: OpenOverflowCssValue"));
    assert!(system.contains("  overscrollBehaviorX: OverscrollBehaviorCssValue"));
    assert!(system.contains("  overscrollBehavior: OpenOverscrollBehaviorCssValue"));
    assert_eq!(
        system
            .matches(
                r#""dashed" | "dotted" | "double" | "groove" | "hidden" | "inset" | "none" | "outset" | "ridge" | "solid""#
            )
            .count(),
        1
    );
    assert!(system.contains(
        r#"export type PositionValue = LengthValue | "bottom" | "center" | "left" | "right" | "top""#
    ));
    assert!(system.contains(r#"export type GenericFamily = "-apple-system""#));
    assert!(
        system.contains(
            "  backgroundColor?: ConditionalValue<PropertyValueMap[\"backgroundColor\"]>"
        )
    );
    assert!(
        system
            .contains("  backgroundSize?: ConditionalValue<PropertyValueMap[\"backgroundSize\"]>")
    );
    assert!(system.contains("  fontWeight?: ConditionalValue<PropertyValueMap[\"fontWeight\"]>"));
    assert!(system.contains("  fontFamily?: ConditionalValue<PropertyValueMap[\"fontFamily\"]>"));
    assert!(system.contains("  marginTop?: ConditionalValue<PropertyValueMap[\"marginTop\"]>"));
    assert!(system.contains("  cursor?: ConditionalValue<PropertyValueMap[\"cursor\"]>"));
    assert!(system.contains("  WebkitLineClamp?: ConditionalValue<CssValue>"));
    // configured utilities override native css props in the same interface
    assert!(system.contains("  container?: ConditionalValue<ContainerValue>"));
    assert!(system.contains("  containerName?: ConditionalValue<ContainerName>"));
    assert!(
        system.contains(r#"  color?: ConditionalValue<ColorValue | PropertyValueMap["color"]>"#)
    );
    assert!(system.contains(r#"  gap?: ConditionalValue<SpacingValue | PropertyValueMap["gap"]>"#));
    // selectors + the recursive style object live here too
    assert!(system.contains(
        r#"export type AtRuleType = "media" | "layer" | "container" | "supports" | "page" | "scope" | "starting-style""#
    ));
    assert!(system.contains(
        "export type Selector = `${string}&` | `&${string}` | `@${AtRuleType}${string}`"
    ));
    assert!(system.contains("export type Nested<P> = P & {"));
    assert!(system.contains(
        "export interface SystemStyleObject extends SystemProperties, CssVarProperties, NestedStyles {}"
    ));
    assert!(system.contains(
        "export interface CssKeyframes {\n  [name: string]: {\n    [time: string]: SystemStyleObject\n  }\n}"
    ));
    assert!(system.contains(
        "export type JsxHTMLProps<T extends Record<string, any>, P extends Record<string, any> = {}> = Assign<WithHTMLProps<T>, P>"
    ));
    // dead vendor prefixes are not emitted
    assert!(!system.contains("OAnimation"));
    assert!(!system.contains("KhtmlBoxAlign"));

    assert_snapshot!(file(types, "types/recipe.ts"), @"
    import type { ConditionalValue, SystemStyleObject } from './system';

    export type RecipeVariantProps<T> = T extends (props?: infer Props) => unknown ? Props : never

    export type RecipeVariant<T> = Required<NonNullable<RecipeVariantProps<T>>>

    export type RecipeVariantMap<Variant extends object> = {
      [K in keyof Variant]-?: Array<Variant[K]>
    }

    export type RecipeConfigVariantMap<T> = {
      [K in keyof T]: Array<keyof T[K]>
    }

    export interface RecipeRuntimeFn<Props extends object = object, Map extends object = object> {
      (props?: Props): string
      __type: Props
      variantMap: Map
      variantKeys: Array<keyof Props>
      raw: (props?: Props) => SystemStyleObject
      splitVariantProps<T extends Record<string, any>>(props: T): [Props, Omit<T, keyof Props>]
      getVariantProps: (props?: Props) => Props
      merge(recipe: RecipeRuntimeFn): RecipeRuntimeFn
    }

    export type SlotRecord<Slot extends string, Value> = Partial<Record<Slot, Value>>

    export interface SlotRecipeRuntimeFn<Slot extends string, Props extends object = object, Map extends object = object> {
      (props?: Props): SlotRecord<Slot, string>
      __type: Props
      __slot: Slot
      variantMap: Map
      variantKeys: Array<keyof Props>
      raw: (props?: Props) => Record<Slot, SystemStyleObject>
      splitVariantProps<T extends Record<string, any>>(props: T): [Props, Omit<T, keyof Props>]
      getVariantProps: (props?: Props) => Props
    }

    export type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

    export type RecipeVariantRecord = Record<string, Record<string, SystemStyleObject>>

    export type RecipeSelection<T extends RecipeVariantRecord> = string extends keyof T
      ? {}
      : {
          [K in keyof T]?: StringToBoolean<keyof T[K]>
        }

    export type RecipeCompoundSelection<T> = {
      [K in keyof T]?: StringToBoolean<keyof T[K]> | Array<StringToBoolean<keyof T[K]>>
    }

    export interface RecipeDefinition<T extends RecipeVariantRecord = RecipeVariantRecord> {
      base?: SystemStyleObject
      variants?: T
      defaultVariants?: RecipeSelection<T>
      compoundVariants?: Array<RecipeCompoundSelection<T> & { css: SystemStyleObject }>
    }

    export interface RecipeCreatorFn {
      <T extends RecipeVariantRecord>(config: RecipeDefinition<T>): RecipeRuntimeFn<RecipeSelection<T>, RecipeConfigVariantMap<T>>
    }

    export type SlotRecipeVariantRecord<Slot extends string> = Record<string, Record<string, SlotRecord<Slot, SystemStyleObject>>>

    export interface SlotRecipeDefinition<Slot extends string = string, T extends SlotRecipeVariantRecord<Slot> = SlotRecipeVariantRecord<Slot>> {
      className?: string
      slots: Slot[]
      base?: SlotRecord<Slot, SystemStyleObject>
      variants?: T
      defaultVariants?: RecipeSelection<T>
      compoundVariants?: Array<RecipeCompoundSelection<T> & { css: SlotRecord<Slot, SystemStyleObject> }>
    }

    export interface SlotRecipeCreatorFn {
      <Slot extends string, T extends SlotRecipeVariantRecord<Slot>>(config: SlotRecipeDefinition<Slot, T>): SlotRecipeRuntimeFn<Slot, RecipeSelection<T>, RecipeConfigVariantMap<T>>
    }
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

    // The former `system-types` content now lives in the merged `types/system`.
    let system = file(types, "types/system.ts");
    assert!(system.contains("export type Pretty<T> = { [K in keyof T]: T[K] } & {}"));
    assert!(system.contains(
        "export type NestedStyles = {\n  [K in Selector | Condition]?: SystemStyleObject\n}"
    ));
    assert!(system.contains("  [K in AnySelector]?: Nested<P>"));
    assert!(system.contains(
        "export interface GlobalStyleObject {\n  [selector: string]: SystemStyleObject\n}"
    ));
    assert!(system.contains("export interface CssKeyframes {"));
    assert!(
        system.contains(r#"export type FontfaceRule = Omit<GlobalFontfaceRule, "fontFamily">"#)
    );
    // imports pulled from the sibling modules, none from removed csstype/properties/system-types/values/conditions
    assert!(!system.contains("./csstype"));
    assert!(!system.contains("./system-types"));
    assert!(!system.contains("./values"));
    assert!(!system.contains("./conditions"));

    assert_eq!(
        file(types, "types/index.ts"),
        indoc! {r"
        export type * from './tokens';
        export type * from './system';
        export type * from './pattern';
        export type * from './recipe';
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
            "types/tokens.d.ts",
            "types/system.d.ts",
            "types/pattern.d.ts",
            "types/recipe.d.ts",
            "types/index.d.ts"
        ]
    );

    let system = file(types, "types/system.d.ts");
    assert!(system.contains("import type { TokenValue } from './tokens';"));
    assert!(system.contains(
        "export type ColorValue = ColorGlobals | TokenValue<\"colors\"> | CssVars | AnyString | AnyNumber"
    ));
    assert!(system.contains(
        "export type SpacingValue = AutoGlobals | TokenValue<\"spacing\"> | CssVars | AnyString | AnyNumber"
    ));

    assert_eq!(
        file(types, "types/pattern.d.ts"),
        indoc! {r"
        import type { ConditionalValue, SystemProperties, SystemStyleObject } from './system';

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

    // Strict aliases carry the WithEscapeHatch wrapper; strict-list native props
    // strict-list native props narrow on `SystemProperties` under strictPropertyValues.
    let system = file(types, "types/system.ts");
    assert!(system.contains(
        "export type ColorValue = WithEscapeHatch<ColorGlobals | TokenValue<\"colors\"> | CssVars>"
    ));
    assert!(system.contains(
        "export type SpacingValue = WithEscapeHatch<AutoGlobals | TokenValue<\"spacing\"> | CssVars>"
    ));
    assert!(system.contains("export interface SystemProperties {"));
    assert!(system.contains("  color?: ConditionalValue<ColorValue>"));
    assert!(system.contains("  gap?: ConditionalValue<SpacingValue>"));
    assert!(system.contains(r#"  cursor?: ConditionalValue<PropertyValueMap["cursor"]>"#));
}

#[test]
fn strict_tokens_keep_per_category_globals() {
    let mut input = CodegenInput {
        types: TypeData {
            utilities: UtilityTypeData {
                properties: BTreeMap::from([
                    (
                        "width".into(),
                        UtilityPropertyTypeData {
                            name: "width".into(),
                            css_property: Some("width".into()),
                            token_category: Some("sizes".into()),
                            alias: "SizeValue".into(),
                            ..UtilityPropertyTypeData::default()
                        },
                    ),
                    (
                        "display".into(),
                        UtilityPropertyTypeData {
                            name: "display".into(),
                            css_property: Some("display".into()),
                            alias: "DisplayValue".into(),
                            ..UtilityPropertyTypeData::default()
                        },
                    ),
                ]),
                aliases: BTreeMap::from([
                    (
                        "SizeValue".into(),
                        ValueAliasTypeData {
                            name: "SizeValue".into(),
                            parts: vec![
                                ValueTypePart::TokenCategory("sizes".into()),
                                ValueTypePart::CssVars,
                            ],
                        },
                    ),
                    (
                        "DisplayValue".into(),
                        ValueAliasTypeData {
                            name: "DisplayValue".into(),
                            parts: vec![
                                ValueTypePart::Literal("flex".into()),
                                ValueTypePart::Literal("block".into()),
                            ],
                        },
                    ),
                ]),
                ..UtilityTypeData::default()
            },
            ..TypeData::default()
        },
        ..CodegenInput::default()
    };
    input.types.options.strict_tokens = true;
    input.types.options.strict_property_values = true;

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);
    let system = file(types, "types/system.ts");

    // The per-category globals aliases are emitted once as static types.
    assert!(
        system.contains(r#"export type ColorGlobals = Globals | "currentColor" | "transparent""#)
    );
    assert!(system.contains(
        r#"export type DimensionGlobals = Globals | "auto" | "fit-content" | "max-content" | "min-content""#
    ));
    assert!(system.contains(r#"export type AutoGlobals = Globals | "auto""#));

    // sizes-backed property unions in DimensionGlobals.
    assert!(system.contains(
        r#"export type SizeValue = WithEscapeHatch<DimensionGlobals | TokenValue<"sizes"> | CssVars>"#
    ));
    // strictPropertyValues keyword property keeps the base Globals + CssVars alongside
    // OnlyKnown; configured utility values take precedence over the csstype table.
    assert!(system.contains(
        r#"export type DisplayValue = WithEscapeHatch<Globals | CssVars | OnlyKnown<"flex" | "block">>"#
    ));
}

#[test]
fn mapped_property_unions_css_properties_under_strict_property_values() {
    let mut input = CodegenInput {
        types: TypeData {
            utilities: UtilityTypeData {
                properties: BTreeMap::from([(
                    "float".into(),
                    UtilityPropertyTypeData {
                        name: "float".into(),
                        css_property: Some("float".into()),
                        mapped_css_property: Some("float".into()),
                        literals: vec!["end".into(), "start".into()],
                        alias: "FloatValue".into(),
                        ..UtilityPropertyTypeData::default()
                    },
                )]),
                aliases: BTreeMap::from([(
                    "FloatValue".into(),
                    ValueAliasTypeData {
                        name: "FloatValue".into(),
                        parts: vec![
                            ValueTypePart::CssProperty("float".into()),
                            ValueTypePart::Literal("end".into()),
                            ValueTypePart::Literal("start".into()),
                            ValueTypePart::CssVars,
                            ValueTypePart::AnyString,
                        ],
                    },
                )]),
                ..UtilityTypeData::default()
            },
            ..TypeData::default()
        },
        ..CodegenInput::default()
    };
    input.types.options.strict_property_values = true;

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let system = file(artifact(&artifacts, ArtifactId::Types), "types/system.ts");

    assert!(system.contains(
        r#"export type FloatValue = WithEscapeHatch<Globals | CssVars | OnlyKnown<"end" | "start" | PropertyValueMap["float"]>>"#
    ));
}

#[test]
fn mapped_property_unions_css_property_value_in_default_mode() {
    let input = CodegenInput {
        types: TypeData {
            utilities: UtilityTypeData {
                properties: BTreeMap::from([(
                    "float".into(),
                    UtilityPropertyTypeData {
                        name: "float".into(),
                        css_property: Some("float".into()),
                        mapped_css_property: Some("float".into()),
                        literals: vec!["end".into(), "start".into()],
                        alias: "FloatValue".into(),
                        ..UtilityPropertyTypeData::default()
                    },
                )]),
                aliases: BTreeMap::from([(
                    "FloatValue".into(),
                    ValueAliasTypeData {
                        name: "FloatValue".into(),
                        parts: vec![
                            ValueTypePart::CssProperty("float".into()),
                            ValueTypePart::Literal("end".into()),
                            ValueTypePart::Literal("start".into()),
                            ValueTypePart::CssVars,
                            ValueTypePart::AnyString,
                        ],
                    },
                )]),
                ..UtilityTypeData::default()
            },
            ..TypeData::default()
        },
        ..CodegenInput::default()
    };

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let system = file(artifact(&artifacts, ArtifactId::Types), "types/system.ts");

    assert!(system.contains(r"export type FloatValue = "));
    assert!(system.contains(r#""end" | "start""#));
    assert!(system.contains(r#"PropertyValueMap["float"]"#));
    assert!(!system.contains(r#"CssProperties["float"]"#));
}

#[test]
fn utility_inherits_native_css_values_in_default_mode() {
    let input = CodegenInput {
        types: TypeData {
            utilities: UtilityTypeData {
                properties: BTreeMap::from([(
                    "textAlign".into(),
                    UtilityPropertyTypeData {
                        name: "textAlign".into(),
                        css_property: Some("textAlign".into()),
                        alias: "TextAlignValue".into(),
                        ..UtilityPropertyTypeData::default()
                    },
                )]),
                aliases: BTreeMap::from([(
                    "TextAlignValue".into(),
                    ValueAliasTypeData {
                        name: "TextAlignValue".into(),
                        parts: vec![
                            ValueTypePart::Primitive(PrimitiveType::String),
                            ValueTypePart::Primitive(PrimitiveType::Number),
                            ValueTypePart::CssVars,
                            ValueTypePart::AnyString,
                        ],
                    },
                )]),
                ..UtilityTypeData::default()
            },
            ..TypeData::default()
        },
        ..CodegenInput::default()
    };

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let system = file(artifact(&artifacts, ArtifactId::Types), "types/system.ts");

    let text_align_value = system
        .lines()
        .find(|line| line.starts_with("export type TextAlignValue"));
    assert!(
        text_align_value.is_none(),
        "native mirror utilities should not emit a redundant value alias: {text_align_value:?}"
    );
    assert!(
        system.contains(
            "  textAlign?: ConditionalValue<PropertyValueMap[\"textAlign\"] | AnyString>"
        )
    );
    assert!(!system.contains(r"TextAlignValue = string | number"));
}

#[test]
fn utility_shorthand_unions_css_property_value_in_default_mode() {
    let input = CodegenInput {
        types: TypeData {
            utilities: UtilityTypeData {
                properties: BTreeMap::from([
                    (
                        "background".into(),
                        UtilityPropertyTypeData {
                            name: "background".into(),
                            css_property: Some("background".into()),
                            token_category: Some("colors".into()),
                            alias: "ColorsValue".into(),
                            ..UtilityPropertyTypeData::default()
                        },
                    ),
                    (
                        "backgroundColor".into(),
                        UtilityPropertyTypeData {
                            name: "backgroundColor".into(),
                            css_property: Some("backgroundColor".into()),
                            token_category: Some("colors".into()),
                            alias: "ColorsValue".into(),
                            ..UtilityPropertyTypeData::default()
                        },
                    ),
                    (
                        "bg".into(),
                        UtilityPropertyTypeData {
                            name: "bg".into(),
                            css_property: Some("background".into()),
                            token_category: Some("colors".into()),
                            alias: "ColorsValue".into(),
                            ..UtilityPropertyTypeData::default()
                        },
                    ),
                    (
                        "bgColor".into(),
                        UtilityPropertyTypeData {
                            name: "bgColor".into(),
                            css_property: Some("backgroundColor".into()),
                            token_category: Some("colors".into()),
                            alias: "ColorsValue".into(),
                            ..UtilityPropertyTypeData::default()
                        },
                    ),
                ]),
                shorthands: BTreeMap::from([
                    ("bg".into(), "background".into()),
                    ("bgColor".into(), "backgroundColor".into()),
                ]),
                aliases: BTreeMap::from([(
                    "ColorsValue".into(),
                    ValueAliasTypeData {
                        name: "ColorsValue".into(),
                        parts: vec![
                            ValueTypePart::TokenCategory("colors".into()),
                            ValueTypePart::CssVars,
                            ValueTypePart::AnyString,
                        ],
                    },
                )]),
                ..UtilityTypeData::default()
            },
            ..TypeData::default()
        },
        ..CodegenInput::default()
    };

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let system = file(artifact(&artifacts, ArtifactId::Types), "types/system.ts");

    assert!(system.contains(r"  bg?: ConditionalValue<ColorsValue | CssValue>"));
    assert!(system.contains(
        r#"  bgColor?: ConditionalValue<ColorsValue | PropertyValueMap["backgroundColor"]>"#
    ));
    assert!(system.contains(
        r#"  backgroundColor?: ConditionalValue<ColorsValue | PropertyValueMap["backgroundColor"]>"#
    ));
    assert!(system.contains(
        r#"export type ColorsValue = ColorGlobals | TokenValue<"colors"> | CssVars | AnyString | AnyNumber"#
    ));
}

#[test]
fn utility_shorthand_omits_css_property_value_under_strict_tokens() {
    let mut input = CodegenInput {
        types: TypeData {
            utilities: UtilityTypeData {
                properties: BTreeMap::from([(
                    "bgColor".into(),
                    UtilityPropertyTypeData {
                        name: "bgColor".into(),
                        css_property: Some("backgroundColor".into()),
                        token_category: Some("colors".into()),
                        alias: "ColorsValue".into(),
                        ..UtilityPropertyTypeData::default()
                    },
                )]),
                aliases: BTreeMap::from([(
                    "ColorsValue".into(),
                    ValueAliasTypeData {
                        name: "ColorsValue".into(),
                        parts: vec![
                            ValueTypePart::TokenCategory("colors".into()),
                            ValueTypePart::CssVars,
                            ValueTypePart::AnyString,
                        ],
                    },
                )]),
                ..UtilityTypeData::default()
            },
            ..TypeData::default()
        },
        ..CodegenInput::default()
    };
    input.types.options.strict_tokens = true;

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let system = file(artifact(&artifacts, ArtifactId::Types), "types/system.ts");

    assert!(system.contains(r"  bgColor?: ConditionalValue<ColorsValue>"));
    assert!(!system.contains(
        r#"  bgColor?: ConditionalValue<ColorsValue | PropertyValueMap["backgroundColor"]>"#
    ));
}

#[test]
fn mapped_property_is_omitted_without_explicit_property_field() {
    let mut input = CodegenInput {
        types: TypeData {
            utilities: UtilityTypeData {
                properties: BTreeMap::from([(
                    "gap".into(),
                    UtilityPropertyTypeData {
                        name: "gap".into(),
                        css_property: Some("gap".into()),
                        token_category: Some("spacing".into()),
                        alias: "SpacingValue".into(),
                        ..UtilityPropertyTypeData::default()
                    },
                )]),
                aliases: BTreeMap::from([(
                    "SpacingValue".into(),
                    ValueAliasTypeData {
                        name: "SpacingValue".into(),
                        parts: vec![
                            ValueTypePart::TokenCategory("spacing".into()),
                            ValueTypePart::CssVars,
                            ValueTypePart::AnyString,
                        ],
                    },
                )]),
                ..UtilityTypeData::default()
            },
            ..TypeData::default()
        },
        ..CodegenInput::default()
    };
    input.types.options.strict_property_values = true;

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let system = file(artifact(&artifacts, ArtifactId::Types), "types/system.ts");

    assert!(system.contains(
        r#"export type SpacingValue = AutoGlobals | TokenValue<"spacing"> | CssVars | AnyString | AnyNumber"#
    ));
    assert!(!system.contains(r#"CssProperties["gap"]"#));
    assert!(system.contains(r#"  gap?: ConditionalValue<SpacingValue | PropertyValueMap["gap"]>"#));
}

#[test]
fn value_alias_unions_are_rendered_without_obvious_duplicates() {
    let mut input = input();
    input.types.utilities.properties.insert(
        "mixed".into(),
        UtilityPropertyTypeData {
            name: "mixed".into(),
            css_property: Some("customProp".into()),
            alias: "MixedValue".into(),
            ..UtilityPropertyTypeData::default()
        },
    );
    input.types.utilities.aliases.insert(
        "MixedValue".into(),
        ValueAliasTypeData {
            name: "MixedValue".into(),
            parts: vec![
                ValueTypePart::TokenCategory("colors".into()),
                ValueTypePart::TokenCategory("spacing".into()),
                ValueTypePart::CssVars,
                ValueTypePart::CssVars,
                ValueTypePart::Primitive(PrimitiveType::Number),
                ValueTypePart::AnyNumber,
            ],
        },
    );

    let artifacts = ArtifactGraph.generate_with_input(
        &input,
        GenerateOptions {
            format: CodegenFormat::Ts,
            ..GenerateOptions::default()
        },
    );
    let system = file(artifact(&artifacts, ArtifactId::Types), "types/system.ts");

    assert!(system.contains(
        r#"export type MixedValue = AutoGlobals | ColorGlobals | TokenValue<"colors"> | TokenValue<"spacing"> | CssVars | number"#
    ));
    assert_eq!(system.matches("export type MixedValue").count(), 1);
    assert!(!system.contains(
        r#"export type MixedValue = AutoGlobals | ColorGlobals | TokenValue<"colors"> | TokenValue<"spacing"> | CssVars | CssVars"#
    ));
    assert!(!system.contains(r"export type MixedValue = Globals | AutoGlobals"));
    assert!(!system.contains(r"number | AnyNumber"));
}

#[test]
fn can_emit_type_import_extensions() {
    let artifacts = ArtifactGraph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            import_extensions: true,
        },
    );
    let types = artifact(&artifacts, ArtifactId::Types);

    let system = file(types, "types/system.d.mts");
    assert!(system.contains("import type { TokenValue } from './tokens.d.mts';"));
    assert!(system.contains(
        "export type ColorValue = ColorGlobals | TokenValue<\"colors\"> | CssVars | AnyString | AnyNumber"
    ));
    assert!(system.contains(
        "export type SpacingValue = AutoGlobals | TokenValue<\"spacing\"> | CssVars | AnyString | AnyNumber"
    ));

    assert_eq!(
        file(types, "types/index.d.mts"),
        indoc! {r"
        export * from './tokens.d.mts';
        export * from './system.d.mts';
        export * from './pattern.d.mts';
        export * from './recipe.d.mts';
        "}
        .trim()
    );
}
