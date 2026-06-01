#![allow(
    clippy::disallowed_macros,
    clippy::print_stdout,
    reason = "benchmark binary intentionally prints generation output"
)]

//! Emit the Rust-codegen styled-system type artifacts for each fixture config so
//! the `generated-types-perf.ts` runner can `tsc --extendedDiagnostics` them and
//! compare against the legacy v1 generator.
//!
//! Reads `fixtures/generated-types/configs/*.json`, writes each fixture's output
//! to `fixtures/generated-types/out/<name>/rust/styled-system/`.

use std::{fs, path::PathBuf};

use pandacss_codegen::{GenerateOptions, ModuleSpecifierPolicy};
use pandacss_config::{CodegenFormat, UserConfig};
use pandacss_project::{Project, System};
use serde_json::{Value, json};

fn fixtures_dir() -> PathBuf {
    PathBuf::from(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../fixtures/generated-types"
    ))
}

/// Base scaffolding every fixture needs (outdir + import map), merged under the
/// fixture's own config body.
fn base_config() -> Value {
    json!({
        "outdir": "styled-system",
        "importMap": {
            "css": ["styled-system/css"],
            "recipe": ["styled-system/recipes"],
            "pattern": ["styled-system/patterns"],
            "jsx": ["styled-system/jsx"],
            "tokens": ["styled-system/tokens"]
        }
    })
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

fn generate_fixture(name: &str, fixture: Value) {
    let mut config = base_config();
    merge_json(&mut config, fixture);
    let user_config: UserConfig = serde_json::from_value(config).expect("valid fixture config");

    let system = System::new(user_config.clone()).expect("valid project config");
    let project = Project::new(system);

    // Emit declarations (`.d.ts` + `.js`), matching how Panda actually ships the
    // styled-system and how the legacy side is generated. This is what makes the
    // comparison real-world: `skipLibCheck` skips the generated `.d.ts` bodies, so
    // the cost a user pays is on-demand instantiation from `usage`, not lib checking.
    let artifacts = project.generate_artifacts(
        &user_config,
        GenerateOptions {
            format: CodegenFormat::Js,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );

    let out_dir = fixtures_dir()
        .join("out")
        .join(name)
        .join("rust")
        .join("styled-system");
    if out_dir.exists() {
        fs::remove_dir_all(&out_dir).expect("clear previous output");
    }

    let mut file_count = 0;
    for artifact in &artifacts {
        for file in &artifact.files {
            let path = out_dir.join(&file.path);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).expect("create output dir");
            }
            fs::write(&path, &file.code).expect("write artifact file");
            file_count += 1;
        }
    }

    println!("[rust] {name}: {file_count} files → {}", out_dir.display());
}

fn main() {
    let configs_dir = fixtures_dir().join("configs");
    let mut entries: Vec<_> = fs::read_dir(&configs_dir)
        .expect("read configs dir")
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "json"))
        .collect();
    entries.sort();

    for path in entries {
        let name = path
            .file_stem()
            .expect("file stem")
            .to_string_lossy()
            .into_owned();
        let fixture: Value = serde_json::from_str(&fs::read_to_string(&path).expect("read config"))
            .expect("parse config");
        generate_fixture(&name, fixture);
    }
}
