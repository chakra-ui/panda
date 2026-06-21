use crate::common::create_project;
use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};
use serde_json::json;

use pandacss_project::{FileInspectionResult, Span};

/// One line per usage: `kind name` (ranges are covered by the binding tests).
fn summary(result: &FileInspectionResult) -> String {
    result
        .usages
        .iter()
        .map(|site| format!("{:?} {}", site.kind, site.name))
        .collect::<Vec<_>>()
        .join("\n")
}

fn style_summary(result: &FileInspectionResult) -> String {
    result
        .style_entries
        .iter()
        .map(|entry| {
            format!(
                "{:?} {:?} {:?} {} -> {:?} path={}",
                entry.kind,
                entry.syntax,
                entry.fixable,
                entry.name,
                entry.canonical_name,
                entry.path.join(".")
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn span_text(source: &str, span: Option<Span>) -> &str {
    span.and_then(|span| source.get(span.start as usize..span.end as usize))
        .unwrap_or("")
}

fn project() -> pandacss_project::Project {
    create_project(json!({
        "theme": {
            "tokens": {
                "colors": { "red": { "300": { "value": "#f00" }, "500": { "value": "#e00" } } },
                "spacing": { "4": { "value": "1rem" } }
            },
            "keyframes": {
                "spin": { "from": {}, "to": {} },
                "fade": { "from": {}, "to": {} }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "padding": { "className": "p", "shorthand": "p", "values": "spacing" }
        },
        "conditions": {
            "hover": "&:hover"
        }
    }))
}

#[test]
fn bare_category_value_resolves_to_token() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ color: 'red.500' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property color
    Token colors.red.500
    ");
}

#[test]
fn shorthand_value_resolves_to_canonical_property_and_token() {
    let result =
        project().inspect_file_source("a.tsx", "import { css } from '@panda/css'\ncss({ p: '4' })");
    assert_snapshot!(summary(&result), @r"
    Property padding
    Token spacing.4
    ");
}

#[test]
fn opacity_modifier_still_captures_the_base_token() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ color: 'red.300/40' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property color
    Token colors.red.300
    ");
}

#[test]
fn curly_reference_in_arbitrary_value_is_captured() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ '--ring': '{colors.red.500}' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property --ring
    Token colors.red.500
    ");
}

#[test]
fn curly_reference_with_opacity_modifier_is_captured() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ '--ring': '{colors.red.300/40}' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property --ring
    Token colors.red.300
    ");
}

#[test]
fn unresolved_token_in_style_object_is_preserved_for_tooling() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\nimport { token } from '@panda/tokens'\ncss({ color: token('colors.ghost') })",
    );
    assert_yaml_snapshot!(result.token_refs, @"
    - path: colors.ghost
      span:
        start: 84
        end: 105
      range:
        start:
          line: 3
          column: 14
        end:
          line: 3
          column: 35
      needsCssVar: false
      isVar: false
      resolved: false
      category: colors
    ");
}

#[test]
fn curly_reference_interpolated_in_longhand_value_is_captured() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ border: '1px solid {colors.red.300}' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property border
    Token colors.red.300
    ");
}

#[test]
fn token_fn_interpolated_in_longhand_value_is_captured() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ border: '1px solid token(colors.red.300)' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property border
    Token colors.red.300
    ");
}

#[test]
fn whole_value_token_path_is_captured() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ '--ring': 'colors.red.500' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property --ring
    Token colors.red.500
    ");
}

