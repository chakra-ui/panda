use pandacss_fs::base_dir;

#[test]
fn extracts_static_prefix_before_first_glob_token() {
    assert_eq!(base_dir("src/**/*.tsx"), "src");
    assert_eq!(base_dir("src/components/**/*.{ts,tsx}"), "src/components");
    assert_eq!(base_dir("**/*.tsx"), "");
    assert_eq!(base_dir("app/[id]/page.tsx"), "app");
    assert_eq!(base_dir("components/Button.tsx"), "components");
    assert_eq!(base_dir("index.ts"), "");
}

#[test]
fn strips_leading_dot_slash() {
    assert_eq!(base_dir("./src/**/*.tsx"), "src");
    assert_eq!(base_dir("./src/components/**/*.{ts,tsx}"), "src/components");
    assert_eq!(base_dir("./index.ts"), "");
}

#[test]
fn leaves_parent_dir_prefix_intact() {
    // Only `./` is stripped — `../` targets a tree above cwd and must survive.
    assert_eq!(base_dir("../shared/**/*.tsx"), "../shared");
    assert_eq!(base_dir("../../packages/ui/**/*.tsx"), "../../packages/ui");
}
