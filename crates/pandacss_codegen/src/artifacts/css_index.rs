//! The `css/index` barrel: re-exports CSS helpers for the configured syntax.

use pandacss_config::CssSyntaxKind;

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, DependencySet, ExportDecl, Item, ItemNode,
    Module, RuntimeImport,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module(ctx: CodegenContext<'_>) -> Module {
    let stems: &[&str] = if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        &["css", "cx"]
    } else {
        &["css", "cva", "cx", "sva", "view-transition"]
    };

    // Deep `export *` per module so both runtime values and their `.d.ts` companions
    // flow through (same shape as recipes/patterns/jsx overlay barrels).
    if let Some(overlay) = ctx.overlay
        && ctx.virtualizes(RuntimeImport::CssIndex)
        && !overlay.css.is_empty()
    {
        return stems.iter().fold(Module::new(), |module, stem| {
            module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
                source: format!("{}/{stem}", overlay.css),
            })))
        });
    }

    stems.iter().fold(Module::new(), |module, stem| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
            source: format!("./{stem}"),
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
