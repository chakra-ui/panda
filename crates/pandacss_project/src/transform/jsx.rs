//! JSX opening-element and React runtime call rewrites.

use pandacss_extractor::{ExtractedJsx, JsxSourceKind};

use crate::PatternTransformFn;
use crate::Project;

use super::jsx_element;
use super::jsx_runtime;
use super::plan::{HelperCxMode, Rewrite};

/// Rewrite one extracted JSX site (opening element or runtime call).
#[must_use]
pub(crate) fn rewrites_for_jsx_element(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Vec<Rewrite> {
    // Only rewrite tags Panda owns. A name-only match (`jsxStyleProps`, or a
    // lib component colliding with a pattern name) is extracted for CSS but
    // left untouched: rewriting it would replace a user's component with a `div`.
    if !jsx.panda_owned {
        return Vec::new();
    }

    match jsx.source.kind {
        JsxSourceKind::Element | JsxSourceKind::FrameworkTemplate => {
            jsx_element::rewrites_for_jsx_opening_element(
                project,
                source,
                jsx,
                helper_cx,
                pattern_transform,
            )
        }
        JsxSourceKind::RuntimeCall => jsx_runtime::rewrites_for_jsx_runtime_call(
            project,
            source,
            jsx,
            helper_cx,
            pattern_transform,
        ),
    }
}
