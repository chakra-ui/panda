use pandacss_encoder::{Atom, Encoder, compare_atoms_by_emit_order};
use pandacss_extractor::{ExtractedJsx, JsxKind};
use pandacss_literal::Literal;
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_utility::{ShorthandPolicy, StyleNormalizer};

use crate::{
    Config, PatternTransformFn, ProjectConditionMatcher, literal_entries, merge_style_entry,
    merge_style_props,
};

impl Config {
    fn process_atomic(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        style: &Literal,
        policy: ShorthandPolicy,
    ) {
        let _span = tracing::trace_span!(target: "encode", "encode_style").entered();
        let normalizer = StyleNormalizer::new(self.utility.as_ref(), &self.breakpoints, policy);
        encoder.process_atomic_with(style, &normalizer);
    }

    /// Normalizes inline `cva`/`sva` styles like `css()`, so a shorthand key
    /// reaches its canonical form before the (canonically-keyed) transform runs.
    pub(crate) fn process_recipe_atoms(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        recipe: &Recipe,
    ) {
        for style in recipe.atomic_styles() {
            self.process_style_props(encoder, style, ShorthandPolicy::UserFacing);
        }
    }

    /// Slot-recipe counterpart to [`Self::process_recipe_atoms`].
    pub(crate) fn process_slot_recipe_atoms(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        recipe: &SlotRecipe,
    ) {
        for (_slot, styles) in recipe.atomic_styles_per_slot() {
            for style in styles {
                self.process_style_props(encoder, style, ShorthandPolicy::UserFacing);
            }
        }
    }

    /// One `css()` arg. Here an array is a merge-list, not a responsive array,
    /// and a conditional could resolve to either branch — so recurse into both,
    /// treating each element/branch as its own arg. Only style objects reach
    /// `process_atomic`, which still expands value-level conditionals.
    pub(crate) fn process_css_arg(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        arg: &Literal,
    ) {
        match arg {
            Literal::Array(items) | Literal::Conditional(items) => {
                for item in items {
                    if !matches!(item, Literal::Null | Literal::Bool(false)) {
                        self.process_css_arg(encoder, item);
                    }
                }
            }
            _ => self.process_atomic(encoder, arg, ShorthandPolicy::UserFacing),
        }
    }

    /// Encode style leftovers from inline `styled` `defaultProps`.
    pub(crate) fn process_inline_default_prop_styles(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        default_props: &Literal,
        variant_keys: &[(String, Literal)],
    ) {
        if variant_keys.is_empty() {
            self.process_style_props(encoder, default_props, ShorthandPolicy::UserFacing);
            return;
        }
        let Some(entries) = literal_entries(default_props) else {
            self.process_style_props(encoder, default_props, ShorthandPolicy::UserFacing);
            return;
        };
        let leftovers: Vec<(String, Literal)> = entries
            .iter()
            .filter(|(key, _)| variant_keys.iter().all(|(variant, _)| variant != key))
            .cloned()
            .collect();
        if !leftovers.is_empty() {
            self.process_style_props(
                encoder,
                &Literal::Object(leftovers),
                ShorthandPolicy::UserFacing,
            );
        }
    }

    pub(crate) fn process_style_props(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        style: &Literal,
        policy: ShorthandPolicy,
    ) {
        let _span = tracing::trace_span!(target: "encode", "encode_props").entered();
        let Literal::Object(entries) = style else {
            self.process_atomic(encoder, style, policy);
            return;
        };

        let mut rest = Vec::with_capacity(entries.len());
        let mut css_layers = Vec::new();
        for (key, value) in entries {
            if key == "css" {
                collect_css_prop_layers(value, &mut css_layers);
            } else if is_css_prop(key) {
                // `inputCss` and friends address a slot, not this element.
                self.process_nested_css_prop(encoder, value, policy);
            } else {
                rest.push((key.clone(), value.clone()));
            }
        }

        // Mirrors `resolveStyleArgs` -> `mergeProps`: normalize, then merge with
        // the css prop last. Encoding the halves apart would emit a class for
        // each and leave the winner to the sheet's order.
        if css_layers
            .iter()
            .all(|layer| matches!(layer, Literal::Object(_)))
        {
            let normalizer = StyleNormalizer::new(self.utility.as_ref(), &self.breakpoints, policy);
            let base = normalizer.normalize(&Literal::Object(rest)).into_owned();
            let layers: Vec<Literal> = css_layers
                .iter()
                .map(|layer| normalizer.normalize(layer).into_owned())
                .collect();
            let mut objects = Vec::with_capacity(layers.len() + 1);
            objects.push(&base);
            objects.extend(layers.iter());
            let merged = merge_style_props(&objects);
            if !matches!(&merged, Literal::Object(entries) if entries.is_empty()) {
                self.process_atomic(encoder, &merged, policy);
            }
            return;
        }

        // A runtime branch can't merge into the base.
        for layer in &css_layers {
            self.process_atomic(encoder, layer, policy);
        }
        if !rest.is_empty() {
            self.process_atomic(encoder, &Literal::Object(rest), policy);
        }
    }

