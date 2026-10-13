//! Cross-file folding. When [`crate::Resolver`] hits `import { x } from './tokens'`,
//! load the target and fold the named export. Resolution is `oxc_resolver`.
//!
//! `CrossFileResolver` type-erases over [`pandacss_fs::FileSystem`] so
//! `ExtractorConfig` and `Project` stay non-generic. Impl is `ResolverImpl<F>`
//! behind `Box<dyn CrossFileLookup>`.
//!
//! Cache: `path → (source hash, exports, nested provenance)`. Unchanged files
//! parse once and drop the AST. A changed source or nested dep replaces the
//! entry.
//!
//! Folds top-level `export const X = <foldable>` and simple pure function
//! exports into an owned descriptor.

use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    BindingPattern, Declaration, ExportNamedDeclaration, Expression, ImportDeclarationSpecifier,
    Program, Statement, VariableDeclaration,
};
use oxc_parser::Parser;
use oxc_resolver::{ResolveOptions, ResolverGeneric, TsconfigDiscovery};
use pandacss_fs::{FileSystem, to_forward_slash};
use rustc_hash::{FxHashMap, FxHashSet};

use crate::Literal;
use crate::literal::expression_to_literal;
use crate::pure_fn::{OwnedPureFn, lower_callable_expr, lower_function};
use crate::style_tree::into_project_literal;
use crate::{
    MatchCategory, MatchedImport, Matchers, TokenDictionary, collect_imports,
    extract::UnresolvedCrossFileDependency, imports::module_export_name, match_import_records,
    scope::Resolver,
};

/// Folded named export: style literal, pure callable, or inline recipe.
#[derive(Debug, Clone)]
pub(crate) enum ExportEntry {
    Literal(Literal),
    /// Keep extractable styles separate from the value used in constant folding.
    StyleFallback {
        known_value: Option<Literal>,
        style_value: Literal,
    },
    PureFn(OwnedPureFn),
    Recipe(ExportedRecipe),
}

/// `export const button = cva({ … })`. Enough for `button.raw(props)` without running the recipe.
#[derive(Debug, Clone)]
pub struct ExportedRecipe {
    /// `"cva"` or `"sva"`.
    pub factory: String,
    /// Config object as authored.
    pub config: Literal,
}

type FileExports = FxHashMap<String, ExportEntry>;

/// Exported name → (module specifier, name in that module).
type ReExports = FxHashMap<String, (String, String)>;

/// Modules read while folding and the hash seen; `None` = unreadable.
type Provenance = Vec<(PathBuf, Option<u64>)>;
type UnresolvedDependencies = Vec<(PathBuf, String)>;

struct CachedFileExports {
    source_hash: u64,
    exports: FileExports,
    /// Every name the module exports itself, foldable or not. These shadow `export *`.
    declared: FxHashSet<String>,
    /// `export * from '…'` specifiers, looked up lazily for names the module doesn't declare.
    star_sources: Vec<String>,
    /// Names forwarded from another module, resolved on lookup so the barrel doesn't depend on them.
    re_exports: ReExports,
    /// Modules folded while collecting this file's exports. A hash miss busts this entry.
    deps: Provenance,
    /// Failed nested resolutions. A newly resolvable request invalidates this entry.
    unresolved: UnresolvedDependencies,
}

fn is_package_path(path: &Path) -> bool {
    path.components()
        .any(|component| component.as_os_str() == "node_modules")
}

fn forward_slash_path(path: &Path) -> PathBuf {
    PathBuf::from(to_forward_slash(path))
}

fn resolve_with<F: FileSystem + Clone>(
    fs: &F,
    resolver: &ResolverGeneric<F>,
    from_file: &Path,
    specifier: &str,
) -> Option<PathBuf> {
    if <F as oxc_resolver::FileSystem>::metadata(fs, from_file)
        .is_ok_and(oxc_resolver::FileMetadata::is_file)
    {
        return resolver
            .resolve_file(from_file, specifier)
            .ok()
            .map(|resolution| forward_slash_path(&resolution.full_path()));
    }
    let directory = from_file.parent()?;
    resolver
        .resolve(directory, specifier)
        .ok()
        .map(|resolution| forward_slash_path(&resolution.full_path()))
}

fn default_resolve_options() -> ResolveOptions {
    ResolveOptions {
        extensions: [".tsx", ".ts", ".jsx", ".mjs", ".cjs", ".js", ".json"]
            .iter()
            .map(|s| (*s).to_string())
            .collect(),
        // Auto-discover tsconfig so `paths` aliases resolve (matches rolldown/tsc).
        tsconfig: Some(TsconfigDiscovery::Auto),
        ..ResolveOptions::default()
    }
}

