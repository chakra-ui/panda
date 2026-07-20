//! Indentation-aware CSS string builder with an optional record backend.
//!
//! Native mode writes CSS; record mode (polyfill) pushes
//! [`SheetOp`](crate::polyfill::SheetOp)s for a full-sheet post-pass. Same
//! call sites either way (`layer`, `rule`, `at_rule`, `declaration`).

use crate::polyfill::{Decl, SheetOp};

/// Pretty or minified CSS writer; record mode feeds the polyfill post-pass.
pub struct CssWriter {
    minify: bool,
    indent: usize,
    backend: Backend,
}

enum Backend {
    Native { out: String },
    Record { stack: Vec<RecordFrame> },
}

enum RecordFrame {
    Ops(Vec<SheetOp>),
    Rule { selector: String, decls: Vec<Decl> },
}

impl CssWriter {
    pub fn new(minify: bool, capacity: usize) -> Self {
        Self {
            minify,
            indent: 0,
            backend: Backend::Native {
                out: String::with_capacity(capacity),
            },
        }
    }

    pub(crate) fn recording(minify: bool) -> Self {
        Self {
            minify,
            indent: 0,
            backend: Backend::Record {
                stack: vec![RecordFrame::Ops(Vec::new())],
            },
        }
    }

    pub fn finish(self) -> String {
        match self.backend {
            Backend::Native { out } => out,
            Backend::Record { .. } => {
                unreachable!("record-mode writer must finish via into_ops()")
            }
        }
    }

    pub(crate) fn into_ops(self) -> Vec<SheetOp> {
        match self.backend {
            Backend::Record { mut stack } => {
                debug_assert_eq!(stack.len(), 1, "unclosed record frame");
                match stack.pop() {
                    Some(RecordFrame::Ops(ops)) => ops,
                    _ => unreachable!("root record frame must be Ops"),
                }
            }
            Backend::Native { .. } => {
                unreachable!("native writer has no ops; use finish()")
            }
        }
    }

    pub(crate) fn len(&self) -> usize {
        match &self.backend {
            Backend::Native { out } => out.len(),
            Backend::Record { .. } => 0,
        }
    }

    fn is_recording(&self) -> bool {
        matches!(self.backend, Backend::Record { .. })
    }

    pub fn write_str(&mut self, value: &str) {
        if self.is_recording() {
            self.push_op(SheetOp::Raw(value.to_owned()));
            return;
        }
        self.push_str(value);
    }

    pub fn newline(&mut self) {
        if self.minify || self.is_recording() {
            return;
        }
        self.push_str("\n");
    }

    pub fn layer(&mut self, name: &str, write: impl FnOnce(&mut Self)) {
        if self.is_recording() {
            self.push_op(SheetOp::LayerEnter(name.to_owned()));
            write(self);
            self.push_op(SheetOp::LayerExit);
            return;
        }
        self.write_indent();
        self.push_str("@layer ");
        self.push_str(name);
        self.block(write);
    }

    pub fn rule(&mut self, selector: &str, write: impl FnOnce(&mut Self)) {
        if self.is_recording() {
            self.push_frame(RecordFrame::Rule {
                selector: selector.to_owned(),
                decls: Vec::new(),
            });
            write(self);
            let Some(RecordFrame::Rule { selector, decls }) = self.pop_frame() else {
                unreachable!("rule frame mismatch");
            };
            self.push_op(SheetOp::Rule { selector, decls });
            return;
        }
        self.write_indent();
        self.push_str(selector);
        self.block(write);
    }

    pub fn at_rule(&mut self, rule: &str, write: impl FnOnce(&mut Self)) {
        if self.is_recording() {
            self.push_frame(RecordFrame::Ops(Vec::new()));
            write(self);
            let Some(RecordFrame::Ops(ops)) = self.pop_frame() else {
                unreachable!("at-rule frame mismatch");
            };
            self.push_op(SheetOp::AtRule {
                prelude: rule.to_owned(),
                ops,
            });
            return;
        }
        self.write_indent();
        self.push_str(rule);
        self.block(write);
    }

    pub fn at_rule_named(&mut self, prefix: &str, name: &str, write: impl FnOnce(&mut Self)) {
        if self.is_recording() {
            let prelude = format!("{prefix}{name}");
            self.at_rule(&prelude, write);
            return;
        }
        self.write_indent();
        self.push_str(prefix);
        self.push_str(name);
        self.block(write);
    }

    fn block(&mut self, write: impl FnOnce(&mut Self)) {
        debug_assert!(!self.is_recording());
        if !self.minify {
            self.push_str(" ");
        }
        self.push_str("{");
        self.newline();
        self.indent += 1;
        write(self);
        self.indent = self.indent.saturating_sub(1);
        self.write_indent();
        self.push_str("}");
        self.newline();
    }

    pub fn declaration(&mut self, prop: &str, value: &str, important: bool) {
        if value.is_empty() {
            return;
        }
        if self.is_recording() {
            let decl = Decl {
                prop: prop.to_owned(),
                value: value.to_owned(),
                important,
            };
            match &mut self.backend {
                Backend::Record { stack } => match stack.last_mut() {
                    Some(RecordFrame::Rule { decls, .. }) => decls.push(decl),
                    // `@font-face` / `@property` / `@position-try` descriptors.
                    Some(RecordFrame::Ops(ops)) => ops.push(SheetOp::Declaration(decl)),
                    None => {
                        debug_assert!(false, "declaration with empty record stack");
                    }
                },
                Backend::Native { .. } => unreachable!("is_recording implies Record backend"),
            }
            return;
        }
        self.write_indent();
        self.push_str(prop);
        self.push_str(":");
        if !self.minify {
            self.push_str(" ");
        }
        self.push_str(value);
        if important {
            self.push_str(" !important");
        }
        self.push_str(";");
        self.newline();
    }

    fn write_indent(&mut self) {
        if self.minify {
            return;
        }
        for _ in 0..self.indent {
            self.push_str("  ");
        }
    }

    fn push_str(&mut self, value: &str) {
        if let Backend::Native { out } = &mut self.backend {
            out.push_str(value);
        }
    }

    fn push_op(&mut self, op: SheetOp) {
        if let Backend::Record { stack } = &mut self.backend {
            let Some(RecordFrame::Ops(ops)) = stack.last_mut() else {
                unreachable!("sheet op outside ops frame");
            };
            ops.push(op);
        }
    }

    fn push_frame(&mut self, frame: RecordFrame) {
        if let Backend::Record { stack } = &mut self.backend {
            stack.push(frame);
        }
    }

    fn pop_frame(&mut self) -> Option<RecordFrame> {
        if let Backend::Record { stack } = &mut self.backend {
            stack.pop()
        } else {
            None
        }
    }
}
