//! The `types/*` artifacts: the `.d.ts` surface users' editors see — token
//! paths, condition keys, property values, and the system style-object types,
//! derived from the config's [`TypeData`](pandacss_config::TypeData).

use std::collections::BTreeMap;

use pandacss_config::{
    ConditionTypeData, PatternPropertyTypeKind, TokenTypeData, UtilityTypeData, ValueTypePart,
    VariantTypeData,
};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, ConfigDependency, DependencySet,
    ExportDecl, ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::Types,
        dependencies,
        files: files(ctx, options),
    }
}

#[must_use]
pub fn files(ctx: CodegenContext<'_>, options: GenerateOptions) -> Vec<ArtifactFile> {
    let mut files = Vec::new();

    files.extend(emit_type_file(
        "types/conditions",
        &conditions_module(&ctx.types.conditions),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::Conditions,
        ]),
    ));

    files.extend(emit_type_file(
        "types/selectors",
        &selectors_module(),
        options,
        DependencySet::one(ConfigDependency::CodegenFormat),
    ));

    files.extend(emit_type_file(
        "types/csstype",
        &csstype_module(),
        options,
        DependencySet::one(ConfigDependency::CodegenFormat),
    ));

    files.extend(emit_type_file(
        "types/tokens",
        &tokens_module(&ctx.types.tokens),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::Tokens,
            ConfigDependency::Themes,
        ]),
    ));

    files.extend(emit_type_file(
        "types/values",
        &values_module_with_options(&ctx.types.utilities, ctx.types.options),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::Tokens,
            ConfigDependency::Utilities,
        ]),
    ));

    files.extend(emit_type_file(
        "types/properties",
        &properties_module(&ctx.types.utilities),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::Tokens,
            ConfigDependency::Utilities,
            ConfigDependency::Syntax,
        ]),
    ));

    files.extend(emit_type_file(
        "types/system-types",
        &system_types_module(),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::Conditions,
            ConfigDependency::Utilities,
        ]),
    ));

    files.extend(emit_type_file(
        "types/pattern",
        &pattern_module(),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::Patterns,
            ConfigDependency::Tokens,
            ConfigDependency::Utilities,
        ]),
    ));

    files.extend(emit_type_file(
        "types/recipe",
        &recipe_module(),
        options,
        DependencySet::from_slice(&[ConfigDependency::CodegenFormat]),
    ));

    files.extend(emit_type_file(
        "types/index",
        &index_module(),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::Conditions,
            ConfigDependency::Patterns,
            ConfigDependency::Recipes,
            ConfigDependency::Tokens,
            ConfigDependency::Utilities,
        ]),
    ));

    files
}

fn emit_type_file(
    stem: &str,
    module: &Module,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    emit_module_files(
        stem,
        module,
        options.format,
        false,
        options.specifiers,
        dependencies,
    )
}

fn conditions_module(data: &ConditionTypeData) -> Module {
    let condition_members = data
        .keys
        .iter()
        .map(|key| format!("  {key:?}: string"))
        .collect::<Vec<_>>()
        .join("\n");
    let breakpoint_members = data
        .breakpoints
        .iter()
        .map(|key| format!("  {key:?}: string"))
        .collect::<Vec<_>>()
        .join("\n");

    raw_type_module(format!(
        "export interface Conditions {{\n{condition_members}\n}}\n\n\
         export interface Breakpoints {{\n{breakpoint_members}\n}}\n\n\
         export type Condition = keyof Conditions\n\n\
         export type ConditionalValue<T> =\n  | T\n  | Array<T | null>\n  | {{ [K in Condition]?: ConditionalValue<T> }}"
    ))
}

fn selectors_module() -> Module {
    raw_type_module(
        r"export type Selector = `&${string}` | `@${string}`

export type AnySelector = Selector | string",
    )
}

fn csstype_module() -> Module {
    // Terse `csstype` vendored by scripts/vendor-csstype.ts: per-property keyword
    // unions + `Pseudos`, minus JSDoc and the families Panda never consumes. The
    // asset keeps a provenance header for maintainers; drop it from the emitted
    // artifact so generated styled-system output stays clean.
    let source = include_str!("../../assets/csstype.d.ts");
    let body = source
        .find("\nexport ")
        .map_or(source, |idx| &source[idx + 1..]);
    raw_type_module(body)
}

