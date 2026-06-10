//! The `helpers` artifact: the shared runtime functions the other artifacts
//! import (`memo`, `splitProps`, css normalize/merge, object utils, `cx`'s
//! `uniq`, …). [`module`] fixes their emit order; the submodules group them by
//! concern (`css`, `object`, `misc`, `split_props`).

mod css;
mod misc;
mod object;
mod split_props;

use crate::{
    Artifact, ArtifactFile, ArtifactId, DependencySet, Module,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module() -> Module {
    Module::new()
        .with_item(object::is_object())
        .with_item(object::has_own())
        .with_item(misc::is_base_condition())
        .with_item(misc::filter_base_conditions())
        .with_item(misc::to_hash())
        .with_item(object::compact())
        .with_item(object::with_defaults())
        .with_item(object::to_variant_map())
        .with_item(object::get_compound_variant_class_names())
        .with_item(object::get_compound_variant_css())
        .with_item(object::get_slot_compound_variant())
        .with_item(object::get_slot_recipes())
        .with_item(css::to_responsive_object())
        .with_item(object::walk_object())
        .with_item(object::map_object())
        .with_item(css::normalize_style_object())
        .with_item(misc::memo())
        .with_item(misc::weak_memo())
        .with_item(object::merge_props())
        .with_item(css::create_css_runtime())
        .with_item(css::hypenate_property())
        .with_item(split_props::split_props())
        .with_item(misc::normalize_html_props())
        .with_item(misc::normalize_html_props_types())
        .with_item(misc::uniq())
        .with_item(misc::without_space())
}

#[must_use]
pub fn files(options: GenerateOptions, dependencies: DependencySet) -> Vec<ArtifactFile> {
    emit_module_files(
        "helpers",
        &module(),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    )
}

#[must_use]
pub fn generate(options: GenerateOptions, dependencies: DependencySet) -> Artifact {
    Artifact {
        id: ArtifactId::Helpers,
        dependencies,
        files: files(options, dependencies),
    }
}
