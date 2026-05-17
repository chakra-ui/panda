#![allow(dead_code)]

use pandacss_config::Config;
use pandacss_encoder::Atom;
use pandacss_project::Project;
use serde_json::{Value, json};

pub fn create_config(overrides: Value) -> Config {
    let mut config = json!({
        "outdir": "styled-system",
        "importMap": {
            "css": ["@panda/css"],
            "recipe": ["@panda/recipes"],
            "pattern": ["@panda/patterns"],
            "jsx": ["@panda/jsx"],
            "tokens": ["@panda/tokens"]
        }
    });
    merge_json(&mut config, overrides);
    serde_json::from_value(config).expect("valid serialized config")
}

pub fn create_project(overrides: Value) -> Project {
    Project::from_config(create_config(overrides)).expect("valid project config")
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

pub fn sorted_atoms(project: &Project) -> Vec<&Atom> {
    let mut out: Vec<&Atom> = project.atoms().iter().collect();
    out.sort_by(|a, b| {
        a.prop()
            .cmp(b.prop())
            .then_with(|| a.conditions().cmp(b.conditions()))
            .then_with(|| format!("{:?}", a.value()).cmp(&format!("{:?}", b.value())))
    });
    out
}
