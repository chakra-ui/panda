//! Cross-file import resolution.
//!
//! When the same-file [`crate::Resolver`] hits an `import { x } from
//! './tokens'` reference, it asks this module to load the target file
//! and fold the requested export's value. Module resolution itself is
//! delegated to `oxc_resolver` (relative paths, extension probing,
//! tsconfig paths, package.json `exports`).
//!
//! `CrossFileResolver` is type-erased over the [`pandacss_fs::FileSystem`]
//! impl so consumer types (`ExtractorConfig`, `Project`) stay
//! non-generic. The concrete impl lives in `ResolverImpl<F>` behind a
//! `Box<dyn CrossFileLookup>`.
//!
//! Cache shape is `path → HashMap<exported_name, Literal>`: each file is
//! parsed and folded exactly once per session, and the AST is dropped
//! after exports are extracted so we don't keep every imported file's
//! `Program` alive.
//!
//! Folds top-level `export const X = <foldable>`. Does *not* yet fold
//! re-exports, `export default`, or non-const declarations — add when the
//! simple case proves out.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    BindingPattern, Declaration, ExportNamedDeclaration, ModuleExportName, Program, Statement,
    VariableDeclaration,
};
use oxc_parser::Parser;
use oxc_resolver::{ResolveOptions, ResolverGeneric};
use oxc_span::SourceType;
use pandacss_fs::FileSystem;
use rustc_hash::{FxHashMap, FxHashSet};

use crate::Literal;
use crate::literal::expression_to_literal;
use crate::{Matchers, TokenDictionary, collect_imports, match_import_records, scope::Resolver};

type FileExports = FxHashMap<String, Literal>;

fn default_resolve_options() -> ResolveOptions {
    ResolveOptions {
        extensions: [".tsx", ".ts", ".jsx", ".mjs", ".cjs", ".js", ".json"]
            .iter()
            .map(|s| (*s).to_string())
            .collect(),
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

    /// Returns `None` when the specifier doesn't resolve, the file can't
    /// be read or parsed, `name` isn't a foldable `const` export, or
    /// we're already mid-load for the same file (cycle guard).
    #[must_use]
    pub fn resolve_named_export(
        &self,
        from_file: &Path,
        specifier: &str,
        name: &str,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
    ) -> Option<Literal> {
        self.inner
            .resolve_named_export(from_file, specifier, name, matchers, tokens)
    }

    pub(crate) fn as_lookup(&self) -> &dyn CrossFileLookup {
        self.inner.as_ref()
    }
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
    ) -> Option<Literal>;

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
        let resolver = Resolver::build_with_cross_file_lookup(
            &parser_return.program,
            &matched,
            tokens,
            Some(self),
            matchers,
            Some(path.to_path_buf()),
        );

        // Oxc returns a partial AST on parse errors; walk what we get,
        // matching the JS extractor's recovery behavior.
        Some(collect_exports(
            &parser_return.program,
            path,
            self,
            &resolver,
        ))
    }
}

impl<F: FileSystem + Clone> CrossFileLookup for ResolverImpl<F> {
    fn resolve_named_export(
        &self,
        from_file: &Path,
        specifier: &str,
        name: &str,
        matchers: Option<&Matchers>,
        tokens: Option<&TokenDictionary>,
    ) -> Option<Literal> {
        let directory = from_file.parent()?;
        let resolution = self.inner.resolve(directory, specifier).ok()?;
        let path = resolution.full_path();

        if let Some(exports) = self
            .cache
            .lock()
            .expect("cross-file cache poisoned")
            .get(&path)
        {
            return exports.get(name).cloned();
        }

        // Cycle guard: `a.ts ↔ b.ts` would otherwise overflow the stack.
        let guard_key = (path.clone(), name.to_owned());
        {
            let mut in_flight = self.in_flight.lock().expect("cross-file guard poisoned");
            if !in_flight.insert(guard_key.clone()) {
                return None;
            }
        }

        let exports = self
            .extract_exports(&path, matchers, tokens)
            .unwrap_or_default();
        self.in_flight
            .lock()
            .expect("cross-file guard poisoned")
            .remove(&guard_key);

        let value = exports.get(name).cloned();
        self.cache
            .lock()
            .expect("cross-file cache poisoned")
            .insert(path, exports);
        value
    }

    fn cache_len(&self) -> usize {
        self.cache.lock().expect("cross-file cache poisoned").len()
    }
}

fn collect_exports(
    program: &Program<'_>,
    path: &Path,
    lookup: &dyn CrossFileLookup,
    resolver: &Resolver<'_>,
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
    resolver: &Resolver<'_>,
    out: &mut FileExports,
) {
    if let Some(Declaration::VariableDeclaration(var)) = &decl.declaration {
        collect_from_var(var, resolver, out);
        return;
    }

    for specifier in &decl.specifiers {
        let exported = module_export_name(&specifier.exported);
        let local = module_export_name(&specifier.local);
        let value = if let Some(source) = &decl.source {
            lookup.resolve_named_export(
                path,
                source.value.as_str(),
                &local,
                resolver.matchers(),
                resolver.tokens(),
            )
        } else {
            resolver.resolve_root_name(&local)
        };
        if let Some(value) = value {
            out.insert(exported, value);
        }
    }
}

fn collect_from_var(var: &VariableDeclaration<'_>, resolver: &Resolver<'_>, out: &mut FileExports) {
    for declarator in &var.declarations {
        let Some(init) = &declarator.init else {
            continue;
        };
        match &declarator.id {
            BindingPattern::BindingIdentifier(id) => {
                if let Some(value) = expression_to_literal(init, Some(resolver)) {
                    out.insert(id.name.to_string(), value);
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
    resolver: &Resolver<'_>,
    out: &mut FileExports,
) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            if let Some(value) = resolver.resolve_root_name(id.name.as_str()) {
                out.insert(id.name.to_string(), value);
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

fn module_export_name(name: &ModuleExportName<'_>) -> String {
    name.name().to_string()
}
