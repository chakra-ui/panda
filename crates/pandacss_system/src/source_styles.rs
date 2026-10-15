//! Semantic style boundaries shared by source inspection and file diagnostics.

use pandacss_encoder::ConditionMatcher;
use pandacss_extractor::{ExtractedCall, ExtractedJsx, MatchCategory};
use pandacss_literal::Literal;
use pandacss_shared::css_properties::is_css_property;
use rustc_hash::{FxHashMap, FxHashSet};
use smallvec::SmallVec;

use crate::System;

type Entries = [(String, Literal)];
type StylePath<'a> = SmallVec<[SourceStylePathSegment<'a>; 8]>;

/// A borrowed object key or an array index in an extracted style value.
#[derive(Clone, Copy)]
pub enum SourceStylePathSegment<'a> {
    /// An object key borrowed from the extracted value.
    Key(&'a str),
    /// An array index, formatted only when inspection needs an owned path.
    Index(usize),
}

impl std::fmt::Display for SourceStylePathSegment<'_> {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Key(key) => formatter.write_str(key),
            Self::Index(index) => index.fmt(formatter),
        }
    }
}

/// The interpretation of a source object's keys.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum SourceStyleKind {
    /// CSS properties, selectors, and conditions.
    Css,
    /// A style section inside an inline recipe.
    Recipe,
    /// Component props, including the nested `css` prop.
    Jsx,
    /// Inputs to a pattern transform.
    Pattern,
}

/// Visits style objects in a call, retaining their extraction paths.
/// Recipe selectors, factory options, and named-factory arguments are metadata.
pub fn visit_call_style_objects<'a>(
    call: &'a ExtractedCall,
    mut visit: impl FnMut(SourceStyleKind, &[SourceStylePathSegment<'a>], &'a Entries),
) {
    let object = |index| {
        call.data
            .get(index)
            .and_then(Option::as_ref)
            .and_then(entries)
    };
    let mut path = StylePath::new();
    match (call.category, call.name.as_str()) {
        (MatchCategory::Css, "css") => {
            for value in call.data.iter().flatten() {
                visit_style_objects(value, SourceStyleKind::Css, &mut path, &mut visit);
            }
        }
        (MatchCategory::Css, "cva" | "sva") => {
            if let Some(config) = object(0) {
                visit_recipe(config, call.name == "sva", &mut path, &mut visit);
            }
        }
        (MatchCategory::Css, "positionTry") => {
            if let Some(style) = object(0) {
                visit(SourceStyleKind::Css, &path, style);
            }
        }
        (MatchCategory::Css, "viewTransition" | "keyframes") => {
            if let Some(config) = object(0) {
                for (key, value) in config {
                    if call.name == "viewTransition"
                        && !matches!(key.as_str(), "group" | "imagePair" | "old" | "new")
                    {
                        continue;
                    }
                    if let Some(style) = entries(value) {
                        path.push(SourceStylePathSegment::Key(key));
                        visit(SourceStyleKind::Css, &path, style);
                        path.pop();
                    }
                }
            }
        }
        (MatchCategory::Jsx, _) => {
            let kind = call.jsx_factory_kind;
            if let Some(config) = object(kind.style_arg_index()) {
                if config.iter().any(|(key, _)| {
                    matches!(
                        key.as_str(),
                        "base" | "variants" | "defaultVariants" | "compoundVariants"
                    )
                }) {
                    visit_recipe(config, false, &mut path, &mut visit);
                } else {
                    visit(SourceStyleKind::Css, &path, config);
                }
            }
            if let Some(props) = object(kind.options_arg_index())
                .and_then(|options| field(options, "defaultProps"))
                .and_then(entries)
            {
                path.push(SourceStylePathSegment::Key("defaultProps"));
                visit(SourceStyleKind::Jsx, &path, props);
            }
        }
        (MatchCategory::Pattern, _) => {
            if let Some(props) = object(0) {
                visit(SourceStyleKind::Pattern, &path, props);
            }
        }
        _ => {}
    }
}

