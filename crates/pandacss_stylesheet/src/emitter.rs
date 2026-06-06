//! CSS emission orchestration for the native stylesheet compiler.
//!
//! The emitter gathers atoms, tokens, globals, and recipes, lowers them through
//! the shared style-rule model, groups compatible at-rule wrappers, and writes
//! the final layered CSS string.

use std::{borrow::Cow, fmt::Write as _, ops::Range};

use pandacss_config::{UserConfig, theme_condition_name};
use pandacss_encoder::{
    Atom, AtomValue, ConditionSet, EncodedRecipesSnapshot, Encoder, RecipeStyleEntry,
    RecipeStyleGroupSnapshot,
};
use pandacss_extractor::Literal;
use pandacss_shared::{number_to_js_string, split_important, to_hash};
use pandacss_tokens::{TokenCssConditionVars, TokenCssVar, TokenCssVars, TokenDictionary};
use pandacss_utility::{StyleNormalizer, Utility, UtilityTransformResult, hyphenate_property};
use rustc_hash::{FxBuildHasher, FxHashSet};
use serde_json::Value;

use crate::StylesheetLayerRanges;
use crate::conditions::{
    ConditionPaths, is_nested_selector_key, lower_selector_conditions, lower_target_conditions,
    lower_token_conditions, nested_selector, resolved_condition_paths,
};
use crate::grouped::{GroupNode, write_grouped_rules};
use crate::numeric_value;
use crate::sort::{SortContext, SortedAtom, condition_names};
use crate::style_rules::{
    Declaration, LoweredTarget, StyleRule, Target, append_declaration, append_declarations,
    flush_pending_rule, push_grouped_rule, push_pending_rule, write_rule, write_with_wrappers,
};
use crate::writer::CssWriter;

pub struct EmitOutput {
    pub css: String,
    pub layer_ranges: StylesheetLayerRanges,
}

#[derive(Clone, Copy)]
pub struct EmitTokenContext<'a> {
    pub dictionary: Option<&'a TokenDictionary>,
    pub refs: &'a [String],
}

pub fn emit<'a>(
    config: &'a UserConfig,
    utility: &'a Utility,
    tokens: EmitTokenContext<'a>,
    mut atoms: Vec<&'a Atom>,
    recipes: &'a EncodedRecipesSnapshot,
    minify: bool,
    emit_layer_declaration: bool,
) -> EmitOutput {
    let cx = EmitContext::new(config, utility);
    let layers = &config.layers;
    let mut writer = CssWriter::new(minify, capacity_hint(&atoms, recipes));
    let mut layer_ranges = StylesheetLayerRanges::default();
    if emit_layer_declaration {
        write_layer_order(&mut writer, layers);
        writer.newline();
    }
    if config.preflight.enabled() {
        let options = config.preflight.options();
        let scope = options.and_then(|options| options.scope.as_deref());
        let level = options
            .and_then(|options| options.level)
            .unwrap_or_default();
        layer_ranges.reset = Some(write_layer(&mut writer, &layers.reset, |writer| {
            crate::preflight::write(writer, scope, level);
        }));
    }
    if has_base_layer(config) {
        layer_ranges.base = Some(write_layer(&mut writer, &layers.base, |writer| {
            write_made_with_panda_marker(writer);
            cx.write_collected_styles(writer, &config.global_css);
            cx.serialize_global_vars(writer);
            serialize_global_fontface(writer, &config.global_fontface);
            serialize_global_position_try(writer, &config.global_position_try);
        }));
    }
    if !recipes.atomic.is_empty() {
        atoms.extend(recipes.atomic.iter());
    }
    atoms = dedup_atom_refs(atoms);
    let keyframes = as_non_empty_object(&config.theme.keyframes);
    let usage = if config.optimize.remove_unused_tokens || config.optimize.remove_unused_keyframes {
        Some(cx.collect_usage(tokens.dictionary, tokens.refs, &atoms, recipes, keyframes))
    } else {
        None
    };
    let token_vars = tokens
        .dictionary
        .map(|dictionary| prepare_emittable_token_vars(config, dictionary, usage.as_ref()));
    let prepared_token_vars = token_vars
        .as_ref()
        .and_then(|vars| cx.prepare_token_vars(vars));
    let keyframes = keyframes.filter(|keyframes| {
        !config.optimize.remove_unused_keyframes
            || usage
                .as_ref()
                .is_some_and(|usage| has_used_keyframes(keyframes, &usage.keyframes))
    });
    if prepared_token_vars.is_some() || keyframes.is_some() {
        layer_ranges.tokens = Some(write_layer(&mut writer, &layers.tokens, |writer| {
            if let Some(token_vars) = prepared_token_vars.as_ref() {
                cx.serialize_token_vars(writer, token_vars);
            }
            if let Some(keyframes) = keyframes {
                let used = config
                    .optimize
                    .remove_unused_keyframes
                    .then(|| usage.as_ref().map(|usage| &usage.keyframes))
                    .flatten();
                serialize_keyframes(writer, keyframes, used);
            }
        }));
    }
    if has_recipe_rules(recipes) {
        layer_ranges.recipes = Some(cx.write_recipes_layer(&mut writer, recipes, &layers.recipes));
    }
    if !atoms.is_empty() {
        let sorted = cx.sort.sorted_atoms(atoms);
        let buckets = bucket_atoms_by_layer(&cx, sorted);
        if !buckets.default.is_empty() || !buckets.custom.is_empty() {
            layer_ranges.utilities = Some(write_layer(&mut writer, &layers.utilities, |writer| {
                cx.write_grouped_utilities(writer, &buckets.default);
                for (name, atoms) in &buckets.custom {
                    writer.layer(name, |writer| {
                        cx.write_grouped_utilities(writer, atoms);
                    });
                }
            }));
        }
    }
    EmitOutput {
        css: writer.finish(),
        layer_ranges,
    }
}

pub fn emit_theme_css(
    config: &UserConfig,
    dictionary: &TokenDictionary,
    theme_name: &str,
    minify: bool,
) -> Option<String> {
    let theme_root = config.theme_root_selector(theme_name)?;

    let theme_condition = theme_condition_name(theme_name);
    let vars = dictionary.css_vars_with_theme_filter(|condition| {
        theme_condition_segment(condition) == Some(theme_condition.as_str())
    });

    let mut base = Vec::new();
    let mut conditions = Vec::new();
    for group in &vars.conditions {
        let mut condition_paths = Vec::new();
        let mut has_theme = false;
        for segment in group.condition.split(':') {
            if segment == theme_condition.as_str() {
                has_theme = true;
                continue;
            }
            if segment.is_empty() || segment == "base" {
                continue;
            }
            condition_paths.push(resolved_condition_paths(config, segment)?);
        }
        if !has_theme {
            continue;
        }
        if condition_paths.is_empty() {
            base.extend_from_slice(&group.vars);
        } else {
            conditions.push(PreparedTokenCondition {
                vars: group.vars.as_slice(),
                conditions: condition_paths,
            });
        }
    }

    let prepared = PreparedTokenVars {
        base: base.as_slice(),
        conditions,
    };
    if prepared.base.is_empty() && prepared.conditions.is_empty() {
        return None;
    }
    let mut writer = CssWriter::new(minify, 512);
    EmitContext::serialize_token_vars_with_root(&mut writer, &prepared, &theme_root);
    Some(trim_final_newline(writer.finish()))
}

fn trim_final_newline(mut css: String) -> String {
    while css.ends_with('\n') {
        css.pop();
    }
    css
}

