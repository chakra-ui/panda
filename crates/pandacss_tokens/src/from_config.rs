use std::borrow::Cow;
use std::sync::Arc;

use pandacss_config::{
    ColorPaletteOptions, Deprecated, SemanticTokens, SemanticValue, Theme, ThemeVariantsMap,
    TokenEntry, TokenGroup, TokenNode, Tokens, UserConfig,
};
use pandacss_shared::{capitalize, number_to_js_string, to_hash};
use rustc_hash::{FxHashMap, FxHashSet};

use crate::{
    Token, TokenCategory, TokenDictionary, TokenDictionaryBuilder, TokenError,
    transform::TokenValueString,
};

#[derive(Debug, Clone, Copy)]
pub struct TokenDictionaryOptions<'a> {
    pub theme: &'a Theme,
    pub themes: &'a ThemeVariantsMap,
    pub prefix: Option<&'a str>,
    pub hash: bool,
    pub color_palette: &'a ColorPaletteOptions,
}

impl<'a> TokenDictionaryOptions<'a> {
    #[must_use]
    pub fn from_config(config: &'a UserConfig) -> Self {
        Self {
            theme: &config.theme,
            themes: &config.themes,
            prefix: config.prefix.css_var(),
            hash: config.hash.css_var(),
            color_palette: &config.theme.color_palette,
        }
    }
}

/// Build the full token dictionary from config in fixed phases: base tokens →
/// breakpoints → semantic tokens → per-theme-variant tokens → derived negative
/// spacing → virtual `colorPalette` tokens → resolve `{…}` references → drop
/// empties. Returns `None` when the config contributes no tokens.
pub(crate) fn create_token_dictionary(
    options: TokenDictionaryOptions<'_>,
) -> Result<Option<TokenDictionary>, TokenError> {
    let mut builder = TokenDictionary::builder();
    let mut context = BuildContext {
        prefix: options.prefix,
        hash: options.hash,
        count: 0,
    };

    collect_tokens(&mut builder, &mut context, &options.theme.tokens, None);
    collect_breakpoint_tokens(&mut builder, &mut context, options.theme);
    collect_semantic_tokens(
        &mut builder,
        &mut context,
        &options.theme.semantic_tokens,
        None,
    );

    for (name, variant) in options.themes {
        let condition = format!("_theme{}", capitalize(name));
        collect_tokens(
            &mut builder,
            &mut context,
            &variant.tokens,
            Some(&condition),
        );
        collect_semantic_tokens(
            &mut builder,
            &mut context,
            &variant.semantic_tokens,
            Some(&condition),
        );
    }

    add_negative_spacing_tokens(&mut builder);
    add_virtual_color_palette_tokens(&mut builder, &context, options.color_palette);
    expand_token_references(&mut builder)?;
    remove_empty_tokens(&mut builder);
    if builder.tokens_mut().is_empty() {
        return Ok(None);
    }

    Ok((context.count > 0).then(|| builder.build()))
}

struct BuildContext<'a> {
    prefix: Option<&'a str>,
    hash: bool,
    count: usize,
}

fn collect_breakpoint_tokens(
    builder: &mut TokenDictionaryBuilder,
    context: &mut BuildContext<'_>,
    theme: &Theme,
) {
    for name in theme
        .breakpoint_names()
        .into_iter()
        .filter(|name| name != "base")
    {
        let Some(value) = theme.breakpoints.get(&name) else {
            continue;
        };
        push_token(
            builder,
            context,
            &TokenPath::from_segments(&["breakpoints", &name]),
            value,
            TokenCategory::Breakpoints,
            None,
            None,
        );
        push_token(
            builder,
            context,
            &TokenPath::from_segments(&["sizes", &format!("breakpoint-{name}")]),
            value,
            TokenCategory::Sizes,
            None,
            None,
        );
    }
}

