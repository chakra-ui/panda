//! Config recipe and slot recipe project behavior.

mod common;

use common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use serde_json::json;

#[test]
fn tracks_and_encodes_config_recipes() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "base": { "display": "inline-flex" },
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" }
                        }
                    }
                }
            },
            "slotRecipes": {
                "card": {
                    "slots": ["root", "label"],
                    "base": {
                        "root": { "padding": "4px" },
                        "label": { "color": "red" }
                    }
                }
            }
        }
    }));

    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 0
    atomCount: 0
    recipeCount: 1
    slotRecipeCount: 1
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants: []
    atomic: []
    ");

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ margin: '8px' });
        "},
    );
    project.clear();

    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 0
    atomCount: 0
    recipeCount: 1
    slotRecipeCount: 1
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants: []
    atomic: []
    ");

    let recipes: Vec<_> = project
        .recipes()
        .map(|(file, span, _)| (file.to_owned(), span))
        .collect();
    assert_yaml_snapshot!(recipes, @r"
    - - theme.recipes.button
      - 0
    ");

    let slot_recipes: Vec<_> = project
        .slot_recipes()
        .map(|(file, span, _)| (file.to_owned(), span))
        .collect();
    assert_yaml_snapshot!(slot_recipes, @r"
    - - theme.slotRecipes.card
      - 0
    ");
}

#[test]
fn splits_recipe_component_variant_and_style_props() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "jsx": ["Action"],
                    "base": { "display": "inline-flex" },
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" }
                        }
                    }
                }
            },
            "slotRecipes": {
                "tabs": {
                    "jsx": ["Tabs"],
                    "slots": ["root"],
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "gap": "4px" }
                            }
                        }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Action, Tabs, TabsRoot } from './components';
            const el = (
              <>
                <Action size='sm' color='red' />
                <Tabs.Root size='sm' padding='2px' />
                <TabsRoot size='sm' margin='8px' />
              </>
            );
        "},
    );

    assert_eq!(report.jsx_usages, 3);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 2px
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
        className: button--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
      - recipe: tabs
        slot: root
        className: tabs__root--size_sm
        entries:
          - prop: gap
            value: 4px
            conditions: []
    atomic: []
    ");
}

#[test]
fn recipe_function_calls_encode_config_recipes() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "base": { "display": "inline-flex" },
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" }
                        }
                    }
                }
            },
            "slotRecipes": {
                "tabs": {
                    "slots": ["root"],
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "gap": "4px" }
                            }
                        }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { button } from '@panda/recipes';
            import * as recipes from '@panda/recipes';
            button({ size: 'sm', color: 'red' });
            recipes.tabs({ size: 'sm', margin: '8px' });
        "},
    );

    assert_eq!(report.css_calls, 0);
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
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
        className: button--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
      - recipe: tabs
        slot: root
        className: tabs__root--size_sm
        entries:
          - prop: gap
            value: 4px
            conditions: []
    atomic: []
    ");
}