fn prepare_emittable_token_vars<'a>(
    config: &UserConfig,
    dictionary: &'a TokenDictionary,
    usage: Option<&UsageMarks>,
) -> TokenCssVars<'a> {
    let theme_filter = static_theme_condition_filter(config);
    let vars = dictionary.css_vars_with_theme_filter(|condition| {
        theme_filter
            .as_ref()
            .is_some_and(|filter| filter.includes(condition))
    });

    if config.optimize.remove_unused_tokens {
        let used = usage
            .map(|usage| collect_used_token_vars(&vars, &usage.token_vars))
            .unwrap_or_default();
        filter_token_vars(&vars, &used)
    } else {
        vars
    }
}

/// Per-recipe CSS for split output: groups the recipe layer's base + variant
/// groups by recipe name (first-seen order) and re-emits each as its own
/// `@layer recipes { … }` block. Returns `(recipe_name, css)`.
#[must_use]
pub fn emit_recipe_split<'a>(
    config: &'a UserConfig,
    utility: &'a Utility,
    recipes: &'a EncodedRecipesSnapshot,
    minify: bool,
) -> Vec<(String, String)> {
    let cx = EmitContext::new(config, utility);
    let recipes_layer = &config.layers.recipes;
    let mut grouped: indexmap::IndexMap<&str, SplitRecipeGroups<'_>> = indexmap::IndexMap::new();
    for group in &recipes.base {
        grouped
            .entry(group.recipe.as_ref())
            .or_default()
            .base
            .push(group);
    }
    for group in &recipes.variants {
        grouped
            .entry(group.recipe.as_ref())
            .or_default()
            .variants
            .push(group);
    }
    grouped
        .into_iter()
        .map(|(name, groups)| {
            let mut writer = CssWriter::new(minify, 256);
            cx.write_recipe_group_refs(&mut writer, recipes_layer, &groups.base, &groups.variants);
            (name.to_owned(), writer.finish())
        })
        .collect()
}

#[derive(Default)]
struct SplitRecipeGroups<'a> {
    base: Vec<&'a RecipeStyleGroupSnapshot>,
    variants: Vec<&'a RecipeStyleGroupSnapshot>,
}

/// `IndexMap` keeps custom-layer emit order deterministic (first-seen).
struct LayeredAtoms<'a> {
    default: Vec<crate::sort::SortedAtom<'a>>,
    custom: indexmap::IndexMap<&'a str, Vec<crate::sort::SortedAtom<'a>>>,
}

fn bucket_atoms_by_layer<'a>(
    cx: &EmitContext<'a>,
    sorted: Vec<crate::sort::SortedAtom<'a>>,
) -> LayeredAtoms<'a> {
    let mut buckets = LayeredAtoms {
        default: Vec::new(),
        custom: indexmap::IndexMap::default(),
    };
    for atom in sorted {
        match cx.utility.layer(atom.atom.prop()) {
            None => buckets.default.push(atom),
            Some(name) => buckets.custom.entry(name).or_default().push(atom),
        }
    }
    buckets
}

fn write_layer(
    writer: &mut CssWriter,
    name: &str,
    write: impl FnOnce(&mut CssWriter),
) -> Range<usize> {
    let start = writer.len();
    writer.layer(name, write);
    let end = writer.len();
    start..end
}

/// Writes the `@layer …;` order declaration using the user-configured names
/// from `CascadeLayers::ordered()` — single source of truth for the order.
fn write_layer_order(writer: &mut CssWriter, layers: &pandacss_config::CascadeLayers) {
    writer.write_str("@layer ");
    for (index, (_, name)) in layers.ordered().into_iter().enumerate() {
        if index > 0 {
            writer.write_str(", ");
        }
        writer.write_str(name);
    }
    writer.write_str(";");
}

fn as_non_empty_object(value: &Value) -> Option<&serde_json::Map<String, Value>> {
    let Value::Object(entries) = value else {
        return None;
    };
    (!entries.is_empty()).then_some(entries)
}

/// Emits `@keyframes name { selector { declarations } ... }` for each entry.
/// Purpose-built walker — the body is flat `(selector -> declarations)`, no
/// condition resolution, nested rules, or shorthand expansion, so we skip the
/// `serialize_styles` machinery and write a primitive-only declaration loop.
fn serialize_keyframes(
    writer: &mut CssWriter,
    keyframes: &serde_json::Map<String, Value>,
    used: Option<&FxHashSet<String>>,
) {
    for (name, body) in keyframes {
        if used.is_some_and(|used| !used.contains(name)) {
            continue;
        }
        let Some(selectors) = as_non_empty_object(body) else {
            continue;
        };
        writer.at_rule_named("@keyframes ", name, |writer| {
            for (selector, declarations) in selectors {
                write_keyframe_selector(writer, selector, declarations);
            }
        });
    }
}

fn has_used_keyframes(
    keyframes: &serde_json::Map<String, Value>,
    used: &FxHashSet<String>,
) -> bool {
    keyframes.keys().any(|name| used.contains(name))
}

fn filter_token_vars<'a>(vars: &TokenCssVars<'a>, used: &FxHashSet<String>) -> TokenCssVars<'a> {
    TokenCssVars {
        base: filter_token_var_slice(&vars.base, used),
        conditions: vars
            .conditions
            .iter()
            .filter_map(|group| {
                let vars = filter_token_var_slice(&group.vars, used);
                (!vars.is_empty()).then_some(TokenCssConditionVars {
                    condition: group.condition,
                    vars,
                })
            })
            .collect(),
    }
}

enum ThemeConditionFilter {
    All,
    Only(FxHashSet<String>),
}

impl ThemeConditionFilter {
    fn includes(&self, condition: &str) -> bool {
        match self {
            Self::All => true,
            Self::Only(conditions) => theme_condition_segment(condition)
                .is_some_and(|condition| conditions.contains(condition)),
        }
    }
}

fn static_theme_condition_filter(config: &UserConfig) -> Option<ThemeConditionFilter> {
    let themes = config.static_css.get("themes")?.as_array()?;
    if themes.iter().any(|theme| theme.as_str() == Some("*")) {
        return Some(ThemeConditionFilter::All);
    }

    let configured = config
        .themes
        .keys()
        .map(|theme| (theme.as_str(), theme_condition_name(theme)))
        .collect::<Vec<_>>();
    let mut conditions = FxHashSet::default();
    for theme in themes.iter().filter_map(|theme| theme.as_str()) {
        if let Some((_, condition)) = configured.iter().find(|(name, _)| *name == theme) {
            conditions.insert(condition.clone());
        }
    }

    Some(ThemeConditionFilter::Only(conditions))
}

fn theme_condition_segment(condition: &str) -> Option<&str> {
    let segment = condition.split(':').next().unwrap_or(condition);
    segment.starts_with("_theme").then_some(segment)
}

fn filter_token_var_slice<'a>(
    vars: &[TokenCssVar<'a>],
    used: &FxHashSet<String>,
) -> Vec<TokenCssVar<'a>> {
    vars.iter()
        .copied()
        .filter(|var| used.contains(var.name))
        .collect()
}

fn collect_used_token_vars(
    vars: &TokenCssVars<'_>,
    initial: &FxHashSet<String>,
) -> FxHashSet<String> {
    let mut used = initial.clone();
    loop {
        let before = used.len();
        for var in token_var_iter(vars) {
            if used.contains(var.name) {
                collect_css_var_refs(var.value, &mut used);
            }
        }
        if used.len() == before {
            return used;
        }
    }
}

