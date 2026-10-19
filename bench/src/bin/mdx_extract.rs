#![allow(
    clippy::cast_precision_loss,
    clippy::print_stdout,
    clippy::disallowed_macros,
    reason = "benchmark reports timing and allocation measurements"
)]

//! MDX extraction costs versus equivalent live TSX, including transient heap usage.
use pandacss_extractor::{ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use serde_json::json;
use std::{sync::atomic::Ordering, time::Instant};

#[path = "mdx_extract/allocations.rs"]
mod allocations;
use allocations::{ALLOCATION_COUNT, LIVE_BYTES, PEAK_BYTES, TOTAL_ALLOCATED_BYTES};

const EXTRACTION_WARMUP: usize = 30;
const EXTRACTION_BYTE_BUDGET: usize = 2_000_000;
const MIN_EXTRACTION_SAMPLES: usize = 20;
const MAX_EXTRACTION_SAMPLES: usize = 300;
const WATCH_WARMUP: usize = 100;
const WATCH_UPDATES: usize = 1000;
const PROJECT_FILES: usize = 200;
const MDX_PROJECT_FILES: usize = PROJECT_FILES / 10;
const BUILD_WARMUP: usize = 20;
const BUILD_SAMPLES: usize = 100;

fn extractor_config() -> ExtractorConfig {
    ExtractorConfig::new(Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css"]),
        },
        jsx: Some(Matcher {
            modules: vec!["@panda/jsx".into()],
            names: NameMatcher::only(["Box"]),
        }),
        ..Default::default()
    })
    .with_jsx_framework(true)
}
const IMPORTS: &str = "import { css } from '@panda/css';\nimport { Box } from '@panda/jsx';\n\n";
const JSX: &str = "<Box color=\"red\" css={{padding:'4'}}><span className={css({color:'blue'})}>text</span></Box>";
fn equivalent_sources(count: usize) -> (String, String) {
    let mut mdx = IMPORTS.to_owned();
    let mut tsx = format!("{IMPORTS}export default <>\n");
    for _ in 0..count {
        mdx.push_str("## Example\n\nSome **prose** with `inline code`.\n\n");
        mdx.push_str(JSX);
        mdx.push_str("\n\n```jsx\n<Box color=\"wrong\" />\n```\n\n");
        tsx.push_str(JSX);
        tsx.push('\n');
    }
    tsx.push_str("</>;\n");
    (mdx, tsx)
}
#[derive(Clone, Copy)]
enum ExtractionExpectation {
    CallsAndElements(usize),
    Elements(usize),
    Diagnostics,
}

fn measure_extraction(name: &str, source: &str, path: &str, expected: ExtractionExpectation) {
    let config = extractor_config();
    let first = extract(source, path, &config);
    if !matches!(expected, ExtractionExpectation::Diagnostics) {
        assert!(
            first.diagnostics.is_empty(),
            "{name}: {:?}",
            first.diagnostics
        );
    }
    match expected {
        ExtractionExpectation::CallsAndElements(count) => {
            assert_eq!(first.calls.len(), count);
            assert_eq!(first.jsx.len(), count);
        }
        ExtractionExpectation::Elements(count) => {
            assert!(first.calls.is_empty());
            assert_eq!(first.jsx.len(), count);
        }
        ExtractionExpectation::Diagnostics => assert!(!first.diagnostics.is_empty()),
    }
    let calls = first.calls.len();
    let diagnostics = first.diagnostics.len();
    drop(first);
    for _ in 0..EXTRACTION_WARMUP {
        drop(std::hint::black_box(extract(source, path, &config)));
    }
    let before = LIVE_BYTES.load(Ordering::Relaxed);
    PEAK_BYTES.store(before, Ordering::Relaxed);
    let bytes_before = TOTAL_ALLOCATED_BYTES.load(Ordering::Relaxed);
    let count_before = ALLOCATION_COUNT.load(Ordering::Relaxed);
    drop(std::hint::black_box(extract(source, path, &config)));
    let peak = PEAK_BYTES.load(Ordering::Relaxed).saturating_sub(before);
    let allocated_bytes = TOTAL_ALLOCATED_BYTES.load(Ordering::Relaxed) - bytes_before;
    let allocation_count = ALLOCATION_COUNT.load(Ordering::Relaxed) - count_before;
    let iterations = (EXTRACTION_BYTE_BUDGET / source.len())
        .clamp(MIN_EXTRACTION_SAMPLES, MAX_EXTRACTION_SAMPLES);
    let mut samples = Vec::with_capacity(iterations);
    let retained_before = LIVE_BYTES.load(Ordering::Relaxed);
    for _ in 0..iterations {
        let start = Instant::now();
        drop(std::hint::black_box(extract(source, path, &config)));
        samples.push(start.elapsed().as_secs_f64() * 1e6);
    }
    let retained_growth = LIVE_BYTES.load(Ordering::Relaxed) as i128 - retained_before as i128;
    samples.sort_by(f64::total_cmp);
    println!(
        "{}",
        json!({
            "scenario": name,
            "allocationTracking": allocations::is_enabled(),
            "bytes": source.len(),
            "iterations": iterations,
            "medianUs": samples[iterations / 2],
            "p95Us": samples[iterations * 95 / 100],
            "peakHeapBytes": allocations::is_enabled().then_some(peak),
            "allocatedBytes": allocations::is_enabled().then_some(allocated_bytes),
            "allocations": allocations::is_enabled().then_some(allocation_count),
            "retainedGrowthBytes": allocations::is_enabled().then_some(retained_growth),
            "calls": calls,
            "diagnostics": diagnostics,
        })
    );
}
fn project_config() -> pandacss_config::UserConfig {
    serde_json::from_value(json!({
        "outdir": "styled-system", "jsxFramework": "react",
        "importMap": { "css": ["@panda/css"], "jsx": ["@panda/jsx"] },
        "utilities": { "color": { "className": "color" }, "padding": { "className": "padding" } },
        "patterns": { "box": { "jsx": ["Box"] } }
    }))
    .expect("valid benchmark config")
}

