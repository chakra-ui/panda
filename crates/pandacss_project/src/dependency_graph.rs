//! Cross-file dependency graph and the pending watch refresh queue.

use std::collections::hash_map::Entry;
use std::path::Path;
use std::sync::Arc;

use pandacss_extractor::{CrossFileDependency, CrossFileResolver, UnresolvedCrossFileDependency};
use rustc_hash::{FxHashMap, FxHashSet};

#[derive(Clone, PartialEq, Eq, Hash)]
struct ResolutionRequest {
    directory: Arc<str>,
    specifier: Arc<str>,
}

impl ResolutionRequest {
    fn from_dependency(dependency: &UnresolvedCrossFileDependency) -> Self {
        let from_file = Path::new(&dependency.from_file);
        let directory = from_file.parent().unwrap_or(from_file);
        Self {
            directory: Arc::from(directory.to_string_lossy().replace('\\', "/")),
            specifier: Arc::from(dependency.specifier.as_str()),
        }
    }
}

struct PendingResolution {
    /// Any importer in this group is a valid probe because resolution is based
    /// on its directory and module specifier, which form [`ResolutionRequest`].
    probe: UnresolvedCrossFileDependency,
    importers: FxHashSet<Arc<str>>,
}

#[derive(Default)]
struct ImporterDependencies {
    resolved: Vec<Arc<str>>,
    pending: Vec<ResolutionRequest>,
}

/// Owns both directions of resolved and unresolved cross-file dependency edges.
#[derive(Default)]
pub(super) struct DependencyGraph {
    resolved_importers: FxHashMap<Arc<str>, FxHashMap<Arc<str>, Option<u64>>>,
    pending_by_request: FxHashMap<ResolutionRequest, PendingResolution>,
    by_importer: FxHashMap<Arc<str>, ImporterDependencies>,
    affected: FxHashSet<Arc<str>>,
}

impl DependencyGraph {
    pub(super) fn clear(&mut self) {
        self.resolved_importers.clear();
        self.pending_by_request.clear();
        self.by_importer.clear();
        self.affected.clear();
    }

    pub(super) fn has_importers(&self) -> bool {
        !self.resolved_importers.is_empty()
    }

    pub(super) fn contains_dependency(&self, path: &str) -> bool {
        self.resolved_importers.contains_key(path)
    }

    pub(super) fn has_unresolved(&self) -> bool {
        !self.pending_by_request.is_empty()
    }

    #[must_use]
    pub(super) fn changed_importers(
        &self,
        key: &str,
        path: &str,
        source_hash: Option<u64>,
    ) -> FxHashSet<Arc<str>> {
        self.resolved_importers
            .get(key)
            .into_iter()
            .flat_map(|importers| importers.iter())
            .filter(|(importer, seen)| **seen != source_hash && importer.as_ref() != path)
            .map(|(importer, _)| Arc::clone(importer))
            .collect()
    }

    #[must_use]
    pub(super) fn newly_resolved(
        &self,
        path: &str,
        resolver: &CrossFileResolver,
    ) -> FxHashSet<Arc<str>> {
        let groups = self.pending_by_request.values().collect::<Vec<_>>();
        let probes = groups
            .iter()
            .map(|group| group.probe.clone())
            .collect::<Vec<_>>();
        resolver
            .check_resolvable(&probes)
            .into_iter()
            .zip(groups)
            .filter(|(resolved, _)| *resolved)
            .flat_map(|(_, group)| group.importers.iter())
            .filter(|importer| importer.as_ref() != path)
            .cloned()
            .collect()
    }

