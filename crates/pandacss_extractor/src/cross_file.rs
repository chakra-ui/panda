//! Cross-file import resolution: when the same-file [`crate::Resolver`] hits
//! `import { x } from './tokens'`, this module loads the target file and
//! folds the requested export. Module resolution itself is `oxc_resolver`
//! (relative paths, extensions, tsconfig paths, package.json `exports`).
//!
//! `CrossFileResolver` type-erases over [`pandacss_fs::FileSystem`] so
//! consumer types (`ExtractorConfig`, `Project`) stay non-generic; the
//! concrete impl is `ResolverImpl<F>` behind a `Box<dyn CrossFileLookup>`.
//!
//! Cache: `path → HashMap<exported_name, ExportEntry>`. Each file parses and
//! folds once per session, then drops its AST.
//!
//! Folds top-level `export const X = <foldable>` values and simple pure
//! function exports (arrow / function) into an owned descriptor.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    BindingPattern, Declaration, ExportNamedDeclaration, Program, Statement, VariableDeclaration,
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
    Matchers, TokenDictionary, collect_imports, imports::module_export_name, match_import_records,
    scope::Resolver,
};

/// A folded named export: a style literal or a pure callable descriptor.
#[derive(Debug, Clone)]
pub(crate) enum ExportEntry {
    Literal(Literal),
    PureFn(OwnedPureFn),
}

type FileExports = FxHashMap<String, ExportEntry>;

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

/// Public type-erased resolver. Wraps a generic `ResolverImpl<F>` behind
/// a trait object so `ExtractorConfig` doesn't need to be generic over the
/// filesystem impl.
pub struct CrossFileResolver {
    inner: Box<dyn CrossFileLookup>,
}

impl std::fmt::Debug for CrossFileResolver {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CrossFileResolver")
            .field("cached_files", &self.inner.cache_len())
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
    /// Construct with the default OS filesystem.
    #[cfg(feature = "os")]
    #[must_use]
    pub fn new() -> Self {
        Self::with_fs(pandacss_fs::OsFileSystem::default())
    }

    /// Construct with a custom filesystem. Use this from wasm builds
    /// (with [`pandacss_fs::MemoryFileSystem`]) or for testing.
    pub fn with_fs<F: FileSystem + Clone + 'static>(fs: F) -> Self {
        Self::with_fs_and_options(fs, default_resolve_options())
    }

    /// Construct with custom FS *and* resolver options (tsconfig paths,
    /// alternative extension order, etc.).
    pub fn with_fs_and_options<F: FileSystem + Clone + 'static>(
        fs: F,
        options: ResolveOptions,
    ) -> Self {
        Self {
            inner: Box::new(ResolverImpl::new(fs, options)),
        }
    }

    pub(crate) fn as_lookup(&self) -> &dyn CrossFileLookup {
        self.inner.as_ref()
    }

    #[must_use]
    pub fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf> {
        self.inner.resolve_path(from_file, specifier)
    }
}

/// A cross-file lookup: the folded export plus the resolved module path
/// (recorded as a build dependency even when the value doesn't fold).
pub(crate) struct CrossFileResolution {
    pub(crate) entry: Option<ExportEntry>,
    pub(crate) path: Option<PathBuf>,
}

/// Object-safe interface the rest of the crate consumes. Keeps the
/// `F: FileSystem` parameter contained inside `cross_file.rs`.
pub(crate) trait CrossFileLookup: Send + Sync {
    fn resolve_named_export(
        &self,
        from_file: &Path,
        specifier: &str,
        name: &str,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
    ) -> CrossFileResolution;

    fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf>;

    fn cache_len(&self) -> usize;
}

/// Concrete generic implementation. Constructed from any
/// `F: FileSystem + Clone` and then boxed behind `CrossFileLookup`.
struct ResolverImpl<F: FileSystem + Clone> {
    inner: ResolverGeneric<F>,
    fs: F,
    cache: Mutex<FxHashMap<PathBuf, FileExports>>,
    in_flight: Mutex<FxHashSet<(PathBuf, String)>>,
}

impl<F: FileSystem + Clone> ResolverImpl<F> {
    fn new(fs: F, options: ResolveOptions) -> Self {
        let inner = ResolverGeneric::<F>::new_with_file_system(fs.clone(), options);
        Self {
            inner,
            fs,
            cache: Mutex::default(),
            in_flight: Mutex::default(),
        }
    }

