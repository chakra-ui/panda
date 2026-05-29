#![allow(
    clippy::cast_precision_loss,
    clippy::disallowed_macros,
    clippy::print_stdout,
    reason = "benchmark binary intentionally prints JSON timing output"
)]

//! End-to-end pipeline bench against the real sandbox/vite-ts files.
//!
//! Two scenarios:
//!   1. Cold start — every iteration rebuilds `Project::from_config` and
//!      re-parses every file. Mirrors a full CLI build.
//!   2. Re-parse — project + parsed state preserved across iterations, only
//!      one file is re-parsed each round. Mirrors watch mode HMR.
//!
//! The config is hand-rolled to mirror the *shape* of the TS config
//! (semantic tokens, recipes, conditions, patterns). Exact values aren't
//! load-bearing for hot-path discovery.

use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use pandacss_config::UserConfig;
use pandacss_extractor::{
    ExtractorConfig, JsxExtractionConfig, JsxStyleProps, Matcher, Matchers, NameMatcher, extract,
};
use pandacss_project::Project;
use pandacss_stylesheet::{StylesheetInput, StylesheetOptions};
use pandacss_tracing::SpanTimings;
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::json;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

fn main() {
    let sandbox = sandbox_dir();
    let base = load_sources(&sandbox.join("src"));
    let multiplier = parse_usize_arg("--multiplier", 20);
    let unique = parse_flag("--unique");
    let sources = if unique {
        synthesize_unique(&base, multiplier)
    } else {
        amplify(&base, multiplier)
    };
    let warm = parse_usize_arg("--warm", 3);
    let iterations = parse_usize_arg("--iterations", 20);

    let config: UserConfig = serde_json::from_str(CONFIG_JSON).expect("config deserializes");
    let extractor_config = extractor_config_matching(&config);

    // Install a span-timings layer so we get exact per-phase nanos from the
    // production trace spans (extraction, oxc_parse, encoding, recipe_resolution, …).
    let timings = SpanTimings::new();
    tracing_subscriber::registry()
        .with(timings.layer())
        .try_init()
        .expect("install subscriber");

    // Warm up first so JITs / branch predictors aren't measured during sampling.
    for _ in 0..warm {
        let _ = run_cold(&config, &sources);
    }
    timings.clear();

    let mut cold = PhaseSamples::default();
    for _ in 0..iterations {
        cold.record(&run_cold(&config, &sources));
    }
    let cold_spans = timings.snapshot();
    timings.clear();

    let mut watch = WatchSamples::default();
    for _ in 0..iterations {
        watch.record(&run_watch(&config, &sources));
    }
    let watch_spans = timings.snapshot();
    timings.clear();

    let mut extract_only = ExtractOnlySamples::default();
    for _ in 0..iterations {
        extract_only.record(&run_extract_only(&extractor_config, &sources));
    }
    let extract_spans = timings.snapshot();

    println!(
        "{}",
        json!({
            "scenario": "sandbox-vite-ts",
            "sourceFiles": sources.len(),
            "totalBytes": sources.iter().map(|(_, s)| s.len()).sum::<usize>(),
            "uniqueContent": unique,
            "iterations": iterations,
            "cold": {
                "totalMs":              phase_block(&cold.total, iterations),
                "projectFromConfig":    phase_block(&cold.from_config, iterations),
                "parseFilesTotal":      phase_block(&cold.parse_files, iterations),
                "snapshots":            phase_block(&cold.snapshots, iterations),
                "compile":              phase_block(&cold.compile, iterations),
                "atomsCount":           cold.atoms_count_last,
                "cssBytes":             cold.css_len_last,
            },
            "watch": {
                "totalMs":              phase_block(&watch.total, iterations),
                "reparseOneFile":       phase_block(&watch.reparse, iterations),
                "snapshots":            phase_block(&watch.snapshots, iterations),
                "compile":              phase_block(&watch.compile, iterations),
            },
            "extractOnly": {
                "totalMs":              phase_block(&extract_only.total, iterations),
                "extractCalls":         extract_only.extract_calls_last,
                "extractJsx":           extract_only.jsx_last,
                "extractDiagnostics":   extract_only.diagnostics_last
            },
            "spans": {
                "cold":        spans_to_json(&cold_spans, iterations),
                "watch":       spans_to_json(&watch_spans, iterations),
                "extractOnly": spans_to_json(&extract_spans, iterations),
            }
        })
    );
}

