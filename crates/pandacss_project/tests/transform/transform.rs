use super::common::{project, transform};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{TransformOptions, transform_source};

#[test]
fn rewrites_static_css_call_to_class_string() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', marginTop: '4px' });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "color_red margin-top_4px";"#);
}

#[test]
fn leaves_open_ended_dynamic_css_call_untouched() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        export const cls = css({ color: props.color });
    "};

    let output = transform("src/button.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_multiple_static_css_calls() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        css({ color: 'red' });
        css({ marginTop: '4px' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    "color_red";
    "margin-top_4px";
    "#);
}

#[test]
fn rewrites_namespace_css_member_call() {
    let source = indoc! {r#"
        import * as panda from '@panda/css';
        export const cls = panda.css({ color: 'red' });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "color_red";"#);
}

#[test]
fn multi_arg_css_uses_last_write_wins() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' }, { color: 'blue', padding: '4px' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "color_blue padding_4px";"#);
}

#[test]
fn leaves_source_without_css_calls_unchanged() {
    let source = indoc! {r"
        export const value = 1 + 2;
    "};

    let output = transform("src/math.ts", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn mixed_static_and_dynamic_css_calls_rewrite_only_static_sites() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const staticCls = css({ color: 'red' });
        export const dynamicCls = css({ color: props.color });
    "#};

    let output = transform("src/mixed.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { css } from '@panda/css';
    export const staticCls = "color_red";
    export const dynamicCls = css({ color: props.color });
    "#);
}

#[test]
fn transform_output_metadata_for_static_rewrite() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_source(
        &project(),
        "src/button.tsx",
        source,
        &TransformOptions::default(),
    );

    let map = output
        .map
        .as_ref()
        .expect("transform should emit a source map");
    let parsed: serde_json::Value = serde_json::from_str(map).expect("valid source map json");
    assert_eq!(parsed["version"], 3);
    assert!(parsed["mappings"].is_string());

    insta::assert_yaml_snapshot!(serde_json::json!({
        "changed": output.changed,
        "bailed": output.bailed,
        "helper": {
            "needs_cx": output.helper.needs_cx,
        },
        "dependencies": output.dependencies,
        "diagnostics": output.diagnostics.len(),
        "has_map": output.map.is_some(),
    }), @r#"
    ---
    changed: true
    bailed: false
    helper:
      needs_cx: false
    dependencies: []
    diagnostics: 0
    has_map: true
    "#);
}
