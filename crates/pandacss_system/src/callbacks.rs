//! Host callbacks threaded through extraction and transforms. Passed per call
//! rather than stored, because the binding layer rebuilds them fresh each time.

use pandacss_encoder::AtomValue;
use pandacss_literal::Literal;
use pandacss_shared::Diagnostic;

pub type PatternTransformFn<'a> =
    dyn FnMut(&str, &Literal) -> std::result::Result<Option<Literal>, Diagnostic> + 'a;

pub type SourceTransformFn<'a> =
    dyn FnMut(&str, &str) -> std::result::Result<Option<String>, Diagnostic> + 'a;

/// JS `transform` for a custom utility: `(prop, resolved_value, original_value)`
/// → raw style object (NOT decomposed atoms; className/layer stay with the
/// `Utility`). `Ok(None)` = no transform for this prop, keep the atom.
pub type UtilityTransformFn<'a> = dyn FnMut(&str, &AtomValue, &AtomValue) -> std::result::Result<Option<Literal>, Diagnostic>
    + 'a;

/// Per-call transform callbacks for project parsing and source transforms.
#[derive(Default)]
pub struct ParseTransforms<'a> {
    pub source: Option<&'a mut SourceTransformFn<'a>>,
    pub pattern: Option<&'a mut PatternTransformFn<'a>>,
    pub utility: Option<&'a mut UtilityTransformFn<'a>>,
}
