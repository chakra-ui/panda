use std::collections::BTreeSet;

use crate::{ExportDecl, Item, ItemNode, Module};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RuntimeImport {
    Helpers,
    CssIndex,
    CssCss,
    CssCx,
    CssConditions,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CodegenOverlay {
    pub jsx: String,
    pub recipes: String,
    pub patterns: String,
    pub css: String,
    pub helpers: String,
    pub owned_recipes: Vec<String>,
    pub owned_patterns: Vec<String>,
    pub virtualize_utils: bool,
    pub virtualize_conditions: bool,
    pub virtualize_css: bool,
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

    #[allow(dead_code, reason = "wired into artifact emission in a follow-up task")]
    pub(crate) fn resolve(&self, import: RuntimeImport) -> Option<String> {
        let (enabled, specifier) = match import {
            RuntimeImport::Helpers => (self.virtualize_utils, self.helpers.clone()),
            RuntimeImport::CssCx => (self.virtualize_utils, format!("{}/cx", self.css)),
            RuntimeImport::CssConditions => (
                self.virtualize_conditions,
                format!("{}/conditions", self.css),
            ),
            RuntimeImport::CssCss => (self.virtualize_css, format!("{}/css", self.css)),
            RuntimeImport::CssIndex => (self.virtualize_css, format!("{}/index", self.css)),
        };
        (enabled && !specifier.is_empty()).then_some(specifier)
    }
}

pub(crate) fn index_barrel(
    named_reexport: Option<(Vec<String>, &str)>,
    app_stems: &[String],
) -> Module {
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

#[cfg(test)]
mod tests {
    use super::*;

    fn overlay() -> CodegenOverlay {
        CodegenOverlay {
            css: "@acme/ui/css".into(),
            helpers: "@acme/ui/helpers".into(),
            virtualize_utils: true,
            virtualize_conditions: true,
            virtualize_css: true,
            ..Default::default()
        }
    }

    #[test]
    fn resolves_virtualized_imports_to_ds_roots() {
        let o = overlay();
        assert_eq!(
            o.resolve(RuntimeImport::Helpers).as_deref(),
            Some("@acme/ui/helpers")
        );
        assert_eq!(
            o.resolve(RuntimeImport::CssCx).as_deref(),
            Some("@acme/ui/css/cx")
        );
        assert_eq!(
            o.resolve(RuntimeImport::CssConditions).as_deref(),
            Some("@acme/ui/css/conditions")
        );
        assert_eq!(
            o.resolve(RuntimeImport::CssCss).as_deref(),
            Some("@acme/ui/css/css")
        );
        assert_eq!(
            o.resolve(RuntimeImport::CssIndex).as_deref(),
            Some("@acme/ui/css/index")
        );
    }

    #[test]
    fn leaves_non_virtualized_imports_local() {
        let mut o = overlay();
        o.virtualize_conditions = false;
        o.virtualize_css = false;
        assert_eq!(
            o.resolve(RuntimeImport::Helpers).as_deref(),
            Some("@acme/ui/helpers")
        );
        assert_eq!(o.resolve(RuntimeImport::CssConditions), None);
        assert_eq!(o.resolve(RuntimeImport::CssIndex), None);
    }
}
