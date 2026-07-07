//! JSX opening-element and React runtime call rewrites.

mod conditional;
mod element;
pub(crate) mod parse;
mod runtime;
mod shared;
mod tag;

use pandacss_extractor::ExtractedJsx;
use pandacss_project::Project;

use crate::plan::{HelperCxMode, Rewrite};
use crate::resolve::span_slice;

/// Rewrite one extracted JSX site (opening element or runtime call).
#[must_use]
pub(crate) fn rewrites_for_jsx_element(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    needs_cx: &mut bool,
) -> Vec<Rewrite> {
    let Some(slice) = span_slice(source, jsx.span) else {
        return Vec::new();
    };

    if parse::is_jsx_element_syntax(slice) {
        element::rewrites_for_jsx_opening_element(project, source, jsx, helper_cx, needs_cx)
    } else {
        runtime::rewrites_for_jsx_runtime_call(project, source, jsx, helper_cx, needs_cx)
    }
}
