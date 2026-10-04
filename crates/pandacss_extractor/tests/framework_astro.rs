use std::fmt::Write as _;

use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};

use crate::common::{extract_shape, import_shape, panda_config, panda_jsx_config};
use pandacss_extractor::{extract, extract_debug, extract_transform, scan_imports};

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

    let result = extract(source, "page.astro", &panda_jsx_config());
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

    let result = extract(source, "page.astro", &panda_jsx_config());
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

    let result = extract(source, "page.astro", &panda_jsx_config());
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

#[test]
fn jsx_extraction_requires_jsx_framework() {
    let source = indoc! {r#"
        ---
        import { Box } from '@panda/jsx';
        import { Image } from 'astro:assets';
        ---
        <Box color="red" />
        <Image width="900" height="800" />
    "#};
    let result = extract(source, "page.astro", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");
}

#[test]
fn uppercase_component_extracts_with_jsx_framework() {
    let source = indoc! {r#"
        ---
        import { css } from '@panda/css';
        import { Image } from 'astro:assets';
        ---
        <Image width="900" height="800" />
    "#};
    let result = extract(source, "page.astro", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @r#"
    calls: []
    jsx:
      - name: Image
        data:
          width: "900"
          height: "800"
    "#);
}

#[test]
fn fence_inside_a_frontmatter_string_keeps_the_frontmatter_open() {
    let source = indoc! {r#"
        ---
        import { css } from "@panda/css";
        const sample = `---
        const x = 1;
        ---
        <div />`;
        const before = css({ color: "red" });
        const after = css({ color: "blue" });
        ---

        <pre class={before}>{sample}</pre>
        <p class={after}>after</p>
        <p class={css({ color: "green" })}>template</p>
    "#};
    let result = extract(source, "index.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          color: blue
      - name: css
        data:
          color: green
    jsx: []
    ");
}

#[test]
fn shorthand_attribute_inside_an_expression_parses() {
    let source = indoc! {r#"
        ---
        import { css } from "@panda/css";
        import Panel from "./Panel.astro";
        const show = true;
        const id = "x";
        ---

        {show && (
          <Panel {id}>
            <p class={css({ color: "orange" })}>inside</p>
          </Panel>
        )}
        <p class={css({ color: "pink" })}>after</p>
    "#};
    let result = extract(source, "index.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: orange
      - name: css
        data:
          color: pink
    jsx: []
    ");
}

#[test]
fn script_tag_named_in_a_frontmatter_comment_parses() {
    let source = indoc! {r#"
        ---
        import { css } from "@panda/css";
        // The <script> below hydrates the list.
        const a = css({ color: "red" });
        ---
        <p class={a}>t</p>
        <p class={css({ color: "teal" })}>t</p>
        <script>
          type Log = { id: number };
          const x = 1;
        </script>
    "#};
    let result = extract(source, "index.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          color: teal
    jsx: []
    ");
}

#[test]
fn astro_only_markup_inside_expressions_extracts() {
    let source = indoc! {r#"
        ---
        import { css } from '@panda/css';
        const show = true;
        const id = 'x';
        const items = ['a'];
        ---
        {show && (<div><!-- note --><p class={css({ color: 'red' })} /></div>)}
        {show && <div data-id=123 class={css({ color: 'blue' })} />}
        {show && <div title=`${css({ color: 'green' })}` />}
        {show && (<div><input type="text"><p class={css({ color: 'teal' })} /></div>)}
        {show && <p class={css({ color: 'pink' })}>5 < 10</p>}
        {show && <b /><i class={css({ color: 'gray' })} />}
        {show && <div class:list={['a']} set:html={id} @click="x" class={css({ color: 'navy' })} />}
        {items.map((item) => <li class={css({ color: 'maroon' })}>{item}</li>)}
        <p>{'a}b'.replace(/}/g, '')}</p>
        <p>Don't miss https://x.dev</p>
        <math><mi>{R}^{2x}</mi></math>
        <div is:raw>{not js <%}</div>
        <p class={css({ color: 'olive' })} />
    "#};
    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          color: blue
      - name: css
        data:
          color: green
      - name: css
        data:
          color: teal
      - name: css
        data:
          color: pink
      - name: css
        data:
          color: gray
      - name: css
        data:
          color: navy
      - name: css
        data:
          color: maroon
      - name: css
        data:
          color: olive
    jsx: []
    ");
}

#[test]
fn frontmatter_fences_on_one_line_and_text_before_them() {
    let source = "notes\n--- import { css } from '@panda/css'; const a = css({ color: 'red' }) ---\n<p class={a} />";
    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn comment_before_the_fence_means_no_frontmatter_like_astro() {
    let source = "<!-- header -->\n---\nimport { css } from '@panda/css';\n---\n<p class={css({ color: 'red' })} />\n";
    let result = extract(source, "page.astro", &panda_config());
    assert!(result.calls.is_empty());
}

#[test]
fn components_inside_expressions_and_astro_attribute_forms() {
    let source = indoc! {r#"
        ---
        import { Box } from '@panda/jsx';
        const show = true;
        const color = 'red';
        ---
        <Box {color} p=4 m=`2` />
        {show && <Box color="blue" />}
    "#};
    let result = extract(source, "page.astro", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @r#"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
          p: "4"
          m: "2"
      - name: Box
        data:
          color: blue
    "#);
}

#[test]
fn frontmatter_jsx_still_extracts() {
    let source = indoc! {r#"
        ---
        import { Box } from '@panda/jsx';
        const badge = <Box color="red" />;
        ---
        {badge}
    "#};
    let result = extract(source, "page.astro", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn top_level_for_await_extracts() {
    let source = "---\nconst stream = [];\nfor await (const n of stream) {}\n---\n<p />\n";
    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
}

#[test]
fn astro_parse_errors_are_reported_at_their_source() {
    let source = "---\nimport { css } from '@panda/css';\n---\n<p class={css({ color: 'red' })} />\n<div></span>\n";
    let result = extract(source, "page.astro", &panda_config());
    let first = result
        .diagnostics
        .first()
        .expect("a parse error is reported");
    let span = first.span.as_ref().expect("diagnostic has a span");
    assert_snapshot!(&source[span.start as usize..span.end as usize], @"span");
    assert_eq!(result.calls.len(), 1);
}

#[test]
fn import_spans_stop_before_the_closing_fence() {
    let source = "---\nimport { css } from '@panda/css'\n---\n<p/>";
    let imports = scan_imports(source, "page.astro").imports;
    let span = imports[0].span;
    assert!(source[span.start as usize..span.end as usize].ends_with('\''));
}

#[test]
fn frontmatter_and_fences_on_one_line_extract_the_template_call() {
    let source = "--- import { css } from '@panda/css' ---\n<p class={css({ color: 'red' })} />";
    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn diagnostic_spans_stay_inside_the_source() {
    let source = "---\nconst a = 1\n---\n<p>{a +}</p>\n";
    let result = extract(source, "page.astro", &panda_config());
    assert!(!result.diagnostics.is_empty());
    for diagnostic in &result.diagnostics {
        if let Some(span) = &diagnostic.span {
            assert!(span.end as usize <= source.len(), "{span:?}");
        }
    }
}

#[test]
fn client_script_after_the_template_keeps_its_calls_last() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const title = css({ color: 'blue' });
        ---

        <p class={css({ color: 'green' })}>hi</p>
        <script>
          import { css } from '@panda/css';
          const el = document.querySelector('p');
          el.className = css({ color: 'red' });
        </script>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: blue
      - name: css
        data:
          color: green
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn client_script_extracts_without_a_frontmatter_import() {
    let source = indoc! {r"
        <p>hi</p>
        <script>
          import { css } from '@panda/css';
          document.body.className = css({ color: 'red' });
        </script>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn inline_script_calls_are_not_extracted() {
    let source = indoc! {r"
        <script is:inline>
          import { css } from '@panda/css';
          document.body.className = css({ color: 'red' });
        </script>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.calls.is_empty());
}

#[test]
fn typed_client_script_extracts() {
    let source = indoc! {r"
        <script>
          import { css } from '@panda/css';
          type Tone = 'red' | 'blue';
          const tone: Tone = 'red';
          document.body.className = css({ color: 'red' });
        </script>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn client_script_without_imports_is_not_parsed() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const title = css({ color: 'blue' });
        ---

        <script>
          const = ;
        </script>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: blue
    jsx: []
    ");
}

#[test]
fn broken_client_script_warns_and_frontmatter_still_extracts() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const title = css({ color: 'blue' });
        ---

        <script>
          import { css } from '@panda/css';
          const = ;
        </script>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(
        result
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code == "js_parse_error"),
        "{:?}",
        result.diagnostics
    );
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: blue
    jsx: []
    ");
}

#[test]
fn division_after_a_function_expression_keeps_the_style_call() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        ---
        <p class={css({ color: 'red' }) || function(){} / 2}/>
    "};
    let result = extract(source, "Card.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn regex_brace_at_the_start_of_an_attribute_expression_keeps_the_style_call() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        ---

        <p class={/\}/.test(value) ? css({ color: 'red' }) : ''} />
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

fn nested_elements(depth: usize) -> String {
    let mut source = String::from("---\nimport { css } from '@panda/css';\n---\n");
    for level in 0..depth {
        let _ = write!(source, "<div class={{css({{ zIndex: {level} }})}}>");
    }
    source.push_str(&"</div>".repeat(depth));
    source.push_str("\n<p class={css({ color: 'red' })}>after</p>\n");
    source
}

#[test]
fn elements_nested_past_the_stack_limit_still_extract_every_call() {
    let result = extract(&nested_elements(200), "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 201);
}

#[test]
fn a_thousand_nested_elements_extract_every_call() {
    let result = extract(&nested_elements(1_000), "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 1_001);
}

#[test]
fn markup_nested_inside_an_expression_past_the_stack_limit_extracts() {
    let depth = 300;
    let mut source = String::from("---\nimport { css } from '@panda/css';\n---\n{show && ");
    for level in 0..depth {
        let _ = write!(source, "<div class={{css({{ zIndex: {level} }})}}>");
    }
    source.push_str(&"</div>".repeat(depth));
    source.push_str("}\n");
    let result = extract(&source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), depth);
}

#[test]
fn nesting_past_the_hard_limit_warns_and_keeps_the_frontmatter_and_earlier_markup() {
    let source = format!(
        "---\nimport {{ css }} from '@panda/css';\nconst title = css({{ color: 'blue' }});\n---\n<p class={{css({{ color: 'green' }})}}>before</p>\n{}{}",
        "<div>".repeat(5_000),
        "</div>".repeat(5_000),
    );
    let result = extract(&source, "page.astro", &panda_config());
    assert_eq!(result.diagnostics.len(), 1, "{:?}", result.diagnostics);
    assert!(
        result.diagnostics[0]
            .message
            .starts_with("Markup is nested more than 4096 levels deep"),
        "{:?}",
        result.diagnostics
    );
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: blue
      - name: css
        data:
          color: green
    jsx: []
    ");
}

const PAGE_WITH_CLIENT_SCRIPT: &str = "---\nimport { css } from '@panda/css';\nconst title = css({ color: 'blue' });\n---\n<script>\n  import { css } from '@panda/css';\n  css({ color: 'red' });\n</script>\n";

#[test]
fn debug_extraction_lists_client_script_calls_like_the_build() {
    let config = panda_config();
    let built: Vec<_> = extract(PAGE_WITH_CLIENT_SCRIPT, "page.astro", &config)
        .calls
        .iter()
        .map(|call| call.span)
        .collect();
    let debug = extract_debug(PAGE_WITH_CLIENT_SCRIPT, "page.astro", &config);
    let debugged: Vec<_> = debug.calls.iter().map(|call| call.span).collect();
    assert_eq!(debugged, built);
    assert_eq!(debugged.len(), 2);
}

#[test]
fn transform_extraction_leaves_client_script_calls_alone() {
    let result = extract_transform(PAGE_WITH_CLIENT_SCRIPT, "page.astro", &panda_config());
    let script_start = u32::try_from(PAGE_WITH_CLIENT_SCRIPT.find("<script>").unwrap()).unwrap();
    assert_eq!(result.calls.len(), 1);
    assert!(
        result
            .calls
            .iter()
            .all(|call| call.span.end <= script_start)
    );
}

#[test]
fn client_script_before_the_markup_keeps_its_calls_in_source_order() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const title = css({ color: 'blue' });
        ---

        <script>
          import { css } from '@panda/css';
          document.body.className = css({ color: 'red' });
        </script>
        <p class={css({ color: 'green' })}>hi</p>
        <script>
          import { css } from '@panda/css';
          document.title = css({ color: 'navy' }) + css({ color: 'teal' });
        </script>
    "};

    let result = extract(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    let starts: Vec<_> = result.calls.iter().map(|call| call.span.start).collect();
    assert!(starts.is_sorted(), "{starts:?}");
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: blue
      - name: css
        data:
          color: red
      - name: css
        data:
          color: green
      - name: css
        data:
          color: navy
      - name: css
        data:
          color: teal
    jsx: []
    ");
}

#[test]
fn client_script_slices_keep_file_spans_and_independent_scopes() {
    let source = "<p>😀</p>\r\n<script>import {css} from '@panda/css'; const color = 'red'; css({color});</script>\r\n<script>import {css} from '@panda/css'; const color = 'blue'; css({color});</script>";
    let result = extract_debug(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 2);
    for call in &result.calls {
        assert_eq!(
            &source[call.span.start as usize..call.span.end as usize],
            "css({color})"
        );
    }
    for (call, color) in result.calls.iter().zip(["red", "blue"]) {
        assert_eq!(
            call.data,
            vec![Some(pandacss_literal::Literal::Object(vec![(
                "color".into(),
                pandacss_literal::Literal::String(color.into())
            )]))]
        );
    }
}

#[test]
fn client_script_parse_diagnostics_keep_file_locations() {
    let source = "<p>😀</p>\r\n<script>import {css} from '@panda/css';\r\nconst = ;</script>";
    let result = extract(source, "page.astro", &panda_config());
    let diagnostic = result
        .diagnostics
        .iter()
        .find(|d| d.code == "js_parse_error")
        .expect("parse warning");
    let span = diagnostic.span.expect("span");
    assert!(span.start >= u32::try_from(source.find("const").unwrap()).unwrap());
    assert_eq!(
        diagnostic.location,
        Some(pandacss_extractor::LineIndex::new(source).locate_range(span.start, span.end))
    );
    assert_eq!(diagnostic.location.unwrap().start.line, 3);
}

#[test]
fn client_script_source_refs_point_to_calls_after_source_order_sorting() {
    let source = "---\nimport {css} from '@panda/css';\n---\n<script>import {css} from '@panda/css'; css({color:'red'});</script><p class={css({color:'blue'})}/><script>import {css} from '@panda/css'; css({color:'green'});</script>";
    let result = pandacss_extractor::extract_verbose(source, "page.astro", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 3);
    assert_eq!(result.style_source_refs.len(), 3);
    for source_ref in &result.style_source_refs {
        assert_eq!(
            result.calls[source_ref.owner.index as usize].span,
            source_ref.owner.span
        );
        assert_eq!(
            &source[source_ref.key_span.start as usize..source_ref.key_span.end as usize],
            "color"
        );
    }
}