fn spans_to_json(snap: &[pandacss_tracing::SpanStat], iterations: usize) -> serde_json::Value {
    let it = iterations.max(1) as f64;
    json!(
        snap.iter()
            .map(|s| json!({
                "name": s.name,
                "totalMs": s.total_ms(),
                "perRunMs": s.total_ms() / it,
                "count": s.count,
                "perRunCount": s.count as f64 / it,
            }))
            .collect::<Vec<_>>()
    )
}

#[derive(Default)]
struct PhaseSamples {
    total: Duration,
    from_config: Duration,
    parse_files: Duration,
    snapshots: Duration,
    compile: Duration,
    atoms_count_last: usize,
    css_len_last: usize,
}

impl PhaseSamples {
    fn record(&mut self, r: &ColdRun) {
        self.total += r.total;
        self.from_config += r.from_config;
        self.parse_files += r.parse_files;
        self.snapshots += r.snapshots;
        self.compile += r.compile;
        self.atoms_count_last = r.atoms_count;
        self.css_len_last = r.css_len;
    }
}

#[derive(Default)]
struct WatchSamples {
    total: Duration,
    reparse: Duration,
    snapshots: Duration,
    compile: Duration,
}

impl WatchSamples {
    fn record(&mut self, r: &WatchRun) {
        self.total += r.total;
        self.reparse += r.reparse;
        self.snapshots += r.snapshots;
        self.compile += r.compile;
    }
}

struct ColdRun {
    total: Duration,
    from_config: Duration,
    parse_files: Duration,
    snapshots: Duration,
    compile: Duration,
    atoms_count: usize,
    css_len: usize,
}

struct WatchRun {
    total: Duration,
    reparse: Duration,
    snapshots: Duration,
    compile: Duration,
}

#[derive(Default)]
struct ExtractOnlySamples {
    total: Duration,
    extract_calls_last: usize,
    jsx_last: usize,
    diagnostics_last: usize,
}

impl ExtractOnlySamples {
    fn record(&mut self, r: &ExtractOnlyRun) {
        self.total += r.total;
        self.extract_calls_last = r.extract_calls;
        self.jsx_last = r.jsx;
        self.diagnostics_last = r.diagnostics;
    }
}

struct ExtractOnlyRun {
    total: Duration,
    extract_calls: usize,
    jsx: usize,
    diagnostics: usize,
}

fn run_extract_only(config: &ExtractorConfig, sources: &[(PathBuf, String)]) -> ExtractOnlyRun {
    let mut extract_calls = 0usize;
    let mut jsx = 0usize;
    let mut diagnostics = 0usize;
    let t0 = Instant::now();
    for (path, source) in sources {
        let result = extract(source, path.to_str().expect("utf8"), config);
        extract_calls = extract_calls.wrapping_add(result.calls.len());
        jsx = jsx.wrapping_add(result.jsx.len());
        diagnostics = diagnostics.wrapping_add(result.diagnostics.len());
    }
    ExtractOnlyRun {
        total: t0.elapsed(),
        extract_calls,
        jsx,
        diagnostics,
    }
}

fn run_cold(config: &UserConfig, sources: &[(PathBuf, String)]) -> ColdRun {
    let total_start = Instant::now();

    let t0 = Instant::now();
    let system = pandacss_project::System::new(config.clone()).expect("system");
    let mut project = Project::new(system);
    let from_config = t0.elapsed();

    let t0 = Instant::now();
    for (path, source) in sources {
        project.parse_file(path.to_str().expect("utf8"), source);
    }
    let parse_files = t0.elapsed();

    let atoms_count = project.atoms().len();
    let token_dictionary = project.config().token_dictionary();

    let t0 = Instant::now();
    let snapshots = project.stylesheet_snapshots(config);
    let snapshots_t = t0.elapsed();

    let t0 = Instant::now();
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            token_dictionary,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &[],
        },
        &StylesheetOptions {
            minify: false,
            include_static: true,
            source_map: false,
        },
    );
    let compile = t0.elapsed();

    ColdRun {
        total: total_start.elapsed(),
        from_config,
        parse_files,
        snapshots: snapshots_t,
        compile,
        atoms_count,
        css_len: output.css.len(),
    }
}

