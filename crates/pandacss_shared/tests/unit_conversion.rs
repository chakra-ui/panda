use pandacss_shared::to_rem;

#[test]
fn converts_px_to_rem() {
    assert_eq!(to_rem("768px"), "48rem");
    assert_eq!(to_rem("960px"), "60rem");
}

#[test]
fn passes_through_rem() {
    assert_eq!(to_rem("48rem"), "48rem");
    assert_eq!(to_rem("40rem"), "40rem");
}

#[test]
fn converts_em_to_rem() {
    assert_eq!(to_rem("1em"), "1rem");
    assert_eq!(to_rem("2.5em"), "2.5rem");
}

#[test]
fn leaves_unknown_units_unchanged() {
    assert_eq!(to_rem("100%"), "100%");
    assert_eq!(to_rem("10vh"), "10vh");
}
