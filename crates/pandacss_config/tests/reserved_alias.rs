use pandacss_config::value_alias_name;

#[test]
fn value_alias_names_step_around_reserved_types() {
    for (property, expected) in [
        ("conditional", "ConditionalUtilityValue"),
        ("cssVar", "CssVarUtilityValue"),
        ("token", "TokenUtilityValue"),
        ("patternProperty", "PatternPropertyUtilityValue"),
        ("position", "PositionValue"),
        ("colors", "ColorsValue"),
    ] {
        assert_eq!(value_alias_name(property), expected, "for `{property}`");
    }
}