fn collect_tokens(
    builder: &mut TokenDictionaryBuilder,
    context: &mut BuildContext<'_>,
    tokens: &Tokens,
    condition: Option<&str>,
) {
    macro_rules! collect {
        ($name:literal, $category:expr, $group:expr) => {
            collect_token_category(builder, context, $name, &$category, $group, condition);
        };
    }

    collect!("cursor", TokenCategory::Cursor, &tokens.cursor);
    collect!("zIndex", TokenCategory::ZIndex, &tokens.z_index);
    collect!("opacity", TokenCategory::Opacity, &tokens.opacity);
    collect!("colors", TokenCategory::Colors, &tokens.colors);
    collect!("fonts", TokenCategory::Fonts, &tokens.fonts);
    collect!("fontSizes", TokenCategory::FontSizes, &tokens.font_sizes);
    collect!(
        "fontWeights",
        TokenCategory::FontWeights,
        &tokens.font_weights
    );
    collect!(
        "lineHeights",
        TokenCategory::LineHeights,
        &tokens.line_heights
    );
    collect!(
        "letterSpacings",
        TokenCategory::LetterSpacings,
        &tokens.letter_spacings
    );
    collect!("sizes", TokenCategory::Sizes, &tokens.sizes);
    collect!("shadows", TokenCategory::Shadows, &tokens.shadows);
    collect!("spacing", TokenCategory::Spacing, &tokens.spacing);
    collect!("radii", TokenCategory::Radii, &tokens.radii);
    collect!("borders", TokenCategory::Borders, &tokens.borders);
    collect!("durations", TokenCategory::Durations, &tokens.durations);
    collect!("easings", TokenCategory::Easings, &tokens.easings);
    collect!("animations", TokenCategory::Animations, &tokens.animations);
    collect!("blurs", TokenCategory::Blurs, &tokens.blurs);
    collect!("gradients", TokenCategory::Gradients, &tokens.gradients);
    collect!("assets", TokenCategory::Assets, &tokens.assets);
    collect!(
        "borderWidths",
        TokenCategory::BorderWidths,
        &tokens.border_widths
    );
    collect!(
        "aspectRatios",
        TokenCategory::AspectRatios,
        &tokens.aspect_ratios
    );
    collect!(
        "containerNames",
        TokenCategory::Other("containerNames".into()),
        &tokens.container_names
    );
}

fn collect_semantic_tokens(
    builder: &mut TokenDictionaryBuilder,
    context: &mut BuildContext<'_>,
    tokens: &SemanticTokens,
    forced_condition: Option<&str>,
) {
    macro_rules! collect {
        ($name:literal, $category:expr, $group:expr) => {
            collect_semantic_category(
                builder,
                context,
                $name,
                &$category,
                $group,
                forced_condition,
            );
        };
    }

    collect!("cursor", TokenCategory::Cursor, &tokens.cursor);
    collect!("zIndex", TokenCategory::ZIndex, &tokens.z_index);
    collect!("opacity", TokenCategory::Opacity, &tokens.opacity);
    collect!("colors", TokenCategory::Colors, &tokens.colors);
    collect!("fonts", TokenCategory::Fonts, &tokens.fonts);
    collect!("fontSizes", TokenCategory::FontSizes, &tokens.font_sizes);
    collect!(
        "fontWeights",
        TokenCategory::FontWeights,
        &tokens.font_weights
    );
    collect!(
        "lineHeights",
        TokenCategory::LineHeights,
        &tokens.line_heights
    );
    collect!(
        "letterSpacings",
        TokenCategory::LetterSpacings,
        &tokens.letter_spacings
    );
    collect!("sizes", TokenCategory::Sizes, &tokens.sizes);
    collect!("shadows", TokenCategory::Shadows, &tokens.shadows);
    collect!("spacing", TokenCategory::Spacing, &tokens.spacing);
    collect!("radii", TokenCategory::Radii, &tokens.radii);
    collect!("borders", TokenCategory::Borders, &tokens.borders);
    collect!("durations", TokenCategory::Durations, &tokens.durations);
    collect!("easings", TokenCategory::Easings, &tokens.easings);
    collect!("animations", TokenCategory::Animations, &tokens.animations);
    collect!("blurs", TokenCategory::Blurs, &tokens.blurs);
    collect!("gradients", TokenCategory::Gradients, &tokens.gradients);
    collect!("assets", TokenCategory::Assets, &tokens.assets);
    collect!(
        "borderWidths",
        TokenCategory::BorderWidths,
        &tokens.border_widths
    );
    collect!(
        "aspectRatios",
        TokenCategory::AspectRatios,
        &tokens.aspect_ratios
    );
    collect!(
        "containerNames",
        TokenCategory::Other("containerNames".into()),
        &tokens.container_names
    );
}

