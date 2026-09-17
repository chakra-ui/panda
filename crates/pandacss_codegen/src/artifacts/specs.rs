use std::collections::BTreeMap;

use pandacss_config::{Deprecated, JsxSpecifier, PatternPropertyTypeData, VariantTypeData};
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

    let mut document = json!({
        "schemaVersion": DESIGN_SYSTEM_SCHEMA_VERSION,
        "categories": Value::Object(category_ranges),
        "paths": paths,
        "tokens": Value::Object(token_table(dictionary, &grouped)),
        "conditions": Value::Object(condition_table(ctx.config)),
        "themes": Value::Object(theme_table(ctx.config)),
        "values": value_rows(ctx.config, dictionary, &known),
    });

    // Empty sections are omitted, so a token-only system reads exactly as before.
    let table = document.as_object_mut().expect("document is an object");
    for (key, section) in [
        ("colorPalettes", name_list(&ctx.types.tokens.color_palettes)),
        ("keyframes", name_list(&ctx.types.keyframes.keys)),
        (
            "textStyles",
            composition_table(&ctx.config.theme.text_styles),
        ),
        (
            "layerStyles",
            composition_table(&ctx.config.theme.layer_styles),
        ),
        (
            "animationStyles",
            composition_table(&ctx.config.theme.animation_styles),
        ),
        ("recipes", recipe_table(ctx)),
        ("slotRecipes", slot_recipe_table(ctx)),
        ("patterns", pattern_table(ctx)),
    ] {
        if let Some(section) = section {
            table.insert(key.to_owned(), section);
        }
    }
    document
}

fn name_list(names: &[String]) -> Option<Value> {
    if names.is_empty() {
        return None;
    }
    let mut sorted = names.to_vec();
    sorted.sort();
    Some(json!(sorted))
}

/// `heading.lg` for a nested group; an entry is a leaf once it carries `value`.
fn composition_table(styles: &Value) -> Option<Value> {
    let mut entries = BTreeMap::new();
    collect_composition("", styles, &mut entries);
    if entries.is_empty() {
        return None;
    }
    let rows = entries.into_iter().map(|(name, description)| {
        let mut row = serde_json::Map::new();
        insert_optional(&mut row, "description", description.map(|d| json!(d)));
        (name, Value::Object(row))
    });
    Some(Value::Object(rows.collect()))
}

fn collect_composition(prefix: &str, node: &Value, out: &mut BTreeMap<String, Option<String>>) {
    let Some(map) = node.as_object() else { return };
    for (key, child) in map {
        let Some(child_map) = child.as_object() else {
            continue;
        };
        let name = if prefix.is_empty() {
            key.clone()
        } else {
            format!("{prefix}.{key}")
        };
        if child_map.contains_key("value") {
            let description = child_map
                .get("description")
                .and_then(Value::as_str)
                .map(str::to_owned);
            out.insert(name, description);
        } else {
            collect_composition(&name, child, out);
        }
    }
}

fn recipe_table(ctx: CodegenContext<'_>) -> Option<Value> {
    let index = &ctx.types.recipes.recipes;
    if index.is_empty() {
        return None;
    }
    let rows = index.iter().map(|(name, definition)| {
        let config = ctx.config.theme.recipes.get(name);
        let mut row = serde_json::Map::new();
        insert_optional(
            &mut row,
            "className",
            config
                .and_then(|c| c.class_name.as_deref())
                .map(|c| json!(c)),
        );
        row.insert("variants".to_owned(), variant_table(&definition.variants));
        insert_optional(
            &mut row,
            "defaultVariants",
            config.and_then(default_variants),
        );
        insert_optional(
            &mut row,
            "deprecated",
            deprecated_value(definition.deprecated.as_ref()),
        );
        insert_optional(
            &mut row,
            "description",
            config.and_then(|c| description_of(&c.extra)),
        );
        (name.clone(), Value::Object(row))
    });
    Some(Value::Object(rows.collect()))
}

