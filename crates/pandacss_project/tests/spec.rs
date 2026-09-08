//! `Project::spec` — one versioned, resolved snapshot for tooling and artifact writers.

use insta::assert_yaml_snapshot;
use pandacss_config::SPEC_SCHEMA_VERSION;
use pandacss_project::{Project, System};
use serde_json::json;

use crate::common::create_config;

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "single end-to-end spec wire contract fixture"
)]
fn spec_exposes_resolved_design_system_definitions() {
    let config = create_config(json!({
        "conditions": {
            "hover": "&:hover"
        },
        "patterns": {
            "stack": {
                "description": "Arrange children vertically",
                "jsxName": "VStack",
                "jsx": [{
                    "kind": "regex",
                    "source": "^LegacyStack$",
                    "flags": ""
                }],
                "jsxElement": "section",
                "properties": {
                    "gap": {
                        "type": "token",
                        "value": "spacing",
                        "description": "Space between children"
                    }
                },
                "defaultValues": {
                    "kind": "js-callback",
                    "id": "patterns.stack.defaultValues"
                },
                "transform": {
                    "kind": "js-callback",
                    "id": "patterns.stack.transform"
                },
                "docs": {
                    "category": "layout"
                }
            }
        },
        "theme": {
            "breakpoints": {
                "sm": "640px"
            },
            "tokens": {
                "colors": {
                    "brand": {
                        "value": "#0055ff",
                        "description": "Brand blue"
                    },
                    "alias": {
                        "value": "{colors.brand}"
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "accent": {
                        "value": "#ff00aa"
                    },
                    "fg": {
                        "value": {
                            "base": "{colors.brand}",
                            "_dark": "#ffffff"
                        },
                        "deprecated": "Use colors.text"
                    }
                }
            },
            "recipes": {
                "button": {
                    "description": "A button",
                    "className": "btn",
                    "base": {
                        "display": "inline-flex"
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "height": "8"
                            }
                        }
                    },
                    "defaultVariants": {
                        "size": "sm"
                    },
                    "compoundVariants": [{
                        "size": "sm",
                        "css": {
                            "fontWeight": "bold"
                        }
                    }],
                    "staticCss": [{ "size": ["sm"] }],
                    "docs": {
                        "status": "stable"
                    }
                }
            },
            "slotRecipes": {
                "card": {
                    "slots": ["root", "title"],
                    "base": {
                        "root": {
                            "display": "grid"
                        }
                    }
                }
            },
            "keyframes": {
                "fade-in": {
                    "from": {
                        "opacity": 0
                    },
                    "to": {
                        "opacity": 1
                    }
                }
            },
            "textStyles": {
                "heading": {
                    "value": {
                        "fontSize": "2xl"
                    }
                }
            },
            "layerStyles": {
                "raised": {
                    "value": {
                        "boxShadow": "md"
                    }
                }
            },
            "animationStyles": {
                "entrance": {
                    "value": {
                        "animationName": "fade-in"
                    }
                }
            },
            "viewTransitions": {
                "slide": {
                    "old": { "opacity": 0 },
                    "new": { "opacity": 1 }
                }
            },
            "positionTry": {
                "below": {
                    "top": "anchor(bottom)"
                }
            }
        },
        "themes": {
            "dark": {
                "tokens": {
                    "colors": {
                        "brand": {
                            "value": "#88aaff"
                        }
                    }
                }
            }
        }
    }));
    let project = Project::new(System::new(config.clone()).expect("valid project config"));

    let spec = project.spec(&config, |_| vec!["display".to_owned()]);
    let value = serde_json::to_value(spec).expect("serialize spec");

    assert_eq!(value["schemaVersion"], SPEC_SCHEMA_VERSION);
    assert_yaml_snapshot!(json!({
        "conditions": value["catalog"]["conditions"],
        "tokens": {
            "brand": value["catalog"]["tokens"]["colors.brand"],
            "alias": value["catalog"]["tokens"]["colors.alias"],
            "accent": value["catalog"]["tokens"]["colors.accent"],
            "fg": value["catalog"]["tokens"]["colors.fg"]
        },
        "recipes": value["catalog"]["recipes"],
        "slotRecipes": value["catalog"]["slotRecipes"],
        "patterns": value["catalog"]["patterns"],
        "keyframes": value["catalog"]["keyframes"],
        "textStyles": value["catalog"]["textStyles"],
        "layerStyles": value["catalog"]["layerStyles"],
        "animationStyles": value["catalog"]["animationStyles"],
        "viewTransitions": value["catalog"]["viewTransitions"],
        "positionTry": value["catalog"]["positionTry"],
        "themes": value["catalog"]["themes"],
        "propertyOrder": value["propertyOrder"]
    }), @r##"
    conditions:
      _hover: "&:hover"
      _themeDark: "&:where([data-panda-theme=dark], [data-panda-theme=dark] *)"
      sm: "@media (width >= 40rem)"
      smDown: "@media (width < 40rem)"
      smOnly: "@media (width >= 40rem)"
    tokens:
      brand:
        path: colors.brand
        category: colors
        cssVar: var(--colors-brand)
        semantic: false
        values:
          - value: "#0055ff"
            description: Brand blue
          - value: "#88aaff"
            condition: _themeDark
      alias:
        path: colors.alias
        category: colors
        cssVar: var(--colors-alias)
        semantic: false
        values:
          - value: var(--colors-brand)
            originalValue: "{colors.brand}"
      accent:
        path: colors.accent
        category: colors
        cssVar: var(--colors-accent)
        semantic: true
        values:
          - value: "#ff00aa"
      fg:
        path: colors.fg
        category: colors
        cssVar: var(--colors-fg)
        semantic: true
        values:
          - value: var(--colors-brand)
            originalValue: "{colors.brand}"
            deprecated: Use colors.text
          - value: "#ffffff"
            condition: _dark
            deprecated: Use colors.text
    recipes:
      button:
        name: button
        className: btn
        description: A button
        jsx:
          - Button
        base:
          display: inline-flex
        variants:
          size:
            sm:
              height: "8"
        defaultVariants:
          size: sm
        compoundVariants:
          - css:
              fontWeight: bold
            size: sm
        staticCss:
          - size:
              - sm
        metadata:
          docs:
            status: stable
    slotRecipes:
      card:
        name: card
        className: card
        jsx:
          - Card
          - Card.Root
          - CardRoot
          - Card.Title
          - CardTitle
        slots:
          - root
          - title
        base:
          root:
            display: grid
        variants: {}
        defaultVariants: {}
        compoundVariants: []
    patterns:
      stack:
        name: stack
        jsxName: VStack
        jsxElement: section
        jsx:
          - VStack
          - kind: regex
            source: ^LegacyStack$
            flags: ""
        description: Arrange children vertically
        properties:
          gap:
            type: token
            value: spacing
            description: Space between children
        hasDynamicDefaultValues: true
        hasTransform: true
        strict: false
        blocklist: []
        metadata:
          docs:
            category: layout
    keyframes:
      fade-in:
        from:
          opacity: 0
        to:
          opacity: 1
    textStyles:
      heading:
        value:
          fontSize: 2xl
    layerStyles:
      raised:
        value:
          boxShadow: md
    animationStyles:
      entrance:
        value:
          animationName: fade-in
    viewTransitions:
      slide:
        old:
          opacity: 0
        new:
          opacity: 1
    positionTry:
      below:
        top: anchor(bottom)
    themes:
      dark:
        name: dark
        condition: _themeDark
        rootSelector: "[data-panda-theme=dark]"
    propertyOrder:
      - display
    "##);
}

