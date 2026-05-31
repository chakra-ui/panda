//! The `selectors` artifact: the `.d.ts` types for ARIA/data-attribute and
//! pseudo selectors used in condition keys (types-only, no runtime).

use crate::{
    Artifact, ArtifactFile, ArtifactId, DependencySet, ImportDecl, Item, Module, TsType,
    TypeAliasDecl,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module() -> Module {
    Module::new()
        .with_import(ImportDecl::ty(["Pseudos"], "./csstype"))
        .with_item(type_alias("AriaAttributes", aria_attributes()))
        .with_item(type_alias("DataAttributes", data_attributes()))
        .with_item(type_alias(
            "AttributeSelector",
            TsType::Raw("`&${Pseudos | DataAttributes | AriaAttributes}`".into()),
        ))
        .with_item(type_alias(
            "ParentSelector",
            TsType::Raw("`${DataAttributes | AriaAttributes} &`".into()),
        ))
        .with_item(type_alias(
            "AtRuleType",
            TsType::Raw(
                "'media' | 'layer' | 'container' | 'supports' | 'page' | 'scope' | 'starting-style'"
                    .into(),
            ),
        ))
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "AnySelector".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw("`${string}&` | `&${string}` | `@${AtRuleType}${string}`".into()),
            js_doc: None,
        }))
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "Selectors".into(),
            generic_params: Vec::new(),
            ty: TsType::Union(vec![
                TsType::Ref("AttributeSelector".into()),
                TsType::Ref("ParentSelector".into()),
            ]),
            js_doc: None,
        }))
}

#[must_use]
pub fn files(options: GenerateOptions, dependencies: DependencySet) -> Vec<ArtifactFile> {
    emit_module_files(
        "selectors",
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
        id: ArtifactId::Selectors,
        dependencies,
        files: files(options, dependencies),
    }
}

fn type_alias(name: &str, ty: TsType) -> Item {
    Item::type_alias(TypeAliasDecl {
        exported: false,
        name: name.into(),
        generic_params: Vec::new(),
        ty,
        js_doc: None,
    })
}

fn aria_attributes() -> TsType {
    TsType::Raw(
        "'[aria-disabled]'\n  | '[aria-hidden]'\n  | '[aria-invalid]'\n  | '[aria-readonly]'\n  | '[aria-required]'\n  | '[aria-selected]'\n  | '[aria-checked]'\n  | '[aria-expanded]'\n  | '[aria-pressed]'\n  | `[aria-current=${'page' | 'step' | 'location' | 'date' | 'time'}]`\n  | `[aria-sort=${'ascending' | 'descending'}]`"
            .into(),
    )
}

fn data_attributes() -> TsType {
    TsType::Raw(
        "'[data-selected]'\n  | '[data-highlighted]'\n  | '[data-hover]'\n  | '[data-active]'\n  | '[data-checked]'\n  | '[data-disabled]'\n  | '[data-readonly]'\n  | '[data-focus]'\n  | '[data-focus-visible]'\n  | '[data-invalid]'\n  | '[data-pressed]'\n  | '[data-expanded]'\n  | `[data-part=${string}]`\n  | `[data-placement=${string}]`\n  | `[data-theme=${string}]`\n  | `[data-size=${string}]`\n  | `[data-state=${string}]`"
            .into(),
    )
}
