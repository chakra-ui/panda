use indoc::indoc;
use insta::assert_yaml_snapshot;

use super::common::boundaries;

#[test]
fn preserves_utf8_byte_offsets() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        # Café 🐼

        <Box color="red" /> {css({color:"blue"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 83
    calls:
      - source: "css({color:\"blue\"})"
        start: 104
        end: 123
    "#);
}

#[test]
fn preserves_crlf_byte_offsets() {
    let source = "import { css } from '@panda/css';\nimport { Box } from '@panda/jsx';\n\n<Box\r\n color=\"red\"\r\n css={{margin:\"2\"}}\r\n/>";
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
    calls: []
    "#);
}

#[test]
fn counts_reference_label_characters_instead_of_bytes() {
    let source = format!(
        "[{}]: {{css({{color:\"wrong\"}})}}\n\n<Box color=\"red\" />",
        "界".repeat(500)
    );
    assert_yaml_snapshot!(boundaries(&source), @r#"
    elements:
      - name: Box
        start: 1528
    calls: []
    "#);
}

#[test]
fn preserves_offsets_after_bom_and_import() {
    let source = "\u{feff}import { css } from \"@panda/css\";\n\n{css({color:\"red\"})}";
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 39
        end: 57
    "#);
}

#[test]
fn preserves_offsets_after_bom_and_flow_element() {
    let source = "\u{feff}<Box />\nimport { css } from \"@panda/css\";\n\n{css({color:\"red\"})}";
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 3
    calls:
      - source: "css({color:\"red\"})"
        start: 47
        end: 65
    "#);
}
