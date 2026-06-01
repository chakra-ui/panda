//! Byte-offset → (line, column) translation for diagnostics.
//!
//! Extraction spans stay as byte offsets for compactness (hundreds per file).
//! A `LineIndex` is built once per file and translates parse-error offsets
//! into `SourceLocation` records. Columns are 1-indexed UTF-16 code units
//! to match TypeScript / `ts-morph` — the format every Panda user already
//! sees in their editor and `tsc` output.

use pandacss_shared::{SourceLocation, SourceRange};

/// Pre-computed byte offsets of every line start. Construct once per
/// source file; lookup is O(log lines).
pub struct LineIndex<'a> {
    source: &'a str,
    line_starts: Vec<u32>,
}

impl<'a> LineIndex<'a> {
    #[must_use]
    pub fn new(source: &'a str) -> Self {
        let mut line_starts = vec![0];
        for (i, b) in source.bytes().enumerate() {
            if b == b'\n' {
                line_starts.push(u32::try_from(i + 1).unwrap_or(u32::MAX));
            }
        }
        Self {
            source,
            line_starts,
        }
    }

    /// Offsets past end clamp to the end (matches ts-morph behavior).
    #[must_use]
    pub fn locate(&self, byte_offset: u32) -> SourceLocation {
        let offset = (byte_offset as usize).min(self.source.len());
        let line_idx = self
            .line_starts
            .partition_point(|&start| (start as usize) <= offset)
            .saturating_sub(1);
        let line_start = self.line_starts[line_idx] as usize;

        // PERF(port): O(line length) UTF-16 walk per call. Fine for
        // diagnostic volumes; memoize per-line if extraction-span
        // locations ever become hot.
        let mut col_utf16: u32 = 0;
        for c in self.source[line_start..offset].chars() {
            col_utf16 = col_utf16.saturating_add(u32::try_from(c.len_utf16()).unwrap_or(1));
        }

        SourceLocation {
            line: u32::try_from(line_idx + 1).unwrap_or(1),
            column: col_utf16.saturating_add(1),
        }
    }

    #[must_use]
    pub fn locate_range(&self, start: u32, end: u32) -> SourceRange {
        SourceRange {
            start: self.locate(start),
            end: self.locate(end),
        }
    }
}
