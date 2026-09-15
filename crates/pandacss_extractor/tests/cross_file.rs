//! Cross-file import resolution: `import { x } from './tokens'` folds
//! to the literal exported from the resolved file.
//!
//! Fixtures use [`pandacss_fs::MemoryFileSystem`] so the resolver and our
//! extractor share an in-memory tree — no tempdir, no disk I/O.

use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

use crate::common::{matcher, panda_config};
use insta::assert_yaml_snapshot;
use oxc_resolver::{FileMetadata, FileSystem as OxcFileSystem, ResolveError};
use pandacss_extractor::{
    CrossFileResolver, ExtractUsage, ExtractorConfig, Matchers, extract, extract_in_session,
};
use pandacss_fs::{FileSystem, MemoryFileSystem};

#[derive(Clone)]
struct CountingFileSystem {
    inner: MemoryFileSystem,
    reads: Arc<AtomicUsize>,
    fail_source_reads: Arc<AtomicBool>,
}

impl CountingFileSystem {
    fn new(inner: MemoryFileSystem) -> Self {
        Self {
            inner,
            reads: Arc::default(),
            fail_source_reads: Arc::default(),
        }
    }

    fn reads(&self) -> usize {
        self.reads.load(Ordering::Relaxed)
    }

    fn set_fail_source_reads(&self, fail: bool) {
        self.fail_source_reads.store(fail, Ordering::Relaxed);
    }

    fn source_read_error(&self, path: &Path) -> Option<io::Error> {
        (self.fail_source_reads.load(Ordering::Relaxed)
            && path.extension().is_some_and(|extension| extension == "ts"))
        .then(|| io::Error::new(io::ErrorKind::PermissionDenied, "fixture read failure"))
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
        if let Some(err) = self.source_read_error(path) {
            return Err(err);
        }
        let result = OxcFileSystem::read(&self.inner, path);
        if result.is_ok() {
            self.reads.fetch_add(1, Ordering::Relaxed);
        }
        result
    }

    fn read_to_string(&self, path: &Path) -> io::Result<String> {
        if let Some(err) = self.source_read_error(path) {
            return Err(err);
        }
        let result = OxcFileSystem::read_to_string(&self.inner, path);
        if result.is_ok() {
            self.reads.fetch_add(1, Ordering::Relaxed);
        }
        result
    }

    fn metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.inner.metadata(path)
    }

    fn symlink_metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.inner.symlink_metadata(path)
    }

    fn read_link(&self, path: &Path) -> Result<PathBuf, ResolveError> {
        self.inner.read_link(path)
    }

    fn canonicalize(&self, path: &Path) -> io::Result<PathBuf> {
        self.inner.canonicalize(path)
    }
}

/// Build an in-memory project at `/proj` with `main.tsx` plus N sibling
/// files. Returns the populated FS + the absolute main.tsx path.
fn project(main_source: &str, siblings: &[(&str, &str)]) -> (MemoryFileSystem, PathBuf) {
    let fs = MemoryFileSystem::new();
    for (name, contents) in siblings {
        fs.add_file(
            PathBuf::from(format!("/proj/{name}")),
            contents.as_bytes().to_vec(),
        );
    }
    let main_path = PathBuf::from("/proj/main.tsx");
    fs.add_file(main_path.clone(), main_source.as_bytes().to_vec());
    (fs, main_path)
}

fn run(fs: &MemoryFileSystem, main_path: &Path, source: &str) -> ExtractUsage {
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    extract(source, main_path.to_str().unwrap(), &config)
}

