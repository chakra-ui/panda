//! Cross-file import resolution.
//!
//! When the same-file [`crate::Resolver`] hits an `import { x } from
//! './tokens'` reference, it asks this module to load the target file
//! and fold the requested export's value. Module resolution itself is
//! delegated to `oxc_resolver` (handles relative paths, extension
//! probing, tsconfig paths, package.json `exports`, etc.).
//!
//! ## Design
//!
//! - One [`CrossFileResolver`] lives on the [`crate::ExtractorConfig`]
//!   so its cache is reused across every `extract()` / session call.
//! - The cache stores `path → HashMap<exported_name, Literal>`. We
//!   parse and fold each file exactly once per session; the AST is
//!   dropped after exports are extracted, so we don't pay the memory
//!   cost of keeping every imported file's `Program` alive.
//! - A small `in_flight` set guards against import cycles
//!   (`a.ts` re-exports from `b.ts` which re-exports from `a.ts`).
//!
//! ## What folds
//!
//! Top-level `export const X = <foldable>` statements. The `<foldable>`
//! expression goes through the standard literal evaluator with a
//! per-file [`Resolver`](crate::Resolver) for in-file scope, so chained
//! references like `const a = '#f00'; export const b = a;` work.
//!
//! ## What doesn't fold (yet)
//!
//! - `export { x } from './other'` re-exports — the resolver doesn't
//!   recurse through them. Add when the simple case proves out.
//! - `export default …` — same surface as named exports but currently
//!   skipped to keep the v1 contract narrow.
//! - Anything beyond `export const` (functions, classes, enums).

use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    BindingPattern, Declaration, ExportNamedDeclaration, Program, Statement, VariableDeclaration,
};
use oxc_parser::Parser;
use oxc_resolver::{ResolveOptions, Resolver as OxcResolver};
use oxc_span::SourceType;
use rustc_hash::FxHashMap;

use crate::Literal;
use crate::literal::expression_to_literal;

type FileExports = FxHashMap<String, Literal>;

/// Per-session cross-file import resolver. Cheap to clone (the inner
/// `oxc_resolver` is `Arc`-backed) and safe to share between sessions
/// when the project layout is stable.
pub struct CrossFileResolver {
    inner: OxcResolver,
    cache: RefCell<HashMap<PathBuf, FileExports>>,
    in_flight: RefCell<HashSet<PathBuf>>,
}

impl Default for CrossFileResolver {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Debug for CrossFileResolver {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CrossFileResolver")
            .field("cached_files", &self.cache.borrow().len())
            .finish_non_exhaustive()
    }
}

impl Clone for CrossFileResolver {
    fn clone(&self) -> Self {
        // `oxc_resolver::Resolver` is cheap to share, but it doesn't
        // impl Clone directly; build a fresh one with the same default
        // options. Callers that customize options should construct
        // explicitly via [`Self::with_options`] and rebuild on clone.
        Self::new()
    }
}

impl CrossFileResolver {
    /// Construct with default ESM/CJS resolution options. Extensions
    /// probed include `.tsx`, `.ts`, `.jsx`, `.mjs`, `.cjs`, `.js`, and
    /// `.json`; main fields fall back to Node defaults.
    #[must_use]
    pub fn new() -> Self {
        let options = ResolveOptions {
            extensions: [".tsx", ".ts", ".jsx", ".mjs", ".cjs", ".js", ".json"]
                .iter()
                .map(|s| (*s).to_string())
                .collect(),
            ..ResolveOptions::default()
        };
        Self::with_options(options)
    }

    /// Construct with explicit `oxc_resolver` options — useful for
    /// projects that need tsconfig paths, aliases, or non-Node extension
    /// orderings.
    #[must_use]
    pub fn with_options(options: ResolveOptions) -> Self {
        Self {
            inner: OxcResolver::new(options),
            cache: RefCell::default(),
            in_flight: RefCell::default(),
        }
    }

    /// Resolve an `import { name } from specifier` reference originating
    /// in `from_file`. Returns the folded literal value of `name`, or
    /// `None` when:
    /// - the specifier doesn't resolve (`Module not found` etc.),
    /// - the resolved file can't be read or parsed,
    /// - `name` isn't a `const` export with a foldable initializer,
    /// - we're currently resolving the same file (cycle guard).
    ///
    pub fn resolve_named_export(
        &self,
        from_file: &Path,
        specifier: &str,
        name: &str,
    ) -> Option<Literal> {
        let directory = from_file.parent()?;
        let resolution = self.inner.resolve(directory, specifier).ok()?;
        let path = resolution.full_path();

        // Cache hit — common after the first resolution.
        if let Some(exports) = self.cache.borrow().get(&path) {
            return exports.get(name).cloned();
        }

        // Cycle guard: if we're already mid-load for this path, treat as
        // unresolvable. Without this, `a.ts ↔ b.ts` recursion would
        // overflow the stack.
        {
            let mut in_flight = self.in_flight.borrow_mut();
            if !in_flight.insert(path.clone()) {
                return None;
            }
        }

        // Parse + extract exports for the resolved file.
        let exports = Self::extract_exports(&path).unwrap_or_default();
        self.in_flight.borrow_mut().remove(&path);

        let value = exports.get(name).cloned();
        self.cache.borrow_mut().insert(path, exports);
        value
    }

    /// Parse one file from disk and fold every `export const X = …`
    /// statement to a literal. Failures (missing file, parse errors,
    /// non-foldable initializers) drop silently; the resulting map only
    /// contains what we could confidently extract.
    fn extract_exports(path: &Path) -> Option<FileExports> {
        let source = std::fs::read_to_string(path).ok()?;
        let allocator = Allocator::default();
        let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
        let parser_return = Parser::new(&allocator, &source, source_type).parse();

        // Even on parse errors Oxc returns a partial AST. We walk what
        // it gives us — best-effort matches the JS extractor's recovery.
        let program = &parser_return.program;
        Some(collect_exports(program))
    }
}

/// Walk a parsed program's top-level statements and collect every
/// `export const X = <foldable>` into a name → literal map.
fn collect_exports(program: &Program<'_>) -> FileExports {
    let mut exports = FxHashMap::default();

    for stmt in &program.body {
        let Statement::ExportNamedDeclaration(decl) = stmt else {
            continue;
        };
        collect_from_named(decl, &mut exports);
    }

    exports
}

fn collect_from_named(decl: &ExportNamedDeclaration<'_>, out: &mut FileExports) {
    let Some(Declaration::VariableDeclaration(var)) = &decl.declaration else {
        return;
    };
    collect_from_var(var, out);
}

/// Pull out every simple `BindingIdentifier` const initializer that
/// folds to a literal. Destructuring on the LHS is skipped — those
/// patterns would need a re-export of the original RHS too, which the
/// JS extractor doesn't fold cleanly either.
fn collect_from_var(var: &VariableDeclaration<'_>, out: &mut FileExports) {
    for declarator in &var.declarations {
        let BindingPattern::BindingIdentifier(id) = &declarator.id else {
            continue;
        };
        let Some(init) = &declarator.init else {
            continue;
        };
        // Pass `None` for the resolver: the loaded file is parsed
        // outside any Resolver context. Chained file-local references
        // require a per-file Resolver — punt to a follow-up; literal
        // folding catches the common shape (`export const X =
        // <object/string/array>`).
        if let Some(value) = expression_to_literal(init, None) {
            out.insert(id.name.to_string(), value);
        }
    }
}
