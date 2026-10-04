use pandacss_sfc::markup::{Expressions, tag_blocks};

#[test]
fn block_finding_scans_linearly_over_many_comments() {
    let mut source = String::from("<script>const a = 1;</script>\n");
    for _ in 0..10_000 {
        source.push_str("<!-- c -->\n");
    }
    source.push_str("<template><p/></template>\n");
    assert_eq!(
        tag_blocks(&source, "template", Expressions::Interpolations).len(),
        1
    );
}

#[test]
fn comment_marker_in_style_body_does_not_hide_later_script() {
    let source = "<style>.a::after { content: '<!--' }</style>\n<script>const a = 1;</script>";
    assert_eq!(
        tag_blocks(source, "script", Expressions::Interpolations).len(),
        1
    );
    assert_eq!(
        tag_blocks(source, "style", Expressions::Interpolations).len(),
        1
    );
}

#[test]
fn comment_marker_in_an_attribute_does_not_hide_later_script() {
    let source = "<template><div title=\"<!--\">x</div></template>\n<script>const a = 1;</script>";
    assert_eq!(
        tag_blocks(source, "script", Expressions::Interpolations).len(),
        1
    );
    assert_eq!(
        tag_blocks(source, "template", Expressions::Interpolations).len(),
        1
    );
}

#[test]
fn unclosed_comment_marker_in_an_interpolation_does_not_hide_later_script() {
    let source = "<template><p>{{ '<!--' }}</p></template>\n<script>const a = 1;</script>";
    assert_eq!(
        tag_blocks(source, "script", Expressions::Interpolations).len(),
        1
    );
}

#[test]
fn many_unclosed_comment_markers_still_find_the_script() {
    let source = format!("{}<script>const a = 1;</script>", "<!-- ".repeat(20_000));
    assert_eq!(
        tag_blocks(&source, "script", Expressions::Interpolations).len(),
        1
    );
}

#[test]
fn comment_marker_in_script_body_does_not_hide_later_style() {
    let source = "<script>const m = '<!--';</script>\n<style>.a { color: red }</style>";
    assert_eq!(
        tag_blocks(source, "style", Expressions::Interpolations).len(),
        1
    );
    assert_eq!(
        tag_blocks(source, "script", Expressions::Interpolations).len(),
        1
    );
}
