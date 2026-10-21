//! `pattern.raw(…)` composed into other style calls: the transform must write
//! only class names the build emitted CSS for.

use super::common::project_with_files_and;
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_extractor::Diagnostic;
use pandacss_literal::Literal;
use pandacss_project::Project;
use pandacss_system::ParseTransforms;
use pandacss_transform::{TransformOptions, transform_source_with};
use rustc_hash::FxHashSet;
use serde_json::json;

/// Stands in for the host: `fade` has a JS transform, `spaced` has none.
#[allow(
    clippy::unnecessary_wraps,
    clippy::result_large_err,
    reason = "signature must match PatternTransformFn"
)]
fn host_pattern_transform(name: &str, props: &Literal) -> Result<Option<Literal>, Diagnostic> {
    if name != "fade" {
        return Ok(None);
    }
    let mut styles = vec![("display".to_owned(), Literal::String("flex".to_owned()))];
    if let Literal::Object(entries) = props {
        for (key, value) in entries {
            if key == "inset" {
                styles.push(("paddingInline".to_owned(), value.clone()));
            }
        }
    }
    Ok(Some(Literal::Object(styles)))
}

/// Builds every file like `panda` would, transforms `main_path`, and checks
/// each class the transform wrote has CSS behind it.
fn parity_project(main_path: &str, main_source: &str, siblings: &[(&str, &str)]) -> Project {
    project_with_files_and(
        main_path,
        main_source,
        siblings,
        json!({
            "jsxFramework": "react",
            "utilities": { "paddingInline": {}, "inset": {}, "gap": {} },
            "patterns": {
                "fade": {
                    "transform": { "kind": "js", "id": "fade" },
                    "properties": { "inset": { "type": "string" } }
                },
                "spaced": {
                    "defaultValues": { "gap": "8px", "padding": "2px" },
                    "properties": {
                        "gap": { "type": "string" },
                        "padding": { "type": "string" }
                    }
                }
            }
        }),
    )
}

fn transform_and_check(main_path: &str, main_source: &str, siblings: &[(&str, &str)]) -> String {
    let mut project = parity_project(main_path, main_source, siblings);
    let main_path = format!("/proj/{main_path}");
    for (path, source) in siblings
        .iter()
        .map(|(name, source)| (format!("/proj/{name}"), *source))
        .chain([(main_path.clone(), main_source)])
    {
        let mut transform = host_pattern_transform;
        project.parse_file_with(
            &path,
            source,
            ParseTransforms {
                pattern: Some(&mut transform),
                ..Default::default()
            },
        );
    }

    let mut transform = host_pattern_transform;
    let output = transform_source_with(
        project.system(),
        &main_path,
        main_source,
        &TransformOptions::default(),
        ParseTransforms {
            pattern: Some(&mut transform),
            ..Default::default()
        },
    );

    let emitted: FxHashSet<String> = project
        .atoms()
        .iter()
        .filter_map(|atom| project.system().atomic_class_name(atom))
        .collect();
    for class in written_class_names(&output.code) {
        assert!(
            emitted.contains(class),
            "`{class}` has no CSS; emitted: {emitted:?}"
        );
    }

    output.code
}

fn written_class_names(code: &str) -> impl Iterator<Item = &str> {
    code.split(|c: char| !(c.is_alphanumeric() || matches!(c, '_' | '-' | ':')))
        .filter(|token| token.contains('_') && !token.starts_with('_'))
}

#[test]
fn css_with_only_a_pattern_raw() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw({ inset: '4px' }));
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "d_flex padding-inline_4px";"#);
}

#[test]
fn css_with_a_pattern_raw_then_a_style_object() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw({ inset: '4px' }), { color: 'red' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "color_red d_flex padding-inline_4px";"#);
}

#[test]
fn css_with_a_style_object_then_a_pattern_raw() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css({ display: 'block' }, fade.raw({ inset: '4px' }));
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "d_flex padding-inline_4px";"#);
}

#[test]
fn css_raw_merging_a_pattern_raw() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const styles = css.raw(fade.raw({ inset: '4px' }), { color: 'red' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const styles = {"display":"flex","paddingInline":"4px","color":"red"};"#);
}

#[test]
fn css_spreading_a_pattern_raw() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css({ ...fade.raw({ inset: '4px' }), color: 'red' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "color_red d_flex padding-inline_4px";"#);
}

#[test]
fn css_with_a_pattern_raw_under_a_condition() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css({ _hover: fade.raw({ inset: '4px' }) });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "hover:d_flex hover:padding-inline_4px";"#);
}

#[test]
fn css_with_a_pattern_raw_stored_in_a_local() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        const faded = fade.raw({ inset: '4px' });
        export const cls = css(faded);
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"
    const faded = {"display":"flex","paddingInline":"4px"};
    export const cls = "d_flex padding-inline_4px";
    "#);
}

