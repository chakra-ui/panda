//! Same-file static evaluator for identifier and member-access resolution.
//!
//! Wraps `oxc_semantic` to answer two questions the call/JSX visitors need:
//! "is this identifier a Panda import or a local that shadows one?", and
//! "does this identifier resolve to a literal value?" (matches ts-evaluator
//! semantics: same-file const/let/var with a literal initializer, never
//! mutated, never an import).
//!
//! Not folded (matches ts-evaluator): mutated bindings, function params,
//! function/class declarations, unresolved imports (cross-file is a
//! separate slice), destructuring defaults, TDZ violations. Member access
//! and array indexing are handled in `literal::expression_to_literal` once
//! an identifier resolves to an Object/Array — the resolver itself only
//! deals in whole-identifier resolution.

use std::cell::RefCell;
use std::path::PathBuf;

use oxc_ast::AstKind;
use oxc_ast::ast::{
    BindingPattern, CallExpression, Expression, IdentifierReference, PropertyKey,
    VariableDeclarator,
};
use oxc_semantic::{Semantic, SemanticBuilder, SymbolFlags, SymbolId};
use pandacss_tokens::{TokenCategory, TokenDictionary};
use rustc_hash::FxHashMap;
use smallvec::SmallVec;

use crate::cross_file::{CrossFileLookup, CrossFileResolver};
use crate::literal::expression_to_literal;
use crate::matcher::{MatchCategory, MatchedImport, Matchers};
use crate::{ImportSpecifierKind, Literal, TokenRef};

pub(crate) type PatternRawTransformFn<'a> =
    dyn FnMut(&str, &Literal) -> Result<Option<Literal>, crate::Diagnostic> + 'a;
pub(crate) type PatternRawTransformCell<'a> = RefCell<&'a mut PatternRawTransformFn<'a>>;

/// Per-file symbol/scope index plus a memo of resolved literal values.
///
/// Also recognizes Panda `token()` / `token.var()` calls and resolves them
/// through the supplied [`TokenDictionary`]; the alias table maps local
/// names back to their `tokens`-category import.
pub(crate) struct Resolver<'a> {
    semantic: Semantic<'a>,
    // PERF(port): FxHashMap keys are u32 newtypes — SipHash overhead is waste.
    cache: RefCell<FxHashMap<SymbolId, ResolutionState>>,
    aliases: FxHashMap<&'a str, &'a MatchedImport>,
    matchers: Option<&'a Matchers>,
    tokens: Option<&'a TokenDictionary>,
    cross_file: Option<&'a dyn CrossFileLookup>,
    source_path: Option<PathBuf>,
    line_index: Option<&'a crate::LineIndex<'a>>,
    diagnostics: RefCell<Vec<crate::Diagnostic>>,
    token_refs: RefCell<Vec<TokenRef>>,
    pattern_raw_transform: Option<&'a PatternRawTransformCell<'a>>,
}

struct TokenCallResolution {
    value: String,
    ref_path: String,
    needs_css_var: bool,
}

/// `InProgress` guards against cycles like `const a = b; const b = a;`.
#[derive(Clone)]
enum ResolutionState {
    InProgress,
    Resolved(Literal),
    Unresolvable,
}

impl<'a> Resolver<'a> {
    pub(crate) fn build(
        program: &'a oxc_ast::ast::Program<'a>,
        matched: &'a [MatchedImport],
        matchers: Option<&'a Matchers>,
        tokens: Option<&'a TokenDictionary>,
        cross_file: Option<&'a CrossFileResolver>,
        source_path: Option<PathBuf>,
        line_index: Option<&'a crate::LineIndex<'a>>,
        pattern_raw_transform: Option<&'a PatternRawTransformCell<'a>>,
    ) -> Self {
        let semantic = SemanticBuilder::new().build(program).semantic;
        Self {
            semantic,
            cache: RefCell::default(),
            aliases: matched.iter().map(|m| (m.alias.as_str(), m)).collect(),
            matchers,
            tokens,
            cross_file: cross_file.map(CrossFileResolver::as_lookup),
            source_path,
            line_index,
            diagnostics: RefCell::default(),
            token_refs: RefCell::default(),
            pattern_raw_transform,
        }
    }

