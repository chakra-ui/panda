use pandacss_fs::{base_dir, relative_glob};

#[test]
fn strips_the_static_base_dir_prefix() {
    assert_eq!(relative_glob("src/**/*.tsx"), "**/*.tsx");
    assert_eq!(
        relative_glob("src/components/**/*.{ts,tsx}"),
        "**/*.{ts,tsx}"
    );
    assert_eq!(relative_glob("app/[id]/page.tsx"), "[id]/page.tsx");
    assert_eq!(relative_glob("components/Button.tsx"), "Button.tsx");
}

#[test]
fn returns_the_whole_pattern_when_there_is_no_base_dir() {
    assert_eq!(relative_glob("**/*.tsx"), "**/*.tsx");
    assert_eq!(relative_glob("index.ts"), "index.ts");
}

#[test]
fn strips_leading_dot_slash_before_rebasing() {
    assert_eq!(relative_glob("./src/**/*.tsx"), "**/*.tsx");
    assert_eq!(relative_glob("./index.ts"), "index.ts");
}

#[test]
fn rebases_parent_dir_globs_onto_their_base() {
    assert_eq!(relative_glob("../shared/**/*.tsx"), "**/*.tsx");
    assert_eq!(relative_glob("../../packages/ui/**/*.tsx"), "**/*.tsx");
}

#[test]
fn preserves_brace_and_char_class_groups_after_the_base() {
    assert_eq!(relative_glob("src/{a,b}/**/*.tsx"), "{a,b}/**/*.tsx");
    assert_eq!(
        relative_glob("src/**/*.{ts,tsx,js,jsx}"),
        "**/*.{ts,tsx,js,jsx}"
    );
    assert_eq!(relative_glob("app/**/[id]/page.tsx"), "**/[id]/page.tsx");
}

#[test]
fn base_dir_joined_with_relative_glob_reconstructs_the_pattern() {
    // The invariant a host relies on: subscribing to `base_dir` and matching
    // `relative_glob` under it must cover exactly the original pattern.
    for pattern in [
        "src/**/*.tsx",
        "src/components/**/*.{ts,tsx}",
        "./app/[id]/page.tsx",
        "components/Button.tsx",
        "**/*.tsx",
        "index.ts",
        "../shared/**/*.tsx",
    ] {
        let base = base_dir(pattern);
        let rejoined = if base.is_empty() {
            relative_glob(pattern).to_owned()
        } else {
            format!("{base}/{}", relative_glob(pattern))
        };
        assert_eq!(
            rejoined,
            pattern.trim_start_matches("./"),
            "pattern: {pattern}"
        );
    }
}
