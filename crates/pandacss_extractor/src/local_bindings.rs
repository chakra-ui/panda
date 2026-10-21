//! Same-file bindings whose initializer is a collected Panda call site, directly
//! or as a property of a local object (`styles.x`).
//!
//! Transform-only IR: spans + compact expression facts, no Oxc nodes, so the
//! allocator can drop after extraction. Join key to [`crate::ExtractedCall`] is
//! `init_span` (byte-identical to the call expression span).

use oxc_ast::AstKind;
use oxc_ast::ast::{
    BindingPattern, Expression, ObjectExpression, ObjectPropertyKind, Program, PropertyKind,
    VariableDeclaration, VariableDeclarationKind, VariableDeclarator,
};
use oxc_ast_visit::{Visit, walk};
use oxc_semantic::Semantic;
use oxc_span::GetSpan;
use oxc_syntax::node::NodeId;
use oxc_syntax::symbol::SymbolId;
use rustc_hash::FxHashSet;

use crate::transform_facts::{ExpressionFacts, expression_facts};
use crate::{Span, span_from_oxc};

/// A same-file binding initialized by a Panda call, plus every resolved reference.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalCallBinding {
    /// For an object member, the object's name.
    pub local: String,
    /// Initializer call span — joins to [`crate::ExtractedCall::span`].
    pub init_span: Span,
    pub declaration: LocalDeclarationKind,
    /// `binding(...)` or `object.member(...)` call sites, in source order.
    pub calls: Vec<LocalBindingCall>,
    /// Direct `binding.raw(...)` call sites, in source order. Also counted in
    /// `has_other_references`, so existing consumers stay conservative.
    pub raw_calls: Vec<LocalBindingCall>,
    /// A `.raw` access that is not a direct call — a bare `binding.raw`
    /// reference, or `binding?.raw(…)`. The value escapes, so a caller that
    /// rewrites `raw` semantics cannot prove it has seen every use.
    pub has_opaque_raw_access: bool,
    /// A reference other than a direct call or direct `.raw(...)` call. This
    /// is the escape bit source specialization uses after all direct raw calls
    /// have been folded.
    pub has_non_call_references: bool,
    /// Any reference that is not a plain call (`binding.raw`, value use, export, …).
    pub has_other_references: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LocalDeclarationKind {
    Const,
    Let,
    Var,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalBindingCall {
    pub object_literal_context: crate::ObjectLiteralContext,
    /// Whole `binding(...)` expression — the rewrite range.
    pub span: Span,
    /// One entry per argument. `None` is a spread element.
    pub args: Vec<Option<ExpressionFacts>>,
}

/// Collect local bindings initialized from `init_spans` (Panda call spans).
#[must_use]
pub(crate) fn collect_local_call_bindings<'a>(
    program: &Program<'a>,
    semantic: &Semantic<'a>,
    init_spans: &FxHashSet<Span>,
) -> Vec<LocalCallBinding> {
    if init_spans.is_empty() {
        return Vec::new();
    }
    let mut collector = BindingCollector {
        semantic,
        init_spans,
        out: Vec::new(),
    };
    collector.visit_program(program);
    collector.out
}

struct BindingCollector<'a, 's> {
    semantic: &'s Semantic<'a>,
    init_spans: &'s FxHashSet<Span>,
    out: Vec<LocalCallBinding>,
}

