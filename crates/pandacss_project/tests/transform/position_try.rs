use super::common::{create_config, transform, transform_with_project};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{Project, System};
use pandacss_shared::position_try_ident;
use serde_json::json;

#[test]
fn rewrites_a_static_position_try_object_to_the_ident_string() {
    let source = indoc! {r#"
        import { positionTry } from '@panda/css';
        export const bottom = positionTry({
          top: 'anchor(bottom)',
          insetInlineStart: 'anchor(start)',
        });
    "#};

    let output = transform("src/pt.ts", source);
    let expected = position_try_ident(
        &json!({ "top": "anchor(bottom)", "insetInlineStart": "anchor(start)" }),
        "",
    );

    assert!(output.changed);
    assert!(!output.bailed);
    assert!(!output.code.contains("positionTry("));
    assert!(!output.code.contains("@panda/css"));
    assert!(expected.starts_with("--pt_"));
    assert_snapshot!(output.code, @r#"
    export const bottom = "--pt_dAuNmh";
    "#);
}

#[test]
fn removes_a_fully_inlined_position_try_import() {
    let source = indoc! {r#"
        import { positionTry } from '@panda/css';
        export const bottom = positionTry({ top: 'anchor(bottom)' });
    "#};

    let output = transform("src/pt.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const bottom = "--pt_glpgGL";"#);
}

#[test]
fn inlines_position_try_alongside_css_and_drops_the_dead_import() {
    let source = indoc! {r#"
        import { css, positionTry } from '@panda/css';
        export const cls = css({ color: 'red' });
        export const bottom = positionTry({ top: 'anchor(bottom)' });
    "#};

    let output = transform("src/pt.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const cls = "color_red";
    export const bottom = "--pt_glpgGL";
    "#);
}

#[test]
fn leaves_a_dynamic_position_try_call_unchanged() {
    let source = indoc! {r#"
        import { positionTry } from '@panda/css';
        export const bottom = positionTry(options);
    "#};

    let output = transform("src/pt.ts", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn keeps_the_runtime_import_when_only_a_static_sibling_is_inlined() {
    let source = indoc! {r#"
        import { positionTry } from '@panda/css';
        export const bottom = positionTry({ top: 'anchor(bottom)' });
        export const dynamic = positionTry(options);
    "#};

    let output = transform("src/pt.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { positionTry } from '@panda/css';
    export const bottom = "--pt_glpgGL";
    export const dynamic = positionTry(options);
    "#);
}

#[test]
fn rewrites_a_named_theme_position_try_to_its_stable_ident() {
    let project = Project::new(
        System::new(create_config(json!({
            "theme": {
                "positionTry": {
                    "bottom": { "top": "anchor(bottom)" },
                },
            },
        })))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { positionTry } from '@panda/css';
        export const bottom = positionTry('bottom');
    "#};

    let output = transform_with_project(&project, "src/pt.ts", source);

    assert!(output.changed);
    assert!(!output.code.contains("positionTry("));
    assert!(!output.code.contains("@panda/css"));
    assert_snapshot!(output.code, @r#"
    export const bottom = "--pt_bottom";
    "#);
}

#[test]
fn leaves_an_unknown_theme_position_try_name_unchanged() {
    let project = Project::new(
        System::new(create_config(json!({
            "theme": { "positionTry": { "bottom": { "top": "anchor(bottom)" } } },
        })))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { positionTry } from '@panda/css';
        export const missing = positionTry('top');
    "#};

    let output = transform_with_project(&project, "src/pt.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn applies_the_prefix_to_a_named_theme_position_try() {
    let project = Project::new(
        System::new(create_config(json!({
            "prefix": "p",
            "theme": { "positionTry": { "bottom": { "top": "anchor(bottom)" } } },
        })))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { positionTry } from '@panda/css';
        export const bottom = positionTry('bottom');
    "#};

    let output = transform_with_project(&project, "src/pt.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const bottom = "--p-pt_bottom";
    "#);
}

#[test]
fn folds_a_position_try_value_inside_a_transformed_css_call() {
    let project = Project::new(
        System::new(create_config(json!({
            "theme": { "positionTry": { "flip": { "top": "anchor(bottom)" } } },
        })))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { css, positionTry } from '@panda/css';
        export const cls = css({ positionTryFallbacks: positionTry('flip') });
    "#};

    let output = transform_with_project(&project, "src/pt.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const cls = "position-try-fallbacks_--pt_flip";
    "#);
}

#[test]
fn folds_a_const_composed_position_try_fallback_list() {
    let project = Project::new(
        System::new(create_config(json!({
            "theme": { "positionTry": { "flip": { "top": "anchor(bottom)" } } },
        })))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { css, positionTry } from '@panda/css';
        const flip = positionTry('flip');
        const shift = positionTry({ insetBlockStart: 'anchor(bottom)' });
        export const cls = css({ positionTryFallbacks: `${flip}, ${shift}` });
    "#};

    let output = transform_with_project(&project, "src/pt.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    const flip = "--pt_flip";
    const shift = "--pt_jpvOBg";
    export const cls = "position-try-fallbacks_--pt_flip,_--pt_jpvOBg";
    "#);
}
