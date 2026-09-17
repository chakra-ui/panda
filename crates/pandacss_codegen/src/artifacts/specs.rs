use pandacss_tokens::{TokenCategory, TokenDictionary};
use serde_json::{Value, json};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, DependencySet, graph::GenerateOptions,
};

const COLOR_PALETTE: &str = "colorPalette";
const COLOR_PALETTE_PREFIX: &str = "colorPalette.";

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    _options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    let files = ctx
        .token_dictionary
        .map(|dictionary| ArtifactFile {
            path: "specs/design-system.json".to_owned(),
            code: serde_json::to_string_pretty(&build_design_system(ctx, dictionary))
                .expect("design system spec should serialize"),
            dependencies,
        })
        .into_iter()
        .collect();

    Artifact {
        id: ArtifactId::Specs,
        dependencies,
        files,
    }
}

/// See `design-notes/design-system-spec.md`.
fn build_design_system(ctx: CodegenContext<'_>, dictionary: &TokenDictionary) -> Value {
    let grouped = render_order(dictionary);

    let mut paths = Vec::new();
    let mut category_ranges = serde_json::Map::new();
    for (category, category_paths) in &grouped {
        let from = paths.len();
        paths.extend(category_paths.iter().copied());
        category_ranges.insert((*category).as_str().to_owned(), json!([from, paths.len()]));
    }

    let known: std::collections::HashSet<&str> = paths.iter().copied().collect();

    json!({
        "schemaVersion": DESIGN_SYSTEM_SCHEMA_VERSION,
        "categories": Value::Object(category_ranges),
        "paths": paths,
        "tokens": Value::Object(token_table(dictionary, &grouped)),
        "conditions": Value::Object(condition_table(ctx.config)),
        "themes": Value::Object(theme_table(ctx.config)),
        "values": value_rows(ctx.config, dictionary, &known),
    })
}

/// Dictionary order within a category, so `spacing.4` precedes `spacing.10`.
fn render_order(dictionary: &TokenDictionary) -> Vec<(&TokenCategory, Vec<&str>)> {
    let mut grouped: Vec<(&TokenCategory, Vec<&str>)> = categories(dictionary)
        .map(|category| {
            let mut seen = std::collections::HashSet::new();
            let paths: Vec<&str> = dictionary
                .iter_category(category)
                .filter(|token| token.condition.is_none())
                .map(|token| token.path.as_ref())
                .filter(|path| !is_color_palette(category_relative_path(path, category)))
                .filter(|path| seen.insert(*path))
                .collect();
            (category, paths)
        })
        .filter(|(_, paths)| !paths.is_empty())
        .collect();
    grouped.sort_by(|a, b| a.0.as_str().cmp(b.0.as_str()));
    grouped
}

fn token_table(
    dictionary: &TokenDictionary,
    grouped: &[(&TokenCategory, Vec<&str>)],
) -> serde_json::Map<String, Value> {
    let mut tokens = serde_json::Map::new();
    for (category, category_paths) in grouped {
        for path in category_paths {
            let Some(token) = dictionary.token(path) else {
                continue;
            };
            let mut entry = serde_json::Map::new();
            entry.insert("category".to_owned(), json!((*category).as_str()));
            if let Some(css_var) = custom_property(&token.var) {
                entry.insert("cssVar".to_owned(), json!(css_var));
            }
            if let Some(original_value) = token.original_value.as_deref() {
                entry.insert("originalValue".to_owned(), json!(original_value));
            }
            if let Some(description) = token.description.as_ref() {
                entry.insert("description".to_owned(), json!(description.as_ref()));
            }
            if token.deprecated {
                entry.insert("deprecated".to_owned(), json!(true));
            }
            if let Some(reason) = token.deprecated_reason.as_ref() {
                entry.insert("deprecatedReason".to_owned(), json!(reason.as_ref()));
            }
            if dictionary.is_semantic_token(path) {
                entry.insert("semantic".to_owned(), json!(true));
            }
            tokens.insert((*path).to_owned(), Value::Object(entry));
        }
    }
    tokens
}

fn value_rows(
    config: &pandacss_config::UserConfig,
    dictionary: &TokenDictionary,
    known: &std::collections::HashSet<&str>,
) -> Vec<Value> {
    let mut values: Vec<Value> = dictionary
        .iter()
        .filter(|token| known.contains(token.path.as_ref()))
        .map(|token| {
            let mut row = serde_json::Map::new();
            row.insert("token".to_owned(), json!(token.path.as_ref()));
            if let Some(condition) = token.condition.as_ref() {
                let (theme, rest) = split_theme_condition(config, condition);
                if let Some(theme) = theme {
                    row.insert("theme".to_owned(), json!(theme));
                }
                if let Some(rest) = rest {
                    row.insert("condition".to_owned(), json!(rest));
                }
            }
            row.insert(
                "value".to_owned(),
                json!(resolve_value(dictionary, &token.value)),
            );
            let refs = token_refs(dictionary, &token.value, known);
            if !refs.is_empty() {
                row.insert("refs".to_owned(), json!(refs));
            }
            Value::Object(row)
        })
        .collect();
    values.sort_by_key(sort_key);
    values
}

