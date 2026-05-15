//! Same-file static evaluator for identifier and member-access resolution.
//!
//! Wraps `oxc_semantic` to answer two questions the call/JSX visitors need:
//!
//! 1. *"Is this identifier a Panda import, or a local that shadows one?"*
//!    `Resolver::is_import_binding` consults the symbol table so
//!    `function f(css) { css({}) }` no longer over-extracts.
//!
//! 2. *"Does this identifier resolve to a literal value?"*
//!    `Resolver::resolve_identifier` walks the declaration and folds the
//!    initializer through the same `expression_to_literal` pipeline,
//!    matching ts-evaluator semantics: same-file `const`/`let`/`var` with
//!    a literal initializer, never mutated, never an import.
//!
//! Member access (`obj.x`, `obj['x']`) and array indexing (`xs[0]`) are
//! handled in `literal::expression_to_literal` once an identifier resolves
//! to an `Object` or `Array` literal — the resolver itself only deals in
//! whole-identifier resolution.
//!
//! ## What is *not* folded (matches ts-evaluator)
//!
//! - Mutated bindings (`let x = 1; x = 2;`).
//! - Function parameters — no static value available.
//! - Function declarations, classes — extraction targets a value, not a body.
//! - Imports — cross-file resolution is a separate slice (see `token()`
//!   resolution in Phase 5.2).
//! - Default values in destructuring patterns (`const { x = 1 } = obj`).
//! - TDZ violations are not checked; we rely on visit order to surface them
//!   as `None` when an identifier is referenced before its declaration is
//!   reached during evaluation.

use std::cell::RefCell;
use std::collections::HashMap;

use oxc_ast::AstKind;
use oxc_ast::ast::{BindingPattern, IdentifierReference, PropertyKey, VariableDeclarator};
use oxc_semantic::{Semantic, SemanticBuilder, SymbolFlags, SymbolId};

use crate::Literal;
use crate::literal::expression_to_literal;

/// Per-file symbol/scope index plus a memo of resolved literal values.
pub(crate) struct Resolver<'a> {
    semantic: Semantic<'a>,
    cache: RefCell<HashMap<SymbolId, ResolutionState>>,
}

/// Cache slot for `resolve_symbol`. `InProgress` guards against cycles like
/// `const a = b; const b = a;` (rare, but cheap to defend against).
#[derive(Clone)]
enum ResolutionState {
    InProgress,
    Resolved(Literal),
    Unresolvable,
}

impl<'a> Resolver<'a> {
    /// Build a `Semantic` from the parsed program and wrap it.
    pub(crate) fn build(program: &'a oxc_ast::ast::Program<'a>) -> Self {
        let semantic = SemanticBuilder::new().build(program).semantic;
        Self {
            semantic,
            cache: RefCell::default(),
        }
    }

    /// `Some(symbol_id)` when the identifier binds to a declaration in this
    /// file. `None` when it's a free/global reference (no declaration found).
    pub(crate) fn symbol_for_identifier(
        &self,
        ident: &IdentifierReference<'_>,
    ) -> Option<SymbolId> {
        // `reference_id` is set unconditionally by the semantic builder.
        // Bail safely if a caller somehow built us without semantic.
        let reference_id = ident.reference_id.get()?;
        self.semantic
            .scoping()
            .get_reference(reference_id)
            .symbol_id()
    }

    /// `true` iff the identifier resolves to an `import` specifier.
    /// Callers use this to gate Panda call/JSX extraction so that a local
    /// shadowing the imported name is not treated as a Panda usage.
    ///
    /// When the symbol is unresolved (free variable), we conservatively
    /// return `true`: such names usually refer to globals or implicit
    /// imports the binder couldn't see, and the name-based alias lookup
    /// downstream is authoritative.
    pub(crate) fn is_import_binding(&self, ident: &IdentifierReference<'_>) -> bool {
        let Some(symbol_id) = self.symbol_for_identifier(ident) else {
            return true;
        };
        self.semantic
            .scoping()
            .symbol_flags(symbol_id)
            .contains(SymbolFlags::Import)
    }

    /// Resolve an identifier reference to its constant literal value, if it
    /// has one. Honors caching, mutation tracking, and destructuring paths.
    pub(crate) fn resolve_identifier(&self, ident: &IdentifierReference<'_>) -> Option<Literal> {
        let symbol_id = self.symbol_for_identifier(ident)?;
        self.resolve_symbol(symbol_id)
    }

    fn resolve_symbol(&self, symbol_id: SymbolId) -> Option<Literal> {
        if let Some(state) = self.cache.borrow().get(&symbol_id).cloned() {
            return match state {
                ResolutionState::Resolved(lit) => Some(lit),
                ResolutionState::InProgress | ResolutionState::Unresolvable => None,
            };
        }
        self.cache
            .borrow_mut()
            .insert(symbol_id, ResolutionState::InProgress);
        let result = self.compute_symbol(symbol_id);
        let state = match &result {
            Some(lit) => ResolutionState::Resolved(lit.clone()),
            None => ResolutionState::Unresolvable,
        };
        self.cache.borrow_mut().insert(symbol_id, state);
        result
    }