    pub(crate) fn build_with_cross_file_lookup(
        program: &'a oxc_ast::ast::Program<'a>,
        matched: &'a [MatchedImport],
        tokens: Option<&'a TokenDictionary>,
        cross_file: Option<&'a dyn CrossFileLookup>,
        matchers: Option<&'a Matchers>,
        source_path: Option<PathBuf>,
        line_index: Option<&'a crate::LineIndex<'a>>,
        pattern_raw_transform: Option<&'a PatternRawTransformCell<'a>>,
    ) -> Self {
        let semantic = SemanticBuilder::new().build(program).semantic;
        Self {
            semantic,
            cache: RefCell::default(),
            aliases: matched.iter().map(|m| (m.alias.as_str(), m)).collect(),
            matchers,
            tokens,
            cross_file,
            source_path,
            line_index,
            diagnostics: RefCell::default(),
            token_refs: RefCell::default(),
            pattern_raw_transform,
        }
    }

    pub(crate) fn take_diagnostics(&self) -> Vec<crate::Diagnostic> {
        std::mem::take(&mut self.diagnostics.borrow_mut())
    }

    /// Token paths resolved from `token()` / `token.var()` calls, with spans.
    /// Resolution lowers these calls to their value/var, so the path is only
    /// recoverable here — consumed by on-demand tooling (`usages`), not the
    /// build path.
    pub(crate) fn take_token_refs(&self) -> Vec<TokenRef> {
        std::mem::take(&mut self.token_refs.borrow_mut())
    }

