//! The `types/*` artifacts: the `.d.ts` surface users' editors see — token
//! paths, condition keys, property values, and the system style-object types,
//! derived from the config's [`TypeData`](pandacss_config::TypeData).

mod data_type;
mod jsx_types;
mod pattern_types;
mod recipe_types;
mod strict_props;

use std::collections::{BTreeMap, BTreeSet, HashSet};

use pandacss_config::{
    ConditionTypeData, JsxFramework, JsxStylePropsConfig, PatternPropertyTypeKind, PrimitiveType,
    TokenTypeData, UtilityPropertyTypeData, UtilityTypeData, ValueTypePart,
};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, ConfigDependency, DependencySet,
    ExportDecl, ImportDecl, Item, ItemNode, Module,
    graph::{GenerateOptions, emit_module_files},
};

pub(crate) use recipe_types::concrete_recipe_types;

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
        "types/tokens",
        &tokens_module(&ctx.types.tokens),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::CodegenImportExtensions,
            ConfigDependency::Tokens,
            ConfigDependency::Themes,
        ]),
    ));

    files.extend(emit_type_file(
        "types/system",
        &system_module(
            &ctx.types.conditions,
            &ctx.types.utilities,
            ctx.types.options,
        ),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::CodegenImportExtensions,
            ConfigDependency::Conditions,
            ConfigDependency::Tokens,
            ConfigDependency::Utilities,
            ConfigDependency::Syntax,
        ]),
    ));

    files.extend(emit_type_file(
        "types/pattern",
        &pattern_types::module(),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::CodegenImportExtensions,
            ConfigDependency::Patterns,
            ConfigDependency::Tokens,
            ConfigDependency::Utilities,
        ]),
    ));

    files.extend(emit_type_file(
        "types/recipe",
        &recipe_types::module(),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::CodegenImportExtensions,
        ]),
    ));

    if ctx
        .config
        .jsx_framework
        .as_ref()
        .is_some_and(JsxFramework::is_known)
    {
        files.extend(emit_type_file(
            "types/jsx",
            &jsx_types::module(ctx),
            options,
            DependencySet::from_slice(&[
                ConfigDependency::CodegenFormat,
                ConfigDependency::CodegenImportExtensions,
                ConfigDependency::JsxFactory,
                ConfigDependency::JsxFramework,
                ConfigDependency::JsxStyleProps,
                ConfigDependency::Syntax,
            ]),
        ));
    }

    files.extend(emit_type_file(
        "types/index",
        &index_module(ctx),
        options,
        DependencySet::from_slice(&[
            ConfigDependency::CodegenFormat,
            ConfigDependency::CodegenImportExtensions,
            ConfigDependency::Conditions,
            ConfigDependency::JsxFactory,
            ConfigDependency::JsxFramework,
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
        options.import_extensions,
        dependencies,
    )
}

fn condition_type_parts(
    data: &ConditionTypeData,
    options: pandacss_config::TypegenOptions,
) -> Vec<String> {
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
    let container_name = string_union_with_fallback(&data.containers, "AnyString");

    // PORT NOTE: v1 arrays are `Array<V | null>`; the `undefined` member only
    // leaked in through csstype's optional-property fallback, which strictTokens
    // dropped — so sparse `undefined` entries error exactly when strictTokens is on.
    let array_member = if options.strict_tokens {
        "Array<T | null>"
    } else {
        "Array<T | null | undefined>"
    };

    vec![format!(
        "export interface Conditions {{\n{condition_members}\n}}\n\n\
         export interface Breakpoints {{\n{breakpoint_members}\n}}\n\n\
         export type ContainerName = {container_name}\n\
         export type ContainerValue = ContainerName | `${{ContainerName}} / inline-size` | `${{ContainerName}} / size` | AnyString\n\n\
         export type Condition = keyof Conditions\n\n\
         export type ConditionalValue<T> =\n  | T\n  | {array_member}\n  | {{ [K in Condition]?: ConditionalValue<T> }}"
    )]
}

fn tokens_module(data: &TokenTypeData) -> Module {
    let mut parts = Vec::new();

    if data.categories.is_empty() {
        parts.push("export type Token = string".to_owned());
        parts.push("export type ColorOpacityModifier = `${number}`".to_owned());
        parts.push("export type ColorOpacityToken = never".to_owned());
        parts.push("export interface Tokens {}".to_owned());
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

        let token = data
            .categories
            .values()
            .map(|category| format!("`{}.${{{}}}`", category.name, category.type_name))
            .collect::<Vec<_>>()
            .join(" | ");
        parts.push(format!("export type Token = {token}"));

        let opacity_modifier = data
            .categories
            .values()
            .find(|category| category.name == "opacity")
            .map_or_else(
                || "`${number}`".to_owned(),
                |category| format!("`${{number}}` | {}", category.type_name),
            );
        parts.push(format!(
            "export type ColorOpacityModifier = {opacity_modifier}"
        ));

        let color_opacity_token = data
            .categories
            .values()
            .find(|category| category.name == "colors")
            .map_or_else(
                || "never".to_owned(),
                |category| {
                    format!(
                        "`colors.${{{}}}/${{ColorOpacityModifier}}`",
                        category.type_name
                    )
                },
            );
        parts.push(format!(
            "export type ColorOpacityToken = {color_opacity_token}"
        ));
    }

    parts.push("export type TokenPath = Token | ColorOpacityToken".to_owned());

    if data.color_palettes.is_empty() {
        parts.push("export type ColorPalette = string".to_owned());
    } else {
        parts.push(format!(
            "export type ColorPalette = {}",
            string_union(&data.color_palettes, "string")
        ));
    }

    parts.push(
        "export type TokenValue<T extends string> = T extends keyof Tokens ? Tokens[T] : never"
            .to_owned(),
    );

    raw_type_module(parts.join("\n\n"))
}

fn value_alias_parts(
    data: &UtilityTypeData,
    options: pandacss_config::TypegenOptions,
) -> Vec<String> {
    let strict = options.strict_tokens || options.strict_property_values;

    // The color-opacity / important modifiers are only reachable from strict
    // aliases — keep the default (non-strict) output on the lean escape hatch.
    let escape_hatch = if strict {
        "type WithColorOpacityModifier<T> = [T] extends [string] ? `${T}/${string}` & { __colorOpacityModifier?: true } : never\n\n\
         type ImportantMark = \"!\" | \"!important\"\n\
         type WhitespaceImportant = ` ${ImportantMark}`\n\
         type Important = ImportantMark | WhitespaceImportant\n\
         type WithImportant<T> = [T] extends [string] ? `${T}${Important}` & { __important?: true } : never\n\n\
         export type WithEscapeHatch<T> = T | `[${string}]` | WithColorOpacityModifier<T> | WithImportant<T>"
            .to_owned()
    } else {
        "export type WithEscapeHatch<T> = T | `[${string}]`".to_owned()
    };

    let mut parts = vec![
        "export type AnyString = string & {}".to_owned(),
        "export type AnyNumber = number & {}".to_owned(),
        "export type CssVars = `var(--${string})`".to_owned(),
        escape_hatch,
        "export type OnlyKnown<Value> = Value extends boolean ? Value : Value extends `${infer _}` ? Value : never".to_owned(),
    ];

    let strict_entries = strict_alias_entries(data);
    let needed_aliases = needed_utility_aliases(data, options);

    for alias in data.aliases.values() {
        if !needed_aliases.contains(alias.name.as_str()) {
            continue;
        }
        parts.push(format!(
            "export type {} = {}",
            alias.name,
            value_alias_type(
                &alias.parts,
                options,
                strict_entries.get(alias.name.as_str()).copied()
            )
        ));
    }

    parts
}

/// Map each utility value alias to its native CSS property entry when the alias
/// should inherit `strict_props` shapes in default mode.
fn strict_alias_entries(
    data: &UtilityTypeData,
) -> std::collections::BTreeMap<&str, &'static strict_props::PropertyValueEntry> {
    let mut entries = std::collections::BTreeMap::new();
    for property in data.properties.values() {
        if property.token_category.is_some() {
            continue;
        }
        let css_property = property.css_property.as_deref().unwrap_or(&property.name);
        if let Some(entry) = strict_props::property_value_entry(css_property) {
            entries.insert(property.alias.as_str(), entry);
        }
    }
    entries
}

/// Resolved conditional value type for one native CSS property key.
fn native_css_property_value_type(name: &str, options: pandacss_config::TypegenOptions) -> String {
    let Some(entry) = strict_props::property_value_entry(name) else {
        return "CssValue".into();
    };

    if should_strict_narrow_native_property(name, entry, options) {
        return strict_property_value_type(entry, &[], None);
    }

    css_property_member_value(entry)
}

fn should_strict_narrow_native_property(
    name: &str,
    entry: &strict_props::PropertyValueEntry,
    options: pandacss_config::TypegenOptions,
) -> bool {
    if options.strict_property_values && strict_props::is_strict_property_list(name) {
        return true;
    }

    options.strict_tokens
        && strict_props::is_strict_property_list(name)
        && matches!(entry.keywords_open(), Some(false))
}

/// Resolved conditional value type for one configured utility key.
fn utility_system_property_type(
    property: &UtilityPropertyTypeData,
    options: pandacss_config::TypegenOptions,
) -> String {
    let alias = property.alias.as_str();
    if options.strict_tokens {
        return alias.to_owned();
    }

    if property.token_category.is_some() {
        return match utility_css_fallback_type(property) {
            Some(fallback) => render_ts_union([alias.to_owned(), fallback]),
            None => alias.to_owned(),
        };
    }

    if !options.strict_property_values && is_native_strict_mirror(property) {
        let css_property = property
            .css_property
            .as_deref()
            .unwrap_or(property.name.as_str());
        if let Some(entry) = strict_props::property_value_entry(css_property) {
            return css_property_member_value(entry);
        }
    }

    let css_property = property
        .css_property
        .as_deref()
        .unwrap_or(property.name.as_str());

    // Default-mode aliases already union native CSS shapes for strict_props keys.
    if strict_props::property_value_entry(css_property).is_some() {
        return alias.to_owned();
    }

    render_ts_union([alias.to_owned(), "CssValue".into()])
}

/// v1 `cssFallback`: when a utility's resolved CSS property is a known native
/// prop, union its `PropertyValueMap` entry (or `CssValue`) in default mode.
fn utility_css_fallback_type(property: &UtilityPropertyTypeData) -> Option<String> {
    let css_property = property
        .css_property
        .as_deref()
        .unwrap_or(property.name.as_str());

    if !pandacss_shared::css_properties::is_css_property(css_property) {
        return None;
    }

    Some(css_property_value_ref(css_property))
}

/// Utility that only mirrors a native strict-prop entry — no tokens, literals, or
/// custom value map. These use the native `PropertyValueMap` entry on `SystemProperties`.
fn is_native_strict_mirror(property: &UtilityPropertyTypeData) -> bool {
    if property.token_category.is_some()
        || !property.literals.is_empty()
        || property.primitive.is_some()
    {
        return false;
    }

    let css_property = property
        .css_property
        .as_deref()
        .unwrap_or(property.name.as_str());
    strict_props::property_value_entry(css_property).is_some()
}

fn needed_utility_aliases(
    data: &UtilityTypeData,
    options: pandacss_config::TypegenOptions,
) -> HashSet<String> {
    let mut needed = HashSet::new();
    for property in data.properties.values() {
        if options.strict_tokens
            || options.strict_property_values
            || property.token_category.is_some()
            || !is_native_strict_mirror(property)
        {
            needed.insert(property.alias.clone());
        }
    }
    needed
}

fn format_property_member(name: &str, value_type: &str) -> String {
    format!(
        "  {}?: ConditionalValue<{}>",
        quote_member(name),
        value_type
    )
}

/// Emit a single `SystemProperties` surface: native CSS props plus utility overrides.
fn build_system_properties_members(
    data: &UtilityTypeData,
    options: pandacss_config::TypegenOptions,
) -> String {
    let mut overrides: BTreeMap<&str, String> = BTreeMap::new();

    for property in data.properties.values() {
        if matches!(property.name.as_str(), "container" | "containerName") {
            continue;
        }
        if options.strict_tokens
            || options.strict_property_values
            || !is_native_strict_mirror(property)
        {
            overrides.insert(
                property.name.as_str(),
                utility_system_property_type(property, options),
            );
        }
    }

    overrides.insert("container", "ContainerValue".into());
    overrides.insert("containerName", "ContainerName".into());

    if options.strict_property_values || options.strict_tokens {
        let covered = data
            .properties
            .values()
            .map(|property| property.css_property.as_deref().unwrap_or(&property.name))
            .collect::<BTreeSet<_>>();

        for entry in strict_props::PROPERTY_VALUES
            .iter()
            .filter(|entry| !covered.contains(entry.name))
            .filter(|entry| should_strict_narrow_native_property(entry.name, entry, options))
        {
            overrides.insert(entry.name, strict_property_value_type(entry, &[], None));
        }
    }

    let mut members = pandacss_shared::css_properties::CSS_PROPERTY_NAMES
        .iter()
        .map(|&name| {
            let value_type = overrides
                .remove(name)
                .unwrap_or_else(|| native_css_property_value_type(name, options));
            format_property_member(name, &value_type)
        })
        .collect::<Vec<_>>();

    for (name, value_type) in overrides {
        members.push(format_property_member(name, &value_type));
    }

    members.join("\n")
}

fn render_ts_union(parts: impl IntoIterator<Item = String>) -> String {
    let mut rendered = Vec::new();
    for part in parts {
        for atom in part.split(" | ") {
            if atom.is_empty() {
                continue;
            }
            let atom = atom.to_owned();
            if !rendered.contains(&atom) {
                rendered.push(atom);
            }
        }
    }

    if rendered.iter().any(|part| {
        matches!(
            part.as_str(),
            "ColorGlobals" | "DimensionGlobals" | "AutoGlobals"
        )
    }) {
        rendered.retain(|part| part != "Globals");
    }

    if rendered.iter().any(|part| part == "number") {
        rendered.retain(|part| part != "AnyNumber");
    }

    rendered.join(" | ")
}

/// Shared CSS value aliases and `PropertyValueMap` sourced from csstype `DataType.*`.
fn css_datatype_type_parts() -> Vec<String> {
    vec![
        r#"export type Globals = "inherit" | "initial" | "revert" | "revert-layer" | "unset""#.into(),
        r#"export type ColorGlobals = Globals | "currentColor" | "transparent""#.into(),
        r#"export type DimensionGlobals = Globals | "auto" | "fit-content" | "max-content" | "min-content""#.into(),
        r#"export type AutoGlobals = Globals | "auto""#.into(),
        "export type LengthValue = DimensionGlobals | (string & {}) | number".into(),
        format!(
            "export type NamedColor = {}",
            data_type::literals_union(data_type::NAMED_COLORS)
        ),
        format!(
            "export type SystemColor = {}",
            data_type::literals_union(data_type::SYSTEM_COLORS)
        ),
        "export type ColorCssValue = ColorGlobals | NamedColor | SystemColor | (string & {})".into(),
        format!(
            "export type AbsoluteSize = {}",
            data_type::literals_union(data_type::ABSOLUTE_SIZES)
        ),
        format!(
            "export type BgSizeValue = LengthValue | {}",
            data_type::literals_union(data_type::BG_SIZE_KEYWORDS)
        ),
        "export type FontSizeValue = LengthValue | AbsoluteSize | \"larger\" | \"smaller\" | \"math\"".into(),
        format!(
            "export type FontWeightValue = Globals | {} | (string & {{}}) | number",
            data_type::literals_union(data_type::FONT_WEIGHT_KEYWORDS)
        ),
        format!(
            "export type LineWidthValue = LengthValue | {}",
            data_type::literals_union(data_type::LINE_WIDTH_KEYWORDS)
        ),
        format!(
            "export type LineStyleValue = Globals | {}",
            data_type::literals_union(data_type::LINE_STYLE_KEYWORDS)
        ),
        "export type OpenLineStyleValue = LineStyleValue | (string & {})".into(),
        format!(
            "export type RepeatStyleValue = Globals | {} | (string & {{}})",
            data_type::literals_union(data_type::REPEAT_STYLE_KEYWORDS)
        ),
        format!(
            "export type FontStretchValue = Globals | {} | (string & {{}})",
            data_type::literals_union(data_type::FONT_STRETCH_KEYWORDS)
        ),
        format!(
            "export type OverflowCssValue = Globals | {}",
            data_type::literals_union(data_type::OVERFLOW_KEYWORDS)
        ),
        "export type OpenOverflowCssValue = OverflowCssValue | (string & {})".into(),
        format!(
            "export type OverflowShortCssValue = Globals | {}",
            data_type::literals_union(data_type::OVERFLOW_SHORT_KEYWORDS)
        ),
        format!(
            "export type OverscrollBehaviorCssValue = Globals | {}",
            data_type::literals_union(data_type::OVERSCROLL_BEHAVIOR_KEYWORDS)
        ),
        "export type OpenOverscrollBehaviorCssValue = OverscrollBehaviorCssValue | (string & {})"
            .into(),
        format!(
            "export type PositionValue = LengthValue | {}",
            data_type::literals_union(data_type::POSITION_KEYWORDS)
        ),
        format!(
            "export type GenericFamily = {}",
            data_type::literals_union(data_type::GENERIC_FAMILIES)
        ),
        "export type FontFamilyValue = Globals | GenericFamily | (string & {})".into(),
        "export type NumericCssValue = Globals | (string & {}) | number".into(),
        "export type ZIndexValue = AutoGlobals | (string & {}) | number".into(),
        "export type CssValue = Globals | (string & {}) | number".into(),
        property_value_map_declaration(),
    ]
}

/// The single combined type surface: `SystemProperties`, selectors, the recursive
/// `SystemStyleObject`, globals, and keyframe/fontface shapes — all in one file so
/// there are no cross-module boundaries on the hot path.
fn system_module(
    conditions: &ConditionTypeData,
    data: &UtilityTypeData,
    options: pandacss_config::TypegenOptions,
) -> Module {
    let jsx_style_props = options.jsx_style_props;
    let system_members = build_system_properties_members(data, options);

    let mut parts: Vec<String> = vec![
        "export type Pretty<T> = { [K in keyof T]: T[K] } & {}".into(),
        "export type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never".into(),
        "export type DistributiveUnion<T, U> = {\n  [K in keyof T]: K extends keyof U ? U[K] | T[K] : T[K]\n} & DistributiveOmit<U, keyof T>".into(),
        "export type Assign<T, U> = {\n  [K in keyof T]: K extends keyof U ? U[K] : T[K]\n} & U".into(),
    ];
    parts.extend(condition_type_parts(conditions, options));
    parts.extend(value_alias_parts(data, options));
    parts.extend(vec![
        r#"export type AtRuleType = "media" | "layer" | "container" | "supports" | "page" | "scope" | "starting-style""#.into(),
        "export type Selector = `${string}&` | `&${string}` | `@${AtRuleType}${string}`".into(),
        "export type AnySelector = Selector | string".into(),
        "export type Nested<P> = P & {\n  [K in Selector]?: Nested<P>\n} & {\n  [K in AnySelector]?: Nested<P>\n} & {\n  [K in Condition]?: Nested<P>\n}".into(),
    ]);
    parts.extend(css_datatype_type_parts());
    parts.extend(vec![
        format!("export interface SystemProperties {{\n{system_members}\n}}"),
        "export type CssVarValue = ConditionalValue<CssVars | AnyString | AnyNumber>".into(),
        "export type CssVarProperties = {\n  [K in `--${string}`]?: CssVarValue\n}".into(),
        "export type NestedStyles = {\n  [K in Selector | Condition]?: SystemStyleObject\n}".into(),
        "export interface SystemStyleObject extends SystemProperties, CssVarProperties, NestedStyles {}".into(),
        "export interface GlobalStyleObject {\n  [selector: string]: SystemStyleObject\n}".into(),
        "export interface CssKeyframes {\n  [name: string]: {\n    [time: string]: SystemStyleObject\n  }\n}".into(),
        r#"export interface GlobalFontfaceRule {
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
}"#
        .into(),
    ]);
    parts.extend(jsx_style_type_parts(jsx_style_props));

    Module::new()
        .with_import(ImportDecl::ty(["TokenValue"], "./tokens"))
        .with_item(type_raw(parts.join("\n\n")))
}

