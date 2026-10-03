mod common;

use std::collections::{BTreeMap, BTreeSet};
use std::fmt::Write as _;
use std::fs;
use std::path::{Path, PathBuf};

use insta::assert_snapshot;
use pandacss_astro::AstroDocument;

const CORPUS: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/corpus");

struct Expected {
    accepted: bool,
    canvas: String,
    elements: String,
}

fn fnv(bytes: &[u8]) -> u64 {
    bytes.iter().fold(0xcbf2_9ce4_8422_2325_u64, |hash, byte| {
        (hash ^ u64::from(*byte)).wrapping_mul(0x0100_0000_01b3)
    })
}

fn element_signature(document: &AstroDocument) -> String {
    let mut signature = String::new();
    for element in &document.elements {
        let _ = write!(signature, "{:?}{:?}", element.name, element.opening);
        for attribute in &element.attributes {
            let _ = write!(signature, "|{:?}={:?}", attribute.name, attribute.value);
        }
        signature.push('\n');
    }
    signature
}

fn oracle() -> BTreeMap<String, Expected> {
    fs::read_to_string(Path::new(CORPUS).join("oracle.tsv"))
        .unwrap()
        .lines()
        .map(|line| {
            let fields: Vec<_> = line.split('\t').collect();
            (
                fields[0].to_owned(),
                Expected {
                    accepted: fields[1] == "accepted",
                    canvas: fields[2].to_owned(),
                    elements: fields[3].to_owned(),
                },
            )
        })
        .collect()
}

fn deviations() -> BTreeSet<String> {
    fs::read_to_string(Path::new(CORPUS).join("deviations.tsv"))
        .unwrap()
        .lines()
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .map(|line| line.split('\t').next().unwrap().to_owned())
        .collect()
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
    for entry in fs::read_dir(dir).unwrap() {
        let path = entry.unwrap().path();
        if path.is_dir() {
            walk(&path, out);
        } else if path
            .extension()
            .is_some_and(|extension| extension == "astro")
        {
            out.push(path);
        }
    }
}

#[test]
fn every_corpus_file_has_a_reference_line() {
    let oracle = oracle();
    let mut files = Vec::new();
    walk(Path::new(CORPUS), &mut files);
    let missing: Vec<_> = files
        .iter()
        .map(|path| {
            path.strip_prefix(CORPUS)
                .unwrap()
                .to_string_lossy()
                .replace('\\', "/")
        })
        .filter(|path| !oracle.contains_key(path))
        .collect();
    assert!(
        missing.is_empty(),
        "regenerate oracle.tsv; missing:\n{}",
        missing.join("\n")
    );
    assert_eq!(files.len(), oracle.len());
}

#[test]
fn every_corpus_file_matches_the_reference() {
    let deviations = deviations();
    let (mut accepted, mut rejected) = (0, 0);
    let mut failures = Vec::new();
    for (path, expected) in &oracle() {
        let source = fs::read_to_string(Path::new(CORPUS).join(path)).unwrap();
        let document = pandacss_astro::lower(&source);
        if let Err(problem) = common::check_offsets(&source, &document.canvas) {
            failures.push(format!("{path}: {problem}"));
            continue;
        }
        if deviations.contains(path) {
            continue;
        }
        if expected.accepted {
            accepted += 1;
            if let Some(diagnostic) = document.diagnostics.first() {
                failures.push(format!(
                    "{path}: rejects an input Astro accepts: {}",
                    diagnostic.message
                ));
            } else if format!("{:016x}", fnv(document.canvas.as_bytes())) != expected.canvas {
                failures.push(format!("{path}: canvas differs from the reference"));
            } else if format!("{:016x}", fnv(element_signature(&document).as_bytes()))
                != expected.elements
            {
                failures.push(format!("{path}: elements differ from the reference"));
            }
        } else {
            rejected += 1;
            if document.diagnostics.is_empty() && common::check_parses(&document.canvas).is_ok() {
                failures.push(format!("{path}: no warning for an input Astro rejects"));
            }
        }
    }
    assert!(
        failures.is_empty(),
        "{} failures:\n{}",
        failures.len(),
        failures.join("\n")
    );
    assert_snapshot!(
        format!("accepted: {accepted}\nrejected: {rejected}\ndeviations: {}", deviations.len()),
        @r"
    accepted: 3772
    rejected: 551
    deviations: 0
    "
    );
}
