//! The `types/*` artifacts: the `.d.ts` surface users' editors see — token
//! paths, condition keys, property values, and the system style-object types,
//! derived from the config's [`TypeData`](pandacss_config::TypeData).

mod jsx_types;
mod pattern_types;
mod recipe_types;

use pandacss_config::{
    ConditionTypeData, JsxFramework, JsxStylePropsConfig, PatternPropertyTypeKind, TokenTypeData,
    UtilityTypeData, ValueTypePart,
};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, ConfigDependency, DependencySet,
    ExportDecl, ImportDecl, Item, ItemNode, Module,
    artifact::{GenerateOptions, emit_module_files},
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

    if matches!(ctx.config.jsx_framework.as_ref(), Some(JsxFramework::React)) {
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

fn condition_type_parts(data: &ConditionTypeData) -> Vec<String> {
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

    vec![format!(
        "export interface Conditions {{\n{condition_members}\n}}\n\n\
         export interface Breakpoints {{\n{breakpoint_members}\n}}\n\n\
         export type Condition = keyof Conditions\n\n\
         export type ConditionalValue<T> =\n  | T\n  | Array<T | null>\n  | {{ [K in Condition]?: ConditionalValue<T> }}"
    )]
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

fn value_alias_parts(
    data: &UtilityTypeData,
    options: pandacss_config::TypegenOptions,
) -> Vec<String> {
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

    parts
}

/// The single combined type surface: our own csstype (`CssValue` + `CssProperties`),
/// `SystemProperties`, selectors, the recursive `SystemStyleObject`, globals, and
/// keyframe/fontface shapes — all in one file so there are no cross-module
/// boundaries on the hot path. Every native CSS property shares the single
/// `CssValue`, so all ~850 collapse to one cached `ConditionalValue<CssValue>`;
/// `SystemProperties extends CssProperties` and overrides only the configured
/// utilities with their precise alias (assignable to `CssValue`).
fn system_module(
    conditions: &ConditionTypeData,
    data: &UtilityTypeData,
    options: pandacss_config::TypegenOptions,
) -> Module {
    let jsx_style_props = options.jsx_style_props;
    // One member per native CSS property (shared registry, already sorted, vendor
    // variants included). All share the single `CssValue`.
    let css_members = pandacss_shared::css_properties::CSS_PROPERTY_NAMES
        .iter()
        .map(|&name| format!("  {}?: ConditionalValue<CssValue>", quote_member(name)))
        .collect::<Vec<_>>()
        .join("\n");

    let system_members = data
        .properties
        .values()
        .map(|property| {
            format!(
                "  {}?: ConditionalValue<{}>",
                quote_member(&property.name),
                property.alias
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let mut parts: Vec<String> = vec![
        "export type Pretty<T> = { [K in keyof T]: T[K] } & {}".into(),
        "export type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never".into(),
        "export type DistributiveUnion<T, U> = {\n  [K in keyof T]: K extends keyof U ? U[K] | T[K] : T[K]\n} & DistributiveOmit<U, keyof T>".into(),
        "export type Assign<T, U> = Omit<T, keyof U> & U".into(),
    ];
    parts.extend(condition_type_parts(conditions));
    parts.extend(value_alias_parts(data, options));
    parts.extend(vec![
        "export type Selector = `&${string}` | `@${string}`".into(),
        "export type AnySelector = Selector | string".into(),
        "export type Nested<P> = P & {\n  [K in Selector]?: Nested<P>\n} & {\n  [K in AnySelector]?: Nested<P>\n} & {\n  [K in Condition]?: Nested<P>\n}".into(),
        r#"export type Globals = "inherit" | "initial" | "revert" | "revert-layer" | "unset""#.into(),
        r#"export type ColorGlobals = Globals | "currentColor" | "transparent""#.into(),
        r#"export type DimensionGlobals = Globals | "auto" | "fit-content" | "max-content" | "min-content""#.into(),
        r#"export type AutoGlobals = Globals | "auto""#.into(),
        "export type CssValue = Globals | (string & {}) | number".into(),
        format!("export interface CssProperties {{\n{css_members}\n}}"),
        format!("export interface SystemProperties extends CssProperties {{\n{system_members}\n}}"),
        "export type CssVarValue = ConditionalValue<CssVars | AnyString | AnyNumber>".into(),
        "export type CssVarProperties = {\n  [K in `--${string}`]?: CssVarValue\n}".into(),
        "export type NestedStyles = {\n  [K in Selector | Condition]?: SystemStyleObject\n}".into(),
        "export interface SystemStyleObject extends SystemProperties, CssVarProperties, NestedStyles {}".into(),
        "export interface GlobalStyleObject {\n  [selector: string]: SystemStyleObject\n}".into(),
        "export interface CssKeyframes {\n  [name: string]: {\n    [time: string]: CssProperties\n  }\n}".into(),
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

fn jsx_style_type_parts(mode: JsxStylePropsConfig) -> Vec<String> {
    let jsx_style_props = match mode {
        JsxStylePropsConfig::All => "SystemStyleObject & WithCss",
        JsxStylePropsConfig::Minimal => "WithCss",
        JsxStylePropsConfig::None => "{}",
    };
    let html_props = match mode {
        JsxStylePropsConfig::All => {
            "export type JsxHTMLProps<T extends Record<string, any>, P extends Record<string, any> = {}> = Omit<T, keyof P | OmittedHTMLProps> & PatchedHTMLProps & P"
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

{html_props}"#
    )]
}

fn index_module(ctx: CodegenContext<'_>) -> Module {
    // `./system` carries our own CssProperties + SystemProperties + selectors +
    // SystemStyleObject (merged); re-exported via the star below.
    let mut sources = vec!["./tokens", "./system", "./pattern", "./recipe"];
    if matches!(ctx.config.jsx_framework.as_ref(), Some(JsxFramework::React)) {
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

        // CSS-wide keywords (and the non-tokenizable per-category keywords like
        // `auto`/`currentColor`) stay assignable under strictTokens — they have no
        // token to substitute and aren't a design-drift risk.
        let globals = strict_token_globals(parts);
        return format!("WithEscapeHatch<{globals} | {strict_type}>");
    }

    // Keyword properties (e.g. `display`) restrict to their configured literal
    // values via `OnlyKnown`, with `[arbitrary]` as the escape hatch. Keywords come
    // from the utility config now, not csstype.
    if options.strict_property_values && !token_backed {
        let keyword_parts = parts
            .iter()
            .filter(|part| matches!(part, ValueTypePart::Literal(_)))
            .map(value_part)
            .collect::<Vec<_>>();

        if !keyword_parts.is_empty() {
            return format!(
                "WithEscapeHatch<Globals | OnlyKnown<{}>>",
                keyword_parts.join(" | ")
            );
        }
    }

    value_parts_union(parts)
}

fn value_parts_union(parts: &[ValueTypePart]) -> String {
    // CssProperty parts pointed at the vendored csstype's per-property keyword
    // unions; with our own lean csstype those are gone — `AnyString` carries the
    // freeform CSS value, so drop them.
    let rendered = parts
        .iter()
        .filter(|part| !matches!(part, ValueTypePart::CssProperty(_)))
        .map(value_part)
        .collect::<Vec<_>>();

    if rendered.is_empty() {
        return "unknown".into();
    }

    rendered.join(" | ")
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