fn tokens_module(data: &TokenTypeData) -> Module {
    let mut parts = Vec::new();

    if data.categories.is_empty() {
        parts.push("export interface Tokens {\n  [category: string]: string\n}".to_owned());
    } else {
        for category in data.categories.values() {
            parts.push(format!(
                "export type {} = {}",
                category.type_name,
                string_union(&category.values, "string")
            ));
        }

        let members = data
            .categories
            .values()
            .map(|category| format!("  {}: {}", quote_member(&category.name), category.type_name))
            .collect::<Vec<_>>()
            .join("\n");
        parts.push(format!("export interface Tokens {{\n{members}\n}}"));
    }

    if data.color_palettes.is_empty() {
        parts.push("export type ColorPalette = string".to_owned());
    } else {
        parts.push(format!(
            "export type ColorPalette = {}",
            string_union(&data.color_palettes, "string")
        ));
    }

    parts.push("export type TokenValue<T extends keyof Tokens> = Tokens[T]".to_owned());

    raw_type_module(parts.join("\n\n"))
}

fn values_module_with_options(
    data: &UtilityTypeData,
    options: pandacss_config::TypegenOptions,
) -> Module {
    let mut module = Module::new()
        .with_import(ImportDecl::ty(["CssProperties"], "./csstype"))
        .with_import(ImportDecl::ty(["TokenValue"], "./tokens"));

    let mut parts = vec![
        "export type AnyString = string & {}".to_owned(),
        "export type AnyNumber = number & {}".to_owned(),
        "export type CssVars = `var(--${string})`".to_owned(),
        "export type WithEscapeHatch<T> = T | `[${string}]`".to_owned(),
        "export type OnlyKnown<Value> = Value extends boolean ? Value : Value extends `${infer _}` ? Value : never".to_owned(),
    ];

    for alias in data.aliases.values() {
        parts.push(format!(
            "export type {} = {}",
            alias.name,
            value_alias_type(&alias.parts, options)
        ));
    }

    module.items.push(type_raw(parts.join("\n\n")));
    module
}

fn properties_module(data: &UtilityTypeData) -> Module {
    let mut imports = vec![ImportSpecifier::Named("ConditionalValue".into())];
    // Strictness lives inside the value aliases now, so properties only import
    // `ConditionalValue`, the `CssVar*` primitives, and the aliases themselves —
    // not `OnlyKnown`/`WithEscapeHatch`.
    let mut value_imports = vec![
        ImportSpecifier::Named("AnyNumber".into()),
        ImportSpecifier::Named("AnyString".into()),
        ImportSpecifier::Named("CssVars".into()),
    ];

    for alias in data.aliases.keys() {
        value_imports.push(ImportSpecifier::Named(alias.clone()));
    }

    let mut module = Module::new()
        .with_import(ImportDecl {
            kind: ImportKind::Type,
            specifiers: std::mem::take(&mut imports),
            source: "./conditions".into(),
        })
        .with_import(ImportDecl {
            kind: ImportKind::Type,
            specifiers: value_imports,
            source: "./values".into(),
        });

    let members = data
        .properties
        .values()
        .map(|property| {
            format!(
                "  {}?: ConditionalValue<{}>",
                quote_member(&property.name),
                property_type(property)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let body = format!(
        "export type CssVarValue = ConditionalValue<CssVars | AnyString | AnyNumber>\n\n\
         export type CssVarProperties = {{\n  [K in `--${{string}}`]?: CssVarValue\n}}\n\n\
         export interface SystemProperties {{\n{members}\n}}"
    );
    module.items.push(type_raw(body));
    module
}

fn system_types_module() -> Module {
    Module::new()
        .with_import(ImportDecl::ty(["Condition"], "./conditions"))
        .with_import(ImportDecl::ty(["Selector"], "./selectors"))
        .with_import(ImportDecl::ty(["CssProperties"], "./csstype"))
        .with_import(ImportDecl::ty(
            ["CssVarProperties", "SystemProperties"],
            "./properties",
        ))
        .with_item(type_raw(
            r#"export type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

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
}"#,
        ))
}

fn pattern_module() -> Module {
    Module::new()
        .with_import(ImportDecl::ty(["ConditionalValue"], "./conditions"))
        .with_import(ImportDecl::ty(["SystemProperties"], "./properties"))
        .with_import(ImportDecl::ty(["SystemStyleObject"], "./system-types"))
        .with_item(type_raw(
            r"export type PatternPrimitive = string | number | boolean

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
}",
        ))
}

fn recipe_module() -> Module {
    let generics = r"export type RecipeVariantProps<T> = T extends (props?: infer Props) => unknown ? Props : never

export type RecipeVariant<T> = Pretty<Required<NonNullable<RecipeVariantProps<T>>>>

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
  splitVariantProps<T extends Record<string, any>>(props: T): [Props, Pretty<Omit<T, keyof Props>>]
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
  compoundVariants?: Array<RecipeSelection<T> & { css: SlotRecord<Slot, SystemStyleObject> }>
}

export interface SlotRecipeCreatorFn {
  <Slot extends string, T extends SlotRecipeVariantRecord<Slot>>(config: SlotRecipeDefinition<Slot, T>): SlotRecipeRuntimeFn<Slot, RecipeSelection<T>, RecipeConfigVariantMap<T>>
}";

    Module::new()
        .with_import(ImportDecl::ty(
            ["Pretty", "SystemStyleObject"],
            "./system-types",
        ))
        .with_item(type_raw(generics))
}

