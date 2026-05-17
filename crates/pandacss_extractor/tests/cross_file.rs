//! Cross-file import resolution: `import { x } from './tokens'` folds
//! to the literal exported from the resolved file.
//!
//! Fixtures use [`pandacss_fs::MemoryFileSystem`] so the resolver and our
//! extractor share an in-memory tree — no tempdir, no disk I/O.

use std::path::{Path, PathBuf};

mod common;

use common::panda_config;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{CrossFileResolver, ExtractUsage, extract};
use pandacss_fs::MemoryFileSystem;

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
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @"calls: []");
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
fn deep_import_chain_resolves_at_one_level() {
    // a.ts re-exports brand from b.ts; we don't yet follow re-exports
    // through cross-file. Pins current behavior so a future "yes, follow"
    // change shows up as a diff.
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
    // Re-exports aren't folded yet → outer call drops.
    assert_yaml_snapshot!(shape(&run(&fs, &main, &src)), @"calls: []");
}
