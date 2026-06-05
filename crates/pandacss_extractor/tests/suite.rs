//! Single integration-test binary for pandacss_extractor.
//! Submodules keep per-area filters: `cargo nextest run -p pandacss_extractor suite::calls::`

mod common;

#[path = "suite/calls.rs"]
mod calls;
#[path = "suite/conditional_output.rs"]
mod conditional_output;
#[path = "suite/cross_file.rs"]
mod cross_file;
#[path = "suite/css_property.rs"]
mod css_property;
#[path = "suite/css_template.rs"]
mod css_template;
#[path = "suite/extract.rs"]
mod extract;
#[path = "suite/framework_svelte.rs"]
mod framework_svelte;
#[path = "suite/framework_vue.rs"]
mod framework_vue;
#[path = "suite/import_map.rs"]
mod import_map;
#[path = "suite/imports.rs"]
mod imports;
#[path = "suite/jsx.rs"]
mod jsx;
#[path = "suite/optional_chaining.rs"]
mod optional_chaining;
#[path = "suite/polish.rs"]
mod polish;
#[path = "suite/raw_spreads.rs"]
mod raw_spreads;
#[path = "suite/scope.rs"]
mod scope;
#[path = "suite/source.rs"]
mod source;
#[path = "suite/tagged_templates.rs"]
mod tagged_templates;
#[path = "suite/token_calls.rs"]
mod token_calls;