fn token_var_iter<'a>(vars: &'a TokenCssVars<'a>) -> impl Iterator<Item = TokenCssVar<'a>> + 'a {
    vars.base.iter().copied().chain(
        vars.conditions
            .iter()
            .flat_map(|group| group.vars.iter().copied()),
    )
}

/// Write one keyframe selector block (`0%` / `from` / `to` etc.). Skips
/// non-primitive leaves silently — matches v1's lenient stringify.
fn write_keyframe_selector(writer: &mut CssWriter, selector: &str, declarations: &Value) {
    let Some(declarations) = as_non_empty_object(declarations) else {
        return;
    };
    writer.rule(selector, |writer| {
        for (prop, value) in declarations {
            let Some(rendered) = render_declaration_value(prop, value) else {
                continue;
            };
            let (value, important) = split_important(&rendered);
            writer.declaration(&hyphenate_property(prop), value.as_ref(), important);
        }
    });
}

/// Emit `@font-face` blocks from `globalFontface`
/// (`{ family: FontfaceRule | FontfaceRule[] }`). `font-family` is written
/// first; an array value produces one block per rule (e.g. per weight).
fn serialize_global_fontface(writer: &mut CssWriter, value: &Value) {
    let Some(families) = as_non_empty_object(value) else {
        return;
    };
    for (family, rules) in families {
        for rule in at_rule_variants(rules) {
            let Value::Object(body) = rule else {
                continue;
            };
            writer.at_rule("@font-face", |writer| {
                writer.declaration("font-family", family, false);
                write_at_rule_descriptors(writer, body);
            });
        }
    }
}

/// Emit `@position-try` blocks from `globalPositionTry`. The name is
/// dashed-ident-normalized (`foo` -> `--foo`), matching v1.
fn serialize_global_position_try(writer: &mut CssWriter, value: &Value) {
    let Some(entries) = as_non_empty_object(value) else {
        return;
    };
    for (name, rules) in entries {
        let ident = if name.starts_with("--") {
            Cow::Borrowed(name.as_str())
        } else {
            Cow::Owned(format!("--{name}"))
        };
        for rule in at_rule_variants(rules) {
            let Value::Object(body) = rule else {
                continue;
            };
            writer.at_rule_named("@position-try ", &ident, |writer| {
                write_at_rule_descriptors(writer, body);
            });
        }
    }
}

/// A single rule object or an array of them, as one slice — the
/// `FontfaceRule | FontfaceRule[]` shape both globals share.
fn at_rule_variants(value: &Value) -> &[Value] {
    match value {
        Value::Array(items) => items.as_slice(),
        _ => std::slice::from_ref(value),
    }
}

/// Write a flat at-rule descriptor block (no nesting): hyphenated property,
/// rendered value. `false` and structural values are skipped.
fn write_at_rule_descriptors(writer: &mut CssWriter, body: &serde_json::Map<String, Value>) {
    for (prop, value) in body {
        if let Some(rendered) = render_descriptor_value(prop, value) {
            writer.declaration(&hyphenate_property(prop), &rendered, false);
        }
    }
}

/// Render an at-rule descriptor value. Scalars defer to
/// [`render_primitive_value`]; arrays join with `,` (matching v1's
/// `String(array)` for multi-source `src`).
fn render_descriptor_value(prop: &str, value: &Value) -> Option<String> {
    match value {
        Value::Array(items) => {
            let parts: Vec<String> = items
                .iter()
                .filter_map(|item| render_descriptor_value(prop, item))
                .collect();
            (!parts.is_empty()).then(|| parts.join(","))
        }
        _ => render_declaration_value(prop, value).map(Cow::into_owned),
    }
}

fn render_declaration_value<'a>(prop: &str, value: &'a Value) -> Option<Cow<'a, str>> {
    match value {
        Value::String(s) => Some(Cow::Borrowed(s.as_str())),
        Value::Number(n) => n
            .as_f64()
            .map(|f| Cow::Owned(numeric_value::format_number(prop, f))),
        Value::Bool(true) => Some(Cow::Borrowed("true")),
        Value::Bool(false) => Some(Cow::Borrowed("false")),
        Value::Null | Value::Object(_) | Value::Array(_) => None,
    }
}

fn has_recipe_rules(recipes: &EncodedRecipesSnapshot) -> bool {
    recipes
        .base
        .iter()
        .chain(&recipes.variants)
        .any(|group| !group.entries.is_empty())
}

fn has_base_layer(_config: &UserConfig) -> bool {
    // PORT NOTE: v1 `generateGlobalCss` always emits the Panda marker in base.
    true
}

/// PORT NOTE: mirrors `packages/generator/src/artifacts/css/global-css.ts`.
fn write_made_with_panda_marker(writer: &mut CssWriter) {
    writer.rule(":root", |writer| {
        writer.declaration("--made-with-panda", "'🐼'", false);
    });
}

fn capacity_hint(atoms: &[&Atom], recipes: &EncodedRecipesSnapshot) -> usize {
    let recipe_entries = recipes
        .base
        .iter()
        .chain(&recipes.variants)
        .map(|group| group.entries.len())
        .sum::<usize>();
    64 + atoms
        .len()
        .saturating_add(recipes.atomic.len())
        .saturating_mul(96)
        + recipe_entries.saturating_mul(64)
}

#[derive(Default)]
struct UsageMarks {
    token_vars: FxHashSet<String>,
    keyframes: FxHashSet<String>,
}

fn collect_css_var_refs(value: &str, refs: &mut FxHashSet<String>) {
    let mut rest = value;
    while let Some(start) = rest.find("var(") {
        let after_open = &rest[start + "var(".len()..];
        let Some(end) = find_matching_paren(after_open) else {
            return;
        };
        if let Some(name) = after_open[..end]
            .split_once(',')
            .map_or(after_open[..end].trim(), |(name, _)| name.trim())
            .strip_prefix("--")
        {
            refs.insert(format!("--{name}"));
        }
        rest = &after_open[end + 1..];
    }
}

fn collect_token_reference_vars(
    value: &str,
    token_dictionary: Option<&TokenDictionary>,
    refs: &mut FxHashSet<String>,
) {
    let Some(token_dictionary) = token_dictionary else {
        return;
    };
    collect_wrapped_token_reference_vars(value, token_dictionary, refs);
    collect_token_function_vars(value, token_dictionary, refs);
    collect_direct_token_reference_var(value, token_dictionary, refs);
}

fn collect_token_ref_vars(
    token_refs: &[String],
    token_dictionary: Option<&TokenDictionary>,
    refs: &mut FxHashSet<String>,
) {
    let Some(token_dictionary) = token_dictionary else {
        return;
    };
    for path in token_refs {
        collect_token_path_var(path, token_dictionary, refs);
    }
}

fn collect_wrapped_token_reference_vars(
    value: &str,
    token_dictionary: &TokenDictionary,
    refs: &mut FxHashSet<String>,
) {
    let mut rest = value;
    while let Some(start) = rest.find('{') {
        let after_open = &rest[start + 1..];
        let Some(end) = after_open.find('}') else {
            return;
        };
        collect_token_path_var(
            strip_token_modifier(after_open[..end].trim()),
            token_dictionary,
            refs,
        );
        rest = &after_open[end + 1..];
    }
}

fn collect_token_function_vars(
    value: &str,
    token_dictionary: &TokenDictionary,
    refs: &mut FxHashSet<String>,
) {
    let mut rest = value;
    while let Some(start) = rest.find("token(") {
        let after_open = &rest[start + "token(".len()..];
        let Some(end) = find_matching_paren(after_open) else {
            return;
        };
        let path = after_open[..end]
            .split_once(',')
            .map_or(after_open[..end].trim(), |(path, _)| path.trim());
        collect_token_path_var(strip_token_modifier(path), token_dictionary, refs);
        rest = &after_open[end + 1..];
    }
}

