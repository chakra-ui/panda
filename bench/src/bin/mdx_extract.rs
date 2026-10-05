#![allow(
    clippy::cast_precision_loss,
    clippy::print_stdout,
    clippy::disallowed_macros,
    reason = "benchmark reports timing and allocation measurements"
)]

//! MDX extraction costs versus equivalent live TSX, including transient heap usage.
use pandacss_extractor::{ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use serde_json::json;
use std::{
    alloc::{GlobalAlloc, Layout, System},
    sync::atomic::{AtomicUsize, Ordering},
    time::Instant,
};

struct CountingAllocator;
static LIVE: AtomicUsize = AtomicUsize::new(0);
static PEAK: AtomicUsize = AtomicUsize::new(0);
static ALLOCATED: AtomicUsize = AtomicUsize::new(0);
static COUNT: AtomicUsize = AtomicUsize::new(0);
fn allocated(size: usize) {
    let live = LIVE.fetch_add(size, Ordering::Relaxed) + size;
    PEAK.fetch_max(live, Ordering::Relaxed);
    ALLOCATED.fetch_add(size, Ordering::Relaxed);
    COUNT.fetch_add(1, Ordering::Relaxed);
}
// SAFETY: every operation delegates the caller's pointer/layout unchanged to System.
unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        // SAFETY: GlobalAlloc's caller provides a valid layout.
        let pointer = unsafe { System.alloc(layout) };
        if !pointer.is_null() {
            allocated(layout.size());
        }
        pointer
    }
    unsafe fn dealloc(&self, pointer: *mut u8, layout: Layout) {
        LIVE.fetch_sub(layout.size(), Ordering::Relaxed);
        // SAFETY: the pointer and layout are the original System allocation.
        unsafe { System.dealloc(pointer, layout) };
    }
    unsafe fn realloc(&self, pointer: *mut u8, layout: Layout, size: usize) -> *mut u8 {
        // SAFETY: caller supplies the live allocation and a valid new size.
        let next = unsafe { System.realloc(pointer, layout, size) };
        if !next.is_null() {
            LIVE.fetch_sub(layout.size(), Ordering::Relaxed);
            allocated(size);
        }
        next
    }
}
#[global_allocator]
static GLOBAL: CountingAllocator = CountingAllocator;