fn run_watch(config: &UserConfig, sources: &[(PathBuf, String)]) -> WatchRun {
    // Set up a steady-state project once per watch run.
    let system = pandacss_project::System::new(config.clone()).expect("system");
    let mut project = Project::new(system);
    for (path, source) in sources {
        project.parse_file(path.to_str().expect("utf8"), source);
    }

    // Pick the largest file to re-parse and mutate it slightly so the
    // source-hash cache misses — otherwise we'd be measuring a no-op.
    let target = sources
        .iter()
        .max_by_key(|(_, src)| src.len())
        .expect("at least one source");
    let mutated = format!("{}\n// touch\n", target.1);

    let total_start = Instant::now();

    let t0 = Instant::now();
    project.parse_file(target.0.to_str().expect("utf8"), &mutated);
    let reparse = t0.elapsed();

    let token_dictionary = project.config().token_dictionary();
    let t0 = Instant::now();
    let snapshots = project.stylesheet_snapshots(config);
    let snapshots_t = t0.elapsed();

    let t0 = Instant::now();
    let _ = pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            token_dictionary,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &[],
        },
        &StylesheetOptions {
            minify: false,
            include_static: true,
            source_map: false,
        },
    );
    let compile = t0.elapsed();

    WatchRun {
        total: total_start.elapsed(),
        reparse,
        snapshots: snapshots_t,
        compile,
    }
}

fn phase_block(d: &Duration, iterations: usize) -> serde_json::Value {
    let total_ms = ms(*d);
    let per_run_ms = if iterations == 0 {
        0.0
    } else {
        total_ms / iterations as f64
    };
    json!({ "totalMs": total_ms, "perRunMs": per_run_ms })
}

fn ms(d: Duration) -> f64 {
    d.as_secs_f64() * 1000.0
}

fn parse_flag(flag: &str) -> bool {
    env::args().any(|a| a == flag)
}

fn parse_usize_arg(flag: &str, default: usize) -> usize {
    let mut it = env::args().skip(1);
    while let Some(arg) = it.next() {
        if arg == flag
            && let Some(value) = it.next()
            && let Ok(parsed) = value.parse()
        {
            return parsed;
        }
    }
    default
}

fn sandbox_dir() -> PathBuf {
    let manifest = env!("CARGO_MANIFEST_DIR");
    Path::new(manifest)
        .parent()
        .expect("workspace root")
        .join("sandbox/vite-ts")
}

/// Make each amplified copy slightly different so atom dedup doesn't collapse
/// everything to the base set — exercises the encoder + atom-merge hot paths.
fn synthesize_unique(base: &[(PathBuf, String)], multiplier: usize) -> Vec<(PathBuf, String)> {
    let mut out = Vec::with_capacity(base.len() * multiplier.max(1));
    for i in 0..multiplier.max(1) {
        for (path, source) in base {
            let stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("source");
            let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("tsx");
            let new_path = path.with_file_name(format!("{stem}_{i}.{ext}"));
            // Append a unique css() call so each file emits at least one new atom.
            let unique = format!(
                "\n// uniquify\nimport {{ css as __css_{i} }} from '../styled-system/css';\n\
                 __css_{i}({{ color: '{color}', padding: '{pad}' }});\n",
                color = match i % 4 {
                    0 => "red.300",
                    1 => "blue.500",
                    2 => "green.100",
                    _ => "yellow.300",
                },
                pad = match i % 3 {
                    0 => "2",
                    1 => "4",
                    _ => "5",
                },
            );
            out.push((new_path, format!("{source}{unique}")));
        }
    }
    out
}

fn amplify(base: &[(PathBuf, String)], multiplier: usize) -> Vec<(PathBuf, String)> {
    if multiplier <= 1 {
        return base.to_vec();
    }
    let mut out = Vec::with_capacity(base.len() * multiplier);
    for i in 0..multiplier {
        for (path, source) in base {
            let stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("source");
            let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("tsx");
            let new_path = path.with_file_name(format!("{stem}_{i}.{ext}"));
            out.push((new_path, source.clone()));
        }
    }
    out
}

fn load_sources(src_dir: &Path) -> Vec<(PathBuf, String)> {
    let mut entries: Vec<PathBuf> = fs::read_dir(src_dir)
        .expect("read sandbox src/")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| {
            p.extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| matches!(ext, "tsx" | "ts"))
        })
        .collect();
    entries.sort();
    entries
        .into_iter()
        .map(|path| {
            let source = fs::read_to_string(&path).expect("read source");
            (path, source)
        })
        .collect()
}

