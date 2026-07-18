use std::collections::BTreeSet;

use pandacss_shared::file_stem;

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
    pub virtualize_helpers: bool,
    pub virtualize_css: bool,
}

impl CodegenOverlay {
    pub(crate) fn owns_recipe(&self, name: &str) -> bool {
        self.owned_recipes.iter().any(|owned| owned == name)
    }

    pub(crate) fn owns_pattern(&self, name: &str) -> bool {
        self.owned_patterns.iter().any(|owned| owned == name)
    }

    pub(crate) fn owned_recipe_sources(&self) -> Vec<String> {
        deep_sources(&self.recipes, &self.owned_recipes)
    }

    pub(crate) fn owned_pattern_sources(&self) -> Vec<String> {
        deep_sources(&self.patterns, &self.owned_patterns)
    }

    pub(crate) fn owned_jsx_sources(&self) -> Vec<String> {
        deep_sources(&self.jsx, &self.owned_patterns)
    }

    pub(crate) fn resolve(&self, import: RuntimeImport) -> Option<String> {
        let (enabled, specifier) = match import {
            RuntimeImport::Helpers => (self.virtualize_helpers, self.helpers.clone()),
            RuntimeImport::CssCx => (
                self.virtualize_css && !self.css.is_empty(),
                format!("{}/cx", self.css),
            ),
            RuntimeImport::CssConditions => (
                self.virtualize_css && !self.css.is_empty(),
                format!("{}/conditions", self.css),
            ),
            RuntimeImport::CssCss => (
                self.virtualize_css && !self.css.is_empty(),
                format!("{}/css", self.css),
            ),
            RuntimeImport::CssIndex => (
                self.virtualize_css && !self.css.is_empty(),
                self.css.clone(),
            ),
        };
        (enabled && !specifier.is_empty()).then_some(specifier)
    }
}

pub(crate) fn index_barrel(ds_sources: &[String], app_stems: &[String]) -> Module {
    let module = ds_sources.iter().fold(Module::new(), |module, source| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
            source: source.clone(),
        })))
    });

    app_stems.iter().fold(module, |module, stem| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
            source: format!("./{stem}"),
        })))
    })
}

pub(crate) fn star_reexport(source: impl Into<String>) -> Module {
    Module::new().with_item(Item::both(ItemNode::Export(ExportDecl::Star {
        source: source.into(),
    })))
}

fn deep_sources(root: &str, names: &[String]) -> Vec<String> {
    if root.is_empty() {
        return Vec::new();
    }
    names
        .iter()
        .map(|name| format!("{root}/{}", file_stem(name)))
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
            virtualize_helpers: true,
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
            Some("@acme/ui/css")
        );
    }

    #[test]
    fn empty_css_root_never_resolves() {
        let o = CodegenOverlay {
            css: String::new(),
            helpers: String::new(),
            virtualize_helpers: true,
            virtualize_css: true,
            ..Default::default()
        };
        assert_eq!(o.resolve(RuntimeImport::CssCx), None);
        assert_eq!(o.resolve(RuntimeImport::CssConditions), None);
        assert_eq!(o.resolve(RuntimeImport::CssCss), None);
        assert_eq!(o.resolve(RuntimeImport::CssIndex), None);
        assert_eq!(o.resolve(RuntimeImport::Helpers), None);
    }

    #[test]
    fn leaves_non_virtualized_imports_local() {
        let mut o = overlay();
        o.virtualize_css = false;
        assert_eq!(
            o.resolve(RuntimeImport::Helpers).as_deref(),
            Some("@acme/ui/helpers")
        );
        assert_eq!(o.resolve(RuntimeImport::CssConditions), None);
        assert_eq!(o.resolve(RuntimeImport::CssIndex), None);
    }

    #[test]
    fn owned_sources_use_file_stems() {
        let o = CodegenOverlay {
            recipes: "@ds/recipes".into(),
            patterns: "@ds/patterns".into(),
            jsx: "@ds/jsx".into(),
            owned_recipes: vec!["chip".into(), "iconButton".into()],
            owned_patterns: vec!["aspectRatio".into(), "stack".into()],
            ..Default::default()
        };
        assert_eq!(
            o.owned_recipe_sources(),
            vec!["@ds/recipes/chip", "@ds/recipes/icon-button"]
        );
        assert_eq!(
            o.owned_pattern_sources(),
            vec!["@ds/patterns/aspect-ratio", "@ds/patterns/stack"]
        );
        assert_eq!(
            o.owned_jsx_sources(),
            vec!["@ds/jsx/aspect-ratio", "@ds/jsx/stack"]
        );
    }
}
