use std::borrow::Cow;

use pandacss_config::{ConditionQuery, UserConfig};
use pandacss_encoder::{Atom, AtomValue};
use pandacss_extractor::Literal;
use pandacss_project::{EncodedRecipesSnapshot, RecipeStyleEntry};
use pandacss_shared::split_important;
use pandacss_utility::{Utility, UtilityTransformResult};

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
            sort_atoms(&mut atoms);
            for atom in atoms {
                cx.write_atom(writer, atom);
            }
            for atom in &recipes.atomic {
                cx.write_atom(writer, atom);
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
    64 + atoms.len().saturating_mul(96) + recipe_entries.saturating_mul(64)
}

struct EmitContext<'a> {
    config: &'a UserConfig,
    utility: &'a Utility,
}

impl<'a> EmitContext<'a> {
    fn new(config: &'a UserConfig, utility: &'a Utility) -> Self {
        Self { config, utility }
    }

    fn write_atom(&self, writer: &mut CssWriter, atom: &Atom) {
        let raw = atom_value_to_string(atom.value());
        let Some(raw) = raw.as_deref() else {
            return;
        };
        let Some(result) = self.transform_atom(atom.prop(), raw) else {
            return;
        };
        let mut class_name = self.utility.format_class_name(&result.class_name);
        if atom.important() {
            class_name.push('!');
        }
        let rule = self.rule_target(&class_name, atom.conditions());
        self.write_style_rule(writer, &rule, &result.styles);
    }

    fn write_recipe_group(
        &self,
        writer: &mut CssWriter,
        class_name: &str,
        entries: &[RecipeStyleEntry],
    ) {
        let selector_base = format!(".{}", escape_selector(class_name));
        for entry in sorted_recipe_entries(entries) {
            let rule = self.rule_target_with_base(&selector_base, &entry.conditions);
            self.write_recipe_entry_rule(writer, &rule, entry);
        }
    }

    fn write_recipe_entry_rule(
        &self,
        writer: &mut CssWriter,
        rule: &RuleTarget,
        entry: &RecipeStyleEntry,
    ) {
        let raw = atom_value_to_string(&entry.value).map(|value| value.into_owned());
        let Some(raw) = raw.as_deref() else {
            return;
        };
        let Some(result) = self.transform_atom(entry.prop.as_ref(), raw) else {
            return;
        };
        write_with_wrappers(writer, &rule.wrappers, |writer| {
            writer.rule(&rule.selector, |writer| {
                let Literal::Object(entries) = &result.styles else {
                    return;
                };
                for (prop, value) in entries {
                    if let Some(value) = literal_to_css(value) {
                        let (value, important) = split_important(&value);
                        writer.declaration(
                            &hyphenate(prop),
                            value.as_ref(),
                            entry.important || important,
                        );
                    }
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

    fn rule_target(&self, class_name: &str, conditions: &[Box<str>]) -> RuleTarget {
        let finalized = finalized_class_name(class_name, conditions);
        let base = format!(".{}", escape_selector(&finalized));
        self.rule_target_with_base(&base, conditions)
    }

    fn rule_target_with_base(&self, base: &str, conditions: &[Box<str>]) -> RuleTarget {
        let mut selector = base.to_owned();
        let mut wrappers = Vec::new();
        for condition in conditions {
            apply_condition(self.config, &mut selector, &mut wrappers, condition);
        }
        RuleTarget { selector, wrappers }
    }
}

struct RuleTarget {
    selector: String,
    wrappers: Vec<String>,
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

fn sort_atoms(atoms: &mut [&Atom]) {
    atoms.sort_by(|a, b| {
        a.conditions()
            .cmp(b.conditions())
            .then_with(|| a.prop().cmp(b.prop()))
            .then_with(|| atom_value_sort_key(a.value()).cmp(&atom_value_sort_key(b.value())))
    });
}

fn sorted_recipe_entries(entries: &[RecipeStyleEntry]) -> Vec<&RecipeStyleEntry> {
    let mut out: Vec<_> = entries.iter().collect();
    out.sort_by(|a, b| {
        a.conditions
            .cmp(&b.conditions)
            .then_with(|| a.prop.cmp(&b.prop))
            .then_with(|| atom_value_sort_key(&a.value).cmp(&atom_value_sort_key(&b.value)))
    });
    out
}

fn atom_value_sort_key(value: &AtomValue) -> (u8, &str) {
    match value {
        AtomValue::Bool(false) => (0, "false"),
        AtomValue::Bool(true) => (0, "true"),
        AtomValue::Number(value) => (1, value),
        AtomValue::String(value) => (2, value),
        AtomValue::Null => (3, ""),
    }
}

fn atom_value_to_string(value: &AtomValue) -> Option<Cow<'_, str>> {
    match value {
        AtomValue::String(value) | AtomValue::Number(value) => Some(Cow::Borrowed(value)),
        AtomValue::Bool(true) => Some(Cow::Borrowed("true")),
        AtomValue::Bool(false) | AtomValue::Null => None,
    }
}

fn literal_to_css(value: &Literal) -> Option<String> {
    match value {
        Literal::String(value) => Some(value.clone()),
        Literal::Number(value) => Some(pandacss_shared::number_to_js_string(*value)),
        Literal::Bool(true) => Some("true".to_owned()),
        Literal::Bool(false) | Literal::Null | Literal::Object(_) => None,
        Literal::Array(items) => {
            let values: Vec<_> = items.iter().filter_map(literal_to_css).collect();
            (!values.is_empty()).then(|| values.join(" "))
        }
        Literal::Conditional(_) => None,
    }
}

fn finalized_class_name(class_name: &str, conditions: &[Box<str>]) -> String {
    if conditions.is_empty() {
        return class_name.to_owned();
    }
    let mut out = String::new();
    for condition in conditions {
        if !out.is_empty() {
            out.push(':');
        }
        out.push_str(condition.trim_start_matches('_'));
    }
    out.push(':');
    out.push_str(class_name);
    out
}

fn apply_condition(
    config: &UserConfig,
    selector: &mut String,
    wrappers: &mut Vec<String>,
    condition: &str,
) {
    if let Some(value) = breakpoint_query(config, condition) {
        wrappers.push(format!("@media (width >= {value})"));
        return;
    }
    let key = condition.trim_start_matches('_');
    let query = config
        .conditions
        .get(condition)
        .or_else(|| config.conditions.get(key));
    let Some(query) = query else {
        return;
    };
    match condition_query_to_string(query) {
        Some(raw) if raw.starts_with('@') => wrappers.push(raw),
        Some(raw) if raw.contains('&') => *selector = raw.replace('&', selector),
        Some(raw) => *selector = format!("{raw} {selector}"),
        None => {}
    }
}

fn breakpoint_query(config: &UserConfig, condition: &str) -> Option<String> {
    config.theme.breakpoints.get(condition).cloned()
}

fn condition_query_to_string(query: &ConditionQuery) -> Option<String> {
    match query {
        ConditionQuery::String(value) => Some(value.clone()),
        ConditionQuery::Array(items) => items.first().cloned(),
        ConditionQuery::Nested(_) => None,
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
