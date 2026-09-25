use pandacss_literal::Literal;
use serde_json::json;

#[test]
fn json_conversion_preserves_source_order_and_numbers() {
    let value = Literal::from_json_strict(&json!({
        "color": "red",
        "opacity": 0.5,
        "enabled": true
    }))
    .expect("valid literal JSON");

    assert_eq!(
        value.to_json(),
        json!({
            "color": "red",
            "opacity": 0.5,
            "enabled": true
        })
    );
}

#[test]
fn object_updates_replace_in_place_and_conditionals_accumulate() {
    let mut entries = vec![("color".to_owned(), Literal::String("red".to_owned()))];
    Literal::upsert_object_entry(
        &mut entries,
        "color".to_owned(),
        Literal::String("blue".to_owned()),
    );
    Literal::combine_object_entry(
        &mut entries,
        "color".to_owned(),
        Literal::String("green".to_owned()),
    );

    assert_eq!(
        entries,
        vec![(
            "color".to_owned(),
            Literal::Conditional(vec![
                Literal::String("blue".to_owned()),
                Literal::String("green".to_owned()),
            ]),
        )]
    );
}