/// Type-erased over `F: FileSystem` so `ExtractorConfig` stays non-generic.
pub struct CrossFileResolver {
    inner: Arc<dyn CrossFileLookup>,
}

/// One consistent view of imported modules across a batch of extractions.
///
/// The first lookup validates a module against the filesystem. Later lookups
/// reuse that immutable analyzed export set, including when another resolver
/// session refreshes the shared cache concurrently.
pub struct CrossFileSession {
    inner: Arc<dyn CrossFileLookup>,
    files: RefCell<FxHashMap<PathBuf, Arc<CachedFileExports>>>,
    unreadable: RefCell<FxHashSet<PathBuf>>,
    unresolved: RefCell<FxHashMap<PathBuf, FxHashSet<String>>>,
}

/// Per-extraction recursion state over a shared analyzed-module session.
pub(crate) struct CrossFileContext<'a> {
    session: &'a CrossFileSession,
    in_flight: RefCell<FxHashSet<(PathBuf, String)>>,
    /// Lookups through a loaded module: `Some(name)` for a named re-export, `None` for its star index.
    forwarding: RefCell<FxHashSet<(PathBuf, Option<String>)>>,
}

impl std::fmt::Debug for CrossFileResolver {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CrossFileResolver")
            .field("cached_files", &self.inner.cache_len())
            .finish_non_exhaustive()
    }
}

impl std::fmt::Debug for CrossFileSession {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CrossFileSession")
            .field("analyzed_files", &self.files.borrow().len())
            .field("unreadable_files", &self.unreadable.borrow().len())
            .field(
                "unresolved_imports",
                &self
                    .unresolved
                    .borrow()
                    .values()
                    .map(FxHashSet::len)
                    .sum::<usize>(),
            )
            .finish_non_exhaustive()
    }
}

#[cfg(feature = "os")]
impl Default for CrossFileResolver {
    fn default() -> Self {
        Self::new()
    }
}

impl CrossFileResolver {
    #[cfg(feature = "os")]
    #[must_use]
    pub fn new() -> Self {
        Self::with_fs(pandacss_fs::OsFileSystem::default())
    }

    /// Custom FS. Wasm and tests use [`pandacss_fs::MemoryFileSystem`].
    pub fn with_fs<F: FileSystem + Clone + 'static>(fs: F) -> Self {
        Self::with_fs_and_options(fs, default_resolve_options())
    }

    pub fn with_fs_and_options<F: FileSystem + Clone + 'static>(
        fs: F,
        options: ResolveOptions,
    ) -> Self {
        Self {
            inner: Arc::new(ResolverImpl::new(fs, options)),
        }
    }

    /// Start a consistent cross-file analysis batch.
    #[must_use]
    pub fn session(&self) -> CrossFileSession {
        CrossFileSession {
            inner: Arc::clone(&self.inner),
            files: RefCell::default(),
            unreadable: RefCell::default(),
            unresolved: RefCell::default(),
        }
    }

    #[must_use]
    pub fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf> {
        self.inner.resolve_path(from_file, specifier)
    }

    /// Host path → the form recorded in `ExtractUsage::dependencies`.
    #[must_use]
    pub fn dependency_key(&self, path: &Path) -> Option<PathBuf> {
        self.inner.dependency_key(path)
    }

    /// Check previously unresolved requests against one fresh resolver view.
    ///
    /// The result at each index corresponds to the request at the same index.
    #[must_use]
    pub fn check_resolvable(&self, dependencies: &[UnresolvedCrossFileDependency]) -> Vec<bool> {
        self.inner.check_resolvable(dependencies)
    }

    /// Clear cached filesystem lookups before retrying unresolved dependencies.
    pub fn clear_resolution_cache(&self) {
        self.inner.clear_resolution_cache();
    }
}

impl CrossFileSession {
    fn module(&self, path: &Path) -> Option<Arc<CachedFileExports>> {
        self.files.borrow().get(path).map(Arc::clone)
    }

    fn insert(&self, path: PathBuf, cached: Arc<CachedFileExports>) {
        self.files.borrow_mut().insert(path, cached);
    }

    fn extend(&self, entries: impl IntoIterator<Item = (PathBuf, Arc<CachedFileExports>)>) {
        self.files.borrow_mut().extend(entries);
    }

    fn is_unreadable(&self, path: &Path) -> bool {
        self.unreadable.borrow().contains(path)
    }