impl<'a> BindingCollector<'a, '_> {
    fn consider(&mut self, declarator: &VariableDeclarator<'a>, kind: LocalDeclarationKind) {
        let BindingPattern::BindingIdentifier(id) = &declarator.id else {
            return;
        };
        let Some(symbol_id) = id.symbol_id.get() else {
            return;
        };
        if self.semantic.scoping().symbol_is_mutated(symbol_id) {
            return;
        }
        let Some(init) = declarator.init.as_ref() else {
            return;
        };
        let init = init.get_inner_expression();
        let init_span = span_from_oxc(init.span());
        if self.init_spans.contains(&init_span) {
            self.consider_call(&id.name, symbol_id, init_span, kind);
        } else if let Expression::ObjectExpression(object) = init {
            self.consider_object(&id.name, symbol_id, object, kind);
        }
    }

    fn consider_call(
        &mut self,
        local: &str,
        symbol_id: SymbolId,
        init_span: Span,
        kind: LocalDeclarationKind,
    ) {
        let mut facts = ReferenceFacts::default();
        for reference in value_references(self.semantic, symbol_id) {
            let node_id = reference.node_id();
            let span = reference_span(self.semantic, node_id);
            facts.record(classify_reference(self.semantic, node_id, span));
        }

        self.out.push(facts.into_binding(local, init_span, kind));
    }

    fn consider_object(
        &mut self,
        local: &str,
        symbol_id: SymbolId,
        object: &ObjectExpression<'a>,
        kind: LocalDeclarationKind,
    ) {
        let Some(members) = object_call_members(object, self.init_spans) else {
            return;
        };
        if members.is_empty() {
            return;
        }

        let mut facts = vec![ReferenceFacts::default(); members.len()];
        for reference in value_references(self.semantic, symbol_id) {
            let node_id = reference.node_id();
            let span = reference_span(self.semantic, node_id);

            let Some(read) = static_member_read(self.semantic, node_id, span) else {
                // Any other use of the object can reach every member.
                for member_facts in &mut facts {
                    member_facts.record(ReferenceKind::Other);
                }
                continue;
            };

            if let Some(index) = members.iter().position(|member| member.key == read.key) {
                facts[index].record(classify_reference(self.semantic, read.node_id, read.span));
            }
        }

        for (member, member_facts) in members.into_iter().zip(facts) {
            self.out
                .push(member_facts.into_binding(local, member.call_span, kind));
        }
    }
}

fn reference_span(semantic: &Semantic<'_>, node_id: NodeId) -> Span {
    span_from_oxc(semantic.nodes().get_node(node_id).kind().span())
}

/// Type-position references are erased, so they don't count.
fn value_references<'s>(
    semantic: &'s Semantic<'_>,
    symbol_id: SymbolId,
) -> impl Iterator<Item = &'s oxc_semantic::Reference> + 's {
    semantic
        .symbol_references(symbol_id)
        .filter(|reference| reference.is_value())
}

/// A property whose value is a collected Panda call: `root: cva(…)`.
struct ObjectMember {
    key: String,
    call_span: Span,
}

/// `None` when a spread, computed or repeated key means `object.key` may not read this value.
fn object_call_members(
    object: &ObjectExpression<'_>,
    init_spans: &FxHashSet<Span>,
) -> Option<Vec<ObjectMember>> {
    let mut keys = FxHashSet::default();
    let mut members = Vec::new();

    for property in &object.properties {
        let ObjectPropertyKind::ObjectProperty(property) = property else {
            return None;
        };
        if property.computed {
            return None;
        }

        let key = property.key.static_name()?.into_owned();
        if !keys.insert(key.clone()) {
            return None;
        }

        if property.kind != PropertyKind::Init || property.method {
            continue;
        }
        let call_span = span_from_oxc(property.value.get_inner_expression().span());
        if init_spans.contains(&call_span) {
            members.push(ObjectMember { key, call_span });
        }
    }

    Some(members)
}

/// `object.key`, read without optional chaining.
struct MemberRead<'s> {
    node_id: NodeId,
    span: Span,
    key: &'s str,
}

fn static_member_read<'s>(
    semantic: &'s Semantic<'_>,
    node_id: NodeId,
    object_span: Span,
) -> Option<MemberRead<'s>> {
    let AstKind::StaticMemberExpression(member) = semantic.nodes().parent_kind(node_id) else {
        return None;
    };
    if member.optional || span_from_oxc(member.object.get_inner_expression().span()) != object_span
    {
        return None;
    }

    Some(MemberRead {
        node_id: semantic.nodes().parent_id(node_id),
        span: span_from_oxc(member.span),
        key: member.property.name.as_str(),
    })
}

#[derive(Clone, Default)]
struct ReferenceFacts {
    calls: Vec<LocalBindingCall>,
    raw_calls: Vec<LocalBindingCall>,
    has_opaque_raw_access: bool,
    has_non_call_references: bool,
    has_other_references: bool,
}