#[test]
fn css_with_a_pattern_raw_imported_from_another_file() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { faded } from './faded';
        export const cls = css(faded);
    "};
    let faded = indoc! {r"
        import { fade } from '@panda/patterns';
        export const faded = fade.raw({ inset: '4px' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[("faded.ts", faded)]), @r#"
    import { faded } from './faded';
    export const cls = "d_flex padding-inline_4px";
    "#);
}

#[test]
fn css_with_a_pattern_raw_of_dynamic_props() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw({ inset: size }), { color: 'red' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @"
    import { css } from '@panda/css';
    import { fade } from '@panda/patterns';
    export const cls = css(fade.raw({ inset: size }), { color: 'red' });
    ");
}

#[test]
fn css_with_a_pattern_raw_and_a_conditional_style_object() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw({ inset: '4px' }), isRed ? { color: 'red' } : { color: 'blue' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = ("d_flex" + " " + "padding-inline_4px") + " " + (isRed ? "color_red" : "color_blue");"#);
}

#[test]
fn css_with_a_pattern_raw_without_props() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw());
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "d_flex";"#);
}

#[test]
fn css_with_a_pattern_raw_that_fills_in_defaults() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { spaced } from '@panda/patterns';
        export const cls = css(spaced.raw({ gap: '4px' }));
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "gap_4px padding_2px";"#);
}

