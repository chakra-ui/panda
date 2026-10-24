#![cfg(all(feature = "os", not(target_arch = "wasm32")))]

use std::fs;
use std::path::PathBuf;

use oxc_resolver::FileSystem as OxcResolverFileSystem;
use pandacss_fs::{FileSystem, GlobOptions, OsFileSystem};

#[test]
fn read_write_roundtrip() {
    let tmp = tempfile::tempdir().unwrap();
    let path = tmp.path().join("x.ts");
    fs::write(&path, "hello").unwrap();

    let osfs = OsFileSystem::default();
    assert_eq!(osfs.read_to_string(&path).unwrap(), "hello");

    osfs.write(&path, b"updated").unwrap();
    assert_eq!(fs::read_to_string(&path).unwrap(), "updated");
}

#[test]
fn write_if_changed_preserves_mtime_for_identical_bytes() {
    let tmp = tempfile::tempdir().unwrap();
    let path = tmp.path().join("x.ts");
    fs::write(&path, "hello").unwrap();

    let osfs = OsFileSystem::default();
    let before = fs::metadata(&path).unwrap().modified().unwrap();
    std::thread::sleep(std::time::Duration::from_millis(20));

    assert!(!osfs.write_if_changed(&path, b"hello").unwrap());

    let after = fs::metadata(&path).unwrap().modified().unwrap();
    assert_eq!(before, after);

    std::thread::sleep(std::time::Duration::from_millis(20));
    assert!(osfs.write_if_changed(&path, b"updated").unwrap());
    assert_eq!(fs::read_to_string(&path).unwrap(), "updated");
    assert!(fs::metadata(&path).unwrap().modified().unwrap() > after);
}

#[test]
fn exists_and_read_dir() {
    let tmp = tempfile::tempdir().unwrap();
    fs::write(tmp.path().join("a.ts"), "").unwrap();
    fs::write(tmp.path().join("b.ts"), "").unwrap();

    let osfs = OsFileSystem::default();
    assert!(osfs.exists(tmp.path()));

    let mut entries = osfs.read_dir(tmp.path()).unwrap();
    entries.sort();
    assert_eq!(entries.len(), 2);
}

#[test]
fn glob_against_real_fs() {
    let tmp = tempfile::tempdir().unwrap();
    fs::create_dir_all(tmp.path().join("src/nested")).unwrap();
    fs::write(tmp.path().join("src/Button.tsx"), "").unwrap();
    fs::write(tmp.path().join("src/helpers.ts"), "").unwrap();
    fs::write(tmp.path().join("src/types.d.ts"), "").unwrap();
    fs::write(tmp.path().join("src/nested/Modal.tsx"), "").unwrap();

    let osfs = OsFileSystem::default();
    let opts = GlobOptions {
        include: vec!["src/**/*.{ts,tsx}".into()],
        cwd: tmp.path().to_path_buf(),
        absolute: true,
        ..Default::default()
    };
    let mut results: Vec<PathBuf> = osfs.glob(&opts).unwrap();
    results.sort();

    // Default exclude drops .d.ts
    assert!(
        !results
            .iter()
            .any(|p| p.to_string_lossy().ends_with(".d.ts"))
    );
    assert_eq!(results.len(), 3);
    assert!(results.iter().any(|p| p.ends_with("Button.tsx")));
    assert!(results.iter().any(|p| p.ends_with("helpers.ts")));
    assert!(results.iter().any(|p| p.ends_with("Modal.tsx")));
}

#[test]
fn glob_dot_slash_prefixed_include() {
    // A2 regression: `OsFileSystem::glob` has its own walk; `./src/**` must match
    // the same files as `src/**` here too, not just in the memory walker.
    let tmp = tempfile::tempdir().unwrap();
    fs::create_dir_all(tmp.path().join("src/nested")).unwrap();
    fs::write(tmp.path().join("src/Button.tsx"), "").unwrap();
    fs::write(tmp.path().join("src/nested/Modal.tsx"), "").unwrap();

    let osfs = OsFileSystem::default();
    let glob = |include: &str| {
        let mut r = osfs
            .glob(&GlobOptions {
                include: vec![include.into()],
                cwd: tmp.path().to_path_buf(),
                absolute: true,
                ..Default::default()
            })
            .unwrap();
        r.sort();
        r
    };

    assert_eq!(glob("./src/**/*.tsx"), glob("src/**/*.tsx"));
    assert_eq!(glob("./src/**/*.tsx").len(), 2);
}

