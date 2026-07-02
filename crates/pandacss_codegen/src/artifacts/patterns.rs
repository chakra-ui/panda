//! The `patterns/*` artifacts: one runtime function + type per configured
//! pattern (`stack`, `grid`, …), generated from each pattern's prop set and
//! transform source.

use std::collections::BTreeSet;

use pandacss_config::{
    CssSyntaxKind, PatternConfig, PatternPropertyConfig, PatternPropertyTypeKind,
    PatternTypeDefinition,
};
use pandacss_shared::{file_stem, js_ident, pascal_case};
use serde_json::{Map, Value};

use crate::artifacts::ts_string::is_identifier;

use crate::{
    Artifact, ArtifactFile, ArtifactId, Block, CodegenContext, ConfigDependency, ConstDecl,
    DependencySet, Expr, FunctionDecl, ImportDecl, InterfaceDecl, Item, ItemNode,
    JsDoc, Module, Param, PatternCodegenMeta, Stmt, TsMember, TsMemberName, TsType,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::Patterns,
        dependencies,
        files: files(ctx, options, dependencies),
    }
}

#[must_use]
pub fn files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        return Vec::new();
    }

    let mut module_files = Vec::new();
    let mut names = Vec::new();

    for (name, pattern) in &ctx.config.patterns {
        if ctx
            .overlay
            .is_some_and(|overlay| overlay.owns_pattern(name))
        {
            continue;
        }
        names.push(file_stem(name));
        let meta = ctx.patterns.get(name);
        let definition = ctx.types.patterns.patterns.get(name);
        module_files.extend(emit_module_files(
            &format!("patterns/{}", file_stem(name)),
            &module_with_type_data(name, pattern, definition, meta),
            options.format,
            false,
            options.import_extensions,
            dependencies,
        ));
    }

    let mut files = Vec::new();

    let emit_runtime = if ctx.overlay.is_some() {
        !names.is_empty()
    } else {
        !ctx.config.patterns.is_empty()
    };
    if emit_runtime {
        files.extend(emit_module_files(
            "patterns/runtime",
            &runtime_module(),
            options.format,
            false,
            options.import_extensions,
            DependencySet::from_slice(&[
                ConfigDependency::CodegenFormat,
                ConfigDependency::CodegenImportExtensions,
            ]),
        ));
    }

    files.append(&mut module_files);

    if !names.is_empty()
        || ctx
            .overlay
            .is_some_and(|overlay| !overlay.owned_patterns.is_empty())
    {
        files.extend(emit_module_files(
            "patterns/index",
            &index_module(ctx, &names),
            options.format,
            false,
            options.import_extensions,
            dependencies,
        ));
    }

    files
}

#[must_use]
pub fn module_with_type_data(
    name: &str,
    pattern: &PatternConfig,
    definition: Option<&PatternTypeDefinition>,
    meta: Option<&PatternCodegenMeta>,
) -> Module {
    let function_name = js_ident(name);
    let raw_name = format!("{function_name}Raw");
    let config_name = format!("{function_name}Config");
    let type_name = format!("{}Properties", pascal_case(name));
    let styles_name = format!("{}Styles", pascal_case(name));
    let fn_type_name = format!("{}PatternFn", pascal_case(name));

    let type_imports = type_imports(pattern, definition);
    let mut module = Module::new()
        .with_import(ImportDecl::value(
            ["getPatternStyles", "patternFns"],
            "./runtime",
        ))
        // The public fn pipes styles through `css()` to return a className.
        .with_import(ImportDecl::value(["css"], "../css/index"));

    let pattern_imports = filtered_type_imports(&type_imports, &["PatternRuntimeConfig"]);
    if !pattern_imports.is_empty() {
        module = module.with_import(type_import(pattern_imports, "../types/pattern"));
    }

    let token_imports = filtered_type_imports(&type_imports, &["TokenValue"]);
    if !token_imports.is_empty() {
        module = module.with_import(type_import(token_imports, "../types/tokens"));
    }

    let system_imports = filtered_type_imports(
        &type_imports,
        &["ConditionalValue", "SystemProperties", "SystemStyleObject"],
    );
    if !system_imports.is_empty() {
        module = module.with_import(type_import(system_imports, "../types/system"));
    }

    module
        .with_item(config_const(&config_name, &type_name, pattern, meta))
        .with_item(properties_interface(&type_name, pattern, definition))
        .with_item(styles_interface(
            &styles_name,
            &type_name,
            pattern,
            definition,
        ))
        .with_item(pattern_fn_interface(&fn_type_name, &styles_name))
        .with_item(raw_function(&raw_name, &config_name, &styles_name))
        .with_item(public_function_const(
            &function_name,
            &raw_name,
            &fn_type_name,
        ))
}

