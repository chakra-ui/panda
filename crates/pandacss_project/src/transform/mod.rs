//! Host-neutral source transforms for Panda CSS.
//!
//! Static `css({...})`, pattern/recipe, and JSX sites compile to class string
//! literals where safe. Lives inside `pandacss_project` so rewrite uses the same
//! class-name resolution and [`ParseTransforms`] bag as [`Project::parse_file_with`].

mod apply;
mod helper;
mod imports;
mod js;
mod jsx;
mod jsx_element;
mod jsx_parse;
mod jsx_runtime;
mod jsx_shared;
mod jsx_skip;
mod plan;
pub(crate) mod recipe_inline;
mod resolve;
mod style_lower;

use pandacss_extractor::{Literal, extract_for_transform_with_recipe_resolver};

use crate::ParseTransforms;
use crate::Project;

pub use helper::{
    CSS_HELPER_LOCAL, CVA_HELPER_LOCAL, CX_HELPER_LOCAL, CX_HELPER_MODULE, INTERNAL_CSS_MODULE,
    SVA_HELPER_LOCAL, inject_cx_import, inject_internal_css_import, inject_internal_css_import_at,
    sync_internal_css_import,
};
pub use plan::{
    HelperCxMode, TransformHelperFacts, TransformMode, TransformOptions, TransformOutput,
    TransformTargets,
};

impl Project {
    /// Rewrite one source file using this project's config (`ParseTransforms` empty).
    #[must_use]
    pub fn transform_source(
        &self,
        path: &str,
        source: &str,
        options: &TransformOptions,
    ) -> TransformOutput {
        self.transform_source_with(path, source, options, ParseTransforms::default())
    }

    /// Rewrite one source file, applying the same callback bag as
    /// [`Project::parse_file_with`] (especially `source` + `pattern`).
    #[must_use]
    pub fn transform_source_with(
        &self,
        path: &str,
        source: &str,
        options: &TransformOptions,
        transforms: ParseTransforms<'_>,
    ) -> TransformOutput {
        let span = tracing::trace_span!(
            target: "transform",
            "transform_source",
            path = path,
            source_len = source.len(),
            changed = tracing::field::Empty,
            bailed = tracing::field::Empty,
            rewrites = tracing::field::Empty,
        );
        let _entered = span.enter();

        let transformed_source;
        let source = match transforms.source {
            Some(transform) => match transform(path, source) {
                Ok(Some(next)) => {
                    transformed_source = next;
                    transformed_source.as_str()
                }
                Ok(None) => source,
                Err(diagnostic) => {
                    return TransformOutput {
                        code: source.to_owned(),
                        map: None,
                        changed: false,
                        bailed: true,
                        diagnostics: vec![diagnostic],
                        dependencies: Vec::new(),
                        helper: TransformHelperFacts::default(),
                    };
                }
            },
            None => source,
        };

        let extracted = {
            let _span = tracing::trace_span!(target: "transform", "transform_extract").entered();
            let mut resolve_recipe_raw = |factory: &str, config: &Literal, props: &Literal| {
                let props = recipe_inline::literal_variant_props(props)?;
                recipe_inline::resolve_inline_recipe_raw(self, factory, config, &props)
            };
            extract_for_transform_with_recipe_resolver(
                source,
                path,
                self.config().extractor_config(),
                &mut resolve_recipe_raw,
            )
        };
        let plan = {
            let _span = tracing::trace_span!(target: "transform", "transform_plan").entered();
            plan::build_plan(self, source, &extracted, options, transforms.pattern)
        };
        let diagnostics = extracted.diagnostics;

        let (code, map) = {
            let _span = tracing::trace_span!(target: "transform", "transform_print").entered();
            let edits = apply::build_transform_edits(self, path, source, &plan, options.helper_cx);
            apply::apply_edits(source, path, &edits)
        };
        let changed = code != source;
        span.record("changed", changed);
        span.record("bailed", plan.bailed);
        span.record("rewrites", plan.rewrites.len());
        // No edits landed: report an unchanged source regardless of what
        // `apply_edits` returned for the map.
        let map = changed.then_some(map).flatten();

        TransformOutput {
            code,
            map,
            changed,
            bailed: plan.bailed,
            diagnostics,
            dependencies: plan.dependencies,
            helper: plan.helper,
        }
    }
}

/// Free-function alias for [`Project::transform_source`].
#[must_use]
pub fn transform_source(
    project: &Project,
    path: &str,
    source: &str,
    options: &TransformOptions,
) -> TransformOutput {
    project.transform_source(path, source, options)
}
