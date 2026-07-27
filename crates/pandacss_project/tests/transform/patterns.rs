use super::common::{
    create_config, patterns_only_options, project_with_pattern, transform_jsx_patterns,
    transform_patterns, transform_with_project,
};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_extractor::{Diagnostic, Literal};
use pandacss_project::{ParseTransforms, Project, System};
use pandacss_project::{TransformOptions, transform_source};
use serde_json::json;

#[test]
fn folds_pattern_raw_call_to_its_style_object() {
    // `pattern.raw()` returns the style object the pattern transform produces,
    // so it folds to that object rather than to a class string.
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: '4px' });
    "#};

    let output = transform_patterns("src/layout.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const styles = {"padding":"4px"};"#);
}

#[test]
fn rewrites_property_pattern_without_transform() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: '4px' });
    "#};

    let output = transform_patterns("src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "padding_4px";"#);
}

#[test]
fn rewrites_pattern_with_multiple_mapped_properties() {
    let source = indoc! {r#"
        import { grid } from '@panda/patterns';
        export const cls = grid({ gap: '2', columnGap: '4' });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "column-gap_4 gap_2";"#);
}

#[test]
fn rewrites_pattern_call_with_condition_value() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: { base: '2px', _hover: '4px' } });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "padding_2px hover:padding_4px";"#);
}

#[test]
fn rewrites_two_pattern_calls_in_one_file() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const a = box({ padding: '2px' });
        export const b = box({ padding: '8px' });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const a = "padding_2px";
    export const b = "padding_8px";
    "#);
}

#[test]
fn rewrites_pattern_jsx_element_to_intrinsic_tag() {
    let source = indoc! {r#"
        import { Stack } from '@panda/jsx';
        export const El = () => <Stack gap="3">hi</Stack>;
    "#};

    let output = transform_jsx_patterns("src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const El = () => <div className="gap_3">hi</div>;"#);
}

#[test]
fn leaves_pattern_call_with_dynamic_value_unchanged() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: props.value });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_pattern_with_js_transform_unchanged_without_callback() {
    let project = stack_project();
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const cls = stack({ gap: '4px' });
    "#};

    let output = transform_source(
        &project,
        "src/layout.tsx",
        source,
        &TransformOptions {
            targets: patterns_only_options().targets,
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn inlines_js_transform_pattern_when_transform_callback_is_supplied() {
    let project = stack_project();
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const cls = stack({ gap: '4px' });
    "#};

    // Stand in for the JS pattern transform the binding layer supplies.
    let mut stack_transform =
        |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
            let mut out = vec![("display".to_string(), Literal::String("flex".to_string()))];
            if let Literal::Object(entries) = styles {
                for (key, value) in entries {
                    if key == "gap" {
                        out.push(("gap".to_string(), value.clone()));
                    }
                }
            }
            Ok(Some(Literal::Object(out)))
        };

    let output = project.transform_source_with(
        "src/layout.tsx",
        source,
        &TransformOptions {
            targets: patterns_only_options().targets,
            ..TransformOptions::default()
        },
        ParseTransforms {
            pattern: Some(&mut stack_transform),
            ..Default::default()
        },
    );

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "d_flex gap_4px";"#);
}

#[test]
fn pattern_target_does_not_rewrite_css_calls() {
    let project = project_with_pattern();
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_source(
        &project,
        "src/layout.tsx",
        source,
        &TransformOptions {
            targets: patterns_only_options().targets,
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

// ---------------------------------------------------------------------------
// pattern.raw — folds to the style object the pattern transform returns.
// ---------------------------------------------------------------------------

/// Patterns exercising defaults and prop mapping without a JS callback.
fn raw_project() -> Project {
    Project::new(
        System::new(create_config(json!({
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &"
            },
            "theme": {
                "breakpoints": { "sm": "640px", "md": "768px" }
            },
            "utilities": {
                "padding": {},
                "margin": {},
                "gap": {},
                "color": {},
                "content": {},
                "display": { "className": "d" }
            },
            "patterns": {
                "box": {
                    "properties": {
                        "padding": { "type": "property", "property": "padding" }
                    }
                },
                "spaced": {
                    "defaultValues": { "gap": "8px", "padding": "2px" },
                    "properties": {
                        "gap": { "type": "property", "property": "gap" },
                        "padding": { "type": "property", "property": "padding" }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

fn transform_raw(source: &str) -> pandacss_project::TransformOutput {
    transform_source(
        &raw_project(),
        "src/layout.tsx",
        source,
        &patterns_only_options(),
    )
}

#[test]
fn pattern_raw_keeps_a_conditional_value_object() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: { base: '2px', _hover: '4px' } });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"padding":{"base":"2px","_hover":"4px"}};"#
    );
}

#[test]
fn pattern_raw_keeps_deeply_nested_conditions() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({
          padding: { base: '2px', _hover: { _dark: { sm: '8px' } } },
        });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"padding":{"base":"2px","_hover":{"_dark":{"sm":"8px"}}}};"#
    );
}

#[test]
fn pattern_raw_keeps_nested_selector_blocks() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({
          padding: '4px',
          '&:hover': { padding: '8px', '& > span': { margin: '0' } },
        });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"padding":"4px","&:hover":{"padding":"8px","& > span":{"margin":"0"}}};"#
    );
}

#[test]
fn pattern_raw_keeps_a_responsive_array_unnormalized() {
    // `pattern.raw` never runs `normalizeStyleObject` — the array is keyed by
    // `css()` later, so it has to survive as an array.
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: ['2px', '4px'] });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"padding":["2px","4px"]};"#);
}