fn property_value_map_declaration() -> String {
    let mut canonical_keywords: BTreeMap<(String, bool), &str> = BTreeMap::new();
    let members = strict_props::PROPERTY_VALUES
        .iter()
        .map(|entry| {
            format!(
                "  {}: {}",
                quote_member(entry.name),
                property_value_map_member_type(entry, &mut canonical_keywords)
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    format!("export type PropertyValueMap = {{\n{members}\n}}")
}

fn keywords_signature(keywords: &[&str], open: bool) -> (String, bool) {
    (keywords.join("\0"), open)
}

fn property_value_map_member_type(
    entry: &strict_props::PropertyValueEntry,
    canonical_keywords: &mut BTreeMap<(String, bool), &str>,
) -> String {
    if let strict_props::PropertyValueKind::Keywords { keywords, open } = entry.kind {
        let signature = keywords_signature(keywords, open);
        if let Some(canonical) = canonical_keywords.get(&signature) {
            return format!("PropertyValueMap[{}]", string_literal(canonical));
        }
        canonical_keywords.insert(signature, entry.name);
    }

    property_value_raw_type(entry)
}

fn property_value_raw_type(entry: &strict_props::PropertyValueEntry) -> String {
    match entry.kind {
        strict_props::PropertyValueKind::Keywords { keywords, open } => {
            keywords_value_type(keywords, open)
        }
        strict_props::PropertyValueKind::Length => "LengthValue".into(),
        strict_props::PropertyValueKind::Color => "ColorCssValue".into(),
        strict_props::PropertyValueKind::Numeric => "NumericCssValue".into(),
        strict_props::PropertyValueKind::ZIndex => "ZIndexValue".into(),
        strict_props::PropertyValueKind::BgSize => "BgSizeValue".into(),
        strict_props::PropertyValueKind::FontSize => "FontSizeValue".into(),
        strict_props::PropertyValueKind::FontWeight => "FontWeightValue".into(),
        strict_props::PropertyValueKind::LineWidth => "LineWidthValue".into(),
        strict_props::PropertyValueKind::Position => "PositionValue".into(),
        strict_props::PropertyValueKind::FontFamily => "FontFamilyValue".into(),
        strict_props::PropertyValueKind::LineStyle { open } => {
            if open {
                "OpenLineStyleValue".into()
            } else {
                "LineStyleValue".into()
            }
        }
        strict_props::PropertyValueKind::RepeatStyle => "RepeatStyleValue".into(),
        strict_props::PropertyValueKind::FontStretch => "FontStretchValue".into(),
        strict_props::PropertyValueKind::Overflow { open } => {
            if open {
                "OpenOverflowCssValue".into()
            } else {
                "OverflowCssValue".into()
            }
        }
        strict_props::PropertyValueKind::OverflowShort => "OverflowShortCssValue".into(),
        strict_props::PropertyValueKind::OverscrollBehavior { open } => {
            if open {
                "OpenOverscrollBehaviorCssValue".into()
            } else {
                "OverscrollBehaviorCssValue".into()
            }
        }
    }
}

fn keywords_value_type(keywords: &[&str], open: bool) -> String {
    if keywords.is_empty() {
        return "Globals".into();
    }

    let rendered = keywords
        .iter()
        .map(|keyword| string_literal(keyword))
        .collect::<Vec<_>>()
        .join(" | ");

    if open {
        format!("Globals | {rendered} | (string & {{}})")
    } else {
        format!("Globals | {rendered}")
    }
}

fn css_property_member_value(entry: &strict_props::PropertyValueEntry) -> String {
    let inner = css_property_value_ref(entry.name);
    if native_css_property_needs_any_string(entry) {
        format!("{inner} | AnyString")
    } else {
        inner
    }
}

fn css_property_value_ref(property: &str) -> String {
    if strict_props::property_value_entry(property).is_some() {
        format!("PropertyValueMap[{}]", string_literal(property))
    } else {
        "CssValue".into()
    }
}

fn jsx_style_type_parts(mode: JsxStylePropsConfig) -> Vec<String> {
    let jsx_style_props = match mode {
        JsxStylePropsConfig::All => "SystemStyleObject & WithCss",
        JsxStylePropsConfig::Minimal => "WithCss",
        JsxStylePropsConfig::None => "{}",
    };
    let html_props = match mode {
        JsxStylePropsConfig::All => {
            "export type JsxHTMLProps<T extends Record<string, any>, P extends Record<string, any> = {}> = Assign<WithHTMLProps<T>, P>"
        }
        JsxStylePropsConfig::Minimal | JsxStylePropsConfig::None => {
            "export type JsxHTMLProps<T extends Record<string, any>, P extends Record<string, any> = {}> = Omit<T, keyof P> & P"
        }
    };

    vec![format!(
        r#"interface WithCss {{
  css?: SystemStyleObject | SystemStyleObject[]
}}

export type JsxStyleProps = {jsx_style_props}

export interface PatchedHTMLProps {{
  htmlWidth?: string | number
  htmlHeight?: string | number
  htmlTranslate?: "yes" | "no" | undefined
  htmlContent?: string
}}

export type OmittedHTMLProps = "color" | "translate" | "transition" | "width" | "height" | "content"

type WithHTMLProps<T> = DistributiveOmit<T, OmittedHTMLProps> & PatchedHTMLProps

{html_props}"#
    )]
}

fn index_module(ctx: CodegenContext<'_>) -> Module {
    // `./system` carries SystemProperties, selectors, and SystemStyleObject.
    let mut sources = vec!["./tokens", "./system", "./pattern", "./recipe"];
    // Re-export `./jsx` for any known framework — mirrors the jsx artifact gate.
    if ctx
        .config
        .jsx_framework
        .as_ref()
        .is_some_and(JsxFramework::is_known)
    {
        sources.push("./jsx");
    }

    sources.into_iter().fold(Module::new(), |module, source| {
        module.with_item(Item::ty(ItemNode::Export(ExportDecl::TypeStar {
            source: source.into(),
        })))
    })
}

fn raw_type_module(code: impl Into<String>) -> Module {
    Module::new().with_item(type_raw(code))
}

fn type_raw(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}

fn value_alias_type(
    parts: &[ValueTypePart],
    options: pandacss_config::TypegenOptions,
    strict_entry: Option<&'static strict_props::PropertyValueEntry>,
) -> String {
    let mapped_css_property = mapped_css_property_from_parts(parts);
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

        // CSS-wide keywords (and the non-tokenizable per-category keywords like
        // `auto`/`currentColor`) stay assignable under strictTokens — they have no
        // token to substitute and aren't a design-drift risk.
        let globals = strict_token_globals(parts);
        return format!("WithEscapeHatch<{globals} | {strict_type}>");
    }

    // Properties in the v1 `strictPropertyList` narrow to their CSS keyword
    // union (configured utility values take precedence over the csstype-derived
    // table). v1's strictTokens also narrowed these when the csstype union was
    // closed (no `(string & {})` member), e.g. `position` — mirror that.
    if let Some(entry) = strict_entry
        && entry.is_keywords()
        && should_strict_narrow_native_property(entry.name, entry, options)
    {
        let literals = parts
            .iter()
            .filter(|part| matches!(part, ValueTypePart::Literal(_)))
            .map(value_part)
            .collect::<Vec<_>>();
        let css_property = mapped_css_property.filter(|_| !options.strict_tokens);
        return strict_property_value_type(entry, &literals, css_property);
    }

    // strictTokens: utilities with configured values are strict even without a
    // token category — v1 dropped the freeform csstype fallback for any utility
    // that had a values map. Number/boolean primitive hints keep their primitive
    // (mirrors v1's `UtilityValues` entries); a freeform `string` primitive makes
    // the wrap a no-op, so those aliases stay on the plain loose union.
    let freeform = parts
        .iter()
        .any(|part| matches!(part, ValueTypePart::Primitive(PrimitiveType::String)));
    if options.strict_tokens && !freeform {
        let strict_parts = parts
            .iter()
            .filter(|part| {
                !matches!(
                    part,
                    ValueTypePart::AnyString
                        | ValueTypePart::AnyNumber
                        | ValueTypePart::CssProperty(_)
                )
            })
            .map(value_part)
            .collect::<Vec<_>>();

        if !strict_parts.is_empty() {
            return format!("WithEscapeHatch<Globals | {}>", strict_parts.join(" | "));
        }
    }

    if let Some(entry) = strict_entry
        && !options.strict_tokens
        && !options.strict_property_values
    {
        return default_utility_alias_with_native(parts, entry);
    }

    value_parts_union(parts, options.strict_tokens)
}

