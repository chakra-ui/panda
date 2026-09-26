//! Watch-session cascade: changing a folded module marks its importers affected.

use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

use crate::common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use oxc_resolver::{FileMetadata, FileSystem as OxcFileSystem, ResolveError};
use pandacss_encoder::AtomValue;
use pandacss_extractor::CrossFileResolver;
use pandacss_fs::{FileSystem, MemoryFileSystem};
use pandacss_project::{ParseTransforms, Project};
use serde_json::json;

#[derive(Clone)]
struct CountingFileSystem {
    inner: MemoryFileSystem,
    probes: Arc<AtomicUsize>,
}

impl CountingFileSystem {
    fn new(inner: MemoryFileSystem) -> Self {
        Self {
            inner,
            probes: Arc::default(),
        }
    }

    fn reset(&self) {
        self.probes.store(0, Ordering::Relaxed);
    }

    fn probes(&self) -> usize {
        self.probes.load(Ordering::Relaxed)
    }

    fn record_probe(&self) {
        self.probes.fetch_add(1, Ordering::Relaxed);
    }
}

impl FileSystem for CountingFileSystem {
    fn write(&self, path: &Path, content: &[u8]) -> io::Result<()> {
        self.inner.write(path, content)
    }

    fn create_dir_all(&self, path: &Path) -> io::Result<()> {
        self.inner.create_dir_all(path)
    }

    fn remove_file(&self, path: &Path) -> io::Result<()> {
        self.inner.remove_file(path)
    }

    fn remove_dir_all(&self, path: &Path) -> io::Result<()> {
        self.inner.remove_dir_all(path)
    }

    fn exists(&self, path: &Path) -> bool {
        self.inner.exists(path)
    }

    fn read_dir(&self, path: &Path) -> io::Result<Vec<PathBuf>> {
        self.inner.read_dir(path)
    }
}

impl OxcFileSystem for CountingFileSystem {
    fn new() -> Self {
        Self::new(MemoryFileSystem::new())
    }

    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        self.record_probe();
        OxcFileSystem::read(&self.inner, path)
    }

    fn read_to_string(&self, path: &Path) -> io::Result<String> {
        self.record_probe();
        OxcFileSystem::read_to_string(&self.inner, path)
    }

    fn metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.record_probe();
        self.inner.metadata(path)
    }

    fn symlink_metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.record_probe();
        self.inner.symlink_metadata(path)
    }

    fn read_link(&self, path: &Path) -> Result<PathBuf, ResolveError> {
        self.record_probe();
        self.inner.read_link(path)
    }

    fn canonicalize(&self, path: &Path) -> io::Result<PathBuf> {
        self.record_probe();
        self.inner.canonicalize(path)
    }
}

fn watch_project(files: &[(&str, &str)]) -> (MemoryFileSystem, Project) {
    let fs = MemoryFileSystem::new();
    for (name, contents) in files {
        write(&fs, name, contents);
    }
    let project = create_project(json!({})).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    (fs, project)
}

fn read(fs: &MemoryFileSystem, path: &str) -> Option<String> {
    fs.snapshot()
        .into_iter()
        .find(|(candidate, _)| candidate == Path::new(path))
        .map(|(_, bytes)| String::from_utf8(bytes).expect("utf8 fixture"))
}

fn write(fs: &MemoryFileSystem, name: &str, contents: &str) {
    fs.add_file(
        PathBuf::from(format!("/proj/{name}")),
        contents.as_bytes().to_vec(),
    );
}

/// Host-style drain. Uses the replacing parse so snapshots show only the current fold.
fn refresh_affected(project: &mut Project, fs: &MemoryFileSystem) -> Vec<String> {
    let mut refreshed = Vec::new();
    loop {
        let affected = project.take_affected_files();
        if affected.is_empty() {
            return refreshed;
        }
        for path in affected {
            if let Some(source) = read(fs, &path) {
                project.parse_file(&path, &source);
            }
            refreshed.push(path);
        }
    }
}