#[test]
fn create_dir_all_and_remove_dir_all() {
    let tmp = tempfile::tempdir().unwrap();
    let nested = tmp.path().join("a/b/c");

    let osfs = OsFileSystem::default();
    osfs.create_dir_all(&nested).unwrap();
    assert!(nested.exists());

    osfs.remove_dir_all(&tmp.path().join("a")).unwrap();
    assert!(!tmp.path().join("a").exists());
}

#[test]
fn glob_monorepo_parent_dir_include_returns_normalized_paths() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("apps/demo/src")).unwrap();
    fs::create_dir_all(root.join("packages/ui/src")).unwrap();
    fs::write(root.join("apps/demo/src/App.tsx"), "").unwrap();
    fs::write(root.join("packages/ui/src/Card.tsx"), "").unwrap();

    let opts = GlobOptions {
        include: vec![
            "src/**/*.tsx".into(),
            "../../packages/ui/src/**/*.tsx".into(),
        ],
        cwd: root.join("apps/demo"),
        absolute: true,
        ..Default::default()
    };
    let mut results = OsFileSystem::default().glob(&opts).unwrap();
    results.sort();

    let card = root.join("packages/ui/src/Card.tsx");
    assert_eq!(
        results,
        vec![root.join("apps/demo/src/App.tsx"), card.clone()]
    );
    assert!(pandacss_fs::matches_globs(&card, &opts));
}

#[test]
fn glob_monorepo_absolute_include_outside_cwd() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("apps/demo")).unwrap();
    fs::create_dir_all(root.join("packages/ui/src")).unwrap();
    fs::write(root.join("packages/ui/src/Card.tsx"), "").unwrap();

    let include = format!("{}/packages/ui/src/**/*.tsx", root.display());
    let opts = GlobOptions {
        include: vec![include],
        cwd: root.join("apps/demo"),
        absolute: true,
        ..Default::default()
    };
    let card = root.join("packages/ui/src/Card.tsx");
    assert_eq!(
        OsFileSystem::default().glob(&opts).unwrap(),
        vec![card.clone()]
    );
    assert!(pandacss_fs::matches_globs(&card, &opts));
}

#[cfg(unix)]
#[test]
fn glob_sibling_packages_skips_linked_node_modules() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    let names: Vec<String> = (0..24).map(|i| format!("pkg{i:02}")).collect();
    for (i, name) in names.iter().enumerate() {
        let pkg = root.join(name);
        fs::create_dir_all(pkg.join("src")).unwrap();
        fs::create_dir_all(pkg.join("node_modules")).unwrap();
        fs::write(pkg.join("src/index.ts"), "").unwrap();
        for dep in &names[..i] {
            std::os::unix::fs::symlink(root.join(dep), pkg.join("node_modules").join(dep)).unwrap();
        }
    }

    let opts = GlobOptions {
        include: vec!["../*/src/*.ts".into()],
        cwd: root.join("pkg00"),
        absolute: true,
        ..Default::default()
    };
    let results = OsFileSystem::default().glob(&opts).unwrap();

    let expected: Vec<PathBuf> = names
        .iter()
        .map(|name| root.join(name).join("src/index.ts"))
        .collect();
    assert_eq!(results, expected);
}

#[cfg(unix)]
#[test]
fn glob_sibling_packages_ignores_symlink_cycle_in_node_modules() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("app/src")).unwrap();
    fs::create_dir_all(root.join("app/node_modules")).unwrap();
    fs::write(root.join("app/src/App.tsx"), "").unwrap();
    std::os::unix::fs::symlink(root.join("app"), root.join("app/node_modules/app")).unwrap();

    let opts = GlobOptions {
        include: vec!["../*/src/*.tsx".into()],
        cwd: root.join("app"),
        absolute: true,
        ..Default::default()
    };
    assert_eq!(
        OsFileSystem::default().glob(&opts).unwrap(),
        vec![root.join("app/src/App.tsx")]
    );
}

#[cfg(unix)]
fn link(target: &std::path::Path, link: &std::path::Path) {
    std::os::unix::fs::symlink(target, link).unwrap();
}

#[cfg(unix)]
#[test]
fn globstar_across_pnpm_links_reports_each_file_once() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    let names: Vec<String> = (0..24).map(|i| format!("pkg{i:02}")).collect();
    for (i, name) in names.iter().enumerate() {
        let pkg = root.join(name);
        fs::create_dir_all(pkg.join("src")).unwrap();
        fs::create_dir_all(pkg.join("node_modules")).unwrap();
        fs::write(pkg.join("src/index.ts"), "").unwrap();
        for dep in &names[..i] {
            link(&root.join(dep), &pkg.join("node_modules").join(dep));
        }
    }

    let opts = GlobOptions {
        include: vec!["../**/src/*.ts".into()],
        cwd: root.join("pkg00"),
        absolute: true,
        ..Default::default()
    };
    let expected: Vec<PathBuf> = names
        .iter()
        .map(|name| root.join(name).join("src/index.ts"))
        .collect();
    assert_eq!(OsFileSystem::default().glob(&opts).unwrap(), expected);
}