#[test]
fn pattern_without_a_transform_called_directly() {
    let source = indoc! {r"
        import { spaced } from '@panda/patterns';
        export const cls = spaced({ gap: '4px' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @r#"export const cls = "gap_4px padding_2px";"#);
}

#[test]
fn cva_base_from_a_pattern_raw() {
    let source = indoc! {r"
        import { cva } from '@panda/css';
        import { fade } from '@panda/patterns';
        const faded = cva({ base: fade.raw({ inset: '4px' }) });
        export const cls = faded();
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @"
    const faded = (p = {}) => 'd_flex padding-inline_4px';
    export const cls = faded();
    ");
}

#[test]
fn jsx_css_prop_with_a_pattern_raw() {
    let source = indoc! {r"
        import { fade } from '@panda/patterns';
        import { styled } from '@panda/jsx';
        export const Faded = () => <styled.div css={fade.raw({ inset: '4px' })} />;
    "};

    assert_snapshot!(transform_and_check("a.tsx", source, &[]), @r#"export const Faded = () => <div className="d_flex padding-inline_4px" />;"#);
}

#[test]
fn jsx_css_prop_array_with_a_pattern_raw() {
    let source = indoc! {r"
        import { fade } from '@panda/patterns';
        import { styled } from '@panda/jsx';
        export const Faded = () => <styled.div css={[fade.raw({ inset: '4px' }), { color: 'red' }]} />;
    "};

    assert_snapshot!(transform_and_check("a.tsx", source, &[]), @r#"export const Faded = () => <div className="color_red d_flex padding-inline_4px" />;"#);
}

#[test]
fn jsx_spreading_a_pattern_raw() {
    let source = indoc! {r"
        import { fade } from '@panda/patterns';
        import { styled } from '@panda/jsx';
        export const Faded = () => <styled.div {...fade.raw({ inset: '4px' })} />;
    "};

    assert_snapshot!(transform_and_check("a.tsx", source, &[]), @r#"export const Faded = () => <div className="d_flex padding-inline_4px" />;"#);
}

#[test]
fn css_with_a_pattern_raw_of_a_ternary_prop() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw({ inset: active ? '4px' : '8px' }));
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @"
    import { css } from '@panda/css';
    import { fade } from '@panda/patterns';
    export const cls = css(fade.raw({ inset: active ? '4px' : '8px' }));
    ");
}

#[test]
fn css_with_a_pattern_raw_of_a_conditional_spread() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw({ ...(active && { inset: '4px' }) }));
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @"
    import { css } from '@panda/css';
    import { fade } from '@panda/patterns';
    export const cls = css(fade.raw({ ...(active && { inset: '4px' }) }));
    ");
}

#[test]
fn css_with_a_pattern_raw_of_partly_dynamic_props() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { fade } from '@panda/patterns';
        export const cls = css(fade.raw({ inset: size, color: 'red' }));
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[]), @"
    import { css } from '@panda/css';
    import { fade } from '@panda/patterns';
    export const cls = css(fade.raw({ inset: size, color: 'red' }));
    ");
}

#[test]
fn css_with_an_imported_pattern_raw_under_a_condition() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { spacing } from './spacing';
        export const cls = css({ _hover: spacing });
    "};
    let spacing = indoc! {r"
        import { spaced } from '@panda/patterns';
        export const spacing = spaced.raw({ gap: '4px' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[("spacing.ts", spacing)]), @r#"
    import { spacing } from './spacing';
    export const cls = "hover:gap_4px hover:padding_2px";
    "#);
}

#[test]
fn css_with_an_imported_pattern_raw_of_a_ternary_prop() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { faded } from './faded';
        export const cls = css(faded);
    "};
    let faded = indoc! {r"
        import { fade } from '@panda/patterns';
        export const faded = fade.raw({ inset: active ? '4px' : '8px' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[("faded.ts", faded)]), @"
    import { css } from '@panda/css';
    import { faded } from './faded';
    export const cls = css(faded);
    ");
}

#[test]
fn css_with_an_imported_pattern_raw_of_partly_dynamic_props() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { faded } from './faded';
        export const cls = css(faded);
    "};
    let faded = indoc! {r"
        import { fade } from '@panda/patterns';
        export const faded = fade.raw({ inset: size, color: 'red' });
    "};

    assert_snapshot!(transform_and_check("a.ts", source, &[("faded.ts", faded)]), @"
    import { css } from '@panda/css';
    import { faded } from './faded';
    export const cls = css(faded);
    ");
}

/// The same pattern after its `transform` was edited to set `marginTop`.
#[allow(
    clippy::unnecessary_wraps,
    clippy::result_large_err,
    reason = "signature must match PatternTransformFn"
)]
fn edited_fade_transform(name: &str, props: &Literal) -> Result<Option<Literal>, Diagnostic> {
    if name != "fade" {
        return Ok(None);
    }
    let Literal::Object(entries) = props else {
        return Ok(None);
    };
    let styles = entries
        .iter()
        .filter(|(key, _)| key == "inset")
        .map(|(_, value)| ("marginTop".to_owned(), value.clone()))
        .collect();
    Ok(Some(Literal::Object(styles)))
}

fn transform_imported_fade<'a>(
    project: &Project,
    pattern: Option<&'a mut pandacss_system::PatternTransformFn<'a>>,
) -> String {
    transform_source_with(
        project.system(),
        "/proj/a.ts",
        IMPORTS_FADED,
        &TransformOptions::default(),
        ParseTransforms {
            pattern,
            ..Default::default()
        },
    )
    .code
}

const IMPORTS_FADED: &str = "import { css } from '@panda/css';\nimport { faded } from './faded';\nexport const cls = css(faded);\n";
const FADED: &str =
    "import { fade } from '@panda/patterns';\nexport const faded = fade.raw({ inset: '4px' });\n";

#[test]
fn an_edited_pattern_transform_reaches_imported_pattern_raw_values() {
    let project = parity_project("a.ts", IMPORTS_FADED, &[("faded.ts", FADED)]);

    let mut before = host_pattern_transform;
    let first = transform_imported_fade(&project, Some(&mut before));
    let mut after = edited_fade_transform;
    let second = transform_imported_fade(&project, Some(&mut after));

    assert_snapshot!(format!("{first}---\n{second}"), @r#"
    import { faded } from './faded';
    export const cls = "d_flex padding-inline_4px";
    ---
    import { faded } from './faded';
    export const cls = "margin-top_4px";
    "#);
}

#[test]
fn a_transform_without_the_host_does_not_hide_imported_pattern_raw_values() {
    let project = parity_project("a.ts", IMPORTS_FADED, &[("faded.ts", FADED)]);

    let without_host = transform_imported_fade(&project, None);
    let mut host = host_pattern_transform;
    let with_host = transform_imported_fade(&project, Some(&mut host));

    assert_snapshot!(format!("{without_host}---\n{with_host}"), @r#"
    import { css } from '@panda/css';
    import { faded } from './faded';
    export const cls = css(faded);
    ---
    import { faded } from './faded';
    export const cls = "d_flex padding-inline_4px";
    "#);
}
