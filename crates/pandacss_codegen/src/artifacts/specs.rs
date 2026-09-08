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
    let (tokens, semantic) = match ctx.token_dictionary {
        Some(dictionary) => (build_tokens(dictionary), build_semantic_tokens(dictionary)),
        None => (Vec::new(), Vec::new()),
    };

    let file = |path: &str, data: Vec<Value>| ArtifactFile {
        path: path.to_owned(),
        code: serde_json::to_string_pretty(&json!({ "data": data }))
            .expect("spec should serialize"),
        dependencies,
    };

    Artifact {
        id: ArtifactId::Specs,
        dependencies,
        files: vec![
            file("specs/tokens.json", tokens),
            file("specs/semantic-tokens.json", semantic),
        ],
    }
}

fn build_tokens(dictionary: &TokenDictionary) -> Vec<Value> {
    categories(dictionary)
        .filter_map(|category| {
            let values: Vec<Value> = dictionary
                .iter_category(category)
                .filter(|token| {
                    token.condition.is_none() && !dictionary.is_semantic_token(&token.path)
                })
                .filter_map(|token| {
                    let name = category_relative_path(&token.path, category);
                    if is_color_palette(name) {
                        return None;
                    }
                    Some(json!({ "name": name, "value": resolve_value(dictionary, &token.value) }))
                })
                .collect();
            (!values.is_empty()).then(|| json!({ "type": category.as_str(), "values": values }))
        })
        .collect()
}

fn build_semantic_tokens(dictionary: &TokenDictionary) -> Vec<Value> {
    categories(dictionary)
        .filter_map(|category| {
            let values: Vec<Value> = dictionary
                .iter_category(category)
                .filter(|token| {
                    token.condition.is_none() && dictionary.is_semantic_token(&token.path)
                })
                .map(|token| {
                    let mut conditions = vec![
                        json!({ "condition": "base", "value": resolve_value(dictionary, &token.value) }),
                    ];
                    for condition in dictionary.conditions() {
                        if let Some(variant) = dictionary.token_with_condition(&token.path, condition)
                        {
                            conditions.push(json!({
                                "condition": condition.as_ref(),
                                "value": resolve_value(dictionary, &variant.value),
                            }));
                        }
                    }
                    json!({ "name": category_relative_path(&token.path, category), "values": conditions })
                })
                .collect();
            (!values.is_empty()).then(|| json!({ "type": category.as_str(), "values": values }))
        })
        .collect()
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
    for _ in 0..16 {
        let mut search_from = 0;
        let mut replaced = false;
        while let Some(offset) = current[search_from..].find("var(--") {
            let start = search_from + offset;
            let Some(rel_end) = current[start..].find(')') else {
                break;
            };
            let end = start + rel_end + 1;
            match dictionary.token_by_var(&current[start..end]) {
                Some(token) if token.value.as_ref() != &current[start..end] => {
                    let replacement = token.value.to_string();
                    current.replace_range(start..end, &replacement);
                    replaced = true;
                    break;
                }
                _ => search_from = end,
            }
        }
        if !replaced {
            break;
        }
    }
    current
}