#[test]
#[cfg_attr(
    target_os = "windows",
    ignore = "oxc_resolver resolves tsconfig paths aliases differently on Windows; pre-existing on v2"
)]
fn tsconfig_path_alias_import_is_matched() {
    // tsconfig `paths` aliases styled-system to `@styles/*`. `@styles/css` shares
    // no substring with `styled-system/css`, so matching must resolve the alias.
    let fs = MemoryFileSystem::new();
    fs.add_file(
        PathBuf::from("/proj/tsconfig.json"),
        br#"{ "compilerOptions": { "baseUrl": ".", "paths": { "@styles/*": ["./styled-system/*"] } } }"#.to_vec(),
    );
    fs.add_file(
        PathBuf::from("/proj/styled-system/css.ts"),
        b"export const css = 0;\n".to_vec(),
    );
    let main = PathBuf::from("/proj/main.tsx");
    let source = indoc::indoc! {r"
        import { css } from '@styles/css';
        css({ color: 'red' });
    "};
    fs.add_file(main.clone(), source.as_bytes().to_vec());

    let matchers = Matchers {
        css: matcher("styled-system/css", ["css", "cva", "sva"]),
        ..Default::default()
    };
    let config =
        ExtractorConfig::new(matchers).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let result = extract(source, main.to_str().unwrap(), &config);

    assert_eq!(result.calls.len(), 1, "aliased css() should extract");
    assert_eq!(result.calls[0].name, "css");
}

fn assert_send_sync<T: Send + Sync>() {}

#[test]
fn cross_file_resolver_is_send_sync() {
    assert_send_sync::<CrossFileResolver>();
}

/// Snapshot-friendly: drop spans (they vary by source-position) and keep
/// `name + data` so cross-file resolution is asserted on the values that
/// actually flowed through.
fn shape(result: &ExtractUsage) -> serde_json::Value {
    serde_json::json!({
        "calls": result
            .calls
            .iter()
            .map(|c| serde_json::json!({ "name": &c.name, "data": &c.data }))
            .collect::<Vec<_>>(),
    })
}

// --- happy paths ---------------------------------------------------------

#[test]
fn named_const_import_resolves_to_value() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

#[test]
fn imported_object_folds_member_access() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { tokens } from './tokens';
            import { css } from '@panda/css';
            css({ color: tokens.primary, bg: tokens.secondary });
        "},
        &[(
            "tokens.ts",
            "export const tokens = { primary: '#3b82f6', secondary: '#a78bfa' };\n",
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#3b82f6"
            bg: "#a78bfa"
    "##);
}

#[test]
fn exported_object_can_reference_file_local_const() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { button } from './tokens';
            import { css } from '@panda/css';
            css(button);
        "},
        &[(
            "tokens.ts",
            "const base = { color: 'red' };\nexport const button = { ...base, padding: '4px' };\n",
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - color: red
            padding: 4px
    ");
}

#[test]
fn exported_alias_chain_resolves_whole_object() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { primary } from './tokens';
            import { css } from '@panda/css';
            css(primary);
        "},
        &[(
            "tokens.ts",
            indoc::indoc! {r"
                const base = { color: 'red' };
                const button = base;
                export const primary = button;
            "},
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - color: red
    ");
}

#[test]
fn exported_object_can_reference_imported_const() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { button } from './tokens';
            import { css } from '@panda/css';
            css(button);
        "},
        &[
            ("colors.ts", "export const brand = 'red';\n"),
            (
                "tokens.ts",
                "import { brand } from './colors';\nexport const button = { color: brand };\n",
            ),
        ],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - color: red
    ");
}

#[test]
fn imported_object_spreads_under_condition() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { hover } from './styles';
            import { css } from '@panda/css';
            css({ _hover: { ...hover, bg: 'blue' } });
        "},
        &[("styles.ts", "export const hover = { color: 'red' };\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - _hover:
              color: red
              bg: blue
    ");
}

#[test]
fn exported_css_raw_object_folds_into_importing_css_call() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { button } from './styles';
            import { css } from '@panda/css';
            css({ ...button, margin: '8px' });
        "},
        &[(
            "styles.ts",
            indoc::indoc! {r"
                import { css } from '@panda/css';
                export const button = css.raw({ color: 'red', padding: '4px' });
            "},
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - color: red
            padding: 4px
            margin: 8px
    ");
}

#[test]
fn re_exported_css_raw_object_spreads_into_importing_css_call() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { button } from './styles';
            import { css } from '@panda/css';
            css({ ...button, bg: 'blue' });
        "},
        &[
            (
                "base.ts",
                indoc::indoc! {r"
                    import { css } from '@panda/css';
                    export const button = css.raw({ color: 'red' });
                "},
            ),
            ("styles.ts", "export { button } from './base';\n"),
        ],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - color: red
            bg: blue
    ");
}

#[test]
fn exported_css_raw_object_spreads_under_condition() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { button } from './styles';
            import { css } from '@panda/css';
            css({ _hover: { ...button, margin: '8px' } });
        "},
        &[(
            "styles.ts",
            indoc::indoc! {r"
                import { css } from '@panda/css';
                export const button = css.raw({ color: 'red', padding: '4px' });
            "},
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - _hover:
              color: red
              padding: 4px
              margin: 8px
    ");
}

#[test]
fn aliased_import_resolves_by_exported_name() {
    // `import { brand as primary }` — the resolver tracks the exported
    // name (`brand`), not the local alias (`primary`).
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand as primary } from './tokens';
            import { css } from '@panda/css';
            css({ color: primary });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

#[test]
fn extensionless_import_resolves_through_probed_extensions() {
    // `'./tokens'` — `oxc_resolver` probes `.tsx`, `.ts`, etc. and
    // settles on `tokens.ts`. Locks in our extension-probe defaults.
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

// --- failure modes ------------------------------------------------------

#[test]
fn unresolvable_specifier_drops_outer_call() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './does-not-exist';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    let result = run(&fs, &main, &src);

    assert_yaml_snapshot!(shape(&result), @"calls: []");
    assert_eq!(
        result.unresolved_dependencies,
        vec![pandacss_extractor::UnresolvedCrossFileDependency {
            from_file: "/proj/main.tsx".to_owned(),
            specifier: "./does-not-exist".to_owned(),
        }]
    );
}

#[test]
fn missing_export_drops_outer_call() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { otherName } from './tokens';
            import { css } from '@panda/css';
            css({ color: otherName });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @"calls: []");
}

#[test]
fn export_let_currently_folds_too() {
    // `export let` is a `VariableDeclaration` and our top-level collector
    // folds any unmutated initializer regardless of `const` vs `let`.
    // Documenting the lax behavior: if a downstream emitter needs strict
    // const-only handling, the contract gets tightened.
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export let brand = '#ef4444';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

#[test]
fn no_cross_file_resolver_means_no_folding() {
    // Without `with_cross_file`, the resolver bails on import-bound
    // symbols and the outer call drops.
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    let config = panda_config();
    let result = extract(&src, main.to_str().unwrap(), &config);
    assert_yaml_snapshot!(shape(&result), @"calls: []");
}

// --- cycles & repeated lookups ------------------------------------------

#[test]
fn cyclic_imports_drop_safely_without_panic() {
    // `a.ts` re-exports from `b.ts` which (contrived) imports back from
    // `a.ts`. The cycle guard returns `None` for the recursive case so
    // the resolver doesn't overflow the stack. Outcome shape is empty
    // because the chain can't fold; the contract is "doesn't crash".
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './a';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[
            ("a.ts", "import { brand } from './b';\nexport { brand };\n"),
            ("b.ts", "import { brand } from './a';\nexport { brand };\n"),
        ],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    // No assertion on output beyond "didn't crash and produced *some*
    // result"; we don't currently fold `export { x } from './…'`
    // re-exports, so the cycle path produces `calls: []`.
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @"calls: []");
}

#[test]
fn cycle_guard_is_reset_between_extractions_in_one_session() {
    let source = indoc::indoc! {r"
        import { brand } from './a';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(
        source,
        &[
            ("a.ts", "import { brand } from './b';\nexport { brand };\n"),
            ("b.ts", "import { brand } from './a';\nexport { brand };\n"),
        ],
    );
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs));
    let session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();

    let first = extract_in_session(source, main.to_str().unwrap(), &config, &session);
    let second = extract_in_session(source, main.to_str().unwrap(), &config, &session);

    assert_yaml_snapshot!(shape(&first), @"calls: []");
    assert_yaml_snapshot!(shape(&second), @"calls: []");
}

#[test]
fn cache_reuses_across_multiple_extracts() {
    // Build one cross-file resolver, run extract() twice — the second run
    // should hit the cached tokens file. The contract is "two runs
    // produce identical output". A cache-invalidation regression would
    // diverge.
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let a = extract(&src, main.to_str().unwrap(), &config);
    let b = extract(&src, main.to_str().unwrap(), &config);
    assert_eq!(shape(&a), shape(&b));
}

#[test]
fn cache_reloads_exports_when_imported_source_changes() {
    let source = indoc::indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(source, &[("tokens.ts", "export const brand = 'red';\n")]);
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));

    let before = extract(source, main.to_str().unwrap(), &config);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    let after = extract(source, main.to_str().unwrap(), &config);

    assert_yaml_snapshot!(serde_json::json!({
        "before": shape(&before),
        "after": shape(&after),
    }), @r"
    before:
      calls:
        - name: css
          data:
            - color: red
    after:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn cache_drops_an_export_removed_from_an_existing_module() {
    let source = indoc::indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(source, &[("tokens.ts", "export const brand = 'red';\n")]);
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));

    let before = extract(source, main.to_str().unwrap(), &config);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const accent = 'blue';\n".to_vec(),
    );
    let after = extract(source, main.to_str().unwrap(), &config);

    assert_yaml_snapshot!(serde_json::json!({
        "before": shape(&before),
        "after": shape(&after),
    }), @r"
    before:
      calls:
        - name: css
          data:
            - color: red
    after:
      calls: []
    ");
}

#[test]
fn cache_drops_deleted_exports_and_recovers_after_recreation() {
    let source = indoc::indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(source, &[("tokens.ts", "export const brand = 'red';\n")]);
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let tokens = PathBuf::from("/proj/tokens.ts");

    let before = extract(source, main.to_str().unwrap(), &config);
    pandacss_fs::FileSystem::remove_file(&fs, &tokens).unwrap();
    let deleted = extract(source, main.to_str().unwrap(), &config);
    fs.add_file(tokens, b"export const brand = 'green';\n".to_vec());
    let recreated = extract(source, main.to_str().unwrap(), &config);

    assert_yaml_snapshot!(serde_json::json!({
        "before": shape(&before),
        "deleted": shape(&deleted),
        "recreated": shape(&recreated),
    }), @r"
    before:
      calls:
        - name: css
          data:
            - color: red
    deleted:
      calls: []
    recreated:
      calls:
        - name: css
          data:
            - color: green
    ");
}

#[test]
fn cache_reloads_when_a_previously_missing_export_appears() {
    let source = indoc::indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(source, &[("tokens.ts", "export const accent = 'red';\n")]);
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));

    let missing = extract(source, main.to_str().unwrap(), &config);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    let added = extract(source, main.to_str().unwrap(), &config);

    assert_yaml_snapshot!(serde_json::json!({
        "missing": shape(&missing),
        "added": shape(&added),
    }), @r"
    missing:
      calls: []
    added:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn cache_reloads_exports_through_a_re_export() {
    let source = indoc::indoc! {r"
        import { brand } from './barrel';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(
        source,
        &[
            ("barrel.ts", "export { brand } from './tokens';\n"),
            ("tokens.ts", "export const brand = 'red';\n"),
        ],
    );
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));

    let before = extract(source, main.to_str().unwrap(), &config);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    let after = extract(source, main.to_str().unwrap(), &config);

    let deps = before
        .dependencies
        .iter()
        .map(|dep| (dep.path.as_str(), dep.source_hash.is_some()))
        .collect::<Vec<_>>();
    assert_eq!(
        deps,
        vec![("/proj/barrel.ts", true), ("/proj/tokens.ts", true)]
    );
    assert_yaml_snapshot!(serde_json::json!({
        "before": shape(&before),
        "after": shape(&after),
    }), @r"
    before:
      calls:
        - name: css
          data:
            - color: red
    after:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn session_keeps_one_module_revision_while_other_sessions_refresh() {
    let source = indoc::indoc! {r"
        import { brand } from './barrel';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(
        source,
        &[
            ("barrel.ts", "export { brand } from './tokens';\n"),
            ("tokens.ts", "export const brand = 'red';\n"),
        ],
    );
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();

    let first = extract_in_session(source, main.to_str().unwrap(), &config, &session);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    let refreshed = extract(source, main.to_str().unwrap(), &config);
    let same_session = extract_in_session(source, main.to_str().unwrap(), &config, &session);
    let next_session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();
    let next = extract_in_session(source, main.to_str().unwrap(), &config, &next_session);

    assert_yaml_snapshot!(serde_json::json!({
        "first": shape(&first),
        "refreshed": shape(&refreshed),
        "sameSession": shape(&same_session),
        "nextSession": shape(&next),
    }), @r"
    first:
      calls:
        - name: css
          data:
            - color: red
    refreshed:
      calls:
        - name: css
          data:
            - color: blue
    sameSession:
      calls:
        - name: css
          data:
            - color: red
    nextSession:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn session_keeps_an_unresolved_import_missing() {
    let source = indoc::indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(source, &[]);
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();

    let missing = extract_in_session(source, main.to_str().unwrap(), &config, &session);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .clear_resolution_cache();
    let same_session = extract_in_session(source, main.to_str().unwrap(), &config, &session);
    let next_session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();
    let next = extract_in_session(source, main.to_str().unwrap(), &config, &next_session);

    assert_yaml_snapshot!(serde_json::json!({
        "missing": shape(&missing),
        "sameSession": shape(&same_session),
        "nextSession": shape(&next),
    }), @r"
    missing:
      calls: []
    sameSession:
      calls: []
    nextSession:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn session_keeps_an_unreadable_module_unavailable() {
    let source = indoc::indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let fs = MemoryFileSystem::new();
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    let fs = CountingFileSystem::new(fs);
    fs.set_fail_source_reads(true);
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();

    let unreadable = extract_in_session(source, "/proj/A.tsx", &config, &session);
    fs.set_fail_source_reads(false);
    let same_session = extract_in_session(source, "/proj/B.tsx", &config, &session);
    let next_session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();
    let next = extract_in_session(source, "/proj/C.tsx", &config, &next_session);

    assert_yaml_snapshot!(serde_json::json!({
        "unreadable": shape(&unreadable),
        "sameSession": shape(&same_session),
        "nextSession": shape(&next),
    }), @r"
    unreadable:
      calls: []
    sameSession:
      calls: []
    nextSession:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn session_reads_a_shared_re_export_chain_once() {
    let fs = MemoryFileSystem::new();
    fs.add_file(
        PathBuf::from("/proj/barrel.ts"),
        b"export { brand } from './tokens';\n".to_vec(),
    );
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'red';\n".to_vec(),
    );
    let fs = CountingFileSystem::new(fs);
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let session = config
        .cross_file
        .as_ref()
        .expect("cross-file resolver")
        .session();
    let source = indoc::indoc! {r"
        import { brand } from './barrel';
        import { css } from '@panda/css';
        css({ color: brand });
    "};

    for index in 0..20 {
        let path = format!("/proj/consumer-{index}.tsx");
        let result = extract_in_session(source, &path, &config, &session);
        assert_eq!(result.calls.len(), 1);
    }

    assert_eq!(fs.reads(), 2, "each imported module should be read once");
}

#[test]
fn cache_reloads_exports_through_an_imported_alias() {
    let source = indoc::indoc! {r"
        import { brand } from './mid';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(
        source,
        &[
            (
                "mid.ts",
                "import { brand as value } from './tokens';\nexport const brand = value;\n",
            ),
            ("tokens.ts", "export const brand = 'red';\n"),
        ],
    );
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));

    let before = extract(source, main.to_str().unwrap(), &config);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    let after = extract(source, main.to_str().unwrap(), &config);

    assert_yaml_snapshot!(serde_json::json!({
        "before": shape(&before),
        "after": shape(&after),
    }), @r"
    before:
      calls:
        - name: css
          data:
            - color: red
    after:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn cache_reloads_exports_through_a_three_hop_re_export() {
    let source = indoc::indoc! {r"
        import { brand } from './a';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, main) = project(
        source,
        &[
            ("a.ts", "export { brand } from './b';\n"),
            ("b.ts", "export { brand } from './tokens';\n"),
            ("tokens.ts", "export const brand = 'red';\n"),
        ],
    );
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));

    let before = extract(source, main.to_str().unwrap(), &config);
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = 'blue';\n".to_vec(),
    );
    let after = extract(source, main.to_str().unwrap(), &config);

    assert_yaml_snapshot!(serde_json::json!({
        "before": shape(&before),
        "after": shape(&after),
    }), @r"
    before:
      calls:
        - name: css
          data:
            - color: red
    after:
      calls:
        - name: css
          data:
            - color: blue
    ");
}

#[test]
fn cache_keeps_an_unrelated_importer_stable_when_another_module_changes() {
    let red_source = indoc::indoc! {r"
        import { brand } from './red';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let blue_source = indoc::indoc! {r"
        import { brand } from './blue';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, red_main) = project(
        red_source,
        &[
            ("red.ts", "export const brand = 'red';\n"),
            ("blue.ts", "export const brand = 'navy';\n"),
            ("other.tsx", blue_source),
        ],
    );
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    let other = PathBuf::from("/proj/other.tsx");

    let red_before = extract(red_source, red_main.to_str().unwrap(), &config);
    let blue_before = extract(blue_source, other.to_str().unwrap(), &config);
    fs.add_file(
        PathBuf::from("/proj/red.ts"),
        b"export const brand = 'crimson';\n".to_vec(),
    );
    let red_after = extract(red_source, red_main.to_str().unwrap(), &config);
    let blue_after = extract(blue_source, other.to_str().unwrap(), &config);

    assert_yaml_snapshot!(serde_json::json!({
        "red": { "before": shape(&red_before), "after": shape(&red_after) },
        "blue": { "before": shape(&blue_before), "after": shape(&blue_after) },
    }), @r"
    red:
      before:
        calls:
          - name: css
            data:
              - color: red
      after:
        calls:
          - name: css
            data:
              - color: crimson
    blue:
      before:
        calls:
          - name: css
            data:
              - color: navy
      after:
        calls:
          - name: css
            data:
              - color: navy
    ");
}

// --- in-memory FS specific tests ----------------------------------------

#[test]
fn memory_fs_isolation_between_projects() {
    // Two separate MemoryFileSystem instances can't see each other —
    // important for parallel test isolation.
    let (fs_a, main_a) = project(
        "import { brand } from './tokens';\nimport { css } from '@panda/css';\ncss({ color: brand });\n",
        &[("tokens.ts", "export const brand = '#aaa';\n")],
    );
    let (fs_b, main_b) = project(
        "import { brand } from './tokens';\nimport { css } from '@panda/css';\ncss({ color: brand });\n",
        &[("tokens.ts", "export const brand = '#bbb';\n")],
    );

    let src_a = String::from_utf8(oxc_resolver::FileSystem::read(&fs_a, &main_a).unwrap()).unwrap();
    let src_b = String::from_utf8(oxc_resolver::FileSystem::read(&fs_b, &main_b).unwrap()).unwrap();

    let ra = run(&fs_a, &main_a, &src_a);
    let rb = run(&fs_b, &main_b, &src_b);

    assert_ne!(shape(&ra), shape(&rb));
}

#[test]
fn fs_mutation_after_resolver_construction_visible() {
    // Add the tokens file AFTER constructing the resolver. The shared
    // FS handle means the resolver sees the new file on first lookup.
    let fs = MemoryFileSystem::new();
    fs.add_file(
        PathBuf::from("/proj/main.tsx"),
        b"import { brand } from './tokens';\nimport { css } from '@panda/css';\ncss({ color: brand });\n".to_vec(),
    );
    let resolver = CrossFileResolver::with_fs(fs.clone());

    // Now add the imported file. The resolver shares state via Arc<RwLock>.
    fs.add_file(
        PathBuf::from("/proj/tokens.ts"),
        b"export const brand = '#ef4444';\n".to_vec(),
    );

    let main = PathBuf::from("/proj/main.tsx");
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    let config = panda_config().with_cross_file(resolver);
    let result = extract(&src, main.to_str().unwrap(), &config);

    assert_yaml_snapshot!(shape(&result), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

#[test]
fn deep_import_chain_resolves_through_re_export() {
    // a.ts re-exports brand from b.ts; the cross-file resolver follows
    // the chain and still uses the originally requested exported name.
    let (fs, main) = project(
        indoc::indoc! {r"
            import { brand } from './a';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[
            ("a.ts", "export { brand } from './b';\n"),
            ("b.ts", "export const brand = '#ef4444';\n"),
        ],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

// --- pure function exports ----------------------------------------------

#[test]
fn imported_pure_arrow_call_folds() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { getColor } from './helpers';
            import { css } from '@panda/css';
            css({ color: getColor() });
        "},
        &[("helpers.ts", "export const getColor = () => 'red';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: red
    "##);
}

#[test]
fn imported_group_hover_helper_folds_computed_key() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { groupHover } from './helpers';
            import { css } from '@panda/css';
            css({ [groupHover('cool')]: { color: 'red' } });
        "},
        &[(
            "helpers.ts",
            "export const groupHover = (name: string) => `.${name}:is(:hover, [data-hover]) &`;\n",
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r#"
    calls:
      - name: css
        data:
          - ".cool:is(:hover, [data-hover]) &":
              color: red
    "#);
}

#[test]
fn imported_function_declaration_call_folds() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { getColor } from './helpers';
            import { css } from '@panda/css';
            css({ color: getColor() });
        "},
        &[(
            "helpers.ts",
            "export function getColor() {\n  return 'teal.500';\n}\n",
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: teal.500
    "##);
}

#[test]
fn re_exported_pure_fn_call_folds() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { groupHover } from './a';
            import { css } from '@panda/css';
            css({ [groupHover('btn')]: { bg: 'red' } });
        "},
        &[
            ("a.ts", "export { groupHover } from './helpers';\n"),
            (
                "helpers.ts",
                "export const groupHover = (name: string) => `.group-${name}:hover &`;\n",
            ),
        ],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r#"
    calls:
      - name: css
        data:
          - ".group-btn:hover &":
              bg: red
    "#);
}

#[test]
fn bare_imported_function_value_does_not_fold() {
    // `getColor` without a call is not a style literal.
    let (fs, main) = project(
        indoc::indoc! {r"
            import { getColor } from './helpers';
            import { css } from '@panda/css';
            css({ color: getColor });
        "},
        &[("helpers.ts", "export const getColor = () => 'red';\n")],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert!(run(&fs, &main, &src).calls.is_empty());
}

#[test]
fn imported_aliased_pure_fn_export_does_not_fold() {
    // `export { g }` where `g` aliases a local arrow — export collection does
    // not chase identifier aliases to PureFn (only direct arrow/function inits).
    let (fs, main) = project(
        indoc::indoc! {r"
            import { g } from './helpers';
            import { css } from '@panda/css';
            css({ color: g() });
        "},
        &[(
            "helpers.ts",
            "const f = () => 'red';\nconst g = f;\nexport { g };\n",
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert!(run(&fs, &main, &src).calls.is_empty());
}

#[test]
fn imported_pure_helper_object_return_spreads() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { getColorConfig } from './helpers';
            import { css } from '@panda/css';
            css({ ...getColorConfig(), padding: '4px' });
        "},
        &[(
            "helpers.ts",
            "export const getColorConfig = () => ({ color: 'teal.600', backgroundColor: 'teal.650' });\n",
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: teal.600
            backgroundColor: teal.650
            padding: 4px
    "##);
}

#[test]
fn imported_conditional_object_keeps_encode_branches() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { colors } from './tokens';
            import { css } from '@panda/css';
            css({ ...colors });
        "},
        &[(
            "tokens.ts",
            "export const colors = { color: isDark ? 'red' : 'blue' };\n",
        )],
    );
    let src = String::from_utf8(oxc_resolver::FileSystem::read(&fs, &main).unwrap()).unwrap();
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @r"
    calls:
      - name: css
        data:
          - color:
              kind: conditional
              branches:
                - red
                - blue
    ");
}

// --- factory folds across files (keyframes / positionTry / viewTransition) --
//
// A factory call `export const x = keyframes({...})` in one file must fold to
// its hashed name when imported and used in another, exactly as it folds
// same-file. All three share the css barrel and the same value-fold path.

use pandacss_extractor::{Literal, NameMatcher};

/// css matcher that recognises the three value/class factories alongside `css`,
/// with an optional class-name prefix threaded into the folded names.
fn factory_config(prefix: &str, fs: &MemoryFileSystem) -> ExtractorConfig {
    let matchers = Matchers {
        css: pandacss_extractor::Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "keyframes", "positionTry", "viewTransition"]),
        },
        ..Default::default()
    };
    let mut config =
        ExtractorConfig::new(matchers).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    prefix.clone_into(&mut config.class_name_prefix);
    config
}

fn run_factory(fs: &MemoryFileSystem, main: &Path, prefix: &str) -> ExtractUsage {
    let src = String::from_utf8(oxc_resolver::FileSystem::read(fs, main).unwrap()).unwrap();
    extract(&src, main.to_str().unwrap(), &factory_config(prefix, fs))
}

/// Value of `prop` inside the first `css({...})` arg, if it folded to a string.
fn css_prop(usage: &ExtractUsage, prop: &str) -> Option<String> {
    let css = usage.calls.iter().find(|c| c.name == "css")?;
    let Some(Literal::Object(entries)) = css.data.first().and_then(Option::as_ref) else {
        return None;
    };
    entries.iter().find_map(|(key, value)| match value {
        Literal::String(text) | Literal::Token { value: text, .. } if key == prop => {
            Some(text.clone())
        }
        _ => None,
    })
}

#[test]
fn imported_keyframes_const_folds_in_animation_name() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { spin } from './anim';
            import { css } from '@panda/css';
            css({ animationName: spin });
        "},
        &[(
            "anim.ts",
            "import { keyframes } from '@panda/css';\nexport const spin = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });\n",
        )],
    );
    let expected = pandacss_shared::keyframes_name(
        &serde_json::json!({ "from": { "opacity": 0 }, "to": { "opacity": 1 } }),
        "",
    );
    assert_eq!(
        css_prop(&run_factory(&fs, &main, ""), "animationName").as_deref(),
        Some(expected.as_str())
    );
}

#[test]
fn imported_position_try_const_folds_in_fallbacks() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { flip } from './anchors';
            import { css } from '@panda/css';
            css({ positionTryFallbacks: flip });
        "},
        &[(
            "anchors.ts",
            "import { positionTry } from '@panda/css';\nexport const flip = positionTry({ top: 'anchor(bottom)' });\n",
        )],
    );
    let expected =
        pandacss_shared::position_try_ident(&serde_json::json!({ "top": "anchor(bottom)" }), "");
    assert_eq!(
        css_prop(&run_factory(&fs, &main, ""), "positionTryFallbacks").as_deref(),
        Some(expected.as_str())
    );
}

#[test]
fn imported_view_transition_const_does_not_fold_as_a_css_value() {
    // Unlike keyframes/positionTry, viewTransition returns a *class* for
    // `className`, not a style-object value. It has no value-fold, so using an
    // imported viewTransition const inside a css() property must not resolve to
    // a `vt_` class. Cross-file usage flows through `className` + the transform
    // (the defining file inlines the call to the class string), not this path.
    let (fs, main) = project(
        indoc::indoc! {r"
            import { slide } from './transitions';
            import { css } from '@panda/css';
            css({ viewTransitionName: slide });
        "},
        &[(
            "transitions.ts",
            "import { viewTransition } from '@panda/css';\nexport const slide = viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } });\n",
        )],
    );
    let value = css_prop(&run_factory(&fs, &main, ""), "viewTransitionName");
    assert!(
        value.as_deref().is_none_or(|v| !v.starts_with("vt_")),
        "viewTransition is a className class, not a css value; got {value:?}"
    );
}

#[test]
fn imported_keyframes_apply_the_config_prefix() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { spin } from './anim';
            import { css } from '@panda/css';
            css({ animationName: spin });
        "},
        &[(
            "anim.ts",
            "import { keyframes } from '@panda/css';\nexport const spin = keyframes({ from: { opacity: 0 } });\n",
        )],
    );
    let expected =
        pandacss_shared::keyframes_name(&serde_json::json!({ "from": { "opacity": 0 } }), "acme");
    let name = css_prop(&run_factory(&fs, &main, "acme"), "animationName").expect("fold");
    assert_eq!(name, expected);
    assert!(name.starts_with("acme-kf_"));
}

#[test]
fn re_exported_keyframes_folds_through_the_barrel() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { spin } from './index';
            import { css } from '@panda/css';
            css({ animationName: spin });
        "},
        &[
            (
                "anim.ts",
                "import { keyframes } from '@panda/css';\nexport const spin = keyframes({ from: { opacity: 0 } });\n",
            ),
            ("index.ts", "export { spin } from './anim';\n"),
        ],
    );
    let expected =
        pandacss_shared::keyframes_name(&serde_json::json!({ "from": { "opacity": 0 } }), "");
    assert_eq!(
        css_prop(&run_factory(&fs, &main, ""), "animationName").as_deref(),
        Some(expected.as_str())
    );
}

#[test]
fn aliased_keyframes_import_still_folds() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { spin as spinAnim } from './anim';
            import { css } from '@panda/css';
            css({ animationName: spinAnim });
        "},
        &[(
            "anim.ts",
            "import { keyframes } from '@panda/css';\nexport const spin = keyframes({ from: { opacity: 0 } });\n",
        )],
    );
    let expected =
        pandacss_shared::keyframes_name(&serde_json::json!({ "from": { "opacity": 0 } }), "");
    assert_eq!(
        css_prop(&run_factory(&fs, &main, ""), "animationName").as_deref(),
        Some(expected.as_str())
    );
}

#[test]
fn composed_multi_animation_name_folds_two_imported_keyframes() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { scale, spin } from './anim';
            import { css } from '@panda/css';
            css({ animationName: `${scale}, ${spin}` });
        "},
        &[(
            "anim.ts",
            "import { keyframes } from '@panda/css';\nexport const scale = keyframes({ to: { transform: 'scale(1.2)' } });\nexport const spin = keyframes({ to: { transform: 'rotate(360deg)' } });\n",
        )],
    );
    let scale = pandacss_shared::keyframes_name(
        &serde_json::json!({ "to": { "transform": "scale(1.2)" } }),
        "",
    );
    let spin = pandacss_shared::keyframes_name(
        &serde_json::json!({ "to": { "transform": "rotate(360deg)" } }),
        "",
    );
    assert_eq!(
        css_prop(&run_factory(&fs, &main, ""), "animationName").as_deref(),
        Some(format!("{scale}, {spin}").as_str())
    );
}

#[test]
fn imported_factory_consts_fold_together_in_one_call() {
    let (fs, main) = project(
        indoc::indoc! {r"
            import { spin } from './anim';
            import { flip } from './anchors';
            import { css } from '@panda/css';
            css({ animationName: spin, positionTryFallbacks: flip });
        "},
        &[
            (
                "anim.ts",
                "import { keyframes } from '@panda/css';\nexport const spin = keyframes({ from: { opacity: 0 } });\n",
            ),
            (
                "anchors.ts",
                "import { positionTry } from '@panda/css';\nexport const flip = positionTry({ top: 'anchor(bottom)' });\n",
            ),
        ],
    );
    let usage = run_factory(&fs, &main, "");
    assert_eq!(
        css_prop(&usage, "animationName").as_deref(),
        Some(
            pandacss_shared::keyframes_name(&serde_json::json!({ "from": { "opacity": 0 } }), "")
                .as_str()
        )
    );
    assert_eq!(
        css_prop(&usage, "positionTryFallbacks").as_deref(),
        Some(
            pandacss_shared::position_try_ident(
                &serde_json::json!({ "top": "anchor(bottom)" }),
                ""
            )
            .as_str()
        )
    );
}