fn slot_recipe_table(ctx: CodegenContext<'_>) -> Option<Value> {
    let index = &ctx.types.recipes.slot_recipes;
    if index.is_empty() {
        return None;
    }
    let rows = index.iter().map(|(name, definition)| {
        let config = ctx.config.theme.slot_recipes.get(name);
        let mut row = serde_json::Map::new();
        insert_optional(
            &mut row,
            "className",
            config
                .and_then(|c| c.class_name.as_deref())
                .map(|c| json!(c)),
        );
        row.insert("slots".to_owned(), json!(definition.slots));
        row.insert("variants".to_owned(), variant_table(&definition.variants));
        insert_optional(
            &mut row,
            "defaultVariants",
            config.and_then(default_variants),
        );
        insert_optional(
            &mut row,
            "deprecated",
            deprecated_value(definition.deprecated.as_ref()),
        );
        insert_optional(
            &mut row,
            "description",
            config.and_then(|c| description_of(&c.extra)),
        );
        (name.clone(), Value::Object(row))
    });
    Some(Value::Object(rows.collect()))
}

fn variant_table(variants: &BTreeMap<String, VariantTypeData>) -> Value {
    let rows = variants.iter().map(|(name, variant)| {
        (
            name.clone(),
            json!({ "values": variant.values, "allowsBoolean": variant.allows_boolean }),
        )
    });
    Value::Object(rows.collect())
}

fn default_variants(config: &pandacss_config::RecipeConfig) -> Option<Value> {
    if config.default_variants.is_empty() {
        return None;
    }
    serde_json::to_value(&config.default_variants).ok()
}

fn pattern_table(ctx: CodegenContext<'_>) -> Option<Value> {
    let index = &ctx.types.patterns.patterns;
    if index.is_empty() {
        return None;
    }
    let rows = index.iter().map(|(name, definition)| {
        let config = ctx.config.patterns.get(name);
        let mut row = serde_json::Map::new();
        let jsx_name = config
            .and_then(|c| c.jsx_name.clone())
            .unwrap_or_else(|| definition.type_name.clone());
        row.insert("jsxName".to_owned(), json!(jsx_name));
        // Regex matchers have no serial form; names are enough to find the component.
        let jsx: Vec<&str> = config
            .map(|c| c.jsx.iter().filter_map(JsxSpecifier::as_string).collect())
            .unwrap_or_default();
        if !jsx.is_empty() {
            row.insert("jsx".to_owned(), json!(jsx));
        }
        row.insert(
            "properties".to_owned(),
            pattern_properties(&definition.properties),
        );
        // A function default has no static form; only an object is emitted.
        let defaults = config
            .and_then(|c| c.default_values.as_ref())
            .filter(|v| v.is_object());
        insert_optional(&mut row, "defaultValues", defaults.cloned());
        row.insert("strict".to_owned(), json!(definition.strict));
        if !definition.blocklist.is_empty() {
            row.insert("blocklist".to_owned(), json!(definition.blocklist));
        }
        insert_optional(
            &mut row,
            "deprecated",
            deprecated_value(definition.deprecated.as_ref()),
        );
        insert_optional(
            &mut row,
            "description",
            config.and_then(|c| description_of(&c.extra)),
        );
        (name.clone(), Value::Object(row))
    });
    Some(Value::Object(rows.collect()))
}

/// The typegen kind, flattened into the row: `{ kind: "token", category: "spacing" }`.
fn pattern_properties(properties: &BTreeMap<String, PatternPropertyTypeData>) -> Value {
    let rows = properties.iter().map(|(name, property)| {
        let mut row = match serde_json::to_value(&property.kind) {
            Ok(Value::Object(map)) => map,
            _ => serde_json::Map::new(),
        };
        row.retain(|_, value| !value.is_null());
        insert_optional(
            &mut row,
            "description",
            property.description.as_deref().map(|d| json!(d)),
        );
        (name.clone(), Value::Object(row))
    });
    Value::Object(rows.collect())
}

fn deprecated_value(deprecated: Option<&Deprecated>) -> Option<Value> {
    deprecated
        .filter(|d| d.is_active())
        .and_then(|d| serde_json::to_value(d).ok())
}

/// `description` is not a modelled recipe or pattern field; it rides in `extra`.
fn description_of(extra: &serde_json::Map<String, Value>) -> Option<Value> {
    extra
        .get("description")
        .and_then(Value::as_str)
        .map(|d| json!(d))
}

fn insert_optional(row: &mut serde_json::Map<String, Value>, key: &str, value: Option<Value>) {
    if let Some(value) = value {
        row.insert(key.to_owned(), value);
    }
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