fn collect_direct_token_reference_var(
    value: &str,
    token_dictionary: &TokenDictionary,
    refs: &mut FxHashSet<String>,
) {
    let trimmed = value.trim();
    if trimmed
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'))
    {
        collect_token_path_var(strip_token_modifier(trimmed), token_dictionary, refs);
    }
}

fn strip_token_modifier(value: &str) -> &str {
    value
        .split_once('/')
        .map_or(value, |(base, _)| base.trim_end())
}

fn collect_token_path_var(
    path: &str,
    token_dictionary: &TokenDictionary,
    refs: &mut FxHashSet<String>,
) {
    if let Some(name) = token_dictionary
        .get_var_str(path, None)
        .and_then(raw_css_var_name)
    {
        refs.insert(name.to_owned());
    }
}

fn collect_value_token_refs(
    value: &Value,
    token_dictionary: Option<&TokenDictionary>,
    refs: &mut FxHashSet<String>,
) {
    match value {
        Value::String(value) => {
            collect_css_var_refs(value, refs);
            collect_token_reference_vars(value, token_dictionary, refs);
        }
        Value::Object(entries) => {
            for value in entries.values() {
                collect_value_token_refs(value, token_dictionary, refs);
            }
        }
        Value::Array(items) => {
            for value in items {
                collect_value_token_refs(value, token_dictionary, refs);
            }
        }
        Value::Null | Value::Bool(_) | Value::Number(_) => {}
    }
}

fn collect_keyframe_refs(
    value: &str,
    keyframes: Option<&serde_json::Map<String, Value>>,
    refs: &mut FxHashSet<String>,
) {
    let Some(keyframes) = keyframes else {
        return;
    };
    for candidate in value
        .split(|ch: char| ch.is_ascii_whitespace() || ch == ',')
        .map(|part| part.trim_matches(|ch| matches!(ch, '"' | '\'')))
        .filter(|part| !part.is_empty())
    {
        if keyframes.contains_key(candidate) {
            refs.insert(candidate.to_owned());
        }
    }
}

fn is_animation_property(prop: &str) -> bool {
    matches!(prop, "animation" | "animation-name")
}

fn raw_css_var_name(value: &str) -> Option<&str> {
    let inner = value.trim().strip_prefix("var(")?.strip_suffix(')')?.trim();
    let name = inner.split_once(',').map_or(inner, |(name, _)| name).trim();
    name.starts_with("--").then_some(name)
}

fn find_matching_paren(value: &str) -> Option<usize> {
    let mut depth = 0u32;
    for (index, ch) in value.char_indices() {
        match ch {
            '(' => depth += 1,
            ')' if depth == 0 => return Some(index),
            ')' => depth -= 1,
            _ => {}
        }
    }
    None
}

struct EmitContext<'a> {
    config: &'a UserConfig,
    conditions: ConditionSet,
    breakpoints: Vec<String>,
    sort: SortContext<'a>,
    utility: &'a Utility,
}

impl<'a> EmitContext<'a> {
    fn new(config: &'a UserConfig, utility: &'a Utility) -> Self {
        let condition_names = config.condition_names();
        Self {
            config,
            conditions: ConditionSet::from_names(condition_names.iter().map(String::as_str)),
            breakpoints: config.theme.breakpoint_names(),
            sort: SortContext::new(config),
            utility,
        }
    }

    fn collect_usage(
        &self,
        token_dictionary: Option<&TokenDictionary>,
        token_refs: &[String],
        atoms: &[&Atom],
        recipes: &EncodedRecipesSnapshot,
        keyframes: Option<&serde_json::Map<String, Value>>,
    ) -> UsageMarks {
        let mut marks = UsageMarks::default();
        collect_token_ref_vars(token_refs, token_dictionary, &mut marks.token_vars);
        self.collect_styles_usage(
            &self.config.global_css,
            token_dictionary,
            keyframes,
            &mut marks,
        );
        self.collect_global_vars_usage(token_dictionary, &mut marks);

        for atom in atoms {
            self.collect_atom_usage(atom, token_dictionary, keyframes, &mut marks);
        }

        for group in recipes.base.iter().chain(&recipes.variants) {
            for entry in &group.entries {
                let Some(declarations) = self.recipe_entry_declarations(entry) else {
                    continue;
                };
                Self::collect_declarations_usage(
                    &declarations,
                    token_dictionary,
                    keyframes,
                    &mut marks,
                );
            }
        }

        marks
    }

    fn collect_atom_usage(
        &self,
        atom: &Atom,
        token_dictionary: Option<&TokenDictionary>,
        keyframes: Option<&serde_json::Map<String, Value>>,
        marks: &mut UsageMarks,
    ) {
        let raw = atom_value_to_string(atom.value());
        let Some(raw) = raw.as_deref() else {
            return;
        };
        let result = self.transform_atom(atom.prop(), raw);
        if is_composition_prop(atom.prop()) {
            if let Some(styles) = composition_style_object(atom.prop(), &result.styles) {
                self.collect_grouped_style_usage(
                    styles,
                    atom.important(),
                    token_dictionary,
                    keyframes,
                    marks,
                );
            }
            return;
        }
        Self::collect_literal_usage(&result.styles, token_dictionary, keyframes, marks);
    }

    fn collect_literal_usage(
        styles: &Literal,
        token_dictionary: Option<&TokenDictionary>,
        keyframes: Option<&serde_json::Map<String, Value>>,
        marks: &mut UsageMarks,
    ) {
        let Literal::Object(entries) = styles else {
            return;
        };
        for (prop, value) in entries {
            if let Some(value) = literal_to_css(prop, value, None) {
                Self::collect_declaration_usage(
                    &hyphenate_property(prop),
                    value.as_ref(),
                    token_dictionary,
                    keyframes,
                    marks,
                );
            }
        }
    }

    fn collect_styles_usage(
        &self,
        value: &Value,
        token_dictionary: Option<&TokenDictionary>,
        keyframes: Option<&serde_json::Map<String, Value>>,
        marks: &mut UsageMarks,
    ) {
        let Value::Object(entries) = value else {
            return;
        };
        for (key, value) in entries {
            if let Value::Object(_) = value {
                if resolved_condition_paths(self.config, key).is_some()
                    || is_nested_selector_key(key)
                {
                    self.collect_styles_usage(value, token_dictionary, keyframes, marks);
                    continue;
                }

                let mut declarations = Vec::new();
                let mut conditional_declarations = Vec::new();
                if self.collect_conditional_declarations(
                    key,
                    value,
                    &mut declarations,
                    &mut conditional_declarations,
                ) {
                    Self::collect_declarations_usage(
                        &declarations,
                        token_dictionary,
                        keyframes,
                        marks,
                    );
                    for conditional in conditional_declarations {
                        Self::collect_declarations_usage(
                            &conditional.declarations,
                            token_dictionary,
                            keyframes,
                            marks,
                        );
                    }
                    continue;
                }
            }

            if let Some(declarations) = self.serialized_property_declarations(key, value) {
                Self::collect_declarations_usage(&declarations, token_dictionary, keyframes, marks);
            } else {
                collect_value_token_refs(value, token_dictionary, &mut marks.token_vars);
            }
        }
    }

