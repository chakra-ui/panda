//! `PandaProject` integration tests — exercise the full pipeline
//! (extract → recipe parse → encoder) end-to-end via the high-level
//! façade. Most lower-level tests live next to the crate they
//! exercise; these focus on multi-file flows and DX shape.

use pandacss_encoder::Atom;
use pandacss_extractor::Matchers;
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_project::{Matcher, NameMatcher, PandaProject};

fn matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        jsx: Some(Matcher {
            modules: vec!["@panda/jsx".into()],
            names: NameMatcher::only(["styled", "Box"]),
        }),
        ..Default::default()
    }
}

fn sorted_atoms(project: &PandaProject) -> Vec<&Atom> {
    let mut out: Vec<&Atom> = project.atoms().iter().collect();
    out.sort_by(|a, b| {
        a.prop
            .cmp(&b.prop)
            .then_with(|| a.conditions.cmp(&b.conditions))
            .then_with(|| format!("{:?}", a.value).cmp(&format!("{:?}", b.value)))
    });
    out
}

#[test]
fn empty_project_is_empty() {
    // Constructor invariant: every count is zero, nothing has run.
    // Direct asserts read more clearly than a snapshot of all zeros.
    let project = PandaProject::new(matchers());
    let summary = project.summary();
    assert_eq!(summary.files_processed, 0);
    assert_eq!(summary.atom_count, 0);
    assert_eq!(summary.recipe_count, 0);
    assert_eq!(summary.slot_recipe_count, 0);
    assert!(project.atoms().is_empty());
}

#[test]
fn parse_file_routes_css_cva_and_sva_to_the_right_pipelines() {
    // The interesting bit is the *atoms* the multi-call file
    // produces — snapshot those. Routing counts are simple asserts.
    let mut project = PandaProject::new(matchers());
    let src = indoc! {r"
        import { css, cva, sva } from '@panda/css';
        css({ color: 'red' });
        cva({ base: { padding: '4px' } });
        sva({ slots: ['root'], base: { root: { margin: '8px' } } });
    "};
    let report = project.parse_file("fixture.tsx", src);
    assert_eq!(report.css_calls, 1);
    assert_eq!(report.cva_calls, 1);
    assert_eq!(report.sva_calls, 1);
    assert_eq!(project.summary().recipe_count, 1);
    assert_eq!(project.summary().slot_recipe_count, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn atoms_dedup_across_files() {
    // Dedup is the assertion — 4 raw atoms across two files collapse
    // to 3 unique. The exact shape isn't the point.
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', padding: '4px' });
        "},
    );
    project.parse_file(
        "b.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', margin: '8px' });
        "},
    );
    assert_eq!(project.summary().files_processed, 2);
    assert_eq!(project.summary().atom_count, 3);
}

#[test]
fn jsx_style_props_feed_the_encoder() {
    // A JSX usage routes into the same encoder pipeline as css().
    // Snapshot the produced atoms since shape is the contract;
    // direct asserts for the counts.
    let mut project = PandaProject::new(matchers());
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box color='red' padding='4px' />;
        "},
    );
    assert_eq!(report.jsx_usages, 1);
    assert_eq!(report.css_calls, 0);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn recipes_iterator_yields_typed_recipe_per_call_site() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            const button = cva({
              base: { color: 'red' },
              variants: { size: { sm: { fontSize: 12 } } },
            });
        "},
    );
    let recipes: Vec<_> = project
        .recipes()
        .map(|(file, _span, recipe)| (file.to_owned(), recipe.clone()))
        .collect();
    assert_yaml_snapshot!(recipes, @r"
    - - button.tsx
      - base:
          color: red
        variants:
          - name: size
            options:
              - key: sm
                style:
                  fontSize: 12
    ");
}

#[test]
fn builder_attaches_token_dictionary() {
    // Behavioral assertion: `token(...)` resolves through the
    // attached dictionary. Direct lookup is clearer than a snapshot
    // of a single-atom set.
    use pandacss_encoder::AtomValue;
    use pandacss_tokens::{Token, TokenCategory, TokenDictionary};

    let dict = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();

    let m = Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        tokens: Matcher {
            modules: vec!["@panda/tokens".into()],
            names: NameMatcher::only(["token"]),
        },
        ..Default::default()
    };

    let mut project = PandaProject::new(m).with_token_dictionary(dict);
    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { token } from '@panda/tokens';
            import { css } from '@panda/css';
            css({ color: token('colors.red.500') });
        "},
    );
    let color = project
        .atoms()
        .iter()
        .find(|a| &*a.prop == "color")
        .expect("color atom");
    assert!(
        matches!(&color.value, AtomValue::String(s) if &**s == "#ef4444"),
        "token() resolved to dictionary value, got {:?}",
        color.value,
    );
}

#[test]
fn re_adding_file_replaces_atoms_no_ghosts_left() {
    // Watch-mode contract: editing a file removes its previous atoms.
    // Before the per-file invalidation refactor this leaked — the
    // original `red` + `4px` survived the second `parse_file`.
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', padding: '4px' });
        "},
    );
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'blue' });
        "},
    );
    assert_eq!(project.summary().files_processed, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn re_adding_file_replaces_recipes_no_ghost_keys() {
    // Same invalidation rule applies to recipes: edit out the cva,
    // re-add the file, and the registry should reflect that.
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            const button = cva({ base: { color: 'red' } });
        "},
    );
    assert_eq!(project.summary().recipe_count, 1);
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'blue' });
        "},
    );
    assert_eq!(project.summary().recipe_count, 0);
}

