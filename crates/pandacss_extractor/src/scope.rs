//! Same-file static evaluator. Answers "is this identifier a Panda import (or
//! a local shadowing one)?" and "does it resolve to a literal?", matching
//! ts-evaluator: same-file const/let/var with a literal initializer, never
//! mutated, never an import.
//!
//! Member access and array indexing happen in `literal::expression_to_literal`
//! once an identifier resolves to an Object/Array — this module only resolves
//! whole identifiers. Pure callables (`f()`, IIFEs, imported helpers) are
//! lowered/applied via [`crate::pure_fn`] from [`Resolver::resolve_pure_call`].

use std::cell::RefCell;
use std::path::PathBuf;

use oxc_ast::AstKind;
use oxc_ast::ast::{
    BindingPattern, CallExpression, Expression, IdentifierReference, PropertyKey,
    VariableDeclarator,
};
use oxc_semantic::{Semantic, SemanticBuilder, SymbolFlags, SymbolId};
use oxc_span::GetSpan;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use rustc_hash::{FxHashMap, FxHashSet};
use smallvec::SmallVec;

use crate::cross_file::{CrossFileLookup, ExportEntry};
use crate::literal::expression_to_literal;
use crate::matcher::{MatchCategory, MatchedImport, Matchers};
use crate::pure_fn::{
    OwnedPureFn, apply_pure_fn, fold_call_args, lower_callable_expr, lower_function,
};
use crate::style_tree::{
    StyleTree, expression_to_style_tree, literal_to_style_tree, project_literal,
};
use crate::{ImportBindingFacts, ImportRecord, ImportSpecifierKind, Literal, TokenRef};

pub(crate) type PatternRawTransformFn<'a> =
    dyn FnMut(&str, &Literal) -> Result<Option<Literal>, crate::Diagnostic> + 'a;
pub(crate) type PatternRawTransformCell<'a> = RefCell<&'a mut PatternRawTransformFn<'a>>;

/// Per-file symbol/scope index plus a memo of resolved literal values. Also
/// resolves Panda `token()` / `token.var()` calls through the supplied
/// [`TokenDictionary`], using the alias table to map local names back to
/// their `tokens`-category import.
pub(crate) struct Resolver<'a, 'cb> {
    semantic: Semantic<'a>,
    // PERF(port): FxHashMap keys are u32 newtypes — SipHash overhead is waste.
    cache: RefCell<FxHashMap<SymbolId, ResolutionState>>,
    /// Same-file [`StyleTree`] memo (spans). Literal cache stays encode-shaped.
    /// Cross-file stays Literal-only — see `design-notes/style-tree.md`.
    style_cache: RefCell<FxHashMap<SymbolId, StyleResolutionState>>,
    /// Memo of lowered pure callables. Separate from [`Self::cache`] so a bare
    /// function binding stays non-Literal while `f()` can still fold.
    fn_cache: RefCell<FxHashMap<SymbolId, PureFnResolutionState>>,
    aliases: FxHashMap<&'a str, &'a MatchedImport>,
    matchers: Option<&'a Matchers>,
    tokens: Option<&'a TokenDictionary>,
    cross_file: Option<&'a dyn CrossFileLookup>,
    source_path: Option<PathBuf>,
    line_index: Option<&'a crate::LineIndex<'a>>,
    diagnostics: RefCell<Vec<crate::Diagnostic>>,
    token_refs: RefCell<Vec<TokenRef>>,
    /// Resolved paths of cross-file modules read during this file's extraction,
    /// surfaced as transform build dependencies for watch invalidation.
    cross_file_deps: RefCell<FxHashSet<PathBuf>>,
    pattern_raw_transform: Option<&'cb PatternRawTransformCell<'cb>>,
}

struct TokenCallResolution {
    value: String,
    ref_path: String,
    token_path: Option<String>,
    needs_css_var: bool,
}

/// `InProgress` guards against cycles like `const a = b; const b = a;`.
#[derive(Clone)]
enum ResolutionState {
    InProgress,
    Resolved(Literal),
    Unresolvable,
}

/// Cycle-guarded [`StyleTree`] memo state.
#[derive(Clone)]
enum StyleResolutionState {
    InProgress,
    Resolved(StyleTree),
    Unresolvable,
}

/// `InProgress` guards against a pure fn calling itself (directly, or once
/// pure-fn bodies are allowed to contain calls, transitively).
#[derive(Clone)]
enum PureFnResolutionState {
    InProgress,
    Resolved(OwnedPureFn),
    Unresolvable,
}

