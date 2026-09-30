use std::collections::HashMap;

use pandacss_compiler::{PatternTransformCache, apply_pattern_transform};
use pandacss_literal::Literal;
use serde_json::{Value, json};

fn string(value: &str) -> Literal {
    Literal::String(value.to_owned())
}

fn object(entries: &[(&str, Literal)]) -> Literal {
    Literal::Object(
        entries
            .iter()
            .map(|(key, value)| ((*key).to_owned(), value.clone()))
            .collect(),
    )
}

fn transform(styles: &Literal) -> (Option<Literal>, Vec<Value>) {
    let refs = HashMap::from([("stack".to_owned(), "patterns.stack".to_owned())]);
    let callbacks = HashMap::from([("patterns.stack".to_owned(), "stack")]);
    let mut received = Vec::new();
    let result = apply_pattern_transform(
        "stack",
        styles,
        &refs,
        &callbacks,
        &mut PatternTransformCache::default(),
        |_, props| {
            received.push(props.clone());
            let mut style = json!({ "display": "flex" });
            if let Some(gap) = props.get("gap") {
                style["gap"] = gap.clone();
            }
            Ok(style)
        },
    )
    .expect("transform succeeds");
    (result, received)
}

#[test]
fn passes_static_props_through_one_call() {
    let (result, received) = transform(&object(&[("gap", string("4"))]));

    assert_eq!(received, vec![json!({ "gap": "4" })]);
    assert_eq!(
        result,
        Some(object(&[("display", string("flex")), ("gap", string("4"))]))
    );
}

#[test]
fn never_passes_a_ternary_to_the_callback() {
    let styles = object(&[
        ("align", string("center")),
        ("gap", Literal::Conditional(vec![string("1"), string("3")])),
    ]);

    let (result, received) = transform(&styles);

    assert_eq!(
        received,
        vec![
            json!({ "align": "center", "gap": "1" }),
            json!({ "align": "center", "gap": "3" }),
        ]
    );
    assert_eq!(
        result,
        Some(Literal::Conditional(vec![
            object(&[("display", string("flex")), ("gap", string("1"))]),
            object(&[("display", string("flex")), ("gap", string("3"))]),
        ]))
    );
}

#[test]
fn splits_ternaries_inside_arrays_and_nested_ternaries() {
    let styles = object(&[(
        "gap",
        Literal::Array(vec![
            Literal::Conditional(vec![
                string("1"),
                Literal::Conditional(vec![string("2"), string("3")]),
            ]),
            string("4"),
        ]),
    )]);

    let (_, received) = transform(&styles);

    assert_eq!(
        received,
        vec![
            json!({ "gap": ["1", "4"] }),
            json!({ "gap": ["2", "4"] }),
            json!({ "gap": ["3", "4"] }),
        ]
    );
}

#[test]
fn collapses_branches_that_transform_to_the_same_style() {
    let styles = object(&[(
        "color",
        Literal::Conditional(vec![string("red"), string("blue")]),
    )]);

    let (result, received) = transform(&styles);

    assert_eq!(received.len(), 2);
    assert_eq!(result, Some(object(&[("display", string("flex"))])));
}

#[test]
fn fills_other_ternaries_with_a_real_branch() {
    let styles = object(&[
        ("gap", Literal::Conditional(vec![string("1"), string("3")])),
        (
            "color",
            Literal::Conditional(vec![string("red"), string("blue")]),
        ),
    ]);

    let (_, received) = transform(&styles);

    assert_eq!(
        received,
        vec![
            json!({ "gap": "1", "color": "red" }),
            json!({ "gap": "3", "color": "red" }),
            json!({ "gap": "1", "color": "blue" }),
        ]
    );
}
