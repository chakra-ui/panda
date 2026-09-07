//! css-barrel factories whose call folds to a generated name. Register a new
//! one here: add a variant plus its arms below, and it flows through extraction,
//! value-fold, and transform unchanged.

use serde_json::Value;

use crate::keyframes::keyframes_name;
use crate::position_try::position_try_ident;
use crate::view_transition::view_transition_class_name;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CssFactory {
    PositionTry,
    Keyframes,
    ViewTransition,
}

impl CssFactory {
    #[must_use]
    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            "positionTry" => Some(Self::PositionTry),
            "keyframes" => Some(Self::Keyframes),
            "viewTransition" => Some(Self::ViewTransition),
            _ => None,
        }
    }

    /// Object-form name for `factory({ ... })`, prefix-aware.
    #[must_use]
    pub fn ident(self, options: &Value, prefix: &str) -> String {
        match self {
            Self::PositionTry => position_try_ident(options, prefix),
            Self::Keyframes => keyframes_name(options, prefix),
            Self::ViewTransition => view_transition_class_name(options, prefix),
        }
    }

    /// Folds inside a `css({...})` value slot. A className class does not.
    #[must_use]
    pub fn folds_as_css_value(self) -> bool {
        matches!(self, Self::PositionTry | Self::Keyframes)
    }

    /// A bare string argument resolves a named `theme` bag.
    #[must_use]
    pub fn has_named_form(self) -> bool {
        matches!(self, Self::PositionTry | Self::ViewTransition)
    }
}
