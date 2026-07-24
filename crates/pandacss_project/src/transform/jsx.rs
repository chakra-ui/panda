//! JSX opening-element and React runtime call rewrites.

use pandacss_extractor::{ExtractedJsx, JsxKind, JsxSourceKind};

use crate::PatternTransformFn;
use crate::Project;

use super::jsx_element;
use super::jsx_runtime;
use super::plan::{HelperCxMode, Rewrite};
use super::recipe_inline;
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
    // Only rewrite tags Panda owns. A name-only match (`jsxStyleProps`, or a
    // lib component colliding with a pattern name) is extracted for CSS but
    // left untouched: rewriting it would replace a user's component with a `div`.
    if !jsx.panda_owned {
        return Vec::new();
    }

    // A factory-member tagged-template definition (`styled.div`color: red``)
    // desugars to `styled.div(__pcva({ base: '…' }))` — static, no `${…}`
    // interpolation, so the style object is fully known at build time.
    if jsx.source.kind == JsxSourceKind::TaggedTemplate {
        return (jsx.kind == JsxKind::Factory)
            .then(|| styled_template_definition_rewrite(project, source, jsx))
            .flatten()
            .into_iter()
            .collect();
    }

    match jsx.source.kind {
        JsxSourceKind::Element | JsxSourceKind::FrameworkTemplate => {
            jsx_element::rewrites_for_jsx_opening_element(
                project,
                source,
                jsx,
                helper_cx,
                needs_cx,
                pattern_transform,
            )
        }
        JsxSourceKind::RuntimeCall => jsx_runtime::rewrites_for_jsx_runtime_call(
            project,
            source,
            jsx,
            helper_cx,
            needs_cx,
            pattern_transform,
        ),
        JsxSourceKind::TaggedTemplate => Vec::new(),
    }
}

/// Desugars a factory-member tagged template to a precomputed cva call, e.g.
/// `styled.div(__pcva({ base: 'color_red' }))`. `None` unless the slice is a
/// member tagged template with resolvable styles.
fn styled_template_definition_rewrite(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
) -> Option<Rewrite> {
    let callee_span = jsx.source.callee_span?;
    let member = span_slice(source, callee_span)?;
    let config = recipe_inline::styled_config_call(project, &jsx.data)?;
    Some(Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content: format!("{member}({config})"),
        preserved: vec![callee_span],
    })
}
