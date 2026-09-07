//! The `specs` artifact: `specs/tokens.json`, a low-noise snapshot of the design
//! system's tokens grouped by category. Meant for docs, token viewers, and LLMs —
//! `{ data: [{ type, values: [{ name, value }] }] }`.

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
    let data = ctx.token_dictionary.map(build_data).unwrap_or_default();
    let code = serde_json::to_string_pretty(&json!({ "data": data }))
        .expect("token spec should serialize");

    Artifact {
        id: ArtifactId::Specs,
        dependencies,
        files: vec![ArtifactFile {
            path: "specs/tokens.json".to_owned(),
            code,
            dependencies,
        }],
    }
}

fn build_data(dictionary: &TokenDictionary) -> Vec<Value> {
    let mut categories: Vec<&TokenCategory> = dictionary.categories().collect();
    categories.sort_by(|a, b| a.as_str().cmp(b.as_str()));
    categories
        .into_iter()
        .map(|category| {
            let values: Vec<Value> = dictionary
                .iter_category(category)
                // Base values only; theme/condition variants are excluded from the flat spec.
                .filter(|token| token.condition.is_none())
                .filter_map(|token| {
                    let name = category_relative_path(&token.path, category);
                    // Skip the virtual `colorPalette` tokens — a runtime mechanism, not a
                    // designed token; they resolve to nothing until a palette is active.
                    if name == COLOR_PALETTE || name.starts_with(COLOR_PALETTE_PREFIX) {
                        return None;
                    }
                    Some(json!({ "name": name, "value": &*token.value }))
                })
                .collect();
            json!({ "type": category.as_str(), "values": values })
        })
        .collect()
}

fn category_relative_path<'a>(path: &'a str, category: &TokenCategory) -> &'a str {
    path.strip_prefix(category.as_str())
        .and_then(|rest| rest.strip_prefix('.'))
        .unwrap_or(path)
}
