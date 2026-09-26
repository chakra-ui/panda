use super::common::{create_config, transform, transform_with_project};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{Project, System};
use serde_json::json;

#[test]
fn rewrites_a_static_keyframes_object_to_the_name_string() {
    let source = indoc! {r#"
        import { keyframes } from '@panda/css';
        export const spin = keyframes({
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        });
    "#};

    let output = transform("src/kf.ts", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert!(!output.code.contains("keyframes("));
    assert!(!output.code.contains("@panda/css"));
    assert_snapshot!(output.code, @r#"export const spin = "kf_fhCilR";"#);
}

#[test]
fn removes_a_fully_inlined_keyframes_import() {
    let source = indoc! {r#"
        import { keyframes } from '@panda/css';
        export const fade = keyframes({ from: { opacity: 0 } });
    "#};

    let output = transform("src/kf.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const fade = "kf_gdwKNo";"#);
}

#[test]
fn inlines_keyframes_alongside_css_and_drops_the_dead_import() {
    let source = indoc! {r#"
        import { css, keyframes } from '@panda/css';
        export const cls = css({ color: 'red' });
        export const fade = keyframes({ from: { opacity: 0 } });
    "#};

    let output = transform("src/kf.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const cls = "color_red";
    export const fade = "kf_gdwKNo";
    "#);
}

#[test]
fn leaves_a_dynamic_keyframes_call_unchanged() {
    let source = indoc! {r#"
        import { keyframes } from '@panda/css';
        export const fade = keyframes(stops);
    "#};

    let output = transform("src/kf.ts", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn keeps_the_runtime_import_when_only_a_static_sibling_is_inlined() {
    let source = indoc! {r#"
        import { keyframes } from '@panda/css';
        export const fade = keyframes({ from: { opacity: 0 } });
        export const dynamic = keyframes(stops);
    "#};

    let output = transform("src/kf.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { keyframes } from '@panda/css';
    export const fade = "kf_gdwKNo";
    export const dynamic = keyframes(stops);
    "#);
}

#[test]
fn folds_a_keyframes_value_inside_a_transformed_css_call() {
    let project = Project::new(System::new(create_config(json!({}))).expect("config"));
    let source = indoc! {r#"
        import { css, keyframes } from '@panda/css';
        export const cls = css({ animationName: keyframes({ from: { opacity: 0 } }) });
    "#};

    let output = transform_with_project(&project, "src/kf.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "animation-name_kf_gdwKNo";"#);
}

#[test]
fn folds_a_const_composed_animation_shorthand() {
    let project = Project::new(System::new(create_config(json!({}))).expect("config"));
    let source = indoc! {r#"
        import { css, keyframes } from '@panda/css';
        const spin = keyframes({ from: { opacity: 0 } });
        export const cls = css({ animation: `${spin} 1s linear infinite` });
    "#};

    let output = transform_with_project(&project, "src/kf.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    const spin = "kf_gdwKNo";
    export const cls = "animation_kf_gdwKNo_1s_linear_infinite";
    "#);
}