impl ReferenceFacts {
    fn record(&mut self, kind: ReferenceKind) {
        match kind {
            ReferenceKind::PlainCall(call) => self.calls.push(call),
            ReferenceKind::RawCall(call) => {
                self.raw_calls.push(call);
                self.has_other_references = true;
            }
            ReferenceKind::OpaqueRawAccess => {
                self.has_opaque_raw_access = true;
                self.has_non_call_references = true;
                self.has_other_references = true;
            }
            ReferenceKind::Other => {
                self.has_non_call_references = true;
                self.has_other_references = true;
            }
        }
    }

    fn into_binding(
        mut self,
        local: &str,
        init_span: Span,
        declaration: LocalDeclarationKind,
    ) -> LocalCallBinding {
        self.calls.sort_by_key(|call| call.span.start);
        self.raw_calls.sort_by_key(|call| call.span.start);
        LocalCallBinding {
            local: local.to_owned(),
            init_span,
            declaration,
            calls: self.calls,
            raw_calls: self.raw_calls,
            has_opaque_raw_access: self.has_opaque_raw_access,
            has_non_call_references: self.has_non_call_references,
            has_other_references: self.has_other_references,
        }
    }
}

impl<'a> Visit<'a> for BindingCollector<'a, '_> {
    fn visit_variable_declaration(&mut self, decl: &VariableDeclaration<'a>) {
        let Some(kind) = declaration_kind(decl.kind) else {
            walk::walk_variable_declaration(self, decl);
            return;
        };
        for declarator in &decl.declarations {
            self.consider(declarator, kind);
        }
        walk::walk_variable_declaration(self, decl);
    }
}

fn declaration_kind(kind: VariableDeclarationKind) -> Option<LocalDeclarationKind> {
    match kind {
        VariableDeclarationKind::Const => Some(LocalDeclarationKind::Const),
        VariableDeclarationKind::Let => Some(LocalDeclarationKind::Let),
        VariableDeclarationKind::Var => Some(LocalDeclarationKind::Var),
        VariableDeclarationKind::Using | VariableDeclarationKind::AwaitUsing => None,
    }
}

enum ReferenceKind {
    PlainCall(LocalBindingCall),
    RawCall(LocalBindingCall),
    OpaqueRawAccess,
    Other,
}

fn classify_reference(semantic: &Semantic<'_>, node_id: NodeId, ref_span: Span) -> ReferenceKind {
    match semantic.nodes().parent_kind(node_id) {
        AstKind::CallExpression(call) => {
            let callee_is_ref =
                span_from_oxc(call.callee.get_inner_expression().span()) == ref_span;
            if !callee_is_ref || call.optional || call.type_arguments.is_some() {
                return ReferenceKind::Other;
            }
            ReferenceKind::PlainCall(binding_call(call, semantic))
        }
        AstKind::StaticMemberExpression(member) => {
            if member.property.name != "raw"
                || span_from_oxc(member.object.get_inner_expression().span()) != ref_span
            {
                return ReferenceKind::Other;
            }
            if member.optional {
                return ReferenceKind::OpaqueRawAccess;
            }
            match semantic
                .nodes()
                .parent_kind(semantic.nodes().parent_id(node_id))
            {
                AstKind::CallExpression(call)
                    if !call.optional
                        && call.type_arguments.is_none()
                        && span_from_oxc(call.callee.get_inner_expression().span())
                            == span_from_oxc(member.span) =>
                {
                    ReferenceKind::RawCall(binding_call(call, semantic))
                }
                // `const fn = styles.raw`, `styles.raw?.(…)`, `f(styles.raw)` —
                // the function escapes, so its semantics must not change.
                _ => ReferenceKind::OpaqueRawAccess,
            }
        }
        _ => ReferenceKind::Other,
    }
}

fn binding_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    semantic: &Semantic<'_>,
) -> LocalBindingCall {
    LocalBindingCall {
        object_literal_context: crate::transform_facts::object_literal_context(call, semantic),
        span: span_from_oxc(call.span),
        args: call
            .arguments
            .iter()
            .map(|arg| arg.as_expression().map(expression_facts))
            .collect(),
    }
}
