//! Byte-offset → (line, column) translation.
//!
//! Diagnostics need human-readable locations; extraction spans stay as byte
//! offsets for compactness (one file can have hundreds of spans). We build a
//! `LineIndex` once per file and use it to translate Oxc parse-error offsets
//! into `SourceLocation` records. Columns are reported as 1-indexed UTF-16
//! code units to match TypeScript / `ts-morph` conventions — the format
//! every Panda user already sees in their editor and `tsc` output.

use serde::Serialize;

/// 1-indexed line, 1-indexed column. Columns count UTF-16 code units so a
/// span containing emoji or other surrogate-pair characters reports the
/// same column an IDE would.
#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocation {
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SourceRange {
    pub start: SourceLocation,
    pub end: SourceLocation,
}

/// Pre-computed byte offsets of every line start. Construct once per source
/// file; lookup is O(log lines).
pub(crate) struct LineIndex<'a> {
    source: &'a str,
    line_starts: Vec<u32>,
}

impl<'a> LineIndex<'a> {
    pub(crate) fn new(source: &'a str) -> Self {
        let mut line_starts = vec![0];
        for (i, b) in source.bytes().enumerate() {
            if b == b'\n' {
                // Next line begins right after the newline.
                line_starts.push(u32::try_from(i + 1).unwrap_or(u32::MAX));
            }
        }
        Self {
            source,
            line_starts,
        }
    }

    /// Translate a UTF-8 byte offset into a `SourceLocation`. Offsets past
    /// the end of the source clamp to the end (matches ts-morph behaviour).
    pub(crate) fn locate(&self, byte_offset: u32) -> SourceLocation {
        let offset = (byte_offset as usize).min(self.source.len());
        // Largest line_starts index where line_starts[i] <= offset.
        let line_idx = self
            .line_starts
            .partition_point(|&start| (start as usize) <= offset)
            .saturating_sub(1);
        let line_start = self.line_starts[line_idx] as usize;

        // Column = UTF-16 code units between line_start and offset. Walking
        // chars is O(line length) — fine for diagnostic volumes; we can
        // memoize per-line if extraction-span locations ever become hot.
        let mut col_utf16: u32 = 0;
        for c in self.source[line_start..offset].chars() {
            col_utf16 = col_utf16.saturating_add(u32::try_from(c.len_utf16()).unwrap_or(1));
        }

        SourceLocation {
            line: u32::try_from(line_idx + 1).unwrap_or(1),
            column: col_utf16.saturating_add(1),
        }
    }

    /// Convenience: locate both ends of a byte span.
    pub(crate) fn locate_range(&self, start: u32, end: u32) -> SourceRange {
        SourceRange {
            start: self.locate(start),
            end: self.locate(end),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ascii_columns_are_one_indexed() {
        let idx = LineIndex::new("hello world");
        assert_eq!(idx.locate(0), SourceLocation { line: 1, column: 1 });
        assert_eq!(idx.locate(6), SourceLocation { line: 1, column: 7 });
        assert_eq!(
            idx.locate(11),
            SourceLocation {
                line: 1,
                column: 12
            }
        );
    }

    #[test]
    fn newlines_advance_lines() {
        let idx = LineIndex::new("a\nbb\nccc");
        assert_eq!(idx.locate(0), SourceLocation { line: 1, column: 1 });
        assert_eq!(idx.locate(2), SourceLocation { line: 2, column: 1 });
        assert_eq!(idx.locate(5), SourceLocation { line: 3, column: 1 });
        assert_eq!(idx.locate(7), SourceLocation { line: 3, column: 3 });
    }

    #[test]
    fn columns_are_utf16_code_units() {
        // 😀 is U+1F600 — one char, two UTF-16 code units, four UTF-8 bytes.
        // Byte offset 4 points to the character after 😀; the column should
        // be 3 (1 + 2 UTF-16 units for the emoji).
        let idx = LineIndex::new("😀x");
        assert_eq!(idx.locate(0), SourceLocation { line: 1, column: 1 });
        assert_eq!(idx.locate(4), SourceLocation { line: 1, column: 3 });
    }

    #[test]
    fn offset_past_end_clamps() {
        let idx = LineIndex::new("ab");
        let loc = idx.locate(999);
        assert_eq!(loc, SourceLocation { line: 1, column: 3 });
    }
}