    fn record_unreadable(&self, path: PathBuf) {
        self.unreadable.borrow_mut().insert(path);
    }

    fn is_unresolved(&self, directory: &Path, specifier: &str) -> bool {
        self.unresolved
            .borrow()
            .get(directory)
            .is_some_and(|specifiers| specifiers.contains(specifier))
    }

    fn record_unresolved(&self, directory: &Path, specifier: &str) {
        self.unresolved
            .borrow_mut()
            .entry(directory.to_path_buf())
            .or_default()
            .insert(specifier.to_owned());
    }

    #[must_use]
    pub(crate) fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf> {
        self.inner.resolve_path(from_file, specifier)
    }
}

impl<'a> CrossFileContext<'a> {
    pub(crate) fn new(session: &'a CrossFileSession) -> Self {
        Self {
            session,
            in_flight: RefCell::default(),
            forwarding: RefCell::default(),
        }
    }

    pub(crate) fn resolve_named_export(
        &self,
        from_file: &Path,
        specifier: &str,
        name: &str,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
        prefix: &str,
    ) -> CrossFileResolution {
        self.session.inner.resolve_named_export(
            self,
            CrossFileRequest {
                from_file,
                specifier,
                name,
                matchers,
                tokens,
                prefix,
            },
        )
    }
}

#[derive(Clone, Copy)]
pub(crate) struct CrossFileRequest<'a> {
    from_file: &'a Path,
    specifier: &'a str,
    name: &'a str,
    matchers: Option<&'a Matchers>,
    tokens: Option<&'a TokenDictionary>,
    prefix: &'a str,
}

/// Folded export plus resolved path. `path` is a build dep even when the export does not fold.
pub(crate) struct CrossFileResolution {
    pub(crate) entry: Option<ExportEntry>,
    /// The module exports the name, whether or not it folds.
    declared: bool,
    pub(crate) path: Option<PathBuf>,
    pub(crate) source_hash: Option<u64>,
    pub(crate) provenance: Provenance,
    pub(crate) unresolved: UnresolvedDependencies,
}

impl CrossFileResolution {
    fn none() -> Self {
        Self {
            entry: None,
            declared: false,
            path: None,
            source_hash: None,
            provenance: Vec::new(),
            unresolved: Vec::new(),
        }
    }

    fn unresolved(from_file: &Path, specifier: &str) -> Self {
        Self {
            entry: None,
            declared: false,
            path: None,
            source_hash: None,
            provenance: Vec::new(),
            unresolved: vec![(from_file.to_path_buf(), specifier.to_owned())],
        }
    }

    fn at_path(
        path: PathBuf,
        source_hash: Option<u64>,
        entry: Option<ExportEntry>,
        provenance: Provenance,
    ) -> Self {
        Self {
            entry,
            declared: false,
            path: Some(path),
            source_hash,
            provenance,
            unresolved: Vec::new(),
        }
    }

    fn with_unresolved(mut self, unresolved: UnresolvedDependencies) -> Self {
        self.unresolved = unresolved;
        self
    }

    /// Take the value from the module the name is forwarded to, and depend on it.
    fn forward_to(&mut self, nested: Self) {
        self.entry = nested.entry;
        self.unresolved.extend(nested.unresolved);
        if let Some(path) = nested.path {
            self.provenance.push((path, nested.source_hash));
        }
        self.provenance.extend(nested.provenance);
    }

    fn from_cached(path: PathBuf, cached: &CachedFileExports, name: &str) -> Self {
        let mut resolution = Self::at_path(
            path,
            Some(cached.source_hash),
            cached.exports.get(name).cloned(),
            cached.deps.clone(),
        )
        .with_unresolved(cached.unresolved.clone());
        resolution.declared = cached.declared.contains(name);
        resolution
    }
}

pub(crate) trait CrossFileLookup: Send + Sync {
    fn resolve_named_export(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
    ) -> CrossFileResolution;

    fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf>;

    fn dependency_key(&self, path: &Path) -> Option<PathBuf>;

    fn check_resolvable(&self, dependencies: &[UnresolvedCrossFileDependency]) -> Vec<bool>;

    fn clear_resolution_cache(&self);

    fn cache_len(&self) -> usize;
}

struct ResolverImpl<F: FileSystem + Clone> {
    inner: ResolverGeneric<F>,
    fs: F,
    cache: Mutex<FxHashMap<PathBuf, Arc<CachedFileExports>>>,
    star_indexes: Mutex<FxHashMap<PathBuf, Arc<StarIndex>>>,
}