/// Construction bag for [`Resolver::build`] / [`Resolver::build_with_cross_file_lookup`].
pub(crate) struct ResolverBuildInput<'a, 'cb> {
    pub program: &'a oxc_ast::ast::Program<'a>,
    pub matched: &'a [MatchedImport],
    pub matchers: Option<&'a Matchers>,
    pub tokens: Option<&'a TokenDictionary>,
    pub cross_file: Option<&'a dyn CrossFileLookup>,
    pub source_path: Option<PathBuf>,
    pub line_index: Option<&'a crate::LineIndex<'a>>,
    pub pattern_raw_transform: Option<&'cb PatternRawTransformCell<'cb>>,
}

impl<'a, 'cb> Resolver<'a, 'cb> {
    pub(crate) fn build(input: ResolverBuildInput<'a, 'cb>) -> Self {
        Self::build_from_input(input)
    }

    /// Like [`Self::build`], but named for callers that already have a
    /// type-erased `&dyn CrossFileLookup` (see `cross_file.rs`).
    pub(crate) fn build_with_cross_file_lookup(input: ResolverBuildInput<'a, 'cb>) -> Self {
        Self::build_from_input(input)
    }

    fn build_from_input(input: ResolverBuildInput<'a, 'cb>) -> Self {
        let ResolverBuildInput {
            program,
            matched,
            matchers,
            tokens,
            cross_file,
            source_path,
            line_index,
            pattern_raw_transform,
        } = input;
        let semantic = SemanticBuilder::new().build(program).semantic;
        Self {
            semantic,
            cache: RefCell::default(),
            style_cache: RefCell::default(),
            fn_cache: RefCell::default(),
            aliases: matched.iter().map(|m| (m.alias.as_str(), m)).collect(),
            matchers,
            tokens,
            cross_file,
            source_path,
            line_index,
            diagnostics: RefCell::default(),
            token_refs: RefCell::default(),
            cross_file_deps: RefCell::default(),
            pattern_raw_transform,
        }
    }

    pub(crate) fn take_diagnostics(&self) -> Vec<crate::Diagnostic> {
        std::mem::take(&mut self.diagnostics.borrow_mut())
    }

    /// Token paths resolved from `token()` / `token.var()` calls, with spans.
    /// Folding lowers a call to its value/var and erases the path, so this is
    /// the only place to recover it — consumed by on-demand tooling
    /// (`usages`), not the build path.
    pub(crate) fn take_token_refs(&self) -> Vec<TokenRef> {
        std::mem::take(&mut self.token_refs.borrow_mut())
    }

