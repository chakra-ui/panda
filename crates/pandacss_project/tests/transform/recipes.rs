use super::common::{
    project_with_config_slot_recipe, project_with_prefixed_recipes, project_with_rich_recipes,
    transform_recipes, transform_with_options,
};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{Project, TransformOptions, TransformTargets, transform_source};

/// Transform with all default targets on, the shape a real build sees.
fn transform_button(project: &Project, source: &str) -> pandacss_project::TransformOutput {
    transform_source(
        project,
        "src/button.tsx",
        source,
        &TransformOptions::default(),
    )
}

#[test]
fn unwraps_recipe_raw_call_to_its_object() {
    // `recipe.raw` is `props => props` — it hands back the variant selection,
    // so the wrapper and the import can both go.
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const styles = button.raw({ size: 'sm' });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @"export const styles = { size: 'sm' };");
}

#[test]
fn rewrites_static_recipe_call_to_class_string() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_sm";"#);
}

#[test]
fn applies_recipe_default_variants() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button();
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_md";"#);
}

#[test]
fn selects_multiple_variants_in_one_call() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'lg', variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_lg button--variant_outline";"#);
}

#[test]
fn overrides_a_single_default_variant() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_md button--variant_outline";"#);
}

#[test]
fn applies_boolean_variant() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ block: true });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--block_true button--size_md button--variant_solid";"#);
}

#[test]
fn applies_compound_variant_when_combination_matches() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm', variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_sm button--variant_outline button--compound__size_sm__variant_outline";"#);
}

#[test]
fn omits_compound_variant_when_combination_does_not_match() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'lg', variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_lg button--variant_outline";"#);
}

#[test]
fn rewrites_two_recipe_calls_in_one_file() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const small = button({ size: 'sm' });
        export const large = button({ size: 'lg' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const small = "button button--size_sm button--variant_solid";
    export const large = "button button--size_lg button--variant_solid";
    "#);
}

#[test]
fn leaves_dynamic_recipe_call_unchanged() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: props.size });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_open_ended_ternary_variant_to_runtime() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? props.size : 'sm' });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_variant_ternary_with_defaults_as_class_expression() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? 'sm' : 'lg' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--variant_solid" + " " + (isSmall ? "button--size_sm" : "button--size_lg");"#
    );
}

// Two conditional variants make four combinations, and the compound variant
// only applies in the `sm` + `outline` one.
#[test]
fn rewrites_two_conditional_variants_as_a_decision_tree() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? 'sm' : 'lg', variant: isSolid ? 'solid' : 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button" + " " + (isSmall ? (isSolid ? "button--size_sm button--variant_solid" : "button--size_sm button--variant_outline button--compound__size_sm__variant_outline") : isSolid ? "button--size_lg button--variant_solid" : "button--size_lg button--variant_outline");"#
    );
}

#[test]
fn rewrites_three_conditional_variants_as_a_decision_tree() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({
          size: isSmall ? 'sm' : 'lg',
          variant: isSolid ? 'solid' : 'outline',
          block: isWide ? true : false,
        });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button" + " " + (isSmall ? (isSolid ? (isWide ? "button--block_true button--size_sm button--variant_solid" : "button--size_sm button--variant_solid") : isWide ? "button--block_true button--size_sm button--variant_outline button--compound__size_sm__variant_outline" : "button--size_sm button--variant_outline button--compound__size_sm__variant_outline") : isSolid ? (isWide ? "button--block_true button--size_lg button--variant_solid" : "button--size_lg button--variant_solid") : isWide ? "button--block_true button--size_lg button--variant_outline" : "button--size_lg button--variant_outline");"#
    );
}

