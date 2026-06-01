//! The `cx` artifact: the `cx()` class-name concatenation helper.

use indoc::indoc;

use crate::{
    Artifact, ArtifactFile, ArtifactId, DependencySet, FunctionDecl, Item, ItemNode, JsDoc, Module,
    Param, Stmt, TsType, TypeAliasDecl,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module() -> Module {
    Module::new()
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: false,
            name: "Argument".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw("string | boolean | null | undefined".into()),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Function(FunctionDecl {
            exported: true,
            declare: false,
            name: "cx".into(),
            generic_params: Vec::new(),
            params: vec![Param::typed("...args", TsType::Raw("Argument[]".into()))],
            return_type: Some(TsType::Ref("string".into())),
            body: Some(crate::Block::new(vec![Stmt::Raw(
                indoc! {r"
                    let str = '',
                      i = 0,
                      arg

                    for (; i < arguments.length; ) {
                      if ((arg = arguments[i++]) && typeof arg === 'string') {
                        str && (str += ' ')
                        str += arg
                      }
                    }
                    return str
                "}
                .trim()
                .into(),
            )])),
            js_doc: Some(JsDoc {
                text: Some("Conditionally join classNames into a single string".into()),
                deprecated: None,
                default: None,
            }),
        })))
}

#[must_use]
pub fn files(options: GenerateOptions, dependencies: DependencySet) -> Vec<ArtifactFile> {
    emit_module_files(
        "cx",
        &module(),
        options.format,
        false,
        options.specifiers,
        dependencies,
    )
}

#[must_use]
pub fn generate(options: GenerateOptions, dependencies: DependencySet) -> Artifact {
    Artifact {
        id: ArtifactId::Cx,
        dependencies,
        files: files(options, dependencies),
    }
}