    /// Resolved cross-file module paths read during extraction.
    pub(crate) fn take_cross_file_deps(&self) -> Vec<String> {
        std::mem::take(&mut *self.cross_file_deps.borrow_mut())
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned())
            .collect()
    }

    pub(crate) fn import_binding_facts(&self, imports: &[ImportRecord]) -> Vec<ImportBindingFacts> {
        imports
            .iter()
            .flat_map(|record| &record.specifiers)
            .map(|specifier| {
                let references = self
                    .semantic
                    .scoping()
                    .get_root_binding(specifier.local.as_str().into())
                    .map(|symbol_id| {
                        self.semantic
                            .symbol_references(symbol_id)
                            .map(|reference| {
                                crate::span_from_oxc(
                                    self.semantic
                                        .nodes()
                                        .get_node(reference.node_id())
                                        .kind()
                                        .span(),
                                )
                            })
                            .collect()
                    })
                    .unwrap_or_default();
                ImportBindingFacts {
                    local: specifier.local.clone(),
                    references,
                }
            })
            .collect()
    }

    pub(crate) fn tokens(&self) -> Option<&'a TokenDictionary> {
        self.tokens
    }

    pub(crate) fn matchers(&self) -> Option<&'a Matchers> {
        self.matchers
    }

    /// Fold a pure local/imported callable: `f()`, `(() => 'x')()`, etc.
    pub(crate) fn resolve_pure_call(&self, call: &CallExpression<'_>) -> Option<Literal> {
        if call.optional {
            return None;
        }
        let func = self.lookup_callable(&call.callee)?;
        let args = fold_call_args(call, Some(self))?;
        apply_pure_fn(&func, &args)
    }

    /// Root-scope pure fn lookup used when collecting re-exports.
    pub(crate) fn lookup_root_pure_fn(&self, name: &str) -> Option<OwnedPureFn> {
        let symbol_id = self.semantic.scoping().get_root_binding(name.into())?;
        self.lookup_pure_fn_symbol(symbol_id)
    }

    fn lookup_callable(&self, callee: &Expression<'_>) -> Option<OwnedPureFn> {
        match callee.get_inner_expression() {
            Expression::Identifier(ident) => {
                let symbol_id = self.symbol_for_identifier(ident)?;
                self.lookup_pure_fn_symbol(symbol_id)
            }
            Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => {
                lower_callable_expr(callee, Some(self))
            }
            _ => None,
        }
    }

    fn lookup_pure_fn_symbol(&self, symbol_id: SymbolId) -> Option<OwnedPureFn> {
        if let Some(state) = self.fn_cache.borrow().get(&symbol_id).cloned() {
            return match state {
                PureFnResolutionState::Resolved(func) => Some(func),
                PureFnResolutionState::InProgress | PureFnResolutionState::Unresolvable => None,
            };
        }
        self.fn_cache
            .borrow_mut()
            .insert(symbol_id, PureFnResolutionState::InProgress);
        let result = self.compute_pure_fn_symbol(symbol_id);
        let state = match &result {
            Some(func) => PureFnResolutionState::Resolved(func.clone()),
            None => PureFnResolutionState::Unresolvable,
        };
        self.fn_cache.borrow_mut().insert(symbol_id, state);
        result
    }

    fn compute_pure_fn_symbol(&self, symbol_id: SymbolId) -> Option<OwnedPureFn> {
        let scoping = self.semantic.scoping();
        let flags = scoping.symbol_flags(symbol_id);

        if flags.contains(SymbolFlags::Import) {
            return self.resolve_import_pure_fn(symbol_id);
        }
        if scoping.symbol_is_mutated(symbol_id) {
            return None;
        }

        let decl_node = self.semantic.symbol_declaration(symbol_id);
        match decl_node.kind() {
            AstKind::VariableDeclarator(declarator) => {
                let init = declarator.init.as_ref()?;
                match &declarator.id {
                    BindingPattern::BindingIdentifier(id)
                        if id.symbol_id.get() == Some(symbol_id) =>
                    {
                        lower_callable_expr(init, Some(self))
                    }
                    _ => None,
                }
            }
            AstKind::Function(func) => lower_function(func, Some(self)),
            _ => None,
        }
    }

    fn resolve_import_pure_fn(&self, symbol_id: SymbolId) -> Option<OwnedPureFn> {
        self.resolve_import_entry(symbol_id)
            .and_then(|entry| match entry {
                ExportEntry::PureFn(func) => Some(func),
                ExportEntry::Literal(_) => None,
            })
    }

    /// `Some(symbol_id)` when the identifier binds to a declaration in
    /// this file. `None` for free/global references.
    pub(crate) fn symbol_for_identifier(
        &self,
        ident: &IdentifierReference<'_>,
    ) -> Option<SymbolId> {
        let reference_id = ident.reference_id.get()?;
        self.semantic
            .scoping()
            .get_reference(reference_id)
            .symbol_id()
    }

    /// `true` iff the identifier resolves to an `import` specifier. Free
    /// (unresolved) names also return `true` — they're usually globals or
    /// implicit imports the binder can't see, and alias lookup by name
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

    /// Resolve `token('path')` / `token.var('path')` to its dictionary value.
    /// Mirrors the JS extractor's `maybe-box-node.ts`.
    pub(crate) fn resolve_token_call(&self, call: &CallExpression<'_>) -> Option<Literal> {
        let dict = self.tokens?;
        let (path, is_var, fallback) = self.token_call_parts(call)?;

        let Some(resolution) = token_call_resolution(dict, &path, is_var, fallback.as_deref())
        else {
            self.token_refs.borrow_mut().push(TokenRef {
                path,
                span: crate::span_from_oxc(call.span),
                needs_css_var: is_var,
                is_var,
                value: None,
            });
            return None;
        };

        if dict.is_deprecated(&resolution.ref_path) {
            self.record_deprecated_token(&resolution.ref_path, call.span);
        }

        self.token_refs.borrow_mut().push(TokenRef {
            path: resolution.ref_path,
            span: crate::span_from_oxc(call.span),
            needs_css_var: resolution.needs_css_var,
            is_var,
            value: Some(resolution.value.clone()),
        });

        // Known token path → keep it with the value; synthetic/alias-only
        // resolutions fall back to a plain string.
        Some(if let Some(path) = resolution.token_path {
            Literal::Token {
                path,
                value: resolution.value,
            }
        } else {
            Literal::String(resolution.value)
        })
    }

    pub(crate) fn resolved_token_call_path(&self, call: &CallExpression<'_>) -> Option<String> {
        let dict = self.tokens?;
        let (path, is_var, fallback) = self.token_call_parts(call)?;
        token_call_resolution(dict, &path, is_var, fallback.as_deref())
            .map(|result| result.ref_path)
    }

    pub(crate) fn token_call_path(&self, call: &CallExpression<'_>) -> Option<String> {
        let (path, _, _) = self.token_call_parts(call)?;
        Some(path)
    }

    /// Resolved value a `token()` call inlines to; `None` if unresolvable.
    pub(crate) fn token_call_value(&self, call: &CallExpression<'_>) -> Option<String> {
        let dict = self.tokens?;
        let (path, is_var, fallback) = self.token_call_parts(call)?;
        token_call_resolution(dict, &path, is_var, fallback.as_deref()).map(|res| res.value)
    }

    pub(crate) fn token_call_is_var(&self, call: &CallExpression<'_>) -> bool {
        self.token_call_parts(call)
            .is_some_and(|(_, is_var, _)| is_var)
    }

    pub(crate) fn token_call_needs_css_var(&self, call: &CallExpression<'_>) -> bool {
        let Some(dict) = self.tokens else {
            return false;
        };
        let Some((path, is_var, fallback)) = self.token_call_parts(call) else {
            return false;
        };
        token_call_resolution(dict, &path, is_var, fallback.as_deref())
            .is_some_and(|result| result.needs_css_var)
    }

    fn token_call_parts(
        &self,
        call: &CallExpression<'_>,
    ) -> Option<(String, bool, Option<String>)> {
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

        let matched = self.aliases.get(token_ident.name.as_str())?;
        if matched.category != MatchCategory::Tokens {
            return None;
        }
        if !self.is_import_binding(token_ident) {
            return None;
        }

        let path_arg = call.arguments.first()?.as_expression()?;
        let (Literal::String(path) | Literal::Token { value: path, .. }) =
            expression_to_literal(path_arg, Some(self))?
        else {
            return None;
        };

        let fallback = call
            .arguments
            .get(1)
            .and_then(|a| a.as_expression())
            .and_then(|e| expression_to_literal(e, Some(self)))
            .and_then(|l| match l {
                Literal::String(s) | Literal::Token { value: s, .. } => Some(s),
                _ => None,
            });

        Some((path, is_var, fallback))
    }

    fn record_deprecated_token(&self, path: &str, span: oxc_span::Span) {
        let span = crate::span_from_oxc(span);
        let location = self
            .line_index
            .map(|idx| idx.locate_range(span.start, span.end));
        let mut diagnostic = crate::Diagnostic::warning(
            crate::diagnostic_codes::DEPRECATED_TOKEN_USED,
            format!("token \"{path}\" is deprecated"),
        );
        diagnostic.span = Some(span);
        diagnostic.location = location;
        self.diagnostics.borrow_mut().push(diagnostic);
    }

    pub(crate) fn resolve_identifier(&self, ident: &IdentifierReference<'_>) -> Option<Literal> {
        let symbol_id = self.symbol_for_identifier(ident)?;
        self.resolve_symbol(symbol_id)
    }

    /// Same-file [`StyleTree`] for a binding (keeps conditional spans).
    pub(crate) fn resolve_identifier_style_tree(
        &self,
        ident: &IdentifierReference<'_>,
    ) -> Option<StyleTree> {
        let symbol_id = self.symbol_for_identifier(ident)?;
        self.resolve_symbol_style_tree(symbol_id)
    }

    pub(crate) fn resolve_root_name(&self, name: &str) -> Option<Literal> {
        let symbol_id = self.semantic.scoping().get_root_binding(name.into())?;
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

    fn resolve_symbol_style_tree(&self, symbol_id: SymbolId) -> Option<StyleTree> {
        if let Some(state) = self.style_cache.borrow().get(&symbol_id).cloned() {
            return match state {
                StyleResolutionState::Resolved(tree) => Some(tree),
                StyleResolutionState::InProgress | StyleResolutionState::Unresolvable => None,
            };
        }
        self.style_cache
            .borrow_mut()
            .insert(symbol_id, StyleResolutionState::InProgress);
        let result = self.compute_symbol_style_tree(symbol_id);
        let state = match &result {
            Some(tree) => StyleResolutionState::Resolved(tree.clone()),
            None => StyleResolutionState::Unresolvable,
        };
        self.style_cache.borrow_mut().insert(symbol_id, state);
        result
    }

    fn compute_symbol_style_tree(&self, symbol_id: SymbolId) -> Option<StyleTree> {
        let scoping = self.semantic.scoping();
        let flags = scoping.symbol_flags(symbol_id);

        if flags.contains(SymbolFlags::Import) {
            // Rehydrate from Literal (`Conditional` → `Branches`, no foreign spans).
            return self
                .resolve_import_symbol(symbol_id)
                .map(literal_to_style_tree);
        }
        if scoping.symbol_is_mutated(symbol_id) {
            return None;
        }

        let decl_node = self.semantic.symbol_declaration(symbol_id);
        match decl_node.kind() {
            AstKind::VariableDeclarator(declarator) if flags.intersects(SymbolFlags::Variable) => {
                self.resolve_declarator_style_tree(declarator, symbol_id)
            }
            AstKind::TSEnumDeclaration(decl) => {
                Some(literal_to_style_tree(resolve_enum_as_object(decl)))
            }
            AstKind::FormalParameter(param) => {
                resolve_param_as_type_literal(param).map(literal_to_style_tree)
            }
            _ => None,
        }
    }

    fn compute_symbol(&self, symbol_id: SymbolId) -> Option<Literal> {
        let scoping = self.semantic.scoping();
        let flags = scoping.symbol_flags(symbol_id);

        if flags.contains(SymbolFlags::Import) {
            return self.resolve_import_symbol(symbol_id);
        }
        // We take a single-assignment stance everywhere, so mutation always
        // invalidates folding — `enum X { … }; X = …` is legal JS, so this
        // check applies to enum symbols too.
        if scoping.symbol_is_mutated(symbol_id) {
            return None;
        }

        let decl_node = self.semantic.symbol_declaration(symbol_id);
        match decl_node.kind() {
            AstKind::VariableDeclarator(declarator) if flags.intersects(SymbolFlags::Variable) => {
                self.resolve_declarator(declarator, symbol_id)
            }
            AstKind::TSEnumDeclaration(decl) => Some(resolve_enum_as_object(decl)),
            AstKind::FormalParameter(param) => resolve_param_as_type_literal(param),
            _ => None,
        }
    }

    /// Walk from an import-bound symbol up to its `ImportDeclaration` to
    /// recover `(specifier, imported_name)`, then delegate to the cross-file
    /// resolver. Default/namespace imports return `None`.
    fn resolve_import_symbol(&self, symbol_id: SymbolId) -> Option<Literal> {
        match self.resolve_import_entry(symbol_id)? {
            ExportEntry::Literal(lit) => Some(lit),
            ExportEntry::PureFn(_) => None,
        }
    }

    fn resolve_import_entry(&self, symbol_id: SymbolId) -> Option<ExportEntry> {
        let cross_file = self.cross_file?;
        let from_file = self.source_path.as_ref()?;

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
                    // `import { x as y }` — resolve by exported name (`x`).
                    imported_name = Some(spec.imported.name().as_str());
                }
                AstKind::ImportDefaultSpecifier(_) | AstKind::ImportNamespaceSpecifier(_) => {
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
        let resolution =
            cross_file.resolve_named_export(from_file, module, name, self.matchers, self.tokens);
        if let Some(path) = resolution.path {
            self.cross_file_deps.borrow_mut().insert(path);
        }
        resolution.entry
    }

    pub(crate) fn resolve_raw_style_call(&self, call: &CallExpression<'_>) -> Option<Literal> {
        let (name, category) = self.match_raw_style_call(call)?;
        let style = call
            .arguments
            .first()?
            .as_expression()
            .and_then(|expr| expression_to_literal(expr, Some(self)))?;

        if category != MatchCategory::Pattern {
            return Some(style);
        }

        let Some(transform) = self.pattern_raw_transform else {
            return Some(style);
        };

        match (transform.borrow_mut())(name, &style) {
            Ok(Some(transformed)) => Some(transformed),
            Ok(None) => None,
            Err(diagnostic) => {
                self.diagnostics.borrow_mut().push(diagnostic);
                None
            }
        }
    }

    /// [`StyleTree`] for a `.raw(...)` arg. Pattern transform: project → transform → rehydrate.
    pub(crate) fn resolve_raw_style_call_style_tree(
        &self,
        call: &CallExpression<'_>,
    ) -> Option<StyleTree> {
        let (name, category) = self.match_raw_style_call(call)?;
        let style_arg = call.arguments.first()?.as_expression()?;
        let tree = expression_to_style_tree(style_arg, Some(self))?;

        if category != MatchCategory::Pattern {
            return Some(tree);
        }

        let Some(transform) = self.pattern_raw_transform else {
            return Some(tree);
        };
        let style = project_literal(&tree)?;
        match (transform.borrow_mut())(name, &style) {
            Ok(Some(transformed)) => Some(literal_to_style_tree(transformed)),
            Ok(None) => None,
            Err(diagnostic) => {
                self.diagnostics.borrow_mut().push(diagnostic);
                None
            }
        }
    }

    /// Match a Panda `.raw(...)` call → `(name, category)`.
    fn match_raw_style_call<'s>(
        &'s self,
        call: &'s CallExpression<'_>,
    ) -> Option<(&'s str, MatchCategory)> {
        let matchers = self.matchers?;
        let Expression::StaticMemberExpression(_) = &call.callee else {
            return None;
        };
        let (object, path) = flatten_static_member_path(&call.callee)?;
        let matched = self.aliases.get(object.name.as_str())?;
        if !self.is_import_binding(object) {
            return None;
        }

        let name = match matched.kind {
            ImportSpecifierKind::Named => {
                if path.as_slice() != ["raw"] || !matched.category.supports_raw() {
                    return None;
                }
                matched.name.as_str()
            }
            ImportSpecifierKind::Namespace => {
                let (&property, raw_tail) = path.split_first()?;
                if raw_tail != ["raw"] || !matched.category.supports_raw() {
                    return None;
                }
                if !matchers.category_accepts_name(matched.category, property) {
                    return None;
                }
                property
            }
            ImportSpecifierKind::Default => {
                return None;
            }
        };
        Some((name, matched.category))
    }

    fn resolve_declarator(
        &self,
        declarator: &'a VariableDeclarator<'a>,
        target_symbol: SymbolId,
    ) -> Option<Literal> {
        let init = declarator.init.as_ref()?;
        match &declarator.id {
            BindingPattern::BindingIdentifier(id) => {
                if id.symbol_id.get() != Some(target_symbol) {
                    return None;
                }
                expression_to_literal(init, Some(self))
            }
            BindingPattern::ObjectPattern(_) | BindingPattern::ArrayPattern(_) => {
                let source = expression_to_literal(init, Some(self))?;
                resolve_pattern_path(&declarator.id, &source, target_symbol, Some(self))
            }
            BindingPattern::AssignmentPattern(_) => None,
        }
    }

    fn resolve_declarator_style_tree(
        &self,
        declarator: &'a VariableDeclarator<'a>,
        target_symbol: SymbolId,
    ) -> Option<StyleTree> {
        let init = declarator.init.as_ref()?;
        match &declarator.id {
            BindingPattern::BindingIdentifier(id) => {
                if id.symbol_id.get() != Some(target_symbol) {
                    return None;
                }
                expression_to_style_tree(init, Some(self))
            }
            BindingPattern::ObjectPattern(_) | BindingPattern::ArrayPattern(_) => {
                if let Some(source) = expression_to_style_tree(init, Some(self))
                    && let Some(tree) = resolve_pattern_path_style_tree(
                        &declarator.id,
                        &source,
                        target_symbol,
                        Some(self),
                    )
                {
                    return Some(tree);
                }
                // Spread-merged keys: Literal path (may become Open).
                let source = expression_to_literal(init, Some(self))?;
                resolve_pattern_path(&declarator.id, &source, target_symbol, Some(self))
                    .map(literal_to_style_tree)
            }
            BindingPattern::AssignmentPattern(_) => None,
        }
    }
}