#[cfg(unix)]
#[test]
fn glob_follows_linked_folder_from_outside_the_project() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("app/src")).unwrap();
    fs::create_dir_all(root.join("shared/src")).unwrap();
    fs::write(root.join("app/src/App.ts"), "").unwrap();
    fs::write(root.join("shared/src/theme.ts"), "").unwrap();
    link(&root.join("shared/src"), &root.join("app/src/shared"));

    let opts = GlobOptions {
        include: vec!["src/**/*.ts".into()],
        cwd: root.join("app"),
        absolute: true,
        ..Default::default()
    };
    assert_eq!(
        OsFileSystem::default().glob(&opts).unwrap(),
        vec![
            root.join("app/src/App.ts"),
            root.join("app/src/shared/theme.ts"),
        ]
    );
}

#[cfg(unix)]
#[test]
fn glob_reports_file_behind_inner_link_under_its_real_path() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("src/components")).unwrap();
    fs::write(root.join("src/components/Button.ts"), "").unwrap();
    link(&root.join("src/components"), &root.join("src/alias"));

    let opts = GlobOptions {
        include: vec!["src/**/*.ts".into()],
        cwd: root.clone(),
        absolute: true,
        ..Default::default()
    };
    assert_eq!(
        OsFileSystem::default().glob(&opts).unwrap(),
        vec![root.join("src/components/Button.ts")]
    );
}

#[cfg(unix)]
#[test]
fn glob_follows_link_when_only_the_link_path_matches() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("app")).unwrap();
    fs::create_dir_all(root.join("lib/code")).unwrap();
    fs::write(root.join("lib/code/theme.ts"), "").unwrap();
    link(&root.join("lib/code"), &root.join("app/src"));

    let opts = GlobOptions {
        include: vec!["*/src/*.ts".into()],
        cwd: root.clone(),
        absolute: true,
        ..Default::default()
    };
    assert_eq!(
        OsFileSystem::default().glob(&opts).unwrap(),
        vec![root.join("app/src/theme.ts")]
    );
}

#[cfg(unix)]
#[test]
fn glob_includes_symlinked_file() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("src")).unwrap();
    fs::create_dir_all(root.join("vendor")).unwrap();
    fs::write(root.join("vendor/tokens.ts"), "").unwrap();
    link(&root.join("vendor/tokens.ts"), &root.join("src/tokens.ts"));

    let opts = GlobOptions {
        include: vec!["src/**/*.ts".into()],
        cwd: root.clone(),
        absolute: true,
        ..Default::default()
    };
    assert_eq!(
        OsFileSystem::default().glob(&opts).unwrap(),
        vec![root.join("src/tokens.ts")]
    );
}

#[cfg(unix)]
#[test]
fn globstar_ignores_symlink_cycle() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("src/nested")).unwrap();
    fs::write(root.join("src/nested/App.ts"), "").unwrap();
    link(&root.join("src"), &root.join("src/nested/back"));

    let opts = GlobOptions {
        include: vec!["src/**/*.ts".into()],
        cwd: root.clone(),
        absolute: true,
        ..Default::default()
    };
    assert_eq!(
        OsFileSystem::default().glob(&opts).unwrap(),
        vec![root.join("src/nested/App.ts")]
    );
}