/// Prefixed to match the condition names value rows carry.
fn condition_table(config: &pandacss_config::UserConfig) -> serde_json::Map<String, Value> {
    config
        .conditions
        .iter()
        .filter(|(name, _)| !name.is_empty())
        .map(|(name, query)| {
            (
                format!("_{name}"),
                serde_json::to_value(query).unwrap_or(Value::Null),
            )
        })
        .collect()
}

fn theme_table(config: &pandacss_config::UserConfig) -> serde_json::Map<String, Value> {
    config
        .themes
        .keys()
        .map(|name| {
            (
                name.clone(),
                json!({
                    "id": format!("panda-theme-{name}"),
                    "selector": config.theme_root_selector(name),
                }),
            )
        })
        .collect()
}

/// Bump when the document's shape changes in a way readers must notice.
const DESIGN_SYSTEM_SCHEMA_VERSION: u32 = 1;

fn sort_key(row: &Value) -> (String, String, String) {
    let field = |key: &str| {
        row.get(key)
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_owned()
    };
    (field("token"), field("theme"), field("condition"))
}

/// `_themePrimary:_osDark` -> (`primary`, `_osDark`).
fn split_theme_condition<'a>(
    config: &'a pandacss_config::UserConfig,
    condition: &'a str,
) -> (Option<&'a str>, Option<&'a str>) {
    let (head, rest) = match condition.split_once(':') {
        Some((head, rest)) => (head, Some(rest)),
        None => (condition, None),
    };
    match config.theme_for_condition(head) {
        Some(theme) => (Some(theme), rest),
        None => (None, Some(condition)),
    }
}

/// `var(--colors-red-500)` -> `--colors-red-500`; derived tokens have none.
fn custom_property(var: &str) -> Option<&str> {
    var.strip_prefix("var(")
        .and_then(|rest| rest.strip_suffix(')'))
        .filter(|name| !name.is_empty())
}

/// Multiple: `color-mix(in srgb, {colors.a}, {colors.b})` touches two.
fn token_refs(
    dictionary: &TokenDictionary,
    value: &str,
    known: &std::collections::HashSet<&str>,
) -> Vec<String> {
    let mut refs: Vec<String> = Vec::new();
    let mut rest = value;
    while let Some(offset) = rest.find("var(--") {
        let after = &rest[offset..];
        let Some(end) = after.find(')') else { break };
        let (var_ref, tail) = after.split_at(end + 1);
        if let Some(token) = dictionary.token_by_var(var_ref)
            && known.contains(token.path.as_ref())
            && !refs.iter().any(|path| path == token.path.as_ref())
        {
            refs.push(token.path.to_string());
        }
        rest = tail;
    }
    refs
}

fn categories(dictionary: &TokenDictionary) -> impl Iterator<Item = &TokenCategory> {
    let mut categories: Vec<&TokenCategory> = dictionary.categories().collect();
    categories.sort_by(|a, b| a.as_str().cmp(b.as_str()));
    categories.into_iter()
}

fn is_color_palette(name: &str) -> bool {
    name == COLOR_PALETTE || name.starts_with(COLOR_PALETTE_PREFIX)
}

fn category_relative_path<'a>(path: &'a str, category: &TokenCategory) -> &'a str {
    path.strip_prefix(category.as_str())
        .and_then(|rest| rest.strip_prefix('.'))
        .unwrap_or(path)
}

fn resolve_value(dictionary: &TokenDictionary, value: &str) -> String {
    let mut current = value.to_owned();
    for _ in 0..32 {
        let mut next = String::with_capacity(current.len());
        let mut rest = current.as_str();
        let mut changed = false;
        while let Some(offset) = rest.find("var(--") {
            let (before, after) = rest.split_at(offset);
            next.push_str(before);
            let Some(rel_end) = after.find(')') else {
                next.push_str(after);
                rest = "";
                break;
            };
            let (var_ref, tail) = after.split_at(rel_end + 1);
            match dictionary.token_by_var(var_ref) {
                Some(token) if token.value.as_ref() != var_ref => {
                    next.push_str(&token.value);
                    changed = true;
                }
                _ => next.push_str(var_ref),
            }
            rest = tail;
        }
        next.push_str(rest);
        current = next;
        if !changed {
            break;
        }
    }
    current
}