fn filtered_type_imports(imports: &BTreeSet<String>, names: &[&str]) -> Vec<String> {
    names
        .iter()
        .filter(|name| imports.contains(**name))
        .map(|name| (*name).to_owned())
        .collect()
}

fn type_import(specifiers: Vec<String>, source: &str) -> ImportDecl {
    ImportDecl {
        kind: crate::ImportKind::Type,
        specifiers: specifiers
            .into_iter()
            .map(crate::ImportSpecifier::Named)
            .collect(),
        source: source.into(),
    }
}

/// Pattern runtime shared by every generated pattern file — the analogue of
/// `recipes/runtime`. Holds the value-resolution helpers (`getPatternStyles`,
/// `patternFns`) so they live with patterns rather than in the global helpers.
fn runtime_module() -> Module {
    Module::new()
        .with_import(ImportDecl::value(["mapObject", "withDefaults"], "../helpers"))
        .with_item(runtime_function(
            "isCssFunction",
            vec![Param::typed("v", TsType::Unknown)],
            TsType::Bool,
            r#"return typeof v === "string" && /^(min|max|clamp|calc)\(.*\)/.test(v)"#,
        ))
        .with_item(runtime_function(
            "isCssVar",
            vec![Param::typed("v", TsType::Unknown)],
            TsType::Bool,
            r#"return typeof v === "string" && /^var\(--.+\)$/.test(v)"#,
        ))
        .with_item(runtime_function(
            "isCssUnit",
            vec![Param::typed("v", TsType::Unknown)],
            TsType::Bool,
            r#"return typeof v === "string" && /^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?(?:cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|rlh|vw|vh|vmin|vmax|vb|vi|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|%)$/.test(v)"#,
        ))
        .with_item(Item::runtime(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "patternFns".into(),
            type_annotation: Some(TsType::Raw(
                "Record<string, (...args: any[]) => any>".into(),
            )),
            init: Some(Expr::Raw(
                "{ map: mapObject, isCssFunction, isCssVar, isCssUnit }".into(),
            )),
            js_doc: None,
        })))
        .with_item(runtime_function(
            "getPatternStyles",
            vec![
                Param::typed("pattern", TsType::Raw("Record<string, any>".into())),
                Param::typed("styles", TsType::Raw("Record<string, any>".into())),
            ],
            TsType::Raw("Record<string, any>".into()),
            indoc::indoc! {r#"
                if (!pattern?.defaultValues) return styles
                const defaults = typeof pattern.defaultValues === "function" ? pattern.defaultValues(styles) : pattern.defaultValues
                return withDefaults(defaults, styles)
            "#}
            .trim(),
        ))
}

fn runtime_function(name: &str, params: Vec<Param>, return_type: TsType, body: &str) -> Item {
    Item::runtime(ItemNode::Function(FunctionDecl {
        exported: true,
        declare: false,
        name: name.into(),
        generic_params: Vec::new(),
        params,
        return_type: Some(return_type),
        body: Some(Block::new(vec![Stmt::Raw(body.into())])),
        js_doc: None,
    }))
}

fn index_module(ctx: CodegenContext<'_>, names: &[String]) -> Module {
    let named_reexport = ctx
        .overlay
        .map(|overlay| (overlay.owned_pattern_idents(), overlay.patterns.as_str()));
    crate::overlay::index_barrel(named_reexport, names)
}

