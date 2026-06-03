use std::collections::{BTreeMap, BTreeSet};

use pandacss_shared::{Diagnostic, diagnostic_codes};
use serde_json::Value;

use crate::{UserConfig, ValidationMode};

type TokenMap = BTreeMap<String, Value>;
type RefMap = BTreeMap<String, BTreeSet<String>>;
type TypeMap = BTreeMap<String, &'static str>;

#[must_use]
pub fn validate_config(config: &UserConfig) -> Vec<Diagnostic> {
    if config.validation == ValidationMode::None {
        return Vec::new();
    }
    let Ok(value) = serde_json::to_value(config) else {
        return Vec::new();
    };
    validate_config_value(&value)
}

#[must_use]
pub fn validate_config_value(config: &Value) -> Vec<Diagnostic> {
    if validation_mode_from_value(config) == ValidationMode::None {
        return Vec::new();
    }

    let mut diagnostics = Vec::new();
    validate_breakpoints(config.pointer("/theme/breakpoints"), &mut diagnostics);
    validate_conditions(config.get("conditions"), &mut diagnostics);

    let mut artifacts = ArtifactNames::default();
    let mut tokens = TokenData::default();

    if let Some(theme) = config.get("theme").and_then(Value::as_object) {
        validate_tokens(theme, &mut tokens, &mut diagnostics);
        collect_recipe_names(theme.get("recipes"), &mut artifacts.recipes);
        collect_recipe_names(theme.get("slotRecipes"), &mut artifacts.slot_recipes);
    }

    collect_recipe_names(config.get("patterns"), &mut artifacts.patterns);
    validate_artifact_names(&artifacts, &mut diagnostics);
    diagnostics
}

#[derive(Default)]
struct ArtifactNames {
    recipes: BTreeSet<String>,
    slot_recipes: BTreeSet<String>,
    patterns: BTreeSet<String>,
}

#[derive(Default)]
#[allow(
    clippy::struct_field_names,
    reason = "the *_path suffix documents the keying scheme"
)]
struct TokenData {
    value_at_path: TokenMap,
    refs_by_path: RefMap,
    type_by_path: TypeMap,
}

#[must_use]
pub fn validation_mode_from_value(config: &Value) -> ValidationMode {
    match config.get("validation").and_then(Value::as_str) {
        Some("none") => ValidationMode::None,
        Some("error") => ValidationMode::Error,
        _ => ValidationMode::Warn,
    }
}

fn warn(code: &'static str, message: impl Into<String>) -> Diagnostic {
    Diagnostic::warning(code, message)
}

/// Warn when breakpoints mix units (e.g. `px` and `rem`) — merge-rules in the
/// emitter assume a single comparable unit.
fn validate_breakpoints(value: Option<&Value>, diagnostics: &mut Vec<Diagnostic>) {
    let Some(entries) = value.and_then(Value::as_object) else {
        return;
    };

    let mut units = BTreeSet::new();
    let mut values = Vec::new();
    for value in entries.values() {
        let text = value_string(value);
        values.push(text.clone());
        units.insert(unit_of(&text).unwrap_or("px").to_owned());
    }

    if units.len() > 1 {
        values.sort();
        diagnostics.push(warn(
            diagnostic_codes::CONFIG_BREAKPOINT_UNITS_MIXED,
            format!(
                "All breakpoints must use the same unit: `{}`",
                values.join(", ")
            ),
        ));
    }
}

fn validate_conditions(value: Option<&Value>, diagnostics: &mut Vec<Diagnostic>) {
    let Some(entries) = value.and_then(Value::as_object) else {
        return;
    };
    for (name, condition) in entries {
        if let Some(condition) = condition.as_str() {
            validate_condition_selector(condition, diagnostics);
            continue;
        }
        if let Some(items) = condition.as_array() {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_CONDITION_ARRAY_UNSUPPORTED,
                format!(
                    "Array conditions are not supported in v2: `conditions.{name}`. Use block form with `@slot` instead."
                ),
            ));
            for item in items.iter().filter_map(Value::as_str) {
                validate_condition_selector(item, diagnostics);
            }
            continue;
        }
        if let Some(block) = condition.as_object() {
            validate_condition_block(block, diagnostics);
        }
    }
}

fn validate_condition_block(
    block: &serde_json::Map<String, Value>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    for (selector, value) in block {
        validate_condition_selector(selector, diagnostics);
        match value {
            Value::String(value) if value == "@slot" => {}
            Value::Object(nested) => validate_condition_block(nested, diagnostics),
            _ => diagnostics.push(warn(
                diagnostic_codes::CONFIG_CONDITION_SELECTOR_INVALID,
                format!("Condition blocks must end in `@slot`: `{selector}`"),
            )),
        }
    }
}