#[test]
fn remove_file_drops_atoms_and_recipes_for_that_path_only() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css, cva } from '@panda/css';
            css({ color: 'red' });
            cva({ base: { padding: '4px' } });
        "},
    );
    project.parse_file(
        "b.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ margin: '8px' });
        "},
    );
    assert!(project.remove_file("a.tsx"));
    let summary = project.summary();
    assert_eq!(summary.files_processed, 1);
    assert_eq!(summary.recipe_count, 0);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: margin
      value: 8px
      conditions: []
    ");
}

#[test]
fn remove_file_on_unknown_path_is_a_noop() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "a.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    assert!(!project.remove_file("never-added.tsx"));
    assert_eq!(project.summary().files_processed, 1);
    assert_eq!(project.summary().atom_count, 1);
}

#[test]
fn get_file_returns_none_for_unknown_path() {
    let project = PandaProject::new(matchers());
    assert!(project.get_file("never-parsed.tsx").is_none());
}

#[test]
fn parsed_file_exposes_path_metadata() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "src/ui/button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    let view = project
        .get_file("src/ui/button.tsx")
        .expect("button.tsx parsed");
    assert_eq!(view.path(), "src/ui/button.tsx");
    assert_eq!(view.basename(), "button.tsx");
    assert_eq!(view.extension(), "tsx");
    assert_eq!(view.directory(), "src/ui");
}

#[test]
fn parsed_file_extension_empty_when_filename_has_none() {
    let mut project = PandaProject::new(matchers());
    project.parse_file("Makefile", "import { css } from '@panda/css';");
    let view = project.get_file("Makefile").expect("file parsed");
    assert_eq!(view.basename(), "Makefile");
    assert_eq!(view.extension(), "");
    assert_eq!(view.directory(), "");
}

#[test]
fn parsed_file_surfaces_diagnostics_per_file() {
    use pandacss_project::DiagnosticSeverity;
    let mut project = PandaProject::new(matchers());
    let report = project.parse_file(
        "broken.tsx",
        // Open import statement → Oxc surfaces a parse error.
        "import { css } from",
    );
    assert!(
        !report.diagnostics.is_empty(),
        "FileReport carries the list"
    );
    assert_eq!(report.diagnostics[0].severity, DiagnosticSeverity::Error);

    let view = project.get_file("broken.tsx").expect("file recorded");
    assert_eq!(
        view.diagnostics().len(),
        report.diagnostics.len(),
        "ParsedFile mirrors the FileReport list"
    );
    assert_eq!(view.diagnostics()[0].severity, DiagnosticSeverity::Error);
}

#[test]
fn parsed_file_diagnostics_empty_for_clean_files() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "clean.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    let view = project.get_file("clean.tsx").expect("file parsed");
    assert!(view.diagnostics().is_empty());
}

#[test]
fn get_file_exposes_atoms_and_per_file_recipes() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css, cva } from '@panda/css';
            css({ color: 'red' });
            const button = cva({ base: { padding: '4px' } });
        "},
    );
    project.parse_file(
        "card.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ margin: '8px' });
        "},
    );
    let view = project.get_file("button.tsx").expect("button.tsx parsed");
    assert_eq!(view.path(), "button.tsx");
    // `margin` belongs to card.tsx, not this view.
    assert!(view.atoms().iter().all(|a| &*a.prop != "margin"));
    let recipes: Vec<_> = view.recipes().map(|(_, r)| r.clone()).collect();
    assert_eq!(recipes.len(), 1);
    assert!(view.slot_recipes().next().is_none());
}

#[test]
fn refresh_file_returns_false_on_unknown_path_and_doesnt_register() {
    let mut project = PandaProject::new(matchers());
    let added = project.refresh_file(
        "vendor.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    assert!(!added);
    assert_eq!(project.summary().files_processed, 0);
    assert!(project.get_file("vendor.tsx").is_none());
}

#[test]
fn refresh_file_replaces_known_files_content() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    let refreshed = project.refresh_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'blue' });",
    );
    assert!(refreshed);
    assert_eq!(project.summary().files_processed, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn complex_recipe_decomposes_into_many_atoms() {
    let mut project = PandaProject::new(matchers());
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            cva({
              base: { display: 'inline-flex', alignItems: 'center' },
              variants: {
                intent: {
                  primary: { background: 'blue', color: 'white' },
                  danger: { background: 'red', color: 'white' },
                },
                size: {
                  sm: { fontSize: 12 },
                  lg: { fontSize: 16 },
                },
              },
              compoundVariants: [
                { intent: 'danger', size: 'lg', css: { fontWeight: 'bold' } },
              ],
            });
        "},
    );
    // 8 distinct atoms:
    // - base:    display=inline-flex, alignItems=center → 2
    // - intent:  background=blue, background=red, color=white → 3
    //            (white de-dups across two variant options)
    // - size:    fontSize=12, fontSize=16 → 2
    // - compound: fontWeight=bold → 1
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: alignItems
      value: center
      conditions: []
    - prop: background
      value: blue
      conditions: []
    - prop: background
      value: red
      conditions: []
    - prop: color
      value: white
      conditions: []
    - prop: display
      value: inline-flex
      conditions: []
    - prop: fontSize
      value: "12"
      conditions: []
    - prop: fontSize
      value: "16"
      conditions: []
    - prop: fontWeight
      value: bold
      conditions: []
    "#);
}
