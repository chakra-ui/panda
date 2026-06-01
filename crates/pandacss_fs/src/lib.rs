//! Filesystem abstraction for the Panda Rust pipeline.
//!
//! Two impls ship behind cargo features:
//!
//! - `os` (default on native) — `OsFileSystem`, wraps `std::fs` + `oxc_resolver::FileSystemOs`.
//! - `memory` — `MemoryFileSystem`, an in-memory `FxHashMap`-backed FS for tests and wasm targets.
//!
//! Core Panda crates depend on the [`FileSystem`] trait only — never `std::fs` directly — so the
//! same code compiles to `wasm32-unknown-unknown` with `--no-default-features --features memory`.
//!
//! See `design-notes/filesystem.md` for the full rationale and crate evaluation.

mod file_system;
mod glob;

#[cfg(feature = "memory")]
mod memory;
#[cfg(feature = "os")]
mod os;

pub use crate::file_system::FileSystem;
pub use crate::glob::{GlobOptions, base_dir, walk_roots};

#[cfg(feature = "memory")]
pub use crate::memory::MemoryFileSystem;
#[cfg(feature = "os")]
pub use crate::os::OsFileSystem;

// Platform default: on native we default to OS; on wasm we expose memory.
// Consumers that want a specific impl should name it explicitly.
#[cfg(feature = "os")]
pub type PlatformDefault = OsFileSystem;
#[cfg(all(feature = "memory", not(feature = "os")))]
pub type PlatformDefault = MemoryFileSystem;

// Re-export the resolver FileSystem trait so consumers can satisfy generic bounds
// without a separate `oxc_resolver` import.
pub use oxc_resolver::FileSystem as OxcResolverFileSystem;