#[test]
fn pattern_raw_preserves_non_string_scalars() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: 0, gap: 1.5, display: true, margin: null });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"padding":0,"gap":1.5,"display":true,"margin":null};"#
    );
}

#[test]
fn pattern_raw_escapes_quotes_in_values() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ content: '"x"' });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"content":"\"x\""};"#);
}

#[test]
fn pattern_raw_with_no_arguments_folds_to_an_empty_object() {
    // `boxRaw(styles)` defaults to `styles || {}`.
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw();
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"export const styles = {};");
}

#[test]
fn pattern_raw_with_an_empty_object_folds_to_an_empty_object() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({});
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"export const styles = {};");
}

#[test]
fn pattern_raw_applies_default_values() {
    let source = indoc! {r#"
        import { spaced } from '@panda/patterns';
        export const styles = spaced.raw({});
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"gap":"8px","padding":"2px"};"#);
}

#[test]
fn pattern_raw_lets_props_override_default_values() {
    let source = indoc! {r#"
        import { spaced } from '@panda/patterns';
        export const styles = spaced.raw({ gap: '16px' });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"gap":"16px","padding":"2px"};"#);
}

#[test]
fn pattern_raw_applies_defaults_with_no_arguments() {
    let source = indoc! {r#"
        import { spaced } from '@panda/patterns';
        export const styles = spaced.raw();
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"gap":"8px","padding":"2px"};"#);
}

#[test]
fn pattern_raw_folds_a_statically_resolvable_identifier() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        const space = '4px';
        export const styles = box.raw({ padding: space });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"
    const space = '4px';
    export const styles = {"padding":"4px"};
    "#
    );
}

#[test]
fn pattern_raw_folds_a_static_spread() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        const base = { padding: '2px' };
        export const styles = box.raw({ ...base, margin: '1px' });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"
    const base = { padding: '2px' };
    export const styles = {"padding":"2px","margin":"1px"};
    "#
    );
}

#[test]
fn pattern_raw_parenthesizes_the_object_in_an_arrow_body() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const make = () => box.raw({ padding: '4px' });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const make = () => ({"padding":"4px"});"#);
}

#[test]
fn pattern_raw_folds_inside_a_css_argument() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = { ...box.raw({ padding: '4px' }), margin: '1px' };
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = { ...{"padding":"4px"}, margin: '1px' };"#
    );
}

#[test]
fn pattern_raw_with_a_runtime_conditional_value_stays_intact() {
    // A ternary is a runtime branch, not data — there's no object to emit.
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: isBig ? '8px' : '2px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_nested_runtime_conditional_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: { base: '2px', _hover: isBig ? '8px' : '4px' } });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_folds_a_statically_decidable_ternary() {
    // The condition folds, so only the taken branch is data.
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        const big = true;
        export const styles = box.raw({ padding: big ? '8px' : '2px' });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"
    const big = true;
    export const styles = {"padding":"8px"};
    "#
    );
}