pub(crate) fn concrete_recipe_types(
    type_name: &str,
    slots: Option<&[String]>,
    variants: &BTreeMap<String, VariantTypeData>,
) -> Vec<String> {
    let variant_name = format!("{type_name}Variant");
    let props_name = format!("{type_name}VariantProps");
    let map_name = format!("{type_name}VariantMap");
    let mut out = vec![
        variant_type(&variant_name, variants),
        variant_props_type(&props_name, &variant_name),
        variant_map_type(&map_name, &variant_name),
    ];

    if let Some(slots) = slots {
        let slot_name = format!("{type_name}Slot");
        out.push(format!(
            "export type {slot_name} = {}",
            string_union(slots, "string")
        ));
        out.push(format!(
            "export type {type_name}Recipe = SlotRecipeRuntimeFn<{slot_name}, {props_name}, {map_name}>"
        ));
    } else {
        out.push(format!(
            "export type {type_name}Recipe = RecipeRuntimeFn<{props_name}, {map_name}>"
        ));
    }

    out
}

fn variant_type(type_name: &str, variants: &BTreeMap<String, VariantTypeData>) -> String {
    if variants.is_empty() {
        return format!("export type {type_name} = {{}}");
    }

    let members = variants
        .iter()
        .map(|(name, data)| format!("  {}?: {}", quote_member(name), variant_value_type(data)))
        .collect::<Vec<_>>()
        .join("\n");

    format!("export type {type_name} = {{\n{members}\n}}")
}

fn variant_props_type(props_name: &str, variant_name: &str) -> String {
    format!(
        "export type {props_name} = {{\n  [K in keyof {variant_name}]?: ConditionalValue<{variant_name}[K]>\n}}"
    )
}

fn variant_map_type(map_name: &str, variant_name: &str) -> String {
    format!("export type {map_name} = RecipeVariantMap<{variant_name}>")
}

fn variant_value_type(data: &VariantTypeData) -> String {
    let mut parts = Vec::with_capacity(data.values.len() + usize::from(data.allows_boolean));

    if data.allows_boolean {
        parts.push("boolean".to_owned());
    }

    parts.extend(
        data.values
            .iter()
            .filter(|value| !(data.allows_boolean && (*value == "true" || *value == "false")))
            .map(|value| string_literal(value)),
    );

    if parts.is_empty() {
        "string".into()
    } else {
        parts.join(" | ")
    }
}

fn index_module() -> Module {
    // `csstype` stays internal: re-exporting it wholesale would leak the entire
    // `Property` namespace onto the public surface (and load it eagerly). Mirror
    // the legacy contract — expose only the assembled `CssProperties` and keep
    // the keyword unions / `Pseudos` / `*Properties` interfaces internal.
    let module = [
        "./conditions",
        "./selectors",
        "./tokens",
        "./values",
        "./properties",
        "./system-types",
        "./pattern",
        "./recipe",
    ]
    .into_iter()
    .fold(Module::new(), |module, source| {
        module.with_item(Item::ty(ItemNode::Export(ExportDecl::TypeStar {
            source: source.into(),
        })))
    });

    module.with_item(Item::ty(ItemNode::Export(ExportDecl::TypeNamed {
        names: vec!["CssProperties".into()],
        source: "./csstype".into(),
    })))
}

fn raw_type_module(code: impl Into<String>) -> Module {
    Module::new().with_item(type_raw(code))
}

fn type_raw(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}