    pub(crate) fn process_nested_css_prop(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        value: &Literal,
        policy: ShorthandPolicy,
    ) {
        match value {
            Literal::Array(items) => {
                for item in items {
                    if !matches!(item, Literal::Null) {
                        self.process_atomic(encoder, item, policy);
                    }
                }
            }
            Literal::Null | Literal::Bool(false) => {}
            _ => self.process_atomic(encoder, value, policy),
        }
    }

    /// Encode one style object into atoms for build-time transforms without
    /// mutating project file state.
    pub fn encode_atomic_for_transform(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        style: &Literal,
        policy: ShorthandPolicy,
    ) {
        self.process_style_props(encoder, style, policy);
    }

    /// Resolve a config recipe call to the class string a static runtime call
    /// would return. Slot recipes, JS ternaries, and responsive variants return
    /// `None`.
    #[must_use]
    pub fn class_names_for_recipe_call(
        &self,
        recipe_name: &str,
        args: &[Option<Literal>],
    ) -> Option<Vec<String>> {
        let compiled = self;
        compiled.recipes.class_names_for_recipe_call(
            recipe_name,
            recipe_call_props(args)?,
            &compiled.conditions,
            &compiled.breakpoints,
        )
    }

    #[must_use]
    pub fn slot_recipe_slots(&self, recipe_name: &str) -> Option<&[String]> {
        self.recipes.slot_names(recipe_name)
    }

    /// Class names a static slot recipe call resolves to, per slot.
    #[must_use]
    pub fn class_names_for_slot_recipe_call(
        &self,
        recipe_name: &str,
        args: &[Option<Literal>],
    ) -> Option<Vec<(String, Vec<String>)>> {
        let compiled = self;
        compiled.recipes.class_names_for_slot_recipe_call(
            recipe_name,
            recipe_call_props(args)?,
            &compiled.conditions,
            &compiled.breakpoints,
        )
    }

    /// Resolves a pattern call to atomic class names. Pass `pattern_transform`
    /// when the pattern declares one; bails only if it's required but missing.
    #[must_use]
    pub fn class_names_for_pattern_call(
        &self,
        pattern_name: &str,
        args: &[Option<Literal>],
        pattern_transform: Option<&mut PatternTransformFn<'_>>,
    ) -> Option<Vec<String>> {
        let styles = self.style_literal_for_pattern_call(pattern_name, args, pattern_transform)?;
        self.class_names_for_style_literal(&styles)
    }

    /// Run a pattern call through its transform and return the style object it
    /// produces — the value `pattern.raw(…)` resolves to at runtime.
    #[must_use]
    pub fn style_literal_for_pattern_call(
        &self,
        pattern_name: &str,
        args: &[Option<Literal>],
        pattern_transform: Option<&mut PatternTransformFn<'_>>,
    ) -> Option<Literal> {
        let requires_transform = self.patterns.requires_transform(pattern_name);
        if requires_transform && pattern_transform.is_none() {
            return None;
        }
        let empty = Literal::Object(Vec::new());
        let arg = match args.first().and_then(|arg| arg.as_ref()) {
            None => &empty,
            Some(Literal::Object(_)) => args.first().and_then(|arg| arg.as_ref())?,
            Some(_) => return None,
        };
        let prepared = self.patterns.transform_input(pattern_name, arg);
        if let Some(transform) = pattern_transform {
            match transform(prepared.name, prepared.styles.as_ref()) {
                Ok(Some(style)) => Some(style),
                Ok(None) | Err(_) => None,
            }
        } else {
            Some(prepared.styles.into_owned())
        }
    }

    /// Resolve one encoded atom to the runtime `css()` class string.
    #[must_use]
    pub fn atomic_class_name_for_transform(&self, atom: &Atom) -> Option<String> {
        let utility = self.utility()?;
        let literal = atom_value_to_transform_literal(atom.value())?;
        pandacss_utility::runtime_class_name_for_atom(
            utility,
            &self.conditions,
            atom.prop(),
            atom.conditions(),
            &literal,
            atom.important(),
        )
    }

    /// Merge multi-argument `css.raw(a, b, …)` into the single object the
    /// runtime would build.
    ///
    /// Mirrors `mergeCss`: `resolve()` drops empty objects, then normalizes
    /// (shorthand keys, responsive arrays) only when two or more survive.
    /// A lone survivor is returned as authored.
    #[must_use]
    pub fn merged_style_literal(&self, args: &[Option<Literal>]) -> Option<Literal> {
        if args.len() < 2 {
            return None;
        }
        let mut contributing = Vec::with_capacity(args.len());
        for arg in args {
            let Some(style @ Literal::Object(entries)) = arg.as_ref() else {
                return None;
            };
            if !entries.is_empty() {
                contributing.push(style);
            }
        }
        if contributing.len() < 2 {
            return Some(
                contributing
                    .first()
                    .map_or_else(|| Literal::Object(Vec::new()), |style| (*style).clone()),
            );
        }

        let normalizer = StyleNormalizer::new(
            self.utility.as_ref(),
            &self.breakpoints,
            ShorthandPolicy::UserFacing,
        );
        let mut merged = Vec::new();
        for style in contributing {
            let Literal::Object(entries) = normalizer.normalize(style).into_owned() else {
                return None;
            };
            for (key, value) in entries {
                merge_style_entry(&mut merged, key, value);
            }
        }
        Some(Literal::Object(merged))
    }

