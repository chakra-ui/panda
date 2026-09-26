use pandacss_compiler::HookFilter;
use serde_json::json;

#[test]
fn hook_filter_admits_by_id_and_code() {
    let filter = HookFilter::from_json(&json!({
        "id": {
            "include": ["src/**/*.vue", { "kind": "regex", "source": "\\.astro$", "flags": "" }],
            "exclude": ["src/vendor/**"]
        },
        "code": {
            "include": { "kind": "regex", "source": "css\\(", "flags": "" },
            "exclude": "no-panda"
        }
    }))
    .expect("valid filter");

    assert!(filter.admits("src/App.vue", "css({ color: 'red' })"));
    assert!(filter.admits("src/page.astro", "css({ color: 'red' })"));
    assert!(!filter.admits("src/App.tsx", "css({ color: 'red' })"));
    assert!(!filter.admits("src/vendor/App.vue", "css({ color: 'red' })"));
    assert!(!filter.admits("src/App.vue", "console.log('no panda')"));
    assert!(!filter.admits("src/App.vue", "no-panda; css({ color: 'red' })"));
}