    fn collect_global_vars_usage(
        &self,
        token_dictionary: Option<&TokenDictionary>,
        marks: &mut UsageMarks,
    ) {
        let Value::Object(entries) = &self.config.global_vars else {
            return;
        };
        for value in entries.values() {
            if let Value::String(value) = value {
                collect_css_var_refs(value, &mut marks.token_vars);
                collect_token_reference_vars(value, token_dictionary, &mut marks.token_vars);
            }
        }
    }

    fn collect_declarations_usage(
        declarations: &[Declaration],
        token_dictionary: Option<&TokenDictionary>,
        keyframes: Option<&serde_json::Map<String, Value>>,
        marks: &mut UsageMarks,
    ) {
        for declaration in declarations {
            Self::collect_declaration_usage(
                &declaration.prop,
                &declaration.value,
                token_dictionary,
                keyframes,
                marks,
            );
        }
    }

    fn collect_declaration_usage(
        prop: &str,
        value: &str,
        token_dictionary: Option<&TokenDictionary>,
        keyframes: Option<&serde_json::Map<String, Value>>,
        marks: &mut UsageMarks,
    ) {
        collect_css_var_refs(value, &mut marks.token_vars);
        collect_token_reference_vars(value, token_dictionary, &mut marks.token_vars);
        if is_animation_property(prop) {
            collect_keyframe_refs(value, keyframes, &mut marks.keyframes);
        }
    }

    fn collect_grouped_style_usage(
        &self,
        styles: &Literal,
        important: bool,
        token_dictionary: Option<&TokenDictionary>,
        keyframes: Option<&serde_json::Map<String, Value>>,
        marks: &mut UsageMarks,
    ) {
        for entry in self.style_object_entries(styles) {
            let Some(declarations) = self.style_entry_declarations(&entry, important) else {
                continue;
            };
            Self::collect_declarations_usage(&declarations, token_dictionary, keyframes, marks);
        }
    }