fn token_call_resolution(
    dict: &TokenDictionary,
    path: &str,
    is_var: bool,
    fallback: Option<&str>,
) -> Option<TokenCallResolution> {
    if is_var {
        let value = dict.get_var(path, fallback)?;
        return Some(TokenCallResolution {
            value,
            ref_path: path.to_owned(),
            token_path: dict.token(path).map(|_| path.to_owned()),
            needs_css_var: true,
        });
    }

    if let Some(value) = dict.get(path, None) {
        return Some(TokenCallResolution {
            needs_css_var: is_css_var_value(&value),
            value,
            ref_path: path.to_owned(),
            token_path: Some(path.to_owned()),
        });
    }

    if let Some((color_path, _)) = path.split_once('/')
        && dict
            .token(color_path)
            .is_some_and(|token| token.category == TokenCategory::Colors)
        && let Some(value) = dict.color_mix_str(path)
    {
        return Some(TokenCallResolution {
            value,
            ref_path: color_path.to_owned(),
            token_path: Some(path.to_owned()),
            needs_css_var: true,
        });
    }

    fallback.map(|value| TokenCallResolution {
        value: value.to_owned(),
        ref_path: path.to_owned(),
        token_path: None,
        needs_css_var: is_css_var_value(value),
    })
}

fn is_css_var_value(value: &str) -> bool {
    value.trim().starts_with("var(")
}