fn type_imports(
    pattern: &PatternConfig,
    definition: Option<&PatternTypeDefinition>,
) -> BTreeSet<String> {
    let mut imports = BTreeSet::from(["PatternRuntimeConfig".into(), "SystemStyleObject".into()]);

    if let Some(definition) = definition {
        for property in definition.properties.values() {
            add_property_type_imports(&mut imports, &property.kind);
        }
    } else {
        for property in pattern.properties.values() {
            add_fallback_property_type_imports(&mut imports, property);
        }
    }

    imports
}

fn add_property_type_imports(imports: &mut BTreeSet<String>, kind: &PatternPropertyTypeKind) {
    match kind {
        PatternPropertyTypeKind::Enum { .. }
        | PatternPropertyTypeKind::Primitive { .. }
        | PatternPropertyTypeKind::Unknown => {
            imports.insert("ConditionalValue".into());
        }
        PatternPropertyTypeKind::Token { property, .. } => {
            imports.insert("ConditionalValue".into());
            imports.insert("TokenValue".into());
            if property.is_some() {
                imports.insert("SystemProperties".into());
            }
        }
        PatternPropertyTypeKind::Property { .. } => {
            imports.insert("SystemProperties".into());
        }
    }
}

fn add_fallback_property_type_imports(
    imports: &mut BTreeSet<String>,
    property: &PatternPropertyConfig,
) {
    match property.r#type.as_deref() {
        Some("string" | "number" | "boolean") | None if property.property.is_none() => {
            imports.insert("ConditionalValue".into());
        }
        _ => {
            imports.insert("SystemProperties".into());
        }
    }
}

fn config_const(
    name: &str,
    properties_name: &str,
    pattern: &PatternConfig,
    meta: Option<&PatternCodegenMeta>,
) -> Item {
    Item::runtime(ItemNode::Const(ConstDecl {
        exported: false,
        declare: false,
        name: name.into(),
        type_annotation: Some(TsType::Raw(format!(
            "PatternRuntimeConfig<{properties_name}>"
        ))),
        init: Some(crate::Expr::Raw(pattern_config_source(pattern, meta))),
        js_doc: None,
    }))
}

fn properties_interface(
    name: &str,
    pattern: &PatternConfig,
    definition: Option<&PatternTypeDefinition>,
) -> Item {
    let mut members = Vec::with_capacity(pattern.properties.len() + 1);

    if let Some(definition) = definition {
        members.extend(
            definition
                .properties
                .iter()
                .map(|(name, property)| TsMember {
                    name: member_name(name),
                    optional: true,
                    ty: TsType::Raw(crate::artifacts::types::pattern_property_type(
                        &property.kind,
                    )),
                    js_doc: property.description.as_ref().map(|description| JsDoc {
                        text: Some(description.clone()),
                        deprecated: None,
                        default: None,
                    }),
                }),
        );
    } else {
        members.extend(pattern.properties.iter().map(|(name, property)| TsMember {
            name: member_name(name),
            optional: true,
            ty: fallback_property_type(property),
            js_doc: property.description.as_ref().map(|description| JsDoc {
                text: Some(description.clone()),
                deprecated: None,
                default: None,
            }),
        }));
    }

    members.push(TsMember {
        name: TsMemberName::Ident("className".into()),
        optional: true,
        ty: TsType::Ref("string".into()),
        js_doc: None,
    });

    Item::interface_decl(InterfaceDecl {
        exported: true,
        name: name.into(),
        extends: Vec::new(),
        members,
        js_doc: None,
    })
}

fn styles_interface(
    name: &str,
    properties_name: &str,
    pattern: &PatternConfig,
    definition: Option<&PatternTypeDefinition>,
) -> Item {
    let strict = definition.map_or(pattern.strict, |definition| definition.strict);
    let blocklist = definition.map_or(pattern.blocklist.as_slice(), |definition| {
        definition.blocklist.as_slice()
    });

    let mut omitted_keys = vec![format!("keyof {properties_name}")];
    omitted_keys.extend(blocklist.iter().map(|key| format!("{key:?}")));

    if strict {
        return Item::ty(ItemNode::RawStmt(format!(
            "interface {name} extends {properties_name} {{}}"
        )));
    }

    let rest_name = name.replace("Styles", "RestStyles");
    let rest = format!(
        "type {rest_name} = Omit<SystemStyleObject, {}>",
        omitted_keys.join(" | ")
    );

    Item::ty(ItemNode::RawStmt(format!(
        "{rest}\n\ninterface {name} extends {properties_name}, {rest_name} {{}}"
    )))
}