    fn write_grouped_utilities(&self, writer: &mut CssWriter, atoms: &[SortedAtom<'_>]) {
        let mut grouped = GroupNode::default();
        for atom in atoms {
            self.collect_atom_rules(
                atom.atom,
                &atom.class_conditions,
                &atom.rule_conditions,
                &mut grouped,
            );
        }
        if !grouped.is_empty() {
            write_grouped_rules(writer, &grouped);
        }
    }

    fn collect_atom_rules(
        &self,
        atom: &Atom,
        class_conditions: &[&str],
        rule_conditions: &[&str],
        grouped: &mut GroupNode,
    ) {
        let raw = atom_value_to_string(atom.value());
        let Some(raw) = raw.as_deref() else {
            return;
        };
        let result = self.transform_atom(atom.prop(), raw);
        if self.collect_composition_atom_rules(
            atom,
            class_conditions,
            rule_conditions,
            &result,
            grouped,
        ) {
            return;
        }
        let numeric_hint = atom_numeric_hint(atom.value());
        for rule in self.lower_target(
            Target::Class {
                name: &result.class_name,
                conditions: class_conditions,
                important: atom.important(),
            },
            rule_conditions,
        ) {
            let Some(declarations) =
                Self::declarations_from_literal(&result.styles, atom.important(), numeric_hint)
            else {
                continue;
            };
            push_grouped_rule(grouped, &rule, declarations);
        }
    }

    fn collect_composition_atom_rules(
        &self,
        atom: &Atom,
        class_conditions: &[&str],
        rule_conditions: &[&str],
        result: &UtilityTransformResult,
        grouped: &mut GroupNode,
    ) -> bool {
        if !is_composition_prop(atom.prop()) {
            return false;
        }

        let Some(styles) = composition_style_object(atom.prop(), &result.styles) else {
            return true;
        };

        let entries = self.style_object_entries(styles);
        if entries.is_empty() {
            return true;
        }

        let base_rules = self.lower_target(
            Target::Class {
                name: &result.class_name,
                conditions: class_conditions,
                important: atom.important(),
            },
            rule_conditions,
        );
        self.collect_style_entries_for_rules(grouped, &entries, &base_rules, atom.important());
        true
    }

    fn collect_style_entries_for_rules(
        &self,
        grouped: &mut GroupNode,
        entries: &[RecipeStyleEntry],
        base_rules: &[LoweredTarget],
        important: bool,
    ) {
        // Sorted recipe entries often lower to the same selector + wrapper
        // target; keep that block pending so declarations coalesce in order.
        let mut pending: Option<StyleRule> = None;
        for entry in self.sort.sorted_recipe_entries(entries) {
            let Some(declarations) = self.style_entry_declarations(entry.entry, important) else {
                continue;
            };
            if declarations.is_empty() {
                continue;
            }

            for base_rule in base_rules {
                for rule in lower_target_conditions(self.config, base_rule, &entry.conditions) {
                    push_pending_rule(&mut pending, rule, declarations.clone(), |previous| {
                        push_grouped_rule(grouped, &previous.target, previous.declarations);
                    });
                }
            }
        }

        flush_pending_rule(pending, |pending| {
            push_grouped_rule(grouped, &pending.target, pending.declarations);
        });
    }

    fn declarations_from_literal(
        styles: &Literal,
        important: bool,
        numeric_hint: Option<&str>,
    ) -> Option<Vec<Declaration>> {
        let Literal::Object(entries) = styles else {
            return None;
        };
        let mut declarations = Vec::with_capacity(entries.len());
        for (prop, value) in entries {
            if let Some(value) = literal_to_css(prop, value, numeric_hint) {
                let (value, value_important) = split_important(&value);
                append_declaration(
                    &mut declarations,
                    Declaration {
                        prop: hyphenate_property(prop),
                        value: value.into_owned(),
                        important: important || value_important,
                    },
                );
            }
        }
        Some(declarations)
    }

    fn write_collected_styles(&self, writer: &mut CssWriter, value: &Value) {
        let mut grouped = GroupNode::default();
        self.collect_styles(&mut grouped, value);
        if !grouped.is_empty() {
            write_grouped_rules(writer, &grouped);
        }
    }

    fn collect_styles(&self, grouped: &mut GroupNode, value: &Value) {
        let Value::Object(entries) = value else {
            return;
        };
        let mut conditions = Vec::new();
        for (selector, styles) in entries {
            if let Some(condition) = resolved_condition_paths(self.config, selector) {
                self.collect_scope(grouped, styles, &mut conditions, condition);
            } else {
                self.collect_style_object(grouped, selector, styles, &mut conditions);
            }
        }
    }

    fn collect_scope(
        &self,
        grouped: &mut GroupNode,
        value: &Value,
        conditions: &mut Vec<ConditionPaths>,
        condition: ConditionPaths,
    ) {
        let Value::Object(entries) = value else {
            return;
        };

        conditions.push(condition);
        for (selector, styles) in entries {
            if let Some(condition) = resolved_condition_paths(self.config, selector) {
                self.collect_scope(grouped, styles, conditions, condition);
            } else {
                self.collect_style_object(grouped, selector, styles, conditions);
            }
        }
        conditions.pop();
    }

    fn collect_style_object(
        &self,
        grouped: &mut GroupNode,
        selector: &str,
        value: &Value,
        conditions: &mut Vec<ConditionPaths>,
    ) {
        let Value::Object(entries) = value else {
            return;
        };

        // Walk one style object in three buckets: direct declarations, nested
        // selector/condition blocks, and property-level conditional values.
        let mut declarations = Vec::with_capacity(entries.len());
        let mut nested_rules = Vec::new();
        let mut conditional_declarations = Vec::new();
        for (key, value) in entries {
            if let Value::Object(_) = value {
                if let Some(condition) = resolved_condition_paths(self.config, key) {
                    nested_rules.push(NestedStyleRule {
                        selector: selector.to_owned(),
                        value,
                        condition: Some(condition),
                    });
                    continue;
                }
                if is_nested_selector_key(key) {
                    nested_rules.push(NestedStyleRule {
                        selector: nested_selector(selector, key),
                        value,
                        condition: None,
                    });
                    continue;
                }
                if self.collect_conditional_declarations(
                    key,
                    value,
                    &mut declarations,
                    &mut conditional_declarations,
                ) {
                    continue;
                }
            }

            if let Some(entry_declarations) = self.serialized_property_declarations(key, value) {
                append_declarations(&mut declarations, entry_declarations);
            }
        }

        if !declarations.is_empty() {
            for rule in self.lower_resolved_selector(selector, conditions) {
                push_grouped_rule(grouped, &rule, declarations.clone());
            }
        }

        for conditional in conditional_declarations {
            conditions.push(conditional.condition);
            for rule in self.lower_resolved_selector(selector, conditions) {
                push_grouped_rule(grouped, &rule, conditional.declarations.clone());
            }
            conditions.pop();
        }

        for nested in nested_rules {
            if let Some(condition) = nested.condition {
                conditions.push(condition);
                self.collect_style_object(grouped, &nested.selector, nested.value, conditions);
                conditions.pop();
            } else {
                self.collect_style_object(grouped, &nested.selector, nested.value, conditions);
            }
        }
    }

    fn collect_conditional_declarations(
        &self,
        prop: &str,
        value: &Value,
        declarations: &mut Vec<Declaration>,
        conditional_declarations: &mut Vec<ConditionalDeclarations>,
    ) -> bool {
        let Value::Object(entries) = value else {
            return false;
        };

        let mut base_declarations = Vec::with_capacity(entries.len());
        let mut condition_declarations = Vec::new();
        for (condition, value) in entries {
            let condition = if condition == "base" {
                None
            } else {
                let Some(condition) = resolved_condition_paths(self.config, condition) else {
                    return false;
                };
                Some(condition)
            };
            let Some(entry_declarations) = self.serialized_property_declarations(prop, value)
            else {
                continue;
            };
            if entry_declarations.is_empty() {
                continue;
            }

            if let Some(condition) = condition {
                condition_declarations.push(ConditionalDeclarations {
                    condition,
                    declarations: entry_declarations,
                });
            } else {
                append_declarations(&mut base_declarations, entry_declarations);
            }
        }

        append_declarations(declarations, base_declarations);
        conditional_declarations.extend(condition_declarations);
        true
    }

    fn serialized_property_declarations(
        &self,
        prop: &str,
        value: &Value,
    ) -> Option<Vec<Declaration>> {
        let value = value_to_atom_value(value)?;
        self.property_declarations(prop, &value, false)
    }

    fn serialize_global_vars(&self, writer: &mut CssWriter) {
        let Value::Object(entries) = &self.config.global_vars else {
            return;
        };

        let mut declarations = Vec::new();
        let mut properties = Vec::new();
        for (key, value) in entries {
            match value {
                Value::String(value) => {
                    declarations.push(GlobalVarDeclaration { prop: key, value });
                }
                Value::Object(config) => {
                    if let Some(property) = global_var_property(key, config) {
                        properties.push(property);
                    }
                }
                Value::Null | Value::Bool(_) | Value::Number(_) | Value::Array(_) => {}
            }
        }

        if !declarations.is_empty() {
            writer.rule(self.config.css_var_root(), |writer| {
                for declaration in declarations {
                    writer.declaration(declaration.prop, declaration.value, false);
                }
            });
        }

        for property in properties {
            writer.at_rule_named("@property ", property.name, |writer| {
                writer.declaration("syntax", &format!("'{}'", property.syntax), false);
                writer.declaration("inherits", property.inherits, false);
                if let Some(initial_value) = property.initial_value {
                    writer.declaration("initial-value", initial_value, false);
                }
            });
        }
    }

    fn prepare_token_vars<'b>(&self, vars: &'b TokenCssVars<'b>) -> Option<PreparedTokenVars<'b>> {
        let conditions = vars
            .conditions
            .iter()
            .filter_map(|group| {
                self.resolve_token_condition(group.condition)
                    .map(|conditions| PreparedTokenCondition {
                        vars: group.vars.as_slice(),
                        conditions,
                    })
            })
            .collect::<Vec<_>>();

        (!vars.base.is_empty() || !conditions.is_empty()).then_some(PreparedTokenVars {
            base: vars.base.as_slice(),
            conditions,
        })
    }

    fn serialize_token_vars(&self, writer: &mut CssWriter, vars: &PreparedTokenVars<'_>) {
        Self::serialize_token_vars_with_root(writer, vars, self.config.css_var_root());
    }

    fn serialize_token_vars_with_root(
        writer: &mut CssWriter,
        vars: &PreparedTokenVars<'_>,
        root: &str,
    ) {
        if !vars.base.is_empty() {
            write_token_var_rule(writer, root, vars.base);
        }

        for group in &vars.conditions {
            for rule in lower_token_conditions(root, &group.conditions) {
                write_with_wrappers(writer, &rule.wrappers, |writer| {
                    write_token_var_rule(writer, &rule.selector, group.vars);
                });
            }
        }
    }

    /// Semantic token condition keys are produced by
    /// `pandacss_tokens::from_config::visit_semantic_values`, where nested
    /// conditions are joined with `:` (for example `_dark:md`).
    fn resolve_token_condition(&self, condition: &str) -> Option<Vec<ConditionPaths>> {
        let mut conditions = Vec::new();
        for segment in condition.split(':') {
            let segment = segment.trim();
            if segment.is_empty() || segment == "base" {
                return None;
            }
            conditions.push(resolved_condition_paths(self.config, segment)?);
        }
        (!conditions.is_empty()).then_some(conditions)
    }

    /// Emit one recipe class's rules. Entries are sorted then coalesced:
    /// consecutive entries that resolve to the same rule target (selector +
    /// wrappers) are merged into a single block rather than re-opening it.
    fn write_recipes_layer(
        &self,
        writer: &mut CssWriter,
        recipes: &EncodedRecipesSnapshot,
        recipes_layer: &str,
    ) -> Range<usize> {
        let start = writer.len();
        self.write_recipe_groups(writer, recipes_layer, &recipes.base, &recipes.variants);
        let end = writer.len();
        start..end
    }

    fn write_recipe_groups(
        &self,
        writer: &mut CssWriter,
        recipes_layer: &str,
        base: &[RecipeStyleGroupSnapshot],
        variants: &[RecipeStyleGroupSnapshot],
    ) {
        let base = base.iter().collect::<Vec<_>>();
        let variants = variants.iter().collect::<Vec<_>>();
        self.write_recipe_group_refs(writer, recipes_layer, &base, &variants);
    }

    fn write_recipe_group_refs(
        &self,
        writer: &mut CssWriter,
        recipes_layer: &str,
        base: &[&RecipeStyleGroupSnapshot],
        variants: &[&RecipeStyleGroupSnapshot],
    ) {
        let slot_layer = format!("{recipes_layer}.slots");
        if has_slot_recipe_groups(base) || has_slot_recipe_groups(variants) {
            writer.layer(&slot_layer, |writer| {
                write_recipe_base_groups(self, writer, base, true);
                write_recipe_variant_groups(self, writer, variants, true);
            });
        }
        if has_regular_recipe_groups(base) || has_regular_recipe_groups(variants) {
            writer.layer(recipes_layer, |writer| {
                write_recipe_base_groups(self, writer, base, false);
                write_recipe_variant_groups(self, writer, variants, false);
            });
        }
    }

    fn write_recipe_group(
        &self,
        writer: &mut CssWriter,
        class_name: &str,
        class_conditions: &[Box<str>],
        entries: &[RecipeStyleEntry],
    ) {
        let mut pending: Option<StyleRule> = None;
        let class_conditions = condition_names(class_conditions);
        // Class conditions preserve runtime class-name order; rule conditions
        // are separately sorted for cascade before selector lowering.
        let rule_conditions = self.sort.sorted_condition_refs(&class_conditions);
        let base_rules = self.lower_target(
            Target::Class {
                name: class_name,
                conditions: &class_conditions,
                important: false,
            },
            &rule_conditions,
        );

        for entry in self.sort.sorted_recipe_entries(entries) {
            let Some(declarations) = self.recipe_entry_declarations(entry.entry) else {
                continue;
            };
            if declarations.is_empty() {
                continue;
            }

            for base_rule in &base_rules {
                for rule in lower_target_conditions(self.config, base_rule, &entry.conditions) {
                    push_pending_rule(&mut pending, rule, declarations.clone(), |previous| {
                        write_rule(writer, &previous.target, &previous.declarations);
                    });
                }
            }
        }

        flush_pending_rule(pending, |pending| {
            write_rule(writer, &pending.target, &pending.declarations);
        });
    }

    fn recipe_entry_declarations(&self, entry: &RecipeStyleEntry) -> Option<Vec<Declaration>> {
        self.style_entry_declarations(entry, false)
    }

    fn style_entry_declarations(
        &self,
        entry: &RecipeStyleEntry,
        important: bool,
    ) -> Option<Vec<Declaration>> {
        self.property_declarations(
            entry.prop.as_ref(),
            &entry.value,
            important || entry.important,
        )
    }

    fn property_declarations(
        &self,
        prop: &str,
        value: &AtomValue,
        important: bool,
    ) -> Option<Vec<Declaration>> {
        let raw = atom_value_to_string(value);
        let raw = raw.as_deref()?;
        let result = self.transform_atom(prop, raw);
        let Literal::Object(entries) = &result.styles else {
            return None;
        };

        let mut declarations = Vec::with_capacity(entries.len());
        for (prop, literal) in entries {
            if let Some(value) = literal_to_css(prop, literal, atom_value_numeric_hint(value)) {
                let (value, value_important) = split_important(&value);
                append_declaration(
                    &mut declarations,
                    Declaration {
                        prop: hyphenate_property(prop),
                        value: value.into_owned(),
                        important: important || value_important,
                    },
                );
            }
        }
        Some(declarations)
    }

    fn transform_atom(&self, prop: &str, raw: &str) -> UtilityTransformResult {
        if self.utility.should_transform(prop) {
            return self.utility.transform_str(prop, raw);
        }
        default_transform(prop, raw)
    }

    fn lower_target(&self, target: Target<'_>, conditions: &[&str]) -> Vec<LoweredTarget> {
        // Build the base selector once, then apply condition wrappers/selectors
        // through the shared lowering path for atom and recipe rules.
        let selector = self.selector_for_target(target);
        lower_target_conditions(self.config, &LoweredTarget::new(selector), conditions)
    }

    fn lower_resolved_selector(
        &self,
        selector: &str,
        conditions: &[ConditionPaths],
    ) -> Vec<LoweredTarget> {
        let selector = self.selector_for_target(Target::Selector {
            selector: Cow::Borrowed(selector),
        });
        lower_selector_conditions(&selector, conditions)
    }

    fn selector_for_target(&self, target: Target<'_>) -> String {
        match target {
            Target::Class {
                name,
                conditions,
                important,
            } => {
                // The class name uses source-order conditions so it matches the
                // recipe/runtime output; sorting only affects the CSS rule.
                let mut finalized = if self.config.hash.class_name() {
                    let hashed = hash_class_name(self.config, name, conditions);
                    self.utility.format_class_name_owned(hashed)
                } else {
                    let class_name = self.utility.format_class_name(name);
                    finalized_class_name_owned(self.config, class_name, conditions)
                };
                if important {
                    finalized.push('!');
                }
                format!(".{}", escape_selector(&finalized))
            }
            Target::Selector { selector } => selector.into_owned(),
        }
    }

    /// Legacy's `transformStyles` hashes a style object, then decodes the group
    /// by calling `utility.transform` for every leaf. This is the Rust equivalent
    /// of the hashing half for grouped style objects.
    fn style_object_entries(&self, styles: &Literal) -> Vec<RecipeStyleEntry> {
        let normalizer = StyleNormalizer {
            utility: Some(self.utility),
            breakpoints: &self.breakpoints,
            shorthand: true,
        };
        let mut encoder = Encoder::with_conditions(self.conditions.clone());
        encoder.process_atomic_with(styles, &normalizer);
        encoder
            .into_atoms()
            .into_iter()
            .map(RecipeStyleEntry::from)
            .collect()
    }
}

struct NestedStyleRule<'a> {
    selector: String,
    value: &'a Value,
    condition: Option<ConditionPaths>,
}