/// Flatten a chain of static member accesses to its root identifier plus the
/// dotted property path: `css.raw` → (`css`, `["raw"]`); `p.css.raw` →
/// (`p`, `["css", "raw"]`). Shared by the raw-style-call resolver here and the
/// call-site callee resolver in `calls.rs`.
pub(crate) fn flatten_static_member_path<'a>(
    expr: &'a Expression<'_>,
) -> Option<(&'a IdentifierReference<'a>, SmallVec<[&'a str; 3]>)> {
    let mut path = SmallVec::new();
    let mut current = expr;
    loop {
        match current {
            Expression::StaticMemberExpression(member) => {
                path.push(member.property.name.as_str());
                current = &member.object;
            }
            Expression::Identifier(ident) => {
                path.reverse();
                return Some((ident, path));
            }
            _ => return None,
        }
    }
}

/// Destructuring over a [`StyleTree`] (static entries only; no spread merge).
fn resolve_pattern_path_style_tree(
    pattern: &BindingPattern<'_>,
    source: &StyleTree,
    target: SymbolId,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<StyleTree> {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            if id.symbol_id.get() == Some(target) {
                Some(source.clone())
            } else {
                None
            }
        }
        BindingPattern::ObjectPattern(obj) => {
            let StyleTree::Object(style_obj) = source else {
                return None;
            };
            let mut consumed = Vec::with_capacity(obj.properties.len());
            for prop in &obj.properties {
                let key = binding_property_key(&prop.key, prop.computed, resolver)?;
                consumed.push(key.clone());
                let slice = style_obj
                    .entries
                    .iter()
                    .find(|(k, _)| k == &key)
                    .map_or(&StyleTree::Null, |(_, v)| v);
                if let Some(found) =
                    resolve_pattern_path_style_tree(&prop.value, slice, target, resolver)
                {
                    return Some(found);
                }
            }
            if let Some(rest) = &obj.rest {
                let rest_entries = style_obj
                    .entries
                    .iter()
                    .filter(|(key, _)| !consumed.iter().any(|consumed| consumed == key))
                    .map(|(key, value)| (key.clone(), value.clone()))
                    .collect();
                let rest_source = StyleTree::Object(crate::StyleObject {
                    entries: rest_entries,
                    spreads: Vec::new(),
                });
                if let Some(found) =
                    resolve_pattern_path_style_tree(&rest.argument, &rest_source, target, resolver)
                {
                    return Some(found);
                }
            }
            None
        }
        BindingPattern::ArrayPattern(arr) => {
            let StyleTree::Array(items) = source else {
                return None;
            };
            for (i, elem) in arr.elements.iter().enumerate() {
                let Some(pat) = elem else {
                    continue;
                };
                let slice = items.get(i).unwrap_or(&StyleTree::Null);
                if let Some(found) = resolve_pattern_path_style_tree(pat, slice, target, resolver) {
                    return Some(found);
                }
            }
            if let Some(rest) = &arr.rest {
                let rest_source =
                    StyleTree::Array(items.iter().skip(arr.elements.len()).cloned().collect());
                if let Some(found) =
                    resolve_pattern_path_style_tree(&rest.argument, &rest_source, target, resolver)
                {
                    return Some(found);
                }
            }
            None
        }
        BindingPattern::AssignmentPattern(asgn) => {
            if matches!(source, StyleTree::Null) {
                let default_value = expression_to_style_tree(&asgn.right, resolver)?;
                resolve_pattern_path_style_tree(&asgn.left, &default_value, target, resolver)
            } else {
                resolve_pattern_path_style_tree(&asgn.left, source, target, resolver)
            }
        }
    }
}

