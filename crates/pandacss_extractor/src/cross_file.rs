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
    BindingPattern, Declaration, ExportNamedDeclaration, Expression, Program, Statement,
    VariableDeclaration,
};
use oxc_parser::Parser;
use oxc_resolver::{ResolveOptions, ResolverGeneric, TsconfigDiscovery};
use oxc_span::SourceType;
use pandacss_fs::FileSystem;
use rustc_hash::{FxHashMap, FxHashSet};

use crate::Literal;
use crate::literal::expression_to_literal;
use crate::pure_fn::{OwnedPureFn, lower_callable_expr, lower_function};
use crate::{
    MatchCategory, MatchedImport, Matchers, TokenDictionary, collect_imports,
    extract::UnresolvedCrossFileDependency, imports::module_export_name, match_import_records,
    scope::Resolver,
};

/// Folded named export: style literal, pure callable, or inline recipe.
#[derive(Debug, Clone)]
pub(crate) enum ExportEntry {
    Literal(Literal),
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

/// Modules read while folding and the hash seen; `None` = unreadable.
type Provenance = Vec<(PathBuf, Option<u64>)>;
type UnresolvedDependencies = Vec<(PathBuf, String)>;

struct CachedFileExports {
    source_hash: u64,
    exports: FileExports,
    /// Modules folded while collecting this file's exports. A hash miss busts this entry.
    deps: Provenance,
    /// Failed nested resolutions. A newly resolvable request invalidates this entry.
    unresolved: UnresolvedDependencies,
}

fn to_forward_slash(path: &Path) -> PathBuf {
    PathBuf::from(path.to_string_lossy().replace('\\', "/"))
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

    /// Whether any previously unresolved dependency can now be resolved.
    #[must_use]
    pub fn any_resolvable(&self, dependencies: &[UnresolvedCrossFileDependency]) -> bool {
        self.inner.any_resolvable(dependencies)
    }

    /// Clear cached filesystem lookups before retrying unresolved dependencies.
    pub fn clear_resolution_cache(&self) {
        self.inner.clear_resolution_cache();
    }
}

impl CrossFileSession {
    fn cached_resolution(&self, path: &Path, name: &str) -> Option<CrossFileResolution> {
        let files = self.files.borrow();
        let cached = files.get(path)?;
        Some(CrossFileResolution::from_cached(
            path.to_path_buf(),
            cached,
            name,
        ))
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
    pub(crate) path: Option<PathBuf>,
    pub(crate) source_hash: Option<u64>,
    pub(crate) provenance: Provenance,
    pub(crate) unresolved: UnresolvedDependencies,
}

impl CrossFileResolution {
    fn none() -> Self {
        Self {
            entry: None,
            path: None,
            source_hash: None,
            provenance: Vec::new(),
            unresolved: Vec::new(),
        }
    }