fn collect_token_category<T: TokenValueString>(
    builder: &mut TokenDictionaryBuilder,
    context: &mut BuildContext<'_>,
    category: &'static str,
    token_category: &TokenCategory,
    group: &TokenGroup<T>,
    condition: Option<&str>,
) {
    walk_token_group(group, &mut vec![category], &mut |path, token| {
        let token_path = TokenPath::from_segments(path);
        let metadata = token_metadata(token, token_path.is_default);
        push_token(
            builder,
            context,
            &token_path,
            &token.value.to_token_string(),
            token_category.clone(),
            condition,
            Some(metadata),
        );
    });
}

fn collect_semantic_category<T: TokenValueString>(
    builder: &mut TokenDictionaryBuilder,
    context: &mut BuildContext<'_>,
    category: &'static str,
    token_category: &TokenCategory,
    group: &TokenGroup<SemanticValue<T>>,
    forced_condition: Option<&str>,
) {
    walk_token_group(group, &mut vec![category], &mut |path, token| {
        let token_path = TokenPath::from_segments(path);
        let metadata = token_metadata(token, token_path.is_default);

        if let Some(condition) = forced_condition {
            visit_semantic_values(&token.value, None, &mut |nested_condition, value| {
                let condition = nested_condition.as_deref().map_or_else(
                    || condition.to_owned(),
                    |nested| format!("{condition}:{nested}"),
                );
                push_token(
                    builder,
                    context,
                    &token_path,
                    &value.to_token_string(),
                    token_category.clone(),
                    Some(&condition),
                    Some(metadata),
                );
            });
            return;
        }

        visit_semantic_values(&token.value, None, &mut |condition, value| {
            push_token(
                builder,
                context,
                &token_path,
                &value.to_token_string(),
                token_category.clone(),
                condition.as_deref(),
                Some(metadata),
            );
        });
    });
}

/// Flatten a (possibly nested) semantic value, invoking `visit` once per
/// concrete value with its condition. Nested conditions are colon-joined
/// (`_dark` inside `md` -> `md:_dark`); a top-level `base` carries `None`.
fn visit_semantic_values<T>(
    value: &SemanticValue<T>,
    condition: Option<&str>,
    visit: &mut impl FnMut(Option<String>, &T),
) {
    match value {
        SemanticValue::Value(value) => visit(condition.map(str::to_owned), value),
        SemanticValue::Conditions(conditions) => {
            for (key, value) in conditions {
                let next_condition = if key == "base" && condition.is_none() {
                    None
                } else if let Some(condition) = condition {
                    let mut out = String::with_capacity(condition.len() + 1 + key.len());
                    out.push_str(condition);
                    out.push(':');
                    out.push_str(key);
                    Some(out)
                } else {
                    Some(key.clone())
                };
                visit_semantic_values(value, next_condition.as_deref(), visit);
            }
        }
    }
}

fn walk_token_group<'a, T>(
    group: &'a TokenGroup<T>,
    path: &mut Vec<&'a str>,
    visit: &mut impl FnMut(&[&'a str], &'a TokenEntry<T>),
) {
    for (key, node) in group {
        path.push(key);
        walk_token_node(node, path, visit);
        path.pop();
    }
}

fn walk_token_node<'a, T>(
    node: &'a TokenNode<T>,
    path: &mut Vec<&'a str>,
    visit: &mut impl FnMut(&[&'a str], &'a TokenEntry<T>),
) {
    match node {
        TokenNode::Token(token) => visit(path, token),
        TokenNode::Group(group) => walk_token_group(group, path, visit),
    }
}

#[derive(Clone, Copy)]
struct TokenMetadata<'a> {
    description: Option<&'a str>,
    deprecated: bool,
    is_default: bool,
}

