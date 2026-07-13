use pandacss_config::UserConfig;
use pandacss_extractor::CrossFileResolver;
use pandacss_fs::MemoryFileSystem;
use pandacss_project::{Project, System};
use pandacss_project::{TransformOptions, TransformTargets, transform_source};
use serde_json::{Value, json};
use std::path::PathBuf;

pub fn create_config(overrides: Value) -> UserConfig {
    let mut config = json!({
        "outdir": "styled-system",
        "importMap": {
            "css": ["@panda/css"],
            "recipe": ["@panda/recipes"],
            "pattern": ["@panda/patterns"],
            "jsx": ["@panda/jsx"],
            "tokens": ["@panda/tokens"]
        },
        "conditions": {
            "hover": "&:hover",
            "dark": ".dark &"
        },
        "theme": {
            "breakpoints": {
                "sm": "640px",
                "md": "768px",
                "lg": "1024px",
                "xl": "1280px",
                "2xl": "1536px"
            }
        },
        "utilities": {
            "color": {},
            "background": {},
            "backgroundColor": {},
            "borderColor": {},
            "fontSize": {
                "className": "fs"
            },
            "margin": {},
            "marginTop": {},
            "padding": {},
            "opacity": {},
            "outline": {},
            "zIndex": {
                "className": "z"
            },
            "display": {
                "className": "d"
            }
        }
    });
    merge_json(&mut config, overrides);
    serde_json::from_value(config).expect("valid serialized config")
}

fn merge_json(target: &mut Value, source: Value) {
    match (target, source) {
        (Value::Object(target), Value::Object(source)) => {
            for (key, value) in source {
                match target.get_mut(&key) {
                    Some(existing) => merge_json(existing, value),
                    None => {
                        target.insert(key, value);
                    }
                }
            }
        }
        (target, source) => *target = source,
    }
}

pub fn project() -> Project {
    Project::new(System::new(create_config(json!({}))).expect("config"))
}

pub fn transform(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_source(&project(), path, source, &TransformOptions::default())
}

pub fn transform_with_project(
    project: &Project,
    path: &str,
    source: &str,
) -> pandacss_project::TransformOutput {
    transform_source(project, path, source, &TransformOptions::default())
}

pub fn transform_with_options(
    path: &str,
    source: &str,
    options: TransformOptions,
) -> pandacss_project::TransformOutput {
    transform_source(&project(), path, source, &options)
}

pub fn patterns_only_options() -> TransformOptions {
    TransformOptions {
        targets: TransformTargets {
            css: false,
            patterns: true,
            recipes: false,
            tokens: false,
            jsx: false,
        },
        ..TransformOptions::default()
    }
}

pub fn recipes_only_options() -> TransformOptions {
    TransformOptions {
        targets: TransformTargets {
            css: false,
            patterns: false,
            recipes: true,
            tokens: false,
            jsx: false,
        },
        ..TransformOptions::default()
    }
}