// Past MAX_COMBINATION_LEAVES the inlined tree is bigger than the call it
// replaces, so the runtime keeps it.
#[test]
fn leaves_too_many_conditional_props_to_runtime() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({
          size: isSmall ? 'sm' : 'lg',
          variant: isSolid ? 'solid' : 'outline',
          block: isWide ? true : false,
          tone: isDark ? 1 : 2,
          mood: isCalm ? 3 : 4,
        });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_variant_ternary_that_reaches_a_compound_variant() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ variant: 'outline', size: isSmall ? 'sm' : 'md' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--variant_outline" + " " + (isSmall ? "button--size_sm button--compound__size_sm__variant_outline" : "button--size_md");"#
    );
}

// `isSmall && 'sm'` yields the test's own value when falsy: `undefined` keeps
// `defaultVariants.size`, `false` drops it.
#[test]
fn leaves_logical_and_variant_to_runtime() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall && 'sm' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_logical_and_variant_spread() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ ...(isSmall && { size: 'sm' }) });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--variant_solid" + " " + (isSmall ? "button--size_sm" : "button--size_md");"#
    );
}

#[test]
fn rewrites_spread_ternary_selecting_different_variants() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ ...(isSmall ? { size: 'sm' } : { variant: 'outline' }) });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button" + " " + (isSmall ? "button--size_sm button--variant_solid" : "button--size_md button--variant_outline");"#
    );
}

#[test]
fn rewrites_static_variant_beside_conditional_spread() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ variant: 'outline', ...(isSmall && { size: 'sm' }) });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--variant_outline" + " " + (isSmall ? "button--size_sm button--compound__size_sm__variant_outline" : "button--size_md");"#
    );
}

#[test]
fn rewrites_boolean_variant_ternary() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ block: isWide ? true : false });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--size_md button--variant_solid" + (isWide ? " button--block_true" : "");"#
    );
}

#[test]
fn rewrites_nested_variant_ternary() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? 'sm' : isMedium ? 'md' : 'lg' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--variant_solid" + " " + (isSmall ? "button--size_sm" : isMedium ? "button--size_md" : "button--size_lg");"#
    );
}

// `size: 'nope'` selects nothing and still overrides `defaultVariants.size`, so
// that arm carries no size class at all.
#[test]
fn rewrites_variant_ternary_with_an_unknown_option() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? 'sm' : 'nope' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--variant_solid" + (isSmall ? " button--size_sm" : "");"#
    );
}

// The conditional key isn't a variant, so both branches resolve the same
// classes and the condition drops out entirely.
#[test]
fn rewrites_conditional_on_a_non_variant_key() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm', tone: isDark ? 1 : 2 });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button button--size_sm button--variant_solid";"#
    );
}

// A responsive arm resolves per breakpoint, which a class string can't express.
#[test]
fn leaves_responsive_variant_arm_to_runtime() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? { base: 'sm', md: 'lg' } : 'sm' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_conditional_variant_beside_conditional_spread() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? 'sm' : 'lg', ...(isOutline && { variant: 'outline' }) });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(
        output.code,
        @r#"export const cls = "button" + " " + (isSmall ? (isOutline ? "button--size_sm button--variant_outline button--compound__size_sm__variant_outline" : "button--size_sm button--variant_solid") : isOutline ? "button--size_lg button--variant_outline" : "button--size_lg button--variant_solid");"#
    );
}

#[test]
fn leaves_conditional_variant_with_extra_argument_to_runtime() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isSmall ? 'sm' : 'lg' }, overrides);
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_unknown_recipe_call_unchanged() {
    let source = indoc! {r#"
        import { badge } from '@panda/recipes';
        export const cls = badge({ size: 'sm' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_a_slot_recipe_call_to_an_object_of_slot_classes() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: 'sm' });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root tabs__root--size_sm", trigger: "tabs__trigger tabs__trigger--size_sm", indicator: "tabs__indicator tabs__indicator--size_sm" };"#);
}

#[test]
fn applies_slot_recipe_default_variants() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs();
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root tabs__root--size_lg", trigger: "tabs__trigger tabs__trigger--size_lg", indicator: "tabs__indicator tabs__indicator--size_lg" };"#);
}