fn app_importing_brand_from(module: &str) -> String {
    format!(
        "import {{ brand }} from '{module}';\nimport {{ css }} from '@panda/css';\ncss({{ color: brand }});\n"
    )
}

#[test]
fn cold_build_affects_nothing() {
    let (_fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));
    project.parse_file("/proj/tokens.ts", "export const brand = 'red';\n");

    assert_eq!(
        project.importers_of("/proj/tokens.ts"),
        vec!["/proj/App.tsx"]
    );
    assert!(project.take_affected_files().is_empty());
}

#[test]
fn batch_parse_does_not_retry_missing_imports_for_each_file() {
    let memory = MemoryFileSystem::new();
    let fs = CountingFileSystem::new(memory.clone());
    write(&memory, "App.tsx", &app_importing_brand_from("./tokens"));
    for index in 0..16 {
        write(&memory, &format!("unrelated-{index}.tsx"), "export {};\n");
    }
    let mut project =
        create_project(json!({})).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let batch = project.parse_batch();
    project.parse_file_in_batch(
        "/proj/App.tsx",
        &app_importing_brand_from("./tokens"),
        &batch,
        ParseTransforms::default(),
    );

    fs.reset();
    for index in 0..16 {
        project.parse_file_in_batch(
            &format!("/proj/unrelated-{index}.tsx"),
            "export {};\n",
            &batch,
            ParseTransforms::default(),
        );
    }

    assert_eq!(fs.probes(), 0);
}

#[test]
fn batch_parse_does_not_probe_new_paths_after_resolving_an_import() {
    let memory = MemoryFileSystem::new();
    let fs = CountingFileSystem::new(memory.clone());
    write(&memory, "App.tsx", &app_importing_brand_from("./tokens"));
    write(&memory, "tokens.ts", "export const brand = 'red';\n");
    let mut project =
        create_project(json!({})).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let batch = project.parse_batch();
    project.parse_file_in_batch(
        "/proj/App.tsx",
        &app_importing_brand_from("./tokens"),
        &batch,
        ParseTransforms::default(),
    );

    fs.reset();
    for index in 0..16 {
        project.parse_file_in_batch(
            &format!("/proj/unrelated-{index}.tsx"),
            "export {};\n",
            &batch,
            ParseTransforms::default(),
        );
    }

    assert_eq!(fs.probes(), 0);
}

#[test]
fn creating_one_module_probes_a_shared_pending_request_once() {
    let memory = MemoryFileSystem::new();
    let fs = CountingFileSystem::new(memory.clone());
    let mut project =
        create_project(json!({})).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let batch = project.parse_batch();
    for index in 0..64 {
        project.parse_file_in_batch(
            &format!("/proj/App-{index}.tsx"),
            &app_importing_brand_from("./theme"),
            &batch,
            ParseTransforms::default(),
        );
    }
    drop(batch);

    write(&memory, "theme.ts", "export const brand = 'red';\n");
    fs.reset();
    project.parse_file("/proj/theme.ts", "export const brand = 'red';\n");

    assert!(
        fs.probes() < 20,
        "one directory + specifier should be resolved once, got {} filesystem probes",
        fs.probes()
    );
    assert_eq!(project.take_affected_files().len(), 64);
}

#[test]
fn pending_requests_with_the_same_specifier_stay_scoped_to_their_directory() {
    let memory = MemoryFileSystem::new();
    let fs = CountingFileSystem::new(memory.clone());
    let mut project =
        create_project(json!({})).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let batch = project.parse_batch();
    for directory in ["a", "b"] {
        for index in 0..4 {
            project.parse_file_in_batch(
                &format!("/proj/{directory}/App-{index}.tsx"),
                &app_importing_brand_from("./theme"),
                &batch,
                ParseTransforms::default(),
            );
        }
    }
    drop(batch);

    write(&memory, "a/theme.ts", "export const brand = 'red';\n");
    project.parse_file("/proj/a/theme.ts", "export const brand = 'red';\n");

    assert_eq!(
        project.take_affected_files(),
        (0..4)
            .map(|index| format!("/proj/a/App-{index}.tsx"))
            .collect::<Vec<_>>()
    );
}

