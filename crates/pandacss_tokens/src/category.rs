//! Token category — the top-level bucket a path belongs to.

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

/// Token category — the top-level bucket a path belongs to.
///
/// Variant names match `packages/types/src/tokens.ts` so JS-resolved
/// dictionaries serialize cleanly into Rust without an extra translation
/// step. Unknown categories fall through to [`Self::Other`] preserving
/// the original spelling.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub enum TokenCategory {
    Colors,
    Sizes,
    Spacing,
    FontSizes,
    Fonts,
    LineHeights,
    LetterSpacings,
    FontWeights,
    Radii,
    Shadows,
    BorderWidths,
    Borders,
    Easings,
    Durations,
    Transitions,
    Gradients,
    Opacity,
    ZIndex,
    Assets,
    Cursor,
    AspectRatios,
    Animations,
    Blurs,
    Breakpoints,
    Other(String),
}

impl TokenCategory {
    #[must_use]
    pub fn from_path_segment(s: &str) -> Self {
        match s {
            "colors" => Self::Colors,
            "sizes" => Self::Sizes,
            "spacing" => Self::Spacing,
            "fontSizes" => Self::FontSizes,
            "fonts" => Self::Fonts,
            "lineHeights" => Self::LineHeights,
            "letterSpacings" => Self::LetterSpacings,
            "fontWeights" => Self::FontWeights,
            "radii" => Self::Radii,
            "shadows" => Self::Shadows,
            "borderWidths" => Self::BorderWidths,
            "borders" => Self::Borders,
            "easings" => Self::Easings,
            "durations" => Self::Durations,
            "transitions" => Self::Transitions,
            "gradients" => Self::Gradients,
            "opacity" => Self::Opacity,
            "zIndex" => Self::ZIndex,
            "assets" => Self::Assets,
            "cursor" => Self::Cursor,
            "aspectRatios" => Self::AspectRatios,
            "animations" => Self::Animations,
            "blurs" => Self::Blurs,
            "breakpoints" => Self::Breakpoints,
            other => Self::Other(other.to_owned()),
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        match self {
            Self::Colors => "colors",
            Self::Sizes => "sizes",
            Self::Spacing => "spacing",
            Self::FontSizes => "fontSizes",
            Self::Fonts => "fonts",
            Self::LineHeights => "lineHeights",
            Self::LetterSpacings => "letterSpacings",
            Self::FontWeights => "fontWeights",
            Self::Radii => "radii",
            Self::Shadows => "shadows",
            Self::BorderWidths => "borderWidths",
            Self::Borders => "borders",
            Self::Easings => "easings",
            Self::Durations => "durations",
            Self::Transitions => "transitions",
            Self::Gradients => "gradients",
            Self::Opacity => "opacity",
            Self::ZIndex => "zIndex",
            Self::Assets => "assets",
            Self::Cursor => "cursor",
            Self::AspectRatios => "aspectRatios",
            Self::Animations => "animations",
            Self::Blurs => "blurs",
            Self::Breakpoints => "breakpoints",
            Self::Other(s) => s.as_str(),
        }
    }
}
