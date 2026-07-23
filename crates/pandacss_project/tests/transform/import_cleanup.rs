//! Dead import cleanup after static inlining.

use super::common::{
    create_config, project_with_jsx, transform, transform_jsx, transform_jsx_with_helper,
    transform_with_project,
};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{HelperCxMode, Project, System, inject_cx_import, sync_internal_css_import};
use serde_json::json;

#[test]
fn removes_fully_inlined_css_import() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const cls = "color_red";
    "#);
}

#[test]
fn string_and_comment_text_do_not_keep_an_inlined_import_live() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const label = 'css'; // css is only text here
        export const cls = css({ color: 'red' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const label = 'css'; // css is only text here
    export const cls = "color_red";
    "#);
}

#[test]
fn removes_fully_inlined_css_import_from_relative_styled_system_path() {
    // A design-system build imports the generated runtime by relative path.
    // Cleanup must match it the way the extractor does (substring), or the dead
    // import survives after inlining and drags the whole styled-system runtime
    // into the consuming bundle.
    let project = Project::new(
        System::new(create_config(
            json!({ "importMap": { "css": ["styled-system/css"] } }),
        ))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { css } from '../styled-system/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_with_project(&project, "src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.code.contains("styled-system/css"));
    assert_snapshot!(output.code, @r#"
    export const cls = "color_red";
    "#);
}

#[test]
fn narrows_partial_css_import_when_only_cva_stays_live() {
    let source = indoc! {r#"
        import { css, cva } from '@panda/css';
        export const cls = css({ color: 'red' });
        export const button = cva({ base: { color: 'blue' } });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert!(output.code.contains("import { cva as __pcva }"));
    assert!(!output.code.contains("import { css"));
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    export const cls = "color_red";
    export const button = __pcva({ base: 'color_blue' });
    "#);
}

#[test]
fn removes_unused_jsx_component_import_when_element_is_erased() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const el = <div className="color_red" />;
    "#);
}

#[test]
fn keeps_styled_import_when_factory_call_stays_live() {
    let source = indoc! {r#"
        import { Box, styled } from '@panda/jsx';
        export const el = <Box color="red" />;
        export const Card = styled('div', { color: 'blue' });
    "#};

    let output = transform_with_project(&project_with_jsx(), "src/app.tsx", source);

    assert!(output.changed);
    assert!(output.code.contains("import { styled } from '@panda/jsx';"));
    assert!(!output.code.contains("Box"));
}

#[test]
fn preserves_imports_when_css_call_is_not_rewritten() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: tokenColor });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn removes_stale_internal_css_import_on_rebuild_without_helper_usage() {
    let source = indoc! {r#"
        import { cx as __pcx } from '@pandacss-internal/css';
        export const el = <div className="color_red" />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(!output.code.contains("@pandacss-internal/css"));
    assert_snapshot!(output.code, @r#"
    export const el = <div className="color_red" />;
    "#);
}

#[test]
fn sync_internal_css_import_narrows_symbols_to_live_helpers() {
    let source = indoc! {r#"
        import { cx as __pcx, cva as __pcva } from '@pandacss-internal/css';
        export const cls = __pcx('a', 'b');
    "#};

    let out = sync_internal_css_import(
        source,
        "fixture.ts",
        &pandacss_project::TransformHelperFacts {
            needs_cx: true,
            needs_cva: false,
            needs_sva: false,
        },
        HelperCxMode::Auto,
    );

    assert_snapshot!(out, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const cls = __pcx('a', 'b');
    "#);
}

#[test]
fn inject_cx_import_still_idempotent() {
    let source = indoc! {r#"
        import { cx as __pcx } from '@pandacss-internal/css';
        export const cls = __pcx('a', 'b');
    "#};

    assert_eq!(inject_cx_import(source), source);
}

#[test]
fn leaves_imports_alone_when_transform_skips_symbol_resolution() {
    // No jsxFramework → extract_for_transform skips visitor walks and sets
    // symbols_resolved=false. Dead-import cleanup must not run on empty binding facts.
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform("src/app.tsx", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}