#[test]
fn pattern_raw_with_a_runtime_ternary_argument_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw(isBig ? { padding: '8px' } : { padding: '2px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_ternary_two_conditions_deep_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({
          padding: { base: '2px', _hover: { _dark: isBig ? '8px' : '4px' } },
        });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_ternary_inside_a_nested_selector_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({
          padding: '4px',
          '&:hover': { '& > span': { margin: isBig ? '8px' : '0' } },
        });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_ternary_inside_a_responsive_array_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: ['2px', isBig ? '8px' : '4px'] });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_ternary_whose_branches_are_condition_objects_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({
          padding: isBig ? { base: '8px', _hover: '10px' } : { base: '2px', _hover: '4px' },
        });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_runtime_logical_and_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: isBig && '8px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_runtime_logical_or_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: size || '8px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_call_with_a_runtime_logical_and_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: isBig && '8px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_keeps_one_static_condition_when_a_sibling_is_dynamic() {
    // A dynamic sibling has to sink the whole call — emitting only the static
    // half would drop the other branch.
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({
          margin: { base: '1px', _hover: '2px' },
          padding: isBig ? '8px' : '2px',
        });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn defaulted_pattern_raw_with_a_ternary_prop_stays_intact() {
    // Bailing must not leave the defaults applied on their own.
    let source = indoc! {r#"
        import { spaced } from '@panda/patterns';
        export const styles = spaced.raw({ gap: isBig ? '16px' : '4px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_call_with_a_deep_ternary_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: { _hover: { _dark: isBig ? '8px' : '4px' } } });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_ternary_stays_intact_under_a_js_transform() {
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const styles = stack.raw({ gap: isBig ? '16px' : '4px' });
    "#};

    let mut passthrough = |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
        Ok(Some(styles.clone()))
    };

    let output = stack_project().transform_source_with(
        "src/layout.tsx",
        source,
        &patterns_only_options(),
        ParseTransforms {
            pattern: Some(&mut passthrough),
            ..Default::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_folds_deep_conditions_that_are_fully_static() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({
          padding: { base: '2px', sm: '4px', _hover: { _dark: '8px', md: '6px' } },
          margin: { _dark: { '&:focus': '1px' } },
        });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"padding":{"base":"2px","sm":"4px","_hover":{"_dark":"8px","md":"6px"}},"margin":{"_dark":{"&:focus":"1px"}}};"#
    );
}

#[test]
fn pattern_raw_with_a_dynamic_argument_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw(props);
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_dynamic_value_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: props.value });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_dynamic_spread_stays_intact() {
    // `...props` never reaches the literal, so folding here would silently
    // drop whatever it carries.
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ ...props, padding: '4px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_call_with_a_dynamic_spread_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ ...props, padding: '4px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_with_a_conditional_spread_stays_intact() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ ...(isBig ? big : small), padding: '4px' });
    "#};

    let output = transform_raw(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn unknown_pattern_raw_passes_its_props_through() {
    // An unconfigured name has no transform, so `raw` is the identity — the
    // same passthrough the non-raw pattern path already uses.
    let source = indoc! {r#"
        import { nope } from '@panda/patterns';
        export const styles = nope.raw({ padding: '4px' });
    "#};

    let output = transform_raw(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"padding":"4px"};"#);
}

#[test]
fn pattern_raw_stays_intact_when_patterns_are_not_targeted() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const styles = box.raw({ padding: '4px' });
    "#};

    let output = transform_source(
        &raw_project(),
        "src/layout.tsx",
        source,
        &TransformOptions {
            targets: pandacss_project::TransformTargets {
                patterns: false,
                css: true,
                ..Default::default()
            },
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_needing_a_js_transform_stays_intact_without_a_callback() {
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const styles = stack.raw({ gap: '4px' });
    "#};

    let output = transform_source(
        &stack_project(),
        "src/layout.tsx",
        source,
        &patterns_only_options(),
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_raw_folds_through_a_js_transform_callback() {
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const styles = stack.raw({ gap: '4px' });
    "#};

    let mut stack_transform =
        |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
            let mut out = vec![("display".to_string(), Literal::String("flex".to_string()))];
            if let Literal::Object(entries) = styles {
                for (key, value) in entries {
                    if key == "gap" {
                        out.push(("gap".to_string(), value.clone()));
                    }
                }
            }
            Ok(Some(Literal::Object(out)))
        };

    let output = stack_project().transform_source_with(
        "src/layout.tsx",
        source,
        &patterns_only_options(),
        ParseTransforms {
            pattern: Some(&mut stack_transform),
            ..Default::default()
        },
    );

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"display":"flex","gap":"4px"};"#
    );
}

#[test]
fn pattern_raw_stays_intact_when_the_js_transform_declines() {
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const styles = stack.raw({ gap: '4px' });
    "#};

    let mut decline =
        |_name: &str, _styles: &Literal| -> Result<Option<Literal>, Diagnostic> { Ok(None) };

    let output = stack_project().transform_source_with(
        "src/layout.tsx",
        source,
        &patterns_only_options(),
        ParseTransforms {
            pattern: Some(&mut decline),
            ..Default::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

/// `stack` pattern requiring a JS transform, like preset-base `stack`/`hstack`.
fn stack_project() -> Project {
    Project::new(
        System::new(create_config(json!({
            "utilities": {
                "display": { "className": "d" },
                "gap": {}
            },
            "patterns": {
                "stack": {
                    "transform": { "kind": "js", "id": "stack" },
                    "properties": {
                        "gap": { "type": "property", "property": "gap" }
                    }
                }
            }
        })))
        .expect("config"),
    )
}
