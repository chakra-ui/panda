//! Cross-file dependency edges and the pending watch refresh queue.

use pandacss_extractor::{CrossFileDependency, CrossFileResolver, UnresolvedCrossFileDependency};
use rustc_hash::{FxHashMap, FxHashSet};
use std::sync::Arc;

/// Keeps resolved edges, unresolved requests, and queued importer refreshes together.
#[derive(Default)]
pub(super) struct DependencyIndex {
    importers: FxHashMap<String, FxHashMap<Arc<str>, Option<u64>>>,
    unresolved: FxHashMap<Arc<str>, Vec<UnresolvedCrossFileDependency>>,
    affected: FxHashSet<Arc<str>>,
}

impl DependencyIndex {
    pub(super) fn clear(&mut self) {
        self.importers.clear();
        self.unresolved.clear();
        self.affected.clear();
    }

    pub(super) fn has_importers(&self) -> bool {
        !self.importers.is_empty()
    }

    pub(super) fn contains_dependency(&self, path: &str) -> bool {
        self.importers.contains_key(path)
    }

    pub(super) fn has_unresolved(&self) -> bool {
        !self.unresolved.is_empty()
    }

    #[must_use]
    pub(super) fn changed_importers(
        &self,
        key: &str,
        path: &str,
        source_hash: Option<u64>,
    ) -> FxHashSet<Arc<str>> {
        self.importers
            .get(key)
            .into_iter()
            .flat_map(|importers| importers.iter())
            .filter(|(importer, seen)| **seen != source_hash && importer.as_ref() != path)
            .map(|(importer, _)| Arc::clone(importer))
            .collect()
    }

    #[must_use]
    pub(super) fn newly_resolved(&self, path: &str, resolver: &CrossFileResolver) -> Vec<Arc<str>> {
        self.unresolved
            .iter()
            .filter(|(importer, deps)| importer.as_ref() != path && resolver.any_resolvable(deps))
            .map(|(importer, _)| Arc::clone(importer))
            .collect()
    }

    pub(super) fn queue(&mut self, path: Arc<str>) {
        self.affected.insert(path);
    }

    pub(super) fn remove_affected(&mut self, path: &str) {
        self.affected.remove(path);
    }

    #[must_use]
    pub(super) fn take_affected(&mut self) -> Vec<String> {
        let mut paths = std::mem::take(&mut self.affected)
            .into_iter()
            .map(|path| path.as_ref().to_owned())
            .collect::<Vec<_>>();
        paths.sort();
        paths
    }

    #[must_use]
    pub(super) fn importers_of(&self, key: &str) -> Vec<String> {
        let mut paths = self
            .importers
            .get(key)
            .map(|importers| {
                importers
                    .keys()
                    .map(|path| path.as_ref().to_owned())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        paths.sort();
        paths
    }

    pub(super) fn remove_file(&mut self, path: &str, dependencies: &[CrossFileDependency]) {
        self.unresolved.remove(path);
        for dep in dependencies {
            let Some(importers) = self.importers.get_mut(&dep.path) else {
                continue;
            };
            importers.remove(path);
            if importers.is_empty() {
                self.importers.remove(&dep.path);
            }
        }
    }

    pub(super) fn index_file(&mut self, path: &str, dependencies: &[CrossFileDependency]) {
        if dependencies.is_empty() {
            return;
        }
        let importer = Arc::<str>::from(path);
        for dep in dependencies {
            self.importers
                .entry(dep.path.clone())
                .or_default()
                .insert(Arc::clone(&importer), dep.source_hash);
        }
    }

    pub(super) fn index_unresolved(
        &mut self,
        path: &Arc<str>,
        dependencies: &[UnresolvedCrossFileDependency],
    ) {
        if !dependencies.is_empty() {
            self.unresolved
                .insert(Arc::clone(path), dependencies.to_vec());
        }
    }
}
