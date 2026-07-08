//! JSX opening-element and React runtime call rewrites.

use pandacss_extractor::ExtractedJsx;

use crate::PatternTransformFn;
use crate::Project;

use super::jsx_element;
use super::jsx_parse;
use super::jsx_runtime;
use super::plan::{HelperCxMode, Rewrite};
use super::resolve::span_slice;

/// Rewrite one extracted JSX site (opening element or runtime call).
#[must_use]
pub(crate) fn rewrites_for_jsx_element(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    needs_cx: &mut bool,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Vec<Rewrite> {
    let Some(slice) = span_slice(source, jsx.span) else {
        return Vec::new();
    };

    if jsx_parse::is_jsx_element_syntax(slice) {
        jsx_element::rewrites_for_jsx_opening_element(
            project,
            source,
            jsx,
            helper_cx,
            needs_cx,
            pattern_transform,
        )
    } else {
        jsx_runtime::rewrites_for_jsx_runtime_call(
            project,
            source,
            jsx,
            helper_cx,
            needs_cx,
            pattern_transform,
        )
    }
}