struct ConditionalDeclarations {
    condition: ConditionPaths,
    declarations: Vec<Declaration>,
}

struct GlobalVarDeclaration<'a> {
    prop: &'a str,
    value: &'a str,
}

struct GlobalVarProperty<'a> {
    name: &'a str,
    syntax: &'a str,
    inherits: &'a str,
    initial_value: Option<&'a str>,
}

struct PreparedTokenVars<'a> {
    base: &'a [TokenCssVar<'a>],
    conditions: Vec<PreparedTokenCondition<'a>>,
}

struct PreparedTokenCondition<'a> {
    vars: &'a [TokenCssVar<'a>],
    conditions: Vec<ConditionPaths>,
}

fn dedup_atom_refs(atoms: Vec<&Atom>) -> Vec<&Atom> {
    let mut seen = FxHashSet::with_capacity_and_hasher(atoms.len(), FxBuildHasher);
    let mut deduped = Vec::with_capacity(atoms.len());
    for atom in atoms {
        if seen.insert(atom) {
            deduped.push(atom);
        }
    }
    deduped
}

fn is_slot_recipe_group(group: &RecipeStyleGroupSnapshot) -> bool {
    !group.slot.is_null()
}

fn has_slot_recipe_groups(groups: &[&RecipeStyleGroupSnapshot]) -> bool {
    groups.iter().any(|group| is_slot_recipe_group(group))
}

fn has_regular_recipe_groups(groups: &[&RecipeStyleGroupSnapshot]) -> bool {
    groups.iter().any(|group| !is_slot_recipe_group(group))
}

fn write_recipe_base_groups(
    cx: &EmitContext<'_>,
    writer: &mut CssWriter,
    groups: &[&RecipeStyleGroupSnapshot],
    slots: bool,
) {
    let groups = groups
        .iter()
        .copied()
        .filter(|group| is_slot_recipe_group(group) == slots)
        .collect::<Vec<_>>();
    if groups.is_empty() {
        return;
    }
    writer.layer("base", |writer| {
        for group in groups {
            cx.write_recipe_group(writer, &group.class_name, &group.conditions, &group.entries);
        }
    });
}

fn write_recipe_variant_groups(
    cx: &EmitContext<'_>,
    writer: &mut CssWriter,
    groups: &[&RecipeStyleGroupSnapshot],
    slots: bool,
) {
    for group in groups
        .iter()
        .copied()
        .filter(|group| is_slot_recipe_group(group) == slots)
    {
        cx.write_recipe_group(writer, &group.class_name, &group.conditions, &group.entries);
    }
}