/// Build an `ExtractorConfig` whose matchers line up with the `UserConfig` so the
/// extract-only timing reflects what `Project::parse_file` actually runs.
fn extractor_config_matching(_config: &UserConfig) -> ExtractorConfig {
    let component_names = [
        "Button", "Card", "Stack", "Grid", "Circle", "HStack", "VStack", "Badge",
    ]
    .into_iter()
    .map(str::to_owned)
    .collect::<FxHashSet<_>>();
    let valid_style_props = [
        "color",
        "bg",
        "background",
        "padding",
        "margin",
        "marginBottom",
        "marginTop",
        "marginX",
        "paddingX",
        "paddingY",
        "display",
        "gap",
        "css",
        "fontSize",
        "fontWeight",
        "borderRadius",
        "letterSpacing",
        "width",
        "height",
        "alignItems",
        "justifyContent",
        "alignSelf",
        "borderWidth",
        "textAlign",
        "flexGrow",
        "lineHeight",
        "maxWidth",
        "animation",
        "animationName",
        "fontFamily",
    ]
    .into_iter()
    .map(str::to_owned)
    .collect();

    ExtractorConfig::new(Matchers {
        css: Matcher {
            modules: vec!["../styled-system/css".to_owned()],
            names: NameMatcher::only(["css", "cva", "sva", "cx"]),
        },
        recipe: Matcher {
            modules: vec!["../styled-system/recipes".to_owned()],
            names: NameMatcher::Any,
        },
        pattern: Matcher {
            modules: vec!["../styled-system/patterns".to_owned()],
            names: NameMatcher::Any,
        },
        jsx: Some(Matcher {
            modules: vec!["../styled-system/jsx".to_owned()],
            names: NameMatcher::only([
                "panda", "styled", "Box", "Stack", "Grid", "Circle", "HStack", "VStack",
            ]),
        }),
        tokens: Matcher {
            modules: vec!["../styled-system/tokens".to_owned()],
            names: NameMatcher::only(["token"]),
        },
        jsx_factories: None,
    })
    .with_jsx(JsxExtractionConfig {
        style_props: JsxStyleProps::All,
        component_names,
        component_regexes: Vec::new(),
        component_regex_set: None,
        component_props: FxHashMap::default(),
        component_regex_props: Vec::new(),
        component_regex_prop_set: None,
        component_strict: FxHashSet::default(),
        component_regex_strict: Vec::new(),
        component_regex_strict_set: None,
        component_blocklist: FxHashMap::default(),
        component_regex_blocklist: Vec::new(),
        component_regex_blocklist_set: None,
        valid_style_props,
    })
}