fn default_utility_alias_with_native(
    parts: &[ValueTypePart],
    entry: &strict_props::PropertyValueEntry,
) -> String {
    let native = css_property_value_ref(entry.name);
    let mut rendered: Vec<String> = parts
        .iter()
        .filter(|part| {
            !matches!(
                part,
                ValueTypePart::Primitive(_)
                    | ValueTypePart::CssProperty(_)
                    | ValueTypePart::AnyString
            )
        })
        .map(value_part)
        .collect();
    rendered.push(native);
    if native_css_property_needs_any_string(entry) {
        rendered.push("AnyString".into());
    }
    if !rendered.iter().any(|part| part == "CssVars") {
        rendered.push("CssVars".into());
    }
    if !rendered
        .iter()
        .any(|part| part == "AnyNumber" || part == "number")
    {
        rendered.push("AnyNumber".into());
    }
    render_ts_union(rendered)
}

fn native_css_property_needs_any_string(entry: &strict_props::PropertyValueEntry) -> bool {
    matches!(
        entry.kind,
        strict_props::PropertyValueKind::Keywords { open: false, .. }
            | strict_props::PropertyValueKind::LineStyle { open: false }
            | strict_props::PropertyValueKind::Overflow { open: false }
            | strict_props::PropertyValueKind::OverflowShort
            | strict_props::PropertyValueKind::OverscrollBehavior { open: false }
    )
}

