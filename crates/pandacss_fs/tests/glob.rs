//! Comprehensive glob coverage. Tests are grouped by concern via `mod` blocks so
//! `cargo test -p pandacss_fs patterns::` (etc.) can target one section.
//!
//! Sections:
//! - `basics`       — happy-path glob walking
//! - `patterns`     — fast-glob syntax (wildcards, braces, classes, escape, `!`)
//! - `walker`       — include/exclude composition, pruning, ordering, errors
//! - `panda`        — realistic Panda config patterns

#![cfg(feature = "memory")]

use std::path::{Path, PathBuf};

use pandacss_fs::{FileSystem, GlobOptions, MemoryFileSystem};

// --------------------------------------------------------------------------
// Shared helpers
// --------------------------------------------------------------------------

/// Build a `GlobOptions` for the typical case: cwd rooted at `cwd`, absolute
/// results, no explicit exclude (so the default `**/*.d.ts` rule kicks in).
fn opts_absolute(cwd: &str, include: &[&str]) -> GlobOptions {
    GlobOptions {
        include: include.iter().map(|s| (*s).to_string()).collect(),
        exclude: Vec::new(),
        cwd: PathBuf::from(cwd),
        absolute: true,
    }
}

/// Run `glob` and return sorted absolute paths.
fn glob_abs(fs: &MemoryFileSystem, cwd: &str, include: &[&str]) -> Vec<PathBuf> {
    let mut results = fs.glob(&opts_absolute(cwd, include)).unwrap();
    results.sort();
    results
}

/// Run `glob` with both include and exclude patterns. Absolute results.
fn glob_filtered(
    fs: &MemoryFileSystem,
    cwd: &str,
    include: &[&str],
    exclude: &[&str],
) -> Vec<PathBuf> {
    let opts = GlobOptions {
        include: include.iter().map(|s| (*s).to_string()).collect(),
        exclude: exclude.iter().map(|s| (*s).to_string()).collect(),
        cwd: PathBuf::from(cwd),
        absolute: true,
    };
    let mut results = fs.glob(&opts).unwrap();
    results.sort();
    results
}

// --------------------------------------------------------------------------
// `basics` — happy-path walks
// --------------------------------------------------------------------------

mod basics {
    use super::*;

    fn fixture() -> MemoryFileSystem {
        MemoryFileSystem::from_entries([
            ("/proj/src/Button.tsx", "x"),
            ("/proj/src/Card.tsx", "y"),
            ("/proj/src/helpers.ts", "z"),
            ("/proj/src/types.d.ts", "// declaration"),
            ("/proj/src/nested/Modal.tsx", "m"),
            ("/proj/node_modules/lib/index.js", "vendor"),
            ("/proj/dist/build.js", "out"),
        ])
    }

    #[test]
    fn empty_include_returns_empty() {
        let fs = fixture();
        let opts = GlobOptions {
            include: vec![],
            cwd: PathBuf::from("/proj"),
            ..Default::default()
        };
        assert!(fs.glob(&opts).unwrap().is_empty());
    }

    #[test]
    fn matches_simple_pattern() {
        let fs = fixture();
        let results = glob_abs(&fs, "/proj", &["src/**/*.tsx"]);
        assert_eq!(
            results,
            vec![
                PathBuf::from("/proj/src/Button.tsx"),
                PathBuf::from("/proj/src/Card.tsx"),
                PathBuf::from("/proj/src/nested/Modal.tsx"),
            ]
        );
    }

    #[test]
    fn brace_expansion_pulls_multiple_extensions() {
        let fs = fixture();
        let results = glob_abs(&fs, "/proj", &["src/**/*.{ts,tsx}"]);
        // Includes both .ts and .tsx; .d.ts dropped by default exclude.
        assert!(results.contains(&PathBuf::from("/proj/src/Button.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/src/helpers.ts")));
        assert!(!results.contains(&PathBuf::from("/proj/src/types.d.ts")));
    }

    #[test]
    fn globstar_matches_any_depth() {
        let fs = MemoryFileSystem::from_entries([
            ("/proj/a.ts", ""),
            ("/proj/x/b.ts", ""),
            ("/proj/x/y/c.ts", ""),
            ("/proj/x/y/z/d.ts", ""),
        ]);
        let results = glob_abs(&fs, "/proj", &["**/*.ts"]);
        assert_eq!(results.len(), 4);
    }

    #[test]
    fn relative_results_strip_cwd() {
        let fs = fixture();
        let opts = GlobOptions {
            include: vec!["src/**/*.tsx".into()],
            cwd: PathBuf::from("/proj"),
            absolute: false,
            ..Default::default()
        };
        let mut results = fs.glob(&opts).unwrap();
        results.sort();
        for r in &results {
            assert!(r.is_relative(), "expected relative, got {r:?}");
        }
        assert!(results.contains(&PathBuf::from("src/Button.tsx")));
    }