#[test]
fn spec_preserves_nested_conditions_and_container_queries() {
    let config = create_config(json!({
        "conditions": {
            "hoverFine": {
                "@media (hover: hover)": {
                    "&:hover": "@slot"
                }
            }
        },
        "theme": {
            "containers": {
                "sm": "24rem"
            },
            "containerNames": ["sidebar"]
        }
    }));
    let project = Project::new(System::new(config.clone()).expect("valid project config"));

    let value =
        serde_json::to_value(project.spec(&config, |_| Vec::new())).expect("serialize spec");

    assert_eq!(
        value["catalog"]["conditions"]["_hoverFine"],
        json!({
            "@media (hover: hover)": {
                "&:hover": "@slot"
            }
        })
    );
    assert_eq!(
        value["catalog"]["conditions"]["@sidebar/sm"],
        "@container sidebar (inline-size >= 24rem)"
    );
}

#[test]
fn spec_is_deterministic_for_equivalent_config_order() {
    let first = create_config(json!({
        "conditions": { "focus": "&:focus", "hover": "&:hover" },
        "theme": {
            "tokens": {
                "colors": {
                    "b": { "value": "blue" },
                    "a": { "value": "red" }
                }
            }
        }
    }));
    let second = create_config(json!({
        "conditions": { "hover": "&:hover", "focus": "&:focus" },
        "theme": {
            "tokens": {
                "colors": {
                    "a": { "value": "red" },
                    "b": { "value": "blue" }
                }
            }
        }
    }));

    let serialize = |config: pandacss_config::UserConfig| {
        let project = Project::new(System::new(config.clone()).expect("valid project config"));
        serde_json::to_string(&project.spec(&config, |_| Vec::new())).expect("serialize spec")
    };

    assert_eq!(serialize(first), serialize(second));
}
