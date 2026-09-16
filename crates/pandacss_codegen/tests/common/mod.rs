use pandacss_codegen::{Artifact, ArtifactId, DependencySet};
use pandacss_config::UserConfig;

pub fn user_config(value: serde_json::Value) -> UserConfig {
    serde_json::from_value(value).expect("config should deserialize")
}

pub fn artifact(artifacts: &[Artifact], id: ArtifactId) -> &Artifact {
    artifacts
        .iter()
        .find(|artifact| artifact.id == id)
        .expect("artifact should exist")
}

#[allow(dead_code)]
pub fn paths(artifact: &Artifact) -> Vec<&str> {
    artifact
        .files
        .iter()
        .map(|file| file.path.as_str())
        .collect()
}

#[allow(dead_code)]
pub fn file<'a>(artifact: &'a Artifact, path: &str) -> &'a str {
    artifact
        .files
        .iter()
        .find(|file| file.path == path)
        .map(|file| file.code.as_str())
        .expect("file should exist")
}

#[allow(dead_code)]
pub fn file_dependencies(artifact: &Artifact, path: &str) -> DependencySet {
    artifact
        .files
        .iter()
        .find(|file| file.path == path)
        .map(|file| file.dependencies)
        .expect("file should exist")
}