#[test]
fn parse_batch_keeps_one_cross_file_revision() {
    let (fs, mut project) = watch_project(&[("tokens.ts", "export const brand = 'red';\n")]);

    let batch = project.parse_batch();
    project.parse_file_in_batch(
        "/proj/A.tsx",
        &app_importing_brand_from("./tokens"),
        &batch,
        ParseTransforms::default(),
    );
    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file_in_batch(
        "/proj/B.tsx",
        &app_importing_brand_from("./tokens"),
        &batch,
        ParseTransforms::default(),
    );
    drop(batch);
    project.parse_file("/proj/C.tsx", &app_importing_brand_from("./tokens"));

    let values = ["A", "B", "C"].map(|name| {
        let path = format!("/proj/{name}.tsx");
        let file = project.get_file(&path).expect("parsed file");
        let atom = file.atoms().iter().next().expect("color atom");
        let AtomValue::String(value) = atom.value() else {
            panic!("expected string atom")
        };
        value.to_string()
    });
    assert_eq!(values, ["red", "red", "blue"]);
}

#[test]
fn editing_a_token_file_affects_its_importer() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));
    project.parse_file("/proj/tokens.ts", "export const brand = 'red';\n");

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.refresh_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn editing_a_reexported_token_affects_the_importer() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./barrel")),
        ("barrel.ts", "export { brand } from './tokens';\n"),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./barrel"));

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn editing_a_token_file_that_is_not_a_project_file_still_affects_importers() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    assert!(!project.refresh_file("/proj/tokens.ts", "export const brand = 'blue';\n"));

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn creating_a_missing_index_module_affects_its_importer() {
    let (fs, mut project) = watch_project(&[("App.tsx", &app_importing_brand_from("./tokens"))]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));

    assert!(project.take_affected_files().is_empty());
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");

    write(&fs, "tokens/index.ts", "export const brand = 'red';\n");
    assert!(!project.refresh_file("/proj/tokens/index.ts", "export const brand = 'red';\n"));

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn creating_a_missing_reexported_token_file_affects_the_importer() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./barrel")),
        ("barrel.ts", "export { brand } from './tokens';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./barrel"));

    assert!(project.take_affected_files().is_empty());
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");

    write(&fs, "tokens.ts", "export const brand = 'red';\n");
    assert!(!project.refresh_file("/proj/tokens.ts", "export const brand = 'red';\n"));

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn creating_an_unrelated_file_does_not_affect_an_unresolved_importer() {
    let (fs, mut project) = watch_project(&[("App.tsx", &app_importing_brand_from("./tokens"))]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));

    write(&fs, "other.ts", "export const value = 'blue';\n");
    assert!(!project.refresh_file("/proj/other.ts", "export const value = 'blue';\n"));

    assert!(project.take_affected_files().is_empty());
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
}

#[test]
fn removing_an_unresolved_importer_drops_its_pending_request() {
    let (fs, mut project) = watch_project(&[("App.tsx", &app_importing_brand_from("./tokens"))]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));
    assert!(project.remove_file("/proj/App.tsx"));

    write(&fs, "tokens.ts", "export const brand = 'red';\n");
    assert!(!project.refresh_file("/proj/tokens.ts", "export const brand = 'red';\n"));

    assert!(project.take_affected_files().is_empty());
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
}