/// Which `export *` source provides each name a barrel re-exports, built once per barrel revision.
///
/// Lookups re-resolve the name in the providing module, so a stale index can only miss a fold:
/// a module that drops the name no longer resolves, and one that gains it is found once the
/// barrel itself changes.
struct StarIndex {
    source_hash: u64,
    names: FxHashMap<String, StarProvider>,
}

#[derive(Clone)]
enum StarProvider {
    /// `star` indexes `star_sources`; `origin` is the module that declares the name.
    One { star: usize, origin: Arc<Path> },
    /// Different modules declare the name, which JS rejects as ambiguous.
    Ambiguous,
}

impl<F: FileSystem + Clone> ResolverImpl<F> {
    fn cache(&self) -> std::sync::MutexGuard<'_, FxHashMap<PathBuf, Arc<CachedFileExports>>> {
        self.cache
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    fn new(fs: F, options: ResolveOptions) -> Self {
        let inner = ResolverGeneric::<F>::new_with_file_system(fs.clone(), options);
        Self {
            inner,
            fs,
            cache: Mutex::default(),
            star_indexes: Mutex::default(),
        }
    }

    fn extract_exports(
        context: &CrossFileContext<'_>,
        path: &Path,
        source: &str,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
        prefix: &str,
    ) -> (ModuleExports, Provenance, UnresolvedDependencies) {
        let allocator = Allocator::default();
        let source_type = crate::adapter::source_type_from_path(path);
        let parser_return = Parser::new(&allocator, source, source_type).parse();
        let matched = matchers.map_or_else(Vec::new, |matchers| {
            let imports = collect_imports(&parser_return.program);
            match_import_records(&imports, matchers)
        });
        let resolver = Resolver::build_with_cross_file_lookup(crate::scope::ResolverBuildInput {
            program: &parser_return.program,
            matched: &matched,
            matchers,
            tokens,
            prefix,
            cross_file: Some(context),
            source_path: Some(path.to_path_buf()),
            line_index: None,
            pattern_raw_transform: None,
            recipe_raw_resolve: None,
        });

        // Oxc recovers a partial AST on parse errors. Walk what we get.
        let exports = collect_exports(&parser_return.program, &resolver, &matched);
        let deps = resolver
            .take_cross_file_deps()
            .into_iter()
            .map(|dep| (PathBuf::from(dep.path), dep.source_hash))
            .collect();
        let unresolved = resolver
            .take_unresolved_cross_file_deps()
            .into_iter()
            .map(|dep| (PathBuf::from(dep.from_file), dep.specifier))
            .collect();
        (exports, deps, unresolved)
    }

    // PERF(port): one read + hash per nested dep on every cache hit.
    fn provenance_fresh(&self, deps: &[(PathBuf, Option<u64>)]) -> bool {
        deps.iter().all(|(path, expected)| {
            <F as oxc_resolver::FileSystem>::read_to_string(&self.fs, path)
                .ok()
                .map(|source| pandacss_shared::fx_hash(&source))
                == *expected
        })
    }

    fn seed_session_dependencies(
        &self,
        session: &CrossFileSession,
        deps: &[(PathBuf, Option<u64>)],
    ) {
        let cache = self.cache();
        let entries = deps.iter().filter_map(|(path, expected)| {
            let cached = cache.get(path)?;
            (Some(cached.source_hash) == *expected).then(|| (path.clone(), Arc::clone(cached)))
        });
        session.extend(entries);
    }

    fn unresolved_still_missing(&self, deps: &UnresolvedDependencies) -> bool {
        deps.iter()
            .all(|(from_file, specifier)| !self.is_resolvable(from_file, specifier))
    }

    fn is_resolvable(&self, from_file: &Path, specifier: &str) -> bool {
        self.resolve_auto(from_file, specifier).is_some()
    }

    fn resolve_auto(&self, from_file: &Path, specifier: &str) -> Option<PathBuf> {
        resolve_with(&self.fs, &self.inner, from_file, specifier)
    }