fn token_metadata<T>(token: &TokenEntry<T>, is_default: bool) -> TokenMetadata<'_> {
    TokenMetadata {
        description: token.description.as_deref(),
        deprecated: token.deprecated.as_ref().is_some_and(|value| match value {
            Deprecated::Bool(value) => *value,
            Deprecated::Message(value) => !value.is_empty(),
        }),
        is_default,
    }
}

struct TokenPath {
    dotted: String,
    css_var_name: String,
    is_default: bool,
}

impl TokenPath {
    /// Build the dotted path (`colors.red.500`) and CSS-var name
    /// (`colors-red-500`) from segments, dropping any `DEFAULT` segment. Two
    /// passes: precompute lengths to size the buffers exactly, then fill them.
    fn from_segments(segments: &[&str]) -> Self {
        let mut dotted_len = 0;
        let mut css_var_len = 0;
        let mut count = 0;
        let mut is_default = false;

        for segment in segments.iter().copied() {
            if segment == "DEFAULT" {
                is_default = true;
                continue;
            }
            dotted_len += segment.len();
            css_var_len += segment.len();
            if count > 0 {
                dotted_len += 1;
                css_var_len += 1;
            }
            count += 1;
        }

        let mut dotted = String::with_capacity(dotted_len);
        let mut css_var_name = String::with_capacity(css_var_len);
        let mut first = true;
        for segment in segments.iter().copied() {
            if segment == "DEFAULT" {
                continue;
            }
            if first {
                first = false;
            } else {
                dotted.push('.');
                css_var_name.push('-');
            }
            dotted.push_str(segment);
            css_var_name.push_str(segment);
        }

        Self {
            dotted,
            css_var_name,
            is_default,
        }
    }

    fn from_owned_path(path: String) -> Self {
        let css_var_name = path.replace('.', "-");
        Self {
            dotted: path,
            css_var_name,
            is_default: false,
        }
    }
}

fn push_token(
    builder: &mut TokenDictionaryBuilder,
    context: &mut BuildContext<'_>,
    path: &TokenPath,
    value: &str,
    category: TokenCategory,
    condition: Option<&str>,
    metadata: Option<TokenMetadata<'_>>,
) {
    let mut token = Token::new(
        path.dotted.as_str(),
        value,
        css_var(path.css_var_name.as_str(), context),
        category,
    );
    if let Some(condition) = condition {
        token = token.with_condition(condition);
    }
    if let Some(metadata) = metadata {
        if let Some(description) = metadata.description {
            token = token.with_description(description);
        }
        if metadata.deprecated {
            token = token.deprecated();
        }
        if metadata.is_default {
            token.set_extension("isDefault", "true");
        }
    }
    builder.push(token);
    context.count += 1;
}

fn css_var(name: &str, context: &BuildContext<'_>) -> String {
    let variable = css_var_variable(name, context);
    let mut out = String::with_capacity("var()".len() + variable.len());
    out.push_str("var(");
    out.push_str(&variable);
    out.push(')');
    out
}

fn css_var_variable(name: &str, context: &BuildContext<'_>) -> String {
    if context.hash {
        let hash = to_hash(name);
        let prefix = context.prefix.unwrap_or_default();
        let mut out =
            String::with_capacity(2 + prefix.len() + usize::from(!prefix.is_empty()) + hash.len());
        out.push_str("--");
        if !prefix.is_empty() {
            out.push_str(prefix);
            out.push('-');
        }
        out.push_str(&hash);
        out
    } else {
        let prefix = context.prefix.unwrap_or_default();
        let mut out =
            String::with_capacity(2 + prefix.len() + usize::from(!prefix.is_empty()) + name.len());
        out.push_str("--");
        if !prefix.is_empty() {
            push_css_var_name(&mut out, prefix);
            out.push('-');
        }
        push_css_var_name(&mut out, name);
        out
    }
}

fn push_css_var_name(out: &mut String, value: &str) {
    for ch in value.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else if ch.is_ascii_alphanumeric()
            || ch == '_'
            || ch == '-'
            || ('\u{0081}'..='\u{ffff}').contains(&ch)
        {
            out.push(ch);
        } else {
            out.push('\\');
            out.push(ch);
        }
    }
}