    pub(crate) fn tokens(&self) -> Option<&'a TokenDictionary> {
        self.tokens
    }

    pub(crate) fn matchers(&self) -> Option<&'a Matchers> {
        self.matchers
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

    /// `true` iff the identifier resolves to an `import` specifier.
    /// Unresolved (free) names return `true` — they're usually globals or
    /// implicit imports the binder couldn't see, and downstream alias
    /// lookup by name is authoritative.
    pub(crate) fn is_import_binding(&self, ident: &IdentifierReference<'_>) -> bool {
        let Some(symbol_id) = self.symbol_for_identifier(ident) else {
            return true;
        };
        self.semantic
            .scoping()
            .symbol_flags(symbol_id)
            .contains(SymbolFlags::Import)
    }

    /// Resolve `token('path')` / `token.var('path')` to its dictionary
    /// value. Mirrors the JS extractor's behavior in `maybe-box-node.ts`.
    pub(crate) fn resolve_token_call(&self, call: &CallExpression<'_>) -> Option<Literal> {
        let dict = self.tokens?;
        let (path, is_var, fallback) = self.token_call_parts(call)?;

        let resolution = token_call_resolution(dict, &path, is_var, fallback.as_deref())?;

        if dict.is_deprecated(&resolution.ref_path) {
            self.record_deprecated_token(&resolution.ref_path, call.span);
        }

        self.token_refs.borrow_mut().push(TokenRef {
            path: resolution.ref_path,
            span: crate::span_from_oxc(call.span),
            needs_css_var: resolution.needs_css_var,
        });
        Some(Literal::String(resolution.value))
    }

    pub(crate) fn resolved_token_call_path(&self, call: &CallExpression<'_>) -> Option<String> {
        let dict = self.tokens?;
        let (path, is_var, fallback) = self.token_call_parts(call)?;
        token_call_resolution(dict, &path, is_var, fallback.as_deref())
            .map(|result| result.ref_path)
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
        let Literal::String(path) = expression_to_literal(path_arg, Some(self))? else {
            return None;
        };

        let fallback = call
            .arguments
            .get(1)
            .and_then(|a| a.as_expression())
            .and_then(|e| expression_to_literal(e, Some(self)))
            .and_then(|l| match l {
                Literal::String(s) => Some(s),
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

    fn compute_symbol(&self, symbol_id: SymbolId) -> Option<Literal> {
        let scoping = self.semantic.scoping();
        let flags = scoping.symbol_flags(symbol_id);

        if flags.contains(SymbolFlags::Import) {
            return self.resolve_import_symbol(symbol_id);
        }
        // Mutation invalidates folding. Enum symbols are also re-checked
        // because `enum X { … }; X = …` is legal and we keep a single-
        // assignment stance everywhere.
        if scoping.symbol_is_mutated(symbol_id) {
            return None;
        }

        let decl_node = self.semantic.symbol_declaration(symbol_id);
        match decl_node.kind() {
            AstKind::VariableDeclarator(declarator) if flags.intersects(SymbolFlags::Variable) => {
                self.resolve_declarator(declarator, symbol_id)
            }
            // Enum members without an initializer (auto-incremented) drop —
            // matches the JS extractor.
            AstKind::TSEnumDeclaration(decl) => Some(resolve_enum_as_object(decl)),
            // `function f(x: { color: 'red' })` lets `x.color` fold via the
            // readonly literal type members. Mirrors the JS extractor's
            // ParameterDeclaration+TypeLiteral fallback.
            AstKind::FormalParameter(param) => resolve_param_as_type_literal(param),
            _ => None,
        }
    }

    /// Walk from an import-bound symbol up to its `ImportDeclaration` to
    /// recover `(specifier, imported_name)`, then delegate to the cross-
    /// file resolver. Only named-export specifiers are resolved here;
    /// default/namespace imports return `None`.
    fn resolve_import_symbol(&self, symbol_id: SymbolId) -> Option<Literal> {
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
        cross_file.resolve_named_export(from_file, module, name, self.matchers, self.tokens)
    }

    pub(crate) fn resolve_raw_style_call(&self, call: &CallExpression<'_>) -> Option<Literal> {
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
                if path.as_slice() != ["raw"] || !is_raw_category(matched.category) {
                    return None;
                }
                matched.name.as_str()
            }
            ImportSpecifierKind::Namespace => {
                let (&property, raw_tail) = path.split_first()?;
                if raw_tail != ["raw"] || !is_raw_category(matched.category) {
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

        let style = call
            .arguments
            .first()?
            .as_expression()
            .and_then(|expr| expression_to_literal(expr, Some(self)))?;

        if matched.category != MatchCategory::Pattern {
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
            needs_css_var: true,
        });
    }

    if let Some(value) = dict.get(path, None) {
        return Some(TokenCallResolution {
            needs_css_var: is_css_var_value(&value),
            value,
            ref_path: path.to_owned(),
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
            needs_css_var: true,
        });
    }

    fallback.map(|value| TokenCallResolution {
        value: value.to_owned(),
        ref_path: path.to_owned(),
        needs_css_var: is_css_var_value(value),
    })
}

fn is_css_var_value(value: &str) -> bool {
    value.trim().starts_with("var(")
}

fn is_raw_category(category: MatchCategory) -> bool {
    matches!(
        category,
        MatchCategory::Css | MatchCategory::Recipe | MatchCategory::Pattern
    )
}

fn flatten_static_member_path<'a>(
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

/// Walk a destructuring pattern paired with its source literal until
/// `target` is found. Returns the slice of `source` that binds to it.
fn resolve_pattern_path(
    pattern: &BindingPattern<'_>,
    source: &Literal,
    target: SymbolId,
    resolver: Option<&Resolver<'_>>,
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
            // `{ x = 'red' } = src` — present → recurse with source; missing
            // (Null) → fold the default and recurse with that. The default
            // expression resolves without a Resolver, so identifier defaults
            // don't chain — same limitation as the JS extractor outside its
            // main scope walker.
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
    resolver: Option<&Resolver<'_>>,
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
        Literal::String(value) => Some(value),
        Literal::Number(value) => Some(value.to_string()),
        _ => None,
    }
}

/// Synthesize a `Literal::Object` from a TS enum's member initializers.
/// Members without an initializer drop — matches the JS extractor.
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
        // Initializer evaluated without a Resolver — sufficient for the
        // common string/numeric literal case.
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
