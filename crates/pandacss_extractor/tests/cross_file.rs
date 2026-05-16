//! Cross-file import resolution: `import { x } from './tokens'`
//! folds to the literal exported from the resolved file. Uses real
//! tempdir fixtures because the resolver hits the filesystem via
//! `oxc_resolver`.

use std::fs;
use std::path::{Path, PathBuf};

use pandacss_extractor::{
    CrossFileResolver, ExtractUsage, ExtractorConfig, Matcher, Matchers, NameMatcher, extract,
};
use insta::assert_yaml_snapshot;
use tempfile::TempDir;

fn matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        jsx: Some(Matcher {
            modules: vec!["@panda/jsx".into()],
            names: NameMatcher::only(["styled", "Box"]),
        }),
        ..Default::default()
    }
}

/// Build a temp project with `main.tsx` plus N sibling files. Returns
/// the project root + the absolute `main.tsx` path. Each fixture file
/// is created on disk so `oxc_resolver` can probe extensions.
fn project(main_source: &str, siblings: &[(&str, &str)]) -> (TempDir, PathBuf) {
    let dir = tempfile::tempdir().expect("tempdir");
    for (name, contents) in siblings {
        fs::write(dir.path().join(name), contents).expect("write sibling");
    }
    let main_path = dir.path().join("main.tsx");
    fs::write(&main_path, main_source).expect("write main");
    (dir, main_path)
}

fn run(main_path: &Path, source: &str) -> ExtractUsage {
    let config = ExtractorConfig::new(matchers()).with_cross_file(CrossFileResolver::new());
    extract(source, main_path.to_str().unwrap(), &config)
}

/// Snapshot-friendly: drop spans (they vary by source-position) and
/// keep just `name + data` so cross-file resolution is asserted on the
/// values that actually flowed through.
fn shape(result: &ExtractUsage) -> serde_json::Value {
    serde_json::json!({
        "calls": result
            .calls
            .iter()
            .map(|c| serde_json::json!({ "name": &c.name, "data": &c.data }))
            .collect::<Vec<_>>(),
    })
}

// --- happy paths ---

#[test]
fn named_const_import_resolves_to_value() {
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = fs::read_to_string(&main).unwrap();
    assert_yaml_snapshot!(shape(&run(&main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

#[test]
fn imported_object_folds_member_access() {
    let (_dir, main) = project(
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
    let src = fs::read_to_string(&main).unwrap();
    assert_yaml_snapshot!(shape(&run(&main, &src)), @r##"
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
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { brand as primary } from './tokens';
            import { css } from '@panda/css';
            css({ color: primary });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = fs::read_to_string(&main).unwrap();
    assert_yaml_snapshot!(shape(&run(&main, &src)), @r##"
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
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = fs::read_to_string(&main).unwrap();
    assert_yaml_snapshot!(shape(&run(&main, &src)), @r##"
    calls:
      - name: css
        data:
          - color: "#ef4444"
    "##);
}

// --- failure modes ---

#[test]
fn unresolvable_specifier_drops_outer_call() {
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { brand } from './does-not-exist';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[],
    );
    let src = fs::read_to_string(&main).unwrap();
    assert_yaml_snapshot!(shape(&run(&main, &src)), @"calls: []");
}

#[test]
fn missing_export_drops_outer_call() {
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { otherName } from './tokens';
            import { css } from '@panda/css';
            css({ color: otherName });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = fs::read_to_string(&main).unwrap();
    assert_yaml_snapshot!(shape(&run(&main, &src)), @"calls: []");
}

#[test]
fn export_let_currently_folds_too() {
    // `export let` is a `VariableDeclaration` and our top-level
    // collector folds any unmutated initializer regardless of `const`
    // vs `let`. Documenting the lax behavior: if a downstream emitter
    // needs strict const-only handling, the contract gets tightened.
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export let brand = '#ef4444';\n")],
    );
    let src = fs::read_to_string(&main).unwrap();
    assert_yaml_snapshot!(shape(&run(&main, &src)), @r##"
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
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = fs::read_to_string(&main).unwrap();
    let config = ExtractorConfig::new(matchers());
    let result = extract(&src, main.to_str().unwrap(), &config);
    assert_yaml_snapshot!(shape(&result), @"calls: []");
}

// --- cycles & repeated lookups ---

#[test]
fn cyclic_imports_drop_safely_without_panic() {
    // `a.ts` re-exports from `b.ts` which (contrived) imports back from
    // `a.ts`. The cycle guard returns `None` for the recursive case so
    // the resolver doesn't overflow the stack. Outcome shape is empty
    // because the chain can't fold; the contract is "doesn't crash".
    let (_dir, main) = project(
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
    let src = fs::read_to_string(&main).unwrap();
    // No assertion on output beyond "didn't crash and produced *some*
    // result"; we don't currently fold `export { x } from './…'`
    // re-exports, so the cycle path produces `calls: []`.
    assert_yaml_snapshot!(shape(&run(&main, &src)), @"calls: []");
}

#[test]
fn cache_reuses_across_multiple_extracts() {
    // Build one cross-file resolver, run extract() twice — the second
    // run should hit the cached tokens file. We don't observe the
    // cache directly; the contract is "two runs produce identical
    // output". A cache-invalidation regression would diverge.
    let (_dir, main) = project(
        indoc::indoc! {r"
            import { brand } from './tokens';
            import { css } from '@panda/css';
            css({ color: brand });
        "},
        &[("tokens.ts", "export const brand = '#ef4444';\n")],
    );
    let src = fs::read_to_string(&main).unwrap();
    let config = ExtractorConfig::new(matchers()).with_cross_file(CrossFileResolver::new());
    let a = extract(&src, main.to_str().unwrap(), &config);
    let b = extract(&src, main.to_str().unwrap(), &config);
    assert_eq!(shape(&a), shape(&b));
}