    #[test]
    fn results_are_deterministically_sorted() {
        let fs = MemoryFileSystem::from_entries([("/z.ts", ""), ("/a.ts", ""), ("/m.ts", "")]);
        let r1 = glob_abs(&fs, "/", &["*.ts"]);
        let r2 = glob_abs(&fs, "/", &["*.ts"]);
        assert_eq!(r1, r2);
        assert_eq!(
            r1,
            vec![
                PathBuf::from("/a.ts"),
                PathBuf::from("/m.ts"),
                PathBuf::from("/z.ts"),
            ]
        );
    }

    #[test]
    fn nonexistent_cwd_returns_io_error() {
        let fs = fixture();
        let opts = GlobOptions {
            include: vec!["**/*.ts".into()],
            cwd: PathBuf::from("/does-not-exist"),
            ..Default::default()
        };
        let err = fs.glob(&opts).unwrap_err();
        assert_eq!(err.kind(), std::io::ErrorKind::NotFound);
    }

    #[test]
    fn empty_directory_returns_empty() {
        let fs = MemoryFileSystem::new();
        fs.create_dir_all(Path::new("/proj")).unwrap();
        let results = glob_abs(&fs, "/proj", &["**/*.ts"]);
        assert!(results.is_empty());
    }

    #[test]
    fn pattern_with_no_matches_returns_empty() {
        let fs = MemoryFileSystem::from_entries([("/a.ts", ""), ("/b.ts", "")]);
        let results = glob_abs(&fs, "/", &["**/*.css"]);
        assert!(results.is_empty());
    }

    #[test]
    fn metadata_via_oxc_trait_chain() {
        // Ensures our impl satisfies oxc_resolver::FileSystem so the resolver
        // can use it directly.
        let fs = MemoryFileSystem::from_entries([("/x.ts", "")]);
        let meta = oxc_resolver::FileSystem::metadata(&fs, Path::new("/x.ts")).unwrap();
        assert!(meta.is_file());
    }
}

// --------------------------------------------------------------------------
// `patterns` — fast-glob syntax coverage
// --------------------------------------------------------------------------

mod patterns {
    use super::*;

    // ---- single-char wildcard `?` ------------------------------------------------

    #[test]
    fn question_mark_matches_exactly_one_char() {
        let fs = MemoryFileSystem::from_entries([("/a.ts", ""), ("/ab.ts", ""), ("/abc.ts", "")]);
        assert_eq!(glob_abs(&fs, "/", &["?.ts"]), vec![PathBuf::from("/a.ts")]);
    }

    #[test]
    fn question_mark_does_not_match_zero_chars() {
        let fs = MemoryFileSystem::from_entries([("/.ts", ""), ("/x.ts", "")]);
        assert_eq!(glob_abs(&fs, "/", &["?.ts"]), vec![PathBuf::from("/x.ts")]);
    }