    pub(super) fn queue(&mut self, path: Arc<str>) {
        self.affected.insert(path);
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
            .resolved_importers
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

    pub(super) fn replace_file(
        &mut self,
        path: &Arc<str>,
        resolved: &[CrossFileDependency],
        unresolved: &[UnresolvedCrossFileDependency],
    ) {
        self.remove_file(path);

        let mut importer = ImporterDependencies {
            resolved: Vec::with_capacity(resolved.len()),
            pending: Vec::with_capacity(unresolved.len()),
        };
        for dependency in resolved {
            let dependency_path: Arc<str> = Arc::from(dependency.path.as_str());
            self.resolved_importers
                .entry(Arc::clone(&dependency_path))
                .or_default()
                .insert(Arc::clone(path), dependency.source_hash);
            importer.resolved.push(dependency_path);
        }

        for dependency in unresolved {
            let request = ResolutionRequest::from_dependency(dependency);
            let request = match self.pending_by_request.entry(request) {
                Entry::Occupied(mut entry) => {
                    entry.get_mut().importers.insert(Arc::clone(path));
                    entry.key().clone()
                }
                Entry::Vacant(entry) => {
                    let request = entry.key().clone();
                    entry.insert(PendingResolution {
                        probe: dependency.clone(),
                        importers: FxHashSet::from_iter([Arc::clone(path)]),
                    });
                    request
                }
            };
            importer.pending.push(request);
        }
        if !importer.resolved.is_empty() || !importer.pending.is_empty() {
            self.by_importer.insert(Arc::clone(path), importer);
        }
    }

    pub(super) fn remove_file(&mut self, path: &str) {
        self.affected.remove(path);

        if let Some(importer) = self.by_importer.remove(path) {
            for dependency in importer.resolved {
                let remove_dependency = self
                    .resolved_importers
                    .get_mut(dependency.as_ref())
                    .is_some_and(|importers| {
                        importers.remove(path);
                        importers.is_empty()
                    });
                if remove_dependency {
                    self.resolved_importers.remove(dependency.as_ref());
                }
            }

            for request in importer.pending {
                let remove_request =
                    self.pending_by_request
                        .get_mut(&request)
                        .is_some_and(|pending| {
                            pending.importers.remove(path);
                            pending.importers.is_empty()
                        });
                if remove_request {
                    self.pending_by_request.remove(&request);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn resolved(path: &str) -> CrossFileDependency {
        CrossFileDependency {
            path: path.to_owned(),
            source_hash: Some(1),
        }
    }

    fn unresolved(from_file: &str) -> UnresolvedCrossFileDependency {
        UnresolvedCrossFileDependency {
            from_file: from_file.to_owned(),
            specifier: "./theme".to_owned(),
        }
    }

    #[test]
    fn replacing_an_importer_replaces_its_resolved_edges() {
        let mut graph = DependencyGraph::default();
        let importer: Arc<str> = Arc::from("/project/App.tsx");

        graph.replace_file(&importer, &[resolved("/project/a.ts")], &[]);
        graph.replace_file(&importer, &[resolved("/project/b.ts")], &[]);

        assert!(graph.importers_of("/project/a.ts").is_empty());
        assert_eq!(graph.importers_of("/project/b.ts"), ["/project/App.tsx"]);
    }

    #[test]
    fn shared_pending_requests_are_interned_and_cleaned_up() {
        let mut graph = DependencyGraph::default();
        let first: Arc<str> = Arc::from("/project/A.tsx");
        let second: Arc<str> = Arc::from("/project/B.tsx");

        graph.replace_file(&first, &[], &[unresolved(&first)]);
        graph.replace_file(&second, &[], &[unresolved(&second)]);

        assert_eq!(graph.pending_by_request.len(), 1);
        assert_eq!(
            graph
                .pending_by_request
                .values()
                .next()
                .expect("shared request")
                .importers
                .len(),
            2
        );

        graph.remove_file(&first);
        assert_eq!(graph.pending_by_request.len(), 1);
        graph.remove_file(&second);
        assert!(graph.pending_by_request.is_empty());
    }

    #[test]
    fn identical_specifiers_in_different_directories_are_distinct_requests() {
        let mut graph = DependencyGraph::default();
        let first: Arc<str> = Arc::from("/project/a/App.tsx");
        let second: Arc<str> = Arc::from("/project/b/App.tsx");

        graph.replace_file(&first, &[], &[unresolved(&first)]);
        graph.replace_file(&second, &[], &[unresolved(&second)]);

        assert_eq!(graph.pending_by_request.len(), 2);
    }
}