#[test]
fn config_recipe_entries_preserve_important_metadata() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "base": { "color": "red !important" },
                    "variants": {
                        "tone": {
                            "solid": { "background": "blue!" }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { button } from '@panda/recipes';
            button({ tone: 'solid' });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base:
      - recipe: button
        slot: ~
        className: button
        entries:
          - prop: color
            value: red
            conditions: []
            important: true
    variants:
      - recipe: button
        slot: ~
        className: button--tone_solid
        entries:
          - prop: background
            value: blue
            conditions: []
            important: true
    atomic: []
    ");
}

#[test]
fn config_recipe_entries_skip_absolute_url_values() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "base": {
                        "color": "red",
                        "backgroundImage": "https://example.com/bg.png"
                    },
                    "variants": {
                        "tone": {
                            "solid": {
                                "background": "blue",
                                "maskImage": "http://example.com/mask.svg"
                            }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { button } from '@panda/recipes';
            button({ tone: 'solid' });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base:
      - recipe: button
        slot: ~
        className: button
        entries:
          - prop: color
            value: red
            conditions: []
    variants:
      - recipe: button
        slot: ~
        className: button--tone_solid
        entries:
          - prop: background
            value: blue
            conditions: []
    atomic: []
    ");
}

#[test]
fn no_arg_recipe_calls_use_base_and_defaults() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "base": { "display": "inline-flex" },
                    "defaultVariants": {
                        "size": "md"
                    },
                    "variants": {
                        "size": {
                            "md": { "fontSize": "16px" }
                        }
                    }
                }
            },
            "slotRecipes": {
                "tabs": {
                    "slots": ["root", "trigger"],
                    "base": {
                        "root": { "display": "flex" }
                    },
                    "defaultVariants": {
                        "size": "sm"
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "gap": "4px" },
                                "trigger": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { button, tabs } from '@panda/recipes';
            button();
            tabs();
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base:
      - recipe: button
        slot: ~
        className: button
        entries:
          - prop: display
            value: inline-flex
            conditions: []
      - recipe: tabs
        slot: root
        className: tabs__root
        entries:
          - prop: display
            value: flex
            conditions: []
    variants:
      - recipe: button
        slot: ~
        className: button--size_md
        entries:
          - prop: fontSize
            value: 16px
            conditions: []
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
          - prop: padding
            value: 2px
            conditions: []
    atomic: []
    ");
}

#[test]
fn recipe_function_calls_support_conditional_variants() {
    let mut project = create_project(json!({
        "theme": {
            "breakpoints": {
                "md": "768px"
            },
            "recipes": {
                "button": {
                    "base": { "display": "inline-flex" },
                    "defaultVariants": {
                        "variant": "solid"
                    },
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        },
                        "variant": {
                            "solid": { "fontWeight": "600" }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { button } from '@panda/recipes';
            button({ size: { base: 'sm', md: 'md' } });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r###"
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
            value: 16px
            conditions:
              - md
      - recipe: button
        slot: ~
        className: button--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
      - recipe: button
        slot: ~
        className: button--variant_solid
        entries:
          - prop: fontWeight
            value: "600"
            conditions: []
    atomic: []
    "###);
}

#[test]
fn recipe_base_and_variants_preserve_nested_conditions() {
    let mut project = create_project(json!({
        "conditions": {
            "disabled": "&:disabled",
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "768px"
            },
            "recipes": {
                "btn": {
                    "className": "btn",
                    "base": {
                        "color": "red",
                        "_hover": {
                            "padding": "4px",
                            "_disabled": { "backgroundColor": "initial" }
                        },
                        "md": { "gap": "2px" }
                    },
                    "variants": {
                        "size": {
                            "lg": {
                                "fontSize": "16px",
                                "&[data-disabled]": {
                                    "color": "gray"
                                },
                                "_hover": { "padding": "2px" }
                            }
                        }
                    },
                    "defaultVariants": {
                        "size": "lg"
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { btn } from '@panda/recipes';
            btn({ size: 'lg' });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r#"
    base:
      - recipe: btn
        slot: ~
        className: btn
        entries:
          - prop: color
            value: red
            conditions: []
          - prop: padding
            value: 4px
            conditions:
              - _hover
          - prop: backgroundColor
            value: initial
            conditions:
              - _hover
              - _disabled
          - prop: gap
            value: 2px
            conditions:
              - md
    variants:
      - recipe: btn
        slot: ~
        className: btn--size_lg
        entries:
          - prop: fontSize
            value: 16px
            conditions: []
          - prop: color
            value: gray
            conditions:
              - "&[data-disabled]"
          - prop: padding
            value: 2px
            conditions:
              - _hover
    atomic: []
    "#);
}

#[test]
fn recipe_variants_preserve_nested_selector_and_responsive_conditions() {
    let mut project = create_project(json!({
        "theme": {
            "breakpoints": {
                "md": "768px"
            },
            "recipes": {
                "text": {
                    "className": "text",
                    "variants": {
                        "variant": {
                            "sm": {
                                "&:first-child": {
                                    "marginRight": "4px",
                                    "&:hover": {
                                        "color": {
                                            "base": "red",
                                            "md": "gray"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { text } from '@panda/recipes';
            text({ variant: 'sm' });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r#"
    base: []
    variants:
      - recipe: text
        slot: ~
        className: text--variant_sm
        entries:
          - prop: marginRight
            value: 4px
            conditions:
              - "&:first-child"
          - prop: color
            value: red
            conditions:
              - "&:first-child"
              - "&:hover"
          - prop: color
            value: gray
            conditions:
              - "&:first-child"
              - "&:hover"
              - md
    atomic: []
    "#);
}

#[test]
fn recipe_variant_runtime_ternaries_encode_all_literal_branches() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "jsx": ["Action"],
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { button } from '@panda/recipes';
            import { Action } from './components';
            const isSmall = props.small;
            button({ size: isSmall ? 'sm' : 'md' });
            const el = <Action size={isSmall ? 'sm' : 'md'} />;
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: button
        slot: ~
        className: button--size_md
        entries:
          - prop: fontSize
            value: 16px
            conditions: []
      - recipe: button
        slot: ~
        className: button--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
    atomic: []
    ");
}

#[test]
fn recipe_compound_variants_emit_only_when_selected() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "badge": {
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        },
                        "raised": {
                            "true": { "boxShadow": "md" },
                            "false": { "boxShadow": "none" }
                        }
                    },
                    "compoundVariants": [
                        {
                            "size": "sm",
                            "raised": true,
                            "css": { "color": "ButtonHighlight" }
                        },
                        {
                            "size": "md",
                            "raised": true,
                            "css": { "color": "tomato" }
                        }
                    ]
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { badge } from '@panda/recipes';
            badge({ size: 'sm', raised: true });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: badge
        slot: ~
        className: badge--raised_true
        entries:
          - prop: boxShadow
            value: md
            conditions: []
      - recipe: badge
        slot: ~
        className: badge--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
    atomic:
      - prop: color
        value: ButtonHighlight
        conditions: []
    ");
}

#[test]
fn recipe_compound_variants_match_any_selected_value() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "badge": {
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" },
                            "lg": { "fontSize": "20px" }
                        }
                    },
                    "compoundVariants": [
                        {
                            "size": ["sm", "md"],
                            "css": { "color": "tomato" }
                        }
                    ]
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { badge } from '@panda/recipes';
            badge({ size: 'md' });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: badge
        slot: ~
        className: badge--size_md
        entries:
          - prop: fontSize
            value: 16px
            conditions: []
    atomic:
      - prop: color
        value: tomato
        conditions: []
    ");
}

#[test]
fn recipe_compound_variants_inherit_selected_conditions() {
    let mut project = create_project(json!({
        "theme": {
            "breakpoints": {
                "md": "768px"
            },
            "recipes": {
                "badge": {
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        },
                        "raised": {
                            "true": { "boxShadow": "md" }
                        }
                    },
                    "compoundVariants": [
                        {
                            "size": "md",
                            "raised": true,
                            "css": { "color": "tomato" }
                        }
                    ]
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { badge } from '@panda/recipes';
            badge({ size: { base: 'sm', md: 'md' }, raised: true });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: badge
        slot: ~
        className: badge--raised_true
        entries:
          - prop: boxShadow
            value: md
            conditions: []
      - recipe: badge
        slot: ~
        className: badge--size_md
        entries:
          - prop: fontSize
            value: 16px
            conditions:
              - md
      - recipe: badge
        slot: ~
        className: badge--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
    atomic:
      - prop: color
        value: tomato
        conditions:
          - md
    ");
}

#[test]
fn recipe_components_support_conditional_variants_and_style_props() {
    let mut project = create_project(json!({
        "theme": {
            "breakpoints": {
                "md": "768px"
            },
            "recipes": {
                "button": {
                    "jsx": ["Action"],
                    "className": "btn",
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        },
                        "raised": {
                            "true": { "boxShadow": "md" }
                        }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Action } from './components';
            const el = <Action size={{ base: 'sm', md: 'md' }} raised color='red' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: button
        slot: ~
        className: btn--raised_true
        entries:
          - prop: boxShadow
            value: md
            conditions: []
      - recipe: button
        slot: ~
        className: btn--size_md
        entries:
          - prop: fontSize
            value: 16px
            conditions:
              - md
      - recipe: button
        slot: ~
        className: btn--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
    atomic: []
    ");
}

#[test]
fn recipe_components_can_drive_multiple_config_recipes() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "toneRecipe": {
                    "jsx": ["MultiButton"],
                    "variants": {
                        "tone": {
                            "red": { "color": "red" }
                        }
                    }
                },
                "sizeRecipe": {
                    "jsx": ["MultiButton"],
                    "variants": {
                        "size": {
                            "md": { "fontSize": "16px" }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { MultiButton } from './components';
            const el = <MultiButton tone='red' size='md' margin='4px' />;
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: margin
      value: 4px
      conditions: []
    ");
    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: sizeRecipe
        slot: ~
        className: sizeRecipe--size_md
        entries:
          - prop: fontSize
            value: 16px
            conditions: []
      - recipe: toneRecipe
        slot: ~
        className: toneRecipe--tone_red
        entries:
          - prop: color
            value: red
            conditions: []
    atomic: []
    ");
}

#[test]
fn recipe_jsx_regex_names_match_components() {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "jsx": [
                        { "kind": "regex", "source": "WithRegex$", "flags": "" }
                    ],
                    "variants": {
                        "size": {
                            "md": { "fontSize": "16px" }
                        }
                    }
                },
                "complexButton": {
                    "jsx": [
                        "ComplexButton",
                        { "kind": "regex", "source": "^Complex.+Button$", "flags": "" }
                    ],
                    "variants": {
                        "color": {
                            "blue": { "color": "blue" }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { AnotherButtonWithRegex, ComplexDesignSystemButton, PlainButton } from './components';
            const el = (
              <>
                <AnotherButtonWithRegex size='md' />
                <ComplexDesignSystemButton color='blue' />
                <PlainButton size='md' />
              </>
            );
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: button
        slot: ~
        className: button--size_md
        entries:
          - prop: fontSize
            value: 16px
            conditions: []
      - recipe: complexButton
        slot: ~
        className: complexButton--color_blue
        entries:
          - prop: color
            value: blue
            conditions: []
    atomic: []
    ");
}

#[test]
fn slot_recipe_function_calls_support_conditional_variants() {
    let mut project = create_project(json!({
        "theme": {
            "breakpoints": {
                "md": "768px"
            },
            "slotRecipes": {
                "tabs": {
                    "slots": ["root", "trigger"],
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "gap": "4px" },
                                "trigger": { "padding": "2px" }
                            },
                            "md": {
                                "root": { "gap": "8px" },
                                "trigger": { "padding": "4px" }
                            }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import * as recipes from '@panda/recipes';
            recipes.tabs({ size: { base: 'sm', md: 'md' } });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base: []
    variants:
      - recipe: tabs
        slot: root
        className: tabs__root--size_md
        entries:
          - prop: gap
            value: 8px
            conditions:
              - md
      - recipe: tabs
        slot: root
        className: tabs__root--size_sm
        entries:
          - prop: gap
            value: 4px
            conditions: []
      - recipe: tabs
        slot: trigger
        className: tabs__trigger--size_md
        entries:
          - prop: padding
            value: 4px
            conditions:
              - md
      - recipe: tabs
        slot: trigger
        className: tabs__trigger--size_sm
        entries:
          - prop: padding
            value: 2px
            conditions: []
    atomic: []
    ");
}

#[test]
fn slot_recipe_base_and_variants_preserve_nested_conditions() {
    let mut project = create_project(json!({
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "768px"
            },
            "slotRecipes": {
                "tabs": {
                    "slots": ["root"],
                    "base": {
                        "root": {
                            "color": "red",
                            "_hover": { "padding": "4px" },
                            "md": { "gap": "2px" }
                        }
                    },
                    "variants": {
                        "size": {
                            "lg": {
                                "root": {
                                    "fontSize": "16px",
                                    "_hover": { "padding": "2px" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import * as recipes from '@panda/recipes';
            recipes.tabs({ size: 'lg' });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r"
    base:
      - recipe: tabs
        slot: root
        className: tabs__root
        entries:
          - prop: color
            value: red
            conditions: []
          - prop: padding
            value: 4px
            conditions:
              - _hover
          - prop: gap
            value: 2px
            conditions:
              - md
    variants:
      - recipe: tabs
        slot: root
        className: tabs__root--size_lg
        entries:
          - prop: fontSize
            value: 16px
            conditions: []
          - prop: padding
            value: 2px
            conditions:
              - _hover
    atomic: []
    ");
}

#[test]
fn slot_recipe_compound_variants_emit_only_when_selected() {
    let mut project = create_project(json!({
        "theme": {
            "slotRecipes": {
                "tabs": {
                    "slots": ["root", "trigger"],
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "gap": "4px" }
                            },
                            "md": {
                                "root": { "gap": "8px" }
                            }
                        },
                        "active": {
                            "true": {
                                "trigger": { "fontWeight": "600" }
                            }
                        }
                    },
                    "compoundVariants": [
                        {
                            "size": "sm",
                            "active": true,
                            "css": {
                                "trigger": { "color": "blue" }
                            }
                        },
                        {
                            "size": "md",
                            "active": true,
                            "css": {
                                "trigger": { "color": "red" }
                            }
                        }
                    ]
                }
            }
        }
    }));

    project.parse_file(
        "fixture.ts",
        indoc! {r"
            import { tabs } from '@panda/recipes';
            tabs({ size: 'sm', active: true });
        "},
    );

    assert_yaml_snapshot!(project.encoded_recipes().snapshot(), @r###"
    base: []
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
        className: tabs__trigger--active_true
        entries:
          - prop: fontWeight
            value: "600"
            conditions: []
    atomic:
      - prop: color
        value: blue
        conditions: []
    "###);
}
