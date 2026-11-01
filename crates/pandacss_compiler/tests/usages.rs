mod common;

use common::create_config;
use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};
use serde_json::json;

use pandacss_compiler::{FileInspectionResult, StyleEntryKind};
use pandacss_config::UserConfig;
use pandacss_project::Span;
use pandacss_system::System;

/// A compiled system plus the config it came from, as the bindings hold them.
struct Fixture {
    system: System,
    config: UserConfig,
}

fn inspect_file_source(fixture: &Fixture, path: &str, source: &str) -> FileInspectionResult {
    pandacss_compiler::inspect_file_source(&fixture.system, &fixture.config, path, source)
}

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

fn system() -> Fixture {
    system_with(json!({
        "jsxFramework": "react",
        "theme": {
            "tokens": {
                "colors": { "red": { "300": { "value": "#f00" }, "500": { "value": "#e00" } } },
                "spacing": { "4": { "value": "1rem" } }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "error": { "value": "{colors.red.500}" }
                    }
                }
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

fn system_with(overrides: serde_json::Value) -> Fixture {
    let config = create_config(overrides);
    Fixture {
        system: System::new(config.clone()).expect("valid config"),
        config,
    }
}

#[test]
fn bare_category_value_resolves_to_token() {
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ p: '4' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property padding
    Token spacing.4
    ");
}

#[test]
fn css_call_collects_every_style_object_argument() {
    let result = inspect_file_source(
        &system(),
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ color: 'red.500' }, { p: '4' })",
    );
    assert_snapshot!(style_summary(&result), @r#"
    Utility CssCall Safe color -> None path=color
    Utility CssCall Safe p -> Some("padding") path=p
    "#);
}

#[test]
fn opacity_modifier_still_captures_the_base_token() {
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
fn inspection_exposes_token_metadata_on_token_refs() {
    let result = inspect_file_source(
        &system(),
        "a.tsx",
        indoc! {r"
            import { token } from '@panda/tokens'
            token('colors.red.500')
            token('colors.fg.error')
        "},
    );

    let refs = result
        .token_refs
        .iter()
        .map(|token_ref| {
            let token = token_ref.token.as_ref().expect("token metadata");
            json!({
                "path": token_ref.path,
                "token": {
                    "path": token.path,
                    "category": token.category,
                    "categoryPath": token.category_path,
                    "semantic": token.semantic,
                    "semanticCategory": token.semantic_category,
                }
            })
        })
        .collect::<Vec<_>>();

    assert_yaml_snapshot!(refs, @r"
    - path: colors.red.500
      token:
        path: colors.red.500
        category: colors
        categoryPath: red.500
        semantic: false
        semanticCategory: true
    - path: colors.fg.error
      token:
        path: colors.fg.error
        category: colors
        categoryPath: fg.error
        semantic: true
        semanticCategory: true
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
    let result = inspect_file_source(&system(), "a.tsx", source);

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
fn inspection_exposes_token_metadata_on_style_value_spans() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          color: { base: 'red.500/40', _hover: 'fg.error' },
          p: '4',
        })
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);

    let spans = result
        .style_entries
        .iter()
        .filter(|entry| entry.kind == StyleEntryKind::Utility)
        .flat_map(|entry| {
            entry.value_spans.iter().map(|span| {
                let token = span.token.as_ref().expect("token metadata");
                json!({
                    "entry": entry.path,
                    "value": span.value,
                    "token": {
                        "path": token.path,
                        "category": token.category,
                        "categoryPath": token.category_path,
                        "modifier": token.modifier,
                        "semantic": token.semantic,
                        "semanticCategory": token.semantic_category,
                    }
                })
            })
        })
        .collect::<Vec<_>>();

    assert_yaml_snapshot!(spans, @r#"
    - entry:
        - color
      value: red.500/40
      token:
        path: colors.red.500
        category: colors
        categoryPath: red.500
        modifier: "40"
        semantic: false
        semanticCategory: true
    - entry:
        - color
      value: fg.error
      token:
        path: colors.fg.error
        category: colors
        categoryPath: fg.error
        modifier: ~
        semantic: true
        semanticCategory: true
    - entry:
        - p
      value: "4"
      token:
        path: spacing.4
        category: spacing
        categoryPath: "4"
        modifier: ~
        semantic: false
        semanticCategory: false
    "#);
}

#[test]
fn inspection_treats_jsx_css_props_as_nested_style_objects() {
    let source = indoc! {r"
        import { Box } from '@panda/jsx'
        const el = <Box color='red' css={{ p: '4' }} inputCss={{ color: 'red.500' }} />
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);

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
fn inspection_descends_array_css_prop() {
    let source = indoc! {r"
        import { Box } from '@panda/jsx'
        const el = <Box css={[{ color: 'red.500' }, { p: '4' }]} />
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);

    let entries = result
        .style_entries
        .iter()
        .map(|entry| {
            json!({
                "kind": entry.kind,
                "fixable": entry.fixable,
                "path": entry.path,
                "value": span_text(source, entry.value_span),
            })
        })
        .collect::<Vec<_>>();
    assert_yaml_snapshot!(entries, @r#"
    - kind: utility
      fixable: safe
      path:
        - css
        - "0"
        - color
      value: "'red.500'"
    - kind: utility
      fixable: safe
      path:
        - css
        - "1"
        - p
      value: "'4'"
    "#);
}

#[test]
fn framework_template_style_entries_stay_report_only() {
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system_with(json!({
            "jsxFramework": "react",
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
        })),
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
    let result = inspect_file_source(
        &system(),
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animationName: 'spin' })",
    );
    assert_snapshot!(summary(&result), @r"
    Property animationName
    Keyframe spin
    ");
}

#[test]
fn animation_tokens_are_token_usages_and_their_keyframes_are_not_written_here() {
    let system = system_with(json!({
        "utilities": { "animation": { "values": "animations" } },
        "conditions": { "dark": "&[data-theme=dark]" },
        "theme": {
            "tokens": { "animations": {
                "motion": { "value": "slide 300ms, fade 300ms" },
                "pulse": { "value": "pulse 2s infinite" }
            } },
            "semanticTokens": { "animations": {
                "alias": { "value": "{animations.motion}" },
                "conditional": { "value": { "base": "{animations.alias}", "_dark": "{animations.pulse}" } }
            } },
            "keyframes": {
                "motion": { "to": { "opacity": 0 } },
                "slide": { "to": { "opacity": 1 } },
                "fade": { "to": { "opacity": 1 } },
                "pulse": { "to": { "opacity": 1 } }
            }
        }
    }));
    for (value, expected) in [
        ("motion", vec!["Token animations.motion"]),
        ("conditional", vec!["Token animations.conditional"]),
        (
            "slide 1s, pulse 2s",
            vec!["Keyframe pulse", "Keyframe slide"],
        ),
    ] {
        let source =
            format!("import {{ css }} from '@panda/css'; css({{ animation: '{value}' }});");
        let result = inspect_file_source(&system, "a.ts", &source);
        let mut names = result
            .usages
            .iter()
            .filter(|site| {
                matches!(
                    site.kind,
                    pandacss_compiler::UsageKind::Keyframe | pandacss_compiler::UsageKind::Token
                )
            })
            .map(|site| format!("{:?} {}", site.kind, site.name))
            .collect::<Vec<_>>();
        names.sort_unstable();
        assert_eq!(names, expected, "{value}");
    }
}

#[test]
fn animation_name_captures_multiple_comma_separated_keyframes() {
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(
        &system(),
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
    let result = inspect_file_source(&system(), "a.tsx", source);

    assert_snapshot!(style_summary(&result), @r###"
    Utility RecipeCall Safe color -> None path=base.color
    Utility RecipeCall Safe color -> None path=variants.tone.danger.color
    Utility RecipeCall Safe p -> Some("padding") path=compoundVariants.0.css.p
    "###);

    let spans = result
        .style_entries
        .iter()
        .filter(|entry| matches!(entry.kind, StyleEntryKind::Utility))
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
    let result = inspect_file_source(&system(), "a.tsx", source);

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
    let result = inspect_file_source(&system(), "a.tsx", source);

    assert_snapshot!(style_summary(&result), @r"
    Utility RecipeCall Safe color -> None path=base.color
    Utility RecipeCall Safe color -> None path=variants.tone.danger.color
    ");
}

#[test]
fn inspection_collects_styled_factory_default_props() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx'
        styled('div', { color: 'red.300' }, {
          defaultProps: {
            p: '4',
            color: { base: 'red.500', _hover: 'red.300' },
            css: { padding: '4' },
          },
        })
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);

    assert_snapshot!(summary(&result), @r"
    Property color
    Token colors.red.300
    Property padding
    Token spacing.4
    Property color
    Token colors.red.500
    Property color
    Token colors.red.300
    Property padding
    Token spacing.4
    ");
    assert_snapshot!(style_summary(&result), @r#"
    Utility CssCall Safe color -> None path=color
    Utility JsxProp Safe p -> Some("padding") path=defaultProps.p
    Utility JsxProp Safe color -> None path=defaultProps.color
    Utility JsxStyleProp Safe padding -> None path=defaultProps.css.padding
    "#);
}

#[test]
fn inspection_collects_function_default_props() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx'
        styled('div', { color: 'red.300' }, {
          defaultProps: () => ({ color: 'red.500' }),
        })
        styled('span', { color: 'red.300' }, {
          defaultProps() {
            return { p: '4' }
          },
        })
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);

    assert_snapshot!(summary(&result), @r"
    Property color
    Token colors.red.300
    Property color
    Token colors.red.500
    Property color
    Token colors.red.300
    Property padding
    Token spacing.4
    ");
}

#[test]
fn inspection_collects_imported_recipe_default_props() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx'
        import { button } from '@panda/recipes'
        styled('button', button, {
          defaultProps: {
            size: 'md',
            color: 'red.500',
          },
        })
    "};
    let result = inspect_file_source(
        &system_with(json!({
            "jsxFramework": "react",
            "theme": {
                "tokens": {
                    "colors": { "red": { "500": { "value": "#e00" } } }
                },
                "recipes": {
                    "button": {
                        "className": "button",
                        "variants": {
                            "size": {
                                "sm": { "padding": "1" },
                                "md": { "padding": "2" }
                            }
                        }
                    }
                }
            },
            "utilities": {
                "color": { "className": "c", "values": "colors" }
            }
        })),
        "a.tsx",
        source,
    );

    assert_snapshot!(summary(&result), @r"
    Recipe button
    Property size
    Property color
    Token colors.red.500
    ");
}

#[test]
fn inspection_collects_namespace_and_aliased_recipe_default_props() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx'
        import * as recipes from '@panda/recipes'
        import { button } from '@panda/recipes'
        const recipe = button
        styled('button', recipes.button, {
          defaultProps: { size: 'md', color: 'red.500' },
        })
        styled('span', recipe, {
          defaultProps: { size: 'sm' },
        })
    "};
    let result = inspect_file_source(
        &system_with(json!({
            "jsxFramework": "react",
            "theme": {
                "tokens": {
                    "colors": { "red": { "500": { "value": "#e00" } } }
                },
                "recipes": {
                    "button": {
                        "className": "button",
                        "variants": {
                            "size": {
                                "sm": { "padding": "1" },
                                "md": { "padding": "2" }
                            }
                        }
                    }
                }
            },
            "utilities": {
                "color": { "className": "c", "values": "colors" }
            }
        })),
        "a.tsx",
        source,
    );

    assert_snapshot!(summary(&result), @r"
    Recipe button
    Property size
    Property color
    Token colors.red.500
    Recipe button
    Property size
    ");
}

#[test]
fn reports_named_view_transition_and_position_try_usages() {
    let result = inspect_file_source(
        &system(),
        "a.tsx",
        indoc! {r"
            import { viewTransition, positionTry } from '@panda/css'
            export const vt = viewTransition('slide')
            export const pt = positionTry('flip')
        "},
    );
    assert_snapshot!(summary(&result), @"
    ViewTransition slide
    PositionTry flip
    ");
}

#[test]
fn collects_position_try_and_view_transition_styles_as_entries() {
    // Lint rules operate on style entries, so the descriptor/slot bodies of
    // positionTry / viewTransition must surface as entries, not just usage sites.
    let result = inspect_file_source(
        &system(),
        "a.tsx",
        indoc! {r"
            import { positionTry, viewTransition } from '@panda/css'
            positionTry({ marginTop: '4' })
            viewTransition({ old: { color: 'red.500' } })
        "},
    );
    assert_snapshot!(style_summary(&result), @"
    Unknown CssCall Safe marginTop -> None path=marginTop
    Utility CssCall Safe color -> None path=old.color
    ");
}

#[test]
fn inspection_and_compilation_share_file_local_condition_diagnostics() {
    let source = indoc! {"
        import { css } from '@panda/css'
        css({ _hver: { color: 'red.500' } })
        css({ _zzzzz: { color: 'red.500' } })
    "};
    let system = system();
    let inspection = inspect_file_source(&system, "a.tsx", source);
    let mut project = pandacss_project::Project::new(system.system);
    let mut compiled = project.parse_file("a.tsx", source);
    for diagnostic in &mut compiled.diagnostics {
        diagnostic.file = None;
    }

    assert_eq!(inspection.diagnostics, compiled.diagnostics);
    assert_yaml_snapshot!(inspection.diagnostics, @r#"
    - code: unknown_condition
      message: "unknown condition `_hver`, did you mean `_hover`?"
      severity: warning
      span:
        start: 33
        end: 69
      location:
        start:
          line: 2
          column: 1
        end:
          line: 2
          column: 37
    - code: unknown_condition
      message: "unknown condition `_zzzzz`"
      severity: warning
      span:
        start: 70
        end: 107
      location:
        start:
          line: 3
          column: 1
        end:
          line: 3
          column: 38
    "#);
}

#[test]
fn inspection_locates_token_references_inside_style_values() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        import { Box } from '@panda/jsx'
        const shadow = '0 0 0 1px {colors.fromVariable}'
        css({
          color: '{colors.red.500} {colors.missing/50}',
          padding: `calc(token(spacing.gap) + 2px)`,
          boxShadow: shadow,
          _hover: { color: '1px solid token(colors.red.300, {colors.fallback})' },
        })
        const J = () => <Box color='{colors.jsx}' />
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);

    let refs = result
        .token_refs
        .iter()
        .map(|reference| {
            let at = &source[reference.span.start as usize..reference.span.end as usize];
            format!("{} resolved={} at={at}", reference.path, reference.resolved)
        })
        .collect::<Vec<_>>()
        .join("\n");

    assert_snapshot!(refs, @"
    colors.red.500 resolved=true at=colors.red.500
    colors.missing resolved=false at=colors.missing
    spacing.gap resolved=false at=spacing.gap
    colors.fromVariable resolved=false at=shadow
    colors.red.300 resolved=true at=colors.red.300
    colors.fallback resolved=false at=colors.fallback
    colors.jsx resolved=false at=colors.jsx
    ");
}

#[test]
fn recipe_metadata_is_not_a_token_reference() {
    let source = r#"
        import { Box } from '@panda/jsx'
        import { cva } from '@panda/css'
        const J = () => <Box title="{colors.example}" data-example="token(colors.example)" />
        cva({ className: '{colors.label}', base: { color: 'red.500' } })
    "#;
    let result = inspect_file_source(&system(), "a.tsx", source);
    assert!(result.token_refs.is_empty(), "{:#?}", result.token_refs);
}

#[test]
fn inspection_and_build_share_semantic_token_reference_boundaries() {
    let mut project = pandacss_project::Project::new(system().system);
    let system = system();
    let cases: &[(&str, &[&str])] = &[
        (
            "css({color: '{colors.first}'}, {padding: ['token(spacing.second)', '{spacing.third}']})",
            &["colors.first", "spacing.second", "spacing.third"],
        ),
        (
            "css(flag ? {color: '{colors.yes}'} : {color: '{colors.no}'})",
            &["colors.yes", "colors.no"],
        ),
        (
            "css({_hover: flag ? {color: '{colors.hoverYes}'} : {color: '{colors.hoverNo}'}})",
            &["colors.hoverYes", "colors.hoverNo"],
        ),
        (
            "cva({className: '{colors.metadata}', base: {color: '{colors.base}'}, variants: {tone: {'{colors.selector}': {color: '{colors.variant}'}}}, defaultVariants: {tone: '{colors.default}'}, compoundVariants: [{tone: '{colors.compoundSelector}', css: {color: '{colors.compound}'}}]})",
            &["colors.base", "colors.variant", "colors.compound"],
        ),
        (
            "sva({slots: ['{colors.slotName}'], className: '{colors.className}', base: {root: {color: '{colors.slot}'}}})",
            &["colors.slot"],
        ),
        (
            "styled('div', {base: {color: '{colors.direct}'}}, {defaultProps: {title: '{colors.title}', color: '{colors.defaultProp}'}, data: '{colors.options}'})",
            &["colors.direct", "colors.defaultProp"],
        ),
        (
            "styled.div({color: '{colors.member}'}, {defaultProps: {title: '{colors.title}', color: '{colors.memberDefault}'}})",
            &["colors.member", "colors.memberDefault"],
        ),
        (
            "viewTransition({name: '{colors.name}', old: {color: '{colors.old}'}, new: {color: '{colors.new}'}})",
            &["colors.old", "colors.new"],
        ),
        ("viewTransition('{colors.named}')", &[]),
        ("positionTry('{colors.named}')", &[]),
        ("positionTry({top: '{spacing.top}'})", &["spacing.top"]),
        (
            "keyframes({from: {color: '{colors.from}'}, to: {color: '{colors.to}'}})",
            &["colors.from", "colors.to"],
        ),
        (
            "const J = () => <Box title='{colors.title}' css={[{color: '{colors.cssProp}'}]} color={{base: '{colors.responsive}'}} />",
            &["colors.cssProp", "colors.responsive"],
        ),
    ];
    for (body, expected) in cases {
        let source = format!(
            "import {{css, cva, sva, viewTransition, positionTry, keyframes}} from '@panda/css';\nimport {{styled, Box}} from '@panda/jsx';\n{body}"
        );
        let inspection = inspect_file_source(&system, "a.tsx", &source);
        let paths: Vec<_> = inspection
            .token_refs
            .iter()
            .map(|reference| reference.path.as_str())
            .collect();
        assert_eq!(paths, *expected, "inspection: {body}");
        let report = project.parse_file("a.tsx", &source);
        let token_warnings: Vec<_> = report
            .diagnostics
            .iter()
            .filter(|diagnostic| diagnostic.code == "unknown_token_reference")
            .collect();
        assert_eq!(
            token_warnings.len(),
            expected.len(),
            "build: {body}: {token_warnings:#?}"
        );
        for (warning, path) in token_warnings.iter().zip(*expected) {
            assert!(
                warning.message.contains(&format!("`{path}`")),
                "{body}: {}",
                warning.message
            );
        }
    }
}

#[test]
fn recipe_variant_values_are_not_style_token_references() {
    let system = system_with(json!({
        "jsxFramework": "react",
        "theme": {
            "tokens": {"colors": {"red": {"500": {"value": "#f00"}}}},
            "recipes": {
                "button": {
                    "className": "button",
                    "jsx": ["Button"],
                    "variants": {"color": {"{colors.selector}": {"display": "block"}}}
                }
            }
        },
        "utilities": {"color": {"values": "colors"}, "backgroundColor": {"values": "colors"}}
    }));
    let source = indoc! {r"
        import {button} from '@panda/recipes'
        import {styled} from '@panda/jsx'
        button({color: '{colors.selector}'})
        styled('button', button, {defaultProps: {color: '{colors.selector}', backgroundColor: '{colors.default}'}})
        const J = () => <Button color='{colors.selector}' backgroundColor='{colors.override}' css={{color: '{colors.nested}'}} />
    "};
    let inspection = inspect_file_source(&system, "a.tsx", source);
    let paths: Vec<_> = inspection
        .token_refs
        .iter()
        .map(|reference| reference.path.as_str())
        .collect();
    assert_eq!(
        paths,
        ["colors.default", "colors.override", "colors.nested"]
    );
    let mut project = pandacss_project::Project::new(system.system);
    let report = project.parse_file("a.tsx", source);
    let warnings: Vec<_> = report
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.code == "unknown_token_reference")
        .collect();
    assert_eq!(warnings.len(), 3, "{warnings:#?}");
    assert!(
        warnings
            .iter()
            .all(|warning| !warning.message.contains("colors.selector"))
    );
}

#[test]
fn escaped_and_folded_string_references_keep_reportable_source_spans() {
    let source = indoc! {r"
        import {css} from '@panda/css'
        const suffix = 'missing'
        css({color: '\u007bcolors.escaped}', padding: `{spacing.${suffix}}`})
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);
    let refs: Vec<_> = result
        .token_refs
        .iter()
        .map(|reference| {
            (
                reference.path.as_str(),
                &source[reference.span.start as usize..reference.span.end as usize],
            )
        })
        .collect();
    assert_eq!(
        refs,
        [
            ("colors.escaped", "'\\u007bcolors.escaped}'"),
            ("spacing.missing", "`{spacing.${suffix}}`"),
        ]
    );
}

#[test]
fn pattern_references_only_scan_style_valued_props() {
    let system = system_with(json!({
        "jsxFramework": "react",
        "theme": {"tokens": {"sizes": {"4": {"value": "1rem"}}}},
        "patterns": {"stack": {"properties": {
            "label": {"type": "string"},
            "direction": {"type": "enum", "value": ["row", "column"]},
            "space": {"type": "property", "value": "gap"},
            "shade": {"type": "token", "value": "colors"}
        }}}
    }));
    let source = indoc! {r"
        import {stack} from '@panda/patterns'
        import {Stack} from '@panda/jsx'
        stack({label: '{user.name}', direction: 'token(application.mode)', space: '{spacing.fn}', shade: '{colors.fn}', gap: '{spacing.gap}'})
        const J = () => <Stack label='{user.name}' direction='token(application.mode)' space='{spacing.jsx}' shade='{colors.jsx}' title='{user.title}' css={{color: '{colors.css}'}} />
    "};
    let result = inspect_file_source(&system, "a.tsx", source);
    let paths: Vec<_> = result
        .token_refs
        .iter()
        .map(|reference| reference.path.as_str())
        .collect();
    assert_eq!(
        paths,
        [
            "spacing.fn",
            "colors.fn",
            "spacing.gap",
            "spacing.jsx",
            "colors.jsx",
            "colors.css"
        ]
    );
    let mut project = pandacss_project::Project::new(system.system);
    let report = project.parse_file("a.tsx", source);
    let warnings: Vec<_> = report
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.code == "unknown_token_reference")
        .collect();
    assert_eq!(warnings.len(), paths.len());
    assert!(
        warnings
            .iter()
            .all(|warning| !warning.message.contains("user.")
                && !warning.message.contains("application.mode"))
    );
}

#[test]
fn lint_keeps_each_missing_token_reference_even_with_a_fallback() {
    let source = indoc! {r"
        import {css} from '@panda/css'
        css({
            width: 'token(sizes.ghost, 10px)',
            _hover: {width: 'token(sizes.ghost, 20px)'},
        })
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);
    assert_eq!(result.token_refs.len(), 2);
    for reference in &result.token_refs {
        assert!(!reference.resolved);
        assert_eq!(
            &source[reference.span.start as usize..reference.span.end as usize],
            "sizes.ghost"
        );
    }
    let warnings: Vec<_> = result
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.code == "unknown_token_reference")
        .collect();
    assert_eq!(warnings.len(), 1);
}

#[test]
fn inspection_retains_reference_locations_through_indexed_style_paths() {
    let source = indoc! {r"
        import { css, cva, sva } from '@panda/css'
        import { styled, Box } from '@panda/jsx'
        css({padding: ['{spacing.first}', '{spacing.second}']})
        cva({compoundVariants: [{tone: 'a', css: {color: '{colors.compound}'}}]})
        sva({slots: ['root'], variants: {tone: {a: {root: {color: '{colors.slot}'}}}}})
        styled.div({}, {defaultProps: {color: '{colors.default}'}})
        const J = () => <Box css={[{color: '{colors.jsx}'}]} />
    "};
    let inspection = inspect_file_source(&system(), "a.tsx", source);
    assert_eq!(inspection.token_refs.len(), 6);
    for reference in inspection.token_refs {
        assert_eq!(
            &source[reference.span.start as usize..reference.span.end as usize],
            reference.path
        );
    }
}

#[test]
fn composition_usage_reports_the_style_but_not_what_its_styles_use() {
    let system = system_with(json!({
        "utilities": { "color": { "values": "colors" } },
        "theme": {
            "tokens": { "colors": { "flash": { "value": "#f00" } } },
            "keyframes": {
                "enter": { "to": { "opacity": 1 } },
                "flash": { "to": { "opacity": 1 } },
                "spin": { "to": { "opacity": 1 } }
            },
            "textStyles": { "lead": { "value": { "fontSize": "20px" } } },
            "animationStyles": { "entrance": { "value": {
                "color": "flash",
                "animationName": "enter, flash",
                "_hover": { "animationName": { "base": "spin" } }
            } } }
        }
    }));
    let source = "import { css } from '@panda/css'; css({ animationStyle: 'entrance', textStyle: 'lead' }); css({ textStyle: 'missing' });";
    let result = inspect_file_source(&system, "a.ts", source);
    let mut sites = result
        .usages
        .iter()
        .filter(|site| {
            matches!(
                site.kind,
                pandacss_compiler::UsageKind::Keyframe
                    | pandacss_compiler::UsageKind::Composition
                    | pandacss_compiler::UsageKind::Token
            )
        })
        .map(|site| format!("{:?} {}", site.kind, site.name))
        .collect::<Vec<_>>();
    sites.sort();
    assert_eq!(
        sites,
        [
            "Composition animationStyles.entrance",
            "Composition textStyles.lead",
        ]
    );
}

#[test]
fn tokens_inside_a_jsx_css_prop_are_source_usages() {
    let source = indoc! {r"
        import { Box } from '@panda/jsx'
        const el = <Box css={{ color: 'red.500' }} inputCss={{ _hover: { color: 'red.500' } }} />
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);
    assert_snapshot!(summary(&result), @"
    Property color
    Token colors.red.500
    Property color
    Token colors.red.500
    ");
}

#[test]
fn each_responsive_composition_value_is_a_source_usage() {
    let system = system_with(json!({
        "jsxFramework": "react",
        "conditions": { "dark": "&.dark" },
        "theme": { "textStyles": {
            "lead": { "value": { "fontSize": "20px" } },
            "xl": { "value": { "fontSize": "32px" } }
        } }
    }));
    let source = indoc! {r#"
        import { css } from '@panda/css'
        import { Box } from '@panda/jsx'
        css({ textStyle: { base: 'lead', _dark: 'xl' } })
        const el = <Box textStyle="lead" />
    "#};
    let result = inspect_file_source(&system, "a.tsx", source);
    let compositions = result
        .usages
        .iter()
        .filter(|site| matches!(site.kind, pandacss_compiler::UsageKind::Composition))
        .map(|site| site.name.as_str())
        .collect::<Vec<_>>();
    assert_yaml_snapshot!(compositions, @"
    - textStyles.lead
    - textStyles.xl
    - textStyles.lead
    ");
}

#[test]
fn a_token_repeated_across_first_that_works_members_is_one_usage() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({ color: 'firstThatWorks(red.500, red.500)' })
        css({ color: 'firstThatWorks(red.500, red.300)' })
    "};
    let result = inspect_file_source(&system(), "a.tsx", source);
    assert_snapshot!(summary(&result), @"
    Property color
    Token colors.red.500
    Property color
    Token colors.red.500
    Token colors.red.300
    ");
}

#[test]
fn spacing_values_from_a_theme_function_link_their_token() {
    // `values: (theme) => ({ auto: 'auto', ...theme('spacing') })` serializes to a var map.
    let system = system_with(json!({
        "theme": {
            "tokens": {
                "colors": { "red": { "300": { "value": "#f00" }, "500": { "value": "#e00" } } },
                "spacing": { "2": { "value": "0.5rem" }, "4": { "value": "1rem" } }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "padding": { "className": "p", "shorthand": "p", "values": "spacing" },
            "marginTop": {
                "className": "mt",
                "shorthand": "mt",
                "values": { "auto": "auto", "2": "var(--spacing-2)", "4": "var(--spacing-4)" }
            }
        },
        "conditions": { "hover": "&:hover" }
    }));
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({ p: '4', color: { base: 'red.300', md: 'red.500' } })
        css({ p: { base: '4', md: '4', _hover: '4' } })
        css({ mt: '2' })
        css({ mt: { base: '2' } })
        css({ mt: { md: '4' } })
        css({ mt: { base: '2', _hover: '4' } })
        css({ mt: 'auto' })
    "};
    let result = inspect_file_source(&system, "a.tsx", source);

    let spans = result
        .style_entries
        .iter()
        .filter(|entry| entry.kind == StyleEntryKind::Utility)
        .flat_map(|entry| {
            entry.value_spans.iter().map(|span| {
                format!(
                    "{} {} -> {}",
                    entry.path.join("."),
                    span.value,
                    span.token.as_ref().map_or("-", |token| token.path.as_str())
                )
            })
        })
        .collect::<Vec<_>>()
        .join("\n");

    assert_snapshot!(spans, @"
    p 4 -> spacing.4
    color red.300 -> colors.red.300
    color red.500 -> colors.red.500
    p 4 -> spacing.4
    p 4 -> spacing.4
    p 4 -> spacing.4
    mt 2 -> spacing.2
    mt 2 -> spacing.2
    mt 4 -> spacing.4
    mt 2 -> spacing.2
    mt 4 -> spacing.4
    mt auto -> -
    ");
}

#[test]
fn inspection_reports_dynamic_style_values_with_ranges() {
    let fixture = system_with(json!({
        "jsxFramework": "react",
        "patterns": {
            "stack": { "properties": { "gap": { "property": "gap" } } }
        },
        "theme": {
            "recipes": {
                "button": {
                    "jsx": ["Button"],
                    "variants": { "size": { "sm": { "p": "2" }, "lg": { "p": "4" } } }
                }
            }
        }
    }));
    let source = indoc! {r"
        import { css } from '@panda/css'
        import { Button, Stack, styled } from '@panda/jsx'
        import { Icon } from 'icons'
        css({ color: tone, bg: 'red' })
        css(styles)
        const a = <styled.div color={hue} />
        const b = <Stack gap={gap} />
        const c = <Button size={size} />
        const d = <Icon color={tone} />
    "};
    let result = inspect_file_source(&fixture, "a.tsx", source);

    let sites = result
        .dynamic_values
        .iter()
        .map(|site| {
            format!(
                "{:?} {} `{}` {}:{}-{}:{}",
                site.kind,
                site.path.join("."),
                span_text(source, Some(site.span)),
                site.range.start.line,
                site.range.start.column,
                site.range.end.line,
                site.range.end.column
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    assert_snapshot!(sites, @"
    Value color `tone` 4:14-4:18
    Argument  `styles` 5:5-5:11
    Value color `hue` 6:30-6:33
    Value gap `gap` 7:23-7:26
    ");
}

fn aliased_tokens() -> Fixture {
    system_with(json!({
        "theme": {
            "tokens": {
                "colors": { "semantic": { "text": {
                    "neutral": { "main": { "value": "#111" } },
                    "neutralMain": { "value": "#111", "deprecated": true }
                } } }
            }
        },
        "utilities": { "color": { "className": "c", "values": "colors" } }
    }))
}

#[test]
fn a_token_keeps_the_path_written_when_a_deprecated_alias_shares_its_variable() {
    let result = inspect_file_source(
        &aliased_tokens(),
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ color: 'semantic.text.neutral.main' })",
    );
    assert_snapshot!(summary(&result), @"
    Property color
    Token colors.semantic.text.neutral.main
    ");
}

#[test]
fn a_deprecated_alias_keeps_the_path_written_when_it_shares_a_variable() {
    let result = inspect_file_source(
        &aliased_tokens(),
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ color: 'semantic.text.neutralMain' })",
    );
    assert_snapshot!(summary(&result), @"
    Property color
    Token colors.semantic.text.neutralMain
    ");
}
