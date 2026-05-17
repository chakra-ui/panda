use pandacss_extractor::{css_property_names, is_css_property};

#[test]
fn mdn_props_are_sorted() {
    assert!(
        css_property_names()
            .windows(2)
            .all(|pair| pair[0] < pair[1])
    );
}

#[test]
fn validates_css_prop_names() {
    assert!(is_css_property("backgroundColor"));
    assert!(is_css_property("WebkitLineClamp"));
    assert!(is_css_property("fill"));
    assert!(is_css_property("--color"));
    assert!(is_css_property("&:hover"));
    assert!(is_css_property("@media"));

    assert!(!is_css_property("background-color"));
    assert!(!is_css_property("madeUp"));
}
