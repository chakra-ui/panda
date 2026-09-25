use pandacss_config::UserConfig;
use serde_json::{Value, json};

pub fn create_config(overrides: Value) -> UserConfig {
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
