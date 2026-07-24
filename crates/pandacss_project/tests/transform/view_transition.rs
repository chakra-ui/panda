use super::common::{create_config, transform, transform_with_project};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{Project, System};
use pandacss_shared::view_transition_class_name;
use serde_json::json;

#[test]
fn rewrites_static_view_transition_to_bag_class_string() {
    let source = indoc! {r#"
        import { viewTransition } from '@panda/css';
        export const slide = viewTransition({
          group: { animationDuration: '0.4s' },
          old: { opacity: 0 },
          new: { opacity: 1 },
        });
    "#};

    let output = transform("src/vt.ts", source);
    let expected = view_transition_class_name(
        &json!({
            "group": { "animationDuration": "0.4s" },
            "old": { "opacity": 0 },
            "new": { "opacity": 1 },
        }),
        "",
    );

    assert!(output.changed);
    assert!(!output.bailed);
    assert!(!output.code.contains("viewTransition("));
    assert!(!output.code.contains("@panda/css"));
    assert_eq!(expected, "vt_kXwuyX");
    assert_snapshot!(output.code, @r#"
    export const slide = "vt_kXwuyX";
    "#);
}

#[test]
fn removes_fully_inlined_view_transition_import() {
    let source = indoc! {r#"
        import { viewTransition } from '@panda/css';
        export const slide = viewTransition({
          old: { opacity: 0 },
          new: { opacity: 1 },
        });
    "#};

    let output = transform("src/vt.ts", source);

    assert!(output.changed);
    assert!(!output.code.contains("import"));
    assert_snapshot!(output.code, @r#"
    export const slide = "vt_gnOaDr";
    "#);
}

#[test]
fn inlines_view_transition_alongside_css_and_drops_dead_import() {
    let source = indoc! {r#"
        import { css, viewTransition } from '@panda/css';
        export const cls = css({ color: 'red' });
        export const slide = viewTransition({
          old: { opacity: 0 },
          new: { opacity: 1 },
        });
    "#};

    let output = transform("src/vt.ts", source);

    assert!(output.changed);
    assert!(!output.code.contains("@panda/css"));
    assert_snapshot!(output.code, @r#"
    export const cls = "color_red";
    export const slide = "vt_gnOaDr";
    "#);
}

#[test]
fn leaves_dynamic_view_transition_call_unchanged() {
    let source = indoc! {r#"
        import { viewTransition } from '@panda/css';
        export const slide = viewTransition(options);
    "#};

    let output = transform("src/vt.ts", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn keeps_runtime_import_when_only_static_sibling_is_inlined() {
    let source = indoc! {r#"
        import { viewTransition } from '@panda/css';
        export const slide = viewTransition({
          old: { opacity: 0 },
          new: { opacity: 1 },
        });
        export const dynamic = viewTransition(options);
    "#};

    let output = transform("src/vt.ts", source);

    assert!(output.changed);
    assert!(output.code.contains("import { viewTransition }"));
    assert!(output.code.contains("viewTransition(options)"));
    assert_snapshot!(output.code, @r#"
    import { viewTransition } from '@panda/css';
    export const slide = "vt_gnOaDr";
    export const dynamic = viewTransition(options);
    "#);
}

#[test]
fn skips_view_transition_raw_member_call() {
    let source = indoc! {r#"
        import { viewTransition } from '@panda/css';
        export const slide = viewTransition.raw({
          old: { opacity: 0 },
        });
    "#};

    let output = transform("src/vt.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn applies_prefix_to_rewritten_view_transition_class() {
    let project =
        Project::new(System::new(create_config(json!({ "prefix": "p" }))).expect("config"));
    let source = indoc! {r#"
        import { viewTransition } from '@panda/css';
        export const slide = viewTransition({
          old: { opacity: 0 },
          new: { opacity: 1 },
        });
    "#};

    let output = transform_with_project(&project, "src/vt.ts", source);
    let expected = view_transition_class_name(
        &json!({
            "old": { "opacity": 0 },
            "new": { "opacity": 1 },
        }),
        "p",
    );

    assert!(output.changed);
    assert_eq!(expected, "p-vt_gnOaDr");
    assert_snapshot!(output.code, @r#"
    export const slide = "p-vt_gnOaDr";
    "#);
}

#[test]
fn applies_prefix_when_utilities_map_is_empty() {
    let project = Project::new(
        System::new(create_config(json!({
            "prefix": "pd",
            "utilities": {},
        })))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { viewTransition } from '@panda/css';
        export const slide = viewTransition({
          old: { opacity: 0 },
          new: { opacity: 1 },
        });
    "#};

    let output = transform_with_project(&project, "src/vt.ts", source);
    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const slide = "pd-vt_gnOaDr";
    "#);
}