fn expand_token_references(builder: &mut TokenDictionaryBuilder) -> Result<(), TokenError> {
    let tokens = builder.tokens_mut();
    if tokens.is_empty() {
        return Ok(());
    }

    // Index path -> token, base tokens first so an unconditional value wins;
    // a second pass fills paths that only have conditional variants.
    let mut by_path: FxHashMap<Arc<str>, usize> =
        FxHashMap::with_capacity_and_hasher(tokens.len(), rustc_hash::FxBuildHasher);
    for (index, token) in tokens.iter().enumerate() {
        if token.condition.is_none() {
            by_path.entry(Arc::clone(&token.path)).or_insert(index);
        }
    }
    for (index, token) in tokens.iter().enumerate() {
        by_path.entry(Arc::clone(&token.path)).or_insert(index);
    }

    for index in 0..tokens.len() {
        if !has_reference(&tokens[index].value) {
            continue;
        }

        let value = Arc::clone(&tokens[index].value);
        let expanded = expand_references(
            value.as_ref(),
            tokens,
            &by_path,
            tokens[index].category == TokenCategory::Colors,
        )?;
        if let Some(expanded) = expanded {
            tokens[index].original_value = Some(value);
            tokens[index].value = Arc::from(expanded);
        }
    }

    Ok(())
}

/// For every positive spacing token, synthesize a negative sibling
/// (`spacing.4` -> `spacing.-4`) whose value is `calc(var(--…) * -1)`, carrying
/// over the source token's condition/metadata.
fn add_negative_spacing_tokens(builder: &mut TokenDictionaryBuilder) {
    let tokens = builder.tokens_mut();
    if tokens.is_empty() {
        return;
    }

    let mut negative_tokens = Vec::new();
    for token in tokens.iter() {
        if token.category != TokenCategory::Spacing
            || token.value.as_ref() == "0rem"
            || token.extension("isNegative") == Some("true")
        {
            continue;
        }

        let Some((prefix, last)) = token.path.rsplit_once('.') else {
            continue;
        };
        if last.starts_with('-') {
            continue;
        }

        let mut path = String::with_capacity(token.path.len() + 1);
        path.push_str(prefix);
        path.push_str(".-");
        path.push_str(last);

        let mut value = String::with_capacity("calc(".len() + token.var.len() + " * -1)".len());
        value.push_str("calc(");
        value.push_str(&token.var);
        value.push_str(" * -1)");

        let mut negative = Token::new(path, value, "", TokenCategory::Spacing);
        negative.condition.clone_from(&token.condition);
        negative.original_value = Some(Arc::clone(&token.value));
        negative.description.clone_from(&token.description);
        negative.deprecated = token.deprecated;
        negative.extensions.clone_from(&token.extensions);
        negative.set_extension("isNegative", "true");
        negative.set_extension("prop", format!("-{last}"));
        negative.set_extension("originalPath", token.path.as_ref());

        negative_tokens.push(negative);
    }

    for token in negative_tokens {
        builder.push(token);
    }
}

fn remove_empty_tokens(builder: &mut TokenDictionaryBuilder) {
    builder.retain_tokens(|token| !token.value.is_empty());
}

/// Generate the `colorPalette` machinery. For each concrete color token, this
/// (1) emits virtual `colors.colorPalette.*` placeholder tokens for every
/// ancestor palette root, and (2) records palette → (virtual var → token var)
/// mappings so `colorPalette="…"` can later swap a whole palette in. Honors the
/// `include`/`exclude` glob filters.
fn add_virtual_color_palette_tokens(
    builder: &mut TokenDictionaryBuilder,
    context: &BuildContext<'_>,
    options: &ColorPaletteOptions,
) {
    if options.enabled == Some(false) {
        return;
    }

    let mut palette = PaletteAccumulator::default();

    // Collect roots from every concrete (non-virtual, unconditional) color
    // token, tagging each with the palette it belongs to.
    for token in builder.tokens_mut().iter_mut() {
        if !is_concrete_color(token) {
            continue;
        }

        let segments: Vec<&str> = token.path.split('.').collect();
        let Some(color_path) = color_palette_path_segments(&segments) else {
            continue;
        };

        let color_path_string = join_segments(color_path);
        if !matches_color_palette_options(&color_path_string, options) {
            continue;
        }

        palette.collect_token(token, &segments, color_path, context);
        token.set_extension("colorPalette", &color_path_string);
    }

    palette.emit(builder, context);
}

