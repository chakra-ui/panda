//! The `css/index` barrel: re-exports `css`, `cva`, `cx`, and `sva`.

use crate::{
    Artifact, ArtifactFile, ArtifactId, DependencySet, ExportDecl, Item, ItemNode, Module,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module() -> Module {
    ["./css", "./cva", "./cx", "./sva"]
        .into_iter()
        .fold(Module::new(), |module, source| {
            module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
                source: source.into(),
            })))
        })
}

#[must_use]
pub fn files(options: GenerateOptions, dependencies: DependencySet) -> Vec<ArtifactFile> {
    emit_module_files(
        "index",
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
        id: ArtifactId::CssIndex,
        dependencies,
        files: files(options, dependencies),
    }
}