    /// The analyzed exports of the module `request.specifier` points to, or the resolution to
    /// return when there is none.
    fn load_module(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
    ) -> Result<(PathBuf, Arc<CachedFileExports>), Box<CrossFileResolution>> {
        let CrossFileRequest {
            from_file,
            specifier,
            name,
            matchers,
            tokens,
            prefix,
        } = request;
        let session = context.session;
        let Some(directory) = from_file.parent() else {
            return Err(Box::new(CrossFileResolution::none()));
        };
        if session.is_unresolved(directory, specifier) {
            return Err(Box::new(CrossFileResolution::unresolved(
                from_file, specifier,
            )));
        }
        let Some(path) = self.resolve_auto(from_file, specifier) else {
            session.record_unresolved(directory, specifier);
            return Err(Box::new(CrossFileResolution::unresolved(
                from_file, specifier,
            )));
        };

        if let Some(cached) = session.module(&path) {
            return Ok((path, cached));
        }
        if session.is_unreadable(&path) {
            return Err(Box::new(CrossFileResolution::at_path(
                path,
                None,
                None,
                Vec::new(),
            )));
        }

        // Read-fail drops the entry so a deleted file never serves stale exports.
        let Ok(source) = <F as oxc_resolver::FileSystem>::read_to_string(&self.fs, &path) else {
            self.cache().remove(&path);
            session.record_unreadable(path.clone());
            return Err(Box::new(CrossFileResolution::at_path(
                path,
                None,
                None,
                Vec::new(),
            )));
        };
        let source_hash = pandacss_shared::fx_hash(&source);

        // Record `path` on every remaining exit. Resolved modules are deps even when they don't fold.
        let cached = {
            let guard = self.cache();
            guard
                .get(&path)
                .filter(|cached| cached.source_hash == source_hash)
                .map(Arc::clone)
        };
        if let Some(cached) = cached
            && self.provenance_fresh(&cached.deps)
            && self.unresolved_still_missing(&cached.unresolved)
        {
            self.seed_session_dependencies(session, &cached.deps);
            session.insert(path.clone(), Arc::clone(&cached));
            return Ok((path, cached));
        }

        // Cycle guard: `a.ts ↔ b.ts` would otherwise overflow the stack.
        let guard_key = (path.clone(), name.to_owned());
        {
            let mut in_flight = context.in_flight.borrow_mut();
            if !in_flight.insert(guard_key.clone()) {
                return Err(Box::new(CrossFileResolution::at_path(
                    path,
                    Some(source_hash),
                    None,
                    Vec::new(),
                )));
            }
        }

        let (module, deps, unresolved) =
            Self::extract_exports(context, &path, &source, matchers, tokens, prefix);
        context.in_flight.borrow_mut().remove(&guard_key);

        let cached = Arc::new(CachedFileExports {
            source_hash,
            exports: module.exports,
            declared: module.declared,
            star_sources: module.star_sources,
            re_exports: module.re_exports,
            deps,
            unresolved,
        });
        self.cache().insert(path.clone(), Arc::clone(&cached));
        session.insert(path.clone(), Arc::clone(&cached));
        Ok((path, cached))
    }

    /// `export { local as name } from './module'`, or an imported binding exported again.
    fn resolve_re_export(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
        path: &Path,
        cached: &CachedFileExports,
        specifier: &str,
        local: &str,
    ) -> CrossFileResolution {
        let mut resolution =
            CrossFileResolution::from_cached(path.to_path_buf(), cached, request.name);
        resolution.declared = true;
        let guard_key = (path.to_path_buf(), Some(request.name.to_owned()));
        if !context.forwarding.borrow_mut().insert(guard_key.clone()) {
            return resolution;
        }
        let nested = self.resolve_named_export(
            context,
            CrossFileRequest {
                from_file: path,
                specifier,
                name: local,
                ..request
            },
        );
        context.forwarding.borrow_mut().remove(&guard_key);
        resolution.forward_to(nested);
        resolution
    }

    /// `export * from` re-exports every name the barrel doesn't declare itself, except `default`.
    fn resolve_through_stars(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
        path: &Path,
        cached: &CachedFileExports,
    ) -> CrossFileResolution {
        let mut resolution =
            CrossFileResolution::from_cached(path.to_path_buf(), cached, request.name);
        let (index, _) = self.star_index(context, request, path, cached);
        match index.names.get(request.name) {
            None => {}
            Some(StarProvider::Ambiguous) => resolution.declared = true,
            Some(StarProvider::One { star, .. }) => {
                let nested = self.resolve_named_export(
                    context,
                    CrossFileRequest {
                        from_file: path,
                        specifier: &cached.star_sources[*star],
                        ..request
                    },
                );
                resolution.declared = nested.declared;
                resolution.forward_to(nested);
            }
        }
        resolution
    }

    fn star_index(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
        path: &Path,
        cached: &CachedFileExports,
    ) -> (Arc<StarIndex>, bool) {
        let existing = self
            .star_indexes()
            .get(path)
            .filter(|index| index.source_hash == cached.source_hash)
            .map(Arc::clone);
        if let Some(index) = existing {
            return (index, true);
        }
        let (index, complete) = self.build_star_index(context, request, path, cached);
        let index = Arc::new(index);
        // Built while a barrel cycle was open, the index may lack names from the barrel being built.
        if complete {
            self.star_indexes()
                .insert(path.to_path_buf(), Arc::clone(&index));
        }
        (index, complete)
    }