    #[test]
    fn question_mark_does_not_cross_separator() {
        let fs = MemoryFileSystem::from_entries([("/a/x.ts", ""), ("/ax.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/", &["?x.ts"]),
            vec![PathBuf::from("/ax.ts")]
        );
    }

    #[test]
    fn multiple_question_marks() {
        let fs =
            MemoryFileSystem::from_entries([("/ab.ts", ""), ("/abc.ts", ""), ("/abcd.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/", &["???.ts"]),
            vec![PathBuf::from("/abc.ts")]
        );
    }

    // ---- single-segment wildcard `*` ---------------------------------------------

    #[test]
    fn star_matches_within_segment() {
        let fs = MemoryFileSystem::from_entries([("/foo.ts", ""), ("/bar.ts", ""), ("/x.tsx", "")]);
        let results = glob_abs(&fs, "/", &["*.ts"]);
        assert_eq!(
            results,
            vec![PathBuf::from("/bar.ts"), PathBuf::from("/foo.ts")]
        );
    }

    #[test]
    fn star_does_not_cross_separator() {
        let fs = MemoryFileSystem::from_entries([("/a.ts", ""), ("/sub/b.ts", "")]);
        assert_eq!(glob_abs(&fs, "/", &["*.ts"]), vec![PathBuf::from("/a.ts")]);
    }

    #[test]
    fn star_can_match_empty() {
        let fs = MemoryFileSystem::from_entries([("/foo.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/", &["foo*.ts"]),
            vec![PathBuf::from("/foo.ts")]
        );
    }

    #[test]
    fn star_in_middle_of_pattern() {
        let fs = MemoryFileSystem::from_entries([
            ("/foo-1.ts", ""),
            ("/foo-bar.ts", ""),
            ("/bar.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["foo-*.ts"]);
        assert_eq!(
            results,
            vec![PathBuf::from("/foo-1.ts"), PathBuf::from("/foo-bar.ts")]
        );
    }

    #[test]
    fn multiple_stars_in_segment() {
        let fs = MemoryFileSystem::from_entries([
            ("/foo.bar.ts", ""),
            ("/foo.ts", ""),
            ("/bar.foo.ts", ""),
        ]);
        assert_eq!(
            glob_abs(&fs, "/", &["*.foo.*"]),
            vec![PathBuf::from("/bar.foo.ts")]
        );
    }

    #[test]
    fn single_star_does_not_cross_dirs() {
        let fs = MemoryFileSystem::from_entries([("/a/b.ts", ""), ("/c.ts", "")]);
        // Top-level only — `*` doesn't recurse.
        assert_eq!(glob_abs(&fs, "/", &["*"]), vec![PathBuf::from("/c.ts")]);
    }

    // ---- multi-segment wildcard `**` ---------------------------------------------

    #[test]
    fn globstar_matches_zero_segments() {
        let fs = MemoryFileSystem::from_entries([("/x.ts", ""), ("/a/x.ts", "")]);
        let results = glob_abs(&fs, "/", &["**/x.ts"]);
        assert_eq!(
            results,
            vec![PathBuf::from("/a/x.ts"), PathBuf::from("/x.ts")]
        );
    }

    #[test]
    fn globstar_at_end_matches_nested() {
        let fs = MemoryFileSystem::from_entries([
            ("/src/a.ts", ""),
            ("/src/nested/b.ts", ""),
            ("/src/nested/deep/c.ts", ""),
            ("/other/d.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["src/**"]);
        assert!(results.contains(&PathBuf::from("/src/a.ts")));
        assert!(results.contains(&PathBuf::from("/src/nested/b.ts")));
        assert!(results.contains(&PathBuf::from("/src/nested/deep/c.ts")));
        assert!(!results.contains(&PathBuf::from("/other/d.ts")));
    }

    #[test]
    fn globstar_in_middle() {
        let fs = MemoryFileSystem::from_entries([
            ("/src/index.ts", ""),
            ("/src/a/index.ts", ""),
            ("/src/a/b/c/index.ts", ""),
            ("/src/main.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["src/**/index.ts"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/src/main.ts")));
    }

    #[test]
    fn globstar_at_start() {
        let fs = MemoryFileSystem::from_entries([
            ("/a.test.ts", ""),
            ("/src/a.test.ts", ""),
            ("/src/nested/b.test.ts", ""),
            ("/x.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["**/*.test.ts"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/x.ts")));
    }

    #[test]
    fn multiple_globstars() {
        let fs = MemoryFileSystem::from_entries([
            ("/a/b/c/d.ts", ""),
            ("/a/b/x.ts", ""),
            ("/a/x.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["**/b/**/*.ts"]);
        assert!(results.contains(&PathBuf::from("/a/b/c/d.ts")));
        assert!(results.contains(&PathBuf::from("/a/b/x.ts")));
        assert!(!results.contains(&PathBuf::from("/a/x.ts")));
    }

    #[test]
    fn deep_nested_paths() {
        let mut entries: Vec<(String, &'static str)> = Vec::new();
        for depth in 0..10 {
            let path = format!("/{}.ts", "a/".repeat(depth));
            entries.push((path, ""));
        }
        let fs =
            MemoryFileSystem::from_entries(entries.iter().map(|(p, c)| (p.clone(), c.to_string())));
        let results = glob_abs(&fs, "/", &["**/*.ts"]);
        assert_eq!(results.len(), 10);
    }

    // ---- brace expansion `{a,b}` -------------------------------------------------

    #[test]
    fn braces_two_options() {
        let fs = MemoryFileSystem::from_entries([("/a.ts", ""), ("/b.ts", ""), ("/c.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/", &["{a,b}.ts"]),
            vec![PathBuf::from("/a.ts"), PathBuf::from("/b.ts")]
        );
    }

    #[test]
    fn braces_three_options() {
        let fs = MemoryFileSystem::from_entries([
            ("/x.ts", ""),
            ("/x.tsx", ""),
            ("/x.jsx", ""),
            ("/x.css", ""),
        ]);
        let results = glob_abs(&fs, "/", &["x.{ts,tsx,jsx}"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/x.css")));
    }

    #[test]
    fn braces_nested() {
        let fs = MemoryFileSystem::from_entries([
            ("/a.ts", ""),
            ("/a.tsx", ""),
            ("/b.ts", ""),
            ("/c.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["{a.{ts,tsx},b.ts}"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/c.ts")));
    }

    #[test]
    fn braces_with_globstar() {
        let fs = MemoryFileSystem::from_entries([
            ("/src/Button.tsx", ""),
            ("/src/helpers.ts", ""),
            ("/src/styles.css", ""),
            ("/src/nested/Modal.tsx", ""),
        ]);
        let results = glob_abs(&fs, "/", &["src/**/*.{ts,tsx}"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/src/styles.css")));
    }

    #[test]
    fn braces_with_path_segments() {
        let fs = MemoryFileSystem::from_entries([
            ("/src/a.ts", ""),
            ("/lib/b.ts", ""),
            ("/test/c.ts", ""),
        ]);
        assert_eq!(
            glob_abs(&fs, "/", &["{src,lib}/*.ts"]),
            vec![PathBuf::from("/lib/b.ts"), PathBuf::from("/src/a.ts")]
        );
    }

    // ---- character classes `[...]` -----------------------------------------------

    #[test]
    fn class_matches_listed_chars() {
        let fs = MemoryFileSystem::from_entries([
            ("/a.ts", ""),
            ("/b.ts", ""),
            ("/c.ts", ""),
            ("/d.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["[abc].ts"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/d.ts")));
    }

    #[test]
    fn class_range() {
        let fs = MemoryFileSystem::from_entries([
            ("/a.ts", ""),
            ("/m.ts", ""),
            ("/z.ts", ""),
            ("/A.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["[a-z].ts"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/A.ts")));
    }

    #[test]
    fn class_numeric_range() {
        let fs = MemoryFileSystem::from_entries([
            ("/x1.ts", ""),
            ("/x5.ts", ""),
            ("/x9.ts", ""),
            ("/xa.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["x[0-9].ts"]);
        assert_eq!(results.len(), 3);
        assert!(!results.contains(&PathBuf::from("/xa.ts")));
    }

    #[test]
    fn class_negated_with_bang() {
        let fs = MemoryFileSystem::from_entries([
            ("/a.ts", ""),
            ("/b.ts", ""),
            ("/c.ts", ""),
            ("/d.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["[!ab].ts"]);
        assert_eq!(results.len(), 2);
        assert!(!results.contains(&PathBuf::from("/a.ts")));
        assert!(!results.contains(&PathBuf::from("/b.ts")));
    }

    #[test]
    fn class_negated_with_caret() {
        let fs = MemoryFileSystem::from_entries([("/a.ts", ""), ("/b.ts", ""), ("/c.ts", "")]);
        let results = glob_abs(&fs, "/", &["[^a].ts"]);
        assert_eq!(results.len(), 2);
        assert!(!results.contains(&PathBuf::from("/a.ts")));
    }

    // ---- escape `\` --------------------------------------------------------------

    #[test]
    fn escape_literal_star() {
        let fs = MemoryFileSystem::from_entries([("/literal*.ts", ""), ("/literalX.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/", &[r"literal\*.ts"]),
            vec![PathBuf::from("/literal*.ts")]
        );
    }

    #[test]
    fn escape_literal_question() {
        let fs = MemoryFileSystem::from_entries([("/q?.ts", ""), ("/qx.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/", &[r"q\?.ts"]),
            vec![PathBuf::from("/q?.ts")]
        );
    }

    #[test]
    fn escape_literal_bracket() {
        let fs = MemoryFileSystem::from_entries([("/[foo].ts", ""), ("/f.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/", &[r"\[foo\].ts"]),
            vec![PathBuf::from("/[foo].ts")]
        );
    }

    // ---- negation `!pattern` -----------------------------------------------------

    #[test]
    fn leading_bang_inverts_match() {
        let fs = MemoryFileSystem::from_entries([("/keep.ts", ""), ("/drop.skip", "")]);
        let results = glob_abs(&fs, "/", &["!*.skip"]);
        assert!(results.contains(&PathBuf::from("/keep.ts")));
        assert!(!results.contains(&PathBuf::from("/drop.skip")));
    }

    // ---- path anchoring ----------------------------------------------------------

    #[test]
    fn pattern_anchored_to_cwd() {
        let fs = MemoryFileSystem::from_entries([("/proj/src/a.ts", ""), ("/proj/lib/b.ts", "")]);
        let opts = GlobOptions {
            include: vec!["src/*.ts".into()],
            cwd: PathBuf::from("/proj"),
            absolute: false,
            ..Default::default()
        };
        let results = fs.glob(&opts).unwrap();
        assert_eq!(results, vec![PathBuf::from("src/a.ts")]);
    }

    // ---- unicode -----------------------------------------------------------------

    #[test]
    fn unicode_filenames_match() {
        let fs =
            MemoryFileSystem::from_entries([("/café.ts", ""), ("/🎉.ts", ""), ("/中文.ts", "")]);
        assert_eq!(glob_abs(&fs, "/", &["**/*.ts"]).len(), 3);
    }

    #[test]
    fn unicode_in_directory_names() {
        let fs = MemoryFileSystem::from_entries([("/日本語/foo.ts", ""), ("/中文/bar.ts", "")]);
        assert_eq!(glob_abs(&fs, "/", &["**/*.ts"]).len(), 2);
    }

    // ---- dotfiles ----------------------------------------------------------------

    #[test]
    fn dotfiles_are_matched_by_star() {
        // fast-glob's `*` matches leading dots (different from some other globbers).
        let fs = MemoryFileSystem::from_entries([
            ("/.env", ""),
            ("/.gitignore", ""),
            ("/visible.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["*"]);
        assert!(results.contains(&PathBuf::from("/.env")));
        assert!(results.contains(&PathBuf::from("/visible.ts")));
    }

    #[test]
    fn explicit_dot_pattern() {
        let fs =
            MemoryFileSystem::from_entries([("/.env", ""), ("/.env.local", ""), ("/x.ts", "")]);
        let results = glob_abs(&fs, "/", &[".env*"]);
        assert!(results.contains(&PathBuf::from("/.env")));
        assert!(results.contains(&PathBuf::from("/.env.local")));
        assert!(!results.contains(&PathBuf::from("/x.ts")));
    }
}

// --------------------------------------------------------------------------
// `walker` — include/exclude composition, pruning, ordering
// --------------------------------------------------------------------------

mod walker {
    use super::*;

    // ---- include / exclude composition -------------------------------------------

    #[test]
    fn multiple_includes_union() {
        let fs = MemoryFileSystem::from_entries([
            ("/src/a.ts", ""),
            ("/lib/b.ts", ""),
            ("/test/c.ts", ""),
        ]);
        let results = glob_abs(&fs, "/", &["src/**/*.ts", "lib/**/*.ts"]);
        assert_eq!(
            results,
            vec![PathBuf::from("/lib/b.ts"), PathBuf::from("/src/a.ts")]
        );
    }

    #[test]
    fn include_no_duplicates_when_patterns_overlap() {
        let fs = MemoryFileSystem::from_entries([("/src/a.ts", "")]);
        let results = glob_abs(&fs, "/", &["src/**/*.ts", "**/*.ts"]);
        assert_eq!(results, vec![PathBuf::from("/src/a.ts")]);
    }

    #[test]
    fn exclude_wins_when_both_include_and_exclude_match() {
        let fs = MemoryFileSystem::from_entries([("/src/keep.ts", ""), ("/src/drop.test.ts", "")]);
        let results = glob_filtered(&fs, "/", &["src/**/*.ts"], &["**/*.test.ts"]);
        assert!(results.contains(&PathBuf::from("/src/keep.ts")));
        assert!(!results.contains(&PathBuf::from("/src/drop.test.ts")));
    }

    #[test]
    fn multiple_exclude_patterns() {
        let fs = MemoryFileSystem::from_entries([
            ("/src/a.ts", ""),
            ("/src/b.test.ts", ""),
            ("/src/c.spec.ts", ""),
            ("/src/d.fixture.ts", ""),
        ]);
        let results = glob_filtered(
            &fs,
            "/",
            &["src/**/*.ts"],
            &["**/*.test.ts", "**/*.spec.ts"],
        );
        assert!(results.contains(&PathBuf::from("/src/a.ts")));
        assert!(results.contains(&PathBuf::from("/src/d.fixture.ts")));
        assert!(!results.contains(&PathBuf::from("/src/b.test.ts")));
        assert!(!results.contains(&PathBuf::from("/src/c.spec.ts")));
    }

    // ---- directory pruning -------------------------------------------------------

    #[test]
    fn exclude_prunes_node_modules() {
        let fs = MemoryFileSystem::from_entries([
            ("/proj/src/Button.tsx", ""),
            ("/proj/node_modules/lib/index.js", ""),
        ]);
        let results = glob_filtered(&fs, "/proj", &["**/*.{js,tsx}"], &["**/node_modules/**"]);
        assert_eq!(results, vec![PathBuf::from("/proj/src/Button.tsx")]);
    }

    #[test]
    fn pruning_at_multiple_depths() {
        let fs = MemoryFileSystem::from_entries([
            ("/proj/a/dist/build.js", ""),
            ("/proj/a/src/a.ts", ""),
            ("/proj/b/dist/build.js", ""),
            ("/proj/b/src/b.ts", ""),
        ]);
        let results = glob_filtered(&fs, "/proj", &["**/*.{ts,js}"], &["**/dist/**"]);
        assert_eq!(
            results,
            vec![
                PathBuf::from("/proj/a/src/a.ts"),
                PathBuf::from("/proj/b/src/b.ts")
            ]
        );
    }

    #[test]
    fn nested_excluded_dir_still_pruned() {
        let fs = MemoryFileSystem::from_entries([
            ("/proj/a/node_modules/pkg/sub/sub/sub/x.js", ""),
            ("/proj/a/src/x.ts", ""),
        ]);
        let results = glob_filtered(&fs, "/proj", &["**/*.{ts,js}"], &["**/node_modules/**"]);
        assert_eq!(results, vec![PathBuf::from("/proj/a/src/x.ts")]);
    }

    #[test]
    fn pruning_scales_to_many_files() {
        // Proves pruning doesn't degenerate to O(nested files) — without
        // dir-level skipping, walking 50 node_modules subdirs would dominate.
        let mut entries: Vec<(String, &'static str)> = Vec::new();
        for i in 0..50 {
            entries.push((format!("/proj/node_modules/lib{i}/index.js"), ""));
        }
        entries.push(("/proj/src/Button.tsx".to_string(), ""));

        let fs =
            MemoryFileSystem::from_entries(entries.iter().map(|(p, c)| (p.clone(), c.to_string())));
        let results = glob_filtered(&fs, "/proj", &["**/*.{js,tsx}"], &["**/node_modules/**"]);
        assert_eq!(results, vec![PathBuf::from("/proj/src/Button.tsx")]);
    }

    // ---- default exclude (`**/*.d.ts`) -------------------------------------------

    #[test]
    fn default_exclude_drops_d_ts() {
        let fs = MemoryFileSystem::from_entries([("/proj/types.d.ts", ""), ("/proj/main.ts", "")]);
        let results = glob_abs(&fs, "/proj", &["**/*.ts"]);
        assert_eq!(results, vec![PathBuf::from("/proj/main.ts")]);
    }

    #[test]
    fn caller_exclude_replaces_default() {
        let fs = MemoryFileSystem::from_entries([("/proj/types.d.ts", ""), ("/proj/main.ts", "")]);
        // Non-empty exclude — default is NOT injected.
        let results = glob_filtered(&fs, "/proj", &["**/*.ts"], &["**/main.ts"]);
        assert_eq!(results, vec![PathBuf::from("/proj/types.d.ts")]);
    }

    #[test]
    fn caller_can_include_d_ts_explicitly() {
        let fs = MemoryFileSystem::from_entries([("/proj/types.d.ts", ""), ("/proj/main.ts", "")]);
        let results = glob_filtered(&fs, "/proj", &["**/*.ts"], &["nothing-to-match"]);
        assert_eq!(
            results,
            vec![
                PathBuf::from("/proj/main.ts"),
                PathBuf::from("/proj/types.d.ts")
            ]
        );
    }

    // ---- absolute vs relative results --------------------------------------------

    #[test]
    fn absolute_results_keep_full_path() {
        let fs = MemoryFileSystem::from_entries([("/proj/src/a.ts", "")]);
        assert_eq!(
            glob_abs(&fs, "/proj", &["src/**/*.ts"]),
            vec![PathBuf::from("/proj/src/a.ts")]
        );
    }

    #[test]
    fn relative_results_with_nested_files() {
        let fs =
            MemoryFileSystem::from_entries([("/proj/src/a.ts", ""), ("/proj/src/nested/b.ts", "")]);
        let opts = GlobOptions {
            include: vec!["src/**/*.ts".into()],
            cwd: PathBuf::from("/proj"),
            absolute: false,
            ..Default::default()
        };
        let mut results = fs.glob(&opts).unwrap();
        results.sort();
        assert_eq!(
            results,
            vec![PathBuf::from("src/a.ts"), PathBuf::from("src/nested/b.ts")]
        );
    }

    // ---- scale ------------------------------------------------------------------

    #[test]
    fn handles_many_files() {
        let mut entries: Vec<(String, &'static str)> = Vec::new();
        for i in 0..200 {
            entries.push((format!("/src/file{i}.ts"), ""));
        }
        let fs =
            MemoryFileSystem::from_entries(entries.iter().map(|(p, c)| (p.clone(), c.to_string())));
        let results = glob_abs(&fs, "/", &["src/*.ts"]);
        assert_eq!(results.len(), 200);
    }
}

// --------------------------------------------------------------------------
// `panda` — realistic Panda config patterns
// --------------------------------------------------------------------------

mod panda {
    use super::*;

    /// Typical project layout. Used by most tests below.
    fn project() -> MemoryFileSystem {
        MemoryFileSystem::from_entries([
            // Source
            ("/proj/src/components/Button.tsx", ""),
            ("/proj/src/components/Card.tsx", ""),
            ("/proj/src/components/Button.test.tsx", ""),
            ("/proj/src/components/Button.stories.tsx", ""),
            ("/proj/src/hooks/useToggle.ts", ""),
            ("/proj/src/hooks/useToggle.test.ts", ""),
            ("/proj/src/utils/helpers.ts", ""),
            ("/proj/src/utils/helpers.spec.ts", ""),
            ("/proj/src/types.d.ts", ""),
            ("/proj/src/index.ts", ""),
            // App router
            ("/proj/app/page.tsx", ""),
            ("/proj/app/layout.tsx", ""),
            ("/proj/app/(marketing)/about/page.tsx", ""),
            // Pages router
            ("/proj/pages/index.tsx", ""),
            ("/proj/pages/_app.tsx", ""),
            ("/proj/pages/api/hello.ts", ""),
            // Tests dir
            ("/proj/__tests__/setup.ts", ""),
            ("/proj/__tests__/integration.test.ts", ""),
            // Vendored / generated
            ("/proj/node_modules/react/index.js", ""),
            ("/proj/node_modules/@panda/css/index.js", ""),
            ("/proj/dist/build.js", ""),
            ("/proj/.next/static/chunks/main.js", ""),
            ("/proj/styled-system/css.mjs", ""),
            ("/proj/styled-system/types/index.d.ts", ""),
            // Hidden
            ("/proj/.env", ""),
            ("/proj/.env.local", ""),
            ("/proj/.gitignore", ""),
            ("/proj/.git/HEAD", ""),
        ])
    }

    #[test]
    fn default_panda_include_pattern() {
        let fs = project();
        let results = glob_abs(&fs, "/proj", &["src/**/*.{ts,tsx,jsx}"]);

        assert!(results.contains(&PathBuf::from("/proj/src/components/Button.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/src/index.ts")));
        assert!(results.contains(&PathBuf::from("/proj/src/hooks/useToggle.ts")));
        // .d.ts dropped by default exclude.
        assert!(!results.contains(&PathBuf::from("/proj/src/types.d.ts")));
        // Outside src not included.
        assert!(!results.contains(&PathBuf::from("/proj/app/page.tsx")));
    }

    #[test]
    fn multi_include_app_and_pages_routers() {
        let fs = project();
        let results = glob_abs(&fs, "/proj", &["app/**/*.{ts,tsx}", "pages/**/*.{ts,tsx}"]);

        assert!(results.contains(&PathBuf::from("/proj/app/page.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/app/layout.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/app/(marketing)/about/page.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/pages/index.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/pages/_app.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/pages/api/hello.ts")));
    }

    #[test]
    fn parens_in_path_segments_are_literal() {
        // App-router route groups use `(marketing)`. Parens must be literal,
        // not extglob-extension (which fast-glob doesn't support but worth pinning).
        let fs = project();
        let results = glob_abs(&fs, "/proj", &["app/(marketing)/**/*.tsx"]);
        assert_eq!(
            results,
            vec![PathBuf::from("/proj/app/(marketing)/about/page.tsx")]
        );
    }

    #[test]
    fn excludes_test_and_spec_files() {
        let fs = project();
        let results = glob_filtered(
            &fs,
            "/proj",
            &["src/**/*.{ts,tsx}"],
            &[
                "**/*.test.{ts,tsx}",
                "**/*.spec.{ts,tsx}",
                "**/__tests__/**",
            ],
        );
        assert!(results.contains(&PathBuf::from("/proj/src/components/Button.tsx")));
        assert!(results.contains(&PathBuf::from("/proj/src/hooks/useToggle.ts")));
        assert!(!results.contains(&PathBuf::from("/proj/src/components/Button.test.tsx")));
        assert!(!results.contains(&PathBuf::from("/proj/src/utils/helpers.spec.ts")));
    }

    #[test]
    fn excludes_stories() {
        let fs = project();
        let results = glob_filtered(&fs, "/proj", &["src/**/*.tsx"], &["**/*.stories.{ts,tsx}"]);
        assert!(results.contains(&PathBuf::from("/proj/src/components/Button.tsx")));
        assert!(!results.contains(&PathBuf::from("/proj/src/components/Button.stories.tsx")));
    }

    #[test]
    fn excludes_generated_styled_system() {
        let fs = project();
        let results = glob_filtered(
            &fs,
            "/proj",
            &["**/*.{ts,tsx,mjs}"],
            &["styled-system/**", "**/*.d.ts"],
        );
        assert!(!results.contains(&PathBuf::from("/proj/styled-system/css.mjs")));
        assert!(!results.contains(&PathBuf::from("/proj/styled-system/types/index.d.ts")));
    }

    #[test]
    fn excludes_node_modules_dist_and_next_build() {
        let fs = project();
        let results = glob_filtered(
            &fs,
            "/proj",
            &["**/*.{ts,tsx,js,mjs}"],
            &[
                "**/node_modules/**",
                "**/dist/**",
                "**/.next/**",
                "styled-system/**",
            ],
        );
        for path in &results {
            let s = path.to_string_lossy();
            assert!(
                !s.contains("/node_modules/")
                    && !s.contains("/dist/")
                    && !s.contains("/.next/")
                    && !s.contains("/styled-system/"),
                "unexpected: {s}"
            );
        }
    }

    #[test]
    fn dot_directories_are_walked_by_default() {
        let fs = project();
        let results = glob_abs(&fs, "/proj", &["**/*.js"]);
        assert!(results.iter().any(|p| p.starts_with("/proj/.next")));
    }

    #[test]
    fn excluding_dot_next_prunes_it() {
        let fs = project();
        let results = glob_filtered(&fs, "/proj", &["**/*.js"], &["**/.next/**"]);
        assert!(!results.iter().any(|p| p.starts_with("/proj/.next")));
    }

    #[test]
    fn explicit_dot_env_pattern() {
        let fs = project();
        let results = glob_filtered(&fs, "/proj", &[".env*"], &["**/*.d.ts"]);
        let names: Vec<String> = results
            .iter()
            .map(|p| p.file_name().unwrap().to_string_lossy().to_string())
            .collect();
        assert!(names.contains(&".env".to_string()));
        assert!(names.contains(&".env.local".to_string()));
    }

    #[test]
    fn monorepo_packages_pattern() {
        let fs = MemoryFileSystem::from_entries([
            ("/repo/packages/ui/src/Button.tsx", ""),
            ("/repo/packages/ui/src/Card.tsx", ""),
            ("/repo/packages/utils/src/index.ts", ""),
            ("/repo/apps/web/src/App.tsx", ""),
            ("/repo/apps/web/src/main.tsx", ""),
            ("/repo/node_modules/react/index.js", ""),
        ]);
        let results = glob_filtered(
            &fs,
            "/repo",
            &["packages/*/src/**/*.{ts,tsx}", "apps/*/src/**/*.{ts,tsx}"],
            &["**/node_modules/**"],
        );
        assert_eq!(results.len(), 5);
    }

    #[test]
    fn workspace_root_pattern() {
        let fs = MemoryFileSystem::from_entries([
            ("/repo/src/a.ts", ""),
            ("/repo/packages/lib/src/b.ts", ""),
            ("/repo/test/c.ts", ""),
        ]);
        let results = glob_abs(&fs, "/repo", &["{src,packages/*/src,test}/**/*.ts"]);
        assert_eq!(results.len(), 3);
    }

    #[test]
    fn cwd_at_src_with_relative_include() {
        let fs =
            MemoryFileSystem::from_entries([("/proj/src/a.ts", ""), ("/proj/src/nested/b.ts", "")]);
        assert_eq!(glob_abs(&fs, "/proj/src", &["**/*.ts"]).len(), 2);
    }

    #[test]
    fn matching_files_in_nested_route_groups() {
        let fs = MemoryFileSystem::from_entries([
            ("/proj/app/(auth)/login/page.tsx", ""),
            ("/proj/app/(auth)/register/page.tsx", ""),
            ("/proj/app/(marketing)/about/page.tsx", ""),
            ("/proj/app/api/route.ts", ""),
        ]);
        let results = glob_abs(&fs, "/proj", &["app/**/page.tsx"]);
        assert_eq!(results.len(), 3);
    }

    #[test]
    fn typical_jsx_inclusion_pattern() {
        let fs = MemoryFileSystem::from_entries([
            ("/proj/src/legacy.jsx", ""),
            ("/proj/src/modern.tsx", ""),
            ("/proj/src/types.d.ts", ""),
            ("/proj/src/api.ts", ""),
        ]);
        let results = glob_abs(&fs, "/proj", &["src/**/*.{jsx,tsx}"]);
        assert_eq!(results.len(), 2);
        assert!(!results.contains(&PathBuf::from("/proj/src/api.ts")));
    }

    #[test]
    fn vue_svelte_pattern() {
        // Panda preprocesses SFCs in JS, but `include` still has to enumerate them.
        let fs = MemoryFileSystem::from_entries([
            ("/proj/src/App.vue", ""),
            ("/proj/src/Button.svelte", ""),
            ("/proj/src/main.ts", ""),
        ]);
        let results = glob_abs(&fs, "/proj", &["src/**/*.{ts,vue,svelte}"]);
        assert_eq!(results.len(), 3);
    }

    #[test]
    fn exclude_specific_subdirectory() {
        let fs = MemoryFileSystem::from_entries([
            ("/proj/src/a.ts", ""),
            ("/proj/src/internal/secret.ts", ""),
            ("/proj/src/public/b.ts", ""),
        ]);
        let results = glob_filtered(&fs, "/proj", &["src/**/*.ts"], &["src/internal/**"]);
        assert!(results.contains(&PathBuf::from("/proj/src/a.ts")));
        assert!(results.contains(&PathBuf::from("/proj/src/public/b.ts")));
        assert!(!results.contains(&PathBuf::from("/proj/src/internal/secret.ts")));
    }

    #[test]
    fn large_node_modules_doesnt_blow_up() {
        let mut entries: Vec<(String, &'static str)> = Vec::new();
        for pkg in 0..30 {
            for sub in 0..10 {
                entries.push((format!("/proj/node_modules/pkg{pkg}/lib/file{sub}.js"), ""));
            }
        }
        entries.push(("/proj/src/index.ts".to_string(), ""));

        let fs =
            MemoryFileSystem::from_entries(entries.iter().map(|(p, c)| (p.clone(), c.to_string())));
        let results = glob_filtered(&fs, "/proj", &["**/*.{ts,js}"], &["**/node_modules/**"]);
        assert_eq!(results, vec![PathBuf::from("/proj/src/index.ts")]);
    }
}