#[test]
fn replacing_an_importer_replaces_its_pending_request() {
    let other_source = app_importing_brand_from("./other");
    let (fs, mut project) = watch_project(&[("App.tsx", &app_importing_brand_from("./theme"))]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./theme"));
    project.parse_file("/proj/App.tsx", &other_source);

    write(&fs, "theme.ts", "export const brand = 'red';\n");
    project.parse_file("/proj/theme.ts", "export const brand = 'red';\n");

    assert!(project.take_affected_files().is_empty());
}

#[test]
fn removing_the_first_importer_keeps_the_shared_pending_request() {
    let (fs, mut project) = watch_project(&[
        ("A.tsx", &app_importing_brand_from("./theme")),
        ("B.tsx", &app_importing_brand_from("./theme")),
    ]);
    project.parse_file("/proj/A.tsx", &app_importing_brand_from("./theme"));
    project.parse_file("/proj/B.tsx", &app_importing_brand_from("./theme"));
    assert!(project.remove_file("/proj/A.tsx"));

    write(&fs, "theme.ts", "export const brand = 'red';\n");
    project.parse_file("/proj/theme.ts", "export const brand = 'red';\n");

    assert_eq!(project.take_affected_files(), vec!["/proj/B.tsx"]);
}

#[test]
fn clear_drops_pending_requests_and_cached_resolution_misses() {
    let (fs, mut project) = watch_project(&[("App.tsx", &app_importing_brand_from("./tokens"))]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));
    project.clear();

    write(&fs, "tokens.ts", "export const brand = 'red';\n");
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));

    assert!(project.take_affected_files().is_empty());
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn removing_a_token_file_drops_the_folded_atom() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));
    project.parse_file("/proj/tokens.ts", "export const brand = 'red';\n");

    fs.remove_file(Path::new("/proj/tokens.ts")).unwrap();
    assert!(project.remove_file("/proj/tokens.ts"));

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
}

#[test]
fn unrelated_importer_is_left_alone() {
    let other = indoc! {r"
        import { brand } from './other';
        import { css } from '@panda/css';
        css({ color: brand, padding: '4px' });
    "};
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("Other.tsx", other),
        ("tokens.ts", "export const brand = 'red';\n"),
        ("other.ts", "export const brand = 'navy';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));
    project.parse_file("/proj/Other.tsx", other);

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: navy
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn two_importers_are_both_affected() {
    let second = indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ background: brand });
    "};
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("Card.tsx", second),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));
    project.parse_file("/proj/Card.tsx", second);

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(
        refresh_affected(&mut project, &fs),
        vec!["/proj/App.tsx", "/proj/Card.tsx"]
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: blue
      conditions: []
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn refreshing_an_importer_clears_it_from_the_affected_set() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");
    project.refresh_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));

    assert!(project.take_affected_files().is_empty());
}

#[test]
fn removing_an_importer_does_not_report_it_affected() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app_importing_brand_from("./tokens")),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app_importing_brand_from("./tokens"));

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");
    project.remove_file("/proj/App.tsx");

    assert!(project.take_affected_files().is_empty());
    assert!(project.importers_of("/proj/tokens.ts").is_empty());
}

#[test]
fn reexport_cycle_does_not_loop() {
    let app = app_importing_brand_from("./a");
    let (fs, mut project) = watch_project(&[
        ("App.tsx", &app),
        ("a.ts", "import { brand } from './b';\nexport { brand };\n"),
        ("b.ts", "import { brand } from './a';\nexport { brand };\n"),
    ]);
    project.parse_file("/proj/App.tsx", &app);

    write(&fs, "a.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/a.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn removing_one_importer_preserves_the_other_importers_dependency() {
    let source = app_importing_brand_from("./tokens");
    let (fs, mut project) = watch_project(&[
        ("First.tsx", &source),
        ("Second.tsx", &source),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/First.tsx", &source);
    project.parse_file("/proj/Second.tsx", &source);
    project.remove_file("/proj/First.tsx");

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_yaml_snapshot!(json!({
        "importers": project.importers_of("/proj/tokens.ts"),
        "affected": project.take_affected_files(),
    }), @"
    importers:
      - /proj/Second.tsx
    affected:
      - /proj/Second.tsx
    ");
}