    fn unresolved(from_file: &Path, specifier: &str) -> Self {
        Self {
            entry: None,
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

    fn from_cached(path: PathBuf, cached: &CachedFileExports, name: &str) -> Self {
        Self::at_path(
            path,
            Some(cached.source_hash),
            cached.exports.get(name).cloned(),
            cached.deps.clone(),
        )
        .with_unresolved(cached.unresolved.clone())
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

    fn any_resolvable(&self, dependencies: &[UnresolvedCrossFileDependency]) -> bool;

    fn clear_resolution_cache(&self);

    fn cache_len(&self) -> usize;
}

struct ResolverImpl<F: FileSystem + Clone> {
    inner: ResolverGeneric<F>,
    fs: F,
    cache: Mutex<FxHashMap<PathBuf, Arc<CachedFileExports>>>,
}

impl<F: FileSystem + Clone> ResolverImpl<F> {
    fn new(fs: F, options: ResolveOptions) -> Self {
        let inner = ResolverGeneric::<F>::new_with_file_system(fs.clone(), options);
        Self {
            inner,
            fs,
            cache: Mutex::default(),
        }
    }

    fn extract_exports(
        context: &CrossFileContext<'_>,
        path: &Path,
        source: &str,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
        prefix: &str,
    ) -> (FileExports, Provenance, UnresolvedDependencies) {
        let allocator = Allocator::default();
        let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
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
        let exports = collect_exports(&parser_return.program, path, context, &resolver, &matched);
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
        let cache = self.cache.lock().expect("cross-file cache poisoned");
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
        let Some(directory) = from_file.parent() else {
            return false;
        };
        self.inner.resolve(directory, specifier).is_ok()
    }
}

impl<F: FileSystem + Clone> CrossFileLookup for ResolverImpl<F> {
    fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf> {
        // `resolve_file` is the only API that honors `TsconfigDiscovery::Auto`.
        // It panics on a non-file path, so guard first.
        if !<F as oxc_resolver::FileSystem>::metadata(&self.fs, from_file)
            .is_ok_and(oxc_resolver::FileMetadata::is_file)
        {
            return None;
        }
        self.inner
            .resolve_file(from_file, specifier)
            .ok()
            .map(|resolution| to_forward_slash(&resolution.full_path()))
    }

    /// Deleted files canonicalize the parent so unlink events still match.
    fn dependency_key(&self, path: &Path) -> Option<PathBuf> {
        let fs = &self.fs;
        if let Ok(real) = <F as oxc_resolver::FileSystem>::canonicalize(fs, path) {
            return Some(to_forward_slash(&real));
        }
        let parent = <F as oxc_resolver::FileSystem>::canonicalize(fs, path.parent()?).ok()?;
        Some(to_forward_slash(&parent.join(path.file_name()?)))
    }

    fn any_resolvable(&self, dependencies: &[UnresolvedCrossFileDependency]) -> bool {
        let resolver = ResolverGeneric::<F>::new_with_file_system(
            self.fs.clone(),
            self.inner.options().clone(),
        );
        dependencies.iter().any(|dep| {
            Path::new(&dep.from_file)
                .parent()
                .is_some_and(|directory| resolver.resolve(directory, &dep.specifier).is_ok())
        })
    }

    fn clear_resolution_cache(&self) {
        self.inner.clear_cache();
    }

    fn resolve_named_export(
        &self,
        context: &CrossFileContext<'_>,
        request: CrossFileRequest<'_>,
    ) -> CrossFileResolution {
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
            return CrossFileResolution::none();
        };
        if session.is_unresolved(directory, specifier) {
            return CrossFileResolution::unresolved(from_file, specifier);
        }
        let Ok(resolution) = self.inner.resolve(directory, specifier) else {
            session.record_unresolved(directory, specifier);
            return CrossFileResolution::unresolved(from_file, specifier);
        };
        let path = to_forward_slash(&resolution.full_path());

        if let Some(resolution) = session.cached_resolution(&path, name) {
            return resolution;
        }
        if session.is_unreadable(&path) {
            return CrossFileResolution::at_path(path, None, None, Vec::new());
        }

        // Read-fail drops the entry so a deleted file never serves stale exports.
        let Ok(source) = <F as oxc_resolver::FileSystem>::read_to_string(&self.fs, &path) else {
            self.cache
                .lock()
                .expect("cross-file cache poisoned")
                .remove(&path);
            session.record_unreadable(path.clone());
            return CrossFileResolution::at_path(path, None, None, Vec::new());
        };
        let source_hash = pandacss_shared::fx_hash(&source);

        // Record `path` on every remaining exit. Resolved modules are deps even when they don't fold.
        let cached = {
            let guard = self.cache.lock().expect("cross-file cache poisoned");
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
            let result = CrossFileResolution::from_cached(path.clone(), &cached, name);
            session.insert(path, cached);
            return result;
        }

        // Cycle guard: `a.ts ↔ b.ts` would otherwise overflow the stack.
        let guard_key = (path.clone(), name.to_owned());
        {
            let mut in_flight = context.in_flight.borrow_mut();
            if !in_flight.insert(guard_key.clone()) {
                return CrossFileResolution::at_path(path, Some(source_hash), None, Vec::new());
            }
        }

        let (exports, deps, unresolved) =
            Self::extract_exports(context, &path, &source, matchers, tokens, prefix);
        context.in_flight.borrow_mut().remove(&guard_key);

        let cached = Arc::new(CachedFileExports {
            source_hash,
            exports,
            deps,
            unresolved,
        });
        let result = CrossFileResolution::from_cached(path.clone(), &cached, name);
        self.cache
            .lock()
            .expect("cross-file cache poisoned")
            .insert(path.clone(), Arc::clone(&cached));
        session.insert(path, cached);
        result
    }

    fn cache_len(&self) -> usize {
        self.cache.lock().expect("cross-file cache poisoned").len()
    }
}

fn collect_exports(
    program: &Program<'_>,
    path: &Path,
    context: &CrossFileContext<'_>,
    resolver: &Resolver<'_, '_>,
    matched: &[MatchedImport],
) -> FileExports {
    let mut exports = FxHashMap::default();

    for stmt in &program.body {
        let Statement::ExportNamedDeclaration(decl) = stmt else {
            continue;
        };
        collect_from_named(decl, path, context, resolver, matched, &mut exports);
    }

    exports
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

fn collect_from_named(
    decl: &ExportNamedDeclaration<'_>,
    path: &Path,
    context: &CrossFileContext<'_>,
    resolver: &Resolver<'_, '_>,
    matched: &[MatchedImport],
    out: &mut FileExports,
) {
    match &decl.declaration {
        Some(Declaration::VariableDeclaration(var)) => {
            collect_from_var(var, resolver, matched, out);
            return;
        }
        Some(Declaration::FunctionDeclaration(func)) => {
            if let (Some(id), Some(pure_fn)) = (&func.id, lower_function(func, Some(resolver))) {
                out.insert(id.name.to_string(), ExportEntry::PureFn(pure_fn));
            }
            return;
        }
        _ => {}
    }

    for specifier in &decl.specifiers {
        let exported = module_export_name(&specifier.exported);
        let local = module_export_name(&specifier.local);
        let entry = if let Some(source) = &decl.source {
            let resolution = context.resolve_named_export(
                path,
                source.value.as_str(),
                &local,
                resolver.matchers(),
                resolver.tokens(),
                resolver.prefix(),
            );
            resolver.record_cross_file_resolution(&resolution);
            resolution.entry
        } else if let Some(value) = resolver.resolve_root_name(&local) {
            Some(ExportEntry::Literal(value))
        } else {
            resolver
                .lookup_root_pure_fn(&local)
                .map(ExportEntry::PureFn)
        };
        if let Some(entry) = entry {
            out.insert(exported, entry);
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
                } else if let Some(value) = expression_to_literal(init, Some(resolver)) {
                    out.insert(id.name.to_string(), ExportEntry::Literal(value));
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

fn collect_pattern_bindings(
    pattern: &BindingPattern<'_>,
    resolver: &Resolver<'_, '_>,
    out: &mut FileExports,
) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            if let Some(value) = resolver.resolve_root_name(id.name.as_str()) {
                out.insert(id.name.to_string(), ExportEntry::Literal(value));
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
