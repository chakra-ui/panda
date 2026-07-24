//! Shared cascade-layer plan for declarations, native output, and polyfill ranks.

use std::collections::HashMap;

use indexmap::IndexMap;
use pandacss_config::CascadeLayers;

#[derive(Default)]
struct LayerNode {
    children: IndexMap<String, LayerNode>,
    emits_rules: bool,
}

#[derive(Default)]
struct LayerTree {
    roots: IndexMap<String, LayerNode>,
}

impl LayerTree {
    fn insert(&mut self, path: &[String], emits_rules: bool) {
        let mut parts = path
            .iter()
            .flat_map(|part| part.split('.'))
            .filter(|part| !part.is_empty());
        let Some(root) = parts.next() else {
            return;
        };
        let mut node = self.roots.entry(root.to_owned()).or_default();
        for part in parts {
            node = node.children.entry(part.to_owned()).or_default();
        }
        node.emits_rules |= emits_rules;
    }

    fn ordered_paths(self) -> Vec<String> {
        fn visit(node: LayerNode, path: &mut Vec<String>, out: &mut Vec<String>) {
            for (name, child) in node.children {
                path.push(name);
                visit(child, path, out);
                path.pop();
            }
            if node.emits_rules {
                out.push(path.join("."));
            }
        }

        let mut out = Vec::new();
        for (name, root) in self.roots {
            let mut path = vec![name];
            visit(root, &mut path, &mut out);
        }
        out
    }
}

/// Ordered representation of explicit layers and each layer's implicit final
/// sublayer (the layer path itself).
pub(crate) struct CascadePlan {
    ordered_paths: Vec<String>,
}

impl CascadePlan {
    pub(crate) fn with_discovered(layers: &CascadeLayers, discovered: &[Vec<String>]) -> Self {
        let mut tree = LayerTree::default();
        for name in [&layers.reset, &layers.base, &layers.tokens] {
            tree.insert(std::slice::from_ref(name), true);
        }
        let recipes = layers.recipes.clone();
        tree.insert(std::slice::from_ref(&recipes), false);
        for name in layers.recipe_declaration_names() {
            let child = name
                .strip_prefix(&format!("{recipes}."))
                .unwrap_or(&name)
                .to_owned();
            let emits_rules = child != "slots";
            tree.insert(&[recipes.clone(), child], emits_rules);
        }
        let slots = format!("{recipes}.slots");
        for name in layers.slot_recipe_declaration_names() {
            let child = name
                .strip_prefix(&format!("{slots}."))
                .unwrap_or(&name)
                .to_owned();
            tree.insert(&[recipes.clone(), "slots".to_owned(), child], true);
        }
        tree.insert(std::slice::from_ref(&layers.utilities), true);
        for path in discovered {
            tree.insert(path, true);
        }

        Self {
            ordered_paths: tree.ordered_paths(),
        }
    }

    pub(crate) fn rank_map(&self) -> HashMap<String, u32> {
        self.ordered_paths
            .iter()
            .enumerate()
            .map(|(rank, path)| {
                (
                    path.clone(),
                    u32::try_from(rank).expect("CSS layer count fits in u32"),
                )
            })
            .collect()
    }

    pub(crate) fn internal_declarations(layers: &CascadeLayers) -> [Vec<String>; 2] {
        [
            layers.recipe_declaration_names(),
            layers.slot_recipe_declaration_names(),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::CascadePlan;
    use pandacss_config::CascadeLayers;

    #[test]
    fn implicit_parent_sublayer_follows_explicit_children() {
        let layers = CascadeLayers::default();
        let discovered = vec![vec![layers.utilities.clone(), "compositions".to_owned()]];
        let ranks = CascadePlan::with_discovered(&layers, &discovered).rank_map();

        assert!(ranks["utilities.compositions"] < ranks["utilities"]);
        assert!(ranks["recipes.base"] < ranks["recipes.slots.base"]);
        assert!(ranks["recipes.slots.compound_variants"] < ranks["recipes.variants"]);
        assert!(ranks["recipes.compound_variants"] < ranks["utilities.compositions"]);
    }

    #[test]
    fn dotted_layer_names_share_their_parent_path() {
        let layers = CascadeLayers::default();
        let discovered = vec![vec!["theme".to_owned()], vec!["theme.inner".to_owned()]];
        let ranks = CascadePlan::with_discovered(&layers, &discovered).rank_map();

        assert!(ranks["theme.inner"] < ranks["theme"]);
    }
}
