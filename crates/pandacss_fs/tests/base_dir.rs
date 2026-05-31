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
