use super::{Compiler, Diagnostic};
use crate::convert::convert_diagnostic;

use napi_derive::napi;
use pandacss_transformer::{
    HelperCxMode, TransformMode, TransformOptions, TransformTargets, transform_source,
};

#[napi(object)]
pub struct TransformSourceOptions {
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
        &self,
        path: String,
        source: String,
        options: Option<TransformSourceOptions>,
    ) -> TransformSourceResult {
        let options = options
            .as_ref()
            .map(into_transform_options)
            .unwrap_or_default();
        let output = transform_source(&self.inner, &path, &source, &options);
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
}

fn into_transform_options(options: &TransformSourceOptions) -> TransformOptions {
    TransformOptions {
        mode: match options.mode.as_deref() {
            Some("serve") => TransformMode::Serve,
            _ => TransformMode::Build,
        },
        helper_cx: match options.helper_cx.as_deref() {
            Some("true") => HelperCxMode::True,
            Some("false") => HelperCxMode::False,
            _ => HelperCxMode::Auto,
        },
        targets: TransformTargets {
            css: options.targets_css.unwrap_or(false),
            patterns: options.targets_patterns.unwrap_or(false),
            recipes: options.targets_recipes.unwrap_or(false),
            tokens: options.targets_tokens.unwrap_or(false),
            jsx: options.targets_jsx.unwrap_or(false),
        },
    }
}