    fn compute_symbol(&self, symbol_id: SymbolId) -> Option<Literal> {
        let scoping = self.semantic.scoping();
        let flags = scoping.symbol_flags(symbol_id);

        // Imports: cross-file, not part of this slice.
        if flags.contains(SymbolFlags::Import) {
            return None;
        }
        // Functions, classes, type-only bindings: no literal value.
        if !flags.intersects(SymbolFlags::Variable) {
            return None;
        }
        // Any binding that is written to after declaration is unsafe to fold.
        // `symbol_is_mutated` covers `x = ...`, `x++`, `x += ...`, etc.,
        // matching ts-evaluator's single-assignment stance.
        if scoping.symbol_is_mutated(symbol_id) {
            return None;
        }

        let decl_node = self.semantic.symbol_declaration(symbol_id);
        match decl_node.kind() {
            AstKind::VariableDeclarator(declarator) => {
                self.resolve_declarator(declarator, symbol_id)
            }
            // `FormalParameter`, `BindingRestElement`, `CatchParameter`,
            // `FunctionDeclaration`, etc. all reach here. None carry a static
            // initializer we want to fold for style extraction.
            _ => None,
        }
    }

    fn resolve_declarator(
        &self,
        declarator: &'a VariableDeclarator<'a>,
        target_symbol: SymbolId,
    ) -> Option<Literal> {
        let init = declarator.init.as_ref()?;
        match &declarator.id {
            BindingPattern::BindingIdentifier(id) => {
                // Simple `const X = init;` — fold the initializer through
                // the resolver-aware path so it can chain further idents.
                if id.symbol_id.get() != Some(target_symbol) {
                    return None;
                }
                expression_to_literal(init, Some(self))
            }
            BindingPattern::ObjectPattern(_) | BindingPattern::ArrayPattern(_) => {
                // Destructuring: fold the source once, then walk the pattern
                // to extract the slice that lands in `target_symbol`.
                let source = expression_to_literal(init, Some(self))?;
                resolve_pattern_path(&declarator.id, &source, target_symbol)
            }
            BindingPattern::AssignmentPattern(_) => {
                // `const x = init` where `id` itself has a default — only
                // appears in destructuring contexts and is handled there.
                None
            }
        }
    }
}

/// Walk a destructuring pattern paired with its source literal until the
/// `target` symbol is found. Returns the slice of `source` that the target
/// binds to. `None` when:
/// - the source shape doesn't match the pattern (e.g. array pattern on an
///   object literal),
/// - the target lives inside an unsupported sub-pattern (rest element,
///   default value),
/// - the target's key isn't present in the source.
fn resolve_pattern_path(
    pattern: &BindingPattern<'_>,
    source: &Literal,
    target: SymbolId,
) -> Option<Literal> {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            if id.symbol_id.get() == Some(target) {
                Some(source.clone())
            } else {
                None
            }
        }
        BindingPattern::ObjectPattern(obj) => {
            let Literal::Object(entries) = source else {
                return None;
            };
            for prop in &obj.properties {
                // Skip computed keys we can't statically name. Numeric
                // string keys (`{ '0': v }`) are normalized to `"0"` by
                // `binding_property_key` for parity with object literals.
                let key = binding_property_key(&prop.key, prop.computed)?;
                let slice = entries
                    .iter()
                    .find(|(k, _)| k == &key)
                    .map_or(&Literal::Null, |(_, v)| v);
                if let Some(found) = resolve_pattern_path(&prop.value, slice, target) {
                    return Some(found);
                }
            }
            // `...rest` doesn't carry a single symbol path we can target.
            None
        }
        BindingPattern::ArrayPattern(arr) => {
            let Literal::Array(items) = source else {
                return None;
            };
            for (i, elem) in arr.elements.iter().enumerate() {
                let Some(pat) = elem else {
                    continue;
                };
                let slice = items.get(i).unwrap_or(&Literal::Null);
                if let Some(found) = resolve_pattern_path(pat, slice, target) {
                    return Some(found);
                }
            }
            None
        }
        BindingPattern::AssignmentPattern(_) => {
            // `{ x = 1 } = src` — defaults need runtime semantics
            // (`src.x ?? 1`). Skipping keeps the slice tractable; the JS
            // extractor doesn't fold these either when the source is missing.
            None
        }
    }
}

fn binding_property_key(key: &PropertyKey<'_>, computed: bool) -> Option<String> {
    if !computed {
        return match key {
            PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
            PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
            PropertyKey::NumericLiteral(n) => Some(n.value.to_string()),
            _ => None,
        };
    }
    // Computed binding keys (`const { [k]: v } = ...`) need k to be a static
    // value. Without an expression evaluator that doesn't recurse through
    // the resolver, we drop these for now.
    None
}
