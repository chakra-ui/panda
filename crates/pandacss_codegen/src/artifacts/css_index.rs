//! The `css/index` barrel: re-exports CSS helpers for the configured syntax.

use pandacss_config::CssSyntaxKind;

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, DependencySet, ExportDecl, Item, ItemNode,
    Module,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module(ctx: CodegenContext<'_>) -> Module {
    let sources: &[&str] = if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        &["./css", "./cx"]
    } else {
        &["./css", "./cva", "./cx", "./sva"]
    };

    sources.iter().fold(Module::new(), |module, source| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
            source: (*source).into(),
        })))
    })
}

#[must_use]
pub fn files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    emit_module_files(
        "css/index",
        &module(ctx),
        options.format,
        false,
        options.import_extensions,
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
        id: ArtifactId::CssIndex,
        dependencies,
        files: files(ctx, options, dependencies),
    }
}
