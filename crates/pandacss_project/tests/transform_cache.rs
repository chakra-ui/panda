use pandacss_project::{ExtractedLiteral as Literal, literal_cache_key};

#[test]
fn equivalent_literal_trees_produce_equal_cache_keys() {
    let first = Literal::Object(vec![
        ("gap".to_owned(), Literal::String("4".to_owned())),
        (
            "_hover".to_owned(),
            Literal::Object(vec![(
                "color".to_owned(),
                Literal::String("red".to_owned()),
            )]),
        ),
        (
            "fallback".to_owned(),
            Literal::Conditional(vec![Literal::Bool(true), Literal::Null]),
        ),
    ]);
    let second = Literal::Object(vec![
        ("gap".to_owned(), Literal::String("4".to_owned())),
        (
            "_hover".to_owned(),
            Literal::Object(vec![(
                "color".to_owned(),
                Literal::String("red".to_owned()),
            )]),
        ),
        (
            "fallback".to_owned(),
            Literal::Conditional(vec![Literal::Bool(true), Literal::Null]),
        ),
    ]);

    assert_eq!(
        literal_cache_key(&first, 1024),
        literal_cache_key(&second, 1024)
    );
}

#[test]
fn oversized_literal_returns_none_before_building_a_cache_key() {
    let value = Literal::Object(vec![(
        "className".to_owned(),
        Literal::String("x".repeat(64)),
    )]);

    assert_eq!(literal_cache_key(&value, 16), None);
}