fn validate_condition_selector(condition: &str, diagnostics: &mut Vec<Diagnostic>) {
    if !condition.starts_with('@') && !condition.contains('&') {
        diagnostics.push(warn(
            diagnostic_codes::CONFIG_CONDITION_SELECTOR_INVALID,
            format!("Selectors should contain the `&` character: `{condition}`"),
        ));
    }
}

fn validate_tokens(
    theme: &serde_json::Map<String, Value>,
    tokens: &mut TokenData,
    diagnostics: &mut Vec<Diagnostic>,
) {
    if let Some(value) = theme.get("tokens") {
        validate_token_tree(value, "tokens", tokens, diagnostics);
    }
    if let Some(value) = theme.get("semanticTokens") {
        validate_token_tree(value, "semanticTokens", tokens, diagnostics);
    }
    validate_token_references(tokens, diagnostics);
}

/// Walk one token tree (`tokens` or `semanticTokens`), recording each token's
/// value/type into `tokens` and warning on malformed entries (spaces in keys,
/// missing `value`, doubly-nested `value`). Harvests `{…}` references for the
/// later cross-token reference pass.
fn validate_token_tree(
    root: &Value,
    kind: &'static str,
    tokens: &mut TokenData,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let mut paths = Vec::new();
    collect_token_paths(root, &mut Vec::new(), &mut paths);

    for path in paths {
        let formatted = path.join(".");
        let Some(value) = get_path(root, &path) else {
            continue;
        };
        tokens.type_by_path.insert(formatted.clone(), kind);
        tokens
            .value_at_path
            .insert(formatted.clone(), value.clone());
        if formatted.contains(".DEFAULT") {
            tokens
                .value_at_path
                .insert(formatted.replace(".DEFAULT", ""), value.clone());
        }

        if path.iter().any(|segment| segment.contains(' ')) {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_TOKEN_KEY_CONTAINS_SPACE,
                format!("Token key must not contain spaces: `theme.{kind}.{formatted}`"),
            ));
            continue;
        }

        if !is_valid_token(value) {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_TOKEN_MISSING_VALUE,
                format!("Token must contain 'value': `theme.{kind}.{formatted}`"),
            ));
            continue;
        }

        if kind == "semanticTokens" && has_nested_value_value(value) {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_TOKEN_NESTED_VALUE,
                format!("You used `value` twice resulting in an invalid token `theme.tokens.{formatted}.value.value`"),
            ));
        }

        let serialized = serialize_token_value(value.get("value").unwrap_or(value));
        let refs = references(&serialized);
        if !refs.is_empty() {
            tokens
                .refs_by_path
                .entry(formatted)
                .or_default()
                .extend(refs);
        }
    }
}

/// Cross-token reference validation: flags self-references, missing/unknown
/// referenced tokens, and circular chains. Each token's reference graph is
/// explored with a worklist (`stack` + `seen`); a dep that loops back to the
/// origin `path` is a cycle.
fn validate_token_references(tokens: &TokenData, diagnostics: &mut Vec<Diagnostic>) {
    for (path, refs) in &tokens.refs_by_path {
        if refs.contains(path) {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_TOKEN_SELF_REFERENCE,
                format!("Self token reference: `{path}`"),
            ));
        }

        let mut stack = vec![path.clone()];
        let mut seen = BTreeSet::new();
        while let Some(mut current_path) = stack.pop() {
            // A `token/opacity` reference keys off the token path alone.
            if let Some((token_path, _opacity)) = current_path.split_once('/') {
                current_path = token_path.to_owned();
            }
            if !seen.insert(current_path.clone()) {
                continue;
            }

            let Some(value) = tokens.value_at_path.get(&current_path) else {
                let config_key = tokens.type_by_path.get(path).copied().unwrap_or("tokens");
                diagnostics.push(warn(
                    diagnostic_codes::CONFIG_TOKEN_MISSING_REFERENCE,
                    format!("Missing token: `{current_path}` used in `theme.{config_key}.{path}`"),
                ));
                continue;
            };

            if let Some(value) = value.as_str()
                && is_token_reference(value)
                && !tokens.refs_by_path.contains_key(value)
            {
                diagnostics.push(warn(
                    diagnostic_codes::CONFIG_TOKEN_UNKNOWN_REFERENCE,
                    format!("Unknown token reference: `{current_path}` used in `{value}`"),
                ));
            }

            let Some(deps) = tokens.refs_by_path.get(&current_path) else {
                continue;
            };
            for dep in deps {
                if dep == path {
                    diagnostics.push(warn(
                        diagnostic_codes::CONFIG_TOKEN_CIRCULAR_REFERENCE,
                        format!(
                            "Circular token reference: `{dep}` -> `{current_path}` -> ... -> `{path}`"
                        ),
                    ));
                    break;
                }
                stack.push(dep.clone());
            }
        }
    }
}