#[test]
fn realpath_of_a_project_file_matches_the_path_node_reports() {
    let tmp = tempfile::tempdir().unwrap();
    let file = tmp.path().join("App.tsx");
    fs::write(&file, "export {}").unwrap();

    let real = OsFileSystem::default().canonicalize(&file).unwrap();

    assert!(
        !real.to_string_lossy().starts_with(r"\\?\"),
        "{}",
        real.display()
    );
    assert!(real.is_absolute());
    assert_eq!(real.file_name(), file.file_name());
    assert_eq!(fs::read_to_string(&real).unwrap(), "export {}");
}

/// Real temp dir on unix; Windows canonical paths add a `\\?\` globs can't express.
fn real_dir(path: &std::path::Path) -> PathBuf {
    if cfg!(windows) {
        path.to_path_buf()
    } else {
        path.canonicalize().unwrap()
    }
}

#[cfg(unix)]
#[test]
fn resolve_tracked_paths_maps_a_batch_back_through_symlinked_roots() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("real/src")).unwrap();
    fs::create_dir_all(root.join("shared")).unwrap();
    fs::write(root.join("real/src/a.tsx"), "").unwrap();
    fs::write(root.join("shared/b.tsx"), "").unwrap();
    fs::write(root.join("shared/c.tsx"), "").unwrap();
    // The project is opened through `app`, and its `linked` include root is itself a symlink.
    link(&root.join("real"), &root.join("app"));
    link(&root.join("shared"), &root.join("real/linked"));

    let osfs = OsFileSystem::default();
    let opts = GlobOptions {
        include: vec!["src/**/*.tsx".into(), "linked/**/*.tsx".into()],
        cwd: root.join("app"),
        ..Default::default()
    };
    let spelled = |path: &str| root.join(path).to_string_lossy().into_owned();
    let tracked = [
        spelled("app/src/a.tsx"),
        spelled("app/linked/b.tsx"),
        spelled("app/linked/c.tsx"),
    ];
    let is_tracked = |path: &str| tracked.iter().any(|known| known == path);

    // Real-path spellings from one batch map back under the symlinked cwd and include root.
    let resolved = pandacss_fs::resolve_tracked_paths(
        &osfs,
        &opts,
        vec![
            spelled("real/src/a.tsx"),
            spelled("shared/b.tsx"),
            spelled("shared/c.tsx"),
            spelled("shared/untracked.tsx"),
        ],
        is_tracked,
    );

    assert_eq!(
        resolved,
        [
            spelled("app/src/a.tsx"),
            spelled("app/linked/b.tsx"),
            spelled("app/linked/c.tsx"),
            spelled("shared/untracked.tsx"),
        ]
    );
}

#[cfg(unix)]
#[test]
fn source_globs_match_given_and_real_spellings() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    fs::create_dir_all(root.join("app/src")).unwrap();
    fs::create_dir_all(root.join("shared")).unwrap();
    fs::write(root.join("app/src/a.tsx"), "").unwrap();
    fs::write(root.join("app/src/a.test.tsx"), "").unwrap();
    fs::write(root.join("shared/b.tsx"), "").unwrap();
    fs::write(root.join("shared/b.test.tsx"), "").unwrap();
    fs::write(root.join("shared/b.css"), "").unwrap();
    link(&root.join("shared"), &root.join("app/linked"));

    let osfs = OsFileSystem::default();
    let globs = pandacss_fs::SourceGlobs::new(GlobOptions {
        include: vec!["src/**/*.tsx".into(), "linked/**/*.tsx".into()],
        exclude: vec!["**/*.test.tsx".into()],
        cwd: root.join("app"),
        ..Default::default()
    });

    for (path, expected) in [
        (root.join("app/src/a.tsx"), true),
        (PathBuf::from("src/a.tsx"), true),
        (root.join("app/src/a.test.tsx"), false),
        // Real spellings of files under the symlinked include root.
        (root.join("shared/b.tsx"), true),
        (root.join("shared/b.test.tsx"), false),
        (root.join("shared/b.css"), false),
    ] {
        assert_eq!(
            globs.matches_in(&osfs, &path),
            expected,
            "{}",
            path.display()
        );
    }
}

#[cfg(unix)]
#[test]
fn source_globs_follow_an_include_root_retargeted_after_they_were_built() {
    let tmp = tempfile::tempdir().unwrap();
    let root = real_dir(tmp.path());
    for dir in ["app", "v1/src", "v2/src"] {
        fs::create_dir_all(root.join(dir)).unwrap();
    }
    fs::write(root.join("v1/src/a.tsx"), "").unwrap();
    fs::write(root.join("v2/src/b.tsx"), "").unwrap();
    link(&root.join("v1"), &root.join("app/ui"));

    let osfs = OsFileSystem::default();
    let globs = pandacss_fs::SourceGlobs::new(GlobOptions {
        include: vec!["ui/src/**/*.tsx".into()],
        cwd: root.join("app"),
        ..Default::default()
    });
    assert!(globs.matches_in(&osfs, &root.join("v1/src/a.tsx")));
    assert!(!globs.matches_in(&osfs, &root.join("v2/src/b.tsx")));

    fs::remove_file(root.join("app/ui")).unwrap();
    link(&root.join("v2"), &root.join("app/ui"));

    assert!(!globs.matches_in(&osfs, &root.join("v1/src/a.tsx")));
    assert!(globs.matches_in(&osfs, &root.join("v2/src/b.tsx")));
}
