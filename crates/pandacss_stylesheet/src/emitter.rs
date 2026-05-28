use std::{borrow::Cow, ops::Range};

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, AtomValue, EncodedRecipesSnapshot, RecipeStyleEntry};
use pandacss_extractor::Literal;
use pandacss_shared::{number_to_js_string, split_important};
use pandacss_tokens::{TokenCssVar, TokenCssVars, TokenDictionary};
use pandacss_utility::{Utility, UtilityTransformResult, hyphenate_property};
use serde_json::Value;

use crate::StylesheetLayerRanges;
use crate::sort::{SortContext, condition_raw_parts};
use crate::writer::CssWriter;

pub struct EmitOutput {
    pub css: String,
    pub layer_ranges: StylesheetLayerRanges,
}

pub fn emit<'a>(
    config: &'a UserConfig,
    utility: &'a Utility,
    token_dictionary: Option<&TokenDictionary>,
    mut atoms: Vec<&'a Atom>,
    recipes: &'a EncodedRecipesSnapshot,
    minify: bool,
) -> EmitOutput {
    let cx = EmitContext::new(config, utility);
    let layers = &config.layers;
    let mut writer = CssWriter::new(minify, capacity_hint(&atoms, recipes));
    let mut layer_ranges = StylesheetLayerRanges::default();
    write_layer_order(&mut writer, layers);
    writer.newline();
    if config.preflight.enabled() {
        layer_ranges.reset = Some(write_layer(&mut writer, &layers.reset, |writer| {
            crate::preflight::write(writer);
        }));
    }
    if has_base_layer(config) {
        layer_ranges.base = Some(write_layer(&mut writer, &layers.base, |writer| {
            cx.serialize_styles(writer, &config.global_css);
            cx.serialize_global_vars(writer);
        }));
    }
    let token_vars = token_dictionary.map(TokenDictionary::css_vars);
    let prepared_token_vars = token_vars.as_ref().and_then(|vars| cx.prepare_token_vars(vars));
    let keyframes = as_non_empty_object(&config.theme.keyframes);
    if prepared_token_vars.is_some() || keyframes.is_some() {
        layer_ranges.tokens = Some(write_layer(&mut writer, &layers.tokens, |writer| {
            if let Some(token_vars) = prepared_token_vars.as_ref() {
                cx.serialize_token_vars(writer, token_vars);
            }
            if let Some(keyframes) = keyframes {
                cx.serialize_keyframes(writer, keyframes);
            }
        }));
    }
    if has_recipe_rules(recipes) {
        layer_ranges.recipes = Some(write_layer(&mut writer, &layers.recipes, |writer| {
            for group in &recipes.base {
                cx.write_recipe_group(writer, &group.class_name, &group.entries);
            }
            for group in &recipes.variants {
                cx.write_recipe_group(writer, &group.class_name, &group.entries);
            }
        }));
    }
    if !atoms.is_empty() || !recipes.atomic.is_empty() {
        atoms.extend(recipes.atomic.iter());
        let sorted = cx.sort.sorted_atoms(atoms);
        let buckets = bucket_atoms_by_layer(&cx, sorted);
        if !buckets.default.is_empty() || !buckets.custom.is_empty() {
            layer_ranges.utilities = Some(write_layer(&mut writer, &layers.utilities, |writer| {
                for atom in &buckets.default {
                    cx.write_atom(writer, atom.atom, &atom.conditions);
                }
                for (name, atoms) in &buckets.custom {
                    writer.layer(name, |writer| {
                        for atom in atoms {
                            cx.write_atom(writer, atom.atom, &atom.conditions);
                        }
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

/// Write one keyframe selector block (`0%` / `from` / `to` etc.). Skips
/// non-primitive leaves silently — matches v1's lenient stringify.
fn write_keyframe_selector(writer: &mut CssWriter, selector: &str, declarations: &Value) {
    let Some(declarations) = as_non_empty_object(declarations) else {
        return;
    };
    writer.rule(selector, |writer| {
        for (prop, value) in declarations {
            let Some(rendered) = render_primitive_value(value) else {
                continue;
            };
            let (value, important) = split_important(&rendered);
            writer.declaration(&hyphenate_property(prop), value.as_ref(), important);
        }
    });
}

/// Render a JSON value as a CSS-safe string. `Cow::Borrowed` for strings
/// (the common case — no alloc), owned only for numbers. Returns `None`
/// for structural values that can't appear at a CSS leaf.
fn render_primitive_value(value: &Value) -> Option<Cow<'_, str>> {
    match value {
        Value::String(s) => Some(Cow::Borrowed(s.as_str())),
        Value::Number(n) => n.as_f64().map(|f| Cow::Owned(number_to_js_string(f))),
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

fn has_base_layer(config: &UserConfig) -> bool {
    as_non_empty_object(&config.global_css).is_some() || has_global_vars(&config.global_vars)
}

fn has_global_vars(value: &Value) -> bool {
    let Value::Object(entries) = value else {
        return false;
    };

    entries.iter().any(|(key, value)| match value {
        Value::String(_) => true,
        Value::Object(config) => global_var_property(key, config).is_some(),
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::Array(_) => false,
    })
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

struct EmitContext<'a> {
    config: &'a UserConfig,
    sort: SortContext<'a>,
    utility: &'a Utility,
}

impl<'a> EmitContext<'a> {
    fn new(config: &'a UserConfig, utility: &'a Utility) -> Self {
        Self {
            config,
            sort: SortContext::new(config),
            utility,
        }
    }

    fn write_atom(&self, writer: &mut CssWriter, atom: &Atom, conditions: &[&str]) {
        let raw = atom_value_to_string(atom.value());
        let Some(raw) = raw.as_deref() else {
            return;
        };
        let Some(result) = self.transform_atom(atom.prop(), raw) else {
            return;
        };
        let mut class_name = self.utility.format_class_name_owned(result.class_name);
        if atom.important() {
            class_name.push('!');
        }
        let rule = self.rule_target_owned(class_name, conditions);
        self.write_style_rule(writer, &rule, &result.styles);
    }

    fn serialize_styles(&self, writer: &mut CssWriter, value: &Value) {
        let Value::Object(entries) = value else {
            return;
        };
        let mut conditions = Vec::new();
        for (selector, styles) in entries {
            if let Some(condition) = resolved_condition_parts(self.config, selector) {
                self.serialize_scope(writer, styles, &mut conditions, condition);
            } else {
                self.serialize_style_object(writer, selector, styles, &mut conditions);
            }
        }
    }

    fn serialize_scope(
        &self,
        writer: &mut CssWriter,
        value: &Value,
        conditions: &mut Vec<ConditionParts>,
        condition: ConditionParts,
    ) {
        let Value::Object(entries) = value else {
            return;
        };

        conditions.push(condition);
        for (selector, styles) in entries {
            if let Some(condition) = resolved_condition_parts(self.config, selector) {
                self.serialize_scope(writer, styles, conditions, condition);
            } else {
                self.serialize_style_object(writer, selector, styles, conditions);
            }
        }
        conditions.pop();
    }

    fn serialize_style_object(
        &self,
        writer: &mut CssWriter,
        selector: &str,
        value: &Value,
        conditions: &mut Vec<ConditionParts>,
    ) {
        let Value::Object(entries) = value else {
            return;
        };

        let mut declarations = Vec::with_capacity(entries.len());
        let mut nested_rules = Vec::new();
        let mut conditional_declarations = Vec::new();
        for (key, value) in entries {
            if let Value::Object(_) = value {
                if let Some(condition) = resolved_condition_parts(self.config, key) {
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
                append_recipe_declarations(&mut declarations, entry_declarations);
            }
        }

        if !declarations.is_empty() {
            let rule = self.rule_target_with_base_parts(selector, conditions);
            self.write_recipe_rule(writer, &rule, &declarations);
        }

        for conditional in conditional_declarations {
            conditions.push(conditional.condition);
            let rule = self.rule_target_with_base_parts(selector, conditions);
            self.write_recipe_rule(writer, &rule, &conditional.declarations);
            conditions.pop();
        }

        for nested in nested_rules {
            if let Some(condition) = nested.condition {
                conditions.push(condition);
                self.serialize_style_object(writer, &nested.selector, nested.value, conditions);
                conditions.pop();
            } else {
                self.serialize_style_object(writer, &nested.selector, nested.value, conditions);
            }
        }
    }

    fn collect_conditional_declarations(
        &self,
        prop: &str,
        value: &Value,
        declarations: &mut Vec<RecipeDeclaration>,
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
                let Some(condition) = resolved_condition_parts(self.config, condition) else {
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
                append_recipe_declarations(&mut base_declarations, entry_declarations);
            }
        }

        append_recipe_declarations(declarations, base_declarations);
        conditional_declarations.extend(condition_declarations);
        true
    }

    fn serialized_property_declarations(
        &self,
        prop: &str,
        value: &Value,
    ) -> Option<Vec<RecipeDeclaration>> {
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
                    declarations.push(GlobalVarDeclaration { prop: key, value })
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
            writer.rule(css_var_root(self.config), |writer| {
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

    /// Emits `@keyframes name { selector { declarations } ... }` for each
    /// entry. Purpose-built walker — the body is flat
    /// `(selector -> declarations)`, no condition resolution, no nested
    /// rules, no shorthand expansion, so we skip the `serialize_styles`
    /// machinery and write a primitive-only declaration loop.
    fn serialize_keyframes(
        &self,
        writer: &mut CssWriter,
        keyframes: &serde_json::Map<String, Value>,
    ) {
        for (name, body) in keyframes {
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

    fn serialize_token_vars(&self, writer: &mut CssWriter, vars: &PreparedTokenVars<'_>) {
        let root = css_var_root(self.config);

        if !vars.base.is_empty() {
            write_token_var_rule(writer, root, vars.base);
        }

        for group in &vars.conditions {
            let rule = self.token_rule_target_with_base_parts(root, &group.conditions);
            write_with_wrappers(writer, &rule.wrappers, |writer| {
                write_token_var_rule(writer, &rule.selector, group.vars);
            });
        }
    }

    /// Semantic token condition keys are produced by
    /// `pandacss_tokens::from_config::visit_semantic_values`, where nested
    /// conditions are joined with `:` (for example `_dark:md`).
    fn resolve_token_condition(&self, condition: &str) -> Option<Vec<ConditionParts>> {
        let mut conditions = Vec::new();
        for segment in condition.split(':') {
            let segment = segment.trim();
            if segment.is_empty() || segment == "base" {
                return None;
            }
            conditions.push(resolved_condition_parts(self.config, segment)?);
        }
        (!conditions.is_empty()).then_some(conditions)
    }

    fn token_rule_target_with_base_parts(
        &self,
        base: &str,
        conditions: &[ConditionParts],
    ) -> RuleTarget {
        let mut selector = base.to_owned();
        let mut wrappers = Vec::new();
        for parts in conditions {
            for raw in parts {
                apply_token_raw_condition(base, &mut selector, &mut wrappers, raw);
            }
        }
        RuleTarget { selector, wrappers }
    }

    fn write_recipe_group(
        &self,
        writer: &mut CssWriter,
        class_name: &str,
        entries: &[RecipeStyleEntry],
    ) {
        let selector_base = format!(".{}", escape_selector(class_name));
        let mut pending: Option<PendingRecipeRule> = None;

        for entry in self.sort.sorted_recipe_entries(entries) {
            let rule = self.rule_target_with_base(&selector_base, &entry.conditions);
            let Some(declarations) = self.recipe_entry_declarations(entry.entry) else {
                continue;
            };
            if declarations.is_empty() {
                continue;
            }

            match &mut pending {
                Some(pending) if pending.rule == rule => {
                    append_recipe_declarations(&mut pending.declarations, declarations);
                }
                Some(_) => {
                    let previous = pending.take().expect("pending recipe rule");
                    self.write_recipe_rule(writer, &previous.rule, &previous.declarations);
                    pending = Some(PendingRecipeRule { rule, declarations });
                }
                None => {
                    pending = Some(PendingRecipeRule { rule, declarations });
                }
            }
        }

        if let Some(pending) = pending {
            self.write_recipe_rule(writer, &pending.rule, &pending.declarations);
        }
    }

    fn recipe_entry_declarations(
        &self,
        entry: &RecipeStyleEntry,
    ) -> Option<Vec<RecipeDeclaration>> {
        self.property_declarations(entry.prop.as_ref(), &entry.value, entry.important)
    }

    fn property_declarations(
        &self,
        prop: &str,
        value: &AtomValue,
        important: bool,
    ) -> Option<Vec<RecipeDeclaration>> {
        let raw = atom_value_to_string(value);
        let raw = raw.as_deref()?;
        let result = self.transform_atom(prop, raw)?;
        let Literal::Object(entries) = &result.styles else {
            return None;
        };

        let mut declarations = Vec::with_capacity(entries.len());
        for (prop, value) in entries {
            if let Some(value) = literal_to_css(value) {
                let (value, value_important) = split_important(&value);
                append_recipe_declaration(
                    &mut declarations,
                    RecipeDeclaration {
                        prop: hyphenate_property(prop),
                        value: value.into_owned(),
                        important: important || value_important,
                    },
                );
            }
        }
        Some(declarations)
    }

    fn write_recipe_rule(
        &self,
        writer: &mut CssWriter,
        rule: &RuleTarget,
        declarations: &[RecipeDeclaration],
    ) {
        write_with_wrappers(writer, &rule.wrappers, |writer| {
            writer.rule(&rule.selector, |writer| {
                for declaration in declarations {
                    writer.declaration(
                        &declaration.prop,
                        &declaration.value,
                        declaration.important,
                    );
                }
            });
        });
    }

    fn transform_atom(&self, prop: &str, raw: &str) -> Option<UtilityTransformResult> {
        if !self.utility.is_empty() {
            return Some(self.utility.transform_str(prop, raw));
        }
        Some(default_transform(prop, raw))
    }

    fn write_style_rule(&self, writer: &mut CssWriter, rule: &RuleTarget, styles: &Literal) {
        let Literal::Object(entries) = styles else {
            return;
        };
        write_with_wrappers(writer, &rule.wrappers, |writer| {
            writer.rule(&rule.selector, |writer| {
                for (prop, value) in entries {
                    if let Some(value) = literal_to_css(value) {
                        let (value, important) = split_important(&value);
                        writer.declaration(&hyphenate_property(prop), value.as_ref(), important);
                    }
                }
            });
        });
    }

    fn rule_target_with_base(&self, base: &str, conditions: &[&str]) -> RuleTarget {
        self.rule_target_with_base_owned(base.to_owned(), conditions)
    }

    fn rule_target_owned(&self, class_name: String, conditions: &[&str]) -> RuleTarget {
        let finalized = finalized_class_name_owned(class_name, conditions);
        let base = format!(".{}", escape_selector(&finalized));
        self.rule_target_with_base_owned(base, conditions)
    }

    fn rule_target_with_base_owned(&self, mut selector: String, conditions: &[&str]) -> RuleTarget {
        let mut wrappers = Vec::new();
        for condition in conditions {
            apply_condition(self.config, &mut selector, &mut wrappers, condition);
        }
        RuleTarget { selector, wrappers }
    }

    fn rule_target_with_base_parts(&self, base: &str, conditions: &[ConditionParts]) -> RuleTarget {
        let mut selector = base.to_owned();
        let mut wrappers = Vec::with_capacity(conditions.len());
        for parts in conditions {
            for raw in parts {
                apply_raw_condition(&mut selector, &mut wrappers, raw);
            }
        }
        RuleTarget { selector, wrappers }
    }
}

type ConditionParts = Vec<String>;

struct PendingRecipeRule {
    rule: RuleTarget,
    declarations: Vec<RecipeDeclaration>,
}

struct RecipeDeclaration {
    prop: String,
    value: String,
    important: bool,
}

struct NestedStyleRule<'a> {
    selector: String,
    value: &'a Value,
    condition: Option<ConditionParts>,
}

struct ConditionalDeclarations {
    condition: ConditionParts,
    declarations: Vec<RecipeDeclaration>,
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
    conditions: Vec<ConditionParts>,
}

#[derive(PartialEq, Eq)]
struct RuleTarget {
    selector: String,
    wrappers: Vec<String>,
}

fn append_recipe_declarations(
    target: &mut Vec<RecipeDeclaration>,
    declarations: Vec<RecipeDeclaration>,
) {
    for declaration in declarations {
        append_recipe_declaration(target, declaration);
    }
}

fn append_recipe_declaration(target: &mut Vec<RecipeDeclaration>, declaration: RecipeDeclaration) {
    if let Some(existing) = target
        .iter_mut()
        .find(|existing| existing.prop == declaration.prop)
    {
        *existing = declaration;
        return;
    }
    target.push(declaration);
}

fn write_with_wrappers(
    writer: &mut CssWriter,
    wrappers: &[String],
    write: impl FnOnce(&mut CssWriter),
) {
    fn inner(
        writer: &mut CssWriter,
        wrappers: &[String],
        index: usize,
        write: impl FnOnce(&mut CssWriter),
    ) {
        if let Some(wrapper) = wrappers.get(index) {
            writer.at_rule(wrapper, |writer| inner(writer, wrappers, index + 1, write));
        } else {
            write(writer);
        }
    }
    inner(writer, wrappers, 0, write);
}

fn write_token_var_rule(writer: &mut CssWriter, selector: &str, vars: &[TokenCssVar<'_>]) {
    writer.rule(selector, |writer| {
        for var in vars {
            writer.declaration(var.name, var.value, false);
        }
    });
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

fn literal_to_css(value: &Literal) -> Option<Cow<'_, str>> {
    match value {
        Literal::String(value) => Some(Cow::Borrowed(value)),
        Literal::Number(value) => Some(Cow::Owned(pandacss_shared::number_to_js_string(*value))),
        Literal::Bool(true) => Some(Cow::Borrowed("true")),
        Literal::Bool(false) | Literal::Null | Literal::Object(_) => None,
        Literal::Array(items) => {
            let values: Vec<_> = items.iter().filter_map(literal_to_css).collect();
            (!values.is_empty()).then(|| Cow::Owned(join_css_values(&values)))
        }
        Literal::Conditional(_) => None,
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

fn finalized_class_name_owned(class_name: String, conditions: &[&str]) -> String {
    if conditions.is_empty() {
        return class_name;
    }
    let condition_len = conditions
        .iter()
        .map(|condition| condition.trim_start_matches('_').len() + 1)
        .sum::<usize>();
    let mut out = String::with_capacity(condition_len + class_name.len());
    for condition in conditions {
        if !out.is_empty() {
            out.push(':');
        }
        out.push_str(condition.trim_start_matches('_'));
    }
    out.push(':');
    out.push_str(&class_name);
    out
}

fn apply_condition(
    config: &UserConfig,
    selector: &mut String,
    wrappers: &mut Vec<String>,
    condition: &str,
) {
    for raw in condition_raw_parts(config, condition) {
        apply_raw_condition(selector, wrappers, &raw);
    }
}

fn apply_raw_condition(selector: &mut String, wrappers: &mut Vec<String>, raw: &str) {
    if raw.starts_with('@') {
        wrappers.push(raw.to_owned());
    } else if raw.contains('&') {
        *selector = replace_selector_parent(raw, selector);
    } else {
        *selector = format!("{raw} {selector}");
    }
}

fn apply_token_raw_condition(
    css_var_root: &str,
    selector: &mut String,
    wrappers: &mut Vec<String>,
    raw: &str,
) {
    if raw.starts_with('@') {
        wrappers.push(raw.to_owned());
        return;
    }

    if let Some(parent) = token_parent_selector(raw) {
        *selector = if selector == css_var_root {
            parent
        } else if parent.contains('&') {
            replace_selector_parent(&parent, selector)
        } else {
            format!("{selector}{parent}")
        };
        return;
    }

    if raw.contains('&') {
        *selector = replace_selector_parent(raw, selector);
        cleanup_token_selector(css_var_root, selector);
    } else if selector == css_var_root {
        *selector = raw.to_owned();
    } else {
        *selector = format!("{selector} {raw}");
    }
}

fn token_parent_selector(raw: &str) -> Option<String> {
    let selectors = split_selector_list(raw)
        .into_iter()
        .filter_map(|selector| {
            let selector = selector.trim();
            selector
                .contains(" &")
                .then(|| selector.replace(" &", "").trim().to_owned())
        })
        .filter(|selector| !selector.is_empty())
        .collect::<Vec<_>>();

    match selectors.len() {
        0 => None,
        1 => selectors.into_iter().next(),
        _ => Some(format!(":where({})", selectors.join(", "))),
    }
}

fn cleanup_token_selector(css_var_root: &str, selector: &mut String) {
    if selector == css_var_root {
        return;
    }
    let cleaned = split_selector_list(selector)
        .into_iter()
        .filter_map(|selector| {
            let selector = selector.trim();
            if selector == css_var_root {
                None
            } else {
                let cleaned = selector.replace(css_var_root, "").trim().to_owned();
                (!cleaned.is_empty()).then_some(cleaned)
            }
        })
        .collect::<Vec<_>>();
    if !cleaned.is_empty() {
        *selector = cleaned.join(", ");
    }
}

fn without_space(value: &str) -> String {
    value.chars().filter(|ch| !ch.is_whitespace()).collect()
}

fn escape_selector(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            ':' | '.' | '/' | '!' | '%' | '[' | ']' | '(' | ')' | ',' | '#' => {
                out.push('\\');
                out.push(ch);
            }
            _ => out.push(ch),
        }
    }
    out
}

fn resolved_condition_parts(config: &UserConfig, key: &str) -> Option<ConditionParts> {
    let parts = condition_raw_parts(config, key);
    (!parts.is_empty()).then_some(parts)
}

fn is_nested_selector_key(key: &str) -> bool {
    key.contains('&')
        || key.contains(',')
        || key.contains(' ')
        || key.contains('>')
        || key.contains('+')
        || key.contains('~')
        || matches!(
            key.as_bytes().first(),
            Some(b'.' | b'#' | b':' | b'[' | b'*')
        )
}

fn nested_selector(parent: &str, nested: &str) -> String {
    if nested.contains('&') {
        replace_selector_parent(nested, parent)
    } else {
        format!("{parent} {nested}")
    }
}

fn replace_selector_parent(raw: &str, parent: &str) -> String {
    let parent_selectors = split_selector_list(parent);
    let raw_selectors = split_selector_list(raw);
    let mut out = Vec::new();
    for parent in &parent_selectors {
        for raw in &raw_selectors {
            out.push(raw.replace('&', parent));
        }
    }
    out.join(", ")
}

fn split_selector_list(selector: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut depth = 0u32;
    let mut start = 0usize;
    let mut escaped = false;

    for (index, ch) in selector.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }

        match ch {
            '(' => depth += 1,
            ')' => depth = depth.saturating_sub(1),
            ',' if depth == 0 => {
                let item = selector[start..index].trim();
                if !item.is_empty() {
                    out.push(item);
                }
                start = index + ch.len_utf8();
            }
            _ => {}
        }
    }

    let item = selector[start..].trim();
    if !item.is_empty() {
        out.push(item);
    }
    out
}

fn value_to_atom_value(value: &Value) -> Option<AtomValue> {
    match value {
        Value::String(value) => Some(AtomValue::String(value.clone().into_boxed_str())),
        Value::Number(value) => Some(AtomValue::Number(
            value
                .as_f64()
                .map(number_to_js_string)
                .unwrap_or_else(|| value.to_string())
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

fn css_var_root(config: &UserConfig) -> &str {
    if config.css_var_root.is_empty() {
        ":where(:root, :host)"
    } else {
        config.css_var_root.as_str()
    }
}