fn measure_changed_file_updates(name: &str, source: &str, path: &str) {
    let config = project_config();
    let system = pandacss_system::System::new(config.clone()).expect("valid system");
    let mut project = pandacss_project::Project::new(system);
    let changed = source.replace("red", "teal");
    let mut step = |iteration: usize| {
        project.parse_file(
            path,
            if iteration.is_multiple_of(2) {
                source
            } else {
                &changed
            },
        );
        let output = pandacss_compiler::compile_css(
            &mut project,
            &config,
            None,
            None,
            &pandacss_compiler::CssOutputOptions::default(),
        );
        assert!(
            output.diagnostics.is_empty(),
            "{name}: {:?}",
            output.diagnostics
        );
        output
    };
    for (iteration, expected, removed) in [(0, "red", "teal"), (1, "teal", "red")] {
        let output = step(iteration);
        assert!(output.css.contains(expected));
        assert!(!output.css.contains(removed));
        assert!(!output.css.contains("wrong"));
    }
    for iteration in 0..WATCH_WARMUP {
        drop(std::hint::black_box(step(iteration)));
    }
    let before = LIVE_BYTES.load(Ordering::Relaxed);
    PEAK_BYTES.store(before, Ordering::Relaxed);
    let start = Instant::now();
    for iteration in 0..WATCH_UPDATES {
        drop(std::hint::black_box(step(iteration)));
    }
    let elapsed = start.elapsed();
    let after = LIVE_BYTES.load(Ordering::Relaxed);
    println!(
        "{}",
        json!({
            "scenario": name,
            "allocationTracking": allocations::is_enabled(),
            "updates": WATCH_UPDATES,
            "usPerUpdate": elapsed.as_secs_f64() * 1e6 / WATCH_UPDATES as f64,
            "steadyHeapBytes": allocations::is_enabled().then_some(after),
            "retainedGrowthBytes": allocations::is_enabled().then_some(after as i128 - before as i128),
            "peakAdditionalHeapBytes": allocations::is_enabled().then_some(PEAK_BYTES.load(Ordering::Relaxed).saturating_sub(before)),
        })
    );
}