fn mapped_css_property_from_parts(parts: &[ValueTypePart]) -> Option<&str> {
    parts.iter().find_map(|part| {
        if let ValueTypePart::CssProperty(property) = part {
            Some(property.as_str())
        } else {
            None
        }
    })
}

/// Strict native / utility value types with escape hatches where applicable.
fn strict_property_value_type(
    entry: &strict_props::PropertyValueEntry,
    literals: &[String],
    mapped_css_property: Option<&str>,
) -> String {
    // Open keyword props keep `(string & {})` on `PropertyValueMap` for default mode.
    // Under strict narrowing, emit closed keyword unions instead of indexing the map.
    if literals.is_empty()
        && mapped_css_property.is_none()
        && let strict_props::PropertyValueKind::Keywords {
            keywords,
            open: true,
            ..
        } = entry.kind
    {
        return strict_keywords_type(keywords, &[], None);
    }

    if literals.is_empty() && mapped_css_property.is_none() && entry.is_keywords() {
        return format!("WithEscapeHatch<{}>", css_property_value_ref(entry.name));
    }

    match entry.kind {
        strict_props::PropertyValueKind::Keywords { keywords, .. } => {
            strict_keywords_type(keywords, literals, mapped_css_property)
        }
        strict_props::PropertyValueKind::Length => "WithEscapeHatch<LengthValue>".into(),
        strict_props::PropertyValueKind::Color => "WithEscapeHatch<ColorCssValue>".into(),
        strict_props::PropertyValueKind::Numeric => "WithEscapeHatch<NumericCssValue>".into(),
        strict_props::PropertyValueKind::ZIndex => "WithEscapeHatch<ZIndexValue>".into(),
        strict_props::PropertyValueKind::BgSize => "WithEscapeHatch<BgSizeValue>".into(),
        strict_props::PropertyValueKind::FontSize => "WithEscapeHatch<FontSizeValue>".into(),
        strict_props::PropertyValueKind::FontWeight => "WithEscapeHatch<FontWeightValue>".into(),
        strict_props::PropertyValueKind::LineWidth => "WithEscapeHatch<LineWidthValue>".into(),
        strict_props::PropertyValueKind::Position => "WithEscapeHatch<PositionValue>".into(),
        strict_props::PropertyValueKind::FontFamily => "WithEscapeHatch<FontFamilyValue>".into(),
        strict_props::PropertyValueKind::LineStyle { .. } => strict_keywords_type(
            data_type::LINE_STYLE_KEYWORDS,
            literals,
            mapped_css_property,
        ),
        strict_props::PropertyValueKind::RepeatStyle => strict_keywords_type(
            data_type::REPEAT_STYLE_KEYWORDS,
            literals,
            mapped_css_property,
        ),
        strict_props::PropertyValueKind::FontStretch => strict_keywords_type(
            data_type::FONT_STRETCH_KEYWORDS,
            literals,
            mapped_css_property,
        ),
        strict_props::PropertyValueKind::Overflow { .. } => {
            strict_keywords_type(data_type::OVERFLOW_KEYWORDS, literals, mapped_css_property)
        }
        strict_props::PropertyValueKind::OverflowShort => strict_keywords_type(
            data_type::OVERFLOW_SHORT_KEYWORDS,
            literals,
            mapped_css_property,
        ),
        strict_props::PropertyValueKind::OverscrollBehavior { .. } => strict_keywords_type(
            data_type::OVERSCROLL_BEHAVIOR_KEYWORDS,
            literals,
            mapped_css_property,
        ),
    }
}