/// Walk a destructuring pattern paired with its source literal until
/// `target` is found. Returns the slice of `source` that binds to it.
fn resolve_pattern_path(
    pattern: &BindingPattern<'_>,
    source: &Literal,
    target: SymbolId,
    resolver: Option<&Resolver<'_, '_>>,
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
            let mut consumed = Vec::with_capacity(obj.properties.len());
            for prop in &obj.properties {
                let key = binding_property_key(&prop.key, prop.computed, resolver)?;
                consumed.push(key.clone());
                let slice = entries
                    .iter()
                    .find(|(k, _)| k == &key)
                    .map_or(&Literal::Null, |(_, v)| v);
                if let Some(found) = resolve_pattern_path(&prop.value, slice, target, resolver) {
                    return Some(found);
                }
            }
            if let Some(rest) = &obj.rest {
                let rest_entries = entries
                    .iter()
                    .filter(|(key, _)| !consumed.iter().any(|consumed| consumed == key))
                    .map(|(key, value)| (key.clone(), value.clone()))
                    .collect();
                let rest_source = Literal::Object(rest_entries);
                if let Some(found) =
                    resolve_pattern_path(&rest.argument, &rest_source, target, resolver)
                {
                    return Some(found);
                }
            }
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
                if let Some(found) = resolve_pattern_path(pat, slice, target, resolver) {
                    return Some(found);
                }
            }
            if let Some(rest) = &arr.rest {
                let rest_source =
                    Literal::Array(items.iter().skip(arr.elements.len()).cloned().collect());
                if let Some(found) =
                    resolve_pattern_path(&rest.argument, &rest_source, target, resolver)
                {
                    return Some(found);
                }
            }
            None
        }
        BindingPattern::AssignmentPattern(asgn) => {
            // `{ x = 'red' } = src`: missing (Null) → fold the default and
            // recurse with that. The default itself resolves without a
            // Resolver, so identifier defaults don't chain — same limitation
            // as the JS extractor outside its main scope walker.
            if matches!(source, Literal::Null) {
                let default_value = expression_to_literal(&asgn.right, resolver)?;
                resolve_pattern_path(&asgn.left, &default_value, target, resolver)
            } else {
                resolve_pattern_path(&asgn.left, source, target, resolver)
            }
        }
    }
}