fn visit_style_objects<'a>(
    value: &'a Literal,
    kind: SourceStyleKind,
    path: &mut StylePath<'a>,
    visit: &mut impl FnMut(SourceStyleKind, &[SourceStylePathSegment<'a>], &'a Entries),
) {
    match value {
        Literal::Object(entries) => visit(kind, path, entries),
        Literal::Array(items) => {
            for (index, nested) in items.iter().enumerate() {
                path.push(SourceStylePathSegment::Index(index));
                visit_style_objects(nested, kind, path, visit);
                path.pop();
            }
        }
        Literal::Conditional(items) => {
            for nested in items {
                visit_style_objects(nested, kind, path, visit);
            }
        }
        _ => {}
    }
}

fn entries(value: &Literal) -> Option<&Entries> {
    match value {
        Literal::Object(entries) => Some(entries),
        _ => None,
    }
}

fn field<'a>(entries: &'a Entries, name: &str) -> Option<&'a Literal> {
    entries
        .iter()
        .find_map(|(key, value)| (key == name).then_some(value))
}

fn visit_recipe<'a>(
    config: &'a Entries,
    slotted: bool,
    path: &mut StylePath<'a>,
    visit: &mut impl FnMut(SourceStyleKind, &[SourceStylePathSegment<'a>], &'a Entries),
) {
    for (key, value) in config {
        path.push(SourceStylePathSegment::Key(key));
        match (key.as_str(), value) {
            ("base", _) => visit_recipe_style(value, slotted, path, visit),
            ("variants", Literal::Object(variants)) => {
                for (variant, options) in variants {
                    if let Literal::Object(options) = options {
                        path.push(SourceStylePathSegment::Key(variant));
                        for (option, style) in options {
                            path.push(SourceStylePathSegment::Key(option));
                            visit_recipe_style(style, slotted, path, visit);
                            path.pop();
                        }
                        path.pop();
                    }
                }
            }
            ("compoundVariants", Literal::Array(compounds)) => {
                for (index, compound) in compounds.iter().enumerate() {
                    if let Some(css) = entries(compound).and_then(|item| field(item, "css")) {
                        path.push(SourceStylePathSegment::Index(index));
                        path.push(SourceStylePathSegment::Key("css"));
                        visit_recipe_style(css, slotted, path, visit);
                        path.pop();
                        path.pop();
                    }
                }
            }
            _ => {}
        }
        path.pop();
    }
}

fn visit_recipe_style<'a>(
    value: &'a Literal,
    slotted: bool,
    path: &mut StylePath<'a>,
    visit: &mut impl FnMut(SourceStyleKind, &[SourceStylePathSegment<'a>], &'a Entries),
) {
    let Some(style) = entries(value) else { return };
    if slotted {
        for (slot, value) in style {
            if let Some(style) = entries(value) {
                path.push(SourceStylePathSegment::Key(slot));
                visit(SourceStyleKind::Recipe, path, style);
                path.pop();
            }
        }
    } else {
        visit(SourceStyleKind::Recipe, path, style);
    }
}

/// Visits authored string values in the semantic style sections of a call.
/// Builds need no source provenance; inspection joins the paths to verbose extraction.
pub fn visit_call_style_strings<'a>(
    system: &System,
    call: &'a ExtractedCall,
    mut visit: impl FnMut(&[SourceStylePathSegment<'a>], &str),
) {
    let variants = call
        .jsx_recipe_ident
        .as_deref()
        .and_then(|name| system.recipes.variant_props(name));
    let pattern_properties = system.patterns.property_styles(&call.name);
    visit_call_style_objects(call, |kind, path, style| {
        visit_object_strings(
            system,
            StringStyleScope {
                kind,
                variants: variants.as_slice(),
                pattern_properties,
            },
            style,
            &mut StylePath::from_slice(path),
            &mut visit,
        );
    });
}

/// Visits JSX style values while excluding ordinary props and recipe selectors.
pub fn visit_jsx_style_strings<'a>(
    system: &System,
    jsx: &'a ExtractedJsx,
    mut visit: impl FnMut(&[SourceStylePathSegment<'a>], &str),
) {
    let Some(style) = entries(&jsx.data) else {
        return;
    };
    let recipe_names = system.jsx_recipe_names(&jsx.name);
    let variants: SmallVec<[&FxHashSet<Box<str>>; 2]> = recipe_names
        .iter()
        .filter_map(|name| system.recipes.variant_props(name))
        .collect();
    let kind = if jsx.kind == pandacss_extractor::JsxKind::Pattern {
        SourceStyleKind::Pattern
    } else {
        SourceStyleKind::Jsx
    };
    visit_object_strings(
        system,
        StringStyleScope {
            kind,
            variants: &variants,
            pattern_properties: system.patterns.property_styles(&jsx.name),
        },
        style,
        &mut StylePath::new(),
        &mut visit,
    );
}

#[derive(Clone, Copy)]
struct StringStyleScope<'a> {
    kind: SourceStyleKind,
    variants: &'a [&'a FxHashSet<Box<str>>],
    pattern_properties: Option<&'a FxHashMap<String, bool>>,
}