#[test]
fn token_fn_call_is_captured_via_resolved_var() {
    let result = project().inspect_file_source(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css'
            import { token } from '@panda/tokens'
            css({ color: token('colors.red.500') })
        "},
    );
    assert_snapshot!(summary(&result), @r"
    Property color
    Token colors.red.500
    ");
}

#[test]
fn inspection_exposes_token_ref_details() {
    let result = project().inspect_file_source(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css'
            import { token } from '@panda/tokens'
            css({ color: token('colors.red.500') })
        "},
    );

    let refs = result
        .token_refs
        .iter()
        .map(|token_ref| {
            json!({
                "path": token_ref.path,
                "category": token_ref.category,
                "needsCssVar": token_ref.needs_css_var,
                "resolved": token_ref.resolved,
                "range": token_ref.range,
            })
        })
        .collect::<Vec<_>>();
    assert_yaml_snapshot!(refs, @r"
    - path: colors.red.500
      category: colors
      needsCssVar: false
      resolved: true
      range:
        start:
          line: 3
          column: 14
        end:
          line: 3
          column: 37
    ");
}

#[test]
fn inspection_exposes_safe_style_entries_for_local_object_props() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          p: '4',
          _hover: { color: 'red.500' },
          '& svg': { color: 'red.300' },
        })
    "};
    let result = project().inspect_file_source("a.tsx", source);

    assert_snapshot!(style_summary(&result), @r###"
    Utility CssCall Safe p -> Some("padding") path=p
    Condition CssCall Safe _hover -> None path=_hover
    Utility CssCall Safe color -> None path=_hover.color
    Selector CssCall Safe & svg -> None path=& svg
    Utility CssCall Safe color -> None path=& svg.color
    "###);

    let spans = result
        .style_entries
        .iter()
        .map(|entry| {
            json!({
                "path": entry.path,
                "key": span_text(source, entry.key_span),
                "value": span_text(source, entry.value_span),
            })
        })
        .collect::<Vec<_>>();
    assert_yaml_snapshot!(spans, @r#"
    - path:
        - p
      key: p
      value: "'4'"
    - path:
        - _hover
      key: _hover
      value: "{ color: 'red.500' }"
    - path:
        - _hover
        - color
      key: color
      value: "'red.500'"
    - path:
        - "& svg"
      key: "'& svg'"
      value: "{ color: 'red.300' }"
    - path:
        - "& svg"
        - color
      key: color
      value: "'red.300'"
    "#);
}

#[test]
fn inspection_treats_jsx_css_props_as_nested_style_objects() {
    let source = indoc! {r"
        import { Box } from '@panda/jsx'
        const el = <Box color='red' css={{ p: '4' }} inputCss={{ color: 'red.500' }} />
    "};
    let result = project().inspect_file_source("a.tsx", source);

    let entries = result
        .style_entries
        .iter()
        .map(|entry| {
            json!({
                "kind": entry.kind,
                "syntax": entry.syntax,
                "fixable": entry.fixable,
                "path": entry.path,
                "key": span_text(source, entry.key_span),
            })
        })
        .collect::<Vec<_>>();
    assert_yaml_snapshot!(entries, @r"
    - kind: utility
      syntax: jsx-prop
      fixable: safe
      path:
        - color
      key: color
    - kind: utility
      syntax: jsx-style-prop
      fixable: safe
      path:
        - css
        - p
      key: p
    - kind: utility
      syntax: jsx-style-prop
      fixable: safe
      path:
        - inputCss
        - color
      key: color
    ");
}

#[test]
fn framework_template_style_entries_stay_report_only() {
    let result = project().inspect_file_source(
        "a.vue",
        indoc! {r#"
            <script setup>
            import { Box } from '@panda/jsx'
            </script>

            <template>
              <Box color="red" :css="{ padding: '4px' }" />
            </template>
        "#},
    );

    assert_snapshot!(style_summary(&result), @r"
    Utility JsxProp ReportOnly color -> None path=color
    Utility JsxStyleProp ReportOnly padding -> None path=css.padding
    ");
}

#[test]
fn inspection_exposes_recipe_component_entries() {
    let result = create_project(json!({
        "theme": {
            "recipes": {
                "button": { "jsx": ["Button"], "base": { "color": "red.500" } }
            },
            "slotRecipes": {
                "custom": {
                    "slots": ["root", "label"],
                    "base": { "root": { "color": "red.500" } }
                }
            }
        }
    }))
    .inspect_file_source(
        "a.tsx",
        indoc! {r"
            import { Button, CustomRoot } from '@panda/jsx'
            ;<><Button /><CustomRoot /></>
        "},
    );

    let components = result
        .component_entries
        .iter()
        .map(|entry| {
            json!({
                "kind": entry.kind,
                "name": entry.name,
                "recipe": entry.recipe,
                "slot": entry.slot,
            })
        })
        .collect::<Vec<_>>();
    assert_yaml_snapshot!(components, @r"
    - kind: jsx-recipe
      name: Button
      recipe: button
      slot: ~
    - kind: jsx-slot-recipe
      name: CustomRoot
      recipe: custom
      slot: root
    ");
}

#[test]
fn animation_name_captures_keyframe() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animationName: 'spin' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property animationName
    Keyframe spin
    ");
}

#[test]
fn animation_name_captures_multiple_comma_separated_keyframes() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animationName: 'spin, fade' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property animationName
    Keyframe spin
    Keyframe fade
    ");
}

#[test]
fn animation_shorthand_captures_keyframe_anywhere_in_value() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animation: 'spin 1s linear infinite' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property animation
    Keyframe spin
    ");
}

#[test]
fn animation_shorthand_captures_multiple_keyframes() {
    let result = project().inspect_file_source(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animation: 'spin 1s, fade 2s' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property animation
    Keyframe spin
    Keyframe fade
    ");
}

#[test]
fn inspection_collects_style_entries_for_cva_recipes() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        cva({
          base: { color: 'red.500' },
          variants: {
            tone: {
              danger: { color: 'red.300' },
            },
          },
          compoundVariants: [
            { tone: 'danger', css: { p: '4' } },
          ],
        })
    "};
    let result = project().inspect_file_source("a.tsx", source);

    assert_snapshot!(style_summary(&result), @r###"
    Utility RecipeCall Safe color -> None path=base.color
    Utility RecipeCall Safe color -> None path=variants.tone.danger.color
    Utility RecipeCall Safe p -> Some("padding") path=compoundVariants.0.css.p
    "###);

    let spans = result
        .style_entries
        .iter()
        .filter(|entry| matches!(entry.kind, pandacss_project::StyleEntryKind::Utility))
        .map(|entry| {
            json!({
                "path": entry.path,
                "value": span_text(source, entry.value_span),
            })
        })
        .collect::<Vec<_>>();
    assert_yaml_snapshot!(spans, @r#"
    - path:
        - base
        - color
      value: "'red.500'"
    - path:
        - variants
        - tone
        - danger
        - color
      value: "'red.300'"
    - path:
        - compoundVariants
        - "0"
        - css
        - p
      value: "'4'"
    "#);
}

#[test]
fn inspection_collects_style_entries_for_sva_slot_recipes() {
    let source = indoc! {r"
        import { sva } from '@panda/css'
        sva({
          base: {
            root: { color: 'red.500' },
          },
          variants: {
            tone: {
              danger: { label: { color: 'red.300' } },
            },
          },
        })
    "};
    let result = project().inspect_file_source("a.tsx", source);

    assert_snapshot!(style_summary(&result), @r"
    Utility RecipeCall Safe color -> None path=base.root.color
    Utility RecipeCall Safe color -> None path=variants.tone.danger.label.color
    ");
}

#[test]
fn inspection_collects_style_entries_for_styled_factory() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx'
        styled('div', {
          base: { color: 'red.500' },
          variants: {
            tone: {
              danger: { color: 'red.300' },
            },
          },
        })
    "};
    let result = project().inspect_file_source("a.tsx", source);

    assert_snapshot!(style_summary(&result), @r"
    Utility RecipeCall Safe color -> None path=base.color
    Utility RecipeCall Safe color -> None path=variants.tone.danger.color
    ");
}