    /// Resolve one static style object to atomic utility class names.
    #[must_use]
    pub fn class_names_for_style_literal(&self, style: &Literal) -> Option<Vec<String>> {
        let mut encoder = Encoder::with_conditions(self.conditions.clone());
        self.encode_atomic_for_transform(&mut encoder, style, ShorthandPolicy::UserFacing);
        let mut atoms: Vec<Atom> = encoder.into_atoms().into_iter().collect();
        if atoms.is_empty() {
            return None;
        }
        atoms.sort_by(compare_atoms_by_emit_order);
        let classes: Vec<String> = atoms
            .iter()
            .filter_map(|atom| self.atomic_class_name_for_transform(atom))
            .collect();
        if classes.is_empty() {
            None
        } else {
            Some(classes)
        }
    }

    /// Resolve a matched JSX element to the class strings a static runtime
    /// render would apply. Recipe JSX merges variant classes with leftover
    /// style props; pattern JSX applies `pattern_transform` when provided.
    #[must_use]
    pub fn class_names_for_jsx_usage(
        &self,
        jsx: &ExtractedJsx,
        pattern_transform: Option<&mut PatternTransformFn<'_>>,
    ) -> Option<Vec<String>> {
        let compiled = self;
        let data = &jsx.data;
        let entries = literal_entries(data)?;
        if entries.is_empty() {
            return None;
        }

        match jsx.kind {
            JsxKind::Recipe => {
                let recipe_names = compiled.recipes.find_by_jsx(&jsx.name);
                if recipe_names.is_empty() {
                    return None;
                }
                let recipe_names: Vec<&str> = recipe_names.into_iter().collect();
                let mut classes = Vec::new();
                for recipe_name in &recipe_names {
                    if let Some(recipe_classes) =
                        self.class_names_for_recipe_call(recipe_name, &[Some(data.clone())])
                    {
                        classes.extend(recipe_classes);
                    }
                }
                if let Some(style_props) = compiled
                    .recipes
                    .style_props_for_recipes(&recipe_names, data)
                    && let Some(atomic) = self.class_names_for_style_literal(&style_props)
                {
                    classes.extend(atomic);
                }
                (!classes.is_empty()).then_some(classes)
            }
            JsxKind::Pattern => {
                let requires_transform = compiled.patterns.requires_transform(&jsx.name);
                if requires_transform && pattern_transform.is_none() {
                    return None;
                }
                let prepared = compiled.patterns.transform_input(&jsx.name, data);
                let styles = if let Some(transform) = pattern_transform {
                    match transform(prepared.name, prepared.styles.as_ref()) {
                        Ok(Some(style)) => style,
                        Ok(None) | Err(_) => return None,
                    }
                } else {
                    prepared.styles.into_owned()
                };
                self.class_names_for_style_literal(&styles)
            }
            JsxKind::Factory | JsxKind::Component => self.class_names_for_style_literal(data),
        }
    }
}

fn is_css_prop(key: &str) -> bool {
    key == "css" || key.ends_with("Css")
}

/// The objects a `css` prop contributes, in application order.
fn collect_css_prop_layers(value: &Literal, out: &mut Vec<Literal>) {
    match value {
        Literal::Array(items) => {
            for item in items {
                collect_css_prop_layers(item, out);
            }
        }
        Literal::Null | Literal::Bool(false) => {}
        other => out.push(other.clone()),
    }
}

fn atom_value_to_transform_literal(value: &pandacss_encoder::AtomValue) -> Option<Literal> {
    Some(match value {
        pandacss_encoder::AtomValue::String(raw) => Literal::String(raw.to_string()),
        pandacss_encoder::AtomValue::Number(raw) => Literal::Number(raw.parse().ok()?),
        pandacss_encoder::AtomValue::Token { path, value, .. } => Literal::Token {
            path: path.to_string(),
            value: value.to_string(),
        },
        pandacss_encoder::AtomValue::Bool(value) => Literal::Bool(*value),
        pandacss_encoder::AtomValue::Null => Literal::Null,
    })
}

/// The variant props of a recipe call: its first object argument, or no props at all.
fn recipe_call_props(args: &[Option<Literal>]) -> Option<&Literal> {
    static EMPTY: Literal = Literal::Object(Vec::new());
    match args.first().and_then(Option::as_ref) {
        None => Some(&EMPTY),
        Some(arg @ Literal::Object(_)) => Some(arg),
        Some(_) => None,
    }
}
