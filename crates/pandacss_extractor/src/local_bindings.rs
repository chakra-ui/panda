//! Same-file bindings whose initializer is a collected Panda call site.
//!
//! Transform-only IR: spans + compact expression facts, no Oxc nodes, so the
//! allocator can drop after extraction. Join key to [`crate::ExtractedCall`] is
//! `init_span` (byte-identical to the call expression span).

use oxc_ast::AstKind;
use oxc_ast::ast::{
    BindingPattern, Expression, Program, VariableDeclaration, VariableDeclarationKind,
    VariableDeclarator,
};
use oxc_ast_visit::{Visit, walk};
use oxc_semantic::Semantic;
use oxc_span::GetSpan;
use oxc_syntax::node::NodeId;
use rustc_hash::FxHashSet;

use crate::transform_facts::{ExpressionFacts, expression_facts};
use crate::{Span, span_from_oxc};

/// A same-file binding initialized by a Panda call, plus every resolved reference.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalCallBinding {
    pub local: String,
    /// Initializer call span — joins to [`crate::ExtractedCall::span`].
    pub init_span: Span,
    pub declaration: LocalDeclarationKind,
    /// Plain `binding(...)` call sites, in source order.
    pub calls: Vec<LocalBindingCall>,
    /// Direct `binding.raw(...)` call sites, in source order. Also counted in
    /// `has_other_references`, so existing consumers stay conservative.
    pub raw_calls: Vec<LocalBindingCall>,
    /// A `.raw` access that is not a direct call — a bare `binding.raw`
    /// reference, or `binding?.raw(…)`. The value escapes, so a caller that
    /// rewrites `raw` semantics cannot prove it has seen every use.
    pub has_opaque_raw_access: bool,
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
        let init_span = span_from_oxc(init.get_inner_expression().span());
        if !self.init_spans.contains(&init_span) {
            return;
        }

        let mut calls = Vec::new();
        let mut raw_calls = Vec::new();
        let mut has_opaque_raw_access = false;
        let mut has_other_references = false;
        for reference in self.semantic.symbol_references(symbol_id) {
            let node_id = reference.node_id();
            let ref_span = span_from_oxc(self.semantic.nodes().get_node(node_id).kind().span());
            match classify_reference(self.semantic, node_id, ref_span) {
                ReferenceKind::PlainCall(call) => calls.push(call),
                ReferenceKind::RawCall(call) => {
                    raw_calls.push(call);
                    has_other_references = true;
                }
                ReferenceKind::OpaqueRawAccess => {
                    has_opaque_raw_access = true;
                    has_other_references = true;
                }
                ReferenceKind::Other => has_other_references = true,
            }
        }
        calls.sort_by_key(|call| call.span.start);
        raw_calls.sort_by_key(|call| call.span.start);

        self.out.push(LocalCallBinding {
            local: id.name.to_string(),
            init_span,
            declaration: kind,
            calls,
            raw_calls,
            has_opaque_raw_access,
            has_other_references,
        });
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
            let callee_is_ref = matches!(
                call.callee.get_inner_expression(),
                Expression::Identifier(id) if span_from_oxc(id.span) == ref_span
            );
            if !callee_is_ref || call.optional || call.type_arguments.is_some() {
                return ReferenceKind::Other;
            }
            ReferenceKind::PlainCall(binding_call(call))
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
                    ReferenceKind::RawCall(binding_call(call))
                }
                // `const fn = styles.raw`, `styles.raw?.(…)`, `f(styles.raw)` —
                // the function escapes, so its semantics must not change.
                _ => ReferenceKind::OpaqueRawAccess,
            }
        }
        _ => ReferenceKind::Other,
    }
}

fn binding_call(call: &oxc_ast::ast::CallExpression<'_>) -> LocalBindingCall {
    LocalBindingCall {
        span: span_from_oxc(call.span),
        args: call
            .arguments
            .iter()
            .map(|arg| arg.as_expression().map(expression_facts))
            .collect(),
    }
}