fn value_alias_type(parts: &[ValueTypePart], options: pandacss_config::TypegenOptions) -> String {
    let token_backed = has_token_part(parts);

    // Strictness is baked into the alias (computed once per category) rather than
    // wrapped per-property — so every property is a uniform `ConditionalValue<Alias>`
    // and the strict wrappers instantiate once each, not once per property.
    if options.strict_tokens && token_backed {
        let strict_parts = parts
            .iter()
            .filter(|part| {
                matches!(
                    part,
                    ValueTypePart::TokenCategory(_)
                        | ValueTypePart::Literal(_)
                        | ValueTypePart::CssVars
                )
            })
            .map(value_part)
            .collect::<Vec<_>>();

        let strict_type = if strict_parts.is_empty() {
            "CssVars".into()
        } else {
            strict_parts.join(" | ")
        };

        return format!("WithEscapeHatch<{strict_type}>");
    }

    // Keyword properties (e.g. `display`) restrict to their known CSS values via
    // `OnlyKnown` over the keyword union *only* — excluding the `string`/AnyString
    // catch-all, which would otherwise collapse the union and drop every keyword.
    if options.strict_property_values && !token_backed {
        let keyword_parts = parts
            .iter()
            .filter(|part| {
                matches!(
                    part,
                    ValueTypePart::CssProperty(_) | ValueTypePart::Literal(_)
                )
            })
            .map(value_part)
            .collect::<Vec<_>>();

        if !keyword_parts.is_empty() {
            return format!("WithEscapeHatch<OnlyKnown<{}>>", keyword_parts.join(" | "));
        }
    }

    value_parts_union(parts)
}

fn value_parts_union(parts: &[ValueTypePart]) -> String {
    if parts.is_empty() {
        return "unknown".into();
    }

    parts.iter().map(value_part).collect::<Vec<_>>().join(" | ")
}

fn property_type(property: &pandacss_config::UtilityPropertyTypeData) -> String {
    // Strictness now lives in the value alias (see `value_alias_type`), so every
    // property is a uniform `ConditionalValue<Alias>` — no per-property wrapper.
    property.alias.clone()
}

fn has_token_part(parts: &[ValueTypePart]) -> bool {
    parts
        .iter()
        .any(|part| matches!(part, ValueTypePart::TokenCategory(_)))
}

fn value_part(part: &ValueTypePart) -> String {
    match part {
        ValueTypePart::TokenCategory(category) => {
            format!("TokenValue<{}>", string_literal(category))
        }
        ValueTypePart::CssProperty(property) => {
            format!("CssProperties[{}]", string_literal(property))
        }
        ValueTypePart::Literal(value) => string_literal(value),
        ValueTypePart::Primitive(primitive) => match primitive {
            pandacss_config::PrimitiveType::String => "string".into(),
            pandacss_config::PrimitiveType::Number => "number".into(),
            pandacss_config::PrimitiveType::Boolean => "boolean".into(),
        },
        ValueTypePart::CssVars => "CssVars".into(),
        ValueTypePart::AnyString => "AnyString".into(),
        ValueTypePart::AnyNumber => "AnyNumber".into(),
    }
}

pub(crate) fn pattern_property_type(kind: &PatternPropertyTypeKind) -> String {
    match kind {
        PatternPropertyTypeKind::Enum { values } => {
            format!("ConditionalValue<{}>", string_union(values, "string"))
        }
        PatternPropertyTypeKind::Token { category, property } => {
            let token = format!("TokenValue<{}>", string_literal(category));
            property.as_ref().map_or_else(
                || format!("ConditionalValue<{token}>"),
                |property| {
                    format!(
                        "ConditionalValue<{token} | SystemProperties[{}]>",
                        string_literal(property)
                    )
                },
            )
        }
        PatternPropertyTypeKind::Property { property } => {
            format!("SystemProperties[{}]", string_literal(property))
        }
        PatternPropertyTypeKind::Primitive { primitive } => {
            let primitive = match primitive {
                pandacss_config::PrimitiveType::String => "string",
                pandacss_config::PrimitiveType::Number => "number",
                pandacss_config::PrimitiveType::Boolean => "boolean",
            };
            format!("ConditionalValue<{primitive}>")
        }
        PatternPropertyTypeKind::Unknown => "ConditionalValue<unknown>".into(),
    }
}

fn string_union(values: &[String], fallback: &str) -> String {
    if values.is_empty() {
        return fallback.into();
    }

    values
        .iter()
        .map(|value| string_literal(value))
        .collect::<Vec<_>>()
        .join(" | ")
}

fn string_literal(value: &str) -> String {
    format!("{value:?}")
}

fn quote_member(value: &str) -> String {
    if is_identifier(value) {
        value.into()
    } else {
        string_literal(value)
    }
}

fn is_identifier(value: &str) -> bool {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    (first.is_ascii_alphabetic() || first == '_' || first == '$')
        && chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '$')
}
