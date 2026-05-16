//! Cross-file import resolution.
//!
//! When the same-file [`crate::Resolver`] hits an `import { x } from
//! './tokens'` reference, it asks this module to load the target file
//! and fold the requested export's value. Module resolution itself is
//! delegated to `oxc_resolver` (relative paths, extension probing,
//! tsconfig paths, package.json `exports`).
//!
//! Cache shape is `path → HashMap<exported_name, Literal>`: each file is
//! parsed and folded exactly once per session, and the AST is dropped
//! after exports are extracted so we don't keep every imported file's
//! `Program` alive.
//!
//! Folds top-level `export const X = <foldable>`. Does *not* yet fold
//! re-exports, `export default`, or non-const declarations — add when the
//! simple case proves out.

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

/// Per-session cross-file import resolver. Not `Clone` — wrap in `Arc`
/// for shared ownership across sessions.
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

impl CrossFileResolver {
    /// Default ESM/CJS resolution with `.tsx, .ts, .jsx, .mjs, .cjs, .js,
    /// .json` extension probing.
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

    #[must_use]
    pub fn with_options(options: ResolveOptions) -> Self {
        Self {
            inner: OxcResolver::new(options),
            cache: RefCell::default(),
            in_flight: RefCell::default(),
        }
    }

    /// Returns `None` when the specifier doesn't resolve, the file can't
    /// be read or parsed, `name` isn't a foldable `const` export, or
    /// we're already mid-load for the same file (cycle guard).
    pub fn resolve_named_export(
        &self,
        from_file: &Path,
        specifier: &str,
        name: &str,
    ) -> Option<Literal> {
        let directory = from_file.parent()?;
        let resolution = self.inner.resolve(directory, specifier).ok()?;
        let path = resolution.full_path();

        if let Some(exports) = self.cache.borrow().get(&path) {
            return exports.get(name).cloned();
        }

        // Cycle guard: `a.ts ↔ b.ts` would otherwise overflow the stack.
        {
            let mut in_flight = self.in_flight.borrow_mut();
            if !in_flight.insert(path.clone()) {
                return None;
            }
        }

        let exports = Self::extract_exports(&path).unwrap_or_default();
        self.in_flight.borrow_mut().remove(&path);

        let value = exports.get(name).cloned();
        self.cache.borrow_mut().insert(path, exports);
        value
    }

    fn extract_exports(path: &Path) -> Option<FileExports> {
        let source = std::fs::read_to_string(path).ok()?;
        let allocator = Allocator::default();
        let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
        let parser_return = Parser::new(&allocator, &source, source_type).parse();

        // Oxc returns a partial AST on parse errors; walk what we get,
        // matching the JS extractor's recovery behavior.
        let program = &parser_return.program;
        Some(collect_exports(program))
    }
}

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

// TODO(port): destructuring on the LHS is skipped — those patterns need a
// re-export of the original RHS, which the JS extractor doesn't fold
// cleanly either.
fn collect_from_var(var: &VariableDeclaration<'_>, out: &mut FileExports) {
    for declarator in &var.declarations {
        let BindingPattern::BindingIdentifier(id) = &declarator.id else {
            continue;
        };
        let Some(init) = &declarator.init else {
            continue;
        };
        // PORT NOTE: pass `None` for the resolver — the loaded file has
        // no Resolver context here. Chained file-local references need a
        // per-file Resolver; punt to follow-up. The common
        // `export const X = <object/string/array>` shape still folds.
        if let Some(value) = expression_to_literal(init, None) {
            out.insert(id.name.to_string(), value);
        }
    }
}
