//! `@pandacss/binding-wasm` — WebAssembly binding for the Panda Rust engine.
//!
//! Mirrors the napi binding's shape (`WasmExtractor` ↔ `Extractor`,
//! `WasmFileSystem` over `MemoryFileSystem`) but targets `wasm32-unknown-unknown`
//! for browser playgrounds. Built with `wasm-pack build --target web`.
//!
//! See `design-notes/filesystem.md` (Phase B) and `design-notes/napi-boundary.md`.

mod extract;
mod fs;
mod matcher;

pub use extract::WasmExtractor;
pub use fs::WasmFileSystem;
pub use matcher::{MatcherInput, MatchersInput, TokenDictionaryInput};

use wasm_bindgen::prelude::*;

/// Install a panic hook so Rust panics surface as readable stack traces in
/// the browser console. Idempotent — safe to call multiple times.
#[wasm_bindgen(js_name = installPanicHook)]
pub fn install_panic_hook() {
    console_error_panic_hook::set_once();
}