    fn build_star_index(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
        path: &Path,
        cached: &CachedFileExports,
    ) -> (StarIndex, bool) {
        let mut index = StarIndex {
            source_hash: cached.source_hash,
            names: FxHashMap::default(),
        };
        let guard_key = (path.to_path_buf(), None);
        if !context.forwarding.borrow_mut().insert(guard_key.clone()) {
            return (index, false);
        }
        let mut complete = true;
        for (star, specifier) in cached.star_sources.iter().enumerate() {
            // Package barrels hold nothing foldable and can be large.
            let Some(target) = self.resolve_auto(path, specifier) else {
                continue;
            };
            if is_package_path(&target) {
                continue;
            }
            let child_request = CrossFileRequest {
                from_file: path,
                specifier,
                ..request
            };
            let Ok((child_path, child)) = self.load_module(context, child_request) else {
                continue;
            };
            let origin: Arc<Path> = Arc::from(child_path.as_path());
            for name in &child.declared {
                if name != "default" {
                    add_star_provider(&mut index.names, name, star, &origin);
                }
            }
            if child.star_sources.is_empty() {
                continue;
            }
            let (child_index, child_complete) =
                self.star_index(context, child_request, &child_path, &child);
            complete &= child_complete;
            for (name, provider) in &child_index.names {
                if child.declared.contains(name) {
                    continue;
                }
                match provider {
                    StarProvider::One { origin, .. } => {
                        add_star_provider(&mut index.names, name, star, origin);
                    }
                    StarProvider::Ambiguous => {
                        index.names.insert(name.clone(), StarProvider::Ambiguous);
                    }
                }
            }
        }
        context.forwarding.borrow_mut().remove(&guard_key);
        (index, complete)
    }

    fn star_indexes(&self) -> std::sync::MutexGuard<'_, FxHashMap<PathBuf, Arc<StarIndex>>> {
        self.star_indexes
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }
}

/// Two paths to the same declaring module are one binding (a diamond), not an ambiguity.
fn add_star_provider(
    names: &mut FxHashMap<String, StarProvider>,
    name: &str,
    star: usize,
    origin: &Arc<Path>,
) {
    match names.get(name) {
        None => {
            names.insert(
                name.to_owned(),
                StarProvider::One {
                    star,
                    origin: Arc::clone(origin),
                },
            );
        }
        Some(StarProvider::One {
            origin: existing, ..
        }) if existing == origin => {}
        Some(_) => {
            names.insert(name.to_owned(), StarProvider::Ambiguous);
        }
    }
}

impl<F: FileSystem + Clone> CrossFileLookup for ResolverImpl<F> {
    fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf> {
        if !<F as oxc_resolver::FileSystem>::metadata(&self.fs, from_file)
            .is_ok_and(oxc_resolver::FileMetadata::is_file)
        {
            return None;
        }
        self.inner
            .resolve_file(from_file, specifier)
            .ok()
            .map(|resolution| forward_slash_path(&resolution.full_path()))
    }

    /// Deleted files canonicalize the parent so unlink events still match.
    fn dependency_key(&self, path: &Path) -> Option<PathBuf> {
        let fs = &self.fs;
        if let Ok(real) = <F as oxc_resolver::FileSystem>::canonicalize(fs, path) {
            return Some(forward_slash_path(&real));
        }
        let parent = <F as oxc_resolver::FileSystem>::canonicalize(fs, path.parent()?).ok()?;
        Some(forward_slash_path(&parent.join(path.file_name()?)))
    }

    fn check_resolvable(&self, dependencies: &[UnresolvedCrossFileDependency]) -> Vec<bool> {
        let resolver = ResolverGeneric::<F>::new_with_file_system(
            self.fs.clone(),
            self.inner.options().clone(),
        );
        dependencies
            .iter()
            .map(|dep| {
                resolve_with(
                    &self.fs,
                    &resolver,
                    Path::new(&dep.from_file),
                    &dep.specifier,
                )
                .is_some()
            })
            .collect()
    }

    fn clear_resolution_cache(&self) {
        self.inner.clear_cache();
    }