impl StringStyleScope<'_> {
    fn accepts_property(self, system: &System, key: &str) -> bool {
        if !matches!(self.kind, SourceStyleKind::Jsx | SourceStyleKind::Pattern) {
            return true;
        }
        if self.kind == SourceStyleKind::Pattern
            && let Some(is_style) = self
                .pattern_properties
                .and_then(|properties| properties.get(key))
        {
            return *is_style;
        }
        key.starts_with("--")
            || is_css_property(key)
            || system
                .utility()
                .is_some_and(|utility| utility.is_known(key))
    }
}

fn visit_object_strings<'a>(
    system: &System,
    scope: StringStyleScope<'_>,
    style: &'a Entries,
    path: &mut StylePath<'a>,
    visit: &mut impl FnMut(&[SourceStylePathSegment<'a>], &str),
) {
    for (key, value) in style {
        if scope.kind == SourceStyleKind::Jsx
            && scope
                .variants
                .iter()
                .any(|variants| variants.contains(key.as_str()))
        {
            continue;
        }
        path.push(SourceStylePathSegment::Key(key));
        if matches!(scope.kind, SourceStyleKind::Jsx | SourceStyleKind::Pattern)
            && (key == "css" || key.ends_with("Css"))
        {
            visit_nested_style_strings(
                system,
                StringStyleScope {
                    kind: SourceStyleKind::Css,
                    ..scope
                },
                value,
                path,
                visit,
            );
        } else if system.conditions().is_condition(key)
            || key.starts_with(['&', '@'])
            || key.contains('&')
        {
            visit_nested_style_strings(system, scope, value, path, visit);
        } else if scope.accepts_property(system, key) {
            visit_literal_strings(value, path, visit);
        }
        path.pop();
    }
}

fn visit_nested_style_strings<'a>(
    system: &System,
    scope: StringStyleScope<'_>,
    value: &'a Literal,
    path: &mut StylePath<'a>,
    visit: &mut impl FnMut(&[SourceStylePathSegment<'a>], &str),
) {
    match value {
        Literal::Object(entries) => {
            visit_object_strings(system, scope, entries, path, visit);
        }
        Literal::Array(items) => {
            for (index, nested) in items.iter().enumerate() {
                path.push(SourceStylePathSegment::Index(index));
                visit_nested_style_strings(system, scope, nested, path, visit);
                path.pop();
            }
        }
        Literal::Conditional(items) => {
            for nested in items {
                visit_nested_style_strings(system, scope, nested, path, visit);
            }
        }
        _ => {}
    }
}

fn visit_literal_strings<'a>(
    value: &'a Literal,
    path: &mut StylePath<'a>,
    visit: &mut impl FnMut(&[SourceStylePathSegment<'a>], &str),
) {
    match value {
        Literal::String(text) => visit(path, text),
        Literal::Object(entries) => {
            for (key, nested) in entries {
                path.push(SourceStylePathSegment::Key(key));
                visit_literal_strings(nested, path, visit);
                path.pop();
            }
        }
        Literal::Array(items) => {
            for (index, nested) in items.iter().enumerate() {
                path.push(SourceStylePathSegment::Index(index));
                visit_literal_strings(nested, path, visit);
                path.pop();
            }
        }
        Literal::Conditional(items) => {
            for nested in items {
                visit_literal_strings(nested, path, visit);
            }
        }
        Literal::Token { .. } | Literal::Number(_) | Literal::Bool(_) | Literal::Null => {}
    }
}
