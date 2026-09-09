//! `css/first-that-works` runtime for `firstThatWorks()`.

use pandacss_shared::{FIRST_THAT_WORKS_FN, FIRST_THAT_WORKS_SEPARATOR};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, ConstDecl, DependencySet, Expr, Item,
    ItemNode, Module, RuntimeImport, TsType, TypeAliasDecl,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::FirstThatWorks,
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
    if ctx.virtualizes(RuntimeImport::CssIndex) {
        return Vec::new();
    }

    emit_module_files(
        "css/first-that-works",
        &module(),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    )
}

fn module() -> Module {
    // The name and separator are a contract with `pandacss_shared::first_that_works`:
    // the build folds the same call to the same text, so both earn one class.
    let impl_src = FIRST_THAT_WORKS_IMPL
        .replace("__FN__", FIRST_THAT_WORKS_FN)
        .replace("__SEP__", FIRST_THAT_WORKS_SEPARATOR);

    Module::new()
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "FirstThatWorksMember".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw("string | number".into()),
            js_doc: None,
        }))
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "FirstThatWorksFn".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw(FIRST_THAT_WORKS_FN_TYPE.into()),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "firstThatWorks".into(),
            type_annotation: Some(TsType::Ref("FirstThatWorksFn".into())),
            init: Some(Expr::Raw(impl_src)),
            js_doc: None,
        })))
}

// Two call signatures, and the order matters. The first gives every member the
// property's own value type, so tokens and keywords autocomplete inside the
// call. The second admits members of differing types, checked one by one.
const FIRST_THAT_WORKS_FN_TYPE: &str = "{
  <T>(first: T, second: T, ...rest: T[]): T
  <A extends FirstThatWorksMember, B extends FirstThatWorksMember, R extends FirstThatWorksMember[]>(
    first: A,
    second: B,
    ...rest: R,
  ): A | B | R[number]
}";

const FIRST_THAT_WORKS_IMPL: &str = "(...values: any[]) => `__FN__(${values.join('__SEP__')})`";
