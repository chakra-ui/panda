use super::transforms::{
    apply_pattern_transform, apply_source_transforms, apply_utility_transform,
};
use super::{Compiler, Diagnostic};
use crate::convert::convert_diagnostic;

use napi::bindgen_prelude::Env;
use napi_derive::napi;
use pandacss_encoder::AtomValue;
use pandacss_project::{
    HelperCxMode, TransformMode, TransformOptions, TransformTargets, transform_source,
};

#[napi(object)]
pub struct TransformSourceInput {
    pub path: String,
    pub source: String,
    pub mode: Option<String>,
    pub helper_cx: Option<String>,
    pub targets_css: Option<bool>,
    pub targets_patterns: Option<bool>,
    pub targets_recipes: Option<bool>,
    pub targets_tokens: Option<bool>,
    pub targets_jsx: Option<bool>,
}

#[napi(object)]
pub struct TransformSourceResult {
    pub code: String,
    pub map: Option<String>,
    pub changed: bool,
    pub bailed: bool,
    pub diagnostics: Vec<Diagnostic>,
    pub dependencies: Vec<String>,
    pub helper: TransformSourceHelperFacts,
}

#[napi(object)]
pub struct TransformSourceHelperFacts {
    pub needs_cx: bool,
    pub needs_cva: bool,
    pub needs_sva: bool,
}

#[napi]
impl Compiler {
    /// Rewrite one source file to inline static Panda class strings where safe.
    #[napi(js_name = transformSource)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn transform_source(
        &mut self,
        env: Env,
        input: TransformSourceInput,
    ) -> TransformSourceResult {
        crate::init_tracing();
        let options = into_transform_options(&input);
        let output = self.transform_inner(&env, &input.path, &input.source, &options);
        crate::flush_tracing();
        TransformSourceResult {
            code: output.code,
            map: output.map,
            changed: output.changed,
            bailed: output.bailed,
            diagnostics: output
                .diagnostics
                .into_iter()
                .map(convert_diagnostic)
                .collect(),
            dependencies: output.dependencies,
            helper: TransformSourceHelperFacts {
                needs_cx: output.helper.needs_cx,
                needs_cva: output.helper.needs_cva,
                needs_sva: output.helper.needs_sva,
            },
        }
    }

    /// Shared transform path — wires the same pattern/source/utility callbacks as
    /// `parse_inner`, then calls `Project::transform_source_with`.
    fn transform_inner(
        &mut self,
        env: &Env,
        path: &str,
        source: &str,
        options: &TransformOptions,
    ) -> pandacss_project::TransformOutput {
        let has_source_transforms = self.callbacks.has_source_transforms();
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_source_transforms && !has_pattern_transforms && !has_utility_transforms {
            return transform_source(&self.inner, path, source, options);
        }
        let Compiler {
            inner, callbacks, ..
        } = self;
        let pattern_cache = &mut callbacks.transform_cache.pattern;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut pattern_transform = |name: &str, styles: &pandacss_extractor::Literal| {
            apply_pattern_transform(
                name,
                styles,
                &callbacks.pattern_transform_refs,
                &callbacks.pattern_transforms,
                pattern_cache,
                env,
            )
        };
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                env,
            )
        };
        let mut source_transform = |path: &str, source: &str| {
            apply_source_transforms(path, source, &callbacks.source_transforms, env)
        };
        inner.transform_source_with(
            path,
            source,
            options,
            pandacss_project::ParseTransforms {
                source: has_source_transforms.then_some(
                    &mut source_transform as &mut pandacss_project::SourceTransformFn<'_>,
                ),
                pattern: has_pattern_transforms.then_some(
                    &mut pattern_transform as &mut pandacss_project::PatternTransformFn<'_>,
                ),
                utility: has_utility_transforms.then_some(
                    &mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>,
                ),
            },
        )
    }
}

fn into_transform_options(input: &TransformSourceInput) -> TransformOptions {
    TransformOptions {
        mode: match input.mode.as_deref() {
            Some("serve") => TransformMode::Serve,
            _ => TransformMode::Build,
        },
        helper_cx: match input.helper_cx.as_deref() {
            Some("true") => HelperCxMode::True,
            Some("false") => HelperCxMode::False,
            _ => HelperCxMode::Auto,
        },
        targets: TransformTargets {
            css: input.targets_css.unwrap_or(false),
            patterns: input.targets_patterns.unwrap_or(false),
            recipes: input.targets_recipes.unwrap_or(false),
            tokens: input.targets_tokens.unwrap_or(false),
            jsx: input.targets_jsx.unwrap_or(false),
        },
    }
}