fn write_token_var_rule(writer: &mut CssWriter, selector: &str, vars: &[TokenCssVar<'_>]) {
    writer.rule(selector, |writer| {
        for var in vars {
            writer.declaration(var.name, var.value, false);
        }
    });
}

fn is_composition_prop(prop: &str) -> bool {
    matches!(prop, "textStyle" | "layerStyle" | "animationStyle")
}

fn composition_style_object<'a>(prop: &str, styles: &'a Literal) -> Option<&'a Literal> {
    if !is_composition_prop(prop) {
        return None;
    }
    let Literal::Object(entries) = styles else {
        return None;
    };
    if matches!(entries.as_slice(), [(key, _)] if key == prop) {
        return None;
    }
    Some(styles)
}

fn default_transform(prop: &str, raw: &str) -> UtilityTransformResult {
    let class_name = format!("{}_{}", hyphenate_property(prop), without_space(raw));
    UtilityTransformResult {
        layer: None,
        class_name,
        styles: Literal::Object(vec![(prop.to_owned(), Literal::String(raw.to_owned()))]),
    }
}

fn atom_value_to_string(value: &AtomValue) -> Option<Cow<'_, str>> {
    match value {
        AtomValue::String(value) | AtomValue::Number(value) => Some(Cow::Borrowed(value)),
        AtomValue::Bool(true) => Some(Cow::Borrowed("true")),
        AtomValue::Bool(false) | AtomValue::Null => None,
    }
}

fn literal_to_css<'a>(
    prop: &str,
    value: &'a Literal,
    numeric_hint: Option<&str>,
) -> Option<Cow<'a, str>> {
    match value {
        Literal::String(value) => {
            if numeric_hint == Some(value.as_str()) {
                Some(Cow::Owned(numeric_value::format_number_str(prop, value)))
            } else {
                Some(Cow::Borrowed(value))
            }
        }
        Literal::Number(value) => Some(Cow::Owned(numeric_value::format_number(prop, *value))),
        Literal::Bool(true) => Some(Cow::Borrowed("true")),
        Literal::Bool(false) | Literal::Null | Literal::Object(_) | Literal::Conditional(_) => None,
        Literal::Array(items) => {
            let values: Vec<_> = items
                .iter()
                .filter_map(|item| literal_to_css(prop, item, None))
                .collect();
            (!values.is_empty()).then(|| Cow::Owned(join_css_values(&values)))
        }
    }
}

fn atom_numeric_hint(value: &AtomValue) -> Option<&str> {
    atom_value_numeric_hint(value)
}

fn atom_value_numeric_hint(value: &AtomValue) -> Option<&str> {
    match value {
        AtomValue::Number(value) => Some(value),
        _ => None,
    }
}

fn join_css_values(values: &[Cow<'_, str>]) -> String {
    let len =
        values.iter().map(|value| value.len()).sum::<usize>() + values.len().saturating_sub(1);
    let mut out = String::with_capacity(len);
    for (index, value) in values.iter().enumerate() {
        if index > 0 {
            out.push(' ');
        }
        out.push_str(value);
    }
    out
}

fn finalized_class_name_owned(
    config: &UserConfig,
    class_name: String,
    conditions: &[&str],
) -> String {
    if conditions.is_empty() {
        return class_name;
    }
    let capacity = conditions.iter().map(|c| c.len() + 3).sum::<usize>() + class_name.len();
    let mut out = String::with_capacity(capacity);
    for condition in conditions {
        if !out.is_empty() {
            out.push(':');
        }
        // Mirror the runtime `finalizeConditions` so the emitted selector matches
        // the class the runtime puts on the element: raw selectors / at-rules
        // (`&`, `@`) wrap in `[…]` (spaces→`_`); named conditions drop leading `_`.
        push_finalized_condition(config, &mut out, condition);
    }
    out.push(':');
    out.push_str(&class_name);
    out
}

fn hash_class_name(config: &UserConfig, class_name: &str, conditions: &[&str]) -> String {
    if conditions.is_empty() {
        return to_hash(class_name);
    }

    let capacity = conditions.iter().map(|c| c.len() + 3).sum::<usize>() + class_name.len();
    let mut input = String::with_capacity(capacity);
    for condition in conditions {
        if !input.is_empty() {
            input.push(':');
        }
        push_finalized_condition(config, &mut input, condition);
    }
    input.push(':');
    input.push_str(class_name);
    to_hash(&input)
}

fn push_finalized_condition(config: &UserConfig, out: &mut String, condition: &str) {
    if config.container_condition(condition).is_none()
        && (condition.contains('&') || condition.contains('@'))
    {
        out.push('[');
        out.push_str(&without_space(condition.trim()));
        out.push(']');
    } else {
        out.push_str(condition.trim_start_matches('_'));
    }
}

fn without_space(value: &str) -> String {
    value.replace(' ', "_")
}

/// Backslash-escape class-name tokens the same way the JS `esc` helper does.
/// Real selector suffixes (`:hover`, `>`, …) are appended elsewhere, not here.
fn escape_selector(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut chars = value.char_indices().peekable();
    while let Some((index, ch)) = chars.next() {
        if ch == '\0' {
            out.push('\u{FFFD}');
            continue;
        }
        if is_css_escape_codepoint(ch) {
            push_escaped_codepoint(&mut out, ch);
            continue;
        }
        if index == 0 {
            if ch.is_ascii_digit() {
                push_escaped_codepoint(&mut out, ch);
                continue;
            }
            if ch == '-' {
                if chars.peek().is_some_and(|(_, ch)| ch.is_ascii_digit()) {
                    out.push('-');
                    let (_, digit) = chars.next().expect("peeked leading digit");
                    push_escaped_codepoint(&mut out, digit);
                } else {
                    out.push('\\');
                    out.push('-');
                }
                continue;
            }
        }
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || !ch.is_ascii() {
            out.push(ch);
        } else {
            out.push('\\');
            out.push(ch);
        }
    }
    out
}

fn is_css_escape_codepoint(ch: char) -> bool {
    ch <= '\u{1F}' || ch == '\u{7F}'
}

fn push_escaped_codepoint(out: &mut String, ch: char) {
    write!(out, "\\{:x}", ch as u32).expect("writing to String cannot fail");
}

fn value_to_atom_value(value: &Value) -> Option<AtomValue> {
    match value {
        Value::String(value) => Some(AtomValue::String(value.clone().into_boxed_str())),
        Value::Number(value) => Some(AtomValue::Number(
            value
                .as_f64()
                .map_or_else(|| value.to_string(), number_to_js_string)
                .into_boxed_str(),
        )),
        Value::Bool(value) => Some(AtomValue::Bool(*value)),
        Value::Null => Some(AtomValue::Null),
        Value::Array(_) | Value::Object(_) => None,
    }
}

fn global_var_property<'a>(
    name: &'a str,
    config: &'a serde_json::Map<String, Value>,
) -> Option<GlobalVarProperty<'a>> {
    let syntax = config.get("syntax")?.as_str()?;
    let inherits = match config.get("inherits")? {
        Value::Bool(true) => "true",
        Value::Bool(false) => "false",
        Value::String(value) if value == "true" || value == "false" => value,
        _ => return None,
    };
    let initial_value = config.get("initialValue").and_then(Value::as_str);

    if syntax != "*" && initial_value.is_none() {
        return None;
    }

    Some(GlobalVarProperty {
        name,
        syntax,
        inherits,
        initial_value,
    })
}
