use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};

use crate::common::{extract_shape, import_shape, panda_config};
use pandacss_extractor::{extract, scan_imports};

#[test]
fn scan_imports_reads_frontmatter() {
    let source = indoc! {r#"
        ---
        import { Box } from '@panda/jsx';
        import { css } from '@panda/css';
        const { title } = Astro.props;
        ---

        <Box color="red" />
    "#};

    let scan = scan_imports(source, "Card.astro");
    assert!(scan.diagnostics.is_empty());
    assert_yaml_snapshot!(import_shape(&scan), @r#"
    - module: "@panda/jsx"
      specifiers:
        - "Box:Box"
    - module: "@panda/css"
      specifiers:
        - "css:css"
    "#);
}

#[test]
fn attribute_and_children_expressions_extract() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        ---

        <p class={css({ fontWeight: 'bold' })}>
          {css({ color: 'red' })}
        </p>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          fontWeight: bold
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn frontmatter_const_resolves_in_template() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const panel = { padding: '4px', color: 'red' }
        ---

        <section class={css(panel)} />
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          padding: 4px
          color: red
    jsx: []
    ");
}

#[test]
fn jsx_style_props_extract_from_template() {
    let source = indoc! {r#"
        ---
        import { Box } from '@panda/jsx';
        ---

        <Box color="red" fontSize="2xl" />
    "#};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
          fontSize: 2xl
    ");
}

#[test]
fn style_blocks_do_not_leak_into_extraction() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        ---

        <style>
          .card { padding: 4px }
        </style>
        <div class={css({ margin: '8px' })} />
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          margin: 8px
    jsx: []
    ");
}

#[test]
fn file_without_frontmatter_masks_gracefully() {
    // No leading `---`: the masker must not panic and must still parse cleanly.
    // (Astro imports live in frontmatter, so a fence-less file has nothing matched.)
    let source = indoc! {r"
        <div class={css({ display: 'flex' })} />
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert!(result.calls.is_empty());
}

#[test]
fn jsx_comments_do_not_break_the_parse() {
    // `{/* … */}` is a comment-only expression; dropping it (rather than copying it
    // to `(/* … */)`, an empty paren Oxc rejects) keeps the parse clean.
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        ---

        <div>
          {/* layout note */}
          <p class={css({ color: 'red' })} />
        </div>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn astro_directives_and_control_flow_extract() {
    // Astro attribute directives (`class:list`, `set:html`) and JS control-flow
    // expressions all reduce to plain JSX expressions the mask copies wholesale.
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const open = true;
        const items = [1, 2];
        ---

        <div class:list={[css({ color: 'red' })]} />
        <article set:html={css({ margin: '8px' })} />
        {open && <p class={css({ padding: '4px' })} />}
        <ul>{items.map((i) => <li class={css({ display: 'flex' })}>{i}</li>)}</ul>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          margin: 8px
      - name: css
        data:
          padding: 4px
      - name: css
        data:
          display: flex
    jsx: []
    ");
}

#[test]
fn top_level_return_in_frontmatter_is_valid_astro() {
    // Frontmatter is a render-function body, so a top-level `return` is valid Astro.
    // Without it allowed, Oxc errors on the masked module and aborts the build.
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const open = true;
        if (open) {
          return null;
        }
        ---

        <div class={css({ color: 'red' })} />
    "};

    let result = extract(source, "Foo.astro", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn spans_point_into_the_original_astro_source() {
    // The mask is a same-length blank-and-copy, so a surviving token keeps its
    // original byte offset: the reported span slices the ORIGINAL source verbatim.
    let source =
        "---\nimport { css } from '@panda/css';\n---\n<div class={css({ color: 'red' })} />\n";
    let result = extract(source, "page.astro", &panda_config());
    assert_eq!(result.calls.len(), 1);
    let span = &result.calls[0].span;
    assert_snapshot!(&source[span.start as usize..span.end as usize], @"css({ color: 'red' })");
}