fn measure_mixed_project() {
    let (mdx, tsx) = equivalent_sources(1);
    let config = project_config();
    let cases = [
        ("tsx-project-200", 0),
        ("mixed-project-10pct-mdx", MDX_PROJECT_FILES),
    ];
    let paths: Vec<Vec<_>> = cases
        .iter()
        .map(|(_, mdx_files)| {
            (0..PROJECT_FILES)
                .map(|index| {
                    format!(
                        "/src/doc{index}.{}",
                        if index < *mdx_files { "mdx" } else { "tsx" }
                    )
                })
                .collect()
        })
        .collect();
    let build = |case: usize| {
        let system = pandacss_system::System::new(config.clone()).expect("valid system");
        let mut project = pandacss_project::Project::new(system);
        for (index, path) in paths[case].iter().enumerate() {
            project.parse_file(path, if index < cases[case].1 { &mdx } else { &tsx });
        }
        let output = pandacss_compiler::compile_css(
            &mut project,
            &config,
            None,
            None,
            &pandacss_compiler::CssOutputOptions::default(),
        );
        assert!(
            output.diagnostics.is_empty(),
            "{}: {:?}",
            cases[case].0,
            output.diagnostics
        );
        std::hint::black_box(output);
    };
    for _ in 0..BUILD_WARMUP {
        build(0);
        build(1);
    }
    let peaks: Vec<_> = (0..2)
        .map(|case| {
            let before = LIVE_BYTES.load(Ordering::Relaxed);
            PEAK_BYTES.store(before, Ordering::Relaxed);
            build(case);
            PEAK_BYTES.load(Ordering::Relaxed).saturating_sub(before)
        })
        .collect();
    let mut samples = [
        Vec::with_capacity(BUILD_SAMPLES),
        Vec::with_capacity(BUILD_SAMPLES),
    ];
    for round in 0..BUILD_SAMPLES {
        for order in 0..2 {
            let case = (round + order) % 2;
            let start = Instant::now();
            build(case);
            samples[case].push(start.elapsed().as_secs_f64() * 1e6);
        }
    }
    for (case, (name, mdx_files)) in cases.iter().enumerate() {
        samples[case].sort_by(f64::total_cmp);
        println!(
            "{}",
            json!({
                "scenario": name,
                "allocationTracking": allocations::is_enabled(),
                "files": PROJECT_FILES,
                "mdxFiles": mdx_files,
                "medianUs": samples[case][BUILD_SAMPLES / 2],
                "peakHeapBytes": allocations::is_enabled().then_some(peaks[case]),
                "sampling": "alternating",
            })
        );
    }
}

fn main() {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.iter().any(|arg| arg == "--timing") {
        allocations::disable();
    }
    if args.iter().any(|arg| arg == "--dense-inline") {
        for count in [100, 1000, 4000] {
            let source = format!("{IMPORTS}Text {}", "<Box color=\"red\" />".repeat(count));
            measure_extraction(
                &format!("mdx-inline-{count}"),
                &source,
                "inline.mdx",
                ExtractionExpectation::Elements(count),
            );
        }
        return;
    }
    if args.iter().any(|arg| arg == "--esm-stress") {
        for lines in [20, 80, 320] {
            let source = format!(
                "{IMPORTS}export const entries = {{\n\n{}}};\n\n{JSX}\n",
                "a: 'x',\n\n".repeat(lines)
            );
            measure_extraction(
                &format!("mdx-export-{lines}"),
                &source,
                "exports.mdx",
                ExtractionExpectation::CallsAndElements(1),
            );
        }
        return;
    }
    if args.iter().any(|arg| arg == "--mixed") {
        measure_mixed_project();
        return;
    }
    if args.iter().any(|arg| arg == "--watch") {
        let (mdx, tsx) = equivalent_sources(20);
        measure_changed_file_updates("tsx-watch", &tsx, "doc.tsx");
        measure_changed_file_updates("mdx-watch", &mdx, "doc.mdx");
        return;
    }
    let baseline = args.iter().any(|arg| arg == "--baseline");
    for count in [1, 20, 200] {
        let (mdx, tsx) = equivalent_sources(count);
        measure_extraction(
            &format!("tsx-{count}"),
            &tsx,
            "doc.tsx",
            ExtractionExpectation::CallsAndElements(count),
        );
        if !baseline {
            measure_extraction(
                &format!("mdx-{count}"),
                &mdx,
                "doc.mdx",
                ExtractionExpectation::CallsAndElements(count),
            );
        }
    }
    if !baseline {
        for count in [20, 200] {
            let source = format!("{IMPORTS}{}", "<Box color={unknown} css={unknownStyles}><span className={css({color:'blue'})} /></Box>\n\n".repeat(count));
            measure_extraction(
                &format!("mdx-dynamic-{count}"),
                &source,
                "dynamic.mdx",
                ExtractionExpectation::CallsAndElements(count),
            );
        }
        for kb in [25, 100, 400] {
            let malformed = format!("{IMPORTS}{{{}", "a } b { ".repeat(kb * 1024 / 8));
            measure_extraction(
                &format!("mdx-unclosed-{kb}k"),
                &malformed,
                "bad.mdx",
                ExtractionExpectation::Diagnostics,
            );
        }
    }
}
