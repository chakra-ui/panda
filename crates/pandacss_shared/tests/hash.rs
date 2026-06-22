use pandacss_shared::{compound_class_name, to_hash};

#[test]
fn hashes_match_js_panda_hash() {
    assert_eq!(to_hash("spacing-sm"), "jolVMp");
    assert_eq!(to_hash("colors-red-500"), "iYfRb");
}

#[test]
fn compound_class_name_uses_readable_variant_pairs_when_unhashed() {
    assert_eq!(
        compound_class_name(
            "badge",
            &[("size", "md"), ("raised", "true")],
            None,
            "_",
            false,
        ),
        "badge--compound__raised_true__size_md"
    );
}

#[test]
fn compound_class_name_uses_configured_separator_when_unhashed() {
    assert_eq!(
        compound_class_name(
            "badge",
            &[("size", "md"), ("raised", "true")],
            None,
            "-",
            false,
        ),
        "badge--compound__raised-true__size-md"
    );
}

#[test]
fn compound_class_name_does_not_collide_with_single_variant_class() {
    assert_eq!(
        compound_class_name("badge", &[("size", "md")], None, "_", false),
        "badge--compound__size_md"
    );
}

#[test]
fn compound_class_name_hashes_canonical_pairs() {
    assert_eq!(
        compound_class_name(
            "badge",
            &[("size", "md"), ("raised", "true")],
            None,
            "_",
            true,
        ),
        format!("badge--{}", to_hash("raised=true,size=md"))
    );
}

#[test]
fn compound_class_name_preserves_author_class_name() {
    assert_eq!(
        compound_class_name("badge", &[("size", "md")], Some("custom"), "_", false),
        "custom"
    );
}
