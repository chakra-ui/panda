//! Host-neutral source transforms for Panda CSS.
//!
//! Phase 1: static `css({...})` call sites compile to class string literals.

mod apply;
mod css_conditional;
mod helper;
mod imports;
mod jsx;
mod plan;
mod recipe_inline;
mod resolve;
mod styled;
mod ternary;

use pandacss_extractor::extract;
use pandacss_project::Project;

pub use helper::{
    CSS_HELPER_LOCAL, CVA_HELPER_LOCAL, CX_HELPER_LOCAL, CX_HELPER_MODULE, INTERNAL_CSS_MODULE,
    SVA_HELPER_LOCAL, inject_cx_import, inject_internal_css_import, inject_internal_css_import_at,
    sync_internal_css_import,
};
pub use plan::{
    HelperCxMode, TransformHelperFacts, TransformMode, TransformOptions, TransformOutput,
    TransformTargets,
};

/// Rewrite one source file using the compiler project state.
#[must_use]
pub fn transform_source(
    project: &Project,
    path: &str,
    source: &str,
    options: &TransformOptions,
) -> TransformOutput {
    let extracted = extract(source, path, project.config().extractor_config());
    let plan = plan::build_plan(project, source, &extracted, options);
    let diagnostics = extracted.diagnostics;

    let edits = apply::build_transform_edits(project, path, source, &plan, options.helper_cx);
    let (code, map) = apply::apply_edits(source, path, &edits);
    let changed = code != source;

    if !changed {
        return TransformOutput {
            code,
            map: None,
            changed: false,
            bailed: plan.bailed,
            diagnostics,
            dependencies: plan.dependencies,
            helper: plan.helper,
        };
    }

    TransformOutput {
        code,
        map,
        changed: true,
        bailed: plan.bailed,
        diagnostics,
        dependencies: plan.dependencies,
        helper: plan.helper,
    }
}
