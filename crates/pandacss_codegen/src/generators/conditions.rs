//! The `conditions` artifact: the configured condition keys plus the
//! `isCondition` / `sortConditions` runtime helpers and their types.

use crate::{
    Artifact, ArtifactFile, ArtifactId, Block, CodegenContext, DependencySet, FunctionDecl,
    ImportDecl, InterfaceDecl, Item, ItemNode, JsDoc, Module, Param, Stmt, TsMember, TsMemberName,
    TsType, TypeAliasDecl,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module(ctx: CodegenContext<'_>) -> Module {
    let keys = ctx.condition_keys();
    Module::new()
        .with_import(ImportDecl::value(["withoutSpace"], "../helpers"))
        .with_import(ImportDecl::ty(["AnySelector", "Selectors"], "./selectors"))
        .with_item(Item::raw_stmt(&runtime_consts(&keys)))
        .with_item(runtime_function(
            "isCondition",
            vec![Param::typed("v", TsType::Ref("string".into()))],
            TsType::Bool,
            "return conditions.has(v) || conditionRe.test(v)",
        ))
        .with_item(runtime_function(
            "finalizeConditions",
            vec![Param::typed("paths", TsType::Raw("string[]".into()))],
            TsType::Raw("string[]".into()),
            r"return paths.map((p) => {
  if (conditions.has(p)) {
    return p.replace(underscoreRe, '')
  }
  if (selectorRe.test(p)) {
    return `[${withoutSpace(p.trim())}]`
  }
  return p
})",
        ))
        .with_item(runtime_function(
            "sortConditions",
            vec![Param::typed("paths", TsType::Raw("string[]".into()))],
            TsType::Raw("string[]".into()),
            r"return paths.sort((a, b) => {
  const aa = isCondition(a)
  const bb = isCondition(b)
  return aa && !bb ? 1 : !aa && bb ? -1 : 0
})",
        ))
        .with_item(Item::interface_decl(conditions_interface(ctx, &keys)))
        .with_item(Item::type_alias(conditional_value_type()))
        .with_item(Item::type_alias(nested_type()))
}

#[must_use]
pub fn files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    emit_module_files(
        "conditions",
        &module(ctx),
        options.format,
        false,
        options.specifiers,
        dependencies,
    )
}

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::Conditions,
        dependencies,
        files: files(ctx, options, dependencies),
    }
}

fn runtime_consts(keys: &[String]) -> String {
    let conditions = keys.join(",");
    format!(
        r#"const conditions = new Set("{conditions}".split(','))
const conditionRe = /^@|&/
const underscoreRe = /^_/
const selectorRe = /&|@/"#
    )
}

fn runtime_function(name: &str, params: Vec<Param>, return_type: TsType, body: &str) -> Item {
    Item::both(ItemNode::Function(FunctionDecl {
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

fn conditions_interface(ctx: CodegenContext<'_>, keys: &[String]) -> InterfaceDecl {
    InterfaceDecl {
        exported: true,
        name: "Conditions".into(),
        extends: Vec::new(),
        members: keys
            .iter()
            .map(|key| TsMember {
                name: TsMemberName::StringLiteral(key.clone()),
                optional: false,
                ty: TsType::Ref("string".into()),
                js_doc: condition_js_doc(ctx, key),
            })
            .collect(),
        js_doc: None,
    }
}

fn conditional_value_type() -> TypeAliasDecl {
    TypeAliasDecl {
        exported: true,
        name: "ConditionalValue".into(),
        generic_params: vec!["V".into()],
        ty: TsType::Union(vec![
            TsType::Ref("V".into()),
            TsType::TypeRef {
                name: "Array".into(),
                args: vec![TsType::Union(vec![TsType::Ref("V".into()), TsType::Null])],
            },
            TsType::Object(vec![TsMember {
                name: TsMemberName::Mapped {
                    key: "K".into(),
                    constraint: TsType::KeyOf(Box::new(TsType::Ref("Conditions".into()))),
                },
                optional: true,
                ty: TsType::TypeRef {
                    name: "ConditionalValue".into(),
                    args: vec![TsType::Ref("V".into())],
                },
                js_doc: None,
            }]),
        ]),
        js_doc: None,
    }
}

fn nested_type() -> TypeAliasDecl {
    TypeAliasDecl {
        exported: true,
        name: "Nested".into(),
        generic_params: vec!["P".into()],
        ty: TsType::Intersection(vec![
            TsType::Ref("P".into()),
            nested_mapped_object("Selectors"),
            nested_mapped_object("AnySelector"),
            nested_mapped_object("keyof Conditions"),
        ]),
        js_doc: None,
    }
}

fn nested_mapped_object(constraint: &str) -> TsType {
    TsType::Object(vec![TsMember {
        name: TsMemberName::Mapped {
            key: "K".into(),
            constraint: TsType::Ref(constraint.into()),
        },
        optional: true,
        ty: TsType::TypeRef {
            name: "Nested".into(),
            args: vec![TsType::Ref("P".into())],
        },
        js_doc: None,
    }])
}

fn condition_js_doc(ctx: CodegenContext<'_>, key: &str) -> Option<JsDoc> {
    if key == "base" {
        return Some(JsDoc {
            text: Some("The base (=no conditions) styles to apply ".into()),
            deprecated: None,
            default: None,
        });
    }

    condition_doc(ctx, key).map(|value| JsDoc {
        text: Some(format!("`{value}`")),
        deprecated: None,
        default: None,
    })
}

fn condition_doc(ctx: CodegenContext<'_>, key: &str) -> Option<String> {
    let key = key.strip_prefix('_').unwrap_or(key);
    ctx.config.conditions.get(key).and_then(condition_doc_value)
}

fn condition_doc_value(condition: &pandacss_config::ConditionQuery) -> Option<String> {
    match condition {
        pandacss_config::ConditionQuery::String(value) => Some(value.clone()),
        pandacss_config::ConditionQuery::Array(values) => Some(values.join(" ")),
        pandacss_config::ConditionQuery::Nested(_) => None,
    }
}
