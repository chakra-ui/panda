//! End-to-end extraction through `Project`: extract → parse recipes
//! → encode atoms.

use crate::common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_project::{HookFilter, ParseTransforms, SourceTransformFn};
use serde_json::json;

#[test]
fn parse_file_routes_css_cva_and_sva_to_the_right_pipelines() {
    // The interesting bit is the *atoms* the multi-call file
    // produces; routing counts are simple asserts.
    let mut project = create_project(json!({}));
    let src = indoc! {r"
        import { css, cva, sva } from '@panda/css';
        css({ color: 'red' });
        cva({ base: { padding: '4px' } });
        sva({ slots: ['root'], base: { root: { margin: '8px' } } });
    "};
    let report = project.parse_file("fixture.tsx", src);
    assert_eq!(report.css_calls, 1);
    assert_eq!(report.cva_calls, 1);
    assert_eq!(report.sva_calls, 1);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 3
    recipeCount: 1
    slotRecipeCount: 1
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn parser_before_source_transform_runs_before_extraction() {
    let mut project = create_project(json!({}));
    let mut transform = |_path: &str, source: &str| Ok(Some(source.replace("__COLOR__", "'red'")));

    let report = project.parse_file_with(
        "fixture.tsx",
        "import { css } from '@panda/css'; css({ color: __COLOR__ });",
        ParseTransforms {
            source: Some(&mut transform as &mut SourceTransformFn<'_>),
            ..Default::default()
        },
    );

    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn parser_before_source_transform_is_skipped_for_cached_source() {
    let mut project = create_project(json!({}));
    let mut calls = 0;
    let mut transform = |_path: &str, source: &str| {
        calls += 1;
        Ok(Some(source.replace("__COLOR__", "'red'")))
    };
    let source = "import { css } from '@panda/css'; css({ color: __COLOR__ });";

    project.parse_file_with(
        "fixture.tsx",
        source,
        ParseTransforms {
            source: Some(&mut transform as &mut SourceTransformFn<'_>),
            ..Default::default()
        },
    );
    project.parse_file_with(
        "fixture.tsx",
        source,
        ParseTransforms {
            source: Some(&mut transform as &mut SourceTransformFn<'_>),
            ..Default::default()
        },
    );

    assert_eq!(calls, 1);
}

#[test]
fn hook_filter_admits_by_id_and_code() {
    let filter = HookFilter::from_json(&json!({
        "id": {
            "include": ["src/**/*.vue", { "kind": "regex", "source": "\\.astro$", "flags": "" }],
            "exclude": ["src/vendor/**"]
        },
        "code": {
            "include": { "kind": "regex", "source": "css\\(", "flags": "" },
            "exclude": "no-panda"
        }
    }))
    .expect("valid filter");

    assert!(filter.admits("src/App.vue", "css({ color: 'red' })"));
    assert!(filter.admits("src/page.astro", "css({ color: 'red' })"));
    assert!(!filter.admits("src/App.tsx", "css({ color: 'red' })"));
    assert!(!filter.admits("src/vendor/App.vue", "css({ color: 'red' })"));
    assert!(!filter.admits("src/App.vue", "console.log('no panda')"));
    assert!(!filter.admits("src/App.vue", "no-panda; css({ color: 'red' })"));
}

#[test]
fn cva_base_conditional_value_emits_both_branches() {
    // A ternary value inside a cva base resolves to either branch at runtime;
    // the encoder expands it into both atoms.
    let mut project = create_project(json!({}));
    let src = indoc! {r"
        import { cva } from '@panda/css';
        export function C(props){ return cva({ base: { padding: props.cond ? '4px' : '8px' } }); }
    "};
    project.parse_file("fixture.tsx", src);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: padding
      value: 4px
      conditions: []
    - prop: padding
      value: 8px
      conditions: []
    ");
}

#[test]
fn jsx_style_props_feed_the_encoder() {
    // A JSX usage routes into the same encoder pipeline as css().
    let mut project = create_project(json!({
        "jsxFramework": "react"
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box color='red' padding='4px' />;
        "},
    );
    assert_eq!(report.jsx_usages, 1);
    assert_eq!(report.css_calls, 0);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn jsx_condition_props_feed_conditioned_atoms() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "768px"
            }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box color='blue' _hover={{ color: 'red' }} md={{ padding: '4px' }} />;
        "},
    );
    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions:
        - _hover
    - prop: padding
      value: 4px
      conditions:
        - md
    ");
}

#[test]
fn jsx_factory_call_base_styles_feed_the_encoder() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "jsxFactory": "panda"
    }));

    let report = project.parse_file(
        "notice.tsx",
        indoc! {r"
            import { panda } from '@panda/jsx';

            const Notice = panda('div', {
              base: {
                fontFamily: 'Monaspace Neon',
                background: 'pink',
                paddingInline: '16px',
                paddingBlock: '16px',
              },
            });
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: pink
      conditions: []
    - prop: fontFamily
      value: Monaspace Neon
      conditions: []
    - prop: paddingBlock
      value: 16px
      conditions: []
    - prop: paddingInline
      value: 16px
      conditions: []
    ");
}

#[test]
fn jsx_factory_call_plain_style_object_stays_atomic_css() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "jsxFactory": "panda"
    }));

    let report = project.parse_file(
        "notice.tsx",
        indoc! {r"
            import { panda } from '@panda/jsx';

            const Notice = panda('div', {
              color: 'red',
              padding: '4px',
            });
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 2
    recipeCount: 0
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn jsx_factory_call_recipe_variants_feed_the_encoder() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "jsxFactory": "panda"
    }));

    let report = project.parse_file(
        "notice.tsx",
        indoc! {r"
            import { panda } from '@panda/jsx';

            const Notice = panda('div', {
              base: {
                display: 'inline-flex',
              },
              variants: {
                size: {
                  sm: { fontSize: '12px' },
                  lg: { fontSize: '18px' },
                },
                tone: {
                  info: { color: 'blue' },
                  danger: { color: 'red' },
                },
              },
              defaultVariants: {
                size: 'sm',
                tone: 'info',
              },
              compoundVariants: [
                {
                  size: 'lg',
                  tone: 'danger',
                  css: { fontWeight: 'bold' },
                },
              ],
            });
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 6
    recipeCount: 1
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    - prop: display
      value: inline-flex
      conditions: []
    - prop: fontSize
      value: 12px
      conditions: []
    - prop: fontSize
      value: 18px
      conditions: []
    - prop: fontWeight
      value: bold
      conditions: []
    ");
}

#[test]
fn jsx_factory_property_call_variants_without_base_feed_the_encoder() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "jsxFactory": "panda"
    }));

    let report = project.parse_file(
        "notice.tsx",
        indoc! {r"
            import { panda } from '@panda/jsx';

            const Notice = panda.div({
              variants: {
                size: {
                  sm: { fontSize: '12px' },
                  lg: { fontSize: '18px' },
                },
              },
              compoundVariants: [
                {
                  size: 'lg',
                  css: { fontWeight: 'bold' },
                },
              ],
            });
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 3
    recipeCount: 1
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: fontSize
      value: 12px
      conditions: []
    - prop: fontSize
      value: 18px
      conditions: []
    - prop: fontWeight
      value: bold
      conditions: []
    ");
}

#[test]
fn jsx_factory_default_props_route_imported_recipe_usage() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "theme": {
            "recipes": {
                "button": {
                    "base": { "display": "inline-flex" },
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "14px" }
                        },
                        "tone": {
                            "solid": { "background": "red" }
                        }
                    },
                    "defaultVariants": { "size": "sm" }
                }
            }
        }
    }));

    let report = project.parse_file(
        "button.tsx",
        indoc! {r"
            import { styled } from '@panda/jsx';
            import { button as aliasedButton } from '@panda/recipes';

            const Button = styled('button', aliasedButton, {
              defaultProps: {
                size: 'md',
                tone: 'solid',
                color: 'blue',
              },
            });
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base:
      - recipe: button
        slot: ~
        className: button
        entries:
          - prop: display
            value: inline-flex
            conditions: []
    variants:
      - recipe: button
        slot: ~
        className: button--size_md
        entries:
          - prop: fontSize
            value: 14px
            conditions: []
      - recipe: button
        slot: ~
        className: button--tone_solid
        entries:
          - prop: background
            value: red
            conditions: []
    atomic: []
    ");
}

#[test]
fn jsx_factory_call_tagged_template_feeds_atomic_css() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "text.tsx",
        indoc! {r"
            import { styled } from '@panda/jsx';

            const Text = styled('span')`
              color: red;
              padding: 4px;
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn css_tagged_template_feeds_atomic_css() {
    let mut project = create_project(json!({
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "styles.ts",
        indoc! {r"
            import { css } from '@panda/css';

            css`
              color: red;
              padding: 4px;
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn styled_member_tagged_template_feeds_jsx_style_props() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "card.tsx",
        indoc! {r"
            import { styled } from '@panda/jsx';

            const Card = styled.div`
              background: white;
              margin: 8px;
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 0
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 1
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: white
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    ");
}

#[test]
fn tagged_template_nested_rules_feed_conditions() {
    let mut project = create_project(json!({
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "nested.ts",
        indoc! {r"
            import { css } from '@panda/css';

            css`
              color: red;

              &:hover {
                color: blue;
              }

              @media (min-width: 40rem) {
                padding: 8px;
              }
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: red
      conditions: []
    - prop: color
      value: blue
      conditions:
        - "&:hover"
    - prop: padding
      value: 8px
      conditions:
        - "@media (min-width: 40rem)"
    "#);
}

#[test]
fn tagged_template_combinators_match_core_template_literal_fixtures() {
    let mut project = create_project(json!({
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "combinators.ts",
        indoc! {r"
            import { css } from '@panda/css';

            css`
              p + p {
                color: red;
              }

              p ~ p {
                color: blue;
              }

              .box & {
                background-color: red;
              }
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: background-color
      value: red
      conditions:
        - ".box &"
    - prop: color
      value: red
      conditions:
        - "& p + p"
    - prop: color
      value: blue
      conditions:
        - "& p ~ p"
    "#);
}

#[test]
fn tagged_template_deep_native_nesting_matches_core_template_literal_fixtures() {
    let mut project = create_project(json!({
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "deep.ts",
        indoc! {r"
            import { css } from '@panda/css';

            css`
              .demo {
                .triangle,
                .square {
                  opacity: 0.25;
                  filter: blur(25px);
                }
              }

              :not(.pink) {
                opacity: 0.5;
              }

              figure {
                margin: 0;

                > figcaption {
                  background: hsl(0 0% 0% / 50%);

                  > p {
                    font-size: 0.9rem;
                  }
                }
              }
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: background
      value: hsl(0 0% 0% / 50%)
      conditions:
        - "& figure"
        - "& > figcaption"
    - prop: filter
      value: blur(25px)
      conditions:
        - "& .demo"
        - "& .triangle, .square"
    - prop: font-size
      value: 0.9rem
      conditions:
        - "& figure"
        - "& > figcaption"
        - "& > p"
    - prop: margin
      value: "0"
      conditions:
        - "& figure"
    - prop: opacity
      value: "0.25"
      conditions:
        - "& .demo"
        - "& .triangle, .square"
    - prop: opacity
      value: "0.5"
      conditions:
        - "& :not(.pink)"
    "#);
}

#[test]
fn tagged_template_token_function_interpolations_fold() {
    let mut project = create_project(json!({
        "syntax": "template-literal",
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "500": {
                            "value": "#ef4444"
                        }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "tokens.ts",
        indoc! {r"
            import { css } from '@panda/css';
            import { token } from '@panda/tokens';

            css`
              color: ${token('colors.red.500')};
              border-color: ${token.var('colors.red.500')};
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r##"
    - prop: border-color
      value: var(--colors-red-500)
      conditions: []
    - prop: color
      value: "#ef4444"
      conditions: []
    "##);
}

#[test]
fn tagged_template_string_fragment_interpolations_fold() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "fragments.tsx",
        indoc! {r"
            import { styled } from '@panda/jsx';

            const colorRule = 'color: blue;';
            const backgroundRule = 'background: red;';

            const Box = styled.div`
              ${colorRule}
              ${backgroundRule}
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 0
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 1
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: red
      conditions: []
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn tagged_template_literal_expression_interpolations_fold() {
    let mut project = create_project(json!({
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "emotion-like.ts",
        indoc! {r"
            import { css } from '@panda/css';

            css`
              color: ${'green'};
              font-size: ${10 + 4}px;
              width: ${500}px;
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: green
      conditions: []
    - prop: font-size
      value: 14px
      conditions: []
    - prop: width
      value: 500px
      conditions: []
    ");
}

#[test]
fn tagged_template_at_rule_prelude_interpolation_folds() {
    let mut project = create_project(json!({
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "media.ts",
        indoc! {r"
            import { css } from '@panda/css';

            const breakpoint = 768;

            css`
              color: blue;

              @media (min-width: ${breakpoint}px) {
                color: red;
              }
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions:
        - "@media (min-width: 768px)"
    "#);
}

#[test]
fn tagged_template_var_fallback_interpolation_folds() {
    let mut project = create_project(json!({
        "syntax": "template-literal"
    }));

    let report = project.parse_file(
        "fallback.ts",
        indoc! {r"
            import { css } from '@panda/css';

            const fallback = 'coral';

            css`
              color: var(--theme-color, ${fallback});
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 1
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: "var(--theme-color, coral)"
      conditions: []
    "#);
}

#[test]
fn tagged_templates_are_ignored_in_object_syntax() {
    let mut project = create_project(json!({}));

    let report = project.parse_file(
        "text.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            import { styled } from '@panda/jsx';

            const cssText = css`color: red;`;
            const StyledText = styled('span')`
              padding: 4px;
            `;
        "},
    );

    assert_yaml_snapshot!(report, @r"
    cssCalls: 0
    cvaCalls: 0
    svaCalls: 0
    jsxUsages: 0
    diagnostics: []
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
}

#[test]
fn bare_slot_recipe_component_in_vue_template_emits_recipe_css() {
    // The nuxt sandbox shape: components wrapping the `custom` slot recipe via
    // createSlotRecipeContext, consumed prop-less from a .vue template. The
    // inferred jsx names (`Custom.Root`, `Custom.Label`) plus the template
    // `emit_empty` rule must produce the recipe base CSS without any props.
    let mut project = create_project(json!({
        "jsxFramework": "vue",
        "theme": {
            "slotRecipes": {
                "custom": {
                    "slots": ["root", "label"],
                    "base": {
                        "root": { "background": "red" },
                        "label": { "fontWeight": "medium" }
                    },
                    "variants": {
                        "size": {
                            "sm": { "root": { "padding": "10px" } }
                        }
                    },
                    "defaultVariants": { "size": "sm" }
                }
            }
        }
    }));

    let report = project.parse_file(
        "page.vue",
        indoc! {r#"
            <template>
              <Custom.Root>
                <Custom.Label>Hello</Custom.Label>
              </Custom.Root>
            </template>
            <script setup lang="ts">
            import * as Custom from '../components/custom'
            </script>
        "#},
    );

    assert_eq!(report.jsx_usages, 2);
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @"
    base:
      - recipe: custom
        slot: label
        className: custom__label
        entries:
          - prop: fontWeight
            value: medium
            conditions: []
      - recipe: custom
        slot: root
        className: custom__root
        entries:
          - prop: background
            value: red
            conditions: []
    variants:
      - recipe: custom
        slot: root
        className: custom__root--size_sm
        entries:
          - prop: padding
            value: 10px
            conditions: []
    atomic: []
    ");
}

#[test]
fn kebab_case_recipe_component_in_vue_template_selects_variants() {
    // Vue templates may reference the PascalCase binding as `<custom-root>`;
    // the inferred `CustomRoot` jsx name must match and route variants.
    let mut project = create_project(json!({
        "jsxFramework": "vue",
        "theme": {
            "slotRecipes": {
                "custom": {
                    "slots": ["root"],
                    "base": { "root": { "background": "red" } },
                    "variants": {
                        "size": {
                            "md": { "root": { "padding": "20px" } }
                        }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "page.vue",
        indoc! {r#"
            <template>
              <custom-root size="md" />
            </template>
        "#},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @"
    base:
      - recipe: custom
        slot: root
        className: custom__root
        entries:
          - prop: background
            value: red
            conditions: []
    variants:
      - recipe: custom
        slot: root
        className: custom__root--size_md
        entries:
          - prop: padding
            value: 20px
            conditions: []
    atomic: []
    ");
}

#[test]
fn same_name_shorthand_variant_in_vue_template_selects_variants() {
    // Vue 3.4 same-name shorthand: `:size` binds the script `size` constant,
    // so the variant resolves through the script scope.
    let mut project = create_project(json!({
        "jsxFramework": "vue",
        "theme": {
            "slotRecipes": {
                "custom": {
                    "slots": ["root"],
                    "base": { "root": { "background": "red" } },
                    "variants": {
                        "size": {
                            "md": { "root": { "padding": "20px" } }
                        }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "page.vue",
        indoc! {r#"
            <template>
              <Custom.Root :size />
            </template>
            <script setup lang="ts">
            import * as Custom from '../components/custom'
            const size = 'md'
            </script>
        "#},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @"
    base:
      - recipe: custom
        slot: root
        className: custom__root
        entries:
          - prop: background
            value: red
            conditions: []
    variants:
      - recipe: custom
        slot: root
        className: custom__root--size_md
        entries:
          - prop: padding
            value: 20px
            conditions: []
    atomic: []
    ");
}

#[test]
fn named_slot_recipe_member_tag_routes_recipe_and_style_props() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "theme": {
            "slotRecipes": {
                "tabs": {
                    "jsx": ["Tabs"],
                    "slots": ["root", "trigger"],
                    "base": {
                        "root": { "display": "flex" },
                        "trigger": { "color": "blue" }
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "gap": "4px" },
                                "trigger": { "fontSize": "12px" }
                            }
                        }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "tabs.tsx",
        indoc! {r"
            import { Tabs } from '@panda/jsx';

            const el = <Tabs.Trigger size='sm' padding='2px' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: padding
      value: 2px
      conditions: []
    ");
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base:
      - recipe: tabs
        slot: root
        className: tabs__root
        entries:
          - prop: display
            value: flex
            conditions: []
      - recipe: tabs
        slot: trigger
        className: tabs__trigger
        entries:
          - prop: color
            value: blue
            conditions: []
    variants:
      - recipe: tabs
        slot: root
        className: tabs__root--size_sm
        entries:
          - prop: gap
            value: 4px
            conditions: []
      - recipe: tabs
        slot: trigger
        className: tabs__trigger--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
    atomic: []
    ");
}

#[test]
fn jsx_css_prop_object_feeds_styles() {
    // The `css` prop's object value is treated as nested styles, not a flat
    // `css`-named atom.
    let mut project = create_project(json!({
        "jsxFramework": "react"
    }));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box css={{ color: 'red', fontSize: 'lg' }} />;
        "},
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @"
    - prop: color
      value: red
      conditions: []
    - prop: fontSize
      value: lg
      conditions: []
    ");
}

#[test]
fn jsx_css_prop_array_merges_each_object() {
    // Array form `css={[{...}, {...}]}` — each entry contributes atoms.
    let mut project = create_project(json!({
        "jsxFramework": "react"
    }));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box css={[{ color: 'red' }, { background: 'blue' }]} />;
        "},
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @"
    - prop: background
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn wildcard_css_prop_feeds_styles() {
    // `*Css` props (e.g. `inputCss`) are treated as nested style objects, the
    // same as the bare `css` prop.
    let mut project = create_project(json!({
        "jsxFramework": "react"
    }));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box inputCss={{ color: 'red' }} />;
        "},
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn sva_with_unresolvable_spread_slots_infers_from_base() {
    // Ark UI pattern: `slots: [...anatomy.keys()]` — the spread source is a
    // non-foldable call, so the slots array can't resolve. The unresolvable
    // `slots` property is skipped, `base` survives, and slots infer from the
    // base keys so decomposition still produces atoms.
    let mut project = create_project(json!({}));
    project.parse_file(
        "tabs.tsx",
        indoc! {r"
            import { sva } from '@panda/css';
            sva({ slots: [...anatomy.keys()], base: { root: { color: 'red' }, trigger: { padding: '4px' } } });
        "},
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn recipes_iterator_yields_typed_recipe_per_call_site() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            const button = cva({
              base: { color: 'red' },
              variants: { size: { sm: { fontSize: 12 } } },
            });
        "},
    );
    let recipes: Vec<_> = project
        .recipes()
        .map(|(file, _span, recipe)| (file.to_owned(), recipe.clone()))
        .collect();
    assert_yaml_snapshot!(recipes, @r"
    - - button.tsx
      - base:
          color: red
        variants:
          - name: size
            options:
              - key: sm
                style:
                  fontSize: 12
    ");
}

#[test]
fn config_theme_tokens_attach_token_dictionary() {
    use pandacss_encoder::AtomValue;

    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "500": {
                            "value": "#ef4444"
                        }
                    }
                }
            }
        }
    }));
    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { token } from '@panda/tokens';
            import { css } from '@panda/css';
            css({ color: token('colors.red.500') });
        "},
    );
    let color = project
        .atoms()
        .iter()
        .find(|a| a.prop() == "color")
        .expect("color atom");
    assert!(
        matches!(
            color.value(),
            AtomValue::Token { path, value }
                if &**path == "colors.red.500" && &**value == "#ef4444"
        ),
        "token() preserved identity and resolved value, got {:?}",
        color.value(),
    );
}

#[test]
fn complex_recipe_decomposes_into_many_atoms() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            cva({
              base: { display: 'inline-flex', alignItems: 'center' },
              variants: {
                intent: {
                  primary: { background: 'blue', color: 'white' },
                  danger: { background: 'red', color: 'white' },
                },
                size: {
                  sm: { fontSize: 12 },
                  lg: { fontSize: 16 },
                },
              },
              compoundVariants: [
                { intent: 'danger', size: 'lg', css: { fontWeight: 'bold' } },
              ],
            });
        "},
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: alignItems
      value: center
      conditions: []
    - prop: background
      value: blue
      conditions: []
    - prop: background
      value: red
      conditions: []
    - prop: color
      value: white
      conditions: []
    - prop: display
      value: inline-flex
      conditions: []
    - prop: fontSize
      value: "12"
      conditions: []
    - prop: fontSize
      value: "16"
      conditions: []
    - prop: fontWeight
      value: bold
      conditions: []
    "#);
}
