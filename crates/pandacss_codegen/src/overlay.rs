use std::collections::BTreeSet;

use crate::{ExportDecl, Item, ItemNode, Module};

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CodegenOverlay {
    pub jsx: String,
    pub recipes: String,
    pub patterns: String,
    pub owned_recipes: Vec<String>,
    pub owned_patterns: Vec<String>,
}

impl CodegenOverlay {
    pub(crate) fn owns_recipe(&self, name: &str) -> bool {
        self.owned_recipes.iter().any(|owned| owned == name)
    }

    pub(crate) fn owns_pattern(&self, name: &str) -> bool {
        self.owned_patterns.iter().any(|owned| owned == name)
    }

    pub(crate) fn owned_recipe_idents(&self) -> Vec<String> {
        idents(&self.owned_recipes)
    }

    pub(crate) fn owned_pattern_idents(&self) -> Vec<String> {
        idents(&self.owned_patterns)
    }
}

pub(crate) fn index_barrel(named_reexport: Option<(Vec<String>, &str)>, app_stems: &[String]) -> Module {
    let mut module = Module::new();

    if let Some((names, source)) = named_reexport.filter(|(names, _)| !names.is_empty()) {
        module = module.with_item(Item::both(ItemNode::Export(ExportDecl::Named {
            names,
            source: source.to_owned(),
        })));
    }

    app_stems.iter().fold(module, |module, stem| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
            source: format!("./{stem}"),
        })))
    })
}

fn idents(names: &[String]) -> Vec<String> {
    names
        .iter()
        .map(|name| pandacss_shared::js_ident(name))
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}
