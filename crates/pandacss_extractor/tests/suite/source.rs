use pandacss_extractor::LineIndex;
use pandacss_shared::SourceLocation;

#[test]
fn ascii_columns_are_one_indexed() {
    let idx = LineIndex::new("hello world");
    assert_eq!(idx.locate(0), SourceLocation { line: 1, column: 1 });
    assert_eq!(idx.locate(6), SourceLocation { line: 1, column: 7 });
    assert_eq!(
        idx.locate(11),
        SourceLocation {
            line: 1,
            column: 12,
        },
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
    // The emoji is one char, two UTF-16 code units, four UTF-8 bytes.
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
