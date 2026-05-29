use crate::{
    Artifact, ArtifactFile, ArtifactId, DependencySet, ExportDecl, Item, ItemNode, Module,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module() -> Module {
    Module::new().with_item(Item::both(ItemNode::Export(ExportDecl::Star {
        source: "./cx".into(),
    })))
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
