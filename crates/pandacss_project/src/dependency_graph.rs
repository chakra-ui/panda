//! Cross-file dependency graph and the pending watch refresh queue.

use std::collections::hash_map::Entry;
use std::path::Path;
use std::sync::Arc;

use pandacss_extractor::{CrossFileDependency, RetryOutcome, UnresolvedCrossFileDependency};
use pandacss_fs::to_forward_slash;
use rustc_hash::{FxHashMap, FxHashSet};

#[derive(Clone, PartialEq, Eq, Hash)]
pub(super) struct ResolutionRequest {
    directory: Arc<str>,
    specifier: Arc<str>,
}

impl ResolutionRequest {
    fn from_dependency(dependency: &UnresolvedCrossFileDependency) -> Self {
        let from_file = Path::new(&dependency.from_file);
        let directory = from_file.parent().unwrap_or(from_file);
        Self {
            directory: Arc::from(to_forward_slash(directory)),
            specifier: Arc::from(dependency.specifier.as_str()),
        }
    }
}

struct PendingResolution {
    /// Any importer in this group is a valid probe because resolution is based
    /// on its directory and module specifier, which form [`ResolutionRequest`].
    probe: UnresolvedCrossFileDependency,
    importers: FxHashSet<Arc<str>>,
    missing_paths: Vec<Arc<str>>,
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
    requests_by_missing_path: FxHashMap<Arc<str>, FxHashSet<ResolutionRequest>>,
    affected: FxHashSet<Arc<str>>,
}

impl DependencyGraph {
    pub(super) fn clear(&mut self) {
        self.resolved_importers.clear();
        self.pending_by_request.clear();
        self.by_importer.clear();
        self.requests_by_missing_path.clear();
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
    pub(super) fn requests_waiting_on(
        &self,
        created: &str,
    ) -> Vec<(ResolutionRequest, UnresolvedCrossFileDependency)> {
        let requests = self_and_ancestors(created)
            .filter_map(|path| self.requests_by_missing_path.get(path))
            .flatten()
            .collect::<FxHashSet<_>>();
        requests
            .into_iter()
            .filter_map(|request| {
                let probe = self.pending_by_request.get(request)?.probe.clone();
                Some((request.clone(), probe))
            })
            .collect()
    }

    #[must_use]
    pub(super) fn importers_waiting_on(&self, request: &ResolutionRequest) -> Vec<Arc<str>> {
        self.pending_by_request
            .get(request)
            .map(|pending| pending.importers.iter().cloned().collect())
            .unwrap_or_default()
    }

    pub(super) fn set_missing_paths(&mut self, request: &ResolutionRequest, paths: Vec<String>) {
        let Some(pending) = self.pending_by_request.get_mut(request) else {
            return;
        };
        let paths = paths.into_iter().map(Arc::from).collect::<Vec<_>>();
        unindex_missing_paths(
            &mut self.requests_by_missing_path,
            request,
            &pending.missing_paths,
        );
        index_missing_paths(&mut self.requests_by_missing_path, request, &paths);
        pending.missing_paths = paths;
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

    /// Returns `true` when one of the unresolved imports resolves on retry.
    pub(super) fn replace_file(
        &mut self,
        path: &Arc<str>,
        resolved: &[CrossFileDependency],
        unresolved: &[UnresolvedCrossFileDependency],
        retry: impl Fn(&UnresolvedCrossFileDependency) -> RetryOutcome,
    ) -> bool {
        self.remove_file(path);

        let mut resolves_now = false;
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
                    let missing_paths = match retry(dependency) {
                        RetryOutcome::StillMissing(paths) => {
                            paths.into_iter().map(Arc::from).collect()
                        }
                        RetryOutcome::Resolved => {
                            resolves_now = true;
                            Vec::new()
                        }
                    };
                    index_missing_paths(
                        &mut self.requests_by_missing_path,
                        &request,
                        &missing_paths,
                    );
                    entry.insert(PendingResolution {
                        probe: dependency.clone(),
                        importers: FxHashSet::from_iter([Arc::clone(path)]),
                        missing_paths,
                    });
                    request
                }
            };
            importer.pending.push(request);
        }
        if !importer.resolved.is_empty() || !importer.pending.is_empty() {
            self.by_importer.insert(Arc::clone(path), importer);
        }
        resolves_now
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
                if remove_request && let Some(pending) = self.pending_by_request.remove(&request) {
                    unindex_missing_paths(
                        &mut self.requests_by_missing_path,
                        &request,
                        &pending.missing_paths,
                    );
                }
            }
        }
    }
}