    fn resolve_named_export(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
    ) -> CrossFileResolution {
        let (path, cached) = match self.load_module(context, request) {
            Ok(module) => module,
            Err(resolution) => return *resolution,
        };
        if let Some((specifier, local)) = cached.re_exports.get(request.name) {
            return self.resolve_re_export(context, request, &path, &cached, specifier, local);
        }
        if cached.declared.contains(request.name)
            || request.name == "default"
            || cached.star_sources.is_empty()
        {
            return CrossFileResolution::from_cached(path, &cached, request.name);
        }
        self.resolve_through_stars(context, request, &path, &cached)
    }

    fn cache_len(&self) -> usize {
        self.cache().len()
    }
}

/// What a module exports: the folded values, every name it declares, and its `export *` sources.
struct ModuleExports {
    exports: FileExports,
    declared: FxHashSet<String>,
    star_sources: Vec<String>,
    re_exports: ReExports,
}

fn collect_exports(
    program: &Program<'_>,
    resolver: &Resolver<'_, '_>,
    matched: &[MatchedImport],
) -> ModuleExports {
    let mut module = ModuleExports {
        exports: FxHashMap::default(),
        declared: FxHashSet::default(),
        star_sources: Vec::new(),
        re_exports: FxHashMap::default(),
    };
    let imported = imported_bindings(program);

    for stmt in &program.body {
        match stmt {
            Statement::ExportNamedDeclaration(decl) => {
                if !decl.export_kind.is_type() {
                    declare_named(decl, &mut module.declared);
                }
                collect_from_named(decl, &imported, resolver, matched, &mut module);
            }
            Statement::ExportDefaultDeclaration(_) => {
                module.declared.insert("default".to_owned());
            }
            Statement::ExportAllDeclaration(decl) if !decl.export_kind.is_type() => {
                match &decl.exported {
                    Some(exported) => {
                        module.declared.insert(module_export_name(exported));
                    }
                    None => module.star_sources.push(decl.source.value.to_string()),
                }
            }
            _ => {}
        }
    }

    module
}

fn declare_named(decl: &ExportNamedDeclaration<'_>, declared: &mut FxHashSet<String>) {
    match &decl.declaration {
        Some(Declaration::VariableDeclaration(var)) if !var.declare => {
            for declarator in &var.declarations {
                for id in declarator.id.get_binding_identifiers() {
                    declared.insert(id.name.to_string());
                }
            }
        }
        // Types and ambient declarations have no runtime binding.
        Some(declaration) if declaration.is_type() || declaration.declare() => {}
        Some(declaration) => {
            if let Some(id) = declaration.id() {
                declared.insert(id.name.to_string());
            }
        }
        None => {}
    }
    for specifier in &decl.specifiers {
        if !specifier.export_kind.is_type() {
            declared.insert(module_export_name(&specifier.exported));
        }
    }
}

/// `cva` / `sva` when `callee` is a recipe factory imported in this file.
fn recipe_factory_name(callee: &Expression<'_>, matched: &[MatchedImport]) -> Option<String> {
    let Expression::Identifier(id) = callee.get_inner_expression() else {
        return None;
    };
    matched
        .iter()
        .find(|import| {
            import.alias == id.name.as_str()
                && import.category == MatchCategory::Css
                && matches!(import.name.as_str(), "cva" | "sva")
        })
        .map(|import| import.name.clone())
}

fn exported_recipe(
    init: &Expression<'_>,
    resolver: &Resolver<'_, '_>,
    matched: &[MatchedImport],
) -> Option<ExportedRecipe> {
    let Expression::CallExpression(call) = init.get_inner_expression() else {
        return None;
    };
    let factory = recipe_factory_name(&call.callee, matched)?;
    let arg = call.arguments.first()?.as_expression()?;
    let config = expression_to_literal(arg, Some(resolver))?;
    Some(ExportedRecipe { factory, config })
}

/// Local name → (module specifier, imported name) for each value import, so `export { x }` of an
/// imported binding forwards like `export { x } from`.
fn imported_bindings(program: &Program<'_>) -> FxHashMap<String, (String, String)> {
    let mut bindings = FxHashMap::default();
    for stmt in &program.body {
        let Statement::ImportDeclaration(decl) = stmt else {
            continue;
        };
        if decl.import_kind.is_type() {
            continue;
        }
        for specifier in decl.specifiers.iter().flatten() {
            let imported = match specifier {
                ImportDeclarationSpecifier::ImportSpecifier(spec)
                    if !spec.import_kind.is_type() =>
                {
                    module_export_name(&spec.imported)
                }
                ImportDeclarationSpecifier::ImportDefaultSpecifier(_) => "default".to_owned(),
                _ => continue,
            };
            bindings.insert(
                specifier.local().name.to_string(),
                (decl.source.value.to_string(), imported),
            );
        }
    }
    bindings
}