fn pattern_fn_interface(name: &str, styles_name: &str) -> Item {
    Item::interface_decl(InterfaceDecl {
        exported: false,
        name: name.into(),
        extends: Vec::new(),
        members: vec![
            // Normal call returns a className string; only `.raw` returns styles.
            TsMember {
                name: TsMemberName::Raw(format!("(styles?: {styles_name})")),
                optional: false,
                ty: TsType::Ref("string".into()),
                js_doc: None,
            },
            TsMember {
                name: TsMemberName::Ident("raw".into()),
                optional: false,
                ty: TsType::Function {
                    params: vec![Param::optional("styles", TsType::Ref(styles_name.into()))],
                    ret: Box::new(TsType::Ref("SystemStyleObject".into())),
                },
                js_doc: None,
            },
        ],
        js_doc: None,
    })
}

fn raw_function(name: &str, config_name: &str, styles_name: &str) -> Item {
    Item::both(ItemNode::Function(FunctionDecl {
        exported: true,
        declare: false,
        name: name.into(),
        generic_params: Vec::new(),
        params: vec![Param::optional("styles", TsType::Ref(styles_name.into()))],
        return_type: Some(TsType::Ref("SystemStyleObject".into())),
        body: Some(Block::new(vec![Stmt::Raw(raw_function_body(config_name))])),
        js_doc: None,
    }))
}

fn public_function_const(name: &str, raw_name: &str, fn_type_name: &str) -> Item {
    Item::both(ItemNode::Const(ConstDecl {
        exported: true,
        declare: false,
        name: name.into(),
        type_annotation: Some(TsType::Ref(fn_type_name.into())),
        init: Some(crate::Expr::Raw(format!(
            "/* @__PURE__ */ Object.assign(function {name}(styles = {{}}) {{\n  return css({raw_name}(styles))\n}}, {{ raw: {raw_name} }})"
        ))),
        js_doc: None,
    }))
}

fn raw_function_body(config_name: &str) -> String {
    format!(
        "const s = getPatternStyles({config_name}, styles || {{}})\nreturn {config_name}.transform(s, patternFns)"
    )
}

fn pattern_config_source(pattern: &PatternConfig, meta: Option<&PatternCodegenMeta>) -> String {
    meta.filter(|meta| !meta.config_source.trim().is_empty())
        .map_or_else(
            || fallback_pattern_config_source(pattern),
            |meta| meta.config_source.clone(),
        )
}

fn fallback_pattern_config_source(pattern: &PatternConfig) -> String {
    let mut config = Map::new();
    config.insert(
        "transform".into(),
        Value::String("__panda_identity_transform__".into()),
    );
    if let Some(default_values) = &pattern.default_values {
        config.insert("defaultValues".into(), default_values.clone());
    }
    value_to_code(&Value::Object(config)).replace("\"__panda_identity_transform__\"", "(s) => s")
}

fn value_to_code(value: &Value) -> String {
    serde_json::to_string(value).expect("pattern config values should serialize")
}

fn fallback_property_type(property: &PatternPropertyConfig) -> TsType {
    match property.r#type.as_deref() {
        Some("string") => TsType::Raw("ConditionalValue<string>".into()),
        Some("number") => TsType::Raw("ConditionalValue<number>".into()),
        Some("boolean") => TsType::Raw("ConditionalValue<boolean>".into()),
        _ => property.property.as_ref().map_or_else(
            || TsType::Raw("ConditionalValue<unknown>".into()),
            |property| TsType::Raw(format!("SystemProperties[{property:?}]")),
        ),
    }
}

fn member_name(value: &str) -> TsMemberName {
    if is_identifier(value) {
        TsMemberName::Ident(value.into())
    } else {
        TsMemberName::StringLiteral(value.into())
    }
}