fn binding_property_key(
    key: &PropertyKey<'_>,
    computed: bool,
    resolver: Option<&Resolver<'_, '_>>,
) -> Option<String> {
    if !computed {
        return match key {
            PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
            PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
            PropertyKey::NumericLiteral(n) => Some(n.value.to_string()),
            _ => None,
        };
    }
    let expr = key.as_expression()?;
    match expression_to_literal(expr, resolver)? {
        Literal::String(value) | Literal::Token { value, .. } => Some(value),
        Literal::Number(value) => Some(value.to_string()),
        _ => None,
    }
}

/// Synthesize a `Literal::Object` from a TS enum's member initializers.
/// Auto-incremented members (no initializer) drop — matches the JS extractor.
fn resolve_enum_as_object(decl: &oxc_ast::ast::TSEnumDeclaration<'_>) -> Literal {
    let mut entries: Vec<(String, Literal)> = Vec::with_capacity(decl.body.members.len());
    for member in &decl.body.members {
        let name = match &member.id {
            oxc_ast::ast::TSEnumMemberName::Identifier(id) => id.name.to_string(),
            oxc_ast::ast::TSEnumMemberName::String(s) => s.value.to_string(),
            _ => continue,
        };
        let Some(init) = member.initializer.as_ref() else {
            continue;
        };
        // No Resolver here — sufficient for the common string/numeric case.
        if let Some(value) = expression_to_literal(init, None) {
            entries.push((name, value));
        }
    }
    Literal::Object(entries)
}

/// Fold a parameter's `TSTypeLiteral` annotation into a synthetic object
/// so `function f(x: { color: 'red' })` lets `x.color` resolve.
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

/// Convert a TS type node to a `Literal` when it's a static literal type
/// (`'red'`, `4`, `true`). Unions, references, generics drop.
fn ts_type_to_literal(ts_type: &oxc_ast::ast::TSType<'_>) -> Option<Literal> {
    let oxc_ast::ast::TSType::TSLiteralType(lit_type) = ts_type else {
        return None;
    };
    match &lit_type.literal {
        oxc_ast::ast::TSLiteral::StringLiteral(s) => Some(Literal::String(s.value.to_string())),
        oxc_ast::ast::TSLiteral::NumericLiteral(n) => Some(Literal::Number(n.value)),
        oxc_ast::ast::TSLiteral::BooleanLiteral(b) => Some(Literal::Bool(b.value)),
        _ => None,
    }
}