#[test]
fn applies_a_slot_compound_variant_only_to_the_slots_it_styles() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: 'sm', fitted: true });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root tabs__root--fitted_true tabs__root--size_sm", trigger: "tabs__trigger tabs__trigger--fitted_true tabs__trigger--size_sm tabs__trigger--compound__fitted_true__size_sm", indicator: "tabs__indicator tabs__indicator--fitted_true tabs__indicator--size_sm" };"#);
}

#[test]
fn rewrites_a_conditional_slot_variant_per_slot() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: isSmall ? 'sm' : 'lg' });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root" + " " + (isSmall ? "tabs__root--size_sm" : "tabs__root--size_lg"), trigger: "tabs__trigger" + " " + (isSmall ? "tabs__trigger--size_sm" : "tabs__trigger--size_lg"), indicator: "tabs__indicator" + " " + (isSmall ? "tabs__indicator--size_sm" : "tabs__indicator--size_lg") };"#);
}

#[test]
fn rewrites_two_conditional_slot_variants_as_a_decision_tree_per_slot() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: isSmall ? 'sm' : 'lg', fitted: isFitted ? true : false });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root" + " " + (isSmall ? (isFitted ? "tabs__root--fitted_true tabs__root--size_sm" : "tabs__root--size_sm") : isFitted ? "tabs__root--fitted_true tabs__root--size_lg" : "tabs__root--size_lg"), trigger: "tabs__trigger" + " " + (isSmall ? (isFitted ? "tabs__trigger--fitted_true tabs__trigger--size_sm tabs__trigger--compound__fitted_true__size_sm" : "tabs__trigger--size_sm") : isFitted ? "tabs__trigger--fitted_true tabs__trigger--size_lg" : "tabs__trigger--size_lg"), indicator: "tabs__indicator" + " " + (isSmall ? (isFitted ? "tabs__indicator--fitted_true tabs__indicator--size_sm" : "tabs__indicator--size_sm") : isFitted ? "tabs__indicator--fitted_true tabs__indicator--size_lg" : "tabs__indicator--size_lg") };"#);
}

#[test]
fn rewrites_a_slot_variant_ternary_that_reaches_a_compound_variant() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ fitted: true, size: isSmall ? 'sm' : 'lg' });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root tabs__root--fitted_true" + " " + (isSmall ? "tabs__root--size_sm" : "tabs__root--size_lg"), trigger: "tabs__trigger tabs__trigger--fitted_true" + " " + (isSmall ? "tabs__trigger--size_sm tabs__trigger--compound__fitted_true__size_sm" : "tabs__trigger--size_lg"), indicator: "tabs__indicator tabs__indicator--fitted_true" + " " + (isSmall ? "tabs__indicator--size_sm" : "tabs__indicator--size_lg") };"#);
}

#[test]
fn rewrites_a_nested_slot_variant_ternary() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: isSmall ? 'sm' : isLarge ? 'lg' : 'sm' });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root" + " " + (isSmall ? "tabs__root--size_sm" : isLarge ? "tabs__root--size_lg" : "tabs__root--size_sm"), trigger: "tabs__trigger" + " " + (isSmall ? "tabs__trigger--size_sm" : isLarge ? "tabs__trigger--size_lg" : "tabs__trigger--size_sm"), indicator: "tabs__indicator" + " " + (isSmall ? "tabs__indicator--size_sm" : isLarge ? "tabs__indicator--size_lg" : "tabs__indicator--size_sm") };"#);
}

#[test]
fn rewrites_a_logical_and_slot_variant_spread() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ ...(isFitted && { fitted: true }) });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root tabs__root--size_lg" + (isFitted ? " tabs__root--fitted_true" : ""), trigger: "tabs__trigger tabs__trigger--size_lg" + (isFitted ? " tabs__trigger--fitted_true" : ""), indicator: "tabs__indicator tabs__indicator--size_lg" + (isFitted ? " tabs__indicator--fitted_true" : "") };"#);
}

