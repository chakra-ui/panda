mod css;
mod misc;
mod object;
mod patterns;
mod recipes;
mod shared;
mod split_props;

use crate::{
    Artifact, ArtifactFile, ArtifactId, DependencySet, Module,
    artifact::{GenerateOptions, emit_module_files},
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
        .with_item(css::to_responsive_object())
        .with_item(object::walk_object())
        .with_item(object::map_object())
        .with_item(css::normalize_style_object())
        .with_item(misc::memo())
        .with_item(object::merge_props())
        .with_item(css::create_css())
        .with_item(css::create_merge_css())
        .with_item(css::hypenate_property())
        .with_item(patterns::is_css_function())
        .with_item(patterns::is_css_var())
        .with_item(patterns::is_css_unit())
        .with_item(patterns::pattern_fns())
        .with_item(patterns::get_pattern_styles())
        .with_item(recipes::get_slot_recipes())
        .with_item(recipes::get_slot_compound_variant())
        .with_item(split_props::split_props())
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
        options.specifiers,
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
