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
use std::path::PathBuf;

use oxc_ast::AstKind;
use oxc_ast::ast::{
    BindingPattern, CallExpression, Expression, IdentifierReference, PropertyKey,
    VariableDeclarator,
};
use oxc_semantic::{Semantic, SemanticBuilder, SymbolFlags, SymbolId};
use rustc_hash::FxHashMap;
use tokens::TokenDictionary;

use crate::Literal;
use crate::cross_file::CrossFileResolver;
use crate::literal::expression_to_literal;
use crate::matcher::{MatchCategory, MatchedImport};

/// Per-file symbol/scope index plus a memo of resolved literal values.
///
/// Beyond plain identifier folding, the resolver also recognizes Panda
/// `token()` / `token.var()` calls and resolves them through the supplied
/// [`TokenDictionary`]. To do that it needs to know which local names
/// correspond to a `tokens`-category import — hence the alias table.
pub(crate) struct Resolver<'a> {
    semantic: Semantic<'a>,
    /// Memo of resolved literals keyed by `SymbolId`. `FxHashMap` because
    /// keys are tiny u32 newtypes — `SipHash` overhead is pure waste here.
    cache: RefCell<FxHashMap<SymbolId, ResolutionState>>,
    /// Local-name → matched import. Borrowed from the caller so the visitor
    /// and the resolver share a single source of truth.
    aliases: FxHashMap<&'a str, &'a MatchedImport>,
    tokens: Option<&'a TokenDictionary>,
    /// Cross-file resolver — consulted when an identifier resolves to
    /// an `import` specifier so `import { x } from './tokens'` folds
    /// to the exported value at extraction time.
    cross_file: Option<&'a CrossFileResolver>,
    /// Absolute path of the file we're currently resolving. Used as the
    /// "from" file for cross-file specifier resolution.
    source_path: Option<PathBuf>,
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
    /// Build a `Semantic` from the parsed program and wrap it. Pass the
    /// matched imports so the resolver can answer "is this identifier a
    /// `token` import?" without re-plumbing through `VisitorContext`.
    pub(crate) fn build(
        program: &'a oxc_ast::ast::Program<'a>,
        matched: &'a [MatchedImport],
        tokens: Option<&'a TokenDictionary>,
        cross_file: Option<&'a CrossFileResolver>,
        source_path: Option<PathBuf>,
    ) -> Self {
        let semantic = SemanticBuilder::new().build(program).semantic;
        Self {
            semantic,
            cache: RefCell::default(),
            aliases: matched.iter().map(|m| (m.alias.as_str(), m)).collect(),
            tokens,
            cross_file,
            source_path,
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

    /// Resolve a Panda `token(...)` / `token.var(...)` call to its dictionary
    /// value. Returns `None` when:
    /// - no token dictionary is configured,
    /// - the callee doesn't resolve to a Panda `tokens`-category import,
    /// - the local is shadowed by a function param / block-scoped binding,
    /// - the first argument isn't a string literal (token paths are static
    ///   by design — dynamic paths require runtime resolution),
    /// - the path isn't in the dictionary and no fallback was provided.
    ///
    /// Mirrors the JS extractor's behavior in `maybe-box-node.ts` so that
    /// `css({ color: token('colors.red.500') })` folds to a string literal
    /// at extraction time.
    pub(crate) fn resolve_token_call(&self, call: &CallExpression<'_>) -> Option<Literal> {
        let dict = self.tokens?;

        // Determine the callee shape: bare `token(path)` vs `token.var(path)`.
        let (token_ident, is_var) = match &call.callee {
            Expression::Identifier(id) => (id, false),
            Expression::StaticMemberExpression(member) => {
                let Expression::Identifier(id) = &member.object else {
                    return None;
                };
                if member.property.name.as_str() != "var" {
                    return None;
                }
                (id, true)
            }
            _ => return None,
        };

        // Must be a Panda `tokens`-category import, and not shadowed.
        let matched = self.aliases.get(token_ident.name.as_str())?;
        if matched.category != MatchCategory::Tokens {
            return None;
        }
        if !self.is_import_binding(token_ident) {
            return None;
        }

        // First arg: token path (must be a string literal).
        let path_arg = call.arguments.first()?.as_expression()?;
        let Literal::String(path) = expression_to_literal(path_arg, Some(self))? else {
            return None;
        };

        // Optional fallback: second arg as string literal.
        let fallback = call
            .arguments
            .get(1)
            .and_then(|a| a.as_expression())
            .and_then(|e| expression_to_literal(e, Some(self)))
            .and_then(|l| match l {
                Literal::String(s) => Some(s),
                _ => None,
            });

        let resolved = if is_var {
            dict.get_var(&path, fallback.as_deref())
        } else {
            dict.get(&path, fallback.as_deref())
        };
        resolved.map(Literal::String)
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

        // Imports: hand off to the cross-file resolver when configured.
        // Without one, we still bail — the JS extractor's `findIdentifier
        // ValueDeclaration` also returns `undefined` for unresolved
        // import specifiers under `skipTraverseFiles`.
        if flags.contains(SymbolFlags::Import) {
            return self.resolve_import_symbol(symbol_id);
        }
        // Mutation invalidates folding for variables. Enum symbols also
        // get checked because `enum X { … }; X = …` is technically
        // possible (even if rare) and we want the same single-assignment
        // stance everywhere.
        if scoping.symbol_is_mutated(symbol_id) {
            return None;
        }

        let decl_node = self.semantic.symbol_declaration(symbol_id);
        match decl_node.kind() {
            AstKind::VariableDeclarator(declarator) if flags.intersects(SymbolFlags::Variable) => {
                self.resolve_declarator(declarator, symbol_id)
            }
            // TypeScript enum: synthesize a `Literal::Object` from the
            // member initializers so `Sizes.Small` falls out of the
            // existing static-member-access path. Auto-incremented
            // numeric members are skipped (no initializer) — matches the
            // JS extractor, which also drops uninitialized members.
            AstKind::TSEnumDeclaration(decl) => Some(resolve_enum_as_object(decl)),
            // Function parameter with a `TSTypeLiteral` annotation —
            // `function f(x: { color: 'red' })` lets `x.color` fold via
            // the type's readonly literal members. Matches the JS path
            // in `findIdentifierValueDeclaration` (ParameterDeclaration
            // with TypeLiteral fallback).
            AstKind::FormalParameter(param) => resolve_param_as_type_literal(param),
            // `BindingRestElement`, `CatchParameter`, `FunctionDeclaration`,
            // class declarations, type aliases — none carry a static
            // initializer we want to fold for style extraction.
            _ => None,
        }
    }

    /// Walk up from an import-bound symbol to its parent `ImportDeclaration`
    /// to recover the `(specifier, imported_name)` pair, then hand off to
    /// the cross-file resolver. Returns `None` when:
    /// - no cross-file resolver is configured,
    /// - the symbol isn't actually an import (defensive — caller checked),
    /// - the import is a namespace / default specifier (we only resolve
    ///   named-export consts in this slice),
    /// - the resolver can't locate or fold the target.
    fn resolve_import_symbol(&self, symbol_id: SymbolId) -> Option<Literal> {
        let cross_file = self.cross_file?;
        let from_file = self.source_path.as_ref()?;

        // The symbol's declaration node points at the binding identifier
        // *inside* the ImportSpecifier. Walk up its ancestors to find the
        // enclosing ImportDeclaration and the specifier itself.
        let decl_node = self.semantic.symbol_declaration(symbol_id);
        let nodes = self.semantic.nodes();
        let mut import_module: Option<&str> = None;
        let mut imported_name: Option<&str> = None;

        for kind in std::iter::once(decl_node.kind()).chain(
            nodes
                .ancestors(decl_node.id())
                .map(oxc_semantic::AstNode::kind),
        ) {
            match kind {
                AstKind::ImportSpecifier(spec) => {
                    // `import { x as y } from '…'` — `imported` is `x`,
                    // the symbol's local name is `y`. We resolve by the
                    // exported (imported) name.
                    imported_name = Some(spec.imported.name().as_str());
                }
                AstKind::ImportDefaultSpecifier(_) | AstKind::ImportNamespaceSpecifier(_) => {
                    // Default and namespace imports don't map cleanly to
                    // a single named export. Bail.
                    return None;
                }
                AstKind::ImportDeclaration(decl) => {
                    import_module = Some(decl.source.value.as_str());
                    break;
                }
                _ => {}
            }
        }

        let module = import_module?;
        let name = imported_name?;
        cross_file.resolve_named_export(from_file, module, name)
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
        BindingPattern::AssignmentPattern(asgn) => {
            // `{ x = 'red' } = src` — JS semantics: take `src.x` when
            // present, fall back to the default expression when it's
            // `undefined`. We model "undefined" as `Literal::Null` (the
            // sentinel used elsewhere for missing keys), so the choice
            // is: source present → recurse with source; source missing
            // → fold the default and recurse with that.
            if matches!(source, Literal::Null) {
                // Default kicks in. The default expression folds without
                // a Resolver — literal defaults work; identifier defaults
                // (`x = otherConst`) don't yet. JS extractor has the
                // same limitation outside its main scope walker.
                let default_value = expression_to_literal(&asgn.right, None)?;
                resolve_pattern_path(&asgn.left, &default_value, target)
            } else {
                resolve_pattern_path(&asgn.left, source, target)
            }
        }
    }
}

/// `{ ...rest }` in object destructure isn't folded yet — `rest` would
/// bind to the source minus the explicitly-named keys, requiring us to
/// track which keys were consumed up the recursion. For style code,
/// rest in destructure is rare enough that we drop and document.
#[allow(dead_code, reason = "documentation marker for future support")]
fn _rest_unsupported() {}

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

// --- enum + type-literal folding ---

/// Build a synthetic `Literal::Object` from a TypeScript enum's member
/// initializers. Members without an initializer (auto-incremented
/// numeric values) are skipped — same as the JS extractor's enum path.
fn resolve_enum_as_object(decl: &oxc_ast::ast::TSEnumDeclaration<'_>) -> Literal {
    let mut entries: Vec<(String, Literal)> = Vec::with_capacity(decl.body.members.len());
    for member in &decl.body.members {
        let name = match &member.id {
            oxc_ast::ast::TSEnumMemberName::Identifier(id) => id.name.to_string(),
            oxc_ast::ast::TSEnumMemberName::String(s) => s.value.to_string(),
            // Computed enum member names — drop, matches JS extractor.
            _ => continue,
        };
        let Some(init) = member.initializer.as_ref() else {
            continue;
        };
        // Initializer is evaluated without a Resolver — enum member
        // values reference enum scope, but for the common case (string
        // / numeric literals) the resolver-free path is sufficient.
        if let Some(value) = expression_to_literal(init, None) {
            entries.push((name, value));
        }
    }
    Literal::Object(entries)
}

/// Fold a function parameter's TypeScript `TSTypeLiteral` annotation
/// into a synthetic `Literal::Object`. Each readonly-literal member
/// (`color: 'red'`, `size: 4`) contributes a key/value. Non-literal
/// member types or missing annotations drop.
fn resolve_param_as_type_literal(param: &oxc_ast::ast::FormalParameter<'_>) -> Option<Literal> {
    let annotation = param.type_annotation.as_ref()?;
    let oxc_ast::ast::TSType::TSTypeLiteral(type_lit) = &annotation.type_annotation else {
        return None;
    };
    let mut entries: Vec<(String, Literal)> = Vec::with_capacity(type_lit.members.len());
    for member in &type_lit.members {
        let oxc_ast::ast::TSSignature::TSPropertySignature(prop) = member else {
            continue;
        };
        let key = match &prop.key {
            PropertyKey::StaticIdentifier(id) => id.name.to_string(),
            PropertyKey::StringLiteral(s) => s.value.to_string(),
            _ => continue,
        };
        let Some(ann) = prop.type_annotation.as_ref() else {
            continue;
        };
        if let Some(value) = ts_type_to_literal(&ann.type_annotation) {
            entries.push((key, value));
        }
    }
    Some(Literal::Object(entries))
}

/// Convert a TypeScript type node to a `Literal` when it's a static
/// literal type (`'red'`, `4`, `true`, `null`). Anything else (unions,
/// references, generics) returns `None`.
fn ts_type_to_literal(ts_type: &oxc_ast::ast::TSType<'_>) -> Option<Literal> {
    let oxc_ast::ast::TSType::TSLiteralType(lit_type) = ts_type else {
        return None;
    };
    match &lit_type.literal {
        oxc_ast::ast::TSLiteral::StringLiteral(s) => Some(Literal::String(s.value.to_string())),
        oxc_ast::ast::TSLiteral::NumericLiteral(n) => Some(Literal::Number(n.value)),
        oxc_ast::ast::TSLiteral::BooleanLiteral(b) => Some(Literal::Bool(b.value)),
        // `null` lives in TSType::TSNullKeyword, not in TSLiteral — so
        // we don't handle it here. `BigInt`, template literals, and
        // unary-prefixed literals (`-1`) all drop.
        _ => None,
    }
}