fn config() -> ExtractorConfig {
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
fn fixtures(count: usize) -> (String, String) {
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
fn measure(name: &str, source: &str, path: &str, expected: Option<usize>) {
    let config = config();
    let first = extract(source, path, &config);
    if let Some(count) = expected {
        assert!(
            first.diagnostics.is_empty(),
            "{name}: {:?}",
            first.diagnostics
        );
        assert_eq!(first.calls.len(), count);
        assert_eq!(first.jsx.len(), count);
    }
    let calls = first.calls.len();
    let diagnostics = first.diagnostics.len();
    drop(first);
    for _ in 0..30 {
        drop(std::hint::black_box(extract(source, path, &config)));
    }
    let before = LIVE.load(Ordering::Relaxed);
    PEAK.store(before, Ordering::Relaxed);
    let bytes_before = ALLOCATED.load(Ordering::Relaxed);
    let count_before = COUNT.load(Ordering::Relaxed);
    drop(std::hint::black_box(extract(source, path, &config)));
    let peak = PEAK.load(Ordering::Relaxed).saturating_sub(before);
    let allocated_bytes = ALLOCATED.load(Ordering::Relaxed) - bytes_before;
    let allocations = COUNT.load(Ordering::Relaxed) - count_before;
    let iterations = (2_000_000 / source.len()).clamp(20, 300);
    let mut samples = Vec::with_capacity(iterations);
    let retained_before = LIVE.load(Ordering::Relaxed);
    for _ in 0..iterations {
        let start = Instant::now();
        drop(std::hint::black_box(extract(source, path, &config)));
        samples.push(start.elapsed().as_secs_f64() * 1e6);
    }
    let retained_growth = LIVE.load(Ordering::Relaxed).saturating_sub(retained_before);
    samples.sort_by(f64::total_cmp);
    println!(
        "{}",
        json!({"scenario":name, "bytes":source.len(), "iterations":iterations,
        "medianUs":samples[iterations/2], "p95Us":samples[iterations*95/100], "peakHeapBytes":peak,
        "allocatedBytes":allocated_bytes, "allocations":allocations, "retainedGrowthBytes":retained_growth,
        "calls":calls, "diagnostics":diagnostics})
    );
}
fn watch_config() -> pandacss_config::UserConfig {
    serde_json::from_value(json!({
        "outdir": "styled-system", "jsxFramework": "react",
        "importMap": { "css": ["@panda/css"], "jsx": ["@panda/jsx"] },
        "utilities": { "color": { "className": "color" }, "padding": { "className": "padding" } },
        "patterns": { "box": { "jsx": ["Box"] } }
    }))
    .expect("valid benchmark config")
}

fn measure_watch(name: &str, source: &str, path: &str) {
    let config = watch_config();
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
        std::hint::black_box(output);
    };
    for iteration in 0..100 {
        step(iteration);
    }
    let before = LIVE.load(Ordering::Relaxed);
    PEAK.store(before, Ordering::Relaxed);
    let start = Instant::now();
    for iteration in 0..1000 {
        step(iteration);
    }
    let elapsed = start.elapsed();
    let after = LIVE.load(Ordering::Relaxed);
    println!(
        "{}",
        json!({ "scenario": name, "updates": 1000,
        "usPerUpdate": elapsed.as_secs_f64() * 1e6 / 1000.0,
        "steadyHeapBytes": after, "retainedGrowthBytes": after.saturating_sub(before),
        "peakAdditionalHeapBytes": PEAK.load(Ordering::Relaxed).saturating_sub(before) })
    );
}

fn measure_builds() {
    let (mdx, tsx) = fixtures(1);
    let config = watch_config();
    let cases = [("tsx-project-200", 0), ("mixed-project-10pct-mdx", 20)];
    let paths: Vec<Vec<_>> = cases
        .iter()
        .map(|(_, mdx_files)| {
            (0..200)
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
    for _ in 0..20 {
        build(0);
        build(1);
    }
    let peaks: Vec<_> = (0..2)
        .map(|case| {
            let before = LIVE.load(Ordering::Relaxed);
            PEAK.store(before, Ordering::Relaxed);
            build(case);
            PEAK.load(Ordering::Relaxed).saturating_sub(before)
        })
        .collect();
    let mut samples = [Vec::new(), Vec::new()];
    for round in 0..100 {
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
            json!({ "scenario": name, "files": 200, "mdxFiles": mdx_files,
            "medianUs": samples[case][50], "peakHeapBytes": peaks[case], "sampling": "alternating" })
        );
    }
}

fn main() {
    if std::env::args().any(|arg| arg == "--esm-stress") {
        for lines in [20, 80, 320] {
            let source = format!(
                "{IMPORTS}export const entries = {{\n\n{}}};\n\n{JSX}\n",
                "a: 'x',\n\n".repeat(lines)
            );
            measure(
                &format!("mdx-export-{lines}"),
                &source,
                "exports.mdx",
                Some(1),
            );
        }
        return;
    }
    if std::env::args().any(|arg| arg == "--mixed") {
        measure_builds();
        return;
    }
    if std::env::args().any(|arg| arg == "--watch") {
        let (mdx, tsx) = fixtures(20);
        measure_watch("tsx-watch", &tsx, "doc.tsx");
        measure_watch("mdx-watch", &mdx, "doc.mdx");
        return;
    }
    let baseline = std::env::args().any(|arg| arg == "--baseline");
    for count in [1, 20, 200] {
        let (mdx, tsx) = fixtures(count);
        measure(&format!("tsx-{count}"), &tsx, "doc.tsx", Some(count));
        if !baseline {
            measure(&format!("mdx-{count}"), &mdx, "doc.mdx", Some(count));
        }
    }
    if !baseline {
        for count in [20, 200] {
            let source = format!("{IMPORTS}{}", "<Box color={unknown} css={unknownStyles}><span className={css({color:'blue'})} /></Box>\n\n".repeat(count));
            measure(
                &format!("mdx-dynamic-{count}"),
                &source,
                "dynamic.mdx",
                Some(count),
            );
        }
        for kb in [25, 100, 400] {
            let malformed = format!("{IMPORTS}{{{}", "a } b { ".repeat(kb * 1024 / 8));
            measure(&format!("mdx-unclosed-{kb}k"), &malformed, "bad.mdx", None);
        }
    }
}