fn self_and_ancestors(path: &str) -> impl Iterator<Item = &str> {
    std::iter::successors(Some(path), |path| parent_dir(path))
}

fn parent_dir(path: &str) -> Option<&str> {
    let parent = Path::new(path).parent()?.to_str()?;
    (!parent.is_empty()).then_some(parent)
}

fn index_missing_paths(
    requests_by_missing_path: &mut FxHashMap<Arc<str>, FxHashSet<ResolutionRequest>>,
    request: &ResolutionRequest,
    paths: &[Arc<str>],
) {
    for path in paths {
        requests_by_missing_path
            .entry(Arc::clone(path))
            .or_default()
            .insert(request.clone());
    }
}

fn unindex_missing_paths(
    requests_by_missing_path: &mut FxHashMap<Arc<str>, FxHashSet<ResolutionRequest>>,
    request: &ResolutionRequest,
    paths: &[Arc<str>],
) {
    for path in paths {
        if let Entry::Occupied(mut entry) = requests_by_missing_path.entry(Arc::clone(path)) {
            entry.get_mut().remove(request);
            if entry.get().is_empty() {
                entry.remove();
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

    fn resolves_on_retry(_: &UnresolvedCrossFileDependency) -> RetryOutcome {
        RetryOutcome::Resolved
    }

    fn theme_probe(dependency: &UnresolvedCrossFileDependency) -> RetryOutcome {
        let directory = dependency
            .from_file
            .rsplit_once('/')
            .map_or("", |(dir, _)| dir);
        RetryOutcome::StillMissing(vec![
            format!("{directory}/theme.ts"),
            format!("{directory}/theme"),
        ])
    }

    #[test]
    fn replacing_an_importer_replaces_its_resolved_edges() {
        let mut graph = DependencyGraph::default();
        let importer: Arc<str> = Arc::from("/project/App.tsx");

        graph.replace_file(
            &importer,
            &[resolved("/project/a.ts")],
            &[],
            resolves_on_retry,
        );
        graph.replace_file(
            &importer,
            &[resolved("/project/b.ts")],
            &[],
            resolves_on_retry,
        );

        assert!(graph.importers_of("/project/a.ts").is_empty());
        assert_eq!(graph.importers_of("/project/b.ts"), ["/project/App.tsx"]);
    }

    #[test]
    fn shared_pending_requests_are_interned_and_cleaned_up() {
        let mut graph = DependencyGraph::default();
        let first: Arc<str> = Arc::from("/project/A.tsx");
        let second: Arc<str> = Arc::from("/project/B.tsx");

        graph.replace_file(&first, &[], &[unresolved(&first)], theme_probe);
        graph.replace_file(&second, &[], &[unresolved(&second)], theme_probe);

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
        assert!(graph.requests_by_missing_path.is_empty());
    }

    #[test]
    fn a_created_file_finds_only_the_requests_that_probed_it() {
        let mut graph = DependencyGraph::default();
        let first: Arc<str> = Arc::from("/project/a/App.tsx");
        let second: Arc<str> = Arc::from("/project/b/App.tsx");
        graph.replace_file(&first, &[], &[unresolved(&first)], theme_probe);
        graph.replace_file(&second, &[], &[unresolved(&second)], theme_probe);

        let waiting = graph.requests_waiting_on("/project/a/theme.ts");
        assert_eq!(waiting.len(), 1);
        assert_eq!(graph.importers_waiting_on(&waiting[0].0), [first]);
        assert!(graph.requests_waiting_on("/project/c/theme.ts").is_empty());
    }

    #[test]
    fn a_file_created_inside_a_missing_directory_finds_its_request() {
        let mut graph = DependencyGraph::default();
        let importer: Arc<str> = Arc::from("/project/App.tsx");
        graph.replace_file(&importer, &[], &[unresolved(&importer)], theme_probe);

        assert_eq!(
            graph.requests_waiting_on("/project/theme/index.ts").len(),
            1
        );
    }

    #[test]
    fn identical_specifiers_in_different_directories_are_distinct_requests() {
        let mut graph = DependencyGraph::default();
        let first: Arc<str> = Arc::from("/project/a/App.tsx");
        let second: Arc<str> = Arc::from("/project/b/App.tsx");

        graph.replace_file(&first, &[], &[unresolved(&first)], theme_probe);
        graph.replace_file(&second, &[], &[unresolved(&second)], theme_probe);

        assert_eq!(graph.pending_by_request.len(), 2);
    }
}
