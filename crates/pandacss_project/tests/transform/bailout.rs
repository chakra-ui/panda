use super::common::{
    patterns_only_options, transform, transform_with_options, transform_with_shorthands,
};
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn rewrites_finite_conditional_css_value_to_runtime_ternary() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: isError ? 'red' : 'blue' });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = isError ? "color_red" : "color_blue";"#);
}

#[test]
fn leaves_unresolved_identifier_css_value_unchanged() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: tokenColor });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn unwraps_css_raw_call_to_its_object() {
    // `css.raw()` returns a style object, not a class string. One-arg `css.raw`
    // just clones its argument, so the wrapper and the import can both go.
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ color: 'red', padding: '4px' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @"export const styles = { color: 'red', padding: '4px' };"
    );
}

#[test]
fn parenthesizes_unwrapped_css_raw_in_arrow_body() {
    // A bare `{` would open a block, not an object.
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = () => css.raw({ color: 'red' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"export const styles = () => ({ color: 'red' });");
}

#[test]
fn folds_multi_arg_css_raw_to_the_merged_object() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ color: 'red' }, { padding: '4px' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"color":"red","padding":"4px"};"#
    );
}

#[test]
fn multi_arg_css_raw_merge_is_last_wins_and_deep() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw(
            { color: 'red', _hover: { color: 'blue', padding: '1px' } },
            { color: 'green', _hover: { color: 'teal' } },
        );
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"color":"green","_hover":{"color":"teal","padding":"1px"}};"#
    );
}

#[test]
fn multi_arg_css_raw_resolves_shorthand_keys_like_the_runtime() {
    // `mergeCss` normalizes before merging, so `bg` reaches its canonical key
    // and collides with a later `background`.
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ bg: 'red' }, { backgroundColor: 'blue' });
    "#};

    let output = transform_with_shorthands("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"backgroundColor":"blue"};"#);
}

#[test]
fn multi_arg_css_raw_keys_responsive_arrays_like_the_runtime() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ color: ['red', 'blue'] }, { padding: '4px' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"color":{"base":"red","sm":"blue"},"padding":"4px"};"#
    );
}

#[test]
fn multi_arg_css_raw_skips_normalization_when_only_one_object_contributes() {
    // `resolve()` drops the empty object, leaving a single survivor — which
    // the runtime returns as authored, shorthand and all.
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ bg: 'red' }, {});
    "#};

    let output = transform_with_shorthands("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const styles = {"bg":"red"};"#);
}

#[test]
fn multi_arg_css_raw_normalizes_across_an_intervening_empty_object() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ bg: 'red' }, {}, { color: 'blue' });
    "#};

    let output = transform_with_shorthands("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"export const styles = {"backgroundColor":"red","color":"blue"};"#
    );
}

#[test]
fn multi_arg_css_raw_of_only_empty_objects_folds_to_an_empty_object() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({}, {});
    "#};

    let output = transform_with_shorthands("src/styles.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"export const styles = {};");
}

#[test]
fn multi_arg_css_raw_with_a_dynamic_argument_stays_intact() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ color: 'red' }, overrides);
    "#};

    let output = transform("src/styles.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_css_raw_with_non_object_argument_intact() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw(base);
    "#};

    let output = transform("src/styles.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_responsive_css_object_to_flat_classes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { base: 'red', md: 'blue' } });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "color_red md:color_blue";"#);
}

#[test]
fn rewrites_unknown_utility_property_using_fallback_class_name() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ unknownProp: 'value' });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "unknown-prop_value";"#);
}

#[test]
fn rewrites_static_sites_without_marking_file_bailed_when_dynamic_call_is_unextractable() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        css({ color: 'red' });
        css({ color: props.color });
    "#};

    let output = transform("src/mixed.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert!(!output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { css } from '@panda/css';
    "color_red";
    css({ color: props.color });
    "#);
}

#[test]
fn skips_css_rewrites_when_only_patterns_target_is_enabled() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_with_options("src/button.tsx", source, patterns_only_options());

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}