#[test]
fn leaves_an_open_ended_slot_variant_ternary_to_runtime() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: isSmall ? props.size : 'sm' });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_a_logical_and_slot_variant_to_runtime() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ fitted: isFitted && true });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_a_responsive_slot_variant_inside_a_ternary_to_runtime() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: isSmall ? { base: 'sm', md: 'lg' } : 'lg' });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_too_many_conditional_slot_props_to_runtime() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({
          size: isSmall ? 'sm' : 'lg',
          fitted: isFitted ? true : false,
          tone: isDark ? 1 : 2,
          mood: isCalm ? 3 : 4,
          density: isDense ? 5 : 6,
        });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn drops_a_false_boolean_slot_variant_and_its_compound() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: 'sm', fitted: false });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root tabs__root--size_sm", trigger: "tabs__trigger tabs__trigger--size_sm", indicator: "tabs__indicator tabs__indicator--size_sm" };"#);
}

#[test]
fn rewrites_a_boolean_slot_variant_ternary() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: 'sm', fitted: isFitted ? true : false });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert_snapshot!(output.code, @r#"export const classes = { root: "tabs__root tabs__root--size_sm" + (isFitted ? " tabs__root--fitted_true" : ""), trigger: "tabs__trigger tabs__trigger--size_sm" + (isFitted ? " tabs__trigger--fitted_true tabs__trigger--compound__fitted_true__size_sm" : ""), indicator: "tabs__indicator tabs__indicator--size_sm" + (isFitted ? " tabs__indicator--fitted_true" : "") };"#);
}

#[test]
fn leaves_a_bare_identifier_slot_variant_to_runtime() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: 'sm', fitted: isFitted });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn applies_the_class_prefix_to_recipe_and_slot_recipe_classes() {
    let source = indoc! {r#"
        import { button, tabs } from '@panda/recipes';
        export const cls = button({ size: 'sm', block: true });
        export const classes = tabs({ size: 'sm' });
    "#};

    let output = transform_button(&project_with_prefixed_recipes(false), source);

    assert_snapshot!(output.code, @r#"
    export const cls = "pd-button pd-button--block_true pd-button--size_sm pd-button--compound__block_true__size_sm";
    export const classes = { root: "pd-tabs__root pd-tabs__root--size_sm", trigger: "pd-tabs__trigger pd-tabs__trigger--size_sm pd-tabs__trigger--compound__size_sm" };
    "#);
}

#[test]
fn hashes_recipe_and_slot_recipe_classes_like_the_runtime() {
    let source = indoc! {r#"
        import { button, tabs } from '@panda/recipes';
        export const cls = button({ size: 'sm' });
        export const classes = tabs({ size: 'sm' });
    "#};

    let output = transform_button(&project_with_prefixed_recipes(true), source);

    let hashed = |name: &str| format!("pd-{}", pandacss_shared::to_hash(name));
    // Compound classes are hashed once when named and again by the runtime, like the emitter.
    let compound =
        pandacss_shared::compound_class_name("tabs__trigger", &[("size", "sm")], None, "_", true);
    assert!(output.code.contains(&format!(
        "export const cls = \"{} {}\";",
        hashed("button"),
        hashed("button--size_sm")
    )));
    assert!(output.code.contains(&format!(
        "trigger: \"{} {} {}\"",
        hashed("tabs__trigger"),
        hashed("tabs__trigger--size_sm"),
        hashed(&compound)
    )));
}

#[test]
fn leaves_dynamic_slot_recipe_call_unchanged() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs(props);
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_responsive_slot_variant_to_runtime() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const classes = tabs({ size: { base: 'sm', md: 'lg' } });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn skips_recipe_rewrites_when_only_css_target_is_enabled() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform_with_options(
        "src/button.tsx",
        source,
        TransformOptions {
            targets: TransformTargets {
                css: true,
                patterns: false,
                recipes: false,
                tokens: false,
                jsx: false,
            },
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}
