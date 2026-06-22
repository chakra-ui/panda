//! Color-palette index: the `colorPalette` view and the path helpers that
//! wire concrete color tokens to their virtual `colors.colorPalette.*` vars.

use std::sync::Arc;

use rustc_hash::FxHashMap;

use crate::category::TokenCategory;
use crate::token::Token;
use crate::{join_segments, raw_css_var};

/// `palette -> (virtual var -> token var)` index backing color-palette
/// resolution. Built alongside the dictionary's other indexes.
#[derive(Debug, Clone, Default)]
pub struct ColorPaletteView {
    palettes: FxHashMap<Arc<str>, FxHashMap<Arc<str>, Arc<str>>>,
}

impl ColorPaletteView {
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.palettes.is_empty()
    }

    #[must_use]
    pub fn palettes(&self) -> &FxHashMap<Arc<str>, FxHashMap<Arc<str>, Arc<str>>> {
        &self.palettes
    }

    #[must_use]
    pub fn get(&self, palette: &str) -> Option<&FxHashMap<Arc<str>, Arc<str>>> {
        self.palettes.get(palette)
    }

    pub(crate) fn insert(
        &mut self,
        palette: impl AsRef<str>,
        virtual_var: impl AsRef<str>,
        token_var: Arc<str>,
    ) {
        self.palettes
            .entry(Arc::from(palette.as_ref()))
            .or_default()
            .insert(Arc::from(virtual_var.as_ref()), token_var);
    }
}

/// Build the `colorPalette` index: for each concrete color token, map every
/// ancestor palette root (e.g. `button`, `button.primary`) to the virtual
/// `colors.colorPalette.*` var it should resolve through. Two passes — collect
/// the virtual vars first, then wire each concrete token to them.
pub(crate) fn build_color_palette_view(tokens: &[Token]) -> ColorPaletteView {
    // Pass 1: index the virtual `colorPalette` placeholder vars by path.
    let mut virtual_vars: FxHashMap<&str, &str> = FxHashMap::default();
    for token in tokens {
        if token.category == TokenCategory::Colors && token.extension("isVirtual") == Some("true") {
            virtual_vars.insert(token.path.as_ref(), token.var.as_ref());
        }
    }

    if virtual_vars.is_empty() {
        return ColorPaletteView::default();
    }

    // Pass 2: for each concrete color token, register it under every ancestor
    // palette root that has a matching virtual var.
    let mut palettes: FxHashMap<Arc<str>, FxHashMap<Arc<str>, Arc<str>>> = FxHashMap::default();
    for token in tokens {
        if token.category != TokenCategory::Colors
            || token.extension("isVirtual") == Some("true")
            || token.extension("colorPalette").is_none()
            || token.var.is_empty()
        {
            continue;
        }

        let segments: Vec<&str> = token.path.split('.').collect();
        let Some(color_path) = color_palette_path_segments(&segments) else {
            continue;
        };

        for root_len in 1..=color_path.len() {
            let root = &color_path[..root_len];
            let palette_name = join_segments(root);
            let virtual_path = virtual_color_palette_path(&segments, root_len);
            let Some(virtual_var) = virtual_vars.get(virtual_path.as_str()) else {
                continue;
            };
            let Some(raw_virtual_var) = raw_css_var(virtual_var) else {
                continue;
            };

            palettes
                .entry(Arc::from(palette_name))
                .or_default()
                .insert(Arc::from(raw_virtual_var), Arc::clone(&token.var));
        }
    }

    ColorPaletteView { palettes }
}

/// The palette-name segments of a color token path: `colors` prefix and the
/// final value segment dropped (`["colors","button","primary","500"]` ->
/// `["button","primary"]`). `None` for non-color or virtual `colorPalette` paths.
pub(crate) fn color_palette_path_segments<'a>(segments: &'a [&'a str]) -> Option<&'a [&'a str]> {
    if segments.first().copied() != Some("colors")
        || segments.get(1).copied() == Some("colorPalette")
        || segments.len() < 2
    {
        return None;
    }
    if segments.len() > 2 {
        Some(&segments[1..segments.len() - 1])
    } else {
        Some(&segments[1..])
    }
    .filter(|segments| !segments.is_empty())
}

/// The virtual lookup key for a palette root: the segments after the root
/// become `colors.colorPalette.<rest>` (or bare `colors.colorPalette` when the
/// root is the whole path).
pub(crate) fn virtual_color_palette_path(segments: &[&str], root_len: usize) -> String {
    let suffix = &segments[(1 + root_len)..];
    if suffix.is_empty() {
        return "colors.colorPalette".to_owned();
    }
    let suffix_len = suffix.iter().map(|segment| segment.len()).sum::<usize>() + suffix.len();

    let mut out = String::with_capacity("colors.colorPalette".len() + suffix_len);
    out.push_str("colors.colorPalette");

    for segment in suffix {
        out.push('.');
        out.push_str(segment);
    }
    out
}