/// Collect the path to every token leaf — a node is a leaf once it has a
/// `value` key (or isn't an object). Reuses one `path` buffer across recursion.
fn collect_token_paths(value: &Value, path: &mut Vec<String>, out: &mut Vec<Vec<String>>) {
    let Some(map) = value.as_object() else {
        if !path.is_empty() {
            out.push(path.clone());
        }
        return;
    };

    if map.contains_key("value") {
        out.push(path.clone());
        return;
    }

    for (key, child) in map {
        path.push(key.clone());
        collect_token_paths(child, path, out);
        path.pop();
    }
}

fn get_path<'a>(mut value: &'a Value, path: &[String]) -> Option<&'a Value> {
    for segment in path {
        value = value.get(segment)?;
    }
    Some(value)
}

fn is_valid_token(value: &Value) -> bool {
    value
        .as_object()
        .is_some_and(|map| map.contains_key("value"))
}

fn has_nested_value_value(value: &Value) -> bool {
    let Some(value) = value.get("value") else {
        return false;
    };
    contains_key_path(value, &["value"])
}

/// Deep search for a `path` of nested keys anywhere in `value` — used to
/// detect a `value.value` shape regardless of nesting depth.
fn contains_key_path(value: &Value, path: &[&str]) -> bool {
    if path.is_empty() {
        return true;
    }

    match value {
        Value::Object(map) => {
            map.get(path[0])
                .is_some_and(|next| contains_key_path(next, &path[1..]))
                || map.values().any(|next| contains_key_path(next, path))
        }
        Value::Array(items) => items.iter().any(|next| contains_key_path(next, path)),
        _ => false,
    }
}

fn collect_recipe_names(value: Option<&Value>, names: &mut BTreeSet<String>) {
    let Some(map) = value.and_then(Value::as_object) else {
        return;
    };
    names.extend(map.keys().cloned());
}

fn validate_artifact_names(names: &ArtifactNames, diagnostics: &mut Vec<Diagnostic>) {
    for recipe in &names.recipes {
        if names.slot_recipes.contains(recipe) {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_ARTIFACT_NAME_CONFLICT,
                format!("This recipe name is already used in `theme.slotRecipes`: {recipe}"),
            ));
        }
        if names.patterns.contains(recipe) {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_ARTIFACT_NAME_CONFLICT,
                format!("This recipe name is already used in `patterns`: `{recipe}`"),
            ));
        }
    }
    for recipe in &names.slot_recipes {
        if names.patterns.contains(recipe) {
            diagnostics.push(warn(
                diagnostic_codes::CONFIG_ARTIFACT_NAME_CONFLICT,
                format!("This recipe name is already used in `patterns`: {recipe}"),
            ));
        }
    }
}

fn value_string(value: &Value) -> String {
    match value {
        Value::String(value) => value.clone(),
        Value::Number(value) => value.to_string(),
        Value::Bool(value) => value.to_string(),
        Value::Null => "null".to_owned(),
        other => other.to_string(),
    }
}

fn unit_of(value: &str) -> Option<&str> {
    let start = value
        .char_indices()
        .find(|(_, ch)| !(ch.is_ascii_digit() || *ch == '.'))
        .map(|(index, _)| index)?;
    Some(&value[start..])
}

fn serialize_token_value(value: &Value) -> String {
    match value {
        Value::String(value) => value.clone(),
        Value::Object(map) => map
            .values()
            .map(serialize_token_value)
            .collect::<Vec<_>>()
            .join(" "),
        Value::Array(items) => items
            .iter()
            .map(serialize_token_value)
            .collect::<Vec<_>>()
            .join(" "),
        Value::Number(value) => value.to_string(),
        Value::Bool(value) => value.to_string(),
        Value::Null => "null".to_owned(),
    }
}

fn is_token_reference(value: &str) -> bool {
    value.contains('{') && value.contains('}')
}

/// Extract every `{token.path}` reference from a serialized value, dropping any
/// `/opacity` suffix so the result keys directly into the token map.
fn references(value: &str) -> BTreeSet<String> {
    let mut refs = BTreeSet::new();
    let mut rest = value;
    while let Some(start) = rest.find('{') {
        let after_start = &rest[start + 1..];
        let Some(end) = after_start.find('}') else {
            break;
        };
        let reference = after_start[..end].trim();
        if !reference.is_empty() {
            refs.insert(
                reference
                    .split_once('/')
                    .map_or(reference, |(path, _)| path)
                    .to_owned(),
            );
        }
        rest = &after_start[end + 1..];
    }
    refs
}