    fn extract_exports(
        &self,
        path: &Path,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
    ) -> Option<FileExports> {
        let source = <F as oxc_resolver::FileSystem>::read_to_string(&self.fs, path).ok()?;
        let allocator = Allocator::default();
        let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
        let parser_return = Parser::new(&allocator, &source, source_type).parse();
        let matched = matchers.map_or_else(Vec::new, |matchers| {
            let imports = collect_imports(&parser_return.program);
            match_import_records(&imports, matchers)
        });
        let resolver = Resolver::build_with_cross_file_lookup(crate::scope::ResolverBuildInput {
            program: &parser_return.program,
            matched: &matched,
            matchers,
            tokens,
            cross_file: Some(self),
            source_path: Some(path.to_path_buf()),
            line_index: None,
            pattern_raw_transform: None,
        });

        // Oxc returns a partial AST on parse errors — walk what we get.
        Some(collect_exports(
            &parser_return.program,
            path,
            self,
            &resolver,
        ))
    }
}

impl<F: FileSystem + Clone> CrossFileLookup for ResolverImpl<F> {
    fn resolve_path(&self, from_file: &Path, specifier: &str) -> Option<PathBuf> {
        // `resolve_file` is the only API that honors `TsconfigDiscovery::Auto`,
        // but it panics on a non-file path — guard first.
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

    fn resolve_named_export(
        &self,
        from_file: &Path,
        specifier: &str,
        name: &str,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
    ) -> CrossFileResolution {
        let none = || CrossFileResolution {
            entry: None,
            path: None,
        };
        let Some(directory) = from_file.parent() else {
            return none();
        };
        let Ok(resolution) = self.inner.resolve(directory, specifier) else {
            return none();
        };
        let path = to_forward_slash(&resolution.full_path());

        // A resolved module is a build dependency even if the export doesn't
        // fold — record `path` on every remaining exit.
        if let Some(exports) = self
            .cache
            .lock()
            .expect("cross-file cache poisoned")
            .get(&path)
        {
            return CrossFileResolution {
                entry: exports.get(name).cloned(),
                path: Some(path),
            };
        }

        // Cycle guard: `a.ts ↔ b.ts` would otherwise overflow the stack.
        let guard_key = (path.clone(), name.to_owned());
        {
            let mut in_flight = self.in_flight.lock().expect("cross-file guard poisoned");
            if !in_flight.insert(guard_key.clone()) {
                return CrossFileResolution {
                    entry: None,
                    path: Some(path),
                };
            }
        }

        let exports = self
            .extract_exports(&path, matchers, tokens)
            .unwrap_or_default();
        self.in_flight
            .lock()
            .expect("cross-file guard poisoned")
            .remove(&guard_key);

        let entry = exports.get(name).cloned();
        self.cache
            .lock()
            .expect("cross-file cache poisoned")
            .insert(path.clone(), exports);
        CrossFileResolution {
            entry,
            path: Some(path),
        }
    }

    fn cache_len(&self) -> usize {
        self.cache.lock().expect("cross-file cache poisoned").len()
    }
}

fn collect_exports(
    program: &Program<'_>,
    path: &Path,
    lookup: &dyn CrossFileLookup,
    resolver: &Resolver<'_, '_>,
) -> FileExports {
    let mut exports = FxHashMap::default();

    for stmt in &program.body {
        let Statement::ExportNamedDeclaration(decl) = stmt else {
            continue;
        };
        collect_from_named(decl, path, lookup, resolver, &mut exports);
    }

    exports
}

fn collect_from_named(
    decl: &ExportNamedDeclaration<'_>,
    path: &Path,
    lookup: &dyn CrossFileLookup,
    resolver: &Resolver<'_, '_>,
    out: &mut FileExports,
) {
    match &decl.declaration {
        Some(Declaration::VariableDeclaration(var)) => {
            collect_from_var(var, resolver, out);
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
            // Transitive re-export deps aren't threaded back to the importer yet.
            lookup
                .resolve_named_export(
                    path,
                    source.value.as_str(),
                    &local,
                    resolver.matchers(),
                    resolver.tokens(),
                )
                .entry
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
    out: &mut FileExports,
) {
    for declarator in &var.declarations {
        let Some(init) = &declarator.init else {
            continue;
        };
        match &declarator.id {
            BindingPattern::BindingIdentifier(id) => {
                if let Some(value) = expression_to_literal(init, Some(resolver)) {
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