fn is_concrete_color(token: &Token) -> bool {
    token.category == TokenCategory::Colors
        && token.extension("isVirtual") != Some("true")
        && token.condition.is_none()
}

/// Accumulates the virtual palette tokens + palette mappings discovered while
/// scanning color tokens, then [`Self::emit`]s them into the builder.
#[derive(Default)]
struct PaletteAccumulator {
    virtual_paths: FxHashSet<String>,
    mappings: Vec<(String, String, Arc<str>)>,
}

impl PaletteAccumulator {
    /// Register one color token against every ancestor palette root
    /// (`button.primary.500` -> roots `button`, `button.primary`).
    fn collect_token(
        &mut self,
        token: &Token,
        segments: &[&str],
        color_path: &[&str],
        context: &BuildContext<'_>,
    ) {
        for root_len in 1..=color_path.len() {
            let virtual_path = virtual_color_palette_path(segments, root_len);
            let raw_virtual_var = css_var_variable(&virtual_path.replace('.', "-"), context);
            let palette_name = join_segments(&color_path[..root_len]);

            self.virtual_paths.insert(virtual_path);
            self.mappings
                .push((palette_name, raw_virtual_var, Arc::clone(&token.var)));

            if root_len == 1 && token.extension("isDefault") == Some("true") {
                self.collect_default_root(token, segments, context);
            }
        }
    }

    /// A `DEFAULT` color also maps the bare `colors.colorPalette` root, so
    /// `colorPalette="button"` resolves to the default shade directly.
    fn collect_default_root(
        &mut self,
        token: &Token,
        segments: &[&str],
        context: &BuildContext<'_>,
    ) {
        // Only reached with `root_len == 1`, so the key path is everything past
        // `colors.<root>`.
        if segments[2..].is_empty() {
            return;
        }

        let special_palette = join_segments(&segments[1..]);
        let raw_base_virtual_var = css_var_variable("colors-colorPalette", context);

        self.virtual_paths.insert("colors.colorPalette".to_owned());
        self.mappings.push((
            special_palette,
            raw_base_virtual_var,
            Arc::clone(&token.var),
        ));
    }

    fn emit(self, builder: &mut TokenDictionaryBuilder, context: &BuildContext<'_>) {
        // Sorted so virtual-token emission order is deterministic.
        let mut virtual_paths: Vec<String> = self.virtual_paths.into_iter().collect();
        virtual_paths.sort();

        for path in virtual_paths {
            let token_path = TokenPath::from_owned_path(path);
            // A virtual token's value is its own var-ref (v1's `isVirtual ->
            // varRef` rule), so `token('colors.colorPalette.500')` resolves to
            // `var(--colors-color-palette-500)` instead of the path string.
            let var = css_var(token_path.css_var_name.as_str(), context);
            let mut token = Token::new(
                token_path.dotted.as_str(),
                &var,
                &var,
                TokenCategory::Colors,
            );
            token.set_extension("isVirtual", "true");
            builder.push(token);
        }

        for (palette, virtual_var, token_var) in self.mappings {
            builder.add_color_palette_mapping(palette, virtual_var, token_var);
        }
    }
}

use super::{color_palette_path_segments, join_segments, virtual_color_palette_path};

fn matches_color_palette_options(path: &str, options: &ColorPaletteOptions) -> bool {
    if options
        .exclude
        .iter()
        .any(|pattern| wildcard_match(pattern, path))
    {
        return false;
    }
    options.include.is_empty()
        || options
            .include
            .iter()
            .any(|pattern| wildcard_match(pattern, path))
}