pub fn project_with_recipes() -> Project {
    Project::new(
        System::new(create_config(json!({
            "theme": {
                "recipes": {
                    "button": {
                        "base": { "display": "inline-flex" },
                        "defaultVariants": {
                            "size": "md"
                        },
                        "variants": {
                            "size": {
                                "sm": { "fontSize": "12px" },
                                "md": { "fontSize": "16px" }
                            }
                        }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

/// `button` recipe with multiple variants, a boolean variant, and a compound
/// variant, in default (eager) compound mode.
pub fn project_with_rich_recipes() -> Project {
    Project::new(
        System::new(create_config(json!({
            "theme": {
                "recipes": {
                    "button": {
                        "className": "button",
                        "base": { "display": "inline-flex" },
                        "defaultVariants": { "size": "md", "variant": "solid" },
                        "variants": {
                            "size": {
                                "sm": { "fontSize": "12px" },
                                "md": { "fontSize": "16px" },
                                "lg": { "fontSize": "18px" }
                            },
                            "variant": {
                                "solid": { "color": "white" },
                                "outline": { "color": "blue" }
                            },
                            "block": {
                                "true": { "display": "flex" }
                            }
                        },
                        "compoundVariants": [
                            { "size": "sm", "variant": "outline", "css": { "padding": "2px" } }
                        ]
                    }
                }
            }
        })))
        .expect("config"),
    )
}

/// Project with a token dictionary for `token()` / `token.var()` transforms.
pub fn project_with_tokens() -> Project {
    Project::new(
        System::new(create_config(json!({
            "theme": {
                "tokens": {
                    "colors": {
                        "red": { "500": { "value": "#ef4444" } }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

/// Config slot recipe — call-form usage is left to the runtime.
pub fn project_with_config_slot_recipe() -> Project {
    Project::new(
        System::new(create_config(json!({
            "theme": {
                "slotRecipes": {
                    "tabs": {
                        "className": "tabs",
                        "slots": ["root", "trigger"],
                        "base": {
                            "root": { "display": "flex" },
                            "trigger": { "color": "blue" }
                        }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_pattern() -> Project {
    Project::new(
        System::new(create_config(json!({
            "utilities": {
                "padding": {},
                "margin": {},
                "gap": {},
                "color": {},
                "display": { "className": "d" }
            },
            "patterns": {
                "box": {
                    "properties": {
                        "padding": { "type": "property", "property": "padding" }
                    }
                },
                "grid": {
                    "properties": {
                        "gap": { "type": "property", "property": "gap" },
                        "columnGap": { "type": "property", "property": "columnGap" }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

pub fn transform_recipes(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_source(
        &project_with_recipes(),
        path,
        source,
        &recipes_only_options(),
    )
}

pub fn transform_patterns(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_source(
        &project_with_pattern(),
        path,
        source,
        &patterns_only_options(),
    )
}

/// In-memory sibling files + cross-file resolver wired into the project.
pub fn project_with_files(
    main_path: &str,
    main_source: &str,
    siblings: &[(&str, &str)],
) -> Project {
    let fs = MemoryFileSystem::new();
    for (name, contents) in siblings {
        fs.add_file(
            PathBuf::from(format!("/proj/{name}")),
            contents.as_bytes().to_vec(),
        );
    }
    let main = PathBuf::from(format!("/proj/{main_path}"));
    fs.add_file(main.clone(), main_source.as_bytes().to_vec());

    let mut project = Project::new(System::new(create_config(json!({}))).expect("config"));
    project = project.with_cross_file(CrossFileResolver::with_fs(fs));
    project
}

pub fn transform_cross_file(
    main_path: &str,
    main_source: &str,
    siblings: &[(&str, &str)],
) -> pandacss_project::TransformOutput {
    let project = project_with_files(main_path, main_source, siblings);
    transform_with_project(&project, &format!("/proj/{main_path}"), main_source)
}

pub fn template_literal_project() -> Project {
    Project::new(
        System::new(create_config(json!({
            "syntax": "template-literal",
            "jsxFramework": "react"
        })))
        .expect("config"),
    )
}

pub fn shorthands_project() -> Project {
    Project::new(
        System::new(create_config(json!({
            "shorthands": true,
            "utilities": {
                "color": {
                    "className": "c",
                    "shorthand": "c"
                },
                "backgroundColor": {
                    "className": "bg-c",
                    "shorthand": "bg"
                },
                "fontSize": {
                    "className": "fs",
                    "shorthand": "fs"
                },
                "padding": {
                    "className": "p",
                    "shorthand": "p"
                }
            }
        })))
        .expect("config"),
    )
}

pub fn transform_with_shorthands(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_with_project(&shorthands_project(), path, source)
}

pub fn project_with_jsx() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFramework": "react",
            "shorthands": true,
            "utilities": {
                "color": {},
                "padding": {},
                "backgroundColor": { "shorthand": "bg" },
                "margin": {}
            },
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &"
            },
            "theme": {
                "breakpoints": {
                    "sm": "640px",
                    "md": "768px"
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_jsx_solid() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFramework": "solid",
            "shorthands": true,
            "utilities": {
                "color": {},
                "padding": {},
                "backgroundColor": { "shorthand": "bg" },
                "margin": {}
            },
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &"
            },
            "theme": {
                "breakpoints": {
                    "sm": "640px",
                    "md": "768px"
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_jsx_qwik() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFramework": "qwik",
            "shorthands": true,
            "utilities": {
                "color": {},
                "padding": {},
                "backgroundColor": { "shorthand": "bg" },
                "margin": {}
            },
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &"
            },
            "theme": {
                "breakpoints": {
                    "sm": "640px",
                    "md": "768px"
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_jsx_recipes() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFramework": "react",
            // Design system ships `<Button>` from `@acme/ui`, mapped into the jsx
            // importMap so Panda owns it (recipe components aren't in `@panda/jsx`).
            "importMap": { "jsx": ["@panda/jsx", "@acme/ui"] },
            "utilities": {
                "color": {},
                "fontSize": { "className": "fs" }
            },
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &"
            },
            "theme": {
                "breakpoints": {
                    "md": "768px"
                },
                "recipes": {
                    "button": {
                        "className": "button",
                        "jsx": ["Button"],
                        "base": { "display": "inline-flex" },
                        "defaultVariants": { "size": "md" },
                        "variants": {
                            "size": {
                                "sm": { "fontSize": "12px" },
                                "md": { "fontSize": "16px" },
                                "lg": { "fontSize": "18px" }
                            },
                            "visual": {
                                "solid": { "color": "white" },
                                "outline": { "color": "blue" }
                            }
                        }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_jsx_slot_recipes() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFramework": "react",
            // `<Tabs>` ships from `@acme/ui`, mapped into the jsx importMap.
            "importMap": { "jsx": ["@panda/jsx", "@acme/ui"] },
            "utilities": {
                "color": {},
                "padding": {}
            },
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &"
            },
            "theme": {
                "recipes": {},
                "slotRecipes": {
                    "tabs": {
                        "className": "tabs",
                        "jsx": ["Tabs"],
                        "slots": ["root", "trigger"],
                        "base": {
                            "root": { "display": "flex" },
                            "trigger": { "color": "blue" }
                        },
                        "variants": {
                            "size": {
                                "sm": {
                                    "root": { "padding": "2px" },
                                    "trigger": { "padding": "1px" }
                                }
                            }
                        }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_jsx_extended() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFramework": "react",
            "shorthands": true,
            "utilities": {
                "color": {},
                "padding": {},
                "backgroundColor": { "shorthand": "bg" },
                "margin": {}
            },
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &",
                "peerHover": ".peer:hover ~ &",
                "groupHover": ".group:hover &"
            },
            "theme": {
                "breakpoints": {
                    "sm": "640px",
                    "md": "768px"
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_jsx_patterns() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFramework": "react",
            "utilities": {
                "gap": {},
                "padding": {},
                "color": {}
            },
            "conditions": {
                "hover": "&:hover",
                "dark": ".dark &"
            },
            "patterns": {
                "stack": {
                    "jsxName": "Stack",
                    "properties": {
                        "gap": {
                            "type": "property",
                            "property": "gap"
                        }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_panda_jsx() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFactory": "panda",
            "jsxFramework": "react",
            "utilities": {
                "color": {},
                "fontWeight": {},
                "fontSize": {}
            }
        })))
        .expect("config"),
    )
}

pub fn project_with_panda_jsx_patterns() -> Project {
    Project::new(
        System::new(create_config(json!({
            "jsxFactory": "panda",
            "jsxFramework": "react",
            "utilities": {
                "color": {},
                "fontWeight": {},
                "gap": {},
                "justifyContent": {}
            },
            "patterns": {
                "box": {
                    "jsxName": "Box",
                    "properties": {}
                },
                "hstack": {
                    "jsxName": "HStack",
                    "properties": {
                        "gap": {
                            "type": "property",
                            "property": "gap"
                        }
                    }
                },
                "wrap": {
                    "jsxName": "Wrap",
                    "properties": {
                        "gap": {
                            "type": "property",
                            "property": "gap"
                        },
                        "justifyContent": {
                            "type": "property",
                            "property": "justifyContent"
                        }
                    }
                }
            }
        })))
        .expect("config"),
    )
}

pub fn transform_jsx_with_project(
    project: &Project,
    path: &str,
    source: &str,
) -> pandacss_project::TransformOutput {
    transform_source(project, path, source, &jsx_only_options())
}

pub fn transform_jsx_recipes(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_jsx_with_project(&project_with_jsx_recipes(), path, source)
}

pub fn transform_jsx_slot_recipes(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_jsx_with_project(&project_with_jsx_slot_recipes(), path, source)
}

pub fn transform_jsx_extended(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_jsx_with_project(&project_with_jsx_extended(), path, source)
}

pub fn transform_jsx_patterns(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_jsx_with_project(&project_with_jsx_patterns(), path, source)
}

pub fn transform_panda_jsx(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_jsx_with_project(&project_with_panda_jsx(), path, source)
}

pub fn transform_panda_jsx_patterns(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_jsx_with_project(&project_with_panda_jsx_patterns(), path, source)
}

pub fn jsx_only_options() -> TransformOptions {
    TransformOptions {
        targets: TransformTargets {
            css: false,
            patterns: false,
            recipes: false,
            tokens: false,
            jsx: true,
        },
        ..TransformOptions::default()
    }
}

pub fn jsx_options_with_helper(helper_cx: pandacss_project::HelperCxMode) -> TransformOptions {
    TransformOptions {
        helper_cx,
        targets: TransformTargets {
            css: false,
            patterns: false,
            recipes: false,
            tokens: false,
            jsx: true,
        },
        ..TransformOptions::default()
    }
}

pub fn transform_jsx_with_helper(
    path: &str,
    source: &str,
    helper_cx: pandacss_project::HelperCxMode,
) -> pandacss_project::TransformOutput {
    transform_source(
        &project_with_jsx(),
        path,
        source,
        &jsx_options_with_helper(helper_cx),
    )
}

pub fn transform_jsx(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_source(&project_with_jsx(), path, source, &jsx_only_options())
}

pub fn transform_jsx_solid(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_source(&project_with_jsx_solid(), path, source, &jsx_only_options())
}

pub fn transform_jsx_qwik(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_source(&project_with_jsx_qwik(), path, source, &jsx_only_options())
}

pub fn transform_template_literal(path: &str, source: &str) -> pandacss_project::TransformOutput {
    transform_with_project(&template_literal_project(), path, source)
}