/// Hand-rolled JSON config mirroring the *shape* of `sandbox/vite-ts/panda.config.ts`.
/// Exact token values aren't load-bearing for hot-path discovery — we just need:
/// - a real semantic-token surface (so `tokens` layer + reference expansion fires),
/// - a real recipe with variants + compoundVariants,
/// - conditions including `_hover` / `_dark` / `_active`,
/// - patterns matching what the .tsx files import.
const CONFIG_JSON: &str = r##"{
  "outdir": "styled-system",
  "include": ["./src/**/*.{tsx,jsx}"],
  "exclude": [],
  "jsxFactory": "panda",
  "importMap": {
    "css":     ["../styled-system/css"],
    "recipe":  ["../styled-system/recipes"],
    "pattern": ["../styled-system/patterns"],
    "jsx":     ["../styled-system/jsx"],
    "tokens":  ["../styled-system/tokens"]
  },
  "conditions": {
    "hover":  "&:is(:hover, [data-hover])",
    "active": "&:is(:active, [data-active])",
    "focus":  "&:is(:focus, [data-focus])",
    "dark":   ".dark &",
    "osDark": "@media (prefers-color-scheme: dark)"
  },
  "theme": {
    "breakpoints": {
      "sm": "40rem",
      "md": "48rem",
      "lg": "64rem",
      "xl": "80rem"
    },
    "tokens": {
      "colors": {
        "white":  { "value": "#ffffff" },
        "black":  { "value": "#000000" },
        "red":    { "50": {"value":"#fef2f2"}, "100": {"value":"#fee2e2"}, "200": {"value":"#fecaca"}, "300": {"value":"#fca5a5"}, "400": {"value":"#f87171"}, "500": {"value":"#ef4444"}, "800": {"value":"#991b1b"} },
        "blue":   { "300": {"value":"#93c5fd"}, "500": {"value":"#3b82f6"} },
        "green":  { "100": {"value":"#dcfce7"}, "500": {"value":"#22c55e"} },
        "yellow": { "300": {"value":"#fde047"}, "500": {"value":"#eab308"} },
        "gray":   { "200": {"value":"#e5e7eb"}, "400": {"value":"#9ca3af"}, "500": {"value":"#6b7280"}, "600": {"value":"#4b5563"} },
        "pink":   { "300": {"value":"#f9a8d4"}, "400": {"value":"#f472b6"}, "800": {"value":"#9d174d"} },
        "amber":  { "300": {"value":"#fcd34d"} },
        "purple": { "500": {"value":"#a855f7"} },
        "teal":   { "500": {"value":"#14b8a6"} },
        "lime":   { "300": {"value":"#bef264"} }
      },
      "fontSizes": {
        "xs": {"value":"0.75rem"}, "sm": {"value":"0.875rem"}, "lg": {"value":"1.125rem"},
        "xl": {"value":"1.25rem"}, "2xl": {"value":"1.5rem"}, "4xl": {"value":"2.25rem"}
      },
      "spacing": {
        "2": {"value":"0.5rem"}, "3": {"value":"0.75rem"}, "4": {"value":"1rem"},
        "5": {"value":"1.25rem"}, "6": {"value":"1.5rem"}, "10": {"value":"2.5rem"}, "12": {"value":"3rem"}
      },
      "radii":       { "sm": {"value":"0.125rem"}, "md": {"value":"0.375rem"} },
      "fontWeights": { "medium": {"value":"500"}, "semibold": {"value":"600"}, "bold": {"value":"700"} },
      "letterSpacings": { "wide": {"value":"0.025em"} }
    },
    "semanticTokens": {
      "colors": {
        "text": { "value": { "base": "{colors.gray.600}", "_osDark": "{colors.gray.400}" } }
      }
    },
    "recipes": {
      "button": {
        "className": "button",
        "jsx": ["Button", "ListedButton", "PrimaryButtonLike"],
        "base":      { "fontSize": "lg" },
        "variants": {
          "size":    { "sm": {"padding":"2","borderRadius":"sm"}, "md": {"padding":"4","borderRadius":"md"} },
          "variant": {
            "primary":   {"color":"white","backgroundColor":"blue.500"},
            "danger":    {"color":"white","backgroundColor":"red.500"},
            "secondary": {"color":"pink.300","backgroundColor":"green.500"},
            "purple":    {"color":"amber.300","backgroundColor":"purple.500"}
          },
          "state":   { "focused": {"color":"green"}, "hovered": {"color":"pink.400"} }
        },
        "compoundVariants": [
          {"size":"sm","variant":"primary","css":{"fontSize":"12px"}},
          {"variant":["primary","danger"],"state":"focused","css":{"padding":4,"fontWeight":"bold","fontSize":"24px"}}
        ]
      }
    }
  },
  "globalCss": {
    "*": { "fontFamily": "Inter", "margin": "0" },
    "a": { "color": "inherit", "textDecoration": "none" }
  },
  "staticCss": {
    "css": [ { "properties": { "color": ["red.500", "blue.500"] } } ]
  },
  "patterns": {
    "stack":  { "jsxName": "Stack" },
    "vstack": { "jsxName": "VStack" },
    "hstack": { "jsxName": "HStack" },
    "circle": { "jsxName": "Circle" }
  },
  "utilities": {
    "color":           {"className":"text","values":"colors"},
    "backgroundColor": {"className":"bg","values":"colors","shorthand":"bg"},
    "padding":         {"className":"p","values":"spacing","shorthand":"p"},
    "margin":          {"className":"m","values":"spacing","shorthand":"m"},
    "marginBottom":    {"className":"mb","values":"spacing","shorthand":"mb"},
    "marginTop":       {"className":"mt","values":"spacing","shorthand":"mt"},
    "marginX":         {"className":"mx","values":"spacing","shorthand":"mx"},
    "paddingX":        {"className":"px","values":"spacing","shorthand":"px"},
    "paddingY":        {"className":"py","values":"spacing","shorthand":"py"},
    "fontSize":        {"className":"fs","values":"fontSizes"},
    "fontWeight":      {"className":"fw","values":"fontWeights"},
    "borderRadius":    {"className":"rd","values":"radii"},
    "letterSpacing":   {"className":"ls","values":"letterSpacings"},
    "width":           {"className":"w","values":"sizes"},
    "height":          {"className":"h","values":"sizes"},
    "gap":             {"className":"g","values":"spacing"},
    "display":         {"className":"d"},
    "background":      {"className":"bg-color","values":"colors","shorthand":"background"},
    "borderWidth":     {"className":"border-w"},
    "textAlign":       {"className":"ta"},
    "flexGrow":        {"className":"fg"},
    "alignSelf":       {"className":"as"},
    "alignItems":      {"className":"ai"},
    "justifyContent":  {"className":"jc"},
    "translate":       {"className":"translate"},
    "lineHeight":      {"className":"lh"},
    "maxWidth":        {"className":"maxw"},
    "animation":       {"className":"anim"},
    "animationName":   {"className":"anim-name"},
    "fontFamily":      {"className":"ff"}
  }
}"##;
