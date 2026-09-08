//! End-to-end cross-file: a factory const defined in one file, imported and
//! used in another. The block is collected from the defining file; the folded
//! name reaches the consumer's atoms so tree-shaking keeps the block.

use std::path::PathBuf;

use crate::common::{create_config, create_project};
use indoc::indoc;
use pandacss_encoder::AtomValue;
use pandacss_extractor::CrossFileResolver;
use pandacss_fs::MemoryFileSystem;
use pandacss_project::Project;
use serde_json::json;

fn project(files: &[(&str, &str)]) -> Project {
    let fs = MemoryFileSystem::new();
    for (name, contents) in files {
        fs.add_file(
            PathBuf::from(format!("/proj/{name}")),
            contents.as_bytes().to_vec(),
        );
    }
    let mut project =
        create_project(json!({})).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    for (name, contents) in files {
        project.parse_file(&format!("/proj/{name}"), contents);
    }
    project
}

fn atom_values(project: &mut Project, prop: &str) -> Vec<String> {
    let config = create_config(json!({}));
    project
        .stylesheet_snapshots(&config)
        .atoms
        .iter()
        .filter(|atom| atom.prop() == prop)
        .map(|atom| match atom.value() {
            AtomValue::String(s) | AtomValue::Number(s) => s.to_string(),
            AtomValue::Token { value, .. } => value.to_string(),
            other => format!("{other:?}"),
        })
        .collect()
}

fn keyframe_names(project: &mut Project) -> Vec<String> {
    let config = create_config(json!({}));
    project
        .stylesheet_snapshots(&config)
        .inline_keyframes
        .iter()
        .map(|kf| kf.name.clone())
        .collect()
}

fn position_try_idents(project: &mut Project) -> Vec<String> {
    let config = create_config(json!({}));
    project
        .stylesheet_snapshots(&config)
        .position_try
        .iter()
        .map(|style| style.ident.clone())
        .collect()
}

#[test]
fn keyframes_defined_in_one_file_and_used_in_another() {
    let mut project = project(&[
        (
            "anim.ts",
            indoc! {r"
                import { keyframes } from '@panda/css';
                export const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
            "},
        ),
        (
            "App.tsx",
            indoc! {r"
                import { css } from '@panda/css';
                import { fade } from './anim';
                export const cls = css({ animationName: fade });
            "},
        ),
    ]);

    let expected = pandacss_shared::keyframes_name(
        &json!({ "from": { "opacity": 0 }, "to": { "opacity": 1 } }),
        "",
    );
    // Block collected from the defining file.
    assert!(keyframe_names(&mut project).contains(&expected));
    // Folded name reached the consumer's animation-name atom.
    assert!(atom_values(&mut project, "animationName").contains(&expected));
}

#[test]
fn position_try_defined_in_one_file_and_used_in_another() {
    let mut project = project(&[
        (
            "anchors.ts",
            indoc! {r"
                import { positionTry } from '@panda/css';
                export const flip = positionTry({ top: 'anchor(bottom)' });
            "},
        ),
        (
            "App.tsx",
            indoc! {r"
                import { css } from '@panda/css';
                import { flip } from './anchors';
                export const cls = css({ positionTryFallbacks: flip });
            "},
        ),
    ]);

    let expected = pandacss_shared::position_try_ident(&json!({ "top": "anchor(bottom)" }), "");
    assert!(position_try_idents(&mut project).contains(&expected));
    assert!(atom_values(&mut project, "positionTryFallbacks").contains(&expected));
}

#[test]
fn cross_file_keyframe_survives_pruning_because_the_consumer_references_it() {
    let fs = MemoryFileSystem::new();
    let files = [
        (
            "anim.ts",
            indoc! {r"
                import { keyframes } from '@panda/css';
                export const fade = keyframes({ from: { opacity: 0 } });
            "},
        ),
        (
            "App.tsx",
            indoc! {r"
                import { css } from '@panda/css';
                import { fade } from './anim';
                export const cls = css({ animationName: fade });
            "},
        ),
    ];
    for (name, contents) in &files {
        fs.add_file(
            PathBuf::from(format!("/proj/{name}")),
            contents.as_bytes().to_vec(),
        );
    }
    let mut project = create_project(json!({ "optimize": { "removeUnusedKeyframes": true } }))
        .with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    for (name, contents) in &files {
        project.parse_file(&format!("/proj/{name}"), contents);
    }

    let config = create_config(json!({ "optimize": { "removeUnusedKeyframes": true } }));
    let expected = pandacss_shared::keyframes_name(&json!({ "from": { "opacity": 0 } }), "");
    let snaps = project.stylesheet_snapshots(&config);
    assert!(snaps.inline_keyframes.iter().any(|kf| kf.name == expected));
    assert!(snaps.atoms.iter().any(|a| a.prop() == "animationName"
        && matches!(a.value(), AtomValue::String(s) if **s == *expected)));
}
