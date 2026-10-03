mod common;

use common::{lowered, show};
use indoc::indoc;
use insta::{assert_debug_snapshot, assert_snapshot};
use pandacss_astro::AstroAttributeValue;

#[test]
fn frontmatter_is_copied_and_opens_the_template_array() {
    let source = indoc! {"
        ---
        import { css } from '@panda/css';
        const a = css({ color: 'red' });
        ---
        <p class={a}>t</p>
    "};
    assert_snapshot!(show(&lowered(source).canvas), @r"
    |
    |import { css } from '@panda/css';
    |const a = css({ color: 'red' });
    |;[
    |         ,a
    |]
    ");
}

#[test]
fn fence_inside_a_template_literal_does_not_close_the_frontmatter() {
    let source = indoc! {"
        ---
        const sample = `---
        const x = 1;
        ---
        <div />`;
        const before = css({ color: 'red' });
        ---
        <pre class={before}>{sample}</pre>
    "};
    assert_snapshot!(show(&lowered(source).canvas), @r"
    |
    |const sample = `---
    |const x = 1;
    |---
    |<div />`;
    |const before = css({ color: 'red' });
    |;[
    |           ,before  ,sample
    |]
    ");
}

#[test]
fn fences_on_the_same_line_and_text_before_them() {
    let source = "hello\n--- const a = 1 ---\n<p />";
    assert_snapshot!(show(&lowered(source).canvas), @r"
    |
    |    const a = 1 ;[
    |     ]
    ");
}

#[test]
fn file_without_frontmatter_opens_the_array_at_the_template() {
    let source = "<p class={css({ color: 'red' })}>x</p>";
    assert_snapshot!(show(&lowered(source).canvas), @"|[        ,css({ color: 'red' })       ]");
}

#[test]
fn empty_file_lowers_to_nothing() {
    assert_eq!(lowered("").canvas, "");
}

#[test]
fn frontmatter_only_file() {
    let source = "---\nconst a = 1\n---\n";
    assert_snapshot!(show(&lowered(source).canvas), @r"
    |
    |const a = 1
    |;[
    |]
    ");
}

#[test]
fn shorthand_attribute_inside_an_expression() {
    let source = indoc! {"
        {show && (
          <Panel {id}>
            <p class={css({ color: 'orange' })}>inside</p>
          </Panel>
        )}
    "};
    assert_snapshot!(show(&lowered(source).canvas), @r"
    |[show && (
    |  [      ,id
    |             ,css({ color: 'orange' })
    |         ]
    |)
    |]
    ");
}

#[test]
fn script_tag_named_in_a_frontmatter_comment() {
    let source = indoc! {"
        ---
        // The <script> below hydrates the list.
        const a = css({ color: 'red' });
        ---
        <p class={a}>t</p>
        <script>
          type Log = { id: number };
        </script>
    "};
    assert_snapshot!(show(&lowered(source).canvas), @r"
    |
    |// The <script> below hydrates the list.
    |const a = css({ color: 'red' });
    |;[
    |         ,a
    |
    |
    |
    |]
    ");
}

#[test]
fn markup_inside_an_arrow_keeps_its_scope() {
    let source = "<ul>{items.map((item) => <li class={css({ color: item })}>{item}</li>)}</ul>";
    assert_snapshot!(
        show(&lowered(source).canvas),
        @"|[   ,items.map((item) => [         ,css({ color: item })  ,item     ])      ]"
    );
}

#[test]
fn several_roots_in_one_expression() {
    let source = "{show && <b/><i class={x}/>}";
    assert_snapshot!(show(&lowered(source).canvas), @"|[show && [            ,x  ] ]");
}

#[test]
fn comments_doctype_and_text_are_blank() {
    let source = "<!DOCTYPE html>\n<!-- c {x} -->\n<p>5 < 10 {y}</p>";
    assert_snapshot!(show(&lowered(source).canvas), @r"
    |[
    |
    |          ,y     ]
    ");
}

#[test]
fn raw_text_elements_keep_braces_as_text() {
    let source = "<div is:raw>{not js}</div><math>{R}</math><style>.a{color:red}</style>{z}";
    assert_snapshot!(
        show(&lowered(source).canvas),
        @"|[                                                                     ,z ]"
    );
}

#[test]
fn every_attribute_form() {
    let source = "<Box {id} title=`a ${id}` data-id=12 class:list={[a]} @click=\"x\" {...rest} e={} {/* c */} />";
    assert_snapshot!(
        show(&lowered(source).canvas),
        @"|[    ,id       ,`a ${id}`                       ,[a]             ,...rest                   ]"
    );
}

#[test]
fn object_shorthand_and_markup_inside_a_spread() {
    let source = "<C {{ a: 1 }} {...{ x: <br> }} />";
    assert_snapshot!(show(&lowered(source).canvas), @"|[  ,{ a: 1 }  ,...{ x: [  ] }    ]");
}

#[test]
fn crlf_line_endings_are_kept() {
    let source = "---\r\nconst a = css({ color: 'red' });\r\n---\r\n<p class={a}>é</p>\r\n";
    assert_eq!(
        lowered(source).canvas,
        "   \r\nconst a = css({ color: 'red' });\r\n;[ \r\n         ,a        \r\n]"
    );
}

#[test]
fn multi_byte_text_keeps_offsets() {
    let source = "<p>héllo → {css({ content: '\u{201c}ü\u{201d}' })} 日本</p>";
    assert_eq!(
        lowered(source).canvas,
        "[             ,css({ content: '\u{201c}ü\u{201d}' })            ]"
    );
}

#[test]
fn top_level_for_await_parses_as_a_module() {
    let source = "---\nfor await (const n of stream) {}\n---\n";
    assert!(lowered(source).diagnostics.is_empty());
}

#[test]
fn unclosed_frontmatter_fence_is_template_text() {
    let document = lowered("---\nconst a = 1");
    assert!(document.diagnostics.is_empty());
    assert_snapshot!(show(&document.canvas), @r"
    |[
    |           ]
    ");
}

#[test]
fn elements_record_every_attribute_form() {
    let source = "<Box {id} title=`a ${id}` data-id=12 color=\"red\" {...rest} e={} disabled />";
    let document = lowered(source);
    let slice = |range: &std::ops::Range<u32>| &source[range.start as usize..range.end as usize];
    let element = &document.elements[0];
    assert_eq!(slice(&element.name), "Box");
    assert_eq!(slice(&element.opening), source);
    let attributes: Vec<_> = element
        .attributes
        .iter()
        .map(|attribute| {
            let value = match &attribute.value {
                AstroAttributeValue::Static(range) => format!("static {}", slice(range)),
                AstroAttributeValue::Expression(range) => format!("expression {}", slice(range)),
                AstroAttributeValue::Spread(range) => format!("spread {}", slice(range)),
                AstroAttributeValue::Boolean => "boolean".to_owned(),
                AstroAttributeValue::Empty => "empty".to_owned(),
            };
            (attribute.name.as_ref().map(slice), value)
        })
        .collect();
    assert_debug_snapshot!(attributes, @r#"
    [
        (
            Some(
                "id",
            ),
            "expression id",
        ),
        (
            Some(
                "title",
            ),
            "expression `a ${id}`",
        ),
        (
            Some(
                "data-id",
            ),
            "static 12",
        ),
        (
            Some(
                "color",
            ),
            "static red",
        ),
        (
            None,
            "spread rest",
        ),
        (
            Some(
                "e",
            ),
            "empty",
        ),
        (
            Some(
                "disabled",
            ),
            "boolean",
        ),
    ]
    "#);
}

#[test]
fn astro_parse_errors_are_reported_with_original_spans() {
    let document = pandacss_astro::lower("<div></span>");
    assert!(
        document
            .elements
            .iter()
            .all(|element| element.name.start < element.name.end)
    );
    let errors: Vec<_> = document
        .diagnostics
        .iter()
        .map(|diagnostic| (diagnostic.message.as_str(), diagnostic.span.clone()))
        .collect();
    assert_debug_snapshot!(errors, @r#"
    [
        (
            "Closing tag '</span>' has no matching opening tag.",
            Some(
                7..11,
            ),
        ),
        (
            "Unexpected token",
            Some(
                12..12,
            ),
        ),
    ]
    "#);
}
