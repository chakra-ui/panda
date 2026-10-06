//! Same-offset output construction. Only this module synthesizes JavaScript punctuation.

use std::ops::Range;

use crate::markup::{copy_range, finish_mask};

enum Tail {
    Empty,
    Expression { close: usize },
    Module { end: usize },
}

pub(super) struct ExtractionSource {
    bytes: Vec<u8>,
    tail: Tail,
}

impl ExtractionSource {
    pub(super) fn new(source: &str) -> Self {
        Self {
            bytes: source
                .bytes()
                .map(|byte| {
                    if matches!(byte, b'\r' | b'\n') {
                        byte
                    } else {
                        b' '
                    }
                })
                .collect(),
            tail: Tail::Empty,
        }
    }

    pub(super) fn push_module(&mut self, source: &str, range: Range<usize>) {
        self.close_expression_array();
        copy_range(&mut self.bytes, source, range.start, range.end);
        self.tail = Tail::Module { end: range.end };
    }

    pub(super) fn push_expression(
        &mut self,
        source: &str,
        open: usize,
        content: Range<usize>,
        close: usize,
    ) {
        self.bytes[open] = match self.tail {
            Tail::Expression { .. } => b',',
            Tail::Empty | Tail::Module { .. } => b'[',
        };
        if let Tail::Module { end } = self.tail {
            // Prevent ASI from treating the array as a continuation of a semicolonless export.
            let separator = (end..open)
                .find(|&index| self.bytes[index] == b' ')
                .or_else(|| (end..open).find(|&index| matches!(self.bytes[index], b'\r' | b'\n')));
            if let Some(separator) = separator {
                self.bytes[separator] = b';';
            }
        }
        copy_range(&mut self.bytes, source, content.start, content.end);
        self.tail = Tail::Expression { close };
    }

    pub(super) fn clear(&mut self, range: Range<usize>) {
        self.bytes[range].fill(b' ');
    }

    pub(super) fn finish(mut self) -> String {
        self.close_expression_array();
        finish_mask(self.bytes)
    }

    fn close_expression_array(&mut self) {
        if let Tail::Expression { close } = self.tail {
            self.bytes[close] = b']';
        }
        self.tail = Tail::Empty;
    }
}