/// Glob match supporting `*` (any run) and `?` (one char), with backtracking
/// on the last `*` so patterns like `button.*` match greedily but correctly.
fn wildcard_match(pattern: &str, value: &str) -> bool {
    if pattern == value || pattern == "*" {
        return true;
    }

    let pattern = pattern.as_bytes();
    let value = value.as_bytes();
    let (mut p, mut v) = (0, 0);
    let mut star = None;
    let mut star_value = 0;

    while v < value.len() {
        if p < pattern.len() && (pattern[p] == b'?' || pattern[p] == value[v]) {
            p += 1;
            v += 1;
        } else if p < pattern.len() && pattern[p] == b'*' {
            star = Some(p);
            p += 1;
            star_value = v;
        } else if let Some(star_index) = star {
            p = star_index + 1;
            star_value += 1;
            v = star_value;
        } else {
            return false;
        }
    }

    while p < pattern.len() && pattern[p] == b'*' {
        p += 1;
    }

    p == pattern.len()
}

fn has_reference(value: &str) -> bool {
    value.contains('{') && value.contains('}')
}

fn expand_references(
    value: &str,
    tokens: &[Token],
    by_path: &FxHashMap<Arc<str>, usize>,
    allow_color_mix: bool,
) -> Result<Option<String>, TokenError> {
    let mut out = String::with_capacity(value.len());
    let mut rest = value;
    let mut changed = false;

    while let Some(start) = rest.find('{') {
        let (before, after_start) = rest.split_at(start);
        out.push_str(before);
        let after_start = &after_start[1..];
        let Some(end) = after_start.find('}') else {
            out.push('{');
            out.push_str(after_start);
            return Ok((out != value).then_some(out));
        };
        let key = after_start[..end].trim();
        let replacement = if allow_color_mix && key.contains('/') {
            Cow::Owned(color_mix(key, tokens, by_path)?)
        } else {
            Cow::Borrowed(
                by_path
                    .get(key)
                    .map_or(key, |index| tokens[*index].var.as_ref()),
            )
        };
        out.push_str(&replacement);
        changed = true;
        rest = &after_start[end + 1..];
    }

    if !changed {
        return Ok(None);
    }
    out.push_str(rest);
    Ok(Some(out))
}

/// Resolve a `{color/opacity}` reference into a `color-mix(...)` expression.
/// `opacity` may be a token (`opacity.50` -> 50%) or a bare number; either way
/// the color mixes with `transparent` at that percentage.
fn color_mix(
    value: &str,
    tokens: &[Token],
    by_path: &FxHashMap<Arc<str>, usize>,
) -> Result<String, TokenError> {
    let Some((color_path, raw_opacity)) = value.split_once('/') else {
        return Err(TokenError::token(format!(
            "Invalid color mix at {value}: {value}"
        )));
    };
    if color_path.is_empty() || raw_opacity.is_empty() {
        return Err(TokenError::token(format!(
            "Invalid color mix at {value}: {value}"
        )));
    }

    let color = by_path
        .get(color_path)
        .map_or(color_path, |index| tokens[*index].var.as_ref());
    let mut opacity_path = String::with_capacity("opacity.".len() + raw_opacity.len());
    opacity_path.push_str("opacity.");
    opacity_path.push_str(raw_opacity);
    let opacity = if let Some(index) = by_path.get(opacity_path.as_str()) {
        let opacity = tokens[*index].value.as_ref();
        let opacity = opacity.parse::<f64>().map_err(|_| {
            TokenError::token(format!("Invalid color mix at {value}: {color_path}"))
        })?;
        let mut out = number_to_js_string(opacity * 100.0);
        out.push('%');
        out
    } else if raw_opacity.parse::<f64>().is_ok() {
        let mut out = String::with_capacity(raw_opacity.len() + 1);
        out.push_str(raw_opacity);
        out.push('%');
        out
    } else {
        return Err(TokenError::token(format!(
            "Invalid color mix at {value}: {color_path}"
        )));
    };

    let mut out =
        String::with_capacity("color-mix(in oklab, ".len() + color.len() + opacity.len() + 15);
    out.push_str("color-mix(in oklab, ");
    out.push_str(color);
    out.push(' ');
    out.push_str(&opacity);
    out.push_str(", transparent)");
    Ok(out)
}