fn collect_from_named(
    decl: &ExportNamedDeclaration<'_>,
    imported: &FxHashMap<String, (String, String)>,
    resolver: &Resolver<'_, '_>,
    matched: &[MatchedImport],
    module: &mut ModuleExports,
) {
    let out = &mut module.exports;
    match &decl.declaration {
        Some(Declaration::VariableDeclaration(var)) => {
            collect_from_var(var, resolver, matched, out);
            return;
        }
        Some(Declaration::FunctionDeclaration(func)) => {
            if let Some(id) = &func.id
                && let Some(pure_fn) = lower_function(func, Some(resolver))
            {
                out.insert(id.name.to_string(), ExportEntry::PureFn(pure_fn));
            }
            return;
        }
        _ => {}
    }
    if decl.export_kind.is_type() {
        return;
    }

    for specifier in &decl.specifiers {
        if specifier.export_kind.is_type() {
            continue;
        }
        let exported = module_export_name(&specifier.exported);
        let local = module_export_name(&specifier.local);
        let forwarded = match &decl.source {
            Some(source) => Some((source.value.to_string(), local.clone())),
            None => imported.get(&local).cloned(),
        };
        if let Some(target) = forwarded {
            module.re_exports.insert(exported, target);
            continue;
        }
        let entry = exported_value(&local, resolver).or_else(|| {
            resolver
                .lookup_root_pure_fn(&local)
                .map(ExportEntry::PureFn)
        });
        if let Some(entry) = entry {
            module.exports.insert(exported, entry);
        }
    }
}

fn collect_from_var(
    var: &VariableDeclaration<'_>,
    resolver: &Resolver<'_, '_>,
    matched: &[MatchedImport],
    out: &mut FileExports,
) {
    for declarator in &var.declarations {
        let Some(init) = &declarator.init else {
            continue;
        };
        match &declarator.id {
            BindingPattern::BindingIdentifier(id) => {
                if let Some(recipe) = exported_recipe(init, resolver, matched) {
                    out.insert(id.name.to_string(), ExportEntry::Recipe(recipe));
                } else if let Some(entry) = exported_value(id.name.as_str(), resolver) {
                    out.insert(id.name.to_string(), entry);
                } else if let Some(pure_fn) = lower_callable_expr(init, Some(resolver)) {
                    out.insert(id.name.to_string(), ExportEntry::PureFn(pure_fn));
                }
            }
            BindingPattern::ObjectPattern(_) | BindingPattern::ArrayPattern(_) => {
                collect_pattern_bindings(&declarator.id, resolver, out);
            }
            BindingPattern::AssignmentPattern(_) => {}
        }
    }
}

#[must_use]
fn exported_value(name: &str, resolver: &Resolver<'_, '_>) -> Option<ExportEntry> {
    let known_value = resolver.resolve_root_name(name);

    if matches!(
        &known_value,
        Some(
            Literal::String(_)
                | Literal::Number(_)
                | Literal::Bool(_)
                | Literal::Null
                | Literal::Token { .. }
        )
    ) {
        return known_value.map(ExportEntry::Literal);
    }

    let Some(style_value) = resolver
        .resolve_root_style_tree(name)
        .and_then(into_project_literal)
    else {
        return known_value.map(ExportEntry::Literal);
    };

    if known_value.as_ref() == Some(&style_value) {
        return Some(ExportEntry::Literal(style_value));
    }

    Some(ExportEntry::StyleFallback {
        known_value,
        style_value,
    })
}

fn collect_pattern_bindings(
    pattern: &BindingPattern<'_>,
    resolver: &Resolver<'_, '_>,
    out: &mut FileExports,
) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            if let Some(entry) = exported_value(id.name.as_str(), resolver) {
                out.insert(id.name.to_string(), entry);
            }
        }
        BindingPattern::ObjectPattern(object) => {
            for prop in &object.properties {
                collect_pattern_bindings(&prop.value, resolver, out);
            }
            if let Some(rest) = &object.rest {
                collect_pattern_bindings(&rest.argument, resolver, out);
            }
        }
        BindingPattern::ArrayPattern(array) => {
            for pattern in array.elements.iter().flatten() {
                collect_pattern_bindings(pattern, resolver, out);
            }
            if let Some(rest) = &array.rest {
                collect_pattern_bindings(&rest.argument, resolver, out);
            }
        }
        BindingPattern::AssignmentPattern(assignment) => {
            collect_pattern_bindings(&assignment.left, resolver, out);
        }
    }
}
