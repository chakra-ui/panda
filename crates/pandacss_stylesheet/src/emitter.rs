use std::borrow::Cow;

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, AtomValue};
use pandacss_extractor::Literal;
use pandacss_project::{EncodedRecipesSnapshot, RecipeStyleEntry};
use pandacss_shared::split_important;
use pandacss_utility::{Utility, UtilityTransformResult};

use crate::sort::{SortContext, condition_raw_parts};
use crate::writer::CssWriter;

pub fn emit(
    config: &UserConfig,
    utility: &Utility,
    mut atoms: Vec<&Atom>,
    recipes: &EncodedRecipesSnapshot,
    minify: bool,
) -> String {
    let cx = EmitContext::new(config, utility);
    let mut writer = CssWriter::new(minify, capacity_hint(&atoms, recipes));
    writer.write_str("@layer reset, base, tokens, recipes, utilities;");
    writer.newline();
    if has_recipe_rules(recipes) {
        writer.layer("recipes", |writer| {
            for group in &recipes.base {
                cx.write_recipe_group(writer, &group.class_name, &group.entries);
            }
            for group in &recipes.variants {
                cx.write_recipe_group(writer, &group.class_name, &group.entries);
            }
        });
    }
    if !atoms.is_empty() || !recipes.atomic.is_empty() {
        writer.layer("utilities", |writer| {
            atoms.extend(recipes.atomic.iter());
            for atom in cx.sort.sorted_atoms(atoms) {
                cx.write_atom(writer, atom.atom, &atom.conditions);
            }
        });
    }
    writer.finish()
}

fn has_recipe_rules(recipes: &EncodedRecipesSnapshot) -> bool {
    recipes
        .base
        .iter()
        .chain(&recipes.variants)
        .any(|group| !group.entries.is_empty())
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
        let raw = atom_value_to_string(&entry.value);
        let raw = raw.as_deref()?;
        let result = self.transform_atom(entry.prop.as_ref(), raw)?;
        let Literal::Object(entries) = &result.styles else {
            return None;
        };

        let mut declarations = Vec::with_capacity(entries.len());
        for (prop, value) in entries {
            if let Some(value) = literal_to_css(value) {
                let (value, important) = split_important(&value);
                append_recipe_declaration(
                    &mut declarations,
                    RecipeDeclaration {
                        prop: hyphenate(prop),
                        value: value.into_owned(),
                        important: entry.important || important,
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
                        writer.declaration(&hyphenate(prop), value.as_ref(), important);
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
}

struct PendingRecipeRule {
    rule: RuleTarget,
    declarations: Vec<RecipeDeclaration>,
}

struct RecipeDeclaration {
    prop: String,
    value: String,
    important: bool,
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
    if let Some(index) = target
        .iter()
        .position(|existing| existing.prop == declaration.prop)
    {
        target.remove(index);
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

fn default_transform(prop: &str, raw: &str) -> UtilityTransformResult {
    let class_name = format!("{}_{}", hyphenate(prop), without_space(raw));
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
        *selector = raw.replace('&', selector);
    } else {
        *selector = format!("{raw} {selector}");
    }
}

fn without_space(value: &str) -> String {
    value.chars().filter(|ch| !ch.is_whitespace()).collect()
}

fn hyphenate(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for (index, ch) in value.chars().enumerate() {
        if ch.is_ascii_uppercase() {
            if index > 0 {
                out.push('-');
            }
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    out
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