fn strict_keywords_type(
    keywords: &[&str],
    literals: &[String],
    mapped_css_property: Option<&str>,
) -> String {
    let mut rendered = if literals.is_empty() {
        keywords
            .iter()
            .map(|keyword| string_literal(keyword))
            .collect::<Vec<_>>()
    } else {
        literals.to_vec()
    };

    if let Some(property) = mapped_css_property {
        rendered.push(css_property_value_ref(property));
    }

    if rendered.is_empty() {
        return "WithEscapeHatch<Globals | CssVars>".into();
    }

    format!(
        "WithEscapeHatch<Globals | CssVars | OnlyKnown<{}>>",
        rendered.join(" | ")
    )
}

fn value_parts_union(parts: &[ValueTypePart], strict_tokens: bool) -> String {
    // Union the mapped css property's raw value type into value aliases only when
    // the utility config declares an explicit `property` field and `strictTokens`
    // is off.
    let mut rendered = parts
        .iter()
        .filter(|part| !(strict_tokens && matches!(part, ValueTypePart::CssProperty(_))))
        .map(value_part)
        .collect::<Vec<_>>();

    if rendered.is_empty() {
        return "unknown".into();
    }

    // Mirror strictTokens: token utilities accept category globals (currentColor,
    // auto, …) in default mode too — including shorthands sharing the alias.
    if !strict_tokens && has_token_part(parts) {
        rendered.insert(0, strict_token_globals(parts));
    }

    if !rendered
        .iter()
        .any(|part| part == "AnyNumber" || part == "number")
    {
        rendered.push("AnyNumber".into());
    }

    render_ts_union(rendered)
}

