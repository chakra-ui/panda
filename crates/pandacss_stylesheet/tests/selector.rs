use pandacss_stylesheet::{
    PREFLIGHT_ROOT, ScopeMode, scope_selector, split_selector_list,
};

#[test]
fn split_respects_parentheses_and_brackets() {
    assert_eq!(
        split_selector_list("button, input:where([type='button'], [type='reset'])"),
        vec!["button", "input:where([type='button'], [type='reset'])"]
    );
}

#[test]
fn split_respects_escapes() {
    assert_eq!(split_selector_list(r"a\,, b"), vec![r"a\,", "b"]);
}

#[test]
fn split_respects_commas_inside_attribute_values() {
    assert_eq!(
        split_selector_list(r#"a[data-x="a,b"], b"#),
        vec![r#"a[data-x="a,b"]"#, "b"]
    );
}

#[test]
fn split_keeps_chained_functional_pseudos_intact() {
    assert_eq!(
        split_selector_list(r#"table[rules]:not([rules="none"]):not([rules=""])""#),
        vec![r#"table[rules]:not([rules="none"]):not([rules=""])""#]
    );
}

#[test]
fn parent_scope_prefixes_each_part() {
    assert_eq!(
        scope_selector("*, ::before, ::after", ".pd-reset", ScopeMode::Parent),
        ".pd-reset *, .pd-reset ::before, .pd-reset ::after"
    );
}

#[test]
fn parent_scope_preserves_where_internal_commas() {
    assert_eq!(
        scope_selector(
            "input:where([type='button'], [type='reset'])",
            ".pd-reset",
            ScopeMode::Parent
        ),
        ".pd-reset input:where([type='button'], [type='reset'])"
    );
}

#[test]
fn parent_scope_preserves_hidden_where_selector() {
    assert_eq!(
        scope_selector(
            "[hidden]:where(:not([hidden='until-found']))",
            ".pd-reset",
            ScopeMode::Parent
        ),
        ".pd-reset [hidden]:where(:not([hidden='until-found']))"
    );
}

#[test]
fn element_scope_collapses_preflight_root() {
    assert_eq!(
        scope_selector(PREFLIGHT_ROOT, ".pd-reset", ScopeMode::Element),
        ".pd-reset"
    );
}

#[test]
fn element_scope_compounds_multi_part_lists() {
    assert_eq!(
        scope_selector("*, ::before, ::after", ".pd-reset", ScopeMode::Element),
        "*.pd-reset, .pd-reset ::before, .pd-reset ::after"
    );
}

#[test]
fn element_scope_peels_trailing_pseudo_from_single_selector() {
    assert_eq!(
        scope_selector("::selection", ".pd-reset", ScopeMode::Element),
        ".pd-reset ::selection"
    );
}

#[test]
fn element_scope_peels_shared_trailing_pseudos() {
    assert_eq!(
        scope_selector("button::before, a::before", ".pd-reset", ScopeMode::Element),
        ".pd-reset button, a::before"
    );
}

#[test]
fn element_scope_peels_chained_trailing_pseudos() {
    assert_eq!(
        scope_selector("button::before::after", ".pd-reset", ScopeMode::Element),
        ".pd-reset button::before::after"
    );
}

#[test]
fn element_scope_peels_after_pseudo_class() {
    assert_eq!(
        scope_selector("button:not(:focus)::before", ".pd-reset", ScopeMode::Element),
        ".pd-reset button:not(:focus)::before"
    );
}

#[test]
fn element_scope_compounds_when_trailing_pseudos_differ() {
    assert_eq!(
        scope_selector(
            "::-webkit-search-decoration, ::-webkit-search-cancel-button",
            ".pd-reset",
            ScopeMode::Element
        ),
        ".pd-reset ::-webkit-search-decoration, .pd-reset ::-webkit-search-cancel-button"
    );
}

#[test]
fn element_scope_compounds_multi_part_pseudo_element_lists() {
    assert_eq!(
        scope_selector(
            "::-webkit-search-decoration, ::-webkit-search-cancel-button",
            ".pd-reset",
            ScopeMode::Element
        ),
        ".pd-reset ::-webkit-search-decoration, .pd-reset ::-webkit-search-cancel-button"
    );
}

#[test]
fn element_scope_handles_vendor_pseudo_in_compound() {
    assert_eq!(
        scope_selector("input:-moz-focusring", ".pd-reset", ScopeMode::Element),
        "input:-moz-focusring.pd-reset"
    );
}

#[test]
fn element_scope_preserves_where_functional_pseudo() {
    assert_eq!(
        scope_selector(
            "button:where([type='button'], [type='reset'])",
            ".pd-reset",
            ScopeMode::Element
        ),
        "button:where([type='button'], [type='reset']).pd-reset"
    );
}

#[test]
fn element_scope_compounds_when_pseudo_is_nested_in_not() {
    assert_eq!(
        scope_selector(":not(::before)", ".pd-reset", ScopeMode::Element),
        ":not(::before).pd-reset"
    );
}

#[test]
fn element_scope_does_not_peel_when_only_one_part_has_trailing_pseudo() {
    assert_eq!(
        scope_selector("button::before, a", ".pd-reset", ScopeMode::Element),
        "button::before.pd-reset, a.pd-reset"
    );
}

#[test]
fn element_scope_compounds_preflight_file_selector_in_mixed_list() {
    assert_eq!(
        scope_selector(
            "button, input:where([type='button'], [type='reset'], [type='submit']), ::file-selector-button",
            ".pd-reset",
            ScopeMode::Element
        ),
        "button.pd-reset, input:where([type='button'], [type='reset'], [type='submit']).pd-reset, .pd-reset ::file-selector-button"
    );
}

#[test]
fn element_scope_peels_file_selector_when_shared() {
    assert_eq!(
        scope_selector(
            "button::file-selector-button, input::file-selector-button",
            ".pd-reset",
            ScopeMode::Element
        ),
        ".pd-reset button, input::file-selector-button"
    );
}
