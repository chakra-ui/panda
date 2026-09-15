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
            name: "FirstThatWorksMemberOf".into(),
            generic_params: vec!["T".into()],
            ty: TsType::Raw("Extract<T, FirstThatWorksMember>".into()),
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

// `T` is inferred from the property alone (it appears only in the return), so
// every position completes from the property instead of narrowing to a sibling.
// Positional rather than rest: a generic rest parameter loses completions in the
// default output. Six members is the cap.
const FIRST_THAT_WORKS_FN_TYPE: &str = "<
  T = FirstThatWorksMember,
  A extends FirstThatWorksMemberOf<T> = FirstThatWorksMemberOf<T>,
  B extends FirstThatWorksMemberOf<T> = FirstThatWorksMemberOf<T>,
  C extends FirstThatWorksMemberOf<T> = never,
  D extends FirstThatWorksMemberOf<T> = never,
  E extends FirstThatWorksMemberOf<T> = never,
  F extends FirstThatWorksMemberOf<T> = never,
>(
  first: A,
  second: B,
  third?: C,
  fourth?: D,
  fifth?: E,
  sixth?: F,
) => T extends FirstThatWorksMember ? A | B | C | D | E | F : FirstThatWorksMemberOf<T>";

const FIRST_THAT_WORKS_IMPL: &str = "(...values: any[]) => `__FN__(${values.join('__SEP__')})`";