fn has_token_part(parts: &[ValueTypePart]) -> bool {
    parts
        .iter()
        .any(|part| matches!(part, ValueTypePart::TokenCategory(_)))
}

/// The globals alias a token category's strict type unions in: the CSS-wide
/// keywords plus the non-tokenizable keywords that category's properties accept
/// (per csstype). Categories with no extra keywords fall back to bare `Globals`.
fn category_globals(category: &str) -> &'static str {
    match category {
        "colors" => "ColorGlobals",
        "sizes" => "DimensionGlobals",
        "spacing" | "zIndex" | "aspectRatios" => "AutoGlobals",
        _ => "Globals",
    }
}

/// Union of the globals aliases for every token category present in `parts`.
fn strict_token_globals(parts: &[ValueTypePart]) -> String {
    let mut names: Vec<&str> = parts
        .iter()
        .filter_map(|part| match part {
            ValueTypePart::TokenCategory(category) => Some(category_globals(category)),
            _ => None,
        })
        .collect();
    names.sort_unstable();
    names.dedup();
    // Every category alias already includes `Globals`, so drop the bare base when a
    // richer alias is present to keep the union tight.
    if names.len() > 1 {
        names.retain(|name| *name != "Globals");
    }
    if names.is_empty() {
        "Globals".to_owned()
    } else {
        names.join(" | ")
    }
}

fn value_part(part: &ValueTypePart) -> String {
    match part {
        ValueTypePart::TokenCategory(category) => {
            format!("TokenValue<{}>", string_literal(category))
        }
        ValueTypePart::CssProperty(property) => css_property_value_ref(property),
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

fn string_union_with_fallback(values: &[String], fallback: &str) -> String {
    if values.is_empty() {
        return fallback.into();
    }
    format!("{} | {fallback}", string_union(values, fallback))
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
