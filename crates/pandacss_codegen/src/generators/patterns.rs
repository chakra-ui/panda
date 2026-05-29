use pandacss_config::{PatternConfig, PatternPropertyConfig};
use serde_json::{Map, Value};

use crate::{
    Artifact, ArtifactFile, ArtifactId, Block, CodegenContext, ConstDecl, DependencySet,
    ExportDecl, FunctionDecl, ImportDecl, InterfaceDecl, Item, ItemNode, JsDoc, Module, Param,
    PatternCodegenMeta, Stmt, TsMember, TsMemberName, TsType,
    artifact::{GenerateOptions, emit_module_files},
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
    let mut files = Vec::new();
    let mut names = Vec::new();

    for (name, pattern) in &ctx.config.patterns {
        names.push(file_stem(name));
        let meta = ctx.patterns.get(name);
        files.extend(emit_module_files(
            &format!("patterns/{}", file_stem(name)),
            &module(name, pattern, meta),
            options.format,
            false,
            options.specifiers,
            dependencies,
        ));
    }

    if !names.is_empty() {
        files.extend(emit_module_files(
            "patterns/index",
            &index_module(&names),
            options.format,
            false,
            options.specifiers,
            dependencies,
        ));
    }

    files
}

#[must_use]
pub fn module(name: &str, pattern: &PatternConfig, meta: Option<&PatternCodegenMeta>) -> Module {
    let function_name = ident(name);
    let raw_name = format!("{function_name}Raw");
    let config_name = format!("{function_name}Config");
    let type_name = format!("{}Properties", pascal_case(name));
    let styles_name = format!("{}Styles", pascal_case(name));
    let fn_type_name = format!("{}PatternFn", pascal_case(name));

    Module::new()
        .with_import(ImportDecl::value(
            ["getPatternStyles", "patternFns"],
            "../helpers",
        ))
        .with_item(config_const(&config_name, pattern, meta))
        .with_item(properties_interface(&type_name, pattern))
        .with_item(styles_interface(&styles_name, &type_name))
        .with_item(pattern_fn_interface(&fn_type_name, &styles_name))
        .with_item(raw_function(&raw_name, &config_name, &type_name))
        .with_item(public_function_const(
            &function_name,
            &raw_name,
            &fn_type_name,
        ))
}

fn index_module(names: &[String]) -> Module {
    names.iter().fold(Module::new(), |module, name| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
            source: format!("./{name}"),
        })))
    })
}

fn config_const(name: &str, pattern: &PatternConfig, meta: Option<&PatternCodegenMeta>) -> Item {
    Item::runtime(ItemNode::Const(ConstDecl {
        exported: false,
        declare: false,
        name: name.into(),
        type_annotation: Some(TsType::Raw("Record<string, any>".into())),
        init: Some(crate::Expr::Raw(pattern_config_source(pattern, meta))),
        js_doc: None,
    }))
}

fn properties_interface(name: &str, pattern: &PatternConfig) -> Item {
    let mut members = pattern
        .properties
        .iter()
        .map(|(name, property)| TsMember {
            name: member_name(name),
            optional: true,
            ty: property_type(property),
            js_doc: property.description.as_ref().map(|description| JsDoc {
                text: Some(description.clone()),
                deprecated: None,
                default: None,
            }),
        })
        .collect::<Vec<_>>();

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

fn styles_interface(name: &str, properties_name: &str) -> Item {
    Item::interface_decl(InterfaceDecl {
        exported: false,
        name: name.into(),
        extends: vec![
            TsType::Ref(properties_name.into()),
            TsType::Raw("Record<string, any>".into()),
        ],
        members: Vec::new(),
        js_doc: None,
    })
}

fn pattern_fn_interface(name: &str, styles_name: &str) -> Item {
    Item::interface_decl(InterfaceDecl {
        exported: false,
        name: name.into(),
        extends: Vec::new(),
        members: vec![
            TsMember {
                name: TsMemberName::Raw(format!("(styles?: {styles_name})")),
                optional: false,
                ty: TsType::Raw("Record<string, any>".into()),
                js_doc: None,
            },
            TsMember {
                name: TsMemberName::Ident("raw".into()),
                optional: false,
                ty: TsType::Function {
                    params: vec![Param::optional("styles", TsType::Ref(styles_name.into()))],
                    ret: Box::new(TsType::Raw("Record<string, any>".into())),
                },
                js_doc: None,
            },
        ],
        js_doc: None,
    })
}

fn raw_function(name: &str, config_name: &str, properties_name: &str) -> Item {
    Item::both(ItemNode::Function(FunctionDecl {
        exported: true,
        declare: false,
        name: name.into(),
        generic_params: Vec::new(),
        params: vec![Param::optional(
            "styles",
            TsType::Ref(properties_name.into()),
        )],
        return_type: Some(TsType::Raw("Record<string, any>".into())),
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
            "Object.assign(function {name}(styles = {{}}) {{\n  return {raw_name}(styles)\n}}, {{ raw: {raw_name} }})"
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

fn property_type(property: &PatternPropertyConfig) -> TsType {
    match property.r#type.as_deref() {
        Some("string") => TsType::Ref("string".into()),
        Some("number") => TsType::Ref("number".into()),
        Some("boolean") => TsType::Ref("boolean".into()),
        _ => TsType::Raw("any".into()),
    }
}

fn ident(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for (index, ch) in value.chars().enumerate() {
        if ch.is_ascii_alphanumeric() || ch == '_' || ch == '$' {
            if index == 0 && ch.is_ascii_digit() {
                out.push('_');
            }
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    if out.is_empty() { "_".into() } else { out }
}

fn pascal_case(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut uppercase = true;
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() {
            if uppercase {
                out.push(ch.to_ascii_uppercase());
                uppercase = false;
            } else {
                out.push(ch);
            }
        } else {
            uppercase = true;
        }
    }
    if out.is_empty() { "_".into() } else { out }
}

fn file_stem(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut prev_dash = false;
    for ch in value.chars() {
        if ch.is_ascii_uppercase() {
            if !out.is_empty() && !prev_dash {
                out.push('-');
            }
            out.push(ch.to_ascii_lowercase());
            prev_dash = false;
        } else if ch.is_ascii_alphanumeric() {
            out.push(ch);
            prev_dash = false;
        } else if !prev_dash && !out.is_empty() {
            out.push('-');
            prev_dash = true;
        }
    }
    if out.ends_with('-') {
        out.pop();
    }
    if out.is_empty() { "_".into() } else { out }
}

fn member_name(value: &str) -> TsMemberName {
    if is_identifier(value) {
        TsMemberName::Ident(value.into())
    } else {
        TsMemberName::StringLiteral(value.into())
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
