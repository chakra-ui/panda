use std::fmt::Write as _;
use std::path::{Path, PathBuf};

use pandacss_astro_reference::{AstroDocument, lower};

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

fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
    for entry in std::fs::read_dir(dir).unwrap() {
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

fn main() {
    let root = PathBuf::from(std::env::args().nth(1).expect("corpus root"));
    let mut files = Vec::new();
    walk(&root, &mut files);
    files.sort();
    let mut out = String::new();
    for path in files {
        let source = std::fs::read_to_string(&path).unwrap();
        let document = lower(&source);
        let status = if document.diagnostics.is_empty() {
            "accepted"
        } else {
            "rejected"
        };
        let relative = path
            .strip_prefix(&root)
            .unwrap()
            .to_string_lossy()
            .replace('\\', "/");
        let _ = writeln!(
            out,
            "{relative}\t{status}\t{:016x}\t{:016x}",
            fnv(document.canvas.as_bytes()),
            fnv(element_signature(&document).as_bytes())
        );
    }
    print!("{out}");
}
