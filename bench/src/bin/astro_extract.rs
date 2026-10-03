#![allow(
    clippy::disallowed_macros,
    clippy::print_stdout,
    reason = "benchmark binary intentionally prints timings"
)]

use std::fs;
use std::time::Instant;

use pandacss_extractor::{ExtractorConfig, Matchers, extract};

fn main() {
    let iterations: usize = std::env::args()
        .nth(1)
        .and_then(|value| value.parse().ok())
        .unwrap_or(20);
    let dir = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../crates/pandacss_astro/tests/corpus/compiler-rs"
    );
    let sources: Vec<String> = fs::read_dir(dir)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .filter(|path| {
            path.extension()
                .is_some_and(|extension| extension == "astro")
        })
        .map(|path| fs::read_to_string(path).unwrap())
        .collect();
    let config = ExtractorConfig::new(Matchers::default()).with_jsx_framework(true);
    for source in &sources {
        let _ = extract(source, "corpus.astro", &config);
    }
    let start = Instant::now();
    for _ in 0..iterations {
        for source in &sources {
            let _ = extract(source, "corpus.astro", &config);
        }
    }
    let elapsed = start.elapsed();
    let per_pass = elapsed / u32::try_from(iterations).unwrap_or(1);
    println!(
        "{} files x {iterations} passes: {:.2} ms per pass",
        sources.len(),
        per_pass.as_secs_f64() * 1000.0
    );
}
